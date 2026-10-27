'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { pencereAbone, pencereKapat, siradakiPencere } from '../lib/pencere';
import { messages } from '../lib/i18n';

/**
 * `lib/pencere.ts`'teki uyarı ve onay isteklerini çizen tek pencere; kök düzende bağlı.
 * Yerel `<dialog>`: açık bir formun (o da `<dialog>`) üstündeki katmana çıkıyor, odak
 * içeride kalıyor. Esc ve zemine dokunmak "Vazgeç" sayılıyor.
 */
export default function Pencereler() {
  const istek = useSyncExternalStore(pencereAbone, siradakiPencere, () => null);
  const ref = useRef<HTMLDialogElement>(null);
  const zemindenBasladi = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !istek) return;
    if (!dialog.open) dialog.showModal();
    // Silme sorusunda odak "Vazgeç"te: Enter'a basıp yanlışlıkla silmek olmasın.
    dialog.querySelector<HTMLElement>(istek.tehlikeli ? '[data-vazgec]' : '[data-onay]')?.focus();
    return () => dialog.close();
  }, [istek]);

  if (!istek) return null;
  const vazgec = () => pencereKapat(false);

  return (
    <dialog
      ref={ref}
      className="onay"
      role={istek.tur === 'onay' ? 'alertdialog' : 'dialog'}
      aria-describedby="onay-metin"
      onCancel={(e) => { e.preventDefault(); vazgec(); }}
      onPointerDown={(e) => { zemindenBasladi.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (zemindenBasladi.current && e.target === e.currentTarget) vazgec(); }}
    >
      <div className="onay-kutu">
        <p id="onay-metin" className="onay-metin">{istek.metin}</p>
        <div className="onay-dugmeler">
          {istek.tur === 'onay' && (
            <button type="button" className="btn-quiet" data-vazgec onClick={vazgec}>{messages().genel.vazgec}</button>
          )}
          <button
            type="button"
            className={istek.tehlikeli ? 'btn-danger' : 'btn-primary'}
            data-onay
            onClick={() => pencereKapat(true)}
          >
            {istek.onay}
          </button>
        </div>
      </div>
    </dialog>
  );
}
