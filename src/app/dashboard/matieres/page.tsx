'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { matiereService } from '@/services/matiere.service';
import { Matiere } from '@/types';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormError } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function MatieresPage() {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Matiere | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ nom: '', code: '' });

  const fetchMatieres = async () => {
    try {
      setLoading(true);
      setMatieres(await matiereService.getMatieres());
    } catch {
      toast.error('Impossible de charger les matières.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setFormData({ nom: '', code: '' });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (m: Matiere) => {
    setEditing(m);
    setFormData({ nom: m.nom, code: m.code });
    setError('');
    setShowForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      if (editing) {
        await matiereService.updateMatiere(editing.id, formData);
        toast.success('Matière mise à jour.');
      } else {
        await matiereService.createMatiere(formData);
        toast.success('Matière créée.');
      }
      setFormData({ nom: '', code: '' });
      setShowForm(false);
      setEditing(null);
      await fetchMatieres();
    } catch (err) {
      setError(errorMessage(err, 'Erreur lors de la sauvegarde de la matière'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (m: Matiere) => {
    if (!confirm(`Supprimer la matière « ${m.nom} » (${m.code}) ?`)) return;
    try {
      await matiereService.deleteMatiere(m.id);
      toast.success('Matière supprimée.');
      await fetchMatieres();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression de la matière'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Gestion des matières"
        description={loading ? 'Chargement…' : `${matieres.length} matière(s)`}
      >
        <Button onClick={openNewForm}>
          <Plus /> Nouvelle matière
        </Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : matieres.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="Aucune matière"
          description="Créez le catalogue des matières enseignées dans l'établissement."
          action={<Button onClick={openNewForm}><Plus /> Créer une matière</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom de la matière</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matieres.map((m) => (
              <TableRow key={m.id}>
                <TableCell><Badge>{m.code}</Badge></TableCell>
                <TableCell className="font-medium">{m.nom}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => openEditForm(m)}>
                      <Pencil /> Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(m)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la matière' : 'Ajouter une matière'}</DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nom de la matière *">
              <Input name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Ex : Mathématiques" required />
            </Field>
            <Field label="Code" hint="Généré automatiquement si laissé vide.">
              <Input name="code" value={formData.code} onChange={handleInputChange} placeholder="Ex : MATH-01" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? 'Enregistrer' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
