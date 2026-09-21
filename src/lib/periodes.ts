import { Classe } from '@/types';

export type CategorieClasse = 'LYCEE' | 'COLLEGE' | 'PRIMAIRE' | 'PRIMAIRE_6' | 'MATERNELLE' | 'ALL';

/**
 * Catégorie scolaire d'une classe d'après son niveau (jamais le nom seul, qui prête à confusion :
 * une classe de primaire « 6ème Année » ne doit pas être prise pour du collège).
 */
export function categoriePourClasse(c?: Classe): CategorieClasse {
  if (!c) return 'ALL';
  const niveau = (c.niveauNom || '').toLowerCase();
  const nom = (c.nom || '').toLowerCase();
  if (/lyc[ée]e/.test(niveau)) return 'LYCEE';
  if (/coll[èe]ge/.test(niveau)) return 'COLLEGE';
  if (/maternelle/.test(niveau)) return 'MATERNELLE';
  if (/primaire/.test(niveau)) {
    return /6\s*[eè]me|cm\s*2/.test(nom) ? 'PRIMAIRE_6' : 'PRIMAIRE';
  }
  if (/lyc[ée]e|term|2nde|1[eè]re/.test(nom)) return 'LYCEE';
  if (/coll[èe]ge|6è|7è|8è|9è/.test(nom)) return 'COLLEGE';
  if (/primaire|cp|ce1|ce2|cm1|cm2/.test(nom)) return 'PRIMAIRE';
  return 'ALL';
}

/** Un lycée fonctionne par trimestres ; le primaire et la maternelle par compositions ; le collège par les deux. */
export function periodesDisponibles(categorie: CategorieClasse): { trimestres: boolean; compositions: boolean } {
  return {
    trimestres: ['LYCEE', 'COLLEGE', 'PRIMAIRE_6', 'ALL'].includes(categorie),
    compositions: ['PRIMAIRE', 'PRIMAIRE_6', 'MATERNELLE', 'COLLEGE', 'ALL'].includes(categorie),
  };
}

export function periodeParDefaut(categorie: CategorieClasse): string {
  return periodesDisponibles(categorie).trimestres && categorie === 'LYCEE' ? 'TRIMESTRE_1' : 'COMPOSITION_1';
}

/** Vrai si la période (ex. TRIMESTRE_2, COMPOSITION_3) a du sens pour cette catégorie ; l'année complète vaut partout. */
export function periodeValide(periode: string, categorie: CategorieClasse): boolean {
  if (periode === 'ANNUEL') return true;
  const p = periodesDisponibles(categorie);
  return periode.startsWith('TRIMESTRE') ? p.trimestres : p.compositions;
}

/**
 * Catégorie retenue pour proposer les périodes : celle de la classe, et pour une classe au niveau
 * non reconnu (ou aucune classe choisie), celle de l'établissement — un lycée sans primaire ni
 * collège ne travaille qu'en trimestres, jamais en compositions.
 */
export function categorieEffective(classe: Classe | undefined, toutesLesClasses: Classe[]): CategorieClasse {
  const cat = categoriePourClasse(classe);
  if (cat !== 'ALL') return cat;
  const presentes = new Set(toutesLesClasses.map((c) => categoriePourClasse(c)));
  const aDuBas = ['PRIMAIRE', 'PRIMAIRE_6', 'MATERNELLE', 'COLLEGE'].some((c) => presentes.has(c as CategorieClasse));
  return !aDuBas && presentes.has('LYCEE') ? 'LYCEE' : 'ALL';
}
