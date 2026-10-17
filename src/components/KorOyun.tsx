'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { KorListe, sonucYaz } from '../lib/kor';
import { kiyasAnahtari, kiyasla, uyumEtiketi } from '../lib/kiyas';
import { titret } from '../lib/his';

type Asama = 'giris' | 'oyun' | 'sonuc';

/** Fisher–Yates. */
function karistir<T>(dizi: T[]): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sıralama (kayıtların listedeki yerleri) → karşılaştırma kaydı. */
const kiyasKayitlari = (liste: KorListe, sira: number[]) =>
  sira.map((k, n) => ({ id: String(k), ad: liste.kayitlar[k], sira: n + 1 }));

/**
 * Kör Sıralama: kayıtlar birer birer, karışık sırayla geliyor; her biri hemen boş bir
 * sıraya yerleştiriliyor ve sonradan yeri değişmiyor. Sıradakinin ne olduğu bilinmiyor
 * — oyunun bütün gerilimi bu. On kayıt yerleşince sonuç: sıralama, paylaşılabilir
 * görsel ve (bağlantı bir arkadaştan geldiyse) onunla uyum yüzdesi.
 *
 * Karıştırma "Başla"da yapılıyor, ilk çizimde değil: sayfa sunucuda da çiziliyor,
 * rastgele bir sıra iki tarafta farklı çıkardı.
 */
export default function KorOyun({ liste, arkadas }: { liste: KorListe; arkadas: number[] | null }) {
  const n = liste.kayitlar.length;
  const [asama, setAsama] = useState<Asama>('giris');
  const [gelis, setGelis] = useState<number[]>([]);
  const [adim, setAdim] = useState(0);
  const [yuvalar, setYuvalar] = useState<(number | null)[]>(() => new Array(n).fill(null));
  /** Az önce dolan yuva: kısa bir parlama için. */
  const [yeniYuva, setYeniYuva] = useState<number | null>(null);
  const [kilit, setKilit] = useState(false);

  const basla = () => {
    titret('dokunus');
    setGelis(karistir(liste.kayitlar.map((_, i) => i)));
    setAdim(0);
    setYuvalar(new Array(n).fill(null));
    setYeniYuva(null);
    setAsama('oyun');
  };

  const yerlestir = (yuva: number) => {
    if (kilit || yuvalar[yuva] !== null || asama !== 'oyun') return;
    const kayit = gelis[adim];
    const yeni = [...yuvalar];
    yeni[yuva] = kayit;
    setYuvalar(yeni);
    setYeniYuva(yuva);
    titret(yuva === 0 ? 'sampiyon' : 'dokunus');
    // Kart çıkış animasyonu bitsin, sonra sıradaki gelsin.
    setKilit(true);
    setTimeout(() => {
      setKilit(false);
      if (adim + 1 >= n) {
        setAsama('sonuc');
        titret('basari');
      } else {
        setAdim(a => a + 1);
      }
    }, 380);
  };

  const sira = asama === 'sonuc' ? (yuvalar as number[]) : null;

  return (
    <div className="kor" style={{ '--kor': liste.renk } as React.CSSProperties}>
      <header className="kor-bar">
        <Link href="/kor" className="mobile-brand-back" aria-label="Listeler">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        {/* Girişte liste adı ortada büyük; başlıkta tekrarlanmasın. */}
        <span className="kor-bar-ad">
          <em>Kör Sıralama</em>
          {asama !== 'giris' && <strong>{liste.simge} {liste.ad}</strong>}
        </span>
        <span className="kor-bar-sayac" aria-live="polite">
          {asama === 'oyun' ? `${adim + 1}/${n}` : ''}
        </span>
      </header>

      {asama === 'giris' && (
        <KorGiris liste={liste} arkadas={arkadas} onBasla={basla} />
      )}

      {asama === 'oyun' && (
        <main className="kor-oyun">
          <div className="kor-sahne">
            {/* Anahtar her adımda değişiyor: kart yeniden doğup giriş animasyonunu oynatıyor. */}
            <div key={adim} className={`kor-kart${kilit ? ' is-gidiyor' : ''}`}>
              <span className="kor-kart-no">{adim + 1}. kayıt</span>
              <strong>{liste.kayitlar[gelis[adim]]}</strong>
            </div>
            <p className="kor-soru">Kaçıncı sıraya koyuyorsun?</p>
          </div>

          <ol className="kor-yuvalar" aria-label="Sıralama">
            {yuvalar.map((k, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`kor-yuva${k !== null ? ' is-dolu' : ''}${yeniYuva === i ? ' is-yeni' : ''}${i === 0 ? ' is-bir' : ''}`}
                  onClick={() => yerlestir(i)}
                  disabled={k !== null || kilit}
                  aria-label={k !== null ? `${i + 1}. ${liste.kayitlar[k]}` : `${i + 1}. sıraya koy`}
                >
                  <i>{i + 1}</i>
                  <span>{k !== null ? liste.kayitlar[k] : ''}</span>
                </button>
              </li>
            ))}
          </ol>
        </main>
      )}

      {asama === 'sonuc' && sira && (
        <KorSonuc liste={liste} sira={sira} arkadas={arkadas} onTekrar={basla} />
      )}
    </div>
  );
}

