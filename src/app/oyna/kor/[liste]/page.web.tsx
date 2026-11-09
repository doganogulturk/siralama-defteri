import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KorOyun from '@/components/KorOyun';
import { katalogListesi, korOyunListesi } from '@/lib/katalog';
import { korAdresi } from '@/lib/oyun-adresi';
import { DIL_PARAMETRE, sozluk } from '@/lib/i18n';
import { sunucuDili } from '@/lib/i18n/sunucu';

type Props = {
  params: Promise<{ liste: string }>;
  searchParams: Promise<{ s?: string; t?: string; [DIL_PARAMETRE]?: string }>;
};

/** Önizleme kartı paylaşanın dilinde: bağlantı dili taşıyor (`?l=en`), görsel de aynı dilde çiziliyor. */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ liste: slug }, arama] = await Promise.all([params, searchParams]);
  const dil = await sunucuDili(arama[DIL_PARAMETRE]);
  const t = sozluk(dil);
  const katalogda = katalogListesi(slug, dil);
  if (!katalogda) return { title: t.kor.bulunamadi };
  const { adresTohumu: tohum, sonuc } = korAdresi(slug, arama.t, arama.s)!;
  const liste = korOyunListesi(slug, tohum, dil);
  const baslik = t.kor.baslik(katalogda.ad);
  const aciklama = sonuc && liste ? t.kor.sampiyonu(liste.kayitlar[sonuc[0]]) : t.kor.aciklama;
  const gorsel = new URLSearchParams({
    boyut: 'kart', ...(tohum ? { t: tohum } : {}), ...(sonuc ? { s: arama.s! } : {}), [DIL_PARAMETRE]: dil,
  });
  return {
    title: { absolute: baslik },
    description: aciklama,
    openGraph: {
      title: baslik,
      description: aciklama,
      siteName: t.marka,
      images: [{ url: `/oyna/kor/${slug}/gorsel?${gorsel}`, width: 1200, height: 630 }],
    },
  };
}

/** Katalogdaki her liste (`lib/katalog.ts`): zevk listeleri ve doğru cevabı olanlar. */
export default async function KorOyunSayfasi({ params, searchParams }: Props) {
  const [{ liste: slug }, { s, t }] = await Promise.all([params, searchParams]);
  // Adresi okuma kuralı uygulama paketiyle ortak (`lib/oyun-adresi.ts`).
  const adres = korAdresi(slug, t, s);
  if (!adres) notFound();
  return <KorOyun slug={slug} tohum={adres.tohum} arkadas={adres.sonuc} />;
}
