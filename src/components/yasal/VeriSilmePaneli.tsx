'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../lib/auth';
import { tumVerileriSil } from '../../lib/items';
import { hataMetni } from '../../lib/hata';
import { hesapBilgisi } from '../Hesap';
import { uyar } from '../../lib/pencere';

/** Silmeyi onaylamak için yazılacak kelime: yanlışlıkla iki dokunuşla silinmesin. */
const ONAY = 'SİL';

/**
 * Hesap Silme sayfasının sonundaki silme kutusu: ne silineceği okunduktan sonra.
 * Giriş yapılmamışsa (sayfa mağaza kaydından ya da çıkış yapılmışken açıldıysa)
 * hiç görünmüyor, yalnızca sayfanın metni kalıyor.
 */
export default function VeriSilmePaneli() {
  const { user, loading } = useAuth();
  const [acik, setAcik] = useState(false);
  const [onay, setOnay] = useState('');
  const [siliniyor, setSiliniyor] = useState(false);
  const [silindi, setSilindi] = useState(false);

  if (silindi) {
    return (
      <div className="silme-panel is-tamam">
        <p><strong>Verilerin silindi.</strong> Bu cihazdaki oturumun da kapandı.</p>
      </div>
    );
  }
  if (loading || !user) return null;

  const tamam = onay.trim().toLocaleUpperCase('tr') === ONAY;
  const sil = async () => {
    if (!tamam || siliniyor) return;
    setSiliniyor(true);
    try {
      await tumVerileriSil();
      await signOut();
      setSilindi(true);
    } catch (e: unknown) {
      void uyar('Veriler silinemedi: ' + hataMetni(e));
      setSiliniyor(false);
    }
  };

  return (
    <div className="silme-panel">
      <p><strong>{hesapBilgisi(user).ad}</strong> olarak giriş yaptın.</p>
      {!acik ? (
        <>
          <p>Yukarıda sayılan bütün verilerini buradan hemen silebilirsin.</p>
          <button type="button" className="btn-danger" onClick={() => setAcik(true)}>Verilerimi sil</button>
        </>
      ) : (
        <>
          <p>Bu geri alınamaz. Onaylamak için <strong>{ONAY}</strong> yaz.</p>
          <input
            className="field-input"
            value={onay}
            onChange={(e) => setOnay(e.target.value)}
            aria-label={`Onay için ${ONAY} yaz`}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <div className="silme-islemler">
            <button type="button" className="btn-quiet" onClick={() => { setAcik(false); setOnay(''); }}>Vazgeç</button>
            <button type="button" className="btn-danger" onClick={sil} disabled={!tamam || siliniyor}>
              {siliniyor ? 'Siliniyor…' : 'Kalıcı olarak sil'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
