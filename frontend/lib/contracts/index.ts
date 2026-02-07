/* ========= ENUMS ========= */

export enum CampaignState {
  FUNDING = 0,
  ACTIVE = 1,
  VOTING = 2,
  COMPLETED = 3,
  FAILED = 4,
}

/* ========= CORE STRUCTS ========= */

export interface Campaign {
  // Core identity
  creator: string
  acceptedToken: string

  // Funding
  fundingGoal: bigint
  totalRaised: bigint

  // Protocol accounting
  protocolFee: bigint        
  availableFunds: bigint     
  releasedFunds: bigint      

  // Timing
  fundingDeadline: bigint
  projectDuration: bigint
  createdAt: bigint

  // Milestones
  milestoneCount: number
  consecutiveFailedMilestones: number
  totalFailedMilestones: number

  // State
  state: CampaignState
  acceptsEth: boolean
}

/* ========= CONTRIBUTIONS ========= */

export interface Contribution {
  campaignId: bigint
  contributor: string
  amount: bigint
}

/* ========= EVENTS ========= */

export interface CampaignCreatedEvent {
  campaignId: bigint
  creator: string
  fundingGoal: bigint
  acceptsEth: boolean
}

export interface ContributionReceivedEvent {
  campaignId: bigint
  contributor: string
  amount: bigint
  isEth: boolean
}

export interface CampaignFundedEvent {
  campaignId: bigint
  totalRaised: bigint
  timestamp: bigint
}

export interface ProtocolFeeCollectedEvent {
  campaignId: bigint
  recipient: string
  amount: bigint
  isEth: boolean
}

export interface RefundIssuedEvent {
  campaignId: bigint
  contributor: string
  amount: bigint
  isEth: boolean
}

/* ========= READ MODELS (UI FRIENDLY) ========= */

export interface CampaignView extends Campaign {
  id: bigint
  title: string
  description: string
  ensName?: string
  contributorCount: number
}

