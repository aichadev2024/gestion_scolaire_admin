'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileSignature, Printer } from 'lucide-react';
import { presenceService, EmargementEnseignantItem } from '@/services/presence.service';
import { authService } from '@/services/auth.service';
import { classeService } from '@/services/classe.service';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const debutMois = () => {
  const d = new Date();
  return iso(new Date(d.getFullYear(), d.getMonth(), 1));
};

const STATUT_LABEL: Record<string, string> = { PRESENT: 'Présent', RETARD: 'Retard', ABSENT: 'Absent', CONGE: 'Congé' };
const STATUT_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PRESENT: 'success',
  RETARD: 'warning',
  ABSENT: 'destructive',
  CONGE: 'secondary',
};

interface Resume {
  enseignantId: number;
  matricule: string;
  nom: string;
  niveaux: string[];
  present: number;
  retard: number;
  absent: number;
  conge: number;
}

export default function EmargementPage() {
  const [debut, setDebut] = useState(debutMois());
  const [fin, setFin] = useState(iso(new Date()));
  const [niveau, setNiveau] = useState('');
  const [lignes, setLignes] = useState<EmargementEnseignantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [etablissement, setEtablissement] = useState('');
  const [niveauxEtab, setNiveauxEtab] = useState<string[]>([]);

  useEffect(() => {
    setEtablissement(authService.getCurrentUser()?.etablissementNom || '');
    classeService.getNiveaux().then((n) => setNiveauxEtab(n.map((x) => x.nom))).catch(() => setNiveauxEtab([]));
  }, []);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      setLignes(await presenceService.getFicheEmargement(debut, fin));
    } catch (err) {
      toast.error(errorMessage(err, "Impossible de charger la fiche d'émargement."));
    } finally {
      setLoading(false);
    }
  }, [debut, fin]);

  useEffect(() => {
    charger();
  }, [charger]);

  const niveauxDisponibles = useMemo(
    () => Array.from(new Set([...niveauxEtab, ...lignes.flatMap((l) => l.niveaux)])).sort((a, b) => a.localeCompare(b)),
    [lignes, niveauxEtab],
  );

  const filtrees = useMemo(
    () => (niveau ? lignes.filter((l) => l.niveaux.includes(niveau)) : lignes),
    [lignes, niveau],
  );

  const resumes = useMemo(() => {
    const map = new Map<number, Resume>();
    filtrees.forEach((l) => {
      const r = map.get(l.enseignantId) ?? {
        enseignantId: l.enseignantId,
        matricule: l.matricule,
        nom: `${l.nom ?? ''} ${l.prenom ?? ''}`.trim(),
        niveaux: l.niveaux,
        present: 0,
        retard: 0,
        absent: 0,
        conge: 0,
      };
      if (l.statut === 'PRESENT') r.present++;
      else if (l.statut === 'RETARD') r.retard++;
      else if (l.statut === 'ABSENT') r.absent++;
      else if (l.statut === 'CONGE') r.conge++;
      map.set(l.enseignantId, r);
    });
    return Array.from(map.values()).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [filtrees]);

  const exporterCsv = () => {
    const echap = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const entete = ['Date', 'Matricule', 'Nom', 'Prénom', 'Niveaux', 'Statut', 'Arrivée', 'Départ', 'Remarques'];
    const rows = filtrees.map((l) =>
      [l.date, l.matricule, l.nom, l.prenom, l.niveaux.join(' / '), STATUT_LABEL[l.statut] ?? l.statut, l.heureArrivee, l.heureDepart, l.remarques]
        .map((v) => echap(v as string | null | undefined))
        .join(';'),
    );
    const blob = new Blob(['﻿' + [entete.map((h) => echap(h)).join(';'), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emargement-enseignants_${debut}_${fin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Émargement des enseignants"
          description="Fiche de suivi des présences, retards et absences du personnel enseignant, par période et par niveau."
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={exporterCsv} disabled={filtrees.length === 0}>
              <Download /> Exporter (Excel)
            </Button>
            <Button variant="outline" onClick={() => window.print()} disabled={filtrees.length === 0}>
              <Printer /> Imprimer
            </Button>
          </div>
        </PageHeader>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <Field label="Du">
            <Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
          </Field>
          <Field label="Au">
            <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          </Field>
          <Field label="Niveau / filière" className="min-w-56">
            <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
              <option value="">— Tous les niveaux —</option>
              {niveauxDisponibles.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">{etablissement || 'Établissement'} — Fiche de suivi de l&apos;émargement des enseignants</h1>
        <p className="mb-3 text-sm">
          Du {new Date(debut).toLocaleDateString('fr-FR')} au {new Date(fin).toLocaleDateString('fr-FR')}
          {niveau ? ` — ${niveau}` : ''}
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : filtrees.length === 0 ? (
        <EmptyState
          icon={<FileSignature />}
          title="Aucun pointage sur cette période"
          description="Le pointage des enseignants se fait depuis la page Présences, onglet Enseignants."
        />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Récapitulatif par enseignant</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Niveaux</TableHead>
                  <TableHead className="text-right">Présences</TableHead>
                  <TableHead className="text-right">Retards</TableHead>
                  <TableHead className="text-right">Absences</TableHead>
                  <TableHead className="text-right">Congés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumes.map((r) => (
                  <TableRow key={r.enseignantId}>
                    <TableCell>
                      <div className="font-medium">{r.nom}</div>
                      <div className="font-mono text-xs text-muted-foreground">{r.matricule}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.niveaux.join(', ') || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.present}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.retard}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.absent}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.conge}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Détail jour par jour</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Arrivée</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Remarques</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrees.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">{new Date(l.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="font-medium">{l.nom} {l.prenom}</TableCell>
                    <TableCell>
                      <Badge variant={STATUT_VARIANT[l.statut] ?? 'secondary'}>{STATUT_LABEL[l.statut] ?? l.statut}</Badge>
                    </TableCell>
                    <TableCell>{l.heureArrivee || '—'}</TableCell>
                    <TableCell>{l.heureDepart || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.remarques || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>
      )}
    </div>
  );
}
