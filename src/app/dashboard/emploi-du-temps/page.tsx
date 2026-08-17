'use client';

import { useEffect, useState } from 'react';
import { emploiDuTempsService, EmploiDuTempsItem } from '@/services/emploiDuTemps.service';
import { classeService } from '@/services/classe.service';
import { classeMatiereService, ClasseMatiereItem } from '@/services/classeMatiere.service';
import { Classe } from '@/types';

const JOURS_LABELS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const COLORS = [
  { bg: 'rgba(67,24,255,0.08)',  border: 'rgba(67,24,255,0.4)',  text: 'var(--primary-color)' },
  { bg: 'rgba(5,205,153,0.08)',  border: 'rgba(5,205,153,0.4)',  text: '#05cd99' },
  { bg: 'rgba(255,206,32,0.08)', border: 'rgba(255,206,32,0.4)', text: '#d97706' },
  { bg: 'rgba(238,93,80,0.08)',  border: 'rgba(238,93,80,0.4)',  text: '#ee5d50' },
  { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.4)', text: '#8b5cf6' },
];

const QUICK_PRESETS = [
  { label: '☕ Récréation (10h00 - 10h15)', name: 'Récréation', debut: '10:00', fin: '10:15', type: 'RECREATION', salle: 'Cour de Récréation' },
  { label: '🍱 Pause Déjeuner (12h00 - 13h00)', name: 'Pause Déjeuner', debut: '12:00', fin: '13:00', type: 'DEJEUNER', salle: 'Réfectoire / Cantine' },
  { label: '🥤 Pause de l\'après-midi (15h00 - 15h15)', name: 'Pause de 15h', debut: '15:00', fin: '15:15', type: 'RECREATION', salle: 'Cour de Récréation' }
];

const matiereColor = (matiereId: number) => COLORS[matiereId % COLORS.length];

