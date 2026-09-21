'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TrendingUp } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { classeService } from '@/services/classe.service';
import { performanceService, Decision, PerformanceClasse, Proposition } from '@/services/performance.service';
import { Classe } from '@/types';
import { categoriePourClasse, periodesDisponibles, periodeValide } from '@/lib/periodes';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PROPOSITION_LABEL: Record<Proposition, string> = {
  PASSAGE: 'Passage',
  A_DELIBERER: 'À délibérer',
  REDOUBLEMENT: 'Redoublement',
  SANS_NOTES: 'Sans notes',
};
const PROPOSITION_VARIANT: Record<Proposition, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PASSAGE: 'success',
  A_DELIBERER: 'warning',
  REDOUBLEMENT: 'destructive',
  SANS_NOTES: 'secondary',
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export default function PerformancePage() {
  const [peutDecider, setPeutDecider] = useState(false);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState('');
  const [periode, setPeriode] = useState('ANNUEL');
  const [seuilPassage, setSeuilPassage] = useState('10');
  const [seuilRedoublement, setSeuilRedoublement] = useState('8');
  const [data, setData] = useState<PerformanceClasse | null>(null);
  const categorie = categoriePourClasse(classes.find((c) => String(c.id) === classeId));
  const disponibles = periodesDisponibles(categorie);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPeutDecider(authService.getCurrentUser()?.role === 'DIRECTEUR');
    classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
  }, []);

  const charger = useCallback(async () => {
    if (!classeId) {
      setData(null);
      return;
    }
    const sp = parseFloat(seuilPassage.replace(',', '.'));
    const sr = parseFloat(seuilRedoublement.replace(',', '.'));
    if (Number.isNaN(sp) || Number.isNaN(sr)) return;
    setLoading(true);
    try {
      setData(await performanceService.classe(parseInt(classeId), periode, sp, sr));
    } catch (err) {
      toast.error(errorMessage(err, 'Impossible de calculer la performance.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [classeId, periode, seuilPassage, seuilRedoublement]);

  useEffect(() => {
    charger();
  }, [charger]);

  const decider = async (eleveId: number, valeur: string) => {
    const decision = (valeur || 'AUCUNE') as Decision | 'AUCUNE';
    try {
      await performanceService.decider(eleveId, decision);
      setData((d) =>
        d
          ? { ...d, eleves: d.eleves.map((e) => (e.eleveId === eleveId ? { ...e, decision: decision === 'AUCUNE' ? null : decision } : e)) }
          : d,
      );
      toast.success('Décision enregistrée.');
    } catch (err) {
      toast.error(errorMessage(err, "Impossible d'enregistrer la décision."));
    }
  };

  return (
    <div>
      <PageHeader
        title="Performance & passage"
        description="Bilan des résultats d'une classe et proposition de passage ou de redoublement à partir des moyennes."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Field label="Classe" className="min-w-56">
          <Select
            value={classeId}
            onChange={(e) => {
              setClasseId(e.target.value);
              const cat = categoriePourClasse(classes.find((c) => String(c.id) === e.target.value));
              if (!periodeValide(periode, cat)) setPeriode('ANNUEL');
            }}
          >
            <option value="">— Choisir une classe —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.niveauNom} — {c.nom}</option>
            ))}
          </Select>
        </Field>
        <Field label="Période" className="min-w-44">
          <Select value={periode} onChange={(e) => setPeriode(e.target.value)}>
            <option value="ANNUEL">Année complète</option>
            {disponibles.trimestres && (
              <optgroup label="Trimestres">
                <option value="TRIMESTRE_1">1er trimestre</option>
                <option value="TRIMESTRE_2">2e trimestre</option>
                <option value="TRIMESTRE_3">3e trimestre</option>
              </optgroup>
            )}
            {disponibles.compositions && (
              <optgroup label="Compositions">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={`COMPOSITION_${n}`}>Composition n°{n}</option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
        <Field label="Seuil de passage" hint="Moyenne minimale" className="w-32">
          <Input inputMode="decimal" value={seuilPassage} onChange={(e) => setSeuilPassage(e.target.value)} />
        </Field>
        <Field label="Seuil de redoublement" hint="En dessous : redoublement" className="w-40">
          <Input inputMode="decimal" value={seuilRedoublement} onChange={(e) => setSeuilRedoublement(e.target.value)} />
        </Field>
      </div>

      {!classeId ? (
        <EmptyState icon={<TrendingUp />} title="Choisissez une classe" description="Le bilan de ses résultats s'affichera ici." />
      ) : loading || !data ? (
        <Skeleton className="h-48 w-full" />
      ) : data.elevesNotes === 0 ? (
        <EmptyState icon={<TrendingUp />} title="Aucune note sur cette période" description="Les indicateurs apparaîtront dès que des notes seront saisies." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Effectif" value={String(data.effectif)} hint={`${data.elevesNotes} noté(s)`} />
            <Stat label="Moyenne de classe" value={data.moyenneClasse.toFixed(2)} />
            <Stat label="Taux de réussite" value={`${data.tauxReussite.toFixed(1)} %`} hint={`≥ ${data.seuilPassage}`} />
            <Stat label="Meilleure moyenne" value={data.moyenneMax.toFixed(2)} />
            <Stat label="Plus faible" value={data.moyenneMin.toFixed(2)} />
          </div>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Résultats par matière</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matière</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead className="text-right">Moyenne</TableHead>
                  <TableHead className="text-right">Taux de réussite</TableHead>
                  <TableHead className="text-right">Élèves notés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.matieres.map((m) => (
                  <TableRow key={m.classeMatiereId}>
                    <TableCell className="font-medium">{m.matiereNom}</TableCell>
                    <TableCell>{m.enseignantNom || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Badge variant={m.moyenne >= data.seuilPassage ? 'success' : m.moyenne >= data.seuilRedoublement ? 'warning' : 'destructive'}>
                        {m.moyenne.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{m.tauxReussite.toFixed(1)} %</TableCell>
                    <TableCell className="text-right tabular-nums">{m.elevesNotes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Classement et proposition de passage
            </h2>
            <p className="mb-2 text-xs text-muted-foreground">
              Moyenne générale pondérée par les coefficients, calculée sur les matières où l&apos;élève a des notes.
              La proposition est indicative : la décision appartient à la direction.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rang</TableHead>
                  <TableHead>Élève</TableHead>
                  <TableHead className="text-right">Moyenne</TableHead>
                  <TableHead>Proposition</TableHead>
                  <TableHead>Décision de la direction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.eleves.map((e) => (
                  <TableRow key={e.eleveId}>
                    <TableCell className="tabular-nums">{e.rang > 0 ? e.rang : '—'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{e.nom} {e.prenom}</div>
                      <div className="font-mono text-xs text-muted-foreground">{e.matricule}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{e.moyenne !== null ? e.moyenne.toFixed(2) : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={PROPOSITION_VARIANT[e.proposition]}>{PROPOSITION_LABEL[e.proposition]}</Badge>
                    </TableCell>
                    <TableCell>
                      {peutDecider ? (
                        <Select
                          value={e.decision || ''}
                          onChange={(ev) => decider(e.eleveId, ev.target.value)}
                          className="h-8 w-40 py-1 pl-2.5 pr-7 text-xs font-semibold"
                        >
                          <option value="">— Pas encore décidé —</option>
                          <option value="PASSAGE">Passage</option>
                          <option value="REDOUBLEMENT">Redoublement</option>
                        </Select>
                      ) : e.decision ? (
                        <Badge variant={e.decision === 'PASSAGE' ? 'success' : 'destructive'}>
                          {e.decision === 'PASSAGE' ? 'Passage' : 'Redoublement'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
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
