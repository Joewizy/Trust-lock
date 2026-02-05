// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITrustLockCore} from "./interfaces/ITrustLockCore.sol";

/**
 * @title TrustLockCampaignManager
 * @notice Manages campaign creation, contributions, and basic state
 * @dev Focused solely on campaign lifecycle management
 */
contract TrustLockCampaignManager is Ownable, Pausable, ReentrancyGuard {
    
    enum CampaignState {
        FUNDING,  // Accepting contributions
        ACTIVE,   // Funding goal reached, can create milestones
        VOTING,   // Active vote on milestone
        COMPLETED, // All milestones completed
        FAILED    // Failed to meet requirements
    }

    struct Campaign {
        address creator;
        address acceptedToken;     
        uint256 fundingGoal;       
        uint256 totalRaised;       
        uint64 fundingDeadline;    
        uint64 projectDuration;    
        uint64 createdAt;          
        uint256 releasedFunds;     
        uint32 milestoneCount;     
        uint32 consecutiveFailedMilestones;  
        uint32 totalFailedMilestones;        
        CampaignState state;       
        bool acceptsEth;           
    }

    // ============ STATE VARIABLES ============

    address public votingContract;
    address public treasuryContract;
    address public coreContract;
    
    // Constants
    uint256 private constant BASIS_POINT = 10_000;
    uint256 private constant MINIMUM_CONTRIBUTION = 0.001 ether;
    uint256 private constant MAX_CONTRIBUTION_PERCENTAGE = 200; 
    uint256 private constant FUNDING_DURATION = 4 weeks;
    uint256 private constant PROJECT_MAX_DURATION = 52 weeks; 
    
    // Protocol state
    uint256 public campaignCounter;
    
    // Campaign mappings
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => string) public campaignTitles;
    mapping(uint256 => string) public campaignDescriptions;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => address[]) public contributors;
    mapping(uint256 => mapping(address => bool)) public hasContributed;

    // ============ ERRORS ============
    
    error FundingGoalTooLow();
    error ProjectDurationTooLong();
    error MaxContributionExceeded(uint256 maxAllowed, uint256 attempted);
    error TokenNotAccepted();
    error InvalidCampaignState();
    error CanOnlyContributeInFundingState();
    error FundingPeriodEnded();
    error FundingPeriodNotEnded();
    error ContributionTooLow();
    error CreatorCannotContribute();
    error FundingGoalExceeded(uint256 amountNeeded);
    error InvalidAddress();
    error UnauthorizedContract();
    error CampaignNotFound();

    // ============ EVENTS ============
    
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 fundingGoal,
        bool acceptsEth
    );

    event ContributionReceived(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount,
        bool isEth
    );

    event CampaignFunded(
        uint256 indexed campaignId,
        uint256 totalRaised,
        uint256 timestamp
    );

    event CampaignStateChanged(
        uint256 indexed campaignId,
        CampaignState oldState,
        CampaignState newState
    );

    event CampaignMarkedAsFailed(
        uint256 indexed campaignId,
        string reason
    );

    // ============ MODIFIERS ============
    
    modifier onlyAuthorizedContracts() {
        if (msg.sender != votingContract && msg.sender != treasuryContract && msg.sender != owner()) {
            revert UnauthorizedContract();
        }
        _;
    }
    
    modifier campaignExists(uint256 _campaignId) {
        if (_campaignId == 0 || _campaignId > campaignCounter) revert CampaignNotFound();
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor(address _votingContract, address _treasuryContract, address _coreContract) Ownable(msg.sender) {
        if (_votingContract == address(0) || _treasuryContract == address(0) || _coreContract == address(0)) {
            revert InvalidAddress();
        }
        votingContract = _votingContract;
        treasuryContract = _treasuryContract;
        coreContract = _coreContract;
    }

    // ============ OWNER MANAGEMENT ============
    
    function updateVotingContract(address _newVoting) external onlyOwner {
        if (_newVoting == address(0)) revert InvalidAddress();
        votingContract = _newVoting;
    }

    function updateTreasuryContract(address _newTreasury) external onlyOwner {
        if (_newTreasury == address(0)) revert InvalidAddress();
        treasuryContract = _newTreasury;
    }
    
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ CAMPAIGN CREATION ============
    
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
        address _acceptedToken,
        address _creator
    ) external whenNotPaused returns (uint256) {
        if (_fundingGoal < MINIMUM_CONTRIBUTION) revert FundingGoalTooLow();
        if (_projectDuration > PROJECT_MAX_DURATION) revert ProjectDurationTooLong();

        // Validate token acceptance by checking with Core contract
        if (!_acceptsEth) {
            if (_acceptedToken == address(0)) revert InvalidAddress();
            if (!ITrustLockCore(coreContract).isTokenAccepted(_acceptedToken)) {
                revert TokenNotAccepted();
            }
        }

        campaignCounter++;
        uint256 campaignId = campaignCounter;

        Campaign storage campaign = campaigns[campaignId];
        campaign.creator = _creator;
        campaign.fundingGoal = _fundingGoal;
        campaign.fundingDeadline = uint64(block.timestamp + FUNDING_DURATION);
        campaign.projectDuration = uint64(_projectDuration);
        campaign.createdAt = uint64(block.timestamp);
        campaign.state = CampaignState.FUNDING;
        campaign.acceptsEth = _acceptsEth;
        campaign.acceptedToken = _acceptedToken;
        
        campaignTitles[campaignId] = _title;
        campaignDescriptions[campaignId] = _description;

        emit CampaignCreated(campaignId, msg.sender, _fundingGoal, _acceptsEth);

        return campaignId;
    }

    // ============ CONTRIBUTIONS ============
    
    /**
     * @notice Record a contribution (called by Core contract after token transfer)
     * @param _campaignId Campaign ID
     * @param _contributor Contributor address
     * @param _amount Contribution amount
     */
    function recordContribution(uint256 _campaignId, address _contributor, uint256 _amount) 
        external 
        nonReentrant 
        whenNotPaused
        onlyAuthorizedContracts
        campaignExists(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        if (campaign.state != CampaignState.FUNDING) revert CanOnlyContributeInFundingState();
        if (block.timestamp > campaign.fundingDeadline) revert FundingPeriodEnded();
        if (campaign.creator == _contributor) revert CreatorCannotContribute();
        if (_amount < MINIMUM_CONTRIBUTION) revert ContributionTooLow();

        // Check max contribution per user (2% of funding goal)
        uint256 maxContribution = (campaign.fundingGoal * MAX_CONTRIBUTION_PERCENTAGE) / BASIS_POINT;
        uint256 currentContribution = contributions[_campaignId][_contributor];
        if (currentContribution + _amount > maxContribution) {
            revert MaxContributionExceeded(maxContribution, currentContribution + _amount);
        }

        // Check if would exceed funding goal
        if (campaign.totalRaised + _amount > campaign.fundingGoal) {
            revert FundingGoalExceeded(campaign.fundingGoal - campaign.totalRaised);
        }

        // Record contribution
        if (!hasContributed[_campaignId][_contributor]) {
            contributors[_campaignId].push(_contributor);
            hasContributed[_campaignId][_contributor] = true;
        }

        contributions[_campaignId][_contributor] += _amount;
        campaign.totalRaised += _amount;

        emit ContributionReceived(_campaignId, _contributor, _amount, campaign.acceptsEth);

        // Check if funding goal reached
        if (campaign.totalRaised == campaign.fundingGoal) {
            _updateCampaignState(_campaignId, CampaignState.ACTIVE);
            emit CampaignFunded(_campaignId, campaign.totalRaised, block.timestamp);
        }
    }

    // ============ CAMPAIGN FAILURE MANAGEMENT ============
    
    /**
     * @notice Mark campaign as failed if funding deadline passed without reaching goal
     * @param _campaignId Campaign ID
     * @dev Can be called by anyone to trigger automatic failure
     */
    function markCampaignAsFailed(uint256 _campaignId) external campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        // Can only mark as failed if in FUNDING state and deadline passed
        if (campaign.state != CampaignState.FUNDING) revert InvalidCampaignState();
        if (block.timestamp <= campaign.fundingDeadline) revert FundingPeriodNotEnded();
        
        // Update state
        _updateCampaignState(_campaignId, CampaignState.FAILED);
        emit CampaignMarkedAsFailed(_campaignId, "Funding deadline passed");
    }

    // ============ AUTHORIZED STATE UPDATES ============
    
    /**
     * @notice Update campaign state (only callable by authorized contracts)
     * @param _campaignId Campaign ID
     * @param _newState New campaign state
     */
    function updateCampaignState(uint256 _campaignId, CampaignState _newState) 
        external 
        onlyAuthorizedContracts 
        campaignExists(_campaignId) 
    {
        _updateCampaignState(_campaignId, _newState);
    }

    /**
     * @notice Increment milestone count (only callable by voting contract)
     * @param _campaignId Campaign ID
     */
    function incrementMilestoneCount(uint256 _campaignId) 
        external 
        onlyAuthorizedContracts 
        campaignExists(_campaignId) 
    {
        campaigns[_campaignId].milestoneCount++;
    }

    /**
     * @notice Increment consecutive failed milestones count (only callable by voting contract)
     * @param _campaignId Campaign ID
     */
    function incrementConsecutiveFailedMilestones(uint256 _campaignId) 
        external 
        onlyAuthorizedContracts 
        campaignExists(_campaignId) 
    {
        campaigns[_campaignId].consecutiveFailedMilestones++;
    }

    /**
     * @notice Increment total failed milestones count (only callable by voting contract)
     * @param _campaignId Campaign ID
     */
    function incrementTotalFailedMilestones(uint256 _campaignId) 
        external 
        onlyAuthorizedContracts 
        campaignExists(_campaignId) 
    {
        campaigns[_campaignId].totalFailedMilestones++;
    }

    /**
     * @notice Reset consecutive failures when milestone is approved
     * @param _campaignId Campaign ID
     */
    function resetConsecutiveFailures(uint256 _campaignId) 
        external 
        onlyAuthorizedContracts 
        campaignExists(_campaignId) 
    {
        campaigns[_campaignId].consecutiveFailedMilestones = 0;
    }

    /**
     * @notice Update released funds (only callable by treasury contract)
     * @param _campaignId Campaign ID
     * @param _amount Amount released
     */
    function updateReleasedFunds(uint256 _campaignId, uint256 _amount) 
        external 
        onlyAuthorizedContracts 
        campaignExists(_campaignId) 
    {
        campaigns[_campaignId].releasedFunds += _amount;
    }

    // ============ VIEW FUNCTIONS ============

    function getCampaign(uint256 _campaignId) external view campaignExists(_campaignId) returns (Campaign memory campaign) {
        return campaigns[_campaignId];
    }

    function getNoOfContributors(uint256 _campaignId) external view campaignExists(_campaignId) returns (uint256) {
        return contributors[_campaignId].length;
    }

    function getContributors(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (address[] memory) 
    {
        return contributors[_campaignId];
    }

    function getContribution(uint256 _campaignId, address _contributor) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (uint256) 
    {
        return contributions[_campaignId][_contributor];
    }

    function hasContributedToCampaign(uint256 _campaignId, address _contributor) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (bool) 
    {
        return hasContributed[_campaignId][_contributor];
    }

    // ============ INTERNAL FUNCTIONS ============
    
    function _updateCampaignState(uint256 _campaignId, CampaignState _newState) internal {
        CampaignState oldState = campaigns[_campaignId].state;
        campaigns[_campaignId].state = _newState;
        emit CampaignStateChanged(_campaignId, oldState, _newState);
    }
}
