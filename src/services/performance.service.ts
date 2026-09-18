import api from './api';

export interface MatierePerf {
  classeMatiereId: number;
  matiereNom: string;
  enseignantNom?: string | null;
  moyenne: number;
  tauxReussite: number;
  elevesNotes: number;
}

export type Proposition = 'PASSAGE' | 'A_DELIBERER' | 'REDOUBLEMENT' | 'SANS_NOTES';
export type Decision = 'PASSAGE' | 'REDOUBLEMENT';

export interface ElevePerf {
  eleveId: number;
  matricule: string;
  nom?: string | null;
  prenom?: string | null;
  moyenne: number | null;
  rang: number;
  proposition: Proposition;
  decision?: Decision | null;
  commentaireDecision?: string | null;
}

export interface PerformanceClasse {
  classeId: number;
  classeNom: string;
  anneeScolaire: string;
  periode: string;
  seuilPassage: number;
  seuilRedoublement: number;
  effectif: number;
  elevesNotes: number;
  moyenneClasse: number;
  tauxReussite: number;
  moyenneMin: number;
  moyenneMax: number;
  matieres: MatierePerf[];
  eleves: ElevePerf[];
}

export const performanceService = {
  classe: async (classeId: number, periode: string, seuilPassage: number, seuilRedoublement: number): Promise<PerformanceClasse> => {
    const response = await api.get<PerformanceClasse>(`/performance/classe/${classeId}`, {
      params: { periode, seuilPassage, seuilRedoublement },
    });
    return response.data;
  },

  decider: async (eleveId: number, decision: Decision | 'AUCUNE', commentaire?: string): Promise<void> => {
    await api.put('/performance/decisions', { eleveId, decision, commentaire });
  },
};
