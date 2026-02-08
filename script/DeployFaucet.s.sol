// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {TrustLockFaucetToken} from "../src/Faucet.sol";

/**
 * @title DeployFaucet
 * @notice Deployment script for TrustLock Faucet token
 * @dev Usage: forge script script/DeployFaucet.s.sol --rpc-url <RPC> --broadcast --verify
 */
contract DeployFaucet is Script {
    function run() external {
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get faucet parameters from environment variables or use defaults
        uint256 faucetAmount = vm.envOr("FAUCET_AMOUNT", uint256(100 * 10**18)); // 100 tokens default
        uint256 cooldown = vm.envOr("FAUCET_COOLDOWN", uint256(24 hours)); // 24 hours default

        console.log("===========================================");
        console.log("TrustLock Faucet Deployment");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        uint256 cooldownHours = cooldown / 3600;
        uint256 faucetAmountTokens = faucetAmount / 10**18;
        console.log("Faucet Amount:", faucetAmountTokens);
        console.log("Tokens");
        console.log("Cooldown:", cooldown);
        console.log("Seconds (", cooldownHours, " hours)");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the faucet token
        TrustLockFaucetToken faucet = new TrustLockFaucetToken(
            faucetAmount,
            cooldown
        );

        vm.stopBroadcast();

        _logDeployment(faucet);
        _saveDeploymentInfo(faucet, deployer, faucetAmount, cooldown);
    }

    function _logDeployment(TrustLockFaucetToken faucet) internal view {
        console.log("===========================================");
        console.log("Deployed Contract");
        console.log("===========================================");
        console.log("TrustLockFaucetToken:", address(faucet));
        console.log("Token Name:", faucet.name());
        console.log("Token Symbol:", faucet.symbol());
        uint256 faucetAmountTokens = faucet.faucetAmount() / 10**18;
        console.log("Faucet Amount:", faucetAmountTokens);
        console.log("Tokens");
        uint256 cooldownHours = faucet.cooldown() / 3600;
        console.log("Cooldown:", faucet.cooldown());
        console.log("Seconds (", cooldownHours, " hours)");
        console.log("===========================================");
    }

    function _saveDeploymentInfo(
        TrustLockFaucetToken faucet,
        address deployer,
        uint256 faucetAmount,
        uint256 cooldown
    ) internal {
        // Create new deployment info with faucet data added
        string memory updatedDeployment = stdJson.serialize(
            "deployment",
            string(
                abi.encodePacked(
                    "{",
                    '"network":"11155111",',
                    '"deployer":"', vm.toString(deployer), '",',
                    '"trustLockCore":"0xfA72e7FbD07ab4D3Ec1D15320fBb4b51606c1Ac0",', 
                    '"campaignManager":"0xBD39A53be24457FE50f6D4F7a889f0E4f9Bb1Dcd",', 
                    '"voting":"0xf1013F2aCd7CEDB3fa0E5175e807C34A6981A5C0",', 
                    '"treasury":"0x586a61210a9a89C1B148C235Af3Ad94e671D8Ec5",', 
                    '"protocolFeeRecipient":"', vm.toString(deployer), '",',
                    '"faucetToken":"', vm.toString(address(faucet)), '",',
                    '"faucetAmount":"', vm.toString(faucetAmount), '",',
                    '"faucetCooldown":"', vm.toString(cooldown), '",',
                    '"faucetTokenName":"', faucet.name(), '",',
                    '"faucetTokenSymbol":"', faucet.symbol(), '",',
                    '"blockNumber":', vm.toString(block.number), ',',
                    '"timestamp":', vm.toString(block.timestamp), ',',
                    '"deployedAt":"', vm.toString(block.timestamp), '"',
                    "}"
                )
            )
        );

        // Write updated deployment info to file
        vm.writeFile("./deployments/deployment.json", updatedDeployment);
        console.log("Faucet deployment info added to: ./deployments/deployment.json");
    }
}
