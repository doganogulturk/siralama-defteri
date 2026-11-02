'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  degerYaz, dogruDizi, dogruSiraListesi, maddeleriSec, puanla, yuzde, type DogruSiraListe,
} from '@/lib/dogru-sira';
import { gununTohumu, gunlukMu, rastgeleTohum, tarihYaz, tohumTarihi, yerlesimCoz, yerlesimYaz } from '@/lib/sayilar';
import { DIL_PARAMETRE, dilEtiketi } from '@/lib/i18n';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';
import { titret } from '@/lib/his';
import { useAuth } from '@/hooks/useAuth';
import ModGecisi from './oyna/ModGecisi';

type Asama = 'giris' | 'oyun' | 'sonuc';

/** Günlük oyunun sonucu bu cihazda: aynı gün tekrar açınca sonuç gösterilsin. */
export const dogruSiraDepoAnahtari = (tohum: string, slug: string) => `siralama-defteri:dogru-sira:${tohum}:${slug}`;
const depoOku = (tohum: string, slug: string) => {
  try { return yerlesimCoz(localStorage.getItem(dogruSiraDepoAnahtari(tohum, slug))); } catch { return null; }
};
const depoYaz = (tohum: string, slug: string, dizilis: number[]) => {
  try { localStorage.setItem(dogruSiraDepoAnahtari(tohum, slug), yerlesimYaz(dizilis)); } catch { /* gizli pencere */ }
};

/**
 * Doğru Sıra'nın oyunu: listenin havuzundan on madde karışık geliyor, oyuncu onları
 * sürükleyerek (ya da ok düğmeleriyle) diziyor, "Kontrol et"te gerçek sıra ve değerler
 * açılıyor. Mantık `lib/dogru-sira.ts`'te; Kör Sıralama'nın kabuğu (`kor-*`) ve renkleri.
 *
 * Bağlantı tohum taşıyorsa o maddelerle (günün oyunu ya da arkadaşın oyunu); sonuç da
 * taşıyorsa (`?s=`) arkadaşın puanı girişte ve sonunda yan yana. Günün tohumu etkide
 * hesaplanıyor: sayfa sunucuda da çiziliyor, gece yarısı iki taraf farklı gün görebilirdi.
 */
