// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";

// Minimal interface so the script compiles without importing your full contract.
interface ITrustLockConfig {
    function updateMultipleParams(
        uint256 _minimumContribution,
        uint256 _maxContributionPercentage,
        uint256 _fundingDuration,
        uint256 _projectMaxDuration,
        uint256 _protocolFeePercent,
        uint256 _votingDuration,
        uint256 _minMilestonePercent,
        uint256 _maxMilestonePercent,
        uint256 _firstMilestoneMax,
        uint256 _majorityThreshold,
        uint256 _maxConsecutiveFailures,
        uint256 _maxTotalFailures
    ) external;

    function setMinTitleLength(uint256 _value) external;
    function setMaxTitleLength(uint256 _value) external;
    function setMinDescriptionLength(uint256 _value) external;
    function setMaxDescriptionLength(uint256 _value) external;
}

contract UpdateTrustLockConfigHackathon is Script {
    function run() external {
        // Env vars:
        // CONFIG_ADDR = deployed TrustLockConfig address
        // PRIVATE_KEY = owner private key (the one that owns the config)
        address configAddr = vm.envAddress("CONFIG_ADDR");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        ITrustLockConfig cfg = ITrustLockConfig(configAddr);

        vm.startBroadcast(pk);

        // Hackathon-fast parameters
        cfg.updateMultipleParams(
            0.001 ether, // minimumContribution
            10000,        // maxContributionPercentage (100%)
            15 minutes,  // fundingDuration
            1 hours,     // projectMaxDuration
            1,           // protocolFeePercent (1%)
            20 minutes,   // votingDuration
            5,           // minMilestonePercent
            25,          // maxMilestonePercent
            10,          // firstMilestoneMax
            51,          // majorityThreshold
            2,           // maxConsecutiveFailures
            3            // maxTotalFailures
        );

        vm.stopBroadcast();
    }
}
