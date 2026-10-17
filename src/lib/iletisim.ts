/**
 * Yasal sayfalardaki veri sorumlusu, başvuru adresi ve sayfaların sırası. Sayfalar
 * herkese açık: buradaki e-posta adresi yayında görünür.
 */
export const VERI_SORUMLUSU = 'Doğan Oğultürk';
export const ILETISIM_EPOSTA = 'doganogulturk@gmail.com';

/** Gizlilik, KVKK ve koşulların son güncellendiği gün — içerik değişince bu da değişmeli. */
export const YASAL_TARIH = '18 Ekim 2026';

/** Yasal sayfaların sırası: sayfaların altındaki gezinme ve "Hesabım"daki bağlantılar. */
export const YASAL_SAYFALAR = [
  { href: '/gizlilik', ad: 'Gizlilik' },
  { href: '/kvkk', ad: 'KVKK' },
  { href: '/kullanim-kosullari', ad: 'Koşullar' },
  { href: '/hesap-silme', ad: 'Hesap silme' },
] as const;
