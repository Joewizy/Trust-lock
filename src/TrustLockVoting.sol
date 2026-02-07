// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ITrustLockTreasury } from "./interfaces/ITrustLockTreasury.sol";
import { TrustLockCampaignManager } from "./TrustLockCampaignManager.sol";
import { TrustLockConfig } from "./TrustLockConfig.sol";

/**
 * @title TrustLockVoting
 * @notice Handles milestone creation and voting logic
 * @dev Focused solely on voting mechanics and milestone management
 */
contract TrustLockVoting is Ownable, Pausable {
    
    // ============ TYPES ============
    
    enum MilestoneState {
        VOTING,       // Active voting period
        APPROVED,     // Passed and funds released
        REJECTED      // Failed vote
    }

    struct Milestone {
        string description;
        uint256 fundingPercentage; // 5-25%
        uint256 voteStartTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 totalVotes;
        uint256 createdAt;
        MilestoneState state;
    }

    // ============ STATE VARIABLES ============
    
    address public campaignManager;
    address public treasuryContract;
    bool private _initialized;
    
    // Configuration contract
    TrustLockConfig public config;       
    
    // Milestone mappings
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    // ============ ERRORS ============
    
    error CanOnlyCreateMilestoneInActiveState();
    error TooManyFailedMilestones();
    error InvalidMilestonePercentage();
    error PercentageMustBeMultipleOfFive();
    error MilestoneNotInVotingPeriod();
    error AlreadyVoted();
    error NotAContributor();
    error NotCampaignCreator();
    error VotingEnded();
    error NotOwner();
    error InvalidAddress();
    error UnauthorizedContract();
    error CampaignNotFound();
    error VotingHasNotEnded();
    error AlreadyInitialized();
    error NotInitialized();

    // ============ EVENTS ============
    
    event MilestoneCreated(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        uint256 fundingPercentage,
        uint256 voteStartTime
    );

    event VoteCast(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        address indexed voter,
        bool support
    );

    event MilestoneApproved(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        uint256 fundsReleased
    );

    event MilestoneRejected(
        uint256 indexed campaignId,
        uint256 indexed milestoneId
    );
    
    event TreasurySet(address indexed treasuryContract);

    // ============ MODIFIERS ============
    
    modifier onlyAuthorizedContracts() {
        if (!_initialized) revert NotInitialized();
        if (msg.sender != campaignManager && msg.sender != treasuryContract) {
            revert UnauthorizedContract();
        }
        _;
    }
    
    modifier campaignExists(uint256 _campaignId) {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        if (_campaignId == 0 || _campaignId > manager.campaignCounter()) revert CampaignNotFound();
        _;
    }

    // ============ CONSTRUCTOR ============
    
    /**
     * @notice Deploy Voting contract with minimal dependencies
     * @param _campaignManager Address of TrustLockCampaignManager
     * @dev Treasury address set via initialize() after deployment
     */
    constructor(address _campaignManager, address _config) Ownable(msg.sender) {
        if (_campaignManager == address(0) || _config == address(0)) revert InvalidAddress();
        campaignManager = _campaignManager;
        config = TrustLockConfig(_config);
    }

    // ============ ADMIN MANAGEMENT ============
    
    function initialize(address _treasuryContract) external onlyOwner {
        if (_initialized) revert AlreadyInitialized();
        if (_treasuryContract == address(0)) revert InvalidAddress();
        treasuryContract = _treasuryContract;
        _initialized = true;
        
        emit TreasurySet(_treasuryContract);
    }

    function updateTreasuryContract(address _newTreasury) external onlyOwner {
        if (_initialized) revert AlreadyInitialized();
        if (_newTreasury == address(0)) revert InvalidAddress();
        treasuryContract = _newTreasury;
    }
    
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ MILESTONE MANAGEMENT ============
    
    /**
     * @notice Create a milestone for contributors to vote on
     * @param _creator The address of the campaign creator
     * @param _campaignId The campaign ID
     * @param _description What was accomplished
     * @param _fundingPercentage Percentage of total funds to release (5-25%)
     */
    function createMilestone(address _creator, uint256 _campaignId, string memory _description, uint256 _fundingPercentage) 
        external 
        whenNotPaused
        campaignExists(_campaignId) 
    {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        TrustLockCampaignManager.Campaign memory campaign = manager.getCampaign(_campaignId);

        if (campaign.creator != _creator) revert NotCampaignCreator();

        if (campaign.state != TrustLockCampaignManager.CampaignState.ACTIVE) {
            revert CanOnlyCreateMilestoneInActiveState();
        }
        
        // Check if campaign has exceeded failure thresholds
        if (campaign.consecutiveFailedMilestones >= config.maxConsecutiveFailures()) {
            revert TooManyFailedMilestones();
        }
        if (campaign.totalFailedMilestones >= config.maxTotalFailures()) {
            revert TooManyFailedMilestones();
        }
        
        // Validate percentage: must be multiple of 5 between 5 and 25
        if (_fundingPercentage < config.minMilestonePercent() || _fundingPercentage > config.maxMilestonePercent()) {
            revert InvalidMilestonePercentage();
        }
        if (_fundingPercentage % 5 != 0) {
            revert PercentageMustBeMultipleOfFive();
        }

        // First milestone can only request up to 10%
        if (campaign.milestoneCount == 0 && _fundingPercentage > config.firstMilestoneMax()) {
            revert InvalidMilestonePercentage();
        }

        // Increment milestone count in campaign manager
        manager.incrementMilestoneCount(_campaignId);
        uint256 milestoneId = campaign.milestoneCount + 1;

        Milestone storage milestone = milestones[_campaignId][milestoneId];
        milestone.description = _description;
        milestone.fundingPercentage = _fundingPercentage;
        milestone.voteStartTime = block.timestamp; 
        milestone.createdAt = block.timestamp;
        milestone.state = MilestoneState.VOTING;

        // Update campaign state to VOTING
        manager.updateCampaignState(_campaignId, TrustLockCampaignManager.CampaignState.VOTING);

        emit MilestoneCreated(_campaignId, milestoneId, _fundingPercentage, milestone.voteStartTime);
    }

    // ============ VOTING ============
    
    /**
     * @notice Vote on a milestone
     * @param _campaignId The campaign ID
     * @param _milestoneId The milestone ID
     * @param _support True to approve, false to reject
     */
    function vote(address _voter, uint256 _campaignId, uint256 _milestoneId, bool _support) 
        external 
        whenNotPaused
        campaignExists(_campaignId) 
    {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        
        // Check if contributor
        if (!manager.hasContributedToCampaign(_campaignId, _voter)) {
            revert NotAContributor();
        }
        
        Milestone storage milestone = milestones[_campaignId][_milestoneId];

        // Validations
        if (hasVoted[_campaignId][_milestoneId][_voter]) revert AlreadyVoted();
        if (block.timestamp > milestone.voteStartTime + config.votingDuration()) revert VotingEnded();
        if (milestone.state != MilestoneState.VOTING) {
            revert MilestoneNotInVotingPeriod();
        }

        // Record vote
        hasVoted[_campaignId][_milestoneId][_voter] = true;
        
        if (_support) {
            milestone.votesFor++;
        } else {
            milestone.votesAgainst++;
        }
        
        milestone.totalVotes = milestone.votesFor + milestone.votesAgainst;

        emit VoteCast(_campaignId, _milestoneId, _voter, _support);
    }

    /**
     * @notice Finalize a milestone vote after voting period ends
     * @param _campaignId The campaign ID
     * @param _milestoneId The milestone ID
     */
    function finalizeMilestone(uint256 _campaignId, uint256 _milestoneId) 
        external 
        whenNotPaused
        campaignExists(_campaignId) 
    {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        TrustLockCampaignManager.Campaign memory campaign = manager.getCampaign(_campaignId);
        Milestone storage milestone = milestones[_campaignId][_milestoneId];

        if (milestone.state != MilestoneState.VOTING) revert MilestoneNotInVotingPeriod();
        if (block.timestamp <= milestone.voteStartTime + config.votingDuration()) revert VotingHasNotEnded();

        uint256 contributorCount = manager.getNoOfContributors(_campaignId);
        uint256 totalVotes = milestone.totalVotes;

        // Optimized calculations: 25% minimum participation
        bool participationMet = totalVotes * 4 >= contributorCount;
        bool approved = participationMet && (milestone.votesFor * 100 >= totalVotes * config.majorityThreshold());

        if (approved) {
            milestone.state = MilestoneState.APPROVED;
            
            // Reset consecutive failures on successful milestone
            manager.resetConsecutiveFailures(_campaignId);
            
            // Calculate amounts from AVAILABLE funds (not total raised)
            uint256 releaseAmount = (campaign.availableFunds * milestone.fundingPercentage) / 100;
            
            // Check if this will complete the campaign
            bool willComplete = campaign.releasedFunds + releaseAmount >= campaign.availableFunds;
            
            // Update campaign state
            if (willComplete) {
                manager.updateCampaignState(_campaignId, TrustLockCampaignManager.CampaignState.COMPLETED);
            } else {
                manager.updateCampaignState(_campaignId, TrustLockCampaignManager.CampaignState.ACTIVE);
            }

            emit MilestoneApproved(_campaignId, _milestoneId, releaseAmount);

            ITrustLockTreasury(treasuryContract).releaseFunds(_campaignId, releaseAmount, _milestoneId);
        } else {
            milestone.state = MilestoneState.REJECTED;
            
            emit MilestoneRejected(_campaignId, _milestoneId);

            // Get current values before incrementing
            uint256 currentConsecutiveFailures = campaign.consecutiveFailedMilestones;
            uint256 currentTotalFailures = campaign.totalFailedMilestones;
            
            // Increment counters in CampaignManager
            manager.incrementConsecutiveFailedMilestones(_campaignId);
            manager.incrementTotalFailedMilestones(_campaignId);
            
            // Check if exceeded either failure threshold (using incremented values)
            if (currentConsecutiveFailures + 1 >= config.maxConsecutiveFailures() || currentTotalFailures + 1 >= config.maxTotalFailures()) {
                // Campaign has failed
                manager.updateCampaignState(_campaignId, TrustLockCampaignManager.CampaignState.FAILED);
            } else {
                // Continue with campaign
                manager.updateCampaignState(_campaignId, TrustLockCampaignManager.CampaignState.ACTIVE);
            }
        }
    }

    /**
     * @notice Get the voting results of a milestone
     * @param _campaignId The campaign ID
     * @param _milestoneId The milestone ID
     * @return votesFor The number of votes for the milestone
     * @return votesAgainst The number of votes against the milestone
     * @return totalVotes The total number of votes
     * @return approved Whether the milestone was approved
     */
    function getVotingResults(uint256 _campaignId, uint256 _milestoneId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (uint256 votesFor, uint256 votesAgainst, uint256 totalVotes, bool approved) 
    {
        Milestone storage milestone = milestones[_campaignId][_milestoneId];
        votesFor = milestone.votesFor;
        votesAgainst = milestone.votesAgainst;
        totalVotes = votesFor + votesAgainst;
        
        // Calculate approval based on current votes
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        address[] memory contributors = manager.getContributors(_campaignId);
        uint256 contributorCount = contributors.length;
        
        bool participationMet = totalVotes * 4 >= contributorCount;
        approved = participationMet && votesFor * 100 >= totalVotes * config.majorityThreshold();
    }

    /**
     * @notice Get milestone details
     * @param _campaignId The campaign ID
     * @param _milestoneId The milestone ID
     * @return milestone The milestone details
     */
    function getMilestone(uint256 _campaignId, uint256 _milestoneId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (Milestone memory) 
    {
        return milestones[_campaignId][_milestoneId];
    }

    /**
     * @notice Check if a user has voted on a milestone
     * @param _campaignId The campaign ID
     * @param _milestoneId The milestone ID
     * @param _voter The voter address
     * @return voted Whether the voter has voted
     */
    function hasVotedOnMilestone(uint256 _campaignId, uint256 _milestoneId, address _voter) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (bool) 
    {
        return hasVoted[_campaignId][_milestoneId][_voter];
    }
}