'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Calendar, DollarSign, Target, Users } from 'lucide-react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { formatEther } from 'viem';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCampaign, useTrustLockRaiseActions } from '@/lib/hooks/useTrustLock';
import { useVoting, type Milestone } from '@/lib/hooks/useVoting';
import { CampaignState } from '@/lib/contracts/types';
import { sepolia } from 'wagmi/chains';
import { useEnsName } from 'wagmi';
import { CheckCircle, XCircle, Clock, Vote } from 'lucide-react';

const formatAddress = (address: string) => 
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const formatEtherAmount = (value: bigint | string | undefined) => {
  try {
    if (value == null) return '0.00';
    const wei = typeof value === 'bigint' ? value : BigInt(String(value));
    const amount = parseFloat(formatEther(wei));
    return amount.toFixed(2);
  } catch {
    return '0.00';
  }
};

const getTokenSymbol = (acceptsEth: boolean, acceptedToken?: string) => {
  if (acceptsEth) return 'ETH';
  return 'USD'; 
};

const formatDate = (timestamp: bigint | number | undefined) => {
  if (timestamp == null) return '—';
  const sec = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  const date = new Date(sec * 1000);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If deadline is within 30 days, show relative time
  if (diffDays >= 0 && diffDays <= 30) {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return `In ${diffDays} days`;
  }
  
  // If deadline is overdue
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    if (overdueDays === 1) return 'Yesterday';
    if (overdueDays <= 7) return `${overdueDays} days ago`;
    return `${overdueDays} days ago`;
  }
  
  // Otherwise show formatted date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
};

