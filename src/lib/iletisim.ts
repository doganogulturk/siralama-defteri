import { messages, sozluk, type Dil } from './i18n';

/**
 * Yasal sayfalardaki veri sorumlusu, başvuru adresi ve sayfaların sırası. Sayfalar
 * herkese açık: buradaki e-posta adresi yayında görünür.
 */
export const VERI_SORUMLUSU = 'Doğan Oğultürk';
export const ILETISIM_EPOSTA = 'doganogulturk@gmail.com';

/** Gizlilik, KVKK ve koşulların son güncellendiği gün — içerik değişince bu da değişmeli. */
export const YASAL_TARIH = { tr: '2 Kasım 2026', en: '2 November 2026' };

/** Yasal sayfaların sırası: sayfaların altındaki gezinme ve "Hesabım"daki bağlantılar; adlar arayüz dilinde. */
/** `dil` verilmezse tarayıcıdaki dil (`messages()`); sunucuda da çizilen yerler dili vermeli. */
export function yasalSayfalar(dil?: Dil) {
  const m = (dil ? sozluk(dil) : messages()).yasalBaglantilar;
  return [
    { href: '/gizlilik', ad: m.gizlilik },
    { href: '/kvkk', ad: m.kvkk },
    { href: '/kullanim-kosullari', ad: m.kosullar },
    { href: '/hesap-silme', ad: m.silme },
  ];
}
