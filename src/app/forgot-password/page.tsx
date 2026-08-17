'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import Head from 'next/head';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devToken, setDevToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setDevToken('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setSuccessMsg(res.message);
      if (res.dev_token) {
        setDevToken(res.dev_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la demande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

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
        <title>Mot de passe oublié | Netaa</title>
      </Head>

      <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
            Mot de passe oublié ?
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Entrez votre adresse email pour recevoir un lien de réinitialisation. <br/>
            <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Note : Si vous n'avez pas d'adresse email associée à votre compte, veuillez contacter l'administration.</span>
          </p>
        </div>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        {successMsg && <div style={{ backgroundColor: '#d1fae5', color: '#047857', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{successMsg}</div>}

        {/* DEVELOPER MODE ONLY - TO BE REMOVED IN PROD */}
        {devToken && (
          <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid #fcd34d' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🔧 Mode Dev (Mail non configuré)</p>
            <p>Voici votre lien de réinitialisation généré :</p>
            <Link href={`/reset-password?token=${devToken}`} style={{ color: '#0369a1', wordBreak: 'break-all' }}>
              /reset-password?token={devToken}
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Adresse Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/login" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
