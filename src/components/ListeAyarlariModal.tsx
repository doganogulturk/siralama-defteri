'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlanTanimi, AlanTipi, Item, Kategori, Liste } from '../types/item';
import {
  KATEGORI_PALET, createKategori, deleteKategori, deleteListe, updateKategori, updateListe,
} from '../lib/items';
import { listeleriTazele } from '../hooks/useListeler';
import { hataMetni } from '../lib/hata';
import { SINIR } from '../lib/sinirlar';
import Sheet from './Sheet';
import PaylasimBolumu from './PaylasimBolumu';
import { uyar, onayla } from '../lib/pencere';
import { messages } from '../lib/i18n';

const KaldirIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

const KapatIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Ek alanın kalıcı anahtarı; etiket değişse de değerler ona bağlı kalıyor. */
const yeniAlanAnahtari = () => `alan_${Date.now().toString(36)}`;

interface ListeAyarlariModalProps {
  liste: Liste;
  kategoriler: Kategori[];
  items: Item[];
  /** Her değişiklikten sonra çağrılır — sayfa verisini baştan okusun. */
  onChanged: () => Promise<void> | void;
  onClose: () => void;
  /** "Şimdi ata" köprüsü: popup'ı kapatıp kategorisiz kayıtlarla seçim modunu açar. */
  onKategorisizAta?: () => void;
}

/**
 * Liste ayarları: başlıkta düzenlenebilir ad, altında paylaşım, kategoriler, ek
 * alanlar ve silme. Ayrı bir sayfa değil, sıralama ekranının üstünde açılan popup — kayıt
 * formuyla aynı kabuk. Değişiklikler anında kaydediliyor, "Kaydet" yok.
 */
