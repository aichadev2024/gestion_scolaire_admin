'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpenCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { classeService } from '@/services/classe.service';
import {
  cahierTexteService,
  EffectiviteCours,
  MonCours,
  SeanceCours,
} from '@/services/cahierTexte.service';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86_400_000));
const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

const FORM_EMPTY = {
  date: iso(new Date()),
  heureDebut: '',
  heureFin: '',
  effectue: true,
  titre: '',
  contenu: '',
  devoirs: '',
  motifNonEffectue: '',
};

export default function CahierTextePage() {
  const [role, setRole] = useState('');
  const [onglet, setOnglet] = useState<'seances' | 'effectivite'>('seances');

  const [classes, setClasses] = useState<Classe[]>([]);
  const [mesCours, setMesCours] = useState<MonCours[]>([]);
  const [classeId, setClasseId] = useState('');
  const [classeMatiereId, setClasseMatiereId] = useState('');
  const [debut, setDebut] = useState(daysAgo(30));
  const [fin, setFin] = useState(iso(new Date()));

  const [seances, setSeances] = useState<SeanceCours[]>([]);
  const [loading, setLoading] = useState(false);
  const [effectivite, setEffectivite] = useState<EffectiviteCours[]>([]);
  const [loadingEff, setLoadingEff] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SeanceCours | null>(null);
  const [form, setForm] = useState(FORM_EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const estEnseignant = role === 'ENSEIGNANT';
  const peutVoirEffectivite = role === 'DIRECTEUR' || role === 'SECRETAIRE';

  useEffect(() => {
    const r = authService.getCurrentUser()?.role || '';
    setRole(r);
    if (r === 'ENSEIGNANT') {
      cahierTexteService.mesCours().then(setMesCours).catch(() => toast.error('Impossible de charger vos cours.'));
    } else {
      classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
    }
  }, []);

  const chargerSeances = useCallback(async () => {
    if (!classeId) {
      setSeances([]);
      return;
    }
    setLoading(true);
    try {
      setSeances(await cahierTexteService.lister(parseInt(classeId), debut, fin));
    } catch (err) {
      toast.error(errorMessage(err, 'Impossible de charger le cahier de texte.'));
    } finally {
      setLoading(false);
    }
  }, [classeId, debut, fin]);

  useEffect(() => {
    chargerSeances();
  }, [chargerSeances]);

  const chargerEffectivite = useCallback(async () => {
    setLoadingEff(true);
    try {
      setEffectivite(await cahierTexteService.effectivite(debut, fin));
    } catch (err) {
      toast.error(errorMessage(err, "Impossible de calculer l'effectivité."));
    } finally {
      setLoadingEff(false);
    }
  }, [debut, fin]);

  useEffect(() => {
    if (onglet === 'effectivite' && peutVoirEffectivite) chargerEffectivite();
  }, [onglet, peutVoirEffectivite, chargerEffectivite]);

  const seancesAffichees = useMemo(
    () => (estEnseignant && classeMatiereId ? seances.filter((s) => String(s.classeMatiereId) === classeMatiereId) : seances),
    [seances, estEnseignant, classeMatiereId],
  );

  const choisirCours = (id: string) => {
    setClasseMatiereId(id);
    const cours = mesCours.find((c) => String(c.classeMatiereId) === id);
    setClasseId(cours ? String(cours.classeId) : '');
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...FORM_EMPTY, date: iso(new Date()) });
    setError('');
    setShowForm(true);
  };

  const openEdit = (s: SeanceCours) => {
    setEditing(s);
    setForm({
      date: s.date,
      heureDebut: hhmm(s.heureDebut),
      heureFin: hhmm(s.heureFin),
      effectue: s.effectue,
      titre: s.titre || '',
      contenu: s.contenu || '',
      devoirs: s.devoirs || '',
      motifNonEffectue: s.motifNonEffectue || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmId = editing ? editing.classeMatiereId : parseInt(classeMatiereId);
    if (!cmId) {
      setError('Choisissez un cours.');
      return;
    }
    setSubmitting(true);
    setError('');
    const payload = {
      classeMatiereId: cmId,
      date: form.date,
      heureDebut: form.heureDebut || undefined,
      heureFin: form.heureFin || undefined,
      effectue: form.effectue,
      titre: form.titre.trim() || undefined,
      contenu: form.contenu.trim() || undefined,
      devoirs: form.devoirs.trim() || undefined,
      motifNonEffectue: form.effectue ? undefined : form.motifNonEffectue.trim() || undefined,
    };
    try {
      if (editing) {
        await cahierTexteService.modifier(editing.id, payload);
        toast.success('Séance modifiée.');
      } else {
        await cahierTexteService.creer(payload);
        toast.success('Séance enregistrée.');
      }
      setShowForm(false);
      await chargerSeances();
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de l'enregistrement de la séance"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s: SeanceCours) => {
    if (!window.confirm('Supprimer cette séance du cahier de texte ?')) return;
    try {
      await cahierTexteService.supprimer(s.id);
      toast.success('Séance supprimée.');
      await chargerSeances();
    } catch (err) {
      toast.error(errorMessage(err, 'Suppression impossible.'));
    }
  };

  const varianteTaux = (t: number) => (t >= 85 ? 'success' : t >= 60 ? 'warning' : 'destructive');

  return (
    <div>
      <PageHeader
        title="Cahier de texte"
        description="Ce qui a été enseigné, les devoirs donnés et l'effectivité des cours par rapport à l'emploi du temps."
      >
        {estEnseignant && onglet === 'seances' && (
          <Button onClick={openNew} disabled={!classeMatiereId}>
            <Plus /> Nouvelle séance
          </Button>
        )}
      </PageHeader>

      {peutVoirEffectivite && (
        <div className="mb-4 flex gap-2">
          <Button variant={onglet === 'seances' ? 'default' : 'outline'} size="sm" onClick={() => setOnglet('seances')}>
            Séances
          </Button>
          <Button variant={onglet === 'effectivite' ? 'default' : 'outline'} size="sm" onClick={() => setOnglet('effectivite')}>
            Effectivité des cours
          </Button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        {onglet === 'seances' &&
          (estEnseignant ? (
            <Field label="Mon cours" className="min-w-64">
              <Select value={classeMatiereId} onChange={(e) => choisirCours(e.target.value)}>
                <option value="">— Choisir une classe et une matière —</option>
                {mesCours.map((c) => (
                  <option key={c.classeMatiereId} value={c.classeMatiereId}>
                    {c.classeNom} — {c.matiereNom}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Classe" className="min-w-56">
              <Select value={classeId} onChange={(e) => setClasseId(e.target.value)}>
                <option value="">— Choisir une classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.niveauNom} — {c.nom}</option>
                ))}
              </Select>
            </Field>
          ))}
        <Field label="Du">
          <Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
        </Field>
        <Field label="Au">
          <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
        </Field>
      </div>

      {onglet === 'effectivite' && peutVoirEffectivite ? (
        loadingEff ? (
          <Skeleton className="h-40 w-full" />
        ) : effectivite.length === 0 ? (
          <EmptyState
            icon={<BookOpenCheck />}
            title="Aucune donnée sur cette période"
            description="L'effectivité se calcule à partir de l'emploi du temps et des séances saisies dans le cahier de texte."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead>Matière</TableHead>
                <TableHead>Enseignant</TableHead>
                <TableHead className="text-right">Prévues</TableHead>
                <TableHead className="text-right">Effectuées</TableHead>
                <TableHead className="text-right">Non effectuées</TableHead>
                <TableHead className="text-right">Non renseignées</TableHead>
                <TableHead>Effectivité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {effectivite.map((e) => (
                <TableRow key={e.classeMatiereId}>
                  <TableCell className="font-medium">{e.classeNom}</TableCell>
                  <TableCell>{e.matiereNom}</TableCell>
                  <TableCell>{e.enseignantNom || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.prevues}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.effectuees}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.nonEffectuees}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.nonRenseignees}</TableCell>
                  <TableCell>
                    <Badge variant={varianteTaux(e.tauxEffectivite)}>{e.tauxEffectivite.toFixed(1)} %</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : !classeId ? (
        <EmptyState
          icon={<BookOpenCheck />}
          title={estEnseignant ? 'Choisissez votre cours' : 'Choisissez une classe'}
          description="Le cahier de texte de la période choisie s'affichera ici."
        />
      ) : loading ? (
        <Skeleton className="h-40 w-full" />
      ) : seancesAffichees.length === 0 ? (
        <EmptyState
          icon={<BookOpenCheck />}
          title="Aucune séance sur cette période"
          description={estEnseignant ? 'Cliquez sur « Nouvelle séance » pour renseigner un cours.' : "Aucun enseignant n'a encore renseigné de séance."}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Séance</TableHead>
              <TableHead>Devoirs</TableHead>
              <TableHead>État</TableHead>
              {(estEnseignant || role === 'DIRECTEUR') && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {seancesAffichees.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(s.date).toLocaleDateString('fr-FR')}
                  {s.heureDebut && <div className="text-xs text-muted-foreground">{hhmm(s.heureDebut)}{s.heureFin ? `–${hhmm(s.heureFin)}` : ''}</div>}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{s.matiereNom}</div>
                  {s.enseignantNom && <div className="text-xs text-muted-foreground">{s.enseignantNom}</div>}
                </TableCell>
                <TableCell className="max-w-md">
                  {s.titre && <div className="font-medium">{s.titre}</div>}
                  {s.contenu && <div className="whitespace-pre-line text-sm text-muted-foreground">{s.contenu}</div>}
                  {!s.effectue && s.motifNonEffectue && <div className="text-sm text-destructive">Motif : {s.motifNonEffectue}</div>}
                </TableCell>
                <TableCell className="max-w-xs whitespace-pre-line text-sm">{s.devoirs || '—'}</TableCell>
                <TableCell>
                  <Badge variant={s.effectue ? 'success' : 'destructive'}>{s.effectue ? 'Effectuée' : 'Non effectuée'}</Badge>
                </TableCell>
                {(estEnseignant || role === 'DIRECTEUR') && (
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)} aria-label="Modifier la séance">
                        <Pencil />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(s)} aria-label="Supprimer la séance">
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la séance' : 'Nouvelle séance'}</DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Date *">
                <Input type="date" value={form.date} max={iso(new Date())} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </Field>
              <Field label="Début">
                <Input type="time" value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} />
              </Field>
              <Field label="Fin">
                <Input type="time" value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} />
              </Field>
            </div>
            <Field label="La séance a-t-elle eu lieu ?">
              <Select value={form.effectue ? 'oui' : 'non'} onChange={(e) => setForm({ ...form, effectue: e.target.value === 'oui' })}>
                <option value="oui">Oui, effectuée</option>
                <option value="non">Non, non effectuée</option>
              </Select>
            </Field>
            {form.effectue ? (
              <>
                <Field label="Titre de la leçon">
                  <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex : Les fractions" />
                </Field>
                <Field label="Contenu enseigné" hint="Ce qui a été vu pendant la séance.">
                  <Textarea value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} rows={3} />
                </Field>
                <Field label="Devoirs donnés">
                  <Textarea value={form.devoirs} onChange={(e) => setForm({ ...form, devoirs: e.target.value })} rows={2} />
                </Field>
              </>
            ) : (
              <Field label="Motif">
                <Input value={form.motifNonEffectue} onChange={(e) => setForm({ ...form, motifNonEffectue: e.target.value })} placeholder="Ex : Absence de l'enseignant, jour férié…" />
              </Field>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={submitting}>{editing ? 'Enregistrer' : 'Ajouter'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
