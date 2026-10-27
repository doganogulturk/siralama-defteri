import { defineConfig } from 'vitest/config';

/*
 * Yalnızca saf mantık (`src/lib`) test ediliyor. Supabase istemcisi modül yüklenirken
 * kuruluyor; adres boşsa hata verir, o yüzden sahte bir adres. Ağa hiçbir istek gitmiyor:
 * Supabase'e dokunan testler istemciyi taklit ediyor.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test',
    },
  },
});
