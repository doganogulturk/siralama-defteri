import { messages } from './i18n';
import { SINIR } from './sinirlar';

/**
 * Supabase hataları `Error` değil, düz nesne ({ message, details, hint, code }).
 * `String(e)` bunları "[object Object]" yaptığı için tek geçiş noktası burası.
 */
export function hataMetni(e: unknown): string {
  // Kova hataları (StorageApiError) Error'dan türüyor; sınır denetimi ondan önce.
  const ozel = e && typeof e === 'object' ? sinirMetni(e as Record<string, unknown>) : null;
  if (ozel) return ozel;

  if (e instanceof Error) return e.message;

  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>;
    const parcalar = [o.message, o.details, o.hint]
      .filter((p): p is string => typeof p === 'string' && p.length > 0);
    if (parcalar.length > 0) {
      const kod = typeof o.code === 'string' ? ` (${o.code})` : '';
      return parcalar.join(' — ') + kod;
    }
    try {
      return JSON.stringify(e);
    } catch {
      return messages().hata.bilinmeyen;
    }
  }

  return String(e);
}

/**
 * Veritabanı ve kova sınırlarının (`lib/sinirlar.ts`) kullanıcıya dönük karşılıkları.
 * Arayüz bunlara çoğunlukla çarpmadan önce söylüyor; kalanlar yarış ya da eski veri.
 */
function sinirMetni(o: Record<string, unknown>): string | null {
  const mesaj = typeof o.message === 'string' ? o.message : '';
  const t = messages().sinir;
  // Tetikleyicinin mesajı Türkçe ve hangi sınır olduğunu söylüyor (schema.sql → sinir_denetle).
  if (o.code === 'SDLIM') {
    if (/kategori/i.test(mesaj)) return t.kategoriSayisi(SINIR.listeKategori);
    if (/liste oluştur/i.test(mesaj)) return t.listeSayisi(SINIR.kullaniciListe);
    return t.listeDolu(SINIR.listeKayit);
  }
  if (o.code === '23514') return t.metinUzun;
  // Kova: boyut ve tür sınırı, yükleme politikasındaki dosya sayısı sınırı.
  if (/exceeded the maximum allowed size|payload too large/i.test(mesaj)) {
    return t.fotoBuyuk;
  }
  if (/mime type .* is not supported/i.test(mesaj)) return t.dosyaTuru;
  // Tablo RLS hataları PostgREST'ten `code` ile gelir; kovanınkiler Error olarak, kodsuz.
  if (/row-level security/i.test(mesaj) && o.code === undefined) {
    return t.fotoSayisi;
  }
  return null;
}
