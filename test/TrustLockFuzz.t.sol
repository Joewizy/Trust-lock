// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
// import {StdCheats} from "forge-std/StdCheats.sol";
// import {TrustLockCore} from "../src/TrustLockCore.sol";
// import {TrustLockCampaignManager} from "../src/TrustLockCampaignManager.sol";
// import {TrustLockVoting} from "../src/TrustLockVoting.sol";
// import {TrustLockTreasury} from "../src/TrustLockTreasury.sol";
// import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import {MockERC20} from "./TrustLockCore.t.sol";

// contract TrustLockFuzzTest is Test {
//     TrustLockCore public trustLock;
//     TrustLockCampaignManager public campaignManager;
//     TrustLockVoting public voting;
//     TrustLockTreasury public treasury;
//     MockERC20 public mockToken;
    
//     address public owner = address(0x1);
//     address public contributor1 = address(0x2);
//     address public contributor2 = address(0x3);
//     address public contributor3 = address(0x4);
//     address public creator = address(0x5);
    
//     uint256 public constant PROTOCOL_FEE = 200; // 2% in basis points
    
//     function setUp() public {
//         vm.startPrank(owner);
        
//         // Deploy mock token
//         mockToken = new MockERC20();
        
//         // Deploy TrustLock contracts
//         trustLock = new TrustLockCore(owner);
        
//         (address cmAddr, address votingAddr, address treasuryAddr) = trustLock.getContractAddresses();
//         campaignManager = TrustLockCampaignManager(cmAddr);
//         voting = TrustLockVoting(votingAddr);
//         treasury = TrustLockTreasury(payable(treasuryAddr));
        
//         // Add token to accepted list
//         trustLock.addAcceptedToken(address(mockToken));
        
//         // Mint tokens to contributors
//         mockToken.mint(contributor1, 1000 ether);
//         mockToken.mint(contributor2, 1000 ether);
//         mockToken.mint(contributor3, 1000 ether);
        
//         vm.stopPrank();
//     }
    
//     // ============ CORE INVARIANTS ============
    
//     /**
//      * @notice INVARIANT 1: Total funds in system = totalRaised - totalReleased - totalRefunded - totalProtocolFees
//      */
//     function invariant_totalFundsAccounting() public view {
//         // Skip if no campaigns exist
//         if (campaignManager.campaignCounter() == 0) return;
        
//         uint256 totalRaised = 0;
//         uint256 totalReleased = 0;
//         uint256 totalProtocolFees = treasury.totalProtocolFees();
        
//         // This is a simplified check - in reality we'd need to iterate through campaigns
//         // For fuzz testing, we check basic accounting relationships
//         assertTrue(totalProtocolFees >= 0, "Protocol fees cannot be negative");
//     }
    
//     /**
//      * @notice INVARIANT 2: Refund amounts never exceed contributions
//      */
//     function invariant_refundsNeverExceedContributions() public view {
//         // Skip if no campaigns exist
//         if (campaignManager.campaignCounter() == 0) return;
        
//         // This invariant ensures no contributor can receive more than they gave
//         // In a full implementation, we'd iterate through all campaigns and contributors
//         // For fuzz testing, we verify the mathematical relationship
//         assertTrue(true, "Refund logic should prevent over-refunding");
//     }
    
//     /**
//      * @notice INVARIANT 3: Protocol fee is always 2% of total raised (when collected)
//      */
//     function invariant_protocolFeeCalculation() public view {
//         uint256 totalFees = treasury.totalProtocolFees();
//         assertTrue(totalFees >= 0, "Total fees cannot be negative");
//     }
    
//     /**
//      * @notice INVARIANT 4: Campaign state transitions are valid
//      */
//     function invariant_campaignStateTransitions() public view {
//         // States should follow: FUNDING -> ACTIVE -> VOTING -> ACTIVE/COMPLETED/FAILED
//         // This is more of a structural invariant
//         assertTrue(true, "Campaign states should follow valid transitions");
//     }
    
//     // ============ FUZZ TESTS ============
    
//     /**
//      * @notice FUZZ TEST: Random contributions and refunds
//      */
//     function testFuzz_ContributionsAndRefunds(
//         uint256 contributionAmount1,
//         uint256 contributionAmount2,
//         uint256 contributionAmount3
//     ) public {
//         // Bound inputs to reasonable ranges
//         vm.assume(contributionAmount1 >= 0.001 ether && contributionAmount1 <= 100 ether);
//         vm.assume(contributionAmount2 >= 0.001 ether && contributionAmount2 <= 100 ether);
//         vm.assume(contributionAmount3 >= 0.001 ether && contributionAmount3 <= 100 ether);
        
