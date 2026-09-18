'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { classeMatiereService, ClasseMatiereItem } from '@/services/classeMatiere.service';
import { incidentDisciplineService, IncidentDisciplineItem } from '@/services/incidentDiscipline.service';
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

const STATUT_LABELS: Record<string, string> = {
  RETARD: 'Retard',
  ABSENT: 'Absent',
  TENUE_NON_PORTEE: 'Tenue non portée',
  REFUS_EXERCICE: "Refus de l'exercice",
};

const STATUT_BADGE: Record<string, 'warning' | 'destructive' | 'secondary'> = {
  RETARD: 'warning',
  ABSENT: 'destructive',
  TENUE_NON_PORTEE: 'secondary',
  REFUS_EXERCICE: 'secondary',
};

type StatutIncident = 'RETARD' | 'ABSENT' | 'TENUE_NON_PORTEE' | 'REFUS_EXERCICE';

const FORM_EMPTY: { statut: StatutIncident; classeMatiereId: string; heure: string; commentaire: string } = {
  statut: 'RETARD',
  classeMatiereId: '',
  heure: '',
  commentaire: '',
};

function todayIso() {
  return new Date().toISOString().substring(0, 10);
}

function nowHM() {
  return new Date().toTimeString().substring(0, 5);
}

export default function DisciplinePage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classeMatieres, setClasseMatieres] = useState<ClasseMatiereItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentDisciplineItem[]>([]);
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
      .catch(() => toast.error('Impossible de charger les classes.'))
      .finally(() => setLoadingClasses(false));
  }, []);

  const chargerRoster = async () => {
    if (!classeId) return;
    setLoadingRoster(true);
    try {
      const [elevesData, incidentsData, classeMatieresData] = await Promise.all([
        eleveService.getElevesParClasse(parseInt(classeId)),
        incidentDisciplineService.getByClasseDate(parseInt(classeId), date),
        classeMatiereService.getByClasse(parseInt(classeId)),
      ]);
      setEleves(elevesData);
      setIncidents(incidentsData);
      setClasseMatieres(classeMatieresData);
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

  const incidentsParEleveId = useMemo(() => {
    const map = new Map<number, IncidentDisciplineItem[]>();
    incidents.forEach((i) => {
      const liste = map.get(i.eleve.id) || [];
      liste.push(i);
      map.set(i.eleve.id, liste);
    });
    return map;
  }, [incidents]);

  const openForm = (eleve: Eleve) => {
    setEditingEleve(eleve);
    setError('');
    setForm({ ...FORM_EMPTY, heure: nowHM() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEleve || !classeId) return;
    setSubmitting(true);
    setError('');
    try {
      await incidentDisciplineService.enregistrer({
        eleveId: editingEleve.id,
        classeId: parseInt(classeId),
        classeMatiereId: form.classeMatiereId ? parseInt(form.classeMatiereId) : undefined,
        date,
        heure: form.heure,
        statut: form.statut,
        commentaire: form.commentaire || undefined,
      });
      toast.success(`Incident signalé pour ${editingEleve.profil?.prenom} — parent(s) notifié(s).`);
      setEditingEleve(null);
      await chargerRoster();
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de l'enregistrement de l'incident"));
    } finally {
      setSubmitting(false);
    }
  };

  const nbIncidents = incidents.length;

  return (
    <div>
      <PageHeader
        title="Discipline"
        description={
          classeId
            ? `${nbIncidents} incident(s) signalé(s) pour cette date`
            : 'Choisissez une classe pour commencer.'
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Field label="Classe" className="min-w-56">
          <Select value={classeId} onChange={(e) => setClasseId(e.target.value)} disabled={loadingClasses}>
            <option value="">— Sélectionner une classe —</option>
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
        <EmptyState icon={<ShieldAlert />} title="Aucune classe sélectionnée" description="Choisissez une classe ci-dessus pour voir ses élèves." />
      ) : loadingRoster ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : eleves.length === 0 ? (
        <EmptyState icon={<ShieldAlert />} title="Aucun élève dans cette classe" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Élève</TableHead>
              <TableHead>Incidents du jour</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eleves.map((eleve) => {
              const liste = incidentsParEleveId.get(eleve.id) || [];
              return (
                <TableRow key={eleve.id}>
                  <TableCell className="font-medium">{eleve.profil?.prenom} {eleve.profil?.nom}</TableCell>
                  <TableCell>
                    {liste.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {liste.map((i) => (
                          <Badge key={i.id} variant={STATUT_BADGE[i.statut] || 'secondary'}>
                            {STATUT_LABELS[i.statut] || i.statut} {i.heure}
                            {i.estTraite ? ' · traité' : ''}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => openForm(eleve)}>
                        <AlertTriangle /> Signaler un incident
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
              Signaler un incident — {editingEleve?.profil?.prenom} {editingEleve?.profil?.nom}
            </DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          {editingEleve && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Statut *">
                <Select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as typeof form.statut })} required>
                  {Object.entries(STATUT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Matière (optionnel)" hint="Si l'incident a eu lieu pendant un cours précis.">
                  <Select value={form.classeMatiereId} onChange={(e) => setForm({ ...form, classeMatiereId: e.target.value })}>
                    <option value="">— Aucune (hors-cours) —</option>
                    {classeMatieres.map((cm) => (
                      <option key={cm.id} value={cm.id}>
                        {cm.matiere.nom} — {cm.enseignant.profil.prenom} {cm.enseignant.profil.nom}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Heure *">
                  <Input type="time" required value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })} />
                </Field>
              </div>

              <Field label="Commentaire (optionnel)" hint="Envoyé au(x) parent(s) avec la notification.">
                <Textarea
                  rows={3}
                  value={form.commentaire}
                  onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                  placeholder="Précisions sur l'incident…"
                />
              </Field>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEleve(null)}>
                  Annuler
                </Button>
                <Button type="submit" loading={submitting}>
                  <AlertTriangle /> Signaler
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
