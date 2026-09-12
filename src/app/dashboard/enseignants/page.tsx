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

  const fetchEnseignants = async () => {
    try {
      setLoading(true);
      setEnseignants(await enseignantService.getEnseignants());
    } catch {
      toast.error('Impossible de charger les enseignants.');
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
        toast.success('Enseignant mis à jour.');
      } else {
        const cree = await enseignantService.createEnseignant(payload);
        toast.success('Enseignant ajouté.');
        if (cree?.motDePasseInitial) {
          setNouveauCompte({
            nom: `${formData.prenom} ${formData.nom}`.trim() || 'Nouvel enseignant',
            motDePasse: cree.motDePasseInitial,
          });
        }
      }
      setShowForm(false);
      setEditing(null);
      await fetchEnseignants();
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de la sauvegarde de l'enseignant"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (prof: Enseignant) => {
    if (!confirm(`Supprimer définitivement l'enseignant ${prof.profil.prenom} ${prof.profil.nom} ?`)) return;
    try {
      await enseignantService.deleteEnseignant(prof.id);
      toast.success('Enseignant supprimé.');
      await fetchEnseignants();
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de la suppression de l'enseignant"));
    }
  };

  const sessionUser = authService.getCurrentUser();
  const limiteEnseignants = sessionUser?.etablissementMaxEnseignants ?? null;
  const planTarifaire = sessionUser?.etablissementPlanTarifaire;
  const atteintLaLimite = limiteEnseignants != null && enseignants.length >= limiteEnseignants;

  return (
    <div>
      {nouveauCompte && (
        <CredentialsBanner
          title={`Compte enseignant « ${nouveauCompte.nom} » créé`}
          password={nouveauCompte.motDePasse}
          onClose={() => setNouveauCompte(null)}
        />
      )}

      <PageHeader
        title="Gestion des enseignants"
        description={loading ? 'Chargement…' : `${enseignants.length} enseignant(s)`}
      >
        <Button onClick={openNewForm}>
          <Plus /> Nouvel enseignant
        </Button>
      </PageHeader>

      {!loading && limiteEnseignants != null && (
        <Alert tone={atteintLaLimite ? 'warning' : 'info'} className="mb-4">
          {enseignants.length}/{limiteEnseignants} comptes enseignants utilisés sur le plan{' '}
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
          title="Aucun enseignant"
          description="Ajoutez un enseignant. Un compte lui sera créé automatiquement."
          action={<Button onClick={openNewForm}><Plus /> Ajouter un enseignant</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom &amp; prénom</TableHead>
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
            <DialogTitle>{editing ? "Modifier l'enseignant" : 'Ajouter un enseignant'}</DialogTitle>
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
