'use client';

import { useEffect, useState } from 'react';
import { presenceService, PresenceItem, PresenceEnseignantItem } from '@/services/presence.service';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { enseignantService } from '@/services/enseignant.service';
import { Classe, Eleve, Enseignant } from '@/types';

const STATUTS: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  PRESENT: { label: 'Présent', color: '#05cd99', bg: 'rgba(5,205,153,0.1)', emoji: '✅' },
  ABSENT:  { label: 'Absent',  color: '#ee5d50', bg: 'rgba(238,93,80,0.1)',  emoji: '❌' },
  RETARD:  { label: 'Retard',  color: '#d97706', bg: 'rgba(255,206,32,0.1)', emoji: '⏰' },
  CONGE:   { label: 'En Congé', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', emoji: '🏖️' }
};

export default function PresencesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<string>('');
  const [appel, setAppel] = useState<Record<number, 'PRESENT' | 'ABSENT' | 'RETARD'>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [historyEleveId, setHistoryEleveId] = useState<string>('');
  const [history, setHistory] = useState<PresenceItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tab, setTab] = useState<'APPEL' | 'ENSEIGNANTS' | 'HISTORIQUE'>('APPEL');

  // Enseignants State
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [appelEnseignants, setAppelEnseignants] = useState<Record<number, { statut: 'PRESENT' | 'ABSENT' | 'RETARD' | 'CONGE'; heureArrivee: string }>>({});
  const [loadingEnseignants, setLoadingEnseignants] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const cls = await classeService.getClasses();
        setClasses(cls);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchClasses();
  }, []);

  // When tab switches to ENSEIGNANTS, load teachers and today's attendance
  useEffect(() => {
    if (tab === 'ENSEIGNANTS') {
      loadEnseignantsData();
    }
  }, [tab]);

  const loadEnseignantsData = async () => {
    setLoadingEnseignants(true);
    try {
      const [profs, presencesProfs] = await Promise.all([
        enseignantService.getEnseignants(),
        presenceService.getPresencesEnseignants(today)
      ]);
      setEnseignants(profs);

      const mapAppel: Record<number, { statut: 'PRESENT' | 'ABSENT' | 'RETARD' | 'CONGE'; heureArrivee: string }> = {};
      profs.forEach(p => {
        const existing = presencesProfs.find(pr => pr.enseignant?.id === p.id);
        mapAppel[p.id] = {
          statut: (existing?.statut as any) || 'PRESENT',
          heureArrivee: existing?.heureArrivee || '07:45'
        };
      });
      setAppelEnseignants(mapAppel);
    } catch (e) { console.error(e); }
    finally { setLoadingEnseignants(false); }
  };

  // When a class is selected, load its students
  useEffect(() => {
    if (!selectedClasseId) { setEleves([]); setAppel({}); return; }
    const fetchEleves = async () => {
      try {
        const all = await eleveService.getEleves();
        const filtered = all.filter(e => e.classeId === parseInt(selectedClasseId));
        setEleves(filtered);
        const initial: Record<number, 'PRESENT' | 'ABSENT' | 'RETARD'> = {};
        filtered.forEach(e => { initial[e.id] = 'PRESENT'; });
        setAppel(initial);
      } catch (e) { console.error(e); }
    };
    fetchEleves();
  }, [selectedClasseId]);

  const handleStatut = (eleveId: number, statut: 'PRESENT' | 'ABSENT' | 'RETARD') => {
    setAppel(prev => ({ ...prev, [eleveId]: statut }));
  };

  const handleStatutEnseignant = (enseignantId: number, statut: 'PRESENT' | 'ABSENT' | 'RETARD' | 'CONGE') => {
    setAppelEnseignants(prev => ({
      ...prev,
      [enseignantId]: { ...prev[enseignantId], statut }
    }));
  };

  const handleHeureArriveeEnseignant = (enseignantId: number, heureArrivee: string) => {
    setAppelEnseignants(prev => ({
      ...prev,
      [enseignantId]: { ...prev[enseignantId], heureArrivee }
    }));
  };

  const handleSubmitAppel = async () => {
    if (!selectedClasseId || eleves.length === 0) return;
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const promises = eleves.map(e =>
        presenceService.enregistrer({
          eleveId: e.id,
          date: today,
          statut: appel[e.id] || 'PRESENT'
        })
      );
      await Promise.all(promises);
      setSuccess(`✅ Appel de ${eleves.length} élève(s) enregistré avec succès pour le ${today} !`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de l'appel");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAppelEnseignants = async () => {
    if (enseignants.length === 0) return;
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const promises = enseignants.map(e =>
        presenceService.enregistrerEnseignant({
          enseignantId: e.id,
          date: today,
          statut: appelEnseignants[e.id]?.statut || 'PRESENT',
          heureArrivee: appelEnseignants[e.id]?.heureArrivee || '07:45'
        })
      );
      await Promise.all(promises);
      setSuccess(`✅ Pointage de ${enseignants.length} enseignant(s) enregistré avec succès pour le ${today} !`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors du pointage des enseignants");
    } finally {
      setSubmitting(false);
    }
  };

  const loadHistory = async () => {
    if (!historyEleveId) return;
    setHistoryLoading(true);
    try {
      const data = await presenceService.getByEleve(parseInt(historyEleveId));
      setHistory(data);
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  };

  const presentCount = Object.values(appel).filter(s => s === 'PRESENT').length;
  const absentCount  = Object.values(appel).filter(s => s === 'ABSENT').length;
  const retardCount  = Object.values(appel).filter(s => s === 'RETARD').length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestion des Présences & Pointage</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Effectuez l'appel des élèves et le pointage de présence des enseignants.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(163,174,209,0.2)', paddingBottom: '0' }}>
        <button onClick={() => setTab('APPEL')} style={{
          padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
          color: tab === 'APPEL' ? 'var(--primary-color)' : 'var(--text-secondary)',
          borderBottom: tab === 'APPEL' ? '2px solid var(--primary-color)' : '2px solid transparent'
        }}>
          🎓 Appel Élèves
        </button>

        <button onClick={() => setTab('ENSEIGNANTS')} style={{
          padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
          color: tab === 'ENSEIGNANTS' ? '#d97706' : 'var(--text-secondary)',
          borderBottom: tab === 'ENSEIGNANTS' ? '2px solid #d97706' : '2px solid transparent'
        }}>
          👨‍🏫 Présences Enseignants
        </button>

        <button onClick={() => setTab('HISTORIQUE')} style={{
          padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
          color: tab === 'HISTORIQUE' ? '#05cd99' : 'var(--text-secondary)',
          borderBottom: tab === 'HISTORIQUE' ? '2px solid #05cd99' : '2px solid transparent'
        }}>
          📊 Historique Élèves
        </button>
      </div>

      {/* ===== TAB: APPEL ÉLÈVES ===== */}
      {tab === 'APPEL' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '250px' }}>
              <label className="input-label">📅 Date du jour</label>
              <input type="text" className="input-field" value={today} readOnly style={{ backgroundColor: 'rgba(163,174,209,0.05)', cursor: 'not-allowed' }} />
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: 2, minWidth: '250px' }}>
              <label className="input-label">🏫 Sélectionnez la classe</label>
              <select className="input-field" value={selectedClasseId} onChange={e => setSelectedClasseId(e.target.value)}>
                <option value="">— Choisir une classe —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.anneeScolaire})</option>)}
              </select>
            </div>
          </div>

          {eleves.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Présents', count: presentCount, color: '#05cd99', bg: 'rgba(5,205,153,0.1)' },
                { label: 'Absents',  count: absentCount,  color: '#ee5d50', bg: 'rgba(238,93,80,0.1)' },
                { label: 'Retards',  count: retardCount,  color: '#d97706', bg: 'rgba(255,206,32,0.1)' }
              ].map(s => (
                <div key={s.label} style={{ flex: 1, minWidth: '120px', padding: '1rem 1.5rem', borderRadius: '12px', backgroundColor: s.bg, border: `1px solid ${s.color}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: '0.8rem', color: s.color, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ color: '#ee5d50', padding: '1rem', borderRadius: '8px', background: 'rgba(238,93,80,0.1)', marginBottom: '1rem' }}>{error}</div>}
          {success && <div style={{ color: '#05cd99', padding: '1rem', borderRadius: '8px', background: 'rgba(5,205,153,0.1)', marginBottom: '1rem' }}>{success}</div>}

          {!selectedClasseId ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
              <p>Sélectionnez une classe pour démarrer l'appel.</p>
            </div>
          ) : eleves.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
              <p>Aucun élève assigné à cette classe.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Élève</th>
                      <th>Matricule</th>
                      <th style={{ textAlign: 'center' }}>Statut de présence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eleves.map((eleve, idx) => {
                      const statut = appel[eleve.id] || 'PRESENT';
                      return (
                        <tr key={eleve.id} style={{ backgroundColor: statut === 'ABSENT' ? 'rgba(238,93,80,0.03)' : statut === 'RETARD' ? 'rgba(255,206,32,0.03)' : undefined }}>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{eleve.profil.nom} {eleve.profil.prenom}</td>
                          <td><span className="badge badge-primary">{eleve.matricule}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              {(['PRESENT', 'ABSENT', 'RETARD'] as const).map(s => (
                                <button key={s} onClick={() => handleStatut(eleve.id, s)} style={{
                                  padding: '0.4rem 0.9rem',
                                  borderRadius: '8px',
                                  border: `2px solid ${statut === s ? STATUTS[s].color : 'transparent'}`,
                                  backgroundColor: statut === s ? STATUTS[s].bg : 'rgba(163,174,209,0.05)',
                                  color: statut === s ? STATUTS[s].color : 'var(--text-secondary)',
                                  fontWeight: statut === s ? 700 : 400,
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}>
                                  {STATUTS[s].emoji} {STATUTS[s].label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={handleSubmitAppel} disabled={submitting} style={{ width: 'auto', minWidth: '200px', fontSize: '1rem', padding: '0.875rem 2rem' }}>
                  {submitting ? '⏳ Enregistrement...' : `✓ Valider l'appel (${eleves.length} élèves)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== TAB: PRÉSENCES ENSEIGNANTS ===== */}
      {tab === 'ENSEIGNANTS' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#d97706' }}>👨‍🏫 Pointage Quotidien du Corps Enseignant</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Date de pointage : <strong>{today}</strong></p>
            </div>
            <button className="btn-primary" onClick={handleSubmitAppelEnseignants} disabled={submitting || enseignants.length === 0} style={{ width: 'auto', backgroundColor: '#d97706' }}>
              {submitting ? 'Enregistrement...' : `✓ Valider le pointage (${enseignants.length} profs)`}
            </button>
          </div>

          {error && <div style={{ color: '#ee5d50', padding: '1rem', borderRadius: '8px', background: 'rgba(238,93,80,0.1)', marginBottom: '1rem' }}>{error}</div>}
          {success && <div style={{ color: '#05cd99', padding: '1rem', borderRadius: '8px', background: 'rgba(5,205,153,0.1)', marginBottom: '1rem' }}>{success}</div>}

          {loadingEnseignants ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              Chargement des enseignants...
            </div>
          ) : enseignants.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🏫</div>
              <p>Aucun enseignant enregistré dans l'établissement.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Enseignant</th>
                    <th>Téléphone</th>
                    <th>Heure d'arrivée</th>
                    <th style={{ textAlign: 'center' }}>Statut de Présence</th>
                  </tr>
                </thead>
                <tbody>
                  {enseignants.map(p => {
                    const current = appelEnseignants[p.id] || { statut: 'PRESENT', heureArrivee: '07:45' };
                    return (
                      <tr key={p.id}>
                        <td><span className="badge badge-success">{p.matricule}</span></td>
                        <td style={{ fontWeight: 600 }}>{p.profil?.nom} {p.profil?.prenom}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>📞 {p.profil?.telephone || 'N/A'}</td>
                        <td>
                          <input
                            type="time"
                            className="input-field"
                            style={{ width: '110px', padding: '4px 8px', marginBottom: 0 }}
                            value={current.heureArrivee}
                            onChange={e => handleHeureArriveeEnseignant(p.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            {(['PRESENT', 'ABSENT', 'RETARD', 'CONGE'] as const).map(st => (
                              <button key={st} onClick={() => handleStatutEnseignant(p.id, st)} style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                border: `2px solid ${current.statut === st ? STATUTS[st].color : 'transparent'}`,
                                backgroundColor: current.statut === st ? STATUTS[st].bg : 'rgba(163,174,209,0.05)',
                                color: current.statut === st ? STATUTS[st].color : 'var(--text-secondary)',
                                fontWeight: current.statut === st ? 700 : 400,
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}>
                                {STATUTS[st].emoji} {STATUTS[st].label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: HISTORIQUE ÉLÈVES ===== */}
      {tab === 'HISTORIQUE' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 2, minWidth: '250px' }}>
              <label className="input-label">🎓 ID ou Matricule de l'Élève</label>
              <input type="number" className="input-field" placeholder="Ex: 1" value={historyEleveId} onChange={e => setHistoryEleveId(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={loadHistory} disabled={!historyEleveId || historyLoading} style={{ width: 'auto', marginBottom: 0 }}>
              {historyLoading ? '...' : 'Voir l\'historique'}
            </button>
          </div>

          {history.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p>Saisissez un identifiant d'élève et cliquez sur "Voir l'historique".</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Matière</th>
                    <th>Statut</th>
                    <th>Justifié ?</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(p => {
                    const s = STATUTS[p.statut] || STATUTS['PRESENT'];
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                        <td>{p.classeMatiere?.matiere?.nom || '—'}</td>
                        <td><span className="badge" style={{ backgroundColor: s.bg, color: s.color }}>{s.emoji} {s.label}</span></td>
                        <td>{p.estJustifie ? <span style={{ color: '#05cd99' }}>✓ Oui</span> : <span style={{ color: 'var(--text-secondary)' }}>Non</span>}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.notesJustification || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
