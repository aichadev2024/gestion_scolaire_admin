/**
 * Année scolaire en cours, au format « 2026/2027 ». L'année commence en septembre : de janvier à août,
 * on est encore dans l'année commencée l'automne précédent (en janvier 2027 → « 2026/2027 »).
 */
export function anneeScolaireCourante(date: Date = new Date()): string {
  const debut = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${debut}/${debut + 1}`;
}

/** Les dernières années scolaires, la plus récente en premier — pour un sélecteur. */
export function anneesScolairesRecentes(nombre = 5, date: Date = new Date()): string[] {
  const debut = Number(anneeScolaireCourante(date).slice(0, 4));
  return Array.from({ length: nombre }, (_, i) => `${debut - i}/${debut - i + 1}`);
}
