// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {TrustLockCore} from "../src/TrustLockCore.sol";
import {TrustLockCampaignManager} from "../src/TrustLockCampaignManager.sol";
import {TrustLockVoting} from "../src/TrustLockVoting.sol";
import {TrustLockTreasury} from "../src/TrustLockTreasury.sol";
import {TrustLockConfig} from "../src/TrustLockConfig.sol";

/**
 * @title TrustLockDeployment
 * @notice Reusable deployment configuration and helper for TrustLock protocol
 * @dev Use this in tests, scripts, and production deployments
 */
library TrustLockDeployment {
    
    // ============ STRUCTS ============
    
    struct Contracts {
        TrustLockCore core;
        TrustLockCampaignManager campaignManager;
        TrustLockVoting voting;
        TrustLockTreasury treasury;
        TrustLockConfig config;
    }
    
    struct Config {
        address protocolFeeRecipient;
        bool transferOwnershipToCore; 
    }

    // ============ ERRORS ============
    
    error DeploymentFailed(string reason);
    error InvalidConfiguration(string reason);

    // ============ DEPLOYMENT ============
    
    /**
     * @notice Deploy complete TrustLock protocol
     * @param config Deployment configuration
     * @return contracts All deployed contract instances
     */
    function deploy(Config memory config) 
        internal 
        returns (Contracts memory contracts) 
    {
        _validateConfig(config);
        
        // Deploy contracts
        contracts = _deployContracts(config);
        
        // Initialize contracts
        _initializeContracts(contracts);
        
        // Verify deployment
        _verifyDeployment(contracts, config);
        
        return contracts;
    }

    /**
     * @notice Simplified deployment with default config
     * @param protocolFeeRecipient Address to receive protocol fees
     * @return contracts All deployed contract instances
     */
    function deployDefault(address protocolFeeRecipient)
        internal
        returns (Contracts memory contracts)
    {
        return deploy(Config({
            protocolFeeRecipient: protocolFeeRecipient,
            transferOwnershipToCore: false
        }));
    }

    // ============ INTERNAL HELPERS ============
    
    function _validateConfig(Config memory config) private pure {
        if (config.protocolFeeRecipient == address(0)) {
            revert InvalidConfiguration("Protocol fee recipient cannot be zero address");
        }
    }

    function _deployContracts(Config memory config) 
        private 
        returns (Contracts memory contracts) 
    {
        // 1. Deploy Config first
        contracts.config = new TrustLockConfig(config.protocolFeeRecipient);
        if (address(contracts.config) == address(0)) {
            revert DeploymentFailed("Config deployment failed");
        }

        // 2. Deploy Core (orchestrator)
        contracts.core = new TrustLockCore(config.protocolFeeRecipient);
        if (address(contracts.core) == address(0)) {
            revert DeploymentFailed("Core deployment failed");
        }

        // 3. Deploy CampaignManager
        contracts.campaignManager = new TrustLockCampaignManager(address(contracts.core), address(contracts.config));
        if (address(contracts.campaignManager) == address(0)) {
            revert DeploymentFailed("CampaignManager deployment failed");
        }

        // 4. Deploy Voting
        contracts.voting = new TrustLockVoting(address(contracts.campaignManager), address(contracts.config));
        if (address(contracts.voting) == address(0)) {
            revert DeploymentFailed("Voting deployment failed");
        }

        // 5. Deploy Treasury
        contracts.treasury = new TrustLockTreasury(
            address(contracts.campaignManager),
            address(contracts.voting),
            address(contracts.core),
            config.protocolFeeRecipient,
            address(contracts.config)
        );
        if (address(contracts.treasury) == address(0)) {
            revert DeploymentFailed("Treasury deployment failed");
        }
    }

    function _initializeContracts(Contracts memory contracts) private {
        // Initialize cross-contract dependencies
        contracts.campaignManager.initialize(
            address(contracts.voting),
            address(contracts.treasury)
        );

        contracts.voting.initialize(address(contracts.treasury));
        
        // Transfer ownership to TrustLockCore
        contracts.campaignManager.transferOwnership(address(contracts.core));
        contracts.voting.transferOwnership(address(contracts.core));
        contracts.treasury.transferOwnership(address(contracts.core));
        
        // Set contract addresses in TrustLockCore
        contracts.core.setContractAddresses(
            address(contracts.campaignManager), 
            address(contracts.voting), 
            payable(address(contracts.treasury))
        );
    }

    function _verifyDeployment(Contracts memory contracts, Config memory config) private view {
        // Verify Core wiring
        (address cm, address v, address t) = contracts.core.getContractAddresses();
        
        if (cm != address(contracts.campaignManager)) {
            revert DeploymentFailed("CampaignManager not wired correctly");
        }
        if (v != address(contracts.voting)) {
            revert DeploymentFailed("Voting not wired correctly");
        }
        if (t != address(contracts.treasury)) {
            revert DeploymentFailed("Treasury not wired correctly");
        }

        // Verify protocol fee recipient
        if (contracts.core.protocolFeeRecipient() != config.protocolFeeRecipient) {
            revert DeploymentFailed("Protocol fee recipient mismatch");
        }
    }

    // ============ POST-DEPLOYMENT HELPERS ============

    /**
     * @notice Get deployment info for logging/verification
     * @param contracts Deployed contracts
     * @return Array of contract addresses [core, manager, voting, treasury]
     */
    function getAddresses(Contracts memory contracts) 
        internal 
        pure 
        returns (address[4] memory) 
    {
        return [
            address(contracts.core),
            address(contracts.campaignManager),
            address(contracts.voting),
            address(contracts.treasury)
        ];
    }

    /**
     * @notice Verify deployment integrity
     * @param contracts Deployed contracts
     * @return isValid True if all checks pass
     */
    function verifyIntegrity(Contracts memory contracts) 
        internal 
        view 
        returns (bool isValid) 
    {
        // Check all contracts deployed
        if (address(contracts.core) == address(0)) return false;
        if (address(contracts.campaignManager) == address(0)) return false;
        if (address(contracts.voting) == address(0)) return false;
        if (address(contracts.treasury) == address(0)) return false;

        // Check wiring
        (address cm, address v, address t) = contracts.core.getContractAddresses();
        if (cm != address(contracts.campaignManager)) return false;
        if (v != address(contracts.voting)) return false;
        if (t != address(contracts.treasury)) return false;

        // Check references
        if (contracts.campaignManager.votingContract() != address(contracts.voting)) return false;
        if (contracts.campaignManager.treasuryContract() != address(contracts.treasury)) return false;
        if (contracts.voting.treasuryContract() != address(contracts.treasury)) return false;

        return true;
    }
}
