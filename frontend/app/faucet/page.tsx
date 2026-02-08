'use client';

import * as React from 'react';
import { Clock, Droplet, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { sepolia } from 'wagmi/chains';

import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useFaucet } from '@/lib/hooks/useFaucet';
import { FaucetTokenAddress } from '@/lib/contracts/abi/faucet';

export default function FaucetPage() {
  const {
    balance,
    faucetAmount,
    canClaim,
    timeRemaining,
    claimTokens,
    status,
    isTransactionPending,
    isConnected
  } = useFaucet();

  const [countdown, setCountdown] = React.useState('');

  // Live countdown
  React.useEffect(() => {
    if (timeRemaining <= 0) {
      setCountdown('Available now');
      return;
    }

    const interval = setInterval(() => {
      const hours = Math.floor(timeRemaining / 3600);
      const minutes = Math.floor((timeRemaining % 3600) / 60);
      const seconds = timeRemaining % 60;
      
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleClaim = async () => {
    await claimTokens();
  };

  const cooldownProgress = timeRemaining > 0 
    ? Math.max(0, 100 - (timeRemaining / (24 * 60 * 60)) * 100) 
    : 100;

  const handleViewToken = () => {
    const url = `${sepolia.blockExplorers?.default?.url}/token/${FaucetTokenAddress}`;
    window.open(url, '_blank');
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <Badge variant='secondary' className='mb-2'>Faucet</Badge>
          <h1 className='text-2xl font-semibold font-[var(--font-display)]'>
            Claim Test Tokens
          </h1>
        </div>

        {/* Single Compact Card */}
        <Card className='shadow-sm'>
          <CardHeader className="text-center pb-3 pt-6">
            <div className="mx-auto mb-2 p-2 rounded-full bg-primary/10 w-fit">
              <Droplet className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Your Balance</CardTitle>
            <div className="text-3xl font-bold text-primary mt-1">
              {parseFloat(balance).toFixed(2)} <span className="text-xl text-muted-foreground">TLT</span>
            </div>
          </CardHeader>

          <CardContent className='space-y-3 pb-6'>
            {/* Claim Amount */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Claim Amount</span>
              <span className="font-semibold">{faucetAmount} TLT</span>
            </div>

            {/* Countdown Timer */}
            {timeRemaining > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Next claim</span>
                  </div>
                  <span className="font-mono font-medium">{countdown}</span>
                </div>
                <Progress value={cooldownProgress} className="h-1.5" />
              </div>
            )}

            {/* Claim Button */}
            <Button 
              onClick={handleClaim}
              disabled={!isConnected || !canClaim || isTransactionPending}
              className="w-full h-10"
            >
              {isTransactionPending ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : !canClaim && timeRemaining > 0 ? (
                <>
                  <Clock className="mr-2 h-3.5 w-3.5" />
                  Wait {countdown}
                </>
              ) : (
                <>
                  <Droplet className="mr-2 h-3.5 w-3.5" />
                  Claim {faucetAmount} TLT
                </>
              )}
            </Button>

            {/* Status */}
            {status && (
              <Alert 
                variant={status.includes('❌') ? 'destructive' : 'default'}
                className={
                  status.includes('✅') 
                    ? 'border-green-200 bg-green-50' 
                    : status.includes('⏰') 
                    ? 'border-blue-200 bg-blue-50'
                    : ''
                }
              >
                {status.includes('✅') ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                ) : status.includes('❌') ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                )}
                <AlertDescription className="text-xs">
                  {status.replace(/[✅❌⏳⏰]/g, '').trim()}
                </AlertDescription>
              </Alert>
            )}

            {/* Compact Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
              <div>
                <p className="text-xs text-muted-foreground">Per Claim</p>
                <p className="text-sm font-semibold">{faucetAmount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cooldown</p>
                <p className="text-sm font-semibold">24h</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-semibold">{canClaim ? '✓' : '⏳'}</p>
              </div>
            </div>

            {/* Token Link */}
            <Button 
              variant="ghost" 
              className="w-full h-8 text-xs"
              onClick={handleViewToken}
            >
              <ExternalLink className="mr-1.5 h-3 w-3" />
              View Token on Etherscan
            </Button>
          </CardContent>
        </Card>

        {/* Minimal Footer */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          Test tokens • Sepolia testnet • No real value
        </p>
      </div>
    </PageShell>
  );
}