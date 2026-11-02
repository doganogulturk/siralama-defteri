import { describe, expect, it } from 'vitest';
import { gercekYerler, katalog, katalogListesi, oyunSecimi, tohumGerekli } from './katalog';
import {
  KOR_TIER_SINIR, ayniKademe, dogruKademeler, tierCoz, tierGruplari, tierYaz, yakinKademe,
} from './tier-oyun';

describe('katalog', () => {
  it('slug benzersiz; zevk listeleri ve doğru cevabı olanlar bir arada', () => {
    const k = katalog('tr');
    expect(new Set(k.map(l => l.slug)).size).toBe(k.length);
    expect(k.some(l => l.dogru === null)).toBe(true);
    expect(k.some(l => l.dogru !== null)).toBe(true);
  });

  it('her listede oyun on madde: zevk listesi olduğu gibi, büyük havuz tohumdan', () => {
    for (const l of katalog('tr')) {
      const secim = oyunSecimi(l, 'g20261102');
      expect(secim.length, l.slug).toBe(10);
      expect(new Set(secim).size).toBe(10);
    }
    const corba = katalogListesi('corbalar', 'tr')!;
    expect(tohumGerekli(corba)).toBe(false);
    expect(oyunSecimi(corba, null)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const nufus = katalogListesi('ulke-nufusu', 'tr')!;
    expect(tohumGerekli(nufus)).toBe(true);
    expect(oyunSecimi(nufus, null)).toEqual([]);
  });

  it('gerçek yerler: doğru cevabı olan listede bir permütasyon, zevk listesinde yok', () => {
    const nufus = katalogListesi('ulke-nufusu', 'tr')!;
    const yer = gercekYerler(nufus, oyunSecimi(nufus, 'rabc123'))!;
    expect([...yer].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(gercekYerler(katalogListesi('corbalar', 'tr')!, [0, 1])).toBeNull();
  });
});

describe('tier oyunu', () => {
  it('yazma ve çözme; Kör Tier sınırı', () => {
    const k = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
    expect(tierCoz(tierYaz(k))).toEqual(k);
    expect(tierCoz(tierYaz(k), KOR_TIER_SINIR)).toEqual(k);
    expect(tierCoz('0000000000')).toEqual(new Array(10).fill(0));
    expect(tierCoz('0000000000', KOR_TIER_SINIR)).toBeNull();
    expect(tierCoz('01234')).toBeNull();
    expect(tierCoz('0123456789')).toBeNull();
    expect(tierCoz(null)).toBeNull();
  });

  it('gerçek kademeler: gerçek sıra beşe bölünüyor', () => {
    expect(dogruKademeler([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    expect(dogruKademeler([9, 0, 5, 4, 1, 2, 3, 6, 7, 8])).toEqual([4, 0, 2, 2, 0, 1, 1, 3, 3, 4]);
  });

  it('aynı ve yakın kademe sayıları, gruplar', () => {
    const a = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];
    const b = [0, 2, 2, 4, 4, 1, 1, 0, 3, 3];
    expect(ayniKademe(a, b)).toBe(5);
    expect(yakinKademe(a, b)).toBe(9);
    expect(tierGruplari([0, null, 2, 0, 4])).toEqual([[0, 3], [], [2], [], [4]]);
  });
});
