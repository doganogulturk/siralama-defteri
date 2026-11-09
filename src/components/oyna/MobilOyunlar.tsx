'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import KorOyun from '@/components/KorOyun';
import TierOyun from '@/components/TierOyun';
import DogruSiraOyun from '@/components/DogruSiraOyun';
import SayiOyun from '@/components/SayiOyun';
import { korAdresi, tierAdresi, tohumluAdres } from '@/lib/oyun-adresi';

/*
 * Uygulama paketinde (statik, `*.mobil.tsx`) oyun sayfaları: adresteki tohum ve arkadaşın sonucu
 * sunucuda değil burada okunuyor; kural webdekiyle aynı (`lib/oyun-adresi.ts`). Her bağlantı
 * oyunu baştan kuruyor (anahtar). `useSearchParams` statik çizimde Suspense sınırı istiyor.
 */

const Sinir = ({ children }: { children: React.ReactNode }) => <Suspense fallback={null}>{children}</Suspense>;

function useAdres() {
  const a = useSearchParams();
  const t = a.get('t');
  const s = a.get('s');
  return { t, s, anahtar: `${t ?? ''}|${s ?? ''}` };
}

function Kor({ slug }: { slug: string }) {
  const { t, s, anahtar } = useAdres();
  const adres = korAdresi(slug, t, s);
  if (!adres) return null;
  return <KorOyun key={anahtar} slug={slug} tohum={adres.tohum} arkadas={adres.sonuc} />;
}

function Tier({ slug, kor }: { slug: string; kor: boolean }) {
  const { t, s, anahtar } = useAdres();
  const adres = tierAdresi(slug, kor, t, s);
  if (!adres) return null;
  return <TierOyun key={anahtar} slug={slug} kor={kor} tohum={adres.tohum} arkadas={adres.arkadas} />;
}

function DogruSira({ slug }: { slug: string }) {
  const { t, s, anahtar } = useAdres();
  const adres = tohumluAdres(t, s);
  return <DogruSiraOyun key={anahtar} slug={slug} tohum={adres.tohum} arkadas={adres.sonuc?.dizilis ?? null} />;
}

function Sayilar() {
  const { t, s, anahtar } = useAdres();
  const adres = tohumluAdres(t, s);
  return <SayiOyun key={anahtar} tohum={adres.tohum} arkadas={adres.sonuc?.dizilis ?? null} />;
}

export const KorMobil = ({ slug }: { slug: string }) => <Sinir><Kor slug={slug} /></Sinir>;
export const TierMobil = ({ slug, kor }: { slug: string; kor: boolean }) => <Sinir><Tier slug={slug} kor={kor} /></Sinir>;
export const DogruSiraMobil = ({ slug }: { slug: string }) => <Sinir><DogruSira slug={slug} /></Sinir>;
export const SayilarMobil = () => <Sinir><Sayilar /></Sinir>;
