'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  Crown,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { utilisateurService, UtilisateurResponse, RegisterPayload } from '@/services/utilisateur.service';
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
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const ROLES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'DIRECTEUR', label: 'Directeur', Icon: ShieldCheck },
  { value: 'SECRETAIRE', label: 'Secrétaire', Icon: ClipboardList },
  { value: 'COMPTABLE', label: 'Comptable', Icon: Wallet },
  { value: 'ENSEIGNANT', label: 'Enseignant', Icon: UsersRound },
  { value: 'PARENT', label: 'Parent', Icon: Users },
];
const roleLabel = (nom: string) => ROLES.find((r) => r.value === nom)?.label ?? nom;

const EMPTY: RegisterPayload = {
  username: '',
  email: '',
  motDePasse: '',
  role: 'SECRETAIRE',
  profil: { prenom: '', nom: '', telephone: '', genre: 'M', adresse: '' },
};

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UtilisateurResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<RegisterPayload>(EMPTY);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setUtilisateurs(await utilisateurService.getAll());
    } catch {
      toast.error('Impossible de charger les comptes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreateForm = () => {
    setEditingUser(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (u: UtilisateurResponse) => {
    setEditingUser(u);
    setForm({
      username: u.username || '',
      email: u.email || '',
      motDePasse: '',
      role: u.role || 'SECRETAIRE',
      profil: {
        prenom: u.profil?.prenom || '',
        nom: u.profil?.nom || '',
        telephone: u.profil?.telephone || '',
        genre: u.profil?.genre || 'M',
        adresse: '',
      },
    });
    setError('');
    setShowForm(true);
  };

  const setProfil = (patch: Partial<RegisterPayload['profil']>) =>
    setForm((prev) => ({ ...prev, profil: { ...prev.profil, ...patch } }));

  const onNameChange = (field: 'prenom' | 'nom', value: string) => {
    setForm((prev) => {
      const profil = { ...prev.profil, [field]: value };
      const autoUser =
        editingUser || prev.username
          ? prev.username
          : `${profil.prenom}.${profil.nom}`.toLowerCase().replace(/\s+/g, '');
      return { ...prev, profil, username: autoUser };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const usernameFinal =
        form.username?.trim() ||
        `${form.profil.prenom}.${form.profil.nom}`.toLowerCase().replace(/\s+/g, '');

      if (editingUser) {
        await utilisateurService.update(editingUser.id, { ...form, username: usernameFinal });
        toast.success('Compte mis à jour.');
      } else {
        await utilisateurService.create({ ...form, username: usernameFinal });
        toast.success(`Compte ${roleLabel(form.role)} créé (identifiant : ${usernameFinal}).`);
      }
      setShowForm(false);
      setEditingUser(null);
      await fetchAll();
    } catch (err) {
      setError(errorMessage(err, 'Erreur lors de la sauvegarde du compte'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, current: boolean) => {
    try {
      await utilisateurService.toggleStatut(id, !current);
      setUtilisateurs((prev) => prev.map((u) => (u.id === id ? { ...u, estActif: !current } : u)));
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la mise à jour du statut'));
    }
  };

  const handleNommerDirecteur = async (u: UtilisateurResponse) => {
    const nom = u.profil ? `${u.profil.prenom} ${u.profil.nom}` : u.username || u.email;
    if (!confirm(`Nommer ${nom} directeur de l'établissement ? Le directeur actuel redeviendra Secrétaire.`)) return;
    try {
      await utilisateurService.nommerDirecteur(u.id);
      toast.success(`${nom} est maintenant directeur.`);
      await fetchAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors du changement de directeur'));
    }
  };

  const handleDelete = async (u: UtilisateurResponse) => {
    const nom = u.profil ? `${u.profil.prenom} ${u.profil.nom}` : u.username || u.email;
    if (!confirm(`Supprimer définitivement le compte de ${nom} ?`)) return;
    try {
      await utilisateurService.delete(u.id);
      toast.success('Compte supprimé.');
      await fetchAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression du compte'));
    }
  };

  const countByRole: Record<string, number> = {};
  utilisateurs.forEach((u) => {
    countByRole[u.role] = (countByRole[u.role] || 0) + 1;
  });

  return (
    <div>
      <PageHeader
        title="Comptes utilisateurs"
        description="Créez et gérez les accès du personnel de l'établissement."
      >
        <Button onClick={openCreateForm}>
          <Plus /> Nouveau compte
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2">
        {ROLES.map(({ value, label, Icon }) => (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium"
          >
            <Icon className="size-3.5 text-primary" />
            {label}
            <span className="tabular-nums text-muted-foreground">{countByRole[value] || 0}</span>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : utilisateurs.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Aucun compte"
          description="Créez les comptes du personnel : direction, secrétariat, comptabilité, enseignants."
          action={<Button onClick={openCreateForm}><Plus /> Créer un compte</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom &amp; prénom</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {utilisateurs.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.profil ? `${u.profil.nom} ${u.profil.prenom}` : '—'}</div>
                  <div className="font-mono text-xs text-primary">@{u.username || u.email.split('@')[0]}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabel(u.role)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.estActif ? 'success' : 'destructive'}>
                    {u.estActif ? 'Actif' : 'Désactivé'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.dateCreation ? new Date(u.dateCreation).toLocaleDateString('fr-FR') : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {['SECRETAIRE', 'COMPTABLE', 'ENSEIGNANT'].includes(u.role) && (
                      <Button size="sm" variant="ghost" onClick={() => handleNommerDirecteur(u)}>
                        <Crown /> Nommer directeur
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEditForm(u)}>
                      <Pencil /> Modifier
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggle(u.id, u.estActif)}>
                      {u.estActif ? <Lock /> : <LockOpen />}
                      {u.estActif ? 'Bloquer' : 'Débloquer'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(u)}
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

      <p className="mt-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        Seul un <strong>Directeur</strong> peut ajouter, modifier ou supprimer des comptes.
      </p>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Modifier le compte' : 'Créer un compte'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Rôle *</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: value }))}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-medium transition-colors',
                    form.role === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary',
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <FormError message={error} />

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom *">
              <Input value={form.profil.prenom} onChange={(e) => onNameChange('prenom', e.target.value)} placeholder="Ex : Kouassi" required />
            </Field>
            <Field label="Nom *">
              <Input value={form.profil.nom} onChange={(e) => onNameChange('nom', e.target.value)} placeholder="Ex : Aya" required />
            </Field>
            <Field label="Identifiant (login) *">
              <Input value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="kouassi.aya" required />
            </Field>
            <Field label="E-mail (optionnel)">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="kouassi.aya@exemple.ml" />
            </Field>
            <Field label={editingUser ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe (min. 6) *'}>
              <Input
                type="password"
                value={form.motDePasse}
                onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
                placeholder="••••••••"
                minLength={editingUser ? 0 : 6}
                required={!editingUser}
              />
            </Field>
            <Field label="Téléphone (optionnel)">
              <Input value={form.profil.telephone || ''} onChange={(e) => setProfil({ telephone: e.target.value })} placeholder="+223 70 00 00 00" />
            </Field>
            <Field label="Genre">
              <Select value={form.profil.genre || 'M'} onChange={(e) => setProfil({ genre: e.target.value })}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </Field>
            <Field label="Adresse" className="sm:col-span-2">
              <Input value={form.profil.adresse || ''} onChange={(e) => setProfil({ adresse: e.target.value })} placeholder="Badalabougou, Bamako" />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={submitting}>
                {editingUser ? 'Enregistrer' : `Créer le compte ${roleLabel(form.role)}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
