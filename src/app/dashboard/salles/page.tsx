'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DoorOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { salleService } from '@/services/salle.service';
import { Salle } from '@/types';
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

const FORM_EMPTY = { nom: '', capacite: '' };

export default function SallesPage() {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Salle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(FORM_EMPTY);

  const fetchSalles = async () => {
    try {
      setLoading(true);
      setSalles(await salleService.getSalles());
    } catch {
      toast.error('Impossible de charger les salles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalles();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setFormData(FORM_EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (s: Salle) => {
    setEditing(s);
    setFormData({ nom: s.nom, capacite: s.capacite ? String(s.capacite) : '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const payload = {
      nom: formData.nom.trim(),
      capacite: formData.capacite ? parseInt(formData.capacite, 10) : undefined,
    };
    try {
      if (editing) {
        await salleService.updateSalle(editing.id, payload);
        toast.success('Salle mise à jour.');
      } else {
        await salleService.createSalle(payload);
        toast.success('Salle créée.');
      }
      setFormData(FORM_EMPTY);
      setShowForm(false);
      setEditing(null);
      await fetchSalles();
    } catch (err) {
      setError(errorMessage(err, 'Erreur lors de la sauvegarde de la salle'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (s: Salle) => {
    if (!confirm(`Supprimer la salle « ${s.nom} » ?`)) return;
    try {
      await salleService.deleteSalle(s.id);
      toast.success('Salle supprimée.');
      await fetchSalles();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression de la salle'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Gestion des salles"
        description={loading ? 'Chargement…' : `${salles.length} salle(s) — utilisées dans l'emploi du temps`}
      >
        <Button onClick={openNewForm}>
          <Plus /> Nouvelle salle
        </Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : salles.length === 0 ? (
        <EmptyState
          icon={<DoorOpen />}
          title="Aucune salle"
          description="Facultatif : créez le catalogue de vos salles nommées (Salle 104, Labo de Physique…) pour les retrouver directement dans l'emploi du temps. Sans salle créée ici, le champ reste en texte libre."
          action={<Button onClick={openNewForm}><Plus /> Créer une salle</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom de la salle</TableHead>
              <TableHead>Capacité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salles.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.nom}</TableCell>
                <TableCell>{s.capacite ? <Badge variant="secondary">{s.capacite} places</Badge> : '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => openEditForm(s)}>
                      <Pencil /> Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(s)}
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
            <DialogTitle>{editing ? 'Modifier la salle' : 'Ajouter une salle'}</DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nom de la salle *">
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex : Salle 104, Labo de Physique"
                required
              />
            </Field>
            <Field label="Capacité" hint="Facultatif, nombre de places.">
              <Input
                type="number"
                min={1}
                value={formData.capacite}
                onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                placeholder="Ex : 40"
              />
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
