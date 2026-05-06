import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize with a dummy object if keys are missing to prevent crash on startup.
// The app will show clear errors when attempting to use supabase operations.
const createDummyProxy = () => {
  const handler: ProxyHandler<any> = {
    get(target, prop): any {
      if (prop === 'then') {
        return (resolve: any) => {
          console.warn('Supabase não configurado. Adicione as variáveis de ambiente.');
          resolve({ data: null, error: new Error('Supabase configuration missing') });
        };
      }
      
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: async () => ({ data: { user: null }, error: new Error('Supabase não configurado') }),
          signUp: async () => ({ data: { user: null }, error: new Error('Supabase não configurado') }),
          signOut: async () => ({ error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
        };
      }

      // Return a function that returns the same proxy for chaining, but also behaves as a thenable
      const dummyFunc = () => new Proxy({}, handler);
      return new Proxy(dummyFunc, handler);
    }
  };

  return new Proxy({ _isDummy: true }, handler);
};

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co' && supabaseUrl.startsWith('https://')) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyProxy();
