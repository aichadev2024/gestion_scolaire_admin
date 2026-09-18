'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, History, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  stockService,
  ArticleStock,
  MouvementStock,
  TypeMouvement,
} from '@/services/stock.service';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormError } from '@/components/ui/form-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CATEGORIES = ['Tenues', 'Papeterie', 'Fournitures scolaires', 'Entretien', 'Autre'];
const today = () => new Date().toISOString().slice(0, 10);

const emptyArticle = { nom: '', categorie: '', unite: 'unité', seuilAlerte: '0' };
const emptyMouvement = { quantite: '1', date: today(), motif: '', beneficiaire: '' };

function statutStock(a: ArticleStock): { label: string; variant: 'success' | 'warning' | 'destructive' } {
  if (a.quantite <= 0) return { label: 'Rupture', variant: 'destructive' };
  if (a.enAlerte) return { label: 'Stock bas', variant: 'warning' };
  return { label: 'OK', variant: 'success' };
}

export default function StockPage() {
  const [articles, setArticles] = useState<ArticleStock[]>([]);
  const [loading, setLoading] = useState(true);

  const [articleDialog, setArticleDialog] = useState(false);
  const [editing, setEditing] = useState<ArticleStock | null>(null);
  const [articleForm, setArticleForm] = useState(emptyArticle);

  const [mouvementArticle, setMouvementArticle] = useState<ArticleStock | null>(null);
  const [mouvementType, setMouvementType] = useState<TypeMouvement>('ENTREE');
  const [mouvementForm, setMouvementForm] = useState(emptyMouvement);

  const [historiqueArticle, setHistoriqueArticle] = useState<ArticleStock | null>(null);
  const [historique, setHistorique] = useState<MouvementStock[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setArticles(await stockService.listerArticles());
    } catch {
      toast.error('Impossible de charger le stock.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const enAlerte = useMemo(() => articles.filter((a) => a.enAlerte), [articles]);

  const openCreate = () => {
    setEditing(null);
    setArticleForm(emptyArticle);
    setError('');
    setArticleDialog(true);
  };

  const openEdit = (a: ArticleStock) => {
    setEditing(a);
    setArticleForm({
      nom: a.nom,
      categorie: a.categorie || '',
      unite: a.unite,
      seuilAlerte: String(a.seuilAlerte),
    });
    setError('');
    setArticleDialog(true);
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      nom: articleForm.nom.trim(),
      categorie: articleForm.categorie.trim() || undefined,
      unite: articleForm.unite.trim() || undefined,
      seuilAlerte: Number(articleForm.seuilAlerte) || 0,
    };
    try {
      if (editing) {
        await stockService.modifierArticle(editing.id, payload);
        toast.success('Article modifié.');
      } else {
        await stockService.creerArticle(payload);
        toast.success(`Article « ${payload.nom} » créé.`);
      }
      setArticleDialog(false);
      await fetchArticles();
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de l'enregistrement de l'article"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (a: ArticleStock) => {
    if (!window.confirm(`Supprimer « ${a.nom} » et tout son historique de mouvements ?`)) return;
    try {
      await stockService.supprimerArticle(a.id);
      toast.success('Article supprimé.');
      await fetchArticles();
    } catch (err) {
      toast.error(errorMessage(err, 'Suppression impossible.'));
    }
  };

  const openMouvement = (a: ArticleStock, type: TypeMouvement) => {
    setMouvementArticle(a);
    setMouvementType(type);
    setMouvementForm({ ...emptyMouvement, date: today() });
    setError('');
  };

  const handleSubmitMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mouvementArticle) return;
    setSubmitting(true);
    setError('');
    try {
      await stockService.enregistrerMouvement({
        articleId: mouvementArticle.id,
        type: mouvementType,
        quantite: Number(mouvementForm.quantite),
        date: mouvementForm.date || undefined,
        motif: mouvementForm.motif.trim() || undefined,
        beneficiaire: mouvementForm.beneficiaire.trim() || undefined,
      });
      toast.success(mouvementType === 'ENTREE' ? 'Entrée enregistrée.' : 'Sortie enregistrée.');
      setMouvementArticle(null);
      await fetchArticles();
    } catch (err) {
      setError(errorMessage(err, "Erreur lors de l'enregistrement du mouvement"));
    } finally {
      setSubmitting(false);
    }
  };

  const openHistorique = async (a: ArticleStock) => {
    setHistoriqueArticle(a);
    setHistorique([]);
    setLoadingHistorique(true);
    try {
      setHistorique(await stockService.listerMouvements(a.id));
    } catch {
      toast.error("Impossible de charger l'historique.");
    } finally {
      setLoadingHistorique(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Fournitures et consommables de l'établissement (tenues, cahiers, stylos, craie, papier…) : entrées, sorties et alertes de stock bas."
      >
        <Button onClick={openCreate}>
          <Plus /> Nouvel article
        </Button>
      </PageHeader>

      {enAlerte.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>{enAlerte.length} article{enAlerte.length > 1 ? 's' : ''} à réapprovisionner :</strong>{' '}
            {enAlerte.map((a) => a.nom).join(', ')}.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="Aucun article en stock"
          description="Ajoutez vos articles (cahiers, stylos, craie, tenues…) puis enregistrez les entrées et sorties."
          action={<Button onClick={openCreate}><Plus /> Ajouter un article</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">En stock</TableHead>
              <TableHead className="text-right">Seuil d&apos;alerte</TableHead>
              <TableHead>État</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((a) => {
              const s = statutStock(a);
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nom}</TableCell>
                  <TableCell>{a.categorie || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.quantite} {a.unite}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{a.seuilAlerte}</TableCell>
                  <TableCell>
                    <Badge variant={s.variant} className={s.variant === 'warning' ? 'dark:text-warning' : undefined}>
                      {s.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => openMouvement(a, 'ENTREE')}>
                        <ArrowDownToLine /> Entrée
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openMouvement(a, 'SORTIE')}>
                        <ArrowUpFromLine /> Sortie
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openHistorique(a)} aria-label={`Historique de ${a.nom}`}>
                        <History />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(a)} aria-label={`Modifier ${a.nom}`}>
                        <Pencil />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(a)} aria-label={`Supprimer ${a.nom}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={articleDialog} onOpenChange={setArticleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'article" : 'Nouvel article'}</DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          <form onSubmit={handleSubmitArticle} className="space-y-4">
            <Field label="Nom de l'article *">
              <Input
                value={articleForm.nom}
                onChange={(e) => setArticleForm({ ...articleForm, nom: e.target.value })}
                placeholder="Ex : Cahier 100 pages"
                required
              />
            </Field>
            <Field label="Catégorie">
              <Input
                list="categories-stock"
                value={articleForm.categorie}
                onChange={(e) => setArticleForm({ ...articleForm, categorie: e.target.value })}
                placeholder="Ex : Papeterie"
              />
              <datalist id="categories-stock">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Unité" hint="Ex : pièce, boîte, ramette">
                <Input
                  value={articleForm.unite}
                  onChange={(e) => setArticleForm({ ...articleForm, unite: e.target.value })}
                />
              </Field>
              <Field label="Seuil d'alerte" hint="Alerte quand le stock atteint ce niveau">
                <Input
                  type="number"
                  min={0}
                  value={articleForm.seuilAlerte}
                  onChange={(e) => setArticleForm({ ...articleForm, seuilAlerte: e.target.value })}
                />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setArticleDialog(false)}>Annuler</Button>
              <Button type="submit" loading={submitting}>{editing ? 'Enregistrer' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mouvementArticle !== null} onOpenChange={(open) => !open && setMouvementArticle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mouvementType === 'ENTREE' ? 'Entrée' : 'Sortie'} de stock — {mouvementArticle?.nom}
            </DialogTitle>
          </DialogHeader>
          <FormError message={error} />
          <form onSubmit={handleSubmitMouvement} className="space-y-4">
            <Field label="Type">
              <Select value={mouvementType} onChange={(e) => setMouvementType(e.target.value as TypeMouvement)}>
                <option value="ENTREE">Entrée (achat, réception)</option>
                <option value="SORTIE">Sortie (distribution, consommation)</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={`Quantité (${mouvementArticle?.unite ?? ''}) *`}
                hint={mouvementArticle ? `En stock : ${mouvementArticle.quantite}` : undefined}
              >
                <Input
                  type="number"
                  min={1}
                  value={mouvementForm.quantite}
                  onChange={(e) => setMouvementForm({ ...mouvementForm, quantite: e.target.value })}
                  required
                />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={mouvementForm.date}
                  onChange={(e) => setMouvementForm({ ...mouvementForm, date: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Motif">
              <Input
                value={mouvementForm.motif}
                onChange={(e) => setMouvementForm({ ...mouvementForm, motif: e.target.value })}
                placeholder={mouvementType === 'ENTREE' ? 'Ex : Achat fournisseur' : 'Ex : Distribution rentrée'}
              />
            </Field>
            {mouvementType === 'SORTIE' && (
              <Field label="Bénéficiaire" hint="Personne, classe ou service (facultatif)">
                <Input
                  value={mouvementForm.beneficiaire}
                  onChange={(e) => setMouvementForm({ ...mouvementForm, beneficiaire: e.target.value })}
                />
              </Field>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMouvementArticle(null)}>Annuler</Button>
              <Button type="submit" loading={submitting}>Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historiqueArticle !== null} onOpenChange={(open) => !open && setHistoriqueArticle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historique — {historiqueArticle?.nom}</DialogTitle>
          </DialogHeader>
          {loadingHistorique ? (
            <Skeleton className="h-24 w-full" />
          ) : historique.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun mouvement enregistré.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead>Motif / bénéficiaire</TableHead>
                  <TableHead>Par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historique.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === 'ENTREE' ? 'success' : 'secondary'}>
                        {m.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.type === 'ENTREE' ? '+' : '−'}
                      {m.quantite}
                    </TableCell>
                    <TableCell>{[m.motif, m.beneficiaire].filter(Boolean).join(' — ') || '—'}</TableCell>
                    <TableCell>{m.enregistreParNom || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
