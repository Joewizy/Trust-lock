// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {TrustLockConfig} from "../src/TrustLockConfig.sol";

contract TrustLockConfigTest is Test {
    TrustLockConfig public config;
    address public owner = makeAddr("owner");

    function setUp() public {
        vm.startPrank(owner);
        config = new TrustLockConfig(owner);
    }

    function testInitialState() public view {
        // Test initial values match old constants
        assertEq(config.minimumContribution(), 0.001 ether);
        assertEq(config.maxContributionPercentage(), 200); // 2%
        assertEq(config.fundingDuration(), 4 weeks);
        assertEq(config.projectMaxDuration(), 52 weeks);
        assertEq(config.protocolFeePercent(), 2);

        assertEq(config.votingDuration(), 7 days);
        assertEq(config.minMilestonePercent(), 5);
        assertEq(config.maxMilestonePercent(), 25);
        assertEq(config.firstMilestoneMax(), 10);
        assertEq(config.majorityThreshold(), 51);
        assertEq(config.maxConsecutiveFailures(), 3);
        assertEq(config.maxTotalFailures(), 5);

        assertEq(config.minTitleLength(), 3);
        assertEq(config.maxTitleLength(), 100);
        assertEq(config.minDescriptionLength(), 10);
        assertEq(config.maxDescriptionLength(), 1000);
    }

    function testUpdateProtocolFee() public {
        vm.startPrank(owner);
        
        // Test updating protocol fee
        config.setProtocolFeePercent(5);
        assertEq(config.protocolFeePercent(), 5);

        // Test invalid fee (over 100%)
        vm.expectRevert(TrustLockConfig.InvalidParamValue.selector);
        config.setProtocolFeePercent(101);
    }

    function testUpdateVotingDuration() public {
        vm.startPrank(owner);
        
        // Test updating voting duration
        uint256 newDuration = 14 days;
        config.setVotingDuration(newDuration);
        assertEq(config.votingDuration(), newDuration);

        // Test invalid duration (0)
        vm.expectRevert(TrustLockConfig.InvalidParamValue.selector);
        config.setVotingDuration(0);
    }

    function testUpdateMilestonePercentages() public {
        vm.startPrank(owner);
        
        // Test valid range updates
        config.setMinMilestonePercent(3);
        config.setMaxMilestonePercent(30);
        assertEq(config.minMilestonePercent(), 3);
        assertEq(config.maxMilestonePercent(), 30);

        // Test invalid range (min >= max)
        vm.expectRevert(TrustLockConfig.InvalidRange.selector);
        config.setMinMilestonePercent(31);

        // Test invalid range (max <= min)
        vm.expectRevert(TrustLockConfig.InvalidRange.selector);
        config.setMaxMilestonePercent(2);
    }

    function testBatchUpdate() public {
        vm.startPrank(owner);
        
        // Test batch update
        config.updateMultipleParams(
            0.002 ether,      // minimumContribution
            300,              // maxContributionPercentage (3%)
            5 weeks,          // fundingDuration
            60 weeks,         // projectMaxDuration
            3,                // protocolFeePercent
            14 days,          // votingDuration
            3,                // minMilestonePercent
            30,               // maxMilestonePercent
            15,               // firstMilestoneMax
            60,               // majorityThreshold
            5,                // maxConsecutiveFailures
            7                 // maxTotalFailures
        );

        // Verify all values updated
        assertEq(config.minimumContribution(), 0.002 ether);
        assertEq(config.maxContributionPercentage(), 300);
        assertEq(config.fundingDuration(), 5 weeks);
        assertEq(config.projectMaxDuration(), 60 weeks);
        assertEq(config.protocolFeePercent(), 3);
        assertEq(config.votingDuration(), 14 days);
        assertEq(config.minMilestonePercent(), 3);
        assertEq(config.maxMilestonePercent(), 30);
        assertEq(config.firstMilestoneMax(), 15);
        assertEq(config.majorityThreshold(), 60);
        assertEq(config.maxConsecutiveFailures(), 5);
        assertEq(config.maxTotalFailures(), 7);
    }

    function testOnlyOwnerCanUpdate() public {
        address nonOwner = makeAddr("nonOwner");
        vm.startPrank(nonOwner);
        
        // Test non-owner cannot update
        vm.expectRevert();
        config.setProtocolFeePercent(5);
    }

    function testEventEmission() public {
        vm.startPrank(owner);
        
        // Test event emission
        vm.expectEmit(true, true, true, true);
        emit TrustLockConfig.ParamUpdated("protocolFeePercent", 2, 5);
        
        config.setProtocolFeePercent(5);
    }
}
