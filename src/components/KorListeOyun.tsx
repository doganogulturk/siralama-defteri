'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import OyunGeri from '@/components/oyna/OyunGeri';
import { KOR_ADET, KorKayit, korSec, korSonucYaz, korUyum } from '@/lib/kor-liste';
import { uyumEtiketi } from '@/lib/kiyas';
import { iyelik } from '@/lib/paylasim';
import { slugify } from '@/lib/slug';
import { brandInitials } from '@/types/item';
import { DIL_PARAMETRE } from '@/lib/i18n';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';
import { titret } from '@/lib/his';
import { useAuth } from '@/hooks/useAuth';
import KorKamera, { KameraDugmesi, useKameraVar } from './KorKamera';

type Asama = 'giris' | 'oyun' | 'sonuc';

function Foto({ kayit, className }: { kayit: KorKayit; className: string }) {
  return kayit.foto
    ? <img src={kayit.foto} className={className} alt="" />
    : <span className={`${className} is-bos`} aria-hidden="true">{brandInitials(kayit.ad)}</span>;
}

const tamAd = (k: KorKayit) => (k.alt_ad ? `${k.ad} ${k.alt_ad}` : k.ad);

/**
 * Paylaşılan bir listenin kör sıralaması: Kör Sıralama'nın oyunu (`kor-*` parçaları),
 * hazır liste yerine sahibinin kayıtlarıyla ve fotoğraflarıyla. Listeden rastgele on
 * kayıt seçiliyor ("Başla"da: sayfa sunucuda da çiziliyor, ilk çizimde rastgele seçim
 * iki tarafta farklı çıkardı); sonunda sahibinin sırasıyla uyum.
 */
