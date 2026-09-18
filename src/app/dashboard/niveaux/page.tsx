'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GraduationCap, Plus } from 'lucide-react';
import { niveauService } from '@/services/niveau.service';
import { Niveau } from '@/types';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormError } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function NiveauxPage() {
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchNiveaux = async () => {
    try {
      setLoading(true);
      setNiveaux(await niveauService.lister());
    } catch {
      toast.error('Impossible de charger les niveaux.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNiveaux();
  }, []);

  const openForm = () => {
    setNom('');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await niveauService.creer(nom.trim());
      toast.success(`Niveau « ${nom.trim()} » créé.`);
      setShowForm(false);
      await fetchNiveaux();
    } catch (err) {
      setError(errorMessage(err, 'Erreur lors de la création du niveau'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Niveaux"
        description="Catalogue des niveaux scolaires (Fondamental, Lycée, filières techniques…) — partagé par tous les établissements de la plateforme."
      >
        <Button onClick={openForm}>
          <Plus /> Nouveau niveau
        </Button>
      </PageHeader>

      <p className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        Créez ici un niveau seulement s&apos;il n&apos;existe pas déjà dans la liste ci-dessous (ex. une filière
        professionnelle propre à un établissement). Une fois créé, il est disponible pour tous les établissements —
        chaque établissement choisit ensuite lesquels il propose depuis sa fiche.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : niveaux.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="Aucun niveau"
          description="Créez les niveaux scolaires proposés sur la plateforme."
          action={<Button onClick={openForm}><Plus /> Créer un niveau</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Niveau</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {niveaux.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-medium">{n.nom}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau niveau</DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nom du niveau *" hint="Ex : Enseignement Professionnel (CAP - BT2)">
              <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Enseignement Professionnel (CAP - BT2)" required />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={submitting}>Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
