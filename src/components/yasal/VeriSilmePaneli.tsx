'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { hesabiSil } from '../../lib/items';
import { hataMetni } from '../../lib/hata';
import { hesapBilgisi } from '../Hesap';
import { uyar } from '../../lib/pencere';
import { dilEtiketi, messages } from '../../lib/i18n';

/**
 * Hesap Silme sayfasının sonundaki silme kutusu: ne silineceği okunduktan sonra.
 * Giriş yapılmamışsa (sayfa mağaza kaydından ya da çıkış yapılmışken açıldıysa)
 * hiç görünmüyor, yalnızca sayfanın metni kalıyor.
 */
export default function VeriSilmePaneli() {
  const { user, loading } = useAuth();
  const m = messages().silme;
  /** Silmeyi onaylamak için yazılacak kelime: yanlışlıkla iki dokunuşla silinmesin. */
  const ONAY = m.onayKelimesi;
  const [acik, setAcik] = useState(false);
  const [onay, setOnay] = useState('');
  const [siliniyor, setSiliniyor] = useState(false);
  const [silindi, setSilindi] = useState(false);

  if (silindi) {
    return (
      <div className="silme-panel is-tamam">
        <p><strong>{m.silindi}</strong> {m.silindiAlt}</p>
      </div>
    );
  }
  if (loading || !user) return null;

  const tamam = onay.trim().toLocaleUpperCase(dilEtiketi()) === ONAY;
  const sil = async () => {
    if (!tamam || siliniyor) return;
    setSiliniyor(true);
    try {
      await hesabiSil();
      setSilindi(true);
    } catch (e: unknown) {
      void uyar(m.silinemedi(hataMetni(e)));
      setSiliniyor(false);
    }
  };

  return (
    <div className="silme-panel">
      <p>{m.girisYapildi[0]}<strong>{hesapBilgisi(user).ad}</strong>{m.girisYapildi[1]}</p>
      {!acik ? (
        <>
          <p>{m.aciklama}</p>
          <button type="button" className="btn-danger" onClick={() => setAcik(true)}>{m.dugme}</button>
        </>
      ) : (
        <>
          <p>{m.geriAlinmaz[0]}<strong>{ONAY}</strong>{m.geriAlinmaz[1]}</p>
          <input
            className="field-input"
            value={onay}
            onChange={(e) => setOnay(e.target.value)}
            aria-label={m.onayEtiketi(ONAY)}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <div className="silme-islemler">
            <button type="button" className="btn-quiet" onClick={() => { setAcik(false); setOnay(''); }}>{messages().genel.vazgec}</button>
            <button type="button" className="btn-danger" onClick={sil} disabled={!tamam || siliniyor}>
              {siliniyor ? m.siliniyor : m.kaliciSil}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
