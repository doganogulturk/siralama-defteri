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

export const KOR_LISTELERI: KorListe[] = [
  {
    slug: 'corbalar', ad: 'Çorbalar', simge: '🍲', renk: '#c2410c',
    kayitlar: ['Mercimek', 'Ezogelin', 'Yayla', 'Tarhana', 'İşkembe', 'Domates', 'Tavuk suyu', 'Kelle paça', 'Düğün çorbası', 'Mantar'],
  },
  {
    slug: 'kebaplar', ad: 'Kebaplar', simge: '🍢', renk: '#b91c1c',
    kayitlar: ['Adana', 'Urfa', 'İskender', 'Beyti', 'Kuzu şiş', 'Patlıcan kebabı', 'Tandır', 'Testi kebabı', 'Ciğer şiş', 'Alinazik'],
  },
  {
    slug: 'tatlilar', ad: 'Tatlılar', simge: '🍮', renk: '#b45309',
    kayitlar: ['Baklava', 'Künefe', 'Sütlaç', 'Kazandibi', 'Tavuk göğsü', 'Revani', 'Aşure', 'Kemalpaşa', 'Lokma', 'Kadayıf'],
  },
  {
    slug: 'kahvalti', ad: 'Kahvaltılıklar', simge: '🍳', renk: '#ca8a04',
    kayitlar: ['Menemen', 'Sucuklu yumurta', 'Simit', 'Bal kaymak', 'Beyaz peynir', 'Zeytin', 'Gözleme', 'Pişi', 'Çılbır', 'Poğaça'],
  },
  {
    slug: 'sokak-lezzetleri', ad: 'Sokak lezzetleri', simge: '🥙', renk: '#7c2d12',
    kayitlar: ['Midye dolma', 'Kokoreç', 'Tantuni', 'Çiğ köfte', 'Islak hamburger', 'Balık ekmek', 'Kumpir', 'Kestane', 'Haşlanmış mısır', 'Lahmacun'],
  },
  {
    slug: 'meyveler', ad: 'Meyveler', simge: '🍉', renk: '#be123c',
    kayitlar: ['Karpuz', 'Çilek', 'Kiraz', 'İncir', 'Şeftali', 'Muz', 'Elma', 'Üzüm', 'Mandalina', 'Nar'],
  },
  {
    slug: 'icecekler', ad: 'İçecekler', simge: '🫖', renk: '#0f766e',
    kayitlar: ['Çay', 'Türk kahvesi', 'Ayran', 'Şalgam', 'Boza', 'Salep', 'Limonata', 'Maden suyu', 'Kefir', 'Vişne suyu'],
  },
  {
    slug: 'sehirler', ad: 'Şehirler', simge: '🏙️', renk: '#1d4ed8',
    kayitlar: ['İstanbul', 'İzmir', 'Ankara', 'Antalya', 'Trabzon', 'Gaziantep', 'Mardin', 'Eskişehir', 'Çanakkale', 'Bursa'],
  },
  {
    slug: 'sporlar', ad: 'Sporlar', simge: '⚽', renk: '#15803d',
    kayitlar: ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Yüzme', 'Koşu', 'Bisiklet', 'Masa tenisi', 'Satranç', 'Bowling'],
  },
  {
    slug: 'gunun-anlari', ad: 'Günün anları', simge: '🌅', renk: '#6d28d9',
    kayitlar: ['Sabah kahvesi', 'Öğle uykusu', 'Gün batımı', 'Gece yürüyüşü', 'Pazar kahvaltısı', 'Cuma akşamı', 'İlk kar', 'Yaz yağmuru', 'Bayram sabahı', 'Tatilin ilk günü'],
  },
];

export const korListesi = (slug: string) => KOR_LISTELERI.find(l => l.slug === slug);

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
