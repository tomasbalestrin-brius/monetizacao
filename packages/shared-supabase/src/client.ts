import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient(url, anonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient first.');
  }
  return supabaseInstance;
}
