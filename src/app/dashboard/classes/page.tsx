'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowUpCircle, BookOpen, Pencil, Plus, School, Trash2, Users } from 'lucide-react';
import { classeService } from '@/services/classe.service';
import { enseignantService } from '@/services/enseignant.service';
import { matiereService } from '@/services/matiere.service';
import { classeMatiereService, ClasseMatiereItem } from '@/services/classeMatiere.service';
import { eleveService, PromotionRapport } from '@/services/eleve.service';
import { Classe, Niveau, Enseignant, Matiere, Eleve } from '@/types';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormError } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type Tab = 'CLASSES' | 'ASSIGNATIONS';
const CLASSE_EMPTY = { nom: '', niveauId: '', enseignantPrincipalId: '', anneeScolaire: '2026/2027', capaciteMax: 30 };
const ASSIGN_EMPTY = { classeId: '', matiereId: '', enseignantId: '', coefficient: '1' };

export default function ClassesPage() {
  const [tab, setTab] = useState<Tab>('CLASSES');

  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);

  const [showClasseForm, setShowClasseForm] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);
  const [classeSubmitting, setClasseSubmitting] = useState(false);
  const [classeError, setClasseError] = useState('');
  const [classeForm, setClasseForm] = useState(CLASSE_EMPTY);

  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [assignations, setAssignations] = useState<ClasseMatiereItem[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignForm, setAssignForm] = useState(ASSIGN_EMPTY);

  const [promotingClasse, setPromotingClasse] = useState<Classe | null>(null);
  const [promotionEleves, setPromotionEleves] = useState<Eleve[]>([]);
  const [promotionSelected, setPromotionSelected] = useState<Set<number>>(new Set());
  const [promotionDestId, setPromotionDestId] = useState('');
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionSubmitting, setPromotionSubmitting] = useState(false);
  const [promotionRapport, setPromotionRapport] = useState<PromotionRapport | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [cls, niv, ens, mat] = await Promise.all([
          classeService.getClasses(),
          classeService.getNiveaux(),
          enseignantService.getEnseignants(),
          matiereService.getMatieres(),
        ]);
        setClasses(cls);
        setNiveaux(niv);
        setEnseignants(ens);
        setMatieres(mat);
      } catch {
        toast.error('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClasseId) {
      setAssignations([]);
      return;
    }
    setAssignLoading(true);
    classeMatiereService
      .getByClasse(parseInt(selectedClasseId))
      .then(setAssignations)
      .catch(() => toast.error('Impossible de charger les matières de la classe.'))
      .finally(() => setAssignLoading(false));
  }, [selectedClasseId]);

  const openCreateClasse = () => {
    setEditingClasse(null);
    setClasseForm(CLASSE_EMPTY);
    setClasseError('');
    setShowClasseForm(true);
  };

  const openEditClasse = (c: Classe) => {
    setEditingClasse(c);
    setClasseForm({
      nom: c.nom,
      niveauId: c.niveauId ? String(c.niveauId) : '',
      enseignantPrincipalId: c.enseignantPrincipalId ? String(c.enseignantPrincipalId) : '',
      anneeScolaire: c.anneeScolaire || '2026/2027',
      capaciteMax: c.capaciteMax || 30,
    });
    setClasseError('');
    setShowClasseForm(true);
  };

  const handleClasseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClasseSubmitting(true);
    setClasseError('');
    try {
      const payload = {
        nom: classeForm.nom,
        niveauId: parseInt(classeForm.niveauId),
        enseignantPrincipalId: classeForm.enseignantPrincipalId
          ? parseInt(classeForm.enseignantPrincipalId)
          : undefined,
        anneeScolaire: classeForm.anneeScolaire,
        capaciteMax: parseInt(String(classeForm.capaciteMax)),
      };
      if (editingClasse) {
        await classeService.updateClasse(editingClasse.id, payload);
        toast.success('Classe mise à jour.');
      } else {
        await classeService.createClasse(payload);
        toast.success('Classe créée.');
      }
      setClasseForm(CLASSE_EMPTY);
      setShowClasseForm(false);
      setEditingClasse(null);
      setClasses(await classeService.getClasses());
    } catch (err) {
      setClasseError(errorMessage(err, 'Erreur lors de la sauvegarde de la classe'));
    } finally {
      setClasseSubmitting(false);
    }
  };

  const handleDeleteClasse = async (c: Classe) => {
    if (!confirm(`Supprimer définitivement la classe « ${c.nom} » ?`)) return;
    try {
      await classeService.deleteClasse(c.id);
      toast.success('Classe supprimée.');
      setClasses(await classeService.getClasses());
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression de la classe'));
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSubmitting(true);
    setAssignError('');
    try {
      await classeMatiereService.create({
        classeId: parseInt(assignForm.classeId || selectedClasseId),
        matiereId: parseInt(assignForm.matiereId),
        enseignantId: parseInt(assignForm.enseignantId),
        coefficient: parseFloat(assignForm.coefficient),
      });
      toast.success('Matière assignée.');
      setAssignForm(ASSIGN_EMPTY);
      setShowAssignForm(false);
      if (selectedClasseId) {
        setAssignations(await classeMatiereService.getByClasse(parseInt(selectedClasseId)));
      }
    } catch (err) {
      setAssignError(errorMessage(err, "Erreur lors de l'assignation"));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDeleteAssign = async (id: number) => {
    if (!confirm('Retirer cette matière de la classe ?')) return;
    try {
      await classeMatiereService.delete(id);
      setAssignations((prev) => prev.filter((a) => a.id !== id));
      toast.success('Matière retirée.');
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression'));
    }
  };

  const openPromotion = async (c: Classe) => {
    setPromotingClasse(c);
    setPromotionDestId('');
    setPromotionRapport(null);
    setPromotionLoading(true);
    try {
      const roster = await eleveService.getElevesParClasse(c.id);
      setPromotionEleves(roster);
      // Sélectionnés par défaut — l'admin décoche les redoublants qui restent dans la classe.
      setPromotionSelected(new Set(roster.map((e) => e.id)));
    } catch {
      toast.error('Impossible de charger les élèves de cette classe.');
      setPromotionEleves([]);
    } finally {
      setPromotionLoading(false);
    }
  };

  const togglePromotionSelected = (id: number) => {
    setPromotionSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePromotionSubmit = async () => {
    if (!promotionDestId || promotionSelected.size === 0) return;
    setPromotionSubmitting(true);
    try {
      const rapport = await eleveService.promouvoir(parseInt(promotionDestId), [...promotionSelected]);
      setPromotionRapport(rapport);
      if (rapport.echecs === 0) {
        toast.success(`${rapport.succes} élève(s) passé(s) en classe supérieure.`);
      } else {
        toast.warning(`${rapport.succes} réussi(s), ${rapport.echecs} échec(s) — voir le détail.`);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors du passage en classe supérieure'));
    } finally {
      setPromotionSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={tab === 'CLASSES' ? 'Gestion des classes' : 'Matières par classe'}
        description={
          tab === 'CLASSES'
            ? 'Créez vos classes et désignez leurs professeurs principaux.'
            : 'Liez chaque matière et son enseignant à une classe, avec un coefficient.'
        }
      >
        {tab === 'CLASSES' ? (
          <Button onClick={openCreateClasse}>
            <Plus /> Nouvelle classe
          </Button>
        ) : (
          <Button onClick={() => setShowAssignForm(true)} disabled={!selectedClasseId && classes.length === 0}>
            <Plus /> Assigner une matière
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 flex gap-1 border-b border-border">
        {(['CLASSES', 'ASSIGNATIONS'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'CLASSES' ? <School className="size-4" /> : <BookOpen className="size-4" />}
            {t === 'CLASSES' ? 'Classes' : 'Matières par classe'}
          </button>
        ))}
      </div>

      {/* ─── Onglet Classes ─── */}
      {tab === 'CLASSES' &&
        (loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={<School />}
            title="Aucune classe"
            description="Créez vos classes (Terminale, 9ème A, CM2…) pour y inscrire des élèves."
            action={<Button onClick={openCreateClasse}><Plus /> Créer une classe</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Professeur principal</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-primary">{c.nom}</TableCell>
                  <TableCell>
                    <Badge variant="warning">{c.niveauNom || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.enseignantPrincipalNom ? (
                      `Pr. ${c.enseignantPrincipalNom}`
                    ) : (
                      <span className="italic">Multi-enseignants par matière</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.anneeScolaire}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{c.capaciteMax}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedClasseId(String(c.id));
                          setTab('ASSIGNATIONS');
                        }}
                      >
                        <BookOpen /> Matières
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openPromotion(c)}>
                        <ArrowUpCircle /> Passage
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEditClasse(c)}>
                        <Pencil /> Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteClasse(c)}
                      >
                        <Trash2 /> Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}

      {/* ─── Onglet Assignations ─── */}
      {tab === 'ASSIGNATIONS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <Field label="Classe à configurer" className="min-w-56 flex-1">
              <Select value={selectedClasseId} onChange={(e) => setSelectedClasseId(e.target.value)}>
                <option value="">— Sélectionner une classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.anneeScolaire})
                  </option>
                ))}
              </Select>
            </Field>
            {selectedClasseId && (
              <span className="rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                {assignations.length} matière(s)
              </span>
            )}
          </div>

          {!selectedClasseId ? (
            <EmptyState
              icon={<BookOpen />}
              title="Aucune classe sélectionnée"
              description="Choisissez une classe ci-dessus, ou cliquez sur « Matières » depuis la liste des classes."
            />
          ) : assignLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : assignations.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title="Aucune matière assignée"
              description="Assignez les matières de cette classe et leurs enseignants."
              action={<Button onClick={() => setShowAssignForm(true)}><Plus /> Assigner une matière</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf.</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Coef.</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">#{a.id}</span>
                    </TableCell>
                    <TableCell className="font-medium">{a.matiere?.nom}</TableCell>
                    <TableCell>
                      <Badge>{a.matiere?.code}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.enseignant ? `${a.enseignant.profil.nom} ${a.enseignant.profil.prenom}` : '—'}
                    </TableCell>
                    <TableCell className="font-semibold text-accent tabular-nums">{a.coefficient}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteAssign(a.id)}
                        >
                          <Trash2 /> Retirer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {assignations.length > 0 && (
            <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              La référence <code className="font-mono">#N</code> est le <code className="font-mono">classeMatiereId</code>{' '}
              à utiliser pour créer les créneaux d&apos;emploi du temps.
            </p>
          )}
        </div>
      )}

      {/* Formulaire Classe */}
      <Dialog open={showClasseForm} onOpenChange={setShowClasseForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingClasse ? 'Modifier la classe' : 'Nouvelle classe'}</DialogTitle>
          </DialogHeader>
          <FormError message={classeError} />
          <form onSubmit={handleClasseSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de la classe *">
              <Input value={classeForm.nom} onChange={(e) => setClasseForm({ ...classeForm, nom: e.target.value })} placeholder="Ex : 9ème A" required />
            </Field>
            <Field label="Niveau *">
              <Select value={classeForm.niveauId} onChange={(e) => setClasseForm({ ...classeForm, niveauId: e.target.value })} required>
                <option value="">Sélectionner un niveau</option>
                {niveaux.map((n) => (
                  <option key={n.id} value={n.id}>{n.nom}</option>
                ))}
              </Select>
            </Field>
            <Field label="Professeur principal (optionnel)" className="sm:col-span-2">
              <Select
                value={classeForm.enseignantPrincipalId}
                onChange={(e) => setClasseForm({ ...classeForm, enseignantPrincipalId: e.target.value })}
              >
                <option value="">Aucun — multi-enseignants par matière</option>
                {enseignants.map((en) => (
                  <option key={en.id} value={en.id}>{en.profil.nom} {en.profil.prenom}</option>
                ))}
              </Select>
            </Field>
            <Field label="Année scolaire">
              <Input value={classeForm.anneeScolaire} onChange={(e) => setClasseForm({ ...classeForm, anneeScolaire: e.target.value })} required />
            </Field>
            <Field label="Capacité maximale">
              <Input type="number" min={1} value={classeForm.capaciteMax} onChange={(e) => setClasseForm({ ...classeForm, capaciteMax: parseInt(e.target.value) || 0 })} required />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShowClasseForm(false)}>Annuler</Button>
              <Button type="submit" loading={classeSubmitting}>{editingClasse ? 'Enregistrer' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Formulaire Assignation */}
      <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assigner une matière</DialogTitle>
          </DialogHeader>
          <FormError message={assignError} />
          <form onSubmit={handleAssignSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Classe *">
              <Select value={assignForm.classeId || selectedClasseId} onChange={(e) => setAssignForm({ ...assignForm, classeId: e.target.value })} required>
                <option value="">— Choisir —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </Select>
            </Field>
            <Field label="Matière *">
              <Select value={assignForm.matiereId} onChange={(e) => setAssignForm({ ...assignForm, matiereId: e.target.value })} required>
                <option value="">— Choisir —</option>
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>
                ))}
              </Select>
            </Field>
            <Field label="Enseignant *">
              <Select value={assignForm.enseignantId} onChange={(e) => setAssignForm({ ...assignForm, enseignantId: e.target.value })} required>
                <option value="">— Choisir —</option>
                {enseignants.map((en) => (
                  <option key={en.id} value={en.id}>{en.profil.nom} {en.profil.prenom}</option>
                ))}
              </Select>
            </Field>
            <Field label="Coefficient">
              <Input type="number" step="0.5" min="0.5" value={assignForm.coefficient} onChange={(e) => setAssignForm({ ...assignForm, coefficient: e.target.value })} required />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShowAssignForm(false)}>Annuler</Button>
              <Button type="submit" loading={assignSubmitting}>Assigner</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Passage en classe supérieure */}
      <Dialog open={!!promotingClasse} onOpenChange={(open) => !open && setPromotingClasse(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Passage en classe supérieure — {promotingClasse?.nom}</DialogTitle>
          </DialogHeader>

          {promotionLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : promotionEleves.length === 0 ? (
            <EmptyState icon={<Users />} title="Aucun élève dans cette classe" />
          ) : (
            <div className="space-y-4">
              <Field label="Classe de destination *">
                <Select value={promotionDestId} onChange={(e) => setPromotionDestId(e.target.value)} disabled={!!promotionRapport}>
                  <option value="">— Sélectionner —</option>
                  {classes
                    .filter((c) => c.id !== promotingClasse?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.nom} ({c.anneeScolaire})</option>
                    ))}
                </Select>
              </Field>

              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Décochez les redoublants — ils resteront dans « {promotingClasse?.nom} ».
                </p>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                  {promotionEleves.map((e) => {
                    const resultat = promotionRapport?.resultats.find((r) => r.eleveId === e.id);
                    return (
                      <label
                        key={e.id}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={promotionSelected.has(e.id)}
                            disabled={!!promotionRapport}
                            onChange={() => togglePromotionSelected(e.id)}
                          />
                          {e.profil?.prenom} {e.profil?.nom}
                        </span>
                        {resultat && (
                          <Badge variant={resultat.succes ? 'success' : 'destructive'}>
                            {resultat.succes ? 'Passé(e)' : resultat.erreur || 'Échec'}
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {promotionRapport && (
                <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {promotionRapport.succes}/{promotionRapport.totalDemandes} élève(s) passé(s) avec succès.
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPromotingClasse(null)}>
                  {promotionRapport ? 'Fermer' : 'Annuler'}
                </Button>
                {!promotionRapport && (
                  <Button
                    onClick={handlePromotionSubmit}
                    loading={promotionSubmitting}
                    disabled={!promotionDestId || promotionSelected.size === 0}
                  >
                    <ArrowUpCircle /> Faire passer {promotionSelected.size} élève(s)
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
