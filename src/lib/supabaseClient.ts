import { createClient } from '@supabase/supabase-js'

// --- RESTAURANDO A LEITURA DAS VARIÁVEIS DE AMBIENTE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('--- Usando variáveis de ambiente VITE_ ---');
console.log('Supabase URL:', supabaseUrl ? 'Exists' : 'MISSING!');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Exists' : 'MISSING!');
// --- FIM DA RESTAURAÇÃO ---


// Verifica se as variáveis existem
if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is missing or empty. Check your .env file.");
}
if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY is missing or empty. Check your .env file.");
}

// Cria o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // detectSessionInUrl: true // Manter o padrão (true)
  },
  // Nenhuma configuração extra de realtime necessária por enquanto
});

console.log('Supabase client initialized (using VITE_ variables).');
