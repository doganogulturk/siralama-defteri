'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Link from 'next/link';
import { useListeler, siralanan } from '../hooks/useListeler';
import ListeEkleModal from './ListeEkleModal';
import Marka from './Marka';
import { KATEGORISIZ } from '../lib/filtre';
import { Kategori, brandInitials } from '../types/item';
import { messages } from '../lib/i18n';

const ArtiIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const OkIkon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/** Açık listenin kategorileri: rayın ağacında filtre olarak. */
export interface RayKategorileri {
  kategoriler: Kategori[];
  /** Açık sekmedeki kayıtların kategori başına sayısı. */
  sayilar: Record<string, number>;
  toplam: number;
  kategorisizAdet: number;
  /** Seçili kategori; `null` "Tümü", `KATEGORISIZ` kategorisizler. */
  secili: string | null;
  onSec: (id: string | null) => void;
}

interface ListeRayiProps {
  /** Rayda vurgulanacak liste. */
  aktifSlug?: string;
  /** Açık listenin kategori ağacı; yoksa liste satırı açılmıyor. */
  aktifKategoriler?: RayKategorileri;
}

/**
 * Masaüstü sol rayı: künye, liste ağacı ve yeni liste düğmesi. Sensetorial'ın
 * doküman ağacından: her liste bir dal, açık olan liste kendi kategorileriyle açık
 * doğuyor (kategoriye basmak sıralamayı süzüyor), diğer listelerin oku ilk üçünü
 * gösteriyor. Satırın kendisi listeye gidiyor, ok yalnızca dalı açıp kapatıyor.
 */
export default function ListeRayi({ aktifSlug, aktifKategoriler }: ListeRayiProps) {
  const { listeler, sayilar, load } = useListeler();
  const [formAcik, setFormAcik] = useState(false);
  /** Kullanıcının elle açıp kapattığı dallar; açık listenin dalı varsayılan olarak açık. */
  const [dallar, setDallar] = useState<Record<string, boolean>>({});
  const m = messages();

  const dalAcik = (id: string, aktif: boolean) => dallar[id] ?? aktif;
  const dalDegistir = (id: string, aktif: boolean) =>
    setDallar(prev => ({ ...prev, [id]: !dalAcik(id, aktif) }));

  return (
    <>
      <aside className="rail">
        <Link href="/" className="rail-brand">
          <Marka />
        </Link>

        <p className="rail-baslik">
          {m.ray.listeler} <span>{listeler.length}</span>
        </p>

        <nav className="rail-index" aria-label={m.ray.listeler}>
          {listeler.map(l => {
            const aktif = l.slug === aktifSlug;
            const ozet = sayilar[l.id];
            const sampiyon = ozet?.ilkUc[0];
            const acik = dalAcik(l.id, aktif);
            const dalId = `ray-dal-${l.id}`;
            const ak = aktif ? aktifKategoriler : undefined;
            // Açık listede dal kategoriler; diğerlerinde ilk üç. Boş dalın oku yok.
            const dalVar = ak ? ak.kategoriler.length > 0 || ak.kategorisizAdet > 0 : (ozet?.ilkUc.length ?? 0) > 0;
            return (
              <div key={l.id} className={`rail-index-item${aktif ? ' is-on' : ''}${acik && dalVar ? ' is-acik' : ''}`}>
                <div className="rail-index-satir">
                  <Link
                    href={`/l/${l.slug}`}
                    className="rail-index-link"
                    aria-current={aktif ? 'page' : undefined}
                  >
                    <span className="rail-index-kapak" aria-hidden="true">
                      {sampiyon?.fotograf_url
                        ? <img src={sampiyon.fotograf_url} alt="" loading="lazy" />
                        : brandInitials(l.ad)}
                    </span>
                    <span className="rail-index-metin">
                      <span className="rail-index-ad">{l.ad}</span>
                      {sampiyon && <span className="rail-index-sampiyon">{sampiyon.ad}</span>}
                    </span>
                    <span className="rail-index-sayi">{siralanan(ozet)}</span>
                  </Link>
                  {dalVar && (
                    <button
                      type="button"
                      className="rail-dal-ok"
                      aria-expanded={acik}
                      aria-controls={dalId}
                      aria-label={acik ? m.ray.daralt(l.ad) : m.ray.genislet(l.ad)}
                      onClick={() => dalDegistir(l.id, aktif)}
                    >
                      {OkIkon}
                    </button>
                  )}
                </div>

                {dalVar && acik && (
                  <ul id={dalId} className="rail-dal">
                    {ak ? (
                      <>
                        <RayDali
                          ad={m.filtre.tumu}
                          sayi={ak.toplam}
                          secili={ak.secili === null}
                          onClick={() => ak.onSec(null)}
                        />
                        {ak.kategoriler.map(k => (
                          <RayDali
                            key={k.id}
                            ad={k.ad}
                            sayi={ak.sayilar[k.id] ?? 0}
                            secili={ak.secili === k.id}
                            onClick={() => ak.onSec(ak.secili === k.id ? null : k.id)}
                          />
                        ))}
                        {(ak.kategorisizAdet > 0 || ak.secili === KATEGORISIZ) && (
                          <RayDali
                            ad={m.filtre.kategorisiz}
                            sayi={ak.kategorisizAdet}
                            secili={ak.secili === KATEGORISIZ}
                            silik
                            onClick={() => ak.onSec(ak.secili === KATEGORISIZ ? null : KATEGORISIZ)}
                          />
                        )}
                      </>
                    ) : (
                      ozet?.ilkUc.map((k, i) => (
                        <li key={k.id}>
                          <Link href={`/l/${l.slug}`} className="rail-dal-oge">
                            <span className="rail-dal-sira">{i + 1}</span>
                            <span className="rail-dal-ad">{k.ad}</span>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <button type="button" className="rail-add" onClick={() => setFormAcik(true)}>
          {ArtiIkon}{m.menu.yeniListe}
        </button>
        <Link href="/kor" className="rail-oyun">{m.ray.korOyna}</Link>
      </aside>

      <ListeEkleModal isOpen={formAcik} onClose={() => setFormAcik(false)} onCreated={load} />
    </>
  );
}

function RayDali({ ad, sayi, secili, silik, onClick }: {
  ad: string; sayi: number; secili: boolean; silik?: boolean; onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={`rail-dal-oge${secili ? ' is-on' : ''}${silik ? ' is-silik' : ''}`}
        aria-pressed={secili}
        onClick={onClick}
      >
        <span className="rail-dal-ad">{ad}</span>
        <span className="rail-dal-sayi">{sayi}</span>
      </button>
    </li>
  );
}
