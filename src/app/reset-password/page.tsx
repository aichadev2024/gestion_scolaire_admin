'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import Head from 'next/head';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide ou manquant.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (nouveauMotDePasse !== confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (nouveauMotDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({ token, nouveauMotDePasse });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-secondary)', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ color: '#047857', marginBottom: '1rem' }}>Mot de passe modifié ! ✅</h2>
          <p>Votre mot de passe a été mis à jour avec succès.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vous allez être redirigé vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--bg-secondary) 0%, #e0e5f5 100%)',
      padding: '2rem'
    }}>
      <Head>
        <title>Nouveau mot de passe | Netaa</title>
      </Head>

      <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
            Nouveau mot de passe
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
        </div>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        {!token ? (
          <div style={{ textAlign: 'center' }}>
            <Link href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Retour à la connexion</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="nouveau">Nouveau mot de passe</label>
              <input
                id="nouveau"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={nouveauMotDePasse}
                onChange={e => setNouveauMotDePasse(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirm">Confirmer le mot de passe</label>
              <input
                id="confirm"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={confirmMotDePasse}
                onChange={e => setConfirmMotDePasse(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Enregistrement...' : 'Mettre à jour mon mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Chargement...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
