'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item, Kademe, brandInitials } from '@/types/item';
import { KademeGrubu, kademeSirasi, kademeTonu } from '@/lib/kademe';
import { messages } from '@/lib/i18n';
import Sheet from '@/components/Sheet';

/*
 * Kademelerin (tier list) liste ekranındaki parçaları: rozet, dikey listedeki ayırıcı,
 * kademe görünümü (her kademe bir satır) ve "dokun, kademeyi seç" penceresi.
 * Renk tek vurgu renginin tonları: en üstteki dolu, aşağı indikçe soluk (`kademeTonu`).
 */

/** Sıralanabilir listedeki ayırıcının kimliği; kademesiz grup için `-`. */
export const kademeKimligi = (anahtar: string | null) => `kademe:${anahtar ?? '-'}`;

/** Kademenin rengi CSS değişkeni olarak; koyu tonda yazı açık renk. */
export function kademeStili(sira: number, toplam: number): { style: React.CSSProperties; koyu: boolean } {
  const ton = kademeTonu(sira, toplam);
  return { style: { '--ton': `${ton}%` } as React.CSSProperties, koyu: ton >= 55 };
}

/** Kademenin harfi/adı renkli bir kutuda. Kademesiz: soluk tire. */
export function KademeRozet({ kademe, kademeler, boyut = 'orta' }: {
  kademe: Kademe | null;
  kademeler: Kademe[];
  boyut?: 'kucuk' | 'orta' | 'buyuk';
}) {
  if (!kademe) {
    return <span className={`kademe-rozet is-${boyut} is-kademesiz`} aria-label={messages().kademe.kademesiz}>–</span>;
  }
  const { style, koyu } = kademeStili(kademeSirasi(kademeler, kademe.anahtar), kademeler.length);
  return (
    <span className={`kademe-rozet is-${boyut}${koyu ? ' is-koyu' : ''}`} style={style}>
      {kademe.etiket}
    </span>
  );
}

function SiniriIcerik({ kademe, kademeler, adet, bosIpucu }: {
  kademe: Kademe | null; kademeler: Kademe[]; adet: number; bosIpucu: boolean;
}) {
  const t = messages().kademe;
  return (
    <>
      <KademeRozet kademe={kademe} kademeler={kademeler} />
      <span className="kademe-siniri-ad">{kademe ? '' : t.kademesiz}</span>
      {adet > 0
        ? <span className="kademe-siniri-sayi">{adet}</span>
        : <span className="kademe-siniri-bos">{bosIpucu ? t.bosSurukle : t.bos}</span>}
    </>
  );
}

/** Filtreli görünümdeki kademe başlığı: sürükleme yok. */
export function KademeSiniri({ kademe, kademeler, adet }: { kademe: Kademe | null; kademeler: Kademe[]; adet: number }) {
  return (
    <div className="kademe-siniri" role="separator" aria-label={kademe ? messages().kademe.kademesi(kademe.etiket) : messages().kademe.kademesiz}>
      <SiniriIcerik kademe={kademe} kademeler={kademeler} adet={adet} bosIpucu={false} />
    </div>
  );
}

/**
 * Filtresiz görünümdeki kademe başlığı: "Bir daha asla" çizgisi gibi sıralanabilir
 * listenin sürüklenemeyen bir öğesi. Kayıtlar onun üstünden geçebiliyor; bırakınca
 * kayıt üstündeki son başlığın kademesine giriyor (`diziyiCoz`).
 */
