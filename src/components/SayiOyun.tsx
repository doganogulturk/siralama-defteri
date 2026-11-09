'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import OyunSahnesi from '@/components/oyna/OyunSahnesi';
import OyunGeri from '@/components/oyna/OyunGeri';
import {
  ADET, SAYILAR_RENK, gunlukMu, gununTohumu, puanla, rastgeleTohum, sayilariUret, tarihYaz,
  tohumTarihi, yerlesimCoz, yerlesimYaz,
} from '@/lib/sayilar';
import { DIL_PARAMETRE, dilEtiketi } from '@/lib/i18n';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';
import { titret } from '@/lib/his';
import { useAuth } from '@/hooks/useAuth';
import { paylasimKoku, sunucuAdresi } from '@/lib/site';

type Asama = 'giris' | 'oyun' | 'sonuc';

/** Günlük oyunun sonucu bu cihazda: aynı gün tekrar açınca sonuç gösterilsin. */
const depoAnahtari = (tohum: string) => `siralama-defteri:sayilar:${tohum}`;
const depoOku = (tohum: string) => {
  try { return yerlesimCoz(localStorage.getItem(depoAnahtari(tohum))); } catch { return null; }
};
const depoYaz = (tohum: string, sira: number[]) => {
  try { localStorage.setItem(depoAnahtari(tohum), yerlesimYaz(sira)); } catch { /* gizli pencere */ }
};

/**
 * Sayılar: 1–100 arasından on sayı birer birer geliyor, her biri hemen bir yuvaya
 * konuyor ve yeri değişmiyor; amaç küçükten büyüğe dizmek. Kör Sıralama'nın oyun
 * ekranıyla aynı parçalar (`kor-*` sınıfları), yalnızca kayıt yerine sayı ve sonunda puan.
 *
 * Bağlantı bir sonuç taşıyorsa (`?t=&s=`) arkadaşın sayılarıyla oynanıyor ve sonunda iki
 * puan yan yana. Günün tohumu ilk çizimde değil etkide hesaplanıyor: sayfa sunucuda da
 * çiziliyor, gece yarısı iki taraf farklı gün görebilirdi.
 */
