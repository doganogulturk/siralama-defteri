import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { brandInitials } from '../../../types/item';
import { PaylasilanKayit, guvenliFoto, tamlayan } from '../../../lib/paylasim';
import { paylasilanListe } from '../../../lib/paylasim-sunucu';

/*
 * WhatsApp önizleme kartının görseli: sahibin adı, listenin adı ve fotoğraflarıyla
 * ilk üç. Uygulamanın açık temasından sabit renkler — görsel temayı izleyemez.
 */

export const dynamic = 'force-dynamic';
export const alt = 'Sıralamanın ilk üçü';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const RENK = {
  zemin: '#f8f7f4',
  yuzey: '#ffffff',
  yuzey2: '#efede8',
  murekkep: '#1a1512',
  soluk: '#8a847d',
  cizgi: '#e6e3dd',
  vurgu: '#e64611',
  vurguYikama: '#fcebe3',
};

/** Fotoğraf indirme sınırları: yavaş ya da iri bir fotoğraf kartı bekletmesin. */
const FOTO_SURE_MS = 2500;
const FOTO_EN_BUYUK = 4 * 1024 * 1024;
/** Görsel motoru (satori) yalnızca bunları çizebiliyor; HEIC gibi biçimler baş harfe düşüyor. */
const FOTO_TURLERI = ['image/jpeg', 'image/png', 'image/gif'];

/**
 * Fotoğrafı sunucuda indirip görsele gömüyor. Motor adresi kendisi indirseydi
 * tek bir bozuk fotoğraf bütün görseli düşürürdü; burada sorunlu fotoğraf baş
 * harflere dönüyor. Yalnızca uygulamanın kendi kovasındaki adresler indiriliyor.
 */
async function fotoVerisi(url?: string | null): Promise<string | null> {
  const adres = guvenliFoto(url);
  if (!adres) return null;
  try {
    const yanit = await fetch(adres, { signal: AbortSignal.timeout(FOTO_SURE_MS), redirect: 'error' });
    const tur = yanit.headers.get('content-type')?.split(';')[0].trim() ?? '';
    if (!yanit.ok || !FOTO_TURLERI.includes(tur)) return null;
    if (Number(yanit.headers.get('content-length') ?? 0) > FOTO_EN_BUYUK) return null;
    const veri = await yanit.arrayBuffer();
    if (veri.byteLength > FOTO_EN_BUYUK) return null;
    return `data:${tur};base64,${Buffer.from(veri).toString('base64')}`;
  } catch {
    return null;
  }
}

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
  const [liste, sans, serif] = await Promise.all([
    paylasilanListe(kod),
    readFile(join(process.cwd(), 'src/fonts/Geist-Regular.ttf')),
    readFile(join(process.cwd(), 'src/fonts/InstrumentSerif-Regular.ttf')),
  ]);

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
      // Yazı tipi verilince motorun kendi Geist'i devreden çıkıyor: ikisi birlikte.
      fonts: [
        { name: 'Geist', data: sans, style: 'normal', weight: 400 },
        { name: 'Instrument Serif', data: serif, style: 'normal', weight: 400 },
      ],
    },
  );
}
