'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, GraduationCap, FileText, Upload, Download } from 'lucide-react';
import { eleveService, EleveImportRapport } from '@/services/eleve.service';
import DocumentsEleveDialog from '@/components/DocumentsEleveDialog';
import { classeService } from '@/services/classe.service';
import { profilService } from '@/services/profil.service';
import { utilisateurService, UtilisateurResponse } from '@/services/utilisateur.service';
import { Eleve, Classe } from '@/types';
import CredentialsBanner from '@/components/CredentialsBanner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const EMPTY = {
  prenom: '', nom: '', telephone: '', email: '', genre: 'M',
  dateNaissance: '', adresse: '', classeId: '', parentId: '', photoUrl: '',
};

const STATUT_INSCRIPTION_LABEL: Record<string, string> = {
  VALIDEE: 'Validée',
  EN_ATTENTE: 'En attente',
  ANNULEE: 'Annulée',
};
const STATUT_INSCRIPTION_COLOR: Record<string, string> = {
  VALIDEE: 'text-success',
  EN_ATTENTE: 'text-warning-foreground',
  ANNULEE: 'text-destructive',
};

function msg(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { data?: { message?: string } } }).response;
    if (r?.data?.message) return r.data.message;
  }
  return fallback;
}

export default function ElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [parents, setParents] = useState<UtilisateurResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingEleve, setEditingEleve] = useState<Eleve | null>(null);
  const [nouveauCompte, setNouveauCompte] = useState<{ nom: string; motDePasse: string } | null>(null);
  const [formData, setFormData] = useState(EMPTY);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docsEleve, setDocsEleve] = useState<Eleve | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importClasseId, setImportClasseId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importRapport, setImportRapport] = useState<EleveImportRapport | null>(null);
  const [filterNiveauId, setFilterNiveauId] = useState('');
  const [filterClasseId, setFilterClasseId] = useState('');

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : formData.photoUrl),
    [photoFile, formData.photoUrl],
  );
  useEffect(() => {
    return () => {
      if (photoFile) URL.revokeObjectURL(photoPreview);
    };
  }, [photoFile, photoPreview]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 6 Mo.');
      return;
    }
    setError('');
    setPhotoFile(file);
  };

  const openNewForm = () => {
    setEditingEleve(null);
    setError('');
    setFormData(EMPTY);
    setPhotoFile(null);
    setShowForm(true);
  };

  const openEditForm = (eleve: Eleve) => {
    setEditingEleve(eleve);
    setError('');
    setFormData({
      prenom: eleve.profil?.prenom || '',
      nom: eleve.profil?.nom || '',
      telephone: eleve.profil?.telephone || '',
      email: eleve.profil?.email || '',
      genre: (eleve.profil?.genre as 'M' | 'F') || 'M',
      dateNaissance: eleve.profil?.dateNaissance || '',
      adresse: eleve.profil?.adresse || '',
      classeId: eleve.classeId ? String(eleve.classeId) : '',
      parentId: eleve.parentId ? String(eleve.parentId) : '',
      photoUrl: eleve.profil?.photoUrl || '',
    });
    setPhotoFile(null);
    setShowForm(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [elevesData, classesData, usersData] = await Promise.all([
        eleveService.getEleves(),
        classeService.getClasses(),
        utilisateurService.getAll(),
      ]);
      setEleves(elevesData);
      setClasses(classesData);
      setParents(usersData.filter((u) => u.role === 'PARENT'));
    } catch {
      toast.error('Impossible de charger la liste des élèves.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        profil: {
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          email: formData.email,
          genre: formData.genre as 'M' | 'F',
          dateNaissance: formData.dateNaissance,
          adresse: formData.adresse,
          photoUrl: formData.photoUrl,
        },
        classeId: formData.classeId ? parseInt(formData.classeId) : undefined,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
      };

      let profilId: number | undefined;
      if (editingEleve) {
        const maj = await eleveService.updateEleve(editingEleve.id, payload);
        profilId = maj?.profil?.id ?? editingEleve.profil?.id;
        toast.success('Élève mis à jour.');
      } else {
        const cree = await eleveService.createEleve(payload);
        profilId = cree?.profil?.id;
        toast.success('Élève inscrit.');
        if (cree?.motDePasseInitial) {
          setNouveauCompte({
            nom: `${cree.profil?.prenom ?? ''} ${cree.profil?.nom ?? ''}`.trim() || 'Nouvel élève',
            motDePasse: cree.motDePasseInitial,
          });
        }
      }

      if (photoFile && profilId) {
        try {
          await profilService.uploadPhoto(profilId, photoFile);
        } catch (e) {
          toast.warning(msg(e, 'Photo non enregistrée (stockage d\'images indisponible ?).'));
        }
      }

      setFormData(EMPTY);
      setPhotoFile(null);
      setEditingEleve(null);
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(msg(err, "Erreur lors de la sauvegarde de l'élève"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eleve: Eleve) => {
    if (!confirm(`Supprimer définitivement l'élève ${eleve.profil.prenom} ${eleve.profil.nom} ?`)) return;
    try {
      await eleveService.deleteEleve(eleve.id);
      toast.success('Élève supprimé.');
      fetchData();
    } catch (err) {
      toast.error(msg(err, "Erreur lors de la suppression de l'élève"));
    }
  };

  const openImportDialog = () => {
    setImportClasseId('');
    setImportFile(null);
    setImportRapport(null);
    setShowImport(true);
  };

  const handleTelechargerModele = async () => {
    try {
      const blob = await eleveService.telechargerModeleImport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modele_import_eleves.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Impossible de télécharger le modèle.');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImportSubmitting(true);
    try {
      const rapport = await eleveService.importerExcel(
        importFile,
        importClasseId ? parseInt(importClasseId) : undefined,
      );
      setImportRapport(rapport);
      if (rapport.succes > 0) {
        toast.success(`${rapport.succes} élève(s) importé(s).`);
        fetchData();
      }
      if (rapport.echecs > 0) {
        toast.warning(`${rapport.echecs} ligne(s) en erreur — voir le détail ci-dessous.`);
      }
    } catch (err) {
      toast.error(msg(err, "Erreur lors de l'import du fichier."));
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleStatutInscriptionChange = async (eleve: Eleve, statutInscription: string) => {
    const precedent = eleve.statutInscription;
    setEleves((prev) => prev.map((e) => (e.id === eleve.id ? { ...e, statutInscription } : e)));
    try {
      await eleveService.modifierStatutInscription(eleve.id, statutInscription);
      toast.success('Statut d’inscription mis à jour.');
    } catch (err) {
      setEleves((prev) => prev.map((e) => (e.id === eleve.id ? { ...e, statutInscription: precedent } : e)));
      toast.error(msg(err, 'Erreur lors de la mise à jour du statut.'));
    }
  };

  const classesById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  const niveaux = useMemo(() => {
    const vus = new Map<number, string>();
    classes.forEach((c) => vus.set(c.niveauId, c.niveauNom));
    return Array.from(vus.entries())
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [classes]);

  const classesDuFiltre = useMemo(
    () => (filterNiveauId ? classes.filter((c) => String(c.niveauId) === filterNiveauId) : classes),
    [classes, filterNiveauId],
  );

  const elevesFiltres = useMemo(() => {
    return eleves.filter((e) => {
      if (filterClasseId) return String(e.classeId) === filterClasseId;
      if (filterNiveauId) {
        const cl = e.classeId ? classesById.get(e.classeId) : undefined;
        return cl ? String(cl.niveauId) === filterNiveauId : false;
      }
      return true;
    });
  }, [eleves, filterClasseId, filterNiveauId, classesById]);

  const groupesParClasse = useMemo(() => {
    const map = new Map<string, { classe?: Classe; eleves: Eleve[] }>();
    for (const e of elevesFiltres) {
      const key = e.classeId ? String(e.classeId) : 'SANS_CLASSE';
      if (!map.has(key)) {
        map.set(key, { classe: e.classeId ? classesById.get(e.classeId) : undefined, eleves: [] });
      }
      map.get(key)!.eleves.push(e);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (!a.classe) return 1;
      if (!b.classe) return -1;
      const n = (a.classe.niveauNom || '').localeCompare(b.classe.niveauNom || '');
      return n !== 0 ? n : a.classe.nom.localeCompare(b.classe.nom);
    });
  }, [elevesFiltres, classesById]);

  return (
    <div>
      {nouveauCompte && (
        <CredentialsBanner
          title={`Compte élève « ${nouveauCompte.nom} » créé`}
          password={nouveauCompte.motDePasse}
          onClose={() => setNouveauCompte(null)}
        />
      )}

      <PageHeader
        title="Gestion des élèves"
        description={
          loading
            ? 'Chargement…'
            : `${elevesFiltres.length} élève(s)${elevesFiltres.length !== eleves.length ? ` sur ${eleves.length}` : ' inscrit(s)'}`
        }
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={openImportDialog}>
            <Upload /> Importer (Excel)
          </Button>
          <Button onClick={openNewForm}>
            <Plus /> Nouvel élève
          </Button>
        </div>
      </PageHeader>

      {!loading && eleves.length > 0 && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <Field label="Niveau" className="min-w-48">
            <Select
              value={filterNiveauId}
              onChange={(e) => {
                setFilterNiveauId(e.target.value);
                setFilterClasseId('');
              }}
            >
              <option value="">— Tous les niveaux —</option>
              {niveaux.map((n) => (
                <option key={n.id} value={n.id}>{n.nom}</option>
              ))}
            </Select>
          </Field>
          <Field label="Classe (sous-classe)" className="min-w-48">
            <Select value={filterClasseId} onChange={(e) => setFilterClasseId(e.target.value)}>
              <option value="">— Toutes les classes —</option>
              {classesDuFiltre.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </Select>
          </Field>
          {(filterNiveauId || filterClasseId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterNiveauId('');
                setFilterClasseId('');
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : eleves.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="Aucun élève inscrit"
          description="Commencez par inscrire un élève. Un compte lui sera créé automatiquement."
          action={
            <Button onClick={openNewForm}>
              <Plus /> Inscrire un élève
            </Button>
          }
        />
      ) : elevesFiltres.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="Aucun élève dans cette sélection"
          description="Essayez un autre niveau ou une autre classe."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom &amp; prénom</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupesParClasse.map((groupe) => (
              <Fragment key={groupe.classe ? groupe.classe.id : 'SANS_CLASSE'}>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableCell colSpan={7} className="py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {groupe.classe
                      ? `${groupe.classe.niveauNom} — ${groupe.classe.nom}`
                      : 'Sans classe assignée'}{' '}
                    <span className="font-normal normal-case text-primary">({groupe.eleves.length} élève(s))</span>
                  </TableCell>
                </TableRow>
                {groupe.eleves.map((eleve) => (
                  <TableRow key={eleve.id}>
                <TableCell>
                  <span className="font-mono text-xs font-medium text-primary">{eleve.matricule}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-[hsl(var(--gold))]">
                      {eleve.profil?.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={eleve.profil.photoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        `${eleve.profil?.prenom?.[0] ?? ''}${eleve.profil?.nom?.[0] ?? ''}`
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium">{eleve.profil.nom} {eleve.profil.prenom}</div>
                      {eleve.profil.telephone && (
                        <div className="text-xs text-muted-foreground">{eleve.profil.telephone}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {eleve.profil.genre === 'M' ? 'Masculin' : 'Féminin'}
                </TableCell>
                <TableCell>
                  {eleve.classeNom ? (
                    <Badge variant="warning">{eleve.classeNom}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={eleve.statut === 'ARCHIVE' ? 'secondary' : 'success'}>
                    {eleve.statut || 'ACTIF'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={eleve.statutInscription || 'VALIDEE'}
                    onChange={(e) => handleStatutInscriptionChange(eleve, e.target.value)}
                    className={`h-8 w-36 py-1 pl-2.5 pr-7 text-xs font-semibold ${STATUT_INSCRIPTION_COLOR[eleve.statutInscription || 'VALIDEE']}`}
                  >
                    {Object.entries(STATUT_INSCRIPTION_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setDocsEleve(eleve)}>
                      <FileText /> Documents
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditForm(eleve)}>
                      <Pencil /> Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(eleve)}
                    >
                      <Trash2 /> Supprimer
                    </Button>
                  </div>
                </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Formulaire création / édition */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEleve ? "Modifier l'élève" : 'Inscrire un élève'}</DialogTitle>
          </DialogHeader>

          {error && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom *">
              <Input name="prenom" value={formData.prenom} onChange={handleInputChange} placeholder="Ex : Fatoumata" required />
            </Field>
            <Field label="Nom *">
              <Input name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Ex : Diarra" required />
            </Field>
            <Field label="Genre">
              <Select name="genre" value={formData.genre} onChange={handleInputChange}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </Field>
            <Field label="Date de naissance *">
              <Input type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleInputChange} required />
            </Field>
            <Field label="Téléphone (optionnel)">
              <Input name="telephone" value={formData.telephone} onChange={handleInputChange} placeholder="+223 70 00 00 00" />
            </Field>
            <Field label="E-mail (optionnel)">
              <Input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder="fatoumata.diarra@exemple.ml" />
            </Field>
            <Field label="Adresse" className="sm:col-span-2">
              <Input name="adresse" value={formData.adresse} onChange={handleInputChange} placeholder="Badalabougou, Bamako" />
            </Field>
            <Field label="Parent / tuteur légal (liaison espace parent)" className="sm:col-span-2">
              <Select name="parentId" value={formData.parentId} onChange={handleInputChange}>
                <option value="">— Aucun parent associé —</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.profil?.prenom} {p.profil?.nom} ({p.email || p.username})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Classe" className="sm:col-span-2">
              <Select name="classeId" value={formData.classeId} onChange={handleInputChange}>
                <option value="">— Sélectionner une classe (optionnel) —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} — {c.niveauNom || 'Niveau ?'} ({c.anneeScolaire})
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Photo (carte scolaire & trombinoscope)"
              hint="JPEG, PNG ou WebP, 6 Mo max. Redimensionnée automatiquement."
              className="sm:col-span-2"
            >
              <div className="flex items-center gap-3">
                <Input type="file" accept="image/*" onChange={handlePhotoUpload} className="flex-1" />
                {photoPreview && (
                  <span className="size-11 shrink-0 overflow-hidden rounded-full border border-primary/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Aperçu" className="size-full object-cover" />
                  </span>
                )}
              </div>
            </Field>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {editingEleve ? 'Enregistrer' : "Inscrire l'élève"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import en masse depuis un fichier Excel */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Importer des élèves depuis Excel</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Pratique pour charger d&apos;anciens élèves sans les inscrire un par un.{' '}
            <button type="button" onClick={handleTelechargerModele} className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2">
              <Download className="size-3.5" /> Télécharger le modèle Excel
            </button>
            , remplissez-le, puis importez-le ci-dessous.
          </p>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <Field
              label="Classe par défaut (optionnel)"
              hint="Utilisée pour les lignes sans colonne « Classe » renseignée. Sinon, laissez vide."
            >
              <Select value={importClasseId} onChange={(e) => setImportClasseId(e.target.value)}>
                <option value="">— Aucune (classe indiquée par ligne) —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} — {c.niveauNom || 'Niveau ?'} ({c.anneeScolaire})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Fichier Excel (.xlsx)">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowImport(false)}>
                Fermer
              </Button>
              <Button type="submit" loading={importSubmitting} disabled={!importFile}>
                <Upload /> Importer
              </Button>
            </DialogFooter>
          </form>

          {importRapport && (
            <div className="mt-2 space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium">
                {importRapport.succes} importé(s) sur {importRapport.totalLignes}
                {importRapport.echecs > 0 && ` — ${importRapport.echecs} en erreur`}
              </p>
              <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ligne</TableHead>
                      <TableHead>Élève</TableHead>
                      <TableHead>Résultat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRapport.resultats.map((r) => (
                      <TableRow key={r.ligne}>
                        <TableCell>{r.ligne}</TableCell>
                        <TableCell>{r.nomComplet || '—'}</TableCell>
                        <TableCell>
                          {r.succes ? (
                            <Badge variant="success">{r.matricule}</Badge>
                          ) : (
                            <span className="text-xs text-destructive">{r.erreur}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DocumentsEleveDialog eleve={docsEleve} onClose={() => setDocsEleve(null)} />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
