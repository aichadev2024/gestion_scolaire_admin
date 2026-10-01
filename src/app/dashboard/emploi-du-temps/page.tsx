'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Coffee, Plus, X } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { emploiDuTempsService, EmploiDuTempsItem } from '@/services/emploiDuTemps.service';
import { classeService } from '@/services/classe.service';
import { classeMatiereService, ClasseMatiereItem } from '@/services/classeMatiere.service';
import { salleService } from '@/services/salle.service';
import { disponibiliteService, DisponibiliteItem } from '@/services/disponibilite.service';
import { Classe, Salle } from '@/types';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { subjectStyle } from '@/lib/subjectColors';
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
  // L'enseignant consulte son emploi du temps mais ne le construit pas — c'est le
  // rôle du responsable pédagogique (directeur/secrétaire), qui seul a les droits
  // backend de création/modification/suppression sur ces créneaux.
  const isEnseignant = authService.getCurrentUser()?.role === 'ENSEIGNANT';
  const [classes, setClasses] = useState<Classe[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [salleEnSaisieLibre, setSalleEnSaisieLibre] = useState(false);
  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [emplois, setEmplois] = useState<EmploiDuTempsItem[]>([]);
  const [classeMatieres, setClasseMatieres] = useState<ClasseMatiereItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [typeCreneau, setTypeCreneau] = useState<'COURS' | 'RECREATION' | 'DEJEUNER' | 'PAUSE'>('COURS');
  const [formData, setFormData] = useState(FORM_EMPTY);
  const [dispoEnseignant, setDispoEnseignant] = useState<DisponibiliteItem[]>([]);

  useEffect(() => {
    classeService.getClasses().then(setClasses).catch(() => toast.error('Impossible de charger les classes.'));
    // Catalogue facultatif : si l'établissement n'a créé aucune salle, le champ reste en texte libre.
    salleService.getSalles().then(setSalles).catch(() => {});
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

  // Aide à la planification : affiche les disponibilités que l'enseignant sélectionné a
  // lui-même déclarées, pour éviter de lui programmer un cours sur un créneau indisponible.
  useEffect(() => {
    if (typeCreneau !== 'COURS' || !formData.classeMatiereId) {
      setDispoEnseignant([]);
      return;
    }
    const cm = classeMatieres.find((c) => c.id === parseInt(formData.classeMatiereId));
    const enseignantId = cm?.enseignant?.id;
    if (!enseignantId) {
      setDispoEnseignant([]);
      return;
    }
    disponibiliteService.listerParEnseignant(enseignantId).then(setDispoEnseignant).catch(() => setDispoEnseignant([]));
  }, [formData.classeMatiereId, typeCreneau, classeMatieres]);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setTypeCreneau(p.type as 'RECREATION' | 'DEJEUNER');
    // Les lieux de pause (cour, cantine…) ne font en général pas partie du catalogue de
    // salles de classe : bascule en saisie libre pour ne pas forcer un choix dans la liste.
    setSalleEnSaisieLibre(true);
    setFormData((prev) => ({ ...prev, libellePause: p.name, heureDebut: p.debut, heureFin: p.fin, salle: p.salle }));
  };

  const openForm = () => {
    setFormData(FORM_EMPTY);
    setTypeCreneau('COURS');
    setSalleEnSaisieLibre(false);
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

  const matieresDeLaClasse = Array.from(
    new Map(classeMatieres.map((cm) => [cm.matiere.id, cm.matiere])).values(),
  );

  const byJour: Record<number, EmploiDuTempsItem[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  emplois.forEach((e) => {
    (byJour[e.jourSemaine] ??= []).push(e);
  });
  Object.values(byJour).forEach((list) => list.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)));
  const todayDow = new Date().getDay();

  // Grille horaire façon emploi du temps classique : un créneau de cours est un bloc
  // coloré dont la hauteur reflète sa durée, aligné sur un axe des heures — pas une liste
  // de cartes de hauteur uniforme. Granularité de 30 min (1 ligne de grille = 30 min).
  const toMinutes = (t?: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const SLOT_MIN = 30;
  const tempsConnus = emplois.flatMap((e) => [toMinutes(e.heureDebut), toMinutes(e.heureFin)]);
  const gridStartMin = tempsConnus.length ? Math.floor(Math.min(...tempsConnus) / 60) * 60 : 8 * 60;
  const gridEndMin = tempsConnus.length ? Math.ceil(Math.max(...tempsConnus) / 60) * 60 : 17 * 60;
  const totalRows = Math.max(1, Math.round((gridEndMin - gridStartMin) / SLOT_MIN));
  const heureMarks: number[] = [];
  for (let t = gridStartMin; t <= gridEndMin; t += 60) heureMarks.push(t);
  // Ligne de grille (1-indexée) correspondant à un instant t — la ligne 1 est l'en-tête des jours.
  const rowForTime = (t: number) => Math.round((t - gridStartMin) / SLOT_MIN) + 2;

  return (
    <div>
      <PageHeader
        title="Emploi du temps"
        description={
          isEnseignant
            ? 'Vue hebdomadaire de vos cours et pauses, par classe.'
            : 'Vue hebdomadaire des cours et des pauses, par classe.'
        }
      >
        {!isEnseignant && (
          <Button onClick={openForm} disabled={!selectedClasseId}>
            <Plus /> Nouveau créneau
          </Button>
        )}
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

      {selectedClasseId && matieresDeLaClasse.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
          {matieresDeLaClasse.map((m) => {
            const style = subjectStyle(m.id, m.nom);
            return (
              <span key={m.id} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={cn('size-2.5 rounded-full', style.dot)} />
                {m.nom}
              </span>
            );
          })}
        </div>
      )}

      {!selectedClasseId ? (
        <EmptyState icon={<CalendarDays />} title="Sélectionnez une classe" description="Pour afficher et gérer son emploi du temps." />
      ) : loading ? (
        <Skeleton className="h-96 w-full" />
      ) : emplois.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="Aucun créneau pour cette classe"
          action={isEnseignant ? undefined : <Button onClick={openForm}><Plus /> Ajouter un créneau</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div
            className="grid"
            style={{
              gridTemplateColumns: '56px repeat(6, minmax(108px, 1fr))',
              gridTemplateRows: `40px repeat(${totalRows}, 22px)`,
              minWidth: '720px',
            }}
          >
            {/* En-tête des jours */}
            {[1, 2, 3, 4, 5, 6].map((jour) => (
              <div
                key={`h-${jour}`}
                className={cn(
                  'flex items-center justify-center border-b border-l border-border text-sm font-semibold',
                  jour === todayDow ? 'bg-primary text-primary-foreground' : 'bg-secondary/70 text-muted-foreground',
                )}
                style={{ gridColumn: jour + 1, gridRow: 1 }}
              >
                {JOURS[jour]}
              </div>
            ))}

            {/* Axe des heures */}
            {heureMarks.map((t) => (
              <div
                key={`t-${t}`}
                className="border-t border-border px-1.5 pt-0.5 text-right text-[10px] font-medium text-muted-foreground"
                style={{ gridColumn: 1, gridRow: rowForTime(t) }}
              >
                {Math.floor(t / 60)}h{t % 60 ? String(t % 60).padStart(2, '0') : ''}
              </div>
            ))}

            {/* Pistes des colonnes de jour (fond + bordure, pleine hauteur) */}
            {[1, 2, 3, 4, 5, 6].map((jour) => (
              <div
                key={`col-${jour}`}
                className="border-l border-border"
                style={{ gridColumn: jour + 1, gridRow: `2 / span ${totalRows}` }}
              >
                {byJour[jour].length === 0 && (
                  <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground/70">Libre</div>
                )}
              </div>
            ))}

            {/* Créneaux : blocs colorés dimensionnés selon leur durée */}
            {emplois.map((slot) => {
              const isPause = slot.typeCreneau !== 'COURS' || !slot.classeMatiere;
              const style = !isPause
                ? subjectStyle(slot.classeMatiere?.matiere?.id, slot.classeMatiere?.matiere?.nom)
                : null;
              const label = isPause ? slot.libellePause || 'Pause' : slot.classeMatiere?.matiere?.nom || 'Matière';
              const debut = slot.heureDebut?.substring(0, 5);
              const fin = slot.heureFin?.substring(0, 5);
              const titre = `${label} — ${debut}–${fin}${slot.salle ? ' — ' + slot.salle : ''}`;

              return (
                <div
                  key={slot.id}
                  title={titre}
                  className={cn(
                    'group relative m-px flex items-center justify-center overflow-hidden rounded-md border px-1 text-center text-[11px] font-bold leading-tight',
                    isPause ? 'border-accent/40 bg-accent/10 text-accent' : cn(style!.tint, style!.fg),
                  )}
                  style={{ gridColumn: slot.jourSemaine + 1, gridRow: `${rowForTime(toMinutes(slot.heureDebut))} / ${rowForTime(toMinutes(slot.heureFin))}` }}
                >
                  <span className="line-clamp-2">{label}</span>
                  {!isEnseignant && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }}
                      className="absolute right-0.5 top-0.5 rounded bg-card/80 p-0.5 opacity-0 hover:text-destructive group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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
            ) : null}
            {typeCreneau === 'COURS' && dispoEnseignant.length > 0 && (
              <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                <p className="mb-1.5 font-semibold text-muted-foreground">Disponibilités déclarées par cet enseignant :</p>
                <div className="flex flex-wrap gap-1.5">
                  {dispoEnseignant.map((d) => {
                    const chevauche =
                      d.type === 'INDISPONIBLE' &&
                      d.jourSemaine === parseInt(formData.jourSemaine) &&
                      formData.heureDebut < d.heureFin.substring(0, 5) &&
                      d.heureDebut.substring(0, 5) < formData.heureFin;
                    return (
                      <span
                        key={d.id}
                        className={cn(
                          'rounded-md border px-2 py-1 font-medium',
                          d.type === 'DISPONIBLE'
                            ? 'border-success/30 bg-success/10 text-success'
                            : chevauche
                              ? 'border-destructive bg-destructive/15 text-destructive'
                              : 'border-destructive/30 bg-destructive/8 text-destructive',
                        )}
                        title={d.commentaire || undefined}
                      >
                        {JOURS[d.jourSemaine]} {d.heureDebut.substring(0, 5)}–{d.heureFin.substring(0, 5)}
                        {chevauche ? ' ⚠' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {typeCreneau !== 'COURS' && (
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
              {salles.length === 0 || salleEnSaisieLibre ? (
                <div className="space-y-1.5">
                  <Input
                    value={formData.salle}
                    onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                    placeholder={typeCreneau === 'COURS' ? 'Salle 101' : 'Cour de récréation'}
                    autoFocus={salleEnSaisieLibre}
                  />
                  {salles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setSalleEnSaisieLibre(false); setFormData({ ...formData, salle: '' }); }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      ← Choisir une salle du catalogue
                    </button>
                  )}
                </div>
              ) : (
                <Select
                  value={formData.salle}
                  onChange={(e) => {
                    if (e.target.value === '__LIBRE__') {
                      setSalleEnSaisieLibre(true);
                      setFormData({ ...formData, salle: '' });
                    } else {
                      setFormData({ ...formData, salle: e.target.value });
                    }
                  }}
                >
                  <option value="">— Sélectionner une salle —</option>
                  {salles.map((s) => (
                    <option key={s.id} value={s.nom}>{s.nom}{s.capacite ? ` (${s.capacite} places)` : ''}</option>
                  ))}
                  <option value="__LIBRE__">Autre (saisie libre)…</option>
                </Select>
              )}
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
