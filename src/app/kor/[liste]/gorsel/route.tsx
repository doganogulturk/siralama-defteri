import { ImageResponse } from 'next/og';
import { korListesi, sonucCoz } from '../../../../lib/kor';
import { DIL_PARAMETRE, sozluk } from '../../../../lib/i18n';
import { baglantiDili } from '../../../../lib/i18n/sunucu';
import { RENK, yaziTipleri } from '../../../../lib/gorsel-sunucu';

/*
 * Kör Sıralama sonucunun görseli. Sonuç adreste (`?s=`), hiçbir şey kaydedilmiyor.
 *   • varsayılan: story (1080×1920) — on kaydın tamamı, şampiyon vurgulu;
 *   • `boyut=kart`: bağlantı önizlemesi (1200×630). Sonuç yoksa listenin kendisi.
 * Story'de üst ve alt ~200 px Instagram'ın arayüzüne kalıyor.
 */

export const dynamic = 'force-dynamic';

function Logo({ boyut = 60 }: { boyut?: number }) {
  const o = boyut / 60;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 * o }}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 7 * o,
          width: boyut, height: boyut, padding: `0 ${11 * o}px`, borderRadius: 16 * o, background: RENK.murekkep,
        }}
      >
        <div style={{ width: 38 * o, height: 8 * o, borderRadius: 4 * o, background: RENK.vurgu }} />
        <div style={{ width: 27 * o, height: 8 * o, borderRadius: 4 * o, background: RENK.zemin }} />
        <div style={{ width: 17 * o, height: 8 * o, borderRadius: 4 * o, background: RENK.zemin }} />
      </div>
      <div style={{ fontSize: 34 * o }}>Sıralama Defteri</div>
    </div>
  );
}

export async function GET(istek: Request, { params }: { params: Promise<{ liste: string }> }) {
  const { liste: slug } = await params;
  const adres = new URL(istek.url);
  // Görsel paylaşanın dilinde: bağlantı dili taşıyor.
  const dil = baglantiDili(adres.searchParams.get(DIL_PARAMETRE));
  const t = sozluk(dil).kor;
  const liste = korListesi(slug, dil);
  if (!liste) return new Response('Bulunamadı', { status: 404 });
  const sira = sonucCoz(liste, adres.searchParams.get('s'));
  const kart = adres.searchParams.get('boyut') === 'kart';
  if (!kart && !sira) return new Response('Sonuç geçersiz', { status: 400 });
  const fonts = await yaziTipleri();
  const site = adres.host;
  const etiket = (
    <div style={{ display: 'flex', fontSize: kart ? 26 : 34, letterSpacing: 4, color: liste.renk }}>
      {t.etiket}
    </div>
  );

  if (kart) {
    const adlar = sira ? sira.map(i => liste.kayitlar[i]) : liste.kayitlar;
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '56px 64px', gap: 56, background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 430 }}>
            <Logo boyut={52} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {etiket}
              <div style={{ fontFamily: 'Instrument Serif', fontSize: liste.ad.length > 12 ? 84 : 104, lineHeight: 0.95 }}>{liste.ad}</div>
              <div style={{ fontSize: 30, color: RENK.soluk }}>{sira ? t.nasilSiralardin : t.hicDegistirmeden}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignContent: 'center', gap: 10, flex: 1 }}>
            {adlar.map((ad, i) => (
              <div
                key={ad}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: 276, height: 76, padding: '0 18px',
                  borderRadius: 18, background: i === 0 && sira ? '#fcebe3' : RENK.yuzey,
                  border: `2px solid ${i === 0 && sira ? '#f3c3ad' : RENK.cizgi}`,
                }}
              >
                {sira && <div style={{ display: 'flex', width: 46, flexShrink: 0, fontFamily: 'Instrument Serif', fontSize: 42, color: RENK.vurgu }}>{String(i + 1)}</div>}
                <div style={{ display: 'flex', fontSize: ad.length > 14 ? 22 : 26 }}>{ad}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
          padding: '190px 84px 210px', background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist',
        }}
      >
        <Logo />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
          {etiket}
          <div style={{ fontFamily: 'Instrument Serif', fontSize: liste.ad.length > 12 ? 130 : 160, lineHeight: 0.92, letterSpacing: -2, marginTop: 6 }}>
            {liste.ad}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40 }}>
          {sira!.map((k, i) => {
            const bir = i === 0;
            return (
              <div
                key={k}
                style={{
                  display: 'flex', alignItems: 'center', gap: 26, height: bir ? 120 : 88, padding: '0 32px 0 22px',
                  borderRadius: 26, background: bir ? '#fcebe3' : RENK.yuzey,
                  border: `${bir ? 3 : 2}px solid ${bir ? '#f3c3ad' : RENK.cizgi}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', width: 64, fontFamily: 'Instrument Serif', fontSize: bir ? 86 : 62, lineHeight: 1, color: RENK.vurgu }}>
                  {String(i + 1)}
                </div>
                <div style={{ display: 'flex', fontSize: bir ? 56 : 44 }}>{liste.kayitlar[k]}</div>
                {bir && <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 26, letterSpacing: 3, color: RENK.vurgu }}>{t.sampiyon}</div>}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 36, alignItems: 'center' }}>
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 76, lineHeight: 1 }}>{t.nasilSiralardin}</div>
          <div style={{ fontSize: 34, color: RENK.soluk, marginTop: 14 }}>{`${site}/kor`}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } },
  );
}
