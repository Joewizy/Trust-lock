// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ITrustLockCore
 * @notice Interface for TrustLock crowdfunding protocol
 * @dev Includes all external functions for frontend integration
 */
interface ITrustLockCore {
    
    // ============ ENUMS ============
    
    enum CampaignState {
        FUNDING,
        ACTIVE,
        VOTING,
        COMPLETED,
        FAILED
    }

    enum MilestoneState {
        PENDING,
        VOTING,
        APPROVED,
        REJECTED
    }

    // ============ STRUCTS ============

    struct Campaign {
        address creator;           // 20 bytes
        address acceptedToken;     // 20 bytes
        uint128 fundingGoal;       // 16 bytes (up to 340B ETH)
        uint128 totalRaised;       // 16 bytes
        uint64 fundingDeadline;    // 8 bytes (until 2106)
        uint64 projectDuration;    // 8 bytes
        uint64 createdAt;          // 8 bytes
        uint128 releasedFunds;     // 16 bytes
        uint32 milestoneCount;     // 4 bytes
        uint32 failedMilestones;   // 4 bytes
        CampaignState state;       // 1 byte
        bool acceptsEth;           // 1 byte
    }

    struct Milestone {
        string description;
        uint256 fundingPercentage;
        uint256 voteStartTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        MilestoneState state;
    }

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
        uint256 amount,
        bool isEth
    );

    event RefundIssued(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    // ============ OWNER MANAGEMENT ============

    function pause() external;
    function unpause() external;
    function updateProtocolFeeRecipient(address _newRecipient) external;
    function transferOwnership(address _newOwner) external;

    // ============ FUNCTIONS ============

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _projectDuration,
        bool _acceptsEth,
        address _acceptedToken
    ) external returns (uint256);

    function contribute(uint256 _campaignId, uint256 _amount) external payable;

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

    function claimRefund(uint256 _campaignId) external;
    
    function isTokenAccepted(address _token) external view returns (bool);

    function getCampaign(uint256 _campaignId) external view returns (Campaign memory campaign, string memory title, string memory description);

    function getMilestone(uint256 _campaignId, uint256 _milestoneId) external view returns (Milestone memory);

    function getContributors(uint256 _campaignId) external view returns (address[] memory);

    function getContribution(uint256 _campaignId, address _contributor) external view returns (uint256);

    function hasContributedToCampaign(uint256 _campaignId, address _contributor) external view returns (bool);

    function hasVotedOnMilestone(uint256 _campaignId, uint256 _milestoneId, address _voter) external view returns (bool);
}
