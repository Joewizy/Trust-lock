import { useState, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useReadContract, useWriteContract, useConfig, useReadContracts } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { TrustLockCoreAddress, TrustLockCoreABI } from '../contracts/abi/core';
import { CampaignManagerAddress, CampaignManagerABI } from '../contracts/abi/campaign-manager';
import { FaucetTokenAddress } from '../contracts/abi/faucet';
import { Milestone, Campaign } from '../contracts/types';
import { useFaucet } from './useFaucet';
import { useFormattedConfig } from './useTrustLockConfig';


export function useCampaign(campaignId?: number) {
  const { isConnected } = useAccount();
  const enabled = isConnected && !!campaignId && campaignId > 0;

  const { data: campaignData, refetch: refetchCampaign, isLoading: isCampaignLoading } = useReadContract({
    address: TrustLockCoreAddress,
    abi: TrustLockCoreABI,
    functionName: 'getCampaign',
    args: campaignId !== undefined && campaignId > 0 ? [BigInt(campaignId)] : undefined,
    query: { enabled }
  });

  const { data: title } = useReadContract({
    address: CampaignManagerAddress,
    abi: CampaignManagerABI,
    functionName: 'campaignTitles',
    args: campaignId !== undefined && campaignId > 0 ? [BigInt(campaignId)] : undefined,
    query: { enabled }
  });

  const { data: description } = useReadContract({
    address: CampaignManagerAddress,
    abi: CampaignManagerABI,
    functionName: 'campaignDescriptions',
    args: campaignId !== undefined && campaignId > 0 ? [BigInt(campaignId)] : undefined,
    query: { enabled }
  });

  const { data: contributors, refetch: refetchContributors } = useReadContract({
    address: TrustLockCoreAddress,
    abi: TrustLockCoreABI,
    functionName: 'getContributors',
    args: campaignId !== undefined && campaignId > 0 ? [BigInt(campaignId)] : undefined,
    query: { enabled }
  });

  const campaign = useMemo(() => {
    if (!campaignData || !enabled) return null;
    const c = campaignData as Campaign;
    return {
      ...c,
      title: (title as string) ?? '',
      description: (description as string) ?? ''
    };
  }, [campaignData, title, description, enabled]);

  const contributorsList = useMemo(() => (contributors as string[]) || [], [contributors]);

  return {
    campaign,
    contributors: contributorsList,
    refetchCampaign,
    refetchContributors,
    isLoading: isCampaignLoading
  };
}

// ========================================
// useTrustLockRaiseActions - minimal hook for raise detail page (no Faucet/Config)
// ========================================

export function useTrustLockRaiseActions() {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending } = useWriteContract();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const createMilestone = async (campaignId: number, description: string, fundingPercentage: number) => {
    if (!address) {
      setStatus('❌ Connect wallet first');
      return false;
    }
    try {
      setStatus('⏳ Creating milestone...');
      setLoading(true);
      const tx = await writeContractAsync({
        address: TrustLockCoreAddress,
        abi: TrustLockCoreABI,
        functionName: 'createMilestone',
        args: [address, BigInt(campaignId), description, BigInt(fundingPercentage)],
      });
      await waitForTransactionReceipt(config, { hash: tx });
      setStatus('✅ Milestone created successfully!');
      return true;
    } catch (error: any) {
      if (!error.message?.includes('User rejected')) setStatus('❌ Milestone creation failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!address) setStatus('');
  }, [address]);

  return { createMilestone, status, loading: loading || isPending };
}

// ========================================
// useTrustLock - full hook (for create, contribute, raises list)
// ========================================

