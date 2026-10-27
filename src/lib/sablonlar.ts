import { simdikiDil, type Dil } from './i18n';

/**
 * Yeni liste formundaki hazır şablonlar. Bir şablon formu doldurur: liste adı,
 * kategoriler ve toplu giriş metni (`lib/toplu.ts` biçimi: "Kategori:" başlığı,
 * "Ad, çeşit" satırları). Kayıtlar "Denenmemiş"e düşüyor: kullanıcı onları henüz
 * denememiş olabilir, denedikçe sıralamaya alır. Form doldurulduktan sonra her şey
 * değiştirilebilir — şablon yalnızca başlangıç.
 *
 * Her dilin kendi metni var: kategori adları toplu metnin başlıklarında da geçtiği
 * için ikisi birlikte çevriliyor. Marka adları iki dilde aynı.
 */
export interface Sablon {
  ad: string;
  /** Hapta adın yanında. */
  simge: string;
  kategoriler: string[];
  metin: string;
}

type SablonMetni = Omit<Sablon, 'simge'>;

const SABLON_VERISI: ({ simge: string } & Record<Dil, SablonMetni>)[] = [
  {
    simge: '🥤',
    tr: {
      ad: 'Kola',
      kategoriler: ['Şekerli', 'Şekersiz'],
      metin: `Şekerli:
Coca-Cola
Pepsi
Cola Turka

Şekersiz:
Coca-Cola, Zero Sugar
Coca-Cola, Light
Pepsi, Max`,
    },
    en: {
      ad: 'Cola',
      kategoriler: ['Regular', 'Sugar-free'],
      metin: `Regular:
Coca-Cola
Pepsi
Cola Turka

Sugar-free:
Coca-Cola, Zero Sugar
Coca-Cola, Light
Pepsi, Max`,
    },
  },
  {
    simge: '🥛',
    tr: {
      ad: 'Ayran',
      kategoriler: [],
      metin: `Sütaş
Pınar
Eker
Torku
Yörükoğlu
Tikveşli`,
    },
    en: {
      ad: 'Ayran',
      kategoriler: [],
      metin: `Sütaş
Pınar
Eker
Torku
Yörükoğlu
Tikveşli`,
    },
  },
  {
    simge: '☕',
    tr: {
      ad: 'Türk Kahvesi',
      kategoriler: [],
      metin: `Kurukahveci Mehmet Efendi
Kahve Dünyası
Selamlique
Tchibo
Osmanlı Kahvecisi`,
    },
    en: {
      ad: 'Turkish Coffee',
      kategoriler: [],
      metin: `Kurukahveci Mehmet Efendi
Kahve Dünyası
Selamlique
Tchibo
Osmanlı Kahvecisi`,
    },
  },
  {
    simge: '🥔',
    tr: {
      ad: 'Cips',
      kategoriler: ['Patates', 'Mısır'],
      metin: `Patates:
Lay's, Klasik
Ruffles, Originals
Pringles, Original

Mısır:
Doritos, Nacho
Cheetos`,
    },
    en: {
      ad: 'Crisps',
      kategoriler: ['Potato', 'Corn'],
      metin: `Potato:
Lay's, Classic
Ruffles, Originals
Pringles, Original

Corn:
Doritos, Nacho
Cheetos`,
    },
  },
  {
    simge: '🍫',
    tr: {
      ad: 'Çikolata',
      kategoriler: ['Sütlü', 'Bitter'],
      metin: `Sütlü:
Milka
Ülker
Nestlé
Torku

Bitter:
Ülker, Bitter
Lindt, Excellence`,
    },
    en: {
      ad: 'Chocolate',
      kategoriler: ['Milk', 'Dark'],
      metin: `Milk:
Milka
Ülker
Nestlé
Torku

Dark:
Ülker, Bitter
Lindt, Excellence`,
    },
  },
  {
    simge: '🍦',
    tr: {
      ad: 'Dondurma',
      kategoriler: ['Sütlü', 'Meyveli'],
      metin: `Sütlü:
Kaymaklı
Çikolatalı
Antep fıstıklı
Karamelli

Meyveli:
Limon
Çilek
Vişne`,
    },
    en: {
      ad: 'Ice Cream',
      kategoriler: ['Creamy', 'Fruity'],
      metin: `Creamy:
Kaymak
Chocolate
Pistachio
Caramel

Fruity:
Lemon
Strawberry
Sour cherry`,
    },
  },
  {
    simge: '🥙',
    tr: {
      ad: 'Döner',
      kategoriler: ['Et', 'Tavuk'],
      metin: `Et:
Yaprak döner
İskender
Dürüm
Pilav üstü

Tavuk:
Tavuk dürüm
Tavuk pilav üstü
Ekmek arası`,
    },
    en: {
      ad: 'Döner',
      kategoriler: ['Meat', 'Chicken'],
      metin: `Meat:
Yaprak döner
İskender
Dürüm
On rice

Chicken:
Chicken dürüm
Chicken on rice
In bread`,
    },
  },
];

/** Arayüz dilindeki şablonlar. */
export function sablonlar(dil: Dil = simdikiDil()): Sablon[] {
  return SABLON_VERISI.map(s => ({ simge: s.simge, ...s[dil] }));
}
