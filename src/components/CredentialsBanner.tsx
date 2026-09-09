'use client';

import { useState } from 'react';
import { Check, Copy, KeyRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  /** Ex. « Élève Awa Traoré créé ». */
  title: string;
  username?: string;
  password: string;
  onClose: () => void;
};

/**
 * Bandeau affiché une seule fois après la création d'un compte : identifiant + mot de passe
 * initial généré par le système. Le mot de passe n'est jamais renvoyé par l'API ensuite.
 */
export default function CredentialsBanner({ title, username, password, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copier = async () => {
    const texte = username ? `Identifiant : ${username}\nMot de passe : ${password}` : password;
    try {
      await navigator.clipboard.writeText(texte);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-success/30 bg-success/[0.08] px-5 py-4"
    >
      <div className="min-w-0 flex-1 basis-64">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
          <KeyRound className="size-4 text-success" /> {title}
        </div>
        <p className="mb-2 text-sm text-muted-foreground">
          Notez ces identifiants : le mot de passe ne sera plus affiché. L&apos;utilisateur devra le
          changer à la première connexion.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm text-foreground">
          {username && (
            <span>
              <span className="text-muted-foreground">Identifiant&nbsp;:</span> {username}
            </span>
          )}
          <span>
            <span className="text-muted-foreground">Mot de passe&nbsp;:</span> <strong>{password}</strong>
          </span>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copier}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copié' : 'Copier'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Fermer">
          <X /> Fermer
        </Button>
      </div>
    </div>
  );
}
