// ============ CLEAN ABI IMPORTS ============

import TrustLockCoreJson from "./generated/TrustLockCore.json"
import CampaignManagerJson from "./generated/TrustLockCampaignManager.json"
import TreasuryJson from "./generated/TrustLockTreasury.json"
import VotingJson from "./generated/TrustLockVoting.json"
import TrustLockConfigJson from "./generated/TrustLockConfig.json"
import FaucetTokenJson from "./generated/TrustLockFaucetToken.json"

// ============ EXPORT CLEAN ABIS ============
export const TrustLockCoreABI = TrustLockCoreJson.abi
export const CampaignManagerABI = CampaignManagerJson.abi
export const TreasuryABI = TreasuryJson.abi
export const VotingABI = VotingJson.abi
export const TrustLockConfigABI = TrustLockConfigJson.abi
export const FaucetTokenABI = FaucetTokenJson.abi

// ============ CONTRACT ADDRESSES ============
export const FaucetTokenAddress = "0x4DA2aabeD46a70e266b1231fa12bAb2719158652"
export const TrustLockCoreAddress = "0x94be75b500F882Ed1D1EE79ace2e9c68025656FE"
export const CampaignManagerAddress = "0xf9c4c8B278904528acc86dCFCdC8a7A07095D4c0"
export const VotingAddress = "0x1cfbac739e53FA649AF38D797668270A88DfF08B"
export const TreasuryAddress = "0xFA6E8A06DCb2347FeB46880eD5307c8c18CA92cc"
export const TrustLockConfigAddress = "0xd9d8950cD0804A06886350A16393D90f113d00b6"