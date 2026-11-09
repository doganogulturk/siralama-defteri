import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TierOyun from '@/components/TierOyun';
import { katalogListesi, tohumGerekli } from './katalog';
import { KOR_TIER_SINIR, tierCoz } from './tier-oyun';
import { tohumGecerli } from './sayilar';
import { DIL_PARAMETRE, sozluk } from './i18n';
import { sunucuDili } from './i18n/sunucu';

/*
 * Tier (`/oyna/tier/[liste]`) ve Kör Tier (`/oyna/kor-tier/[liste]`) sayfalarının ortak
 * sunucu parçaları: adresi okumak, önizleme kartı ve oyun. Görsel tek yolda
 * (`/oyna/tier/[liste]/gorsel`, Kör Tier `mod=kor` ile).
 */

export type TierArama = { t?: string; s?: string; [DIL_PARAMETRE]?: string };

function adresOku(slug: string, kor: boolean, arama: TierArama) {
  const liste = katalogListesi(slug, 'tr');
  if (!liste) return null;
  const tohum = tohumGerekli(liste) && tohumGecerli(arama.t) ? arama.t! : null;
  // Doğru cevabı olan listede tohumsuz sonuç geçersiz: hangi on maddenin oynandığı bilinmiyor.
  // Zevk listesinde tohumsuz sonuç havuzun ilk onu (havuzlar büyümeden önceki bağlantılar).
  const gecerli = !tohumGerekli(liste) || tohum || !liste.dogru;
  return { tohum, arkadas: gecerli ? tierCoz(arama.s, kor ? KOR_TIER_SINIR : undefined) : null };
}

export async function tierMetadata(slug: string, arama: TierArama, kor: boolean): Promise<Metadata> {
  const dil = await sunucuDili(arama[DIL_PARAMETRE]);
  const s = sozluk(dil);
  const liste = katalogListesi(slug, dil);
  const adres = adresOku(slug, kor, arama);
  if (!liste || !adres) return { title: s.kor.bulunamadi };
  const baslik = kor ? s.tier.korBaslik(liste.ad) : s.tier.baslik(liste.ad);
  const aciklama = adres.arkadas ? s.tier.arkadas : s.tier.aciklama;
  const gorsel = new URLSearchParams({
    boyut: 'kart',
    ...(adres.tohum ? { t: adres.tohum } : {}),
    ...(adres.arkadas ? { s: arama.s! } : {}),
    ...(kor ? { mod: 'kor' } : {}),
    [DIL_PARAMETRE]: dil,
  });
  return {
    title: { absolute: baslik },
    description: aciklama,
    openGraph: {
      title: baslik,
      description: aciklama,
      siteName: s.marka,
      images: [{ url: `/oyna/tier/${slug}/gorsel?${gorsel}`, width: 1200, height: 630 }],
    },
  };
}

export function TierSayfasi({ slug, arama, kor }: { slug: string; arama: TierArama; kor: boolean }) {
  const adres = adresOku(slug, kor, arama);
  if (!adres) notFound();
  return <TierOyun slug={slug} kor={kor} tohum={adres.tohum} arkadas={adres.arkadas} />;
}
