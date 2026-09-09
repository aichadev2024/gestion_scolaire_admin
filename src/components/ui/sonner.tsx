'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** Conteneur de notifications toast, monté une fois dans le layout racine. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm text-card-foreground shadow-lg',
          title: 'font-semibold',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs font-medium',
          cancelButton: 'bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs',
          error: 'border-destructive/40',
          success: 'border-success/40',
        },
      }}
      {...props}
    />
  );
}
