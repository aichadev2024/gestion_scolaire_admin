'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

// Pages autorisées par rôle
const ALLOWED_PATHS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // Full platform & dashboard access
  ADMIN: ['*'], // Accès total
  DIRECTEUR: [
    '/dashboard',
    '/dashboard/eleves',
    '/dashboard/enseignants',
    '/dashboard/classes',
    '/dashboard/emploi-du-temps',
    '/dashboard/presences',
    '/dashboard/cartes-scolaires',
    '/dashboard/notes',
    '/dashboard/bulletins',
    '/dashboard/finances',
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
  PARENT: [
    '/dashboard',
    '/dashboard/finances',
    '/dashboard/presences',
    '/dashboard/cartes-scolaires',
    '/dashboard/bulletins',
  ],
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
        <svg viewBox="0 0 50 50" style={{ width: '40px', height: '40px', animation: 'rotate 2s linear infinite', color: 'var(--primary-color)' }}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="90, 150" strokeDashoffset="0" style={{ animation: 'dash 1.5s ease-in-out infinite' }}></circle>
        </svg>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-secondary)', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem' }}>🔒</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Accès non autorisé</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-primary"
          style={{ width: 'auto', marginTop: '1rem' }}
        >
          ← Retour au tableau de bord
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
