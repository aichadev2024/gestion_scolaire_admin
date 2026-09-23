'use client';

import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, School, BadgeCheck, UsersRound, Wallet, TrendingDown, Users, CalendarDays, CalendarRange, Search, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { statistiquesService, StatistiquesEtablissement, StatistiquesFinances } from '@/services/statistiques.service';
import { utilisateurService, UtilisateurResponse } from '@/services/utilisateur.service';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ROLE_LABELS: Record<string, string> = {
  DIRECTEUR: 'Directeur',
  SECRETAIRE: 'Secrétariat',
  COMPTABLE: 'Comptabilité',
  ENSEIGNANT: 'Enseignant',
  SURVEILLANT_GENERAL: 'Surveillance générale',
};
const ROLES_EXCLUS = new Set(['PARENT', 'ELEVE', 'SUPER_ADMIN', 'PROMOTEUR']);
const TYPE_LABEL: Record<string, string> = { INSCRIPTION: 'Inscription', MENSUALITE: 'Mensualité', AUTRE: 'Frais' };
const TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'warning'> = { INSCRIPTION: 'default', MENSUALITE: 'secondary', AUTRE: 'warning' };

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

/**
 * Anneau de progression « encaissé sur attendu » — un seul repère de couleur (vert = déjà
 * encaissé), la piste claire de la même teinte porte le reste. Pas un camembert à deux teintes :
 * un ratio contre une limite se lit mieux en jauge circulaire qu'en deux parts qui se disputent l'œil.
 */
function AnneauEncaisse({ pct, devise, encaisse }: { pct: number; devise: string; encaisse: number }) {
  const size = 176;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(clamped * 100)} % des frais encaissés`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--success) / 0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 30, fontWeight: 800 }}>
          {Math.round(clamped * 100)}%
        </text>
        <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
          ENCAISSÉ
        </text>
      </svg>
      <div className="text-center">
        <div className="font-display text-lg font-extrabold text-success tabular-nums">{fmt(encaisse)} {devise}</div>
        <div className="text-xs text-muted-foreground">déjà encaissés sur les frais définis</div>
      </div>
    </div>
  );
}

/** Barres des 12 derniers mois — une seule teinte (magnitude, pas identité), le mois courant porte sa valeur. */
function GraphiqueMensuel({ data, devise }: { data: { libelle: string; montant: number }[]; devise: string }) {
  const max = Math.max(1, ...data.map((d) => d.montant));
  const h = 120;
  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-1" role="img" aria-label="Encaissements des 12 derniers mois">
      {data.map((d, i) => {
        const barH = Math.max(3, Math.round((d.montant / max) * h));
        const estDernier = i === data.length - 1;
        return (
          <div key={`${d.libelle}-${i}`} className="flex min-w-[34px] flex-1 flex-col items-center gap-1.5">
            {estDernier && d.montant > 0 && (
              <span className="whitespace-nowrap text-[0.65rem] font-bold text-primary tabular-nums">{fmt(d.montant)}</span>
            )}
            <div className="flex h-[120px] w-full items-end" style={{ height: h }} title={`${d.libelle} — ${fmt(d.montant)} ${devise}`}>
              <div
                className={estDernier ? 'w-full rounded-t-[4px] bg-primary' : 'w-full rounded-t-[4px] bg-primary/35'}
                style={{ height: barH }}
              />
            </div>
            <span className="text-[0.65rem] font-medium text-muted-foreground">{d.libelle}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Espace du promoteur (propriétaire de l'établissement) sur le web — lecture seule, même contenu
 * que l'espace mobile équivalent : effectifs, finances réelles détaillées, équipe.
 */
export default function PromoteurPage() {
  const [stats, setStats] = useState<StatistiquesEtablissement | null>(null);
  const [finances, setFinances] = useState<StatistiquesFinances | null>(null);
  const [personnel, setPersonnel] = useState<UtilisateurResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const devise = finances?.devise || stats?.devise || authService.getCurrentUser()?.etablissementDevise || 'FCFA';

  useEffect(() => {
    (async () => {
      try {
        const [s, f, comptes] = await Promise.all([
          statistiquesService.etablissement(),
          statistiquesService.finances(),
          utilisateurService.getAll().catch(() => []),
        ]);
        setStats(s);
        setFinances(f);
        setPersonnel(comptes.filter((u) => !ROLES_EXCLUS.has(u.role)));
      } catch {
        toast.error("Impossible de charger les données de l'établissement.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const etablissementNom = authService.getCurrentUser()?.etablissementNom || 'Votre établissement';
  const pctEncaisse = finances && finances.totalFraisAttendus > 0 ? finances.totalEncaisse / finances.totalFraisAttendus : 0;

  const paiementsFiltres = useMemo(() => {
    const liste = finances?.paiements ?? [];
    const q = recherche.trim().toLowerCase();
    if (!q) return liste;
    return liste.filter((p) =>
      [p.eleveNom, p.elevePrenom, p.matricule, p.classeNom, p.fraisTitre].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [finances, recherche]);

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
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="grid gap-6 p-6 lg:grid-cols-[176px_1fr]">
          <AnneauEncaisse pct={pctEncaisse} devise={devise} encaisse={finances?.totalEncaisse ?? 0} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                <Wallet className="size-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">Frais attendus</div>
                <div className="font-display text-xl font-extrabold tabular-nums text-foreground">{fmt(stats?.totalFraisAttendus ?? 0)} {devise}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <TrendingDown className="size-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">Solde restant</div>
                <div className="font-display text-xl font-extrabold tabular-nums text-accent">{fmt(stats?.soldeRestant ?? 0)} {devise}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">Encaissé ce mois-ci</div>
                <div className="font-display text-xl font-extrabold tabular-nums text-primary">{fmt(finances?.encaisseMoisCourant ?? 0)} {devise}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarRange className="size-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">Encaissé cette année</div>
                <div className="font-display text-xl font-extrabold tabular-nums text-primary">{fmt(finances?.encaisseAnneeCourante ?? 0)} {devise}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Courbe des 12 derniers mois */}
      <h2 className="mb-3 mt-8 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Encaissements des 12 derniers mois
      </h2>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className="p-6">
          <GraphiqueMensuel data={finances?.parMois ?? []} devise={devise} />
        </Card>
      )}

      {/* Relevé détaillé des paiements */}
      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Détail des paiements — qui a payé, et quoi
        </h2>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un élève…" value={recherche} onChange={(e) => setRecherche(e.target.value)} className="pl-9" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : paiementsFiltres.length === 0 ? (
        <EmptyState icon={<Receipt />} title={recherche ? 'Aucun paiement ne correspond' : 'Aucun paiement enregistré'} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Frais</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paiementsFiltres.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{[p.elevePrenom, p.eleveNom].filter(Boolean).join(' ') || '—'}</div>
                    {p.matricule && <div className="font-mono text-xs text-muted-foreground">{p.matricule}</div>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.classeNom || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={TYPE_VARIANT[p.type]}>{TYPE_LABEL[p.type]}</Badge>
                      <span className="text-muted-foreground">{p.fraisTitre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-success tabular-nums">{fmt(p.montant)} {devise}</TableCell>
                  <TableCell className="text-muted-foreground">{p.mode}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(p.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
