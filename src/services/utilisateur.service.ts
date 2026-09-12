import api from './api';

export interface RegisterPayload {
  username?: string;
  email: string;
  motDePasse: string;
  role: string;
  profil: {
    prenom: string;
    nom: string;
    telephone?: string;
    genre?: string;
    dateNaissance?: string;
    adresse?: string;
  };
}

export interface UtilisateurResponse {
  id: number;
  username?: string;
  email: string;
  role: string;
  estActif: boolean;
  dateCreation: string;
  profil?: {
    prenom: string;
    nom: string;
    telephone?: string;
    genre?: string;
  };
}

export const utilisateurService = {
  getAll: async (): Promise<UtilisateurResponse[]> => {
    const response = await api.get<UtilisateurResponse[]>('/utilisateurs');
    return response.data;
  },

  create: async (data: RegisterPayload): Promise<UtilisateurResponse> => {
    const response = await api.post<UtilisateurResponse>('/utilisateurs', data);
    return response.data;
  },

  update: async (id: number, data: Partial<RegisterPayload>): Promise<UtilisateurResponse> => {
    const response = await api.put<UtilisateurResponse>(`/utilisateurs/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/utilisateurs/${id}`);
  },

  toggleStatut: async (id: number, estActif: boolean): Promise<void> => {
    await api.patch(`/utilisateurs/${id}/statut`, { estActif });
  },

  nommerDirecteur: async (id: number): Promise<UtilisateurResponse> => {
    const response = await api.patch<UtilisateurResponse>(`/utilisateurs/${id}/nommer-directeur`);
    return response.data;
  },
};
