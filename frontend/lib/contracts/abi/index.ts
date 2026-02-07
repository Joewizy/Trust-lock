// ============ CLEAN ABI IMPORTS ============

import TrustLockCoreJson from "./generated/TrustLockCore.json"
import CampaignManagerJson from "./generated/TrustLockCampaignManager.json"
import TreasuryJson from "./generated/TrustLockTreasury.json"
import VotingJson from "./generated/TrustLockVoting.json"

// ============ EXPORT CLEAN ABIS ============
export const TrustLockCoreABI = TrustLockCoreJson.abi
export const CampaignManagerABI = CampaignManagerJson.abi
export const TreasuryABI = TreasuryJson.abi
export const VotingABI = VotingJson.abi

// ============ CONTRACT ADDRESSES ============
export const CONTRACT_ADDRESSES = {
  // Mainnet
  mainnet: {
    TRUSTLOCK_CORE: "0x...",
    TRUSTLOCK_CAMPAIGN_MANAGER: "0x...",
    TRUSTLOCK_TREASURY: "0x...",
    TRUSTLOCK_VOTING: "0x...",
  },
  // Sepolia Testnet
  sepolia: {
    TRUSTLOCK_CORE: "0x...",
    TRUSTLOCK_CAMPAIGN_MANAGER: "0x...",
    TRUSTLOCK_TREASURY: "0x...",
    TRUSTLOCK_VOTING: "0x...",
  },
  // Local Hardhat/Anvil
  localhost: {
    TRUSTLOCK_CORE: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    TRUSTLOCK_CAMPAIGN_MANAGER: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    TRUSTLOCK_TREASURY: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    TRUSTLOCK_VOTING: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  },
} as const

// ============ NETWORK CONFIG ============
export const SUPPORTED_NETWORKS = {
  1: "mainnet",
  11155111: "sepolia",
  31337: "localhost",
} as const

export type NetworkName = typeof SUPPORTED_NETWORKS[keyof typeof SUPPORTED_NETWORKS]