'use client';

import { useState } from 'react';
import { authService } from '@/services/auth.service';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (nouveauMotDePasse !== confirmMotDePasse) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (nouveauMotDePasse.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.changePassword({ ancienMotDePasse, nouveauMotDePasse });
      setSuccess(res.message);
      // Reset form
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setConfirmMotDePasse('');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          ×
        </button>
        
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', fontSize: '1.25rem' }}>Changer le mot de passe</h2>
        
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        {success && <div style={{ backgroundColor: '#d1fae5', color: '#047857', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Ancien mot de passe</label>
            <input 
              type="password" 
              className="input-field" 
              value={ancienMotDePasse} 
              onChange={e => setAncienMotDePasse(e.target.value)} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Nouveau mot de passe</label>
            <input 
              type="password" 
              className="input-field" 
              value={nouveauMotDePasse} 
              onChange={e => setNouveauMotDePasse(e.target.value)} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Confirmer le nouveau mot de passe</label>
            <input 
              type="password" 
              className="input-field" 
              value={confirmMotDePasse} 
              onChange={e => setConfirmMotDePasse(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
