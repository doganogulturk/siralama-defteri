'use client';

import React from 'react';
import { Item, Kademe, Liste } from '@/types/item';
import { kademeleriAc, updateItemsSira, updateListe } from '@/lib/items';
import {
  EN_FAZLA_KADEME, KADEME_ETIKET_UZUNLUK, VARSAYILAN_KADEMELER, kademeSil, kademeliMi, siralamadanDagit, yeniKademe,
} from '@/lib/kademe';
import { siraliSiralama } from '@/lib/siralama';
import { onayla, uyar } from '@/lib/pencere';
import { messages } from '@/lib/i18n';
import { KademeRozet } from './KademeParcalari';

const KaldirIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

/** Sıra ve kademe yazımı: kademeler açılırken, dağıtılırken ve silinirken. */
const yaz = (items: Item[]) =>
  updateItemsSira(items.map(i => ({ id: i.id, sira: i.sira ?? 0, kademe: i.kademe ?? null })));

/**
 * Liste ayarlarındaki "Kademeler" bölümü. Kapalıyken tek düğme: açınca varsayılan
 * kademeler (S–D) ve sıralama onlara sırayla dağıtılıyor. Açıkken her kademenin adı
 * yerinde değişiyor; ekleme, kaldırma (kayıtlar komşu kademeye), yeniden dağıtma ve
 * kapatma (kayıtların kademeleri siliniyor, sıra kalıyor).
 *
 * Yazım sırası bilerek: açarken önce liste, sonra kayıtlar (kayıtlar yazılamazsa hepsi
 * kademesiz, yine tutarlı); kaldırırken önce kayıtlar, sonra liste (liste yazılamazsa
 * boş bir kademe kalıyor, kayıt kaybolmuyor).
 */
export default function KademeBolumu({ liste, items, busy, calistir }: {
  liste: Liste;
  items: Item[];
  busy: boolean;
  calistir: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const m = messages();
  const t = m.kademe;
  const kademeler = kademeliMi(liste.kademeler) ? liste.kademeler : null;

  const ac = () => calistir(() => kademeleriAc(liste.id, items));

  if (!kademeler) {
    return (
      <section className="ayar-bolum">
        <h2 className="ayar-bolum-baslik">{t.baslik}</h2>
        <p className="ayar-aciklama">{t.aciklama}</p>
        <div className="kademe-ac-onizleme" aria-hidden="true">
          {VARSAYILAN_KADEMELER.map(k => <KademeRozet key={k.anahtar} kademe={k} kademeler={VARSAYILAN_KADEMELER} />)}
        </div>
        <button type="button" className="btn-primary kademe-ac" onClick={ac} disabled={busy}>{t.ac}</button>
        <p className="ayar-aciklama">{t.acAlt}</p>
      </section>
    );
  }

  const sirali = siraliSiralama(items, kademeler);
  const adet = (k: Kademe) => sirali.filter(i => i.kademe === k.anahtar).length;

  const etiketKaydet = (k: Kademe, deger: string) => {
    const temiz = deger.trim().slice(0, KADEME_ETIKET_UZUNLUK);
    if (!temiz || temiz === k.etiket) return;
    return calistir(() => updateListe(liste.id, {
      kademeler: kademeler.map(x => (x.anahtar === k.anahtar ? { ...x, etiket: temiz } : x)),
    }));
  };

  const ekle = () => {
    if (kademeler.length >= EN_FAZLA_KADEME) { void uyar(t.enFazla(EN_FAZLA_KADEME)); return; }
    return calistir(() => updateListe(liste.id, { kademeler: [...kademeler, yeniKademe(kademeler)] }));
  };

  const kapat = async () => {
    if (!(await onayla({ metin: t.kapatilsinMi, onay: t.kapat, tehlikeli: true }))) return;
    return calistir(async () => {
      await updateListe(liste.id, { kademeler: null });
      await yaz(items.filter(i => i.kademe != null).map(i => ({ ...i, kademe: null })));
    });
  };

  const kaldir = async (k: Kademe) => {
    if (kademeler.length < 2) return kapat();
    const sonuc = kademeSil(sirali, kademeler, k.anahtar);
    if (!sonuc) return;
    const n = sonuc.degisenler.length;
    if (n > 0) {
      const i = kademeler.findIndex(x => x.anahtar === k.anahtar);
      const devralan = (kademeler[i + 1] ?? kademeler[i - 1]).etiket;
      if (!(await onayla({ metin: t.kaldirilsinMi(k.etiket, n, devralan), onay: m.ayarlar.kaldir, tehlikeli: true }))) return;
    }
    return calistir(async () => {
      await yaz(sonuc.degisenler);
      await updateListe(liste.id, { kademeler: sonuc.kademeler });
    });
  };

  const dagit = async () => {
    if (!(await onayla({ metin: t.dagitilsinMi, onay: t.dagit2 }))) return;
    return calistir(() => yaz(siralamadanDagit(sirali, kademeler)));
  };

  return (
    <section className="ayar-bolum">
      <h2 className="ayar-bolum-baslik">{t.baslik}</h2>
      <div className="kat-satirlar">
        {kademeler.map(k => (
          <div className="kat-satir kademe-ayar-satir" key={k.anahtar}>
            <KademeRozet kademe={k} kademeler={kademeler} boyut="kucuk" />
            <input
              className="kat-ad"
              defaultValue={k.etiket}
              onBlur={(e) => etiketKaydet(k, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              maxLength={KADEME_ETIKET_UZUNLUK}
              disabled={busy}
              aria-label={t.etiketEtiketi(k.etiket)}
            />
            <span className="kat-sayi">{m.ayarlar.kayitSayisi(adet(k))}</span>
            <button type="button" className="ayar-sil" onClick={() => kaldir(k)} disabled={busy} aria-label={t.kaldir(k.etiket)}>
              {KaldirIkon}
            </button>
          </div>
        ))}
      </div>
      <div className="kademe-ayar-islemler">
        <button type="button" className="btn-quiet" onClick={ekle} disabled={busy || kademeler.length >= EN_FAZLA_KADEME}>
          {t.ekle}
        </button>
        <button type="button" className="btn-quiet" onClick={dagit} disabled={busy || sirali.length === 0}>{t.dagit}</button>
        <button type="button" className="btn-quiet kademe-kapat" onClick={kapat} disabled={busy}>{t.kapat}</button>
      </div>
    </section>
  );
}
