'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { notificationService } from '@/services/notification.service';

/**
 * Cloche de notifications du portail web — navigue vers une page dédiée au clic
 * (/dashboard/notifications), comme le fait déjà l'appli mobile avec son propre écran.
 * Un panneau déroulant débordait sur mobile web (largeur fixe, texte tronqué) : une
 * vraie page évite ce problème et reste cohérente avec le mobile.
 */
export default function NotificationBell() {
  const router = useRouter();
  const [nonLues, setNonLues] = useState(0);
  const userId = authService.getCurrentUser()?.id;

  useEffect(() => {
    if (!userId) return;
    const rafraichir = () => {
      notificationService.listerNonLues(userId).then((l) => setNonLues(l.length)).catch(() => {});
    };
    rafraichir();
    const intervalle = setInterval(rafraichir, 60_000);
    return () => clearInterval(intervalle);
  }, [userId]);

  if (!userId) return null;

  return (
    <button
      onClick={() => router.push('/dashboard/notifications')}
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
  );
}
