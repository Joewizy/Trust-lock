'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type InlineToastProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  variant?: 'success' | 'warning';
};

export function InlineToast({
  title,
  description,
  open,
  onClose,
  variant = 'success',
}: InlineToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => onClose(), 4200);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className='fixed right-6 top-6 z-50 w-[min(360px,90vw)]'>
      <div
        className={cn(
          'rounded-2xl border px-4 py-3 shadow-lg backdrop-blur',
          variant === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50 text-amber-900',
        )}>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold'>{title}</p>
            {description ? (
              <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
            ) : null}
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={onClose}>
            <X className='h-3.5 w-3.5' />
          </Button>
        </div>
      </div>
    </div>
  );
}

