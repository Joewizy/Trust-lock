// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {TrustLockCore} from "../src/TrustLockCore.sol";
import {TrustLockCampaignManager} from "../src/TrustLockCampaignManager.sol";
import {TrustLockVoting} from "../src/TrustLockVoting.sol";
import {TrustLockTreasury} from "../src/TrustLockTreasury.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TrustLockFuzzTest is Test {
    TrustLockCore public trustLock;
    TrustLockCampaignManager public campaignManager;
    TrustLockVoting public voting;
    TrustLockTreasury public treasury;
    MockERC20 public token;

    address creator = makeAddr("creator");
    address protocolFeeRecipient = makeAddr("protocolFeeRecipient");

    uint256 constant MIN_CONTRIBUTION = 0.01 ether;
    uint256 constant MAX_CONTRIBUTION_PERCENT = 200; // 2% in basis points
    uint256 constant PROJECT_DURATION = 30 weeks;

    function setUp() public {
        trustLock = new TrustLockCore(protocolFeeRecipient);
        token = new MockERC20();

        (address cmAddr, address votingAddr, address treasuryAddr) = trustLock.getContractAddresses();
        campaignManager = TrustLockCampaignManager(cmAddr);
        voting = TrustLockVoting(votingAddr);
        treasury = TrustLockTreasury(payable(treasuryAddr));

        trustLock.addAcceptedToken(address(token));
        
        vm.deal(creator, 1000 ether);
        token.mint(creator, 1_000_000 ether);
    }

    // ============ FUZZ TEST 1: Protocol Fee on Successful Campaign (ETH) ============

    function testFuzz_ProtocolFeeOnSuccessfulCampaignEth(uint96 fundingGoal) public {
        // Bound funding goal to reasonable range
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));

        // Create and fund campaign
        uint256 campaignId = _createCampaign(fundingGoal, true);
        _fundCampaignEth(campaignId, fundingGoal);

        // Approve milestones totaling 100%
        _createAndApproveMilestone(campaignId, 1, 10); // 10%
        _createAndApproveMilestone(campaignId, 2, 20); // 20%
        _createAndApproveMilestone(campaignId, 3, 25); // 25%
        _createAndApproveMilestone(campaignId, 4, 25); // 25%
        _createAndApproveMilestone(campaignId, 5, 20); // 20% (total 100%)

        // Check campaign is completed
        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertEq(uint256(campaign.state), uint256(TrustLockCampaignManager.CampaignState.COMPLETED));

        // Check protocol fee was collected (2% of total)
        uint256 expectedFee = (fundingGoal * 2) / 100;
        assertEq(protocolFeeRecipient.balance, expectedFee);
        
        // Check total protocol fees recorded
        assertEq(treasury.totalProtocolFees(), expectedFee);
    }

    // ============ FUZZ TEST 2: Protocol Fee on Successful Campaign (ERC20) ============

    function testFuzz_ProtocolFeeOnSuccessfulCampaignToken(uint96 fundingGoal) public {
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));

        uint256 campaignId = _createCampaign(fundingGoal, false);
        _fundCampaignToken(campaignId, fundingGoal);

        _createAndApproveMilestone(campaignId, 1, 10);
        _createAndApproveMilestone(campaignId, 2, 20);
        _createAndApproveMilestone(campaignId, 3, 25);
        _createAndApproveMilestone(campaignId, 4, 25);
        _createAndApproveMilestone(campaignId, 5, 20);

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertEq(uint256(campaign.state), uint256(TrustLockCampaignManager.CampaignState.COMPLETED));

        uint256 expectedFee = (fundingGoal * 2) / 100;
        assertEq(token.balanceOf(protocolFeeRecipient), expectedFee);
        assertEq(treasury.totalProtocolFees(), expectedFee);
    }

    // ============ FUZZ TEST 3: No Protocol Fee on Failed Campaign (3 Consecutive) ============

    function testFuzz_NoProtocolFeeOn3ConsecutiveFailures(uint96 fundingGoal) public {
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));

        uint256 campaignId = _createCampaign(fundingGoal, true);
        _fundCampaignEth(campaignId, fundingGoal);

        // Approve one milestone, then reject 3 consecutive
        _createAndApproveMilestone(campaignId, 1, 10);
        _createAndRejectMilestone(campaignId, 2, 10);
        _createAndRejectMilestone(campaignId, 3, 10);
        _createAndRejectMilestone(campaignId, 4, 10); // 3rd consecutive rejection

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        
        // Campaign should be FAILED
        assertEq(uint256(campaign.state), uint256(TrustLockCampaignManager.CampaignState.FAILED));
        
        // Check consecutive failures = 3
        assertEq(campaign.consecutiveFailedMilestones, 3);
        
        // Protocol fee should be ZERO (campaign failed)
        assertEq(protocolFeeRecipient.balance, 0);
        assertEq(treasury.totalProtocolFees(), 0);
    }

    // ============ FUZZ TEST 4: No Protocol Fee on Failed Campaign (5 Total) ============

    function testFuzz_NoProtocolFeeOn5TotalFailures(uint96 fundingGoal) public {
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));

        uint256 campaignId = _createCampaign(fundingGoal, false);
        _fundCampaignToken(campaignId, fundingGoal);

        // Create pattern: reject, approve, reject, approve, reject, reject, reject
        // This gives 5 total rejections but never 3 consecutive
        _createAndRejectMilestone(campaignId, 1, 10);      // Total: 1, Consecutive: 1
        _createAndApproveMilestone(campaignId, 2, 10);     // Total: 1, Consecutive: 0
        _createAndRejectMilestone(campaignId, 3, 10);      // Total: 2, Consecutive: 1
        _createAndApproveMilestone(campaignId, 4, 10);     // Total: 2, Consecutive: 0
        _createAndRejectMilestone(campaignId, 5, 10);      // Total: 3, Consecutive: 1
        _createAndRejectMilestone(campaignId, 6, 10);      // Total: 4, Consecutive: 2
        _createAndRejectMilestone(campaignId, 7, 10);      // Total: 5, Consecutive: 3

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        
        // Campaign should be FAILED (hit both thresholds at milestone 7)
        assertEq(uint256(campaign.state), uint256(TrustLockCampaignManager.CampaignState.FAILED));
        
        // Check total failures = 5, consecutive = 3
        assertEq(campaign.totalFailedMilestones, 5);
        assertEq(campaign.consecutiveFailedMilestones, 3);
        
        // Protocol fee should be ZERO
        assertEq(token.balanceOf(protocolFeeRecipient), 0);
        assertEq(treasury.totalProtocolFees(), 0);
    }

    // ============ FUZZ TEST 5: Refund Calculation Accuracy ============

    function testFuzz_RefundCalculationAccuracy(
        uint96 fundingGoal,
        uint8 percentReleased
    ) public {
        // Bound inputs
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));
        percentReleased = uint8(bound(percentReleased, 0, 50)); // Release 0-50%

        uint256 campaignId = _createCampaign(fundingGoal, true);
        _fundCampaignEth(campaignId, fundingGoal);

        // Release some percentage of funds
        if (percentReleased > 0) {
            _createAndApproveMilestone(campaignId, 1, percentReleased);
        }

        // Reject 3 consecutive to fail campaign
        _createAndRejectMilestone(campaignId, 2, 10);
        _createAndRejectMilestone(campaignId, 3, 10);
        _createAndRejectMilestone(campaignId, 4, 10);

        // Get a contributor
        address[] memory contributors = trustLock.getContributors(campaignId);
        address contributor = contributors[0];
        
        uint256 contribution = trustLock.getContribution(campaignId, contributor);
        uint256 balanceBefore = contributor.balance;

        // Claim refund
        vm.prank(contributor);
        trustLock.claimRefund(campaignId);

        uint256 refundReceived = contributor.balance - balanceBefore;

        // Calculate expected refund
        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        uint256 remainingFunds = campaign.totalRaised - campaign.releasedFunds;
        uint256 expectedRefund = (contribution * remainingFunds) / campaign.totalRaised;

        // Refund should match expected
        assertEq(refundReceived, expectedRefund);
        
        // Refund should never exceed contribution
        assertLe(refundReceived, contribution);
    }

    // ============ FUZZ TEST 6: Consecutive Counter Resets on Approval ============

    function testFuzz_ConsecutiveCounterResetsOnApproval(uint8 numRejects) public {
        // Bound to 1-2 rejections (to test reset before hitting threshold)
        numRejects = uint8(bound(numRejects, 1, 2));

        uint256 campaignId = _createCampaign(10 ether, false);
        _fundCampaignToken(campaignId, 10 ether);

        // Reject some milestones
        for (uint256 i = 1; i <= numRejects; i++) {
            _createAndRejectMilestone(campaignId, i, 10);
        }

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertEq(campaign.consecutiveFailedMilestones, numRejects);
        assertEq(campaign.totalFailedMilestones, numRejects);

        // Approve one milestone
        _createAndApproveMilestone(campaignId, numRejects + 1, 10);

        (campaign) = trustLock.getCampaign(campaignId);
        
        // Consecutive should reset to 0
        assertEq(campaign.consecutiveFailedMilestones, 0);
        
        // Total should remain unchanged
        assertEq(campaign.totalFailedMilestones, numRejects);
    }

    // ============ FUZZ TEST 7: Creator Receives Full Amount During Milestones ============

    function testFuzz_CreatorReceivesFullMilestoneAmount(
        uint96 fundingGoal,
        uint8 milestonePercent
    ) public {
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));
        milestonePercent = uint8(bound(milestonePercent, 5, 25));

        uint256 campaignId = _createCampaign(fundingGoal, true);
        _fundCampaignEth(campaignId, fundingGoal);

        uint256 creatorBalanceBefore = creator.balance;

        // Approve milestone
        _createAndApproveMilestone(campaignId, 1, milestonePercent);

        uint256 creatorBalanceAfter = creator.balance;
        uint256 amountReceived = creatorBalanceAfter - creatorBalanceBefore;

        // Creator should receive FULL percentage (no fee deducted yet)
        uint256 expectedAmount = (fundingGoal * milestonePercent) / 100;
        assertEq(amountReceived, expectedAmount);
    }

    // ============ FUZZ TEST 8: Multiple Contributions Respect Max Limit ============

    function testFuzz_MultipleContributionsRespectMaxLimit(
        uint96 fundingGoal,
        uint8 numContributions
    ) public {
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));
        numContributions = uint8(bound(numContributions, 1, 5));

        uint256 campaignId = _createCampaign(fundingGoal, false);
        
        uint256 maxContribution = (fundingGoal * MAX_CONTRIBUTION_PERCENT) / 10000;
        uint256 contributionPerTx = maxContribution / numContributions;
        
        address contributor = makeAddr("fuzzContributor");
        token.mint(contributor, maxContribution);

        vm.startPrank(contributor);
        token.approve(address(treasury), maxContribution);

        // Make multiple contributions up to max
        for (uint256 i = 0; i < numContributions; i++) {
            trustLock.contribute(campaignId, contributionPerTx);
        }

        vm.stopPrank();

        // Total contribution should be within max limit
        uint256 totalContributed = trustLock.getContribution(campaignId, contributor);
        assertLe(totalContributed, maxContribution);
    }

    // ============ FUZZ TEST 9: Cannot Collect Protocol Fee Twice ============

    function testFuzz_CannotCollectProtocolFeeTwice(uint96 fundingGoal) public {
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));

        uint256 campaignId = _createCampaign(fundingGoal, true);
        _fundCampaignEth(campaignId, fundingGoal);

        // Complete campaign
        _createAndApproveMilestone(campaignId, 1, 10);
        _createAndApproveMilestone(campaignId, 2, 20);
        _createAndApproveMilestone(campaignId, 3, 25);
        _createAndApproveMilestone(campaignId, 4, 25);
        _createAndApproveMilestone(campaignId, 5, 20);

        uint256 feeAfterCompletion = protocolFeeRecipient.balance;

        // Try to collect fee again (should revert)
        vm.expectRevert(TrustLockTreasury.NoFeeToCollect.selector);
        treasury.collectProtocolFee(campaignId);

        // Fee should not change
        assertEq(protocolFeeRecipient.balance, feeAfterCompletion);
    }

    // ============ FUZZ TEST 10: Failed Campaign Enables Full Refunds ============

    function testFuzz_FailedCampaignEnablesFullRefunds(uint96 fundingGoal) public {
        fundingGoal = uint96(bound(fundingGoal, 1 ether, 100 ether));

        uint256 campaignId = _createCampaign(fundingGoal, true);
        _fundCampaignEth(campaignId, fundingGoal);

        // Fail campaign with 3 consecutive rejections (no funds released)
        _createAndRejectMilestone(campaignId, 1, 10);
        _createAndRejectMilestone(campaignId, 2, 10);
        _createAndRejectMilestone(campaignId, 3, 10);

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertEq(uint256(campaign.state), uint256(TrustLockCampaignManager.CampaignState.FAILED));

        // All contributors should get full refunds
        address[] memory contributors = trustLock.getContributors(campaignId);
        
        for (uint256 i = 0; i < contributors.length && i < 10; i++) { // Test first 10
            address contributor = contributors[i];
            uint256 contribution = trustLock.getContribution(campaignId, contributor);
            uint256 balanceBefore = contributor.balance;

            vm.prank(contributor);
            trustLock.claimRefund(campaignId);

            uint256 refundReceived = contributor.balance - balanceBefore;
            
            // Should receive 100% refund (no funds were released)
            assertEq(refundReceived, contribution);
        }
    }

    // ============ UTILITY FUNCTIONS ============

    function _createCampaign(uint256 fundingGoal, bool isEth) internal returns (uint256) {
        vm.prank(creator);
        return trustLock.createCampaign(
            "Test Campaign",
            "Description",
            fundingGoal,
            PROJECT_DURATION,
            isEth,
            address(token)
        );
    }

    function _fundCampaignEth(uint256 campaignId, uint256 fundingGoal) internal {
        uint256 maxContribution = (fundingGoal * MAX_CONTRIBUTION_PERCENT) / 10000;
        uint256 contributorsNeeded = (fundingGoal + maxContribution - 1) / maxContribution;

        uint256 remainingToFund = fundingGoal;
        
        for (uint256 i = 0; i < contributorsNeeded; i++) {
            address contributor = makeAddr(string(abi.encodePacked("contributor", i)));
            
            // Calculate how much this contributor should contribute
            uint256 contributionAmount = remainingToFund >= maxContribution ? maxContribution : remainingToFund;
            
            vm.deal(contributor, contributionAmount);
            vm.prank(contributor);
            trustLock.contribute{value: contributionAmount}(campaignId, 0);
            
            remainingToFund -= contributionAmount;
            
            if (remainingToFund == 0) break;
        }
    }

    function _fundCampaignToken(uint256 campaignId, uint256 fundingGoal) internal {
        uint256 maxContribution = (fundingGoal * MAX_CONTRIBUTION_PERCENT) / 10000;
        uint256 contributorsNeeded = (fundingGoal + maxContribution - 1) / maxContribution;

        uint256 remainingToFund = fundingGoal;
        
        for (uint256 i = 0; i < contributorsNeeded; i++) {
            address contributor = makeAddr(string(abi.encodePacked("contributor", i)));
            
            // Calculate how much this contributor should contribute
            uint256 contributionAmount = remainingToFund >= maxContribution ? maxContribution : remainingToFund;
            
            token.mint(contributor, contributionAmount);
            
            vm.startPrank(contributor);
            token.approve(address(treasury), contributionAmount);
            trustLock.contribute(campaignId, contributionAmount);
            vm.stopPrank();
            
            remainingToFund -= contributionAmount;
            
            if (remainingToFund == 0) break;
        }
    }

    function _createAndApproveMilestone(
        uint256 campaignId,
        uint256 milestoneId,
        uint256 percentage
    ) internal {
        // Create milestone
        vm.prank(creator);
        trustLock.createMilestone(creator, campaignId, string(abi.encodePacked("Milestone ", milestoneId)), percentage);

        // Get contributors and vote (need 25% participation with 67% approval)
        address[] memory contributors = trustLock.getContributors(campaignId);
        uint256 votesNeeded = (contributors.length * 25) / 100 + 1;

        for (uint256 i = 0; i < votesNeeded && i < contributors.length; i++) {
            vm.prank(contributors[i]);
            trustLock.vote(campaignId, milestoneId, true);
        }

        // Wait for voting period to end
        vm.warp(block.timestamp + 7 days + 1);

        // Finalize
        trustLock.finalizeMilestone(campaignId, milestoneId);
    }

    function _createAndRejectMilestone(
        uint256 campaignId,
        uint256 milestoneId,
        uint256 percentage
    ) internal {
        // Create milestone
        vm.prank(creator);
        trustLock.createMilestone(creator, campaignId, string(abi.encodePacked("Milestone ", milestoneId)), percentage);

        // Get contributors and vote against (need 25% participation)
        address[] memory contributors = trustLock.getContributors(campaignId);
        uint256 votesNeeded = (contributors.length * 25) / 100 + 1;

        for (uint256 i = 0; i < votesNeeded && i < contributors.length; i++) {
            vm.prank(contributors[i]);
            trustLock.vote(campaignId, milestoneId, false);
        }

        // Wait for voting period to end
        vm.warp(block.timestamp + 7 days + 1);

        // Finalize
        trustLock.finalizeMilestone(campaignId, milestoneId);
    }
}
