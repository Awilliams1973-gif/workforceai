import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_CONFIG_MESSAGE = 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.';
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createFallbackSupabaseClient = () => {
  const missingConfigError = () => {
    const error = new Error(SUPABASE_CONFIG_MESSAGE);
    return error;
  };

  const throwingQueryBuilder = () => ({
    select: () => { throw missingConfigError(); },
    insert: async () => { throw missingConfigError(); },
    update: async () => { throw missingConfigError(); },
    delete: async () => { throw missingConfigError(); },
    eq: () => { throw missingConfigError(); },
    maybeSingle: async () => { throw missingConfigError(); },
    single: async () => { throw missingConfigError(); },
  });

  return {
    auth: {
      getSession: async () => { throw missingConfigError(); },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } }, error: null }),
      signUp: async () => { throw missingConfigError(); },
      signIn: async () => { throw missingConfigError(); },
      signInWithPassword: async () => { throw missingConfigError(); },
      signOut: async () => { throw missingConfigError(); },
      resetPasswordForEmail: async () => { throw missingConfigError(); },
      updateUser: async () => { throw missingConfigError(); },
    },
    from: () => throwingQueryBuilder(),
  } as unknown as SupabaseClient;
};

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createFallbackSupabaseClient();
