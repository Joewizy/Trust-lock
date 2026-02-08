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
import { useTrustLock } from '@/lib/hooks/useTrustLock';
import { CampaignState } from '@/lib/contracts/types';
import { sepolia } from 'wagmi/chains';

const formatAddress = (address: string) => 
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const formatEtherAmount = (value: bigint | string | undefined) => {
  try {
    if (value == null) return '0.0000';
    const wei = typeof value === 'bigint' ? value : BigInt(String(value));
    return parseFloat(formatEther(wei)).toFixed(4);
  } catch {
    return '0.0000';
  }
};

const formatDate = (timestamp: bigint | number | undefined) => {
  if (timestamp == null) return '—';
  const sec = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  return new Date(sec * 1000).toLocaleDateString();
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
  
  const { useCampaign, createMilestone, status, loading } = useTrustLock();
  const { campaign: campaignData, refetchCampaign, isLoading: isCampaignLoading } = useCampaign(campaignId);

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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
            <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Funding Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatEtherAmount(campaign.fundingGoal)} ETH
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Total Raised
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatEtherAmount(campaign.totalRaised)} ETH
                  </div>
                </CardContent>
              </Card>

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
                      {formatAddress(campaign.creator)}
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

            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Funding Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercentage} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Raised</span>
                    <div className="font-semibold">{formatEtherAmount(campaign.totalRaised)} ETH</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Goal</span>
                    <div className="font-semibold">{formatEtherAmount(campaign.fundingGoal)} ETH</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            {!isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleContribute}
                    className="w-full"
                    disabled={campaign.state !== CampaignState.FUNDING}
                  >
                    Contribute to Raise
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {campaign.state === CampaignState.FUNDING 
                      ? 'Help fund this milestone-based raise'
                      : 'This raise is no longer accepting contributions'
                    }
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Create Milestone Card (Owner Only) */}
            {isOwner && (
              <Card id='create-milestone' className='bg-white/85'>
                <CardHeader>
                  <CardTitle>Create a Milestone</CardTitle>
                  <CardDescription>
                    Milestones can be created once the funding goal is reached.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {!fundingGoalMet ? (
                    <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700'>
                      Funding goal not met yet. Once the raise reaches {formatEtherAmount(campaign.fundingGoal)} ETH,
                      you can create milestones.
                    </div>
                  ) : (
                    <>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Milestone Description</label>
                        <Textarea
                          value={milestoneDescription}
                          onChange={(e) => setMilestoneDescription(e.target.value)}
                          placeholder='Describe what will be delivered for this milestone.'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Funds to Request (%)</label>
                        <Input
                          type='number'
                          min={5}
                          max={25}
                          step={5}
                          value={milestonePercent}
                          onChange={(e) => setMilestonePercent(e.target.value)}
                          placeholder='10'
                        />
                        {milestoneError ? (
                          <p className='text-xs text-rose-600'>{milestoneError}</p>
                        ) : (
                          <p className='text-xs text-muted-foreground'>
                            Must be a multiple of 5, between 5% and 25%.
                          </p>
                        )}
                      </div>
                      <Button 
                        onClick={handleCreateMilestone}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Creating...' : 'Create Milestone'}
                      </Button>
                      {status && (
                        <p className="text-sm text-center">{status}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Summary Card */}
            <Card className='bg-white/85'>
              <CardHeader>
                <CardTitle>Raise Summary</CardTitle>
                <CardDescription>
                  {formatEtherAmount(campaign.totalRaised)} out of {formatEtherAmount(campaign.fundingGoal)} ETH raised
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Progress value={progressPercentage} />
                <Separator />
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <div className='flex items-center justify-between'>
                    <span>Creator</span>
                    <span className="font-mono">{formatAddress(campaign.creator)}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Deadline</span>
                    <span>{formatDate(deadline)}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>State</span>
                    <span>{getStateText(campaign.state)}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Accepts</span>
                    <span>{campaign.acceptsEth ? 'ETH' : 'ERC20'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}