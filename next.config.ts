import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/** Origine de l'API backend (pour la directive CSP connect-src). */
function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8089/api').origin;
  } catch {
    return 'http://localhost:8089';
  }
}

const csp = [
  "default-src 'self'",
  // Next injecte des scripts inline pour l'hydratation ; 'unsafe-eval' requis en dev (HMR / React Refresh).
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  // L'app utilise exclusivement des styles inline (refonte Tailwind + nonce prévue en Phase 3).
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin()}${isProd ? '' : ' ws: http://localhost:*'}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
