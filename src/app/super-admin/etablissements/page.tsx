'use client';

import { useState, useEffect } from 'react';
import { etablissementService, Etablissement, CreateEtablissementRequest } from '@/services/etablissement.service';
import Head from 'next/head';

export default function SuperAdminEtablissementsPage() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [formData, setFormData] = useState<CreateEtablissementRequest>({
    nomEtablissement: '',
    codeEtablissement: '',
    emailContact: '',
    telephone: '',
    adresse: '',
    planTarifaire: 'PRO',
    adminUsername: '',
    adminEmail: '',
    adminMotDePasse: '',
    adminProfil: {
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      genre: 'M',
      dateNaissance: '1990-01-01'
    }
  });

  useEffect(() => {
    chargerEtablissements();
  }, []);

  const chargerEtablissements = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await etablissementService.listerTous();
      setEtablissements(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des établissements.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutChange = async (id: number, nouveauStatut: 'ACTIF' | 'SUSPENDU' | 'CLOTURE') => {
    try {
      await etablissementService.modifierStatut(id, nouveauStatut);
      chargerEtablissements();
    } catch (err: any) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await etablissementService.creer(formData);
      setModalOpen(false);
      setFormData({
        nomEtablissement: '',
        codeEtablissement: '',
        emailContact: '',
        telephone: '',
        adresse: '',
        planTarifaire: 'PRO',
        adminUsername: '',
        adminEmail: '',
        adminMotDePasse: '',
        adminProfil: {
          nom: '',
          prenom: '',
          telephone: '',
          adresse: '',
          genre: 'M',
          dateNaissance: '1990-01-01'
        }
      });
      chargerEtablissements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création de l\'établissement');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredEtablissements = etablissements.filter(e => {
    const matchSearch = e.nom.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'TOUS' || e.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  // Metrics
  const totalEtablissements = etablissements.length;
  const actifsCount = etablissements.filter(e => e.statut === 'ACTIF').length;
  const suspendusCount = etablissements.filter(e => e.statut === 'SUSPENDU').length;
  const proCount = etablissements.filter(e => e.planTarifaire === 'PRO' || e.planTarifaire === 'ENTERPRISE').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <Head>
        <title>Gestion des Établissements | Super-Admin SaaS</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-color, #4318ff)' }}>
            🏛️ Établissements Clients (Multi-Tenant)
          </h1>
          <p style={{ color: 'var(--text-secondary, #a3aed0)', fontSize: '0.9rem' }}>
            Gestion centralisée des sous-domaines, licences et comptes administrateurs d'écoles.
          </p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', backgroundColor: '#6366f1' }} onClick={() => setModalOpen(true)}>
          + Nouvel Établissement Client
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL ÉTABLISSEMENTS</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#6366f1' }}>{totalEtablissements}</h2>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ÉCOLES ACTIVES</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#10b981' }}>{actifsCount}</h2>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SUSPENDUS / INACTIFS</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#ef4444' }}>{suspendusCount}</h2>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PLANS PRO / ENTERPRISE</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#8b5cf6' }}>{proCount}</h2>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem 1.5rem' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Rechercher par nom ou code (ex: jules-verne)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Statut:</span>
          {['TOUS', 'ACTIF', 'SUSPENDU', 'CLOTURE'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatut(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor: filterStatut === st ? '#6366f1' : 'rgba(163,174,209,0.15)',
                color: filterStatut === st ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Chargement des établissements...
        </div>
      ) : (
        <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(163,174,209,0.2)', color: 'var(--text-secondary)', backgroundColor: 'rgba(163,174,209,0.05)' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Établissement</th>
                <th style={{ padding: '1rem 1.25rem' }}>Sous-domaine</th>
                <th style={{ padding: '1rem 1.25rem' }}>Admin Principal</th>
                <th style={{ padding: '1rem 1.25rem' }}>Plan</th>
                <th style={{ padding: '1rem 1.25rem' }}>Fin d'Abonnement</th>
                <th style={{ padding: '1rem 1.25rem' }}>Statut</th>
                <th style={{ padding: '1rem 1.25rem' }}>Contact</th>
                <th style={{ padding: '1rem 1.25rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEtablissements.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(163,174,209,0.1)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 'bold' }}>
                    {e.nom}
                    {e.dateCreation && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                        Créé le {new Date(e.dateCreation).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <code style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                      {e.code}.netaa-ecole.com
                    </code>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>
                    {e.adminNomComplet ? (
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>👤 {e.adminNomComplet}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>@{e.adminUsername}</div>
                        {e.adminEmail && <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>✉️ {e.adminEmail}</div>}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Non assigné</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                      background: e.planTarifaire === 'ENTERPRISE' ? 'rgba(139,92,246,0.15)' : e.planTarifaire === 'PRO' ? 'rgba(99,102,241,0.15)' : 'rgba(163,174,209,0.15)',
                      color: e.planTarifaire === 'ENTERPRISE' ? '#8b5cf6' : e.planTarifaire === 'PRO' ? '#6366f1' : 'var(--text-secondary)'
                    }}>
                      {e.planTarifaire}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>
                    {e.dateExpirationAbonnement ? (
                      (() => {
                        const expDate = new Date(e.dateExpirationAbonnement);
                        const now = new Date();
                        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                        const dateStr = expDate.toLocaleDateString('fr-FR');
                        
                        if (diffDays < 0) {
                          return <span style={{ color: '#ef4444', fontWeight: 700, backgroundColor: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '6px' }}>⛔ Expiré ({dateStr})</span>;
                        } else if (diffDays <= 15) {
                          return <span style={{ color: '#f59e0b', fontWeight: 700, backgroundColor: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '6px' }}>⚠️ Expire dans {diffDays}j ({dateStr})</span>;
                        } else {
                          return <span style={{ color: '#10b981', fontWeight: 600 }}>Valide ({dateStr})</span>;
                        }
                      })()
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>1 An par défaut</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {e.statut === 'ACTIF' && <span style={{ color: '#10b981', fontWeight: 700 }}>● Actif</span>}
                    {e.statut === 'SUSPENDU' && <span style={{ color: '#ef4444', fontWeight: 700 }}>⛔ Suspendu</span>}
                    {e.statut === 'CLOTURE' && <span style={{ color: '#64748b', fontWeight: 700 }}>✖ Clôturé</span>}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>
                    {e.emailContact || 'N/A'}<br/>
                    <span style={{ color: 'var(--text-secondary)' }}>📞 {e.telephone || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {e.statut === 'ACTIF' ? (
                      <button
                        onClick={() => handleStatutChange(e.id, 'SUSPENDU')}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        Suspendre
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatutChange(e.id, 'ACTIF')}
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        Activer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredEtablissements.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Aucun établissement ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Création Établissement */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#6366f1', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>🏛️ Créer un Nouvel Établissement</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <h3 style={{ fontSize: '0.85rem', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>1. INFORMATIONS ÉCOLE & ABONNEMENT</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Nom de l'Établissement *</label>
                  <input type="text" className="input-field" placeholder="Ex: Lycée Jules Verne" required
                    value={formData.nomEtablissement} onChange={e => setFormData({...formData, nomEtablissement: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Code Sous-domaine *</label>
                  <input type="text" className="input-field" placeholder="jules-verne" required
                    value={formData.codeEtablissement} onChange={e => setFormData({...formData, codeEtablissement: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Sera utilisé pour: code.netaa-ecole.com</small>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Email de Contact</label>
                  <input type="email" className="input-field" placeholder="contact@julesverne.com"
                    value={formData.emailContact} onChange={e => setFormData({...formData, emailContact: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Téléphone Établissement 📞</label>
                  <input type="text" className="input-field" placeholder="+223 70 00 00 00"
                    value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Plan Tarifaire</label>
                  <select className="input-field" value={formData.planTarifaire} onChange={e => setFormData({...formData, planTarifaire: e.target.value})}>
                    <option value="STARTER">Starter (25 000 FCFA/mois)</option>
                    <option value="PRO">Pro (75 000 FCFA/mois)</option>
                    <option value="ENTERPRISE">Enterprise (200 000 FCFA/mois)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Date Fin d'Abonnement 📅</label>
                  <input type="date" className="input-field"
                    value={formData.dateExpirationAbonnement ? formData.dateExpirationAbonnement.substring(0, 10) : ''}
                    onChange={e => setFormData({...formData, dateExpirationAbonnement: e.target.value ? `${e.target.value}T23:59:59` : ''})} />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Par défaut: 1 an à compter de la création</small>
                </div>
              </div>

              <h3 style={{ fontSize: '0.85rem', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1.5rem', marginBottom: '1rem' }}>2. PREMIER ADMINISTRATEUR ÉCOLE</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Prénom Admin *</label>
                  <input type="text" className="input-field" required
                    value={formData.adminProfil.prenom} onChange={e => setFormData({...formData, adminProfil: {...formData.adminProfil, prenom: e.target.value}})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Nom Admin *</label>
                  <input type="text" className="input-field" required
                    value={formData.adminProfil.nom} onChange={e => setFormData({...formData, adminProfil: {...formData.adminProfil, nom: e.target.value}})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Nom d'utilisateur (Login) *</label>
                  <input type="text" className="input-field" placeholder="admin.julesverne" required
                    value={formData.adminUsername} onChange={e => setFormData({
                      ...formData,
                      adminUsername: e.target.value,
                      adminEmail: formData.adminEmail || `${e.target.value}@${formData.codeEtablissement || 'ecole'}.netaa-ecole.com`
                    })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email de l'Admin</label>
                  <input type="email" className="input-field" placeholder="admin@julesverne.netaa-ecole.com"
                    value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label">Mot de passe Initial *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    className="input-field"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.adminMotDePasse}
                    onChange={e => setFormData({...formData, adminMotDePasse: e.target.value})}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
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
                    title={showAdminPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showAdminPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'none', border: '1px solid rgba(163,174,209,0.3)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', backgroundColor: '#6366f1' }} disabled={submitting}>
                  {submitting ? 'Création en cours...' : '✓ Créer l\'Établissement & Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
