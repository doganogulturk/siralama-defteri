import { cookies } from 'next/headers';
import { DIL_CEREZ, dilMi, type Dil } from './index';

/**
 * Sunucuda çizilen sayfanın dili. Kişinin kendi seçimi (çerez) önce gelir; seçimi yoksa bağlantıdaki dil
 * (`?l=`, paylaşanın dili), o da yoksa Türkçe. Önizleme kartını hazırlayan uygulamaların (WhatsApp gibi)
 * çerezi olmadığı için onlar bağlantıdaki dili görür.
 */
export async function sunucuDili(baglanti?: string | string[] | null): Promise<Dil> {
  const cerez = (await cookies()).get(DIL_CEREZ)?.value;
  if (dilMi(cerez)) return cerez;
  return baglantiDili(baglanti);
}

/** Görseller (önizleme, story, Kör Sıralama sonucu) yalnızca bağlantıya bakar: paylaşanın dilinde çizilir. */
export function baglantiDili(baglanti?: string | string[] | null): Dil {
  const d = Array.isArray(baglanti) ? baglanti[0] : baglanti;
  return dilMi(d) ? d : 'tr';
}
