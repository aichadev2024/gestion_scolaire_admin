import * as React from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

/** Encadré centré pour les pages hors-session (login, setup, mot de passe…). */
export function AuthShell({
  children,
  className,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-accent/10 blur-3xl" />
      <div
        className={cn(
          'relative z-10 w-full rounded-2xl border border-border bg-card p-8 shadow-xl',
          wide ? 'max-w-xl' : 'max-w-md',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AuthHeader({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <Logo className="mb-3" markClassName="h-14 w-14" showEcole={false} />
      <h1 className="font-display text-xl font-extrabold text-primary">{title}</h1>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
