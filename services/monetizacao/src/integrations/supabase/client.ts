/**
 * Supabase client for the Monetização microservice.
 *
 * When running standalone (dev mode), it creates its own client.
 * When running inside the Bethel Platform (sistema mãe), it reuses
 * the shared singleton client initialized by the platform.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let _supabase: SupabaseClient<Database>;

try {
  // Try to use the shared singleton from the platform
  const { getSupabaseClient } = await import('@bethel/shared-supabase');
  _supabase = getSupabaseClient() as SupabaseClient<Database>;
} catch {
  // Fallback: standalone mode — create our own client
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  _supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase = _supabase;
