'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

import { PageShell } from '@/components/shared/page-shell';
import { RaiseStepper } from '@/components/shared/raise-stepper';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  clearDraft,
  createRaiseId,
  loadDraft,
  upsertRaise,
} from '@/lib/raise-storage';
import { useTrustLock } from '@/lib/hooks/useTrustLock';

const rules = [
  'All contributed funds are held in escrow until a milestone is approved by contributors.',
  'No individual can override milestone outcomes, voting results, or protocol rules.',
  'If milestones fail, contributors can reclaim refundable funds automatically.',
];

// Contract constants for validation
const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 1000;

export default function CreateRaiseAcknowledgement() {
  const router = useRouter();
  const { address } = useAccount();
  const { createCampaign, status, isLoading } = useTrustLock();

  const [acknowledged, setAcknowledged] = React.useState<boolean[]>(
    rules.map(() => false),
  );
  const [error, setError] = React.useState('');

  const draft = loadDraft();

  /**
   * Correct handler for shadcn / Radix Checkbox
   */
  const setAcknowledgement = (index: number, checked: boolean) => {
    setAcknowledged((current) =>
      current.map((value, idx) => (idx === index ? checked : value)),
    );
  };

  const allChecked = acknowledged.every(Boolean);

  const handleCreate = async () => {
    if (!allChecked) {
      setError('Please acknowledge each rule before publishing.');
      return;
    }

    if (
      !draft?.title ||
      !draft.description ||
      !draft.fundingGoal ||
      !draft.durationDays
    ) {
      setError('Complete the basic details before creating this raise.');
      return;
    }

    // Validate title length
    if (draft.title.length < TITLE_MIN_LENGTH || draft.title.length > TITLE_MAX_LENGTH) {
      setError(`Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters.`);
      return;
    }

    // Validate description length
    if (draft.description.length < DESCRIPTION_MIN_LENGTH || draft.description.length > DESCRIPTION_MAX_LENGTH) {
      setError(`Description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters.`);
      return;
    }

    try {
      // Create campaign on-chain first
      const success = await createCampaign({
        title: draft.title,
        description: draft.description,
        fundingGoal: String(draft.fundingGoal),
        projectDuration: Math.ceil(Number(draft.durationDays) / 7), // Convert days to weeks
        acceptsEth: draft.acceptsEth ?? true
      });

      if (!success) {
        setError('Failed to create campaign on blockchain. Please try again.');
        return;
      }

      // If on-chain creation successful, save to local storage
      const createdAt = new Date().toISOString();
      const fundingDeadline = new Date(
        Date.now() + Number(draft.durationDays) * 24 * 60 * 60 * 1000,
      ).toISOString();

      const newRaise = {
        id: createRaiseId(),
        title: draft.title,
        description: draft.description,
        fundingGoal: Number(draft.fundingGoal),
        durationDays: Number(draft.durationDays),
        createdAt,
        creator:
          address ??
          draft.creator ??
          '0x0000000000000000000000000000000000000000',
        state: 'funding' as const,
        fundingDeadline,
        fundsReleased: 0,
        totalRaised: 0,
        acceptsEth: draft.acceptsEth ?? true,
        acceptedToken: (draft.acceptedToken as 'eth' | 'faucet') ?? 'eth',
        milestones: draft.milestones ?? [],
      };

      upsertRaise(newRaise);
      clearDraft();

      router.push(`/raise/${newRaise.id}?created=1`);
    } catch (error) {
      console.error('Campaign creation error:', error);
      setError('Failed to create campaign. Please check your wallet and try again.');
    }
  };

  return (
    <PageShell>
      <section className='space-y-4'>
        <Badge variant='secondary' className='w-fit'>
          Create a Raise
        </Badge>
        <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
          Acknowledge the protocol rules.
        </h1>
        <RaiseStepper currentStep={3} />
      </section>

      <section className='mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]'>
        <Card className='bg-white/85'>
          <CardHeader>
            <CardTitle>Before you publish</CardTitle>
          </CardHeader>

          <CardContent className='space-y-6'>
            <p className='text-sm text-muted-foreground'>
              Before this raise can be created, you must explicitly acknowledge
              the rules enforced by the TRUSTLOCK protocol. These rules are
              automatic and apply equally to all participants.
            </p>

            <div className='space-y-4'>
              {rules.map((rule, index) => (
                <label key={rule} className='flex items-start gap-3 text-sm'>
                  <input
                    type='checkbox'
                    checked={acknowledged[index]}
                    onChange={(e) =>
                      setAcknowledgement(index, e.target.checked)
                    }
                    className='mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-0'
                  />

                  <span className='text-muted-foreground'>{rule}</span>
                </label>
              ))}
            </div>

            <div className='rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700'>
              Creating this raise is irreversible. Once published, milestone
              structure, funding rules, and protocol constraints cannot be
              changed.
            </div>

            {error && (
              <div className='rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex items-center gap-2'>
                <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                </svg>
                {error}
              </div>
            )}
            
            {status && (
              <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 flex items-center gap-2'>
                {isLoading ? (
                  <svg className='h-4 w-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                ) : status.includes('✅') ? (
                  <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                  </svg>
                ) : (
                  <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                )}
                {status}
              </div>
            )}

            <div className='flex flex-wrap items-center justify-end gap-3'>
              <Link
                href='/raise/create/milestones'
                className={cn(buttonVariants({ variant: 'ghost' }))}>
                Back
              </Link>
              <Button 
                onClick={handleCreate}
                disabled={isLoading || !allChecked}
              >
                {isLoading ? 'Creating...' : 'Create Raise'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white/70'>
          <CardHeader>
            <CardTitle>Publishing tips</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm text-muted-foreground'>
            <p>
              Strong raises outline outcomes, timelines, and evidence
              expectations up front. Aim for clarity and measurable progress.
            </p>
            <p>
              Consider including supporting links or docs for each milestone.
            </p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
