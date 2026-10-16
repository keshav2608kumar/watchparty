import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

if (!isSupabaseConfigured) {
  console.info(
    '%c[WatchParty]%c Running in Local Demo Mode (BroadcastChannel cross-tab real-time sync active). To enable cross-device cloud sync, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
    'color: #6366f1; font-weight: bold;',
    'color: #94a3b8;'
  );
}
