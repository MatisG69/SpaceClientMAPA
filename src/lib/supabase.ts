import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error(
    'Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes. Vérifier le fichier .env.'
  );
}

export const supabase: SupabaseClient = createClient(url ?? '', key ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mapa-espace-client-session',
  },
});

export function isSupabaseReady(): boolean {
  return Boolean(url && key);
}
