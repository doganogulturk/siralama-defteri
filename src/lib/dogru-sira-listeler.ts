import type { Dil } from './i18n';
import { ISLEM_HAVUZU } from './islemler';

/*
 * Doğru Sıra'nın listeleri: doğru cevabı olan sıralamalar. Her listede oyunun her
 * seferinde on madde seçtiği bir havuz var (`lib/dogru-sira.ts`).
 *
 * Veri kuralları (testte denetleniyor, `dogru-sira.test.ts`):
 *   • her değerin kaynağı ve yılı `kaynak`ta; uygulamada sonuçta yazıyor;
 *   • tanımı tartışmalı maddeler yok (ör. denizaşırı toprakları sayılınca değişen ülke
 *     alanları, kaynaklar arasında milyonlarca fark olan nüfuslar);
 *   • seçilen on madde arasında en az `ayrim` kadar fark var: sıralama bilgi istesin,
 *     yazı tura olmasın; kaynaklar arasındaki küçük farklar da doğru sırayı değiştirmesin.
 * Değerler eskidiğinde (nüfus her yıl) yeni yılın verisiyle güncellenip `kaynak`taki yıl
 * değiştirilmeli. Liste eklemek serbest; bir listenin `slug`ı ve havuzdaki sırası
 * yayımlandıktan sonra değişmemeli: sonuç bağlantıları seçimi tohumdan yeniden üretiyor.
 */

export type Bicim = 'kisi' | 'km2' | 'metre' | 'yil' | 'sayi' | 'milyonKm';

export interface DogruSiraMadde {
  tr: string;
  en: string;
  deger: number;
}

export interface DogruSiraTanimi {
  slug: string;
  simge: string;
  /** Oyunun ve görselin vurgu rengi. */
  renk: string;
  /** Doğru sıra: `azalan` büyükten küçüğe, `artan` küçükten büyüğe (eskiden yeniye). */
  yon: 'azalan' | 'artan';
  bicim: Bicim;
  /** Seçilen iki madde arasındaki en az fark: oran (büyüğün yüzdesi) ya da mutlak. */
  ayrim: { oran: number } | { fark: number };
  /**
   * Havuz veri değil, kurala göre üretilmiş (İşlemler): aynı değer birden çok maddede
   * olabilir (56 = 7 × 8 = 93 − 37), günün listesi dönüşüne girmiyor; kendi günlük kartı var.
   */
  uretilmis?: true;
  metin: Record<Dil, {
    ad: string;
    /** Oyunun sorusu: "En kalabalıktan en aza sırala". */
    soru: string;
    /** Listenin tepesi ve dibi: "En kalabalık" / "En az". */
    ust: string;
    alt: string;
    kaynak: string;
  }>;
  maddeler: DogruSiraMadde[];
}

const m = (tr: string, en: string, deger: number): DogruSiraMadde => ({ tr, en, deger });

