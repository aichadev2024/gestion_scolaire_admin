'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, LoginCredentials } from '@/services/auth.service';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({ identifiant: '', motDePasse: '' });
  const [error, setError] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [superAdminExists, setSuperAdminExists] = useState(false);

  // Étape OTP Première Connexion
  const [requiresOtp, setRequiresOtp] = useState<boolean>(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpLoading, setOtpLoading] = useState<boolean>(false);

  useEffect(() => {
    authService.checkSetup().then(res => {
      if (res?.setupRequired) {
        setSetupRequired(true);
      }
    }).catch(console.error);

    authService.checkSuperAdminExists().then(res => {
      if (res?.exists) {
        setSuperAdminExists(true);
      }
    }).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await authService.login(credentials);

      if (res.requiresOtp) {
        setRequiresOtp(true);
        setOtpUserId(res.utilisateurId);
        setInfoMessage(res.message || "Un code de validation OTP à 6 chiffres a été envoyé par mail.");
        setLoading(false);
        return;
      }

      if (res.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setOtpLoading(true);

    try {
      if (!otpUserId) throw new Error("Identifiant utilisateur manquant.");
      const res = await authService.verifyOtp(otpUserId, otpCode);
      if (res.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code OTP invalide ou expiré.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpUserId) return;
    setError('');
    setInfoMessage('');
    setOtpLoading(true);
    try {
      const res = await authService.resendOtp(otpUserId);
      setInfoMessage(res.message || "Un nouveau code OTP a été envoyé à votre adresse email.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi du nouveau code OTP.");
    } finally {
      setOtpLoading(false);
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
        <title>Connexion | Netaa</title>
      </Head>

      <div className="glass-card" style={{ maxWidth: '450px', width: '100%', position: 'relative', overflow: 'hidden' }}>

        {/* Decorative background shapes */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'var(--primary-color)',
          borderRadius: '50%',
          opacity: 0.1,
          zIndex: 0
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '100px',
          height: '100px',
          background: 'var(--secondary-color)',
          borderRadius: '50%',
          opacity: 0.1,
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/logo.png"
              alt="Netaa Logo"
              style={{ height: '60px', width: 'auto', marginBottom: '1rem', objectFit: 'contain' }}
            />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
              Netaa
            </h1>
            <p style={{ color: 'var(--secondary-color)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              GESTION SCOLAIRE NUMÉRIQUE
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Connectez-vous à votre espace d'administration
            </p>
          </div>

          {setupRequired && (
            <div style={{
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--primary-color)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              textAlign: 'center',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              ⚙️ Premier lancement détecté. Vous pouvez configurer le <Link href="/setup" style={{ fontWeight: 700, textDecoration: 'underline' }}>premier Admin d'école</Link> ou créer un <Link href="/setup-super-admin" style={{ fontWeight: 700, textDecoration: 'underline' }}>Super-Admin</Link>.
            </div>
          )}

          {infoMessage && (
            <div style={{
              backgroundColor: 'rgba(5, 205, 153, 0.12)',
              color: '#05cd99',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              textAlign: 'center',
              fontWeight: 600,
              border: '1px solid rgba(5, 205, 153, 0.3)'
            }}>
              📧 {infoMessage}
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: 'rgba(238, 93, 80, 0.1)',
              color: 'var(--danger)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              textAlign: 'center',
              border: '1px solid rgba(238, 93, 80, 0.2)'
            }}>
              {error}
            </div>
          )}

          {requiresOtp ? (
            <form onSubmit={handleOtpSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔑</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>Validation Première Connexion</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Veuillez saisir le code OTP à 6 chiffres envoyé par mail pour activer votre accès.
                </p>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="otpCode" style={{ textAlign: 'center', display: 'block', fontWeight: 700 }}>
                  Code OTP à 6 chiffres
                </label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  name="otpCode"
                  className="input-field"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{
                    fontSize: '1.75rem',
                    letterSpacing: '0.4em',
                    textAlign: 'center',
                    fontWeight: 800,
                    color: 'var(--primary-color)',
                    padding: '0.75rem'
                  }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={otpLoading || otpCode.length !== 6} style={{ marginTop: '1rem' }}>
                {otpLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px', animation: 'rotate 2s linear infinite' }}>
                      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="90, 150" strokeDashoffset="0" style={{ animation: 'dash 1.5s ease-in-out infinite' }}></circle>
                    </svg>
                    Vérification du code...
                  </span>
                ) : (
                  'Valider le code & Accéder'
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpLoading}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  📩 Renvoyer le code par mail
                </button>
                <button
                  type="button"
                  onClick={() => { setRequiresOtp(false); setOtpCode(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ← Annuler
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="identifiant">Identifiant</label>
              <input
                id="identifiant"
                type="text"
                name="identifiant"
                className="input-field"
                placeholder="admin ou admin@ecole.com"
                value={credentials.identifiant}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="input-label" htmlFor="motDePasse" style={{ marginBottom: 0 }}>Mot de Passe</label>
                <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  name="motDePasse"
                  className="input-field"
                  placeholder="••••••••"
                  value={credentials.motDePasse}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: 'var(--text-secondary)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px', animation: 'rotate 2s linear infinite' }}>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="90, 150" strokeDashoffset="0" style={{ animation: 'dash 1.5s ease-in-out infinite' }}></circle>
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se Connecter'
              )}
            </button>

            {!superAdminExists && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(163,174,209,0.2)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vous êtes l'Éditeur / Fondateur SaaS ? </span>
                <Link href="/setup-super-admin" style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>
                  Créer un compte Super-Admin →
                </Link>
              </div>
            )}
          </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rotate {
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
    </div>
  );
}