export default function KorListeOyun({ kod, listeAdi, sahip, kayitlar, arkadas }: {
  kod: string;
  listeAdi: string;
  sahip: string | null;
  kayitlar: KorKayit[];
  /** Bağlantı bir arkadaşın sonucunu taşıyorsa onun sırası. */
  arkadas: KorKayit[] | null;
}) {
  const mesajlar = useMesajlar();
  const t = mesajlar.korListe;
  const k = mesajlar.kor;
  const [asama, setAsama] = useState<Asama>('giris');
  const [gelis, setGelis] = useState<KorKayit[]>([]);
  const [adim, setAdim] = useState(0);
  const [yuvalar, setYuvalar] = useState<(KorKayit | null)[]>(() => new Array(KOR_ADET).fill(null));
  const [yeniYuva, setYeniYuva] = useState<number | null>(null);
  const [kilit, setKilit] = useState(false);
  const [kamera, setKamera] = useState(false);
  const [kameraAnahtari, setKameraAnahtari] = useState(0);
  const kameraVar = useKameraVar();
  const dil = useDilim();
  const kimin = sahip ? iyelik(sahip, dil) : null;
  const arkadasUyumu = useMemo(() => (arkadas ? korUyum(arkadas) : null), [arkadas]);

  const basla = () => {
    titret('dokunus');
    setGelis(korSec(kayitlar));
    setAdim(0);
    setYuvalar(new Array(KOR_ADET).fill(null));
    setYeniYuva(null);
    setAsama('oyun');
  };

  const yerlestir = (yuva: number) => {
    if (kilit || yuvalar[yuva] !== null || asama !== 'oyun') return;
    const yeni = [...yuvalar];
    yeni[yuva] = gelis[adim];
    setYuvalar(yeni);
    setYeniYuva(yuva);
    titret(yuva === 0 ? 'sampiyon' : 'dokunus');
    setKilit(true);
    setTimeout(() => {
      setKilit(false);
      if (adim + 1 >= KOR_ADET) {
        setAsama('sonuc');
        titret('basari');
      } else {
        setAdim(a => a + 1);
      }
    }, 380);
  };

  const simdiki = gelis[adim];

  const kameraylaBasla = () => {
    basla();
    setKameraAnahtari(n => n + 1);
    setKamera(true);
  };

  return (
    <div className="kor kor-kendi" style={{ '--kor': 'var(--accent)' } as React.CSSProperties}>
      <header className="kor-bar">
        <OyunGeri etiket={k.listeler} />
        <span className="kor-bar-ad">
          <em>{k.ad}</em>
          {asama !== 'giris' && <strong>{listeAdi}</strong>}
        </span>
        <span className="kor-bar-sayac" aria-live="polite">
          {asama === 'oyun' ? `${adim + 1}/${KOR_ADET}` : ''}
        </span>
      </header>

      {asama === 'giris' && (
        <main className="kor-giris">
          {kimin && <p className="kor-kendi-sahip">{mesajlar.paylasim.sahibinListesi(kimin)}</p>}
          <h1 className="kor-giris-baslik">{listeAdi}</h1>
          <p className="kor-kendi-davet">{t.davet(kimin)}</p>
          {arkadasUyumu !== null && <p className="kor-arkadas">{t.arkadasSonucu(arkadasUyumu)}</p>}
          <ul className="kor-kurallar">
            <li><b>1</b><span>{t.kural1}</span></li>
            <li><b>2</b><span>{k.kural2[0]}<strong>{k.kural2[1]}</strong>{k.kural2[2]}</span></li>
            <li><b>3</b><span>{k.kural3}</span></li>
          </ul>
          <button type="button" className="btn-primary kor-basla" onClick={basla}>{k.basla}</button>
          {kameraVar && <KameraDugmesi onKamera={kameraylaBasla} />}
        </main>
      )}

      {asama === 'oyun' && simdiki && (
        <main className="kor-oyun">
          <div className="kor-sahne">
            <div key={adim} className={`kor-kart kor-kart-foto${kilit ? ' is-gidiyor' : ''}`}>
              <Foto kayit={simdiki} className="kor-kart-resim" />
              <span className="kor-kart-metin">
                <span className="kor-kart-no">{k.kacinciKayit(adim + 1)}</span>
                <strong>{simdiki.ad}</strong>
                {simdiki.alt_ad && <small>{simdiki.alt_ad}</small>}
              </span>
            </div>
            <p className="kor-soru">{k.soru}</p>
          </div>

          <ol className="kor-yuvalar" aria-label={k.siralama}>
            {yuvalar.map((kayit, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`kor-yuva${kayit ? ' is-dolu' : ''}${yeniYuva === i ? ' is-yeni' : ''}${i === 0 ? ' is-bir' : ''}`}
                  onClick={() => yerlestir(i)}
                  disabled={!!kayit || kilit}
                  aria-label={kayit ? `${i + 1}. ${tamAd(kayit)}` : k.siraya(i + 1)}
                >
                  <i>{i + 1}</i>
                  {kayit && <Foto kayit={kayit} className="kor-yuva-resim" />}
                  <span>{kayit ? tamAd(kayit) : ''}</span>
                </button>
              </li>
            ))}
          </ol>
        </main>
      )}

      {asama === 'sonuc' && (
        <KorListeSonuc
          kod={kod}
          listeAdi={listeAdi}
          sahip={sahip}
          sira={yuvalar as KorKayit[]}
          onTekrar={basla}
        />
      )}

      {kamera && asama !== 'giris' && (
        <KorKamera
          key={kameraAnahtari}
          etiket={listeAdi}
          renk="var(--accent)"
          kayitlar={gelis.map(g => ({ ad: g.ad, alt: g.alt_ad, foto: g.foto }))}
          yuvalar={yuvalar.map(y => (y ? gelis.indexOf(y) : null))}
          adim={adim}
          kilit={kilit}
          bitti={asama === 'sonuc'}
          onYerlestir={yerlestir}
          adres={`${window.location.host}/p/${kod}/kor`}
          dosyaAdi={k.kamera.dosyaAdi(slugify(listeAdi) || 'liste')}
          paylasimMetni={`${t.paylasim(listeAdi, null)} ${window.location.origin}/p/${kod}/kor${dil === 'tr' ? '' : `?${DIL_PARAMETRE}=${dil}`}`}
          onSonuc={() => setKamera(false)}
          onYenidenCek={kameraylaBasla}
          onKapat={() => setKamera(false)}
        />
      )}
    </div>
  );
}