const getStateColor = (state: CampaignState) => {
  switch (state) {
    case CampaignState.FUNDING:
      return 'bg-blue-100 text-blue-800';
    case CampaignState.ACTIVE:
      return 'bg-green-100 text-green-800';
    case CampaignState.VOTING:
      return 'bg-yellow-100 text-yellow-800';
    case CampaignState.COMPLETED:
      return 'bg-purple-100 text-purple-800';
    case CampaignState.FAILED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStateText = (state: CampaignState) => {
  switch (state) {
    case CampaignState.FUNDING:
      return 'Funding';
    case CampaignState.ACTIVE:
      return 'Active';
    case CampaignState.VOTING:
      return 'Voting';
    case CampaignState.COMPLETED:
      return 'Completed';
    case CampaignState.FAILED:
      return 'Failed';
    default:
      return 'Unknown';
  }
};

export default function RaisePage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const campaignId = params.id ? parseInt(params.id as string) : undefined;
  
  const { campaign: campaignData, refetchCampaign, isLoading: isCampaignLoading } = useCampaign(campaignId);
  const { createMilestone, status, loading } = useTrustLockRaiseActions();
  const { 
    milestones, 
    hasContributed, 
    canVote, 
    isVoting, 
    voteOnMilestone 
  } = useVoting(campaignId);
  const { data: creatorEnsName } = useEnsName({
    address: campaignData?.creator as `0x${string}`,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(campaignData?.creator),
    },
  });

  // Milestone creation state
  const [milestoneDescription, setMilestoneDescription] = React.useState('');
  const [milestonePercent, setMilestonePercent] = React.useState('');
  const [milestoneError, setMilestoneError] = React.useState('');

  const handleCreatorClick = (creatorAddress: string) => {
    const url = `${sepolia.blockExplorers?.default?.url}/address/${creatorAddress}`;
    window.open(url, '_blank');
  };

  const handleContribute = () => {
    if (!campaignId) return;
    router.push(`/raise/${campaignId}/contribute`);
  };

  const handleCreateMilestone = async () => {
    if (!campaignId) return;

    // Validate
    const percent = Number(milestonePercent);
    if (!milestoneDescription || !milestonePercent) {
      setMilestoneError('Please fill in all fields');
      return;
    }

    if (percent < 5 || percent > 25 || percent % 5 !== 0) {
      setMilestoneError('Percentage must be between 5-25% and a multiple of 5');
      return;
    }

    setMilestoneError('');

    const success = await createMilestone(campaignId, milestoneDescription, percent);
    
    if (success) {
      toast.success('Milestone created!');
      setMilestoneDescription('');
      setMilestonePercent('');
      refetchCampaign();
    } else {
      toast.error('Failed to create milestone');
    }
  };

  if (!isConnected) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-semibold">Connect Your Wallet</h1>
          <p className="text-muted-foreground">Please connect your wallet to view this raise.</p>
        </div>
      </PageShell>
    );
  }

  if (!campaignId) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-semibold">Raise Not Found</h1>
          <p className="text-muted-foreground">Invalid campaign ID.</p>
          <Link href="/raises">
            <Button>Back to Raises</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  if (isCampaignLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </PageShell>
    );
  }

  if (!campaignData) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-semibold">Raise Not Found</h1>
          <p className="text-muted-foreground">This raise doesn't exist or has been removed.</p>
          <Link href="/raises">
            <Button>Back to Raises</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const campaign = campaignData;

  // Contract uses fundingDeadline (uint64) - viem returns bigint or number
  const deadline = (campaign as { deadline?: bigint }).deadline ?? campaign.fundingDeadline;
  const title = campaign.title ?? 'Campaign';
  const description = campaign.description ?? '';

  // Calculate progress (handle bigint or string from contract)
  const totalRaisedWei = typeof campaign.totalRaised === 'bigint' ? campaign.totalRaised : BigInt(String(campaign.totalRaised ?? '0'));
  const fundingGoalWei = typeof campaign.fundingGoal === 'bigint' ? campaign.fundingGoal : BigInt(String(campaign.fundingGoal ?? '1'));
  const totalRaised = Number(formatEther(totalRaisedWei));
  const fundingGoal = Number(formatEther(fundingGoalWei));
  const progressPercentage = Math.min((totalRaised / fundingGoal) * 100, 100);
  const fundingGoalMet = totalRaised >= fundingGoal;
  const isOwner = address?.toLowerCase() === campaign.creator.toLowerCase();
  const tokenSymbol = getTokenSymbol(campaign.acceptsEth, campaign.acceptedToken);

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/raises">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Raises
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold">{title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className={cn(getStateColor(campaign.state))}
              >
                {getStateText(campaign.state)}
              </Badge>
              {campaign.acceptsEth && (
                <Badge variant="outline">ETH</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Campaign Header with Progress */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">{title}</h2>
                    <p className="text-muted-foreground">{description}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(getStateColor(campaign.state))}
                  >
                    {getStateText(campaign.state)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Funding Progress</span>
                    <span className="font-semibold">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercentage} />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Raised</span>
                      <div className="font-semibold">{formatEtherAmount(campaign.totalRaised)} {tokenSymbol}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Goal</span>
                      <div className="font-semibold">{formatEtherAmount(campaign.fundingGoal)} {tokenSymbol}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Section */}
            {milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5" />
                      Milestones
                    </CardTitle>
                    {hasContributed && (
                      <Badge variant="secondary">You can vote</Badge>
                    )}
                  </div>
                  <CardDescription>
                    Track progress and vote on milestone completions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">Milestone {milestone.id + 1}</h4>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                milestone.status === 'approved' && "border-green-200 text-green-700",
                                milestone.status === 'rejected' && "border-red-200 text-red-700", 
                                milestone.status === 'voting' && "border-yellow-200 text-yellow-700",
                                milestone.status === 'pending' && "border-gray-200 text-gray-700"
                              )}
                            >
                              <div className="flex items-center gap-1">
                                {milestone.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                                {milestone.status === 'rejected' && <XCircle className="h-3 w-3" />}
                                {milestone.status === 'voting' && <Clock className="h-3 w-3" />}
                                {milestone.status}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Funds: {milestone.percentage}%</span>
                            <span>•</span>
                            <span>For: {milestone.votesFor}</span>
                            <span>•</span>
                            <span>Against: {milestone.votesAgainst}</span>
                          </div>
                        </div>
                      </div>

                      {milestone.status === 'voting' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-xs text-green-600">For ({milestone.votesFor})</div>
                              <Progress 
                                value={milestone.votesFor + milestone.votesAgainst > 0 
                                  ? (milestone.votesFor / (milestone.votesFor + milestone.votesAgainst)) * 100 
                                  : 0} 
                                className="h-2 bg-green-100"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-red-600">Against ({milestone.votesAgainst})</div>
                              <Progress 
                                value={milestone.votesFor + milestone.votesAgainst > 0 
                                  ? (milestone.votesAgainst / (milestone.votesFor + milestone.votesAgainst)) * 100 
                                  : 0} 
                                className="h-2 bg-red-100"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {milestone.hasVoted ? (
                                <span className="text-amber-600">You have voted</span>
                              ) : hasContributed ? (
                                <span>Vote on this milestone</span>
                              ) : (
                                <span>Contribute to vote</span>
                              )}
                            </span>
                            
                            {milestone.status === 'voting' && !milestone.hasVoted && hasContributed && (
                              <div className="flex gap-2">
                                <Link href={`/raise/${campaignId}/vote`}>
                                  <Button size="sm" variant="outline">
                                    <Vote className="mr-2 h-3 w-3" />
                                    Vote Now
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Campaign Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Deadline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {formatDate(deadline)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Creator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-mono text-sm">
                      {creatorEnsName || formatAddress(campaign.creator)}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCreatorClick(campaign.creator)}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      View on Etherscan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contribute Button */}
            {!isOwner && (
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={handleContribute}
                    className="w-full"
                    size="lg"
                  >
                    Contribute to Raise
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {campaign.state === CampaignState.FUNDING 
                      ? 'Help fund this milestone-based raise'
                      : 'This raise is no longer accepting contributions'
                    }
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Create Milestone (Owner Only) */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create Milestone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!fundingGoalMet ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      Funding goal not met yet. Once the raise reaches {formatEtherAmount(campaign.fundingGoal)} {tokenSymbol}, you can create milestones.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={milestoneDescription}
                          onChange={(e) => setMilestoneDescription(e.target.value)}
                          placeholder="Describe what will be delivered"
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Funds (%)</label>
                        <Input
                          type="number"
                          min={5}
                          max={25}
                          step={5}
                          value={milestonePercent}
                          onChange={(e) => setMilestonePercent(e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <Button 
                        onClick={handleCreateMilestone}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Creating...' : 'Create Milestone'}
                      </Button>
                      {milestoneError && (
                        <p className="text-xs text-rose-600">{milestoneError}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">State</span>
                  <span>{getStateText(campaign.state)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Accepts</span>
                  <span>{campaign.acceptsEth ? 'ETH' : 'ERC20'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Creator</span>
                  <span className="font-mono text-xs">{creatorEnsName || formatAddress(campaign.creator)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}