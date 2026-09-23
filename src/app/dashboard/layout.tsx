'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Baby,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  GraduationCap,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  School,
  ScrollText,
  ShieldAlert,
  FileCheck2,
  TrendingUp,
  UsersRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { getMessagingIfSupported } from '@/lib/firebase';
import { pushNotificationService } from '@/services/pushNotification.service';
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
  rapportJournalier: { name: 'Rapport journalier', path: '/dashboard/rapport-journalier', icon: Baby },
  niveaux: { name: 'Niveaux', path: '/dashboard/niveaux', icon: Layers },
  stock: { name: 'Stock', path: '/dashboard/stock', icon: Package },
  cahierTexte: { name: 'Cahier de texte', path: '/dashboard/cahier-texte', icon: BookOpenCheck },
  rapportsNiveau: { name: 'Niveau des classes', path: '/dashboard/rapports-niveau', icon: ClipboardCheck },
  performance: { name: 'Performance', path: '/dashboard/performance', icon: TrendingUp },
  discipline: { name: 'Discipline', path: '/dashboard/discipline', icon: ShieldAlert },
  sujetsDevoirs: { name: 'Sujets de devoirs & examens', path: '/dashboard/sujets-devoirs', icon: FileCheck2 },
  promoteur: { name: 'Tableau de bord', path: '/dashboard/promoteur', icon: LayoutDashboard },
} satisfies Record<string, MenuItem>;

// ÉLÈVE et PARENT n'ont pas d'accès web (voir ProtectedRoute + /mobile-uniquement).
const MENUS_BY_ROLE: Record<string, MenuItem[]> = {
  DIRECTEUR: [M.dashboard, M.eleves, M.enseignants, M.classes, M.matieres, M.edt, M.presences, M.notes, M.bulletins, M.cartes, M.finances, M.utilisateurs, M.discipline, M.stock, M.cahierTexte, M.performance, M.rapportsNiveau, M.sujetsDevoirs, M.niveaux],
  SECRETAIRE: [M.dashboard, M.eleves, M.enseignants, M.classes, M.edt, M.presences, M.notes, M.bulletins, M.cartes, M.discipline, M.cahierTexte, M.performance, M.sujetsDevoirs],
  COMPTABLE: [M.dashboard, M.finances, M.stock],
  ENSEIGNANT: [M.dashboard, M.classes, M.edt, M.presences, M.notes, M.bulletins, M.cahierTexte, M.rapportsNiveau],
  SURVEILLANT_GENERAL: [M.dashboard, M.eleves, M.classes, M.discipline],
  // Lecture seule : une seule page, pas de menu à parcourir.
  PROMOTEUR: [M.promoteur],
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super-Admin',
  DIRECTEUR: 'Directeur',
  SECRETAIRE: 'Secrétariat',
  COMPTABLE: 'Comptabilité',
  ENSEIGNANT: 'Enseignant',
  SURVEILLANT_GENERAL: 'Surveillance générale',
  PROMOTEUR: 'Promoteur',
};

type SessionUser = {
  email?: string;
  role?: string;
  prenom?: string;
  nom?: string;
  username?: string;
  etablissementNom?: string;
  etablissementLogoUrl?: string;
  etablissementSlogan?: string;
  aClassesCreche?: boolean;
  etablissementUniquementCreche?: boolean;
  estMonitrice?: boolean;
  niveauSuperviseNom?: string;
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

  // Une seule fois par session (montage du layout) : demande la permission notification si elle
  // n'a jamais été tranchée (`default`), enregistre le token push, et écoute les notifications
  // reçues onglet ouvert (Firebase ne les affiche PAS automatiquement dans ce cas, contrairement
  // à l'arrière-plan/onglet fermé, géré par public/firebase-messaging-sw.js).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const messaging = await getMessagingIfSupported();
        if (!messaging) return;

        const { getToken, onMessage } = await import('firebase/messaging');

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;
        }
        if (Notification.permission !== 'granted') return;

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        if (token) await pushNotificationService.enregistrerToken(token, 'WEB');

        unsubscribe = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          toast(title || 'Notification', { description: body });
        });
      } catch {
        // Navigateur non compatible, permission refusée, ou Firebase non configuré : silencieux,
        // l'utilisateur garde l'accès aux notifications via l'écran existant.
      }
    })();

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const role = user?.role || 'DIRECTEUR';
  // Uniquement crèche (aucun primaire/collège/lycée à côté) : le menu générique peut dire "Monitrices".
  // Dans une école mixte, le personnel est un mélange des deux — voir estMonitrice, propre à la personne.
  const uniquementCreche = !!user?.etablissementUniquementCreche;
  // Ces pages n'ont aucun sens pour une crèche pure (pas de matières, pas de notes/bulletins scolaires,
  // pas de carte scolaire). On ne fait JAMAIS ça pour une école mixte : elle en a besoin pour ses classes
  // primaire/collège/lycée, même si elle a aussi une section crèche.
  const PATHS_INUTILES_CRECHE_PURE = new Set([M.matieres.path, M.edt.path, M.notes.path, M.bulletins.path, M.cartes.path]);
  const menuItems = [...(MENUS_BY_ROLE[role] || MENUS_BY_ROLE.DIRECTEUR)]
    .filter((m) => !(uniquementCreche && PATHS_INUTILES_CRECHE_PURE.has(m.path)))
    .map((m) => (uniquementCreche && m.path === M.enseignants.path ? { ...m, name: 'Monitrices' } : m));
  if (user?.aClassesCreche && ['DIRECTEUR', 'SECRETAIRE', 'ENSEIGNANT'].includes(role)) {
    const presencesIdx = menuItems.findIndex((m) => m.path === M.presences.path);
    menuItems.splice(presencesIdx + 1, 0, M.rapportJournalier);
  }
  // Directeur restreint au niveau Lycée : appellation "Censeur", conforme à l'usage scolaire.
  // Comparaison souple : le nom réel du niveau peut être plus descriptif que "Lycée" tout court
  // (ex. "Lycée Secondaire Général (10ème - Terminale)").
  const estNiveauLycee = /lyc[eé]e/i.test(user?.niveauSuperviseNom || '');
  const roleLabel =
    role === 'DIRECTEUR' && estNiveauLycee
      ? 'Censeur'
      : role === 'ENSEIGNANT' && user?.estMonitrice
      ? 'Monitrice'
      : ROLE_LABELS[role] || role;
  const roleLabelAvecNiveau = user?.niveauSuperviseNom ? `${roleLabel} · ${user.niveauSuperviseNom}` : roleLabel;
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
            'print:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link href="/dashboard" aria-label="Netaa École — tableau de bord" className="flex items-center gap-2 overflow-hidden">
              {user?.etablissementLogoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.etablissementLogoUrl} alt={user.etablissementNom || 'Logo'} className="h-11 w-11 shrink-0 rounded object-contain" />
                  <span className="line-clamp-2 text-sm font-bold leading-tight text-foreground">{user.etablissementNom}</span>
                </>
              ) : (
                <Logo markClassName="h-8 w-8" />
              )}
            </Link>
            <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary lg:hidden">
              <X className="size-5" />
            </button>
          </div>

          <div className="px-4 py-3">
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-primary">
              {roleLabelAvecNiveau}
            </span>
            {user?.etablissementSlogan && (
              <p className="mt-2 truncate text-xs italic text-muted-foreground">{user.etablissementSlogan}</p>
            )}
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
                  {roleLabelAvecNiveau}
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
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64 print:pl-0">
          <header className="print:hidden sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
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
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs font-semibold text-primary">{roleLabelAvecNiveau}</p>
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
