'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { authService } from '@/services/auth.service';

export default function SetupSuperAdminPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authService.checkSuperAdminExists().then(res => {
      if (res?.exists) {
        setAlreadyExists(true);
      }
    }).catch(console.error).finally(() => setChecking(false));
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: '',
    profil: {
      nom: '',
      prenom: '',
      telephone: '',
      adresse: 'Siège Netaa SaaS',
      genre: 'M',
      dateNaissance: '1990-01-01'
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name in formData.profil) {
      setFormData(prev => ({
        ...prev,
        profil: { ...prev.profil, [name]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (formData.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8089/api/auth/register-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          motDePasse: formData.motDePasse,
          role: 'SUPER_ADMIN',
          profil: formData.profil
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du compte Super-Admin.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'Erreur inattendue lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0b0f19' }}>
        <p style={{ color: '#6366f1' }}>Vérification des autorisations...</p>
      </div>
    );
  }

  if (alreadyExists) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 100%)', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', backgroundColor: '#0f172a', border: '1px solid rgba(239,68,68,0.4)', padding: '2.5rem', borderRadius: '16px', color: '#ffffff' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1.4rem', fontWeight: 800 }}>
            Création Super-Admin Verrouillée
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.925rem', lineHeight: '1.6' }}>
            Un compte Super-Admin maître existe déjà sur la plateforme Netaa. Pour des raisons de sécurité et d'exclusivité, aucun autre compte Super-Admin ne peut être créé via cette page.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '1.75rem', backgroundColor: '#6366f1', padding: '0.8rem 1.75rem', textDecoration: 'none' }}>
            ← Se Connecter
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-secondary, #0b0f19)', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', backgroundColor: '#0f172a', border: '1px solid rgba(99,102,241,0.4)', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#6366f1', marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>
            Compte Super-Admin Créé avec Succès !
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
            Félicitations, votre espace d'administration globale est configuré.
          </p>
          <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            Redirection automatique vers la page de connexion...
          </p>
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
      background: 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 100%)',
      padding: '2rem'
    }}>
      <Head>
        <title>Inscription Super-Admin | Netaa SaaS</title>
      </Head>

      <div className="glass-card" style={{ maxWidth: '560px', width: '100%', backgroundColor: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', color: '#ffffff' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👑</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1', marginBottom: '0.4rem' }}>
            Inscription Super-Admin SaaS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Créez vos identifiants maître pour superviser la plateforme et les établissements abonnés.
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <h3 style={{ fontSize: '0.85rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            1. INFORMATIONS PERSONNELLES
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" style={{ color: '#cbd5e1' }}>Prénom *</label>
              <input type="text" name="prenom" className="input-field" placeholder="Ex: Aïcha" value={formData.profil.prenom} onChange={handleChange} required style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ color: '#cbd5e1' }}>Nom *</label>
              <input type="text" name="nom" className="input-field" placeholder="Ex: Diarra" value={formData.profil.nom} onChange={handleChange} required style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" style={{ color: '#cbd5e1' }}>Téléphone</label>
              <input type="text" name="telephone" className="input-field" placeholder="+223 70 00 00 00" value={formData.profil.telephone} onChange={handleChange} style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ color: '#cbd5e1' }}>Genre</label>
              <select name="genre" className="input-field" value={formData.profil.genre} onChange={handleChange} style={{ backgroundColor: '#1e293b', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: '0.85rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1.25rem', marginBottom: '1rem' }}>
            2. IDENTIFIANTS MAÎTRE (LOGINS)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" style={{ color: '#cbd5e1' }}>Nom d'utilisateur (Username) *</label>
              <input type="text" name="username" className="input-field" placeholder="ex: super.aicha" value={formData.username} onChange={handleChange} required style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ color: '#cbd5e1' }}>Email Professionnel *</label>
              <input type="email" name="email" className="input-field" placeholder="aicha@netaa-ecole.com" value={formData.email} onChange={handleChange} required style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Password input with eye toggle */}
            <div className="input-group">
              <label className="input-label" style={{ color: '#cbd5e1' }}>Mot de Passe *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="motDePasse"
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.motDePasse}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)', paddingRight: '2.5rem' }}
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
                    color: '#94a3b8',
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

            {/* Confirm Password input with eye toggle */}
            <div className="input-group">
              <label className="input-label" style={{ color: '#cbd5e1' }}>Confirmer le Mot de Passe *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmMotDePasse"
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.confirmMotDePasse}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: '#94a3b8',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showConfirmPassword ? 'Masquer' : 'Afficher'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1.5rem', backgroundColor: '#6366f1', width: '100%', padding: '0.85rem' }}>
            {loading ? 'Création de votre compte Super-Admin...' : '👑 Créer mon Compte Super-Admin'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link href="/login" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'underline' }}>
              Déjà inscrit ? Se connecter →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
