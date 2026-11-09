import { simdikiDil, type Dil } from './i18n';

/**
 * Kör Sıralama: hazır listeler ve sonuçların adrese yazılması. Oyun girişsiz
 * oynanıyor ve hiçbir şey kaydedilmiyor — sonuç adreste taşınıyor (`?s=`), sonuç
 * görseli (`/oyna/kor/[liste]/gorsel`) ve arkadaşla karşılaştırma oradan okuyor.
 *
 * Listeler marka ya da işletme değil tür adlarından: herkes aynı şeyleri tanısın.
 * Her listede otuz kayıtlık bir havuz; her oyunda tohumdan seçilen on kayıt geliyor
 * (`lib/katalog.ts`), aynı listeyi tekrar oynayan aynı onu görmüyor. İlk on, havuz
 * büyümeden önceki listenin kendisi: tohumsuz eski sonuç bağlantıları onu açıyor.
 * Havuz bir kez yayımlanınca değişmemeli — ne sıra ne uzunluk: sonuçlar tohumla seçilen
 * kayıtların yerini taşıyor; yeni kayıt yeni liste demek.
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
    tr: { ad: 'Çorbalar', kayitlar: ['Mercimek', 'Ezogelin', 'Yayla', 'Tarhana', 'İşkembe', 'Domates', 'Tavuk suyu', 'Kelle paça', 'Düğün çorbası', 'Mantar',
      'Sebze', 'Brokoli', 'Balık çorbası', 'Toyga', 'Lebeniye', 'Analı kızlı', 'Beyran', 'Şehriye', 'Un çorbası', 'Patates', 'Pırasa', 'Kabak', 'Arabaşı', 'Bamya', 'Ayran aşı', 'Mahluta', 'Kesme çorba', 'Mısır', 'Yüksük', 'Ekşili köfte'] },
    en: { ad: 'Soups', kayitlar: ['Lentil', 'Ezogelin', 'Yayla', 'Tarhana', 'İşkembe', 'Tomato', 'Chicken broth', 'Kelle paça', 'Wedding soup', 'Mushroom',
      'Vegetable', 'Broccoli', 'Fish soup', 'Toyga', 'Lebeniye', 'Analı kızlı', 'Beyran', 'Vermicelli', 'Flour soup', 'Potato', 'Leek', 'Zucchini', 'Arabaşı', 'Okra', 'Ayran aşı', 'Mahluta', 'Kesme', 'Corn', 'Yüksük', 'Ekşili köfte'] },
  },
  {
    slug: 'kebaplar', simge: '🍢', renk: '#b91c1c',
    tr: { ad: 'Kebaplar', kayitlar: ['Adana', 'Urfa', 'İskender', 'Beyti', 'Kuzu şiş', 'Patlıcan kebabı', 'Tandır', 'Testi kebabı', 'Ciğer şiş', 'Alinazik',
      'Cağ kebabı', 'Döner', 'Tavuk şiş', 'Orman kebabı', 'Hünkâr beğendi', 'Tokat kebabı', 'Kâğıt kebabı', 'Çöp şiş', 'Simit kebabı', 'Yoğurtlu kebap', 'Fıstıklı kebap', 'Şiş köfte', 'Kaburga', 'Tavuk kanat', 'Çökertme kebabı', 'Tas kebabı', 'Talaş kebabı', 'Halep işi', 'Soğan kebabı', 'Kuyu kebabı'] },
    en: { ad: 'Kebabs', kayitlar: ['Adana', 'Urfa', 'İskender', 'Beyti', 'Lamb shish', 'Eggplant kebab', 'Tandır', 'Pottery kebab', 'Liver shish', 'Alinazik',
      'Cağ kebab', 'Döner', 'Chicken shish', 'Orman kebab', 'Hünkâr beğendi', 'Tokat kebab', 'Paper kebab', 'Çöp şiş', 'Simit kebab', 'Yogurt kebab', 'Pistachio kebab', 'Shish köfte', 'Ribs', 'Chicken wings', 'Çökertme kebab', 'Tas kebab', 'Talaş kebab', 'Halep işi', 'Onion kebab', 'Pit kebab'] },
  },
  {
    slug: 'tatlilar', simge: '🍮', renk: '#b45309',
    tr: { ad: 'Tatlılar', kayitlar: ['Baklava', 'Künefe', 'Sütlaç', 'Kazandibi', 'Tavuk göğsü', 'Revani', 'Aşure', 'Kemalpaşa', 'Lokma', 'Kadayıf',
      'Profiterol', 'Trileçe', 'Sütlü nuriye', 'Şekerpare', 'Güllaç', 'Muhallebi', 'Keşkül', 'Kabak tatlısı', 'Ayva tatlısı', 'İrmik helvası', 'Tahin helvası', 'Katmer', 'Lokum', 'Höşmerim', 'Supangle', 'Tulumba', 'Dondurma', 'Kalburabastı', 'Pişmaniye', 'Cezerye'] },
    en: { ad: 'Desserts', kayitlar: ['Baklava', 'Künefe', 'Rice pudding', 'Kazandibi', 'Tavuk göğsü', 'Revani', 'Aşure', 'Kemalpaşa', 'Lokma', 'Kadayıf',
      'Profiterole', 'Trileçe', 'Sütlü nuriye', 'Şekerpare', 'Güllaç', 'Milk pudding', 'Keşkül', 'Candied pumpkin', 'Quince dessert', 'Semolina halva', 'Tahini halva', 'Katmer', 'Turkish delight', 'Höşmerim', 'Supangle', 'Tulumba', 'Ice cream', 'Kalburabastı', 'Pişmaniye', 'Cezerye'] },
  },
  {
    slug: 'kahvalti', simge: '🍳', renk: '#ca8a04',
    tr: { ad: 'Kahvaltılıklar', kayitlar: ['Menemen', 'Sucuklu yumurta', 'Simit', 'Bal kaymak', 'Beyaz peynir', 'Zeytin', 'Gözleme', 'Pişi', 'Çılbır', 'Poğaça',
      'Kaşar', 'Tulum peyniri', 'Domates salatalık', 'Reçel', 'Tahin pekmez', 'Pastırmalı yumurta', 'Haşlanmış yumurta', 'Sigara böreği', 'Su böreği', 'Açma', 'Kuymak', 'Patates kızartması', 'Acuka', 'Lor', 'Tereyağı', 'Kavurmalı yumurta', 'Omlet', 'Bazlama', 'Fındık ezmesi', 'Kızarmış ekmek'] },
    en: { ad: 'Breakfast', kayitlar: ['Menemen', 'Sucuk & eggs', 'Simit', 'Honey & kaymak', 'White cheese', 'Olives', 'Gözleme', 'Pişi', 'Çılbır', 'Poğaça',
      'Kaşar cheese', 'Tulum cheese', 'Tomato & cucumber', 'Jam', 'Tahini & molasses', 'Eggs with pastırma', 'Boiled egg', 'Sigara böreği', 'Su böreği', 'Açma', 'Kuymak', 'French fries', 'Acuka', 'Lor cheese', 'Butter', 'Eggs with kavurma', 'Omelette', 'Bazlama', 'Hazelnut spread', 'Toast'] },
  },
  {
    slug: 'sokak-lezzetleri', simge: '🥙', renk: '#7c2d12',
    tr: { ad: 'Sokak lezzetleri', kayitlar: ['Midye dolma', 'Kokoreç', 'Tantuni', 'Çiğ köfte', 'Islak hamburger', 'Balık ekmek', 'Kumpir', 'Kestane', 'Haşlanmış mısır', 'Lahmacun',
      'Döner dürüm', 'Simit', 'Kumru', 'Boyoz', 'Nohutlu pilav', 'Tavuk pilav', 'Sucuk ekmek', 'Köfte ekmek', 'Midye tava', 'Çiğ börek', 'Kelle söğüş', 'Waffle', 'Pamuk şeker', 'Maraş dondurması', 'Közde mısır', 'Pide', 'Gözleme', 'Ayvalık tostu', 'Hamsi ekmek', 'Tavuk dürüm'] },
    en: { ad: 'Street food', kayitlar: ['Stuffed mussels', 'Kokoreç', 'Tantuni', 'Çiğ köfte', 'Wet burger', 'Fish sandwich', 'Kumpir', 'Roasted chestnuts', 'Boiled corn', 'Lahmacun',
      'Döner wrap', 'Simit', 'Kumru', 'Boyoz', 'Rice with chickpeas', 'Chicken & rice', 'Sucuk sandwich', 'Köfte sandwich', 'Fried mussels', 'Çiğ börek', 'Kelle söğüş', 'Waffle', 'Cotton candy', 'Maraş ice cream', 'Grilled corn', 'Pide', 'Gözleme', 'Ayvalık toast', 'Hamsi sandwich', 'Chicken wrap'] },
  },
  {
    slug: 'meyveler', simge: '🍉', renk: '#be123c',
    tr: { ad: 'Meyveler', kayitlar: ['Karpuz', 'Çilek', 'Kiraz', 'İncir', 'Şeftali', 'Muz', 'Elma', 'Üzüm', 'Mandalina', 'Nar',
      'Kavun', 'Armut', 'Ayva', 'Erik', 'Kayısı', 'Dut', 'Vişne', 'Portakal', 'Greyfurt', 'Ananas', 'Kivi', 'Mango', 'Böğürtlen', 'Ahududu', 'Yaban mersini', 'Trabzon hurması', 'Nektarin', 'Muşmula', 'Hindistan cevizi', 'Hurma'] },
    en: { ad: 'Fruits', kayitlar: ['Watermelon', 'Strawberry', 'Cherry', 'Fig', 'Peach', 'Banana', 'Apple', 'Grape', 'Tangerine', 'Pomegranate',
      'Melon', 'Pear', 'Quince', 'Plum', 'Apricot', 'Mulberry', 'Sour cherry', 'Orange', 'Grapefruit', 'Pineapple', 'Kiwi', 'Mango', 'Blackberry', 'Raspberry', 'Blueberry', 'Persimmon', 'Nectarine', 'Medlar', 'Coconut', 'Date'] },
  },
  {
    slug: 'icecekler', simge: '🫖', renk: '#0f766e',
    tr: { ad: 'İçecekler', kayitlar: ['Çay', 'Türk kahvesi', 'Ayran', 'Şalgam', 'Boza', 'Salep', 'Limonata', 'Maden suyu', 'Kefir', 'Vişne suyu',
      'Sıcak çikolata', 'Gazoz', 'Kola', 'Portakal suyu', 'Şerbet', 'Ihlamur', 'Adaçayı', 'Filtre kahve', 'Espresso', 'Latte', 'Soğuk çay', 'Milkshake', 'Süt', 'Nar suyu', 'Elma suyu', 'Meyan şerbeti', 'Demirhindi', 'Menengiç kahvesi', 'Su', 'Yeşil çay'] },
    en: { ad: 'Drinks', kayitlar: ['Tea', 'Turkish coffee', 'Ayran', 'Şalgam', 'Boza', 'Salep', 'Lemonade', 'Mineral water', 'Kefir', 'Sour cherry juice',
      'Hot chocolate', 'Gazoz', 'Cola', 'Orange juice', 'Sherbet', 'Linden tea', 'Sage tea', 'Filter coffee', 'Espresso', 'Latte', 'Iced tea', 'Milkshake', 'Milk', 'Pomegranate juice', 'Apple juice', 'Licorice sherbet', 'Tamarind drink', 'Menengiç coffee', 'Water', 'Green tea'] },
  },
  {
    slug: 'sehirler', simge: '🏙️', renk: '#1d4ed8',
    tr: { ad: 'Şehirler', kayitlar: ['İstanbul', 'İzmir', 'Ankara', 'Antalya', 'Trabzon', 'Gaziantep', 'Mardin', 'Eskişehir', 'Çanakkale', 'Bursa',
      'Konya', 'Adana', 'Hatay', 'Muğla', 'Şanlıurfa', 'Diyarbakır', 'Erzurum', 'Kars', 'Rize', 'Amasya', 'Edirne', 'Kayseri', 'Samsun', 'Sinop', 'Van', 'Bolu', 'Denizli', 'Nevşehir', 'Aydın', 'Kastamonu'] },
    en: { ad: 'Cities', kayitlar: ['İstanbul', 'İzmir', 'Ankara', 'Antalya', 'Trabzon', 'Gaziantep', 'Mardin', 'Eskişehir', 'Çanakkale', 'Bursa',
      'Konya', 'Adana', 'Hatay', 'Muğla', 'Şanlıurfa', 'Diyarbakır', 'Erzurum', 'Kars', 'Rize', 'Amasya', 'Edirne', 'Kayseri', 'Samsun', 'Sinop', 'Van', 'Bolu', 'Denizli', 'Nevşehir', 'Aydın', 'Kastamonu'] },
  },
  {
    slug: 'sporlar', simge: '⚽', renk: '#15803d',
    tr: { ad: 'Sporlar', kayitlar: ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Yüzme', 'Koşu', 'Bisiklet', 'Masa tenisi', 'Satranç', 'Bowling',
      'Hentbol', 'Badminton', 'Golf', 'Boks', 'Güreş', 'Kayak', 'Sörf', 'Okçuluk', 'Yoga', 'Pilates', 'Fitness', 'Tırmanış', 'Formula 1', 'Jimnastik', 'Eskrim', 'Binicilik', 'Kürek', 'Bilardo', 'Dart', 'Su topu'] },
    en: { ad: 'Sports', kayitlar: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Swimming', 'Running', 'Cycling', 'Table tennis', 'Chess', 'Bowling',
      'Handball', 'Badminton', 'Golf', 'Boxing', 'Wrestling', 'Skiing', 'Surfing', 'Archery', 'Yoga', 'Pilates', 'Gym workout', 'Climbing', 'Formula 1', 'Gymnastics', 'Fencing', 'Horse riding', 'Rowing', 'Billiards', 'Darts', 'Water polo'] },
  },
  {
    slug: 'gunun-anlari', simge: '🌅', renk: '#6d28d9',
    tr: { ad: 'Günün anları', kayitlar: ['Sabah kahvesi', 'Öğle uykusu', 'Gün batımı', 'Gece yürüyüşü', 'Pazar kahvaltısı', 'Cuma akşamı', 'İlk kar', 'Yaz yağmuru', 'Bayram sabahı', 'Tatilin ilk günü',
      'Alarmdan önce uyanmak', 'Sıcak duş', 'Maaş günü', 'Kargo gelince', 'Sahilde akşam', 'Yeni çarşaf', 'Denize ilk giriş', 'Uzun yol', 'Mangal', 'Doğum günü sabahı', 'Yılbaşı gecesi', 'Baharın ilk sıcak günü', 'Okulun son günü', 'Film gecesi', 'Konser', 'Eve dönüş', 'İftar sofrası', 'Gece yarısı atıştırması', 'Sonbahar yürüyüşü', 'Şömine başı'] },
    en: { ad: 'Moments of the day', kayitlar: ['Morning coffee', 'Afternoon nap', 'Sunset', 'Night walk', 'Sunday breakfast', 'Friday evening', 'First snow', 'Summer rain', 'Holiday morning', 'First day of vacation',
      'Waking before the alarm', 'Hot shower', 'Payday', 'When the package arrives', 'Evening by the sea', 'Fresh sheets', 'First swim of the year', 'Long road trip', 'Barbecue', 'Birthday morning', 'New Year’s Eve', 'First warm day of spring', 'Last day of school', 'Movie night', 'Concert', 'Coming home', 'Iftar table', 'Midnight snack', 'Autumn walk', 'By the fireplace'] },
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