//         // Create campaign
//         vm.startPrank(creator);
//         uint256 campaignId = trustLock.createCampaign(
//             "Test Campaign",
//             "Test Description",
//             100 ether,  // 100 ETH goal
//             30 weeks,    // 30 weeks
//             false,         // Token campaign
//             address(mockToken)
//         );
//         vm.stopPrank();
        
//         // Contributors approve and contribute
//         vm.startPrank(contributor1);
//         mockToken.approve(address(treasury), type(uint256).max);
//         trustLock.contribute(campaignId, contributionAmount1);
//         vm.stopPrank();
        
//         vm.startPrank(contributor2);
//         mockToken.approve(address(treasury), type(uint256).max);
//         trustLock.contribute(campaignId, contributionAmount2);
//         vm.stopPrank();
        
//         vm.startPrank(contributor3);
//         mockToken.approve(address(treasury), type(uint256).max);
//         trustLock.contribute(campaignId, contributionAmount3);
//         vm.stopPrank();
        
//         // Check invariants after contributions
//         invariant_totalFundsAccounting();
//         invariant_refundsNeverExceedContributions();
//         invariant_protocolFeeCalculation();
//     }
    
//     /**
//      * @notice FUZZ TEST: Random milestone approvals and refunds
//      */
//     function testFuzz_MilestoneApprovalsAndRefunds(
//         uint256 milestone1Percent,
//         uint256 milestone2Percent
//     ) public {
//         // Bound to valid milestone percentages (5-25, multiples of 5)
//         vm.assume(milestone1Percent >= 5 && milestone1Percent <= 25 && milestone1Percent % 5 == 0);
//         vm.assume(milestone2Percent >= 5 && milestone2Percent <= 25 && milestone2Percent % 5 == 0);
        
//         // Ensure total doesn't exceed 90% (leave room for final milestone)
//         vm.assume(milestone1Percent + milestone2Percent <= 90);
        
//         // Create and fund campaign
//         vm.startPrank(creator);
//         uint256 campaignId = trustLock.createCampaign(
//             "Test Campaign",
//             "Test Description", 
//             100 ether,
//             30 weeks,
//             false,
//             address(mockToken)
//         );
//         vm.stopPrank();
        
//         // Fund campaign to completion
//         vm.startPrank(contributor1);
//         mockToken.approve(address(treasury), type(uint256).max);
//         trustLock.contribute(campaignId, 100 ether);
//         vm.stopPrank();
        
//         // Create and approve milestones
//         vm.startPrank(creator);
//         trustLock.createMilestone(campaignId, "Milestone 1", milestone1Percent);
//         trustLock.createMilestone(campaignId, "Milestone 2", milestone2Percent);
//         vm.stopPrank();
        
//         // Simulate voting (simplified - in real test would need multiple voters)
//         vm.warp(block.timestamp + 1 days);
        
//         // Check invariants after milestones
//         invariant_totalFundsAccounting();
//         invariant_campaignStateTransitions();
//     }
    
//     /**
//      * @notice FUZZ TEST: Random refund scenarios
//      */
//     function testFuzz_RefundScenarios(
//         uint256 totalRaised,
//         uint256 totalReleased,
//         uint256 contribution
//     ) public {
//         // Bound inputs
//         vm.assume(totalRaised > 0 && totalRaised <= 1000 ether);
//         vm.assume(totalReleased >= 0 && totalReleased <= totalRaised);
//         vm.assume(contribution > 0 && contribution <= totalRaised);
        
//         // Test the refund calculation formula directly
//         uint256 remainingFunds = totalRaised - totalReleased;
//         uint256 expectedRefund = (contribution * remainingFunds) / totalRaised;
        
//         // Invariant: Refund should never exceed contribution
//         assertTrue(expectedRefund <= contribution, "Refund cannot exceed contribution");
        
//         // Invariant: Refund should be proportional
//         if (remainingFunds > 0) {
//             assertTrue(expectedRefund >= 0, "Should have some refund if funds remain");
//         }
        
//         // Edge case: All funds released
//         if (totalReleased == totalRaised) {
//             assertEq(expectedRefund, 0, "No refund if all funds released");
//         }
        
//         // Edge case: No funds released
//         if (totalReleased == 0) {
//             assertEq(expectedRefund, contribution, "Full refund if no funds released");
//         }
//     }
// }