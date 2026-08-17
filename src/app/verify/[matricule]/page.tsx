'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import { Eleve } from '@/types';

export default function VerifyPage() {
  const params = useParams();
  const matricule = params?.matricule as string;
  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!matricule) return;
    const verify = async () => {
      try {
        const all = await api.get<Eleve[]>('/eleves');
        const found = all.data.find(e => e.matricule === matricule);
        if (found) setEleve(found);
        else setNotFound(true);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    };
    verify();
  }, [matricule]);

  const statut = eleve?.statut || '';
  const isActif = statut === 'ACTIF';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f2140 0%, #1B365D 60%, #0f2140 100%)',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="Netaa" style={{ height: '55px', objectFit: 'contain', filter: 'brightness(10)' }} />
          <div style={{ color: '#E5A93C', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', marginTop: '8px' }}>VÉRIFICATION DE CARTE SCOLAIRE</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', color: 'white' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
              ⏳ Vérification en cours...
            </div>
          ) : notFound ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
              <h2 style={{ color: '#ee5d50', fontWeight: 700, marginBottom: '0.5rem' }}>Carte invalide</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                Aucun élève trouvé avec le matricule <strong style={{ color: 'white' }}>{matricule}</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Status badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '30px',
                  background: isActif ? 'rgba(5,205,153,0.15)' : 'rgba(238,93,80,0.15)',
                  border: `2px solid ${isActif ? '#05cd99' : '#ee5d50'}`,
                  color: isActif ? '#05cd99' : '#ee5d50',
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {isActif ? '✅' : '⛔'} {isActif ? 'CARTE VALIDE' : 'CARTE EXPIRÉE / ARCHIVÉE'}
                </div>
              </div>

              {/* Student info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Nom & Prénom', value: `${eleve?.profil?.nom?.toUpperCase()} ${eleve?.profil?.prenom}` },
                  { label: 'Matricule', value: eleve?.matricule, mono: true },
                  { label: 'Classe', value: eleve?.classeNom || 'Non affecté' },
                  { label: 'Statut', value: eleve?.statut },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: row.mono ? '#E5A93C' : 'white', fontWeight: 700, fontFamily: row.mono ? 'monospace' : 'inherit', fontSize: row.mono ? '0.9rem' : '0.875rem' }}>
                      {row.value || '—'}
                    </span>
                  </div>
                ))}
              </div>

              {!isActif && (
                <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(238,93,80,0.1)', border: '1px solid rgba(238,93,80,0.3)', borderRadius: '8px', color: '#ee5d50', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                  ⚠️ Cette carte n'est plus valide. L'élève n'est plus actif dans le système.
                </div>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Netaa — Gestion Scolaire Numérique · Vérification automatisée
        </p>
      </div>
    </div>
  );
}
