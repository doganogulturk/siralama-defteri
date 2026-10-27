'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Item, alanKisa, bayrak, filtreAlanlari } from '../../../../types/item';
import {
  KATEGORISIZ, bosFiltre, filtreBos, filtreUygula, kategoriSayilari, bayrakSayilari,
} from '../../../../lib/filtre';
import { useListStore } from '../../../../hooks/useListStore';
import { listeleriTazele } from '../../../../hooks/useListeler';
import { useGorunum } from '../../../../hooks/useGorunum';
import { useBildirim } from '../../../../hooks/useBildirim';
import { useSecim } from '../../../../hooks/useSecim';
import { TopluBlok, topluKaydet } from '../../../../lib/toplu';
import { hataMetni } from '../../../../lib/hata';
import { uploadFotograf, deleteFotograf } from '../../../../lib/items';
import { useIsDesktop } from '../../../../hooks/useIsDesktop';
import { useTac } from '../../../../hooks/useTac';
import { ArtiIkon, ListelerIkon } from '../../../../components/MobilMenu';
import FilterPanel from '../../../../components/FilterPanel';
import DetailPane from '../../../../components/DetailPane';
import WishlistPanel from '../../../../components/WishlistPanel';
import ItemForm, { FormMode } from '../../../../components/ItemForm';
import ListeRayi from '../../../../components/ListeRayi';
import ListeAyarlariModal from '../../../../components/ListeAyarlariModal';
import PaylasMenusu from '../../../../components/PaylasMenusu';
import { BosSahne } from '../../../../components/Sahne';
import { IskeletSatirlar } from '../../../../components/Iskelet';
import SiralamaListesi from '../../../../components/liste/SiralamaListesi';
import SecimCubugu from '../../../../components/liste/SecimCubugu';
import {
  AyarlarIkon, KartIkon, PaylasIkon, SatirIkon, TopluIkon,
} from '../../../../components/liste/Ikonlar';
import { uyar, onayla } from '../../../../lib/pencere';
import { dilEtiketi, messages } from '../../../../lib/i18n';

