/**
 * İki sıralamanın karşılaştırması: paylaşılan bir liste ile kullanıcının kendi listesi.
 * Kayıtlar kimlikle değil adla eşleşiyor — kopyalanan listede kimlikler yeni, ve aynı
 * adlı iki bağımsız liste de ("Döner" ile "Döner") karşılaştırılabilsin diye.
 */

/** Karşılaştırmaya giren kaydın ortak biçimi. */
export interface KiyasKayit {
  id: string;
  ad: string;
  alt_ad?: string | null;
  fotograf_url?: string | null;
  /** Sıralamadaki yeri (1'den); "Bir daha asla" bölümündeyse null. */
  sira: number | null;
}

export interface KiyasSatiri {
  anahtar: string;
  benim: KiyasKayit;
  onun: KiyasKayit;
}

export interface KiyasSonucu {
  /** İkisinin de denediği kayıtlar, benim sıramla. */
  ortak: KiyasSatiri[];
  /** Çiftlerin yüzde kaçında aynı sırayı vermişiz; ortak kayıt üçten azsa null. */
  uyum: number | null;
  /** Sıraları en çok ayrışan ortak kayıtlar, büyükten küçüğe (en fazla üç). */
  ayriliklar: KiyasSatiri[];
  /** Aynı sıraya koyduğumuz ortak kayıt sayısı. */
  ayniYer: number;
  /** Onun listesinde olup benimkinde hiç geçmeyenler (denenmemişlerim dahil değil). */
  yalnizOnda: KiyasKayit[];
  yalnizBende: number;
}

/** Ad + çeşit, büyük-küçük harf ve boşluk farkı gözetmeden. */
export const kiyasAnahtari = (k: { ad: string; alt_ad?: string | null }) =>
  [k.ad, k.alt_ad ?? ''].map(s => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr')).join('|');

/**
 * Sıralamadaki konum; "Bir daha asla" bütün sıralamanın altında ve kendi içinde eşit
 * sayılıyor — ikisi de "bunu sevmedim" demiş, aralarındaki sıra anlamsız.
 */
const konum = (k: KiyasKayit, siraliAdet: number) => k.sira ?? siraliAdet + 1;

/**
 * Uyum: ortak kayıtlardan oluşan her çift için ikimiz de aynı olanı öne koymuş muyuz?
 * (Kendall'ın uyum ölçüsü.) Birimizin eşit saydığı çift ("Bir daha asla"daki iki kayıt)
 * hesaba girmiyor. "Çiftlerin %72'sinde aynı fikirdesiniz" diye okunabiliyor.
 *
 * `benim` ve `onun` denenmiş kayıtlar; bekleyenler karşılaştırmaya girmiyor.
 */
export function kiyasla(
  benim: KiyasKayit[],
  onun: KiyasKayit[],
  /** Benim listemdeki bütün adlar (bekleyenler dahil) — "yalnız onda" bunlara bakıyor. */
  benimTumAnahtarlar: Set<string>,
): KiyasSonucu {
  const onunHarita = new Map(onun.map(k => [kiyasAnahtari(k), k]));
  const benimSirali = benim.filter(k => k.sira !== null).length;
  const onunSirali = onun.filter(k => k.sira !== null).length;

  const ortak: KiyasSatiri[] = [];
  for (const k of benim) {
    const anahtar = kiyasAnahtari(k);
    const karsi = onunHarita.get(anahtar);
    if (karsi) ortak.push({ anahtar, benim: k, onun: karsi });
  }

  let ayni = 0;
  let ters = 0;
  for (let i = 0; i < ortak.length; i++) {
    for (let j = i + 1; j < ortak.length; j++) {
      const b = Math.sign(konum(ortak[i].benim, benimSirali) - konum(ortak[j].benim, benimSirali));
      const o = Math.sign(konum(ortak[i].onun, onunSirali) - konum(ortak[j].onun, onunSirali));
      if (b === 0 || o === 0) continue;
      if (b === o) ayni++;
      else ters++;
    }
  }
  const uyum = ortak.length >= 3 && ayni + ters > 0 ? Math.round((100 * ayni) / (ayni + ters)) : null;

  const fark = (s: KiyasSatiri) =>
    Math.abs(konum(s.benim, benimSirali) - konum(s.onun, onunSirali));
  const ayriliklar = [...ortak]
    .filter(s => fark(s) >= 2)
    .sort((a, b) => fark(b) - fark(a))
    .slice(0, 3);

  return {
    ortak,
    uyum,
    ayriliklar,
    ayniYer: ortak.filter(s => s.benim.sira !== null && s.benim.sira === s.onun.sira).length,
    yalnizOnda: onun.filter(k => !benimTumAnahtarlar.has(kiyasAnahtari(k))),
    yalnizBende: benim.length - ortak.length,
  };
}

/** Yüzdenin bir adı — sonuç kartının başlığı. */
export function uyumEtiketi(uyum: number): string {
  if (uyum >= 90) return 'Damak ikizi';
  if (uyum >= 75) return 'Aynı damak';
  if (uyum >= 55) return 'Çoğunlukla hemfikir';
  if (uyum >= 40) return 'Ortası';
  if (uyum >= 20) return 'Farklı damaklar';
  return 'Zıt kutuplar';
}
