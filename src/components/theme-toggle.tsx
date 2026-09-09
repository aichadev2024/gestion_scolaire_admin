'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'netaa-theme';

/** Applique le thème (clair/sombre) et le mémorise. Sans dépendance externe. */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    let initial = false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      initial = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      /* stockage indisponible */
    }
    setDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={dark ? 'Mode clair' : 'Mode sombre'}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
