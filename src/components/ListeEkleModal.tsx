'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KATEGORI_PALET, createKategori, createListe, getListeler } from '../lib/items';
import { benzersizSlug, slugify } from '../lib/slug';
import { topluAyristir, topluKaydet, topluKayitSayisi, topluSorun } from '../lib/toplu';
import { hataMetni } from '../lib/hata';
import { SINIR } from '../lib/sinirlar';
import { SABLONLAR, Sablon } from '../lib/sablonlar';
import { Kategori } from '../types/item';
import TopluAlan from './TopluAlan';
import Sheet from './Sheet';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { uyar } from '../lib/pencere';

const trAnahtar = (s: string) => s.trim().toLocaleLowerCase('tr');

/**
 * Eklenmiş kategori adlarına kutudaki metni katar. Metin virgülle ayrılmış birden
 * çok ad olabilir ("Şekerli, Şekersiz"); boşlar ve büyük-küçük harf farkıyla
 * tekrarlar atılıyor — veritabanında (list_id, ad) benzersiz.
 */
const kategoriListesi = (mevcut: string[], metin: string): string[] => {
  const sonuc = [...mevcut];
  for (const parca of metin.split(',')) {
    const ad = parca.trim();
    if (ad && !sonuc.some(x => trAnahtar(x) === trAnahtar(ad))) sonuc.push(ad);
  }
  return sonuc;
};

interface ListeEkleModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Liste oluşturulduktan sonra çağrılır — açan sayfa listesini tazeleyebilsin. */
  onCreated?: () => void;
}

/**
 * Yeni liste formu. Hem ana ekrandan hem sol raydan açıldığı için bileşen;
 * slug çakışmasını önlemek için mevcut slug'ları kaydetme anında okuyor.
 */
