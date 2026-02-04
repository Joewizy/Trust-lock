// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ITrustLockTreasury {
    // ============ EVENTS ============

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

    // ============ FUND MANAGEMENT ============

    /**
     * @notice Release funds for an approved milestone (no protocol fee deducted)
     */
    function releaseFunds(uint256 _campaignId, uint256 _amount) external;

    /**
     * @notice Collect protocol fee when campaign completes successfully
     */
    function collectProtocolFee(uint256 _campaignId) external;

    /**
     * @notice Handle ERC20 token transfer for contributions
     */
    function handleTokenContribution(
        uint256 _campaignId,
        address _contributor,
        uint256 _amount
    ) external;

    /**
     * @notice Claim refund for a failed or expired campaign
     */
    function claimRefund(uint256 _campaignId) external;

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get refundable amount for a contributor
     */
    function getRefundAmount(
        uint256 _campaignId,
        address _contributor
    ) external view returns (uint256);

    /**
     * @notice Check if refund has already been claimed
     */
    function hasRefundClaimed(
        uint256 _campaignId,
        address _contributor
    ) external view returns (bool);
}
