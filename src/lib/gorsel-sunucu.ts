import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { guvenliFoto } from './paylasim';

/*
 * Sunucuda çizilen görsellerin ortak parçaları: paylaşım önizlemesi
 * (`p/[kod]/opengraph-image.tsx`) ve story görseli (`p/[kod]/hikaye`).
 * Renkler uygulamanın açık temasından sabit — görsel temayı izleyemez.
 */

export const RENK = {
  zemin: '#f8f7f4',
  yuzey: '#ffffff',
  yuzey2: '#efede8',
  murekkep: '#1a1512',
  soluk: '#8a847d',
  cizgi: '#e6e3dd',
  vurgu: '#e64611',
  vurguYikama: '#fcebe3',
};

/** Fotoğraf indirme sınırları: yavaş ya da iri bir fotoğraf görseli bekletmesin. */
const FOTO_SURE_MS = 2500;
const FOTO_EN_BUYUK = 4 * 1024 * 1024;
/** Görsel motoru (satori) yalnızca bunları çizebiliyor; HEIC ve WebP gibi biçimler baş harfe düşüyor. */
const FOTO_TURLERI = ['image/jpeg', 'image/png', 'image/gif'];

/**
 * Fotoğrafı sunucuda indirip görsele gömüyor. Motor adresi kendisi indirseydi
 * tek bir bozuk fotoğraf bütün görseli düşürürdü; burada sorunlu fotoğraf baş
 * harflere dönüyor. Yalnızca uygulamanın kendi kovasındaki adresler indiriliyor.
 */
export async function fotoVerisi(url?: string | null): Promise<string | null> {
  const adres = guvenliFoto(url);
  if (!adres) return null;
  try {
    const yanit = await fetch(adres, { signal: AbortSignal.timeout(FOTO_SURE_MS), redirect: 'error' });
    const tur = yanit.headers.get('content-type')?.split(';')[0].trim() ?? '';
    if (!yanit.ok || !FOTO_TURLERI.includes(tur)) return null;
    if (Number(yanit.headers.get('content-length') ?? 0) > FOTO_EN_BUYUK) return null;
    const veri = await yanit.arrayBuffer();
    if (veri.byteLength > FOTO_EN_BUYUK) return null;
    return `data:${tur};base64,${Buffer.from(veri).toString('base64')}`;
  } catch {
    return null;
  }
}

/** Yazı tipi verilince motorun kendi Geist'i devreden çıkıyor: ikisi birlikte (OFL, `src/fonts/`). */
export async function yaziTipleri() {
  const [sans, serif] = await Promise.all([
    readFile(join(process.cwd(), 'src/fonts/Geist-Regular.ttf')),
    readFile(join(process.cwd(), 'src/fonts/InstrumentSerif-Regular.ttf')),
  ]);
  return [
    { name: 'Geist', data: sans, style: 'normal' as const, weight: 400 as const },
    { name: 'Instrument Serif', data: serif, style: 'normal' as const, weight: 400 as const },
  ];
}
