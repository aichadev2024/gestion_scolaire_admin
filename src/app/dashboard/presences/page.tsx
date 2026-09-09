'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, CheckSquare, GraduationCap, UsersRound } from 'lucide-react';
import { presenceService, PresenceItem } from '@/services/presence.service';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { enseignantService } from '@/services/enseignant.service';
import { Classe, Eleve, Enseignant } from '@/types';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Statut = 'PRESENT' | 'ABSENT' | 'RETARD' | 'CONGE';
const STATUTS: Record<Statut, { label: string }> = {
  PRESENT: { label: 'Présent' },
  ABSENT: { label: 'Absent' },
  RETARD: { label: 'Retard' },
  CONGE: { label: 'Congé' },
};
const badgeVariant = (s: string): 'success' | 'destructive' | 'warning' | 'secondary' =>
  s === 'PRESENT' ? 'success' : s === 'ABSENT' ? 'destructive' : s === 'RETARD' ? 'warning' : 'secondary';

function StatutPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {options.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
            value === s
              ? s === 'PRESENT'
                ? 'border-success bg-success/10 text-success'
                : s === 'ABSENT'
                  ? 'border-destructive bg-destructive/10 text-destructive'
                  : s === 'RETARD'
                    ? 'border-warning bg-warning/15 text-warning-foreground'
                    : 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-secondary',
          )}
        >
          {STATUTS[s as Statut]?.label ?? s}
        </button>
      ))}
    </div>
  );
}

