'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImagePlus } from 'lucide-react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

import { PageShell } from '@/components/shared/page-shell';
import { RaiseStepper } from '@/components/shared/raise-stepper';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { loadDraft, saveDraft, clearDraft } from '@/lib/raise-storage';
import { useTrustLock } from '@/lib/hooks/useTrustLock';
import { AcknowledgementModal } from '@/components/raise/acknowledgement-modal';

// Contract constants for validation
const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 1000;

const tokenOptions = [
  { id: 'eth', label: 'ETH' },
  { id: 'faucet', label: 'Faucet ERC' },
] as const;

export default function CreateRaiseBasic() {
  const { address } = useAccount();
  const router = useRouter();
  const { createCampaign, isLoading, status } = useTrustLock();
  
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [fundingGoal, setFundingGoal] = React.useState('');
  const [durationDays, setDurationDays] = React.useState('');
  const [selectedToken, setSelectedToken] = React.useState<'eth' | 'faucet'>('eth');
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setTitle(draft.title ?? '');
    setDescription(draft.description ?? '');
    setFundingGoal(draft.fundingGoal ? String(draft.fundingGoal) : '');
    setDurationDays(draft.durationDays ? String(draft.durationDays) : '');
    setSelectedToken((draft.acceptedToken as 'eth' | 'faucet') ?? 'eth');
  }, []);

  React.useEffect(() => {
    saveDraft({
      title,
      description,
      fundingGoal: fundingGoal ? Number(fundingGoal) : 0,
      durationDays: durationDays ? Number(durationDays) : 0,
      acceptsEth: selectedToken === 'eth',
      acceptedToken: selectedToken,
      creator: address ?? '0x0000000000000000000000000000000000000000',
    });
  }, [title, description, fundingGoal, durationDays, selectedToken, address]);

  const validateForm = () => {
    if (!title || !description || !fundingGoal || !durationDays) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
      setError(`Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters.`);
      return false;
    }

    if (description.length < DESCRIPTION_MIN_LENGTH || description.length > DESCRIPTION_MAX_LENGTH) {
      setError(`Description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters.`);
      return false;
    }

    if (Number(fundingGoal) <= 0) {
      setError('Funding goal must be greater than 0.');
      return false;
    }

    if (Number(durationDays) < 1) {
      setError('Duration must be at least 1 day.');
      return false;
    }

    setError('');
    return true;
  };

  const handleCreateRaise = async () => {
    if (!validateForm()) {
      return;
    }
    setShowModal(true);
  };

  const handleConfirmCreate = async () => {
    if (!address) {
      setError('Please connect your wallet.');
      return;
    }

    try {
      const success = await createCampaign({
        title,
        description,
        fundingGoal,
        projectDuration: Math.ceil(Number(durationDays) / 7), // Convert days to weeks
        acceptsEth: selectedToken === 'eth'
      });

      if (success) {
        toast.success('Raise created successfully!');
        clearDraft();
        setShowModal(false);
        // Redirect to raises page or dashboard
        router.push('/raises');
      }
    } catch (err) {
      console.error('Failed to create raise:', err);
      setError('Failed to create raise. Please try again.');
    }
  };

  React.useEffect(() => {
    if (status && status.includes('✅')) {
      // Success will be handled in handleConfirmCreate
    } else if (status && status.includes('❌')) {
      setError(status);
    }
  }, [status]);

  return (
    <PageShell>
      <section className='space-y-4'>
        <Badge variant='secondary' className='w-fit'>
          Create a Raise
        </Badge>
        <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
          Start with the basics.
        </h1>
        <RaiseStepper currentStep={1} />
      </section>

      <section className='mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
        <Card className='bg-white/80'>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>Project name</Label>
                <span className='text-sm text-muted-foreground'>
                  {title.length}/{TITLE_MAX_LENGTH}
                </span>
              </div>
              <Input
                placeholder='OpenVote Registry'
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={TITLE_MAX_LENGTH}
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>Description</Label>
                <span className='text-sm text-muted-foreground'>
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                placeholder='Describe the mission, impact, and what you will deliver.'
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={DESCRIPTION_MAX_LENGTH}
              />
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Total funding target (USD)</Label>
                <Input
                  type='number'
                  min={0}
                  placeholder='8500'
                  value={fundingGoal}
                  onChange={(event) => setFundingGoal(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Raise duration (days)</Label>
                <Input
                  type='number'
                  min={1}
                  placeholder='45'
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Accept funding in</Label>
              <div className='flex flex-wrap gap-2'>
                {tokenOptions.map((token) => (
                  <Button
                    key={token.id}
                    type='button'
                    variant={selectedToken === token.id ? 'default' : 'outline'}
                    onClick={() => setSelectedToken(token.id)}>
                    {token.label}
                  </Button>
                ))}
              </div>
              <p className='text-xs text-muted-foreground'>
                Toggle between ETH or faucet tokens. You can only choose between faucet or ether once.
              </p>
            </div>
            <div className='flex items-center justify-end gap-3'>
              <Link href='/' className={cn(buttonVariants({ variant: 'ghost' }))}>
                Cancel
              </Link>
              <Button
                onClick={handleCreateRaise}
                disabled={!address || isLoading}
                className={cn(buttonVariants({ variant: 'default' }))}>
                {isLoading ? 'Creating...' : 'Create Raise'}
              </Button>
            </div>
            {error && (
              <div className='text-sm text-red-600 mt-2'>
                {error}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className='bg-white/70'>
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm text-muted-foreground'>
            <p>
              Add milestones with clear outcomes. Each milestone defines the amount
              that can be unlocked after contributor approval.
            </p>
            <p>
              Once published, the milestone structure and funding rules are locked in.
            </p>
            <Button variant='outline' className='w-full'>
              Preview raise details
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Acknowledgement Modal */}
      <AcknowledgementModal
        open={showModal}
        onOpenChange={setShowModal}
        onCreateRaise={handleConfirmCreate}
        isLoading={isLoading}
        status={status}
        error={error}
      />
    </PageShell>
  );
}
