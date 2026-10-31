import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import KorListeOyun from '../../../../components/KorListeOyun';
import Marka from '../../../../components/Marka';
import { paylasilanListe } from '../../../../lib/paylasim-sunucu';
import { iyelik } from '../../../../lib/paylasim';
import { korKayitlari, korSonucCoz, korUygun, korUyum } from '../../../../lib/kor-liste';
import { DIL_PARAMETRE, sozluk } from '../../../../lib/i18n';
import { sunucuDili } from '../../../../lib/i18n/sunucu';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ kod: string }>;
  searchParams: Promise<{ s?: string; [DIL_PARAMETRE]?: string }>;
};

/**
 * Paylaşılan listenin kör sıralaması. Ayrı bir adres: paylaşım sayfasını açan kişi
 * sahibin sırasını görmüş olurdu; buradan gelen doğrudan oyuna düşüyor ve sahibin
 * sırasını ancak sonuçta görüyor. Önizleme kartı paylaşanın dilinde (`?l=en`).
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ kod }, arama] = await Promise.all([params, searchParams]);
  const dil = await sunucuDili(arama[DIL_PARAMETRE]);
  const t = sozluk(dil);
  const liste = await paylasilanListe(kod);
  if (!liste) return { title: t.paylasimSayfasi.bulunamadi, robots: { index: false, follow: false } };
  const kayitlar = korKayitlari(liste.kayitlar);
  const sonuc = korSonucCoz(kayitlar, arama.s);
  const uyum = sonuc ? korUyum(sonuc) : null;
  const baslik = `${t.kor.ad}: ${t.korListe.baslik(liste.ad, liste.sahip ? iyelik(liste.sahip, dil) : null)}`;
  const aciklama = uyum !== null ? t.korListe.arkadasSonucu(uyum) : t.korListe.aciklama;
  const gorsel = new URLSearchParams({ boyut: 'kart', ...(sonuc ? { s: arama.s! } : {}), [DIL_PARAMETRE]: dil });
  return {
    title: { absolute: baslik },
    description: aciklama,
    robots: { index: false, follow: false },
    openGraph: {
      title: baslik,
      description: aciklama,
      siteName: t.marka,
      images: [{ url: `/p/${kod}/kor/gorsel?${gorsel}`, width: 1200, height: 630 }],
    },
  };
}

export default async function KorListeSayfasi({ params, searchParams }: Props) {
  const [{ kod }, { s }] = await Promise.all([params, searchParams]);
  const liste = await paylasilanListe(kod);
  if (!liste) notFound();
  const kayitlar = korKayitlari(liste.kayitlar);

  if (!korUygun(kayitlar.length)) {
    const t = sozluk(await sunucuDili()).korListe;
    return (
      <div className="paylasim">
        <header className="paylasim-bar">
          <Link href="/" className="paylasim-marka"><Marka /></Link>
        </header>
        <main className="state-empty">
          <p className="state-empty-title">{t.kisaBaslik}</p>
          <p>{t.kisaMetin(kayitlar.length)}</p>
          <Link href={`/p/${kod}`} className="btn-primary">{t.listeyiGor}</Link>
        </main>
      </div>
    );
  }

  return (
    <KorListeOyun
      kod={kod}
      listeAdi={liste.ad}
      sahip={liste.sahip}
      kayitlar={kayitlar}
      arkadas={korSonucCoz(kayitlar, s)}
    />
  );
}
