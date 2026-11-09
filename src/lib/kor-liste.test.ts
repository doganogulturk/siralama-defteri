import { describe, expect, it } from 'vitest';
import { KOR_ADET, kisaKimlik, korSec, korSonucCoz, korSonucYaz, korUygun, korUyum } from './kor-liste';

const kayit = (i: number, sahipSirasi: number | null = i + 1) => ({
  id: `${String(i).padStart(8, '0')}-0000-4000-8000-000000000000`,
  sahipSirasi,
});

describe('kendi listeni kör sıralat', () => {
  it('on kayıttan kısa liste oynanamıyor', () => {
    expect(korUygun(9)).toBe(false);
    expect(korUygun(10)).toBe(true);
  });

  it('on farklı kayıt seçiyor', () => {
    const liste = Array.from({ length: 30 }, (_, i) => kayit(i));
    const secilen = korSec(liste);
    expect(secilen).toHaveLength(KOR_ADET);
    expect(new Set(secilen.map(k => k.id)).size).toBe(KOR_ADET);
  });

  it('sonuç kısa kimliklerle adreste, liste değişince silinen düşüyor', () => {
    const liste = Array.from({ length: 12 }, (_, i) => kayit(i));
    const sira = liste.slice(0, 10).reverse();
    const s = korSonucYaz(sira);
    expect(s.split('-')[0]).toBe(kisaKimlik(sira[0].id));
    expect(korSonucCoz(liste, s)?.map(k => k.id)).toEqual(sira.map(k => k.id));
    // İki kayıt silinmiş: kalan sekiz, sırası korunarak.
    const kalan = liste.filter((_, i) => i !== 9 && i !== 3);
    expect(korSonucCoz(kalan, s)).toHaveLength(8);
    expect(korSonucCoz(liste, 'bozuk')).toBeNull();
    expect(korSonucCoz(liste, null)).toBeNull();
  });

  it('uyum sahibinin sırasına göre; "Bir daha asla" en altta ve kendi içinde eşit', () => {
    const ayni = Array.from({ length: 10 }, (_, i) => kayit(i));
    expect(korUyum(ayni)).toBe(100);
    expect(korUyum([...ayni].reverse())).toBe(0);
    // İki "Bir daha asla" kaydı aralarında sayılmıyor, ikisi de sıralananların altında.
    const asla = [kayit(0, 1), kayit(1, 2), kayit(2, null), kayit(3, null)];
    expect(korUyum(asla)).toBe(100);
    // Aynı yerde duran kayıt başına eşit pay: dördüncü yerdeki "asla" yine asla bölgesinde.
    expect(korUyum([asla[2], asla[0], asla[1], asla[3]])).toBe(25);
    expect(korUyum([asla[0], asla[1], asla[3], asla[2]])).toBe(100);
  });
});
