import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protection des routes d'administration avant rendu (Next 16 « proxy », ex-middleware).
 *
 * Vérifie la présence et la non-expiration du cookie de session `jwt_token`.
 * La signature n'est pas vérifiée ici (le secret reste côté backend) : c'est une
 * barrière UX/anti-« flash de contenu protégé ». L'autorisation réelle est
 * assurée par Spring Security (`@PreAuthorize`) côté API.
 */

const TOKEN_COOKIE = 'jwt_token';
const PROTECTED_PREFIXES = ['/dashboard', '/super-admin'];

function decodeBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  return atob(withPadding);
}

function isExpired(token: string): boolean {
  try {
    const payloadPart = token.split('.')[1];
    const payload = JSON.parse(decodeBase64Url(payloadPart));
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000 <= Date.now();
    }
    return false;
  } catch {
    return true; // jeton illisible => considéré invalide
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token || isExpired(token)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(TOKEN_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  // Les espaces d'administration ne doivent pas être indexés.
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/super-admin/:path*'],
};
