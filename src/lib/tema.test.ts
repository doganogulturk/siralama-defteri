import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TEMA_BETIGI, TEMA_DEPO, gorunenTema, kayitliTema, temaOzniteligi } from './tema';

describe('kayitliTema', () => {
  it('depo önce, sonra çerez, tanınmayan değer "sistem"', () => {
    expect(kayitliTema('koyu', 'acik')).toBe('koyu');
    expect(kayitliTema(null, 'acik')).toBe('acik');
    expect(kayitliTema('mor', undefined)).toBe('sistem');
    expect(kayitliTema(undefined, undefined)).toBe('sistem');
  });
});

describe('gorunenTema ve temaOzniteligi', () => {
  it('"sistem" cihazı izler, elle seçim cihazı ezer', () => {
    expect(gorunenTema('sistem', true)).toBe('koyu');
    expect(gorunenTema('sistem', false)).toBe('acik');
    expect(gorunenTema('acik', true)).toBe('acik');
    expect(gorunenTema('koyu', false)).toBe('koyu');
  });
  it('"sistem"de öznitelik yok', () => {
    expect(temaOzniteligi('sistem')).toBeUndefined();
    expect(temaOzniteligi('koyu')).toBe('koyu');
  });
});

describe('TEMA_BETIGI', () => {
  const calistir = (depodaki: string | null) => {
    const oznitelikler = new Map<string, string>([['data-tema', 'koyu']]);
    const ortam = {
      localStorage: { getItem: (k: string) => (k === TEMA_DEPO ? depodaki : null) },
      document: {
        documentElement: {
          setAttribute: (k: string, v: string) => oznitelikler.set(k, v),
          removeAttribute: (k: string) => oznitelikler.delete(k),
        },
      },
    };
    new Function('localStorage', 'document', TEMA_BETIGI)(ortam.localStorage, ortam.document);
    return oznitelikler.get('data-tema');
  };

  it('depodaki seçimi uygular', () => {
    expect(calistir('acik')).toBe('acik');
    expect(calistir('sistem')).toBeUndefined();
  });
  it('seçim yoksa sunucunun çizdiğine dokunmaz', () => {
    expect(calistir(null)).toBe('koyu');
  });
});

describe('globals.css', () => {
  const css = readFileSync('src/app/globals.css', 'utf8');
  const blok = (bas: string) => {
    const i = css.indexOf(bas);
    expect(i, bas).toBeGreaterThan(-1);
    const ic = css.slice(css.indexOf('{', i + bas.length - 1) + 1);
    // Girinti iki blokta farklı (biri @media içinde): satırlar kırpılarak karşılaştırılıyor.
    return ic.slice(0, ic.indexOf('}')).split('\n').map(s => s.trim()).join('\n').trim();
  };

  it('koyu renkler iki yerde aynı: sistem koyuyken ve elle "koyu" seçilince', () => {
    const sistem = blok(':root:not([data-tema="acik"]) {');
    const elle = blok(':root[data-tema="koyu"] {');
    expect(sistem.length).toBeGreaterThan(200);
    expect(elle).toBe(sistem);
  });
});

describe('iOS', () => {
  it('uygulamanın sayfa başında eklediği betik TEMA_BETIGI ile aynı', () => {
    const swift = readFileSync('ios/App/App/UygulamaViewController.swift', 'utf8');
    const betik = swift.match(/static let betik = """\n\s*(.*)\n\s*"""/)?.[1];
    expect(betik).toBe(TEMA_BETIGI);
  });
});
