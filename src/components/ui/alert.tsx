import * as React from 'react';
import { cn } from '@/lib/utils';

const tones = {
  info: 'border-primary/25 bg-primary/8 text-primary',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-gold/40 bg-gold/10 text-gold-foreground',
  error: 'border-destructive/25 bg-destructive/10 text-destructive',
} as const;

export function Alert({
  tone = 'info',
  icon,
  className,
  children,
}: {
  tone?: keyof typeof tones;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm',
        tones[tone],
        className,
      )}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span className="min-w-0">{children}</span>
    </div>
  );
}
