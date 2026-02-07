'use client';

import * as React from 'react';
import Link from 'next/link';
import { Coins, Fuel } from 'lucide-react';
import { useAccount, useFeeData } from 'wagmi';
import { formatGwei } from 'viem';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const OWNER_ADDRESS = '0x123400000000000000000000000000000000abcd';

const presetAmounts = [200, 400, 800, 1200];

const tokenOptions = [
  { id: 'eth', label: 'ETH' },
  { id: 'faucet', label: 'Faucet ERC' },
];

const chainOptions = [
  { id: 'mainnet', label: 'Ethereum Mainnet' },
  { id: 'sepolia', label: 'Sepolia Testnet' },
];

// --- Gas estimation constants (UI-level estimate)
const GAS_LIMIT_ESTIMATE = 21000n;
const ETH_USD = 3000; // replace later with live price

export default function ContributePage({ params }: { params: { id: string } }) {
  const basePath = `/raise/${params.id}`;

  const { address } = useAccount();
  const { data: feeData, isLoading: feeLoading } = useFeeData();

  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  // -------------------------------
  // State (single source of truth)
  // -------------------------------
  const [amount, setAmount] = React.useState<number>(0);
  const [selectedToken, setSelectedToken] = React.useState('eth');
  const [selectedChain, setSelectedChain] = React.useState('sepolia');

  // -------------------------------
  // Gas calculations
  // -------------------------------
  const gasGwei = feeData?.gasPrice ? formatGwei(feeData.gasPrice) : null;

  const gasFeeEth = feeData?.gasPrice
    ? feeData.gasPrice * GAS_LIMIT_ESTIMATE
    : null;

  const gasFeeUsd = gasFeeEth ? (Number(gasFeeEth) / 1e18) * ETH_USD : 0;

  const totalUsd = amount + gasFeeUsd;

  return (
    <PageShell>
      <section className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr]'>
        {/* ================= LEFT ================= */}
        <div className='space-y-5'>
          <Badge variant='secondary' className='w-fit'>
            Contribute to OpenVote Registry
          </Badge>

          <h1 className='text-3xl font-semibold sm:text-4xl font-[var(--font-display)]'>
            Enter your contribution
          </h1>

          {isOwner && (
            <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700'>
              You created this raise, so you can update milestones but cannot
              contribute to it.
            </div>
          )}

          <Card className='bg-white/85'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Coins className='h-5 w-5 text-emerald-600' />
                Select token & chain
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-5'>
              {/* Token */}
              <div className='space-y-2'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Token
                </p>
                <div className='flex flex-wrap gap-2'>
                  {tokenOptions.map((token) => (
                    <Button
                      key={token.id}
                      variant={
                        selectedToken === token.id ? 'default' : 'outline'
                      }
                      className='h-10'
                      onClick={() => setSelectedToken(token.id)}>
                      {token.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chain */}
              <div className='space-y-2'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Chain
                </p>
                <div className='flex flex-wrap gap-2'>
                  {chainOptions.map((chain) => (
                    <Button
                      key={chain.id}
                      variant={
                        selectedChain === chain.id ? 'default' : 'outline'
                      }
                      className='h-10'
                      onClick={() => setSelectedChain(chain.id)}>
                      {chain.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div className='space-y-2'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Quick amounts
                </p>
                <div className='flex flex-wrap gap-2'>
                  {presetAmounts.map((preset) => (
                    <Button
                      key={preset}
                      variant={amount === preset ? 'default' : 'outline'}
                      className='h-10'
                      onClick={() => setAmount(preset)}>
                      ${preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <Input
                type='number'
                min={0}
                placeholder='Enter amount'
                value={amount === 0 ? '' : amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />

              <Separator />

              {/* Gas info */}
              <div className='space-y-3 text-sm text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <Fuel className='h-4 w-4 text-emerald-600' />
                  <span>
                    {feeLoading
                      ? 'Fetching live gas fee estimate...'
                      : `Estimated gas price: ${gasGwei ?? '—'} gwei`}
                  </span>
                </div>

                <p>
                  Your contribution is locked in escrow. Funds are released only
                  if milestones are approved by contributors.
                </p>

                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                    You are funding
                  </p>
                  <ul className='mt-2 space-y-1 text-sm'>
                    <li>Milestone 1 — Smart contract deployment</li>
                    <li>Milestone 2 — Security audit</li>
                    <li>Milestone 3 — Frontend & docs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className='h-fit bg-white/85 lg:sticky lg:top-24'>
          <CardHeader>
            <CardTitle>Contribution summary</CardTitle>
          </CardHeader>

          <CardContent className='space-y-4'>
            <Progress value={62} />

            <div className='text-sm text-muted-foreground'>
              $5,232 out of $8,500 raised
            </div>

            <Separator />

            <div className='space-y-2 text-sm text-muted-foreground'>
              <div className='flex items-center justify-between'>
                <span>Your contribution</span>
                <span>${amount.toLocaleString()}</span>
              </div>

              <div className='flex items-center justify-between'>
                <span>Gas fee (est.)</span>
                <span>{feeLoading ? '—' : `$${gasFeeUsd.toFixed(2)}`}</span>
              </div>

              <div className='flex items-center justify-between font-medium text-foreground'>
                <span>Total</span>
                <span>${totalUsd.toFixed(2)}</span>
              </div>
            </div>

            <Button className='w-full' disabled={isOwner || amount <= 0}>
              Contribute to Raise
            </Button>

            <Link
              href={basePath}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-center',
              )}>
              Back to raise
            </Link>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
