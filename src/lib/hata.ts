/**
 * Supabase hataları `Error` değil, düz nesne ({ message, details, hint, code }).
 * `String(e)` bunları "[object Object]" yaptığı için tek geçiş noktası burası.
 */
export function hataMetni(e: unknown): string {
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
