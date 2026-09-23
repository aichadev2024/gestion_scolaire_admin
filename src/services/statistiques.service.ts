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

export interface MoisMontant {
  mois: string;
  libelle: string;
  montant: number;
}

/** type : INSCRIPTION, MENSUALITE ou AUTRE — une ligne du relevé détaillé des paiements. */
export interface PaiementDetail {
  id: number;
  eleveId?: number;
  eleveNom?: string;
  elevePrenom?: string;
  matricule?: string;
  classeNom?: string;
  fraisTitre: string;
  type: 'INSCRIPTION' | 'MENSUALITE' | 'AUTRE';
  montant: number;
  date: string;
  mode: string;
  numeroRecu: string;
}

export interface StatistiquesFinances {
  devise: string;
  totalFraisAttendus: number;
  totalEncaisse: number;
  soldeRestant: number;
  encaisseMoisCourant: number;
  encaisseAnneeCourante: number;
  parMois: MoisMontant[];
  paiements: PaiementDetail[];
}

export const statistiquesService = {
  /** Vue d'ensemble (effectifs + finances) de son propre établissement — directeur ou promoteur. */
  etablissement: async (): Promise<StatistiquesEtablissement> =>
    (await api.get<StatistiquesEtablissement>('/statistiques/etablissement')).data,

  /** Détail des finances : mois/année en cours, courbe des 12 derniers mois, chaque paiement. */
  finances: async (): Promise<StatistiquesFinances> =>
    (await api.get<StatistiquesFinances>('/statistiques/finances')).data,
};
