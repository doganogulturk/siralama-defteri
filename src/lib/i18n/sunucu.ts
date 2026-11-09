import { cookies, headers } from 'next/headers';
import { DIL_CEREZ, dilMi, type Dil } from './index';
import { MOBIL } from '../site';

/**
 * Sunucuda çizilen sayfanın dili. Kişinin kendi seçimi (çerez) önce gelir; seçimi yoksa bağlantıdaki dil
 * (`?l=`, paylaşanın dili), o da yoksa Türkçe. Önizleme kartını hazırlayan uygulamaların (WhatsApp gibi)
 * çerezi olmadığı için onlar bağlantıdaki dili görür.
 */
export async function sunucuDili(baglanti?: string | string[] | null): Promise<Dil> {
  // Uygulama paketi derlemede çiziliyor: istek yok, çerez okunamaz. Dili cihazda DilKoku seçiyor.
  if (MOBIL) return baglantiDili(baglanti);
  const cerez = (await cookies()).get(DIL_CEREZ)?.value;
  if (dilMi(cerez)) return cerez;
  return baglantiDili(baglanti);
}

/** Görseller (önizleme, story, Kör Sıralama sonucu) yalnızca bağlantıya bakar: paylaşanın dilinde çizilir. */
export function baglantiDili(baglanti?: string | string[] | null): Dil {
  const d = Array.isArray(baglanti) ? baglanti[0] : baglanti;
  return dilMi(d) ? d : 'tr';
}

/**
 * Bütün sayfanın ilk çizimdeki dili (kök layout → `DilKoku`): kişinin seçimi (çerez), yoksa tarayıcının
 * dili — istemcideki cihaz dili kuralıyla aynı (Türkçeyse Türkçe, değilse İngilizce). Başlık hiç yoksa
 * (botlar) Türkçe. Bağlantıdaki `?l=` burada görünmüyor; onu sayfalar kendisi okuyor (`sunucuDili`),
 * tarayıcı da hidrasyondan sonra uyguluyor.
 */
export async function istekDili(): Promise<Dil> {
  if (MOBIL) return 'tr';
  const cerez = (await cookies()).get(DIL_CEREZ)?.value;
  if (dilMi(cerez)) return cerez;
  const ilk = (await headers()).get('accept-language')?.split(',')[0]?.trim().toLowerCase();
  if (!ilk || ilk === '*') return 'tr';
  return ilk.startsWith('tr') ? 'tr' : 'en';
}
