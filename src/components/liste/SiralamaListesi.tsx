'use client';

import React from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { AlanTanimi, Item } from '../../types/item';
import { titret } from '../../lib/his';
import {
  ASLA_SINIRI, AslaSiniri, DraggableRow, StaticRow, SuruklenebilirAslaSiniri,
} from '../ItemRow';
import { messages } from '../../lib/i18n';

/**
 * "Sıralamam" sekmesinin kayıtları: sıralama, vurgu çizgisi ve "Bir daha asla" bölümü.
 * Sürüklenebilir yalnızca filtresiz görünümde ve seçim modu kapalıyken; aksi hâlde
 * aynı satırların statik hâli (filtre uygulanmış `gorunen` / `gorunenAsla`).
 */
export default function SiralamaListesi({
  ranked, aslaListesi, gorunen, gorunenAsla, alanlar,
  kart, suruklenebilir, secimModu, secili, onSelect, taclanan, onReorder,
}: {
  ranked: Item[];
  aslaListesi: Item[];
  gorunen: Item[];
  gorunenAsla: Item[];
  alanlar: AlanTanimi[];
  kart: boolean;
  suruklenebilir: boolean;
  secimModu: boolean;
  secili: (id: string) => boolean;
  onSelect: (item: Item) => void;
  /** Şampiyon yeni değiştiyse taç inen kaydın id'si (`useTac`). */
  taclanan: string | null;
  /** Bırakınca denenmişlerin yeni hâli: her kaydın `sira`'sı ve `asla`'sı güncellenmiş. */
  onReorder: (next: Item[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const sinif = kart ? 'rows rows-kart' : 'rows';

  /**
   * Sıralama ve "Bir daha asla" tek sürüklenebilir liste; aradaki çizgi de listenin
   * bir öğesi. Bırakınca çizginin üstü sıralama, altı bölüm oluyor ve iki taraf
   * kendi içinde 0'dan numaralanıyor.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const dizi: (Item | typeof ASLA_SINIRI)[] = [...ranked, ASLA_SINIRI, ...aslaListesi];
    const kimlik = (x: Item | typeof ASLA_SINIRI) => (x === ASLA_SINIRI ? x : x.id);
    const from = dizi.findIndex(x => kimlik(x) === active.id);
    const to = dizi.findIndex(x => kimlik(x) === over.id);
    if (from === -1 || to === -1) return;
    const yeni = arrayMove(dizi, from, to);
    const sinir = yeni.indexOf(ASLA_SINIRI);
    const ust = yeni.slice(0, sinir) as Item[];
    const alt = yeni.slice(sinir + 1) as Item[];
    onReorder([
      ...ust.map((item, idx) => ({ ...item, sira: idx, asla: false })),
      ...alt.map((item, idx) => ({ ...item, sira: idx, asla: true })),
    ]);
  };

  if (!suruklenebilir) {
    return (
      <div className={sinif}>
        {gorunen.map((item) => (
          <StaticRow
            key={item.id}
            item={item}
            alanlar={alanlar}
            rank={ranked.findIndex(r => r.id === item.id) + 1}
            secimModu={secimModu}
            isSelected={secili(item.id)}
            onSelect={onSelect}
          />
        ))}
        {gorunenAsla.length > 0 && (
          <>
            <AslaSiniri adet={aslaListesi.length} />
            {gorunenAsla.map((item) => (
              <StaticRow
                key={item.id}
                item={item}
                alanlar={alanlar}
                rank={0}
                asla
                secimModu={secimModu}
                isSelected={secili(item.id)}
                onSelect={onSelect}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => titret('dokunus')}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={[...ranked.map(i => i.id), ASLA_SINIRI, ...aslaListesi.map(i => i.id)]}
        // Kartlar ızgarada: satır stratejisi yalnızca dikey yer değiştirmeyi hesaplıyor.
        strategy={kart ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className={sinif}>
          {ranked.map((item, i) => (
            <DraggableRow
              key={item.id}
              item={item}
              alanlar={alanlar}
              rank={i + 1}
              isSelected={secili(item.id)}
              onSelect={onSelect}
              taclandi={taclanan === item.id}
            />
          ))}
          <SuruklenebilirAslaSiniri adet={aslaListesi.length} />
          {/* Bölüm boşken çizgi yine duruyor ki kartlar altına bırakılabilsin. */}
          {aslaListesi.length === 0 && (
            <p className="asla-bos">{messages().satir.aslaBos}</p>
          )}
          {aslaListesi.map((item) => (
            <DraggableRow
              key={item.id}
              item={item}
              alanlar={alanlar}
              rank={0}
              asla
              isSelected={secili(item.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
