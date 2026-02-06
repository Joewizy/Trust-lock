// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {TrustLockCampaignManager} from "../src/TrustLockCampaignManager.sol";
import {TrustLockVoting} from "../src/TrustLockVoting.sol";
import {TrustLockCore} from "../src/TrustLockCore.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, 100_000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TrustLockCoreTest is Test {
    TrustLockCore public trustLock;
    MockERC20 public token;

    address creator = makeAddr("creator");
    address contributor1 = makeAddr("contributor1");
    address contributor2 = makeAddr("contributor2");
    address contributor3 = makeAddr("contributor3");
    address protocolFeeRecipient = makeAddr("protocolFeeRecipient");

    uint256 initialContribution = 0.001 ether;
    uint256 public constant FUNDING_GOAL = 10 ether;
    uint256 public constant PROJECT_DURATION = 30 weeks;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 fundingGoal, bool acceptsEth);
    event ContributionReceived(uint256 indexed campaignId, address indexed contributor, uint256 amount, bool isEth);

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
        token.mint(creator, 100 ether); // Give creator tokens for testing

        trustLock.addAcceptedToken(address(token));
    }

    function testGetAllContracts() public view {
        console.logString("Contract addresses:");
        (address cm, address v, address t) = trustLock.getContractAddresses();
        console.logString("CampaignManager:");
        console.logAddress(cm);
        console.logString("Voting:");
        console.logAddress(v);
        console.logString("Treasury:");
        console.logAddress(t);
    }

    // ============ CAMPAIGN CREATION TESTS ============

    function testCreateCampaign() public {
        uint256 campaignId = _createCampaign(false);

        assertEq(campaignId, 1);
        
        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertEq(campaign.creator, creator);
        assertEq(campaign.fundingGoal, FUNDING_GOAL);
        assertFalse(campaign.acceptsEth);
        assertEq(campaign.acceptedToken, address(token));
    }

    function testCannotCreateCampaignWithLowGoal() public {
        vm.startPrank(creator);
        
        vm.expectRevert(TrustLockCampaignManager.FundingGoalTooLow.selector);
        trustLock.createCampaign(
            "Test Campaign",
            "This is a test campaign",
            0.0001 ether, 
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
        uint256 campaignId = _createCampaign(true);

        // Contribute
        vm.startPrank(contributor1);
        token.approve(address(trustLock.treasury()), initialContribution);
        trustLock.contribute{value: initialContribution}(campaignId, 0);
        vm.stopPrank();

        uint256 contribution = trustLock.getContribution(campaignId, contributor1);
        assertEq(contribution, initialContribution);
    }

    function testContributeERC20() public {
        uint256 campaignId = _createCampaign(false);

        // Approve and contribute
        vm.startPrank(contributor1);
        token.approve(address(trustLock.treasury()), initialContribution);
        trustLock.contribute(campaignId, initialContribution);
        vm.stopPrank();

        uint256 contribution = trustLock.getContribution(campaignId, contributor1);
        assertEq(contribution, initialContribution);
    }

    function testCannotContributeBelowMinimum() public {
        uint256 campaignId = _createCampaign(false);

        vm.startPrank(contributor1);
        token.approve(address(trustLock.treasury()), 0.0005 ether);
        vm.expectRevert(TrustLockCampaignManager.ContributionTooLow.selector);
        trustLock.contribute(campaignId, 0.0005 ether);
        vm.stopPrank();
    }

    function testCreatorCannotContribute() public {
        uint256 campaignId = _createCampaign(false);

        vm.startPrank(creator);
        token.approve(address(trustLock.treasury()), initialContribution);
        vm.expectRevert(TrustLockCampaignManager.CreatorCannotContribute.selector);
        trustLock.contribute(campaignId, initialContribution);
        vm.stopPrank();
    }

    function testCampaignBecomesActiveWhenFunded() public {
        uint256 campaignId = _createCampaign(false);

        // Contribute full amount using tokens
        for (uint i = 0; i < 50; i++) {
            address contributor = makeAddr(string(abi.encodePacked("contributor", i)));
            token.mint(contributor, 0.2 ether);
            vm.startPrank(contributor);
            token.approve(address(trustLock.treasury()), 0.2 ether); 
            trustLock.contribute(campaignId, 0.2 ether);
            vm.stopPrank();
        }

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertTrue(campaign.state == TrustLockCampaignManager.CampaignState.ACTIVE);
    }

    // ============ MILESTONE TESTS ============

    function testCreateMilestone() public {
        // Setup funded campaign
        uint256 campaignId = _createCampaign(false);
        _fundCampaign(campaignId, false);

        // Create milestone
        vm.prank(creator);
        trustLock.createMilestone(creator, campaignId, "First milestone completed", 10);

        TrustLockVoting.Milestone memory milestone = trustLock.getMilestone(campaignId, 1);
        assertEq(milestone.fundingPercentage, 10);
        assertTrue(milestone.state == TrustLockVoting.MilestoneState.VOTING);
    }

    function testCannotCreateMilestoneIfNotCreator() public {
        uint256 campaignId = _createCampaign(true); 
        _fundCampaign(campaignId, true);

        vm.prank(contributor1);
        vm.expectRevert(TrustLockVoting.NotCampaignCreator.selector);
        trustLock.createMilestone(creator, campaignId, "Milestone", 10);
    }

    function testFirstMilestoneCannotExceed10Percent() public {
        uint256 campaignId = _createCampaign(false);
        _fundCampaign(campaignId, false);

        vm.prank(creator);
        vm.expectRevert(TrustLockVoting.InvalidMilestonePercentage.selector);
        trustLock.createMilestone(creator, campaignId, "Too big milestone", 15);
    }

    // ============ VOTING TESTS ============

    function testVoteOnMilestone() public {
        // Setup
        uint256 campaignId = _createCampaign(false);
        _fundCampaign(campaignId, false);

        vm.prank(creator);
        trustLock.createMilestone(creator, campaignId, "First milestone", 10);

        // Vote with first contributor
        address[] memory contributors = trustLock.getContributors(campaignId);
        vm.prank(contributors[0]);
        trustLock.vote(campaignId, 1, true);

        TrustLockVoting.Milestone memory milestone = trustLock.getMilestone(campaignId, 1);
        assertEq(milestone.votesFor, 1);
    }

    function testNonContributorCannotVote() public {
        uint256 campaignId = _createCampaign(false);
        _fundCampaign(campaignId, false);

        vm.prank(creator);
        trustLock.createMilestone(creator, campaignId, "Milestone", 10);

        vm.prank(contributor2); // Didn't contribute
        vm.expectRevert(TrustLockVoting.NotAContributor.selector);
        trustLock.vote(campaignId, 1, true);
    }

    function testCannotVoteTwice() public {
        uint256 campaignId = _createCampaign(true);
        _fundCampaign(campaignId, true);

        vm.prank(creator);
        trustLock.createMilestone(creator, campaignId, "Milestone", 10);

        vm.warp(block.timestamp + 2 days + 1);
        address firstContributor = trustLock.getContributors(campaignId)[0];
        vm.startPrank(firstContributor);
        trustLock.vote(campaignId, 1, true);
        
        vm.expectRevert(TrustLockVoting.AlreadyVoted.selector);
        trustLock.vote(campaignId, 1, false);
        vm.stopPrank();
    }

    // ============ MILESTONE FINALIZATION TESTS ============

    function testFinalizeMilestoneApproved() public {
        uint256 campaignId = _createCampaign(false);
        _fundCampaign(campaignId, false);

        vm.prank(creator);
        trustLock.createMilestone(creator, campaignId, "Milestone", 10);

        vm.warp(block.timestamp + 2 days + 1);

        // Need at least 25% participation: 50 contributors * 25% = 13 votes
        address[] memory contributors = trustLock.getContributors(campaignId);
        for (uint256 i = 0; i < 13 && i < contributors.length; i++) {
            vm.prank(contributors[i]);
            trustLock.vote(campaignId, 1, true);
        }

        // Wait for voting to end
        vm.warp(block.timestamp + 7 days + 1);

        
        // Finalize
        trustLock.finalizeMilestone(campaignId, 1);

        TrustLockVoting.Milestone memory milestone = trustLock.getMilestone(campaignId, 1);
        assertTrue(milestone.state == TrustLockVoting.MilestoneState.APPROVED);

        // Check funds released (10% of 10 ETH = 1 ETH, minus 2% fee)

        vm.prank(creator);
        trustLock.createMilestone(creator, campaignId, "Milestone", 10);

        vm.warp(block.timestamp + 2 days + 1);

        // Get fresh contributors for second milestone
        address[] memory contributors2 = trustLock.getContributors(campaignId);
        // Use different contributors for second milestone voting
        for (uint256 i = 13; i < 15 && i < contributors2.length; i++) {
            vm.prank(contributors2[i]);
            trustLock.vote(campaignId, 2, false);
        }

        vm.warp(block.timestamp + 7 days + 1);

        trustLock.finalizeMilestone(campaignId, 2);

        TrustLockVoting.Milestone memory milestone2 = trustLock.getMilestone(campaignId, 2);
        assertTrue(milestone2.state == TrustLockVoting.MilestoneState.REJECTED);
    }

    // ============ REFUND TESTS ============

    function testClaimRefundOnFailedCampaign() public {
        uint256 campaignId = _createCampaign(true);

        vm.startPrank(contributor1);
        trustLock.contribute{value: 0.1 ether}(campaignId, 0);
        vm.stopPrank();

        // Wait past funding deadline
        vm.warp(block.timestamp + 4 weeks + 1);

        uint256 balanceBefore = contributor1.balance;

        vm.prank(contributor1);
        trustLock.claimRefund(campaignId);

        assertEq(contributor1.balance - balanceBefore, 0.1 ether);
    }

    function testClaimRefundAfterMultipleRejections() public {
        uint256 campaignId = _createCampaign(false);
        _fundCampaign(campaignId, false);

        // Create and reject 3 milestones
        for (uint256 i = 1; i <= 3; i++) {
            vm.prank(creator);
            trustLock.createMilestone(creator, campaignId, "Milestone", 10);

            address voter = makeAddr(string(abi.encodePacked("contributor", uint256(0))));
            vm.prank(voter);
            trustLock.vote(campaignId, i, false);

            vm.warp(block.timestamp + 7 days + 1);
            vm.prank(creator);
            trustLock.finalizeMilestone(campaignId, i);
        }

        (TrustLockCampaignManager.Campaign memory campaign) = trustLock.getCampaign(campaignId);
        assertTrue(campaign.state == TrustLockCampaignManager.CampaignState.FAILED);

        address firstContributor = trustLock.getContributors(campaignId)[0];
        uint256 balanceBefore = token.balanceOf(firstContributor);

        vm.prank(firstContributor);
        trustLock.claimRefund(campaignId);

        uint256 maxContribution = (FUNDING_GOAL * 200) / 10000; // 2% max contribution
        assertEq(token.balanceOf(firstContributor) - balanceBefore, maxContribution);
    }

    function _createCampaign(bool isEth) internal returns (uint256 campaignId) {
        vm.prank(creator);
        campaignId = trustLock.createCampaign(
            "Test Campaign",
            "Description",
            FUNDING_GOAL,
            PROJECT_DURATION,
            isEth,
            address(token)
        );
    }

    function _fundCampaign(uint256 campaignId, bool isEth) internal {
        // Fund campaign with multiple contributors respecting max contribution limit
        uint256 maxContribution = (FUNDING_GOAL * 200) / 10000; // 2% max contribution
        uint256 contributorsNeeded = (FUNDING_GOAL + maxContribution - 1) / maxContribution;
        
        for (uint i = 0; i < contributorsNeeded; i++) {
            address contributor = makeAddr(string(abi.encodePacked("contributor", i)));
            
            if (isEth) {
                vm.deal(contributor, maxContribution);
                vm.prank(contributor);
                trustLock.contribute{value: maxContribution}(campaignId, 0);
            } else {
                token.mint(contributor, maxContribution);
                vm.startPrank(contributor);
                token.approve(address(trustLock.treasury()), maxContribution);
                trustLock.contribute(campaignId, maxContribution);
                vm.stopPrank();
            }
        }
    }
}
