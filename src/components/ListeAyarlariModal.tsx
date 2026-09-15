'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlanTanimi, AlanTipi, Item, Kategori, Liste } from '../types/item';
import {
  KATEGORI_PALET, createKategori, deleteKategori, deleteListe, updateKategori, updateListe,
} from '../lib/items';
import { listeleriTazele } from '../hooks/useListeler';
import { hataMetni } from '../lib/hata';

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
 * Liste ayarları: başlıkta düzenlenebilir ad, altında kategoriler, ek alanlar ve
 * silme. Ayrı bir sayfa değil, sıralama ekranının üstünde açılan popup — kayıt
 * formuyla aynı kabuk. Değişiklikler anında kaydediliyor, "Kaydet" yok.
 */
export default function ListeAyarlariModal({
  liste, kategoriler, items, onChanged, onClose, onKategorisizAta,
}: ListeAyarlariModalProps) {
  const router = useRouter();
  const [ad, setAd] = useState(liste.ad);
  const [busy, setBusy] = useState(false);

  const [yeniKategori, setYeniKategori] = useState('');
  const [yeniAlanEtiket, setYeniAlanEtiket] = useState('');
  const [yeniAlanTip, setYeniAlanTip] = useState<AlanTipi>('bool');
  const [yeniAlanKategori, setYeniAlanKategori] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      alert('İşlem başarısız: ' + hataMetni(e));
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

  const kategoriSil = (kat: Kategori) => {
    const adet = items.filter(i => i.category_id === kat.id).length;
    const uyari = adet > 0
      ? `“${kat.ad}” kategorisini silmek istiyor musun? ${adet} kayıt kategorisiz kalacak (kayıtlar silinmez).`
      : `“${kat.ad}” kategorisini silmek istiyor musun?`;
    if (!window.confirm(uyari)) return;
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
      anahtar: `alan_${Date.now().toString(36)}`,
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

  const alanSil = (alan: AlanTanimi) => {
    if (!window.confirm(`“${alan.etiket}” alanı kaldırılsın mı? Kayıtlardaki değerler görünmez olur.`)) return;
    return calistir(() =>
      updateListe(liste.id, { alanlar: alanlar.filter(a => a.anahtar !== alan.anahtar) })
    );
  };

  /* ── Silme ────────────────────────────────────────── */
  // Ortak yoldan geçmiyor: silinen listeyi baştan okumaya çalışmanın anlamı yok.
  const listeSil = async () => {
    if (!window.confirm(
      `“${liste.ad}” listesi ve içindeki ${toplam} kayıt kalıcı olarak silinecek. Emin misin?`
    )) return;
    setBusy(true);
    try {
      await deleteListe(liste.id);
      listeleriTazele();
      router.push('/');
    } catch (e: unknown) {
      alert('Liste silinemedi: ' + hataMetni(e));
      setBusy(false);
    }
  };

  return (
    <div
      className="form-screen-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="form-screen form-screen-ayar" aria-label="Liste ayarları">
        <header className="form-screen-header">
          <button type="button" className="form-screen-back" onClick={onClose} aria-label="Kapat">
            {KapatIkon}
          </button>
          <input
            className="ayar-ad"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            onBlur={adKaydet}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            aria-label="Liste adı"
          />
          <span className="form-screen-header-spacer" />
        </header>

        <div className="form-screen-body ayar-govde">
          <section className="ayar-bolum">
            <h2 className="ayar-bolum-baslik">Kategoriler</h2>

            <div className="kat-satirlar">
              {kategoriler.map(kat => (
                <div className="kat-satir" key={kat.id}>
                  <span className="kat-renk" style={{ background: kat.renk }} />
                  <input
                    className="kat-ad"
                    defaultValue={kat.ad}
                    onBlur={(e) => kategoriAdiKaydet(kat, e.target.value)}
                    aria-label={`${kat.ad} kategorisinin adı`}
                  />
                  <span className="kat-sayi">
                    {items.filter(i => i.category_id === kat.id).length} kayıt
                  </span>
                  <button
                    type="button"
                    className="ayar-sil"
                    onClick={() => kategoriSil(kat)}
                    disabled={busy}
                    aria-label={`${kat.ad} kategorisini sil`}
                  >
                    {KaldirIkon}
                  </button>
                </div>
              ))}
              {kategoriler.length === 0 && <p className="ayar-bos">Henüz kategori yok.</p>}
            </div>

            {/* Kategoriler sonradan açıldıysa kayıtlar hâlâ kategorisiz: tek tek düzenlemek yerine toplu atamaya köprü. */}
            {kategoriler.length > 0 && kategorisiz > 0 && onKategorisizAta && (
              <button type="button" className="ayar-kopru" onClick={onKategorisizAta}>
                <span><strong>{kategorisiz} kayıt</strong> kategorisiz</span>
                <em>Şimdi ata →</em>
              </button>
            )}

            <div className="ayar-ekle">
              <input
                className="field-input"
                placeholder="Yeni kategori adı"
                value={yeniKategori}
                onChange={(e) => setYeniKategori(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void kategoriEkle(); } }}
              />
              <button type="button" className="btn-primary" onClick={kategoriEkle} disabled={busy}>
                Ekle
              </button>
            </div>
          </section>

          <section className="ayar-bolum">
            <h2 className="ayar-bolum-baslik">Ek alanlar</h2>

            <div className="alan-satirlar">
              {alanlar.map(alan => (
                <div className="alan-satir" key={alan.anahtar}>
                  <select
                    className="alan-tip"
                    value={alan.tip}
                    onChange={(e) => alanTipiKaydet(alan, e.target.value as AlanTipi)}
                    disabled={busy}
                    aria-label={`${alan.etiket} alanının tipi`}
                  >
                    <option value="bool">Evet/Hayır</option>
                    <option value="metin">Metin</option>
                  </select>
                  <input
                    className="alan-ad"
                    defaultValue={alan.etiket}
                    onBlur={(e) => alanAdiKaydet(alan, e.target.value)}
                    disabled={busy}
                    aria-label={`${alan.etiket} alanının adı`}
                  />
                  <button
                    type="button"
                    className="ayar-sil"
                    onClick={() => alanSil(alan)}
                    disabled={busy}
                    aria-label={`${alan.etiket} alanını kaldır`}
                  >
                    {KaldirIkon}
                  </button>
                  <select
                    className="alan-kat"
                    value={alan.kategori_id ?? ''}
                    onChange={(e) => alanKategoriKaydet(alan, e.target.value)}
                    disabled={busy}
                    aria-label={`${alan.etiket} alanının kapsamı`}
                  >
                    <option value="">Tüm kategoriler</option>
                    {kategoriler.map(k => (
                      <option key={k.id} value={k.id}>Yalnızca {k.ad}</option>
                    ))}
                  </select>
                </div>
              ))}
              {alanlar.length === 0 && <p className="ayar-bos">Henüz ek alan yok.</p>}
            </div>

            <div className="alan-ekle">
              <input
                className="field-input"
                placeholder="Alan adı"
                value={yeniAlanEtiket}
                onChange={(e) => setYeniAlanEtiket(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void alanEkle(); } }}
                aria-label="Yeni alanın adı"
              />
              <select
                className="alan-tip"
                value={yeniAlanTip}
                onChange={(e) => setYeniAlanTip(e.target.value as AlanTipi)}
                aria-label="Yeni alanın tipi"
              >
                <option value="bool">Evet/Hayır</option>
                <option value="metin">Metin</option>
              </select>
              <select
                className="alan-kat"
                value={yeniAlanKategori}
                onChange={(e) => setYeniAlanKategori(e.target.value)}
                aria-label="Yeni alanın kapsamı"
              >
                <option value="">Tüm kategoriler</option>
                {kategoriler.map(k => (
                  <option key={k.id} value={k.id}>Yalnızca {k.ad}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-primary"
                onClick={alanEkle}
                disabled={busy || !yeniAlanEtiket.trim()}
              >
                Alan ekle
              </button>
            </div>
          </section>

          {/* Yalnızca düğme: neyin silineceğini onay penceresi söylüyor. */}
          <button type="button" className="btn-danger ayar-liste-sil" onClick={listeSil} disabled={busy}>
            Listeyi sil
          </button>
        </div>
      </section>
    </div>
  );
}
