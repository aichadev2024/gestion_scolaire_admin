import api from './api';
import { Salle } from '@/types';

export interface SallePayload {
  nom: string;
  capacite?: number;
}

export const salleService = {
  getSalles: async (): Promise<Salle[]> => {
    const response = await api.get<Salle[]>('/salles');
    return response.data;
  },

  createSalle: async (data: SallePayload): Promise<Salle> => {
    const response = await api.post<Salle>('/salles', data);
    return response.data;
  },

  updateSalle: async (id: number, data: SallePayload): Promise<Salle> => {
    const response = await api.put<Salle>(`/salles/${id}`, data);
    return response.data;
  },

  deleteSalle: async (id: number): Promise<void> => {
    await api.delete(`/salles/${id}`);
  },
};
