// Uygulama paketinin (Capacitor) ikonu ve açılış ekranı: marka işaretinden (`src/app/icon.svg`,
// `lib/ikon-cizim.tsx` ile aynı çizim). iOS dosyalarını betik doğrudan Assets.xcassets'e yazıyor.
//   npm run uygulama:gorseller
//
// Açılış ekranı LaunchScreen.storyboard'da düz kâğıt zemin ve ortada 96 pt'lik simge: web'deki açılış
// perdesinin (components/AcilisPerdesi.tsx) ilk karesiyle aynı yer, boy ve renkler, perde ondan sıçramadan
// devralıyor. Tam ekran bir resim değil, çünkü iOS bellekte 25 MB'ı aşan açılış görselini hiç çizmiyor
// (2732 px kare bir görsel @3x'te bunu aşıyor).
import sharp from 'sharp';
import { mkdir, rm, writeFile } from 'node:fs/promises';

// globals.css'teki tokenların sRGB karşılıkları (açık / koyu tema).
const ACIK = { zemin: '#f8f7f4', murekkep: '#1a1512', vurgu: '#e64611' };
const KOYU = { zemin: '#100e0c', murekkep: '#f2f0ec', vurgu: '#f36537' };

/** 32 birimlik işaret: yuvarlak köşeli kare ve üç çubuk; en uzunu vurgu renginde. */
function isaret(boyut, { kare, cubuk, vurgu }, koseli = true) {
  const o = boyut / 32;
  const cubukCiz = (y, en, renk) =>
    `<rect x="${6 * o}" y="${y * o}" width="${en * o}" height="${4.5 * o}" rx="${2.25 * o}" fill="${renk}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${boyut}" height="${boyut}">
    <rect width="${boyut}" height="${boyut}" rx="${koseli ? 8 * o : 0}" fill="${kare}"/>
    ${cubukCiz(7.5, 20, vurgu)}${cubukCiz(13.75, 14.5, cubuk)}${cubukCiz(20, 9, cubuk)}</svg>`;
}

/** App Store ikonu: kenara kadar koyu zemin (saydamlık yok, köşeleri iOS yuvarlıyor), çizim güvenli alanda. */
function ikon(boyut) {
  const ic = boyut * 0.72;
  const kenar = (boyut - ic) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${boyut}" height="${boyut}">
    <rect width="${boyut}" height="${boyut}" fill="${ACIK.murekkep}"/>
    <svg x="${kenar}" y="${kenar}" width="${ic}" height="${ic}" viewBox="0 0 ${ic} ${ic}">
      ${isaret(ic, { kare: ACIK.murekkep, cubuk: ACIK.zemin, vurgu: ACIK.vurgu }, false).replace(/^<svg[^>]*>|<\/svg>$/g, '')}
    </svg></svg>`;
  return sharp(Buffer.from(svg)).flatten({ background: ACIK.murekkep }).png();
}

const yaz = async (cizim, yol) => {
  await cizim.toFile(yol);
  console.log(yol);
};
const json = (yol, veri) => writeFile(yol, JSON.stringify({ ...veri, info: { author: 'xcode', version: 1 } }, null, 2) + '\n');
const koyu = { appearances: [{ appearance: 'luminosity', value: 'dark' }] };

const katalog = 'ios/App/App/Assets.xcassets';
await mkdir('assets', { recursive: true });
await yaz(ikon(1024), 'assets/icon-only.png');
await yaz(ikon(1024), `${katalog}/AppIcon.appiconset/AppIcon-512@2x.png`);

// Açılış simgesi: 96 pt, uygulamadaki marka işareti gibi temaya göre (koyu temada açık kare).
const SIMGE_PT = 96;
const simgeKlasoru = `${katalog}/AcilisSimge.imageset`;
await mkdir(simgeKlasoru, { recursive: true });
const gorseller = [];
for (const [tema, renk] of [['', ACIK], ['-koyu', KOYU]]) {
  for (const olcek of [1, 2, 3]) {
    const dosya = `acilis-simge${tema}@${olcek}x.png`;
    const svg = isaret(SIMGE_PT * olcek, { kare: renk.murekkep, cubuk: renk.zemin, vurgu: renk.vurgu });
    await yaz(sharp(Buffer.from(svg)).png(), `${simgeKlasoru}/${dosya}`);
    gorseller.push({ idiom: 'universal', filename: dosya, scale: `${olcek}x`, ...(tema ? koyu : {}) });
  }
}
await json(`${simgeKlasoru}/Contents.json`, { images: gorseller });

// Açılış zemini: storyboard ve WebView'in zemini (UygulamaViewController), temaya göre.
const srgb = hex => {
  const [r, g, b] = [1, 3, 5].map(i => `0x${hex.slice(i, i + 2).toUpperCase()}`);
  return { 'color-space': 'srgb', components: { red: r, green: g, blue: b, alpha: '1.000' } };
};
await mkdir(`${katalog}/AcilisZemin.colorset`, { recursive: true });
await json(`${katalog}/AcilisZemin.colorset/Contents.json`, {
  colors: [
    { idiom: 'universal', color: srgb(ACIK.zemin) },
    { idiom: 'universal', ...koyu, color: srgb(KOYU.zemin) },
  ],
});

// Eski tam ekran açılış görseli (yukarıdaki bellek sınırı yüzünden çizilmiyordu).
await rm(`${katalog}/Splash.imageset`, { recursive: true, force: true });
await rm('assets/splash.png', { force: true });
await rm('assets/splash-dark.png', { force: true });