export default function ListePage() {
  const isDesktop = useIsDesktop();
  const SLUG = String(useParams().slug ?? '');
  const m = messages();
  const t = m.liste;
  const magaza = useListStore(SLUG);
  const {
    liste, kategoriler, items,
    denenenler: ranked, aslaListesi, istekListesi,
    loading, error, isSaving,
    load, saveEntry, removeEntry, reorder,
  } = magaza;

  const alanlar = useMemo(() => liste?.alanlar ?? [], [liste]);
  const taclanan = useTac(ranked[0]?.id, SLUG, !loading);

  const [filtre, setFiltre] = useState(bosFiltre);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Bekleyenler ayrı bir route değil, aynı sayfanın ikinci sekmesi. */
  const [sekme, setSekme] = useState<'siralama' | 'sirada'>('siralama');

  const { gorunum, gorunumSec, kart: kartGorunum } = useGorunum(isDesktop);
  const [bildirim, setBildirim] = useBildirim();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('siralama');
  const [formSekmesi, setFormSekmesi] = useState<'tek' | 'toplu'>('tek');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  /** Liste ayarları popup'ı. Başka bir listenin ayar simgesinden ya da yeni liste
   *  açılışından `?ayarlar=1` ile gelinirse açık doğuyor. `?sekme=denenmemis`
   *  (şablondan açılan liste: kayıtların hepsi bekleyen) ikinci sekmeyle açıyor. */
  const [ayarlarAcik, setAyarlarAcik] = useState(false);
  const [paylasMenusu, setPaylasMenusu] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('ayarlar') && !params.has('sekme')) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (params.has('ayarlar')) setAyarlarAcik(true);
    if (params.get('sekme') === 'denenmemis') setSekme('sirada');
    // Parametre adreste kalırsa yenilemede popup yeniden açılırdı.
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  /* ── Derived data ────────────────────────────────── */
  const visible = useMemo(() => filtreUygula(ranked, filtre), [ranked, filtre]);
  const visibleAsla = useMemo(() => filtreUygula(aslaListesi, filtre), [aslaListesi, filtre]);
  const gorunenIstek = useMemo(() => filtreUygula(istekListesi, filtre), [istekListesi, filtre]);
  const canReorder = filtreBos(filtre);

  /** Sayılar "Bir daha asla" bölümünü de sayıyor: onlar da denenmiş kayıtlar. */
  const denenenTum = useMemo(() => [...ranked, ...aslaListesi], [ranked, aslaListesi]);
  const total = denenenTum.length;
  const katSayilari = useMemo(() => kategoriSayilari(denenenTum), [denenenTum]);
  const baySayilari = useMemo(() => bayrakSayilari(denenenTum, alanlar), [denenenTum, alanlar]);

  // Mobil özet satırı ilk filtrelenebilir bool alanı üzerinden kuruluyor.
  const ozetAlan = filtreAlanlari(alanlar)[0];
  const ozetEvet = ozetAlan ? denenenTum.filter(i => bayrak(i, ozetAlan.anahtar)).length : 0;

  const selectedItem = useMemo(
    () => [...denenenTum, ...istekListesi].find(i => i.id === selectedId) ?? null,
    [denenenTum, istekListesi, selectedId]
  );
  // Bekleyen kaydın sırası yok; panel #numarayı o zaman göstermiyor.
  const selectedRank = useMemo(() => {
    if (!selectedItem?.denendi) return null;
    const i = ranked.findIndex(r => r.id === selectedItem.id);
    return i === -1 ? null : i + 1;
  }, [ranked, selectedItem]);
  /** Detay panelindeki "Sıralamadaki yeri": seçili kaydın bir üstü ve bir altı. */
  const komsular = useMemo(() => {
    if (selectedRank === null) return null;
    return { ust: ranked[selectedRank - 2] ?? null, alt: ranked[selectedRank] ?? null };
  }, [ranked, selectedRank]);

  /** Seçim modunda "Tümünü seç"in kapsamı: açık sekmede filtreye uyan kayıtlar. */
  const gorunenKayitlar = sekme === 'sirada' ? gorunenIstek : [...visible, ...visibleAsla];
  const secimModu = useSecim({ magaza, gorunenKayitlar, bildir: setBildirim });
  const { secim } = secimModu;
  /** Açık sekmede kategorisi olmayan kayıtlar — filtre şeridindeki "Kategorisiz" hapının sayısı. */
  const kategorisizAdet = (sekme === 'sirada' ? istekListesi : denenenTum).filter(i => !i.category_id).length;
  const secili = (id: string) => (secim ? secim.has(id) : selectedId === id);

  const handleRowSelect = (item: Item) => {
    if (secim) { secimModu.degistir(item.id); return; }
    if (isDesktop) setSelectedId(prev => (prev === item.id ? null : item.id));
    else openForm(item.denendi ? 'siralama' : 'istek', item);
  };

  const sekmeSec = (next: 'siralama' | 'sirada') => {
    setSekme(next);
    setSelectedId(null);
    // Seçim sekmeye ait: diğer sekmedeki görünmeyen kayıtlar yanlışlıkla taşınmasın.
    secimModu.temizle();
  };

  /* ── Form ────────────────────────────────────────── */
  const openForm = (mode: FormMode, item: Item | null = null, ilk: 'tek' | 'toplu' = 'tek') => {
    setFormMode(mode);
    setFormSekmesi(ilk);
    setEditingItem(item);
    setIsFormOpen(true);
  };
  const closeForm = () => { setIsFormOpen(false); setEditingItem(null); };
  const openAdd = () => openForm('siralama');

  const handleSave = async (entry: Item, targetIndex?: number) => {
    try {
      const saved = await saveEntry(entry, editingItem, targetIndex);
      if (saved.denendi && !editingItem?.denendi) setSelectedId(saved.id);
      // Kayıt eklendi ya da bekleyenlerden sıralamaya geçti: raydaki sayı da değişti.
      listeleriTazele();
      closeForm();
    } catch (e: unknown) {
      void uyar(t.hata(hataMetni(e)));
    }
  };

  /** Toplu sekmesi: kayıtlar sıralamanın altına eklenir, sonra veri baştan okunur. */
  const handleTopluSave = async (bloklar: TopluBlok[], denendi: boolean) => {
    if (!liste) return;
    const sonSira = items.reduce((max, i) => Math.max(max, i.sira ?? 0), -1);
    await topluKaydet({ liste, kategoriler, bloklar, baslangicSira: sonSira + 1, denendi });
    await load();
    listeleriTazele();
  };

  /**
   * Detay panelinden doğrudan fotoğraf: yükle, kaydı güncelle. Düzenleme yolundan
   * geçtiği için eski fotoğrafı saveEntry depodan siliyor; kayıt güncellenemezse
   * yeni yüklenen dosya yetim kalmasın diye geri siliniyor.
   */
  const handleFotograf = async (item: Item, file: File) => {
    const url = await uploadFotograf(file);
    try {
      await saveEntry({ ...item, fotograf_url: url }, item);
    } catch (e: unknown) {
      void deleteFotograf(url);
      throw e;
    }
  };

  const handleDelete = async (item: Item) => {
    if (!(await onayla({ metin: t.silinsinMi(item.ad), onay: m.genel.sil, tehlikeli: true }))) return;
    try {
      await removeEntry(item);
      listeleriTazele();
      setSelectedId(prev => (prev === item.id ? null : prev));
      closeForm();
    } catch (e: unknown) {
      void uyar(t.silmeHatasi(hataMetni(e)));
    }
  };

  /* ── Seçim modu ──────────────────────────────────── */
  const secimAc = () => { setSelectedId(null); secimModu.ac(); };

  /** Liste ayarlarındaki "Şimdi ata" köprüsü: kategorisiz kayıtları süzüp seçim modunu açar. */
  const kategorisizAta = () => {
    setAyarlarAcik(false);
    setSekme(denenenTum.some(i => !i.category_id) ? 'siralama' : 'sirada');
    setFiltre({ ...bosFiltre(), kategoriler: new Set([KATEGORISIZ]) });
    secimAc();
  };

  const renderFilterPanel = (instanceId: string, layout: 'stack' | 'inline') => (
    <FilterPanel
      instanceId={instanceId}
      layout={layout}
      kategoriler={kategoriler}
      alanlar={alanlar}
      filtre={filtre}
      onChange={setFiltre}
      kategoriSayilari={katSayilari}
      bayrakSayilari={baySayilari}
      kategorisizAdet={kategorisizAdet}
    />
  );

  const listeAdi = liste?.ad ?? t.yedekAd;

  /**
   * Başlıktaki Paylaş: liste paylaşılıyorsa bağlantı ya da story görseli menüsü
   * (`PaylasMenusu`); paylaşılmıyorsa bağlantı oluşturulabilsin diye ayarlar.
   */
  const paylas = () => {
    if (!liste) return;
    if (!liste.paylasim_kodu) { setAyarlarAcik(true); return; }
    setPaylasMenusu(true);
  };

  const listBody = (() => {
    if (loading) return <IskeletSatirlar />;
    if (!liste) {
      return (
        <div className="state-empty">
          <p className="state-empty-title">{t.bulunamadi}</p>
          <p>{t.bulunamadiMetin(SLUG)}</p>
          <Link href="/" className="btn-primary">{t.listelerimeDon}</Link>
        </div>
      );
    }
    if (sekme === 'sirada') {
      if (istekListesi.length > 0 && gorunenIstek.length === 0) {
        return (
          <div className="state-empty">
            <p className="state-empty-title">{t.eslesenYok}</p>
            <p>{t.filtreBekleyenYok}</p>
          </div>
        );
      }
      return (
        <WishlistPanel
          items={gorunenIstek}
          kategoriler={kategoriler}
          alanlar={alanlar}
          selectedId={selectedId}
          onSelect={handleRowSelect}
          onTried={(item) => openForm('denedim', item)}
          onAdd={() => openForm('istek')}
          kart={kartGorunum}
          secimModu={!!secim}
          secililer={secim}
        />
      );
    }

    if (total === 0) {
      return (
        <div className="state-empty">
          <BosSahne tur="siralama" />
          <p className="state-empty-title">{t.bosBaslik}</p>
          <p>{t.bosMetin}</p>
          <button type="button" className="btn-primary" onClick={openAdd}>{t.ilkKayit}</button>
        </div>
      );
    }
    if (visible.length === 0 && visibleAsla.length === 0) {
      return (
        <div className="state-empty">
          <p className="state-empty-title">{t.eslesenYok}</p>
          <p>{t.filtreKayitYok}</p>
        </div>
      );
    }

    return (
      <SiralamaListesi
        ranked={ranked}
        aslaListesi={aslaListesi}
        gorunen={visible}
        gorunenAsla={visibleAsla}
        alanlar={alanlar}
        kart={kartGorunum}
        // Seçim modunda da sürükleme yok: dokunmak seçmek demek, iki hareket karışmasın.
        suruklenebilir={canReorder && !secim}
        secimModu={!!secim}
        secili={secili}
        onSelect={handleRowSelect}
        taclanan={taclanan}
        onReorder={reorder}
      />
    );
  })();

  return (
    // Seçili kayıt yokken detay sütunu kapanıyor (pane-kapali), sıralama genişliyor.
    <div className={`app${selectedItem ? '' : ' pane-kapali'}`}>
      {/* ── Sol ray: künye + liste indeksi (masaüstü) ── */}
      <ListeRayi aktifSlug={SLUG} />

      {/* ── Center: ranked list ──────────────────────── */}
      <main className={`list${kartGorunum ? ' is-kart' : ''}`}>
        {/* Başlık, sekmeler ve filtreler kaydırmada sabit; yalnızca kayıtlar hareket ediyor. */}
        <div className="sticky-top">
        <div className="mobile-brand">
          <Link href="/" className="mobile-brand-back" aria-label={m.menu.listelerim}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="mobile-brand-text">
            {/* Yüklenirken boş: yedek ad ("Sıralama") bir an görünüp listenin adına sıçramasın. */}
            <strong>{loading && !liste ? '\u00a0' : listeAdi}</strong>
            {/* Yüklenirken boş satır: başlık yüksekliği oynamasın, "Henüz sıralama yok" bir an görünmesin. */}
            <em>
              {loading || !liste
                ? ' '
                : ranked[0] ? <>{t.sampiyon}<b>{ranked[0].ad}</b></> : t.siralamaYok}
            </em>
          </span>
          <div className="mobile-brand-yan">
          <button
            type="button"
            className="mobile-brand-settings"
            aria-label={t.paylasEtiket}
            onClick={paylas}
            disabled={!liste}
          >
            {PaylasIkon}
            <span className="mobile-brand-settings-ad">{t.paylas}</span>
          </button>
          {/* Telefonda ayarlar alt menüde; başlıkta yalnızca masaüstünde (CSS). */}
          <button
            type="button"
            className="mobile-brand-settings is-ayarlar"
            aria-label={t.ayarlarEtiket}
            onClick={() => setAyarlarAcik(true)}
            disabled={!liste}
          >
            {AyarlarIkon}
            {/* Etiket yalnızca masaüstünde: mobil başlıkta sığmaz, adı keserdi. */}
            <span className="mobile-brand-settings-ad">{t.ayarlarEtiket}</span>
          </button>
          </div>
        </div>

        {total > 0 && (
          <p className="mobile-summary">
            <strong>{t.ozet(total)[0]}</strong>{t.ozet(total)[1]}
            {ozetAlan && (
              <>
                {' '}· <strong>{ozetEvet}</strong> {t.ozetEvet(alanKisa(ozetAlan).toLocaleLowerCase(dilEtiketi())).join('')} ·{' '}
                <strong>{total - ozetEvet}</strong> {t.ozetHayir}
              </>
            )}
            {/* "Ben de sıralayayım" ile kopyalanan listede kaynağıyla karşılaştırmaya kısa yol. */}
            {liste?.kaynak_kod && (
              <> · <Link href={`/kiyasla/${liste.kaynak_kod}`} className="mobile-summary-link">{t.karsilastir}</Link></>
            )}
          </p>
        )}

          {/* Masaüstünde tek satır: sekmeler solda, kategori şeridi ortada, görünüm ve "Seç" sağda.
              Mobilde satır sarıyor: sekmeler kendi satırında ortalı, altında filtreler. */}
          <div className="liste-arac">
            <nav className="tabs" aria-label={t.gorunumMenu}>
              <button
                type="button"
                className={`tab${sekme === 'siralama' ? ' is-on' : ''}`}
                aria-current={sekme === 'siralama' ? 'page' : undefined}
                onClick={() => sekmeSec('siralama')}
              >
                {t.sekmeSiralama(total)}
              </button>
              <button
                type="button"
                className={`tab${sekme === 'sirada' ? ' is-on' : ''}`}
                aria-current={sekme === 'sirada' ? 'page' : undefined}
                onClick={() => sekmeSec('sirada')}
              >
                {t.sekmeDenenmemis(istekListesi.length)}
              </button>
            </nav>
            <div className="liste-arac-filtre">
              <div className="mobile-filters">{renderFilterPanel('strip', 'inline')}</div>
              {/* Masaüstünde filtreler rayda değil, başlığın altında bir şerit */}
              <div className="desk-filters">{renderFilterPanel('desk', 'inline')}</div>
            </div>
            {isDesktop && (sekme === 'sirada' ? istekListesi.length : total) > 0 && (
              <div className="gorunum-secici" role="group" aria-label={t.gorunum}>
                <button
                  type="button"
                  className={gorunum === 'kart' ? 'is-on' : ''}
                  aria-pressed={gorunum === 'kart'}
                  aria-label={t.kartGorunumu}
                  title={t.kartGorunumu}
                  onClick={() => gorunumSec('kart')}
                >
                  {KartIkon}
                </button>
                <button
                  type="button"
                  className={gorunum === 'satir' ? 'is-on' : ''}
                  aria-pressed={gorunum === 'satir'}
                  aria-label={t.satirGorunumu}
                  title={t.satirGorunumu}
                  onClick={() => gorunumSec('satir')}
                >
                  {SatirIkon}
                </button>
              </div>
            )}
            {/* Toplu işlemler: açık sekmede kayıt varken. */}
            {(sekme === 'sirada' ? istekListesi.length : total) > 0 && (
              <button
                type="button"
                className={`secim-ac${secim ? ' is-on' : ''}`}
                aria-pressed={!!secim}
                onClick={() => (secim ? secimModu.kapat() : secimAc())}
              >
                {secim ? t.bitti : t.sec}
              </button>
            )}
          </div>

          {sekme === 'siralama' && !canReorder && (
            <p className="list-note">
              {t.filtreliNot}
            </p>
          )}
        </div>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>{m.ana.tekrarDene}</button>
          </div>
        )}

        {listBody}

        {/* Mobilde ekranın dibinde sabit bant, masaüstünde orta sütunun dibi.
            Seçim modunda ekleme düğmesinin yerini işlem çubuğu alıyor. */}
        {secim ? (
          <SecimCubugu s={secimModu} sekme={sekme} kategoriler={kategoriler} />
        ) : (
          <>
            {/* Masaüstünde yüzen düğme; telefonda alt menü (CSS hangisinin görüneceğini seçiyor). */}
            <button
              type="button"
              className="fab"
              onClick={() => openForm(sekme === 'sirada' ? 'istek' : 'siralama')}
            >
              {sekme === 'sirada' ? t.denenmemisKayitEkle : t.kayitEkle}
            </button>
            <nav className="mobil-menu" aria-label={t.listeMenusu}>
              <Link href="/" className="mobil-menu-oge">
                {ListelerIkon}
                <span>{m.menu.listelerim}</span>
              </Link>
              <button
                type="button"
                className="mobil-menu-oge"
                onClick={() => openForm(sekme === 'sirada' ? 'istek' : 'siralama')}
                disabled={!liste}
              >
                {ArtiIkon}
                <span>{sekme === 'sirada' ? t.denenmemisEkle : t.kayitEkle}</span>
              </button>
              <button
                type="button"
                className="mobil-menu-oge"
                onClick={() => openForm(sekme === 'sirada' ? 'istek' : 'siralama', null, 'toplu')}
                disabled={!liste}
              >
                {TopluIkon}
                <span>{t.topluEkle}</span>
              </button>
              <button
                type="button"
                className="mobil-menu-oge"
                onClick={() => setAyarlarAcik(true)}
                disabled={!liste}
              >
                {AyarlarIkon}
                <span>{t.ayarlar}</span>
              </button>
            </nav>
          </>
        )}
      </main>

      {/* ── Sağ: seçili kaydın detayı (masaüstü) ── */}
      {selectedItem && (
        <section className="pane">
          <div className="pane-main">
            <DetailPane
              item={selectedItem}
              rank={selectedRank}
              kategoriler={kategoriler}
              alanlar={alanlar}
              onEdit={(item) => openForm(item.denendi ? 'siralama' : 'istek', item)}
              onDelete={handleDelete}
              onFotograf={handleFotograf}
              komsular={komsular}
              onSelect={(item) => setSelectedId(item.id)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </section>
      )}

      {paylasMenusu && liste?.paylasim_kodu && (
        <PaylasMenusu
          liste={liste}
          onClose={() => setPaylasMenusu(false)}
          onAyarlar={() => { setPaylasMenusu(false); setAyarlarAcik(true); }}
          onBildirim={setBildirim}
        />
      )}

      {ayarlarAcik && liste && (
        <ListeAyarlariModal
          liste={liste}
          kategoriler={kategoriler}
          items={items}
          onChanged={load}
          onClose={() => setAyarlarAcik(false)}
          onKategorisizAta={kategorisizAta}
        />
      )}

      {isSaving || secimModu.atamaSuruyor
        ? <div className="toast">{secimModu.atamaSuruyor ? t.uygulaniyor : t.siraKaydediliyor}</div>
        : bildirim && <div className="toast" role="status">{bildirim}</div>}

      <ItemForm
        key={`${editingItem?.id ?? 'new'}-${formMode}-${isFormOpen ? 'open' : 'closed'}`}
        isOpen={isFormOpen}
        editingItem={editingItem}
        mode={formMode}
        listeAdi={listeAdi}
        kategoriler={kategoriler}
        alanlar={alanlar}
        initialCategoryId={filtre.kategoriler.size === 1 ? [...filtre.kategoriler][0] : undefined}
        existingItems={ranked}
        kayitSayisi={items.length}
        ilkSekme={formSekmesi}
        onClose={closeForm}
        onSave={handleSave}
        onTopluSave={handleTopluSave}
        onDelete={editingItem ? () => handleDelete(editingItem) : undefined}
      />
    </div>
  );
}
