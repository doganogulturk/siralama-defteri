'use client';

import React, { useMemo, useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { DraggableRow, StaticRow, SuruklenebilirAslaSiniri, ASLA_SINIRI } from './ItemRow';
import { KopyaSecimi, listeKopyala } from '../lib/kopya';
import { PaylasilanKayit, PaylasilanListe, guvenliFoto, tamlayan } from '../lib/paylasim';
import { hataMetni } from '../lib/hata';
import { titret } from '../lib/his';
import { useTac } from '../hooks/useTac';
import { Item, Liste } from '../types/item';
import { uyar } from '../lib/pencere';

/** Satır bileşeni `Item` bekliyor; paylaşılan kaydın gösterilen kısmı yetiyor. */
export const kayittanItem = (k: PaylasilanKayit): Item => ({
  id: k.id,
  list_id: '',
  category_id: k.category_id,
  ad: k.ad,
  alt_ad: k.alt_ad,
  fotograf_url: guvenliFoto(k.fotograf_url),
  denendi: true,
  ozellikler: k.ozellikler ?? {},
});

/** Fisher–Yates: kayıtlar karışık gelsin ki kişi sahibinin sırasından etkilenmesin. */
function karistir<T>(dizi: T[]): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * "Ben de sıralayayım": paylaşılan listenin kayıtları karışık sırayla geliyor; kişi
 * sürükleyerek kendi sırasına diziyor, sevmediklerini çizginin altına atıyor,
 * denemediklerine dokunup kenara ayırıyor. Kaydedince liste hesabına kopyalanıyor.
 */
export default function KopyaSiralama({ kod, kaynak, onBitti }: {
  kod: string;
  kaynak: PaylasilanListe;
  onBitti: (liste: Liste) => void;
}) {
  const kayitlar = useMemo(() => new Map(kaynak.kayitlar.map(k => [k.id, k])), [kaynak]);
  const [dizi, setDizi] = useState<string[]>(() => [...karistir(kaynak.kayitlar.map(k => k.id)), ASLA_SINIRI]);
  const [denemedim, setDenemedim] = useState<string[]>([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [ilerleme, setIlerleme] = useState<[number, number] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sinir = dizi.indexOf(ASLA_SINIRI);
  const siralama = dizi.slice(0, sinir);
  const asla = dizi.slice(sinir + 1);
  const item = (id: string) => kayittanItem(kayitlar.get(id)!);
  const alanlar = kaynak.alanlar ?? [];
  const taclanan = useTac(siralama[0], kod);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = dizi.indexOf(String(active.id));
    const to = dizi.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    setDizi(arrayMove(dizi, from, to));
  };

  const kenaraAyir = (it: Item) => {
    titret('dokunus');
    setDizi(d => d.filter(id => id !== it.id));
    setDenemedim(d => [it.id, ...d]);
  };
  const geriAl = (it: Item) => {
    titret('dokunus');
    setDenemedim(d => d.filter(id => id !== it.id));
    setDizi(d => {
      const s = d.indexOf(ASLA_SINIRI);
      return [...d.slice(0, s), it.id, ...d.slice(s)];
    });
  };

  const kaydet = async () => {
    if (kaydediliyor) return;
    setKaydediliyor(true);
    const secim: KopyaSecimi = {
      siralama: siralama.map(id => kayitlar.get(id)!),
      asla: asla.map(id => kayitlar.get(id)!),
      denenmemis: denemedim.map(id => kayitlar.get(id)!),
    };
    try {
      const liste = await listeKopyala(kod, kaynak, secim, (biten, toplam) => setIlerleme([biten, toplam]));
      titret('basari');
      onBitti(liste);
    } catch (e: unknown) {
      void uyar('Liste oluşturulamadı: ' + hataMetni(e));
      setKaydediliyor(false);
      setIlerleme(null);
    }
  };

  return (
    <div className="kiyas">
      <section className="kiyas-bas">
        <p className="paylasim-sahip">
          {kaynak.sahip ? `${tamlayan(kaynak.sahip)} listesi` : 'Paylaşılan liste'}
        </p>
        <h1 className="paylasim-baslik">{kaynak.ad}</h1>
        <p className="kiyas-soru">Sen nasıl sıralardın?</p>
        <p className="kiyas-ipucu">
          Kayıtlar karışık sırayla geldi, onunkinden etkilenme diye. Sürükleyerek kendi sırana diz;
          sevmediklerini çizginin altına at. Denemediğin bir kayda <strong>dokun</strong>, kenara ayrılsın.
        </p>
      </section>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => titret('dokunus')}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={dizi} strategy={verticalListSortingStrategy}>
          <div className="rows">
            {siralama.map((id, i) => (
              <DraggableRow
                key={id}
                item={item(id)}
                alanlar={alanlar}
                rank={i + 1}
                isSelected={false}
                onSelect={kenaraAyir}
                taclandi={taclanan === id}
              />
            ))}
            <SuruklenebilirAslaSiniri adet={asla.length} />
            {asla.length === 0 && (
              <p className="asla-bos">Bir daha asla dediklerini bu çizginin altına sürükle.</p>
            )}
            {asla.map(id => (
              <DraggableRow
                key={id}
                item={item(id)}
                alanlar={alanlar}
                rank={0}
                asla
                isSelected={false}
                onSelect={kenaraAyir}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {denemedim.length > 0 && (
        <section className="kiyas-denemedim" aria-label="Denemediklerin">
          <h2 className="kiyas-alt-baslik">
            Denemediklerin <span>{denemedim.length}</span>
          </h2>
          <p className="kiyas-ipucu">Listene “Denenmemiş” olarak geçecek. Yanlışlıkla ayırdıysan dokun, geri gelsin.</p>
          <div className="rows">
            {denemedim.map((id, i) => (
              <StaticRow
                key={id}
                item={item(id)}
                alanlar={alanlar}
                rank={i + 1}
                isSelected={false}
                onSelect={geriAl}
              />
            ))}
          </div>
        </section>
      )}

      <div className="kiyas-cubuk">
        <span className="kiyas-cubuk-ozet">
          {ilerleme && ilerleme[1] > 0
            ? <>Fotoğraflar kopyalanıyor <strong>{ilerleme[0]}/{ilerleme[1]}</strong></>
            : <><strong>{siralama.length}</strong> sıralandı{denemedim.length > 0 && <> · <strong>{denemedim.length}</strong> denenmemiş</>}</>}
        </span>
        <button
          type="button"
          className="btn-primary"
          onClick={kaydet}
          disabled={kaydediliyor || siralama.length + asla.length === 0}
        >
          {kaydediliyor ? 'Oluşturuluyor…' : 'Sıralamam hazır'}
        </button>
      </div>
    </div>
  );
}
