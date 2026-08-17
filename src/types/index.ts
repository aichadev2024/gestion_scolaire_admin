export interface Profil {
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  photoUrl?: string;
  genre: 'M' | 'F';
  dateNaissance: string;
  adresse: string;
}

export interface Eleve {
  id: number;
  matricule: string;
  statut: string;
  classeId?: number;
  classeNom?: string;
  parentId?: number;
  profil: Profil;
  dateInscription: string;
  etablissementNom?: string;
}

export interface Enseignant {
  id: number;
  matricule: string;
  biographie: string;
  profil: Profil;
}

export interface Niveau {
  id: number;
  nom: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveauId: number;
  niveauNom: string;
  enseignantPrincipalId: number;
  anneeScolaire: string;
  capaciteMax: number;
}

export interface Matiere {
  id: number;
  nom: string;
  code: string;
}

export interface FraisScolarite {
  id: number;
  titre: string;
  montant: number;
  dateEcheance: string;
  classeId: number;
  classeNom?: string; // Adding it optional if backend doesn't send it, but let's assume it does or we don't strictly need it in nested objects
}

export interface Paiement {
  id: number;
  montantPaye: number;
  datePaiement: string;
  modePaiement: string;
  referenceTransaction: string;
  eleve: Eleve;
  fraisScolarite: FraisScolarite;
}

export interface Note {
  id?: number;
  eleveId: number;
  classeMatiereId: number;
  periode: string;
  typeEvaluation: string;
  valeur: number;
  noteMax: number;
  appreciation?: string;
}

export interface NoteDetail {
  id: number;
  valeur: number;
  noteMax: number;
  typeEvaluation: string;
  appreciation?: string;
}

export interface BulletinLigne {
  classeMatiereId: number;
  matiereNom: string;
  coefficient: number;
  moyenneEleve: number;
  notes: NoteDetail[];
}

export interface Bulletin {
  id?: number;
  eleveId: number;
  eleveNom: string;
  elevePrenom: string;
  eleveMatricule: string;
  classeId: number;
  classeNom: string;
  periode: string;
  anneeScolaire: string;
  moyenneGenerale: number;
  appreciationGenerale: string;
  estVerrouille: boolean;
  dateCreation?: string;
  dateModification?: string;
  lignes: BulletinLigne[];
}
