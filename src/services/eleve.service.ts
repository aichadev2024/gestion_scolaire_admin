import api from './api';
import { Eleve, Profil } from '@/types';

export interface CreateElevePayload {
  profil: Profil;
  classeId?: number;
  parentId?: number;
}

export const eleveService = {
  getEleves: async (): Promise<Eleve[]> => {
    const response = await api.get<Eleve[]>('/eleves');
    return response.data;
  },

  createEleve: async (data: CreateElevePayload): Promise<Eleve> => {
    const response = await api.post<Eleve>('/eleves', data);
    return response.data;
  },

  updateEleve: async (id: number, data: CreateElevePayload): Promise<Eleve> => {
    const response = await api.put<Eleve>(`/eleves/${id}`, data);
    return response.data;
  }
};
