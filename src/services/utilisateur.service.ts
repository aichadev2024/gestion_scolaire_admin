import api from './api';

export interface RegisterPayload {
  username?: string;
  email: string;
  motDePasse: string;
  role: string;
  /** Niveau auquel restreindre ce compte (ex. directeur/censeur d'un seul niveau) — absent/undefined = accès à tout l'établissement. */
  niveauSuperviseId?: number | null;
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
  niveauSuperviseId?: number;
  niveauSuperviseNom?: string;
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

  /** Nomme cette personne directrice du niveau donné — l'ancien titulaire de CE niveau redevient Secrétaire. */
  nommerDirecteur: async (id: number, niveauId: number): Promise<UtilisateurResponse> => {
    const response = await api.patch<UtilisateurResponse>(`/utilisateurs/${id}/nommer-directeur`, { niveauId });
    return response.data;
  },
};
