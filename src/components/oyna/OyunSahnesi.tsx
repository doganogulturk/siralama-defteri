'use client';

import React from 'react';
import { klasikRenk } from '@/lib/kademe';

/*
 * Oyunların giriş ekranında, kuralların üstünde dönen küçük tanıtım kartı. Açılıştaki
 * tanıtımın sahneleriyle aynı dil (`Tanitim.tsx`): genel ikon değil, oyunun kendi
 * arayüzünden küçük, hareketli bir parça. Her mod kendi hareketini gösteriyor:
 *   • kor        — kart geliyor, boş bir yuvaya oturuyor (yeri bir daha değişmez);
 *   • sayi       — sayı geliyor, küçükten büyüğe dizideki yerine iniyor;
 *   • tier       — yerleştirilecekler arasından bir madde seçiliyor, kademesine çıkıyor;
 *   • kor-tier   — kart geliyor; S dolu, boş yeri olan kademeye oturuyor;
 *   • dogru-sira — üçüncü satır sürüklenip başa geçiyor, ardından doğru işaretleri.
 * Maddeler oynanacak listenin kendisinden (havuzun ilk dördü): kart tanıdık görünsün.
 * Hareket yalnızca CSS'te (`.os-*`; bir tur 8 saniye, ilk hamle `os-h1` ilk yarıda, ikincisi
 * `os-h2` ikinci yarıda); hareketi azaltmak isteyen cihazda kart durağan, son hâliyle.
 */

export type SahneTuru = 'kor' | 'sayi' | 'tier' | 'kor-tier' | 'dogru-sira';

export default function OyunSahnesi({ tur, renk, simge, etiket, maddeler = [] }: {
  tur: SahneTuru;
  /** Listenin ya da oyunun rengi (`--kor`). */
  renk: string;
  simge: string;
  /** Kartın başlığında modun adı. */
  etiket: string;
  /** Listenin ilk birkaç maddesi; sayılarda kullanılmıyor. */
  maddeler?: string[];
}) {
  const [a = '', b = '', c = '', d = ''] = maddeler;
  return (
    <div className="oyun-sahne" data-tur={tur} style={{ '--kor': renk } as React.CSSProperties} aria-hidden="true">
      <span className="os-bas"><span>{simge}</span>{etiket}</span>
      {tur === 'kor' && (
        <span className="os-govde os-kor">
          <span className="os-gelenler">
            <span className="os-gelen os-h1">{a}</span>
            <span className="os-gelen os-h2">{d}</span>
          </span>
          <span className="os-yuvalar">
            <span className="os-yuva is-dolu"><i>1</i>{b}</span>
            <span className="os-yuva os-hedef os-h2"><i>2</i><em>{d}</em></span>
            <span className="os-yuva os-hedef os-h1"><i>3</i><em>{a}</em></span>
            <span className="os-yuva is-dolu"><i>4</i>{c}</span>
          </span>
        </span>
      )}
      {tur === 'sayi' && (
        <span className="os-govde os-sayi">
          <span className="os-gelenler">
            <span className="os-gelen os-h1">47</span>
            <span className="os-gelen os-h2">28</span>
          </span>
          <span className="os-dizi">
            <span className="os-kutu is-dolu">12</span>
            <span className="os-kutu os-hedef os-h2"><em>28</em></span>
            <span className="os-kutu os-hedef os-h1"><em>47</em></span>
            <span className="os-kutu" />
            <span className="os-kutu is-dolu">81</span>
          </span>
          <span className="os-ok"><i>1</i><b /><i>100</i></span>
        </span>
      )}
      {tur === 'tier' && (
        <span className="os-govde os-tier">
          <KademeSatiri sira={0}><span className="os-hap">{b}</span></KademeSatiri>
          <KademeSatiri sira={1} hedef="os-h1"><span className="os-hap os-yeni os-h1">{a}</span></KademeSatiri>
          <KademeSatiri sira={2} hedef="os-h2"><span className="os-hap">{c}</span><span className="os-hap os-yeni os-h2">{d}</span></KademeSatiri>
          <span className="os-tepsi">
            <span className="os-hap os-giden os-h1">{a}</span>
            <span className="os-hap os-giden os-h2">{d}</span>
          </span>
        </span>
      )}
      {tur === 'kor-tier' && (
        <span className="os-govde os-kor-tier">
          <span className="os-gelenler">
            <span className="os-gelen os-h1">{a}</span>
            <span className="os-gelen os-h2">{d}</span>
          </span>
          <KademeSatiri sira={0} dolu><span className="os-hap">{b}</span><span className="os-hap">{c}</span></KademeSatiri>
          <KademeSatiri sira={1} hedef="os-h1"><span className="os-hap os-yeni os-h1">{a}</span></KademeSatiri>
          <KademeSatiri sira={2} hedef="os-h2"><span className="os-hap os-yeni os-h2">{d}</span></KademeSatiri>
        </span>
      )}
      {tur === 'dogru-sira' && (
        // Başta b, d, a, c; önce a başa çekiliyor (a, b, d, c), sonra c bir yukarı (a, b, c, d).
        <span className="os-govde os-dogru">
          <span className="os-nolar"><i>1</i><i>2</i><i>3</i><i>4</i></span>
          <span className="os-satirlar">
            <span className="os-satir os-ds-a">{a}<b>✓</b></span>
            <span className="os-satir os-ds-b">{b}<b>✓</b></span>
            <span className="os-satir os-ds-c">{c}<b>✓</b></span>
            <span className="os-satir os-ds-d">{d}<b>✓</b></span>
          </span>
        </span>
      )}
    </div>
  );
}

const KADEME = ['S', 'A', 'B'];

function KademeSatiri({ sira, hedef, dolu, children }: {
  /** Bu kademe hangi hamlenin hedefi (`os-h1` / `os-h2`). */
  sira: number; hedef?: 'os-h1' | 'os-h2'; dolu?: boolean; children?: React.ReactNode;
}) {
  return (
    <span className={`os-kademe${hedef ? ` os-hedef ${hedef}` : ''}${dolu ? ' is-dolu' : ''}`}>
      <b style={{ background: klasikRenk(sira) }}>{KADEME[sira]}</b>
      <span>{children}</span>
    </span>
  );
}
