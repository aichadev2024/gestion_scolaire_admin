'use client';

import { useState } from 'react';
import Head from 'next/head';

export default function SuperAdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    nomPlateforme: 'Netaa School SaaS',
    domaineRacine: 'netaa-ecole.com',
    dureeEssaiJours: '30',
    deviseParDefaut: 'FCFA',
    emailContactSupport: 'support@netaa-ecole.com',
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: '587',
    jwtExpirationHours: '24',
    resetPasswordExpiryMinutes: '30'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Head>
        <title>Configuration SaaS | Super-Admin</title>
      </Head>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
          ⚙️ Configuration Système & Paramètres SaaS
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>
          Réglages généraux de la plateforme multi-tenant, sécurité JWT et services système.
        </p>
      </div>

      {saved && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 600 }}>
          ✅ Paramètres mis à jour avec succès !
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* General SaaS Settings */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. IDENTITÉ & MULTI-TENANT
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: '#cbd5e1' }}>Nom de la Plateforme SaaS</label>
              <input
                type="text"
                className="input-field"
                value={settings.nomPlateforme}
                onChange={e => setSettings({ ...settings, nomPlateforme: e.target.value })}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: '#cbd5e1' }}>Domaine Racine Multi-Tenant</label>
              <input
                type="text"
                className="input-field"
                value={settings.domaineRacine}
                onChange={e => setSettings({ ...settings, domaineRacine: e.target.value })}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: '#cbd5e1' }}>Durée d'Essai par Défaut (Jours)</label>
              <input
                type="number"
                className="input-field"
                value={settings.dureeEssaiJours}
                onChange={e => setSettings({ ...settings, dureeEssaiJours: e.target.value })}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: '#cbd5e1' }}>Devise Principale</label>
              <input
                type="text"
                className="input-field"
                value={settings.deviseParDefaut}
                onChange={e => setSettings({ ...settings, deviseParDefaut: e.target.value })}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
        </div>

        {/* Security & Token Settings */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a855f7', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            2. SÉCURITÉ & TOKENS JWT
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: '#cbd5e1' }}>Durée de validité Token JWT (Heures)</label>
              <input
                type="number"
                className="input-field"
                value={settings.jwtExpirationHours}
                onChange={e => setSettings({ ...settings, jwtExpirationHours: e.target.value })}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: '#cbd5e1' }}>Expiration Lien Reset Mot de Passe (Minutes)</label>
              <input
                type="number"
                className="input-field"
                value={settings.resetPasswordExpiryMinutes}
                onChange={e => setSettings({ ...settings, resetPasswordExpiryMinutes: e.target.value })}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
        </div>

        {/* SMTP Mailer Status */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            3. MESSAGERIE SMTP & EMAILS
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: '#cbd5e1' }}>Serveur SMTP Host</label>
              <input
                type="text"
                className="input-field"
                value={settings.smtpHost}
                onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: '#cbd5e1' }}>Port SMTP</label>
              <input
                type="text"
                className="input-field"
                value={settings.smtpPort}
                onChange={e => setSettings({ ...settings, smtpPort: e.target.value })}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            style={{
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              padding: '0.85rem 2rem',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              transition: 'transform 0.2s'
            }}
          >
            ✓ Enregistrer les Paramètres SaaS
          </button>
        </div>

      </form>
    </div>
  );
}
