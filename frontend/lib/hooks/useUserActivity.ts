// hooks/useUserActivity.ts
import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { TrustLockCoreAddress, TrustLockCoreABI } from '../contracts/abi/core';
import { useCampaignList } from './useTrustLock';
import type { Campaign } from '../contracts/types';

/**
 * Hook to get campaigns created by the connected user
 */
export function useUserCreatedCampaigns() {
  const { address, isConnected } = useAccount();
  const { campaigns, isLoading, totalCount } = useCampaignList();

  const userCampaigns = useMemo(() => {
    if (!address || !isConnected || !campaigns) return [];
    
    return campaigns.filter(({ data }) => 
      data.creator.toLowerCase() === address.toLowerCase()
    );
  }, [campaigns, address, isConnected]);

  return {
    campaigns: userCampaigns,
    isLoading,
    totalCreated: userCampaigns.length
  };
}

/**
 * Hook to get campaigns the user has contributed to
 * Uses batch contract calls to check contributions efficiently
 */
export function useUserContributions() {
  const { address, isConnected } = useAccount();
  const { campaigns, isLoading: isCampaignsLoading, totalCount } = useCampaignList();

  // Generate campaign IDs array
  const campaignIds = useMemo(() => {
    if (totalCount === 0) return [];
    return Array.from({ length: totalCount }, (_, i) => i + 1);
  }, [totalCount]);

  // Batch check if user has contributed to each campaign
  const { data: contributionChecks, isLoading: isCheckingContributions } = useReadContracts({
    contracts: campaignIds.map(id => ({
      address: TrustLockCoreAddress as `0x${string}`,
      abi: TrustLockCoreABI as any,
      functionName: 'hasContributedToCampaign',
      args: [BigInt(id), address as `0x${string}`],
    })),
    query: { enabled: isConnected && !!address && campaignIds.length > 0 }
  });

  // Batch get contribution amounts for campaigns user contributed to
  const { data: contributionAmounts } = useReadContracts({
    contracts: campaignIds.map(id => ({
      address: TrustLockCoreAddress as `0x${string}`,
      abi: TrustLockCoreABI as any,
      functionName: 'getContribution',
      args: [BigInt(id), address as `0x${string}`],
    })),
    query: { enabled: isConnected && !!address && campaignIds.length > 0 }
  });

  const userContributions = useMemo(() => {
    if (!address || !isConnected || !campaigns || !contributionChecks) return [];

    return campaigns
      .map(({ id, data }, index) => {
        const hasContributed = contributionChecks[index]?.result as boolean;
        const contributionAmount = contributionAmounts?.[index]?.result as bigint | undefined;

        if (!hasContributed) return null;

        return {
          id,
          data,
          contributionAmount: contributionAmount || BigInt(0)
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [campaigns, contributionChecks, contributionAmounts, address, isConnected]);

  return {
    contributions: userContributions,
    isLoading: isCampaignsLoading || isCheckingContributions,
    totalContributions: userContributions.length
  };
}

/**
 * Combined hook for the activity page
 * Returns both created campaigns and contributions in one call
 */
export function useUserActivity() {
  const { campaigns: createdCampaigns, isLoading: isLoadingCreated, totalCreated } = useUserCreatedCampaigns();
  const { contributions, isLoading: isLoadingContributions, totalContributions } = useUserContributions();

  return {
    created: {
      campaigns: createdCampaigns,
      count: totalCreated,
      isLoading: isLoadingCreated
    },
    contributed: {
      campaigns: contributions,
      count: totalContributions,
      isLoading: isLoadingContributions
    },
    isLoading: isLoadingCreated || isLoadingContributions
  };
}