'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  getRaise,
  upsertRaise,
  type LocalMilestone,
  type LocalRaise,
} from '@/lib/raise-storage';
import { InlineToast } from '@/components/shared/inline-toast';
import { FeedbackModal } from '@/components/shared/feedback-modal';

const OWNER_ADDRESS = '0x123400000000000000000000000000000000abcd';

const demoRaise: LocalRaise = {
  id: 'openvote',
  title: 'OpenVote Registry',
  description:
    'OpenVote Registry is a permissionless on-chain registry for community elections. It enables weighted or equal-vote elections and publishes tamper-proof results on-chain.',
  fundingGoal: 8500,
  durationDays: 45,
  createdAt: '2025-11-11T00:00:00.000Z',
  creator: OWNER_ADDRESS,
  state: 'active',
  fundingDeadline: '2025-12-26T00:00:00.000Z',
  fundsReleased: 2000,
  totalRaised: 5232,
  acceptsEth: true,
  acceptedToken: 'eth',
  milestones: [
    {
      id: '1',
      description: 'Design and UI implementation',
      percent: 25,
      createdAt: '2025-11-20T00:00:00.000Z',
      status: 'voting',
      votesFor: 80,
      votesAgainst: 20,
    },
    {
      id: '2',
      description: 'Backend development',
      percent: 25,
      createdAt: '2025-12-01T00:00:00.000Z',
      status: 'draft',
      votesFor: 0,
      votesAgainst: 0,
    },
    {
      id: '3',
      description: 'Launch and deployment',
      percent: 25,
      createdAt: '2025-12-10T00:00:00.000Z',
      status: 'draft',
      votesFor: 0,
      votesAgainst: 0,
    },
  ],
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const formatAddress = (value?: string) => {
  if (!value) return '—';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const stateLabels: Record<LocalRaise['state'], string> = {
  funding: 'Funding',
  active: 'Active',
  voting: 'Voting',
  completed: 'Completed',
  failed: 'Failed',
};

export default function RaiseDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();

  const [localRaise, setLocalRaise] = React.useState<LocalRaise | null>(null);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);

  const [milestoneDescription, setMilestoneDescription] = React.useState('');
  const [milestonePercent, setMilestonePercent] = React.useState('');
  const [milestoneError, setMilestoneError] = React.useState('');

  React.useEffect(() => {
    const storedRaise = getRaise(params.id);
    setLocalRaise(storedRaise);
  }, [params.id]);

  React.useEffect(() => {
    const created = searchParams.get('created');
    const voted = searchParams.get('voted');
    if (created === '1') {
      setToastMessage('Raise created successfully.');
      setShowToast(true);
      setShowModal(true);
    }
    if (voted === '1') {
      setToastMessage('Vote recorded successfully.');
      setShowToast(true);
    }
  }, [searchParams]);

  const raise = localRaise ?? demoRaise;
  const basePath = `/raise/${params.id}`;
  const isOwner = address
    ? address.toLowerCase() === raise.creator.toLowerCase()
    : raise.creator.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const fundingProgress = raise.fundingGoal
    ? Math.min(100, Math.round((raise.totalRaised / raise.fundingGoal) * 100))
    : 0;

  const fundingGoalMet = raise.totalRaised >= raise.fundingGoal;

  const milestones = raise.milestones.length > 0 ? raise.milestones : [];

  const handleCreateMilestone = () => {
    const percent = Number(milestonePercent);
    if (!milestoneDescription.trim()) {
      setMilestoneError('Milestone description is required.');
      return;
    }
    if (!milestonePercent || Number.isNaN(percent)) {
      setMilestoneError('Enter the funding percent for this milestone.');
      return;
    }
    if (percent % 5 !== 0) {
      setMilestoneError('Funding percent must be a multiple of 5.');
      return;
    }
    if (milestones.length === 0 && percent > 10) {
      setMilestoneError('First milestone cannot exceed 10%.');
      return;
    }
    if (percent > 25) {
      setMilestoneError('Milestones cannot exceed 25%.');
      return;
    }

    const newMilestone: LocalMilestone = {
      id: String(milestones.length + 1),
      description: milestoneDescription.trim(),
      percent,
      createdAt: new Date().toISOString(),
      status: 'voting',
      votesFor: 0,
      votesAgainst: 0,
    };

    const updatedRaise: LocalRaise = {
      ...raise,
      milestones: [...milestones, newMilestone],
    };

    if (localRaise) {
      upsertRaise(updatedRaise);
      setLocalRaise(updatedRaise);
    }

    setMilestoneDescription('');
    setMilestonePercent('');
    setMilestoneError('');

    router.push(`/raise/${params.id}/milestone/${newMilestone.id}?created=1`);
  };

  return (
    <PageShell>
      <InlineToast
        open={showToast}
        onClose={() => setShowToast(false)}
        title={toastMessage}
        description='Head to the raise timeline to see the latest updates.'
      />
      <FeedbackModal
        open={showModal}
        title='Update complete'
        description='Your latest action has been recorded on the raise.'
        primaryAction={{
          label: 'Continue',
          onClick: () => setShowModal(false),
        }}
      />

      <section className='grid gap-8 lg:grid-cols-[1.4fr_0.6fr]'>
        <div className='space-y-8'>
          <div className='space-y-4'>
            <h1 className='text-4xl font-semibold sm:text-5xl font-[var(--font-display)]'>
              {raise.title}
            </h1>
            <p className='max-w-2xl text-base text-muted-foreground'>
              {raise.description}
            </p>
          </div>

          <Card className='overflow-hidden bg-white/80'>
            <div className='h-60 w-full bg-gradient-to-br from-emerald-100 via-emerald-50 to-sky-100' />
            <CardContent className='space-y-4'>
              <div className='flex flex-wrap items-center gap-3'>
                <Badge variant='success'>{stateLabels[raise.state]}</Badge>
                {fundingGoalMet ? (
                  <Badge variant='outline'>Funding goal met</Badge>
                ) : (
                  <Badge variant='secondary'>Funding in progress</Badge>
                )}
                {isOwner ? <Badge variant='secondary'>Creator</Badge> : null}
              </div>
              <p className='text-sm text-muted-foreground'>
                Funding milestones unlock after contributors vote. Track approvals,
                submit proof, and release funds with confidence.
              </p>
            </CardContent>
          </Card>

          {isOwner ? (
            <Card id='create-milestone' className='bg-white/85'>
              <CardHeader>
                <CardTitle>Create a milestone</CardTitle>
                <CardDescription>
                  Funding must be active before you can request milestone releases.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {!fundingGoalMet ? (
                  <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700'>
                    Funding goal not met yet. Once the raise reaches the funding goal,
                    you can create milestones.
                  </div>
                ) : (
                  <>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Milestone description</label>
                      <Textarea
                        value={milestoneDescription}
                        onChange={(event) => setMilestoneDescription(event.target.value)}
                        placeholder='Describe the proof you will submit for this milestone.'
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Funds to request (%)</label>
                      <Input
                        type='number'
                        min={0}
                        max={25}
                        value={milestonePercent}
                        onChange={(event) => setMilestonePercent(event.target.value)}
                        placeholder='10'
                      />
                      {milestoneError ? (
                        <p className='text-xs text-rose-600'>{milestoneError}</p>
                      ) : (
                        <p className='text-xs text-muted-foreground'>
                          Multiples of 5 only. First milestone max 10%, all milestones
                          max 25%.
                        </p>
                      )}
                    </div>
                    <Button onClick={handleCreateMilestone}>
                      Create milestone
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}

          <div className='space-y-5'>
            {milestones.length === 0 ? (
              <Card className='bg-white/85'>
                <CardContent className='py-8 text-sm text-muted-foreground'>
                  No milestones yet. Once funding is active, the creator can add the
                  first milestone for contributors to review.
                </CardContent>
              </Card>
            ) : (
              milestones.map((milestone) => {
                const voteProgress =
                  milestone.votesFor + milestone.votesAgainst > 0
                    ? Math.round(
                        (milestone.votesFor /
                          (milestone.votesFor + milestone.votesAgainst)) *
                          100,
                      )
                    : 0;
                const statusLabel =
                  milestone.status === 'voting'
                    ? 'Voting Open'
                    : milestone.status === 'approved'
                      ? 'Approved'
                      : milestone.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending';

                return (
                  <Card key={milestone.id} className='bg-white/85'>
                    <CardHeader>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <CardTitle>Milestone {milestone.id}</CardTitle>
                        <Badge
                          variant={
                            milestone.status === 'voting'
                              ? 'warning'
                              : milestone.status === 'approved'
                                ? 'success'
                                : 'secondary'
                          }>
                          {statusLabel}
                        </Badge>
                      </div>
                      <CardDescription>{milestone.description}</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex items-center justify-between text-sm text-muted-foreground'>
                        <span>Allocation</span>
                        <span>{milestone.percent}%</span>
                      </div>
                      <div className='space-y-2'>
                        <Progress value={voteProgress} />
                        <div className='flex items-center justify-between text-xs text-muted-foreground'>
                          <span>{voteProgress}% approved</span>
                          <span>
                            {milestone.status === 'voting'
                              ? 'Voting open'
                              : 'Not started'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className='flex flex-wrap gap-3'>
                      <Link
                        href={`${basePath}/milestone/${milestone.id}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                        View milestone
                      </Link>
                      {milestone.status === 'voting' ? (
                        <Link
                          href={`${basePath}/vote`}
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'sm' }),
                          )}>
                          Cast vote
                        </Link>
                      ) : null}
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <div className='space-y-6'>
          <Card className='bg-white/85'>
            <CardHeader>
              <CardTitle>Raise summary</CardTitle>
              <CardDescription>
                ${raise.totalRaised.toLocaleString()} out of ${raise.fundingGoal.toLocaleString()} raised
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Progress value={fundingProgress} />
              <Separator />
              <div className='space-y-2 text-sm text-muted-foreground'>
                <div className='flex items-center justify-between'>
                  <span>Created</span>
                  <span>{formatDate(raise.createdAt)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Creator</span>
                  <span>{formatAddress(raise.creator)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Duration</span>
                  <span>{raise.durationDays} days</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Funding goal</span>
                  <span>${raise.fundingGoal.toLocaleString()}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Funding deadline</span>
                  <span>{formatDate(raise.fundingDeadline)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>State</span>
                  <span>{stateLabels[raise.state]}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Funds released</span>
                  <span>${raise.fundsReleased.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className='flex flex-col gap-3'>
              {isOwner ? (
                <Button
                  className='w-full'
                  disabled={!fundingGoalMet}
                  onClick={() => {
                    if (fundingGoalMet) {
                      document
                        .querySelector('#create-milestone')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}>
                  Create milestone
                </Button>
              ) : (
                <Link
                  href={`${basePath}/contribute`}
                  className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
                  Contribute to Raise
                </Link>
              )}
              <Link
                href={`${basePath}/milestone/1/submit-proof`}
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
                Submit milestone proof
              </Link>
              <Link
                href={`${basePath}/vote`}
                className={cn(buttonVariants({ variant: 'ghost' }), 'w-full')}>
                Review and vote
              </Link>
            </CardFooter>
          </Card>

          <Card className='bg-emerald-600 text-white'>
            <CardHeader>
              <CardTitle className='text-white'>Share this raise</CardTitle>
              <CardDescription className='text-emerald-50'>
                Invite contributors and keep the momentum going.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href='/'
                className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
                Copy share link
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
