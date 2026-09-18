'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ClipboardCheck, Plus } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { classeService } from '@/services/classe.service';
import { cahierTexteService, MonCours } from '@/services/cahierTexte.service';
import {
  rapportNiveauService,
  EleveEnDifficulte,
  NiveauGlobal,
  RapportNiveau,
} from '@/services/rapportNiveau.service';
import { Classe } from '@/types';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormError } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const NIVEAU_LABEL: Record<NiveauGlobal, string> = {
  BON: 'Bon niveau',
  MOYEN: 'Niveau moyen',
  FAIBLE: 'Niveau faible',
  PREOCCUPANT: 'Préoccupant',
};
const NIVEAU_VARIANT: Record<NiveauGlobal, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  BON: 'success',
  MOYEN: 'secondary',
  FAIBLE: 'warning',
  PREOCCUPANT: 'destructive',
};

const periodeLabel = (p: string) =>
  p === 'ANNUEL' ? 'Année complète' : p.replace('TRIMESTRE_', 'Trimestre ').replace('COMPOSITION_', 'Composition n°');

export default function RapportsNiveauPage() {
  const [role, setRole] = useState('');
  const [rapports, setRapports] = useState<RapportNiveau[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [mesCours, setMesCours] = useState<MonCours[]>([]);
  const [filtreClasse, setFiltreClasse] = useState('');
  const [nonTraites, setNonTraites] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [coursId, setCoursId] = useState('');
  const [periode, setPeriode] = useState('TRIMESTRE_1');
  const [niveau, setNiveau] = useState<NiveauGlobal>('MOYEN');
  const [commentaire, setCommentaire] = useState('');
  const [difficulte, setDifficulte] = useState<EleveEnDifficulte[]>([]);
  const [choisis, setChoisis] = useState<Record<number, { coche: boolean; commentaire: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [aTraiter, setATraiter] = useState<RapportNiveau | null>(null);
  const [reponse, setReponse] = useState('');

  const estEnseignant = role === 'ENSEIGNANT';
  const estDirecteur = role === 'DIRECTEUR';

  useEffect(() => {
    const r = authService.getCurrentUser()?.role || '';
    setRole(r);
    if (r === 'ENSEIGNANT') {
      cahierTexteService.mesCours().then(setMesCours).catch(() => toast.error('Impossible de charger vos cours.'));
    } else if (r === 'DIRECTEUR') {
      classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
    }
  }, []);

  const charger = useCallback(async () => {
    if (!role) return;
    setLoading(true);
    try {
      setRapports(
        role === 'ENSEIGNANT'
          ? await rapportNiveauService.mes()
          : await rapportNiveauService.tous(filtreClasse ? parseInt(filtreClasse) : undefined, nonTraites),
      );
    } catch (err) {
      toast.error(errorMessage(err, 'Impossible de charger les rapports.'));
    } finally {
      setLoading(false);
    }
  }, [role, filtreClasse, nonTraites]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    if (!showForm || !coursId) {
      setDifficulte([]);
      return;
    }
    rapportNiveauService
      .enDifficulte(parseInt(coursId), periode)
      .then((liste) => {
        setDifficulte(liste);
        setChoisis(Object.fromEntries(liste.map((e) => [e.eleveId, { coche: true, commentaire: '' }])));
      })
      .catch(() => setDifficulte([]));
  }, [showForm, coursId, periode]);

  const openForm = () => {
    setCoursId('');
    setPeriode('TRIMESTRE_1');
    setNiveau('MOYEN');
    setCommentaire('');
    setDifficulte([]);
    setChoisis({});
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coursId) {
      setError('Choisissez votre cours.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await rapportNiveauService.creer({
        classeMatiereId: parseInt(coursId),
        periode,
        niveauGlobal: niveau,
        commentaire: commentaire.trim() || undefined,
        eleves: difficulte
          .filter((d) => choisis[d.eleveId]?.coche)
          .map((d) => ({ eleveId: d.eleveId, commentaire: choisis[d.eleveId].commentaire.trim() || undefined })),
      });
      toast.success('Rapport transmis à la direction.');
      setShowForm(false);
      await charger();
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de l'envoi du rapport"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTraiter = async () => {
    if (!aTraiter) return;
    setSubmitting(true);
    try {
      await rapportNiveauService.traiter(aTraiter.id, reponse.trim() || undefined);
      toast.success('Rapport marqué comme traité.');
      setATraiter(null);
      await charger();
    } catch (err) {
      toast.error(errorMessage(err, 'Impossible de traiter ce rapport.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Niveau des classes"
        description={
          estEnseignant
            ? "Signalez à la direction le niveau de vos classes par matière et les élèves en difficulté, pour corriger les lacunes."
            : 'Rapports des enseignants sur le niveau des classes et les élèves en difficulté.'
        }
      >
        {estEnseignant && (
          <Button onClick={openForm}>
            <Plus /> Nouveau rapport
          </Button>
        )}
      </PageHeader>

      {estDirecteur && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <Field label="Classe" className="min-w-56">
            <Select value={filtreClasse} onChange={(e) => setFiltreClasse(e.target.value)}>
              <option value="">— Toutes les classes —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.niveauNom} — {c.nom}</option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" checked={nonTraites} onChange={(e) => setNonTraites(e.target.checked)} className="size-4 accent-primary" />
            Afficher seulement les rapports à traiter
          </label>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : rapports.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck />}
          title="Aucun rapport"
          description={estEnseignant ? 'Cliquez sur « Nouveau rapport » pour informer la direction.' : "Aucun enseignant n'a encore envoyé de rapport."}
        />
      ) : (
        <div className="space-y-3">
          {rapports.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {r.classeNom} — {r.matiereNom}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {periodeLabel(r.periode)} • {new Date(r.dateCreation).toLocaleDateString('fr-FR')}
                    {r.enseignantNom ? ` • ${r.enseignantNom}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={NIVEAU_VARIANT[r.niveauGlobal]}>{NIVEAU_LABEL[r.niveauGlobal]}</Badge>
                  {r.estTraite ? (
                    <Badge variant="success"><CheckCircle2 className="mr-1 size-3" /> Traité</Badge>
                  ) : (
                    <Badge variant="warning">À traiter</Badge>
                  )}
                </div>
              </div>

              {r.commentaire && <p className="mt-3 whitespace-pre-line text-sm">{r.commentaire}</p>}

              {r.eleves.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Élèves en difficulté ({r.eleves.length})
                  </div>
                  <ul className="space-y-1 text-sm">
                    {r.eleves.map((e) => (
                      <li key={e.eleveId} className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-medium">{e.nom} {e.prenom}</span>
                        {e.moyenne != null && <span className="tabular-nums text-destructive">{e.moyenne.toFixed(2)}/20</span>}
                        {e.commentaire && <span className="text-muted-foreground">— {e.commentaire}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {r.estTraite && r.reponseDirection && (
                <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm">
                  <strong>Réponse de la direction :</strong> {r.reponseDirection}
                </p>
              )}

              {estDirecteur && !r.estTraite && (
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => { setATraiter(r); setReponse(''); }}>
                    Marquer comme traité
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau rapport de niveau</DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Mon cours *">
              <Select value={coursId} onChange={(e) => setCoursId(e.target.value)} required>
                <option value="">— Classe et matière —</option>
                {mesCours.map((c) => (
                  <option key={c.classeMatiereId} value={c.classeMatiereId}>{c.classeNom} — {c.matiereNom}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Période *">
                <Select value={periode} onChange={(e) => setPeriode(e.target.value)}>
                  <option value="ANNUEL">Année complète</option>
                  <optgroup label="Trimestres">
                    <option value="TRIMESTRE_1">1er trimestre</option>
                    <option value="TRIMESTRE_2">2e trimestre</option>
                    <option value="TRIMESTRE_3">3e trimestre</option>
                  </optgroup>
                  <optgroup label="Compositions">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={`COMPOSITION_${n}`}>Composition n°{n}</option>
                    ))}
                  </optgroup>
                </Select>
              </Field>
              <Field label="Niveau général de la classe *">
                <Select value={niveau} onChange={(e) => setNiveau(e.target.value as NiveauGlobal)}>
                  {(Object.keys(NIVEAU_LABEL) as NiveauGlobal[]).map((n) => (
                    <option key={n} value={n}>{NIVEAU_LABEL[n]}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Observations" hint="Ex : la classe peine sur les fractions, beaucoup d'absences aux évaluations…">
              <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} />
            </Field>

            {coursId && (
              <div>
                <div className="mb-1 text-sm font-medium">Élèves sous la moyenne dans cette matière</div>
                {difficulte.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun élève sous 10 sur cette période (ou pas encore de notes).</p>
                ) : (
                  <ul className="space-y-2">
                    {difficulte.map((d) => (
                      <li key={d.eleveId} className="rounded-lg border border-border p-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={choisis[d.eleveId]?.coche ?? false}
                            onChange={(e) =>
                              setChoisis({ ...choisis, [d.eleveId]: { coche: e.target.checked, commentaire: choisis[d.eleveId]?.commentaire ?? '' } })
                            }
                          />
                          <span className="font-medium">{d.nom} {d.prenom}</span>
                          <span className="tabular-nums text-destructive">{d.moyenne.toFixed(2)}/20</span>
                        </label>
                        {choisis[d.eleveId]?.coche && (
                          <Input
                            className="mt-2"
                            placeholder="Précision (facultatif) : lacunes, absences…"
                            value={choisis[d.eleveId]?.commentaire ?? ''}
                            onChange={(e) => setChoisis({ ...choisis, [d.eleveId]: { coche: true, commentaire: e.target.value } })}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={submitting}>Envoyer à la direction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={aTraiter !== null} onOpenChange={(open) => !open && setATraiter(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Traiter le rapport — {aTraiter?.classeNom} / {aTraiter?.matiereNom}</DialogTitle>
          </DialogHeader>
          <Field label="Réponse à l'enseignant (facultatif)" hint="Mesures prises : cours de soutien, entretien avec les parents…">
            <Textarea value={reponse} onChange={(e) => setReponse(e.target.value)} rows={3} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setATraiter(null)}>Annuler</Button>
            <Button onClick={handleTraiter} loading={submitting}>Marquer comme traité</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
