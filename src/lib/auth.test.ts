import { describe, expect, it } from 'vitest';
import { sonGirisSaglayicisi } from './auth';

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
