// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {TrustLockCampaignManager} from "../src/TrustLockCampaignManager.sol";
import {TrustLockVoting} from "../src/TrustLockVoting.sol";
import {TrustLockCore} from "../src/TrustLockCore.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TrustLockCoreTest is Test {
    TrustLockCore public trustLock;
    MockERC20 public token;

    address public creator = address(0x1);
    address public contributor1 = address(0x2);
    address public contributor2 = address(0x3);
    address public contributor3 = address(0x4);
    address public protocolFeeRecipient = address(0x999);

    uint256 public constant FUNDING_GOAL = 10 ether;
    uint256 public constant PROJECT_DURATION = 30 weeks;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 fundingGoal, bool acceptsETH);
    event ContributionReceived(uint256 indexed campaignId, address indexed contributor, uint256 amount, bool isETH);

    function setUp() public {
        trustLock = new TrustLockCore(protocolFeeRecipient);
        token = new MockERC20();

        // Fund test accounts
        vm.deal(creator, 100 ether);
        vm.deal(contributor1, 100 ether);
        vm.deal(contributor2, 100 ether);
        vm.deal(contributor3, 100 ether);

        token.mint(contributor1, 100 ether);
        token.mint(contributor2, 100 ether);
        token.mint(contributor3, 100 ether);
    }

    // ============ CAMPAIGN CREATION TESTS ============

    function testCreateCampaign() public {
        vm.startPrank(creator);
        
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "This is a test campaign",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        assertEq(campaignId, 1);
        
        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertEq(campaign.creator, creator);
        assertEq(campaign.fundingGoal, FUNDING_GOAL);
        assertTrue(campaign.acceptsETH);
        
        vm.stopPrank();
    }

    function testCannotCreateCampaignWithLowGoal() public {
        vm.startPrank(creator);
        
        vm.expectRevert(TrustLockCampaignManager.FundingGoalTooLow.selector);
        trustLock.createCampaign(
            "Test Campaign",
            "This is a test campaign",
            0.001 ether, // Too low
            PROJECT_DURATION,
            true,
            address(0)
        );
        
        vm.stopPrank();
    }

    function testCannotCreateCampaignWithExcessiveDuration() public {
        vm.startPrank(creator);
        
        vm.expectRevert(TrustLockCampaignManager.ProjectDurationTooLong.selector);
        trustLock.createCampaign(
            "Test Campaign",
            "This is a test campaign",
            FUNDING_GOAL,
            100 weeks, // Too long
            true,
            address(0)
        );
        
        vm.stopPrank();
    }

    // ============ CONTRIBUTION TESTS ============

    function testContributeETH() public {
        // Create campaign
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        // Contribute
        vm.startPrank(contributor1);
        trustLock.contribute{value: 1 ether}(campaignId, 0);
        vm.stopPrank();

        uint256 contribution = trustLock.getContribution(campaignId, contributor1);
        assertEq(contribution, 1 ether);
    }

    function testContributeERC20() public {
        // Create ERC20 campaign
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            false,
            address(token)
        );

        // Approve and contribute
        vm.startPrank(contributor1);
        token.approve(address(trustLock), 2 ether);
        trustLock.contribute(campaignId, 2 ether);
        vm.stopPrank();

        uint256 contribution = trustLock.getContribution(campaignId, contributor1);
        assertEq(contribution, 2 ether);
    }

    function testCannotContributeBelowMinimum() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.startPrank(contributor1);
        vm.expectRevert(TrustLockCampaignManager.ContributionTooLow.selector);
        trustLock.contribute{value: 0.001 ether}(campaignId, 0);
        vm.stopPrank();
    }

    function testCreatorCannotContribute() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.startPrank(creator);
        vm.expectRevert(TrustLockCampaignManager.CreatorCannotContribute.selector);
        trustLock.contribute{value: 1 ether}(campaignId, 0);
        vm.stopPrank();
    }

    function testCampaignBecomesActiveWhenFunded() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        // Contribute full amount
        vm.prank(contributor1);
        trustLock.contribute{value: 5 ether}(campaignId, 0);

        vm.prank(contributor2);
        trustLock.contribute{value: 5 ether}(campaignId, 0);

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertTrue(campaign.state == TrustLockCampaignManager.CampaignState.ACTIVE);
    }

    // ============ MILESTONE TESTS ============

    function testCreateMilestone() public {
        // Setup funded campaign
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: FUNDING_GOAL}(campaignId, 0);

        // Create milestone
        vm.prank(creator);
        trustLock.createMilestone(campaignId, "First milestone completed", 10);

        TrustLockVoting.Milestone memory milestone = trustLock.getMilestone(campaignId, 1);
        assertEq(milestone.fundingPercentage, 10);
        assertTrue(milestone.state == TrustLockVoting.MilestoneState.PENDING);
    }

    function testCannotCreateMilestoneIfNotCreator() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: FUNDING_GOAL}(campaignId, 0);

        vm.prank(contributor1);
        vm.expectRevert(TrustLockVoting.NotCampaignCreator.selector);
        trustLock.createMilestone(campaignId, "Milestone", 10);
    }

    function testFirstMilestoneCannotExceed10Percent() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: FUNDING_GOAL}(campaignId, 0);

        vm.prank(creator);
        vm.expectRevert(TrustLockVoting.InvalidMilestonePercentage.selector);
        trustLock.createMilestone(campaignId, "Too big milestone", 15);
    }

    // ============ VOTING TESTS ============

    function testVoteOnMilestone() public {
        // Setup
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: 5 ether}(campaignId, 0);

        vm.prank(contributor2);
        trustLock.contribute{value: 5 ether}(campaignId, 0);

        vm.prank(creator);
        trustLock.createMilestone(campaignId, "First milestone", 10);

        // Wait for voting to start
        vm.warp(block.timestamp + 2 days + 1);

        // Vote
        vm.prank(contributor1);
        trustLock.vote(campaignId, 1, true);

        TrustLockVoting.Milestone memory milestone = trustLock.getMilestone(campaignId, 1);
        assertEq(milestone.votesFor, 1);
    }

    function testNonContributorCannotVote() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: FUNDING_GOAL}(campaignId, 0);

        vm.prank(creator);
        trustLock.createMilestone(campaignId, "Milestone", 10);

        vm.warp(block.timestamp + 2 days + 1);

        vm.prank(contributor2); // Didn't contribute
        vm.expectRevert(TrustLockVoting.NotAContributor.selector);
        trustLock.vote(campaignId, 1, true);
    }

    function testCannotVoteTwice() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: FUNDING_GOAL}(campaignId, 0);

        vm.prank(creator);
        trustLock.createMilestone(campaignId, "Milestone", 10);

        vm.warp(block.timestamp + 2 days + 1);

        vm.startPrank(contributor1);
        trustLock.vote(campaignId, 1, true);
        
        vm.expectRevert(TrustLockVoting.AlreadyVoted.selector);
        trustLock.vote(campaignId, 1, true);
        vm.stopPrank();
    }

    // ============ MILESTONE FINALIZATION TESTS ============

    function testFinalizeMilestoneApproved() public {
        // Setup
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        // Three contributors
        vm.prank(contributor1);
        trustLock.contribute{value: 4 ether}(campaignId, 0);

        vm.prank(contributor2);
        trustLock.contribute{value: 3 ether}(campaignId, 0);

        vm.prank(contributor3);
        trustLock.contribute{value: 3 ether}(campaignId, 0);

        vm.prank(creator);
        trustLock.createMilestone(campaignId, "Milestone", 10);

        vm.warp(block.timestamp + 2 days + 1);

        // All vote yes
        vm.prank(contributor1);
        trustLock.vote(campaignId, 1, true);

        vm.prank(contributor2);
        trustLock.vote(campaignId, 1, true);

        vm.prank(contributor3);
        trustLock.vote(campaignId, 1, true);

        // Wait for voting to end
        vm.warp(block.timestamp + 7 days + 1);

        uint256 creatorBalanceBefore = creator.balance;

        // Finalize
        trustLock.finalizeMilestone(campaignId, 1);

        TrustLockVoting.Milestone memory milestone = trustLock.getMilestone(campaignId, 1);
        assertTrue(milestone.state == TrustLockVoting.MilestoneState.APPROVED);

        // Check funds released (10% of 10 ETH = 1 ETH, minus 2% fee)
        uint256 expectedAmount = (1 ether * 98) / 100; // 0.98 ETH
        assertEq(creator.balance - creatorBalanceBefore, expectedAmount);
    }

    function testFinalizeMilestoneRejected() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: 5 ether}(campaignId, 0);

        vm.prank(contributor2);
        trustLock.contribute{value: 5 ether}(campaignId, 0);

        vm.prank(creator);
        trustLock.createMilestone(campaignId, "Milestone", 10);

        vm.warp(block.timestamp + 2 days + 1);

        // Both vote no
        vm.prank(contributor1);
        trustLock.vote(campaignId, 1, false);

        vm.prank(contributor2);
        trustLock.vote(campaignId, 1, false);

        vm.warp(block.timestamp + 7 days + 1);

        trustLock.finalizeMilestone(campaignId, 1);

        TrustLockVoting.Milestone memory milestone = trustLock.getMilestone(campaignId, 1);
        assertTrue(milestone.state == TrustLockVoting.MilestoneState.REJECTED);
    }

    // ============ REFUND TESTS ============

    function testClaimRefundOnFailedCampaign() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: 5 ether}(campaignId, 0);

        // Wait past funding deadline
        vm.warp(block.timestamp + 4 weeks + 1);

        uint256 balanceBefore = contributor1.balance;

        vm.prank(contributor1);
        trustLock.claimRefund(campaignId);

        assertEq(contributor1.balance - balanceBefore, 5 ether);
    }

    function testClaimRefundAfterMultipleRejections() public {
        vm.prank(creator);
        uint256 campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            true,
            address(0)
        );

        vm.prank(contributor1);
        trustLock.contribute{value: FUNDING_GOAL}(campaignId, 0);

        // Create and reject 3 milestones
        for (uint256 i = 1; i <= 3; i++) {
            vm.prank(creator);
            trustLock.createMilestone(campaignId, "Milestone", 10);

            vm.warp(block.timestamp + 2 days + 1);

            vm.prank(contributor1);
            trustLock.vote(campaignId, i, false);

            vm.warp(block.timestamp + 7 days + 1);

            trustLock.finalizeMilestone(campaignId, i);
        }

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertTrue(campaign.state == TrustLockCampaignManager.CampaignState.FAILED);

        uint256 balanceBefore = contributor1.balance;

        vm.prank(contributor1);
        trustLock.claimRefund(campaignId);

        assertEq(contributor1.balance - balanceBefore, FUNDING_GOAL);
    }
}
