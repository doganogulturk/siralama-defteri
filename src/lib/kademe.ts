import { Item, Kademe } from '@/types/item';

/*
 * Kademeler (tier list): sıralamanın üstünde S, A, B, C, D gibi başlıklı ayırıcılar.
 *
 * Kayıt kademesini `kademe`'de anahtarla taşıyor; boşsa "kademesiz" ve kademelerin en altında.
 * Kural: `sira` her zaman kademe sırasıyla tutarlı — önce ilk kademenin kayıtları, sonra
 * ikincininkiler. Bu yüzden sıralamayı okuyan her yer (ana ekran özetleri, paylaşım,
 * karşılaştırma, Kör Sıralama) kademeyi hiç bilmeden doğru sırayı görüyor. Buradaki her
 * işlem bu kuralı koruyacak biçimde yazılmış; burada ne React ne Supabase var
 * (`kademe.test.ts`).
 */

export const VARSAYILAN_KADEMELER: Kademe[] = [
  { anahtar: 's', etiket: 'S' },
  { anahtar: 'a', etiket: 'A' },
  { anahtar: 'b', etiket: 'B' },
  { anahtar: 'c', etiket: 'C' },
  { anahtar: 'd', etiket: 'D' },
];

/** Bir listede en fazla bu kadar kademe (`schema.sql` → lists_kademeler_bicim). */
export const EN_FAZLA_KADEME = 10;
/** Kademe etiketinin uzunluğu: satırın solundaki kutuya sığsın. */
export const KADEME_ETIKET_UZUNLUK = 12;

/** Kademe kapalı mı: null, boş ya da tanımsız. */
export const kademeliMi = (kademeler: Kademe[] | null | undefined): kademeler is Kademe[] =>
  Array.isArray(kademeler) && kademeler.length > 0;

/** Kademenin yukarıdan sırası; kademesiz ya da tanımsız anahtar en alta (kademe sayısı). */
export function kademeSirasi(kademeler: Kademe[], anahtar: string | null | undefined): number {
  const i = anahtar ? kademeler.findIndex(k => k.anahtar === anahtar) : -1;
  return i === -1 ? kademeler.length : i;
}

/**
 * Sıralamayı kademeye göre dizer; kademe içinde gelen sıra korunuyor (girdi `sortSirali`
 * ile sıralı olmalı). Kural tutuyorsa sırayı değiştirmez; eski ya da bozuk veride
 * gösterimin tutarlı olmasını sağlıyor.
 */
