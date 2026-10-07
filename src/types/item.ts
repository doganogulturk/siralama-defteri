/** Listeye özel ek alanın tipi. Yeni tip eklenirse forma ve filtreye de eklenmeli. */
export type AlanTipi = 'bool' | 'metin';

export interface AlanTanimi {
  /** `Item.ozellikler` içindeki anahtar. */
  anahtar: string;
  tip: AlanTipi;
  /** Formdaki etiket. */
  etiket: string;
  /** Rozet ve filtrelerde kullanılan kısa ad; yoksa etiket kullanılır. */
  kisa?: string;
  /** Metin alanları için placeholder. */
  ipucu?: string;
  /** Yalnızca bool alanlar: filtre şeridinde üçlü seçenek olarak görünsün. */
  filtre?: boolean;
  /** Doluysa alan yalnızca bu kategori seçiliyken görünür. */
  kategori_id?: string;
}

export interface Liste {
  id: string;
  user_id: string;
  ad: string;
  slug: string;
  /** Listenin vurgu rengi — arayüzde --accent olarak uygulanır. */
  renk: string;
  sira: number;
  alanlar: AlanTanimi[];
  /** Salt okunur paylaşım bağlantısının kodu (`/p/[kod]`); boşsa liste paylaşılmıyor. */
  paylasim_kodu?: string | null;
  created_at?: string;
}

export interface Kategori {
  id: string;
  list_id: string;
  ad: string;
  renk: string;
  sira: number;
  created_at?: string;
}

export type OzellikDeger = string | boolean | null;

export interface Item {
  id: string;
  list_id: string;
  category_id?: string | null;
  ad: string;
  alt_ad?: string | null;
  fotograf_url?: string | null;
  sira?: number;
  /** false ise kayıt istek listesinde: henüz denenmemiş, sıralamaya girmemiş. */
  denendi: boolean;
  /** true ise denenmiş ama sıralamada değil: kırmızı çizginin altındaki "Bir daha asla" bölümünde. */
  asla?: boolean;
  notlar?: string | null;
  /** Listenin `alanlar` tanımına karşılık gelen değerler. */
  ozellikler: Record<string, OzellikDeger>;
  created_at?: string;
}

export const bayrak = (item: Pick<Item, 'ozellikler'>, anahtar: string): boolean =>
  item.ozellikler?.[anahtar] === true;

export const metin = (item: Pick<Item, 'ozellikler'>, anahtar: string): string => {
  const v = item.ozellikler?.[anahtar];
  return typeof v === 'string' ? v : '';
};

/** Kategoriye bağlı alanlar yalnızca o kategori seçiliyken geçerli. */
export const alanGorunur = (alan: AlanTanimi, categoryId?: string | null): boolean =>
  !alan.kategori_id || alan.kategori_id === categoryId;

export const alanKisa = (alan: AlanTanimi): string => alan.kisa ?? alan.etiket;

/** Filtre şeridinde ve detay sekmelerinde kullanılan bool alanlar. */
export const filtreAlanlari = (alanlar: AlanTanimi[]): AlanTanimi[] =>
  alanlar.filter(a => a.tip === 'bool' && a.filtre);

export const kategoriBul = (kategoriler: Kategori[], id?: string | null): Kategori | undefined =>
  id ? kategoriler.find(k => k.id === id) : undefined;

/** Fotoğrafsız kaydın yedek görseli: adın ilk iki kelimesinin baş harfleri. */
export const brandInitials = (ad: string | null | undefined) => {
  const words = (ad || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map(w => w[0]?.toLocaleUpperCase('tr') ?? '').join('') || '?';
};

/** Kayda ait ilk dolu metin alanı — satırın altındaki ince açıklama. */
export function altBilgi(item: Pick<Item, 'category_id' | 'ozellikler'>, alanlar: AlanTanimi[]): string {
  for (const alan of alanlar) {
    if (alan.tip !== 'metin' || !alanGorunur(alan, item.category_id)) continue;
    const deger = metin(item, alan.anahtar);
    if (deger) return deger;
  }
  return '';
}

/** Kayıtta işaretli bool alanların kısa adları — satır ve panellerdeki rozetler. */
export function rozetler(item: Pick<Item, 'ozellikler'>, alanlar: AlanTanimi[]): string[] {
  return alanlar
    .filter(a => a.tip === 'bool' && bayrak(item, a.anahtar))
    .map(alanKisa);
}
