/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Marka from '../../../components/Marka';
import { AlanTanimi, altBilgi, brandInitials, rozetler } from '../../../types/item';
import {
  PaylasilanKayit, PaylasilanListe, guvenliFoto, paylasimBasligi, sahibinSiralamasi,
} from '../../../lib/paylasim';
import { paylasilanListe } from '../../../lib/paylasim-sunucu';
import { DIL_PARAMETRE, sozluk, type Mesajlar } from '../../../lib/i18n';
import { sunucuDili } from '../../../lib/i18n/sunucu';

/** Canlı: sahibi sıralamayı değiştirdikçe bağlantı da değişsin, önbellekte kalmasın. */
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ kod: string }>;
  searchParams: Promise<{ [DIL_PARAMETRE]?: string }>;
};

/** Önizleme kartının alt satırı: "1. Yaprak · 2. İskender · 3. Dürüm". */
function ilkUcMetni(liste: PaylasilanListe, t: Mesajlar): string {
  const ilkUc = liste.kayitlar.filter(k => !k.asla).slice(0, 3);
  if (ilkUc.length === 0) return t.paylasimSayfasi.siralamaYok;
  return ilkUc.map((k, i) => `${i + 1}. ${k.ad}`).join(' · ');
}

/**
 * Sayfa kişinin kendi dil seçiminde (çerez), seçimi yoksa bağlantının dilinde. Önizleme kartını hazırlayan
 * uygulamaların çerezi yok: kart ve görseli paylaşanın dilinde (`?l=`) çıkıyor.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ kod }, arama] = await Promise.all([params, searchParams]);
  const dil = await sunucuDili(arama[DIL_PARAMETRE]);
  const t = sozluk(dil);
  const liste = await paylasilanListe(kod);
  if (!liste) return { title: t.paylasimSayfasi.bulunamadi, robots: { index: false, follow: false } };

  const baslik = paylasimBasligi(liste, dil);
  const aciklama = ilkUcMetni(liste, t);
  return {
    // Kök şablonun "| Sıralama Defteri" ekini almasın: önizleme kartında başlık kısa kalsın.
    title: { absolute: baslik },
    description: aciklama,
    // Bağlantı yalnızca elden ele dolaşsın: arama motorlarında adla bulunmasın.
    robots: { index: false, follow: false },
    openGraph: {
      title: baslik,
      description: aciklama,
      siteName: t.marka,
      type: 'website',
      images: [{
        url: `/p/${kod}/onizleme?${DIL_PARAMETRE}=${dil}`,
        width: 1200,
        height: 630,
        alt: t.paylasimSayfasi.gorselAlt,
        type: 'image/png',
      }],
    },
  };
}

const AslaIkon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/**
 * Sıralama ekranındaki satırın salt okunur hâli: aynı sınıflar, ama dokunma,
 * sürükleme ve seçim yok. Kategori, rozetlerin başında renkli bir hap.
 */
function Satir({ kayit, sira, alanlar, kategori, t }: {
  kayit: PaylasilanKayit;
  /** Sıralamadaki yeri; "Bir daha asla" bölümünde 0. */
  sira: number;
  alanlar: AlanTanimi[];
  kategori?: { ad: string; renk: string };
  t: Mesajlar;
}) {
  const asla = kayit.asla;
  const alt = altBilgi(kayit, alanlar);
  const etiketler = rozetler(kayit, alanlar);
  const foto = guvenliFoto(kayit.fotograf_url);

  return (
    <li className={`row${asla ? ' is-asla' : ''}${sira === 1 ? ' is-sampiyon' : ''}`}>
      {asla ? (
        <span className="row-rank is-asla" aria-label={t.paylasimSayfasi.birDahaAsla}>{AslaIkon}</span>
      ) : (
        <span className={`row-rank${sira <= 3 ? ' is-podium' : ''}`} data-rank={sira}>{sira}</span>
      )}

      {foto
        ? <img src={foto} className="row-thumb" alt="" loading="lazy" />
        : <span className="row-thumb row-thumb-fallback">{brandInitials(kayit.ad)}</span>}

      <span className="row-text">
        <span className="row-name">
          {kayit.ad}
          {kayit.alt_ad && <span className="row-variant"> {kayit.alt_ad}</span>}
        </span>
        {alt && <span className="row-sub">{alt}</span>}
      </span>

      <span className="row-tags">
        {kategori && (
          <span className="row-tag is-kat" style={{ '--kat': kategori.renk } as React.CSSProperties}>
            {kategori.ad}
          </span>
        )}
        {etiketler.map(t => <span key={t} className="row-tag">{t}</span>)}
      </span>
    </li>
  );
}

