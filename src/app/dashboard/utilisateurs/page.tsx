'use client';

import { useEffect, useState } from 'react';
import { utilisateurService, UtilisateurResponse, RegisterPayload } from '@/services/utilisateur.service';

const ROLES = [
  { value: 'ADMIN',      label: 'Administrateur', icon: '🔐', color: '#ee5d50', bg: 'rgba(238,93,80,0.1)' },
  { value: 'DIRECTEUR',  label: 'Directeur',       icon: '🏛️', color: '#1B365D', bg: 'rgba(27,54,93,0.1)' },
  { value: 'SECRETAIRE', label: 'Secrétaire',      icon: '📋', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { value: 'COMPTABLE',  label: 'Comptable',       icon: '💰', color: '#05cd99', bg: 'rgba(5,205,153,0.1)' },
  { value: 'ENSEIGNANT', label: 'Enseignant',      icon: '👨‍🏫', color: '#d97706', bg: 'rgba(255,206,32,0.1)' },
  { value: 'PARENT',     label: 'Parent',          icon: '👪', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
];

const getRoleInfo = (nom: string) => ROLES.find(r => r.value === nom) || { label: nom, icon: '👤', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState<RegisterPayload>({
    username: '',
    email: '',
    motDePasse: '',
    role: 'SECRETAIRE',
    profil: { prenom: '', nom: '', telephone: '', genre: 'M', adresse: '' }
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      setUtilisateurs(await utilisateurService.getAll());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      // Auto-fallback for username if not explicitly typed
      const usernameFinal = form.username?.trim() || `${form.profil.prenom}.${form.profil.nom}`.toLowerCase().replace(/\s+/g, '');
      await utilisateurService.create({ ...form, username: usernameFinal });
      setSuccess(`✅ Compte ${getRoleInfo(form.role).label} créé avec succès pour ${form.profil.prenom} ${form.profil.nom} (Login: @${usernameFinal}) !`);
      setForm({ username: '', email: '', motDePasse: '', role: 'SECRETAIRE', profil: { prenom: '', nom: '', telephone: '', genre: 'M', adresse: '' } });
      setShowForm(false);
      await fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, current: boolean) => {
    try {
      await utilisateurService.toggleStatut(id, !current);
      setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, estActif: !current } : u));
    } catch { setError('Erreur lors de la mise à jour du statut'); }
  };

  // Group counts by role
  const countByRole: Record<string, number> = {};
  utilisateurs.forEach(u => { countByRole[u.role] = (countByRole[u.role] || 0) + 1; });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Comptes Utilisateurs</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Créez et gérez les accès pour le personnel de l'établissement.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Annuler' : '+ Nouveau Compte'}
        </button>
      </div>

      {/* Role summary chips */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {ROLES.map(r => (
          <div key={r.value} style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', backgroundColor: r.bg, color: r.color, fontWeight: 600, fontSize: '0.8rem', border: `1px solid ${r.color}30` }}>
            {r.icon} {r.label} ({countByRole[r.value] || 0})
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary-color)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 700 }}>🔐 Créer un nouveau compte</h2>

          {/* Role picker cards */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Rôle du compte *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })} style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: `2px solid ${form.role === r.value ? r.color : 'rgba(163,174,209,0.2)'}`,
                  backgroundColor: form.role === r.value ? r.bg : 'transparent',
                  color: form.role === r.value ? r.color : 'var(--text-secondary)',
                  fontWeight: form.role === r.value ? 700 : 400,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{r.icon}</div>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: '#ee5d50', padding: '0.75rem', borderRadius: '8px', background: 'rgba(238,93,80,0.1)', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Prénom *</label>
              <input type="text" className="input-field" value={form.profil.prenom} onChange={e => {
                const newPrenom = e.target.value;
                setForm(prev => ({
                  ...prev,
                  profil: { ...prev.profil, prenom: newPrenom },
                  username: prev.username || `${newPrenom}.${prev.profil.nom}`.toLowerCase().replace(/\s+/g, '')
                }));
              }} placeholder="Ex: Kouassi" required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nom *</label>
              <input type="text" className="input-field" value={form.profil.nom} onChange={e => {
                const newNom = e.target.value;
                setForm(prev => ({
                  ...prev,
                  profil: { ...prev.profil, nom: newNom },
                  username: prev.username || `${prev.profil.prenom}.${newNom}`.toLowerCase().replace(/\s+/g, '')
                }));
              }} placeholder="Ex: Aya" required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nom d'utilisateur (Login) *</label>
              <input type="text" className="input-field" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Ex: kouassi.aya" required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Email de contact *</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Ex: fatoumata@netaa-ecole.ml" required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Mot de passe (min. 6 caractères) *</label>
              <input type="password" className="input-field" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} placeholder="••••••••" minLength={6} required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Téléphone</label>
              <input type="text" className="input-field" value={form.profil.telephone || ''} onChange={e => setForm({ ...form, profil: { ...form.profil, telephone: e.target.value } })} placeholder="+22501020304" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Genre</label>
              <select className="input-field" value={form.profil.genre || 'M'} onChange={e => setForm({ ...form, profil: { ...form.profil, genre: e.target.value } })}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Adresse</label>
              <input type="text" className="input-field" value={form.profil.adresse || ''} onChange={e => setForm({ ...form, profil: { ...form.profil, adresse: e.target.value } })} placeholder="Ex: Badalabougou, Bamako" />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid rgba(163,174,209,0.3)', color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={submitting}>
                {submitting ? '⏳ Création en cours...' : `✓ Créer le compte ${getRoleInfo(form.role).label}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success message */}
      {success && <div style={{ color: '#05cd99', padding: '1rem', borderRadius: '8px', background: 'rgba(5,205,153,0.1)', marginBottom: '1.5rem', fontWeight: 600 }}>{success}</div>}

      {/* Users table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            Chargement des comptes...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom & Prénom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date de création</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
                  Aucun compte utilisateur trouvé
                </td></tr>
              ) : utilisateurs.map(u => {
                const roleInfo = getRoleInfo(u.role);
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{u.profil ? `${u.profil.nom} ${u.profil.prenom}` : '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>@{u.username || u.email.split('@')[0]}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', backgroundColor: roleInfo.bg, color: roleInfo.color, fontWeight: 700, fontSize: '0.8rem' }}>
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                    </td>
                    <td>
                      {u.estActif
                        ? <span className="badge badge-success">✓ Actif</span>
                        : <span className="badge" style={{ backgroundColor: 'rgba(238,93,80,0.1)', color: '#ee5d50' }}>✗ Désactivé</span>
                      }
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(u.dateCreation).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggle(u.id, u.estActif)}
                        style={{
                          background: 'none',
                          border: `1px solid ${u.estActif ? 'rgba(238,93,80,0.3)' : 'rgba(5,205,153,0.3)'}`,
                          color: u.estActif ? '#ee5d50' : '#05cd99',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        {u.estActif ? '🔒 Désactiver' : '🔓 Activer'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info note */}
      <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', borderRadius: '10px', backgroundColor: 'rgba(27,54,93,0.06)', border: '1px solid rgba(27,54,93,0.15)' }}>
        <p style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
          🔐 <strong>Note de sécurité :</strong> Seul un <strong>Administrateur</strong> peut créer des comptes utilisateurs. Les enseignants et élèves ont leur propre flux de création séparé.
        </p>
      </div>
    </div>
  );
}
