'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FeedbackModal } from '@/components/shared/feedback-modal';
import { useVoting, type Milestone } from '@/lib/hooks/useVoting';
import { useCampaign } from '@/lib/hooks/useTrustLock';
import { CampaignState } from '@/lib/contracts/types';

export default function VotePage({ params }: { params: { id: string } }) {
  const routeParams = useParams();
  const basePath = `/raise/${routeParams.id}`;
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const campaignId = routeParams.id ? parseInt(routeParams.id as string) : undefined;
  
  const { campaign, isLoading: isCampaignLoading } = useCampaign(campaignId);
  
  // Debug logging
  console.log('VotePage - Campaign ID:', campaignId, 'from params:', routeParams.id);
  console.log('VotePage - Campaign data:', campaign);
  console.log('VotePage - Campaign loading:', isCampaignLoading);
  
  const { 
    milestones, 
    hasContributed, 
    canVote, 
    isVoting, 
    voteOnMilestone 
  } = useVoting(campaignId);

  const [showModal, setShowModal] = React.useState(false);
  const [latestVote, setLatestVote] = React.useState<'for' | 'against' | null>(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState<Milestone | null>(null);

  const handleVote = async (milestone: Milestone, support: boolean) => {
    setSelectedMilestone(milestone);
    const success = await voteOnMilestone(milestone.id, support);
    
    if (success) {
      setLatestVote(support ? 'for' : 'against');
      setShowModal(true);
    }
  };

  const handleReturn = () => {
    router.push(`${basePath}?voted=1`);
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'voting':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'voting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConnected) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-semibold">Connect Your Wallet</h1>
          <p className="text-muted-foreground">Please connect your wallet to vote on milestones.</p>
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

  if (!campaign) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-semibold">Campaign Not Found</h1>
          <p className="text-muted-foreground">This campaign doesn't exist or has been removed.</p>
          <Link href="/raises">
            <Button>Back to Raises</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!hasContributed) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Not Eligible to Vote</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Only contributors to this campaign can vote on milestones. 
            Contribute to the campaign to gain voting rights.
          </p>
          <Link href={`/raise/${routeParams.id}/contribute`}>
            <Button>Contribute to Campaign</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <FeedbackModal
        open={showModal}
        title='Vote submitted'
        description={`You voted ${latestVote === 'for' ? 'YES' : 'NO'} on milestone: ${selectedMilestone?.description}`}
        primaryAction={{
          label: 'Back to raise',
          onClick: handleReturn,
        }}
        secondaryAction={{
          label: 'Close',
          onClick: () => setShowModal(false),
        }}
      />
      
      <section className='space-y-4'>
        <Badge variant='secondary' className='w-fit'>
          Milestone Voting
        </Badge>
        <div>
          <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
            Vote on Milestones
          </h1>
          <p className="text-muted-foreground mt-2">
            Campaign: {campaign.title || 'Untitled Campaign'}
          </p>
        </div>
      </section>

      <section className='mt-10 space-y-6'>
        {milestones.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <p className="text-muted-foreground">No milestones available for voting yet.</p>
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone) => (
            <Card key={milestone.id} className='w-full'>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        Milestone {milestone.id + 1}
                      </CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={cn(getStatusColor(milestone.status))}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(milestone.status)}
                          {milestone.status}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {milestone.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Funds: {milestone.percentage}%</span>
                      <span>•</span>
                      <span>For: {milestone.votesFor}</span>
                      <span>•</span>
                      <span>Against: {milestone.votesAgainst}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className='space-y-4'>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Voting Progress</span>
                    <span className="font-semibold">
                      {milestone.votesFor + milestone.votesAgainst} votes
                    </span>
                  </div>
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
                </div>
                
                <Separator />
                
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {milestone.hasVoted ? (
                      <span className="text-amber-600">You have already voted on this milestone</span>
                    ) : canVote ? (
                      <span>Review milestone proof before voting</span>
                    ) : (
                      <span>Connect wallet to vote</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Link href={basePath} className={cn(buttonVariants({ variant: 'ghost' }))}>
                      Back to raise
                    </Link>
                    {canVote && !milestone.hasVoted && (
                      <>
                        <Button 
                          variant='outline' 
                          onClick={() => handleVote(milestone, false)}
                          disabled={isVoting}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          No, reject
                        </Button>
                        <Button 
                          onClick={() => handleVote(milestone, true)}
                          disabled={isVoting}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Yes, approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </PageShell>
  );
}