export const DOGRU_SIRA_LISTELERI: DogruSiraTanimi[] = [
  {
    slug: 'ulke-nufusu', simge: '🌍', renk: '#0f766e', yon: 'azalan', bicim: 'kisi', ayrim: { oran: 0.05 },
    metin: {
      tr: { ad: 'Ülkelerin nüfusu', soru: 'En kalabalıktan en aza sırala.', ust: 'En kalabalık', alt: 'En az', kaynak: 'BM Dünya Nüfus Beklentileri 2024 · 2024 tahmini' },
      en: { ad: 'Country populations', soru: 'Order from most to least populous.', ust: 'Most populous', alt: 'Least', kaynak: 'UN World Population Prospects 2024 · 2024 estimate' },
    },
    maddeler: [
      m('Hindistan', 'India', 1_450_900_000),
      m('Çin', 'China', 1_419_300_000),
      m('ABD', 'United States', 345_400_000),
      m('Endonezya', 'Indonesia', 283_500_000),
      m('Pakistan', 'Pakistan', 251_300_000),
      m('Nijerya', 'Nigeria', 232_700_000),
      m('Brezilya', 'Brazil', 212_000_000),
      m('Bangladeş', 'Bangladesh', 173_600_000),
      m('Rusya', 'Russia', 144_800_000),
      m('Etiyopya', 'Ethiopia', 132_100_000),
      m('Meksika', 'Mexico', 130_900_000),
      m('Japonya', 'Japan', 123_800_000),
      m('Mısır', 'Egypt', 116_500_000),
      m('Filipinler', 'Philippines', 115_800_000),
      m('Vietnam', 'Vietnam', 101_000_000),
      m('İran', 'Iran', 91_600_000),
      m('Türkiye', 'Türkiye', 87_500_000),
      m('Almanya', 'Germany', 84_600_000),
      m('Tayland', 'Thailand', 71_700_000),
      m('Birleşik Krallık', 'United Kingdom', 69_100_000),
      m('Güney Afrika', 'South Africa', 64_000_000),
      m('İtalya', 'Italy', 59_300_000),
      m('Güney Kore', 'South Korea', 51_700_000),
      m('İspanya', 'Spain', 47_900_000),
      m('Arjantin', 'Argentina', 45_700_000),
      m('Kanada', 'Canada', 39_700_000),
      m('Avustralya', 'Australia', 26_700_000),
      m('Kazakistan', 'Kazakhstan', 20_600_000),
      m('Hollanda', 'Netherlands', 18_200_000),
      m('Yunanistan', 'Greece', 10_000_000),
      m('Gürcistan', 'Georgia', 3_800_000),
      m('İzlanda', 'Iceland', 390_000),
    ],
  },
  {
    slug: 'ulke-yuzolcumu', simge: '🗺️', renk: '#7c3aed', yon: 'azalan', bicim: 'km2', ayrim: { oran: 0.05 },
    metin: {
      tr: { ad: 'Ülkelerin yüzölçümü', soru: 'En büyükten en küçüğe sırala.', ust: 'En büyük', alt: 'En küçük', kaynak: 'CIA World Factbook · toplam alan' },
      en: { ad: 'Country areas', soru: 'Order from largest to smallest.', ust: 'Largest', alt: 'Smallest', kaynak: 'CIA World Factbook · total area' },
    },
    maddeler: [
      m('Rusya', 'Russia', 17_098_242),
      m('Kanada', 'Canada', 9_984_670),
      m('ABD', 'United States', 9_833_517),
      m('Çin', 'China', 9_596_961),
      m('Brezilya', 'Brazil', 8_515_770),
      m('Avustralya', 'Australia', 7_741_220),
      m('Hindistan', 'India', 3_287_263),
      m('Arjantin', 'Argentina', 2_780_400),
      m('Kazakistan', 'Kazakhstan', 2_724_900),
      m('Cezayir', 'Algeria', 2_381_741),
      m('Suudi Arabistan', 'Saudi Arabia', 2_149_690),
      m('Meksika', 'Mexico', 1_964_375),
      m('Endonezya', 'Indonesia', 1_904_569),
      m('İran', 'Iran', 1_648_195),
      m('Moğolistan', 'Mongolia', 1_564_116),
      m('Mısır', 'Egypt', 1_001_450),
      m('Türkiye', 'Türkiye', 783_562),
      m('Ukrayna', 'Ukraine', 603_550),
      m('İspanya', 'Spain', 505_370),
      m('İsveç', 'Sweden', 450_295),
      m('Japonya', 'Japan', 377_915),
      m('Almanya', 'Germany', 357_022),
      m('İtalya', 'Italy', 301_340),
      m('Birleşik Krallık', 'United Kingdom', 243_610),
      m('Yunanistan', 'Greece', 131_957),
      m('Portekiz', 'Portugal', 92_090),
      m('Azerbaycan', 'Azerbaijan', 86_600),
      m('Hollanda', 'Netherlands', 41_543),
      m('Belçika', 'Belgium', 30_528),
      m('Lüksemburg', 'Luxembourg', 2_586),
      m('Malta', 'Malta', 316),
    ],
  },
  {
    slug: 'il-nufusu', simge: '🏙️', renk: '#c2410c', yon: 'azalan', bicim: 'kisi', ayrim: { oran: 0.05 },
    metin: {
      tr: { ad: 'İllerin nüfusu', soru: 'En kalabalıktan en aza sırala.', ust: 'En kalabalık', alt: 'En az', kaynak: 'TÜİK Adrese Dayalı Nüfus Kayıt Sistemi · 31 Aralık 2025' },
      en: { ad: 'Turkish provinces by population', soru: 'Order from most to least populous.', ust: 'Most populous', alt: 'Least', kaynak: 'TurkStat Address Based Population Registration System · 31 December 2025' },
    },
    maddeler: [
      m('İstanbul', 'Istanbul', 15_754_053),
      m('Ankara', 'Ankara', 5_910_320),
      m('İzmir', 'Izmir', 4_504_185),
      m('Bursa', 'Bursa', 3_263_011),
      m('Antalya', 'Antalya', 2_777_677),
      m('Konya', 'Konya', 2_343_409),
      m('Adana', 'Adana', 2_283_609),
      m('Şanlıurfa', 'Şanlıurfa', 2_265_800),
      m('Gaziantep', 'Gaziantep', 2_222_415),
      m('Kocaeli', 'Kocaeli', 2_161_171),
      m('Mersin', 'Mersin', 1_956_428),
      m('Diyarbakır', 'Diyarbakır', 1_852_356),
      m('Hatay', 'Hatay', 1_577_531),
      m('Kayseri', 'Kayseri', 1_458_991),
      m('Samsun', 'Samsun', 1_392_403),
      m('Balıkesir', 'Balıkesir', 1_284_517),
      m('Kahramanmaraş', 'Kahramanmaraş', 1_146_278),
      m('Van', 'Van', 1_112_013),
      m('Denizli', 'Denizli', 1_060_975),
      m('Eskişehir', 'Eskişehir', 927_956),
      m('Trabzon', 'Trabzon', 823_323),
      m('Malatya', 'Malatya', 755_854),
      m('Erzurum', 'Erzurum', 736_877),
      m('Sivas', 'Sivas', 631_401),
      m('Edirne', 'Edirne', 422_438),
      m('Rize', 'Rize', 346_947),
      m('Kilis', 'Kilis', 157_363),
      m('Gümüşhane', 'Gümüşhane', 138_807),
      m('Ardahan', 'Ardahan', 90_392),
      m('Tunceli', 'Tunceli', 85_083),
      m('Bayburt', 'Bayburt', 82_836),
    ],
  },
  {
    slug: 'daglar', simge: '🏔️', renk: '#1d4ed8', yon: 'azalan', bicim: 'metre', ayrim: { oran: 0.05 },
    metin: {
      tr: { ad: 'Dağların yüksekliği', soru: 'En yüksekten en alçağa sırala.', ust: 'En yüksek', alt: 'En alçak', kaynak: 'Ulusal haritacılık ölçümleri · Everest 2020 Çin–Nepal ölçümü' },
      en: { ad: 'Mountain heights', soru: 'Order from highest to lowest.', ust: 'Highest', alt: 'Lowest', kaynak: 'National survey measurements · Everest 2020 China–Nepal survey' },
    },
    maddeler: [
      m('Everest', 'Everest', 8849),
      m('K2', 'K2', 8611),
      m('Aconcagua', 'Aconcagua', 6961),
      m('Denali', 'Denali', 6190),
      m('Kilimanjaro', 'Kilimanjaro', 5895),
      m('Elbruz', 'Elbrus', 5642),
      m('Ağrı Dağı', 'Mount Ararat', 5137),
      m('Mont Blanc', 'Mont Blanc', 4806),
      m('Matterhorn', 'Matterhorn', 4478),
      m('Cilo Dağı (Uludoruk)', 'Cilo (Uludoruk)', 4135),
      m('Erciyes', 'Erciyes', 3917),
      m('Fuji', 'Fuji', 3776),
      m('Hasan Dağı', 'Mount Hasan', 3268),
      m('Olimpos (Yunanistan)', 'Olympus (Greece)', 2918),
      m('Uludağ', 'Uludağ', 2543),
      m('Kosciuszko', 'Kosciuszko', 2228),
      m('Ben Nevis', 'Ben Nevis', 1345),
      m('Masa Dağı (Güney Afrika)', 'Table Mountain', 1085),
    ],
  },
  {
    slug: 'padisahlar', simge: '👑', renk: '#9f1239', yon: 'artan', bicim: 'yil', ayrim: { fark: 1 },
    metin: {
      tr: { ad: 'Osmanlı padişahları', soru: 'Tahta çıkış sırasına göre, ilkten sona sırala.', ust: 'İlk', alt: 'Son', kaynak: 'Tahta çıkış yılları' },
      en: { ad: 'Ottoman sultans', soru: 'Order by accession, first to last.', ust: 'First', alt: 'Last', kaynak: 'Years of accession' },
    },
    maddeler: [
      m('Osman Gazi', 'Osman I', 1299),
      m('Orhan Gazi', 'Orhan', 1324),
      m('I. Murad', 'Murad I', 1362),
      m('Yıldırım Bayezid', 'Bayezid I', 1389),
      m('II. Murad', 'Murad II', 1421),
      m('Fatih Sultan Mehmed', 'Mehmed II (the Conqueror)', 1451),
      m('II. Bayezid', 'Bayezid II', 1481),
      m('Yavuz Sultan Selim', 'Selim I', 1512),
      m('Kanuni Sultan Süleyman', 'Suleiman the Magnificent', 1520),
      m('II. Selim', 'Selim II', 1566),
      m('IV. Murad', 'Murad IV', 1623),
      m('IV. Mehmed', 'Mehmed IV', 1648),
      m('III. Ahmed', 'Ahmed III', 1703),
      m('III. Selim', 'Selim III', 1789),
      m('II. Mahmud', 'Mahmud II', 1808),
      m('Abdülmecid', 'Abdulmejid I', 1839),
      m('Abdülaziz', 'Abdulaziz', 1861),
      m('II. Abdülhamid', 'Abdul Hamid II', 1876),
      m('Mehmed Reşad', 'Mehmed V', 1909),
      m('Vahdeddin', 'Mehmed VI', 1918),
    ],
  },
  {
    slug: 'tarih', simge: '📜', renk: '#a16207', yon: 'artan', bicim: 'yil', ayrim: { fark: 1 },
    metin: {
      tr: { ad: 'Tarihî olaylar', soru: 'Eskiden yeniye sırala.', ust: 'En eski', alt: 'En yeni', kaynak: 'Olayların yılları' },
      en: { ad: 'Historical events', soru: 'Order from oldest to newest.', ust: 'Oldest', alt: 'Newest', kaynak: 'Years of the events' },
    },
    maddeler: [
      m('Malazgirt Meydan Muharebesi', 'Battle of Manzikert', 1071),
      m('Magna Carta', 'Magna Carta', 1215),
      m('İstanbul’un fethi', 'Conquest of Constantinople', 1453),
      m('Kolomb’un Amerika’ya varışı', 'Columbus reaches the Americas', 1492),
      m('Mohaç Meydan Muharebesi', 'Battle of Mohács', 1526),
      m('II. Viyana Kuşatması', 'Second Siege of Vienna', 1683),
      m('ABD Bağımsızlık Bildirgesi', 'US Declaration of Independence', 1776),
      m('Fransız İhtilali', 'French Revolution', 1789),
      m('Tanzimat Fermanı', 'Tanzimat Edict', 1839),
      m('I. Meşrutiyet', 'First Constitutional Era (Ottoman)', 1876),
      m('I. Dünya Savaşı’nın başlaması', 'Start of World War I', 1914),
      m('Çanakkale Zaferi', 'Ottoman victory at Gallipoli', 1915),
      m('TBMM’nin açılışı', 'Opening of the Turkish Grand National Assembly', 1920),
      m('Cumhuriyetin ilanı', 'Proclamation of the Turkish Republic', 1923),
      m('Harf Devrimi', 'Turkish alphabet reform', 1928),
      m('Kadınlara milletvekili seçme ve seçilme hakkı', 'Turkish women gain the right to vote in national elections', 1934),
      m('II. Dünya Savaşı’nın başlaması', 'Start of World War II', 1939),
      m('Türkiye’nin NATO’ya katılması', 'Türkiye joins NATO', 1952),
      m('Ay’a ilk insan', 'First humans on the Moon', 1969),
      m('Berlin Duvarı’nın yıkılması', 'Fall of the Berlin Wall', 1989),
      m('Sovyetler Birliği’nin dağılması', 'Dissolution of the Soviet Union', 1991),
      m('İlk iPhone', 'First iPhone', 2007),
    ],
  },
  {
    slug: 'elementler', simge: '⚗️', renk: '#047857', yon: 'artan', bicim: 'sayi', ayrim: { fark: 1 },
    metin: {
      tr: { ad: 'Elementler', soru: 'Atom numarasına göre küçükten büyüğe sırala.', ust: 'En küçük', alt: 'En büyük', kaynak: 'Periyodik tablo · atom numarası' },
      en: { ad: 'Chemical elements', soru: 'Order by atomic number, smallest first.', ust: 'Smallest', alt: 'Largest', kaynak: 'Periodic table · atomic number' },
    },
    maddeler: [
      m('Hidrojen', 'Hydrogen', 1),
      m('Helyum', 'Helium', 2),
      m('Lityum', 'Lithium', 3),
      m('Karbon', 'Carbon', 6),
      m('Azot', 'Nitrogen', 7),
      m('Oksijen', 'Oxygen', 8),
      m('Neon', 'Neon', 10),
      m('Sodyum', 'Sodium', 11),
      m('Magnezyum', 'Magnesium', 12),
      m('Alüminyum', 'Aluminium', 13),
      m('Silisyum', 'Silicon', 14),
      m('Kükürt', 'Sulfur', 16),
      m('Klor', 'Chlorine', 17),
      m('Kalsiyum', 'Calcium', 20),
      m('Demir', 'Iron', 26),
      m('Bakır', 'Copper', 29),
      m('Çinko', 'Zinc', 30),
      m('Gümüş', 'Silver', 47),
      m('Kalay', 'Tin', 50),
      m('İyot', 'Iodine', 53),
      m('Platin', 'Platinum', 78),
      m('Altın', 'Gold', 79),
      m('Cıva', 'Mercury', 80),
      m('Kurşun', 'Lead', 82),
      m('Uranyum', 'Uranium', 92),
    ],
  },
  {
    slug: 'gunes-sistemi', simge: '🪐', renk: '#4338ca', yon: 'artan', bicim: 'milyonKm', ayrim: { oran: 0.05 },
    metin: {
      tr: { ad: 'Güneş Sistemi', soru: 'Güneş’e yakından uzağa sırala.', ust: 'En yakın', alt: 'En uzak', kaynak: 'NASA gezegen bilgi sayfaları · Güneş’e ortalama uzaklık' },
      en: { ad: 'The Solar System', soru: 'Order from nearest to farthest from the Sun.', ust: 'Nearest', alt: 'Farthest', kaynak: 'NASA planetary fact sheets · mean distance from the Sun' },
    },
    maddeler: [
      m('Merkür', 'Mercury', 57.9),
      m('Venüs', 'Venus', 108.2),
      m('Dünya', 'Earth', 149.6),
      m('Mars', 'Mars', 227.9),
      m('Ceres (cüce gezegen)', 'Ceres (dwarf planet)', 413.7),
      m('Jüpiter', 'Jupiter', 778.5),
      m('Satürn', 'Saturn', 1432.0),
      m('Uranüs', 'Uranus', 2867.0),
      m('Neptün', 'Neptune', 4515.0),
      m('Plüton (cüce gezegen)', 'Pluto (dwarf planet)', 5906.4),
      m('Eris (cüce gezegen)', 'Eris (dwarf planet)', 10_150),
    ],
  },
  {
    // Üretilen liste (`lib/islemler.ts`): dört işlem, sonuçlar 10–100. Adlar iki dilde aynı.
    slug: 'islemler', simge: '🧮', renk: '#9333ea', yon: 'artan', bicim: 'sayi', ayrim: { fark: 1 }, uretilmis: true,
    metin: {
      tr: { ad: 'İşlemler', soru: 'Sonuca göre en küçükten en büyüğe sırala.', ust: 'En küçük', alt: 'En büyük', kaynak: 'Dört işlem · sonuçlar 10–100 arası, bölmeler tam' },
      en: { ad: 'Arithmetic', soru: 'Order by result, from smallest to largest.', ust: 'Smallest', alt: 'Largest', kaynak: 'Four operations · results from 10 to 100, exact divisions' },
    },
    maddeler: ISLEM_HAVUZU.map(x => ({ tr: x.ad, en: x.ad, deger: x.deger })),
  },
];
