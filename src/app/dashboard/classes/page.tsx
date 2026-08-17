'use client';

import { useEffect, useState } from 'react';
import { classeService } from '@/services/classe.service';
import { enseignantService } from '@/services/enseignant.service';
import { matiereService } from '@/services/matiere.service';
import { classeMatiereService, ClasseMatiereItem } from '@/services/classeMatiere.service';
import { Classe, Niveau, Enseignant, Matiere } from '@/types';

type Tab = 'CLASSES' | 'ASSIGNATIONS';

// ─── Shared tab style helper ────────────────────────────────────────────────
const tabBtn = (active: boolean, color: string) => ({
  padding: '0.75rem 1.5rem',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.95rem',
  color: active ? color : 'var(--text-secondary)',
  borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
  transition: 'all 0.2s'
} as React.CSSProperties);

export default function ClassesPage() {
  const [tab, setTab] = useState<Tab>('CLASSES');

  // ── Classes state ──
  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClasseForm, setShowClasseForm] = useState(false);
  const [classeSubmitting, setClasseSubmitting] = useState(false);
  const [classeError, setClasseError] = useState('');

  const [classeForm, setClasseForm] = useState({
    nom: '', niveauId: '', enseignantPrincipalId: '', anneeScolaire: '2026/2027', capaciteMax: 30
  });

  // ── Assignations state ──
  const [selectedClasseId, setSelectedClasseId] = useState<string>('');
  const [assignations, setAssignations] = useState<ClasseMatiereItem[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  const [assignForm, setAssignForm] = useState({
    classeId: '', matiereId: '', enseignantId: '', coefficient: '1'
  });

  // ── Load common data ──
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cls, niv, ens, mat] = await Promise.all([
          classeService.getClasses(),
          classeService.getNiveaux(),
          enseignantService.getEnseignants(),
          matiereService.getMatieres()
        ]);
        setClasses(cls); setNiveaux(niv); setEnseignants(ens); setMatieres(mat);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Load assignations when a class is selected
  useEffect(() => {
    if (!selectedClasseId) { setAssignations([]); return; }
    setAssignLoading(true);
    classeMatiereService.getByClasse(parseInt(selectedClasseId))
      .then(setAssignations)
      .catch(console.error)
      .finally(() => setAssignLoading(false));
  }, [selectedClasseId]);

  // ── Handlers: Classe ──
  const handleClasseSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setClasseSubmitting(true); setClasseError('');
    try {
      await classeService.createClasse({
        nom: classeForm.nom,
        niveauId: parseInt(classeForm.niveauId),
        enseignantPrincipalId: parseInt(classeForm.enseignantPrincipalId),
        anneeScolaire: classeForm.anneeScolaire,
        capaciteMax: parseInt(classeForm.capaciteMax.toString())
      });
      setClasseForm({ nom: '', niveauId: '', enseignantPrincipalId: '', anneeScolaire: '2026/2027', capaciteMax: 30 });
      setShowClasseForm(false);
      setClasses(await classeService.getClasses());
    } catch (err: any) {
      setClasseError(err.response?.data?.message || 'Erreur lors de la création');
    } finally { setClasseSubmitting(false); }
  };

  // ── Handlers: Assignation ──
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setAssignSubmitting(true); setAssignError(''); setAssignSuccess('');
    try {
      await classeMatiereService.create({
        classeId: parseInt(assignForm.classeId || selectedClasseId),
        matiereId: parseInt(assignForm.matiereId),
        enseignantId: parseInt(assignForm.enseignantId),
        coefficient: parseFloat(assignForm.coefficient)
      });
      setAssignSuccess('✓ Matière assignée avec succès !');
      setAssignForm({ classeId: '', matiereId: '', enseignantId: '', coefficient: '1' });
      setShowAssignForm(false);
      // Refresh
      if (selectedClasseId) {
        setAssignations(await classeMatiereService.getByClasse(parseInt(selectedClasseId)));
      }
    } catch (err: any) {
      setAssignError(err.response?.data?.message || 'Erreur lors de l\'assignation');
    } finally { setAssignSubmitting(false); }
  };

  const handleDeleteAssign = async (id: number) => {
    if (!confirm('Retirer cette matière de la classe ?')) return;
    try {
      await classeMatiereService.delete(id);
      setAssignations(prev => prev.filter(a => a.id !== id));
    } catch { setAssignError('Erreur lors de la suppression'); }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {tab === 'CLASSES' ? 'Gestion des Classes' : 'Assignations Matières'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {tab === 'CLASSES'
              ? 'Créez vos classes et assignez un professeur principal.'
              : 'Liez les matières et leurs enseignants à chaque classe.'}
          </p>
        </div>
        {tab === 'CLASSES' ? (
          <button className="btn-primary" style={{ width: 'auto', backgroundColor: '#d97706' }} onClick={() => setShowClasseForm(!showClasseForm)}>
            {showClasseForm ? '✕ Annuler' : '+ Nouvelle Classe'}
          </button>
        ) : (
          <button className="btn-primary" style={{ width: 'auto', backgroundColor: 'var(--primary-color)' }} onClick={() => setShowAssignForm(!showAssignForm)}>
            {showAssignForm ? '✕ Annuler' : '+ Assigner une Matière'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(163,174,209,0.2)', marginBottom: '2rem' }}>
        <button style={tabBtn(tab === 'CLASSES', '#d97706')} onClick={() => setTab('CLASSES')}>
          🏫 Classes
        </button>
        <button style={tabBtn(tab === 'ASSIGNATIONS', 'var(--primary-color)')} onClick={() => setTab('ASSIGNATIONS')}>
          📚 Assignations Matières
        </button>
      </div>

      {/* ═══════════════ TAB: CLASSES ═══════════════ */}
      {tab === 'CLASSES' && (
        <>
          {showClasseForm && (
            <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #d97706' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>🏫 Nouvelle Classe</h2>
              {classeError && <div style={{ color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', background: 'rgba(238,93,80,0.1)', marginBottom: '1rem' }}>{classeError}</div>}
              <form onSubmit={handleClasseSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Nom de la classe *</label>
                  <input type="text" className="input-field" value={classeForm.nom} onChange={e => setClasseForm({...classeForm, nom: e.target.value})} placeholder="Ex: CM2-A" required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Niveau *</label>
                  <select className="input-field" value={classeForm.niveauId} onChange={e => setClasseForm({...classeForm, niveauId: e.target.value})} required>
                    <option value="">Sélectionnez un niveau</option>
                    {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Enseignant Principal *</label>
                  <select className="input-field" value={classeForm.enseignantPrincipalId} onChange={e => setClasseForm({...classeForm, enseignantPrincipalId: e.target.value})} required>
                    <option value="">Sélectionnez un professeur</option>
                    {enseignants.map(e => <option key={e.id} value={e.id}>{e.profil.nom} {e.profil.prenom}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Année Scolaire</label>
                  <input type="text" className="input-field" value={classeForm.anneeScolaire} onChange={e => setClasseForm({...classeForm, anneeScolaire: e.target.value})} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Capacité Maximale</label>
                  <input type="number" className="input-field" value={classeForm.capaciteMax} onChange={e => setClasseForm({...classeForm, capaciteMax: parseInt(e.target.value)})} required />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ width: '100%', backgroundColor: '#d97706' }} disabled={classeSubmitting}>
                    {classeSubmitting ? '⏳ Enregistrement...' : '✓ Créer la classe'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement des classes...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Niveau</th>
                    <th>Prof. Principal</th>
                    <th>Année Scolaire</th>
                    <th>Capacité</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏫</div>
                      Aucune classe créée
                    </td></tr>
                  ) : classes.map(c => (
                    <tr key={c.id}>
                      <td><span style={{ fontWeight: 700, color: '#d97706' }}>{c.nom}</span></td>
                      <td><span className="badge" style={{ backgroundColor: 'rgba(255,206,32,0.1)', color: '#d97706' }}>{c.niveauNom || '-'}</span></td>
                      <td>{c.enseignantPrincipalId ? `Prof. #${c.enseignantPrincipalId}` : '-'}</td>
                      <td>{c.anneeScolaire}</td>
                      <td>{c.capaciteMax} élèves</td>
                      <td>
                        <button
                          onClick={() => { setSelectedClasseId(String(c.id)); setTab('ASSIGNATIONS'); }}
                          style={{ background: 'none', border: '1px solid rgba(67,24,255,0.3)', color: 'var(--primary-color)', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          📚 Matières
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ TAB: ASSIGNATIONS ═══════════════ */}
      {tab === 'ASSIGNATIONS' && (
        <>
          {/* Class selector */}
          <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '250px' }}>
              <label className="input-label">🏫 Classe à configurer</label>
              <select className="input-field" value={selectedClasseId} onChange={e => setSelectedClasseId(e.target.value)}>
                <option value="">— Sélectionnez une classe —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.anneeScolaire})</option>)}
              </select>
            </div>
            {selectedClasseId && (
              <div style={{ padding: '0.5rem 1rem', background: 'rgba(67,24,255,0.08)', borderRadius: '8px', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.85rem' }}>
                {assignations.length} matière(s) assignée(s)
              </div>
            )}
          </div>

          {/* Add form */}
          {showAssignForm && (
            <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary-color)' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>➕ Assigner une matière</h2>
              {assignError && <div style={{ color: '#ee5d50', padding: '0.75rem', borderRadius: '8px', background: 'rgba(238,93,80,0.1)', marginBottom: '1rem' }}>{assignError}</div>}
              <form onSubmit={handleAssignSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Classe *</label>
                  <select className="input-field" value={assignForm.classeId || selectedClasseId} onChange={e => setAssignForm({...assignForm, classeId: e.target.value})} required>
                    <option value="">— Choisir —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Matière *</label>
                  <select className="input-field" value={assignForm.matiereId} onChange={e => setAssignForm({...assignForm, matiereId: e.target.value})} required>
                    <option value="">— Choisir —</option>
                    {matieres.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Enseignant *</label>
                  <select className="input-field" value={assignForm.enseignantId} onChange={e => setAssignForm({...assignForm, enseignantId: e.target.value})} required>
                    <option value="">— Choisir —</option>
                    {enseignants.map(e => <option key={e.id} value={e.id}>{e.profil.nom} {e.profil.prenom}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Coefficient</label>
                  <input type="number" step="0.5" min="0.5" className="input-field" value={assignForm.coefficient} onChange={e => setAssignForm({...assignForm, coefficient: e.target.value})} required />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowAssignForm(false)} style={{ background: 'none', border: '1px solid rgba(163,174,209,0.3)', color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Annuler</button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={assignSubmitting}>
                    {assignSubmitting ? '⏳ Enregistrement...' : '✓ Assigner'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {assignSuccess && <div style={{ color: '#05cd99', padding: '1rem', borderRadius: '8px', background: 'rgba(5,205,153,0.1)', marginBottom: '1rem' }}>{assignSuccess}</div>}

          {/* Assignations table */}
          {!selectedClasseId ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <p>Sélectionnez une classe pour voir et gérer ses matières.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Astuce : Cliquez sur "📚 Matières" dans la liste des classes !</p>
            </div>
          ) : assignLoading ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Matière</th>
                    <th>Code</th>
                    <th>Enseignant</th>
                    <th>Coefficient</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignations.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                      Aucune matière assignée à cette classe. Cliquez sur "+ Assigner" !
                    </td></tr>
                  ) : assignations.map(a => (
                    <tr key={a.id}>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontFamily: 'monospace' }}>
                          #{a.id}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{a.matiere?.nom}</td>
                      <td><span className="badge badge-primary">{a.matiere?.code}</span></td>
                      <td>{a.enseignant ? `${a.enseignant.profil.nom} ${a.enseignant.profil.prenom}` : '-'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#d97706' }}>{a.coefficient}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteAssign(a.id)} style={{ background: 'none', border: '1px solid rgba(238,93,80,0.3)', color: '#ee5d50', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          🗑 Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Important note */}
          {assignations.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', borderRadius: '10px', backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
                💡 <strong>Astuce Emploi du Temps :</strong> L'ID de la colonne # ci-dessus est votre <code>classeMatiereId</code> à utiliser lors de la création de créneaux dans l'emploi du temps.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
