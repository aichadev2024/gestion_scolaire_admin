'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, MessageSquareReply, Trash2, X } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { notificationService, NotificationItem } from '@/services/notification.service';
import { errorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aRepondre, setARepondre] = useState<NotificationItem | null>(null);
  const [reponseTexte, setReponseTexte] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userId = authService.getCurrentUser()?.id;

  const charger = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setItems(await notificationService.lister(userId));
    } catch {
      toast.error('Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const marquerLue = async (n: NotificationItem) => {
    if (n.estLu) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, estLu: true } : x)));
    try {
      await notificationService.marquerLue(n.id);
    } catch {
      // l'indicateur visuel reste correct même si la synchro échoue
    }
  };

  const supprimer = async (n: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    try {
      await notificationService.supprimer(n.id);
    } catch (err) {
      toast.error(errorMessage(err, 'Suppression impossible.'));
      await charger();
    }
  };

  const toutEffacer = async () => {
    if (items.length === 0) return;
    if (!confirm(`Supprimer les ${items.length} notification(s) ?`)) return;
    const ancien = items;
    setItems([]);
    try {
      await notificationService.toutSupprimer();
      toast.success('Notifications effacées.');
    } catch (err) {
      setItems(ancien);
      toast.error(errorMessage(err, 'Suppression impossible.'));
    }
  };

  const ouvrirReponse = (n: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setARepondre(n);
    setReponseTexte(n.reponseContenu || '');
  };

  const envoyerReponse = async () => {
    if (!aRepondre || !reponseTexte.trim()) return;
    setSubmitting(true);
    try {
      await notificationService.repondre(aRepondre.id, reponseTexte.trim());
      toast.success('Réponse envoyée.');
      setItems((prev) =>
        prev.map((x) => (x.id === aRepondre.id ? { ...x, reponseContenu: reponseTexte.trim(), reponseDate: new Date().toISOString() } : x)),
      );
      setARepondre(null);
    } catch (err) {
      toast.error(errorMessage(err, "Impossible d'envoyer la réponse."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Notifications" description={loading ? 'Chargement…' : `${items.length} notification(s)`}>
        {items.length > 0 && (
          <Button variant="outline" onClick={toutEffacer}>
            <Trash2 /> Tout effacer
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Bell />} title="Aucune notification" description="Vous êtes à jour." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => marquerLue(n)}
              className={`cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30 ${!n.estLu ? 'border-primary/40 bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {!n.estLu && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                  <div>
                    <p className={`text-sm ${!n.estLu ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>{n.titre}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{n.contenu}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground/80">{fmtDate(n.dateCreation)}</p>
                    {n.reponseContenu && (
                      <div className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                        <span className="font-semibold text-foreground">Votre réponse : </span>
                        {n.reponseContenu}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={(e) => ouvrirReponse(n, e)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                    aria-label="Répondre"
                    title="Répondre"
                  >
                    <MessageSquareReply className="size-4" />
                  </button>
                  <button
                    onClick={(e) => supprimer(n, e)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={aRepondre !== null} onOpenChange={(open) => !open && setARepondre(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Répondre — {aRepondre?.titre}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reponseTexte}
            onChange={(e) => setReponseTexte(e.target.value)}
            rows={4}
            placeholder="Votre réponse — une justification si besoin, ou un simple message…"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setARepondre(null)}>Annuler</Button>
            <Button onClick={envoyerReponse} loading={submitting} disabled={!reponseTexte.trim()}>Envoyer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
