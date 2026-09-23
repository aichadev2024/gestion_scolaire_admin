'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, UsersRound, School, BadgeCheck, Wallet, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { statistiquesService, StatistiquesEtablissement } from '@/services/statistiques.service';
import { utilisateurService, UtilisateurResponse } from '@/services/utilisateur.service';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

/** Rôles qui font partie de l'équipe de l'établissement — ni les familles, ni le promoteur lui-même. */
const ROLE_LABELS: Record<string, string> = {
  DIRECTEUR: 'Directeur',
  SECRETAIRE: 'Secrétariat',
  COMPTABLE: 'Comptabilité',
  ENSEIGNANT: 'Enseignant',
  SURVEILLANT_GENERAL: 'Surveillance générale',
};
const ROLES_EXCLUS = new Set(['PARENT', 'ELEVE', 'SUPER_ADMIN', 'PROMOTEUR']);

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');

/**
 * Espace du promoteur (propriétaire de l'établissement) sur le web — lecture seule, même contenu
 * que l'espace mobile équivalent : effectifs, finances réelles, équipe. Pour les promoteurs qui
 * préfèrent un ordinateur à leur téléphone (l'appli mobile reste l'autre option, au choix).
 */
export default function PromoteurPage() {
  const [stats, setStats] = useState<StatistiquesEtablissement | null>(null);
  const [personnel, setPersonnel] = useState<UtilisateurResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const devise = stats?.devise || authService.getCurrentUser()?.etablissementDevise || 'FCFA';

  useEffect(() => {
    (async () => {
      try {
        const [s, comptes] = await Promise.all([
          statistiquesService.etablissement(),
          utilisateurService.getAll().catch(() => []),
        ]);
        setStats(s);
        setPersonnel(comptes.filter((u) => !ROLES_EXCLUS.has(u.role)));
      } catch {
        toast.error("Impossible de charger les données de l'établissement.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const etablissementNom = authService.getCurrentUser()?.etablissementNom || 'Votre établissement';

  const tiles = [
    { label: 'Élèves', value: stats?.totalEleves ?? 0, Icon: GraduationCap },
    { label: 'Enseignants', value: stats?.totalEnseignants ?? 0, Icon: School },
    { label: 'Classes', value: stats?.totalClasses ?? 0, Icon: BadgeCheck },
    { label: 'Personnel', value: stats?.totalPersonnel ?? 0, Icon: UsersRound },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-[1.75rem]">
          Vue d&apos;ensemble — {etablissementNom}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Effectifs et finances réelles, en lecture seule. La gestion au quotidien reste faite par votre équipe.
        </p>
      </div>

      {/* Effectifs */}
      <h2 className="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Effectifs
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, Icon }) => (
          <Card key={label} className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
            </div>
            {loading ? <Skeleton className="h-10 w-16" /> : <span className="font-display text-4xl font-extrabold text-primary tabular-nums">{value}</span>}
          </Card>
        ))}
      </div>

      {/* Finances réelles */}
      <h2 className="mb-3 mt-8 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Finances réelles
      </h2>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card className="grid gap-4 p-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
              <Wallet className="size-5" />
            </span>
            <div>
              <div className="text-xs text-muted-foreground">Frais attendus</div>
              <div className="font-display text-xl font-extrabold tabular-nums text-foreground">{fmt(stats?.totalFraisAttendus ?? 0)} {devise}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <div className="text-xs text-muted-foreground">Encaissé</div>
              <div className="font-display text-xl font-extrabold tabular-nums text-success">{fmt(stats?.totalEncaisse ?? 0)} {devise}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <TrendingDown className="size-5" />
            </span>
            <div>
              <div className="text-xs text-muted-foreground">Solde restant</div>
              <div className="font-display text-xl font-extrabold tabular-nums text-accent">{fmt(stats?.soldeRestant ?? 0)} {devise}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Comptes du personnel */}
      <div className="mb-3 mt-8 flex items-baseline justify-between">
        <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Comptes du personnel
        </h2>
        <span className="text-xs text-muted-foreground">Lecture seule — gérés par la direction</span>
      </div>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : personnel.length === 0 ? (
        <EmptyState icon={<Users />} title="Aucun compte pour le moment" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {personnel.map((u) => {
            const nom = [u.profil?.prenom, u.profil?.nom].filter(Boolean).join(' ') || u.username || u.email;
            return (
              <Card key={u.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{nom}</div>
                  <div className="text-xs text-muted-foreground">{ROLE_LABELS[u.role] || u.role}</div>
                </div>
                <Badge variant={u.estActif ? 'success' : 'destructive'}>{u.estActif ? 'Actif' : 'Désactivé'}</Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
