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
export const TrustLockCoreAddress = "0x94be75b500F882Ed1D1EE79ace2e9c68025656FE"
export const CampaignManagerAddress = "0xf9c4c8B278904528acc86dCFCdC8a7A07095D4c0"
export const VotingAddress = "0x1cfbac739e53FA649AF38D797668270A88DfF08B"
export const TreasuryAddress = "0xFA6E8A06DCb2347FeB46880eD5307c8c18CA92cc"