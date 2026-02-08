'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coins, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'react-hot-toast';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTrustLock } from '@/lib/hooks/useTrustLock';
import { useFaucet } from '@/lib/hooks/useFaucet';
import { calculateMaxContribution, validateContribution, formatContributionAmount } from '@/lib/utils/contribution';

const MAX_CONTRIBUTION_PERCENT = 2; // 2% max of funding goal

export default function ContributePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { address } = useAccount();
  
  const resolvedParams = React.use(params);
  const campaignId = parseInt(resolvedParams.id);
  const { useCampaign, contribute, status, loading } = useTrustLock();
  const { campaign, refetchCampaign } = useCampaign(campaignId);
  const { balance: tltBalance } = useFaucet();

  const [amount, setAmount] = React.useState<string>('');
  const [error, setError] = React.useState('');

  // Check if campaign accepts ETH or ERC20
  const isEthCampaign = campaign?.acceptsEth ?? true;
  const tokenSymbol = isEthCampaign ? 'ETH' : 'TLT';

  // Check if user is the campaign creator
  const isOwner = address?.toLowerCase() === campaign?.creator.toLowerCase();

  // Calculate contribution limits using utility function
  const { maxContribution, remainingContribution, canContribute, isAtLimit } = calculateMaxContribution(
    campaign?.fundingGoal || '0',
    '0', // TODO: Get user's current contribution from campaign data
    MAX_CONTRIBUTION_PERCENT
  );

  const totalRaisedEth = campaign ? Number(formatEther(campaign.totalRaised as unknown as bigint)) : 0;
  const fundingGoalEth = campaign ? Number(formatEther(campaign.fundingGoal as unknown as bigint)) : 0;
  const progressPercentage = fundingGoalEth > 0 
    ? Math.min((totalRaisedEth / fundingGoalEth) * 100, 100)
    : 0;

  // Real-time validation using utility function
  const validation = validateContribution(
    amount,
    campaign?.fundingGoal || '0',
    '0', // TODO: Get user's current contribution from campaign data
    MAX_CONTRIBUTION_PERCENT
  );

  // Check if button should be disabled
  const isButtonDisabled = 
    isOwner || 
    !amount || 
    !validation.isValid ||
    loading ||
    !canContribute;

  // Add user balance and amount calculations
  const userBalance = parseFloat(tltBalance);
  const amountNum = parseFloat(amount || '0');

  // Handle contribution (now handles allowance automatically)
  const handleContribute = async () => {
    if (!validation.isValid) return;
    if (!campaign) return;

    try {
      const success = await contribute(campaignId, amount, isEthCampaign);

      if (success) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>Contribution successful!</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push(`/raise/${campaignId}`);
                }}
                className="text-sm underline hover:no-underline"
              >
                View campaign
              </button>
            </div>
          ),
          { duration: 5000 }
        );

        refetchCampaign();
        
        // Redirect after delay
        setTimeout(() => {
          router.push(`/raise/${campaignId}`);
        }, 3000);
      }
    } catch (err) {
      console.error('Contribution error:', err);
      toast.error('Failed to contribute. Please try again.');
    }
  };

  // Set preset amounts based on funding goal
  const handlePresetClick = (percentage: number) => {
    const presetAmount = fundingGoalEth * (percentage / 100);
    setAmount(presetAmount.toFixed(4));
  };

  // Loading state
  if (!campaign) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Loading campaign...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr]'>
        {/* LEFT COLUMN */}
        <div className='space-y-5'>
          {/* Header */}
          <div className="space-y-4">
            <Link href={`/raise/${campaignId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaign
              </Button>
            </Link>

            <Badge variant='secondary' className='w-fit'>
              Contribute
            </Badge>

            <div>
              <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
                Support {campaign.title}
              </h1>
              <p className="text-muted-foreground mt-2">
                Contributing with {tokenSymbol} on Sepolia Testnet
              </p>
            </div>
          </div>

          {/* Owner Warning */}
          {isOwner && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                You created this campaign and cannot contribute to it.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Card */}
          <Card className='bg-white/85'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Coins className='h-5 w-5 text-emerald-600' />
                Enter Contribution Amount
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-5'>
              {/* Token Info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token</span>
                  <span className="font-medium">{isEthCampaign ? 'Ethereum (ETH)' : 'TrustLock Faucet (TLT)'}</span>
                </div>
                {!isEthCampaign && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Your Balance</span>
                    <span className="font-medium">{userBalance.toFixed(2)} TLT</span>
                  </div>
                )}
              </div>

              {/* Quick Presets */}
              <div className='space-y-2'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Quick Amounts (% of goal)
                </p>
                <div className='flex flex-wrap gap-2'>
                  {[0.5, 1, 1.5, 2].map((percent) => {
                    const presetAmount = fundingGoalEth * (percent / 100);
                    return (
                      <Button
                        key={percent}
                        variant={amountNum === presetAmount ? 'default' : 'outline'}
                        className='h-10'
                        onClick={() => handlePresetClick(percent)}
                        disabled={isOwner}
                      >
                        {percent}% ({presetAmount.toFixed(4)} {tokenSymbol})
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className='text-sm font-medium'>Amount ({tokenSymbol})</label>
                  <span className="text-xs text-muted-foreground">
                    Max: {parseFloat(maxContribution).toFixed(4)} {tokenSymbol}
                  </span>
                </div>
                <Input
                  type='number'
                  min={0}
                  max={maxContribution}
                  step="0.0001"
                  placeholder={`Enter amount in ${tokenSymbol}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isOwner}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum contribution is 2% of the funding goal ({parseFloat(maxContribution).toFixed(4)} {tokenSymbol})
                </p>
              </div>

              {/* Real-time Error Message */}
              {!validation.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validation.error}</AlertDescription>
                </Alert>
              )}

              {/* TLT Low Balance - Link to Faucet */}
              {!isEthCampaign && validation.isValid && userBalance < 10 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-sm text-blue-900">Low TLT balance. Need more tokens?</span>
                    <Link href="/faucet">
                      <Button size="sm" variant="default" className="h-7 text-xs">
                        Get Tokens
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className='w-full' 
                  onClick={handleContribute}
                  disabled={isButtonDisabled}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Contributing...
                    </>
                  ) : (
                    <>Contribute {amount || '0'} {tokenSymbol}</>
                  )}
                </Button>
              </div>   
              {status && (
                  <p className="text-sm text-center">{status}</p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Campaign Details */}
        <Card className='h-fit bg-white/85 lg:sticky lg:top-24'>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>

          <CardContent className='space-y-4'>
            {/* Campaign Info */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">{campaign.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {campaign.description}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Campaign Progress</span>
                <span className="font-semibold">{progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercentage} />
              <div className='text-sm text-muted-foreground'>
                {totalRaisedEth.toFixed(4)} {tokenSymbol} of {fundingGoalEth.toFixed(4)} {tokenSymbol} raised
              </div>
            </div>

            <Separator />

            {/* Contribution Summary */}
            <div className='space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span className="text-muted-foreground">Your contribution</span>
                <span className="font-medium">{amount || '0'} {tokenSymbol}</span>
              </div>

              <div className='flex items-center justify-between font-semibold text-foreground pt-2 border-t'>
                <span>Total</span>
                <span>{amount || '0'} {tokenSymbol}</span>
              </div>
            </div>

            <Separator />

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Funds held in escrow</p>
              <p>✓ Released only on milestone approval</p>
              <p>✓ Refundable if goal not met</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}