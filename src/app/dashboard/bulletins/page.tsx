'use client';

import { useEffect, useRef, useState } from 'react';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { bulletinService } from '@/services/bulletin.service';
import { authService } from '@/services/auth.service';
import { Classe, Eleve, Bulletin } from '@/types';

export default function BulletinsPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  
  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [selectedEleveId, setSelectedEleveId] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('TRIMESTRE_1');
  
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [nomEtablissement, setNomEtablissement] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const anneeScolaire = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  const bulletinRef = useRef<HTMLDivElement>(null);

  const role = authService.getCurrentUser()?.role || '';
  const canLock = role === 'ADMIN' || role === 'DIRECTEUR';

  const formatPeriode = (p: string) => {
    switch (p) {
      case 'COMPOSITION_1': return 'Composition N° 1';
      case 'COMPOSITION_2': return 'Composition N° 2';
      case 'COMPOSITION_3': return 'Composition N° 3';
      case 'COMPOSITION_4': return 'Composition N° 4';
      case 'COMPOSITION_5': return 'Composition N° 5';
      case 'COMPOSITION_6': return 'Composition N° 6';
      case 'TRIMESTRE_1': return '1er Trimestre';
      case 'TRIMESTRE_2': return '2ème Trimestre';
      case 'TRIMESTRE_3': return '3ème Trimestre';
      case 'SEMESTRE_1': return '1er Semestre';
      case 'SEMESTRE_2': return '2ème Semestre';
      default: return p ? p.replace('_', ' ') : '';
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user?.etablissementNom) {
      setNomEtablissement(user.etablissementNom);
    }
    classeService.getClasses().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClasseId) {
      eleveService.getEleves().then(res => setEleves(res.filter(e => String(e.classeId) === selectedClasseId && e.statut === 'ACTIF'))).catch(console.error);
      setSelectedEleveId('');
      setBulletin(null);

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
      setEleves([]);
      setBulletin(null);
    }
  }, [selectedClasseId, classes]);

  const loadBulletin = async (generate: boolean = false) => {
    if (!selectedEleveId) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setBulletin(null);
    try {
      if (generate) {
        const res = await bulletinService.genererBulletin(Number(selectedEleveId), selectedPeriode, anneeScolaire);
        setBulletin(res);
        setSuccessMsg('Bulletin généré avec succès.');
      } else {
        const res = await bulletinService.getBulletinDetails(Number(selectedEleveId), selectedPeriode, anneeScolaire);
        if (res && res.id) {
          setBulletin(res);
        } else {
          setErrorMsg('Aucun bulletin existant pour cette période. Veuillez le générer.');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Erreur lors du traitement du bulletin.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleLock = async () => {
    if (!bulletin?.id) return;
    if (!confirm('Êtes-vous sûr de vouloir verrouiller ce bulletin ? Les notes ne pourront plus être modifiées pour cette période.')) return;
    
    setLoading(true);
    try {
      const res = await bulletinService.verrouillerBulletin(bulletin.id);
      setBulletin(res);
      setSuccessMsg('Bulletin verrouillé de manière permanente.');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Erreur lors du verrouillage.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleExportPDF = async () => {
    if (!bulletin || !bulletinRef.current) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(bulletinRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`bulletin_${bulletin.eleveMatricule}_${selectedPeriode}.pdf`);
    } catch (e) {
      console.error('Erreur export PDF', e);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Bulletins Scolaires</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Consultez, générez et imprimez les bulletins trimestriels/semestriels.</p>
      </div>

      {/* Selectors */}
      <div className="glass-card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ padding: '0.6rem 1rem', background: 'rgba(27,54,93,0.06)', borderRadius: '10px', border: '1px solid rgba(27,54,93,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏛️</span>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Établissement Détecté</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 800 }}>{nomEtablissement || authService.getCurrentUser()?.etablissementNom || 'Lycée Massa Makan Diabaté (Bamako)'}</div>
          </div>
        </div>
        <div className="input-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
          <label className="input-label">Classe</label>
          <select className="input-field" value={selectedClasseId} onChange={e => setSelectedClasseId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="input-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <label className="input-label">Élève</label>
          <select className="input-field" value={selectedEleveId} onChange={e => { setSelectedEleveId(e.target.value); setBulletin(null); }} disabled={!selectedClasseId}>
            <option value="">— Sélectionner —</option>
            {eleves.map(e => <option key={e.id} value={e.id}>{e.profil.nom} {e.profil.prenom} ({e.matricule})</option>)}
          </select>
        </div>
        <div className="input-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
          <label className="input-label">Période</label>
          <select className="input-field" value={selectedPeriode} onChange={e => { setSelectedPeriode(e.target.value); setBulletin(null); }}>
            <optgroup label="📋 Compositions (Primaire / Maternelle : 1ère à 6ème Année)">
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => loadBulletin(false)} disabled={!selectedEleveId || loading} style={{ padding: '0.75rem 1rem', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', background: 'rgba(27,54,93,0.05)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
            🔍 Consulter
          </button>
          <button onClick={() => loadBulletin(true)} disabled={!selectedEleveId || loading} className="btn-primary" style={{ width: 'auto' }}>
            {loading ? '⏳' : '⚙️ Générer/Recalculer'}
          </button>
        </div>
      </div>

      {errorMsg && <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>{errorMsg}</div>}
      {successMsg && <div style={{ padding: '1rem', background: '#d1fae5', color: '#047857', borderRadius: '8px', marginBottom: '1rem' }}>{successMsg}</div>}

      {/* Bulletin Display */}
      {bulletin && (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Main Bulletin Canvas */}
          <div className="glass-card" style={{ flex: 1, overflowX: 'auto', padding: '0', background: 'white' }}>
            <div ref={bulletinRef} style={{ padding: '40px', minWidth: '800px', fontFamily: 'serif', color: '#000', backgroundColor: '#ffffff', position: 'relative' }}>
              
              {/* Entête Officiel de la République */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '15px', fontSize: '11px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RÉPUBLIQUE DU MALI</div>
                  <div style={{ fontStyle: 'italic', color: '#555' }}>Un Peuple - Un But - Une Foi</div>
                  <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>MINISTÈRE DE L'ÉDUCATION NATIONALE DU MALI</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#1B365D' }}>BULLETIN OFFICIEL DE NOTES</div>
                  <div style={{ fontSize: '11px', color: '#333', fontWeight: 600 }}>ANNÉE SCOLAIRE {bulletin.anneeScolaire}</div>
                </div>
              </div>

              {/* En-tête de l'Établissement (Nom de l'école à côté du logo) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #1B365D', paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <img src="/logo.png" alt="Logo Établissement" style={{ height: '75px', width: 'auto', objectFit: 'contain' }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1B365D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {(nomEtablissement || authService.getCurrentUser()?.etablissementNom || 'ÉTABLISSEMENT SCOLAIRE').toUpperCase()}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#d97706', fontWeight: 700, letterSpacing: '0.3px' }}>
                      Enseignement Général, Technique & Professionnel
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>
                      Excellence - Riguer - Discipline
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', background: 'rgba(27,54,93,0.04)', padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(27,54,93,0.15)' }}>
                  <h1 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase', color: '#1B365D', fontWeight: 800 }}>BULLETIN DE NOTES</h1>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 700, color: '#d97706' }}>{formatPeriode(bulletin.periode)}</p>
                </div>
              </div>

              {/* Infos élève */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', padding: '14px 20px', border: '1px solid #1B365D', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                <div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px' }}><strong>Nom & Prénom(s) :</strong> <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B365D' }}>{bulletin.eleveNom.toUpperCase()} {bulletin.elevePrenom}</span></p>
                  <p style={{ margin: 0, fontSize: '13px' }}><strong>Matricule :</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#d97706' }}>{bulletin.eleveMatricule}</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px' }}><strong>Classe :</strong> <span style={{ fontWeight: 'bold', color: '#1B365D' }}>{bulletin.classeNom}</span></p>
                  <p style={{ margin: 0, fontSize: '13px' }}><strong>Statut de l'élève :</strong> <span style={{ color: '#047857', fontWeight: 600 }}>✓ Inscrit / Régulier</span></p>
                </div>
              </div>

              {/* Tableau des notes */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', background: '#f5f5f5', width: '30%' }}>Matières</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', background: '#f5f5f5', width: '10%' }}>Coef.</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', background: '#f5f5f5', width: '15%' }}>Moyenne / 20</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', background: '#f5f5f5' }}>Détail Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.lignes.map(l => (
                    <tr key={l.classeMatiereId}>
                      <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{l.matiereNom}</td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{l.coefficient}</td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: l.moyenneEleve < 10 ? '#d32f2f' : '#000' }}>
                        {l.moyenneEleve > 0 ? l.moyenneEleve.toFixed(2) : '-'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                        {l.notes.length > 0 ? l.notes.map(n => `${n.valeur}/${n.noteMax}`).join(', ') : 'Aucune note'}
                      </td>
                    </tr>
                  ))}
                  {bulletin.lignes.length === 0 && (
                    <tr><td colSpan={4} style={{ border: '1px solid #000', padding: '20px', textAlign: 'center' }}>Aucune matière enregistrée.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={2} style={{ border: '1px solid #000', padding: '12px', textAlign: 'right', background: '#e0e0e0', fontSize: '16px' }}>MOYENNE GÉNÉRALE</th>
                    <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', background: '#e0e0e0', fontSize: '16px', color: (bulletin.moyenneGenerale || 0) < 10 ? '#d32f2f' : '#000' }}>
                      {bulletin.moyenneGenerale ? bulletin.moyenneGenerale.toFixed(2) : '-'} / 20
                    </th>
                    <th style={{ border: '1px solid #000', padding: '12px', background: '#e0e0e0' }}></th>
                  </tr>
                </tfoot>
              </table>

              {/* Décision / Appréciation & Signatures */}
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <div style={{ flex: 1, border: '1px solid #1B365D', padding: '12px 15px', borderRadius: '6px', minHeight: '110px', backgroundColor: '#fafafa' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', color: '#1B365D', fontWeight: 800 }}>Appréciation Globale du Conseil</h4>
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: '#222' }}>{bulletin.appreciationGenerale || '— Élève assidu, poursuivez vos efforts.'}</p>
                </div>
                <div style={{ width: '200px', border: '1px solid #1B365D', padding: '12px', borderRadius: '6px', minHeight: '110px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#1B365D', fontWeight: 800, textAlign: 'center' }}>Le Professeur Principal</h4>
                  <div style={{ flex: 1 }}></div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#888', textAlign: 'center' }}>(Visa)</p>
                </div>
                <div style={{ width: '220px', border: '1px solid #1B365D', padding: '12px', borderRadius: '6px', minHeight: '110px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#1B365D', fontWeight: 800, textAlign: 'center' }}>Le Chef d'Établissement</h4>
                  <div style={{ flex: 1 }}></div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#888', textAlign: 'center' }}>(Signature & Cachet Officiel)</p>
                </div>
              </div>

              {/* Watermark Verrouillé */}
              {bulletin.estVerrouille && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '80px', color: 'rgba(211,47,47,0.1)', fontWeight: 'bold', pointerEvents: 'none', border: '10px solid rgba(211,47,47,0.1)', padding: '20px' }}>
                  VERROUILLÉ
                </div>
              )}
            </div>
          </div>

          {/* Action sidebar */}
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
            
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Statut du Bulletin</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {bulletin.estVerrouille ? (
                  <span style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>🔒 Verrouillé</span>
                ) : (
                  <span style={{ padding: '4px 8px', background: '#d1fae5', color: '#047857', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>✏️ Modifiable</span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {bulletin.estVerrouille 
                  ? "Ce bulletin a été validé lors du conseil de classe. Il ne peut plus être modifié." 
                  : "Le calcul est basé sur les notes actuelles. S'il y a de nouvelles notes, vous devez 'Regénérer'."}
              </p>
            </div>

            <button onClick={handleExportPDF} disabled={pdfLoading} className="btn-primary" style={{ padding: '1rem' }}>
              {pdfLoading ? '⏳ Génération...' : '📄 Télécharger en PDF'}
            </button>
            
            {canLock && !bulletin.estVerrouille && (
              <button onClick={handleLock} style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>
                🔒 Verrouiller Définitivement
              </button>
            )}

            {bulletin.estVerrouille && (
              <div style={{ padding: '1rem', background: 'rgba(27,54,93,0.05)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Seul un administrateur base de données peut déverrouiller ce bulletin.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
