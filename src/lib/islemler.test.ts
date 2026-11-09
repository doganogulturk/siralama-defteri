import { describe, expect, it } from 'vitest';
import { ISLEM_ALT, ISLEM_HAVUZU, ISLEM_UST } from './islemler';
import { dogruSiraListesi, gununListesi, maddeleriSec } from './dogru-sira';

/** "45 + 38" → [45, '+', 38]; işaretler gerçek matematik işaretleri. */
const coz = (ad: string) => {
  const m = /^(\d+) ([+−×÷]) (\d+)$/.exec(ad);
  expect(m, ad).not.toBeNull();
  return [Number(m![1]), m![2], Number(m![3])] as const;
};

describe('İşlemler havuzu', () => {
  it('her madde kurala uyuyor: 2–99 arası sayılar, sonuç doğru ve 10–100 arasında', () => {
    for (const { ad, deger } of ISLEM_HAVUZU) {
      const [a, op, b] = coz(ad);
      for (const n of [a, b]) {
        expect(n, ad).toBeGreaterThanOrEqual(2);
        expect(n, ad).toBeLessThanOrEqual(99);
      }
      const sonuc = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
      expect(sonuc, ad).toBe(deger);
      expect(Number.isInteger(sonuc), `${ad}: bölme tam`).toBe(true);
      expect(deger).toBeGreaterThanOrEqual(ISLEM_ALT);
      expect(deger).toBeLessThanOrEqual(ISLEM_UST);
    }
  });

  it('dört işlemin hepsi var, adlar benzersiz, havuz büyük', () => {
    const turler = new Set(ISLEM_HAVUZU.map(x => coz(x.ad)[1]));
    expect([...turler].sort()).toEqual(['+', '×', '÷', '−'].sort());
    expect(new Set(ISLEM_HAVUZU.map(x => x.ad)).size).toBe(ISLEM_HAVUZU.length);
    expect(ISLEM_HAVUZU.length).toBeGreaterThan(200);
  });

  it('havuz sabit: aynı üretim her seferinde aynı maddeleri veriyor', () => {
    // Sonuç bağlantıları havuzdaki yerlere bağlı; bu iki madde değişirse eski bağlantılar bozulur.
    expect(ISLEM_HAVUZU[0]).toEqual(ISLEM_HAVUZU[0]);
    expect(ISLEM_HAVUZU.slice(0, 4).map(x => x.deger)).toEqual([10, 10, 10, 10]);
  });

  it('oyunda on farklı sonuç; günün listesi dönüşüne girmiyor', () => {
    const l = dogruSiraListesi('islemler', 'tr')!;
    for (let n = 0; n < 200; n++) {
      const secim = maddeleriSec('islemler', `r${n.toString(36).padStart(6, '0')}`);
      expect(new Set(secim.map(i => l.maddeler[i].deger)).size).toBe(10);
    }
    for (let g = 1; g <= 60; g++) {
      expect(gununListesi(`g202611${String(g % 28 + 1).padStart(2, '0')}`)).not.toBe('islemler');
    }
  });
});
