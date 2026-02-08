'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Menu, Wallet, X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useENS } from '@/lib/hooks/useEns';

const navLinks = [
  { id: 1, label: 'Discover', href: '/' },
  { id: 2, label: 'How It Works', href: '/how-it-works' },
  { id: 3, label: 'My Activity', href: '/activity' },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { ensName, ensAvatar, hasENS, isLoading } = useENS();

  return (
    <header className='relative z-10 w-full border-b border-transparent'>
      <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6'>
        <Link href='/' className='text-lg font-semibold tracking-tight'>
          TRUSTLOCK
        </Link>
        <nav className='hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex'>
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className='transition-colors hover:text-foreground'>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className='flex items-center gap-3'>
          <Link
            href='/raise/create/basic'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'hidden md:inline-flex',
            )}>
            Create a Raise
          </Link>
          <div className='hidden md:flex'>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                if (!connected) {
                  return (
                    <Button size='sm' onClick={openConnectModal}>
                      Connect Wallet
                      <ArrowUpRight className='h-4 w-4' />
                    </Button>
                  );
                }

                return (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={openAccountModal}
                    className='items-center gap-2 rounded-full border-border/70 bg-white/80 text-xs font-medium text-muted-foreground shadow-sm'>
                    {hasENS && ensAvatar ? (
                      <img
                        src={ensAvatar}
                        alt={ensName || 'Avatar'}
                        className='h-3.5 w-3.5 rounded-full'
                      />
                    ) : (
                      <Wallet className='h-3.5 w-3.5' />
                    )}
                    {hasENS && ensName ? ensName : account.displayName}
                  </Button>
                );
              }}
            </ConnectButton.Custom>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='md:hidden'
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}>
            {mobileOpen ? (
              <X className='h-4 w-4' />
            ) : (
              <Menu className='h-4 w-4' />
            )}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          'border-t border-border/40 bg-white/90 px-6 py-4 md:hidden',
          mobileOpen ? 'block' : 'hidden',
        )}>
        <div className='flex flex-col gap-4'>
          <nav className='flex flex-col gap-3 text-sm font-medium text-muted-foreground'>
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className='transition-colors hover:text-foreground'
                onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href='/raise/create/basic'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'w-full',
            )}
            onClick={() => setMobileOpen(false)}>
            Create a Raise
          </Link>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              if (!connected) {
                return (
                  <Button
                    size='sm'
                    className='w-full'
                    onClick={openConnectModal}>
                    Connect Wallet
                    <ArrowUpRight className='h-4 w-4' />
                  </Button>
                );
              }

              return (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={openAccountModal}
                  className='w-full items-center gap-2 border-border/70 bg-white/80 text-xs font-medium text-muted-foreground shadow-sm'>
                  {hasENS && ensAvatar ? (
                    <img
                      src={ensAvatar}
                      alt={ensName || 'Avatar'}
                      className='h-3.5 w-3.5 rounded-full'
                    />
                  ) : (
                    <Wallet className='h-3.5 w-3.5' />
                  )}
                  {hasENS && ensName ? ensName : account.displayName}
                </Button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
