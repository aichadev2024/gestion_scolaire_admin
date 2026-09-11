import api from './api';
import { FraisScolarite, Paiement, RetardPaiement } from '@/types';

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

  getAllFrais: async (): Promise<FraisScolarite[]> => {
    const response = await api.get<FraisScolarite[]>('/frais-scolarite');
    return response.data;
  },

  createFrais: async (data: CreateFraisPayload): Promise<FraisScolarite> => {
    const response = await api.post<FraisScolarite>('/frais-scolarite', data);
    return response.data;
  },

  updateFrais: async (id: number, data: CreateFraisPayload): Promise<FraisScolarite> => {
    const response = await api.put<FraisScolarite>(`/frais-scolarite/${id}`, data);
    return response.data;
  },

  deleteFrais: async (id: number): Promise<void> => {
    await api.delete(`/frais-scolarite/${id}`);
  },

  getPaiementsByEleve: async (eleveId: number): Promise<Paiement[]> => {
    const response = await api.get<Paiement[]>(`/paiements/eleve/${eleveId}`);
    return response.data;
  },

  createPaiement: async (data: CreatePaiementPayload): Promise<Paiement> => {
    const response = await api.post<Paiement>('/paiements', data);
    return response.data;
  },

  getRetardsPaiement: async (): Promise<RetardPaiement[]> => {
    const response = await api.get<RetardPaiement[]>('/paiements/retards');
    return response.data;
  },

  telechargerRecuPdf: async (numeroRecu: string): Promise<Blob> => {
    const response = await api.get(`/paiements/recu/${numeroRecu}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
