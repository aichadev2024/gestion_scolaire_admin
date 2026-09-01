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
  },

  updateEnseignant: async (id: number, data: CreateEnseignantPayload): Promise<Enseignant> => {
    const response = await api.put<Enseignant>(`/enseignants/${id}`, data);
    return response.data;
  },

  deleteEnseignant: async (id: number): Promise<void> => {
    await api.delete(`/enseignants/${id}`);
  }
};
