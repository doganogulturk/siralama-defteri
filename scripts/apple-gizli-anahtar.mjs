// Apple ile giriş için Supabase'in istediği gizli anahtar (client secret): .p8 anahtarıyla
// ES256 imzalı bir JWT. Apple bu anahtarı en fazla 6 ay geçerli kabul ediyor; süresi
// dolmadan yenisi üretilip Supabase → Authentication → Providers → Apple → Secret Key'e
// yapıştırılmalı (yol haritası → Mobil 2). Sonuç ekrana yazılmıyor, panoya kopyalanıyor.
//
// Kullanım (macOS):
//   npm run apple:anahtar -- <p8 dosyasının yolu>
// Kimlikler değişirse ortam değişkeniyle: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID.
import { readFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const p8 = process.argv[2];
if (!p8) {
  console.error('Kullanım: npm run apple:anahtar -- <AuthKey_XXXX.p8 yolu>');
  process.exit(1);
}
const takim = process.env.APPLE_TEAM_ID ?? '358VBZ4XZK';
const anahtar = process.env.APPLE_KEY_ID ?? 'FKA55WM2Y6';
const servis = process.env.APPLE_CLIENT_ID ?? 'com.siralamadefteri.web';

const b64 = (x) => Buffer.from(JSON.stringify(x)).toString('base64url');
const simdi = Math.floor(Date.now() / 1000);
const bitis = simdi + 180 * 24 * 60 * 60; // Apple'ın üst sınırı 6 ay
const baslik = b64({ alg: 'ES256', kid: anahtar });
const govde = b64({ iss: takim, iat: simdi, exp: bitis, aud: 'https://appleid.apple.com', sub: servis });
const imza = sign('sha256', Buffer.from(`${baslik}.${govde}`), {
  key: createPrivateKey(readFileSync(p8)),
  dsaEncoding: 'ieee-p1363',
}).toString('base64url');
execFileSync('pbcopy', { input: `${baslik}.${govde}.${imza}` });
console.log(`Panoya kopyalandı. Son geçerlilik: ${new Date(bitis * 1000).toISOString().slice(0, 10)}`);
console.log('Supabase → Authentication → Sign In / Providers → Apple → Secret Key alanına yapıştır, Save.');
