import api from './api';

export interface Etablissement {
  id: number;
  nom: string;
  code: string;
  emailContact?: string;
  telephone?: string;
  adresse?: string;
  statut: 'ACTIF' | 'SUSPENDU' | 'CLOTURE';
  planTarifaire: string;
  dateExpirationAbonnement?: string;
  dateCreation: string;
  adminUsername?: string;
  adminNomComplet?: string;
  adminEmail?: string;
}

export interface CreateEtablissementRequest {
  nomEtablissement: string;
  codeEtablissement: string;
  emailContact?: string;
  telephone?: string;
  adresse?: string;
  planTarifaire?: string;
  dateExpirationAbonnement?: string;
  adminUsername: string;
  adminEmail?: string;
  adminMotDePasse: string;
  adminProfil: {
    nom: string;
    prenom: string;
    telephone: string;
    adresse: string;
    genre: 'M' | 'F';
    dateNaissance: string;
  };
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
    data: { nom: string; emailContact?: string; telephone?: string; adresse?: string },
  ): Promise<Etablissement> => {
    const response = await api.put<Etablissement>(`/super-admin/etablissements/${id}`, data);
    return response.data;
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
