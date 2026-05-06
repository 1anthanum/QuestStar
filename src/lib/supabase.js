/**
 * Supabase Client — singleton instance
 *
 * Environment variables (set in .env or Vercel dashboard):
 *   VITE_SUPABASE_URL      — Project URL (https://xxxxx.supabase.co)
 *   VITE_SUPABASE_ANON_KEY — Public anon key
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Allow app to run without Supabase (guest-only mode)
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
