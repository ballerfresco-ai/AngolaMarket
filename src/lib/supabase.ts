import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL detectada:', supabaseUrl ? 'Sim' : 'Não');

const isConfigured = supabaseUrl && 
                   supabaseAnonKey && 
                   supabaseUrl !== 'https://your-project-id.supabase.co' && 
                   supabaseUrl.startsWith('https://');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (() => {
      console.warn('Supabase não configurado corretamente no painel de Configurações.');
      return createClient(
        'https://dummy-project.supabase.co', 
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
      );
    })();

(supabase as any)._isConfigured = isConfigured;
