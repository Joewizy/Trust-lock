'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { buttonVariants } from '@/components/ui/button';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCampaignList } from '@/lib/hooks/useTrustLock';
import { CampaignState } from '@/lib/contracts/types';
import type { Campaign } from '@/lib/contracts/types';

const formatEtherAmount = (value: bigint | string) => {
  try {
    const wei = typeof value === 'bigint' ? value : BigInt(String(value));
    const formatted = parseFloat(formatEther(wei));
    if (formatted >= 1000) return `${(formatted / 1000).toFixed(2)}K`;
    return formatted.toFixed(4);
  } catch {
    return '0.0000';
  }
};

const getStateText = (state: CampaignState) => {
  switch (state) {
    case CampaignState.FUNDING: return 'Funding';
    case CampaignState.ACTIVE: return 'Active';
    case CampaignState.VOTING: return 'Voting';
    case CampaignState.COMPLETED: return 'Completed';
    case CampaignState.FAILED: return 'Failed';
    default: return 'Unknown';
  }
};

const getStateIcon = (state: CampaignState) => {
  switch (state) {
    case CampaignState.ACTIVE: return TrendingUp;
    case CampaignState.COMPLETED: return CheckCircle;
    case CampaignState.FAILED: return XCircle;
    default: return Clock;
  }
};

// Campaign with title/description from CampaignManager (merged in useCampaignList)
type CampaignWithMeta = Campaign & { title?: string; description?: string };

function CampaignCard({ campaign, campaignId }: { campaign: CampaignWithMeta; campaignId: number }) {
  const totalRaised = Number(formatEther(BigInt(String(campaign.totalRaised ?? '0'))));
  const fundingGoal = Number(formatEther(BigInt(String(campaign.fundingGoal ?? '1'))));
  const progressPercentage = fundingGoal > 0 ? Math.min((totalRaised / fundingGoal) * 100, 100) : 0;
  const raisedStr = formatEtherAmount(campaign.totalRaised ?? '0');
  const targetStr = formatEtherAmount(campaign.fundingGoal ?? '0');
  const StateIcon = getStateIcon(campaign.state ?? CampaignState.FUNDING);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{campaign.title ?? 'Campaign'}</CardTitle>
          <Badge variant="success" className="flex items-center gap-1">
            <StateIcon className="h-3 w-3" />
            {getStateText(campaign.state ?? CampaignState.FUNDING)}
          </Badge>
        </div>
        <CardDescription>{campaign.description ?? ''}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Progress value={progressPercentage} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Raised: {raisedStr} ETH</span>
            <span>Target: {targetStr} ETH</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progressPercentage.toFixed(0)}% funded</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={`/raise/${campaignId}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-full justify-between')}
        >
          View raise
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function CampaignCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function RaisesPage() {
  const [mounted, setMounted] = React.useState(false);
  const { isConnected } = useAccount();
  const { campaigns, isLoading } = useCampaignList();

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <PageShell>
        <h1 className="text-4xl font-semibold tracking-tight">Explore Raises</h1>
        <p className="text-muted-foreground mt-2">Discover and support campaigns</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">Explore Raises</h1>
        <p className="text-muted-foreground mt-2">Discover and support milestone-driven campaigns</p>
      </div>

      <div className="mt-12">
        {!isConnected ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                Please connect your wallet to view raises on the blockchain
              </p>
            </div>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">No Raises Yet</h2>
              <p className="text-muted-foreground">
                No raises have been created yet. Be the first to start one!
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map(({ id, data }) => (
              data ? (
                <CampaignCard key={id} campaign={data} campaignId={id} />
              ) : null
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
