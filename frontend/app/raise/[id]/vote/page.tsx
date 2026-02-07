'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { FeedbackModal } from '@/components/shared/feedback-modal';
import { getRaise, upsertRaise, type LocalRaise } from '@/lib/raise-storage';

export default function VotePage({ params }: { params: { id: string } }) {
  const basePath = `/raise/${params.id}`;
  const router = useRouter();
  const [showModal, setShowModal] = React.useState(false);
  const [latestVote, setLatestVote] = React.useState<'for' | 'against' | null>(null);

  const handleVote = (support: boolean) => {
    const raise = getRaise(params.id);
    if (raise && raise.milestones.length > 0) {
      const milestone = raise.milestones[0];
      const updatedMilestones = raise.milestones.map((item) =>
        item.id === milestone.id
          ? {
              ...item,
              votesFor: support ? item.votesFor + 1 : item.votesFor,
              votesAgainst: support ? item.votesAgainst : item.votesAgainst + 1,
              status: 'voting',
            }
          : item,
      );
      const updatedRaise: LocalRaise = {
        ...raise,
        milestones: updatedMilestones,
      };
      upsertRaise(updatedRaise);
    }

    setLatestVote(support ? 'for' : 'against');
    setShowModal(true);
  };

  const handleReturn = () => {
    router.push(`${basePath}?voted=1`);
  };

  return (
    <PageShell>
      <FeedbackModal
        open={showModal}
        title='Vote submitted'
        description={`You voted ${latestVote === 'for' ? 'YES' : 'NO'} on this milestone.`}
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
          Milestone Vote
        </Badge>
        <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
          Vote on Milestone 1
        </h1>
      </section>

      <section className='mt-10 flex items-center justify-center'>
        <Card className='w-full max-w-3xl bg-white/90'>
          <CardHeader>
            <CardTitle>Votes are final</CardTitle>
          </CardHeader>
          <CardContent className='space-y-5 text-sm text-muted-foreground'>
            <p>
              Review the submitted proof carefully. Once you cast your vote, it is
              recorded on-chain and cannot be reversed.
            </p>
            <Separator />
            <div className='space-y-2'>
              <p className='font-medium text-foreground'>Supporting files</p>
              <div className='flex flex-wrap gap-3'>
                <Link
                  href='/'
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                  GitHub link
                </Link>
                <Link
                  href='/'
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                  Figma file
                </Link>
              </div>
            </div>
            <Separator />
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <Link href={basePath} className={cn(buttonVariants({ variant: 'ghost' }))}>
                Back to raise
              </Link>
              <div className='flex flex-wrap gap-3'>
                <Button variant='outline' onClick={() => handleVote(false)}>
                  No, reject
                </Button>
                <Button onClick={() => handleVote(true)}>Yes, approve</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
