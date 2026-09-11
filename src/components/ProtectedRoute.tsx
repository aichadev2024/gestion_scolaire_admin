'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';

// Pages autorisées par rôle
const ALLOWED_PATHS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // Full platform & dashboard access
  // Le directeur est l'administrateur de l'établissement : accès total à
  // TOUT l'espace /dashboard (élèves, enseignants, classes, matières,
  // emploi du temps, présences, notes, bulletins, cartes, finances,
  // comptes utilisateurs). Seul l'espace /super-admin lui reste fermé.
  DIRECTEUR: [
    '/dashboard',
    '/dashboard/eleves',
    '/dashboard/enseignants',
    '/dashboard/classes',
    '/dashboard/matieres',
    '/dashboard/emploi-du-temps',
    '/dashboard/presences',
    '/dashboard/cartes-scolaires',
    '/dashboard/notes',
    '/dashboard/bulletins',
    '/dashboard/finances',
    '/dashboard/utilisateurs',
  ],
  SECRETAIRE: [
    '/dashboard',
    '/dashboard/eleves',
    '/dashboard/enseignants',
    '/dashboard/classes',
    '/dashboard/emploi-du-temps',
    '/dashboard/presences',
    '/dashboard/cartes-scolaires',
    '/dashboard/notes',
    '/dashboard/bulletins',
  ],
  COMPTABLE: [
    '/dashboard',
    '/dashboard/finances',
  ],
  ENSEIGNANT: [
    '/dashboard',
    '/dashboard/classes',
    '/dashboard/emploi-du-temps',
    '/dashboard/presences',
    '/dashboard/notes',
    '/dashboard/bulletins',
  ],
  // ÉLÈVE et PARENT n'ont pas d'accès web (voir /mobile-uniquement) — ils
  // utilisent l'application mobile. Volontairement absents de cette liste.
};

function canAccess(role: string, pathname: string): boolean {
  const allowed = ALLOWED_PATHS[role];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  // Check exact match or prefix match
  return allowed.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'ok' | 'forbidden'>('loading');

  useEffect(() => {
    const check = () => {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }
      const user = authService.getCurrentUser();
      const role = user?.role || '';
      // Rôle sans aucune page web autorisée (ÉLÈVE, PARENT) : pas de session
      // web à garder, on renvoie directement vers l'appli mobile.
      if (!ALLOWED_PATHS[role]) {
        authService.logout();
        router.push('/mobile-uniquement');
        return;
      }
      if (!canAccess(role, pathname)) {
        setStatus('forbidden');
      } else {
        setStatus('ok');
      }
    };
    check();
  }, [router, pathname]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Lock className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Accès non autorisé</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <Button onClick={() => router.push('/dashboard')} className="mt-2">
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
