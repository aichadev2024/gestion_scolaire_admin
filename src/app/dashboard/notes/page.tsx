'use client';

import { useEffect, useState } from 'react';
import { classeService } from '@/services/classe.service';
import { classeMatiereService, ClasseMatiereItem } from '@/services/classeMatiere.service';
import { eleveService } from '@/services/eleve.service';
import { noteService } from '@/services/note.service';
import { Classe, Eleve, Note } from '@/types';

export default function NotesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [matieres, setMatieres] = useState<ClasseMatiereItem[]>([]);
  const [existingNotes, setExistingNotes] = useState<Note[]>([]);

  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [selectedMatiereId, setSelectedMatiereId] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('TRIMESTRE_1');

  // New Note Form State
  const [valeur, setValeur] = useState<number | ''>('');
  const [noteMax, setNoteMax] = useState<number>(20);
  const [typeEvaluation, setTypeEvaluation] = useState('DEVOIR');
  const [appreciation, setAppreciation] = useState('');
  const [targetEleveId, setTargetEleveId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    classeService.getClasses().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClasseId) {
      classeMatiereService.getByClasse(Number(selectedClasseId)).then(setMatieres).catch(console.error);
      eleveService.getEleves().then(res => setEleves(res.filter(e => String(e.classeId) === selectedClasseId && e.statut === 'ACTIF'))).catch(console.error);

      const foundClasse = classes.find(c => String(c.id) === selectedClasseId);
      if (foundClasse) {
        const isPrimaireOrMaternelle = foundClasse.niveauNom?.toLowerCase().includes('primaire') || 
                                       foundClasse.niveauNom?.toLowerCase().includes('maternelle') ||
                                       ['1ère', '2ème', '3ème', '4ème', '5ème', '6ème', 'ci', 'cp', 'ce1', 'ce2', 'cm1', 'cm2'].some(k => foundClasse.nom.toLowerCase().includes(k));
        if (isPrimaireOrMaternelle) {
          setSelectedPeriode('COMPOSITION_1');
        } else {
          setSelectedPeriode('TRIMESTRE_1');
        }
      }
    } else {
      setMatieres([]);
      setEleves([]);
    }
  }, [selectedClasseId, classes]);

  useEffect(() => {
    if (selectedMatiereId && selectedPeriode) {
      loadNotes();
    } else {
      setExistingNotes([]);
    }
  }, [selectedMatiereId, selectedPeriode]);

  const loadNotes = () => {
    if (selectedMatiereId) {
      noteService.getNotesClasseMatiere(Number(selectedMatiereId))
        .then(res => setExistingNotes(res.filter(n => n.periode === selectedPeriode)))
        .catch(console.error);
    }
  };

  const handleSaveNote = async (eleveId: number) => {
    if (valeur === '' || valeur < 0 || valeur > noteMax) {
      setErrorMsg('La note doit être comprise entre 0 et ' + noteMax);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await noteService.ajouterNote({
        eleveId,
        classeMatiereId: Number(selectedMatiereId),
        periode: selectedPeriode,
        typeEvaluation,
        valeur: Number(valeur),
        noteMax: Number(noteMax),
        appreciation
      });
      setSuccessMsg('Note enregistrée avec succès !');
      setTargetEleveId(null);
      setValeur('');
      setAppreciation('');
      loadNotes();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Erreur lors de l\'enregistrement de la note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Saisie des Notes</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Ajoutez ou consultez les notes par classe et matière.</p>
      </div>

      {/* Selectors */}
      <div className="glass-card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div className="input-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <label className="input-label">Classe</label>
          <select className="input-field" value={selectedClasseId} onChange={e => { setSelectedClasseId(e.target.value); setSelectedMatiereId(''); }}>
            <option value="">— Sélectionner —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="input-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <label className="input-label">Matière</label>
          <select className="input-field" value={selectedMatiereId} onChange={e => setSelectedMatiereId(e.target.value)} disabled={!selectedClasseId}>
            <option value="">— Sélectionner —</option>
            {matieres.map(m => <option key={m.id} value={m.id}>{m.matiere.nom} (Coef {m.coefficient})</option>)}
          </select>
        </div>
        <div className="input-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <label className="input-label">Période d'Évaluation</label>
          <select className="input-field" value={selectedPeriode} onChange={e => setSelectedPeriode(e.target.value)}>
            <optgroup label="📋 Compositions (Maternelle & Primaire : 1ère à 6ème Année)">
              <option value="COMPOSITION_1">Composition N° 1</option>
              <option value="COMPOSITION_2">Composition N° 2</option>
              <option value="COMPOSITION_3">Composition N° 3</option>
              <option value="COMPOSITION_4">Composition N° 4</option>
              <option value="COMPOSITION_5">Composition N° 5</option>
              <option value="COMPOSITION_6">Composition N° 6</option>
            </optgroup>
            <optgroup label="📅 Trimestres (Collège & Lycée : 7ème Année à Terminale)">
              <option value="TRIMESTRE_1">1er Trimestre</option>
              <option value="TRIMESTRE_2">2ème Trimestre</option>
              <option value="TRIMESTRE_3">3ème Trimestre</option>
            </optgroup>
            <optgroup label="🎓 Semestres">
              <option value="SEMESTRE_1">Semestre 1</option>
              <option value="SEMESTRE_2">Semestre 2</option>
            </optgroup>
          </select>
        </div>
      </div>

      {errorMsg && <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>{errorMsg}</div>}
      {successMsg && <div style={{ padding: '1rem', background: '#d1fae5', color: '#047857', borderRadius: '8px', marginBottom: '1rem' }}>{successMsg}</div>}

      {/* Eleves List */}
      {selectedClasseId && selectedMatiereId && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Élève</th>
                <th>Notes existantes</th>
                <th style={{ width: '300px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map(eleve => {
                const notesEleve = existingNotes.filter(n => n.eleveId === eleve.id);
                const isTarget = targetEleveId === eleve.id;

                return (
                  <tr key={eleve.id}>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>{eleve.matricule}</span></td>
                    <td style={{ fontWeight: 600 }}>{eleve.profil.nom.toUpperCase()} {eleve.profil.prenom}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {notesEleve.length === 0 ? <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Aucune note</span> : 
                          notesEleve.map((n, i) => (
                            <span key={i} style={{ padding: '2px 6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8rem' }}>
                              {n.valeur}/{n.noteMax} ({n.typeEvaluation.substring(0,3)})
                            </span>
                          ))
                        }
                      </div>
                    </td>
                    <td>
                      {!isTarget ? (
                        <button onClick={() => setTargetEleveId(eleve.id)} className="btn-primary" style={{ padding: '0.5rem', fontSize: '0.8rem', width: 'auto' }}>
                          + Ajouter Note
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="number" className="input-field" placeholder="Note" value={valeur} onChange={e => setValeur(e.target.value ? Number(e.target.value) : '')} style={{ width: '70px', padding: '0.4rem' }} />
                            <span style={{ alignSelf: 'center' }}>/</span>
                            <input type="number" className="input-field" value={noteMax} onChange={e => setNoteMax(Number(e.target.value))} style={{ width: '70px', padding: '0.4rem' }} />
                          </div>
                          <select className="input-field" value={typeEvaluation} onChange={e => setTypeEvaluation(e.target.value)} style={{ padding: '0.4rem' }}>
                            <option value="DEVOIR">Devoir</option>
                            <option value="EXAMEN">Examen</option>
                            <option value="PARTICIPATION">Participation</option>
                          </select>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button onClick={() => handleSaveNote(eleve.id)} disabled={loading} className="btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                              Enregistrer
                            </button>
                            <button onClick={() => setTargetEleveId(null)} style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {eleves.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Aucun élève actif dans cette classe.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
