import { RENK } from './gorsel-sunucu';

/*
 * Sunucuda çizilen görsellerin (next/og) ortak JSX parçaları. Satori'de her kutu
 * `display: flex` istiyor; renkler `RENK`ten, görsel temayı izleyemiyor.
 */

/** Marka işareti ve ad: story görsellerinin tepesinde. */
export function GorselLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 7,
          width: 60, height: 60, padding: '0 11px', borderRadius: 16, background: RENK.murekkep,
        }}
      >
        <div style={{ width: 38, height: 8, borderRadius: 4, background: RENK.vurgu }} />
        <div style={{ width: 27, height: 8, borderRadius: 4, background: RENK.zemin }} />
        <div style={{ width: 17, height: 8, borderRadius: 4, background: RENK.zemin }} />
      </div>
      <div style={{ fontSize: 34 }}>Sıralama Defteri</div>
    </div>
  );
}
