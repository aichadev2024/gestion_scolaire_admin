'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { disponibiliteService, DisponibiliteItem, TypeDisponibilite } from '@/services/disponibilite.service';
import { errorMessage } from '@/lib/errors';
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

const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const FORM_EMPTY = {
  jourSemaine: '1',
  heureDebut: '08:00',
  heureFin: '12:00',
  type: 'DISPONIBLE' as TypeDisponibilite,
  commentaire: '',
};

export default function DisponibilitesPage() {
  const [items, setItems] = useState<DisponibiliteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(FORM_EMPTY);

  const charger = async () => {
    try {
      setLoading(true);
      setItems(await disponibiliteService.listerPourMoi());
    } catch {
      toast.error('Impossible de charger vos disponibilités.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const openForm = () => {
    setFormData(FORM_EMPTY);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatTime = (t: string) => (t.length === 5 ? `${t}:00` : t);
    setSubmitting(true);
    setError('');
    try {
      await disponibiliteService.creer({
        jourSemaine: parseInt(formData.jourSemaine),
        heureDebut: formatTime(formData.heureDebut),
        heureFin: formatTime(formData.heureFin),
        type: formData.type,
        commentaire: formData.commentaire.trim() || undefined,
      });
      toast.success('Disponibilité enregistrée.');
      setShowForm(false);
      await charger();
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de l'enregistrement"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: DisponibiliteItem) => {
    if (!confirm('Supprimer cette disponibilité ?')) return;
    try {
      await disponibiliteService.supprimer(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Disponibilité supprimée.');
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression'));
    }
  };

  const sorted = [...items].sort(
    (a, b) => a.jourSemaine - b.jourSemaine || a.heureDebut.localeCompare(b.heureDebut),
  );

  return (
    <div>
      <PageHeader
        title="Mes disponibilités"
        description="Indiquez vos créneaux disponibles ou indisponibles — la direction s'en sert pour construire l'emploi du temps."
      >
        <Button onClick={openForm}>
          <Plus /> Déclarer un créneau
        </Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<CalendarClock />}
          title="Aucune disponibilité déclarée"
          description="Indiquez vos créneaux disponibles (ou au contraire indisponibles) pour aider la direction à construire votre emploi du temps."
          action={<Button onClick={openForm}><Plus /> Déclarer un créneau</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jour</TableHead>
              <TableHead>Horaire</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Commentaire</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{JOURS[item.jourSemaine]}</TableCell>
                <TableCell>{item.heureDebut.substring(0, 5)} – {item.heureFin.substring(0, 5)}</TableCell>
                <TableCell>
                  <Badge variant={item.type === 'DISPONIBLE' ? 'success' : 'destructive'}>
                    {item.type === 'DISPONIBLE' ? 'Disponible' : 'Indisponible'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.commentaire || '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(item)}
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
            <DialogTitle>Déclarer un créneau</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={formData.type === 'DISPONIBLE' ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, type: 'DISPONIBLE' })}
            >
              Disponible
            </Button>
            <Button
              type="button"
              size="sm"
              variant={formData.type === 'INDISPONIBLE' ? 'accent' : 'outline'}
              onClick={() => setFormData({ ...formData, type: 'INDISPONIBLE' })}
            >
              Indisponible
            </Button>
          </div>

          <FormError message={error} />

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Jour">
              <Select value={formData.jourSemaine} onChange={(e) => setFormData({ ...formData, jourSemaine: e.target.value })}>
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <option key={j} value={j}>{JOURS[j]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Heure de début *">
              <Input type="time" value={formData.heureDebut} onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })} required />
            </Field>
            <Field label="Heure de fin *">
              <Input type="time" value={formData.heureFin} onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })} required />
            </Field>
            <Field label="Commentaire" className="sm:col-span-2" hint="Facultatif.">
              <Input
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                placeholder="Ex : cours du soir à l'université ce jour-là"
              />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={submitting}>Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
