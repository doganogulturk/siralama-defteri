import { uretec } from './sayilar';

/*
 * İşlemler: Doğru Sıra'nın üretilen listesi. Maddeler dört işlem (7 × 8, 96 ÷ 8, 45 + 38,
 * 93 − 38), değerleri sonuçları; oyuncu sonucu en küçükten en büyüğe diziyor. Veri yazılmıyor,
 * havuz burada sabit bir tohumdan üretiliyor; liste `lib/dogru-sira-listeler.ts`'te öbürleri
 * gibi duruyor, bu yüzden Doğru Sıra, Kör Sıralama, Tier, görseller, arkadaş bağlantısı ve
 * günün oyunu hiçbir değişiklik istemeden çalışıyor.
 *
 * Kurallar (`islemler.test.ts`):
 *   • sayılar bir ya da iki basamaklı (2–99; ×1, ÷1, +1, −1 gibi boş işlemler yok);
 *   • sonuçlar 10–100 arasında: dört işlem aynı aralıkta yarışsın, uçlar bariz olmasın
 *     (2 × 1 ile 21 × 19 aynı oyunda olsa kimse onları düşünmez);
 *   • bölme tam (küsurat yok), çıkarma negatife düşmüyor;
 *   • her sonuç için en fazla bir toplama, bir çıkarma, bir çarpma ve bir bölme: aynı
 *     sonuç başka işlemlerle de gelebiliyor, oyunda ise seçim (`ayrim: { fark: 1 }`) iki
 *     eşit sonucu bir araya koymuyor.
 * Havuz yayımlandıktan sonra değişmemeli (üretim kuralı da tohumu da): sonuç bağlantıları
 * seçimi havuzdaki yerlerden yeniden kuruyor. Başka işlemler gerekirse yeni liste.
 */

export const ISLEM_ALT = 10;
export const ISLEM_UST = 100;
/** Gerçek matematik işaretleri: çarpı, bölü ve eksi (kısa çizgi değil). */
const CARPI = '×';
const BOLU = '÷';
const EKSI = '−';

export interface Islem { ad: string; deger: number }

/** Aralıktan rastgele bir öğe; boşsa null. */
const birini = <T,>(r: () => number, dizi: T[]): T | null => (dizi.length ? dizi[Math.floor(r() * dizi.length)] : null);

/** Bir sonucun dört işlemden adayları (her işlemden biri seçilecek). */
function adaylar(v: number) {
  const toplama: [number, number][] = [];
  for (let a = 2; a <= 99; a++) {
    const b = v - a;
    if (b >= 2 && b <= 99) toplama.push([a, b]);
  }
  const cikarma: [number, number][] = [];
  for (let b = 2; v + b <= 99; b++) cikarma.push([v + b, b]);
  const carpma: [number, number][] = [];
  for (let a = 2; a * a <= v; a++) if (v % a === 0 && v / a <= 99) carpma.push([a, v / a]);
  const bolme: [number, number][] = [];
  for (let b = 2; v * b <= 99; b++) bolme.push([v * b, b]);
  return { toplama, cikarma, carpma, bolme };
}

/** Havuz: her sonuç için işlem başına en fazla bir madde, sonuca göre sıralı. */
function uret(): Islem[] {
  const havuz: Islem[] = [];
  for (let v = ISLEM_ALT; v <= ISLEM_UST; v++) {
    const r = uretec(`islemler:${v}`);
    const { toplama, cikarma, carpma, bolme } = adaylar(v);
    const t = birini(r, toplama);
    if (t) havuz.push({ ad: `${t[0]} + ${t[1]}`, deger: v });
    const c = birini(r, cikarma);
    if (c) havuz.push({ ad: `${c[0]} ${EKSI} ${c[1]}`, deger: v });
    const x = birini(r, carpma);
    // Çarpanların yeri de karışık: hep küçük önde olmasın.
    if (x) havuz.push({ ad: r() < 0.5 ? `${x[0]} ${CARPI} ${x[1]}` : `${x[1]} ${CARPI} ${x[0]}`, deger: v });
    const b = birini(r, bolme);
    if (b) havuz.push({ ad: `${b[0]} ${BOLU} ${b[1]}`, deger: v });
  }
  return havuz;
}

export const ISLEM_HAVUZU: Islem[] = uret();
