/**
 * Supabase client for the Monetização microservice.
 *
 * Creates its own client using environment variables.
 * When running inside the Bethel Platform (sistema mãe), the platform
 * initializes the shared singleton first, and both clients share the
 * same Supabase Auth session via localStorage.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
