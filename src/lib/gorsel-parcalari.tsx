import { RENK } from './gorsel-sunucu';

/*
 * Sunucuda çizilen görsellerin (next/og) ortak JSX parçaları. Satori'de her kutu
 * `display: flex` istiyor; renkler `RENK`ten, görsel temayı izleyemiyor.
 */

/** Marka işareti ve ad: görsellerin tepesinde. `boyut` işaretin kenarı (story'de 60). */
export function GorselLogo({ boyut = 60 }: { boyut?: number }) {
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

/** Rengi beyaza karıştırır (`oran` 0: renk, 1: beyaz): satori `color-mix` bilmiyor. */
export function acikTon(hex: string, oran: number): string {
  const n = parseInt(hex.slice(1), 16);
  const kanal = (k: number) => Math.round(k + (255 - k) * oran).toString(16).padStart(2, '0');
  return `#${kanal((n >> 16) & 255)}${kanal((n >> 8) & 255)}${kanal(n & 255)}`;
}
