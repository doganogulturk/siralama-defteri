/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Marka from '../../../components/Marka';
import { AlanTanimi, altBilgi, brandInitials, rozetler } from '../../../types/item';
import {
  PaylasilanKayit, PaylasilanListe, guvenliFoto, paylasimBasligi, tamlayan,
} from '../../../lib/paylasim';
import { paylasilanListe } from '../../../lib/paylasim-sunucu';

/** Canlı: sahibi sıralamayı değiştirdikçe bağlantı da değişsin, önbellekte kalmasın. */
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ kod: string }> };

/** Önizleme kartının alt satırı: "1. Yaprak · 2. İskender · 3. Dürüm". */
function ilkUcMetni(liste: PaylasilanListe): string {
  const ilkUc = liste.kayitlar.filter(k => !k.asla).slice(0, 3);
  if (ilkUc.length === 0) return 'Henüz sıralama yok.';
  return ilkUc.map((k, i) => `${i + 1}. ${k.ad}`).join(' · ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  const liste = await paylasilanListe(kod);
  if (!liste) return { title: 'Liste bulunamadı', robots: { index: false, follow: false } };

  const baslik = paylasimBasligi(liste);
  const aciklama = ilkUcMetni(liste);
  return {
    // Kök şablonun "| Sıralama Defteri" ekini almasın: önizleme kartında başlık kısa kalsın.
    title: { absolute: baslik },
    description: aciklama,
    // Bağlantı yalnızca elden ele dolaşsın: arama motorlarında adla bulunmasın.
    robots: { index: false, follow: false },
    openGraph: { title: baslik, description: aciklama, siteName: 'Sıralama Defteri', type: 'website' },
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
function Satir({ kayit, sira, alanlar, kategori }: {
  kayit: PaylasilanKayit;
  /** Sıralamadaki yeri; "Bir daha asla" bölümünde 0. */
  sira: number;
  alanlar: AlanTanimi[];
  kategori?: { ad: string; renk: string };
}) {
  const asla = kayit.asla;
  const alt = altBilgi(kayit, alanlar);
  const etiketler = rozetler(kayit, alanlar);
  const foto = guvenliFoto(kayit.fotograf_url);

  return (
    <li className={`row${asla ? ' is-asla' : ''}${sira === 1 ? ' is-sampiyon' : ''}`}>
      {asla ? (
        <span className="row-rank is-asla" aria-label="Bir daha asla">{AslaIkon}</span>
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
export default async function PaylasimSayfasi({ params }: Props) {
  const { kod } = await params;
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
    />
  );

  return (
    <div className="paylasim">
      <header className="paylasim-bar">
        <Link href="/" className="paylasim-marka" aria-label="Sıralama Defteri ana sayfa">
          <Marka />
        </Link>
      </header>

      <main>
        <section className="paylasim-bas">
          <p className="paylasim-sahip">
            {liste.sahip ? `${tamlayan(liste.sahip)} sıralaması` : 'Bir sıralama'}
          </p>
          <h1 className="paylasim-baslik">{liste.ad}</h1>
          {siralama.length > 0 && (
            <p className="paylasim-ozet">
              <strong>{siralama.length}</strong> kayıt sıralandı
              {siralama[0] && <> · Şampiyon: <strong>{siralama[0].ad}</strong></>}
            </p>
          )}
        </section>

        {liste.kayitlar.length === 0 ? (
          <div className="state-empty">
            <p className="state-empty-title">Henüz sıralama yok</p>
            <p>Bu listede sıralanmış bir kayıt bulunmuyor.</p>
          </div>
        ) : (
          <>
            <ol className="rows" aria-label="Sıralama">
              {siralama.map((k, i) => satir(k, i + 1))}
            </ol>
            {asla.length > 0 && (
              <>
                <div className="asla-siniri" role="separator">
                  <span className="asla-siniri-ad">Bir daha asla</span>
                  <span className="asla-siniri-sayi">{asla.length}</span>
                </div>
                <ul className="rows" aria-label="Bir daha asla">
                  {asla.map(k => satir(k, 0))}
                </ul>
              </>
            )}
          </>
        )}
      </main>

      <footer className="paylasim-son">
        <p>Sen de denediklerini sırala: kola, döner, kahve — ne istersen.</p>
        <Link href="/" className="btn-quiet">Kendi sıralamanı oluştur</Link>
      </footer>
    </div>
  );
}
