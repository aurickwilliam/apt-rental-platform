import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Safely resolve AsyncStorage only in React Native environments
const getAuthStorage = () => {
  try {
    // Construct require strings dynamically to avoid static bundler analysis
    // eslint-disable-next-line
    const rn = require('react-native');
    if (rn.Platform?.OS !== 'web') {
      // eslint-disable-next-line
      return require('@react-native-async-storage/async-storage').default;
    }
  } catch (error) {
    // Not in a React Native environment (e.g., Next.js)
    // or react-native module not available
  }
  return undefined;
};

const storage = getAuthStorage();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: storage === undefined,
  },
});