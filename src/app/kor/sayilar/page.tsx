import type { Metadata } from 'next';
import SayiOyun from '../../../components/SayiOyun';
import { puanla, sayilariUret, tohumGecerli, yerlesimCoz } from '../../../lib/sayilar';
import { DIL_PARAMETRE, sozluk } from '../../../lib/i18n';
import { sunucuDili } from '../../../lib/i18n/sunucu';

type Props = {
  searchParams: Promise<{ t?: string; s?: string; [DIL_PARAMETRE]?: string }>;
};

/** Bağlantıdaki sonuç (`?t=&s=`): ikisi de geçerliyse; yoksa null. */
function sonucOku(t?: string, s?: string) {
  if (!tohumGecerli(t)) return null;
  const sira = yerlesimCoz(s);
  return sira ? { tohum: t, sira } : null;
}

/** Önizleme kartı paylaşanın dilinde ve puanıyla (`/kor/sayilar/gorsel?boyut=kart`). */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const arama = await searchParams;
  const dil = await sunucuDili(arama[DIL_PARAMETRE]);
  const t = sozluk(dil).sayilar;
  const sonuc = sonucOku(arama.t, arama.s);
  const puan = sonuc ? puanla(sonuc.sira.map(i => sayilariUret(sonuc.tohum)[i])).puan : null;
  const aciklama = puan !== null ? t.arkadas(puan) : t.aciklama;
  const gorsel = new URLSearchParams({
    boyut: 'kart', ...(sonuc ? { t: sonuc.tohum, s: arama.s! } : {}), [DIL_PARAMETRE]: dil,
  });
  return {
    title: { absolute: t.baslik },
    description: aciklama,
    openGraph: {
      title: t.baslik,
      description: aciklama,
      siteName: sozluk(dil).marka,
      images: [{ url: `/kor/sayilar/gorsel?${gorsel}`, width: 1200, height: 630 }],
    },
  };
}

export default async function SayilarSayfasi({ searchParams }: Props) {
  const { t, s } = await searchParams;
  const sonuc = sonucOku(t, s);
  // Yalnızca tohum taşıyan bağlantı (sonuçsuz) da o sayılarla oynatıyor.
  return <SayiOyun tohum={sonuc?.tohum ?? (tohumGecerli(t) ? t : null)} arkadas={sonuc?.sira ?? null} />;
}
