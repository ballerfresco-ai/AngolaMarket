import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize with a dummy object if keys are missing to prevent crash on startup.
// The app will show clear errors when attempting to use supabase operations.
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          };
        }
        return () => {
          console.error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY aos Segredos do projeto.');
          return Promise.resolve({ data: null, error: new Error('Supabase credentials missing') });
        };
      }
    });
