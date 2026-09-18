import api from './api';

export interface Etablissement {
  id: number;
  nom: string;
  code: string;
  emailContact?: string;
  telephone?: string;
  adresse?: string;
  logoUrl?: string;
  devise?: string;
  slogan?: string;
  typeEtablissement: 'ECOLE' | 'CRECHE';
  statut: 'ACTIF' | 'SUSPENDU' | 'CLOTURE';
  planTarifaire: string;
  dateExpirationAbonnement?: string;
  dateCreation: string;
  adminUsername?: string;
  adminNomComplet?: string;
  adminEmail?: string;
  /** Niveaux proposés par cet établissement — vide = aucune restriction. */
  niveauIds?: number[];
  niveauNoms?: string[];
}

export interface DirecteurCreationPayload {
  username: string;
  email?: string;
  motDePasse: string;
  profil: {
    nom: string;
    prenom: string;
    telephone: string;
    adresse: string;
    genre: 'M' | 'F';
    dateNaissance: string;
  };
  /** Niveau auquel restreindre ce compte (ex. Lycée → "Censeur") — null/absent = accès à tout l'établissement ("Directeur"). */
  niveauSuperviseId?: number | null;
}

export interface CreateEtablissementRequest {
  nomEtablissement: string;
  codeEtablissement: string;
  emailContact?: string;
  telephone?: string;
  adresse?: string;
  planTarifaire?: string;
  dateExpirationAbonnement?: string;
  typeEtablissement?: 'ECOLE' | 'CRECHE';
  /** Un seul directeur (accès à tout) pour la plupart des écoles, ou plusieurs — un par niveau
   * (ex. Censeur du Lycée + Directeur du Collège) — pour les établissements organisés ainsi. */
  directeurs: DirecteurCreationPayload[];
  /** Niveaux que cet établissement propose — vide/absent = aucune restriction. */
  niveauIds?: number[];
}

export const etablissementService = {
  listerTous: async (): Promise<Etablissement[]> => {
    const response = await api.get<Etablissement[]>('/super-admin/etablissements');
    return response.data;
  },

  creer: async (data: CreateEtablissementRequest): Promise<Etablissement> => {
    const response = await api.post<Etablissement>('/super-admin/etablissements', data);
    return response.data;
  },

  modifierInfos: async (
    id: number,
    data: { nom: string; emailContact?: string; telephone?: string; adresse?: string; devise?: string; slogan?: string; niveauIds?: number[] },
  ): Promise<Etablissement> => {
    const response = await api.put<Etablissement>(`/super-admin/etablissements/${id}`, data);
    return response.data;
  },

  uploaderLogo: async (id: number, fichier: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', fichier);
    const response = await api.post<{ logoUrl: string }>(`/super-admin/etablissements/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.logoUrl;
  },

  supprimerLogo: async (id: number): Promise<void> => {
    await api.delete(`/super-admin/etablissements/${id}/logo`);
  },

  modifierStatut: async (id: number, statut: 'ACTIF' | 'SUSPENDU' | 'CLOTURE'): Promise<Etablissement> => {
    const response = await api.patch<Etablissement>(`/super-admin/etablissements/${id}/statut`, { statut });
    return response.data;
  },

  renouveler: async (id: number, planTarifaire: string, dureeMois: number): Promise<Etablissement> => {
    const response = await api.patch<Etablissement>(`/super-admin/etablissements/${id}/renouveler`, {
      planTarifaire,
      dureeMois,
    });
    return response.data;
  },

  telechargerRecuPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/super-admin/etablissements/${id}/recu-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }
};
