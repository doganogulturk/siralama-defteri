'use client';

import React, { useEffect, useRef } from 'react';

interface SheetProps {
  /** Esc, arka plana dokunma ve kapat düğmesi aynı yoldan geçiyor. */
  onClose: () => void;
  /** İçteki kutunun ek sınıfı: genişlik (`form-screen-short`, `form-screen-ayar`). */
  className?: string;
  /** Başlığı metin olmayan pencerelerde (liste ayarları) ekran okuyucu adı. */
  label?: string;
  children: React.ReactNode;
}

/**
 * Formların ve liste ayarlarının ortak kabuğu: yerel `<dialog>`. `showModal()`
 * pencereyi en üst katmana alıyor, arkadaki sayfayı etkisizleştiriyor ve odağı
 * içeride tutuyor — elle yazılmış bir arka plan katmanının yapamadığı şeyler.
 * Bileşen açıkken bağlanıyor, kapanınca sayfa onu kaldırıyor.
 */
export default function Sheet({ onClose, className = '', label, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  /** Basış zeminde mi başladı: alanda başlayıp dışarıda biten metin seçimi pencereyi kapatmasın. */
  const zemindenBasladi = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    // React'in autoFocus'u pencere açılmadan çalışıp boşa gidiyor; işaretli alan burada odaklanıyor.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={label}
      // Esc: tarayıcı pencereyi kendisi kapatmasın, kapanışı sayfa yönetsin.
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      // Kutunun dışı (zemin) doğrudan pencerenin kendisi.
      onPointerDown={(e) => { zemindenBasladi.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (zemindenBasladi.current && e.target === e.currentTarget) onClose(); }}
    >
      <section className={`form-screen ${className}`}>{children}</section>
    </dialog>
  );
}
