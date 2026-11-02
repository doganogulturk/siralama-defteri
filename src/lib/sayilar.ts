/**
 * Sayılar: Kör Sıralama'nın doğru cevabı olan hâli. 1–100 arasından on farklı sayı
 * birer birer geliyor; her biri hemen bir yuvaya konuyor ve yeri değişmiyor. Amaç
 * küçükten büyüğe dizmek.
 *
 * Sayılar bir tohumdan üretiliyor, böylece hiçbir şey kaydedilmeden sonuç adreste
 * taşınabiliyor: `?t=<tohum>&s=<yerleşim>`. Günün tohumu (`g20261031`) o gün herkese
 * aynı sayıları veriyor; serbest oyunun tohumu (`rk3x9q2`) rastgele.
 */

export const ADET = 10;
/** Oyunun vurgu rengi (Kör Sıralama listelerinin `renk`'i gibi). */
export const SAYILAR_RENK = '#1d4ed8';
export const EN_KUCUK = 1;
export const EN_BUYUK = 100;

const TOHUM_BICIMI = /^(g\d{8}|r[a-z0-9]{6})$/;
export const tohumGecerli = (t?: string | null): t is string => !!t && TOHUM_BICIMI.test(t);
export const gunlukMu = (tohum: string) => tohum.startsWith('g');

/**
 * Günün tohumu İstanbul saatine göre: gün herkes için aynı anda değişiyor, oyuncu
 * hangi saat diliminde olursa olsun aynı günün sayılarını görüyor.
 */
export function gununTohumu(an: Date = new Date()): string {
  const parca = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(an); // 2026-10-31
  return `g${parca.replaceAll('-', '')}`;
}

/** Tohumun tarihi (yalnızca günlük tohumda): "2026-10-31". */
export const tohumTarihi = (tohum: string): string | null =>
  gunlukMu(tohum) ? `${tohum.slice(1, 5)}-${tohum.slice(5, 7)}-${tohum.slice(7, 9)}` : null;

/** "2026-10-31" → "31 Ekim" / "October 31". */
export const tarihYaz = (iso: string, dil: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(dil, { day: 'numeric', month: 'long', timeZone: 'UTC' });

export function rastgeleTohum(): string {
  const harfler = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let t = 'r';
  for (let i = 0; i < 6; i++) t += harfler[Math.floor(Math.random() * harfler.length)];
  return t;
}

/** Metinden 32 bitlik tohum (FNV-1a), sonra mulberry32: her tarayıcıda aynı dizi. */
export function uretec(tohum: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < tohum.length; i++) {
    h ^= tohum.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tohumun sayıları, geliş sırasıyla: on farklı sayı. */
export function sayilariUret(tohum: string): number[] {
  const r = uretec(tohum);
  const sayilar: number[] = [];
  while (sayilar.length < ADET) {
    const n = EN_KUCUK + Math.floor(r() * (EN_BUYUK - EN_KUCUK + 1));
    if (!sayilar.includes(n)) sayilar.push(n);
  }
  return sayilar;
}

/**
 * Yerleşim adreste: birinci yuvadan onuncuya, oradaki sayının geliş sırası ("3-0-7-…").
 * Geçerli bir permütasyon değilse null.
 */
export function yerlesimCoz(s?: string | null): number[] | null {
  if (!s) return null;
  const sira = s.split('-').map(Number);
  if (sira.length !== ADET || sira.some(i => !Number.isInteger(i) || i < 0 || i >= ADET)) return null;
  return new Set(sira).size === ADET ? sira : null;
}

export const yerlesimYaz = (sira: number[]) => sira.join('-');

export interface Puan {
  /** Birbirine göre doğru sırada duran en uzun dizinin uzunluğu. */
  puan: number;
  /** Yuva başına: o dizinin parçası mı (doğru sırada mı)? */
  yerinde: boolean[];
  /** Yuva başına olması gereken sayı: on sayının küçükten büyüğe dizilişi. */
  dogrusu: number[];
}

/**
 * Puan, yuvalardaki sayıların en uzun artan alt dizisi. "Tam yerinde olanları saymak"
 * tek bir erken hatayı bütün oyuna yayardı: 50'yi birinci yuvaya koyup kalanını
 * kusursuz dizen biri 0 alırdı; burada 9 alıyor.
 *
 * Aynı uzunlukta birden çok dizi olabilir; puan değişmez ama hangi yuvaların "sıranın
 * dışında" işaretleneceği değişir. Tam yerindeki sayıyı (80'in 8. yuvada durması)
 * dışarıda bırakmak tuhaf görünürdü: eşitlikte tam yerinde duran sayıları en çok
 * içeren dizi seçiliyor.
 */
export function puanla(yuvalar: number[]): Puan {
  const n = yuvalar.length;
  const dogrusu = [...yuvalar].sort((a, b) => a - b);
  const tam = yuvalar.map((x, i) => (x === dogrusu[i] ? 1 : 0));
  const uzunluk = new Array<number>(n).fill(1);
  const isabet: number[] = [...tam];
  const onceki = new Array<number>(n).fill(-1);
  const dahaIyi = (u: number, is: number, i: number) => u > uzunluk[i] || (u === uzunluk[i] && is > isabet[i]);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (yuvalar[j] < yuvalar[i] && dahaIyi(uzunluk[j] + 1, isabet[j] + tam[i], i)) {
        uzunluk[i] = uzunluk[j] + 1;
        isabet[i] = isabet[j] + tam[i];
        onceki[i] = j;
      }
    }
  }
  let son = 0;
  for (let i = 1; i < n; i++) if (dahaIyi(uzunluk[i], isabet[i], son)) son = i;
  const yerinde = new Array<boolean>(n).fill(false);
  for (let i = n ? son : -1; i !== -1; i = onceki[i]) yerinde[i] = true;
  return { puan: n ? uzunluk[son] : 0, yerinde, dogrusu };
}