export default function ListeAyarlariModal({
  liste, kategoriler, items, onChanged, onClose, onKategorisizAta,
}: ListeAyarlariModalProps) {
  const router = useRouter();
  const m = messages();
  const t = m.ayarlar;
  const [ad, setAd] = useState(liste.ad);
  const [busy, setBusy] = useState(false);

  const [yeniKategori, setYeniKategori] = useState('');
  const [yeniAlanEtiket, setYeniAlanEtiket] = useState('');
  const [yeniAlanTip, setYeniAlanTip] = useState<AlanTipi>('bool');
  const [yeniAlanKategori, setYeniAlanKategori] = useState('');

  const alanlar = liste.alanlar ?? [];
  const toplam = items.length;
  const kategorisiz = items.filter(i => !i.category_id).length;

  const calistir = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
      // Raydaki ve ana ekrandaki ad ile sayılar da değişmiş olabilir.
      listeleriTazele();
    } catch (e: unknown) {
      void uyar(t.basarisiz(hataMetni(e)));
    } finally {
      setBusy(false);
    }
  };

  /* ── Ad ───────────────────────────────────────────── */
  // Slug bilerek sabit: adres değişirse kayıtlı bağlantılar kırılır.
  const adKaydet = () => {
    const temiz = ad.trim();
    if (!temiz) { setAd(liste.ad); return; }
    if (temiz === liste.ad) return;
    return calistir(() => updateListe(liste.id, { ad: temiz }));
  };

  /* ── Kategoriler ──────────────────────────────────── */
  const kategoriEkle = () => {
    const temiz = yeniKategori.trim();
    if (!temiz) return;
    return calistir(async () => {
      await createKategori({
        list_id: liste.id,
        ad: temiz,
        renk: KATEGORI_PALET[kategoriler.length % KATEGORI_PALET.length],
        sira: kategoriler.length,
      });
      setYeniKategori('');
    });
  };

  const kategoriAdiKaydet = (kat: Kategori, deger: string) => {
    const temiz = deger.trim();
    if (!temiz || temiz === kat.ad) return;
    return calistir(() => updateKategori(kat.id, { ad: temiz }));
  };

  const kategoriSil = async (kat: Kategori) => {
    const adet = items.filter(i => i.category_id === kat.id).length;
    if (!(await onayla({ metin: t.kategoriSilinsinMi(kat.ad, adet), onay: m.genel.sil, tehlikeli: true }))) return;
    return calistir(() => deleteKategori(kat.id));
  };

  /* ── Ek alanlar ───────────────────────────────────── */
  const alanGuncelle = (alan: AlanTanimi, yama: Partial<AlanTanimi>) =>
    calistir(() => updateListe(liste.id, {
      alanlar: alanlar.map(a => (a.anahtar === alan.anahtar ? { ...a, ...yama } : a)),
    }));

  const alanAdiKaydet = (alan: AlanTanimi, deger: string) => {
    const temiz = deger.trim();
    if (!temiz || temiz === alan.etiket) return;
    return alanGuncelle(alan, { etiket: temiz });
  };

  const alanTipiKaydet = (alan: AlanTanimi, tip: AlanTipi) => {
    if (tip === alan.tip) return;
    // Evet/Hayır alanları varsayılan olarak filtrelenebilir; metne dönerken bu anlamsız.
    return alanGuncelle(alan, { tip, filtre: tip === 'bool' ? true : undefined });
  };

  const alanKategoriKaydet = (alan: AlanTanimi, kategoriId: string) => {
    if ((alan.kategori_id ?? '') === kategoriId) return;
    return alanGuncelle(alan, { kategori_id: kategoriId || undefined });
  };

  const alanEkle = () => {
    const etiket = yeniAlanEtiket.trim();
    if (!etiket) return;
    const yeni: AlanTanimi = {
      anahtar: yeniAlanAnahtari(),
      tip: yeniAlanTip,
      etiket,
      ...(yeniAlanTip === 'bool' ? { filtre: true } : {}),
      ...(yeniAlanKategori ? { kategori_id: yeniAlanKategori } : {}),
    };
    return calistir(async () => {
      await updateListe(liste.id, { alanlar: [...alanlar, yeni] });
      setYeniAlanEtiket('');
      setYeniAlanKategori('');
    });
  };

  const alanSil = async (alan: AlanTanimi) => {
    if (!(await onayla({
      metin: t.alanKaldirilsinMi(alan.etiket),
      onay: t.kaldir,
      tehlikeli: true,
    }))) return;
    return calistir(() =>
      updateListe(liste.id, { alanlar: alanlar.filter(a => a.anahtar !== alan.anahtar) })
    );
  };

  /* ── Silme ────────────────────────────────────────── */
  // Ortak yoldan geçmiyor: silinen listeyi baştan okumaya çalışmanın anlamı yok.
  const listeSil = async () => {
    if (!(await onayla({
      metin: t.listeSilinsinMi(liste.ad, toplam),
      onay: t.listeyiSil,
      tehlikeli: true,
    }))) return;
    setBusy(true);
    try {
      await deleteListe(liste.id);
      listeleriTazele();
      router.push('/');
    } catch (e: unknown) {
      void uyar(t.listeSilinemedi(hataMetni(e)));
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose} className="form-screen-ayar" label={t.baslik}>
      <header className="form-screen-header">
        <button type="button" className="form-screen-back" onClick={onClose} aria-label={m.genel.kapat}>
          {KapatIkon}
        </button>
        <input
          className="ayar-ad"
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          onBlur={adKaydet}
          maxLength={SINIR.listeAdi}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          aria-label={t.listeAdi}
        />
        <span className="form-screen-header-spacer" />
      </header>

      <div className="form-screen-body ayar-govde">
        <PaylasimBolumu
          liste={liste}
          busy={busy}
          kodKaydet={(kod) => calistir(() => updateListe(liste.id, { paylasim_kodu: kod }))}
        />

        <section className="ayar-bolum">
          <h2 className="ayar-bolum-baslik">{t.kategoriler}</h2>

          <div className="kat-satirlar">
            {kategoriler.map(kat => (
              <div className="kat-satir" key={kat.id}>
                <span className="kat-renk" style={{ background: kat.renk }} />
                <input
                  className="kat-ad"
                  defaultValue={kat.ad}
                  onBlur={(e) => kategoriAdiKaydet(kat, e.target.value)}
                  maxLength={SINIR.kategoriAdi}
                  aria-label={t.kategoriAdiEtiketi(kat.ad)}
                />
                <span className="kat-sayi">
                  {t.kayitSayisi(items.filter(i => i.category_id === kat.id).length)}
                </span>
                <button
                  type="button"
                  className="ayar-sil"
                  onClick={() => kategoriSil(kat)}
                  disabled={busy}
                  aria-label={t.kategoriyiSil(kat.ad)}
                >
                  {KaldirIkon}
                </button>
              </div>
            ))}
            {kategoriler.length === 0 && <p className="ayar-bos">{t.kategoriYok}</p>}
          </div>

          {/* Kategoriler sonradan açıldıysa kayıtlar hâlâ kategorisiz: tek tek düzenlemek yerine toplu atamaya köprü. */}
          {kategoriler.length > 0 && kategorisiz > 0 && onKategorisizAta && (
            <button type="button" className="ayar-kopru" onClick={onKategorisizAta}>
              <span><strong>{t.kategorisiz(kategorisiz)[0]}</strong>{t.kategorisiz(kategorisiz)[1]}</span>
              <em>{t.simdiAta}</em>
            </button>
          )}

          <div className="ayar-ekle">
            <input
              className="field-input"
              placeholder={t.yeniKategoriAdi}
              value={yeniKategori}
              onChange={(e) => setYeniKategori(e.target.value)}
              maxLength={SINIR.kategoriAdi}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void kategoriEkle(); } }}
            />
            <button type="button" className="btn-primary" onClick={kategoriEkle} disabled={busy}>
              {t.ekle}
            </button>
          </div>
        </section>

        <section className="ayar-bolum">
          <h2 className="ayar-bolum-baslik">{t.ekAlanlar}</h2>

          <div className="alan-satirlar">
            {alanlar.map(alan => (
              <div className="alan-satir" key={alan.anahtar}>
                <select
                  className="alan-tip"
                  value={alan.tip}
                  onChange={(e) => alanTipiKaydet(alan, e.target.value as AlanTipi)}
                  disabled={busy}
                  aria-label={t.alanTipiEtiketi(alan.etiket)}
                >
                  <option value="bool">{t.evetHayir}</option>
                  <option value="metin">{t.metin}</option>
                </select>
                <input
                  className="alan-ad"
                  defaultValue={alan.etiket}
                  onBlur={(e) => alanAdiKaydet(alan, e.target.value)}
                  maxLength={SINIR.alanAdi}
                  disabled={busy}
                  aria-label={t.alanAdiEtiketi(alan.etiket)}
                />
                <button
                  type="button"
                  className="ayar-sil"
                  onClick={() => alanSil(alan)}
                  disabled={busy}
                  aria-label={t.alaniKaldir(alan.etiket)}
                >
                  {KaldirIkon}
                </button>
                <select
                  className="alan-kat"
                  value={alan.kategori_id ?? ''}
                  onChange={(e) => alanKategoriKaydet(alan, e.target.value)}
                  disabled={busy}
                  aria-label={t.alanKapsamiEtiketi(alan.etiket)}
                >
                  <option value="">{t.tumKategoriler}</option>
                  {kategoriler.map(k => (
                    <option key={k.id} value={k.id}>{t.yalnizca(k.ad)}</option>
                  ))}
                </select>
              </div>
            ))}
            {alanlar.length === 0 && <p className="ayar-bos">{t.alanYok}</p>}
          </div>

          <div className="alan-ekle">
            <input
              className="field-input"
              placeholder={t.alanAdi}
              value={yeniAlanEtiket}
              onChange={(e) => setYeniAlanEtiket(e.target.value)}
              maxLength={SINIR.alanAdi}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void alanEkle(); } }}
              aria-label={t.yeniAlanAdi}
            />
            <select
              className="alan-tip"
              value={yeniAlanTip}
              onChange={(e) => setYeniAlanTip(e.target.value as AlanTipi)}
              aria-label={t.yeniAlanTipi}
            >
              <option value="bool">{t.evetHayir}</option>
              <option value="metin">{t.metin}</option>
            </select>
            <select
              className="alan-kat"
              value={yeniAlanKategori}
              onChange={(e) => setYeniAlanKategori(e.target.value)}
              aria-label={t.yeniAlanKapsami}
            >
              <option value="">{t.tumKategoriler}</option>
              {kategoriler.map(k => (
                <option key={k.id} value={k.id}>{t.yalnizca(k.ad)}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-primary"
              onClick={alanEkle}
              disabled={busy || !yeniAlanEtiket.trim()}
            >
              {t.alanEkle}
            </button>
          </div>
        </section>

        {/* Yalnızca düğme: neyin silineceğini onay penceresi söylüyor. */}
        <button type="button" className="btn-danger ayar-liste-sil" onClick={listeSil} disabled={busy}>
          {t.listeyiSil}
        </button>
      </div>
    </Sheet>
  );
}
