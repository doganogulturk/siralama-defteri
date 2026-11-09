'use client';

import React, { useEffect, useState } from 'react';
import Sheet from './Sheet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useListeler } from '@/hooks/useListeler';
import { onayla } from '@/lib/pencere';
import { hataMetni } from '@/lib/hata';
import { useMesajlar } from '@/lib/i18n/DilBaglami';

/*
 * Başkalarının paylaşımlarında güvenlik (App Store 1.2): bildir ve engelle. Paylaşılan içerik
 * uygulamada yalnızca bağlantıyla görünüyor (/p/[kod], kör sıralatma, karşılaştırma).
 *   • `BildirEngelle` — sayfanın altında "Bildir" (giriş istemiyor) ve giriş yapmışsa
 *     "Bu kişiyi engelle". Kendi paylaşımında görünmüyor.
 *   • `EngelPerdesi` — engellenen kişinin paylaşımı bu kullanıcıya perdeyle görünüyor; perdede
 *     "Engeli kaldır".
 * Sahibin kimliği istemciye hiç gelmiyor: veritabanı fonksiyonları paylaşım kodundan buluyor
 * (`paylasimi_bildir`, `paylasani_engelle`, `paylasan_engelli_mi`; supabase/schema.sql).
 * Bildirimler Supabase'deki `bildirimler` tablosunda; inceleme yolu docs/mimari.md'de.
 */

export const BILDIRIM_NEDENLERI = ['uygunsuz', 'taciz', 'spam', 'telif', 'diger'] as const;
type Neden = (typeof BILDIRIM_NEDENLERI)[number];

/** Engel değişince perde ile düğmeler birbirini duysun diye sayfa içi küçük bir haber. */
const ENGEL_OLAYI = 'siralama-defteri:engel';

/** Giriş yapmış kullanıcı bu paylaşımın sahibini engellemiş mi; oturum yoksa false. */
function useEngel(kod: string) {
  const { user } = useAuth();
  const [engelli, setEngelli] = useState(false);
  useEffect(() => {
    if (!user) return;
    let canli = true;
    const oku = () => {
      void supabase.rpc('paylasan_engelli_mi', { p_kod: kod }).then(({ data, error }) => {
        // Şema henüz kurulmamışsa (fonksiyon yok) perde yok.
        if (canli && !error) setEngelli(data === true);
      });
    };
    oku();
    window.addEventListener(ENGEL_OLAYI, oku);
    return () => { canli = false; window.removeEventListener(ENGEL_OLAYI, oku); };
  }, [kod, user]);
  return user ? engelli : false;
}

const engelDegisti = () => window.dispatchEvent(new Event(ENGEL_OLAYI));

export function EngelPerdesi({ kod, children }: { kod: string; children: React.ReactNode }) {
  const t = useMesajlar().guvenlik;
  const engelli = useEngel(kod);
  if (!engelli) return <>{children}</>;
  return (
    <main className="state-empty engel-perdesi">
      <p className="state-empty-title">{t.engellendiBaslik}</p>
      <p>{t.engellendiMetin}</p>
      <button
        type="button"
        className="btn-quiet"
        onClick={async () => {
          await supabase.rpc('paylasanin_engelini_kaldir', { p_kod: kod });
          engelDegisti();
        }}
      >
        {t.engeliKaldir}
      </button>
    </main>
  );
}

export function BildirEngelle({ kod }: { kod: string }) {
  const t = useMesajlar().guvenlik;
  const { user } = useAuth();
  const { listeler, loading } = useListeler();
  const engelli = useEngel(kod);
  const [bildirAcik, setBildirAcik] = useState(false);
  const [bilgi, setBilgi] = useState<string | null>(null);
  // Kendi paylaşımında ne bildirim ne engel; listeler gelene kadar da bekle (bir an görünmesin).
  const kendi = !!user && listeler.some(l => l.paylasim_kodu === kod);
  if (kendi || (user && loading)) return null;

  const engelle = async () => {
    if (!await onayla({ metin: t.engelleOnay, onay: t.engelle, tehlikeli: true })) return;
    const { error } = await supabase.rpc('paylasani_engelle', { p_kod: kod });
    if (error) { setBilgi(hataMetni(error)); return; }
    engelDegisti();
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="guvenlik-eylemleri">
      <button type="button" className="guvenlik-baglanti" onClick={() => setBildirAcik(true)}>{t.bildir}</button>
      {user && !engelli && (
        <button type="button" className="guvenlik-baglanti" onClick={engelle}>{t.engelle}</button>
      )}
      {bilgi && <p className="guvenlik-bilgi" role="status">{bilgi}</p>}
      {bildirAcik && (
        <BildirPenceresi
          kod={kod}
          onKapat={(gonderildi) => {
            setBildirAcik(false);
            if (gonderildi) setBilgi(t.gonderildi);
          }}
        />
      )}
    </div>
  );
}

function BildirPenceresi({ kod, onKapat }: { kod: string; onKapat: (gonderildi: boolean) => void }) {
  const m = useMesajlar();
  const t = m.guvenlik;
  const [neden, setNeden] = useState<Neden | null>(null);
  const [aciklama, setAciklama] = useState('');
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neden) return;
    setMesgul(true);
    setHata(null);
    const { error } = await supabase.rpc('paylasimi_bildir', { p_kod: kod, p_neden: neden, p_aciklama: aciklama || null });
    setMesgul(false);
    if (error) { setHata(hataMetni(error)); return; }
    onKapat(true);
  };

  return (
    <Sheet onClose={() => onKapat(false)} className="form-screen-short" label={t.bildirBaslik}>
      <header className="form-screen-header">
        <button type="button" className="form-screen-back" onClick={() => onKapat(false)} aria-label={m.genel.kapat}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 className="form-screen-title">{t.bildirBaslik}</h2>
        <span className="form-screen-header-spacer" />
      </header>
      <form className="form-screen-body bildir-form" onSubmit={gonder}>
        <p className="bildir-not">{t.bildirNot}</p>
        <fieldset className="bildir-nedenler">
          <legend>{t.nedenSec}</legend>
          {BILDIRIM_NEDENLERI.map(n => (
            <label key={n} className={`bildir-neden${neden === n ? ' is-on' : ''}`}>
              <input type="radio" name="neden" value={n} checked={neden === n} onChange={() => setNeden(n)} />
              {t.nedenler[n]}
            </label>
          ))}
        </fieldset>
        <label className="bildir-aciklama">
          <span>{t.aciklama}</span>
          <textarea value={aciklama} onChange={e => setAciklama(e.target.value)} maxLength={1000} rows={3} />
        </label>
        {hata && <p className="gate-error">{hata}</p>}
        <button type="submit" className="btn-primary" disabled={!neden || mesgul}>{t.gonder}</button>
      </form>
    </Sheet>
  );
}
