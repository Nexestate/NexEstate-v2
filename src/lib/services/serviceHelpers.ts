/**
 * Shared helpers for Supabase service layer.
 * Demo data is returned ONLY when Supabase is not configured.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../supabase';

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/** True when running without Supabase env vars (local demo). */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured;
}

/** Returns the Supabase client or null if not configured. */
export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

/** Returns client or throws — use inside live Supabase code paths. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new ServiceError('Supabase is not configured', 'SUPABASE_NOT_CONFIGURED');
  }
  return supabase;
}

/** Normalize Supabase errors into ServiceError. */
export function throwIfError(error: { message: string; code?: string } | null): void {
  if (error) {
    throw new ServiceError(error.message, error.code);
  }
}
