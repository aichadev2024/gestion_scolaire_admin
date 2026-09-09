'use client';

import { useEffect, useState } from 'react';
import { enseignantService } from '@/services/enseignant.service';
import { Enseignant } from '@/types';
import CredentialsBanner from '@/components/CredentialsBanner';

export default function EnseignantsPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEnseignant, setEditingEnseignant] = useState<Enseignant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nouveauCompte, setNouveauCompte] = useState<{ nom: string; motDePasse: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    genre: 'M',
    dateNaissance: '',
    adresse: '',
    biographie: ''
  });

  const fetchEnseignants = async () => {
    try {
      setLoading(true);
      const data = await enseignantService.getEnseignants();
      setEnseignants(data);
    } catch (err) {
      console.error("Erreur lors du chargement des enseignants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnseignants();
  }, []);

  const openNewForm = () => {
    setEditingEnseignant(null);
    setFormData({ prenom: '', nom: '', telephone: '', email: '', genre: 'M', dateNaissance: '', adresse: '', biographie: '' });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (prof: Enseignant) => {
    setEditingEnseignant(prof);
    setFormData({
      prenom: prof.profil?.prenom || '',
      nom: prof.profil?.nom || '',
      telephone: prof.profil?.telephone || '',
      email: prof.profil?.email || '',
      genre: prof.profil?.genre || 'M',
      dateNaissance: prof.profil?.dateNaissance ? prof.profil.dateNaissance.substring(0, 10) : '',
      adresse: prof.profil?.adresse || '',
      biographie: prof.biographie || ''
    });
    setError('');
    setShowForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        biographie: formData.biographie,
        profil: {
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          email: formData.email,
          genre: formData.genre as 'M' | 'F',
          dateNaissance: formData.dateNaissance,
          adresse: formData.adresse
        }
      };

      if (editingEnseignant) {
        await enseignantService.updateEnseignant(editingEnseignant.id, payload);
        setSuccess(`✅ Enseignant ${formData.prenom} ${formData.nom} modifié avec succès !`);
      } else {
        const cree = await enseignantService.createEnseignant(payload);
        setSuccess(`✅ Enseignant ${formData.prenom} ${formData.nom} ajouté avec succès !`);
        if (cree?.motDePasseInitial) {
          setNouveauCompte({
            nom: `${formData.prenom} ${formData.nom}`.trim() || 'Nouvel enseignant',
            motDePasse: cree.motDePasseInitial,
          });
        }
      }
      
      setShowForm(false);
      setEditingEnseignant(null);
      await fetchEnseignants();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde de l'enseignant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (prof: Enseignant) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'enseignant ${prof.profil.prenom} ${prof.profil.nom} ?`)) {
      try {
        await enseignantService.deleteEnseignant(prof.id);
        setSuccess(`🗑️ Enseignant ${prof.profil.prenom} ${prof.profil.nom} supprimé avec succès.`);
        await fetchEnseignants();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erreur lors de la suppression de l'enseignant");
      }
    }
  };

  return (
    <div>
      {nouveauCompte && (
        <CredentialsBanner
          title={`Compte enseignant « ${nouveauCompte.nom} » créé`}
          password={nouveauCompte.motDePasse}
          onClose={() => setNouveauCompte(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestion des Enseignants</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Consultez, modifiez et gérez les professeurs de l'établissement.</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ width: 'auto', backgroundColor: '#05cd99' }}
          onClick={() => showForm ? setShowForm(false) : openNewForm()}
        >
          {showForm ? '✕ Annuler' : '+ Nouvel Enseignant'}
        </button>
      </div>

      {success && <div style={{ color: '#05cd99', padding: '1rem', borderRadius: '8px', background: 'rgba(5,205,153,0.1)', marginBottom: '1.5rem', fontWeight: 600 }}>{success}</div>}

      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
            {editingEnseignant ? `✏️ Modifier l'enseignant ${editingEnseignant.profil.prenom} ${editingEnseignant.profil.nom}` : 'Ajouter un enseignant'}
          </h2>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Prénom *</label>
              <input type="text" name="prenom" className="input-field" value={formData.prenom} onChange={handleInputChange} placeholder="Ex: Oumar" required />
            </div>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nom *</label>
              <input type="text" name="nom" className="input-field" value={formData.nom} onChange={handleInputChange} placeholder="Ex: Traoré" required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Genre</label>
              <select name="genre" className="input-field" value={formData.genre} onChange={handleInputChange}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Date de Naissance *</label>
              <input type="date" name="dateNaissance" className="input-field" value={formData.dateNaissance} onChange={handleInputChange} required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Téléphone</label>
              <input type="text" name="telephone" className="input-field" value={formData.telephone} onChange={handleInputChange} placeholder="Ex: +223 76 00 00 00" />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Adresse Email (Optionnel)</label>
              <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} placeholder="Ex: oumar.traore@gmail.com (Optionnel)" />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Adresse</label>
              <input type="text" name="adresse" className="input-field" value={formData.adresse} onChange={handleInputChange} placeholder="Ex: Hamdallaye ACI 2000, Bamako" />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Biographie / Spécialité</label>
              <textarea 
                name="biographie" 
                className="input-field" 
                rows={3} 
                value={formData.biographie} 
                onChange={handleInputChange} 
                placeholder="Ex: Professeur de Mathématiques avec 10 ans d'expérience..."
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid rgba(163,174,209,0.3)', color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" style={{ width: 'auto', backgroundColor: '#05cd99' }} disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : editingEnseignant ? '✓ Enregistrer les modifications' : 'Enregistrer le professeur'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement des enseignants...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom & Prénom</th>
                <th>Téléphone</th>
                <th>Spécialité / Bio</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enseignants.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Aucun enseignant trouvé</td>
                </tr>
              ) : (
                enseignants.map((prof) => (
                  <tr key={prof.id}>
                    <td>
                      <span className="badge badge-success">{prof.matricule}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {prof.profil.nom} {prof.profil.prenom}
                    </td>
                    <td>{prof.profil.telephone || '-'}</td>
                    <td>{prof.biographie || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditForm(prof)}
                          style={{
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1',
                            padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                          }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(prof)}
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
