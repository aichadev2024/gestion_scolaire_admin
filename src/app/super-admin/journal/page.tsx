'use client';

import { useState } from 'react';
import Head from 'next/head';

interface LogEntry {
  id: number;
  timestamp: string;
  acteur: string;
  role: string;
  action: string;
  module: 'IAM' | 'ETABLISSEMENT' | 'FINANCE' | 'SCOLARITE' | 'SYSTEME';
  niveau: 'INFO' | 'AVERTISSEMENT' | 'SECURITE' | 'ERREUR';
  details: string;
  ipAddress: string;
}

const MOCK_JOURNAL: LogEntry[] = [
  {
    id: 1,
    timestamp: '2026-08-06 12:45:10',
    acteur: 'superadmin@netaa.com',
    role: 'SUPER_ADMIN',
    action: 'CRÉATION_ÉTABLISSEMENT',
    module: 'ETABLISSEMENT',
    niveau: 'SECURITE',
    details: 'Création de l\'établissement Lycée Jules Verne (code: jules-verne) avec plan PRO',
    ipAddress: '197.234.221.4'
  },
  {
    id: 2,
    timestamp: '2026-08-06 11:20:05',
    acteur: 'admin.julesverne',
    role: 'ADMIN',
    action: 'CONNEXION_REUSSIE',
    module: 'IAM',
    niveau: 'INFO',
    details: 'Authentification JWT réussie pour l\'administrateur d\'école',
    ipAddress: '154.120.98.12'
  },
  {
    id: 3,
    timestamp: '2026-08-06 10:15:30',
    acteur: 'superadmin@netaa.com',
    role: 'SUPER_ADMIN',
    action: 'SUSPENSION_ACCES',
    module: 'ETABLISSEMENT',
    niveau: 'AVERTISSEMENT',
    details: 'Suspension temporaire de l\'établissement Collège Sainte Marie (id: 4) pour retard de paiement',
    ipAddress: '197.234.221.4'
  },
  {
    id: 4,
    timestamp: '2026-08-06 09:05:00',
    acteur: 'comptable@julesverne.com',
    role: 'COMPTABLE',
    action: 'ENCAISSEMENT_PAIEMENT',
    module: 'FINANCE',
    niveau: 'INFO',
    details: 'Paiement enregistré: 150 000 FCFA pour l\'élève MAT-2026-001 (Reçu #REC-9823)',
    ipAddress: '154.120.98.15'
  },
  {
    id: 5,
    timestamp: '2026-08-05 18:30:12',
    acteur: 'inconnu',
    role: 'ANONYME',
    action: 'ECHEC_AUTHENTIFICATION',
    module: 'IAM',
    niveau: 'SECURITE',
    details: 'Tentative de connexion échouée sur admin.saintjoseph avec mot de passe erroné (3 tentatives)',
    ipAddress: '41.202.219.88'
  }
];

export default function SuperAdminJournalPage() {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_JOURNAL);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState<string>('TOUS');
  const [filterNiveau, setFilterNiveau] = useState<string>('TOUS');

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.acteur.toLowerCase().includes(search.toLowerCase()) ||
                        log.details.toLowerCase().includes(search.toLowerCase()) ||
                        log.action.toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === 'TOUS' || log.module === filterModule;
    const matchNiveau = filterNiveau === 'TOUS' || log.niveau === filterNiveau;
    return matchSearch && matchModule && matchNiveau;
  });

  const getNiveauBadge = (niveau: LogEntry['niveau']) => {
    switch (niveau) {
      case 'INFO':
        return <span style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>● INFO</span>;
      case 'AVERTISSEMENT':
        return <span style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>⚠️ WARN</span>;
      case 'SECURITE':
        return <span style={{ backgroundColor: 'rgba(168,85,247,0.15)', color: '#c084fc', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>🛡️ SÉCURITÉ</span>;
      case 'ERREUR':
        return <span style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>✖ ERREUR</span>;
    }
  };

  return (
    <div>
      <Head>
        <title>Journaux d'Audit & Sécurité | Super-Admin</title>
      </Head>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
          📜 Journaux d'Audit & Sécurité Système
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>
          Traçabilité globale des actions sensibles, connexions et modifications multi-tenant.
        </p>
      </div>

      {/* Filter and Search controls */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Rechercher un utilisateur, IP ou description d'action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 0, backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Module:</span>
          <select
            className="input-field"
            value={filterModule}
            onChange={e => setFilterModule(e.target.value)}
            style={{ marginBottom: 0, width: 'auto', backgroundColor: '#1e293b', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <option value="TOUS">Tous les modules</option>
            <option value="IAM">IAM / Sécurité</option>
            <option value="ETABLISSEMENT">Établissements</option>
            <option value="FINANCE">Finances</option>
            <option value="SCOLARITE">Scolarité</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Niveau:</span>
          <select
            className="input-field"
            value={filterNiveau}
            onChange={e => setFilterNiveau(e.target.value)}
            style={{ marginBottom: 0, width: 'auto', backgroundColor: '#1e293b', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <option value="TOUS">Tous les niveaux</option>
            <option value="INFO">INFO</option>
            <option value="AVERTISSEMENT">AVERTISSEMENT</option>
            <option value="SECURITE">SÉCURITÉ</option>
            <option value="ERREUR">ERREUR</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Horodatage</th>
              <th style={{ padding: '1rem' }}>Niveau</th>
              <th style={{ padding: '1rem' }}>Acteur</th>
              <th style={{ padding: '1rem' }}>Action / Détails</th>
              <th style={{ padding: '1rem' }}>Adresse IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', color: '#cbd5e1', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {log.timestamp}
                </td>
                <td style={{ padding: '1rem' }}>
                  {getNiveauBadge(log.niveau)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>{log.acteur}</div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.role}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontWeight: 700, color: '#6366f1', display: 'block', marginBottom: '2px' }}>
                    [{log.module}] {log.action}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>{log.details}</span>
                </td>
                <td style={{ padding: '1rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {log.ipAddress}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Aucun événement d'audit ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
