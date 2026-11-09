// Uygulama paketinin (Capacitor) ikon ve açılış ekranı kaynakları: marka işaretinden
// (`src/app/icon.svg`, `lib/ikon-cizim.tsx` ile aynı çizim) `assets/` altına PNG'ler.
// Sonra `npx @capacitor/assets generate --ios` bunlardan iOS'un istediği boyutları üretiyor.
//   npm run uygulama:gorseller
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const MUREKKEP = '#1a1512';
const VURGU = '#e64611';
const ZEMIN = '#f8f7f4';
// Koyu temadaki kâğıt (globals.css → --bg, oklch(0.165 0.006 60) yaklaşığı).
const KOYU_ZEMIN = '#171412';

/** 32 birimlik işaret: üç çubuk, istenirse yuvarlak köşeli koyu kare içinde. */
const cubuklar = (x, y, olcek) => `
  <rect x="${x + 6 * olcek}" y="${y + 7.5 * olcek}" width="${20 * olcek}" height="${4.5 * olcek}" rx="${2.25 * olcek}" fill="${VURGU}"/>
  <rect x="${x + 6 * olcek}" y="${y + 13.75 * olcek}" width="${14.5 * olcek}" height="${4.5 * olcek}" rx="${2.25 * olcek}" fill="${ZEMIN}"/>
  <rect x="${x + 6 * olcek}" y="${y + 20 * olcek}" width="${9 * olcek}" height="${4.5 * olcek}" rx="${2.25 * olcek}" fill="${ZEMIN}"/>`;

/** App Store ikonu: kenara kadar koyu zemin (saydamlık yok, köşeleri iOS yuvarlıyor), çizim güvenli alanda. */
function ikon(boyut) {
  const olcek = (boyut / 32) * 0.72;
  const kenar = (boyut - 32 * olcek) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${boyut}" height="${boyut}">
    <rect width="${boyut}" height="${boyut}" fill="${MUREKKEP}"/>${cubuklar(kenar, kenar, olcek)}</svg>`;
}

/** Açılış ekranı: kâğıt zemin, ortada yuvarlak köşeli marka işareti. */
function acilis(boyut, zemin) {
  const isaret = boyut * 0.16;
  const olcek = isaret / 32;
  const x = (boyut - isaret) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${boyut}" height="${boyut}">
    <rect width="${boyut}" height="${boyut}" fill="${zemin}"/>
    <rect x="${x}" y="${x}" width="${isaret}" height="${isaret}" rx="${8 * olcek}" fill="${MUREKKEP}"/>${cubuklar(x, x, olcek)}</svg>`;
}

mkdirSync('assets', { recursive: true });
const yaz = (svg, dosya) => sharp(Buffer.from(svg)).flatten({ background: MUREKKEP }).png().toFile(`assets/${dosya}`);
await yaz(ikon(1024), 'icon-only.png');
await sharp(Buffer.from(acilis(2732, ZEMIN))).png().toFile('assets/splash.png');
await sharp(Buffer.from(acilis(2732, KOYU_ZEMIN))).png().toFile('assets/splash-dark.png');
console.log('assets/: icon-only.png, splash.png, splash-dark.png');
