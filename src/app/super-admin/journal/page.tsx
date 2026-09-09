'use client';

import { useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LogEntry {
  id: number;
  timestamp: string;
  acteur: string;
  role: string;
  action: string;
  module: 'IAM' | 'ETABLISSEMENT' | 'FINANCE' | 'SCOLARITE' | 'SYSTEME';
  niveau: 'INFO' | 'AVERTISSEMENT' | 'SECURITE' | 'ERREUR';
  details: string;
  ipAddress: string;
}

const MOCK_JOURNAL: LogEntry[] = [
  {
    id: 1,
    timestamp: '2026-08-06 12:45:10',
    acteur: 'superadmin@netaa.com',
    role: 'SUPER_ADMIN',
    action: 'CRÉATION_ÉTABLISSEMENT',
    module: 'ETABLISSEMENT',
    niveau: 'SECURITE',
    details: "Création de l'établissement Lycée Jules Verne (code: jules-verne) avec plan PRO",
    ipAddress: '197.234.221.4',
  },
  {
    id: 2,
    timestamp: '2026-08-06 11:20:05',
    acteur: 'admin.julesverne',
    role: 'ADMIN',
    action: 'CONNEXION_REUSSIE',
    module: 'IAM',
    niveau: 'INFO',
    details: "Authentification JWT réussie pour l'administrateur d'école",
    ipAddress: '154.120.98.12',
  },
  {
    id: 3,
    timestamp: '2026-08-06 10:15:30',
    acteur: 'superadmin@netaa.com',
    role: 'SUPER_ADMIN',
    action: 'SUSPENSION_ACCES',
    module: 'ETABLISSEMENT',
    niveau: 'AVERTISSEMENT',
    details:
      "Suspension temporaire de l'établissement Collège Sainte Marie (id: 4) pour retard de paiement",
    ipAddress: '197.234.221.4',
  },
  {
    id: 4,
    timestamp: '2026-08-06 09:05:00',
    acteur: 'comptable@julesverne.com',
    role: 'COMPTABLE',
    action: 'ENCAISSEMENT_PAIEMENT',
    module: 'FINANCE',
    niveau: 'INFO',
    details: "Paiement enregistré: 150 000 FCFA pour l'élève MAT-2026-001 (Reçu #REC-9823)",
    ipAddress: '154.120.98.15',
  },
  {
    id: 5,
    timestamp: '2026-08-05 18:30:12',
    acteur: 'inconnu',
    role: 'ANONYME',
    action: 'ECHEC_AUTHENTIFICATION',
    module: 'IAM',
    niveau: 'SECURITE',
    details:
      'Tentative de connexion échouée sur admin.saintjoseph avec mot de passe erroné (3 tentatives)',
    ipAddress: '41.202.219.88',
  },
];

const NIVEAU_BADGE: Record<LogEntry['niveau'], { variant: 'default' | 'secondary' | 'warning' | 'destructive'; label: string }> = {
  INFO: { variant: 'default', label: 'Info' },
  AVERTISSEMENT: { variant: 'warning', label: 'Avertissement' },
  SECURITE: { variant: 'secondary', label: 'Sécurité' },
  ERREUR: { variant: 'destructive', label: 'Erreur' },
};

export default function SuperAdminJournalPage() {
  const logs = MOCK_JOURNAL;
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('TOUS');
  const [filterNiveau, setFilterNiveau] = useState('TOUS');

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchSearch =
      log.acteur.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);
    const matchModule = filterModule === 'TOUS' || log.module === filterModule;
    const matchNiveau = filterNiveau === 'TOUS' || log.niveau === filterNiveau;
    return matchSearch && matchModule && matchNiveau;
  });

  return (
    <div>
      <PageHeader
        title="Journaux d'audit &amp; sécurité"
        description="Traçabilité globale des actions sensibles, connexions et modifications multi-tenant."
      />

      <Alert tone="info" className="mb-4" icon={<ShieldAlert className="size-4" />}>
        Données de démonstration — le flux d&apos;audit temps réel sera branché sur le backend en
        production.
      </Alert>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher un utilisateur, une IP ou une action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          className="w-auto"
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          <option value="TOUS">Tous les modules</option>
          <option value="IAM">IAM / Sécurité</option>
          <option value="ETABLISSEMENT">Établissements</option>
          <option value="FINANCE">Finances</option>
          <option value="SCOLARITE">Scolarité</option>
        </Select>
        <Select
          className="w-auto"
          value={filterNiveau}
          onChange={(e) => setFilterNiveau(e.target.value)}
        >
          <option value="TOUS">Tous les niveaux</option>
          <option value="INFO">Info</option>
          <option value="AVERTISSEMENT">Avertissement</option>
          <option value="SECURITE">Sécurité</option>
          <option value="ERREUR">Erreur</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Search />} title="Aucun événement ne correspond aux filtres" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horodatage</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Acteur</TableHead>
                <TableHead>Action / détails</TableHead>
                <TableHead>Adresse IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge variant={NIVEAU_BADGE[log.niveau].variant}>
                      {NIVEAU_BADGE[log.niveau].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{log.acteur}</div>
                    <span className="text-xs text-muted-foreground">{log.role}</span>
                  </TableCell>
                  <TableCell>
                    <span className="mb-0.5 block font-semibold text-primary">
                      [{log.module}] {log.action}
                    </span>
                    <span className="text-muted-foreground">{log.details}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
