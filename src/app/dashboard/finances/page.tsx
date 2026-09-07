'use client';

import { useEffect, useState } from 'react';
import { financeService } from '@/services/finance.service';
import { classeService } from '@/services/classe.service';
import { eleveService } from '@/services/eleve.service';
import { Classe, Eleve, FraisScolarite, Paiement } from '@/types';

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<'FRAIS' | 'PAIEMENTS'>('FRAIS');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [fraisList, setFraisList] = useState<FraisScolarite[]>([]);
  const [paiementsEleve, setPaiementsEleve] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [editingFrais, setEditingFrais] = useState<FraisScolarite | null>(null);

  // Frais Form State
  const [fraisForm, setFraisForm] = useState({
    classeId: '',
    titre: '',
    montant: '',
    dateEcheance: ''
  });

  // Paiement Form State
  const [paiementForm, setPaiementForm] = useState({
    eleveId: '',
    fraisId: '',
    montantPaye: '',
    modePaiement: 'ESPECES',
    referenceTransaction: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clsData, elvData, frsData] = await Promise.all([
        classeService.getClasses(),
        eleveService.getEleves(),
        financeService.getAllFrais().catch(() => [])
      ]);
      setClasses(clsData);
      setEleves(elvData);
      setFraisList(frsData);
    } catch (err) {
      console.error("Erreur de chargement", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch payments when eleve is selected
  useEffect(() => {
    if (!paiementForm.eleveId) {
      setPaiementsEleve([]);
      return;
    }
    financeService.getPaiementsByEleve(parseInt(paiementForm.eleveId))
      .then(setPaiementsEleve)
      .catch(console.error);
  }, [paiementForm.eleveId]);

  const openEditFrais = (f: FraisScolarite) => {
    setEditingFrais(f);
    const resolvedClasseId = (f as any).classe?.id || f.classeId || (f.classeNom ? classes.find(c => c.nom === f.classeNom)?.id : '') || '';
    setFraisForm({
      classeId: String(resolvedClasseId),
      titre: f.titre,
      montant: String(f.montant),
      dateEcheance: f.dateEcheance ? f.dateEcheance.substring(0, 10) : ''
    });
  };

  const handleFraisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const payload = {
        classeId: parseInt(fraisForm.classeId),
        titre: fraisForm.titre,
        montant: parseFloat(fraisForm.montant),
        dateEcheance: fraisForm.dateEcheance
      };

      if (editingFrais) {
        await financeService.updateFrais(editingFrais.id, payload);
        setSuccess(`✅ Frais "${fraisForm.titre}" modifié avec succès !`);
      } else {
        await financeService.createFrais(payload);
        setSuccess(`✅ Frais "${fraisForm.titre}" créé avec succès !`);
      }

      setFraisForm({ classeId: '', titre: '', montant: '', dateEcheance: '' });
      setEditingFrais(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde du frais");
    }
  };

  const handleDeleteFrais = async (f: FraisScolarite) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la grille tarifaire "${f.titre}" ?`)) {
      try {
        await financeService.deleteFrais(f.id);
        setSuccess(`🗑️ Frais "${f.titre}" supprimé.`);
        await fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erreur lors de la suppression du frais");
      }
    }
  };

  const handlePaiementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await financeService.createPaiement({
        eleveId: parseInt(paiementForm.eleveId),
        fraisId: parseInt(paiementForm.fraisId),
        montantPaye: parseFloat(paiementForm.montantPaye),
        modePaiement: paiementForm.modePaiement,
        referenceTransaction: paiementForm.referenceTransaction || 'CASH'
      });
      setSuccess("✅ Paiement enregistré avec succès !");
      setPaiementForm({ ...paiementForm, montantPaye: '', referenceTransaction: '' });
      if (paiementForm.eleveId) {
        const updated = await financeService.getPaiementsByEleve(parseInt(paiementForm.eleveId));
        setPaiementsEleve(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement du paiement");
    }
  };

  const handleDownloadRecu = async (numeroRecu: string) => {
    try {
      setDownloadingPdf(numeroRecu);
      const blob = await financeService.telechargerRecuPdf(numeroRecu);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-${numeroRecu}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Impossible de télécharger le reçu PDF.");
    } finally {
      setDownloadingPdf(null);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Finances & Comptabilité</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gestion des frais de scolarité, encaissements et génération de reçus PDF.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn-primary"
          style={{ width: 'auto', backgroundColor: activeTab === 'FRAIS' ? 'var(--primary-color)' : 'rgba(163, 174, 209, 0.2)', color: activeTab === 'FRAIS' ? 'white' : 'var(--text-primary)' }}
          onClick={() => { setActiveTab('FRAIS'); setError(''); setSuccess(''); }}
        >
          Définir & Gérer les Frais de Scolarité
        </button>
        <button
          className="btn-primary"
          style={{ width: 'auto', backgroundColor: activeTab === 'PAIEMENTS' ? '#05cd99' : 'rgba(163, 174, 209, 0.2)', color: activeTab === 'PAIEMENTS' ? 'white' : 'var(--text-primary)' }}
          onClick={() => { setActiveTab('PAIEMENTS'); setError(''); setSuccess(''); }}
        >
          Encaisser un Paiement & Reçus
        </button>
      </div>

      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(238, 93, 80, 0.1)', borderRadius: '8px' }}>{error}</div>}
      {success && <div style={{ color: '#05cd99', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(5, 205, 153, 0.1)', borderRadius: '8px', fontWeight: 600 }}>{success}</div>}

      {activeTab === 'FRAIS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              {editingFrais ? `✏️ Modifier le Frais "${editingFrais.titre}"` : '➕ Nouveau Frais de Scolarité'}
            </h2>
            <form onSubmit={handleFraisSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Classe concernée *</label>
                <select className="input-field" value={fraisForm.classeId} onChange={e => setFraisForm({...fraisForm, classeId: e.target.value})} required>
                  <option value="">Sélectionnez une classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Titre (Ex: Inscription, Tranche 1)</label>
                <input type="text" className="input-field" value={fraisForm.titre} onChange={e => setFraisForm({...fraisForm, titre: e.target.value})} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Montant (FCFA)</label>
                <input type="number" className="input-field" value={fraisForm.montant} onChange={e => setFraisForm({...fraisForm, montant: e.target.value})} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Date d'échéance</label>
                <input type="date" className="input-field" value={fraisForm.dateEcheance} onChange={e => setFraisForm({...fraisForm, dateEcheance: e.target.value})} required />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                {editingFrais && (
                  <button type="button" onClick={() => { setEditingFrais(null); setFraisForm({ classeId: '', titre: '', montant: '', dateEcheance: '' }); }} style={{ background: 'none', border: '1px solid rgba(163,174,209,0.3)', color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                    Annuler
                  </button>
                )}
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  {editingFrais ? '✓ Enregistrer la modification' : '✓ Créer le frais'}
                </button>
              </div>
            </form>
          </div>

          {/* Frais List Table */}
          <div className="table-container">
            <h3 style={{ padding: '1rem 1.25rem', margin: 0, fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid rgba(163,174,209,0.1)' }}>
              📋 Grilles Tarifaires Configurée(s) ({fraisList.length})
            </h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titre / Motif</th>
                  <th>Classe</th>
                  <th>Montant</th>
                  <th>Échéance</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fraisList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      Aucun frais de scolarité configuré
                    </td>
                  </tr>
                ) : (
                  fraisList.map(f => (
                    <tr key={f.id}>
                      <td><span className="badge badge-primary">#{f.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{f.titre}</td>
                      <td>{(f as any).classe?.nom || f.classeNom || classes.find(c => c.id === f.classeId)?.nom || '-'}</td>
                      <td style={{ fontWeight: 700, color: '#05cd99' }}>{f.montant?.toLocaleString('fr-FR')} FCFA</td>
                      <td>{f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString('fr-FR') : '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => openEditFrais(f)}
                            style={{
                              background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)',
                              padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                            }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteFrais(f)}
                            style={{
                              background: 'rgba(238,93,80,0.1)', color: '#ee5d50', border: '1px solid rgba(238,93,80,0.3)',
                              padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                            }}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'PAIEMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>💳 Encaisser un paiement</h2>
            <form onSubmit={handlePaiementSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Élève *</label>
                <select className="input-field" value={paiementForm.eleveId} onChange={e => setPaiementForm({...paiementForm, eleveId: e.target.value})} required>
                  <option value="">— Sélectionnez un élève —</option>
                  {eleves.map(e => <option key={e.id} value={e.id}>{e.matricule} - {e.profil.nom} {e.profil.prenom}</option>)}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Frais Concerné *</label>
                <select 
                  className="input-field" 
                  value={paiementForm.fraisId} 
                  onChange={e => {
                    const selectedId = e.target.value;
                    const foundObj = fraisList.find(f => String(f.id) === selectedId);
                    setPaiementForm({
                      ...paiementForm, 
                      fraisId: selectedId,
                      montantPaye: foundObj ? String(foundObj.montant) : paiementForm.montantPaye
                    });
                  }} 
                  required
                >
                  <option value="">— Sélectionnez un frais —</option>
                  {fraisList.map(f => {
                    const cNom = (f as any).classe?.nom || f.classeNom || classes.find(c => c.id === f.classeId)?.nom || 'Toutes classes';
                    return (
                      <option key={f.id} value={f.id}>
                        {f.titre} ({cNom}) — {f.montant?.toLocaleString('fr-FR')} FCFA
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Montant Payé (FCFA) *</label>
                <input type="number" className="input-field" value={paiementForm.montantPaye} onChange={e => setPaiementForm({...paiementForm, montantPaye: e.target.value})} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Mode de Paiement</label>
                <select className="input-field" value={paiementForm.modePaiement} onChange={e => setPaiementForm({...paiementForm, modePaiement: e.target.value})}>
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="VIREMENT">Virement</option>
                </select>
              </div>

              {paiementForm.modePaiement !== 'ESPECES' && (
                <div className="input-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label className="input-label">Référence Transaction *</label>
                  <input type="text" className="input-field" value={paiementForm.referenceTransaction} onChange={e => setPaiementForm({...paiementForm, referenceTransaction: e.target.value})} required />
                </div>
              )}

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ width: 'auto', backgroundColor: '#05cd99' }}>
                  ✓ Enregistrer & Générer Reçu
                </button>
              </div>
            </form>
          </div>

          {paiementForm.eleveId && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                📋 Historique des Paiements & Reçus PDF
              </h3>
              {paiementsEleve.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aucun paiement enregistré pour cet élève.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(163,174,209,0.2)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>N° Reçu / Date</th>
                      <th style={{ padding: '0.75rem' }}>Montant</th>
                      <th style={{ padding: '0.75rem' }}>Mode</th>
                      <th style={{ padding: '0.75rem' }}>Référence</th>
                      <th style={{ padding: '0.75rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiementsEleve.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(163,174,209,0.1)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                          {p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#05cd99' }}>
                          {p.montantPaye?.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td style={{ padding: '0.75rem' }}>{p.modePaiement}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {p.referenceTransaction || 'CASH'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => handleDownloadRecu(p.numeroRecu)}
                            disabled={downloadingPdf === p.numeroRecu}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(5,205,153,0.1)',
                              color: '#05cd99',
                              border: '1px solid rgba(5,205,153,0.3)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            {downloadingPdf === String(p.id) ? '⏳ PDF...' : '📄 Télécharger Reçu PDF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
