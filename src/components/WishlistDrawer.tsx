'use client';

import React, { useEffect, useState } from 'react';
import { AyranEntry } from '../types/ayran';
import WishlistPanel from './WishlistPanel';

const STORAGE_KEY = 'ayran-listem-acik';

interface WishlistDrawerProps {
  items: AyranEntry[];
  loading?: boolean;
  onEdit: (item: AyranEntry) => void;
  onTried: (item: AyranEntry) => void;
  onAdd: () => void;
}

/**
 * Masaüstünde sağ panelin alt kenarına sabitlenen çekmece. DetailPane'in
 * kardeşi — böylece bir kayıt seçilip detay açıldığında kaybolmuyor.
 */
export default function WishlistDrawer({ items, loading, onEdit, onTried, onAdd }: WishlistDrawerProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(window.localStorage.getItem(STORAGE_KEY) !== 'kapali');
  }, []);

  const toggle = () => {
    setOpen(prev => {
      window.localStorage.setItem(STORAGE_KEY, prev ? 'kapali' : 'acik');
      return !prev;
    });
  };

  return (
    <aside className={`wish-drawer${open ? ' is-open' : ''}`}>
      <div className="wish-drawer-head">
        <button
          type="button"
          className="wish-drawer-toggle"
          onClick={toggle}
          aria-expanded={open}
        >
          <span className="wish-drawer-chevron" aria-hidden="true">›</span>
          <span className="wish-drawer-title">Listem</span>
          <span className="wish-drawer-sub">denemek istediklerin</span>
          <span className="wish-drawer-count">{items.length}</span>
        </button>
        <button type="button" className="wish-drawer-add" onClick={onAdd} aria-label="Listeye ayran ekle">
          +
        </button>
      </div>

      {open && (
        <div className="wish-drawer-body">
          <WishlistPanel
            items={items}
            loading={loading}
            onEdit={onEdit}
            onTried={onTried}
            onAdd={onAdd}
          />
        </div>
      )}
    </aside>
  );
}
