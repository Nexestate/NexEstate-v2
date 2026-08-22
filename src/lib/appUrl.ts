/** Production site origin — used for OAuth / email redirect URLs */
const DEFAULT_PRODUCTION_ORIGIN = 'https://nexestate.co';

/**
 * App origin for auth redirects.
 * Prefer VITE_APP_URL in Vercel env; fallback to browser origin; then production default.
 */
export function getAppOrigin(): string {
  const configured = import.meta.env.VITE_APP_URL?.replace(/\/$/, '');
  if (configured) return configured;

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/$/, '');
    // Always canonicalize to apex — www serves HTML but asset redirects break (CORS).
    if (origin === 'https://www.nexestate.co') return DEFAULT_PRODUCTION_ORIGIN;
    return origin;
  }

  return DEFAULT_PRODUCTION_ORIGIN;
}

/** Absolute URL for an in-app path (e.g. /auth/callback) */
export function appUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getAppOrigin()}${normalized}`;
}

/** Supabase Google OAuth callback registered in Google Cloud Console */
export function getSupabaseAuthCallbackUrl(): string {
  const raw = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const base = raw?.replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '') || '';
  return base ? `${base}/auth/v1/callback` : 'https://YOUR_PROJECT.supabase.co/auth/v1/callback';
}
