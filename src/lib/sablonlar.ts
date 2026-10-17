/**
 * Yeni liste formundaki hazır şablonlar. Bir şablon formu doldurur: liste adı,
 * kategoriler ve toplu giriş metni (`lib/toplu.ts` biçimi: "Kategori:" başlığı,
 * "Ad, çeşit" satırları). Kayıtlar "Denenmemiş"e düşüyor: kullanıcı onları henüz
 * denememiş olabilir, denedikçe sıralamaya alır. Form doldurulduktan sonra her şey
 * değiştirilebilir — şablon yalnızca başlangıç.
 */
export interface Sablon {
  ad: string;
  /** Hapta adın yanında. */
  simge: string;
  kategoriler: string[];
  metin: string;
}

export const SABLONLAR: Sablon[] = [
  {
    ad: 'Kola',
    simge: '🥤',
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
  {
    ad: 'Ayran',
    simge: '🥛',
    kategoriler: [],
    metin: `Sütaş
Pınar
Eker
Torku
Yörükoğlu
Tikveşli`,
  },
  {
    ad: 'Türk Kahvesi',
    simge: '☕',
    kategoriler: [],
    metin: `Kurukahveci Mehmet Efendi
Kahve Dünyası
Selamlique
Tchibo
Osmanlı Kahvecisi`,
  },
  {
    ad: 'Cips',
    simge: '🥔',
    kategoriler: ['Patates', 'Mısır'],
    metin: `Patates:
Lay's, Klasik
Ruffles, Originals
Pringles, Original

Mısır:
Doritos, Nacho
Cheetos`,
  },
  {
    ad: 'Çikolata',
    simge: '🍫',
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
  {
    ad: 'Dondurma',
    simge: '🍦',
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
  {
    ad: 'Döner',
    simge: '🥙',
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
];
