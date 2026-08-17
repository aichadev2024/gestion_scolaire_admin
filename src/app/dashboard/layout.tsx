'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChangePasswordModal from '@/components/ChangePasswordModal';

// ─── Types ────────────────────────────────────────────────────────────────────
type MenuItem = { name: string; path: string; icon: string };

// ─── Menu par rôle ────────────────────────────────────────────────────────────
const MENUS_BY_ROLE: Record<string, MenuItem[]> = {
  ADMIN: [
    { name: 'Tableau de bord',     path: '/dashboard',                   icon: '📊' },
    { name: 'Élèves',              path: '/dashboard/eleves',             icon: '🎓' },
    { name: 'Enseignants',         path: '/dashboard/enseignants',        icon: '👨‍🏫' },
    { name: 'Classes',             path: '/dashboard/classes',            icon: '🏫' },
    { name: 'Matières',            path: '/dashboard/matieres',           icon: '📚' },
    { name: 'Emploi du Temps',     path: '/dashboard/emploi-du-temps',    icon: '📅' },
    { name: 'Présences',           path: '/dashboard/presences',          icon: '✅' },
    { name: 'Notes',               path: '/dashboard/notes',              icon: '📝' },
    { name: 'Bulletins',           path: '/dashboard/bulletins',          icon: '📜' },
    { name: 'Cartes Scolaires',    path: '/dashboard/cartes-scolaires',   icon: '🪪' },
    { name: 'Finances',            path: '/dashboard/finances',           icon: '💰' },
    { name: 'Comptes Utilisateurs',path: '/dashboard/utilisateurs',       icon: '🔐' },
  ],
  DIRECTEUR: [
    { name: 'Tableau de bord',     path: '/dashboard',                   icon: '📊' },
    { name: 'Élèves',              path: '/dashboard/eleves',             icon: '🎓' },
    { name: 'Enseignants',         path: '/dashboard/enseignants',        icon: '👨‍🏫' },
    { name: 'Classes',             path: '/dashboard/classes',            icon: '🏫' },
    { name: 'Emploi du Temps',     path: '/dashboard/emploi-du-temps',    icon: '📅' },
    { name: 'Présences',           path: '/dashboard/presences',          icon: '✅' },
    { name: 'Notes',               path: '/dashboard/notes',              icon: '📝' },
    { name: 'Bulletins',           path: '/dashboard/bulletins',          icon: '📜' },
    { name: 'Cartes Scolaires',    path: '/dashboard/cartes-scolaires',   icon: '🪪' },
    { name: 'Finances',            path: '/dashboard/finances',           icon: '💰' },
  ],
  SECRETAIRE: [
    { name: 'Tableau de bord',     path: '/dashboard',                   icon: '📊' },
    { name: 'Élèves',              path: '/dashboard/eleves',             icon: '🎓' },
    { name: 'Enseignants',         path: '/dashboard/enseignants',        icon: '👨‍🏫' },
    { name: 'Classes',             path: '/dashboard/classes',            icon: '🏫' },
    { name: 'Emploi du Temps',     path: '/dashboard/emploi-du-temps',    icon: '📅' },
    { name: 'Présences',           path: '/dashboard/presences',          icon: '✅' },
    { name: 'Notes',               path: '/dashboard/notes',              icon: '📝' },
    { name: 'Bulletins',           path: '/dashboard/bulletins',          icon: '📜' },
    { name: 'Cartes Scolaires',    path: '/dashboard/cartes-scolaires',   icon: '🪪' },
  ],
  COMPTABLE: [
    { name: 'Tableau de bord',     path: '/dashboard',                  icon: '📊' },
    { name: 'Finances',            path: '/dashboard/finances',          icon: '💰' },
  ],
  ENSEIGNANT: [
    { name: 'Tableau de bord',     path: '/dashboard',                  icon: '📊' },
    { name: 'Classes',             path: '/dashboard/classes',           icon: '🏫' },
    { name: 'Emploi du Temps',     path: '/dashboard/emploi-du-temps',   icon: '📅' },
    { name: 'Présences',           path: '/dashboard/presences',         icon: '✅' },
    { name: 'Notes',               path: '/dashboard/notes',              icon: '📝' },
    { name: 'Bulletins',           path: '/dashboard/bulletins',          icon: '📜' },
  ],
  PARENT: [
    { name: 'Mon Espace',          path: '/dashboard',                   icon: '🏠' },
    { name: 'Mes Paiements',       path: '/dashboard/finances',           icon: '💰' },
    { name: 'Présences',           path: '/dashboard/presences',          icon: '✅' },
    { name: 'Carte Scolaire',      path: '/dashboard/cartes-scolaires',   icon: '🪪' },
    { name: 'Bulletins',           path: '/dashboard/bulletins',          icon: '📜' },
  ],
};

// ─── Libellé affiché selon le rôle ──────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super-Admin',
  ADMIN:      'Administrateur',
  DIRECTEUR:  'Direction',
  SECRETAIRE: 'Secrétariat',
  COMPTABLE:  'Comptabilité',
  ENSEIGNANT: 'Enseignant',
  PARENT:     'Parent',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#6366f1',
  ADMIN:      '#ee5d50',
  DIRECTEUR:  '#1B365D',
  SECRETAIRE: '#8b5cf6',
  COMPTABLE:  '#05cd99',
  ENSEIGNANT: '#d97706',
  PARENT:     '#64748b',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    id?: number;
    email?: string;
    role?: string;
    prenom?: string;
    nom?: string;
    username?: string;
    etablissementNom?: string;
  } | null>(null);
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);

  useEffect(() => {
    const u = authService.getCurrentUser();
    setUser(u);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const role = user?.role || 'ADMIN';
  const menuItems: MenuItem[] = MENUS_BY_ROLE[role] || MENUS_BY_ROLE['ADMIN'];
  const roleLabel = ROLE_LABELS[role] || role;
  const roleColor = ROLE_COLORS[role] || 'var(--primary-color)';

  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="sidebar-header" style={{ padding: '1.25rem 0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src="/logo.png"
              alt="Netaa Logo"
              style={{ maxHeight: '65px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Role badge */}
          <div style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span style={{
              padding: '0.3rem 0.9rem',
              borderRadius: '20px',
              backgroundColor: `${roleColor}18`,
              color: roleColor,
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: `1px solid ${roleColor}30`
            }}>
              {roleLabel}
            </span>
          </div>

          {/* Nav items */}
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/dashboard');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            {/* User info */}
            <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: 'rgba(163,174,209,0.06)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: roleColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                {user?.prenom ? user.prenom.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : '👤'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.username || user?.email || 'Utilisateur'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {roleLabel} {user?.etablissementNom ? `· ${user.etablissementNom}` : ''}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsChangePwdOpen(true)}
              className="btn-secondary"
              style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              🔒 Changer le mot de passe
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ width: '100%', borderColor: 'rgba(238, 93, 80, 0.3)', color: 'var(--danger)', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="main-content">
          {/* Topbar */}
          <header className="topbar">
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {menuItems.find(m => pathname === m.path || (pathname.startsWith(m.path) && m.path !== '/dashboard'))?.name || 'Tableau de bord'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Netaa — Gestion Scolaire Numérique
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user?.email || '...'}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: roleColor }}>
                  {roleLabel}
                </p>
              </div>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: roleColor, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem'
              }}>
                {user?.email ? user.email.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>

      <ChangePasswordModal 
        isOpen={isChangePwdOpen} 
        onClose={() => setIsChangePwdOpen(false)} 
      />
    </ProtectedRoute>
  );
}
