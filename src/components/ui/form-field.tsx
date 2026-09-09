import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

/** Paire libellé + champ, avec un span de grille optionnel. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Encadré d'erreur de formulaire. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
