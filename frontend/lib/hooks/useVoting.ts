import { useMemo, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { toast } from 'react-hot-toast';
import { TrustLockCoreAddress, TrustLockCoreABI } from '../contracts/abi/core';
import { useUserContributions } from './useUserActivity';
import { useCampaign, useTrustLock } from './useTrustLock';

export interface Milestone {
  id: number;
  description: string;
  percentage: number;
  votesFor: number;
  votesAgainst: number;
  status: 'pending' | 'voting' | 'approved' | 'rejected';
  deadline?: bigint;
  hasVoted?: boolean;
}

export function useVoting(campaignId?: number) {
  const { address, isConnected } = useAccount();
  const { contributions } = useUserContributions();
  const { campaign } = useCampaign(campaignId);
  const { vote } = useTrustLock(); // Use the existing vote function
  
  // Check if user has contributed to this specific campaign
  const hasContributed = useMemo(() => {
    if (!campaignId || !address) return false;
    return contributions.some(c => c.id === campaignId);
  }, [contributions, campaignId, address]);

  // Get milestone count from campaign data
  const milestoneCount = useMemo(() => {
    if (!campaign) return 0;
    // Assuming campaign has milestoneCount property, otherwise default to 0
    return (campaign as any).milestoneCount || 0;
  }, [campaign]);

  // Generate milestone IDs to fetch - hardcoded for demo to fetch only first milestone
  const milestoneIds = useMemo(() => {
    if (!campaignId) return [];
    return [1]; // Fetch only first milestone (milestone 1)
  }, [campaignId]);

  // Fetch all milestones for the campaign
  const { data: milestonesData } = useReadContracts({
    contracts: milestoneIds.map(id => ({
      address: TrustLockCoreAddress as `0x${string}`,
      abi: TrustLockCoreABI as any,
      functionName: 'getMilestone',
      args: [BigInt(campaignId!), BigInt(id)],
    })),
    query: { enabled: isConnected && !!campaignId && milestoneIds.length > 0 }
  });
  console.log("campaign id", campaignId)
  console.log("milestone ids", milestoneIds)
  console.log("direct milestone data", milestonesData)

  // Fetch voting results for all milestones
  const { data: votingResultsData } = useReadContracts({
    contracts: milestoneIds.map(id => ({
      address: TrustLockCoreAddress as `0x${string}`,
      abi: TrustLockCoreABI as any,
      functionName: 'getVotingResults',
      args: [BigInt(campaignId!), BigInt(id)],
    })),
    query: { enabled: isConnected && !!campaignId && milestoneIds.length > 0 }
  });

  // Check if user has voted on each milestone
  const { data: userVotesData } = useReadContracts({
    contracts: milestoneIds.map(id => ({
      address: TrustLockCoreAddress as `0x${string}`,
      abi: TrustLockCoreABI as any,
      functionName: 'hasVotedOnMilestone',
      args: [BigInt(campaignId!), BigInt(id), address as `0x${string}`],
    })),
    query: { enabled: isConnected && !!address && !!campaignId && milestoneIds.length > 0 }
  });

  // Process all milestone data
  const milestones: Milestone[] = useMemo(() => {
    if (!milestonesData || !votingResultsData || !userVotesData) return [];
    
    const processedMilestones = milestoneIds.map((milestoneId, index) => {
      const milestoneResult = milestonesData[index];
      const votingResult = votingResultsData[index];
      const userVoteResult = userVotesData[index];
      
      console.log(`Processing milestone ${milestoneId}:`, {
        milestoneResult,
        votingResult,
        userVoteResult
      });
      
      if (milestoneResult?.status !== 'success' || 
          votingResult?.status !== 'success' || 
          userVoteResult?.status !== 'success') {
        return null;
      }

      const milestone = milestoneResult.result as any;
      const results = votingResult.result as [bigint, bigint, bigint, boolean];
      
      console.log(`Milestone ${milestoneId} raw data:`, {
        milestone,
        results,
        state: milestone.state,
        description: milestone.description,
        fundingPercentage: milestone.fundingPercentage
      });
      
      const milestoneData: Milestone = {
        id: milestoneId, // Use the actual milestone ID from the contract
        description: milestone.description || `Milestone ${milestoneId}`,
        percentage: Number(milestone.fundingPercentage || 0),
        votesFor: Number(results[0]),
        votesAgainst: Number(results[1]),
        status: milestone.state === 0 ? 'voting' : 
                milestone.state === 1 ? 'approved' : 
                milestone.state === 2 ? 'rejected' : 'pending',
        hasVoted: userVoteResult.result as boolean
      };

      // Add voting deadline if it exists
      if (milestone.voteStartTime) {
        milestoneData.deadline = milestone.voteStartTime;
      }

      console.log(`Processed milestone ${milestoneId}:`, milestoneData);

      return milestoneData;
    }).filter((m): m is Milestone => m !== null);
    
    return processedMilestones;
  }, [milestonesData, votingResultsData, userVotesData, milestoneIds, campaignId, address]);

  // Voting contract write
  const { writeContract, data: voteHash, isPending: isVoting } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: voteHash,
  });

  const voteOnMilestone = async (milestoneId: number, support: boolean) => {
    if (!campaignId || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!hasContributed) {
      toast.error('Only contributors can vote on milestones');
      return false;
    }

    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      toast.error('Milestone not found');
      return false;
    }

    if (milestone.hasVoted) {
      toast.error('You have already voted on this milestone');
      return false;
    }

    if (milestone.status !== 'voting') {
      toast.error('This milestone is not currently open for voting');
      return false;
    }

    try {
      console.log('Calling vote function:', campaignId, milestoneId, support);
      const success = await vote(campaignId, milestoneId, support);
      console.log('Vote result:', success);
      return success;
    } catch (error) {
      console.error('Voting error:', error);
      toast.error('Failed to submit vote');
      return false;
    }
  };

  // Show success/error messages based on transaction status
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Vote submitted successfully!');
    }
  }, [isConfirmed]);

  return {
    milestones,
    hasContributed,
    canVote: hasContributed && isConnected,
    isVoting: isVoting || isConfirming,
    voteOnMilestone,
  };
}

// Helper hook to get voting eligibility for multiple campaigns
export function useVotingEligibility() {
  const { contributions } = useUserContributions();
  
  const eligibleCampaigns = useMemo(() => {
    return contributions.map(c => c.id);
  }, [contributions]);

  return {
    eligibleCampaigns,
    isEligibleToVote: (campaignId: number) => eligibleCampaigns.includes(campaignId),
  };
}