function KorGiris({ liste, arkadas, onBasla }: {
  liste: KorListe; arkadas: number[] | null; onBasla: () => void;
}) {
  return (
    <main className="kor-giris">
      <span className="kor-giris-simge" aria-hidden="true">{liste.simge}</span>
      <h1 className="kor-giris-baslik">{liste.ad}</h1>
      {arkadas && (
        <p className="kor-arkadas">
          Bir arkadaşın bu listeyi sıraladı. Sen de oyna, ne kadar uyuştuğunuzu gör.
        </p>
      )}
      <ul className="kor-kurallar">
        <li><b>1</b><span>On kayıt birer birer, karışık sırayla gelecek.</span></li>
        <li><b>2</b><span>Her birini hemen bir sıraya koy. Sonradan <strong>değiştiremezsin</strong>.</span></li>
        <li><b>3</b><span>Sıradakinin ne olduğunu bilmeden karar ver.</span></li>
      </ul>
      <button type="button" className="btn-primary kor-basla" onClick={onBasla}>Başla</button>
    </main>
  );
}

function KorSonuc({ liste, sira, arkadas, onTekrar }: {
  liste: KorListe; sira: number[]; arkadas: number[] | null; onTekrar: () => void;
}) {
  const s = sonucYaz(sira);
  const [gorsel, setGorsel] = useState<File | null>(null);
  const [bildirim, setBildirim] = useState<string | null>(null);

  const uyum = useMemo(() => {
    if (!arkadas) return null;
    const benim = kiyasKayitlari(liste, sira);
    return kiyasla(benim, kiyasKayitlari(liste, arkadas), new Set(benim.map(kiyasAnahtari))).uyum;
  }, [liste, sira, arkadas]);

  // Görsel sonuç ekranı açılınca hazırlanıyor: iOS paylaşım menüsünü yalnızca dokunuşun
  // hemen ardından açıyor, dokunuştan sonra indirmeye başlamak menüyü engellerdi.
  useEffect(() => {
    let iptal = false;
    fetch(`/kor/${liste.slug}/gorsel?s=${s}`)
      .then(y => (y.ok ? y.blob() : Promise.reject(new Error(String(y.status)))))
      .then(b => { if (!iptal) setGorsel(new File([b], `kor-siralama-${liste.slug}.png`, { type: 'image/png' })); })
      .catch(() => { /* görsel yoksa yalnızca bağlantı paylaşılır */ });
    return () => { iptal = true; };
  }, [liste.slug, s]);

  useEffect(() => {
    if (!bildirim) return;
    const t = setTimeout(() => setBildirim(null), 2400);
    return () => clearTimeout(t);
  }, [bildirim]);

  const paylas = async () => {
    const url = `${window.location.origin}/kor/${liste.slug}?s=${s}`;
    const metin = uyum !== null
      ? `${liste.ad} kör sıralamasında arkadaşımla %${uyum} uyuştuk. Sen de oyna:`
      : `${liste.ad} kör sıralamamı yaptım. Bakalım sen nasıl sıralayacaksın:`;
    try {
      if (gorsel && navigator.canShare?.({ files: [gorsel] })) {
        await navigator.share({ files: [gorsel], text: `${metin} ${url}` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: `Kör Sıralama: ${liste.ad}`, text: metin, url });
        return;
      }
      await navigator.clipboard.writeText(`${metin} ${url}`);
      setBildirim('Bağlantı kopyalandı');
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
      <h1 className="kor-sonuc-baslik">Senin sıralaman</h1>

      {uyum !== null && (
        <div className="kor-uyum">
          <strong>%{uyum}</strong>
          <span>
            <b>{uyumEtiketi(uyum)}</b>
            Her 100 ikilinin {uyum} tanesinde ikiniz de aynı olanı öne koydunuz.
          </span>
        </div>
      )}

      {arkadas && <p className="kor-lejant">Sağdaki sayılar arkadaşının sırası.</p>}
      <ol className="kor-liste">
        {sira.map((k, i) => {
          const onun = arkadas ? arkadas.indexOf(k) + 1 : null;
          return (
            <li key={k} className={i === 0 ? 'is-bir' : ''} style={{ '--i': i } as React.CSSProperties}>
              <i>{i + 1}</i>
              <span>{liste.kayitlar[k]}</span>
              {onun !== null && <em title="Arkadaşının sırası">{onun}.</em>}
            </li>
          );
        })}
      </ol>

      <div className="kor-islemler">
        <button type="button" className="btn-primary" onClick={paylas}>Paylaş</button>
        {gorsel && <button type="button" className="btn-quiet kor-indir" onClick={indir}>Görseli indir</button>}
        <button type="button" className="btn-quiet" onClick={onTekrar}>Tekrar oyna</button>
        <Link href="/kor" className="btn-quiet">Başka liste</Link>
      </div>

      <Link href="/" className="kor-davet">
        <strong>Kendi listelerini kur</strong>
        <span>Denediklerini fotoğraflarıyla sırala, arkadaşlarınla karşılaştır →</span>
      </Link>

      {bildirim && <div className="toast" role="status">{bildirim}</div>}
    </main>
  );
}
