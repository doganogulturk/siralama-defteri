import { supabase } from './supabase';

/**
 * Girişten sonra dönülecek sayfa. Google ve Apple dönüşü her zaman köke (`redirectTo` yalnızca
 * origin: Supabase'in Redirect URLs listesine tek adres yetiyor); paylaşım sayfasından
 * "Ben de sıralayayım" diyen kişi kaldığı yere buradan dönüyor (`AuthGate`).
 */
export const GIRIS_SONRASI = 'giris-sonrasi';

/** Giriş sağlayıcıları: Google ve Apple (Supabase Auth'un hazır sağlayıcıları). */
export type GirisSaglayici = 'google' | 'apple';

/**
 * Apple ile giriş açık mı. Panel kurulumu (Apple Developer: Services ID, anahtar; Supabase:
 * Apple sağlayıcısı) bitmeden düğme görünmesin: basan kişi hata alırdı. Vercel'de
 * `NEXT_PUBLIC_APPLE_GIRIS=1` ile açılıyor. App Store 4.8: Google girişi olan uygulamada
 * gizliliği koruyan ikinci bir seçenek zorunlu.
 */
export const appleGirisAcik = process.env.NEXT_PUBLIC_APPLE_GIRIS === '1';

/** Sağlayıcıya yönlendirir; dönüş adresi Supabase'deki Redirect URLs listesinde olmalı. */
export async function girisYap(saglayici: GirisSaglayici): Promise<void> {
  const yol = window.location.pathname + window.location.search;
  try {
    if (yol !== '/') sessionStorage.setItem(GIRIS_SONRASI, yol);
  } catch { /* depolama kapalıysa kökte kalır */ }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: saglayici,
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
