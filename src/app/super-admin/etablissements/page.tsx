'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Ban, Building2, CheckCircle2, Eye, EyeOff, FileDown, Pencil, Plus, RefreshCw, Search } from 'lucide-react';
import {
  etablissementService,
  Etablissement,
  CreateEtablissementRequest,
} from '@/services/etablissement.service';
import { tarifService, TarifPlan } from '@/services/tarif.service';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const EMPTY_FORM: CreateEtablissementRequest = {
  nomEtablissement: '',
  codeEtablissement: '',
  emailContact: '',
  telephone: '',
  adresse: '',
  planTarifaire: 'PRO',
  typeEtablissement: 'ECOLE',
  adminUsername: '',
  adminEmail: '',
  adminMotDePasse: '',
  adminProfil: { nom: '', prenom: '', telephone: '', adresse: '', genre: 'M', dateNaissance: '1990-01-01' },
};

const STATUTS = ['TOUS', 'ACTIF', 'SUSPENDU', 'CLOTURE'] as const;

export default function SuperAdminEtablissementsPage() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [formData, setFormData] = useState<CreateEtablissementRequest>(EMPTY_FORM);
  const [nowMs, setNowMs] = useState(0);
  const [renewingEtab, setRenewingEtab] = useState<Etablissement | null>(null);
  const [renewForm, setRenewForm] = useState({ planTarifaire: 'STARTER', dureeMois: 1 });
  const [renewSubmitting, setRenewSubmitting] = useState(false);
  const [editingEtab, setEditingEtab] = useState<Etablissement | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', emailContact: '', telephone: '', adresse: '', devise: 'FCFA', slogan: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [tarifs, setTarifs] = useState<TarifPlan[]>([]);

  useEffect(() => {
    setNowMs(Date.now());
    tarifService.listerTous().then(setTarifs).catch(() => {});
  }, []);

  const labelPlan = (code: string) => {
    const t = tarifs.find((x) => x.code === code);
    return t ? `${t.prixMensuel.toLocaleString('fr-FR')} FCFA/mois` : code;
  };

  const chargerEtablissements = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setEtablissements(await etablissementService.listerTous());
    } catch {
      setError('Erreur lors du chargement des établissements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerEtablissements();
  }, [chargerEtablissements]);

  const handleStatutChange = async (id: number, nouveauStatut: 'ACTIF' | 'SUSPENDU' | 'CLOTURE') => {
    try {
      await etablissementService.modifierStatut(id, nouveauStatut);
      toast.success(`Statut mis à jour : ${nouveauStatut}.`);
      chargerEtablissements();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors du changement de statut.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await etablissementService.creer(formData);
      toast.success('Établissement et compte directeur créés.');
      setModalOpen(false);
      setFormData(EMPTY_FORM);
      chargerEtablissements();
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de la création de l'établissement."));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (e: Etablissement) => {
    setEditingEtab(e);
    setEditForm({
      nom: e.nom,
      emailContact: e.emailContact || '',
      telephone: e.telephone || '',
      adresse: e.adresse || '',
      devise: e.devise || 'FCFA',
      slogan: e.slogan || '',
    });
  };

  const handleModifierInfos = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editingEtab) return;
    setEditSubmitting(true);
    try {
      await etablissementService.modifierInfos(editingEtab.id, editForm);
      toast.success('Coordonnées mises à jour.');
      setEditingEtab(null);
      chargerEtablissements();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la mise à jour.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    if (!fichier || !editingEtab) return;
    setLogoUploading(true);
    try {
      const logoUrl = await etablissementService.uploaderLogo(editingEtab.id, fichier);
      setEditingEtab({ ...editingEtab, logoUrl });
      toast.success('Logo mis à jour.');
      chargerEtablissements();
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de l'envoi du logo."));
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const openRenewDialog = (e: Etablissement) => {
    setRenewingEtab(e);
    setRenewForm({ planTarifaire: e.planTarifaire === 'PRO' ? 'PRO' : 'STARTER', dureeMois: 1 });
  };

  const handleRenouveler = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!renewingEtab) return;
    setRenewSubmitting(true);
    try {
      await etablissementService.renouveler(renewingEtab.id, renewForm.planTarifaire, renewForm.dureeMois);
      toast.success(`Abonnement de ${renewingEtab.nom} renouvelé (${renewForm.dureeMois} mois, ${renewForm.planTarifaire}).`);
      setRenewingEtab(null);
      chargerEtablissements();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors du renouvellement.'));
    } finally {
      setRenewSubmitting(false);
    }
  };

  const handleTelechargerRecu = async (id: number, nom: string) => {
    try {
      const blob = await etablissementService.telechargerRecuPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Recu_Abonnement_${nom.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors du téléchargement du reçu PDF.'));
    }
  };

  const filtered = etablissements.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = e.nom.toLowerCase().includes(q) || e.code.toLowerCase().includes(q);
    const matchStatut = filterStatut === 'TOUS' || e.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const total = etablissements.length;
  const actifs = etablissements.filter((e) => e.statut === 'ACTIF').length;
  const suspendus = etablissements.filter((e) => e.statut === 'SUSPENDU').length;
  const proCount = etablissements.filter(
    (e) => e.planTarifaire === 'PRO' || e.planTarifaire === 'ENTERPRISE',
  ).length;

  const metrics = [
    { label: 'Total établissements', value: total, Icon: Building2, accent: 'text-primary' },
    { label: 'Écoles actives', value: actifs, Icon: CheckCircle2, accent: 'text-success' },
    { label: 'Suspendus / inactifs', value: suspendus, Icon: Ban, accent: 'text-destructive' },
    { label: 'Sur plan Pro / Enterprise', value: proCount, Icon: Building2, accent: 'text-accent' },
  ];

  const statutBadge = (s: Etablissement['statut']) =>
    s === 'ACTIF' ? (
      <Badge variant="success">Actif</Badge>
    ) : s === 'SUSPENDU' ? (
      <Badge variant="destructive">Suspendu</Badge>
    ) : (
      <Badge variant="secondary">Clôturé</Badge>
    );

  const expirationCell = (e: Etablissement, nowMs: number) => {
    if (!e.dateExpirationAbonnement) return <span className="text-muted-foreground">1 mois par défaut</span>;
    const exp = new Date(e.dateExpirationAbonnement);
    const diffDays = Math.ceil((exp.getTime() - nowMs) / (1000 * 3600 * 24));
    const dateStr = exp.toLocaleDateString('fr-FR');
    if (diffDays < 0) return <Badge variant="destructive">Expiré ({dateStr})</Badge>;
    if (diffDays <= 15) return <Badge variant="warning">Expire dans {diffDays}j</Badge>;
    return <span className="text-success">Valide ({dateStr})</span>;
  };

  return (
    <div>
      <PageHeader
        title="Établissements clients"
        description="Gestion centralisée des sous-domaines, licences et comptes administrateurs d'écoles."
      >
        <Button onClick={() => setModalOpen(true)}>
          <Plus /> Nouvel établissement client
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, Icon, accent }) => (
          <Card key={label} className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
              <Icon className={cn('size-5', accent)} />
            </div>
            <div className={cn('text-2xl font-extrabold', accent)}>{loading ? '…' : value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher par nom ou code (ex : jules-verne)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUTS.map((st) => (
            <Button
              key={st}
              size="sm"
              variant={filterStatut === st ? 'default' : 'outline'}
              onClick={() => setFilterStatut(st)}
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 />}
            title="Aucun établissement ne correspond aux critères"
            description="Ajustez la recherche ou le filtre de statut."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Établissement</TableHead>
                  <TableHead>Sous-domaine</TableHead>
                  <TableHead>Admin principal</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Fin d&apos;abonnement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{e.nom}</span>
                        {e.typeEtablissement === 'CRECHE' && <Badge variant="secondary">Crèche</Badge>}
                      </div>
                      {e.dateCreation && (
                        <div className="text-xs text-muted-foreground">
                          Créé le {new Date(e.dateCreation).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {e.code}.netaa-ecole.com
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.adminNomComplet ? (
                        <div>
                          <div className="font-semibold text-foreground">{e.adminNomComplet}</div>
                          <div className="text-xs text-primary">@{e.adminUsername}</div>
                          {e.adminEmail && (
                            <div className="text-xs text-muted-foreground">{e.adminEmail}</div>
                          )}
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.planTarifaire === 'ENTERPRISE' ? 'default' : 'secondary'}>
                        {e.planTarifaire}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{expirationCell(e, nowMs)}</TableCell>
                    <TableCell>{statutBadge(e.statut)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.emailContact || 'N/A'}
                      <br />
                      {e.telephone || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(e)}
                          title="Modifier le nom, contact ou l'adresse (affichée sur le reçu)"
                        >
                          <Pencil /> Modifier
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openRenewDialog(e)}
                          title="Prolonger l'abonnement après paiement"
                        >
                          <RefreshCw /> Renouveler
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTelechargerRecu(e.id, e.nom)}
                          title="Télécharger l'attestation et le reçu de paiement PDF"
                        >
                          <FileDown /> Reçu PDF
                        </Button>
                        {e.statut === 'ACTIF' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleStatutChange(e.id, 'SUSPENDU')}
                          >
                            Suspendre
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success hover:bg-success/10 hover:text-success"
                            onClick={() => handleStatutChange(e.id, 'ACTIF')}
                          >
                            Activer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal création */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouvel établissement</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-accent">
                1. Informations école &amp; abonnement
              </legend>
              <Field label="Type d'établissement *" className="sm:col-span-2">
                <div className="grid grid-cols-2 gap-2">
                  {(['ECOLE', 'CRECHE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, typeEtablissement: t })}
                      className={cn(
                        'rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors',
                        formData.typeEtablissement === t
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40',
                      )}
                    >
                      {t === 'ECOLE' ? 'École' : 'Crèche'}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={formData.typeEtablissement === 'CRECHE' ? 'Nom de la crèche *' : "Nom de l'établissement *"}>
                <Input
                  placeholder={formData.typeEtablissement === 'CRECHE' ? 'Ex : Crèche Les Petits Anges' : 'Ex : Lycée Jules Verne'}
                  required
                  value={formData.nomEtablissement}
                  onChange={(e) => setFormData({ ...formData, nomEtablissement: e.target.value })}
                />
              </Field>
              <Field label="Code / sous-domaine" hint="Généré depuis le nom si laissé vide.">
                <Input
                  placeholder="Ex : jules-verne"
                  value={formData.codeEtablissement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      codeEtablissement: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                />
              </Field>
              <Field label="Email de contact">
                <Input
                  type="email"
                  placeholder="contact@julesverne.com"
                  value={formData.emailContact}
                  onChange={(e) => setFormData({ ...formData, emailContact: e.target.value })}
                />
              </Field>
              <Field label="Téléphone établissement">
                <Input
                  placeholder="+223 70 00 00 00"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </Field>
              <Field label="Adresse" className="sm:col-span-2" hint="Apparaît sur le reçu d'abonnement.">
                <Input
                  placeholder="Ex : Quartier ACI 2000, Bamako"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                />
              </Field>
              <Field label="Plan tarifaire">
                <Select
                  value={formData.planTarifaire}
                  onChange={(e) => setFormData({ ...formData, planTarifaire: e.target.value })}
                >
                  <option value="STARTER">Starter ({labelPlan('STARTER')})</option>
                  <option value="PRO">Pro ({labelPlan('PRO')})</option>
                </Select>
              </Field>
              <Field label="Date de fin d'abonnement" hint="Par défaut : 1 mois à compter de la création.">
                <Input
                  type="date"
                  value={
                    formData.dateExpirationAbonnement
                      ? formData.dateExpirationAbonnement.substring(0, 10)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateExpirationAbonnement: e.target.value ? `${e.target.value}T23:59:59` : '',
                    })
                  }
                />
              </Field>
            </fieldset>

            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-accent">
                2. {formData.typeEtablissement === 'CRECHE' ? 'Responsable de la crèche' : "Directeur de l'établissement"}
              </legend>
              <Field label={formData.typeEtablissement === 'CRECHE' ? 'Prénom du/de la responsable *' : 'Prénom du directeur *'}>
                <Input
                  required
                  value={formData.adminProfil.prenom}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      adminProfil: { ...formData.adminProfil, prenom: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label={formData.typeEtablissement === 'CRECHE' ? 'Nom du/de la responsable *' : 'Nom du directeur *'}>
                <Input
                  required
                  value={formData.adminProfil.nom}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      adminProfil: { ...formData.adminProfil, nom: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Nom d'utilisateur (login) *">
                <Input
                  placeholder="admin.julesverne"
                  required
                  value={formData.adminUsername}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      adminUsername: e.target.value,
                      adminEmail:
                        formData.adminEmail ||
                        `${e.target.value}@${formData.codeEtablissement || 'ecole'}.netaa-ecole.com`,
                    })
                  }
                />
              </Field>
              <Field label={formData.typeEtablissement === 'CRECHE' ? 'Email du/de la responsable' : 'Email du directeur'}>
                <Input
                  type="email"
                  placeholder="admin@julesverne.netaa-ecole.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                />
              </Field>
              <Field label="Mot de passe initial *" className="sm:col-span-2">
                <div className="relative">
                  <Input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.adminMotDePasse}
                    onChange={(e) => setFormData({ ...formData, adminMotDePasse: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showAdminPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showAdminPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
            </fieldset>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={submitting}>
                Créer l&apos;établissement &amp; l&apos;admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal coordonnées */}
      <Dialog open={!!editingEtab} onOpenChange={(open) => !open && setEditingEtab(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les coordonnées</DialogTitle>
          </DialogHeader>
          {editingEtab && (
            <form onSubmit={handleModifierInfos} className="space-y-4">
              <Field label="Logo de l'établissement" hint="Affiché dans le tableau de bord de l'école. PNG/JPG, fond de préférence transparent ou blanc.">
                <div className="flex items-center gap-3">
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/40">
                    {editingEtab.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editingEtab.logoUrl} alt="" className="size-full object-contain" />
                    ) : (
                      <Building2 className="size-6 text-muted-foreground" />
                    )}
                  </span>
                  <Input type="file" accept="image/*" onChange={handleLogoChange} disabled={logoUploading} className="flex-1" />
                </div>
              </Field>
              <Field label="Nom de l'établissement *">
                <Input
                  required
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email de contact">
                  <Input
                    type="email"
                    value={editForm.emailContact}
                    onChange={(e) => setEditForm({ ...editForm, emailContact: e.target.value })}
                  />
                </Field>
                <Field label="Téléphone">
                  <Input
                    value={editForm.telephone}
                    onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Adresse" hint="Apparaît sur le reçu d'abonnement.">
                <Input
                  placeholder="Ex : Quartier ACI 2000, Bamako"
                  value={editForm.adresse}
                  onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                />
              </Field>
              <Field label="Devise (monnaie)" hint="Utilisée pour les frais de scolarité, reçus et rapports financiers de cette école.">
                <Input
                  placeholder="Ex : FCFA, EUR, USD"
                  value={editForm.devise}
                  onChange={(e) => setEditForm({ ...editForm, devise: e.target.value })}
                />
              </Field>
              <Field label="Devise de l'école (slogan)" hint="Ex : Travail - Rigueur - Réussite. Affichée dans le tableau de bord de l'école.">
                <Input
                  placeholder="Ex : Travail - Rigueur - Réussite"
                  value={editForm.slogan}
                  onChange={(e) => setEditForm({ ...editForm, slogan: e.target.value })}
                />
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEtab(null)}>
                  Annuler
                </Button>
                <Button type="submit" loading={editSubmitting}>
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal renouvellement */}
      <Dialog open={!!renewingEtab} onOpenChange={(open) => !open && setRenewingEtab(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renouveler l&apos;abonnement</DialogTitle>
          </DialogHeader>
          {renewingEtab && (
            <form onSubmit={handleRenouveler} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{renewingEtab.nom}</strong> — à utiliser une fois le paiement de
                l&apos;école reçu (virement, Mobile Money…). La durée payée s&apos;ajoute à la date d&apos;expiration
                actuelle si elle n&apos;est pas encore dépassée ; sinon elle repart d&apos;aujourd&apos;hui.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Plan">
                  <Select
                    value={renewForm.planTarifaire}
                    onChange={(e) => setRenewForm({ ...renewForm, planTarifaire: e.target.value })}
                  >
                    <option value="STARTER">Starter — {labelPlan('STARTER')}</option>
                    <option value="PRO">Pro — {labelPlan('PRO')}</option>
                  </Select>
                </Field>
                <Field label="Durée payée">
                  <Select
                    value={String(renewForm.dureeMois)}
                    onChange={(e) => setRenewForm({ ...renewForm, dureeMois: parseInt(e.target.value, 10) })}
                  >
                    <option value="1">1 mois</option>
                    <option value="3">3 mois</option>
                    <option value="6">6 mois</option>
                    <option value="12">12 mois</option>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRenewingEtab(null)}>
                  Annuler
                </Button>
                <Button type="submit" loading={renewSubmitting}>
                  <RefreshCw /> Confirmer le renouvellement
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
