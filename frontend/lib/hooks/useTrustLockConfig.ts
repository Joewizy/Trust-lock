import { useReadContract } from 'wagmi';
import { TrustLockConfigAddress, TrustLockConfigABI } from '../contracts/abi';

// ========================================
// CONFIG HOOK
// ========================================

export const useTrustLockConfig = () => {
  // Fetch core config values
  const { data: coreConfig, isLoading: coreLoading, error: coreError } = useReadContract({
    address: TrustLockConfigAddress,
    abi: TrustLockConfigABI,
    functionName: 'getCoreConfig'
  });

  // Fetch campaign config values
  const { data: campaignConfig, isLoading: campaignLoading, error: campaignError } = useReadContract({
    address: TrustLockConfigAddress,
    abi: TrustLockConfigABI,
    functionName: 'getCampaignConfig'
  });

  // Fetch voting config values
  const { data: votingConfig, isLoading: votingLoading, error: votingError } = useReadContract({
    address: TrustLockConfigAddress,
    abi: TrustLockConfigABI,
    functionName: 'getVotingConfig'
  });

  const isLoading = coreLoading || campaignLoading || votingLoading;
  const error = coreError || campaignError || votingError;

  // Return formatted config object
  return {
    // Campaign config
    minimumContribution: Number(campaignConfig?.[0] || 0),
    maxContributionPercentage: Number(campaignConfig?.[1] || 0),
    fundingDuration: Number(campaignConfig?.[2] || 0),
    projectMaxDuration: Number(campaignConfig?.[3] || 0),
    protocolFeePercent: Number(campaignConfig?.[4] || 0),
    
    // Voting config
    votingDuration: Number(votingConfig?.[0] || 0),
    minMilestonePercent: Number(votingConfig?.[1] || 0),
    maxMilestonePercent: Number(votingConfig?.[2] || 0),
    firstMilestoneMax: Number(votingConfig?.[3] || 0),
    majorityThreshold: Number(votingConfig?.[4] || 0),
    maxConsecutiveFailures: Number(votingConfig?.[5] || 0),
    maxTotalFailures: Number(votingConfig?.[6] || 0),
    
    // String validation config
    minTitleLength: Number(campaignConfig?.[5] || 0),
    maxTitleLength: Number(campaignConfig?.[6] || 0),
    minDescriptionLength: Number(campaignConfig?.[7] || 0),
    maxDescriptionLength: Number(campaignConfig?.[8] || 0),
    
    // Meta
    isLoading,
    error,
    refetch: () => {
      // Refetch would be implemented with proper query client
    }
  };
};

// ========================================
// HELPER HOOKS
// ========================================

/**
 * Hook for campaign-related config values
 */
export const useCampaignConfig = () => {
  const { data: campaignConfig, isLoading, error } = useReadContract({
    address: TrustLockConfigAddress,
    abi: TrustLockConfigABI,
    functionName: 'getCampaignConfig',
    query: { 
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  });
  
  return {
    minimumContribution: Number(campaignConfig?.[0] || 0),
    maxContributionPercentage: Number(campaignConfig?.[1] || 0),
    fundingDuration: Number(campaignConfig?.[2] || 0),
    projectMaxDuration: Number(campaignConfig?.[3] || 0),
    protocolFeePercent: Number(campaignConfig?.[4] || 0),
    minTitleLength: Number(campaignConfig?.[5] || 0),
    maxTitleLength: Number(campaignConfig?.[6] || 0),
    minDescriptionLength: Number(campaignConfig?.[7] || 0),
    maxDescriptionLength: Number(campaignConfig?.[8] || 0),
    isLoading,
    error
  };
};

/**
 * Hook for voting-related config values
 */
export const useVotingConfig = () => {
  const { data: votingConfig, isLoading, error } = useReadContract({
    address: TrustLockConfigAddress,
    abi: TrustLockConfigABI,
    functionName: 'getVotingConfig',
    query: { 
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  });
  
  return {
    votingDuration: Number(votingConfig?.[0] || 0),
    minMilestonePercent: Number(votingConfig?.[1] || 0),
    maxMilestonePercent: Number(votingConfig?.[2] || 0),
    firstMilestoneMax: Number(votingConfig?.[3] || 0),
    majorityThreshold: Number(votingConfig?.[4] || 0),
    maxConsecutiveFailures: Number(votingConfig?.[5] || 0),
    maxTotalFailures: Number(votingConfig?.[6] || 0),
    isLoading,
    error
  };
};

/**
 * Hook for formatted display values
 */
export const useFormattedConfig = () => {
  const config = useTrustLockConfig();
  
  return {
    // Formatted durations
    fundingDurationDays: Math.floor(config.fundingDuration / (24 * 60 * 60)),
    fundingDurationWeeks: Math.floor(config.fundingDuration / (7 * 24 * 60 * 60)),
    votingDurationHours: Math.floor(config.votingDuration / (60 * 60)),
    votingDurationMinutes: Math.floor(config.votingDuration / 60),
    projectMaxDurationWeeks: Math.floor(config.projectMaxDuration / (7 * 24 * 60 * 60)),
    
    // Formatted percentages
    maxContributionPercentage: config.maxContributionPercentage / 100, // Convert basis points to percentage
    protocolFeePercent: config.protocolFeePercent,
    minMilestonePercent: config.minMilestonePercent,
    maxMilestonePercent: config.maxMilestonePercent,
    firstMilestoneMax: config.firstMilestoneMax,
    majorityThreshold: config.majorityThreshold,
    
    // Formatted amounts
    minimumContributionEth: config.minimumContribution / 1e18,
    
    isLoading: config.isLoading,
    error: config.error
  };
};
