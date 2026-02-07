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

const rules = [
  'All contributed funds are held in escrow until a milestone is approved by contributors.',
  'No individual can override milestone outcomes, voting results, or protocol rules.',
  'If milestones fail, contributors can reclaim refundable funds automatically.',
];

export default function CreateRaiseAcknowledgement() {
  const router = useRouter();
  const { address } = useAccount();

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

  const handleCreate = () => {
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

            {error && <p className='text-sm text-rose-600'>{error}</p>}

            <div className='flex flex-wrap items-center justify-end gap-3'>
              <Link
                href='/raise/create/milestones'
                className={cn(buttonVariants({ variant: 'ghost' }))}>
                Back
              </Link>
              <Button onClick={handleCreate}>Create Raise</Button>
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
