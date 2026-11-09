import { ikonGorseli } from '@/lib/ikon-cizim';

/** iOS ana ekran ikonu: köşeleri iOS yuvarlıyor, zemin kenara kadar. */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
// Uygulama paketi statik dışa aktarılıyor: ikon derlemede bir kez üretilsin.
export const dynamic = 'force-static';

export default function AppleIcon() {
  return ikonGorseli(180, { tamZemin: true });
}
