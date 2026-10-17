/**
 * Dokunsal geri bildirim. Yalnızca Android'deki tarayıcılarda çalışıyor (Vibration
 * API); iOS Safari desteklemiyor, orada sessizce hiçbir şey olmuyor. Desenler kısa:
 * titreşim bir onay, bildirim değil.
 */
const DESENLER = {
  /** Sürüklemeye başlamak, bir şeyi seçmek. */
  dokunus: 8,
  /** Şampiyon değişti. */
  sampiyon: [12, 60, 24],
  /** Bir iş tamamlandı. */
  basari: [10, 40, 10],
} as const;

export function titret(tur: keyof typeof DESENLER): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(DESENLER[tur] as number | number[]);
    }
  } catch { /* izin yoksa ya da desteklenmiyorsa önemli değil */ }
}
