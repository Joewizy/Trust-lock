'use client';

import * as React from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';

import { PageShell } from '@/components/shared/page-shell';
import { RaiseStepper } from '@/components/shared/raise-stepper';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { loadDraft, saveDraft } from '@/lib/raise-storage';

type DraftMilestone = {
  id: string;
  description: string;
  percent: string;
};

const createMilestone = (index: number): DraftMilestone => ({
  id: `draft-${Date.now()}-${index}`,
  description: '',
  percent: '',
});

export default function CreateRaiseMilestones() {
  const [milestones, setMilestones] = React.useState<DraftMilestone[]>([]);

  React.useEffect(() => {
    const draft = loadDraft();
    if (draft?.milestones && Array.isArray(draft.milestones)) {
      const restored = draft.milestones.map((milestone, index) => ({
        id: milestone.id ?? `draft-${Date.now()}-${index}`,
        description: milestone.description ?? '',
        percent: milestone.percent ? String(milestone.percent) : '',
      }));
      setMilestones(restored);
      return;
    }
    setMilestones([]);
  }, []);

  React.useEffect(() => {
    saveDraft({
      milestones: milestones.map((milestone, index) => ({
        id: milestone.id,
        description: milestone.description,
        percent: milestone.percent ? Number(milestone.percent) : 0,
        createdAt: new Date().toISOString(),
        status: 'draft',
        votesFor: 0,
        votesAgainst: 0,
      })),
    });
  }, [milestones]);

  const addMilestone = () => {
    setMilestones((current) => [...current, createMilestone(current.length + 1)]);
  };

  const removeMilestone = (id: string) => {
    setMilestones((current) => current.filter((milestone) => milestone.id !== id));
  };

  const getMilestoneError = (index: number, percentValue: string) => {
    const percent = Number(percentValue);
    if (!percentValue) return 'Allocation is required.';
    if (Number.isNaN(percent) || percent <= 0) return 'Allocation must be greater than 0.';
    if (percent % 5 !== 0) return 'Allocation must be in multiples of 5.';
    if (index === 0 && percent > 10) return 'First milestone cannot exceed 10%.';
    if (percent > 25) return 'Milestones cannot exceed 25%.';
    return '';
  };

  const hasErrors = milestones.some((milestone, index) =>
    Boolean(getMilestoneError(index, milestone.percent)),
  );

  return (
    <PageShell>
      <section className='space-y-4'>
        <Badge variant='secondary' className='w-fit'>
          Create a Raise
        </Badge>
        <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
          Define your milestones.
        </h1>
        <RaiseStepper currentStep={2} />
      </section>

      <section className='mt-8 space-y-6'>
        {milestones.length === 0 ? (
          <Card className='bg-white/80'>
            <CardContent className='space-y-3 py-8 text-sm text-muted-foreground'>
              <p>
                Milestones are optional at creation. You can publish your raise now
                and add milestones once funding goals are met.
              </p>
              <Button variant='outline' onClick={addMilestone}>
                Add your first milestone
              </Button>
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone, index) => {
            const error = getMilestoneError(index, milestone.percent);
            return (
              <Card key={milestone.id} className='bg-white/80'>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    Milestone {index + 1}
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeMilestone(milestone.id)}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Outcome</Label>
                    <Textarea
                      placeholder='Describe the deliverable for this milestone.'
                      value={milestone.description}
                      onChange={(event) =>
                        setMilestones((current) =>
                          current.map((item) =>
                            item.id === milestone.id
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Allocation (%)</Label>
                    <Input
                      type='number'
                      min={0}
                      max={25}
                      placeholder='10'
                      value={milestone.percent}
                      onChange={(event) =>
                        setMilestones((current) =>
                          current.map((item) =>
                            item.id === milestone.id
                              ? { ...item, percent: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                    {error ? (
                      <p className='text-xs text-rose-600'>{error}</p>
                    ) : (
                      <p className='text-xs text-muted-foreground'>
                        Multiples of 5 only. First milestone max 10%, all milestones
                        max 25%.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {milestones.length > 0 ? (
          <Button variant='outline' className='w-full sm:w-fit' onClick={addMilestone}>
            Add Milestone
          </Button>
        ) : null}

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Link
            href='/raise/create/basic'
            className={cn(buttonVariants({ variant: 'ghost' }))}>
            Back
          </Link>
          <Link
            href='/raise/create/acknowledgement'
            className={cn(
              buttonVariants({ variant: 'default' }),
              hasErrors && 'pointer-events-none opacity-60',
            )}>
            {milestones.length === 0 ? 'Skip for now' : 'Next'}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
