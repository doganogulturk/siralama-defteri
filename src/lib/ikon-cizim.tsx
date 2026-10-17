import { ImageResponse } from 'next/og';

/*
 * Uygulama ikonunun PNG hâlleri (`app/icon.svg` ile aynı çizim): ana ekran
 * (manifest) ve iOS (apple-icon). Koyu zemin, üstte vurgu renginde uzun çubuk,
 * altında kısalan iki çubuk — bir sıralamanın ilk üçü.
 */
const MUREKKEP = '#1a1512';
const VURGU = '#e64611';
const ZEMIN = '#f8f7f4';

/**
 * `tamZemin`: köşesiz, zemin kenara kadar. Android "maskable" ikonu kendi biçimiyle
 * (daire, yuvarlak kare) kesiyor; iOS da köşeleri kendisi yuvarlıyor. Bu yüzden çubuklar
 * ortadaki güvenli alanda (kenarın ~%20 içi) kalıyor.
 */
export function ikonGorseli(boyut: number, { tamZemin = false } = {}) {
  // svg 32 birimlik: tam zeminde çizim güvenli alana sığsın diye küçülüyor.
  const olcek = (boyut / 32) * (tamZemin ? 0.72 : 1);
  const cubuk = (en: number, renk: string) => (
    <div style={{ width: en * olcek, height: 4.5 * olcek, borderRadius: 2.25 * olcek, background: renk }} />
  );
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: tamZemin ? MUREKKEP : 'transparent',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 1.75 * olcek,
            width: 32 * olcek,
            height: 32 * olcek,
            padding: `0 ${6 * olcek}px`,
            borderRadius: tamZemin ? 0 : 8 * olcek,
            background: MUREKKEP,
          }}
        >
          {cubuk(20, VURGU)}
          {cubuk(14.5, ZEMIN)}
          {cubuk(9, ZEMIN)}
        </div>
      </div>
    ),
    { width: boyut, height: boyut },
  );
}
