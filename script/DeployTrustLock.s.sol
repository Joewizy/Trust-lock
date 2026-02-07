// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {TrustLockDeployment} from "../lib/TrustLockDeployment.sol";

/**
 * @title DeployTrustLock
 * @notice Production deployment script for TrustLock protocol
 * @dev Usage: forge script script/DeployTrustLock.s.sol --rpc-url <RPC> --broadcast --verify
 */
contract DeployTrustLock is Script {
    using TrustLockDeployment for TrustLockDeployment.Contracts;

    function run() external {
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get protocol fee recipient from env (or use deployer as default)
        address protocolFeeRecipient = vm.envOr("PROTOCOL_FEE_RECIPIENT", deployer);

        console.log("===========================================");
        console.log("TrustLock Protocol Deployment");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Protocol Fee Recipient:", protocolFeeRecipient);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy using the library
        TrustLockDeployment.Contracts memory trustLock = 
            TrustLockDeployment.deployDefault(protocolFeeRecipient);

        vm.stopBroadcast();

        _logDeployment(trustLock);

        // Verify integrity
        require(
            TrustLockDeployment.verifyIntegrity(trustLock),
            "Deployment integrity check failed"
        );

        // Save deployment info to JSON
        _saveDeploymentInfo(trustLock, deployer, protocolFeeRecipient);

        console.log("");
        console.log("Deployment verified successfully!");
    }

    function _logDeployment(TrustLockDeployment.Contracts memory trustLock) internal view {
        console.log("===========================================");
        console.log("Deployed Contracts");
        console.log("===========================================");
        console.log("TrustLockCore:", address(trustLock.core));
        console.log("CampaignManager:", address(trustLock.campaignManager));
        console.log("Voting:", address(trustLock.voting));
        console.log("Treasury:", address(trustLock.treasury));
        console.log("===========================================");
    }

    function _saveDeploymentInfo(
        TrustLockDeployment.Contracts memory trustLock,
        address deployer,
        address protocolFeeRecipient
    ) internal {
        // Create deployment info object
        string memory deploymentInfo = stdJson.serialize(
            "deployment",
            string(
                abi.encodePacked(
                    "{",
                    '"network":"', vm.toString(block.chainid), '",',
                    '"deployer":"', vm.toString(deployer), '",',
                    '"trustLockCore":"', vm.toString(address(trustLock.core)), '",',
                    '"campaignManager":"', vm.toString(address(trustLock.campaignManager)), '",',
                    '"voting":"', vm.toString(address(trustLock.voting)), '",',
                    '"treasury":"', vm.toString(address(trustLock.treasury)), '",',
                    '"protocolFeeRecipient":"', vm.toString(protocolFeeRecipient), '",',
                    '"blockNumber":', vm.toString(block.number), ',',
                    '"timestamp":', vm.toString(block.timestamp), ',',
                    '"deployedAt":"', vm.toString(block.timestamp), '"',
                    "}"
                )
            )
        );

        // Write deployment info to file
        vm.writeFile("./deployments/deployment.json", deploymentInfo);
        console.log("Deployment info saved to: ./deployments/deployment.json");
    }
}
