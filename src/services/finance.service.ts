import api from './api';
import { FraisScolarite, Paiement } from '@/types';

export interface CreateFraisPayload {
  classeId: number;
  titre: string;
  montant: number;
  dateEcheance: string;
}

export interface CreatePaiementPayload {
  eleveId: number;
  fraisId: number;
  montantPaye: number;
  modePaiement: string;
  referenceTransaction: string;
}

export const financeService = {
  getFraisByClasse: async (classeId: number): Promise<FraisScolarite[]> => {
    const response = await api.get<FraisScolarite[]>(`/frais-scolarite/classe/${classeId}`);
    return response.data;
  },

  createFrais: async (data: CreateFraisPayload): Promise<FraisScolarite> => {
    const response = await api.post<FraisScolarite>('/frais-scolarite', data);
    return response.data;
  },

  getPaiementsByEleve: async (eleveId: number): Promise<Paiement[]> => {
    const response = await api.get<Paiement[]>(`/paiements/eleve/${eleveId}`);
    return response.data;
  },

  createPaiement: async (data: CreatePaiementPayload): Promise<Paiement> => {
    const response = await api.post<Paiement>('/paiements', data);
    return response.data;
  },

  telechargerRecuPdf: async (numeroRecu: string): Promise<Blob> => {
    const response = await api.get(`/paiements/recu/${numeroRecu}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
