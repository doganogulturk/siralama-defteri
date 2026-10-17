import { ImageResponse } from 'next/og';
import { brandInitials } from '../../../types/item';
import { PaylasilanKayit, tamlayan } from '../../../lib/paylasim';
import { paylasilanListe } from '../../../lib/paylasim-sunucu';
import { RENK, fotoVerisi, yaziTipleri } from '../../../lib/gorsel-sunucu';

/*
 * WhatsApp önizleme kartının görseli: sahibin adı, listenin adı ve fotoğraflarıyla
 * ilk üç. Uygulamanın açık temasından sabit renkler — görsel temayı izleyemez.
 */

export const dynamic = 'force-dynamic';
export const alt = 'Sıralamanın ilk üçü';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function Basamak({ kayit, sira, foto }: { kayit: PaylasilanKayit; sira: number; foto: string | null }) {
  const sampiyon = sira === 1;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '14px 28px 14px 18px',
        borderRadius: 22,
        background: sampiyon ? RENK.vurguYikama : RENK.yuzey,
        border: `2px solid ${sampiyon ? '#f3c3ad' : RENK.cizgi}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: 56,
          fontFamily: 'Instrument Serif',
          fontSize: sampiyon ? 72 : 60,
          lineHeight: 1,
          color: RENK.vurgu,
        }}
      >
        {sira}
      </div>
      {foto ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={foto} width={92} height={92} style={{ borderRadius: 16, objectFit: 'cover' }} />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 92,
            height: 92,
            borderRadius: 16,
            background: RENK.yuzey2,
            color: RENK.soluk,
            fontSize: 30,
          }}
        >
          {brandInitials(kayit.ad)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 40,
            color: RENK.murekkep,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {kayit.ad}
        </div>
        {kayit.alt_ad && (
          <div style={{ fontSize: 26, color: RENK.soluk, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kayit.alt_ad}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function Gorsel({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const [liste, fonts] = await Promise.all([paylasilanListe(kod), yaziTipleri()]);

  const ilkUc = liste ? liste.kayitlar.filter(k => !k.asla).slice(0, 3) : [];
  const fotolar = await Promise.all(ilkUc.map(k => fotoVerisi(k.fotograf_url)));
  const sahip = liste?.sahip ? `${tamlayan(liste.sahip)} sıralaması` : 'Bir sıralama';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '56px 72px',
          gap: 64,
          background: RENK.zemin,
          color: RENK.murekkep,
          fontFamily: 'Geist',
        }}
      >
        {/* Sol: kimin, hangi liste */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 6,
                width: 52,
                height: 52,
                padding: '0 10px',
                borderRadius: 14,
                background: RENK.murekkep,
              }}
            >
              <div style={{ width: 32, height: 7, borderRadius: 4, background: RENK.vurgu }} />
              <div style={{ width: 23, height: 7, borderRadius: 4, background: RENK.zemin }} />
              <div style={{ width: 14, height: 7, borderRadius: 4, background: RENK.zemin }} />
            </div>
            <div style={{ fontSize: 28, color: RENK.murekkep }}>Sıralama Defteri</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 30, color: RENK.soluk }}>{liste ? sahip : 'Sıralama Defteri'}</div>
            <div
              style={{
                fontFamily: 'Instrument Serif',
                fontSize: (liste?.ad.length ?? 0) > 14 ? 88 : 116,
                lineHeight: 0.95,
                letterSpacing: -1,
              }}
            >
              {liste ? liste.ad : 'Liste bulunamadı'}
            </div>
          </div>
        </div>

        {/* Sağ: ilk üç */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18, flex: 1, minWidth: 0 }}>
          {ilkUc.length > 0 ? (
            ilkUc.map((k, i) => <Basamak key={k.id} kayit={k} sira={i + 1} foto={fotolar[i]} />)
          ) : (
            <div style={{ display: 'flex', fontSize: 36, color: RENK.soluk }}>Henüz sıralama yok.</div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
