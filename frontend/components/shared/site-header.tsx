'use client';

import Link from 'next/link';
import { ArrowUpRight, Wallet } from 'lucide-react';
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
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Create a Raise
          </Link>
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              if (!connected) {
                return (
                  <Button size='sm' className='hidden sm:inline-flex' onClick={openConnectModal}>
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
                  className='hidden items-center gap-2 rounded-full border-border/70 bg-white/80 text-xs font-medium text-muted-foreground shadow-sm md:inline-flex'>
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
