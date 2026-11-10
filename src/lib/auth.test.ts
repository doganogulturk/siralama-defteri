import { describe, expect, it } from 'vitest';
import { appleAdi, nonceOzeti, nonceUret, sonGirisSaglayicisi } from './auth';

describe('sonGirisSaglayicisi', () => {
  it('en son girilen kimliğin sağlayıcısı', () => {
    expect(sonGirisSaglayicisi([
      { provider: 'google', last_sign_in_at: '2026-11-01T10:00:00Z' },
      { provider: 'apple', last_sign_in_at: '2026-11-09T12:00:00Z' },
    ])).toBe('apple');
    expect(sonGirisSaglayicisi([
      { provider: 'apple', last_sign_in_at: '2026-11-01T10:00:00Z' },
      { provider: 'google', last_sign_in_at: '2026-11-09T12:00:00Z' },
    ])).toBe('google');
  });

  it('kimlik yoksa null; tarihsiz kimlik en eskisi sayılıyor', () => {
    expect(sonGirisSaglayicisi(undefined)).toBeNull();
    expect(sonGirisSaglayicisi([])).toBeNull();
    expect(sonGirisSaglayicisi([
      { provider: 'apple' },
      { provider: 'google', last_sign_in_at: '2026-11-09T12:00:00Z' },
    ])).toBe('google');
  });
});

describe('Apple nonce', () => {
  it('her seferinde başka, onaltılık', () => {
    const a = nonceUret();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(nonceUret()).not.toBe(a);
  });
  it('özet SHA-256 onaltılık', async () => {
    expect(await nonceOzeti('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('appleAdi', () => {
  it('ad ve soyad tek satırda', () => {
    expect(appleAdi('Ayşe', 'Yılmaz')).toBe('Ayşe Yılmaz');
    expect(appleAdi(' Ayşe ', null)).toBe('Ayşe');
  });
  it('ikisi de yoksa null', () => {
    expect(appleAdi(undefined, '')).toBeNull();
  });
});
