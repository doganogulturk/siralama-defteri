'use client';

import React, { useEffect, useState } from 'react';
import { Liste } from '../types/item';
import { kodUret, paylasimAdresi, paylasimMetni } from '../lib/paylasim';
import { useAuth } from '../hooks/useAuth';

interface PaylasimBolumuProps {
  liste: Liste;
  busy: boolean;
  /** Kodu yazar (null: paylaşımı kapatır); ayarların ortak kayıt yolundan geçer. */
  kodKaydet: (kod: string | null) => Promise<void> | void;
}

/**
 * Liste ayarlarındaki salt okunur paylaşım: bağlantı oluştur, paylaş ya da
 * kopyala, yenile, kapat. Bağlantıyı alan herkes giriş yapmadan sıralamayı
 * görür; notlar ve denenmemişler görünmez (`supabase/schema.sql` → `paylasilan_liste`).
 */
export default function PaylasimBolumu({ liste, busy, kodKaydet }: PaylasimBolumuProps) {
  const { user } = useAuth();
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const ad = (meta?.full_name ?? meta?.name ?? '').trim();

  const [bildirim, setBildirim] = useState<string | null>(null);
  useEffect(() => {
    if (!bildirim) return;
    const id = window.setTimeout(() => setBildirim(null), 2200);
    return () => window.clearTimeout(id);
  }, [bildirim]);

  /* Paylaşım menüsü yalnızca destekleyen tarayıcılarda (çoğunlukla telefonlar). */
  const [paylasabilir, setPaylasabilir] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaylasabilir(typeof navigator.share === 'function');
  }, []);

  const kod = liste.paylasim_kodu;
  const adres = kod ? paylasimAdresi(kod, window.location.origin) : '';
  const mesaj = `${paylasimMetni(liste.ad)}: ${adres}`;

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(adres);
      setBildirim('Bağlantı kopyalandı');
    } catch {
      setBildirim('Kopyalanamadı — bağlantıyı seçip kopyalayabilirsin');
    }
  };

  const paylas = async () => {
    try {
      await navigator.share({ title: liste.ad, text: paylasimMetni(liste.ad), url: adres });
    } catch {
      /* Kullanıcı menüyü kapattı: yapılacak bir şey yok. */
    }
  };

  const yenile = () => {
    if (!window.confirm('Yeni bir bağlantı oluşturulacak; eski bağlantı artık açılmayacak. Devam edilsin mi?')) return;
    return kodKaydet(kodUret());
  };

  const kapat = () => {
    if (!window.confirm('Paylaşım kapatılsın mı? Bağlantıyı alanlar listeyi artık göremeyecek.')) return;
    return kodKaydet(null);
  };

  return (
    <section className="ayar-bolum">
      <h2 className="ayar-bolum-baslik">Paylaşım</h2>

      {kod ? (
        <div className="paylas-acik">
          <div className="paylas-adres">
            <input
              className="field-input"
              value={adres}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Paylaşım bağlantısı"
            />
          </div>
          <div className="paylas-islemler">
            {paylasabilir && (
              <button type="button" className="btn-primary" onClick={paylas}>Paylaş</button>
            )}
            <button
              type="button"
              className={paylasabilir ? 'btn-quiet' : 'btn-primary'}
              onClick={kopyala}
            >
              Kopyala
            </button>
            <a
              className="btn-quiet"
              href={`https://wa.me/?text=${encodeURIComponent(mesaj)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
          <p className="paylas-not" aria-live="polite">
            {bildirim ?? (
              <>
                Bağlantıyı alan herkes giriş yapmadan sıralamanı görebilir
                {ad ? <> ve adını (<strong>{ad}</strong>) görür</> : null}. Notların ve denenmemişlerin görünmez.
              </>
            )}
          </p>
          <div className="paylas-islemler">
            <button type="button" className="btn-quiet" onClick={yenile} disabled={busy}>
              Bağlantıyı yenile
            </button>
            <button type="button" className="btn-danger" onClick={kapat} disabled={busy}>
              Paylaşımı kapat
            </button>
          </div>
        </div>
      ) : (
        <div className="paylas-acik">
          <p className="paylas-not">
            Bir bağlantı oluştur; alan herkes giriş yapmadan bu sıralamayı görebilsin.
            {ad ? <> Listede adın (<strong>{ad}</strong>) görünür.</> : null}{' '}
            Notların ve denenmemişlerin görünmez. Paylaşımı istediğin zaman kapatabilirsin.
          </p>
          <div className="paylas-islemler">
            <button type="button" className="btn-primary" onClick={() => kodKaydet(kodUret())} disabled={busy}>
              Paylaşım bağlantısı oluştur
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
