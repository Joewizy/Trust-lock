// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TrustLockCore.sol";


contract DeployTrustLock is Script {
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying TrustLock from:", deployer);
        console.log("Deployer balance:", deployer.balance);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Set protocol fee recipient (can be changed to DAO/multisig later)
        address protocolFeeRecipient = deployer; // Change this for production

        // Deploy main contract
        TrustLockCore trustLock = new TrustLockCore(protocolFeeRecipient);

        console.log("TrustLockCore deployed at:", address(trustLock));
        console.log("Protocol fee recipient:", protocolFeeRecipient);
        
        // Get contract addresses from modular system
        (address campaignManager, address voting, address treasury) = trustLock.getContractAddresses();
        console.log("CampaignManager deployed at:", campaignManager);
        console.log("Voting deployed at:", voting);
        console.log("Treasury deployed at:", treasury);

        vm.stopBroadcast();

        // Log deployment info
        console.log("\n=== Deployment Complete ===");
        console.log("Contract address:", address(trustLock));
        console.log("Block number:", block.number);
        console.log("Timestamp:", block.timestamp);
    }
}
