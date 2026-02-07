// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {TrustLockCampaignManager} from "./TrustLockCampaignManager.sol";
import {TrustLockVoting} from "./TrustLockVoting.sol";
import {TrustLockTreasury} from "./TrustLockTreasury.sol";
import {EnsReverseCheck} from "./interfaces/ens/EnsReverseCheck.sol";

/**
 * @title TrustLockCore
 * @notice Main orchestrator contract for the TrustLock crowdfunding protocol
 * @dev Manages and coordinates the three specialized contracts
 * @dev Provides a single entry point for all TrustLock functionality
 */
contract TrustLockCore is Pausable, Ownable {

    // ============ STATE VARIABLES ============
    
    address public protocolFeeRecipient;
    bool public ensRequired = false;
    
    // Contract instances
    TrustLockCampaignManager public campaignManager;
    TrustLockVoting public voting;
    TrustLockTreasury public treasury;
    
    // Accepted tokens for contributions
    mapping(address => bool) public acceptedTokens;
    address[] public acceptedTokensList;
    
    // ============ ERRORS ============
    
    error InvalidAddress();
    error DeploymentFailed();
    error TokenNotAccepted();
    error TokenAlreadyAccepted();
    error MustSendETH();
    error AmountMustBeZeroForETH();
    error DoNotSendETHForTokenCampaigns();
    error MustSpecifyTokenAmount();
    error ENSRequired();

    // ============ EVENTS ============
    
    event ContractsDeployed(
        address indexed campaignManager,
        address indexed voting,
        address indexed treasury
    );  

    event ProtocolFeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );

    event TokenAdded(
        address indexed token,
        address indexed addedBy
    );

    event TokenRemoved( address indexed token );


    // ============ CONSTRUCTOR ============
    
    constructor(address _protocolFeeRecipient) Ownable(msg.sender) {
        if (_protocolFeeRecipient == address(0)) revert InvalidAddress();
        protocolFeeRecipient = _protocolFeeRecipient;
        
        _deployContracts();
    }

    // ============ ADMIN MANAGEMENT ============

    /**
     * @notice Update protocol fee recipient
     * @param _newRecipient New fee recipient address
     */
    function updateProtocolFeeRecipient(address _newRecipient) external onlyOwner {
        if (_newRecipient == address(0)) revert InvalidAddress();
        address oldRecipient = protocolFeeRecipient;
        protocolFeeRecipient = _newRecipient;
        treasury.updateProtocolFeeRecipient(_newRecipient);
        emit ProtocolFeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    /**
     * @notice Enable/disable ENS requirement for campaign creation on default we set
     * it to false for easy testing
     * @param _ensRequired Whether ENS should be required
     */
    function setEnsRequired(bool _ensRequired) external onlyOwner {
        ensRequired = _ensRequired;
    }

    /**
     * @notice Pause all contracts
     */
    function pauseAll() external onlyOwner {
        _pause();
        campaignManager.pause();
        voting.pause();
        treasury.pause();
    }

    /**
     * @notice Unpause all contracts
     */
    function unpauseAll() external onlyOwner {
        _unpause();
        campaignManager.unpause();
        voting.unpause();
        treasury.unpause();
    }

    // ============ TOKEN MANAGEMENT ============
    
    /**
     * @notice Add a token to the list of accepted tokens
     * @param _token Token address to add
     * @dev Only callable by owner
     */
    function addAcceptedToken(address _token) external onlyOwner {
        if (_token == address(0)) revert InvalidAddress();
        if (acceptedTokens[_token]) revert TokenAlreadyAccepted();
        
        acceptedTokens[_token] = true;
        acceptedTokensList.push(_token);
        
        emit TokenAdded(_token, msg.sender);
    }

    /**
     * @notice Remove a token from the list of accepted tokens
     * @param _token Token address to remove
     * @dev Only callable by owner
     */
    function removeAcceptedToken(address _token) external onlyOwner {
        if (_token == address(0)) revert InvalidAddress();
        if (!acceptedTokens[_token]) revert TokenNotAccepted();
        
        acceptedTokens[_token] = false;
        
        // Remove from array
        for (uint256 i = 0; i < acceptedTokensList.length; i++) {
            if (acceptedTokensList[i] == _token) {
                acceptedTokensList[i] = acceptedTokensList[acceptedTokensList.length - 1];
                acceptedTokensList.pop();
                break;
            }
        }
        
        emit TokenRemoved(_token);
    }

    // ============ CAMPAIGN FUNCTIONS ============
    
    /**
     * @notice Create a new crowdfunding campaign
     * @param _title Campaign title
     * @param _description Detailed description
     * @param _fundingGoal Target amount to raise
     * @param _projectDuration Time to complete all milestones
     * @param _acceptsEth Whether to accept ETH or ERC20
     * @param _acceptedToken Token address (if not accepting ETH)
     * @return campaignId The ID of the newly created campaign
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _projectDuration,
        bool _acceptsEth,
        address _acceptedToken
    ) external whenNotPaused returns (uint256) {
        if (ensRequired) {
            (bool hasEns, ) = EnsReverseCheck.safeReverseName(msg.sender);
            if (!hasEns) revert ENSRequired();
        }
        
        return campaignManager.createCampaign(
            _title,
            _description,
            _fundingGoal,
            _projectDuration,
            _acceptsEth,
            _acceptedToken,
            msg.sender
        );
    }

    /**
     * @notice Contribute to a campaign
     * @param _campaignId The campaign to contribute to
     * @param _amount Amount to contribute (for ERC20)
     */
    function contribute(uint256 _campaignId, uint256 _amount) 
        external 
        payable 
        whenNotPaused 
    {
        TrustLockCampaignManager.Campaign memory campaign;
        (campaign) = campaignManager.getCampaign(_campaignId);
        
        if (campaign.acceptsEth) {
            if (msg.value == 0) revert MustSendETH();
            if (_amount != 0) revert AmountMustBeZeroForETH();

            // sends ETH to treasury
            (bool success, ) = address(treasury).call{value: msg.value}("");
            require(success, "ETH transfer to treasury failed");

            campaignManager.recordContribution(_campaignId, msg.sender, msg.value);
        } 
        else {
            if (msg.value > 0) revert DoNotSendETHForTokenCampaigns();
            if (_amount == 0) revert MustSpecifyTokenAmount();
            if (!acceptedTokens[campaign.acceptedToken]) revert TokenNotAccepted();
            
            // transfers tokens to treasury
            treasury.handleTokenContribution(_campaignId, msg.sender, _amount);
            campaignManager.recordContribution(_campaignId, msg.sender, _amount);
        }
    }

    // ============ MILESTONE FUNCTIONS ============
    
    /**
     * @notice Create a milestone for contributors to vote on
     * @param _campaignId The campaign ID
     * @param _description What was accomplished
     * @param _fundingPercentage Percentage of total funds to release (5-25%)
     */
    function createMilestone(
        address _creator,
        uint256 _campaignId,
        string memory _description,
        uint256 _fundingPercentage
    ) external whenNotPaused {
        if (msg.sender != _creator) revert TrustLockVoting.NotCampaignCreator();
        
        voting.createMilestone(_creator, _campaignId, _description, _fundingPercentage);
    }

    /**
     * @notice Vote on a milestone
     * @param _campaignId The campaign ID
     * @param _milestoneId The milestone ID
     * @param _support True to approve, false to reject
     */
    function vote(
        uint256 _campaignId,
        uint256 _milestoneId,
        bool _support
    ) external whenNotPaused {
        voting.vote(msg.sender, _campaignId, _milestoneId, _support);
    }

    /**
     * @notice Finalize a milestone vote after voting period ends
     * @param _campaignId The campaign ID
     * @param _milestoneId The milestone ID
     */
    function finalizeMilestone(uint256 _campaignId, uint256 _milestoneId) external whenNotPaused {
        voting.finalizeMilestone(_campaignId, _milestoneId);
    }

    // ============ REFUND FUNCTIONS ============
    
    /**
     * @notice Claim refund if campaign failed or funding deadline passed
     * @param _campaignId The campaign ID
     */
    function claimRefund(uint256 _campaignId) external whenNotPaused {
        treasury.claimRefund(_campaignId, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============
    
    function getCampaign(uint256 _campaignId) 
        external 
        view 
        returns (TrustLockCampaignManager.Campaign memory campaign) 
    {
        return campaignManager.getCampaign(_campaignId);
    }

    function getMilestone(uint256 _campaignId, uint256 _milestoneId) 
        external 
        view 
        returns (TrustLockVoting.Milestone memory) 
    {
        return voting.getMilestone(_campaignId, _milestoneId);
    }

    function getContributors(uint256 _campaignId) 
        external 
        view 
        returns (address[] memory) 
    {
        return campaignManager.getContributors(_campaignId);
    }

    function getContribution(uint256 _campaignId, address _contributor) 
        external 
        view 
        returns (uint256) 
    {
        return campaignManager.getContribution(_campaignId, _contributor);
    }

    function hasContributedToCampaign(uint256 _campaignId, address _contributor) 
        external 
        view 
        returns (bool) 
    {
        return campaignManager.hasContributedToCampaign(_campaignId, _contributor);
    }

    function hasVotedOnMilestone(uint256 _campaignId, uint256 _milestoneId, address _voter) 
        external 
        view 
        returns (bool) 
    {
        return voting.hasVotedOnMilestone(_campaignId, _milestoneId, _voter);
    }

    function getVotingResults(uint256 _campaignId, uint256 _milestoneId) 
        external 
        view 
        returns (uint256 votesFor, uint256 votesAgainst, uint256 totalVotes, bool approved) 
    {
        return voting.getVotingResults(_campaignId, _milestoneId);
    }

    function getRefundAmount(uint256 _campaignId, address _contributor) 
        external 
        view 
        returns (uint256) 
    {
        return treasury.getRefundAmount(_campaignId, _contributor);
    }

    function hasRefundClaimed(uint256 _campaignId, address _contributor) 
        external 
        view 
        returns (bool) 
    {
        return treasury.hasRefundClaimed(_campaignId, _contributor);
    }

    // ============ GETTERS FUNCTIONS ============

    /**
     * @notice Check if a token is accepted
     * @param _token Token address to check
     * @return isAccepted True if token is accepted
     */
    function isTokenAccepted(address _token) external view returns (bool) {
        return acceptedTokens[_token];
    }

    /**
     * @notice Get all accepted tokens
     * @return tokens Array of accepted token addresses
     */
    function getAcceptedTokens() external view returns (address[] memory) {
        return acceptedTokensList;
    }
    
    /**
     * @notice Get contract addresses
     * @return manager Campaign manager address
     * @return votingContract Voting contract address
     * @return treasuryContract Treasury contract address
     */
    function getContractAddresses() external view returns (address manager, address votingContract, address treasuryContract) {
        return (address(campaignManager), address(voting), address(treasury));
    }

    /**
     * @notice Get protocol statistics
     * @return totalCampaigns Total number of campaigns created
     * @return totalProtocolFees Total protocol fees collected
     */
    function getProtocolStats() external view returns (uint256 totalCampaigns, uint256 totalProtocolFees) {
        totalCampaigns = campaignManager.campaignCounter();
        totalProtocolFees = treasury.totalProtocolFees();
    }

    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Deploy three specialized contracts with clean architecture
     * @dev Uses initialize pattern to avoid circular dependencies
     */
    function _deployContracts() internal {
        campaignManager = new TrustLockCampaignManager(address(this));
        if (address(campaignManager) == address(0)) revert DeploymentFailed();
        
        voting = new TrustLockVoting(address(campaignManager));
        if (address(voting) == address(0)) revert DeploymentFailed();
        
        treasury = new TrustLockTreasury(
            address(campaignManager), 
            address(voting), 
            address(this),
            protocolFeeRecipient
        );
        if (address(treasury) == address(0)) revert DeploymentFailed();
        
        // Initialize contracts with their dependencies
        campaignManager.initialize(address(voting), address(treasury));
        voting.initialize(address(treasury));
        
        emit ContractsDeployed(address(campaignManager), address(voting), address(treasury));
    }

    // ============ RECEIVE FUNCTION ============
    
    receive() external payable {
        revert("Use contribute function");
    }
}
