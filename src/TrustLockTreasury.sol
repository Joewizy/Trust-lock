// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { TrustLockCampaignManager } from "./TrustLockCampaignManager.sol";

/**
 * @title TrustLockTreasury
 * @notice Handles fund management, transfers, and refunds
 * @dev Protocol fees are only collected on successful campaign completion
 *      This ensures full refunds are available if campaign fails
 */
contract TrustLockTreasury is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ STATE VARIABLES ============

    address public campaignManager;
    address public votingContract;
    address public protocolFeeRecipient;
    
    // Constants
    uint256 public constant PROTOCOL_FEE_PERCENT = 2;
    
    // Protocol state
    uint256 public totalProtocolFees;
    
    // Track if protocol fee has been collected for a campaign
    mapping(uint256 => bool) public protocolFeeCollected;
    
    // Refund tracking
    mapping(uint256 => mapping(address => bool)) public refundClaimed;

    // ============ ERRORS ============
    
    error InvalidAddress();
    error UnauthorizedContract();
    error CampaignNotFound();
    error WithdrawalFailed();
    error NoRefundAvailable();
    error RefundAlreadyClaimed();
    error CannotHandleETHContributions();
    error CampaignNotCompleted();
    error ProtocolFeeAlreadyCollected();

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

    // ============ MODIFIERS ============
    
    modifier onlyAuthorizedContracts() {
        if (msg.sender != votingContract && msg.sender != owner()) {
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
    
    constructor(address _campaignManager, address _votingContract, address _protocolFeeRecipient) Ownable(msg.sender) {
        if (_campaignManager == address(0) || _votingContract == address(0) || _protocolFeeRecipient == address(0)) {
            revert InvalidAddress();
        }

        campaignManager = _campaignManager;
        votingContract = _votingContract;
        protocolFeeRecipient = _protocolFeeRecipient;
    }

    // ============ ADMIN MANAGEMENT ============

    function updateProtocolFeeRecipient(address _newRecipient) external onlyOwner {
        if (_newRecipient == address(0)) revert InvalidAddress();
        protocolFeeRecipient = _newRecipient;
    }
    
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ FUND MANAGEMENT ============
    
    /**
     * @notice Release funds for approved milestone WITHOUT deducting protocol fees
     * @param _campaignId Campaign ID
     * @param _amount Amount to release (full amount, no fees deducted here)
     * @dev Protocol fees are only collected when campaign completes successfully
     */
    function releaseFunds(uint256 _campaignId, uint256 _amount) 
        external 
        nonReentrant
        whenNotPaused
        onlyAuthorizedContracts 
        campaignExists(_campaignId) 
    {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        TrustLockCampaignManager.Campaign memory campaign = manager.getCampaign(_campaignId);

        // Update released funds tracking FIRST
        manager.updateReleasedFunds(_campaignId, _amount);

        // Transfer full amount to creator (NO FEE DEDUCTION)
        if (campaign.acceptsETH) {
            (bool success, ) = payable(campaign.creator).call{value: _amount}("");
            if (!success) revert WithdrawalFailed();
            
            emit FundsWithdrawn(_campaignId, campaign.creator, _amount, true);
        } else {
            IERC20(campaign.acceptedToken).safeTransfer(campaign.creator, _amount);
            emit FundsWithdrawn(_campaignId, campaign.creator, _amount, false);
        }
    }

    /**
     * @notice Collect protocol fee when campaign successfully completes
     * @param _campaignId Campaign ID
     * @dev Can only be called once per campaign and only when state is COMPLETED
     */
    function collectProtocolFee(uint256 _campaignId) 
        external 
        nonReentrant
        whenNotPaused
        campaignExists(_campaignId) 
    {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        TrustLockCampaignManager.Campaign memory campaign = manager.getCampaign(_campaignId);

        // Validate campaign is completed
        if (campaign.state != TrustLockCampaignManager.CampaignState.COMPLETED) {
            revert CampaignNotCompleted();
        }

        // Check if already collected
        if (protocolFeeCollected[_campaignId]) {
            revert ProtocolFeeAlreadyCollected();
        }

        // Mark as collected
        protocolFeeCollected[_campaignId] = true;

        // Calculate protocol fee on total raised amount
        uint256 protocolFee = (campaign.totalRaised * PROTOCOL_FEE_PERCENT) / 100;
        totalProtocolFees += protocolFee;

        // Transfer protocol fee
        if (campaign.acceptsETH) {
            (bool success, ) = payable(protocolFeeRecipient).call{value: protocolFee}("");
            if (!success) revert WithdrawalFailed();
            
            emit ProtocolFeeCollected(_campaignId, protocolFeeRecipient, protocolFee, true);
        } else {
            IERC20(campaign.acceptedToken).safeTransfer(protocolFeeRecipient, protocolFee);
            emit ProtocolFeeCollected(_campaignId, protocolFeeRecipient, protocolFee, false);
        }
    }

    /**
     * @notice Handle token transfers for contributions
     * @param _campaignId Campaign ID
     * @param _contributor Contributor address
     * @param _amount Amount to transfer
     */
    function handleTokenContribution(uint256 _campaignId, address _contributor, uint256 _amount) 
        external 
        nonReentrant
        whenNotPaused
        onlyAuthorizedContracts 
        campaignExists(_campaignId) 
    {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        TrustLockCampaignManager.Campaign memory campaign = manager.getCampaign(_campaignId);
        
        if (campaign.acceptsETH) {
            revert CannotHandleETHContributions();
        }
        
        IERC20(campaign.acceptedToken).safeTransferFrom(_contributor, address(this), _amount);
    }

    /**
     * @notice Claim full refund if campaign failed
     * @param _campaignId The campaign ID
     * @dev Returns 100% of contribution since no fees were deducted
     */
    function claimRefund(uint256 _campaignId) 
        external 
        nonReentrant 
        whenNotPaused
        campaignExists(_campaignId) 
    {
        TrustLockCampaignManager.Campaign memory campaign = getCampaign(_campaignId);
        uint256 refundAmount = getRefundAmount(_campaignId, msg.sender);
        if (refundAmount == 0) revert NoRefundAvailable();
        
        // Mark as claimed and transfer
        refundClaimed[_campaignId][msg.sender] = true;
        emit RefundIssued(_campaignId, msg.sender, refundAmount, campaign.acceptsETH);

        // Transfer refund
        if (campaign.acceptsETH) {
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            if (!success) revert WithdrawalFailed();
        } else {
            IERC20(campaign.acceptedToken).safeTransfer(msg.sender, refundAmount);
        }
    }

    // ============ EMERGENCY FUNCTIONS ============
    
    function emergencyWithdrawETH(uint256 _amount) external onlyOwner {
        if (address(this).balance < _amount) revert WithdrawalFailed();
        (bool success, ) = payable(owner()).call{value: _amount}("");
        if (!success) revert WithdrawalFailed();
    }

    function emergencyWithdrawToken(address _token, uint256 _amount) external onlyOwner {
        IERC20 token = IERC20(_token);
        if (token.balanceOf(address(this)) < _amount) revert WithdrawalFailed();
        token.safeTransfer(owner(), _amount);
    }

    // ============ VIEW FUNCTIONS ============

    function getCampaign(uint256 _campaignId) public view returns (TrustLockCampaignManager.Campaign memory) {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        return manager.getCampaign(_campaignId);
    }
    
    function getRefundAmount(uint256 _campaignId, address _contributor) 
        public 
        view 
        campaignExists(_campaignId) 
        returns (uint256) 
    {
        TrustLockCampaignManager manager = TrustLockCampaignManager(campaignManager);
        TrustLockCampaignManager.Campaign memory campaign = manager.getCampaign(_campaignId);

        // Campaign must be failed or funding deadline passed without reaching goal
        bool canRefund = campaign.state == TrustLockCampaignManager.CampaignState.FAILED ||
                        (campaign.state == TrustLockCampaignManager.CampaignState.FUNDING && 
                         block.timestamp > campaign.fundingDeadline);

        if (!canRefund) return 0;

        uint256 contributedAmount = manager.getContribution(_campaignId, _contributor);
        if (contributedAmount == 0 || refundClaimed[_campaignId][_contributor]) return 0;

        // Calculate refund
        if (campaign.releasedFunds == 0) {
            return contributedAmount;
        } else {
            uint256 remainingFunds = campaign.totalRaised - campaign.releasedFunds;
            return (contributedAmount * remainingFunds) / campaign.totalRaised;
        }
    }

    function hasRefundClaimed(uint256 _campaignId, address _contributor) 
        external 
        view 
        returns (bool) 
    {
        return refundClaimed[_campaignId][_contributor];
    }

    // ============ RECEIVE FUNCTION ============
    
    receive() external payable {
        // Allow receiving ETH for contributions
    }
}
