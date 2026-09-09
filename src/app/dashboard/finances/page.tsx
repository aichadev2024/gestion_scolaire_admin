'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, Pencil, Trash2, Wallet } from 'lucide-react';
import { financeService } from '@/services/finance.service';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { Classe, Eleve, FraisScolarite, Paiement } from '@/types';
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
const fcfa = (n?: number) => `${(n ?? 0).toLocaleString('fr-FR')} FCFA`;

export default function FinancesPage() {
  const [tab, setTab] = useState<'FRAIS' | 'PAIEMENTS'>('FRAIS');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [fraisList, setFraisList] = useState<FraisScolarite[]>([]);
  const [paiementsEleve, setPaiementsEleve] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [editingFrais, setEditingFrais] = useState<FraisScolarite | null>(null);
  const [fraisForm, setFraisForm] = useState(FRAIS_EMPTY);
  const [paiementForm, setPaiementForm] = useState(PAIEMENT_EMPTY);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cls, elv, frs] = await Promise.all([
        classeService.getClasses(),
        eleveService.getEleves(),
        financeService.getAllFrais().catch(() => []),
      ]);
      setClasses(cls);
      setEleves(elv);
      setFraisList(frs);
    } catch {
      toast.error('Impossible de charger les données financières.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!paiementForm.eleveId) {
      setPaiementsEleve([]);
      return;
    }
    financeService
      .getPaiementsByEleve(parseInt(paiementForm.eleveId))
      .then(setPaiementsEleve)
      .catch(() => toast.error('Impossible de charger les paiements.'));
  }, [paiementForm.eleveId]);

  const classeNom = (f: FraisScolarite) =>
    f.classeNom || classes.find((c) => c.id === f.classeId)?.nom || '—';

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
    setSubmitting(true);
    try {
      const payload = {
        classeId: parseInt(fraisForm.classeId),
        titre: fraisForm.titre,
        montant: parseFloat(fraisForm.montant),
        dateEcheance: fraisForm.dateEcheance,
      };
      if (editingFrais) {
        await financeService.updateFrais(editingFrais.id, payload);
        toast.success('Frais mis à jour.');
      } else {
        await financeService.createFrais(payload);
        toast.success('Frais créé.');
      }
      setFraisForm(FRAIS_EMPTY);
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
        fraisId: parseInt(paiementForm.fraisId),
        montantPaye: parseFloat(paiementForm.montantPaye),
        modePaiement: paiementForm.modePaiement,
        referenceTransaction: paiementForm.referenceTransaction || 'CASH',
      });
      toast.success('Paiement enregistré.');
      setPaiementForm((p) => ({ ...p, montantPaye: '', referenceTransaction: '' }));
      if (paiementForm.eleveId) {
        setPaiementsEleve(await financeService.getPaiementsByEleve(parseInt(paiementForm.eleveId)));
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
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
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
              <Field label="Classe concernée *">
                <Select value={fraisForm.classeId} onChange={(e) => setFraisForm({ ...fraisForm, classeId: e.target.value })} required>
                  <option value="">Sélectionner une classe</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Titre *">
                <Input value={fraisForm.titre} onChange={(e) => setFraisForm({ ...fraisForm, titre: e.target.value })} placeholder="Inscription, 1ère tranche…" required />
              </Field>
              <Field label="Montant (FCFA) *">
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
                <Button type="submit" loading={submitting}>{editingFrais ? 'Enregistrer' : 'Créer le frais'}</Button>
              </div>
            </form>
          </Card>

          {fraisList.length === 0 ? (
            <EmptyState icon={<Wallet />} title="Aucun frais configuré" description="Définissez les frais par classe et par tranche." />
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
                {fraisList.map((f) => (
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
        </div>
      )}

      {/* ─── Paiements ─── */}
      {tab === 'PAIEMENTS' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Encaisser un paiement</h2>
            <form onSubmit={handlePaiementSubmit} className="grid gap-4 sm:grid-cols-2">
              <Field label="Élève *">
                <Select value={paiementForm.eleveId} onChange={(e) => setPaiementForm({ ...paiementForm, eleveId: e.target.value })} required>
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
                    const found = fraisList.find((f) => String(f.id) === e.target.value);
                    setPaiementForm({
                      ...paiementForm,
                      fraisId: e.target.value,
                      montantPaye: found ? String(found.montant) : paiementForm.montantPaye,
                    });
                  }}
                  required
                >
                  <option value="">— Sélectionner un frais —</option>
                  {fraisList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.titre} ({classeNom(f)}) — {fcfa(f.montant)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Montant payé (FCFA) *">
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
    </div>
  );
}
