/**
 * Supabase client for the SDR microservice.
 *
 * Uses the shared singleton from @bethel/shared-supabase.
 * When running inside the Bethel Platform (sistema mãe), the platform
 * initializes the singleton first. In standalone dev mode, this module
 * initializes it on first import.
 */
import { createSupabaseClient, getSupabaseClient } from '@bethel/shared-supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Initialize the shared singleton (idempotent - won't recreate if already exists)
createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const supabase = getSupabaseClient();
