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
export const TrustLockCoreAddress = "0xfA72e7FbD07ab4D3Ec1D15320fBb4b51606c1Ac0"
export const CampaignManagerAddress = "0xBD39A53be24457FE50f6D4F7a889f0E4f9Bb1Dcd"
export const VotingAddress = "0xf1013F2aCd7CEDB3fa0E5175e807C34A6981A5C0"
export const TreasuryAddress = "0x586a61210a9a89C1B148C235Af3Ad94e671D8Ec5"
export const TrustLockConfigAddress = "0xd9d8950cD0804A06886350A16393D90f113d00b6"