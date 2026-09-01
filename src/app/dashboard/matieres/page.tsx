'use client';

import { useEffect, useState } from 'react';
import { matiereService } from '@/services/matiere.service';
import { Matiere } from '@/types';

export default function MatieresPage() {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nom: '',
    code: ''
  });

  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const data = await matiereService.getMatieres();
      setMatieres(data);
    } catch (err) {
      console.error("Erreur lors du chargement des matières", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, []);

  const openNewForm = () => {
    setEditingMatiere(null);
    setFormData({ nom: '', code: '' });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (m: Matiere) => {
    setEditingMatiere(m);
    setFormData({ nom: m.nom, code: m.code });
    setError('');
    setShowForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingMatiere) {
        await matiereService.updateMatiere(editingMatiere.id, formData);
        setSuccess(`✅ Matière "${formData.nom}" modifiée avec succès !`);
      } else {
        await matiereService.createMatiere(formData);
        setSuccess(`✅ Matière "${formData.nom}" créée avec succès !`);
      }

      setFormData({ nom: '', code: '' });
      setShowForm(false);
      setEditingMatiere(null);
      await fetchMatieres();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde de la matière");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (m: Matiere) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la matière "${m.nom}" (${m.code}) ?`)) {
      try {
        await matiereService.deleteMatiere(m.id);
        setSuccess(`🗑️ Matière "${m.nom}" supprimée.`);
        await fetchMatieres();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erreur lors de la suppression de la matière");
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestion des Matières</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Créez, modifiez et gérez le catalogue des matières d'enseignement.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={() => showForm ? setShowForm(false) : openNewForm()}>
          {showForm ? '✕ Annuler' : '+ Nouvelle Matière'}
        </button>
      </div>

      {success && <div style={{ color: '#05cd99', padding: '1rem', borderRadius: '8px', background: 'rgba(5,205,153,0.1)', marginBottom: '1.5rem', fontWeight: 600 }}>{success}</div>}

      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
            {editingMatiere ? `✏️ Modifier la matière "${editingMatiere.nom}"` : 'Ajouter une matière'}
          </h2>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nom de la matière *</label>
              <input type="text" name="nom" className="input-field" value={formData.nom} onChange={handleInputChange} placeholder="Ex: Mathématiques" required />
            </div>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Code *</label>
              <input type="text" name="code" className="input-field" value={formData.code} onChange={handleInputChange} placeholder="Ex: MATH-01" required />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid rgba(163,174,209,0.3)', color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : editingMatiere ? '✓ Enregistrer les modifications' : '✓ Créer la matière'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement des matières...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom de la Matière</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matieres.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>Aucune matière enregistrée</td>
                </tr>
              ) : (
                matieres.map((m) => (
                  <tr key={m.id}>
                    <td><span className="badge badge-primary">{m.code}</span></td>
                    <td style={{ fontWeight: 600 }}>{m.nom}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditForm(m)}
                          style={{
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1',
                            padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                          }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          style={{
                            background: 'rgba(238,93,80,0.1)', border: '1px solid rgba(238,93,80,0.3)', color: '#ee5d50',
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
        )}
      </div>
    </div>
  );
}