export default function DogruSiraOyun({ slug, tohum: adresTohumu, arkadas }: {
  slug: string; tohum: string | null; arkadas: number[] | null;
}) {
  const dil = useDilim();
  const mesajlar = useMesajlar();
  const t = mesajlar.dogruSira;
  const k = mesajlar.kor;
  const liste = dogruSiraListesi(slug, dil)!;
  const [asama, setAsama] = useState<Asama>('giris');
  const [tohum, setTohum] = useState<string | null>(adresTohumu);
  const [dizilis, setDizilis] = useState<number[]>([]);
  /** Bu cihazda bugün oynanmış sonuç (yalnızca günün tohumuyla açıldıysa). */
  const [bugunku, setBugunku] = useState<number[] | null>(null);

  useEffect(() => {
    if (!adresTohumu || arkadas || adresTohumu !== gununTohumu()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBugunku(depoOku(adresTohumu, slug));
  }, [adresTohumu, arkadas, slug]);

  const secim = useMemo(() => (tohum ? maddeleriSec(slug, tohum) : []), [slug, tohum]);

  const basla = (yeni: string) => {
    titret('dokunus');
    setTohum(yeni);
    setDizilis(maddeleriSec(slug, yeni).map((_, i) => i));
    setAsama('oyun');
  };

  const kontrol = () => {
    if (!tohum) return;
    titret('basari');
    if (gunlukMu(tohum) && !arkadas) {
      depoYaz(tohum, slug, dizilis);
      setBugunku(dizilis);
    }
    setAsama('sonuc');
  };

  const bugunkuSonuc = () => {
    if (!bugunku || !adresTohumu) return;
    setTohum(adresTohumu);
    setDizilis(bugunku);
    setAsama('sonuc');
  };

  const arkadasUyumu = useMemo(() => {
    if (!arkadas || !adresTohumu) return null;
    return puanla(liste, maddeleriSec(slug, adresTohumu), arkadas).uyum;
  }, [arkadas, adresTohumu, liste, slug]);

  const gunluk = tohum ? tohumTarihi(tohum) : null;

  return (
    <div className="kor dogru-sira" style={{ '--kor': liste.renk } as React.CSSProperties}>
      <header className="kor-bar">
        <Link href="/oyna" className="mobile-brand-back" aria-label={k.listeler}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className="kor-bar-ad">
          <em>{t.ad}</em>
          {asama !== 'giris' && <strong>{liste.simge} {liste.ad}</strong>}
        </span>
        <span className="kor-bar-sayac" />
      </header>

      {asama === 'giris' && (
        <main className="kor-giris">
          <span className="kor-giris-simge" aria-hidden="true">{liste.simge}</span>
          <h1 className="kor-giris-baslik">{liste.ad}</h1>
          {gunluk && !arkadas && <p className="kor-arkadas">{t.gunun} · {tarihYaz(gunluk, dilEtiketi(dil))}</p>}
          {arkadasUyumu !== null && <p className="kor-arkadas">{t.arkadas(arkadasUyumu)}</p>}
          <p className="ds-soru">{liste.soru}</p>
          <ul className="kor-kurallar">
            <li><b>1</b><span>{t.kural1}</span></li>
            <li><b>2</b><span>{t.kural2}</span></li>
            <li><b>3</b><span>{t.kural3}</span></li>
          </ul>
          {bugunku ? (
            <button type="button" className="sayi-gunun is-oynandi ds-bugun" onClick={bugunkuSonuc}>
              <strong>{t.bugunOynadin(puanla(liste, maddeleriSec(slug, adresTohumu!), bugunku).uyum)}</strong>
              <span>{t.sonucuGor} →</span>
            </button>
          ) : (
            <button type="button" className="btn-primary kor-basla" onClick={() => basla(adresTohumu ?? rastgeleTohum())}>
              {t.basla}
            </button>
          )}
          <p className="ds-kaynak">{t.kaynak(liste.kaynak)}</p>
        </main>
      )}

      {asama === 'oyun' && (
        <DogruSiraTahtasi
          liste={liste}
          secim={secim}
          dizilis={dizilis}
          onDegis={setDizilis}
          onKontrol={kontrol}
        />
      )}

      {asama === 'sonuc' && tohum && (
        <DogruSiraSonuc
          liste={liste}
          tohum={tohum}
          secim={secim}
          dizilis={dizilis}
          arkadasUyumu={arkadasUyumu}
          onYeni={() => basla(rastgeleTohum())}
        />
      )}
    </div>
  );
}

/* ── Oyun: sürükleyerek dizme ─────────────────────────── */

function DogruSiraTahtasi({ liste, secim, dizilis, onDegis, onKontrol }: {
  liste: DogruSiraListe;
  secim: number[];
  dizilis: number[];
  onDegis: (d: number[]) => void;
  onKontrol: () => void;
}) {
  const t = useMesajlar().dogruSira;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const kimlik = (k: number) => `m${k}`;

  const birak = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = dizilis.findIndex(k => kimlik(k) === active.id);
    const to = dizilis.findIndex(k => kimlik(k) === over.id);
    if (from !== -1 && to !== -1) onDegis(arrayMove(dizilis, from, to));
  };
  const kaydir = (i: number, yon: -1 | 1) => {
    const j = i + yon;
    if (j < 0 || j >= dizilis.length) return;
    titret('dokunus');
    onDegis(arrayMove(dizilis, i, j));
  };

  return (
    <main className="ds-oyun">
      <p className="ds-soru">{liste.soru}</p>
      <p className="ds-uc is-ust" aria-hidden="true">▲ {liste.ust}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => titret('dokunus')} onDragEnd={birak}>
        <SortableContext items={dizilis.map(kimlik)} strategy={verticalListSortingStrategy}>
          <ol className="ds-liste" aria-label={liste.soru}>
            {dizilis.map((k, i) => (
              <Satir
                key={kimlik(k)}
                id={kimlik(k)}
                no={i + 1}
                ad={liste.maddeler[secim[k]].ad}
                ilk={i === 0}
                son={i === dizilis.length - 1}
                onYukari={() => kaydir(i, -1)}
                onAsagi={() => kaydir(i, 1)}
                t={t}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <p className="ds-uc is-alt" aria-hidden="true">▼ {liste.alt}</p>
      <div className="ds-cubuk">
        <button type="button" className="btn-primary ds-kontrol" onClick={onKontrol}>{t.kontrol}</button>
      </div>
    </main>
  );
}

function Satir({ id, no, ad, ilk, son, onYukari, onAsagi, t }: {
  id: string; no: number; ad: string; ilk: boolean; son: boolean;
  onYukari: () => void; onAsagi: () => void;
  t: ReturnType<typeof useMesajlar>['dogruSira'];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      className={`ds-satir${isDragging ? ' is-suruklen' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 20 : undefined }}
    >
      <span className="ds-tutamak" {...attributes} {...listeners} aria-label={t.surukle(ad)}>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" aria-hidden="true">
          <circle cx="1.6" cy="1.6" r="1.3" /><circle cx="6.4" cy="1.6" r="1.3" />
          <circle cx="1.6" cy="7" r="1.3" /><circle cx="6.4" cy="7" r="1.3" />
          <circle cx="1.6" cy="12.4" r="1.3" /><circle cx="6.4" cy="12.4" r="1.3" />
        </svg>
        <i>{no}</i>
      </span>
      <span className="ds-ad">{ad}</span>
      <span className="ds-oklar">
        <button type="button" onClick={onYukari} disabled={ilk} aria-label={t.yukari(ad)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
        </button>
        <button type="button" onClick={onAsagi} disabled={son} aria-label={t.asagi(ad)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </span>
    </li>
  );
}

/* ── Sonuç: gerçek sıra ve değerler ───────────────────── */

function DogruSiraSonuc({ liste, tohum, secim, dizilis, arkadasUyumu, onYeni }: {
  liste: DogruSiraListe; tohum: string; secim: number[]; dizilis: number[];
  arkadasUyumu: number | null; onYeni: () => void;
}) {
  const mesajlar = useMesajlar();
  const t = mesajlar.dogruSira;
  const k = mesajlar.kor;
  const dil = useDilim();
  const { user } = useAuth();
  const sonuc = useMemo(() => puanla(liste, secim, dizilis), [liste, secim, dizilis]);
  const dogru = useMemo(() => dogruDizi(liste, secim), [liste, secim]);
  /** Maddenin oyuncunun dizilişindeki yeri (1'den). */
  const oyuncuYeri = useMemo(() => new Map(dizilis.map((m, i) => [m, i + 1])), [dizilis]);
  const s = yerlesimYaz(dizilis);
  const tarih = tohumTarihi(tohum);
  const [gorsel, setGorsel] = useState<File | null>(null);
  const [bildirim, setBildirim] = useState<string | null>(null);

  // Görsel sonuç ekranı açılınca hazırlanıyor: iOS paylaşım menüsünü yalnızca dokunuşun
  // hemen ardından açıyor (KorOyun ile aynı gerekçe).
  useEffect(() => {
    let iptal = false;
    fetch(`/oyna/dogru-sira/${liste.slug}/gorsel?t=${tohum}&s=${s}&${DIL_PARAMETRE}=${dil}`)
      .then(y => (y.ok ? y.blob() : Promise.reject(new Error(String(y.status)))))
      .then(b => { if (!iptal) setGorsel(new File([b], `${t.dosyaAdi(liste.slug)}.png`, { type: 'image/png' })); })
      .catch(() => { /* görsel yoksa yalnızca bağlantı paylaşılır */ });
    return () => { iptal = true; };
  }, [liste.slug, tohum, s, dil, t]);

  useEffect(() => {
    if (!bildirim) return;
    const z = setTimeout(() => setBildirim(null), 2400);
    return () => clearTimeout(z);
  }, [bildirim]);

  const paylas = async () => {
    const dilEki = dil === 'tr' ? '' : `&${DIL_PARAMETRE}=${dil}`;
    const url = `${window.location.origin}/oyna/dogru-sira/${liste.slug}?t=${tohum}&s=${s}${dilEki}`;
    const metin = tarih
      ? t.paylasimGunluk(liste.ad, sonuc.uyum, tarihYaz(tarih, dilEtiketi(dil)))
      : t.paylasimSerbest(liste.ad, sonuc.uyum);
    try {
      if (gorsel && navigator.canShare?.({ files: [gorsel] })) {
        await navigator.share({ files: [gorsel], text: `${metin} ${url}` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: t.baslik(liste.ad), text: metin, url });
        return;
      }
      await navigator.clipboard.writeText(`${metin} ${url}`);
      setBildirim(k.kopyalandi);
    } catch { /* menü kapatıldı */ }
  };

  const indir = () => {
    if (!gorsel) return;
    const u = URL.createObjectURL(gorsel);
    const a = document.createElement('a');
    a.href = u;
    a.download = gorsel.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };

  return (
    <main className="kor-sonuc">
      <div className={`sayi-puan${sonuc.uyum === 100 ? ' is-kusursuz' : ''}`}>
        <strong>{yuzde(sonuc.uyum, dil)}</strong>
        <span>
          <b>{t.puanEtiketi(sonuc.uyum)}</b>
          {t.uyumMetni(sonuc.uyum)} {t.tamYerinde(sonuc.tamYerinde)}.
        </span>
      </div>

      {arkadasUyumu !== null && (
        <p className="sayi-kiyas">
          <b>{t.kiyas(sonuc.uyum, arkadasUyumu)}</b> {t.arkadasUyumu(arkadasUyumu)}
        </p>
      )}

      <h2 className="ds-alt-baslik">{t.gercekSira}</h2>
      <ol className="kor-liste ds-sonuc-liste">
        {dogru.map((m, i) => {
          const yeri = oyuncuYeri.get(m) ?? 0;
          const fark = Math.abs(yeri - (i + 1));
          return (
            <li key={m} className={fark === 0 ? 'is-yerinde' : fark === 1 ? 'is-yakin' : ''} style={{ '--i': i } as React.CSSProperties}>
              <i>{i + 1}</i>
              <span className="ds-sonuc-ad">
                {liste.maddeler[secim[m]].ad}
                <small>{degerYaz(liste.bicim, liste.maddeler[secim[m]].deger, dil)}</small>
              </span>
              <em title={fark === 0 ? t.yerinde : undefined}>{fark === 0 ? '✓' : t.sen(yeri)}</em>
            </li>
          );
        })}
      </ol>
      <p className="ds-kaynak">{t.kaynak(liste.kaynak)}</p>

      <div className="kor-islemler">
        <button type="button" className="btn-primary" onClick={paylas}>{k.paylas}</button>
        {gorsel && <button type="button" className="btn-quiet kor-indir" onClick={indir}>{k.gorseliIndir}</button>}
        <button type="button" className="btn-quiet" onClick={onYeni}>{t.yeniOn}</button>
        <Link href="/oyna" className="btn-quiet">{t.baskaListe}</Link>
      </div>

      <ModGecisi slug={liste.slug} simdiki="dogru-sira" />

      <Link href="/" className="kor-davet">
        {user ? (
          <>
            <strong>{k.listelerimeDon}</strong>
            <span>{k.listelerimeDonAlt}</span>
          </>
        ) : (
          <>
            <strong>{k.listeKur}</strong>
            <span>{k.listeKurAlt}</span>
          </>
        )}
      </Link>

      {bildirim && <div className="toast" role="status">{bildirim}</div>}
    </main>
  );
}

