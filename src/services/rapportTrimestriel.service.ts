import api from './api';

export interface RapportEntete {
  nom: string;
  slogan?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  rive?: string | null;
  cap?: string | null;
}

export interface RapportLigneMatiere {
  matiere: string;
  enseignant?: string | null;
  coefficient: number;
  moyenne: number | null;
  tauxReussite: number | null;
  eleves: number;
}

export interface RapportLigneClasse {
  classeId: number;
  classe: string;
  effectif: number;
  evalues: number;
  moyenne: number | null;
  tauxReussite: number | null;
  tauxPresence: number | null;
}

export interface RapportEleve {
  nom: string;
  classe: string;
  moyenne: number;
}

export interface RapportTrimestriel {
  entete: RapportEntete;
  portee: string;
  classeId: number | null;
  periode: string;
  anneeScolaire: string;
  dateDebut: string;
  dateFin: string;
  commentaire: string | null;
  genereLe: string;
  effectifs: { total: number; garcons: number; filles: number };
  presences: {
    presents: number;
    retards: number;
    absencesJustifiees: number;
    absencesNonJustifiees: number;
    tauxPresence: number | null;
  };
  resultats: {
    evalues: number;
    nonEvalues: number;
    moyenne: number | null;
    moyenneMin: number | null;
    moyenneMax: number | null;
    tauxReussite: number | null;
    mentions: Record<string, number>;
  };
  matieres: RapportLigneMatiere[];
  classes: RapportLigneClasse[];
  meilleurs: RapportEleve[];
  enDifficulte: RapportEleve[];
  discipline: { total: number; parStatut: Record<string, number>; nonTraites: number };
}

export interface RapportParams {
  classeId?: number;
  periode: string;
  anneeScolaire: string;
  dateDebut?: string;
  dateFin?: string;
}

export const rapportTrimestrielService = {
  generer: async (params: RapportParams): Promise<RapportTrimestriel> => {
    const response = await api.get<RapportTrimestriel>('/rapports-trimestriels', { params });
    return response.data;
  },

  /** Enregistre le bilan de la direction et les dates retenues pour ce rapport. */
  enregistrer: async (data: RapportParams & { commentaire: string }): Promise<void> => {
    await api.put('/rapports-trimestriels', data);
  },
};
