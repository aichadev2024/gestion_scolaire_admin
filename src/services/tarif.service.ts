import api from './api';

export interface TarifPlan {
  code: string;
  /** Libellé lisible, ex. « Jusqu'à 200 élèves ». */
  libelle: string;
  prixMensuel: number;
  /** Limite d'élèves actifs pour ce plan — null/undefined = illimité. */
  maxEleves?: number | null;
  /** Limite de comptes enseignants pour ce plan — null/undefined = illimité. */
  maxEnseignants?: number | null;
}

export interface Abonnement {
  plan: string;
  libelle: string;
  prixMensuel: number;
  maxEleves: number | null;
  elevesActifs: number;
  dateExpiration: string | null;
}

export const tarifService = {
  listerTous: async (): Promise<TarifPlan[]> => {
    const response = await api.get<TarifPlan[]>('/super-admin/tarifs');
    return response.data;
  },

  modifierPlan: async (
    code: string,
    prixMensuel: number,
    maxEleves: number | null,
    maxEnseignants: number | null,
  ): Promise<TarifPlan> => {
    const response = await api.put<TarifPlan>(`/super-admin/tarifs/${code}`, { prixMensuel, maxEleves, maxEnseignants });
    return response.data;
  },

  /** Abonnement de l'établissement de l'utilisateur connecté (direction/secrétariat). */
  monAbonnement: async (): Promise<Abonnement> => {
    const response = await api.get<Abonnement>('/abonnement');
    return response.data;
  },
};
