// apple-iptal: hesap silinirken kullanıcının Apple jetonunu iptal eder (App Store 5.1.1(v)).
//
// Akış: istemci (src/lib/items.ts → hesabiSil) hesabı silmeden önce bu fonksiyonu kullanıcının
// oturumuyla çağırıyor. Fonksiyon aynı oturumla `apple_jetonu_al()`'dan jetonu okuyor, .p8
// anahtarıyla imzalı bir istemci sırrı (JWT) üretiyor ve Apple'ın /auth/revoke ucuna gönderiyor.
// Jeton yoksa (Apple ile hiç girilmemiş ya da jeton saklanmadan önceki bir giriş) iş yok sayılıyor.
//
// İkinci iş (`{ islem: 'kaydet', kod }`): uygulamadaki yerel Apple girişi Supabase'e yalnızca kimlik
// jetonunu veriyor, yenileme jetonu gelmiyor. Uygulama Apple'ın yetki kodunu buraya gönderiyor;
// fonksiyon kodu Apple'ın /auth/token ucunda yenileme jetonuna çevirip kullanıcının oturumuyla
// `apple_jetonu_kaydet`'e yazıyor (istemci: uygulamanın bundle kimliği). Hesap silinirken yukarıdaki
// iptal aynı jetonu kullanıyor.
//
// Tek dosya, dış bağımlılık yok: Supabase panelindeki düzenleyiciye olduğu gibi yapıştırılabiliyor.
// Gizli değişkenler (Supabase → Edge Functions → Secrets):
//   APPLE_P8       — AuthKey_XXXX.p8 dosyasının içeriği (-----BEGIN PRIVATE KEY----- dahil)
//   APPLE_TEAM_ID  — 358VBZ4XZK
//   APPLE_KEY_ID   — FKA55WM2Y6
// SUPABASE_URL Supabase'in kendisi tarafından veriliyor.

const SEMA = 'do_siralama_defteri';
/** Yerel girişin istemcisi: uygulamanın bundle kimliği (Apple'da App ID). */
const UYGULAMA = 'com.siralamadefteri.app';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const yanit = (govde: unknown, durum = 200) =>
  new Response(JSON.stringify(govde), { status: durum, headers: { ...CORS, 'Content-Type': 'application/json' } });

const b64url = (veri: Uint8Array | string) => {
  const bayt = typeof veri === 'string' ? new TextEncoder().encode(veri) : veri;
  let ikili = '';
  for (const b of bayt) ikili += String.fromCharCode(b);
  return btoa(ikili).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** .p8 (PKCS#8 PEM) anahtarıyla ES256 imzalı istemci sırrı; 5 dakika geçerli yeter. */
async function istemciSirri(istemci: string): Promise<string> {
  const pem = Deno.env.get('APPLE_P8') ?? '';
  const takim = Deno.env.get('APPLE_TEAM_ID') ?? '';
  const anahtarKimligi = Deno.env.get('APPLE_KEY_ID') ?? '';
  if (!pem || !takim || !anahtarKimligi) throw new Error('Apple gizli değişkenleri eksik.');
  const der = Uint8Array.from(
    atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')),
    c => c.charCodeAt(0),
  );
  const anahtar = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const simdi = Math.floor(Date.now() / 1000);
  const govde = `${b64url(JSON.stringify({ alg: 'ES256', kid: anahtarKimligi }))}.${b64url(JSON.stringify({
    iss: takim, iat: simdi, exp: simdi + 300, aud: 'https://appleid.apple.com', sub: istemci,
  }))}`;
  // WebCrypto ECDSA imzası zaten JWT'nin istediği r||s biçiminde.
  const imza = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, anahtar, new TextEncoder().encode(govde)));
  return `${govde}.${b64url(imza)}`;
}

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (istek.method !== 'POST') return yanit({ hata: 'Yalnızca POST.' }, 405);

  const yetki = istek.headers.get('Authorization');
  const apikey = istek.headers.get('apikey');
  if (!yetki || !apikey) return yanit({ hata: 'Oturum gerekli.' }, 401);

  // Kullanıcının kendi oturumuyla: yalnızca kendi jetonunu görebiliyor / yazabiliyor.
  const rpcCagir = (ad: string, govde: unknown) => fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/${ad}`, {
    method: 'POST',
    headers: {
      Authorization: yetki,
      apikey,
      'Content-Type': 'application/json',
      'Content-Profile': SEMA,
      'Accept-Profile': SEMA,
    },
    body: JSON.stringify(govde),
  });

  const istekGovdesi = await istek.json().catch(() => ({})) as { islem?: string; kod?: string };
  if (istekGovdesi.islem === 'kaydet') {
    if (!istekGovdesi.kod) return yanit({ hata: 'Kod gerekli.' }, 400);
    try {
      const apple = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: UYGULAMA,
          client_secret: await istemciSirri(UYGULAMA),
          code: istekGovdesi.kod,
          grant_type: 'authorization_code',
        }),
      });
      if (!apple.ok) return yanit({ kaydedildi: false, neden: `Apple ${apple.status}`, ayrinti: await apple.text() }, 502);
      const { refresh_token } = await apple.json() as { refresh_token?: string };
      if (!refresh_token) return yanit({ kaydedildi: false, neden: 'yenileme jetonu yok' }, 502);
      const kayit = await rpcCagir('apple_jetonu_kaydet', { p_jeton: refresh_token, p_istemci: UYGULAMA });
      if (!kayit.ok) return yanit({ kaydedildi: false, neden: 'kayıt', ayrinti: await kayit.text() }, 502);
      return yanit({ kaydedildi: true });
    } catch (e) {
      return yanit({ kaydedildi: false, neden: e instanceof Error ? e.message : String(e) }, 500);
    }
  }

  const rpc = await rpcCagir('apple_jetonu_al', {});
  if (!rpc.ok) return yanit({ hata: 'Jeton okunamadı.', ayrinti: await rpc.text() }, 502);
  const satirlar = await rpc.json() as { yenileme_jetonu: string; istemci: string }[];
  const jeton = satirlar[0];
  if (!jeton) return yanit({ iptal: false, neden: 'jeton yok' });

  try {
    const form = new URLSearchParams({
      client_id: jeton.istemci,
      client_secret: await istemciSirri(jeton.istemci),
      token: jeton.yenileme_jetonu,
      token_type_hint: 'refresh_token',
    });
    const apple = await fetch('https://appleid.apple.com/auth/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    // Apple başarıda 200 ve boş gövde döndürüyor; geçersiz/önceden iptal edilmiş jetonda 400.
    if (!apple.ok) return yanit({ iptal: false, neden: `Apple ${apple.status}`, ayrinti: await apple.text() }, 502);
    return yanit({ iptal: true });
  } catch (e) {
    return yanit({ iptal: false, neden: e instanceof Error ? e.message : String(e) }, 500);
  }
});
