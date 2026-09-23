import api from './api';

export interface StatistiquesEtablissement {
  totalEleves: number;
  totalEnseignants: number;
  totalClasses: number;
  totalPersonnel: number;
  totalFraisAttendus: number;
  totalEncaisse: number;
  soldeRestant: number;
  devise: string;
}

export const statistiquesService = {
  /** Vue d'ensemble (effectifs + finances) de son propre établissement — directeur ou promoteur. */
  etablissement: async (): Promise<StatistiquesEtablissement> =>
    (await api.get<StatistiquesEtablissement>('/statistiques/etablissement')).data,
};
