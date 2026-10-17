'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Marka from '../../../../components/Marka';
import KopyaSiralama from '../../../../components/KopyaSiralama';
import KiyasEkrani from '../../../../components/KiyasEkrani';
import { paylasilanListeGetir } from '../../../../lib/kopya';
import { getItems, getKategoriler, getListeler } from '../../../../lib/items';
import { PaylasilanListe } from '../../../../lib/paylasim';
import { hataMetni } from '../../../../lib/hata';
import { listeleriTazele } from '../../../../hooks/useListeler';
import { Item, Kategori, Liste } from '../../../../types/item';

type Durum =
  | { tur: 'yukleniyor' }
  | { tur: 'yok' }
  | { tur: 'hata'; mesaj: string }
  | { tur: 'kendi'; liste: Liste }
  | { tur: 'sirala'; kaynak: PaylasilanListe }
  | { tur: 'kiyas'; kaynak: PaylasilanListe; liste: Liste; items: Item[]; kategoriler: Kategori[] };

const tr = (s: string) => s.trim().toLocaleLowerCase('tr');

/**
 * Paylaşım sayfasındaki "Ben de sıralayayım"ın gittiği yer. Kullanıcının bu
 * paylaşımla eşleşen bir listesi varsa karşılaştırma, yoksa kayıtları kendi sırasına
 * dizeceği ekran. Eşleşme önce `kaynak_kod` ile (bu paylaşımdan kopyalanmış liste),
 * yoksa liste adıyla — iki kişi aynı adla ayrı ayrı liste kurmuşsa da karşılaştırılsın.
 */
export default function KiyaslaSayfasi() {
  const { kod } = useParams<{ kod: string }>();
  const [durum, setDurum] = useState<Durum>({ tur: 'yukleniyor' });

  const yukle = useCallback(async () => {
    try {
      const kaynak = await paylasilanListeGetir(kod);
      if (!kaynak) { setDurum({ tur: 'yok' }); return; }
      const listeler = await getListeler();
      const kendi = listeler.find(l => l.paylasim_kodu === kod);
      if (kendi) { setDurum({ tur: 'kendi', liste: kendi }); return; }
      const liste = listeler.find(l => l.kaynak_kod === kod)
        ?? listeler.find(l => tr(l.ad) === tr(kaynak.ad));
      if (!liste) { setDurum({ tur: 'sirala', kaynak }); return; }
      const [items, kategoriler] = await Promise.all([getItems(liste.id), getKategoriler(liste.id)]);
      setDurum({ tur: 'kiyas', kaynak, liste, items, kategoriler });
    } catch (e: unknown) {
      setDurum({ tur: 'hata', mesaj: hataMetni(e) });
    }
  }, [kod]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void yukle();
  }, [yukle]);

  return (
    <div className="kiyas-sayfa">
      <header className="paylasim-bar kiyas-bar">
        <Link href="/" className="paylasim-marka" aria-label="Listelerim">
          <Marka />
        </Link>
      </header>

      {durum.tur === 'yukleniyor' && <p className="state-msg">Yükleniyor…</p>}

      {durum.tur === 'hata' && <p className="state-msg">Bir sorun çıktı: {durum.mesaj}</p>}

      {durum.tur === 'yok' && (
        <div className="state-empty">
          <p className="state-empty-title">Bu bağlantı artık geçerli değil</p>
          <p>Liste sahibi paylaşımı kapatmış ya da bağlantıyı yenilemiş olabilir.</p>
          <Link href="/" className="btn-quiet">Listelerime dön</Link>
        </div>
      )}

      {durum.tur === 'kendi' && (
        <div className="state-empty">
          <p className="state-empty-title">Bu senin listen</p>
          <p>Bağlantıyı arkadaşlarına gönder: kendi sıralamalarını yapıp seninkiyle karşılaştırabilirler.</p>
          <Link href={`/l/${durum.liste.slug}`} className="btn-quiet">Listeye git</Link>
        </div>
      )}

      {durum.tur === 'sirala' && (
        <KopyaSiralama
          kod={kod}
          kaynak={durum.kaynak}
          onBitti={() => {
            listeleriTazele();
            window.scrollTo({ top: 0 });
            void yukle();
          }}
        />
      )}

      {durum.tur === 'kiyas' && (
        <KiyasEkrani
          kod={kod}
          kaynak={durum.kaynak}
          liste={durum.liste}
          items={durum.items}
          kategoriler={durum.kategoriler}
          onDegisti={() => { listeleriTazele(); void yukle(); }}
        />
      )}
    </div>
  );
}