export default function SayiOyun({ tohum: adresTohumu, arkadas }: { tohum: string | null; arkadas: number[] | null }) {
  const dil = useDilim();
  const mesajlar = useMesajlar();
  const t = mesajlar.sayilar;
  const k = mesajlar.kor;
  const [asama, setAsama] = useState<Asama>('giris');
  const [tohum, setTohum] = useState<string | null>(adresTohumu);
  const [gunun, setGunun] = useState<string | null>(null);
  const [bugunku, setBugunku] = useState<number[] | null>(null);
  const [adim, setAdim] = useState(0);
  const [yuvalar, setYuvalar] = useState<(number | null)[]>(() => new Array(ADET).fill(null));
  const [yeniYuva, setYeniYuva] = useState<number | null>(null);
  const [kilit, setKilit] = useState(false);

  useEffect(() => {
    const g = gununTohumu();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGunun(g);
    setBugunku(depoOku(g));
  }, []);

  const sayilar = useMemo(() => (tohum ? sayilariUret(tohum) : []), [tohum]);

  const basla = (yeniTohum: string) => {
    titret('dokunus');
    setTohum(yeniTohum);
    setAdim(0);
    setYuvalar(new Array(ADET).fill(null));
    setYeniYuva(null);
    setAsama('oyun');
  };

  /** Bugün oynanmış günlük oyunun sonucunu yeniden göster. */
  const bugunkuSonuc = () => {
    if (!gunun || !bugunku) return;
    const s = sayilariUret(gunun);
    setTohum(gunun);
    setYuvalar(bugunku.map(i => s[i]));
    setAsama('sonuc');
  };

  const yerlestir = (yuva: number) => {
    if (kilit || yuvalar[yuva] !== null || asama !== 'oyun' || !tohum) return;
    const yeni = [...yuvalar];
    yeni[yuva] = sayilar[adim];
    setYuvalar(yeni);
    setYeniYuva(yuva);
    titret('dokunus');
    setKilit(true);
    setTimeout(() => {
      setKilit(false);
      if (adim + 1 >= ADET) {
        if (gunlukMu(tohum) && !arkadas) {
          const sira = (yeni as number[]).map(n => sayilar.indexOf(n));
          depoYaz(tohum, sira);
          setBugunku(sira);
        }
        setAsama('sonuc');
        titret('basari');
      } else {
        setAdim(a => a + 1);
      }
    }, 380);
  };

  const arkadasPuani = useMemo(() => {
    if (!arkadas || !adresTohumu) return null;
    const s = sayilariUret(adresTohumu);
    return puanla(arkadas.map(i => s[i])).puan;
  }, [arkadas, adresTohumu]);

  return (
    <div className="kor" style={{ '--kor': SAYILAR_RENK } as React.CSSProperties}>
      <header className="kor-bar">
        <OyunGeri etiket={k.listeler} />
        <span className="kor-bar-ad">
          <em>{k.ad}</em>
          {asama !== 'giris' && <strong>🔢 {t.ad}</strong>}
        </span>
        <span className="kor-bar-sayac" aria-live="polite">
          {asama === 'oyun' ? `${adim + 1}/${ADET}` : ''}
        </span>
      </header>

      {asama === 'giris' && (
        <main className="kor-giris">
          <OyunSahnesi tur="sayi" renk={SAYILAR_RENK} simge="🔢" etiket={k.ad} />
          <h1 className="kor-giris-baslik">{t.ad}</h1>
          {arkadasPuani !== null && <p className="kor-arkadas">{t.arkadas(arkadasPuani)}</p>}
          <ul className="kor-kurallar">
            <li><b>1</b><span>{t.kural1}</span></li>
            <li><b>2</b><span>{t.kural2[0]}<strong>{t.kural2[1]}</strong>{t.kural2[2]}</span></li>
            <li><b>3</b><span>{t.kural3}</span></li>
          </ul>

          {adresTohumu ? (
            <button type="button" className="btn-primary kor-basla" onClick={() => basla(adresTohumu)}>
              {k.basla}
            </button>
          ) : (
            <div className="sayi-secenek">
              {gunun && (bugunku ? (
                <button type="button" className="sayi-gunun is-oynandi" onClick={bugunkuSonuc}>
                  <strong>{t.bugunOynadin(puanla(bugunku.map(i => sayilariUret(gunun)[i])).puan)}</strong>
                  <span>{t.sonucuGor} →</span>
                </button>
              ) : (
                <button type="button" className="sayi-gunun" onClick={() => basla(gunun)}>
                  <strong>{t.gunun}</strong>
                  <span>{t.gununAlt(tarihYaz(tohumTarihi(gunun)!, dilEtiketi(dil)))}</span>
                </button>
              ))}
              <button type="button" className="btn-quiet sayi-serbest" onClick={() => basla(rastgeleTohum())}>
                {t.serbest}
              </button>
            </div>
          )}
        </main>
      )}

      {asama === 'oyun' && (
        <main className="kor-oyun">
          <div className="kor-sahne">
            <div key={adim} className={`kor-kart sayi-kart${kilit ? ' is-gidiyor' : ''}`}>
              <span className="kor-kart-no">{t.kacinciSayi(adim + 1)}</span>
              <strong>{sayilar[adim]}</strong>
            </div>
            <p className="kor-soru">{t.soru}</p>
          </div>

          <ol className="kor-yuvalar sayi-yuvalar" aria-label={k.siralama}>
            {yuvalar.map((n, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`kor-yuva${n !== null ? ' is-dolu' : ''}${yeniYuva === i ? ' is-yeni' : ''}`}
                  onClick={() => yerlestir(i)}
                  disabled={n !== null || kilit}
                  aria-label={n !== null ? `${i + 1}. ${n}` : t.siraya(i + 1)}
                >
                  <i>{i + 1}</i>
                  <span>{n ?? ''}</span>
                </button>
              </li>
            ))}
          </ol>
        </main>
      )}

      {asama === 'sonuc' && tohum && (
        <SayiSonuc
          tohum={tohum}
          yuvalar={yuvalar as number[]}
          arkadasPuani={arkadasPuani}
          onYeni={() => basla(rastgeleTohum())}
        />
      )}
    </div>
  );
}

