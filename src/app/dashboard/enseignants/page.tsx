'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { enseignantService } from '@/services/enseignant.service';
import { authService } from '@/services/auth.service';
import { Enseignant } from '@/types';
import { errorMessage } from '@/lib/errors';
import CredentialsBanner from '@/components/CredentialsBanner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormError } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const EMPTY = { prenom: '', nom: '', telephone: '', email: '', genre: 'M', dateNaissance: '', adresse: '', biographie: '' };

export default function EnseignantsPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Enseignant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [nouveauCompte, setNouveauCompte] = useState<{ nom: string; motDePasse: string } | null>(null);
  const [formData, setFormData] = useState(EMPTY);

  // Uniquement crèche (aucun primaire/collège/lycée à côté) : les libellés génériques (page, bouton
  // "nouveau", messages de création) peuvent dire "monitrice" sans se tromper — dans une école mixte,
  // on ne sait pas encore si la PROCHAINE personne ajoutée sera monitrice ou enseignant.
  const uniquementCreche = !!authService.getCurrentUser()?.etablissementUniquementCreche;
  // École mixte (crèche + primaire/collège/lycée) : le personnel est un mélange de monitrices et
  // d'enseignants — on affiche alors une colonne dédiée pour distinguer qui est quoi, ligne par ligne.
  const ecoleMixte = !!authService.getCurrentUser()?.aClassesCreche && !uniquementCreche;
  // Pour une action sur une personne déjà existante (modifier/supprimer), on utilise sa vraie
  // affectation (estMonitrice) si on la connaît — ça reste correct même dans une école mixte.
  const estMonitriceCiblee = editing?.estMonitrice ?? uniquementCreche;

  const libellePluriel = uniquementCreche ? 'monitrices' : 'enseignants';
  const nouveauLabel = uniquementCreche ? 'Nouvelle monitrice' : 'Nouvel enseignant';
  const compteLabel = estMonitriceCiblee ? 'monitrice' : 'enseignant';
  const aucunLabel = uniquementCreche ? 'Aucune monitrice' : 'Aucun enseignant';
  const ajouterPhrase = uniquementCreche ? 'Ajoutez une monitrice.' : 'Ajoutez un enseignant.';
  const ajouterLabel = uniquementCreche ? 'Ajouter une monitrice' : 'Ajouter un enseignant';
  const modifierLabel = estMonitriceCiblee ? 'Modifier la monitrice' : "Modifier l'enseignant";
  const majLabel = estMonitriceCiblee ? 'Monitrice mise à jour.' : 'Enseignant mis à jour.';
  const ajouteeLabel = uniquementCreche ? 'Monitrice ajoutée.' : 'Enseignant ajouté.';

  const fetchEnseignants = async () => {
    try {
      setLoading(true);
      setEnseignants(await enseignantService.getEnseignants());
    } catch {
      toast.error(`Impossible de charger les ${libellePluriel}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnseignants();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setFormData(EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (prof: Enseignant) => {
    setEditing(prof);
    setError('');
    setFormData({
      prenom: prof.profil?.prenom || '',
      nom: prof.profil?.nom || '',
      telephone: prof.profil?.telephone || '',
      email: prof.profil?.email || '',
      genre: prof.profil?.genre || 'M',
      dateNaissance: prof.profil?.dateNaissance ? prof.profil.dateNaissance.substring(0, 10) : '',
      adresse: prof.profil?.adresse || '',
      biographie: prof.biographie || '',
    });
    setShowForm(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
        biographie: formData.biographie,
        profil: {
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          email: formData.email,
          genre: formData.genre as 'M' | 'F',
          dateNaissance: formData.dateNaissance,
          adresse: formData.adresse,
        },
      };

      if (editing) {
        await enseignantService.updateEnseignant(editing.id, payload);
        toast.success(majLabel);
      } else {
        const cree = await enseignantService.createEnseignant(payload);
        toast.success(ajouteeLabel);
        if (cree?.motDePasseInitial) {
          setNouveauCompte({
            nom: `${formData.prenom} ${formData.nom}`.trim() || nouveauLabel,
            motDePasse: cree.motDePasseInitial,
          });
        }
      }
      setShowForm(false);
      setEditing(null);
      await fetchEnseignants();
    } catch (err) {
      setError(errorMessage(err, estMonitriceCiblee ? 'Erreur lors de la sauvegarde de la monitrice' : "Erreur lors de la sauvegarde de l'enseignant"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (prof: Enseignant) => {
    const estMonitriceProf = prof.estMonitrice ?? uniquementCreche;
    const confirmLabel = estMonitriceProf ? 'Supprimer définitivement la monitrice' : "Supprimer définitivement l'enseignant";
    if (!confirm(`${confirmLabel} ${prof.profil.prenom} ${prof.profil.nom} ?`)) return;
    try {
      await enseignantService.deleteEnseignant(prof.id);
      toast.success(estMonitriceProf ? 'Monitrice supprimée.' : 'Enseignant supprimé.');
      await fetchEnseignants();
    } catch (err) {
      toast.error(errorMessage(err, estMonitriceProf ? 'Erreur lors de la suppression de la monitrice' : "Erreur lors de la suppression de l'enseignant"));
    }
  };

  const limiteEnseignants = authService.getCurrentUser()?.etablissementMaxEnseignants ?? null;
  const planTarifaire = authService.getCurrentUser()?.etablissementPlanTarifaire;
  const atteintLaLimite = limiteEnseignants != null && enseignants.length >= limiteEnseignants;

  return (
    <div>
      {nouveauCompte && (
        <CredentialsBanner
          title={`Compte ${compteLabel} « ${nouveauCompte.nom} » créé`}
          password={nouveauCompte.motDePasse}
          onClose={() => setNouveauCompte(null)}
        />
      )}

      <PageHeader
        title={`Gestion des ${libellePluriel}`}
        description={loading ? 'Chargement…' : `${enseignants.length} ${compteLabel}(s)`}
      >
        <Button onClick={openNewForm}>
          <Plus /> {nouveauLabel}
        </Button>
      </PageHeader>

      {!loading && limiteEnseignants != null && (
        <Alert tone={atteintLaLimite ? 'warning' : 'info'} className="mb-4">
          {enseignants.length}/{limiteEnseignants} comptes {libellePluriel} utilisés sur le plan{' '}
          {planTarifaire || 'Starter'}.{' '}
          {atteintLaLimite && "Limite atteinte — passez au plan Pro pour en ajouter davantage."}
        </Alert>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : enseignants.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title={aucunLabel}
          description={`${ajouterPhrase} Un compte lui sera créé automatiquement.`}
          action={<Button onClick={openNewForm}><Plus /> {ajouterLabel}</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom &amp; prénom</TableHead>
              {ecoleMixte && <TableHead>Rôle</TableHead>}
              <TableHead>Téléphone</TableHead>
              <TableHead>Spécialité / bio</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enseignants.map((prof) => (
              <TableRow key={prof.id}>
                <TableCell>
                  <span className="font-mono text-xs font-medium text-primary">{prof.matricule}</span>
                </TableCell>
                <TableCell className="font-medium">{prof.profil.nom} {prof.profil.prenom}</TableCell>
                {ecoleMixte && (
                  <TableCell>
                    <Badge variant={prof.estMonitrice ? 'warning' : 'secondary'}>
                      {prof.estMonitrice ? 'Monitrice' : 'Enseignant'}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">{prof.profil.telephone || '—'}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{prof.biographie || '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => openEditForm(prof)}>
                      <Pencil /> Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(prof)}
                    >
                      <Trash2 /> Supprimer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? modifierLabel : ajouterLabel}</DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom *">
              <Input name="prenom" value={formData.prenom} onChange={handleInputChange} placeholder="Ex : Oumar" required />
            </Field>
            <Field label="Nom *">
              <Input name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Ex : Traoré" required />
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
            <Field label="Téléphone">
              <Input name="telephone" value={formData.telephone} onChange={handleInputChange} placeholder="+223 76 00 00 00" />
            </Field>
            <Field label="E-mail (optionnel)">
              <Input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="oumar.traore@exemple.ml" />
            </Field>
            <Field label="Adresse" className="sm:col-span-2">
              <Input name="adresse" value={formData.adresse} onChange={handleInputChange} placeholder="Hamdallaye ACI 2000, Bamako" />
            </Field>
            <Field label="Biographie / spécialité" className="sm:col-span-2">
              <Textarea name="biographie" rows={3} value={formData.biographie} onChange={handleInputChange} placeholder="Professeur de mathématiques, 10 ans d'expérience…" />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? 'Enregistrer' : 'Enregistrer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
