import { supabase } from './supabase';
import { AlanTanimi, Item, Kategori, Liste } from '../types/item';
import { fotoKucult } from './foto';
import { KOVA } from './kova';

const T_LISTS = 'lists';
const T_CATS = 'categories';
const T_ITEMS = 'items';

/** Yeni kategorilere sırayla atanan renkler — ayarlar ekranı ve toplu ekleme aynı sırayı kullanır. */
export const KATEGORI_PALET = [
  '#1f6feb', '#b45309', '#127a5b', '#a8342c', '#6b4fbb',
  '#0f7d8c', '#8a5cf6', '#8a8f2b', '#c2436f',
];

/* ── Listeler ───────────────────────────────────────── */

export async function getListeler(): Promise<Liste[]> {
  const { data, error } = await supabase
    .from(T_LISTS)
    .select('*')
    .order('sira', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Liste[];
}

export async function getListeBySlug(slug: string): Promise<Liste | null> {
  const { data, error } = await supabase
    .from(T_LISTS)
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return (data as Liste) ?? null;
}

export async function createListe(
  entry: {
    ad: string; slug: string; renk?: string; sira?: number; alanlar?: AlanTanimi[]; kaynak_kod?: string;
  }
): Promise<Liste> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Oturum bulunamadı.');

  const { data, error } = await supabase
    .from(T_LISTS)
    .insert({ ...entry, user_id: userData.user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Liste;
}

export async function updateListe(
  id: string,
  entry: Partial<Pick<Liste, 'ad' | 'slug' | 'renk' | 'sira' | 'alanlar' | 'paylasim_kodu'>>
): Promise<Liste> {
  const { data, error } = await supabase
    .from(T_LISTS)
    .update(entry)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Liste;
}

/**
 * Kategoriler ve öğeler cascade ile birlikte silinir. Fotoğraflar cascade'e
 * girmiyor (kova ayrı bir servis): adresleri önceden okunup liste silindikten
 * sonra kovadan kaldırılıyor, yoksa yer kaplayan yetim dosyalar kalıyordu.
 */
export async function deleteListe(id: string): Promise<void> {
  const { data: fotolar, error: okumaHatasi } = await supabase
    .from(T_ITEMS)
    .select('fotograf_url')
    .eq('list_id', id)
    .not('fotograf_url', 'is', null);
  if (okumaHatasi) throw okumaHatasi;

  const { error } = await supabase.from(T_LISTS).delete().eq('id', id);
  if (error) throw error;
  await fotograflariSil((fotolar ?? []).map(f => f.fotograf_url as string));
}

/** Ana ekran kartındaki sıralama satırı — kaydın yalnızca gösterilen kısmı. */
export interface OzetKayit {
  id: string;
  ad: string;
  alt_ad: string | null;
  fotograf_url: string | null;
}

export interface ListeSayisi {
  toplam: number;
  /** Henüz denenmemiş, sıralamaya girmemiş kayıtlar. */
  bekleyen: number;
  /** Sıralamanın ilk üçü, sırasıyla; ilki şampiyon. */
  ilkUc: OzetKayit[];
}

/**
 * Liste başına kayıt sayıları ve ilk üç. Sayım veritabanında
 * (`supabase/schema.sql` → `liste_ozetleri`): kayıtları istemciye çekip saymak
 * PostgREST'in 1000 satır sınırında sessizce yanlış sonuç veriyordu.
 */
export async function getListeSayilari(): Promise<Record<string, ListeSayisi>> {
  const { data, error } = await supabase.rpc('liste_ozetleri');
  if (error) throw error;

  return Object.fromEntries(
    (data as { list_id: string; toplam: number; bekleyen: number; ilk_uc: OzetKayit[] }[])
      .map(r => [r.list_id, { toplam: r.toplam, bekleyen: r.bekleyen, ilkUc: r.ilk_uc ?? [] }])
  );
}

/* ── Kategoriler ────────────────────────────────────── */

export async function getKategoriler(listId: string): Promise<Kategori[]> {
  const { data, error } = await supabase
    .from(T_CATS)
    .select('*')
    .eq('list_id', listId)
    .order('sira', { ascending: true });

  if (error) throw error;
  return data as Kategori[];
}

export async function createKategori(
  entry: { list_id: string; ad: string; renk: string; sira: number }
): Promise<Kategori> {
  const { data, error } = await supabase.from(T_CATS).insert(entry).select().single();
  if (error) throw error;
  return data as Kategori;
}

export async function updateKategori(
  id: string,
  entry: Partial<Pick<Kategori, 'ad' | 'renk' | 'sira'>>
): Promise<Kategori> {
  const { data, error } = await supabase
    .from(T_CATS)
    .update(entry)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Kategori;
}

/** Kategorideki öğeler silinmez; şema `on delete set null` ile kategorisiz kalır. */
export async function deleteKategori(id: string): Promise<void> {
  const { error } = await supabase.from(T_CATS).delete().eq('id', id);
  if (error) throw error;
}

/* ── Öğeler ─────────────────────────────────────────── */

export async function getItems(listId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from(T_ITEMS)
    .select('*')
    .eq('list_id', listId)
    .order('sira', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Item[];
}

export async function createItem(
  entry: Omit<Item, 'id' | 'created_at'>
): Promise<Item> {
  const { data, error } = await supabase.from(T_ITEMS).insert(entry).select().single();
  if (error) throw error;
  return data as Item;
}

/** Toplu ekleme yolu: tek insert, dönen kayıtlar gönderilen sırayla. */
export async function createItems(
  entries: Omit<Item, 'id' | 'created_at'>[]
): Promise<Item[]> {
  if (entries.length === 0) return [];
  const { data, error } = await supabase.from(T_ITEMS).insert(entries).select();
  if (error) throw error;
  // Postgres dönüş sırasını garanti etmiyor; `sira` girilen sırayı zaten taşıyor.
  return (data as Item[]).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function updateItem(
  id: string,
  entry: Partial<Omit<Item, 'id' | 'created_at'>>
): Promise<Item> {
  const { data, error } = await supabase
    .from(T_ITEMS)
    .update(entry)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Item;
}

export async function deleteItem(id: string, fotografUrl?: string | null): Promise<void> {
  const { error } = await supabase.from(T_ITEMS).delete().eq('id', id);
  if (error) throw error;
  await deleteFotograf(fotografUrl);
}

/** Toplu silme: kayıtlar tek DELETE ile, fotoğrafları kova başına tek istekte. */
export async function deleteItems(items: { id: string; fotograf_url?: string | null }[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.from(T_ITEMS).delete().in('id', items.map(i => i.id));
  if (error) throw error;
  await fotograflariSil(items.map(i => i.fotograf_url));
}

/** Kova başına tek istek. Silinemeyen fotoğraf işlemi bozmuyor, yalnızca uyarı. */
async function fotograflariSil(urller: (string | null | undefined)[]): Promise<void> {
  const kovalar = new Map<string, string[]>();
  for (const url of urller) {
    const parsed = url ? kovaYolu(url) : null;
    if (parsed) kovalar.set(parsed.kova, [...(kovalar.get(parsed.kova) ?? []), parsed.yol]);
  }
  for (const [kova, yollar] of kovalar) {
    const { error: e } = await supabase.storage.from(kova).remove(yollar);
    if (e) console.warn('Fotoğraflar silinemedi:', e.message);
  }
}

/**
 * `asla` verilirse o da yazılıyor — kayıt sıralama ile "Bir daha asla" arasında yer
 * değiştirdiğinde. `denendi` toplu "Denedim"de: bekleyen kayıt sıralamaya girerken.
 */
type SiraDegisikligi = { id: string; sira: number; asla?: boolean; denendi?: boolean };

/**
 * Sıra yazımları sırayla gidiyor: arka arkaya iki sürükle-bırakta eskisinin isteği
 * yenisinden sonra varıp onun üstüne yazmasın. Hata zinciri koparmıyor.
 */
let siraKuyrugu: Promise<unknown> = Promise.resolve();

/**
 * Sıralama değişikliklerini tek istekte, tek transaction'da yazar (`siralamayi_yaz`):
 * ya hepsi ya hiçbiri. Fonksiyon veritabanında henüz yoksa (PGRST202) satır satır yola düşer.
 */
export function updateItemsSira(updates: SiraDegisikligi[]): Promise<void> {
  if (updates.length === 0) return Promise.resolve();
  const is = siraKuyrugu.then(() => siraYaz(updates));
  siraKuyrugu = is.catch(() => {});
  return is;
}

async function siraYaz(updates: SiraDegisikligi[]): Promise<void> {
  const { error } = await supabase.rpc('siralamayi_yaz', { degisiklikler: updates });
  if (!error) return;
  if (error.code !== 'PGRST202') throw error;

  // Tek upsert değil: Postgres, ON CONFLICT bir UPDATE'e yönlense bile NOT NULL
  // kolonları INSERT değerlerine göre doğruluyor; çıplak {id, sira} yükü 23502
  // veriyor. Satır satır UPDATE diğer kolonlara hiç dokunmadığı için sorun çıkmıyor.
  const results = await Promise.all(
    updates.map(u => supabase
      .from(T_ITEMS)
      .update({
        sira: u.sira,
        ...(u.asla === undefined ? {} : { asla: u.asla }),
        ...(u.denendi === undefined ? {} : { denendi: u.denendi }),
      })
      .eq('id', u.id))
  );
  for (const r of results) {
    if (r.error) throw r.error;
  }
}

/** Toplu kategori atama: seçili kayıtlar tek UPDATE ile aynı kategoriye (null: kategorisiz). */
export async function updateItemsKategori(ids: string[], categoryId: string | null): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from(T_ITEMS).update({ category_id: categoryId }).in('id', ids);
  if (error) throw error;
}

/* ── Fotoğraf ───────────────────────────────────────── */

/** Fotoğraf küçültülüp yükleniyor (`lib/foto.ts`); kova yalnızca küçük JPEG kabul ediyor. */
export async function uploadFotograf(file: File): Promise<string> {
  const blob = await fotoKucult(file);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from(KOVA)
    .upload(fileName, blob, { upsert: false, contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;

  const { data } = supabase.storage.from(KOVA).getPublicUrl(fileName);
  return data.publicUrl;
}

/** URL'den kovayı ve yolu ayırır — kova adı sabite bağlı değil, eski URL'ler de silinebilsin. */
function kovaYolu(url: string): { kova: string; yol: string } | null {
  const marker = '/storage/v1/object/public/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length);
  const slash = rest.indexOf('/');
  if (slash === -1) return null;
  return { kova: rest.slice(0, slash), yol: rest.slice(slash + 1) };
}

export async function deleteFotograf(url?: string | null): Promise<void> {
  if (!url) return;
  const parsed = kovaYolu(url);
  if (!parsed) return;
  const { error } = await supabase.storage.from(parsed.kova).remove([parsed.yol]);
  if (error) console.warn('Fotoğraf silinemedi:', error.message);
}

/* ── Hesap ──────────────────────────────────────────── */

/**
 * "Verilerimi sil": kullanıcının bu uygulamadaki her şeyi. Önce kovadaki bütün
 * dosyaları (kayıtlara bağlı olmayan yetimler dahil — listeleme politikası
 * yalnızca sahibine açık, `storage.sql`), sonra listeleri; kategoriler ve kayıtlar
 * cascade ile gidiyor. Giriş kaydı (auth.users) silinmiyor: aynı Supabase projesi
 * başka uygulamalarla paylaşılıyor, oradaki hesap da ona bağlı.
 */
export async function tumVerileriSil(): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Oturum bulunamadı.');

  // Silindikçe sayfa kayıyor: hep baştan, dosya kalmayana kadar.
  for (let tur = 0; tur < 20; tur++) {
    const { data: dosyalar, error } = await supabase.storage.from(KOVA).list('', { limit: 1000 });
    if (error) throw error;
    const adlar = (dosyalar ?? []).filter(d => d.id).map(d => d.name);
    if (adlar.length === 0) break;
    const { error: e } = await supabase.storage.from(KOVA).remove(adlar);
    if (e) throw e;
  }

  const { error } = await supabase.from(T_LISTS).delete().eq('user_id', userData.user.id);
  if (error) throw error;
}
