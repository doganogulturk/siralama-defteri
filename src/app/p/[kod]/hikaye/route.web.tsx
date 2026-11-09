import { ImageResponse } from 'next/og';
import { brandInitials } from '@/types/item';
import { PaylasilanKayit, iyelik } from '@/lib/paylasim';
import { DIL_PARAMETRE, sozluk } from '@/lib/i18n';
import { baglantiDili } from '@/lib/i18n/sunucu';
import { paylasilanListe } from '@/lib/paylasim-sunucu';
import { RENK, fotoVerisi, yaziTipleri } from '@/lib/gorsel-sunucu';
import { GorselLogo as Logo } from '@/lib/gorsel-parcalari';
import { kademeliMi } from '@/lib/kademe';
import { KademeHikayesi } from '@/lib/kademe-gorsel';

/*
 * Instagram / WhatsApp story görseli (1080×1920): şampiyon büyük ve fotoğraflı,
 * altında 2–5, en altta "sen nasıl sıralardın" çağrısı ve sitenin adresi. Story'de
 * bağlantı tıklanmıyor; adres, bağlantı çıkartması eklenene kadar yol gösteriyor.
 * Paylaşım kapalıysa ya da kod yoksa 404 — görsel de sayfa gibi yalnızca bağlantıyla.
 * Listede kademeler açıksa bunun yerine tier tablosu çiziliyor (`lib/kademe-gorsel.tsx`).
 */

export const dynamic = 'force-dynamic';

const GENISLIK = 1080;
const YUKSEKLIK = 1920;

function Kutu({ kayit, foto, boyut, yaricap }: {
  kayit: PaylasilanKayit; foto: string | null; boyut: number; yaricap: number;
}) {
  return foto ? (
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    <img
      src={foto}
      width={boyut}
      height={boyut}
      style={{ borderRadius: yaricap, objectFit: 'contain', background: RENK.yuzey2 }}
    />
  ) : (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: boyut, height: boyut, borderRadius: yaricap,
        background: RENK.yuzey2, color: RENK.soluk, fontSize: boyut * 0.3,
      }}
    >
      {brandInitials(kayit.ad)}
    </div>
  );
}

const tekSatir = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const;

export async function GET(istek: Request, { params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const [liste, fonts] = await Promise.all([paylasilanListe(kod), yaziTipleri()]);
  if (!liste) return new Response('Bulunamadı', { status: 404 });

  const dil = baglantiDili(new URL(istek.url).searchParams.get(DIL_PARAMETRE));
  const site = new URL(istek.url).host;

  // Kademeler açıksa story bir tier tablosu (`lib/kademe-gorsel.tsx`).
  if (kademeliMi(liste.kademeler)) {
    return new ImageResponse(await KademeHikayesi({ liste, kademeler: liste.kademeler, dil, site }), {
      width: GENISLIK, height: YUKSEKLIK, fonts, headers: { 'Cache-Control': 'no-store' },
    });
  }

  const ilkBes = liste.kayitlar.filter(k => !k.asla).slice(0, 5);
  const fotolar = await Promise.all(ilkBes.map(k => fotoVerisi(k.fotograf_url)));
  const [sampiyon, ...kalanlar] = ilkBes;
  const t = sozluk(dil);
  const sahip = t.paylasimSayfasi.storySahibi(liste.sahip ? iyelik(liste.sahip.split(' ')[0], dil) : null);
  const adBoyu = liste.ad.length > 16 ? 120 : liste.ad.length > 10 ? 150 : 190;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
          // Üst ve alt ~200 px'i Instagram'ın kendi arayüzü kaplıyor: içerik güvenli alanda.
          padding: '200px 84px 220px', background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist',
        }}
      >
        <Logo />

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 56 }}>
          <div style={{ fontSize: 44, color: RENK.soluk }}>{sahip}</div>
          <div
            style={{
              fontFamily: 'Instrument Serif', fontSize: adBoyu, lineHeight: 0.92, letterSpacing: -2, marginTop: 8,
            }}
          >
            {liste.ad}
          </div>
        </div>

        {sampiyon ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 40, marginTop: 48, padding: 32,
              borderRadius: 44, background: RENK.vurguYikama, border: '3px solid #f3c3ad',
            }}
          >
            <Kutu kayit={sampiyon} foto={fotolar[0]} boyut={260} yaricap={30} />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Instrument Serif', fontSize: 150, lineHeight: 0.8, color: RENK.vurgu }}>1</div>
              <div style={{ fontSize: 30, color: RENK.vurgu, marginTop: 14, letterSpacing: 4 }}>{t.paylasimSayfasi.sampiyonEtiket}</div>
              <div style={{ fontSize: 62, lineHeight: 1.05, marginTop: 14 }}>{sampiyon.ad}</div>
              {sampiyon.alt_ad && (
                <div style={{ fontSize: 36, color: RENK.soluk, marginTop: 6, ...tekSatir }}>{sampiyon.alt_ad}</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', marginTop: 64, fontSize: 48, color: RENK.soluk }}>{t.paylasimSayfasi.siralamaYok}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
          {kalanlar.map((k, i) => (
            <div
              key={k.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 28, padding: '12px 32px 12px 24px',
                borderRadius: 30, background: RENK.yuzey, border: `2px solid ${RENK.cizgi}`,
              }}
            >
              <div
                style={{
                  display: 'flex', justifyContent: 'center', width: 64,
                  fontFamily: 'Instrument Serif', fontSize: 76, lineHeight: 1, color: RENK.vurgu,
                }}
              >
                {i + 2}
              </div>
              <Kutu kayit={k} foto={fotolar[i + 1]} boyut={96} yaricap={18} />
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 46, ...tekSatir }}>{k.ad}</div>
                {k.alt_ad && <div style={{ fontSize: 30, color: RENK.soluk, ...tekSatir }}>{k.alt_ad}</div>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 48, alignItems: 'center' }}>
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 84, lineHeight: 1 }}>{t.paylasimSayfasi.nasilSiralardin}</div>
          <div style={{ fontSize: 36, color: RENK.soluk, marginTop: 18 }}>{site}</div>
        </div>
      </div>
    ),
    {
      width: GENISLIK,
      height: YUKSEKLIK,
      fonts,
      // Canlı: sıralama değiştikçe görsel de değişsin.
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
