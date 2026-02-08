'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ethers } from 'ethers';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateMaxContribution } from '@/lib/utils/contribution';
import { cn } from '@/lib/utils';
import { useUserActivity } from '@/lib/hooks/useUserActivity';
import { useAccount } from 'wagmi';
import { FaucetTokenAddress } from '@/lib/contracts/abi';

// Mock ETH price for display purposes
const MOCK_ETH_PRICE = 2500;

// Helper to format currency based on token type
function formatCurrency(value: bigint, isFaucetToken: boolean): string {
  const formattedValue = ethers.formatEther(value);
  const numValue = parseFloat(formattedValue);
  
  if (isFaucetToken) {
    // Faucet token: 1 token = $1 USD
    return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    // ETH: Use mock price
    return `$${(numValue * MOCK_ETH_PRICE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// Helper to calculate progress percentage
function calculateProgress(raised: bigint, goal: bigint): number {
  if (goal === BigInt(0)) return 0;
  return Math.min(100, Number((raised * BigInt(100)) / goal));
}

// Helper to get campaign status badge
function getCampaignStatus(state: number) {
  const states = ['Funding', 'Active', 'Voting', 'Completed', 'Failed'];
  return states[state] || 'Unknown';
}

// Helper to get badge variant
function getStatusVariant(state: number): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (state) {
    case 0: return 'warning'; // FUNDING
    case 1: return 'success'; // ACTIVE
    case 2: return 'default'; // VOTING
    case 3: return 'success'; // COMPLETED
    case 4: return 'destructive'; // FAILED
    default: return 'secondary';
  }
}

export default function Activity() {
  const { address, isConnected } = useAccount();
  const { created, contributed, isLoading } = useUserActivity();

  if (!isConnected) {
    return (
      <PageShell>
        <section className='space-y-4'>
          <Badge variant='secondary' className='w-fit'>
            My Activity
          </Badge>
          <h1 className='text-4xl font-semibold leading-tight sm:text-5xl font-[var(--font-display)]'>
            Your raises at a glance.
          </h1>
          <p className='max-w-2xl text-base text-muted-foreground'>
            Connect your wallet to view your campaign activity.
          </p>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className='space-y-4'>
        <Badge variant='secondary' className='w-fit'>
          My Activity
        </Badge>
        <h1 className='text-4xl font-semibold leading-tight sm:text-5xl font-[var(--font-display)]'>
          Your raises at a glance.
        </h1>
        <p className='max-w-2xl text-base text-muted-foreground'>
          Track the raises you have created, monitor funding progress, and manage
          your milestones from a single place.
        </p>
      </section>

      <Tabs defaultValue='raises' className='mt-8'>
        <TabsList>
          <TabsTrigger value='raises'>
            Raises {created.count > 0 && `(${created.count})`}
          </TabsTrigger>
          <TabsTrigger value='contributions'>
            Contributions {contributed.count > 0 && `(${contributed.count})`}
          </TabsTrigger>
        </TabsList>

        {/* CREATED CAMPAIGNS TAB */}
        <TabsContent value='raises'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : created.campaigns.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground mb-4'>
                You haven't created any campaigns yet.
              </p>
              <Link
                href='/raises/create'
                className={cn(buttonVariants({ variant: 'default' }))}>
                Create Your First Campaign
              </Link>
            </div>
          ) : (
            <section className='grid gap-6 md:grid-cols-2'>
              {created.campaigns.map(({ id, data }) => {
                const isFaucetToken = !data.acceptsEth && 
                  data.acceptedToken.toLowerCase() === FaucetTokenAddress.toLowerCase();
                const progress = calculateProgress(
                  BigInt(String(data.totalRaised || '0')), 
                  BigInt(String(data.fundingGoal || '1'))
                );
                const status = getCampaignStatus(data.state);
                
                return (
                  <Card key={id} className='flex h-full flex-col'>
                    <CardHeader>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='line-clamp-1'>{data.title || `Campaign #${id}`}</CardTitle>
                        <Badge variant={getStatusVariant(data.state)}>{status}</Badge>
                      </div>
                      <CardDescription className='line-clamp-2'>
                        {data.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                      <div className='space-y-2'>
                        <Progress value={progress} />
                        <div className='flex items-center justify-between text-xs text-muted-foreground'>
                          <span>Raised: {formatCurrency(BigInt(String(data.totalRaised || '0')), isFaucetToken)}</span>
                          <span>Target: {formatCurrency(BigInt(String(data.fundingGoal || '1')), isFaucetToken)}</span>
                        </div>
                      </div>
                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        <span>Released: {formatCurrency(BigInt(String(data.releasedFunds || '0')), isFaucetToken)}</span>
                        <span>{progress.toFixed(1)}% funded</span>
                      </div>
                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        <span>Milestones: {data.milestoneCount}</span>
                        <span className={cn(
                          data.consecutiveFailedMilestones >= 2 || data.totalFailedMilestones >= 4 
                            ? 'text-destructive font-medium' 
                            : ''
                        )}>
                          Failures: {data.consecutiveFailedMilestones}/3 | {data.totalFailedMilestones}/5
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className='mt-auto flex items-center justify-between'>
                      <Link
                        href={`/raise/${id}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                        View Details
                      </Link>
                      <Badge variant='secondary'>Owner</Badge>
                    </CardFooter>
                  </Card>
                );
              })}
            </section>
          )}
        </TabsContent>

        {/* CONTRIBUTIONS TAB */}
        <TabsContent value='contributions'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : contributed.campaigns.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground mb-4'>
                You haven't contributed to any campaigns yet.
              </p>
              <Link
                href='/raises'
                className={cn(buttonVariants({ variant: 'default' }))}>
                Browse Campaigns
              </Link>
            </div>
          ) : (
            <section className='grid gap-6 md:grid-cols-2'>
              {contributed.campaigns.map(({ id, data, contributionAmount }) => {
                const isFaucetToken = !data.acceptsEth && 
                  data.acceptedToken.toLowerCase() === FaucetTokenAddress.toLowerCase();
                const progress = calculateProgress(
                  BigInt(String(data.totalRaised || '0')), 
                  BigInt(String(data.fundingGoal || '1'))
                );
                const status = getCampaignStatus(data.state);
                
                // Calculate remaining contribution amount
                const { remainingContribution, canContribute } = calculateMaxContribution(
                  data.fundingGoal,
                  contributionAmount
                );
                
                return (
                  <Card key={id} className='flex h-full flex-col'>
                    <CardHeader>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='line-clamp-1'>{data.title || `Campaign #${id}`}</CardTitle>
                        <Badge variant={getStatusVariant(data.state)}>{status}</Badge>
                      </div>
                      <CardDescription className='line-clamp-2'>
                        {data.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                      <div className='space-y-2'>
                        <Progress value={progress} />
                        <div className='flex items-center justify-between text-xs text-muted-foreground'>
                          <span>Raised: {formatCurrency(BigInt(String(data.totalRaised || '0')), isFaucetToken)}</span>
                          <span>Target: {formatCurrency(BigInt(String(data.fundingGoal || '1')), isFaucetToken)}</span>
                        </div>
                      </div>
                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        <span>Your Contribution: {formatCurrency(contributionAmount, isFaucetToken)}</span>
                        <span>{progress.toFixed(1)}% funded</span>
                      </div>
                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        <span>Remaining: {formatCurrency(ethers.parseEther(remainingContribution), isFaucetToken)}</span>
                        <span className={canContribute ? 'text-green-600' : 'text-red-600'}>
                          {canContribute ? 'Can contribute' : 'At limit'}
                        </span>
                      </div>
                      {data.state === 2 && ( // VOTING state
                        <Badge variant='warning' className='w-full justify-center'>
                          Voting Open - Cast Your Vote
                        </Badge>
                      )}
                    </CardContent>
                    <CardFooter className='mt-auto flex items-center justify-between'>
                      <Link
                        href={`/raise/${id}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                        View Details
                      </Link>
                      <Badge variant='secondary'>Contributor</Badge>
                    </CardFooter>
                  </Card>
                );
              })}
            </section>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}