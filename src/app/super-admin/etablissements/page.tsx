'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Ban, Building2, CheckCircle2, Eye, EyeOff, FileDown, Plus, Search } from 'lucide-react';
import {
  etablissementService,
  Etablissement,
  CreateEtablissementRequest,
} from '@/services/etablissement.service';
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

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

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
      toast.success('Établissement et compte administrateur créés.');
      setModalOpen(false);
      setFormData(EMPTY_FORM);
      chargerEtablissements();
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de la création de l'établissement."));
    } finally {
      setSubmitting(false);
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
    if (!e.dateExpirationAbonnement) return <span className="text-muted-foreground">1 an par défaut</span>;
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
                      <div className="font-semibold text-foreground">{e.nom}</div>
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
              <Field label="Nom de l'établissement *">
                <Input
                  placeholder="Ex : Lycée Jules Verne"
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
              <Field label="Plan tarifaire">
                <Select
                  value={formData.planTarifaire}
                  onChange={(e) => setFormData({ ...formData, planTarifaire: e.target.value })}
                >
                  <option value="STARTER">Starter (50 000 FCFA/mois)</option>
                  <option value="PRO">Pro (75 000 FCFA/mois)</option>
                </Select>
              </Field>
              <Field label="Date de fin d'abonnement" hint="Par défaut : 1 an à compter de la création.">
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
                2. Premier administrateur école
              </legend>
              <Field label="Prénom admin *">
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
              <Field label="Nom admin *">
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
              <Field label="Email de l'admin">
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
    </div>
  );
}
