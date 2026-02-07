'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const OWNER_ADDRESS = '0x123400000000000000000000000000000000abcd';

const milestones = [
  {
    id: '1',
    title: 'Design and UI implementation',
    allocation: '$2,000 (25%)',
    status: 'Voting Open',
    progress: 80,
    action: 'Cast Vote',
  },
  {
    id: '2',
    title: 'Backend development',
    allocation: '$2,000 (25%)',
    status: 'Pending',
    progress: 0,
    action: 'Submit Proof',
  },
  {
    id: '3',
    title: 'Launch and deployment',
    allocation: '$2,000 (25%)',
    status: 'Pending',
    progress: 0,
    action: 'Submit Proof',
  },
];

export default function RaiseDetail({ params }: { params: { id: string } }) {
  const basePath = `/raise/${params.id}`;
  const { address } = useAccount();
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  return (
    <PageShell>
      <section className='grid gap-8 lg:grid-cols-[1.4fr_0.6fr]'>
        <div className='space-y-8'>
          <div className='space-y-4'>
            <h1 className='text-4xl font-semibold sm:text-5xl font-[var(--font-display)]'>
              OpenVote Registry
            </h1>
            <p className='max-w-2xl text-base text-muted-foreground'>
              OpenVote Registry is a permissionless on-chain registry for community
              elections. It enables weighted or equal-vote elections and publishes
              tamper-proof results on-chain.
            </p>
          </div>

          <Card className='overflow-hidden bg-white/80'>
            <div className='h-60 w-full bg-gradient-to-br from-emerald-100 via-emerald-50 to-sky-100' />
            <CardContent className='space-y-4'>
              <div className='flex flex-wrap items-center gap-3'>
                <Badge variant='success'>Active</Badge>
                <Badge variant='outline'>Milestone 1 in review</Badge>
                {isOwner ? <Badge variant='secondary'>Owner</Badge> : null}
              </div>
              <p className='text-sm text-muted-foreground'>
                This raise funds the registry contract, security audit, and public
                frontend. Contributors approve each milestone before funds unlock.
              </p>
            </CardContent>
          </Card>

          <div className='space-y-5'>
            {milestones.map((milestone) => (
              <Card key={milestone.id} className='bg-white/85'>
                <CardHeader>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <CardTitle>Milestone {milestone.id}</CardTitle>
                    <Badge variant={milestone.status === 'Voting Open' ? 'warning' : 'secondary'}>
                      {milestone.status}
                    </Badge>
                  </div>
                  <CardDescription>{milestone.title}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between text-sm text-muted-foreground'>
                    <span>Allocation</span>
                    <span>{milestone.allocation}</span>
                  </div>
                  <div className='space-y-2'>
                    <Progress value={milestone.progress} />
                    <div className='flex items-center justify-between text-xs text-muted-foreground'>
                      <span>{milestone.progress}% approved</span>
                      <span>{milestone.status === 'Voting Open' ? '2 days left' : 'Not started'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href={
                      milestone.action === 'Cast Vote'
                        ? `${basePath}/vote`
                        : `${basePath}/milestone/${milestone.id}/submit-proof`
                    }
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                    {milestone.action}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <Card className='bg-white/85'>
            <CardHeader>
              <CardTitle>Raise summary</CardTitle>
              <CardDescription>$5,232 out of $8,500 raised</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Progress value={62} />
              <Separator />
              <div className='space-y-2 text-sm text-muted-foreground'>
                <div className='flex items-center justify-between'>
                  <span>Created</span>
                  <span>11/11/2025</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Milestones reached</span>
                  <span>1 of 3</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Funds released</span>
                  <span>$2,000</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className='flex flex-col gap-3'>
              {isOwner ? (
                <Link
                  href={`${basePath}/milestone/1/submit-proof`}
                  className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
                  Update milestone proof
                </Link>
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
