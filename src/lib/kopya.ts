import { supabase } from './supabase';
import { createItems, createKategori, createListe, getListeler, updateListe, uploadFotograf } from './items';
import { KOD_BICIMI, PaylasilanKayit, PaylasilanListe, guvenliFoto } from './paylasim';
import { benzersizSlug, slugify } from './slug';
import { AlanTanimi, Kategori, Liste } from '../types/item';
import { SINIR } from './sinirlar';

/*
 * "Ben de sıralayayım": paylaşılan bir listenin kayıtlarını kullanıcının kendi
 * hesabına kopyalamak. Okuma paylaşım sayfasıyla aynı kapıdan (`paylasilan_liste`):
 * notlar ve sahibin denenmemişleri gelmiyor, kopyaya da geçmiyor.
 */

/** Oturumlu istemciden paylaşılan liste; kod yoksa ya da paylaşım kapatıldıysa null. */
export async function paylasilanListeGetir(kod: string): Promise<PaylasilanListe | null> {
  if (!KOD_BICIMI.test(kod)) return null;
  const { data, error } = await supabase.rpc('paylasilan_liste', { kod });
  if (error) throw error;
  return (data as PaylasilanListe | null) ?? null;
}

/**
 * Fotoğraf sahibinin kovasında; kopyada ona bağlı kalsaydı sahibi kaydı silince kopyadaki
 * fotoğraf da kırılırdı. Herkese açık adresten indirilip kullanıcının adına yeniden
 * yükleniyor (küçültmeden de geçiyor). Olmazsa kayıt fotoğrafsız kalıyor, kopya durmuyor.
 */
async function fotoKopyala(url?: string | null): Promise<string | null> {
  const adres = guvenliFoto(url);
  if (!adres) return null;
  try {
    const yanit = await fetch(adres);
    if (!yanit.ok) return null;
    const blob = await yanit.blob();
    return await uploadFotograf(new File([blob], 'kopya', { type: blob.type }));
  } catch {
    return null;
  }
}

/** Fotoğrafları dörder dörder kopyalar; sonuç kayıtlarla aynı sırada. */
async function fotolariKopyala(
  kayitlar: PaylasilanKayit[],
  ilerleme?: (biten: number, toplam: number) => void,
): Promise<(string | null)[]> {
  const sonuc: (string | null)[] = new Array(kayitlar.length).fill(null);
  const fotolu = kayitlar.map((k, i) => [k, i] as const).filter(([k]) => guvenliFoto(k.fotograf_url));
  let sira = 0;
  let biten = 0;
  ilerleme?.(0, fotolu.length);
  const isci = async () => {
    while (sira < fotolu.length) {
      const [k, i] = fotolu[sira++];
      sonuc[i] = await fotoKopyala(k.fotograf_url);
      ilerleme?.(++biten, fotolu.length);
    }
  };
  await Promise.all(Array.from({ length: 4 }, isci));
  return sonuc;
}

/** Kullanıcının bu paylaşımdan oluşturduğu sıralama. */
export interface KopyaSecimi {
  siralama: PaylasilanKayit[];
  asla: PaylasilanKayit[];
  denenmemis: PaylasilanKayit[];
}

/**
 * Listeyi kategorileri, ek alanları ve kayıtlarıyla kopyalar; kayıtlar kullanıcının
 * verdiği sırayla. `kaynak_kod` karşılaştırma ekranının iki listeyi eşlemesi için.
 */
export async function listeKopyala(
  kod: string,
  kaynak: PaylasilanListe,
  secim: KopyaSecimi,
  ilerleme?: (biten: number, toplam: number) => void,
): Promise<Liste> {
  const mevcut = await getListeler();
  if (mevcut.length >= SINIR.kullaniciListe) {
    throw new Error(`En fazla ${SINIR.kullaniciListe} liste oluşturabilirsin.`);
  }

  // Ek alanlar listeyle birlikte doğuyor ama kategoriye bağlı olanlar yeni kimlikleri
  // bekliyor: önce kategorisiz yazılıp kategoriler açılınca güncelleniyor.
  const liste = await createListe({
    ad: kaynak.ad,
    slug: benzersizSlug(slugify(kaynak.ad), mevcut.map(l => l.slug)),
    sira: mevcut.length,
    alanlar: (kaynak.alanlar ?? []).map(a => ({ ...a, kategori_id: undefined })),
    kaynak_kod: kod,
  });

  const katEslesme = new Map<string, string>();
  for (const [i, k] of kaynak.kategoriler.slice(0, SINIR.listeKategori).entries()) {
    const yeni = await createKategori({ list_id: liste.id, ad: k.ad, renk: k.renk, sira: i });
    katEslesme.set(k.id, yeni.id);
  }
  if ((kaynak.alanlar ?? []).some(a => a.kategori_id)) {
    const alanlar: AlanTanimi[] = kaynak.alanlar
      // Kategorisi kopyalanamayan alan her kategoride görünmesin diye düşüyor.
      .filter(a => !a.kategori_id || katEslesme.has(a.kategori_id))
      .map(a => (a.kategori_id ? { ...a, kategori_id: katEslesme.get(a.kategori_id) } : a));
    await updateListe(liste.id, { alanlar });
  }

  const kayitlar = [...secim.siralama, ...secim.asla, ...secim.denenmemis].slice(0, SINIR.listeKayit);
  const fotolar = await fotolariKopyala(kayitlar, ilerleme);
  const nSira = secim.siralama.length;
  const nAsla = secim.asla.length;

  await createItems(kayitlar.map((k, i) => ({
    list_id: liste.id,
    category_id: k.category_id ? katEslesme.get(k.category_id) ?? null : null,
    ad: k.ad,
    alt_ad: k.alt_ad,
    fotograf_url: fotolar[i],
    notlar: null,
    ozellikler: k.ozellikler ?? {},
    denendi: i < nSira + nAsla,
    asla: i >= nSira && i < nSira + nAsla,
    // Sıralama ve "Bir daha asla" kendi içlerinde 0'dan; bekleyenlerde sıra anlamsız.
    sira: i < nSira ? i : i < nSira + nAsla ? i - nSira : 0,
  })));

  return liste;
}

/**
 * Karşılaştırmadaki "onda olup sende olmayanlar": kullanıcının listesine denenmemiş
 * olarak eklenir. Kategori adı kullanıcının listesinde de varsa oraya bağlanıyor.
 */
export async function denenmemislereEkle(
  liste: Liste,
  kategoriler: Kategori[],
  kaynak: PaylasilanListe,
  kayitlar: PaylasilanKayit[],
  mevcutKayit: number,
): Promise<number> {
  const kalan = Math.max(0, SINIR.listeKayit - mevcutKayit);
  if (kalan === 0) throw new Error(`Bu liste dolu: bir listede en fazla ${SINIR.listeKayit} kayıt olabilir.`);
  const eklenecek = kayitlar.slice(0, kalan);
  const tr = (s: string) => s.trim().toLocaleLowerCase('tr');
  const katAdi = new Map(kaynak.kategoriler.map(k => [k.id, tr(k.ad)]));
  const fotolar = await fotolariKopyala(eklenecek);
  await createItems(eklenecek.map((k, i) => {
    const ad = k.category_id ? katAdi.get(k.category_id) : undefined;
    return {
      list_id: liste.id,
      category_id: (ad && kategoriler.find(c => tr(c.ad) === ad)?.id) || null,
      ad: k.ad,
      alt_ad: k.alt_ad,
      fotograf_url: fotolar[i],
      notlar: null,
      ozellikler: {},
      denendi: false,
      sira: 0,
    };
  }));
  return eklenecek.length;
}
