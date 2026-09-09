'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  UsersRound,
  School,
  Building2,
  UserPlus,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { eleveService } from '@/services/eleve.service';
import { enseignantService } from '@/services/enseignant.service';
import { classeService } from '@/services/classe.service';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalEleves: number;
  totalEnseignants: number;
  totalClasses: number;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('Admin');
  const [etablissementNom, setEtablissementNom] = useState('');
  const [stats, setStats] = useState<Stats>({ totalEleves: 0, totalEnseignants: 0, totalClasses: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (user.role === 'SUPER_ADMIN') {
      router.push('/super-admin');
      return;
    }

    const nomComplet = [user.prenom, user.nom].filter(Boolean).join(' ');
    setUserName(nomComplet || user.username || user.email?.split('@')[0] || 'Utilisateur');
    if (user.etablissementNom) setEtablissementNom(user.etablissementNom);

    (async () => {
      try {
        const [eleves, enseignants, classes] = await Promise.all([
          eleveService.getEleves(),
          enseignantService.getEnseignants(),
          classeService.getClasses(),
        ]);
        setStats({
          totalEleves: eleves.length,
          totalEnseignants: enseignants.length,
          totalClasses: classes.length,
        });
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401 || status === 403) {
          authService.logout();
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const tiles = [
    { label: 'Élèves inscrits', value: stats.totalEleves, Icon: GraduationCap, href: '/dashboard/eleves' },
    { label: 'Enseignants', value: stats.totalEnseignants, Icon: UsersRound, href: '/dashboard/enseignants' },
    { label: 'Classes actives', value: stats.totalClasses, Icon: School, href: '/dashboard/classes' },
  ];

  const actions = [
    { label: 'Inscrire un élève', href: '/dashboard/eleves', Icon: UserPlus },
    { label: 'Ajouter une classe', href: '/dashboard/classes', Icon: School },
    { label: 'Ajouter un enseignant', href: '/dashboard/enseignants', Icon: UsersRound },
    { label: 'Enregistrer un paiement', href: '/dashboard/finances', Icon: Wallet },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-[1.75rem]">
            Bonjour, {userName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Un aperçu en temps réel de l&apos;activité de votre établissement.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-primary px-4 py-2.5 text-primary-foreground shadow-sm">
          <Building2 className="size-5 shrink-0 text-[hsl(var(--gold))]" />
          <div>
            <div className="font-mono text-[0.6rem] font-semibold uppercase tracking-wide text-[hsl(var(--gold))]">
              Établissement
            </div>
            <div className="text-sm font-semibold">{etablissementNom || 'Établissement scolaire'}</div>
          </div>
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(({ label, value, Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="group flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <span className="font-display text-4xl font-extrabold text-primary tabular-nums">{value}</span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-accent">
                Voir la liste <ArrowRight className="size-3" />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Actions rapides */}
      <Card className="mt-5 p-6">
        <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Actions rapides
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 rounded-lg border border-input px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-secondary"
            >
              <Icon className="size-4 shrink-0 text-primary" />
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
