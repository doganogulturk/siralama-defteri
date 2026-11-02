import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DogruSiraOyun from '@/components/DogruSiraOyun';
import { dogruSiraListesi, maddeleriSec, puanla } from '@/lib/dogru-sira';
import { tohumGecerli, yerlesimCoz } from '@/lib/sayilar';
import { DIL_PARAMETRE, sozluk } from '@/lib/i18n';
import { sunucuDili } from '@/lib/i18n/sunucu';

type Props = {
  params: Promise<{ liste: string }>;
  searchParams: Promise<{ t?: string; s?: string; [DIL_PARAMETRE]?: string }>;
};

/** Bağlantıdaki sonuç (`?t=&s=`): ikisi de geçerliyse; yoksa null. */
function sonucOku(t?: string, s?: string) {
  if (!tohumGecerli(t)) return null;
  const dizilis = yerlesimCoz(s);
  return dizilis ? { tohum: t, dizilis } : null;
}

/** Önizleme kartı paylaşanın dilinde ve puanıyla (`gorsel?boyut=kart`). */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ liste: slug }, arama] = await Promise.all([params, searchParams]);
  const dil = await sunucuDili(arama[DIL_PARAMETRE]);
  const t = sozluk(dil).dogruSira;
  const liste = dogruSiraListesi(slug, dil);
  if (!liste) return { title: t.bulunamadi };
  const sonuc = sonucOku(arama.t, arama.s);
  const uyum = sonuc ? puanla(liste, maddeleriSec(slug, sonuc.tohum), sonuc.dizilis).uyum : null;
  const baslik = t.baslik(liste.ad);
  const aciklama = uyum !== null ? t.arkadas(uyum) : t.aciklama;
  const gorsel = new URLSearchParams({
    boyut: 'kart', ...(sonuc ? { t: sonuc.tohum, s: arama.s! } : {}), [DIL_PARAMETRE]: dil,
  });
  return {
    title: { absolute: baslik },
    description: aciklama,
    openGraph: {
      title: baslik,
      description: aciklama,
      siteName: sozluk(dil).marka,
      images: [{ url: `/kor/dogru-sira/${slug}/gorsel?${gorsel}`, width: 1200, height: 630 }],
    },
  };
}

/**
 * Doğru Sıra'nın oyunu (`lib/dogru-sira.ts`). Giriş istemiyor, hiçbir şey kaydedilmiyor.
 * `?t=` günün ya da arkadaşın maddeleri, `?s=` arkadaşın dizilişi.
 */
export default async function DogruSiraSayfasi({ params, searchParams }: Props) {
  const [{ liste: slug }, { t, s }] = await Promise.all([params, searchParams]);
  if (!dogruSiraListesi(slug, 'tr')) notFound();
  const sonuc = sonucOku(t, s);
  return <DogruSiraOyun slug={slug} tohum={sonuc?.tohum ?? (tohumGecerli(t) ? t : null)} arkadas={sonuc?.dizilis ?? null} />;
}
