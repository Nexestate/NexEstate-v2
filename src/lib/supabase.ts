import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Normalize URL — strip /rest/v1 if pasted from API docs */
const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '') || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your_supabase') &&
    !supabaseUrl.includes('YOUR_PROJECT') &&
    !supabaseAnonKey.includes('your_supabase'),
);

if (import.meta.env.DEV && !isSupabaseConfigured) {
  console.info(
    '[NexEstate] Demo mode — set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local for real auth (incl. Google OAuth). See .env.example',
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey!)
  : null;
