'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Clock, Coffee, MapPin, Plus, User, X } from 'lucide-react';
import { emploiDuTempsService, EmploiDuTempsItem } from '@/services/emploiDuTemps.service';
import { classeService } from '@/services/classe.service';
import { classeMatiereService, ClasseMatiereItem } from '@/services/classeMatiere.service';
import { Classe } from '@/types';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormError } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const PRESETS = [
  { name: 'Récréation', debut: '10:00', fin: '10:15', type: 'RECREATION', salle: 'Cour de récréation' },
  { name: 'Pause déjeuner', debut: '12:00', fin: '13:00', type: 'DEJEUNER', salle: 'Réfectoire / cantine' },
  { name: 'Pause de 15h', debut: '15:00', fin: '15:15', type: 'RECREATION', salle: 'Cour de récréation' },
];
const FORM_EMPTY = {
  classeMatiereId: '',
  jourSemaine: '1',
  heureDebut: '08:00',
  heureFin: '10:00',
  salle: '',
  libellePause: 'Récréation',
};

export default function EmploiDuTempsPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [emplois, setEmplois] = useState<EmploiDuTempsItem[]>([]);
  const [classeMatieres, setClasseMatieres] = useState<ClasseMatiereItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [typeCreneau, setTypeCreneau] = useState<'COURS' | 'RECREATION' | 'DEJEUNER' | 'PAUSE'>('COURS');
  const [formData, setFormData] = useState(FORM_EMPTY);

  useEffect(() => {
    classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
  }, []);

  useEffect(() => {
    if (!selectedClasseId) {
      setEmplois([]);
      setClasseMatieres([]);
      return;
    }
    setLoading(true);
    Promise.all([
      emploiDuTempsService.getByClasse(parseInt(selectedClasseId)),
      classeMatiereService.getByClasse(parseInt(selectedClasseId)),
    ])
      .then(([e, cm]) => {
        setEmplois(e);
        setClasseMatieres(cm);
      })
      .catch(() => toast.error("Impossible de charger l'emploi du temps."))
      .finally(() => setLoading(false));
  }, [selectedClasseId]);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setTypeCreneau(p.type as 'RECREATION' | 'DEJEUNER');
    setFormData((prev) => ({ ...prev, libellePause: p.name, heureDebut: p.debut, heureFin: p.fin, salle: p.salle }));
  };

  const openForm = () => {
    setFormData(FORM_EMPTY);
    setTypeCreneau('COURS');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeCreneau === 'COURS' && !formData.classeMatiereId) {
      setError('Sélectionnez une matière pour ce cours.');
      return;
    }
    const cId = parseInt(selectedClasseId);
    if (!cId) {
      setError('Sélectionnez une classe valide.');
      return;
    }
    const formatTime = (t: string) => (!t ? '08:00:00' : t.length === 5 ? `${t}:00` : t);

    setSubmitting(true);
    setError('');
    try {
      await emploiDuTempsService.create({
        classeId: cId,
        classeMatiereId:
          typeCreneau === 'COURS' && formData.classeMatiereId ? parseInt(formData.classeMatiereId) : undefined,
        typeCreneau,
        libellePause: typeCreneau !== 'COURS' ? formData.libellePause || 'Récréation' : undefined,
        jourSemaine: parseInt(formData.jourSemaine),
        heureDebut: formatTime(formData.heureDebut),
        heureFin: formatTime(formData.heureFin),
        salle: formData.salle || (typeCreneau !== 'COURS' ? 'Cour / cantine' : 'Salle de classe'),
      });
      toast.success(typeCreneau === 'COURS' ? 'Cours planifié.' : `Pause « ${formData.libellePause} » ajoutée.`);
      setShowForm(false);
      setEmplois(await emploiDuTempsService.getByClasse(cId));
    } catch (err) {
      setError(errorMessage(err, 'Erreur lors de la création du créneau'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    try {
      await emploiDuTempsService.delete(id);
      setEmplois((prev) => prev.filter((e) => e.id !== id));
      toast.success('Créneau supprimé.');
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression'));
    }
  };

  const byJour: Record<number, EmploiDuTempsItem[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  emplois.forEach((e) => {
    (byJour[e.jourSemaine] ??= []).push(e);
  });
  Object.values(byJour).forEach((list) => list.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)));
  const todayDow = new Date().getDay();

  return (
    <div>
      <PageHeader
        title="Emploi du temps"
        description="Vue hebdomadaire des cours et des pauses, par classe."
      >
        <Button onClick={openForm} disabled={!selectedClasseId}>
          <Plus /> Nouveau créneau
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Field label="Classe" className="min-w-56 flex-1">
          <Select value={selectedClasseId} onChange={(e) => setSelectedClasseId(e.target.value)}>
            <option value="">— Choisir une classe —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom} ({c.anneeScolaire})</option>
            ))}
          </Select>
        </Field>
        {selectedClasseId && (
          <span className="rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            {emplois.length} créneau(x)
          </span>
        )}
      </div>

      {!selectedClasseId ? (
        <EmptyState icon={<CalendarDays />} title="Sélectionnez une classe" description="Pour afficher et gérer son emploi du temps." />
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : emplois.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="Aucun créneau pour cette classe"
          action={<Button onClick={openForm}><Plus /> Ajouter un créneau</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((jour) => (
            <div key={jour}>
              <div
                className={cn(
                  'mb-2 rounded-lg px-3 py-2 text-center text-sm font-semibold',
                  jour === todayDow ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
                )}
              >
                {JOURS[jour]}
              </div>
              <div className="flex flex-col gap-2">
                {byJour[jour].length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                    Libre
                  </div>
                ) : (
                  byJour[jour].map((slot) => {
                    const isPause =
                      slot.typeCreneau !== 'COURS' || !slot.classeMatiere;
                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          'relative rounded-lg border p-3',
                          isPause ? 'border-accent/40 bg-accent/8' : 'border-primary/30 bg-primary/8',
                        )}
                      >
                        <div className={cn('mb-1 flex items-center gap-1.5 text-sm font-semibold', isPause ? 'text-accent' : 'text-primary')}>
                          {isPause ? <Coffee className="size-3.5" /> : <CalendarDays className="size-3.5" />}
                          {isPause ? slot.libellePause || 'Pause' : slot.classeMatiere?.matiere?.nom || 'Matière'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {slot.heureDebut?.substring(0, 5)} – {slot.heureFin?.substring(0, 5)}
                        </div>
                        {slot.salle && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {slot.salle}
                          </div>
                        )}
                        {!isPause && slot.classeMatiere?.enseignant?.profil && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="size-3" />
                            {slot.classeMatiere.enseignant.profil.prenom} {slot.classeMatiere.enseignant.profil.nom}
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="absolute right-1.5 top-1.5 rounded p-1 text-muted-foreground opacity-60 hover:bg-secondary hover:text-destructive hover:opacity-100"
                          title="Supprimer"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire créneau */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un créneau</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={typeCreneau === 'COURS' ? 'default' : 'outline'}
              onClick={() => setTypeCreneau('COURS')}
            >
              Cours
            </Button>
            <Button
              type="button"
              size="sm"
              variant={typeCreneau !== 'COURS' ? 'accent' : 'outline'}
              onClick={() => setTypeCreneau('RECREATION')}
            >
              <Coffee /> Pause / repas
            </Button>
          </div>

          {typeCreneau !== 'COURS' && (
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-md border border-accent/30 bg-accent/8 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/15"
                >
                  {p.name} ({p.debut}–{p.fin})
                </button>
              ))}
            </div>
          )}

          <FormError message={error} />

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {typeCreneau === 'COURS' ? (
              <Field label="Matière & enseignant *" className="sm:col-span-2">
                <Select value={formData.classeMatiereId} onChange={(e) => setFormData({ ...formData, classeMatiereId: e.target.value })} required>
                  <option value="">— Sélectionner —</option>
                  {classeMatieres.map((cm) => (
                    <option key={cm.id} value={cm.id}>
                      {cm.matiere?.nom} (
                      {cm.enseignant?.profil ? `${cm.enseignant.profil.prenom} ${cm.enseignant.profil.nom}` : 'sans enseignant'}
                      )
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="Nom de la pause *" className="sm:col-span-2">
                <Input value={formData.libellePause} onChange={(e) => setFormData({ ...formData, libellePause: e.target.value })} placeholder="Récréation, pause déjeuner, pause prière…" required />
              </Field>
            )}
            <Field label="Jour">
              <Select value={formData.jourSemaine} onChange={(e) => setFormData({ ...formData, jourSemaine: e.target.value })}>
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <option key={j} value={j}>{JOURS[j]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Salle / lieu">
              <Input value={formData.salle} onChange={(e) => setFormData({ ...formData, salle: e.target.value })} placeholder={typeCreneau === 'COURS' ? 'Salle 101' : 'Cour de récréation'} />
            </Field>
            <Field label="Heure de début *">
              <Input type="time" value={formData.heureDebut} onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })} required />
            </Field>
            <Field label="Heure de fin *">
              <Input type="time" value={formData.heureFin} onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })} required />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={submitting}>{typeCreneau === 'COURS' ? 'Planifier le cours' : 'Enregistrer la pause'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
