import { simdikiDil, type Dil } from './i18n';

/**
 * Kör Sıralama: hazır listeler ve sonuçların adrese yazılması. Oyun girişsiz
 * oynanıyor ve hiçbir şey kaydedilmiyor — sonuç adreste taşınıyor (`?s=`), sonuç
 * görseli (`/kor/[liste]/gorsel`) ve arkadaşla karşılaştırma oradan okuyor.
 *
 * Listeler marka ya da işletme değil tür adlarından: herkes aynı şeyleri tanısın.
 * Her listede tam on kayıt; sıra bir kez yayımlanınca değişmemeli, çünkü sonuçlar
 * kayıtların bu dizideki yerini taşıyor (eklemek yerine yeni liste açılmalı).
 */
export interface KorListe {
  slug: string;
  ad: string;
  simge: string;
  /** Oyundaki kartın ve görselin vurgu rengi. */
  renk: string;
  kayitlar: string[];
}

/**
 * Her dilin adları aynı sırada: sonuç kayıtların yerini taşıdığı için bir dilde oynanan
 * sonuç öbür dilde de aynı kayıtları gösterir. Yemek adları gibi özgün adlar İngilizcede de
 * Türkçe kalıyor; meyve, spor gibi sıradan adlar çevriliyor.
 */
const KOR_VERISI: (Pick<KorListe, 'slug' | 'simge' | 'renk'> & Record<Dil, Pick<KorListe, 'ad' | 'kayitlar'>>)[] = [
  {
    slug: 'corbalar', simge: '🍲', renk: '#c2410c',
    tr: { ad: 'Çorbalar', kayitlar: ['Mercimek', 'Ezogelin', 'Yayla', 'Tarhana', 'İşkembe', 'Domates', 'Tavuk suyu', 'Kelle paça', 'Düğün çorbası', 'Mantar'] },
    en: { ad: 'Soups', kayitlar: ['Lentil', 'Ezogelin', 'Yayla', 'Tarhana', 'İşkembe', 'Tomato', 'Chicken broth', 'Kelle paça', 'Wedding soup', 'Mushroom'] },
  },
  {
    slug: 'kebaplar', simge: '🍢', renk: '#b91c1c',
    tr: { ad: 'Kebaplar', kayitlar: ['Adana', 'Urfa', 'İskender', 'Beyti', 'Kuzu şiş', 'Patlıcan kebabı', 'Tandır', 'Testi kebabı', 'Ciğer şiş', 'Alinazik'] },
    en: { ad: 'Kebabs', kayitlar: ['Adana', 'Urfa', 'İskender', 'Beyti', 'Lamb shish', 'Eggplant kebab', 'Tandır', 'Pottery kebab', 'Liver shish', 'Alinazik'] },
  },
  {
    slug: 'tatlilar', simge: '🍮', renk: '#b45309',
    tr: { ad: 'Tatlılar', kayitlar: ['Baklava', 'Künefe', 'Sütlaç', 'Kazandibi', 'Tavuk göğsü', 'Revani', 'Aşure', 'Kemalpaşa', 'Lokma', 'Kadayıf'] },
    en: { ad: 'Desserts', kayitlar: ['Baklava', 'Künefe', 'Rice pudding', 'Kazandibi', 'Tavuk göğsü', 'Revani', 'Aşure', 'Kemalpaşa', 'Lokma', 'Kadayıf'] },
  },
  {
    slug: 'kahvalti', simge: '🍳', renk: '#ca8a04',
    tr: { ad: 'Kahvaltılıklar', kayitlar: ['Menemen', 'Sucuklu yumurta', 'Simit', 'Bal kaymak', 'Beyaz peynir', 'Zeytin', 'Gözleme', 'Pişi', 'Çılbır', 'Poğaça'] },
    en: { ad: 'Breakfast', kayitlar: ['Menemen', 'Sucuk & eggs', 'Simit', 'Honey & kaymak', 'White cheese', 'Olives', 'Gözleme', 'Pişi', 'Çılbır', 'Poğaça'] },
  },
  {
    slug: 'sokak-lezzetleri', simge: '🥙', renk: '#7c2d12',
    tr: { ad: 'Sokak lezzetleri', kayitlar: ['Midye dolma', 'Kokoreç', 'Tantuni', 'Çiğ köfte', 'Islak hamburger', 'Balık ekmek', 'Kumpir', 'Kestane', 'Haşlanmış mısır', 'Lahmacun'] },
    en: { ad: 'Street food', kayitlar: ['Stuffed mussels', 'Kokoreç', 'Tantuni', 'Çiğ köfte', 'Wet burger', 'Fish sandwich', 'Kumpir', 'Roasted chestnuts', 'Boiled corn', 'Lahmacun'] },
  },
  {
    slug: 'meyveler', simge: '🍉', renk: '#be123c',
    tr: { ad: 'Meyveler', kayitlar: ['Karpuz', 'Çilek', 'Kiraz', 'İncir', 'Şeftali', 'Muz', 'Elma', 'Üzüm', 'Mandalina', 'Nar'] },
    en: { ad: 'Fruits', kayitlar: ['Watermelon', 'Strawberry', 'Cherry', 'Fig', 'Peach', 'Banana', 'Apple', 'Grape', 'Tangerine', 'Pomegranate'] },
  },
  {
    slug: 'icecekler', simge: '🫖', renk: '#0f766e',
    tr: { ad: 'İçecekler', kayitlar: ['Çay', 'Türk kahvesi', 'Ayran', 'Şalgam', 'Boza', 'Salep', 'Limonata', 'Maden suyu', 'Kefir', 'Vişne suyu'] },
    en: { ad: 'Drinks', kayitlar: ['Tea', 'Turkish coffee', 'Ayran', 'Şalgam', 'Boza', 'Salep', 'Lemonade', 'Mineral water', 'Kefir', 'Sour cherry juice'] },
  },
  {
    slug: 'sehirler', simge: '🏙️', renk: '#1d4ed8',
    tr: { ad: 'Şehirler', kayitlar: ['İstanbul', 'İzmir', 'Ankara', 'Antalya', 'Trabzon', 'Gaziantep', 'Mardin', 'Eskişehir', 'Çanakkale', 'Bursa'] },
    en: { ad: 'Cities', kayitlar: ['İstanbul', 'İzmir', 'Ankara', 'Antalya', 'Trabzon', 'Gaziantep', 'Mardin', 'Eskişehir', 'Çanakkale', 'Bursa'] },
  },
  {
    slug: 'sporlar', simge: '⚽', renk: '#15803d',
    tr: { ad: 'Sporlar', kayitlar: ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Yüzme', 'Koşu', 'Bisiklet', 'Masa tenisi', 'Satranç', 'Bowling'] },
    en: { ad: 'Sports', kayitlar: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Swimming', 'Running', 'Cycling', 'Table tennis', 'Chess', 'Bowling'] },
  },
  {
    slug: 'gunun-anlari', simge: '🌅', renk: '#6d28d9',
    tr: { ad: 'Günün anları', kayitlar: ['Sabah kahvesi', 'Öğle uykusu', 'Gün batımı', 'Gece yürüyüşü', 'Pazar kahvaltısı', 'Cuma akşamı', 'İlk kar', 'Yaz yağmuru', 'Bayram sabahı', 'Tatilin ilk günü'] },
    en: { ad: 'Moments of the day', kayitlar: ['Morning coffee', 'Afternoon nap', 'Sunset', 'Night walk', 'Sunday breakfast', 'Friday evening', 'First snow', 'Summer rain', 'Holiday morning', 'First day of vacation'] },
  },
];

/** Kör Sıralama listeleri, istenen dilde (varsayılan: arayüz dili). */
export const korListeleri = (dil: Dil = simdikiDil()): KorListe[] =>
  KOR_VERISI.map(({ tr, en, ...l }) => ({ ...l, ...(dil === 'en' ? en : tr) }));

export const korListesi = (slug: string, dil: Dil = simdikiDil()) => korListeleri(dil).find(l => l.slug === slug);

/**
 * Sonuç: birinciden onuncuya kayıtların listedeki yerleri, "3-0-7-…" biçiminde.
 * Geçerli bir permütasyon değilse null — adres elle değiştirilmiş olabilir.
 */
export function sonucCoz(liste: KorListe, s?: string | null): number[] | null {
  if (!s) return null;
  const sira = s.split('-').map(Number);
  const n = liste.kayitlar.length;
  if (sira.length !== n || sira.some(i => !Number.isInteger(i) || i < 0 || i >= n)) return null;
  return new Set(sira).size === n ? sira : null;
}

export const sonucYaz = (sira: number[]) => sira.join('-');
