import api from './api';

export interface RapportJournalier {
  id: number;
  eleve: { id: number; matricule: string; profil?: { prenom: string; nom: string } };
  date: string;
  repas?: string;
  siesteFaite?: boolean;
  dureeSiesteMinutes?: number;
  changesCouches?: number;
  humeur?: string;
  notes?: string;
  dateCreation: string;
  dateModification: string;
}

export interface RapportJournalierPayload {
  eleveId: number;
  date: string;
  repas?: string;
  siesteFaite?: boolean;
  dureeSiesteMinutes?: number;
  changesCouches?: number;
  humeur?: string;
  notes?: string;
}

export const rapportJournalierService = {
  enregistrer: async (payload: RapportJournalierPayload): Promise<RapportJournalier> => {
    const response = await api.post<RapportJournalier>('/rapports-journaliers', payload);
    return response.data;
  },

  listerParClasseEtDate: async (classeId: number, date: string): Promise<RapportJournalier[]> => {
    const response = await api.get<RapportJournalier[]>(`/rapports-journaliers/classe/${classeId}`, {
      params: { date },
    });
    return response.data;
  },

  listerParEleve: async (eleveId: number): Promise<RapportJournalier[]> => {
    const response = await api.get<RapportJournalier[]>(`/rapports-journaliers/eleve/${eleveId}`);
    return response.data;
  },
};
