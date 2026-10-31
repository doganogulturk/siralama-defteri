import { describe, expect, it } from 'vitest';
import {
  ADET, gununTohumu, puanla, rastgeleTohum, sayilariUret, tohumGecerli, tohumTarihi,
  yerlesimCoz, yerlesimYaz,
} from './sayilar';

describe('sayılar', () => {
  it('aynı tohum aynı on farklı sayıyı veriyor', () => {
    const a = sayilariUret('g20261031');
    expect(a).toEqual(sayilariUret('g20261031'));
    expect(a).toHaveLength(ADET);
    expect(new Set(a).size).toBe(ADET);
    expect(a.every(n => n >= 1 && n <= 100)).toBe(true);
    expect(sayilariUret('g20261101')).not.toEqual(a);
  });

  it('günün tohumu İstanbul saatine göre', () => {
    // UTC 21:30 → İstanbul'da ertesi gün 00:30
    expect(gununTohumu(new Date('2026-10-31T21:30:00Z'))).toBe('g20261101');
    expect(gununTohumu(new Date('2026-10-31T20:30:00Z'))).toBe('g20261031');
    expect(tohumTarihi('g20261031')).toBe('2026-10-31');
    expect(tohumTarihi('rabc123')).toBeNull();
  });

  it('tohum biçimi denetleniyor', () => {
    expect(tohumGecerli('g20261031')).toBe(true);
    expect(tohumGecerli(rastgeleTohum())).toBe(true);
    expect(tohumGecerli('x')).toBe(false);
    expect(tohumGecerli('g2026')).toBe(false);
    expect(tohumGecerli(null)).toBe(false);
  });

  it('yerleşim bir permütasyon olmalı', () => {
    expect(yerlesimCoz(yerlesimYaz([3, 0, 7, 1, 2, 4, 5, 6, 8, 9]))).toEqual([3, 0, 7, 1, 2, 4, 5, 6, 8, 9]);
    expect(yerlesimCoz('0-1-2')).toBeNull();
    expect(yerlesimCoz('0-0-2-3-4-5-6-7-8-9')).toBeNull();
    expect(yerlesimCoz('0-1-2-3-4-5-6-7-8-10')).toBeNull();
  });

  it('puan en uzun artan alt dizi: tek erken hata bütün oyunu sıfırlamıyor', () => {
    const kusursuz = puanla([3, 12, 25, 40, 51, 66, 70, 82, 90, 97]);
    expect(kusursuz.puan).toBe(10);
    expect(kusursuz.yerinde.every(Boolean)).toBe(true);

    const erkenHata = puanla([50, 3, 12, 25, 40, 66, 70, 82, 90, 97]);
    expect(erkenHata.puan).toBe(9);
    expect(erkenHata.yerinde[0]).toBe(false);
    expect(erkenHata.dogrusu).toEqual([3, 12, 25, 40, 50, 66, 70, 82, 90, 97]);

    // Kullanıcının örneği: 90'dan büyüğü gelir diye 9'a koydu, gelmedi; daha küçüğü 10'a düştü.
    const ornek = puanla([5, 14, 22, 31, 47, 58, 63, 77, 90, 85]);
    expect(ornek.puan).toBe(9);
    expect(ornek.yerinde.filter(x => !x)).toHaveLength(1);

    expect(puanla([97, 90, 82, 70, 66, 51, 40, 25, 12, 3]).puan).toBe(1);
  });

  it('eşit uzunlukta diziler arasından tam yerinde duranları içereni seçiyor', () => {
    // Doğrusu 2,10,22,40,46,47,53,80,91,94: 80 sekizinci yuvada tam yerinde.
    const p = puanla([10, 91, 53, 46, 2, 94, 22, 80, 47, 40]);
    expect(p.puan).toBe(3);
    expect(p.yerinde[7]).toBe(true);
  });
});
