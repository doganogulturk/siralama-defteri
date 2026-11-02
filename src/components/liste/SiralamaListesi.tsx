'use client';

import React from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { AlanTanimi, Item, Kademe, Kategori } from '@/types/item';
import { Ayirici, ayiriciMi, diziyiCoz, kademeGruplari } from '@/lib/kademe';
import { KademeSiniri, SuruklenebilirKademeSiniri, kademeKimligi } from '@/components/kademe/KademeParcalari';
import { titret } from '@/lib/his';
import {
  ASLA_SINIRI, AslaSiniri, DraggableRow, StaticRow, SuruklenebilirAslaSiniri,
} from '@/components/ItemRow';
import { messages } from '@/lib/i18n';

/**
 * "Sıralamam" sekmesinin kayıtları: sıralama, vurgu çizgisi ve "Bir daha asla" bölümü.
 * Sürüklenebilir yalnızca filtresiz görünümde ve seçim modu kapalıyken; aksi hâlde
 * aynı satırların statik hâli (filtre uygulanmış `gorunen` / `gorunenAsla`).
 */
export default function SiralamaListesi({
  ranked, aslaListesi, gorunen, gorunenAsla, alanlar, kategoriler, kademeler,
  kart, suruklenebilir, secimModu, secili, onSelect, taclanan, onReorder,
}: {
  ranked: Item[];
  aslaListesi: Item[];
  gorunen: Item[];
  gorunenAsla: Item[];
  alanlar: AlanTanimi[];
  kategoriler: Kategori[];
  /** Kademeler açıksa sıralama kademe başlıklarıyla bölünüyor; `ranked` kademe sırasıyla gelmeli. */
  kademeler: Kademe[] | null;
  kart: boolean;
  suruklenebilir: boolean;
  secimModu: boolean;
  secili: (id: string) => boolean;
  onSelect: (item: Item) => void;
  /** Şampiyon yeni değiştiyse taç inen kaydın id'si (`useTac`). */
  taclanan: string | null;
  /** Bırakınca denenmişlerin yeni hâli: her kaydın `sira`'sı, `asla`'sı ve (açıksa) kademesi güncellenmiş. */
  onReorder: (next: Item[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const sinif = kart ? 'rows rows-kart' : 'rows';

  /** Kaydın sıralamadaki numarası: kademeler açıkken de numaralar baştan sona sürüyor. */
  const siraNo = new Map(ranked.map((r, i) => [r.id, i + 1]));

  /**
   * Sürüklenebilir dizi: (açıksa) kademe başlıkları ve kayıtları, "Bir daha asla" çizgisi,
   * bölümün kayıtları. Başlıklar ve çizgi listenin sürüklenemeyen öğeleri. Kademesiz grup
   * yalnızca doluyken başlık taşıyor.
   */
  const parcalar: { id: string; deger: Item | Ayirici }[] = [];
  const gruplar = kademeler ? kademeGruplari(ranked, kademeler) : [];
  /** Başlıktaki sayı: kademenin kayıt sayısı (kademesiz için `-`). */
  const adetler = new Map(gruplar.map(g => [g.kademe?.anahtar ?? '-', g.items.length]));
  if (kademeler) {
    for (const g of gruplar) {
      if (!g.kademe && g.items.length === 0) continue;
      parcalar.push({ id: kademeKimligi(g.kademe?.anahtar ?? null), deger: { kademe: g.kademe?.anahtar ?? null } });
      for (const item of g.items) parcalar.push({ id: item.id, deger: item });
    }
  } else {
    for (const item of ranked) parcalar.push({ id: item.id, deger: item });
  }
  parcalar.push({ id: ASLA_SINIRI, deger: 'asla' });
  for (const item of aslaListesi) parcalar.push({ id: item.id, deger: item });

  /**
   * Bırakınca çizginin üstü sıralama, altı bölüm oluyor; iki taraf kendi içinde 0'dan
   * numaralanıyor. Kademeler açıksa kayıt üstündeki son başlığın kademesini alıyor.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = parcalar.findIndex(p => p.id === active.id);
    const to = parcalar.findIndex(p => p.id === over.id);
    if (from === -1 || to === -1) return;
    onReorder(diziyiCoz(arrayMove(parcalar, from, to).map(p => p.deger), kademeler));
  };

  if (!suruklenebilir) {
    return (
      <div className={sinif}>
        {/* Kademeler açıksa yalnızca görünen kaydı olan kademelerin başlığı. */}
        {(kademeler ? kademeGruplari(gorunen, kademeler) : [{ kademe: null, items: gorunen }])
          .filter(g => g.items.length > 0)
          .map(g => (
            <React.Fragment key={kademeKimligi(g.kademe?.anahtar ?? null)}>
              {kademeler && <KademeSiniri kademe={g.kademe} kademeler={kademeler} adet={g.items.length} />}
              {g.items.map((item) => (
                <StaticRow
                  key={item.id}
                  item={item}
                  alanlar={alanlar}
                  kategoriler={kategoriler}
                  rank={siraNo.get(item.id) ?? 0}
                  secimModu={secimModu}
                  isSelected={secili(item.id)}
                  onSelect={onSelect}
                />
              ))}
            </React.Fragment>
          ))}
        {gorunenAsla.length > 0 && (
          <>
            <AslaSiniri adet={aslaListesi.length} />
            {gorunenAsla.map((item) => (
              <StaticRow
                key={item.id}
                item={item}
                alanlar={alanlar}
                kategoriler={kategoriler}
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
        items={parcalar.map(p => p.id)}
        // Kartlar ızgarada: satır stratejisi yalnızca dikey yer değiştirmeyi hesaplıyor.
        strategy={kart ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className={sinif}>
          {parcalar.slice(0, parcalar.findIndex(p => p.deger === 'asla')).map(({ id, deger }) => {
            if (!ayiriciMi(deger)) {
              const item = deger;
              return (
                <DraggableRow
                  key={id}
                  item={item}
                  alanlar={alanlar}
                  kategoriler={kategoriler}
                  rank={siraNo.get(item.id) ?? 0}
                  isSelected={secili(item.id)}
                  onSelect={onSelect}
                  taclandi={taclanan === item.id}
                />
              );
            }
            const anahtar = deger === 'asla' ? null : deger.kademe;
            return (
              <SuruklenebilirKademeSiniri
                key={id}
                kademe={kademeler?.find(k => k.anahtar === anahtar) ?? null}
                kademeler={kademeler ?? []}
                adet={adetler.get(anahtar ?? '-') ?? 0}
              />
            );
          })}
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
              kategoriler={kategoriler}
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
