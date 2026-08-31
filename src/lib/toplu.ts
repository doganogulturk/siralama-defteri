import { Item, Kategori, Liste } from '../types/item';
import { KATEGORI_PALET, createItems, createKategori } from './items';

/** Toplu girişte bir satırdan çıkan kayıt. */
export interface TopluKayit {
  ad: string;
  /** Virgülden sonrası — tek kayıt formundaki "Çeşit / Alt ad" alanının karşılığı. */
  alt_ad: string | null;
}

/** Tek başlık altındaki kayıtlar. `kategori` boşsa kayıtlar kategorisiz doğar. */
export interface TopluBlok {
  kategori: string | null;
  kayitlar: TopluKayit[];
}

const tr = (s: string) => s.trim().toLocaleLowerCase('tr');

/**
 * Toplu giriş metnini bloklara ayırır.
 *
 * - Her satır bir kayıt.
 * - Sonu `:` ile biten satır kategori başlığı açar; sonraki satırlar o kategoriye yazılır.
 * - `Cips: Doritos, Nacho` gibi tek satır da olur — iki noktadan sonrası kaydın kendisi.
 * - İlk virgülden sonrası kaydın "Çeşit / Alt ad" değeri olur (`Doritos, Nacho`). Yalnızca
 *   ilki bölüyor; sonraki virgüller alt adın içinde kalıyor. Ad ya da alt ad içinde virgül
 *   geçen bir satır yanlış bölünür, bu yüzden form kaydetmeden önce sonucu önizletiyor.
 * - Aynı kategori adı birden çok yerde geçerse tek blokta toplanır.
 */
export function topluAyristir(metin: string): TopluBlok[] {
  const bloklar: TopluBlok[] = [];

  const blokBul = (kategori: string | null): TopluBlok => {
    const anahtar = kategori === null ? null : tr(kategori);
    const mevcut = bloklar.find(b => (b.kategori === null ? null : tr(b.kategori)) === anahtar);
    if (mevcut) return mevcut;
    const yeni: TopluBlok = { kategori, kayitlar: [] };
    bloklar.push(yeni);
    return yeni;
  };

  let aktif: TopluBlok | null = null;

  for (const ham of metin.split('\n')) {
    const satir = ham.trim();
    if (!satir) continue;

    const baslikli = /^([^:]+):(.*)$/.exec(satir);
    const hedef: TopluBlok = baslikli ? blokBul(baslikli[1].trim()) : (aktif ?? blokBul(null));
    if (baslikli) aktif = hedef;

    const govde = (baslikli ? baslikli[2] : satir).trim();
    if (!govde) continue;
    const virgul = govde.indexOf(',');
    const ad = (virgul === -1 ? govde : govde.slice(0, virgul)).trim();
    const altAd = virgul === -1 ? '' : govde.slice(virgul + 1).trim();
    if (ad) hedef.kayitlar.push({ ad, alt_ad: altAd || null });
  }

  // Kaydı olmayan başlık (yazılmakta olan "Çorba:" satırı) boş kategori açmasın.
  return bloklar.filter(b => b.kayitlar.length > 0);
}

/** Önizleme ve düğme durumu için: kaç kayıt oluşacak. */
export const topluKayitSayisi = (bloklar: TopluBlok[]): number =>
  bloklar.reduce((n, b) => n + b.kayitlar.length, 0);

/** Metinde adı geçip listede karşılığı olmayan kategoriler. */
export const eksikKategoriler = (bloklar: TopluBlok[], mevcut: Kategori[]): string[] =>
  bloklar
    .map(b => b.kategori)
    .filter((ad): ad is string => !!ad && !mevcut.some(k => tr(k.ad) === tr(ad)));

/**
 * Blokları veritabanına yazar: önce eksik kategoriler, sonra kayıtlar.
 * Denenmiş kayıtlar yazıldıkları sırayla mevcut sıralamanın altına ekleniyor;
 * bekleyenlerin sırası olmadığı için onlarda `sira` anlamsız.
 */
export async function topluKaydet(opts: {
  liste: Liste;
  kategoriler: Kategori[];
  bloklar: TopluBlok[];
  /** Sıralamada ilk yeni kaydın alacağı `sira` — mevcut son sıranın bir fazlası. */
  baslangicSira: number;
  /** false ise kayıtlar bekleyenlere düşer. Formun kipi belirliyor. */
  denendi?: boolean;
}): Promise<{ kategoriler: Kategori[]; items: Item[] }> {
  const { liste, bloklar, baslangicSira, denendi = true } = opts;
  const kategoriler = [...opts.kategoriler];
  const yeniKategoriler: Kategori[] = [];

  for (const ad of eksikKategoriler(bloklar, kategoriler)) {
    const kat = await createKategori({
      list_id: liste.id,
      ad,
      renk: KATEGORI_PALET[kategoriler.length % KATEGORI_PALET.length],
      sira: kategoriler.length,
    });
    kategoriler.push(kat);
    yeniKategoriler.push(kat);
  }

  const kayitlar = bloklar.flatMap(blok => {
    const kat = blok.kategori
      ? kategoriler.find(k => tr(k.ad) === tr(blok.kategori as string))
      : undefined;
    return blok.kayitlar.map(k => ({ ...k, category_id: kat?.id ?? null }));
  });

  const items = await createItems(kayitlar.map((k, i) => ({
    list_id: liste.id,
    category_id: k.category_id,
    ad: k.ad,
    alt_ad: k.alt_ad,
    fotograf_url: null,
    notlar: null,
    ozellikler: {},
    denendi,
    sira: denendi ? baslangicSira + i : 0,
  })));

  return { kategoriler: yeniKategoriler, items };
}
