import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KorOyun from '../../../components/KorOyun';
import { korListesi, sonucCoz } from '../../../lib/kor';

type Props = {
  params: Promise<{ liste: string }>;
  searchParams: Promise<{ s?: string }>;
};

/**
 * Bir listenin oyunu. `?s=` bir arkadaşın sonucu: bağlantı paylaşılan bir sonuçtan
 * geldiyse önizleme kartı onun sıralamasını gösteriyor, oyun sonunda da uyum hesaplanıyor.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ liste: slug }, { s }] = await Promise.all([params, searchParams]);
  const liste = korListesi(slug);
  if (!liste) return { title: 'Liste bulunamadı' };
  const sonuc = sonucCoz(liste, s);
  const baslik = `Kör Sıralama: ${liste.ad}`;
  const aciklama = sonuc
    ? `Şampiyonu ${liste.kayitlar[sonuc[0]]}. Sen nasıl sıralardın?`
    : 'On kayıt birer birer gelir; her birini hemen bir sıraya koy, sonradan değiştiremezsin.';
  return {
    title: { absolute: baslik },
    description: aciklama,
    openGraph: {
      title: baslik,
      description: aciklama,
      siteName: 'Sıralama Defteri',
      images: [{
        url: `/kor/${liste.slug}/gorsel?boyut=kart${sonuc ? `&s=${s}` : ''}`,
        width: 1200,
        height: 630,
      }],
    },
  };
}

export default async function KorOyunSayfasi({ params, searchParams }: Props) {
  const [{ liste: slug }, { s }] = await Promise.all([params, searchParams]);
  const liste = korListesi(slug);
  if (!liste) notFound();
  return <KorOyun liste={liste} arkadas={sonucCoz(liste, s)} />;
}