export function SuruklenebilirKademeSiniri({ kademe, kademeler, adet }: {
  kademe: Kademe | null; kademeler: Kademe[]; adet: number;
}) {
  const { setNodeRef, transform, transition } = useSortable({
    id: kademeKimligi(kademe?.anahtar ?? null),
    disabled: { draggable: true, droppable: false },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="kademe-siniri"
      role="separator"
      aria-label={kademe ? messages().kademe.kademesi(kademe.etiket) : messages().kademe.kademesiz}
    >
      <SiniriIcerik kademe={kademe} kademeler={kademeler} adet={adet} bosIpucu />
    </div>
  );
}

function Kutucuk({ item, rank, asla, onSec }: { item: Item; rank: number; asla?: boolean; onSec: (i: Item) => void }) {
  return (
    <button type="button" className={`kademe-kutu${asla ? ' is-asla' : ''}`} onClick={() => onSec(item)}>
      {item.fotograf_url
        ? <img src={item.fotograf_url} className="kademe-kutu-foto" alt="" />
        : <span className="kademe-kutu-foto is-bos" aria-hidden="true">{brandInitials(item.ad)}</span>}
      {!asla && <i className="kademe-kutu-no">{rank}</i>}
      <span className="kademe-kutu-ad">{item.ad}{item.alt_ad && <small> {item.alt_ad}</small>}</span>
    </button>
  );
}

/**
 * Kademe görünümü: her kademe bir satır, solda renkli etiket, sağda kayıtlar kutucuk
 * kutucuk. Kademesizler ve "Bir daha asla" doluysa en altta. Kutucuğa dokunmak kademe
 * seçicisini açıyor; sürükleme bu görünümde yok (liste görünümünde var).
 */
export function KademeTablosu({ gruplar, kademeler, siraNo, asla, onSec, onAslaSec }: {
  gruplar: KademeGrubu<Item>[];
  kademeler: Kademe[];
  /** Kaydın sıralamadaki numarası (filtre uygulanmamış sıralamada). */
  siraNo: (item: Item) => number;
  asla: Item[];
  onSec: (item: Item) => void;
  onAslaSec: (item: Item) => void;
}) {
  const m = messages();
  return (
    <div className="kademe-tablo">
      {gruplar.filter(g => g.kademe || g.items.length > 0).map(g => (
        <section className="kademe-satir" key={kademeKimligi(g.kademe?.anahtar ?? null)}
                 aria-label={g.kademe ? m.kademe.kademesi(g.kademe.etiket) : m.kademe.kademesiz}>
          <KademeRozet kademe={g.kademe} kademeler={kademeler} boyut="buyuk" />
          <div className="kademe-satir-kayitlar">
            {g.items.map(item => <Kutucuk key={item.id} item={item} rank={siraNo(item)} onSec={onSec} />)}
            {g.items.length === 0 && <span className="kademe-satir-bos">{m.kademe.bos}</span>}
          </div>
        </section>
      ))}
      {asla.length > 0 && (
        <section className="kademe-satir is-asla" aria-label={m.satir.birDahaAsla}>
          <span className="kademe-rozet is-buyuk is-asla" aria-hidden="true">×</span>
          <div className="kademe-satir-kayitlar">
            {asla.map(item => <Kutucuk key={item.id} item={item} rank={0} asla onSec={onAslaSec} />)}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * "Dokun, kademeyi seç": kademe görünümünde bir kayda dokununca açılan küçük pencere.
 * Telefonda kademeler arası sürüklemenin yerini tutuyor. Kademesiz seçeneği yalnızca
 * kayıt zaten kademesizse görünüyor.
 */
export function KademeSecici({ item, kademeler, onSec, onAyrinti, onClose }: {
  item: Item;
  kademeler: Kademe[];
  onSec: (anahtar: string | null) => void;
  onAyrinti: () => void;
  onClose: () => void;
}) {
  const m = messages();
  const simdiki = kademeSirasi(kademeler, item.kademe);
  const secenekler: (Kademe | null)[] = [...kademeler, ...(simdiki === kademeler.length ? [null] : [])];
  return (
    <Sheet onClose={onClose} className="form-screen-short" label={m.kademe.seciciBaslik(item.ad)}>
      <header className="form-screen-header">
        <button type="button" className="form-screen-back" onClick={onClose} aria-label={m.genel.kapat}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 className="form-screen-title">{item.ad}</h2>
        <span className="form-screen-header-spacer" />
      </header>
      <div className="form-screen-body kademe-secici">
        <div className="kademe-secenekler" role="group" aria-label={m.kademe.baslik}>
          {secenekler.map(k => {
            const secili = kademeSirasi(kademeler, k?.anahtar) === simdiki;
            return (
              <button
                key={kademeKimligi(k?.anahtar ?? null)}
                type="button"
                className={`kademe-secenek${secili ? ' is-on' : ''}`}
                aria-pressed={secili}
                aria-label={k ? m.kademe.kademesi(k.etiket) : m.kademe.kademesiz}
                onClick={() => (secili ? onClose() : onSec(k?.anahtar ?? null))}
              >
                <KademeRozet kademe={k} kademeler={kademeler} boyut="buyuk" />
              </button>
            );
          })}
        </div>
        <button type="button" className="btn-quiet" onClick={onAyrinti}>{m.kademe.ayrinti}</button>
      </div>
    </Sheet>
  );
}
