export type Kategori = 'yaygin_market' | 'market_markasi' | 'yoresel';

export interface AyranEntry {
  id: string;
  created_at?: string;
  marka: string;
  urun_adi?: string | null;
  kategori: Kategori;
  eksi_mi: boolean;
  market_adi?: string | null;  // Yalnızca market_markasi kategorisi için
  yore?: string | null;         // Yalnızca yoresel kategorisi için
  fotograf_url?: string | null;
  sira?: number;
  /** false ise kayıt istek listesinde: henüz denenmemiş, sıralamaya girmemiş. */
  denendi: boolean;
  /** Serbest not — özellikle istek listesinde "nerede gördüm / kim önerdi" için. */
  notlar?: string | null;
}

export const kategoriler: Kategori[] = ['yaygin_market', 'market_markasi', 'yoresel'];

export const kategoriEtiketleri: Record<Kategori, string> = {
  yaygin_market: 'Yaygın',
  market_markasi: 'Market Markası',
  yoresel: 'Yöresel',
};
