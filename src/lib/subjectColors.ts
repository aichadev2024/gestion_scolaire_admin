// 10 teintes fixes, jamais générées à la volée — une matière garde toujours la
// même couleur (basée sur son id), ce qui la rend reconnaissable d'un jour à
// l'autre dans l'emploi du temps. Classes Tailwind écrites en toutes lettres
// ci-dessous (nécessaire : le scan JIT ne détecte pas les noms de classes
// construits dynamiquement par template string).
export const SUBJECT_STYLES = [
  { tint: 'bg-subject-1-bg border-subject-1-border', fg: 'text-subject-1-fg', dot: 'bg-subject-1-fg' },
  { tint: 'bg-subject-2-bg border-subject-2-border', fg: 'text-subject-2-fg', dot: 'bg-subject-2-fg' },
  { tint: 'bg-subject-3-bg border-subject-3-border', fg: 'text-subject-3-fg', dot: 'bg-subject-3-fg' },
  { tint: 'bg-subject-4-bg border-subject-4-border', fg: 'text-subject-4-fg', dot: 'bg-subject-4-fg' },
  { tint: 'bg-subject-5-bg border-subject-5-border', fg: 'text-subject-5-fg', dot: 'bg-subject-5-fg' },
  { tint: 'bg-subject-6-bg border-subject-6-border', fg: 'text-subject-6-fg', dot: 'bg-subject-6-fg' },
  { tint: 'bg-subject-7-bg border-subject-7-border', fg: 'text-subject-7-fg', dot: 'bg-subject-7-fg' },
  { tint: 'bg-subject-8-bg border-subject-8-border', fg: 'text-subject-8-fg', dot: 'bg-subject-8-fg' },
  { tint: 'bg-subject-9-bg border-subject-9-border', fg: 'text-subject-9-fg', dot: 'bg-subject-9-fg' },
  { tint: 'bg-subject-10-bg border-subject-10-border', fg: 'text-subject-10-fg', dot: 'bg-subject-10-fg' },
] as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Index de couleur stable pour une matière — par id si connu, sinon par nom. */
export function subjectColorIndex(matiereId?: number | null, nom?: string | null): number {
  const key = matiereId != null ? matiereId : hashString(nom || '?');
  return key % SUBJECT_STYLES.length;
}

export function subjectStyle(matiereId?: number | null, nom?: string | null) {
  return SUBJECT_STYLES[subjectColorIndex(matiereId, nom)];
}
