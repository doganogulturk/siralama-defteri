import { messages } from './i18n';

/**
 * Yasal sayfalardaki veri sorumlusu, başvuru adresi ve sayfaların sırası. Sayfalar
 * herkese açık: buradaki e-posta adresi yayında görünür.
 */
export const VERI_SORUMLUSU = 'Doğan Oğultürk';
export const ILETISIM_EPOSTA = 'doganogulturk@gmail.com';

/** Gizlilik, KVKK ve koşulların son güncellendiği gün — içerik değişince bu da değişmeli. */
export const YASAL_TARIH = { tr: '27 Ekim 2026', en: '27 October 2026' };

/** Yasal sayfaların sırası: sayfaların altındaki gezinme ve "Hesabım"daki bağlantılar; adlar arayüz dilinde. */
export function yasalSayfalar() {
  const m = messages().yasalBaglantilar;
  return [
    { href: '/gizlilik', ad: m.gizlilik },
    { href: '/kvkk', ad: m.kvkk },
    { href: '/kullanim-kosullari', ad: m.kosullar },
    { href: '/hesap-silme', ad: m.silme },
  ];
}
