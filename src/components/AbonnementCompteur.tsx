'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { tarifService, Abonnement } from '@/services/tarif.service';
import { cn } from '@/lib/utils';

/**
 * Compteur d'élèves actifs vs limite du plan (« 182 / 200 élèves »). Réservé à la direction et
 * au secrétariat ; ne s'affiche pas pour un plan illimité tant qu'il n'y a rien à surveiller.
 */
export default function AbonnementCompteur({ className }: { className?: string }) {
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const role = authService.getCurrentUser()?.role;
  const autorise = role === 'DIRECTEUR' || role === 'SECRETAIRE';

  useEffect(() => {
    if (!autorise) return;
    tarifService.monAbonnement().then(setAbonnement).catch(() => {});
  }, [autorise]);

  if (!autorise || !abonnement) return null;

  const { elevesActifs, maxEleves, libelle } = abonnement;
  if (maxEleves == null) {
    return (
      <div className={cn('flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm', className)}>
        <Users className="size-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{elevesActifs} élèves</span>
        <span className="text-muted-foreground">· {libelle}</span>
      </div>
    );
  }

  const ratio = elevesActifs / maxEleves;
  const atteint = elevesActifs >= maxEleves;
  const proche = ratio >= 0.9;

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        atteint ? 'border-destructive/40 bg-destructive/8' : proche ? 'border-warning/50 bg-warning/10' : 'border-border bg-card',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <Users className="size-4 text-muted-foreground" />
          {elevesActifs} / {maxEleves} élèves
        </span>
        <span className="text-xs text-muted-foreground">{libelle}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full', atteint ? 'bg-destructive' : proche ? 'bg-warning' : 'bg-primary')}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
      {(atteint || proche) && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {atteint
            ? "Limite atteinte : les nouvelles inscriptions sont bloquées. Archivez des élèves ou passez au plan supérieur."
            : 'Vous approchez de la limite de votre plan.'}
        </p>
      )}
    </div>
  );
}
