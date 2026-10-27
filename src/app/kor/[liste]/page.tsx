import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KorOyun from '../../../components/KorOyun';
import { korListesi, sonucCoz } from '../../../lib/kor';
import { DIL_PARAMETRE, sozluk } from '../../../lib/i18n';
import { sunucuDili } from '../../../lib/i18n/sunucu';

type Props = {
  params: Promise<{ liste: string }>;
  searchParams: Promise<{ s?: string; [DIL_PARAMETRE]?: string }>;
};

/** Önizleme kartı paylaşanın dilinde: bağlantı dili taşıyor (`?l=en`), görsel de aynı dilde çiziliyor. */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ liste: slug }, arama] = await Promise.all([params, searchParams]);
  const dil = await sunucuDili(arama[DIL_PARAMETRE]);
  const t = sozluk(dil);
  const liste = korListesi(slug, dil);
  if (!liste) return { title: t.kor.bulunamadi };
  const sonuc = sonucCoz(liste, arama.s);
  const baslik = t.kor.baslik(liste.ad);
  const aciklama = sonuc ? t.kor.sampiyonu(liste.kayitlar[sonuc[0]]) : t.kor.aciklama;
  const gorsel = new URLSearchParams({ boyut: 'kart', ...(sonuc ? { s: arama.s! } : {}), [DIL_PARAMETRE]: dil });
  return {
    title: { absolute: baslik },
    description: aciklama,
    openGraph: {
      title: baslik,
      description: aciklama,
      siteName: t.marka,
      images: [{ url: `/kor/${liste.slug}/gorsel?${gorsel}`, width: 1200, height: 630 }],
    },
  };
}

export default async function KorOyunSayfasi({ params, searchParams }: Props) {
  const [{ liste: slug }, { s }] = await Promise.all([params, searchParams]);
  const liste = korListesi(slug, 'tr');
  if (!liste) notFound();
  // Liste adları istemcide arayüz dilinde okunuyor; burada yalnızca var olup olmadığı.
  return <KorOyun slug={liste.slug} arkadas={sonucCoz(liste, s)} />;
}
