'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, Pencil, Phone, Trash2, TriangleAlert, Wallet } from 'lucide-react';
import { financeService, SituationFinanciere } from '@/services/finance.service';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { authService } from '@/services/auth.service';
import { Classe, Eleve, FraisScolarite, Paiement, RetardPaiement } from '@/types';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const FRAIS_EMPTY = { classeId: '', titre: '', montant: '', dateEcheance: '' };
const PAIEMENT_EMPTY = { eleveId: '', fraisId: '', montantPaye: '', modePaiement: 'ESPECES', referenceTransaction: '' };
/** Valeur du sélecteur « Frais concerné » pour un paiement global (aucun frais précis côté backend). */
const PAIEMENT_GLOBAL = 'GLOBAL';
const fcfa = (n?: number) => `${(n ?? 0).toLocaleString('fr-FR')} ${authService.getCurrentUser()?.etablissementDevise || 'FCFA'}`;

export default function FinancesPage() {
  const [tab, setTab] = useState<'FRAIS' | 'PAIEMENTS' | 'RETARDS'>('FRAIS');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [fraisList, setFraisList] = useState<FraisScolarite[]>([]);
  const [paiementsEleve, setPaiementsEleve] = useState<Paiement[]>([]);
  const [situation, setSituation] = useState<SituationFinanciere | null>(null);
  const [retards, setRetards] = useState<RetardPaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [editingFrais, setEditingFrais] = useState<FraisScolarite | null>(null);
  const [fraisForm, setFraisForm] = useState(FRAIS_EMPTY);
  // Création d'un frais : une même grille s'applique en général à toutes les sous-classes d'un niveau
  // (10ème CG1, CG2… ; 11ème Science, SES, Lettre…) — on coche donc plusieurs classes d'un coup.
  const [classesCochees, setClassesCochees] = useState<number[]>([]);
  const [filtreClassesFrais, setFiltreClassesFrais] = useState('');
  const [paiementForm, setPaiementForm] = useState(PAIEMENT_EMPTY);
  const [filtreClasseId, setFiltreClasseId] = useState('');

  const eleveSelectionnePaiement = eleves.find((e) => String(e.id) === paiementForm.eleveId);
  const fraisPourEleveSelectionne = eleveSelectionnePaiement
    ? fraisList.filter((f) => (f.classeId ?? classes.find((c) => c.nom === f.classeNom)?.id) === eleveSelectionnePaiement.classeId)
    : fraisList;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cls, elv, frs, rtd] = await Promise.all([
        classeService.getClasses(),
        eleveService.getEleves(),
        financeService.getAllFrais().catch(() => []),
        financeService.getRetardsPaiement().catch(() => []),
      ]);
      setClasses(cls);
      setEleves(elv);
      setFraisList(frs);
      setRetards(rtd);
    } catch {
      toast.error('Impossible de charger les données financières.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chargerPaiementsEtSituation = async (eleveId: number) => {
    const [paiements, sit] = await Promise.all([
      financeService.getPaiementsByEleve(eleveId),
      financeService.getSituation(eleveId).catch(() => null),
    ]);
    setPaiementsEleve(paiements);
    setSituation(sit);
  };

  useEffect(() => {
    if (!paiementForm.eleveId) {
      setPaiementsEleve([]);
      setSituation(null);
      return;
    }
    chargerPaiementsEtSituation(parseInt(paiementForm.eleveId)).catch(() =>
      toast.error('Impossible de charger les paiements.'),
    );
  }, [paiementForm.eleveId]);

  /** Reste à payer sur un frais (tranche) : ce qui n'est pas encore couvert, jamais son montant plein si déjà entamé. */
  const resteSurFrais = (f: FraisScolarite): number =>
    situation?.lignes.find((l) => l.fraisId === f.id)?.reste ?? f.montant;

  const classeNom = (f: FraisScolarite) =>
    f.classeNom || classes.find((c) => c.id === f.classeId)?.nom || '—';

  const resolvedClasseId = (f: FraisScolarite) =>
    f.classeId || (f.classeNom ? classes.find((c) => c.nom === f.classeNom)?.id : undefined);

  const fraisFiltres = filtreClasseId
    ? fraisList.filter((f) => String(resolvedClasseId(f) ?? '') === filtreClasseId)
    : fraisList;

  const openEditFrais = (f: FraisScolarite) => {
    setEditingFrais(f);
    const resolvedClasseId =
      f.classeId || (f.classeNom ? classes.find((c) => c.nom === f.classeNom)?.id : '') || '';
    setFraisForm({
      classeId: String(resolvedClasseId),
      titre: f.titre,
      montant: String(f.montant),
      dateEcheance: f.dateEcheance ? f.dateEcheance.substring(0, 10) : '',
    });
  };

  const handleFraisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFrais && classesCochees.length === 0) {
      toast.error('Cochez au moins une classe.');
      return;
    }
    setSubmitting(true);
    try {
      const base = {
        titre: fraisForm.titre.trim(),
        montant: parseFloat(fraisForm.montant),
        dateEcheance: fraisForm.dateEcheance,
      };
      if (editingFrais) {
        await financeService.updateFrais(editingFrais.id, { ...base, classeId: parseInt(fraisForm.classeId) });
        toast.success('Frais mis à jour.');
      } else {
        // Une classe qui a déjà ce même titre est ignorée (évite les doublons si on relance).
        const dejaLa = new Set(
          fraisList
            .filter((f) => f.titre.trim().toLowerCase() === base.titre.toLowerCase())
            .map((f) => resolvedClasseId(f)),
        );
        const aCreer = classesCochees.filter((id) => !dejaLa.has(id));
        const ignorees = classesCochees.length - aCreer.length;
        const resultats = await Promise.allSettled(
          aCreer.map((classeId) => financeService.createFrais({ ...base, classeId })),
        );
        const echecs = resultats.filter((r) => r.status === 'rejected').length;
        const crees = aCreer.length - echecs;
        if (crees > 0) toast.success(`« ${base.titre} » créé pour ${crees} classe${crees > 1 ? 's' : ''}.`);
        if (ignorees > 0) toast.info(`${ignorees} classe${ignorees > 1 ? 's avaient' : ' avait'} déjà « ${base.titre} » : ignorée${ignorees > 1 ? 's' : ''}.`);
        if (echecs > 0) toast.error(`${echecs} création${echecs > 1 ? 's ont' : ' a'} échoué : réessayez pour ces classes.`);
        if (crees === 0 && echecs > 0) return;
      }
      setFraisForm(FRAIS_EMPTY);
      setClassesCochees([]);
      setEditingFrais(null);
      await fetchData();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la sauvegarde du frais'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFrais = async (f: FraisScolarite) => {
    if (!confirm(`Supprimer la grille tarifaire « ${f.titre} » ?`)) return;
    try {
      await financeService.deleteFrais(f.id);
      toast.success('Frais supprimé.');
      await fetchData();
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression du frais'));
    }
  };

  const handlePaiementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await financeService.createPaiement({
        eleveId: parseInt(paiementForm.eleveId),
        fraisId: paiementForm.fraisId === PAIEMENT_GLOBAL ? undefined : parseInt(paiementForm.fraisId),
        montantPaye: parseFloat(paiementForm.montantPaye),
        modePaiement: paiementForm.modePaiement,
        referenceTransaction: paiementForm.referenceTransaction || 'CASH',
      });
      toast.success('Paiement enregistré.');
      setPaiementForm((p) => ({ ...p, fraisId: '', montantPaye: '', referenceTransaction: '' }));
      if (paiementForm.eleveId) {
        await chargerPaiementsEtSituation(parseInt(paiementForm.eleveId));
      }
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de l'enregistrement du paiement"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadRecu = async (numeroRecu: string) => {
    try {
      setDownloading(numeroRecu);
      const blob = await financeService.telechargerRecuPdf(numeroRecu);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-${numeroRecu}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Impossible de télécharger le reçu PDF.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Finances & comptabilité" description="Frais de scolarité, encaissements et reçus PDF." />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Finances & comptabilité" description="Frais de scolarité, encaissements et génération de reçus PDF." />

      <div className="mb-6 flex gap-1 border-b border-border">
        {(
          [
            ['FRAIS', 'Frais de scolarité'],
            ['PAIEMENTS', 'Encaissements & reçus'],
            ['RETARDS', 'Retards de paiement'],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            {t === 'RETARDS' && retards.length > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[0.65rem]">{retards.length}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* ─── Frais ─── */}
      {tab === 'FRAIS' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg font-bold">
              {editingFrais ? `Modifier le frais « ${editingFrais.titre} »` : 'Nouveau frais de scolarité'}
            </h2>
            <form onSubmit={handleFraisSubmit} className="grid gap-4 sm:grid-cols-2">
              {editingFrais ? (
                <Field label="Classe concernée *">
                  <Select value={fraisForm.classeId} onChange={(e) => setFraisForm({ ...fraisForm, classeId: e.target.value })} required>
                    <option value="">Sélectionner une classe</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <div className="sm:col-span-2">
                  <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                    <span className="text-sm font-medium">
                      Classes concernées * <span className="font-normal text-muted-foreground">({classesCochees.length} cochée{classesCochees.length > 1 ? 's' : ''})</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={filtreClassesFrais}
                        onChange={(e) => setFiltreClassesFrais(e.target.value)}
                        placeholder="Filtrer : 10ème, 11ème, T…"
                        className="h-8 w-48"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const visibles = classes.filter((c) => c.nom.toLowerCase().includes(filtreClassesFrais.trim().toLowerCase())).map((c) => c.id);
                          setClassesCochees((prev) => Array.from(new Set([...prev, ...visibles])));
                        }}
                      >
                        Cocher les classes affichées
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setClassesCochees([])}>
                        Tout décocher
                      </Button>
                    </div>
                  </div>
                  <div className="grid max-h-44 gap-1.5 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {classes
                      .filter((c) => c.nom.toLowerCase().includes(filtreClassesFrais.trim().toLowerCase()))
                      .map((c) => (
                        <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={classesCochees.includes(c.id)}
                            onChange={(e) =>
                              setClassesCochees((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                            }
                          />
                          {c.nom}
                        </label>
                      ))}
                    {classes.length === 0 && <span className="text-sm text-muted-foreground">Aucune classe créée.</span>}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Le même frais est créé pour chaque classe cochée. Astuce : tapez « 10ème » dans le filtre puis « Cocher les classes affichées » pour prendre toutes les sous-classes d&apos;un niveau.
                  </p>
                </div>
              )}
              <Field label="Titre *">
                <Input value={fraisForm.titre} onChange={(e) => setFraisForm({ ...fraisForm, titre: e.target.value })} placeholder="Inscription, 1ère tranche…" required />
              </Field>
              <Field label={`Montant (${authService.getCurrentUser()?.etablissementDevise || 'FCFA'}) *`}>
                <Input type="number" value={fraisForm.montant} onChange={(e) => setFraisForm({ ...fraisForm, montant: e.target.value })} required />
              </Field>
              <Field label="Date d'échéance *">
                <Input type="date" value={fraisForm.dateEcheance} onChange={(e) => setFraisForm({ ...fraisForm, dateEcheance: e.target.value })} required />
              </Field>
              <div className="flex justify-end gap-2 sm:col-span-2">
                {editingFrais && (
                  <Button type="button" variant="outline" onClick={() => { setEditingFrais(null); setFraisForm(FRAIS_EMPTY); }}>
                    Annuler
                  </Button>
                )}
                <Button type="submit" loading={submitting}>{editingFrais ? 'Enregistrer' : classesCochees.length > 1 ? `Créer le frais pour ${classesCochees.length} classes` : 'Créer le frais'}</Button>
              </div>
            </form>
          </Card>

          {fraisList.length === 0 ? (
            <EmptyState icon={<Wallet />} title="Aucun frais configuré" description="Définissez les frais par classe et par tranche." />
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Filtrer par classe" className="min-w-56">
                  <Select value={filtreClasseId} onChange={(e) => setFiltreClasseId(e.target.value)}>
                    <option value="">— Toutes les classes —</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </Select>
                </Field>
                {filtreClasseId && (
                  <span className="rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                    {fraisFiltres.length} frais
                  </span>
                )}
              </div>

              {fraisFiltres.length === 0 ? (
                <EmptyState icon={<Wallet />} title="Aucun frais pour cette classe" />
              ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf.</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fraisFiltres.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">#{f.id}</span>
                    </TableCell>
                    <TableCell className="font-medium">{f.titre}</TableCell>
                    <TableCell className="text-muted-foreground">{classeNom(f)}</TableCell>
                    <TableCell className="font-semibold text-success tabular-nums">{fcfa(f.montant)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => openEditFrais(f)}>
                          <Pencil /> Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteFrais(f)}
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
            </>
          )}
        </div>
      )}

      {/* ─── Paiements ─── */}
      {tab === 'PAIEMENTS' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Encaisser un paiement</h2>
            {situation && !situation.aucunFraisDefini && (
              <div className="mb-4 grid gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm sm:grid-cols-3">
                <div><div className="text-xs text-muted-foreground">Total dû</div><div className="font-semibold tabular-nums">{fcfa(situation.totalDu)}</div></div>
                <div><div className="text-xs text-muted-foreground">Déjà payé</div><div className="font-semibold tabular-nums text-success">{fcfa(situation.totalPaye)}</div></div>
                <div><div className="text-xs text-muted-foreground">Reste à payer</div><div className={cn('font-semibold tabular-nums', situation.reste > 0 ? 'text-destructive' : situation.scolariteDefinie ? 'text-success' : 'text-foreground')}>{fcfa(situation.reste)}</div></div>
              </div>
            )}
            {situation && !situation.aucunFraisDefini && (
              <div className="mb-4 space-y-3">
                <div className="divide-y divide-border rounded-xl border border-border text-sm">
                  {situation.lignes.map((l) => (
                    <div key={l.fraisId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <span className="font-medium">{l.titre}</span>
                      <span className="flex items-center gap-3 text-muted-foreground">
                        <span className="tabular-nums">{fcfa(l.paye)} / {fcfa(l.montant)}</span>
                        <Badge variant={l.statut === 'PAYE' ? 'success' : l.statut === 'EN_RETARD' ? 'destructive' : 'warning'}>
                          {{ PAYE: 'Payé', PARTIEL: 'Partiel', A_PAYER: 'À payer', EN_RETARD: 'En retard' }[l.statut]}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
                {situation.scolariteDefinie && situation.reste <= 0 && (
                  <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    Toute la scolarité de cet élève est payée.
                  </p>
                )}
                {!situation.scolariteDefinie && (
                  <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
                    <strong>Seule l&apos;inscription est enregistrée pour cette classe</strong>
                    {situation.reste <= 0 ? ' et elle est payée' : ''}. Le reste de la scolarité (tranches, mensualités)
                    n&apos;est pas encore défini : « Reste à payer » ne le compte donc pas. Créez-le dans l&apos;onglet
                    « Frais de scolarité » (une ligne par tranche, avec son montant et sa date d&apos;échéance) pour pouvoir
                    l&apos;encaisser.
                  </p>
                )}
              </div>
            )}
            <form onSubmit={handlePaiementSubmit} className="grid gap-4 sm:grid-cols-2">
              <Field label="Élève *">
                <Select
                  value={paiementForm.eleveId}
                  onChange={(e) => setPaiementForm({ ...paiementForm, eleveId: e.target.value, fraisId: '', montantPaye: '' })}
                  required
                >
                  <option value="">— Sélectionner un élève —</option>
                  {eleves.map((e) => (
                    <option key={e.id} value={e.id}>{e.matricule} — {e.profil.nom} {e.profil.prenom}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Frais concerné *">
                <Select
                  value={paiementForm.fraisId}
                  onChange={(e) => {
                    const valeur = e.target.value;
                    const found = fraisPourEleveSelectionne.find((f) => String(f.id) === valeur);
                    // Paiement par tranche : pré-rempli avec ce qu'il reste sur ce frais ; global : reste total.
                    const propose = valeur === PAIEMENT_GLOBAL
                      ? (situation?.reste ?? fraisPourEleveSelectionne.reduce((t, f) => t + f.montant, 0))
                      : found ? resteSurFrais(found) : undefined;
                    setPaiementForm({
                      ...paiementForm,
                      fraisId: valeur,
                      montantPaye: propose !== undefined && propose > 0 ? String(propose) : paiementForm.montantPaye,
                    });
                  }}
                  disabled={!paiementForm.eleveId}
                  required
                >
                  <option value="">
                    {paiementForm.eleveId ? '— Sélectionner un frais —' : '— Choisir d’abord un élève —'}
                  </option>
                  {fraisPourEleveSelectionne.length > 0 && (
                    <option value={PAIEMENT_GLOBAL}>
                      {situation && situation.reste <= 0
                        ? (situation.scolariteDefinie ? 'Paiement global — tout est déjà payé' : 'Paiement global — aucune tranche définie pour le moment')
                        : `Paiement global — toute la scolarité (${fcfa(situation?.reste ?? fraisPourEleveSelectionne.reduce((t, f) => t + f.montant, 0))} restant)`}
                    </option>
                  )}
                  {fraisPourEleveSelectionne.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.titre} ({classeNom(f)}) — {fcfa(f.montant)}
                      {resteSurFrais(f) !== f.montant ? ` · reste ${fcfa(resteSurFrais(f))}` : ''}
                    </option>
                  ))}
                </Select>
                {paiementForm.fraisId === PAIEMENT_GLOBAL && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Un seul reçu : le montant est réparti automatiquement sur les échéances, de la plus ancienne à la plus récente.
                  </p>
                )}
                {paiementForm.eleveId && fraisPourEleveSelectionne.length === 0 && (
                  <p className="mt-1 text-xs text-warning-foreground">Aucun frais configuré pour la classe de cet élève.</p>
                )}
              </Field>
              <Field label={`Montant payé (${authService.getCurrentUser()?.etablissementDevise || 'FCFA'}) *`}>
                <Input type="number" value={paiementForm.montantPaye} onChange={(e) => setPaiementForm({ ...paiementForm, montantPaye: e.target.value })} required />
              </Field>
              <Field label="Mode de paiement">
                <Select value={paiementForm.modePaiement} onChange={(e) => setPaiementForm({ ...paiementForm, modePaiement: e.target.value })}>
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="VIREMENT">Virement</option>
                </Select>
              </Field>
              {paiementForm.modePaiement !== 'ESPECES' && (
                <Field label="Référence de la transaction *" className="sm:col-span-2">
                  <Input value={paiementForm.referenceTransaction} onChange={(e) => setPaiementForm({ ...paiementForm, referenceTransaction: e.target.value })} required />
                </Field>
              )}
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" loading={submitting}>Enregistrer &amp; générer le reçu</Button>
              </div>
            </form>
          </Card>

          {paiementForm.eleveId && (
            <div>
              <h3 className="mb-3 font-display text-base font-bold">Historique des paiements</h3>
              {paiementsEleve.length === 0 ? (
                <EmptyState icon={<Wallet />} title="Aucun paiement pour cet élève" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead className="text-right">Reçu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paiementsEleve.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-success tabular-nums">{fcfa(p.montantPaye)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.modePaiement}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.referenceTransaction || 'CASH'}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              loading={downloading === p.numeroRecu}
                              onClick={() => handleDownloadRecu(p.numeroRecu)}
                            >
                              <Download /> Reçu PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Retards de paiement ─── */}
      {tab === 'RETARDS' && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <TriangleAlert className="size-5 text-destructive" />
            <h2 className="font-display text-lg font-bold">Parents en retard de paiement</h2>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Élèves dont au moins une échéance de frais est dépassée depuis 1 jour ou plus, avec un solde encore dû.
          </p>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : retards.length === 0 ? (
            <EmptyState icon={<Wallet />} title="Aucun retard" description="Tous les frais échus sont couverts." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Échéance la plus ancienne</TableHead>
                  <TableHead>Retard</TableHead>
                  <TableHead className="text-right">Montant dû</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retards.map((r) => (
                  <TableRow key={r.eleveId}>
                    <TableCell>
                      <div className="font-medium">{r.eleveNom} {r.elevePrenom}</div>
                      <div className="font-mono text-xs text-muted-foreground">{r.matricule}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning">{r.classeNom}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.parentNom ? `${r.parentNom} ${r.parentPrenom ?? ''}` : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {r.parentTelephone ? (
                        <a href={`tel:${r.parentTelephone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                          <Phone className="size-3.5" /> {r.parentTelephone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.echeanceLaPlusAncienne).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{r.joursRetard} jour{r.joursRetard > 1 ? 's' : ''}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">{fcfa(r.montantDu)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
