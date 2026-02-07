import { useState, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  useAccount, 
  useWriteContract, 
  useReadContract, 
  useReadContracts,
  useConfig 
} from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { TrustLockCoreAddress, TrustLockCoreABI } from '../contracts/abi';
import { Milestone, Campaign } from '../contracts/types';

// ========================================
// HOOK
// ========================================

export const useTrustLock = () => {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending } = useWriteContract();

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // ========================================
  // PROTOCOL STATS
  // ========================================

  const { data: protocolStats, refetch: refetchStats } = useReadContract({
    address: TrustLockCoreAddress,
    abi: TrustLockCoreABI,
    functionName: 'getProtocolStats',
    query: { enabled: isConnected }
  });

  const totalCampaigns = protocolStats?.[0] ? Number(protocolStats[0]) : 0;
  const totalProtocolFees = protocolStats?.[1] ? Number(protocolStats[1]) : 0;

  // ========================================
  // CAMPAIGN DATA (requires campaignId)
  // ========================================

  const useCampaign = (campaignId?: number) => {
    const { data: campaignData, refetch: refetchCampaign } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'getCampaign',
      args: campaignId !== undefined ? [BigInt(campaignId)] : undefined,
      query: { enabled: isConnected && campaignId !== undefined }
    });

    const { data: contributors, refetch: refetchContributors } = useReadContract({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'getContributors',
      args: campaignId !== undefined ? [BigInt(campaignId)] : undefined,
      query: { enabled: isConnected && campaignId !== undefined }
    });

    const campaign = useMemo(() => {
      if (!campaignData) return null;
      return campaignData as Campaign;
    }, [campaignData]);

    const contributorsList = useMemo(() => {
      return (contributors as string[]) || [];
    }, [contributors]);

    return {
      campaign,
      contributors: contributorsList,
      refetchCampaign,
      refetchContributors
    };
  };

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
      return {
        votesFor: Number(votingResults[0]),
        votesAgainst: Number(votingResults[1]),
        totalVotes: Number(votingResults[2]),
        approved: votingResults[3] as boolean
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
    projectDuration: number; // in weeks
    acceptsEth: boolean;
    acceptedToken?: string;
  }): Promise<boolean> => {
    if (!address || !isConnected) {
      setStatus('❌ Connect wallet first');
      return false;
    }

    try {
      setStatus('⏳ Creating campaign...');
      setLoading(true);

      const fundingGoalWei = ethers.parseEther(params.fundingGoal);
      const durationSeconds = params.projectDuration * 7 * 24 * 60 * 60; // weeks to seconds
      const tokenAddress = params.acceptedToken || ethers.ZeroAddress;

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
      return true;

    } catch (error: any) {
      if (error.message?.includes('ENSRequired')) {
        setStatus('❌ ENS name required to create campaigns');
      } else if (!error.message?.includes('User rejected')) {
        setStatus('❌ Campaign creation failed');
      }
      return false;
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
        // For ERC20 tokens, user needs to approve first
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

    // Nested Hooks (use these for specific campaign/milestone data)
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

export const useCampaignList = (campaignIds: number[]) => {
  const { isConnected } = useAccount();

  const { data: campaignsData } = useReadContracts({
    contracts: campaignIds.map(id => ({
      address: TrustLockCoreAddress,
      abi: TrustLockCoreABI,
      functionName: 'getCampaign',
      args: [BigInt(id)],
    })),
    query: { enabled: isConnected && campaignIds.length > 0 }
  });

  const campaigns = useMemo(() => {
    if (!campaignsData) return [];
    
    return campaignsData
      .map((result, index) => ({
        id: campaignIds[index],
        data: result.result as Campaign | undefined
      }))
      .filter(item => item.data !== undefined);
  }, [campaignsData, campaignIds]);

  return campaigns;
};