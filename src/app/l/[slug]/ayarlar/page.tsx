'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlanTanimi, AlanTipi, Kategori } from '../../../../types/item';
import {
  createKategori, deleteKategori, deleteListe, updateKategori, updateListe,
} from '../../../../lib/items';
import { useListStore } from '../../../../hooks/useListStore';
import { hataMetni } from '../../../../lib/hata';
import ListeRayi from '../../../../components/ListeRayi';

/** Yeni kategorilere sırayla atanan renkler. */
const PALET = [
  '#1f6feb', '#b45309', '#127a5b', '#a8342c', '#6b4fbb',
  '#0f7d8c', '#8a5cf6', '#8a8f2b', '#c2436f',
];

/** Listenin vurgu rengi için seçenekler. */
const VURGU = ['#e03c10', '#1f6feb', '#127a5b', '#8a5cf6', '#b45309'];

const KaldirIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

/** "Türk Kahvesi" → "TK" */
const monogram = (ad: string) =>
  ad.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toLocaleUpperCase('tr') || '?';

export default function AyarlarPage() {
  const router = useRouter();
  const slug = String(useParams().slug ?? '');
  const { liste, kategoriler, items, loading, error, load } = useListStore(slug);

  const [ad, setAd] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [yeniKategori, setYeniKategori] = useState('');
  const [yeniAlanEtiket, setYeniAlanEtiket] = useState('');
  const [yeniAlanTip, setYeniAlanTip] = useState<AlanTipi>('bool');
  const [yeniAlanKategori, setYeniAlanKategori] = useState('');

  if (loading) return <p className="state-msg">Yükleniyor…</p>;

  if (!liste) {
    return (
      <div className="app app-iki">
        <ListeRayi />
        <main className="list">
          <div className="state-empty">
            <p className="state-empty-title">Liste bulunamadı</p>
            <Link href="/" className="btn-primary">Listelerime dön</Link>
          </div>
        </main>
      </div>
    );
  }

  const alanlar = liste.alanlar ?? [];
  const adDeger = ad ?? liste.ad;
  const toplam = items.length;

  const calistir = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e: unknown) {
      alert('İşlem başarısız: ' + hataMetni(e));
    } finally {
      setBusy(false);
    }
  };

  /* ── Kimlik ───────────────────────────────────────── */
  // Slug bilerek sabit: adres değişirse kayıtlı bağlantılar kırılır.
  const adKaydet = (deger: string) => {
    const temiz = deger.trim();
    if (!temiz || temiz === liste.ad) { setAd(null); return; }
    return calistir(async () => {
      await updateListe(liste.id, { ad: temiz });
      setAd(null);
    });
  };

  const renkKaydet = (renk: string) => {
    if (renk === liste.renk) return;
    return calistir(() => updateListe(liste.id, { renk }));
  };

  /* ── Kategoriler ──────────────────────────────────── */
  const kategoriEkle = () => {
    const temiz = yeniKategori.trim();
    if (!temiz) return;
    return calistir(async () => {
      await createKategori({
        list_id: liste.id,
        ad: temiz,
        renk: PALET[kategoriler.length % PALET.length],
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

  const listeSil = () => {
    if (!window.confirm(
      `“${liste.ad}” listesi ve içindeki ${toplam} kayıt kalıcı olarak silinecek. Emin misin?`
    )) return;
    return calistir(async () => {
      await deleteListe(liste.id);
      router.push('/');
    });
  };

  return (
    <div className="app app-iki" style={{ '--accent': liste.renk } as React.CSSProperties}>
      <ListeRayi aktifSlug={slug} />

      <main className="ayar">
        <header className="ayar-ust">
          <Link href={`/l/${slug}`} className="ayar-ust-geri">{liste.ad} · Liste ayarları</Link>
          <div className="ayar-ust-alt">
            <h1 className="ayar-ust-baslik">Liste Ayarları</h1>
            <span className="ayar-ust-not">Değişiklikler anında kaydedilir</span>
          </div>
        </header>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>Tekrar dene</button>
          </div>
        )}

        <div className="ayar-govde">
          {/* ── Sol: kimlik, renk, silme ─────────────── */}
          <div className="ayar-sol">
            <section className="ayar-bolum">
              <h2 className="ayar-bolum-baslik">Kimlik</h2>
              <div className="kimlik">
                <span className="kimlik-mono" aria-hidden="true">{monogram(adDeger)}</span>
                <div className="kimlik-alan">
                  <input
                    className="kimlik-ad"
                    value={adDeger}
                    onChange={(e) => setAd(e.target.value)}
                    onBlur={(e) => adKaydet(e.target.value)}
                    aria-label="Liste adı"
                  />
                  <span className="kimlik-slug">/l/{slug}</span>
                </div>
              </div>
            </section>

            <section className="ayar-bolum">
              <h2 className="ayar-bolum-baslik">Vurgu rengi</h2>
              <div className="renk-secim">
                {VURGU.map(renk => (
                  <button
                    key={renk}
                    type="button"
                    className={`renk-nokta${liste.renk === renk ? ' is-on' : ''}`}
                    style={{ background: renk }}
                    onClick={() => renkKaydet(renk)}
                    disabled={busy}
                    aria-label={`Vurgu rengi ${renk}`}
                    aria-pressed={liste.renk === renk}
                  />
                ))}
              </div>
              <p className="field-hint">Listenin başlığında ve zirve bandında kullanılır.</p>
            </section>

            <section className="ayar-bolum ayar-bolum-tehlike">
              <h2 className="ayar-bolum-baslik">Listeyi sil</h2>
              <p className="field-hint">
                Liste, kategorileri ve {toplam} kaydın tamamı kalıcı olarak silinir.
              </p>
              <button type="button" className="btn-danger" onClick={listeSil} disabled={busy}>
                Sil
              </button>
            </section>
          </div>

          {/* ── Sağ: kategoriler ve ek alanlar ───────── */}
          <div className="ayar-sag">
            <section className="ayar-bolum">
              <h2 className="ayar-bolum-baslik">
                Kategoriler
                <span>filtre şeridinde kayıt sayısına göre sıralanır</span>
              </h2>

              <div className="kat-satirlar">
                {kategoriler.map(kat => {
                  const adet = items.filter(i => i.category_id === kat.id).length;
                  const pay = toplam > 0 ? Math.round((adet / toplam) * 100) : 0;
                  return (
                    <div className="kat-satir" key={kat.id}>
                      <span className="kat-renk" style={{ background: kat.renk }} />
                      <input
                        className="kat-ad"
                        defaultValue={kat.ad}
                        onBlur={(e) => kategoriAdiKaydet(kat, e.target.value)}
                        aria-label={`${kat.ad} kategorisinin adı`}
                      />
                      <span className="kat-bar">
                        <span style={{ width: `${pay}%`, background: kat.renk }} />
                      </span>
                      <span className="kat-sayi">{adet} kayıt</span>
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
                  );
                })}
                {kategoriler.length === 0 && <p className="scope-empty">Henüz kategori yok.</p>}
              </div>

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
              <h2 className="ayar-bolum-baslik">
                Ek alanlar
                <span>Evet/Hayır alanları filtre şeridine de çıkar</span>
              </h2>

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
                    <button
                      type="button"
                      className="ayar-sil"
                      onClick={() => alanSil(alan)}
                      disabled={busy}
                      aria-label={`${alan.etiket} alanını kaldır`}
                    >
                      {KaldirIkon}
                    </button>
                  </div>
                ))}
                {alanlar.length === 0 && <p className="scope-empty">Henüz ek alan yok.</p>}
              </div>

              <div className="alan-ekle">
                <select
                  className="alan-tip"
                  value={yeniAlanTip}
                  onChange={(e) => setYeniAlanTip(e.target.value as AlanTipi)}
                  aria-label="Yeni alanın tipi"
                >
                  <option value="bool">Evet/Hayır</option>
                  <option value="metin">Metin</option>
                </select>
                <input
                  className="field-input"
                  placeholder="Alan adı"
                  value={yeniAlanEtiket}
                  onChange={(e) => setYeniAlanEtiket(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void alanEkle(); } }}
                  aria-label="Yeni alanın adı"
                />
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
                  Ekle
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