export const useTrustLock = () => {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending } = useWriteContract();
  const { approveTokens } = useFaucet();
  const formattedConfig = useFormattedConfig();

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: protocolStats, refetch: refetchStats } = useReadContract({
    address: TrustLockCoreAddress,
    abi: TrustLockCoreABI,
    functionName: 'getProtocolStats',
    query: { enabled: isConnected }
  });

  const totalCampaigns = protocolStats && Array.isArray(protocolStats) ? Number(protocolStats[0]) : 0;
  const totalProtocolFees = protocolStats && Array.isArray(protocolStats) ? Number(protocolStats[1]) : 0;

  // useCampaign - use standalone (exported above) for backward compat

  // ========================================
  // USER CONTRIBUTION DATA
  // ========================================

  const useUserContribution = (campaignId?: number) => {
    const { data: contribution } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'getContribution',
      args: campaignId !== undefined && address ? [BigInt(campaignId), address] : undefined,
      query: { enabled: isConnected && !!address && campaignId !== undefined }
    });

    const { data: hasContributed } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'hasContributedToCampaign',
      args: campaignId !== undefined && address ? [BigInt(campaignId), address] : undefined,
      query: { enabled: isConnected && !!address && campaignId !== undefined }
    });

    return {
      contributionAmount: contribution ? ethers.formatEther(contribution as bigint) : '0',
      hasContributed: hasContributed as boolean || false
    };
  };

  // ========================================
  // MILESTONE DATA
  // ========================================

  const useMilestone = (campaignId?: number, milestoneId?: number) => {
    const { data: milestoneData, refetch: refetchMilestone } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'getMilestone', 
      args: campaignId !== undefined && milestoneId !== undefined 
        ? [BigInt(campaignId), BigInt(milestoneId)] 
        : undefined,
      query: { enabled: isConnected && campaignId !== undefined && milestoneId !== undefined }
    });

    const { data: votingResults, refetch: refetchVotingResults } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'getVotingResults',
      args: campaignId !== undefined && milestoneId !== undefined 
        ? [BigInt(campaignId), BigInt(milestoneId)] 
        : undefined,
      query: { enabled: isConnected && campaignId !== undefined && milestoneId !== undefined }
    });

    const { data: hasVoted } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'hasVotedOnMilestone',
      args: campaignId !== undefined && milestoneId !== undefined && address
        ? [BigInt(campaignId), BigInt(milestoneId), address]
        : undefined,
      query: { enabled: isConnected && !!address && campaignId !== undefined && milestoneId !== undefined }
    });

    const milestone = useMemo(() => {
      if (!milestoneData) return null;
      return milestoneData as Milestone;
    }, [milestoneData]);

    const results = useMemo(() => {
      if (!votingResults) return null;
      const resultsArray = votingResults as [bigint, bigint, bigint, boolean];
      return {
        votesFor: Number(resultsArray[0]),
        votesAgainst: Number(resultsArray[1]),
        totalVotes: Number(resultsArray[2]),
        approved: resultsArray[3] as boolean
      };
    }, [votingResults]);

    return {
      milestone,
      votingResults: results,
      hasVoted: hasVoted as boolean || false,
      refetchMilestone,
      refetchVotingResults
    };
  };

  // ========================================
  // REFUND DATA
  // ========================================

  const useRefund = (campaignId?: number) => {
    const { data: refundAmount } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'getRefundAmount',
      args: campaignId !== undefined && address ? [BigInt(campaignId), address] : undefined,
      query: { enabled: isConnected && !!address && campaignId !== undefined }
    });

    const { data: hasRefundClaimed } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'hasRefundClaimed',
      args: campaignId !== undefined && address ? [BigInt(campaignId), address] : undefined,
      query: { enabled: isConnected && !!address && campaignId !== undefined }
    });

    return {
      refundAmount: refundAmount ? ethers.formatEther(refundAmount as bigint) : '0',
      hasRefundClaimed: hasRefundClaimed as boolean || false
    };
  };

  // ========================================
  // CAMPAIGN CREATION
  // ========================================

  const createCampaign = async (params: {
    title: string;
    description: string;
    fundingGoal: string;
    projectDuration: number;
    acceptsEth: boolean;
  }): Promise<{ success: boolean; txHash?: string }> => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first');
      return { success: false };
    }

    try {
      setStatus('⏳ Creating campaign...');
      setLoading(true);
      
      const maxDurationWeeks = formattedConfig.projectMaxDurationWeeks;
      if (params.projectDuration > maxDurationWeeks) {
        setStatus(`❌ Campaign duration cannot exceed ${maxDurationWeeks} weeks`);
        return { success: false };
      }

      const tokenAddress = params.acceptsEth ? ethers.ZeroAddress : FaucetTokenAddress;
      const fundingGoalWei = ethers.parseEther(params.fundingGoal);
      const durationSeconds = params.projectDuration * 7 * 24 * 60 * 60;

      const tx = await writeContractAsync({
        address: TrustLockCoreAddress,
        abi: TrustLockCoreABI,
        functionName: 'createCampaign',
        args: [
          params.title,
          params.description,
          fundingGoalWei,
          BigInt(durationSeconds),
          params.acceptsEth,
          tokenAddress
        ],
      });

      await waitForTransactionReceipt(config, { hash: tx });
      
      setStatus('✅ Campaign created successfully!');
      await refetchStats();
      return { success: true, txHash: tx };

    } catch (error: any) {
      console.log("error creating campaign", error)
      if (error.message?.includes('ENSRequired')) {
        setStatus('❌ ENS name required to create campaigns');
      } else if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
        setStatus(''); 
      } else {
        setStatus(`Error: ${error.message}`);
      }
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // CONTRIBUTE TO CAMPAIGN
  // ========================================

  const contribute = async (campaignId: number, amount: string, isEth: boolean = true): Promise<boolean> => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first');
      return false;
    }

    try {
      setStatus('⏳ Contributing...');
      setLoading(true);

      if (isEth) {
        const amountWei = ethers.parseEther(amount);
        
        const tx = await writeContractAsync({
          address: TrustLockCoreAddress,
          abi: TrustLockCoreABI,
          functionName: 'contribute',
          args: [BigInt(campaignId), BigInt(0)],
          value: amountWei,
        });

        await waitForTransactionReceipt(config, { hash: tx });
      } else {
        await approveTokens(TrustLockCoreAddress, amount);
        
        const amountWei = ethers.parseEther(amount);
        
        const tx = await writeContractAsync({
          address: TrustLockCoreAddress,
          abi: TrustLockCoreABI,
          functionName: 'contribute',
          args: [BigInt(campaignId), amountWei],
        });

        await waitForTransactionReceipt(config, { hash: tx });
      }
      
      setStatus('✅ Contribution successful!');
      return true;

    } catch (error: any) {
      if (!error.message?.includes('User rejected')) {
        setStatus('❌ Contribution failed');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // CREATE MILESTONE
  // ========================================

  const createMilestone = async (
    campaignId: number,
    description: string,
    fundingPercentage: number
  ): Promise<boolean> => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first');
      return false;
    }

    try {
      setStatus('⏳ Creating milestone...');
      setLoading(true);

      const tx = await writeContractAsync({
        address: TrustLockCoreAddress,
        abi: TrustLockCoreABI,
        functionName: 'createMilestone',
        args: [address, BigInt(campaignId), description, BigInt(fundingPercentage)],
      });

      await waitForTransactionReceipt(config, { hash: tx });
      
      setStatus('✅ Milestone created successfully!');
      return true;

    } catch (error: any) {
      if (!error.message?.includes('User rejected')) {
        setStatus('❌ Milestone creation failed');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // VOTE ON MILESTONE
  // ========================================

  const vote = async (
    campaignId: number,
    milestoneId: number,
    support: boolean
  ): Promise<boolean> => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first');
      return false;
    }

    try {
      setStatus('⏳ Submitting vote...');
      setLoading(true);

      const tx = await writeContractAsync({
        address: TrustLockCoreAddress,
        abi: TrustLockCoreABI,
        functionName: 'vote',
        args: [BigInt(campaignId), BigInt(milestoneId), support],
      });

      await waitForTransactionReceipt(config, { hash: tx });
      
      setStatus(`✅ Voted ${support ? 'FOR' : 'AGAINST'} successfully!`);
      return true;

    } catch (error: any) {
      if (!error.message?.includes('User rejected')) {
        setStatus('❌ Vote failed');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FINALIZE MILESTONE
  // ========================================

  const finalizeMilestone = async (
    campaignId: number,
    milestoneId: number
  ): Promise<boolean> => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first');
      return false;
    }

    try {
      setStatus('⏳ Finalizing milestone...');
      setLoading(true);

      const tx = await writeContractAsync({
        address: TrustLockCoreAddress,
        abi: TrustLockCoreABI,
        functionName: 'finalizeMilestone',
        args: [BigInt(campaignId), BigInt(milestoneId)],
      });

      await waitForTransactionReceipt(config, { hash: tx });
      
      setStatus('✅ Milestone finalized!');
      return true;

    } catch (error: any) {
      if (!error.message?.includes('User rejected')) {
        setStatus('❌ Finalization failed');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // CLAIM REFUND
  // ========================================

  const claimRefund = async (campaignId: number): Promise<boolean> => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first');
      return false;
    }

    try {
      setStatus('⏳ Claiming refund...');
      setLoading(true);

      const tx = await writeContractAsync({
        address: TrustLockCoreAddress,
        abi: TrustLockCoreABI,
        functionName: 'claimRefund',
        args: [BigInt(campaignId)],
      });

      await waitForTransactionReceipt(config, { hash: tx });
      
      setStatus('✅ Refund claimed successfully!');
      return true;

    } catch (error: any) {
      if (!error.message?.includes('User rejected')) {
        setStatus('❌ Refund claim failed');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // CLEANUP
  // ========================================

  useEffect(() => {
    if (!address || !isConnected) {
      setStatus('');
      setLoading(false);
    }
  }, [address, isConnected]);

  // ========================================
  // RETURN
  // ========================================

  return {
    // Account
    account: address,
    isConnected,
    
    // Protocol Stats
    totalCampaigns,
    totalProtocolFees,
    refetchStats,

    // Nested Hooks
    useCampaign,
    useUserContribution,
    useMilestone,
    useRefund,

    // Actions
    createCampaign,
    contribute,
    createMilestone,
    vote,
    finalizeMilestone,
    claimRefund,

    // UI State
    status,
    loading: loading || isPending,
    setStatus,
  };
};

// ========================================
// HELPER HOOK FOR CAMPAIGN LIST
// ========================================

export const useCampaignList = (campaignIds?: number[]) => {
  const { isConnected } = useAccount();

  // Get total campaign count from protocol stats
  const { data: protocolStats, isLoading: isStatsLoading } = useReadContract({
    address: TrustLockCoreAddress,
    abi: TrustLockCoreABI,
    functionName: 'getProtocolStats',
    query: { enabled: isConnected }
  });

  const totalCount = protocolStats && Array.isArray(protocolStats) ? Number(protocolStats[0]) : 0;

  const idsToFetch = useMemo(() => {
    if (campaignIds && campaignIds.length > 0) return campaignIds;
    if (totalCount === 0) return [];
    return Array.from({ length: totalCount }, (_, i) => i + 1);
  }, [campaignIds, totalCount]);

  // Fetch getCampaign + campaignTitles + campaignDescriptions for each campaign (title/description in CampaignManager)
  const { data: campaignsData, isLoading: isCampaignsLoading } = useReadContracts({
    contracts: idsToFetch.flatMap(id => [
      {
        address: TrustLockCoreAddress,
        abi: TrustLockCoreABI,
        functionName: 'getCampaign',
        args: [BigInt(id)],
      },
      {
        address: CampaignManagerAddress,
        abi: CampaignManagerABI,
        functionName: 'campaignTitles',
        args: [BigInt(id)],
      },
      {
        address: CampaignManagerAddress,
        abi: CampaignManagerABI,
        functionName: 'campaignDescriptions',
        args: [BigInt(id)],
      },
    ]),
    query: { enabled: isConnected && idsToFetch.length > 0 }
  });

  // Process campaigns data: each campaign has 3 results [getCampaign, title, description]
  const campaigns = useMemo(() => {
    if (!campaignsData) return [];
    
    return idsToFetch
      .map((id, index) => {
        const baseIndex = index * 3;
        const campaignResult = campaignsData[baseIndex];
        const titleResult = campaignsData[baseIndex + 1];
        const descriptionResult = campaignsData[baseIndex + 2];

        if (campaignResult?.status !== 'success' || !campaignResult.result) {
          console.error(`Campaign ${id} failed:`, campaignResult?.error);
          return null;
        }

        const campaign = campaignResult.result as Campaign;
        const title = titleResult?.status === 'success' ? (titleResult.result as string) : '';
        const description = descriptionResult?.status === 'success' ? (descriptionResult.result as string) : '';

        return {
          id,
          data: { ...campaign, title, description }
        };
      })
      .filter((item): item is { id: number; data: Campaign & { title: string; description: string } } => item !== null);
  }, [campaignsData, idsToFetch]);

  return {
    campaigns,
    isLoading: isStatsLoading || isCampaignsLoading,
    totalCount
  };
};
