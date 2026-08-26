import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Uygulama tamamen istemci tarafında çalıştığı için oturum da tarayıcıda tutuluyor:
 * @supabase/ssr ve sunucu tarafı cookie akışına ihtiyaç yok.
 * `detectSessionInUrl` OAuth dönüşündeki `?code=` parametresini otomatik işler.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
