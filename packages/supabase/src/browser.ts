import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
  }

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return browserClient;
}
