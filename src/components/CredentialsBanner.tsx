'use client';

import { useState } from 'react';

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
      style={{
        border: '1px solid rgba(5, 205, 153, 0.4)',
        background: 'rgba(5, 205, 153, 0.08)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          ✅ {title}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Notez ces identifiants : le mot de passe ne sera plus affiché. L&apos;utilisateur devra le
          changer à la première connexion.
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem 1.25rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.95rem',
            color: 'var(--text-primary)',
          }}
        >
          {username && (
            <span>
              <span style={{ color: 'var(--text-secondary)' }}>Identifiant&nbsp;:</span> {username}
            </span>
          )}
          <span>
            <span style={{ color: 'var(--text-secondary)' }}>Mot de passe&nbsp;:</span>{' '}
            <strong>{password}</strong>
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button type="button" onClick={copier} className="btn-secondary" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}>
          {copied ? 'Copié ✓' : 'Copier'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
          aria-label="Fermer"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
