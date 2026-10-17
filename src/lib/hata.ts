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
      return 'Bilinmeyen hata';
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
  // Tetikleyicinin kendi mesajı zaten Türkçe.
  if (o.code === 'SDLIM') return mesaj;
  if (o.code === '23514') return 'Yazdığın metin çok uzun; biraz kısaltıp tekrar dene.';
  // Kova: boyut ve tür sınırı, yükleme politikasındaki dosya sayısı sınırı.
  if (/exceeded the maximum allowed size|payload too large/i.test(mesaj)) {
    return 'Fotoğraf çok büyük.';
  }
  if (/mime type .* is not supported/i.test(mesaj)) return 'Bu dosya türü desteklenmiyor.';
  // Tablo RLS hataları PostgREST'ten `code` ile gelir; kovanınkiler Error olarak, kodsuz.
  if (/row-level security/i.test(mesaj) && o.code === undefined) {
    return 'Fotoğraf sınırına ulaştın (en fazla 1000). Kullanmadığın kayıtların fotoğraflarını silerek yer açabilirsin.';
  }
  return null;
}