export default function PresencesPage() {
  const [tab, setTab] = useState<'APPEL' | 'ENSEIGNANTS' | 'HISTORIQUE'>('APPEL');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [appel, setAppel] = useState<Record<number, 'PRESENT' | 'ABSENT' | 'RETARD'>>({});
  const [submitting, setSubmitting] = useState(false);

  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [appelEns, setAppelEns] = useState<Record<number, { statut: Statut; heureArrivee: string }>>({});
  const [loadingEns, setLoadingEns] = useState(false);

  const [historyEleveId, setHistoryEleveId] = useState('');
  const [history, setHistory] = useState<PresenceItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
  }, []);

  const loadEnseignantsData = useCallback(async () => {
    setLoadingEns(true);
    try {
      const [profs, presencesProfs] = await Promise.all([
        enseignantService.getEnseignants(),
        presenceService.getPresencesEnseignants(today),
      ]);
      setEnseignants(profs);
      const map: Record<number, { statut: Statut; heureArrivee: string }> = {};
      profs.forEach((p) => {
        const existing = presencesProfs.find((pr) => pr.enseignant?.id === p.id);
        map[p.id] = {
          statut: (existing?.statut as Statut) || 'PRESENT',
          heureArrivee: existing?.heureArrivee || '07:45',
        };
      });
      setAppelEns(map);
    } catch {
      toast.error('Impossible de charger les enseignants.');
    } finally {
      setLoadingEns(false);
    }
  }, [today]);

  useEffect(() => {
    if (tab === 'ENSEIGNANTS') loadEnseignantsData();
  }, [tab, loadEnseignantsData]);

  useEffect(() => {
    if (!selectedClasseId) {
      setEleves([]);
      setAppel({});
      return;
    }
    eleveService
      .getEleves()
      .then((all) => {
        const filtered = all.filter((e) => e.classeId === parseInt(selectedClasseId));
        setEleves(filtered);
        setAppel(Object.fromEntries(filtered.map((e) => [e.id, 'PRESENT' as const])));
      })
      .catch(() => toast.error('Impossible de charger les élèves.'));
  }, [selectedClasseId]);

  const handleSubmitAppel = async () => {
    if (!selectedClasseId || eleves.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(
        eleves.map((e) =>
          presenceService.enregistrer({ eleveId: e.id, date: today, statut: appel[e.id] || 'PRESENT' }),
        ),
      );
      toast.success(`Appel enregistré (${eleves.length} élèves) pour le ${today}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de l'enregistrement de l'appel"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAppelEns = async () => {
    if (enseignants.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(
        enseignants.map((e) =>
          presenceService.enregistrerEnseignant({
            enseignantId: e.id,
            date: today,
            statut: appelEns[e.id]?.statut || 'PRESENT',
            heureArrivee: appelEns[e.id]?.heureArrivee || '07:45',
          }),
        ),
      );
      toast.success(`Pointage enregistré (${enseignants.length} enseignants) pour le ${today}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors du pointage des enseignants'));
    } finally {
      setSubmitting(false);
    }
  };

  const loadHistory = async () => {
    if (!historyEleveId) return;
    setHistoryLoading(true);
    try {
      setHistory(await presenceService.getByEleve(parseInt(historyEleveId)));
    } catch (err) {
      toast.error(errorMessage(err, "Impossible de charger l'historique"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const count = (s: string) => Object.values(appel).filter((v) => v === s).length;

  return (
    <div>
      <PageHeader
        title="Présences & pointage"
        description="Appel des élèves, pointage des enseignants, historique."
      />

      <div className="mb-6 flex gap-1 border-b border-border">
        {(
          [
            ['APPEL', 'Appel élèves', GraduationCap],
            ['ENSEIGNANTS', 'Enseignants', UsersRound],
            ['HISTORIQUE', 'Historique', CalendarClock],
          ] as const
        ).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Appel élèves ─── */}
      {tab === 'APPEL' && (
        <div className="space-y-5">
          <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
            <Field label="Date">
              <Input value={today} readOnly className="cursor-not-allowed bg-muted" />
            </Field>
            <Field label="Classe" className="sm:col-span-2">
              <Select value={selectedClasseId} onChange={(e) => setSelectedClasseId(e.target.value)}>
                <option value="">— Choisir une classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.anneeScolaire})</option>
                ))}
              </Select>
            </Field>
          </div>

          {eleves.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Présents', count('PRESENT'), 'text-success'],
                ['Absents', count('ABSENT'), 'text-destructive'],
                ['Retards', count('RETARD'), 'text-warning-foreground'],
              ].map(([label, n, cls]) => (
                <div key={label as string} className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className={cn('font-display text-2xl font-extrabold tabular-nums', cls as string)}>{n}</div>
                  <div className="text-xs text-muted-foreground">{label as string}</div>
                </div>
              ))}
            </div>
          )}

          {!selectedClasseId ? (
            <EmptyState icon={<CheckSquare />} title="Sélectionnez une classe" description="Pour démarrer l'appel du jour." />
          ) : eleves.length === 0 ? (
            <EmptyState icon={<GraduationCap />} title="Aucun élève dans cette classe" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eleves.map((eleve, idx) => (
                    <TableRow key={eleve.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{eleve.profil.nom} {eleve.profil.prenom}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-primary">{eleve.matricule}</span>
                      </TableCell>
                      <TableCell>
                        <StatutPicker
                          options={['PRESENT', 'ABSENT', 'RETARD'] as const}
                          value={appel[eleve.id] || 'PRESENT'}
                          onChange={(v) => setAppel((p) => ({ ...p, [eleve.id]: v }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end">
                <Button loading={submitting} onClick={handleSubmitAppel}>
                  Valider l&apos;appel ({eleves.length} élèves)
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Enseignants ─── */}
      {tab === 'ENSEIGNANTS' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <h2 className="font-display text-lg font-bold text-primary">Pointage quotidien</h2>
              <p className="text-sm text-muted-foreground">Date : <strong>{today}</strong></p>
            </div>
            <Button loading={submitting} disabled={enseignants.length === 0} onClick={handleSubmitAppelEns}>
              Valider le pointage ({enseignants.length})
            </Button>
          </div>

          {loadingEns ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : enseignants.length === 0 ? (
            <EmptyState icon={<UsersRound />} title="Aucun enseignant enregistré" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Arrivée</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enseignants.map((p) => {
                  const cur = appelEns[p.id] || { statut: 'PRESENT' as Statut, heureArrivee: '07:45' };
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-primary">{p.matricule}</span>
                      </TableCell>
                      <TableCell className="font-medium">{p.profil?.nom} {p.profil?.prenom}</TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          className="h-9 w-28"
                          value={cur.heureArrivee}
                          onChange={(e) =>
                            setAppelEns((prev) => ({ ...prev, [p.id]: { ...cur, heureArrivee: e.target.value } }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <StatutPicker
                          options={['PRESENT', 'ABSENT', 'RETARD', 'CONGE'] as const}
                          value={cur.statut}
                          onChange={(v) => setAppelEns((prev) => ({ ...prev, [p.id]: { ...cur, statut: v } }))}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ─── Historique ─── */}
      {tab === 'HISTORIQUE' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <Field label="ID de l'élève" className="min-w-56 flex-1">
              <Input type="number" placeholder="Ex : 1" value={historyEleveId} onChange={(e) => setHistoryEleveId(e.target.value)} />
            </Field>
            <Button onClick={loadHistory} loading={historyLoading} disabled={!historyEleveId}>
              Voir l&apos;historique
            </Button>
          </div>

          {history.length === 0 ? (
            <EmptyState icon={<CalendarClock />} title="Aucun historique" description="Saisissez un identifiant d'élève puis lancez la recherche." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Justifié</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{new Date(p.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-muted-foreground">{p.classeMatiere?.matiere?.nom || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(p.statut)}>{STATUTS[p.statut as Statut]?.label ?? p.statut}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.estJustifie ? 'Oui' : 'Non'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.notesJustification || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