function KorListeSonuc({ kod, listeAdi, sahip, sira, onTekrar }: {
  kod: string; listeAdi: string; sahip: string | null; sira: KorKayit[]; onTekrar: () => void;
}) {
  const mesajlar = useMesajlar();
  const t = mesajlar.korListe;
  const k = mesajlar.kor;
  const dil = useDilim();
  const { user } = useAuth();
  const s = korSonucYaz(sira);
  const uyum = useMemo(() => korUyum(sira), [sira]);
  const [gorsel, setGorsel] = useState<File | null>(null);
  const [bildirim, setBildirim] = useState<string | null>(null);

  // Görsel sonuç ekranı açılınca hazırlanıyor: iOS paylaşım menüsünü yalnızca dokunuşun
  // hemen ardından açıyor (KorOyun ile aynı gerekçe).
  useEffect(() => {
    let iptal = false;
    fetch(`/p/${kod}/kor/gorsel?s=${s}&${DIL_PARAMETRE}=${dil}`)
      .then(y => (y.ok ? y.blob() : Promise.reject(new Error(String(y.status)))))
      .then(b => {
        if (!iptal) setGorsel(new File([b], `${t.dosyaAdi(slugify(listeAdi) || 'liste')}.png`, { type: 'image/png' }));
      })
      .catch(() => { /* görsel yoksa yalnızca bağlantı paylaşılır */ });
    return () => { iptal = true; };
  }, [kod, s, dil, t, listeAdi]);

  useEffect(() => {
    if (!bildirim) return;
    const z = setTimeout(() => setBildirim(null), 2400);
    return () => clearTimeout(z);
  }, [bildirim]);

  const paylas = async () => {
    const dilEki = dil === 'tr' ? '' : `&${DIL_PARAMETRE}=${dil}`;
    const url = `${window.location.origin}/p/${kod}/kor?s=${s}${dilEki}`;
    const metin = t.paylasim(listeAdi, uyum);
    try {
      if (gorsel && navigator.canShare?.({ files: [gorsel] })) {
        await navigator.share({ files: [gorsel], text: `${metin} ${url}` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: listeAdi, text: metin, url });
        return;
      }
      await navigator.clipboard.writeText(`${metin} ${url}`);
      setBildirim(k.kopyalandi);
    } catch { /* menü kapatıldı */ }
  };

  const indir = () => {
    if (!gorsel) return;
    const u = URL.createObjectURL(gorsel);
    const a = document.createElement('a');
    a.href = u;
    a.download = gorsel.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };

  return (
    <main className="kor-sonuc">
      <h1 className="kor-sonuc-baslik">{t.seninSiralaman}</h1>

      {uyum !== null && (
        <div className="kor-uyum">
          <strong>%{uyum}</strong>
          <span>
            <b>{t.uyumIle(sahip)} · {uyumEtiketi(uyum)}</b>
            {k.uyumMetni(uyum)}
          </span>
        </div>
      )}

      <p className="kor-lejant">{t.lejant}</p>
      <ol className="kor-liste kor-kendi-liste">
        {sira.map((kayit, i) => (
          <li key={kayit.id} className={i === 0 ? 'is-bir' : ''} style={{ '--i': i } as React.CSSProperties}>
            <i>{i + 1}</i>
            <Foto kayit={kayit} className="kor-yuva-resim" />
            <span>{tamAd(kayit)}</span>
            <em title={t.sahibininSirasi}>{kayit.sahipSirasi !== null ? `${kayit.sahipSirasi}.` : <abbr title={t.asla}>×</abbr>}</em>
          </li>
        ))}
      </ol>

      <div className="kor-islemler">
        <button type="button" className="btn-primary" onClick={paylas}>{k.paylas}</button>
        {gorsel && <button type="button" className="btn-quiet kor-indir" onClick={indir}>{k.gorseliIndir}</button>}
        <button type="button" className="btn-quiet" onClick={onTekrar}>{k.tekrar}</button>
        <Link href={`/p/${kod}`} className="btn-quiet">{t.listeyiGor}</Link>
      </div>

      <Link href="/" className="kor-davet">
        {user ? (
          <>
            <strong>{k.listelerimeDon}</strong>
            <span>{k.listelerimeDonAlt}</span>
          </>
        ) : (
          <>
            <strong>{k.listeKur}</strong>
            <span>{k.listeKurAlt}</span>
          </>
        )}
      </Link>

      {bildirim && <div className="toast" role="status">{bildirim}</div>}
    </main>
  );
}
