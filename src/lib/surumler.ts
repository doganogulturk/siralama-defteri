import type { Dil } from './i18n';

/** Bir sürüm: numarası, çıktığı ay ve öne çıkan değişiklikleri, iki dilde. */
export interface Surum {
  surum: string;
  tarih: Record<Dil, string>;
  maddeler: Record<Dil, string[]>;
}

/**
 * Sürüm geçmişi (Hakkında sayfası), en yenisi başta. Yeni sürümde başa bir kayıt eklenir; uygulamanın
 * mağaza sürümü (Xcode → MARKETING_VERSION) en üstteki numarayla aynı olmalı.
 * 1.0 öncesi numaralar sonradan, commit geçmişindeki dönemlerden verildi; o zamanlar yalnızca web vardı.
 */
export const SURUMLER: Surum[] = [
  {
    surum: '1.1',
    tarih: { tr: 'Kasım 2026', en: 'November 2026' },
    maddeler: {
      tr: [
        'Açılış ekranı: simgenin çubukları kendini sıralıyor.',
        'Profil sayfası; dil seçimi artık burada.',
        'Tema seçimi: Sistem, Açık ya da Koyu.',
        'Hakkında sayfası ve sürüm geçmişi.',
      ],
      en: [
        'Launch screen: the bars of the icon sort themselves.',
        'Profile page; language selection now lives here.',
        'Theme choice: System, Light or Dark.',
        'About page and version history.',
      ],
    },
  },
  {
    surum: '1.0',
    tarih: { tr: 'Kasım 2026', en: 'November 2026' },
    maddeler: {
      tr: [
        "App Store'da ilk sürüm: iPhone ve iPad.",
        'Oyna: Kör Sıralama, Tier, Kör Tier, Doğru Sıra, Sayılar ve İşlemler; her gün "Bugün" oyunları.',
        'Kademeler (tier list) ve kameralı Kör Sıralama.',
        'Apple ile giriş, "Hangisi?" ile yerleştirme, defter görünümü.',
      ],
      en: [
        'First release on the App Store: iPhone and iPad.',
        'Play: Blind Ranking, Tiers, Blind Tiers, True Order, Numbers and Arithmetic; daily "Today" games.',
        'Tiers (tier list) and Blind Ranking with the camera.',
        'Sign in with Apple, placing with "Which one?", notebook look.',
      ],
    },
  },
  {
    surum: '0.4',
    tarih: { tr: 'Ekim 2026', en: 'October 2026' },
    maddeler: {
      tr: [
        'Listeleri bağlantıyla paylaşma, "Ben de sıralayayım" ve karşılaştırma.',
        'Story görseli, hazır şablonlar, ana ekrana ekleme.',
        'İngilizce arayüz, yasal sayfalar ve hesabın tamamen silinmesi.',
      ],
      en: [
        'Sharing lists by link, "Let me rank it too" and comparison.',
        'Story image, ready-made templates, add to home screen.',
        'English interface, legal pages and full account deletion.',
      ],
    },
  },
  {
    surum: '0.3',
    tarih: { tr: 'Eylül 2026', en: 'September 2026' },
    maddeler: {
      tr: [
        'Açık ve koyu temalı yeni tasarım, podyumlu liste kartları.',
        '"Bir daha asla" bölümü, kart görünümü ve toplu işlemler.',
      ],
      en: [
        'New design with light and dark themes, podium list cards.',
        '"Never again" section, card view and bulk actions.',
      ],
    },
  },
  {
    surum: '0.2',
    tarih: { tr: 'Ağustos 2026', en: 'August 2026' },
    maddeler: {
      tr: [
        'Adı Sıralama Defteri oldu: istediğin kadar liste, her biri kendi kategorileriyle.',
        'Denenmemişler listesi ve toplu ekleme.',
      ],
      en: [
        'Renamed to Sıralama Defteri: as many lists as you like, each with its own categories.',
        'Untried list and bulk adding.',
      ],
    },
  },
  {
    surum: '0.1',
    tarih: { tr: 'Haziran 2026', en: 'June 2026' },
    maddeler: {
      tr: ['İlk sürüm: ayranları sürükleyerek sıralayan tek listelik bir defter.'],
      en: ['First version: a single-list notebook for ranking ayran by dragging.'],
    },
  },
];

/** Şu anki sürüm: geçmişin en üstündeki. */
export const GUNCEL_SURUM = SURUMLER[0].surum;

/** "1.10" > "1.9": sürümleri sayı sayı karşılaştırır. */
export function surumKarsilastir(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const fark = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (fark !== 0) return fark;
  }
  return 0;
}
