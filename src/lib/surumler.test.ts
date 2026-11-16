import { describe, expect, it } from 'vitest';
import { GUNCEL_SURUM, SURUMLER, surumKarsilastir } from './surumler';

describe('surumKarsilastir', () => {
  it('sayı sayı karşılaştırır', () => {
    expect(surumKarsilastir('1.10', '1.9')).toBeGreaterThan(0);
    expect(surumKarsilastir('1.0', '1.0.0')).toBe(0);
    expect(surumKarsilastir('0.4', '1.0')).toBeLessThan(0);
  });
});

describe('SURUMLER', () => {
  it('en yenisi başta, numaralar kesin azalıyor', () => {
    for (let i = 1; i < SURUMLER.length; i++) {
      expect(surumKarsilastir(SURUMLER[i - 1].surum, SURUMLER[i].surum)).toBeGreaterThan(0);
    }
    expect(GUNCEL_SURUM).toBe(SURUMLER[0].surum);
  });

  it('her sürümün iki dilde de aynı sayıda maddesi ve tarihi var', () => {
    for (const s of SURUMLER) {
      expect(s.maddeler.tr.length).toBeGreaterThan(0);
      expect(s.maddeler.en.length).toBe(s.maddeler.tr.length);
      expect(s.tarih.tr && s.tarih.en).toBeTruthy();
    }
  });
});
