// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../TrustLockCampaignManager.sol";
import "../TrustLockVoting.sol";

/**
 * @title ITrustLock
 * @notice Main interface for TrustLock crowdfunding protocol
 * @dev Includes all external functions for frontend integration
 */
interface ITrustLock {
    
    // ============ OWNER MANAGEMENT ============
    
    function transferOwnership(address _newOwner) external;
    function updateProtocolFeeRecipient(address _newRecipient) external;
    function pauseAll() external;
    function unpauseAll() external;

    // ============ CAMPAIGN FUNCTIONS ============
    
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _projectDuration,
        bool _acceptsETH,
        address _acceptedToken
    ) external returns (uint256);

    function contribute(uint256 _campaignId, uint256 _amount) external payable;

    // ============ MILESTONE FUNCTIONS ============
    
    function createMilestone(
        uint256 _campaignId,
        string memory _description,
        uint256 _fundingPercentage
    ) external;

    function vote(
        uint256 _campaignId,
        uint256 _milestoneId,
        bool _support
    ) external;

    function finalizeMilestone(uint256 _campaignId, uint256 _milestoneId) external;

    // ============ REFUND FUNCTIONS ============
    
    function claimRefund(uint256 _campaignId) external;

    // ============ VIEW FUNCTIONS ============
    
    function getCampaign(uint256 _campaignId) 
        external 
        view 
        returns (TrustLockCampaignManager.Campaign memory campaign, string memory title, string memory description);

    function getMilestone(uint256 _campaignId, uint256 _milestoneId) 
        external 
        view 
        returns (TrustLockVoting.Milestone memory);

    function getContributors(uint256 _campaignId) external view returns (address[] memory);
    function getContribution(uint256 _campaignId, address _contributor) external view returns (uint256);
    function hasContributedToCampaign(uint256 _campaignId, address _contributor) external view returns (bool);
    function hasVotedOnMilestone(uint256 _campaignId, uint256 _milestoneId, address _voter) external view returns (bool);
    function getVotingResults(uint256 _campaignId, uint256 _milestoneId) 
        external 
        view 
        returns (uint256 votesFor, uint256 votesAgainst, uint256 totalVotes, bool approved);
    function getRefundAmount(uint256 _campaignId, address _contributor) external view returns (uint256);
    function hasRefundClaimed(uint256 _campaignId, address _contributor) external view returns (bool);

    // ============ SYSTEM FUNCTIONS ============
    
    function getContractAddresses() 
        external 
        view 
        returns (address manager, address votingContract, address treasuryContract);
    
    function getProtocolStats() external view returns (uint256 totalCampaigns, uint256 totalProtocolFees);

    // ============ EVENTS ============
    
    event ContractsDeployed(
        address indexed campaignManager,
        address indexed voting,
        address indexed treasury
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event ProtocolFeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 fundingGoal,
        bool acceptsETH
    );

    event ContributionReceived(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount,
        bool isETH
    );

    event CampaignFunded(
        uint256 indexed campaignId,
        uint256 totalRaised,
        uint256 timestamp
    );

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

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount,
        bool isETH
    );

    event ProtocolFeeCollected(
        uint256 indexed campaignId,
        address indexed recipient,
        uint256 amount,
        bool isETH
    );

    event RefundIssued(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount,
        bool isETH
    );
}
