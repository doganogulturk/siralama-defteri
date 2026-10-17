import { supabase } from './supabase';

/**
 * Girişten sonra dönülecek sayfa. Google dönüşü her zaman köke (`redirectTo` yalnızca
 * origin: Supabase'in Redirect URLs listesine tek adres yetiyor); paylaşım sayfasından
 * "Ben de sıralayayım" diyen kişi kaldığı yere buradan dönüyor (`AuthGate`).
 */
export const GIRIS_SONRASI = 'giris-sonrasi';

/** Google'a yönlendirir; dönüş adresi Supabase'deki Redirect URLs listesinde olmalı. */
export async function signInWithGoogle(): Promise<void> {
  const yol = window.location.pathname + window.location.search;
  try {
    if (yol !== '/') sessionStorage.setItem(GIRIS_SONRASI, yol);
  } catch { /* depolama kapalıysa kökte kalır */ }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
