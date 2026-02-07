// ============ CAMPAIGN TYPES ============

export interface Campaign {
  id: number;
  creator: string;
  acceptedToken: string;
  fundingGoal: string;
  totalRaised: string;
  protocolFee: string;
  availableFunds: string;
  fundingDeadline: number;
  projectDuration: number;
  createdAt: number;
  releasedFunds: string;
  milestoneCount: number;
  consecutiveFailedMilestones: number;
  totalFailedMilestones: number;
  state: CampaignState;
  acceptsEth: boolean;
}

export enum CampaignState {
  FUNDING = 0,
  ACTIVE = 1,
  VOTING = 2,
  COMPLETED = 3,
  FAILED = 4
}

// ============ MILESTONE TYPES ============

export interface Milestone {
  id: number;
  campaignId: number;
  description: string;
  fundingPercentage: number;
  votesFor: number;
  votesAgainst: number;
  state: MilestoneState;
  createdAt: number;
  votingDeadline: number;
}

export enum MilestoneState {
  PENDING = 0,
  VOTING = 1,
  APPROVED = 2,
  REJECTED = 3
}

// ============ CONTRIBUTION TYPES ============

export interface Contribution {
  contributor: string;
  amount: string;
  timestamp: number;
  isEth: boolean;
}

// ============ CONTRACT FUNCTION PARAMS ============

export interface CreateCampaignParams {
  title: string;
  description: string;
  fundingGoal: string;
  projectDuration: number;
  acceptsEth: boolean;
  acceptedToken?: string;
}

export interface ContributeParams {
  campaignId: number;
  amount: string;
  isEth: boolean;
  tokenAddress?: string;
}

export interface CreateMilestoneParams {
  campaignId: number;
  description: string;
  fundingPercentage: number;
}

export interface VoteParams {
  campaignId: number;
  milestoneId: number;
  support: boolean;
}

export interface ClaimRefundParams {
  campaignId: number;
}

// ============ EVENT TYPES ============

export interface CampaignCreatedEvent {
  campaignId: number;
  creator: string;
  fundingGoal: string;
  acceptsEth: boolean;
}

export interface ContributionReceivedEvent {
  campaignId: number;
  contributor: string;
  amount: string;
  isEth: boolean;
}

export interface CampaignFundedEvent {
  campaignId: number;
  totalRaised: string;
  timestamp: number;
}

export interface MilestoneCreatedEvent {
  campaignId: number;
  milestoneId: number;
  description: string;
  fundingPercentage: number;
}

export interface VoteCastEvent {
  campaignId: number;
  milestoneId: number;
  voter: string;
  support: boolean;
}

export interface MilestoneFinalizedEvent {
  campaignId: number;
  milestoneId: number;
  state: MilestoneState;
}

export interface RefundIssuedEvent {
  campaignId: number;
  contributor: string;
  amount: string;
  isEth: boolean;
}

export interface ProtocolFeeCollectedEvent {
  campaignId: number;
  recipient: string;
  amount: string;
  isEth: boolean;
}
