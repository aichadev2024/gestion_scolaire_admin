'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import Head from 'next/head';

export default function SetupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    motDePasse: '',
    profil: {
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      genre: 'M',
      dateNaissance: ''
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
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8089/api/auth/register-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'ADMIN' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du compte');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-secondary)', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Félicitations ! 🎉</h2>
          <p>Le compte Administrateur a été créé avec succès.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Redirection vers la page de connexion...</p>
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
        <title>Configuration Initiale | Netaa</title>
      </Head>

      <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
            Configuration Initiale
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Bienvenue sur Netaa ! Créez le tout premier compte Administrateur de l'école.
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Prénom</label>
              <input type="text" name="prenom" className="input-field" value={formData.profil.prenom} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="input-label">Nom</label>
              <input type="text" name="nom" className="input-field" value={formData.profil.nom} onChange={handleChange} required />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nom d'utilisateur</label>
              <input type="text" name="username" className="input-field" placeholder="admin123" value={formData.username} onChange={handleChange} required />
            </div>
            
            <div className="input-group">
              <label className="input-label">Email de connexion</label>
              <input type="email" name="email" className="input-field" placeholder="admin@ecole.com" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Mot de passe *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="motDePasse"
                className="input-field"
                value={formData.motDePasse}
                onChange={handleChange}
                required
                minLength={6}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Téléphone</label>
              <input type="text" name="telephone" className="input-field" value={formData.profil.telephone} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="input-label">Genre</label>
              <select name="genre" className="input-field" value={formData.profil.genre} onChange={handleChange} required>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Date de naissance</label>
            <input type="date" name="dateNaissance" className="input-field" value={formData.profil.dateNaissance} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label">Adresse</label>
            <input type="text" name="adresse" className="input-field" value={formData.profil.adresse} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Création en cours...' : 'Créer l\'administrateur'}
          </button>
        </form>
      </div>
    </div>
  );
}