export default function EmploiDuTempsPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<string>('');
  const [emplois, setEmplois] = useState<EmploiDuTempsItem[]>([]);
  const [classeMatieres, setClasseMatieres] = useState<ClasseMatiereItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [typeCreneau, setTypeCreneau] = useState<'COURS' | 'RECREATION' | 'DEJEUNER' | 'PAUSE'>('COURS');

  const [formData, setFormData] = useState({
    classeMatiereId: '',
    jourSemaine: '1',
    heureDebut: '08:00',
    heureFin: '10:00',
    salle: '',
    libellePause: 'Récréation'
  });

  useEffect(() => {
    classeService.getClasses().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedClasseId) {
      setEmplois([]);
      setClasseMatieres([]);
      return;
    }
    setLoading(true);

    Promise.all([
      emploiDuTempsService.getByClasse(parseInt(selectedClasseId)),
      classeMatiereService.getByClasse(parseInt(selectedClasseId))
    ])
      .then(([emploisData, cmData]) => {
        setEmplois(emploisData);
        setClasseMatieres(cmData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClasseId]);

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setTypeCreneau(preset.type as any);
    setFormData(prev => ({
      ...prev,
      libellePause: preset.name,
      heureDebut: preset.debut,
      heureFin: preset.fin,
      salle: preset.salle
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeCreneau === 'COURS' && !formData.classeMatiereId) {
      setError('Veuillez sélectionner une matière pour ce cours.');
      return;
    }

    const cId = parseInt(selectedClasseId);
    if (!cId || isNaN(cId)) {
      setError('Veuillez sélectionner une classe valide.');
      return;
    }

    const formatTime = (t: string) => {
      if (!t) return '08:00:00';
      return t.length === 5 ? `${t}:00` : t;
    };

    setSubmitting(true); setError(''); setSuccess('');
    try {
      await emploiDuTempsService.create({
        classeId: cId,
        classeMatiereId: typeCreneau === 'COURS' && formData.classeMatiereId ? parseInt(formData.classeMatiereId) : undefined,
        typeCreneau: typeCreneau,
        libellePause: typeCreneau !== 'COURS' ? (formData.libellePause || 'Récréation') : undefined,
        jourSemaine: parseInt(formData.jourSemaine),
        heureDebut: formatTime(formData.heureDebut),
        heureFin: formatTime(formData.heureFin),
        salle: formData.salle || (typeCreneau !== 'COURS' ? 'Cour / Cantine' : 'Salle de Classe')
      });
      setSuccess(typeCreneau === 'COURS' ? 'Cours planifié avec succès !' : `Pause "${formData.libellePause}" (${formData.heureDebut} - ${formData.heureFin}) ajoutée avec succès !`);
      setFormData({ classeMatiereId: '', jourSemaine: '1', heureDebut: '08:00', heureFin: '10:00', salle: '', libellePause: 'Récréation' });
      setShowForm(false);

      if (selectedClasseId) {
        const updated = await emploiDuTempsService.getByClasse(parseInt(selectedClasseId));
        setEmplois(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du créneau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    try {
      await emploiDuTempsService.delete(id);
      setEmplois(prev => prev.filter(e => e.id !== id));
    } catch { setError('Erreur lors de la suppression'); }
  };

  // Group emplois by day for grid view
  const byJour: Record<number, EmploiDuTempsItem[]> = {};
  for (let j = 1; j <= 6; j++) { byJour[j] = []; }
  emplois.forEach(e => {
    if (!byJour[e.jourSemaine]) byJour[e.jourSemaine] = [];
    byJour[e.jourSemaine].push(e);
    byJour[e.jourSemaine].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Emplois du Temps & Pauses</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Vue hebdomadaire, cours et créneaux de récréation/pause par classe.</p>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', backgroundColor: '#8b5cf6' }}
          onClick={() => setShowForm(!showForm)}
          disabled={!selectedClasseId}
        >
          {showForm ? '✕ Annuler' : '+ Nouveau Créneau / Pause'}
        </button>
      </div>

      {/* Selector */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '250px' }}>
          <label className="input-label">🏫 Sélectionnez une classe</label>
          <select className="input-field" value={selectedClasseId} onChange={e => setSelectedClasseId(e.target.value)}>
            <option value="">— Choisir une classe —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.anneeScolaire})</option>)}
          </select>
        </div>
        {selectedClasseId && (
          <div style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: '8px', color: '#8b5cf6', fontWeight: 600, fontSize: '0.9rem' }}>
            {emplois.length} créneau(x) planifié(s)
          </div>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>➕ Ajouter un créneau ou une pause</h2>
            
            {/* Toggle Type */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setTypeCreneau('COURS')}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  backgroundColor: typeCreneau === 'COURS' ? '#8b5cf6' : 'rgba(163,174,209,0.15)',
                  color: typeCreneau === 'COURS' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                📚 Cours d'Enseignement
              </button>
              <button
                type="button"
                onClick={() => setTypeCreneau('RECREATION')}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  backgroundColor: typeCreneau !== 'COURS' ? '#d97706' : 'rgba(163,174,209,0.15)',
                  color: typeCreneau !== 'COURS' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                ☕ Récréation / Pause / Repas
              </button>
            </div>
          </div>

          {/* Quick Preset Shortcuts for Pauses */}
          {typeCreneau !== 'COURS' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Raccourcis rapides :</span>
              {QUICK_PRESETS.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(217,119,6,0.3)',
                    backgroundColor: 'rgba(217,119,6,0.08)', color: '#d97706', fontSize: '0.75rem',
                    cursor: 'pointer', fontWeight: 500
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {error && <div style={{ color: '#ee5d50', padding: '0.75rem', borderRadius: '8px', background: 'rgba(238,93,80,0.1)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            
            {typeCreneau === 'COURS' ? (
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Matière & Enseignant *</label>
                <select
                  className="input-field"
                  value={formData.classeMatiereId}
                  onChange={e => setFormData({ ...formData, classeMatiereId: e.target.value })}
                  required
                >
                  <option value="">— Sélectionner —</option>
                  {classeMatieres.map(cm => (
                    <option key={cm.id} value={cm.id}>
                      {cm.matiere?.nom || 'Matière'} ({cm.enseignant?.profil ? `${cm.enseignant.profil.prenom} ${cm.enseignant.profil.nom}` : 'Sans enseignant'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Nom de la Pause / Récréation *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.libellePause}
                  onChange={e => setFormData({ ...formData, libellePause: e.target.value })}
                  placeholder="Ex: Récréation, Pause Déjeuner, Pause Prière..."
                  required
                />
              </div>
            )}

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Jour de la semaine</label>
              <select className="input-field" value={formData.jourSemaine} onChange={e => setFormData({ ...formData, jourSemaine: e.target.value })}>
                {[1,2,3,4,5,6].map(j => <option key={j} value={j}>{JOURS_LABELS[j]}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Heure de début (Manuelle) *</label>
              <input type="time" className="input-field" value={formData.heureDebut} onChange={e => setFormData({ ...formData, heureDebut: e.target.value })} required style={{ border: '2px solid rgba(217,119,6,0.3)' }} />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Heure de fin (Manuelle) *</label>
              <input type="time" className="input-field" value={formData.heureFin} onChange={e => setFormData({ ...formData, heureFin: e.target.value })} required style={{ border: '2px solid rgba(217,119,6,0.3)' }} />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Lieu / Salle</label>
              <input type="text" className="input-field" value={formData.salle} onChange={e => setFormData({ ...formData, salle: e.target.value })} placeholder={typeCreneau === 'COURS' ? 'Ex: Salle 101' : 'Ex: Cour de Récréation'} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" style={{ width: 'auto', minWidth: '220px', backgroundColor: typeCreneau === 'COURS' ? '#8b5cf6' : '#d97706' }} disabled={submitting}>
                {submitting ? 'Enregistrement...' : typeCreneau === 'COURS' ? '✓ Planifier le cours' : `☕ Enregistrer la pause (${formData.heureDebut} - ${formData.heureFin})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {success && <div style={{ color: '#05cd99', padding: '1rem', borderRadius: '8px', background: 'rgba(5,205,153,0.1)', marginBottom: '1rem' }}>{success}</div>}

      {/* Timetable Grid */}
      {!selectedClasseId ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
          <p style={{ fontSize: '1.1rem' }}>Sélectionnez une classe ci-dessus pour afficher et gérer son emploi du temps.</p>
        </div>
      ) : loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Chargement de l'emploi du temps...
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[1,2,3,4,5,6].map(jour => (
              <div key={jour}>
                <div style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  borderRadius: '10px 10px 0 0',
                  background: jour === new Date().getDay() ? 'var(--primary-color)' : 'rgba(163,174,209,0.1)',
                  color: jour === new Date().getDay() ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                  borderBottom: jour === new Date().getDay() ? 'none' : '1px solid rgba(163,174,209,0.2)'
                }}>
                  {JOURS_LABELS[jour]}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {byJour[jour].length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.5, border: '1px dashed rgba(163,174,209,0.3)', borderRadius: '8px' }}>
                      Libre
                    </div>
                  ) : (
                    byJour[jour].map(slot => {
                      const isPause = slot.typeCreneau === 'RECREATION' || slot.typeCreneau === 'DEJEUNER' || slot.typeCreneau === 'PAUSE' || !slot.classeMatiere;
                      const c = isPause 
                        ? { bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.4)', text: '#d97706' }
                        : (slot.classeMatiere?.matiere?.id ? matiereColor(slot.classeMatiere.matiere.id) : COLORS[0]);

                      return (
                        <div key={slot.id} style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          backgroundColor: c.bg,
                          border: `1px solid ${c.border}`,
                          position: 'relative'
                        }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: c.text, marginBottom: '0.25rem' }}>
                            {isPause ? (
                              <span>☕ {slot.libellePause || 'Récréation / Pause'}</span>
                            ) : (
                              <span>📚 {slot.classeMatiere?.matiere?.nom || 'Matière'}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            🕐 {slot.heureDebut?.substring(0,5)} – {slot.heureFin?.substring(0,5)}
                          </div>
                          {slot.salle && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              📍 {slot.salle}
                            </div>
                          )}
                          {!isPause && slot.classeMatiere?.enseignant?.profil && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              👤 {slot.classeMatiere.enseignant.profil.prenom} {slot.classeMatiere.enseignant.profil.nom}
                            </div>
                          )}
                          <button onClick={() => handleDelete(slot.id)} style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#ee5d50', fontSize: '0.75rem', opacity: 0.6,
                            padding: '2px 6px', borderRadius: '4px'
                          }} title="Supprimer ce créneau">✕</button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          {emplois.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
              Aucun créneau créé pour cette classe.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
