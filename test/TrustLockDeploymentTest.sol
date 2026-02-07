// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {TrustLockDeployment} from "../lib/TrustLockDeployment.sol";

contract TrustLockDeploymentTest is Test {
    using TrustLockDeployment for TrustLockDeployment.Contracts;
    
    TrustLockDeployment.Contracts public deployed;
    address deployer = makeAddr("deployer");
    address protocolFeeRecipient = makeAddr("protocolFeeRecipient");

    function setUp() public {
        vm.startPrank(deployer);
        vm.deal(deployer, 100 ether);
    }

    function testCorrectDeploymentWorkflow() public {
        console.log("=== Testing Correct Deployment Workflow ===");
        
        // Deploy using library
        deployed = TrustLockDeployment.deployDefault(protocolFeeRecipient);
        
        console.log("1. TrustLockCore deployed at:", address(deployed.core));
        console.log("2. CampaignManager deployed at:", address(deployed.campaignManager));
        console.log("3. Voting deployed at:", address(deployed.voting));
        console.log("4. Treasury deployed at:", address(deployed.treasury));
        console.log("5. All contracts initialized and ownership transferred");
        
        // Verify deployment
        require(
            TrustLockDeployment.verifyIntegrity(deployed),
            "Deployment integrity check failed"
        );
        console.log("All deployment checks passed!");
    }

    function testGetAllContracts() public {
        testCorrectDeploymentWorkflow();
        
        console.log("\n=== Contract Addresses ===");
        (address cm, address v, address t) = deployed.core.getContractAddresses();
        console.log("CampaignManager:", cm);
        console.log("Voting:", v);
        console.log("Treasury:", t);
    }
}
