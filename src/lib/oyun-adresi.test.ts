import { describe, expect, it } from 'vitest';
import { korAdresi, tierAdresi, tohumluAdres } from './oyun-adresi';

describe('oyun adresi (web sunucusu ve uygulama paketi aynı kuralla okuyor)', () => {
  it('Kör Sıralama: katalogda olmayan liste null; tohumsuz zevk listesi sonucu ilk onla çözülüyor', () => {
    expect(korAdresi('yok', null, null)).toBeNull();
    const a = korAdresi('corbalar', null, '0-1-2-3-4-5-6-7-8-9')!;
    expect(a.tohum).toBeNull();
    expect(a.sonuc).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(korAdresi('corbalar', 'rabc123', null)!.tohum).toBe('rabc123');
    expect(korAdresi('corbalar', 'gecersiz tohum', null)!.tohum).toBeNull();
  });

  it('Kör Sıralama: doğru cevabı olan listede tohumsuz sonuç geçersiz', () => {
    expect(korAdresi('ulke-nufusu', null, '0-1-2-3-4-5-6-7-8-9')!.sonuc).toBeNull();
  });

  it('Tier ve Kör Tier: Kör Tier sınırı', () => {
    expect(tierAdresi('corbalar', false, null, '0000000000')!.arkadas).toEqual(new Array(10).fill(0));
    expect(tierAdresi('corbalar', true, null, '0000000000')!.arkadas).toBeNull();
    expect(tierAdresi('yok', false, null, null)).toBeNull();
  });

  it('Doğru Sıra ve Sayılar: tohumsuz diziliş yok sayılıyor, yalnızca tohum oynatıyor', () => {
    expect(tohumluAdres(null, '0-1-2')).toEqual({ tohum: null, sonuc: null });
    expect(tohumluAdres('g20261109', null)).toEqual({ tohum: 'g20261109', sonuc: null });
    expect(tohumluAdres('g20261109', '0-1-2-3-4-5-6-7-8-9')!.sonuc!.dizilis).toHaveLength(10);
  });
});
