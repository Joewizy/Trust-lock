'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getRaise } from '@/lib/raise-storage';
import { InlineToast } from '@/components/shared/inline-toast';

export default function MilestonePage({
  params,
}: {
  params: { id: string; milestoneId: string };
}) {
  const searchParams = useSearchParams();
  const [showToast, setShowToast] = React.useState(false);

  const raise = getRaise(params.id);
  const milestone = raise?.milestones.find((item) => item.id === params.milestoneId);

  React.useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowToast(true);
    }
  }, [searchParams]);

  const voteProgress = milestone
    ? milestone.votesFor + milestone.votesAgainst > 0
      ? Math.round(
          (milestone.votesFor /
            (milestone.votesFor + milestone.votesAgainst)) *
            100,
        )
      : 0
    : 0;

  return (
    <PageShell>
      <InlineToast
        open={showToast}
        onClose={() => setShowToast(false)}
        title='Milestone created'
        description='Share proof with contributors to open voting.'
      />
      <section className='space-y-4'>
        <Badge variant='secondary' className='w-fit'>
          Milestone Overview
        </Badge>
        <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
          Milestone {params.milestoneId}
        </h1>
      </section>

      <section className='mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
        <Card className='bg-white/85'>
          <CardHeader>
            <CardTitle>Milestone details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-sm text-muted-foreground'>
            <p>{milestone?.description ?? 'No milestone data available.'}</p>
            <div className='space-y-2'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                Allocation
              </p>
              <p className='text-sm text-foreground'>{milestone?.percent ?? 0}%</p>
            </div>
            <div className='space-y-2'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                Voting progress
              </p>
              <Progress value={voteProgress} />
              <p className='text-xs text-muted-foreground'>{voteProgress}% approved</p>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white/85'>
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Link
              href={`/raise/${params.id}/milestone/${params.milestoneId}/submit-proof`}
              className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
              Submit proof
            </Link>
            <Link
              href={`/raise/${params.id}/vote`}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
              Review and vote
            </Link>
            <Link
              href={`/raise/${params.id}`}
              className={cn(buttonVariants({ variant: 'ghost' }), 'w-full')}>
              Back to raise
            </Link>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
