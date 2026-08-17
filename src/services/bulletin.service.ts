import api from './api';
import { Bulletin } from '@/types';

export const bulletinService = {
  genererBulletin: async (eleveId: number, periode: string, anneeScolaire: string): Promise<Bulletin> => {
    const response = await api.post<Bulletin>(`/bulletins/generer?eleveId=${eleveId}&periode=${periode}&anneeScolaire=${anneeScolaire}`);
    return response.data;
  },

  getBulletinDetails: async (eleveId: number, periode: string, anneeScolaire: string): Promise<Bulletin> => {
    const response = await api.get<Bulletin>(`/bulletins/eleve/${eleveId}?periode=${periode}&anneeScolaire=${anneeScolaire}`);
    return response.data;
  },

  verrouillerBulletin: async (id: number): Promise<Bulletin> => {
    const response = await api.post<Bulletin>(`/bulletins/${id}/verrouiller`);
    return response.data;
  },

  telechargerPdf: async (bulletinId: number): Promise<Blob> => {
    const response = await api.get(`/bulletins/${bulletinId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