function SayiSonuc({ tohum, yuvalar, arkadasPuani, onYeni }: {
  tohum: string; yuvalar: number[]; arkadasPuani: number | null; onYeni: () => void;
}) {
  const mesajlar = useMesajlar();
  const t = mesajlar.sayilar;
  const k = mesajlar.kor;
  const dil = useDilim();
  const { user } = useAuth();
  const { puan, yerinde, dogrusu } = useMemo(() => puanla(yuvalar), [yuvalar]);
  const s = useMemo(() => {
    const sayilar = sayilariUret(tohum);
    return yerlesimYaz(yuvalar.map(n => sayilar.indexOf(n)));
  }, [tohum, yuvalar]);
  const tarih = tohumTarihi(tohum);
  const [gorsel, setGorsel] = useState<File | null>(null);
  const [bildirim, setBildirim] = useState<string | null>(null);

  // Görsel sonuç ekranı açılınca hazırlanıyor: iOS paylaşım menüsünü yalnızca dokunuşun
  // hemen ardından açıyor (KorOyun ile aynı gerekçe).
  useEffect(() => {
    let iptal = false;
    fetch(sunucuAdresi(`/oyna/sayilar/gorsel?t=${tohum}&s=${s}&${DIL_PARAMETRE}=${dil}`))
      .then(y => (y.ok ? y.blob() : Promise.reject(new Error(String(y.status)))))
      .then(b => { if (!iptal) setGorsel(new File([b], `${t.dosyaAdi}.png`, { type: 'image/png' })); })
      .catch(() => { /* görsel yoksa yalnızca bağlantı paylaşılır */ });
    return () => { iptal = true; };
  }, [tohum, s, dil, t]);

  useEffect(() => {
    if (!bildirim) return;
    const z = setTimeout(() => setBildirim(null), 2400);
    return () => clearTimeout(z);
  }, [bildirim]);

  const paylas = async () => {
    const dilEki = dil === 'tr' ? '' : `&${DIL_PARAMETRE}=${dil}`;
    const url = `${paylasimKoku()}/oyna/sayilar?t=${tohum}&s=${s}${dilEki}`;
    const metin = tarih ? t.paylasimGunluk(puan, tarihYaz(tarih, dilEtiketi(dil))) : t.paylasimSerbest(puan);
    try {
      if (gorsel && navigator.canShare?.({ files: [gorsel] })) {
        await navigator.share({ files: [gorsel], text: `${metin} ${url}` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: t.baslik, text: metin, url });
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
      <div className={`sayi-puan${puan === ADET ? ' is-kusursuz' : ''}`}>
        <strong>{puan}<small>/{ADET}</small></strong>
        <span>
          <b>{t.puanEtiketi(puan)}</b>
          {puan === ADET ? t.kusursuzMetni : t.puanMetni(puan)}
        </span>
      </div>

      {arkadasPuani !== null && (
        <p className="sayi-kiyas">
          <b>{t.kiyas(puan, arkadasPuani)}</b> {t.arkadasPuani(arkadasPuani)}
        </p>
      )}

      <ol className="kor-liste sayi-liste">
        {yuvalar.map((n, i) => (
          <li key={i} className={yerinde[i] ? '' : 'is-yanlis'} style={{ '--i': i } as React.CSSProperties}>
            <i>{i + 1}</i>
            <span>{n}</span>
            {/* Tam yerindeki sayı dizinin dışında kalsa bile "doğrusu" kendisi olurdu: yazma. */}
            {!yerinde[i] && n !== dogrusu[i] && <em title={t.yanlis}>{t.dogrusu(dogrusu[i])}</em>}
          </li>
        ))}
      </ol>

      <div className="kor-islemler">
        <button type="button" className="btn-primary" onClick={paylas}>{k.paylas}</button>
        {gorsel && <button type="button" className="btn-quiet kor-indir" onClick={indir}>{k.gorseliIndir}</button>}
        <button type="button" className="btn-quiet" onClick={onYeni}>{t.yeniSayilar}</button>
        <Link href="/oyna" className="btn-quiet">{k.baskaListe}</Link>
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
