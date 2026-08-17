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

  toggleStatut: async (id: number, estActif: boolean): Promise<void> => {
    await api.patch(`/utilisateurs/${id}/statut`, { estActif });
  }
};
