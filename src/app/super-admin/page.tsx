'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Ban,
  Building2,
  CheckCircle2,
  Coins,
  Plus,
  ScrollText,
  Settings,
  School,
} from 'lucide-react';
import { etablissementService, Etablissement } from '@/services/etablissement.service';
import { tarifService } from '@/services/tarif.service';
import { authService } from '@/services/auth.service';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [planMrr, setPlanMrr] = useState<Record<string, number>>({ STARTER: 50000, PRO: 75000 });
  const [loading, setLoading] = useState(true);
  const [userNomComplet, setUserNomComplet] = useState('Super-Admin');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      const name = [user.prenom, user.nom].filter(Boolean).join(' ');
      setUserNomComplet(name || user.username || 'Super-Admin');
    }
    etablissementService
      .listerTous()
      .then(setEtablissements)
      .catch(console.error)
      .finally(() => setLoading(false));
    tarifService
      .listerTous()
      .then((tarifs) => setPlanMrr(Object.fromEntries(tarifs.map((t) => [t.code, t.prixMensuel]))))
      .catch(() => {});
  }, []);

  const total = etablissements.length;
  const actifs = etablissements.filter((e) => e.statut === 'ACTIF').length;
  const suspendus = etablissements.filter((e) => e.statut === 'SUSPENDU').length;
  const mrr = etablissements.reduce(
    (acc, e) => (e.statut === 'ACTIF' ? acc + (planMrr[e.planTarifaire] ?? planMrr.STARTER) : acc),
    0,
  );
  const starterCount = etablissements.filter((e) => e.planTarifaire === 'STARTER').length;
  const proCount = etablissements.filter((e) => e.planTarifaire === 'PRO').length;

  const metrics = [
    {
      label: 'Revenu mensuel (MRR)',
      value: loading ? '…' : `${mrr.toLocaleString('fr-FR')} FCFA`,
      hint: 'Estimation sur les comptes actifs',
      Icon: Coins,
      accent: 'text-primary',
    },
    {
      label: 'Établissements totaux',
      value: loading ? '…' : total,
      hint: 'Sous-domaines configurés',
      Icon: Building2,
      accent: 'text-foreground',
    },
    {
      label: 'Écoles actives',
      value: loading ? '…' : actifs,
      hint: 'Accès et services fonctionnels',
      Icon: CheckCircle2,
      accent: 'text-success',
    },
    {
      label: 'Comptes suspendus',
      value: loading ? '…' : suspendus,
      hint: 'Accès temporairement bloqués',
      Icon: Ban,
      accent: 'text-destructive',
    },
  ];

  const shortcuts = [
    { label: 'Gérer les établissements', href: '/super-admin/etablissements', Icon: Building2 },
    { label: "Journaux d'audit", href: '/super-admin/journal', Icon: ScrollText },
    { label: 'Paramètres SaaS', href: '/super-admin/settings', Icon: Settings },
    { label: "Tester l'accès école", href: '/dashboard', Icon: School },
  ];

  const statutBadge = (s: Etablissement['statut']) =>
    s === 'ACTIF' ? (
      <Badge variant="success">Actif</Badge>
    ) : s === 'SUSPENDU' ? (
      <Badge variant="destructive">Suspendu</Badge>
    ) : (
      <Badge variant="secondary">Clôturé</Badge>
    );

  return (
    <div>
      <PageHeader title={`Bonjour, ${userNomComplet}`} description="Vue globale multi-tenant : abonnements, revenus et santé des établissements abonnés.">
        <Button onClick={() => router.push('/super-admin/etablissements')}>
          <Plus /> Ajouter un établissement client
        </Button>
      </PageHeader>

      {/* Chiffres clés */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, hint, Icon, accent }) => (
          <Card key={label} className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
              <Icon className={`size-5 ${accent}`} />
            </div>
            <div className={`text-2xl font-extrabold ${accent}`}>{value}</div>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Répartition abonnements */}
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-bold text-foreground">Répartition des abonnements</h3>
          <div className="flex flex-col gap-4">
            {[
              { label: `Plan Starter (${planMrr.STARTER?.toLocaleString('fr-FR')} FCFA/mois)`, count: starterCount, cls: 'bg-primary/50' },
              { label: `Plan Pro (${planMrr.PRO?.toLocaleString('fr-FR')} FCFA/mois)`, count: proCount, cls: 'bg-primary' },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-primary">{row.count} école(s)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${row.cls}`}
                    style={{ width: `${total ? (row.count / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Raccourcis */}
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-bold text-foreground">Raccourcis administrateur</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {shortcuts.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/40 p-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
              >
                <Icon className="size-4 shrink-0 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Derniers établissements */}
      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Derniers établissements inscrits</h3>
          <Button variant="link" size="sm" onClick={() => router.push('/super-admin/etablissements')}>
            Voir la liste complète ({total}) →
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : etablissements.length === 0 ? (
          <EmptyState icon={<Building2 />} title="Aucun établissement client enregistré pour le moment." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Sous-domaine</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {etablissements.slice(0, 5).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-semibold text-foreground">{e.nom}</TableCell>
                    <TableCell>
                      <code className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">
                        {e.code}.netaa-ecole.com
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.planTarifaire === 'ENTERPRISE' ? 'default' : 'secondary'}>
                        {e.planTarifaire}
                      </Badge>
                    </TableCell>
                    <TableCell>{statutBadge(e.statut)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.emailContact || 'Non renseigné'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
