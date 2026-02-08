import { useMemo, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'react-hot-toast';
import { TrustLockCoreAddress, TrustLockCoreABI } from '../contracts/abi/core';
import { useUserContributions } from './useUserActivity';

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
  
  // Check if user has contributed to this specific campaign
  const hasContributed = useMemo(() => {
    if (!campaignId || !address) return false;
    return contributions.some(c => c.id === campaignId);
  }, [contributions, campaignId, address]);

  // Mock milestones data for now - replace with actual contract calls
  const milestones: Milestone[] = useMemo(() => {
    if (!campaignId) return [];
    
    // This would be replaced with actual contract calls
    return [
      {
        id: 0,
        description: 'Initial development and setup',
        percentage: 25,
        votesFor: 5,
        votesAgainst: 2,
        status: 'voting',
        hasVoted: false,
      }
    ];
  }, [campaignId]);

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

    const milestone = milestones[milestoneId];
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
      writeContract({
        address: TrustLockCoreAddress,
        abi: TrustLockCoreABI,
        functionName: 'voteOnMilestone',
        args: [BigInt(campaignId), BigInt(milestoneId), support],
      });

      return true;
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
