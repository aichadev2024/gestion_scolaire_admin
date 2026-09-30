'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { notificationService, NotificationItem } from '@/services/notification.service';
import { errorMessage } from '@/lib/errors';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Cloche de notifications du portail web — absente jusqu'ici : les notifications (absences,
 * incidents, paiements, sujets de devoirs validés/rejetés...) n'étaient visibles que côté
 * mobile. Réutilise les mêmes endpoints /api/notifications déjà utilisés par l'appli.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const userId = authService.getCurrentUser()?.id;

  const rafraichirCompteur = async () => {
    if (!userId) return;
    try {
      const nl = await notificationService.listerNonLues(userId);
      setNonLues(nl.length);
    } catch {
      // pas grave, juste le badge
    }
  };

  useEffect(() => {
    rafraichirCompteur();
    const intervalle = setInterval(rafraichirCompteur, 60_000);
    return () => clearInterval(intervalle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    notificationService
      .lister(userId)
      .then(setItems)
      .catch(() => toast.error('Impossible de charger les notifications.'))
      .finally(() => setLoading(false));
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;
    const surClicExterieur = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', surClicExterieur);
    return () => document.removeEventListener('mousedown', surClicExterieur);
  }, [open]);

  const marquerLue = async (n: NotificationItem) => {
    if (n.estLu) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, estLu: true } : x)));
    setNonLues((c) => Math.max(0, c - 1));
    try {
      await notificationService.marquerLue(n.id);
    } catch {
      // l'indicateur visuel reste correct même si la synchro échoue
    }
  };

  const supprimer = async (n: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const etaitNonLue = !n.estLu;
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (etaitNonLue) setNonLues((c) => Math.max(0, c - 1));
    try {
      await notificationService.supprimer(n.id);
    } catch (err) {
      toast.error(errorMessage(err, 'Suppression impossible.'));
    }
  };

  const toutEffacer = async () => {
    if (items.length === 0) return;
    if (!confirm(`Supprimer les ${items.length} notification(s) ?`)) return;
    const ancien = items;
    setItems([]);
    setNonLues(0);
    try {
      await notificationService.toutSupprimer();
      toast.success('Notifications effacées.');
    } catch (err) {
      setItems(ancien);
      toast.error(errorMessage(err, 'Suppression impossible.'));
    }
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {nonLues > 0 && (
          <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[0.6rem] font-bold text-destructive-foreground">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {items.length > 0 && (
              <button
                onClick={toutEffacer}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> Tout effacer
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune notification.</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => marquerLue(n)}
                  className={`cursor-pointer border-b border-border px-4 py-3 last:border-0 hover:bg-secondary/50 ${!n.estLu ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {!n.estLu && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                      <div>
                        <p className={`text-sm ${!n.estLu ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>{n.titre}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.contenu}</p>
                        <p className="mt-1 text-[0.65rem] text-muted-foreground/80">{fmtDate(n.dateCreation)}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => supprimer(n, e)}
                      className="shrink-0 rounded p-1 text-muted-foreground/60 hover:bg-secondary hover:text-destructive"
                      aria-label="Supprimer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
