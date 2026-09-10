'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  ScrollText,
  UsersRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Logo } from '@/components/logo';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MenuItem = { name: string; path: string; icon: LucideIcon };

const M = {
  dashboard: { name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
  eleves: { name: 'Élèves', path: '/dashboard/eleves', icon: GraduationCap },
  enseignants: { name: 'Enseignants', path: '/dashboard/enseignants', icon: UsersRound },
  classes: { name: 'Classes', path: '/dashboard/classes', icon: School },
  matieres: { name: 'Matières', path: '/dashboard/matieres', icon: BookOpen },
  edt: { name: 'Emploi du temps', path: '/dashboard/emploi-du-temps', icon: CalendarDays },
  presences: { name: 'Présences', path: '/dashboard/presences', icon: CheckSquare },
  notes: { name: 'Notes', path: '/dashboard/notes', icon: ClipboardList },
  bulletins: { name: 'Bulletins', path: '/dashboard/bulletins', icon: ScrollText },
  cartes: { name: 'Cartes scolaires', path: '/dashboard/cartes-scolaires', icon: CreditCard },
  finances: { name: 'Finances', path: '/dashboard/finances', icon: Wallet },
  utilisateurs: { name: 'Comptes utilisateurs', path: '/dashboard/utilisateurs', icon: KeyRound },
  espace: { name: 'Mon espace', path: '/dashboard', icon: Home },
  paiements: { name: 'Mes paiements', path: '/dashboard/finances', icon: Wallet },
} satisfies Record<string, MenuItem>;

const MENUS_BY_ROLE: Record<string, MenuItem[]> = {
  DIRECTEUR: [M.dashboard, M.eleves, M.enseignants, M.classes, M.matieres, M.edt, M.presences, M.notes, M.bulletins, M.cartes, M.finances, M.utilisateurs],
  SECRETAIRE: [M.dashboard, M.eleves, M.enseignants, M.classes, M.edt, M.presences, M.notes, M.bulletins, M.cartes],
  COMPTABLE: [M.dashboard, M.finances],
  ENSEIGNANT: [M.dashboard, M.classes, M.edt, M.presences, M.notes, M.bulletins],
  PARENT: [M.espace, M.paiements, M.presences, M.cartes, M.bulletins],
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super-Admin',
  DIRECTEUR: 'Directeur',
  SECRETAIRE: 'Secrétariat',
  COMPTABLE: 'Comptabilité',
  ENSEIGNANT: 'Enseignant',
  PARENT: 'Parent',
};

type SessionUser = {
  email?: string;
  role?: string;
  prenom?: string;
  nom?: string;
  username?: string;
  etablissementNom?: string;
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const role = user?.role || 'DIRECTEUR';
  const menuItems = MENUS_BY_ROLE[role] || MENUS_BY_ROLE.DIRECTEUR;
  const roleLabel = ROLE_LABELS[role] || role;
  const currentTitle =
    menuItems.find((m) => pathname === m.path || (pathname.startsWith(m.path) && m.path !== '/dashboard'))?.name ||
    'Tableau de bord';
  const displayName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.username || user?.email || 'Utilisateur';
  const initial = (user?.prenom || user?.username || user?.email || '?').charAt(0).toUpperCase();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* Overlay mobile */}
        {mobileOpen && (
          <button
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link href="/dashboard" aria-label="Netaa École — tableau de bord">
              <Logo markClassName="h-8 w-8" />
            </Link>
            <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary lg:hidden">
              <X className="size-5" />
            </button>
          </div>

          <div className="px-4 py-3">
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-primary">
              {roleLabel}
            </span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {menuItems.map((item) => {
              const active = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/dashboard');
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.name}-${item.path}`}
                  href={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon className="size-[1.15rem] shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-secondary/50 p-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                  {user?.etablissementNom ? ` · ${user.etablissementNom}` : ''}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mb-2 w-full justify-start" onClick={() => setIsChangePwdOpen(true)}>
              <KeyRound /> Changer le mot de passe
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut /> Déconnexion
            </Button>
          </div>
        </aside>

        {/* Contenu */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <h1 className="text-base font-semibold text-foreground">{currentTitle}</h1>
                <p className="text-xs text-muted-foreground">Netaa École — Gestion scolaire numérique</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{user?.email || '…'}</p>
                <p className="text-xs font-semibold text-primary">{roleLabel}</p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {initial}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>

      <ChangePasswordModal isOpen={isChangePwdOpen} onClose={() => setIsChangePwdOpen(false)} />
    </ProtectedRoute>
  );
}
