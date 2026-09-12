'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BedDouble, ClipboardList, Save, Smile, UtensilsCrossed } from 'lucide-react';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { rapportJournalierService, RapportJournalier } from '@/services/rapportJournalier.service';
import { Classe, Eleve } from '@/types';
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

const REPAS_OPTIONS = ['Bien mangé', 'Peu mangé', "N'a rien mangé"];
const HUMEUR_OPTIONS = ['Joyeux', 'Calme', 'Agité', 'Fatigué', 'Malade'];

const FORM_EMPTY = {
  repas: '',
  siesteFaite: false,
  dureeSiesteMinutes: '',
  changesCouches: '',
  humeur: '',
  notes: '',
};

function todayIso() {
  return new Date().toISOString().substring(0, 10);
}

export default function RapportJournalierPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [rapports, setRapports] = useState<RapportJournalier[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const [editingEleve, setEditingEleve] = useState<Eleve | null>(null);
  const [form, setForm] = useState(FORM_EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    classeService
      .getClasses()
      .then(setClasses)
      .catch(() => toast.error('Impossible de charger les groupes.'))
      .finally(() => setLoadingClasses(false));
  }, []);

  const chargerRoster = async () => {
    if (!classeId) return;
    setLoadingRoster(true);
    try {
      const [elevesData, rapportsData] = await Promise.all([
        eleveService.getElevesParClasse(parseInt(classeId)),
        rapportJournalierService.listerParClasseEtDate(parseInt(classeId), date),
      ]);
      setEleves(elevesData);
      setRapports(rapportsData);
    } catch {
      toast.error('Impossible de charger la liste.');
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    chargerRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classeId, date]);

  const rapportParEleveId = useMemo(() => {
    const map = new Map<number, RapportJournalier>();
    rapports.forEach((r) => map.set(r.eleve.id, r));
    return map;
  }, [rapports]);

  const openForm = (eleve: Eleve) => {
    setEditingEleve(eleve);
    setError('');
    const existant = rapportParEleveId.get(eleve.id);
    setForm({
      repas: existant?.repas || '',
      siesteFaite: existant?.siesteFaite ?? false,
      dureeSiesteMinutes: existant?.dureeSiesteMinutes != null ? String(existant.dureeSiesteMinutes) : '',
      changesCouches: existant?.changesCouches != null ? String(existant.changesCouches) : '',
      humeur: existant?.humeur || '',
      notes: existant?.notes || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEleve) return;
    setSubmitting(true);
    setError('');
    try {
      await rapportJournalierService.enregistrer({
        eleveId: editingEleve.id,
        date,
        repas: form.repas || undefined,
        siesteFaite: form.siesteFaite,
        dureeSiesteMinutes: form.dureeSiesteMinutes ? parseInt(form.dureeSiesteMinutes) : undefined,
        changesCouches: form.changesCouches ? parseInt(form.changesCouches) : undefined,
        humeur: form.humeur || undefined,
        notes: form.notes || undefined,
      });
      toast.success(`Rapport enregistré pour ${editingEleve.profil?.prenom}.`);
      setEditingEleve(null);
      await chargerRoster();
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de l'enregistrement du rapport"));
    } finally {
      setSubmitting(false);
    }
  };

  const nbRemplis = eleves.filter((e) => rapportParEleveId.has(e.id)).length;

  return (
    <div>
      <PageHeader
        title="Rapport journalier"
        description={
          classeId
            ? `${nbRemplis}/${eleves.length} rapport(s) rempli(s) pour cette date`
            : 'Choisissez un groupe pour commencer.'
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Field label="Groupe" className="min-w-56">
          <Select value={classeId} onChange={(e) => setClasseId(e.target.value)} disabled={loadingClasses}>
            <option value="">— Sélectionner un groupe —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayIso()} />
        </Field>
      </div>

      {!classeId ? (
        <EmptyState icon={<ClipboardList />} title="Aucun groupe sélectionné" description="Choisissez un groupe ci-dessus pour voir ses enfants." />
      ) : loadingRoster ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : eleves.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="Aucun enfant dans ce groupe" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enfant</TableHead>
              <TableHead>Repas</TableHead>
              <TableHead>Sieste</TableHead>
              <TableHead>Couches</TableHead>
              <TableHead>Humeur</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eleves.map((eleve) => {
              const r = rapportParEleveId.get(eleve.id);
              return (
                <TableRow key={eleve.id}>
                  <TableCell className="font-medium">{eleve.profil?.prenom} {eleve.profil?.nom}</TableCell>
                  <TableCell className="text-muted-foreground">{r?.repas || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r?.siesteFaite ? `Oui${r.dureeSiesteMinutes ? ` (${r.dureeSiesteMinutes} min)` : ''}` : r ? 'Non' : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r?.changesCouches ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{r?.humeur || '—'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button size="sm" variant={r ? 'outline' : 'default'} onClick={() => openForm(eleve)}>
                        {r ? 'Modifier' : 'Remplir'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editingEleve} onOpenChange={(open) => !open && setEditingEleve(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Rapport du jour — {editingEleve?.profil?.prenom} {editingEleve?.profil?.nom}
            </DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          {editingEleve && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Repas">
                <Select value={form.repas} onChange={(e) => setForm({ ...form, repas: e.target.value })}>
                  <option value="">— Non renseigné —</option>
                  {REPAS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Sieste faite">
                  <Select
                    value={form.siesteFaite ? 'oui' : 'non'}
                    onChange={(e) => setForm({ ...form, siesteFaite: e.target.value === 'oui' })}
                  >
                    <option value="non">Non</option>
                    <option value="oui">Oui</option>
                  </Select>
                </Field>
                <Field label="Durée (minutes)">
                  <Input
                    type="number"
                    min={0}
                    disabled={!form.siesteFaite}
                    value={form.dureeSiesteMinutes}
                    onChange={(e) => setForm({ ...form, dureeSiesteMinutes: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Changes de couches">
                  <Input
                    type="number"
                    min={0}
                    value={form.changesCouches}
                    onChange={(e) => setForm({ ...form, changesCouches: e.target.value })}
                  />
                </Field>
                <Field label="Humeur">
                  <Select value={form.humeur} onChange={(e) => setForm({ ...form, humeur: e.target.value })}>
                    <option value="">— Non renseigné —</option>
                    {HUMEUR_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Notes (optionnel)" hint="Visible par les parents. Ex : petite fièvre, rendez-vous à prévoir…">
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Remarques pour les parents…"
                />
              </Field>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEleve(null)}>
                  Annuler
                </Button>
                <Button type="submit" loading={submitting}>
                  <Save /> Enregistrer
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
