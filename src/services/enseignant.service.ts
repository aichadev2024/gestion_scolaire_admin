import api from './api';
import { Enseignant, Profil } from '@/types';

export interface CreateEnseignantPayload {
  biographie: string;
  profil: Profil;
}

export const enseignantService = {
  getEnseignants: async (): Promise<Enseignant[]> => {
    const response = await api.get<Enseignant[]>('/enseignants');
    return response.data;
  },

  createEnseignant: async (data: CreateEnseignantPayload): Promise<Enseignant> => {
    const response = await api.post<Enseignant>('/enseignants', data);
    return response.data;
  }
};
