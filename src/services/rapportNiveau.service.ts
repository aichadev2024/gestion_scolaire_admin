import api from './api';

export type NiveauGlobal = 'BON' | 'MOYEN' | 'FAIBLE' | 'PREOCCUPANT';

export interface EleveSignale {
  eleveId: number;
  matricule: string;
  nom?: string | null;
  prenom?: string | null;
  moyenne?: number | null;
  commentaire?: string | null;
}

export interface RapportNiveau {
  id: number;
  classeMatiereId: number;
  classeId: number;
  classeNom: string;
  matiereNom: string;
  enseignantNom?: string | null;
  auteur?: string | null;
  periode: string;
  niveauGlobal: NiveauGlobal;
  commentaire?: string | null;
  estTraite: boolean;
  reponseDirection?: string | null;
  dateCreation: string;
  dateTraitement?: string | null;
  eleves: EleveSignale[];
}

export interface EleveEnDifficulte {
  eleveId: number;
  matricule: string;
  nom?: string | null;
  prenom?: string | null;
  moyenne: number;
}

export interface RapportPayload {
  classeMatiereId: number;
  periode: string;
  niveauGlobal: NiveauGlobal;
  commentaire?: string;
  eleves: { eleveId: number; commentaire?: string }[];
}

export const rapportNiveauService = {
  mes: async (): Promise<RapportNiveau[]> => (await api.get<RapportNiveau[]>('/rapports-niveau/mes')).data,

  tous: async (classeId?: number, nonTraites?: boolean): Promise<RapportNiveau[]> =>
    (await api.get<RapportNiveau[]>('/rapports-niveau', { params: { classeId, nonTraites } })).data,

  enDifficulte: async (classeMatiereId: number, periode: string): Promise<EleveEnDifficulte[]> =>
    (await api.get<EleveEnDifficulte[]>('/rapports-niveau/en-difficulte', { params: { classeMatiereId, periode } })).data,

  creer: async (data: RapportPayload): Promise<RapportNiveau> =>
    (await api.post<RapportNiveau>('/rapports-niveau', data)).data,

  traiter: async (id: number, reponse?: string): Promise<RapportNiveau> =>
    (await api.patch<RapportNiveau>(`/rapports-niveau/${id}/traiter`, { reponse })).data,
};
