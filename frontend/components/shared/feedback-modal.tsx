'use client';

import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FeedbackModalProps = {
  open: boolean;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
};

export function FeedbackModal({
  open,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: FeedbackModalProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 py-12'>
      <div className='w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl'>
        <div className='space-y-2'>
          <h2 className='text-lg font-semibold'>{title}</h2>
          {description ? (
            <p className='text-sm text-muted-foreground'>{description}</p>
          ) : null}
        </div>
        {children ? <div className='mt-4'>{children}</div> : null}
        <div
          className={cn(
            'mt-6 flex flex-wrap justify-end gap-3',
            !secondaryAction && 'justify-end',
          )}>
          {secondaryAction ? (
            <Button variant='ghost' onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