export default function ListeEkleModal({ isOpen, onClose, onCreated }: ListeEkleModalProps) {
  const router = useRouter();
  /** Telefonda ad alanına odaklanmak klavyeyi açıp şablonları ve formu örtüyordu. */
  const isDesktop = useIsDesktop();
  const [ad, setAd] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  /** Toplu giriş kutusu bilerek kapalı doğuyor: liste açmanın kısa yolu kısa kalsın. */
  const [topluAcik, setTopluAcik] = useState(false);
  const [toplu, setToplu] = useState('');
  const bloklar = useMemo(() => topluAyristir(toplu), [toplu]);
  /** Liste oluşurken açılacak kategoriler — sırası kategori sırası ve renk sırası. */
  const [kategoriAdlari, setKategoriAdlari] = useState<string[]>([]);
  const [kategoriGiris, setKategoriGiris] = useState('');
  /** Şablondan doldurulduysa kayıtlar "Denenmemiş"e düşer (`lib/sablonlar.ts`). */
  const [sablon, setSablon] = useState<string | null>(null);

  if (!isOpen) return null;

  const sablonSec = (s: Sablon) => {
    setAd(s.ad);
    setKategoriAdlari(s.kategoriler);
    setKategoriGiris('');
    setToplu(s.metin);
    setTopluAcik(true);
    setSablon(s.ad);
  };

  const topluAdet = topluKayitSayisi(bloklar);
  const topluEngel = topluSorun(bloklar, 0);

  const kategoriEkle = () => {
    setKategoriAdlari(prev => kategoriListesi(prev, kategoriGiris));
    setKategoriGiris('');
  };
  const kategoriCikar = (ad: string) => setKategoriAdlari(prev => prev.filter(x => x !== ad));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim() || kaydediliyor || topluEngel) return;
    setKaydediliyor(true);
    try {
      const mevcut = await getListeler();
      const olusan = await createListe({
        ad: ad.trim(),
        slug: benzersizSlug(slugify(ad), mevcut.map(l => l.slug)),
        sira: mevcut.length,
      });
      // Kutuda yazılı kalıp eklenmemiş ad da sayılıyor: Enter'a basmayı unutmak kolay.
      const adlar = kategoriListesi(kategoriAdlari, kategoriGiris);
      const olusanKategoriler: Kategori[] = [];
      for (const [i, kategoriAdi] of adlar.entries()) {
        olusanKategoriler.push(await createKategori({
          list_id: olusan.id,
          ad: kategoriAdi,
          renk: KATEGORI_PALET[i % KATEGORI_PALET.length],
          sira: i,
        }));
      }
      if (topluAdet > 0) {
        // Toplu metindeki başlıklar yeni kategorilerle aynı adı taşıyorsa onlara bağlanıyor.
        await topluKaydet({
          liste: olusan, kategoriler: olusanKategoriler, bloklar, baslangicSira: 0, denendi: !sablon,
        });
      }
      onCreated?.();
      // Hiçbir şey kurulmadan doğan listede ilk iş ayarlar; kategori ya da kayıt
      // girildiyse kullanıcı doğrudan sıralamasına düşsün.
      const kuruldu = topluAdet > 0 || adlar.length > 0;
      router.push(
        !kuruldu ? `/l/${olusan.slug}?ayarlar=1`
          : sablon && topluAdet > 0 ? `/l/${olusan.slug}?sekme=denenmemis`
          : `/l/${olusan.slug}`,
      );
    } catch (err: unknown) {
      void uyar('Liste oluşturulamadı: ' + hataMetni(err));
      setKaydediliyor(false);
    }
  };

  return (
    <Sheet onClose={onClose} className="form-screen-short">
      <header className="form-screen-header">
        <button type="button" className="form-screen-back" onClick={onClose} aria-label="Kapat">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 className="form-screen-title">Yeni Liste</h2>
        <span className="form-screen-header-spacer" />
      </header>

      <form onSubmit={handleSubmit} className="form-screen-body">
        <div className="field">
          <span className="field-label">Hazır şablonla başla</span>
          <div className="sablonlar">
            {SABLONLAR.map(s => (
              <button
                key={s.ad}
                type="button"
                className={`sablon-hap${sablon === s.ad ? ' is-on' : ''}`}
                aria-pressed={sablon === s.ad}
                onClick={() => sablonSec(s)}
              >
                <span aria-hidden="true">{s.simge}</span> {s.ad}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Liste Adı *</span>
          <input
            type="text"
            className="field-input"
            placeholder="Kola, Döner, Türk Kahvesi…"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            maxLength={SINIR.listeAdi}
            required
            data-autofocus={isDesktop || undefined}
          />
        </label>

        <div className="field">
          <span className="field-label">Kategoriler</span>
          {/* Haplar ve giriş aynı kutuda: Enter ya da virgül adı hapa çeviriyor. */}
          <div className="yeni-kat">
            {kategoriAdlari.map((kategoriAdi, i) => (
              <span className="yeni-kat-hap" key={kategoriAdi}>
                <i style={{ background: KATEGORI_PALET[i % KATEGORI_PALET.length] }} aria-hidden="true" />
                {kategoriAdi}
                <button
                  type="button"
                  onClick={() => kategoriCikar(kategoriAdi)}
                  aria-label={`${kategoriAdi} kategorisini çıkar`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              className="yeni-kat-giris"
              placeholder={kategoriAdlari.length > 0 ? 'Bir tane daha…' : 'Şekerli, Şekersiz…'}
              value={kategoriGiris}
              maxLength={SINIR.kategoriAdi}
              onChange={(e) => {
                // Virgül yazıldığı an ad hapa dönüşüyor; yapıştırılan "a, b, c" de böyle bölünüyor.
                if (e.target.value.includes(',')) {
                  setKategoriAdlari(prev => kategoriListesi(prev, e.target.value));
                  setKategoriGiris('');
                } else {
                  setKategoriGiris(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Formu göndermesin: Enter burada "kategoriyi ekle" demek.
                  e.preventDefault();
                  kategoriEkle();
                } else if (e.key === 'Backspace' && !kategoriGiris && kategoriAdlari.length > 0) {
                  setKategoriAdlari(prev => prev.slice(0, -1));
                }
              }}
              onBlur={() => { if (kategoriGiris.trim()) kategoriEkle(); }}
              aria-label="Yeni kategori adı"
            />
          </div>
          <p className="field-hint">İsteğe bağlı. Enter ya da virgülle ekle; sonra liste ayarlarından da değiştirebilirsin.</p>
        </div>

        {topluAcik ? (
          <TopluAlan deger={toplu} onChange={setToplu} bloklar={bloklar} autoFocus={isDesktop} sorun={topluEngel} />
        ) : (
          <button type="button" className="btn-quiet" onClick={() => setTopluAcik(true)}>
            Kayıtları da şimdi yaz
          </button>
        )}

        <p className="field-hint">
          {topluAdet > 0 && sablon
            ? 'Şablondaki kayıtlar “Denenmemiş” sekmesine düşer; denedikçe sıralamana alırsın. İstemediklerini şimdi silebilirsin.'
            : topluAdet > 0
            ? 'Kayıtlar denenmiş sayılır; sıralamayı sonra sürükleyerek düzeltirsin.'
            : kategoriAdlari.length > 0
              ? 'Ek alanları istersen liste ayarlarından eklersin.'
              : 'Ek alanları bir sonraki adımda, liste ayarlarında tanımlayacaksın.'}
        </p>

        <div className="form-screen-actions">
          <button type="button" className="btn-quiet" onClick={onClose}>Vazgeç</button>
          <button type="submit" className="btn-primary" disabled={kaydediliyor || !!topluEngel}>
            {kaydediliyor
              ? 'Oluşturuluyor…'
              : topluAdet > 0 ? `Oluştur · ${topluAdet} kayıt` : 'Oluştur'}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
