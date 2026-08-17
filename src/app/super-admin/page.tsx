'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { etablissementService, Etablissement } from '@/services/etablissement.service';
import Head from 'next/head';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNomComplet, setUserNomComplet] = useState<string>('Super-Admin');

  useEffect(() => {
    const { authService } = require('@/services/auth.service');
    const user = authService.getCurrentUser();
    if (user) {
      const name = [user.prenom, user.nom].filter(Boolean).join(' ');
      setUserNomComplet(name || user.username || 'Super-Admin');
    }

    etablissementService.listerTous()
      .then(setEtablissements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute MRR (Monthly Recurring Revenue) Estimation
  const calculateMRR = () => {
    return etablissements.reduce((acc, curr) => {
      if (curr.statut !== 'ACTIF') return acc;
      if (curr.planTarifaire === 'STARTER') return acc + 25000;
      if (curr.planTarifaire === 'PRO') return acc + 75000;
      if (curr.planTarifaire === 'ENTERPRISE') return acc + 200000;
      return acc + 50000;
    }, 0);
  };

  const total = etablissements.length;
  const actifs = etablissements.filter(e => e.statut === 'ACTIF').length;
  const suspendus = etablissements.filter(e => e.statut === 'SUSPENDU').length;
  const mrr = calculateMRR();

  return (
    <div>
      <Head>
        <title>Super-Admin SaaS | Vue d'ensemble</title>
      </Head>

      {/* Hero Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            ⚡ Bonjour, {userNomComplet} 👋
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Vue globale des performances multi-tenant, abonnements et santé des établissements abonnés.
          </p>
        </div>
        <button
          onClick={() => router.push('/super-admin/etablissements')}
          style={{
            backgroundColor: '#6366f1',
            color: '#ffffff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          + Ajouter un Établissement Client
        </button>
      </div>

      {/* Key Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        
        {/* MRR Card */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REVENU MENSUEL (MRR)</span>
            <span style={{ fontSize: '1.25rem' }}>💰</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.75rem 0 0.25rem 0', color: '#6366f1' }}>
            {mrr.toLocaleString('fr-FR')} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>FCFA / mois</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>● Estimation basée sur les comptes actifs</span>
        </div>

        {/* Total Schools */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ÉTABLISSEMENTS TOTAUX</span>
            <span style={{ fontSize: '1.25rem' }}>🏛️</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.75rem 0 0.25rem 0', color: '#ffffff' }}>
            {loading ? '...' : total}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Sous-domaines configurés sur la plateforme</span>
        </div>

        {/* Active Schools */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ÉCOLES ACTIVES</span>
            <span style={{ fontSize: '1.25rem' }}>✅</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.75rem 0 0.25rem 0', color: '#10b981' }}>
            {loading ? '...' : actifs}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>Accès et services fonctionnels</span>
        </div>

        {/* Suspended Schools */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>COMPTES SUSPENDUS</span>
            <span style={{ fontSize: '1.25rem' }}>⛔</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.75rem 0 0.25rem 0', color: '#ef4444' }}>
            {loading ? '...' : suspendus}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>Accès temporairement bloqués</span>
        </div>

      </div>

      {/* Plan Distribution Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Quick Plan Breakdown */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f8fafc' }}>
            📊 Répartition des Abonnements
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Plan Starter (25 000 FCFA/mois)</span>
                <span style={{ color: '#a5b4fc', fontWeight: 700 }}>
                  {etablissements.filter(e => e.planTarifaire === 'STARTER').length} école(s)
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${total ? (etablissements.filter(e => e.planTarifaire === 'STARTER').length / total) * 100 : 0}%`, height: '100%', backgroundColor: '#a5b4fc' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Plan Pro (75 000 FCFA/mois)</span>
                <span style={{ color: '#6366f1', fontWeight: 700 }}>
                  {etablissements.filter(e => e.planTarifaire === 'PRO').length} école(s)
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${total ? (etablissements.filter(e => e.planTarifaire === 'PRO').length / total) * 100 : 0}%`, height: '100%', backgroundColor: '#6366f1' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Plan Enterprise (200 000 FCFA/mois)</span>
                <span style={{ color: '#a855f7', fontWeight: 700 }}>
                  {etablissements.filter(e => e.planTarifaire === 'ENTERPRISE').length} école(s)
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${total ? (etablissements.filter(e => e.planTarifaire === 'ENTERPRISE').length / total) * 100 : 0}%`, height: '100%', backgroundColor: '#a855f7' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f8fafc' }}>
            ⚡ Raccourcis Administrateur
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <button
              onClick={() => router.push('/super-admin/etablissements')}
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '12px',
                color: '#a5b4fc',
                fontWeight: 600,
                fontSize: '0.85rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              🏛️ Gérer les Établissements →
            </button>
            <button
              onClick={() => router.push('/super-admin/journal')}
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: '12px',
                color: '#c084fc',
                fontWeight: 600,
                fontSize: '0.85rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              📜 Voir Journaux d'Audit →
            </button>
            <button
              onClick={() => router.push('/super-admin/settings')}
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '12px',
                color: '#6ee7b7',
                fontWeight: 600,
                fontSize: '0.85rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              ⚙️ Paramètres SaaS →
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.85rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              🏫 Tester l'Accès École →
            </button>
          </div>
        </div>

      </div>

      {/* Recent Schools Table Preview */}
      <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            📋 Derniers Établissements Inscrits
          </h3>
          <button
            onClick={() => router.push('/super-admin/etablissements')}
            style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Voir la liste complète ({etablissements.length}) →
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Chargement des données...</p>
        ) : etablissements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
            Aucun établissement client enregistré pour le moment.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Nom</th>
                <th style={{ padding: '0.85rem 1rem' }}>Sous-Domaine</th>
                <th style={{ padding: '0.85rem 1rem' }}>Plan</th>
                <th style={{ padding: '0.85rem 1rem' }}>Statut</th>
                <th style={{ padding: '0.85rem 1rem' }}>Contact</th>
              </tr>
            </thead>
            <tbody>
              {etablissements.slice(0, 5).map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f8fafc' }}>{e.nom}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <code style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {e.code}.netaa-ecole.com
                    </code>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                      backgroundColor: e.planTarifaire === 'ENTERPRISE' ? 'rgba(168,85,247,0.2)' : 'rgba(99,102,241,0.2)',
                      color: e.planTarifaire === 'ENTERPRISE' ? '#c084fc' : '#a5b4fc'
                    }}>
                      {e.planTarifaire}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {e.statut === 'ACTIF' && <span style={{ color: '#10b981', fontWeight: 700 }}>● Actif</span>}
                    {e.statut === 'SUSPENDU' && <span style={{ color: '#ef4444', fontWeight: 700 }}>⛔ Suspendu</span>}
                    {e.statut === 'CLOTURE' && <span style={{ color: '#94a3b8', fontWeight: 700 }}>✖ Clôturé</span>}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                    {e.emailContact || 'Non renseigné'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
