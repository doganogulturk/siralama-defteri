/*
 * Tarayıcının `alert` / `confirm` pencerelerinin yerine uygulamanın kendi penceresi.
 * Yerel pencereler temayı izlemiyor, sayfanın adını başlığa yazıyor ve mobil uygulama
 * kabuğunda (Capacitor) hiç görünmeyebiliyor. Çağıran taraf aynı kolaylıkla kullanıyor:
 *
 *   if (!(await onayla({ metin: '…', onay: 'Sil', tehlikeli: true }))) return;
 *   uyar('Kaydedilemedi: …');
 *
 * İstekler sıraya giriyor; ekranda bir seferde tek pencere (`components/Pencereler.tsx`).
 */

import { messages } from './i18n';

export interface PencereIstegi {
  tur: 'uyari' | 'onay';
  metin: string;
  /** Onay düğmesinin metni. */
  onay: string;
  /** Silme gibi geri alınamayan işlem: onay düğmesi tehlike renginde. */
  tehlikeli: boolean;
  coz: (sonuc: boolean) => void;
}

let kuyruk: PencereIstegi[] = [];
const dinleyiciler = new Set<() => void>();
const yay = () => dinleyiciler.forEach(d => d());

export const pencereAbone = (d: () => void) => {
  dinleyiciler.add(d);
  return () => { dinleyiciler.delete(d); };
};

/** Sıradaki pencere; yoksa null. */
export const siradakiPencere = (): PencereIstegi | null => kuyruk[0] ?? null;

/** Gösterilen pencereyi sonucuyla kapatıp sıradakine geçer. */
export function pencereKapat(sonuc: boolean) {
  const [ilk, ...kalan] = kuyruk;
  if (!ilk) return;
  kuyruk = kalan;
  yay();
  ilk.coz(sonuc);
}

const ekle = (istek: Omit<PencereIstegi, 'coz'>) =>
  new Promise<boolean>(coz => {
    kuyruk = [...kuyruk, { ...istek, coz }];
    yay();
  });

/** Bilgi ya da hata: tek düğmeli pencere. Kapanınca çözülüyor. */
export const uyar = (metin: string): Promise<void> =>
  ekle({ tur: 'uyari', metin, onay: messages().genel.tamam, tehlikeli: false }).then(() => undefined);

/** Evet/hayır sorusu: onaylanırsa true, vazgeçilirse (Esc, zemin, Vazgeç) false. */
export const onayla = (o: { metin: string; onay?: string; tehlikeli?: boolean }): Promise<boolean> =>
  ekle({ tur: 'onay', metin: o.metin, onay: o.onay ?? messages().genel.tamam, tehlikeli: o.tehlikeli ?? false });