/**
 * Salt okunur paylaşım sayfası. Oturum istemiyor (uygulama grubunun dışında) ve
 * sunucuda çiziliyor. Veri `paylasilan_liste`'den: notlar ve denenmemişler yok.
 */
export default async function PaylasimSayfasi({ params, searchParams }: Props) {
  const [{ kod }, arama] = await Promise.all([params, searchParams]);
  const dil = await sunucuDili(arama[DIL_PARAMETRE]);
  const t = sozluk(dil);
  const p = t.paylasimSayfasi;
  const liste = await paylasilanListe(kod);
  if (!liste) notFound();

  const kategoriler = new Map(liste.kategoriler.map(k => [k.id, k]));
  const siralama = liste.kayitlar.filter(k => !k.asla);
  const asla = liste.kayitlar.filter(k => k.asla);
  const satir = (k: PaylasilanKayit, sira: number) => (
    <Satir
      key={k.id}
      kayit={k}
      sira={sira}
      alanlar={liste.alanlar ?? []}
      kategori={k.category_id ? kategoriler.get(k.category_id) : undefined}
      t={t}
    />
  );

  return (
    <div className="paylasim">
      <header className="paylasim-bar">
        {/* iOS'ta donanım geri tuşu yok: her ekranda görünür bir geri yolu. */}
        <Link href="/" className="mobile-brand-back" aria-label={p.anaSayfa}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <Link href="/" className="paylasim-marka" aria-label={p.markaAnaSayfa}>
          <Marka />
        </Link>
      </header>

      <main>
        <section className="paylasim-bas">
          <p className="paylasim-sahip">
            {sahibinSiralamasi(liste.sahip, dil)}
          </p>
          <h1 className="paylasim-baslik">{liste.ad}</h1>
          {siralama.length > 0 && (
            <p className="paylasim-ozet">
              <strong>{p.siralandi(siralama.length)[0]}</strong>{p.siralandi(siralama.length)[1]}
              {siralama[0] && <>{p.sampiyon}<strong>{siralama[0].ad}</strong></>}
            </p>
          )}
          {siralama.length > 0 && (
            <div className="paylasim-davet">
              <Link href={`/kiyasla/${kod}`} className="btn-primary">{p.benDe}</Link>
              <p>{p.davet}</p>
            </div>
          )}
        </section>

        {liste.kayitlar.length === 0 ? (
          <div className="state-empty">
            <p className="state-empty-title">{p.bosBaslik}</p>
            <p>{p.bosMetin}</p>
          </div>
        ) : (
          <>
            <ol className="rows" aria-label={p.siralama}>
              {siralama.map((k, i) => satir(k, i + 1))}
            </ol>
            {asla.length > 0 && (
              <>
                <div className="asla-siniri" role="separator">
                  <span className="asla-siniri-ad">{p.birDahaAsla}</span>
                  <span className="asla-siniri-sayi">{asla.length}</span>
                </div>
                <ul className="rows" aria-label={p.birDahaAsla}>
                  {asla.map(k => satir(k, 0))}
                </ul>
              </>
            )}
          </>
        )}
      </main>

      <footer className="paylasim-son">
        <p>{p.son}</p>
        <Link href={`/kiyasla/${kod}`} className="btn-quiet">{p.benDe}</Link>
      </footer>
    </div>
  );
}