export function kademeyeGoreSirala<T extends Pick<Item, 'kademe'>>(sirali: T[], kademeler: Kademe[]): T[] {
  return sirali
    .map((item, i) => ({ item, i, k: kademeSirasi(kademeler, item.kademe) }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map(x => x.item);
}

export interface KademeGrubu<T> {
  /** null: kademesiz kayıtlar. */
  kademe: Kademe | null;
  items: T[];
}

/** Sıralama kademe kademe; her kademe (boş da olsa) ve en sonda kademesizler. */
export function kademeGruplari<T extends Pick<Item, 'kademe'>>(sirali: T[], kademeler: Kademe[]): KademeGrubu<T>[] {
  const gruplar: KademeGrubu<T>[] = [...kademeler.map(k => ({ kademe: k, items: [] as T[] })), { kademe: null, items: [] }];
  for (const item of sirali) gruplar[kademeSirasi(kademeler, item.kademe)].items.push(item);
  return gruplar;
}

/**
 * Sıralamayı kademelere sırasıyla, olabildiğince eşit parçalara böler: kademeler ilk
 * açıldığında ve "Sıralamana göre dağıt"ta. Sıra değişmiyor, yalnızca kademeler.
 */
export function siralamadanDagit<T extends Item>(sirali: T[], kademeler: Kademe[]): T[] {
  const n = sirali.length;
  const k = kademeler.length;
  return sirali.map((item, i) => ({ ...item, sira: i, kademe: kademeler[Math.min(k - 1, Math.floor((i * k) / n))].anahtar }));
}

/** Sürükle-bırak dizisindeki ayırıcılar: kademe başlığı ve "Bir daha asla" çizgisi. */
export type Ayirici = { kademe: string | null } | 'asla';
export const ayiriciMi = (x: Item | Ayirici): x is Ayirici => x === 'asla' || !('id' in x);

/**
 * Sürükle-bırak sonrası: sıralama, ayırıcılar ve "Bir daha asla" tek dizide. Her kayıt
 * üstündeki son kademe başlığının kademesini alıyor (ilk başlığın üstüne bırakılan ilk
 * kademeye); "asla"nın altındakiler bölüme geçiyor. Sıralama ve bölüm kendi içinde 0'dan
 * numaralanıyor. `kademeler` yoksa kademeye dokunulmuyor.
 */
export function diziyiCoz(dizi: (Item | Ayirici)[], kademeler: Kademe[] | null): Item[] {
  const sonuc: Item[] = [];
  let kademe: string | null = kademeler?.[0]?.anahtar ?? null;
  let asla = false;
  let siraNo = 0;
  let aslaNo = 0;
  for (const x of dizi) {
    if (x === 'asla') { asla = true; continue; }
    if (ayiriciMi(x)) { kademe = x.kademe; continue; }
    if (asla) {
      sonuc.push({ ...x, sira: aslaNo++, asla: true, ...(kademeler ? { kademe: null } : {}) });
    } else {
      sonuc.push({ ...x, sira: siraNo++, asla: false, ...(kademeler ? { kademe } : {}) });
    }
  }
  return sonuc;
}

/**
 * Sıralamanın `konum`una girecek kaydın kademesi: üstündekininki (en üstteyse altındakininki).
 * Böylece kural bozulmuyor: üstteki ≤ yeni ≤ alttaki. Sıralama boşsa kademesiz.
 */
export function komsudanKademe(siraliDigerleri: Pick<Item, 'kademe'>[], konum: number): string | null {
  const ust = siraliDigerleri[konum - 1];
  const alt = siraliDigerleri[konum];
  return (ust ?? alt)?.kademe ?? null;
}

/**
 * Kaydı başka bir kademeye taşır: yukarı çıkıyorsa hedef kademenin sonuna (kıl payı girdi),
 * aşağı iniyorsa başına. Sıralama 0'dan yeniden numaralanıyor; değişmediyse null.
 */
export function kademeDegistir<T extends Item>(
  sirali: T[], kademeler: Kademe[], id: string, hedef: string | null,
): T[] | null {
  const simdiki = sirali.find(i => i.id === id);
  if (!simdiki) return null;
  const eski = kademeSirasi(kademeler, simdiki.kademe);
  const yeni = kademeSirasi(kademeler, hedef);
  if (eski === yeni) return null;
  const digerleri = sirali.filter(i => i.id !== id);
  const konum = yeni < eski
    ? digerleri.filter(i => kademeSirasi(kademeler, i.kademe) <= yeni).length
    : digerleri.filter(i => kademeSirasi(kademeler, i.kademe) < yeni).length;
  digerleri.splice(konum, 0, { ...simdiki, kademe: hedef });
  return digerleri.map((item, i) => ({ ...item, sira: i }));
}

/**
 * Kademe silinince kayıtları bir alttakine geçiyor (en alttaysa bir üsttekine): sıra
 * değişmeden kural korunuyor. Son kademe silinemez — o, kademeleri kapatmak.
 */
export function kademeSil<T extends Item>(
  sirali: T[], kademeler: Kademe[], anahtar: string,
): { kademeler: Kademe[]; degisenler: T[] } | null {
  const i = kademeler.findIndex(k => k.anahtar === anahtar);
  if (i === -1 || kademeler.length < 2) return null;
  const devralan = (kademeler[i + 1] ?? kademeler[i - 1]).anahtar;
  return {
    kademeler: kademeler.filter(k => k.anahtar !== anahtar),
    degisenler: sirali.filter(it => it.kademe === anahtar).map(it => ({ ...it, kademe: devralan })),
  };
}

/** Yeni kademe: sıradaki harf (S, A, B, C, D, E, F, G…), hepsi kullanıldıysa sayı. */
export function yeniKademe(kademeler: Kademe[], simdi = Date.now()): Kademe {
  const kullanilan = new Set(kademeler.map(k => k.etiket.toLocaleUpperCase('tr')));
  const etiket = [...'SABCDEFGH'].find(h => !kullanilan.has(h)) ?? String(kademeler.length + 1);
  const anahtarlar = new Set(kademeler.map(k => k.anahtar));
  let anahtar = `k${simdi.toString(36).slice(-6)}`;
  while (anahtarlar.has(anahtar)) anahtar += 'x';
  return { anahtar, etiket };
}

/**
 * Uygulama içindeki kademe tonu: vurgu renginin yüzdesi, en üstte dolu, aşağı indikçe
 * soluk (tek vurgu rengi kuralı; docs/kararlar.md). Paylaşım görselinde klasik renkler.
 */
export function kademeTonu(sira: number, toplam: number): number {
  if (toplam <= 1) return 100;
  return Math.round(100 - (sira / (toplam - 1)) * 78);
}

/**
 * Paylaşım görselinin klasik tier renkleri (kırmızıdan yeşile, sonra maviye). Kademe
 * sayısı bunlardan fazlaysa sondaki tekrar ediyor.
 */
export const KLASIK_RENKLER = ['#ff7f7f', '#ffbf7f', '#ffdf7f', '#ffff7f', '#bfff7f', '#7fff7f', '#7fffff', '#7fbfff', '#7f7fff', '#ff7fff'];
export const klasikRenk = (sira: number) => KLASIK_RENKLER[Math.min(sira, KLASIK_RENKLER.length - 1)];

/**
 * Tier görselinin yerleşimi: her kademe bir satır, kutucuklar satıra sığdığı kadar yan
 * yana, taşan alt satıra. Bütün satırlar `yukseklik`e sığacak en büyük kutucuk boyu
 * seçiliyor; en küçük boyda da sığmıyorsa kalabalık satırlar kırpılıp son kutucuk
 * "+N" oluyor. Satori'de (next/og) ölçüm yok: hepsi burada hesaplanıyor.
 */
export interface GorselYerlesimi {
  /** Kutucuğun kenarı, piksel. */
  kutu: number;
  /** Satır başına çizilecek kayıt sayısı (kırpıldıysa "+N" kutucuğu hariç). */
  gosterilen: number[];
  /** Satır başına gizlenen kayıt sayısı ("+N"). */
  gizlenen: number[];
  /** Satırların yükseklikleri (iç boşluk dahil). */
  satirlar: number[];
}

export function kademeGorselYerlesimi(adetler: number[], o: {
  genislik: number; yukseklik: number; aralik: number; ic: number; satirAraligi: number;
  enBuyuk?: number; enKucuk?: number;
}): GorselYerlesimi {
  const { genislik, yukseklik, aralik, ic, satirAraligi, enBuyuk = 180, enKucuk = 56 } = o;
  const sirada = (kutu: number) => Math.max(1, Math.floor((genislik + aralik) / (kutu + aralik)));
  const satirBoyu = (kutu: number, satirSayisi: number) => satirSayisi * kutu + (satirSayisi - 1) * aralik + ic * 2;
  const toplam = (boylar: number[]) => boylar.reduce((a, b) => a + b, 0) + satirAraligi * (boylar.length - 1);

  for (let kutu = enBuyuk; kutu >= enKucuk; kutu -= 4) {
    const n = sirada(kutu);
    const satirlar = adetler.map(a => satirBoyu(kutu, Math.max(1, Math.ceil(a / n))));
    if (toplam(satirlar) <= yukseklik) return { kutu, gosterilen: adetler, gizlenen: adetler.map(() => 0), satirlar };
  }

  // En küçük boyda da sığmıyor: en kalabalık satırların satır sayısını teker teker azalt.
  const kutu = enKucuk;
  const n = sirada(kutu);
  const satirSayilari = adetler.map(a => Math.max(1, Math.ceil(a / n)));
  const boylar = () => satirSayilari.map(s => satirBoyu(kutu, s));
  while (toplam(boylar()) > yukseklik) {
    const enCok = satirSayilari.indexOf(Math.max(...satirSayilari));
    if (satirSayilari[enCok] <= 1) break;
    satirSayilari[enCok] -= 1;
  }
  const sigan = satirSayilari.map(s => s * n);
  return {
    kutu,
    gosterilen: adetler.map((a, i) => (a > sigan[i] ? sigan[i] - 1 : a)),
    gizlenen: adetler.map((a, i) => (a > sigan[i] ? a - (sigan[i] - 1) : 0)),
    satirlar: boylar(),
  };
}
