/** Extrait un message d'erreur lisible d'une erreur Axios, avec repli. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { data?: { message?: string } } }).response;
    if (r?.data?.message) return r.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
