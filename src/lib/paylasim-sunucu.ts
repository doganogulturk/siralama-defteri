import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { KOD_BICIMI, PaylasilanListe } from './paylasim';

/**
 * Paylaşım sayfası sunucuda çiziliyor: WhatsApp gibi uygulamalar önizleme kartını
 * hazırlarken JavaScript çalıştırmıyor. Bu istemcinin oturumu yok, anonim
 * anahtarla yalnızca `si_paylasilan_liste` fonksiyonunu çağırıyor; tablolara
 * erişimi RLS kapatıyor.
 */
const anonim = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

/**
 * Kodla paylaşılan liste; kod yoksa ya da paylaşım kapatıldıysa null. `cache`
 * sayfa ile `generateMetadata`'nın aynı istekte iki kez okumasını önlüyor.
 */
export const paylasilanListe = cache(async (kod: string): Promise<PaylasilanListe | null> => {
  // Biçimi tutmayan kod veritabanına hiç gitmiyor.
  if (!KOD_BICIMI.test(kod)) return null;
  const { data, error } = await anonim.rpc('si_paylasilan_liste', { kod });
  if (error) throw error;
  return (data as PaylasilanListe | null) ?? null;
});
