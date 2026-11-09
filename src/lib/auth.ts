import type { Session, UserIdentity } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { MOBIL } from './site';

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

/**
 * Uygulama paketinde girişten dönüş adresi (özel URL şeması; ios/App/App/Info.plist →
 * CFBundleURLTypes). Supabase → Authentication → URL Configuration → Redirect URLs'te olmalı.
 */
export const UYGULAMA_DONUSU = 'com.siralamadefteri.app://giris';

/**
 * Sağlayıcıya yönlendirir; dönüş adresi Supabase'deki Redirect URLs listesinde olmalı.
 * Uygulama paketinde giriş sayfası iOS'un güvenli tarayıcı penceresinde açılıyor (Google,
 * uygulamanın kendi web görünümünde girişi engelliyor); dönüşü `uygulamaDonusunuDinle` yakalıyor.
 */
export async function girisYap(saglayici: GirisSaglayici): Promise<void> {
  if (MOBIL) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: saglayici,
      options: { redirectTo: UYGULAMA_DONUSU, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: data.url, presentationStyle: 'popover' });
    return;
  }
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

/**
 * Son girişin sağlayıcısı: birden çok kimliği (Google ve Apple) olan hesapta en son hangisiyle
 * girildiği. Yoksa null. Saf (`auth.test.ts`).
 */
export function sonGirisSaglayicisi(kimlikler: Pick<UserIdentity, 'provider' | 'last_sign_in_at'>[] | undefined): string | null {
  if (!kimlikler?.length) return null;
  const zaman = (k: Pick<UserIdentity, 'last_sign_in_at'>) => Date.parse(k.last_sign_in_at ?? '') || 0;
  return [...kimlikler].sort((a, b) => zaman(b) - zaman(a))[0].provider;
}

/** Bu tarayıcıda saklanan son Apple jetonunun izi: her açılışta yeniden yazılmasın. */
const APPLE_JETON_IZI = 'siralama-defteri:apple-jetonu';

/**
 * Apple ile girişin hemen ardından Apple'ın yenileme jetonunu saklar: hesap silinirken iptal
 * edilebilsin (App Store 5.1.1(v); `apple-iptal` Edge Function'ı). Supabase jetonu yalnızca
 * girişten sonraki ilk oturumda veriyor (`provider_refresh_token`); oturum yenilenince kayboluyor.
 * Kök bileşende bir kez kuruluyor (`AuthGate`); dönen fonksiyon dinlemeyi bırakıyor.
 */
export function appleJetonunuIzle(istemci = 'com.siralamadefteri.web'): () => void {
  const sakla = async (oturum: Session | null) => {
    const jeton = oturum?.provider_refresh_token;
    if (!jeton || sonGirisSaglayicisi(oturum.user.identities) !== 'apple') return;
    const iz = jeton.slice(-12);
    try { if (localStorage.getItem(APPLE_JETON_IZI) === iz) return; } catch { /* depolama kapalı */ }
    const { error } = await supabase.rpc('apple_jetonu_kaydet', { p_jeton: jeton, p_istemci: istemci });
    if (error) return; // Şema henüz kurulmamış olabilir; giriş yine de çalışıyor.
    try { localStorage.setItem(APPLE_JETON_IZI, iz); } catch { /* depolama kapalı */ }
  };
  const { data } = supabase.auth.onAuthStateChange((olay, oturum) => {
    if (olay === 'SIGNED_IN' || olay === 'INITIAL_SESSION') void sakla(oturum);
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Hesap silinirken Apple jetonunu iptal ettirir. Apple ile hiç girilmemişse ya da fonksiyon
 * kurulmamışsa sessizce geçiyor: hesap silme hakkı iptale bağlı kalmamalı.
 */
export async function appleJetonunuIptalEt(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke<{ iptal: boolean }>('apple-iptal', { body: {} });
    return !error && !!data?.iptal;
  } catch {
    return false;
  }
}

/**
 * Uygulama paketinde girişten dönüş: güvenli tarayıcı `com.siralamadefteri.app://giris?code=…`
 * adresini açınca uygulama uyanıyor; kod oturuma çevriliyor (PKCE; doğrulayıcı aynı web
 * görünümünün depolamasında) ve tarayıcı penceresi kapanıyor. Kök düzende bir kez
 * (`UygulamaKoprusu`). Dönen fonksiyon dinlemeyi bırakıyor.
 */
export function uygulamaDonusunuDinle(): () => void {
  let birak: (() => void) | null = null;
  let iptal = false;
  void (async () => {
    const [{ App }, { Browser }] = await Promise.all([import('@capacitor/app'), import('@capacitor/browser')]);
    const dinleyici = await App.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith(UYGULAMA_DONUSU)) return;
      const adres = new URL(url);
      const kod = adres.searchParams.get('code');
      if (kod) await supabase.auth.exchangeCodeForSession(kod);
      await Browser.close().catch(() => { /* zaten kapalı */ });
    });
    if (iptal) void dinleyici.remove(); else birak = () => void dinleyici.remove();
  })();
  return () => { iptal = true; birak?.(); };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
