'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Shield, AlertCircle, Sparkles } from 'lucide-react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { sepolia } from 'wagmi/chains';

import { PageShell } from '@/components/shared/page-shell';
import { RaiseStepper } from '@/components/shared/raise-stepper';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { loadDraft, saveDraft, clearDraft } from '@/lib/raise-storage';
import { useTrustLock } from '@/lib/hooks/useTrustLock';
import { AcknowledgementModal } from '@/components/raise/acknowledgement-modal';
import { useENS } from '@/lib/hooks/useEns';

// Contract constants for validation
const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 1000;

const tokenOptions = [
  { id: 'eth', label: 'ETH' },
  { id: 'tlt', label: 'TLT' },
] as const;

export default function CreateRaiseBasic() {
  const { address } = useAccount();
  const router = useRouter();
  const { createCampaign, loading, status } = useTrustLock();
  const { ensName, ensAvatar, hasENS, isLoading } = useENS();
  
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [fundingGoal, setFundingGoal] = React.useState('');
  const [durationDays, setDurationDays] = React.useState('');
  const [durationUnit, setDurationUnit] = React.useState<'days' | 'seconds'>('days');
  const [selectedToken, setSelectedToken] = React.useState<'eth' | 'tlt'>('eth');
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setTitle(draft.title ?? '');
    setDescription(draft.description ?? '');
    setFundingGoal(draft.fundingGoal ? String(draft.fundingGoal) : '');
    setDurationDays(draft.durationDays ? String(draft.durationDays) : '');
    setSelectedToken((draft.acceptedToken === 'faucet' ? 'tlt' : draft.acceptedToken as 'eth' | 'tlt') ?? 'eth');
  }, []);

  React.useEffect(() => {
    saveDraft({
      title,
      description,
      fundingGoal: fundingGoal ? Number(fundingGoal) : 0,
      durationDays: durationDays ? Number(durationDays) : 0,
      acceptsEth: selectedToken === 'eth',
      acceptedToken: selectedToken === 'tlt' ? 'faucet' : selectedToken,
      creator: address ?? '0x0000000000000000000000000000000000000000',
    });
  }, [title, description, fundingGoal, durationDays, selectedToken, address]);

  const validateForm = () => {
    console.log('Validating form:', {
      title,
      description,
      fundingGoal,
      durationDays,
      hasENS,
      titleLength: title.length,
      descriptionLength: description.length,
      fundingGoalNum: Number(fundingGoal)
    });

    if (!hasENS) {
      setError('You need an ENS name to create a raise.');
      return false;
    }

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
      const result = await createCampaign({
        title,
        description,
        fundingGoal,
        projectDuration: durationUnit === 'seconds' 
          ? Number(durationDays) 
          : Number(durationDays) * 24 * 60, // Remove the extra * 60Already in seconds
        acceptsEth: selectedToken === 'eth'
      });

      if (result.success) {
        const txUrl = result.txHash && sepolia?.blockExplorers?.default?.url
          ? `${sepolia.blockExplorers.default.url}/tx/${result.txHash}`
          : null;

        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>Raise created successfully!</span>
              {txUrl && (
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm underline hover:no-underline"
                  onClick={() => toast.dismiss(t.id)}
                >
                  View transaction <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ),
          { duration: 6000 }
        );
        clearDraft();
        setShowModal(false);
        setTimeout(() => router.push('/activity'), 4500);
      }
    } catch (err) {
      console.error('Failed to create raise:', err);
      setError('Failed to create raise. Please try again.');
    }
  };

  React.useEffect(() => {
    if (status && status.includes('✅')) {
      // Success handled in handleConfirmCreate
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
        
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
              Start with the basics.
            </h1>
            
            {/* Verified Creator Badge - For ENS holders */}
            {!isLoading && hasENS && ensName && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    Verified Creator
                  </span>
                  {ensAvatar && (
                    <img 
                      src={ensAvatar} 
                      alt={ensName}
                      className="h-4 w-4 rounded-full ml-1"
                    />
                  )}
                  <span className="text-sm font-mono text-emerald-600">
                    {ensName}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <RaiseStepper currentStep={1} />
      </section>

      {/* Compact ENS Status - Only show if no ENS */}
      {!isLoading && !hasENS && (
        <Alert className="border-amber-300 bg-amber-50/50 mt-6">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-sm font-medium text-amber-900">ENS name required to create raises</span>
              <p className="text-xs text-amber-700 mt-0.5">
                Builds trust and makes your raise discoverable
              </p>
            </div>
            <a
              href='https://app.ens.domains/'
              target='_blank'
              rel='noopener noreferrer'
              className={cn(buttonVariants({ size: 'sm', variant: 'default' }), 'ml-4 shrink-0')}
            >
              Get ENS
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </a>
          </div>
        </Alert>
      )}

      <section className='mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
        <Card className={cn(
          'bg-white/80 transition-all',
          !hasENS && 'opacity-60'
        )}>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            {!hasENS && (
              <CardDescription className="text-amber-600">
                Complete ENS verification above to unlock this form
              </CardDescription>
            )}
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
                placeholder='Campaign title'
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={TITLE_MAX_LENGTH}
                disabled={!hasENS}
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
                rows={4}
                disabled={!hasENS}
              />
            </div>
            
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label>Total funding target ({selectedToken === 'eth' ? 'ETH' : 'USD'})</Label>
                  <div className='flex items-center gap-1'>
                    <Button
                      type='button'
                      variant={selectedToken === 'eth' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setSelectedToken('eth')}
                      disabled={!hasENS}
                    >
                      ETH
                    </Button>
                    <Button
                      type='button'
                      variant={selectedToken === 'tlt' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setSelectedToken('tlt')}
                      disabled={!hasENS}
                    >
                      TLT
                    </Button>
                  </div>
                </div>
                <Input
                  type='number'
                  min={0}
                  step="0.01"
                  placeholder={selectedToken === 'eth' ? '10' : '25000'}
                  value={fundingGoal}
                  onChange={(event) => setFundingGoal(event.target.value)}
                  disabled={!hasENS}
                />
                <p className='text-xs text-muted-foreground'>
                  {selectedToken === 'eth' 
                    ? 'Amount in ETH tokens'
                    : 'Amount in USD (1 TLT = 1 USD)'
                  }
                </p>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label>Raise duration</Label>
                  <div className='flex items-center gap-1'>
                    <Button
                      type='button'
                      variant={durationUnit === 'days' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setDurationUnit('days')}
                      disabled={!hasENS}
                    >
                      Days
                    </Button>
                    <Button
                      type='button'
                      variant={durationUnit === 'seconds' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setDurationUnit('seconds')}
                      disabled={!hasENS}
                    >
                      Seconds
                    </Button>
                  </div>
                </div>
                <Input
                  type='number'
                  min={1}
                  placeholder={durationUnit === 'days' ? '30' : '2592000'}
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  disabled={!hasENS}
                />
                <p className='text-xs text-muted-foreground'>
                  {durationUnit === 'days' 
                    ? 'Duration in days (e.g., 30 = 30 days)'
                    : 'Duration in seconds (e.g., 2592000 = 30 days)'
                  }
                </p>
              </div>
            </div>
            
            <div className='flex items-center justify-end gap-3 pt-4 border-t'>
              <Link href='/' className={cn(buttonVariants({ variant: 'ghost' }))}>
                Cancel
              </Link>
              <Button
                onClick={handleCreateRaise}
                disabled={!address || loading || !hasENS}
                className={cn(buttonVariants({ variant: 'default' }))}>
                {loading ? 'Creating...' : 'Create Raise'}
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* ENS Benefits Card - Only show if no ENS */}
          {!hasENS && (
            <Card className='border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Why ENS?
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Build Trust</p>
                      <p className="text-xs text-muted-foreground">
                        Verified identity reduces scams and builds credibility
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Stand Out</p>
                      <p className="text-xs text-muted-foreground">
                        Memorable name.eth instead of 0x123...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ExternalLink className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Get Discovered</p>
                      <p className="text-xs text-muted-foreground">
                        Your raises linked to your permanent web3 identity
                      </p>
                    </div>
                  </div>
                </div>
                
            <a
                  href='https://sepolia.app.ens.domains/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cn(buttonVariants({ variant: 'default' }), 'w-full mt-4')}
                >
                  Register ENS Name
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          )}

          {/* What Happens Next */}
          <Card className='bg-white/70'>
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-muted-foreground'>
              <p>
                Once your raise reaches its funding goal, you can create milestones with clear outcomes.
              </p>
              <p>
                Each milestone requires contributor approval before funds are released.
              </p>
              <p className="text-xs pt-2 border-t">
                All raise details are immutably stored on-chain
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Acknowledgement Modal */}
      <AcknowledgementModal
        open={showModal}
        onOpenChange={setShowModal}
        onCreateRaise={handleConfirmCreate}
        isLoading={loading}
        status={status}
        error={error}
      />
    </PageShell>
  );
}