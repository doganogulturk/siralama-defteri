'use client';

import { type PointerEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  BASLIK_Y, KAMERA_GENISLIK as W, KAMERA_YUKSEKLIK as H, KART, type Kutu,
  gruptaBos, isabet, kameraDestekleniyor, kapakKirp, kayitBicimi, sigdir, sureYaz, tuvalNoktasi, uzantiTurden, yumusak, yuvaKutulari,
} from '@/lib/kamera';
import { useMesajlar } from '@/lib/i18n/DilBaglami';
import { brandInitials } from '@/types/item';

/** Kamerada gösterilecek kayıt: adı, varsa alt adı ve (yalnızca kendi kovadan) fotoğrafı. */
export interface KameraKaydi { ad: string; alt?: string | null; foto?: string | null }

/*
 * Aşamalar: kamera izni → hazır (önizleme, "Kayda başla") → geri sayım (kayıt başladı) →
 * oyun → kapanış (son kart, kayıt sürüyor) → video (kayıt bitti, paylaş / indir).
 */
type Durum = 'izin' | 'hata' | 'hazir' | 'sayac' | 'oyun' | 'kapanis' | 'video';

const SAYAC_MS = 3000;
const KAPANIS_MS = 3200;
const UCUS_MS = 360;
const GIRIS_MS = 260;
const PARLAMA_MS = 650;

/**
 * Kör Sıralama'nın kameralı görünümü. Oyunun kendisi (geliş sırası, yuvalar, kilit)
 * çağıran bileşende; burası yalnızca çiziyor, dokunuşu yuvaya çeviriyor ve kaydediyor.
 *
 * Ön kameranın görüntüsü, başın üstündeki kart ve soldaki yuvalar tek tuvalde
 * çiziliyor; video o tuvalden (`captureStream`) ve mikrofondan kaydediliyor, yani
 * ekranda görünen ile videoya giren aynı. Düğmeler ve kayıt göstergesi tuvalin dışında
 * HTML: videoya girmiyor. Video cihazdan çıkmıyor; paylaşım sistemin menüsüyle.
 */
export default function KorKamera(props: {
  /** Kartın üstündeki hapta: "🍲 Çorbalar". */
  etiket: string;
  /** Kartın ve dolu yuvaların rengi; CSS rengi ya da `var(--accent)`. */
  renk: string;
  /** Geliş sırasıyla kayıtlar. */
  kayitlar: KameraKaydi[];
  /** Yuva → `kayitlar` indeksi; boşsa null. */
  yuvalar: (number | null)[];
  adim: number;
  kilit: boolean;
  /** Bütün kayıtlar yerleşti. */
  bitti: boolean;
  onYerlestir: (yuva: number) => void;
  /** Başlık hapındaki oyun adı; verilmezse "KÖR SIRALAMA". */
  oyunEtiketi?: string;
  /**
   * Yuvaların etiketleri ve renkleri (Kör Tier: S, S, A, A…, klasik tier renkleri);
   * verilmezse 1–10. `grup`: yuvalar bu kadarlık gruplar; dolu yuvaya dokunmak
   * grubundaki boş yuvaya yerleştiriyor.
   */
  yuvaEtiketleri?: { metin: string; renk: string }[];
  grup?: number;
  /** Son kartta yazan adres: "siralama-defteri.vercel.app/oyna/kor/corbalar". */
  adres: string;
  dosyaAdi: string;
  paylasimMetni: string;
  onSonuc: () => void;
  onYenidenCek: () => void;
  onKapat: () => void;
}) {
  const t = useMesajlar().kor;
  const k = t.kamera;
  const [durum, setDurum] = useState<Durum>('izin');
  const [hata, setHata] = useState<string | null>(null);
  const [sessiz, setSessiz] = useState(false);
  const [sure, setSure] = useState(0);
  const [video, setVideo] = useState<{ dosya: File; url: string } | null>(null);

  const tuvalRef = useRef<HTMLCanvasElement>(null);
  const kameraRef = useRef<HTMLVideoElement>(null);
  const akisRef = useRef<MediaStream | null>(null);
  const kayitciRef = useRef<MediaRecorder | null>(null);
  const kayitBasiRef = useRef(0);
  const durumBasiRef = useRef(0);
  /** Çizim döngüsü her karede en güncel hâli buradan okuyor. */
  const anlikRef = useRef({ ...props, durum: durum as Durum });
  const animRef = useRef({
    ucus: null as null | { yuva: number; kayit: number; t0: number },
    girisT0: 0,
    parlama: null as null | { yuva: number; t0: number },
    sonAdim: -1,
    kapanisT0: 0,
  });

  const grup = props.grup ?? 1;
  const yuvaKutulari_ = useMemo(() => yuvaKutulari(props.yuvalar.length, grup), [props.yuvalar.length, grup]);
  const fotolar = useFotolar(props.kayitlar);

  /** Son kayıt yerleşince kapanış: ayrı bir durum değil, oyunun bittiği an. */
  const gorunen: Durum = durum === 'oyun' && props.bitti ? 'kapanis' : durum;
  useEffect(() => { anlikRef.current = { ...props, durum: gorunen }; });

  const durumaGec = (d: Durum) => {
    durumBasiRef.current = performance.now();
    setDurum(d);
  };

  // Kamera ve mikrofon. Mikrofon reddedilirse sessiz kayıt; kamera reddedilirse hata.
  useEffect(() => {
    let iptal = false;
    const kamera: MediaTrackConstraints = {
      facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 }, frameRate: { ideal: 30 },
    };
    (async () => {
      let akis: MediaStream;
      try {
        akis = await navigator.mediaDevices.getUserMedia({ video: kamera, audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        try {
          akis = await navigator.mediaDevices.getUserMedia({ video: kamera });
          if (!iptal) setSessiz(true);
        } catch (e) {
          if (iptal) return;
          const ad = e instanceof DOMException ? e.name : '';
          setHata(ad === 'NotAllowedError' ? k.izinYok : ad === 'NotFoundError' ? k.kameraYok : k.acilamadi);
          durumaGec('hata');
          return;
        }
      }
      if (iptal) { akis.getTracks().forEach(i => i.stop()); return; }
      akisRef.current = akis;
      const v = kameraRef.current;
      if (v) {
        v.srcObject = akis;
        await v.play().catch(() => { /* muted + playsInline: iOS da oynatıyor */ });
      }
      durumaGec('hazir');
    })();
    return () => {
      iptal = true;
      const r = kayitciRef.current;
      if (r && r.state !== 'inactive') { r.onstop = null; r.stop(); }
      akisRef.current?.getTracks().forEach(i => i.stop());
      akisRef.current = null;
    };
  }, [k]);

  // Yeni kart: geliş animasyonu.
  useEffect(() => {
    const a = animRef.current;
    if (a.sonAdim !== props.adim) {
      a.sonAdim = props.adim;
      a.girisT0 = performance.now();
    }
  }, [props.adim]);

  // Geri sayım bitince oyun; son kayıt yerleşince kapanış kartı, sonra kayıt duruyor.
  useEffect(() => {
    if (gorunen === 'sayac') {
      const z = setTimeout(() => { animRef.current.girisT0 = performance.now(); durumaGec('oyun'); }, SAYAC_MS);
      return () => clearTimeout(z);
    }
    if (gorunen === 'kapanis') {
      animRef.current.kapanisT0 = performance.now();
      const z = setTimeout(() => kayitciRef.current?.stop(), KAPANIS_MS);
      return () => clearTimeout(z);
    }
  }, [gorunen]);

  // Kayıt süresi göstergesi.
  useEffect(() => {
    if (durum !== 'sayac' && durum !== 'oyun') return;
    const z = setInterval(() => setSure(performance.now() - kayitBasiRef.current), 250);
    return () => clearInterval(z);
  }, [durum]);

  useEffect(() => () => { if (video) URL.revokeObjectURL(video.url); }, [video]);

  // Çizim döngüsü: kamera açıkken her karede.
  useEffect(() => {
    if (durum === 'izin' || durum === 'hata' || durum === 'video') return;
    const tuval = tuvalRef.current;
    const ctx = tuval?.getContext('2d');
    if (!tuval || !ctx) return;
    const yazi = yaziTipleri();
    const renk = renkCoz(anlikRef.current.renk, tuval);
    let kare = 0;
    const dongu = (simdi: number) => {
      ciz(ctx, simdi, {
        anlik: anlikRef.current, anim: animRef.current, kamera: kameraRef.current, kutular: yuvaKutulari_,
        fotolar: fotolar.current, yazi, renk, t,
        durumBasi: anlikRef.current.durum === 'kapanis' ? animRef.current.kapanisT0 : durumBasiRef.current,
      });
      kare = requestAnimationFrame(dongu);
    };
    kare = requestAnimationFrame(dongu);
    return () => cancelAnimationFrame(kare);
  }, [durum, yuvaKutulari_, fotolar, t]);

  const kaydaBasla = () => {
    const tuval = tuvalRef.current;
    const kamera = akisRef.current;
    if (!tuval || !kamera) return;
    try {
      const goruntu = tuval.captureStream(30);
      const akis = new MediaStream([...goruntu.getVideoTracks(), ...kamera.getAudioTracks()]);
      const bicim = kayitBicimi(m => MediaRecorder.isTypeSupported(m));
      const secenek: MediaRecorderOptions = { videoBitsPerSecond: 4_000_000, ...(bicim.mime ? { mimeType: bicim.mime } : {}) };
      const kayitci = new MediaRecorder(akis, secenek);
      const parcalar: Blob[] = [];
      kayitci.ondataavailable = e => { if (e.data.size) parcalar.push(e.data); };
      kayitci.onstop = () => {
        const tur = (kayitci.mimeType || bicim.mime || 'video/webm').split(';')[0];
        const blob = new Blob(parcalar, { type: tur });
        const dosya = new File([blob], `${props.dosyaAdi}.${uzantiTurden(tur)}`, { type: tur });
        setVideo({ dosya, url: URL.createObjectURL(blob) });
        // Kayıt bitti: kameranın ışığı sönsün.
        akisRef.current?.getTracks().forEach(i => i.stop());
        akisRef.current = null;
        durumaGec('video');
      };
      kayitci.start(1000);
      kayitciRef.current = kayitci;
      kayitBasiRef.current = performance.now();
      setSure(0);
      durumaGec('sayac');
    } catch {
      setHata(k.kayitAlinamadi);
      durumaGec('hata');
    }
  };

  const dokun = (e: PointerEvent<HTMLCanvasElement>) => {
    const a = anlikRef.current;
    if (durum !== 'oyun' || a.kilit || a.bitti || animRef.current.ucus) return;
    const p = tuvalNoktasi(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    const dokunulan = isabet(p.x, p.y, yuvaKutulari_);
    const yuva = dokunulan === null ? null : gruptaBos(dokunulan, grup, i => a.yuvalar[i] !== null);
    if (yuva === null) return;
    const simdi = performance.now();
    animRef.current.ucus = { yuva, kayit: a.adim, t0: simdi };
    setTimeout(() => {
      animRef.current.ucus = null;
      animRef.current.parlama = { yuva, t0: performance.now() };
    }, UCUS_MS);
    a.onYerlestir(yuva);
  };

  const paylas = async () => {
    if (!video) return;
    try {
      if (navigator.canShare?.({ files: [video.dosya] })) {
        await navigator.share({ files: [video.dosya], text: props.paylasimMetni });
        return;
      }
    } catch { return; /* menü kapatıldı */ }
    indir();
  };

  const indir = () => {
    if (!video) return;
    const a = document.createElement('a');
    a.href = video.url;
    a.download = video.dosya.name;
    a.click();
  };

  const kayitta = durum === 'sayac' || durum === 'oyun';
  const paylasilabilir = !!video && typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [video.dosya] });

  return (
    <div className="kamera" role="dialog" aria-modal="true" aria-label={t.ad}>
      {/* Kameranın ham görüntüsü tuvalin arkasında: görünmez ama iOS kareleri ancak sayfadaki bir videoda çözüyor. */}
      <video ref={kameraRef} className="kamera-ham" playsInline muted autoPlay aria-hidden="true" />

      {durum !== 'video' && (
        <canvas
          ref={tuvalRef}
          className="kamera-tuval"
          width={W}
          height={H}
          onPointerDown={dokun}
          aria-label={t.siralama}
        />
      )}

      <button type="button" className="kamera-kapat" onClick={props.onKapat} aria-label={k.kapat}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
             strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      {kayitta && (
        <span className="kamera-rec" aria-live="off">
          <i aria-hidden="true" />{k.kayit} {sureYaz(sure)}
        </span>
      )}

      {/* Ekran okuyucu için oyunun durumu: tuval görsel. */}
      <p className="kamera-sr" aria-live="polite">
        {durum === 'oyun' && !props.bitti ? `${t.kacinciKayit(props.adim + 1)}: ${props.kayitlar[props.adim]?.ad ?? ''}` : ''}
      </p>

      {durum === 'izin' && <p className="kamera-not is-orta">{k.aciliyor}</p>}

      {durum === 'hata' && (
        <div className="kamera-panel">
          <p>{hata}</p>
          <button type="button" className="btn-primary" onClick={props.onKapat}>{k.kamerasiz}</button>
        </div>
      )}

      {durum === 'hazir' && (
        <div className="kamera-alt">
          <p className="kamera-not">{k.ipucu}{sessiz && <><br />{k.sessiz}</>}</p>
          <button type="button" className="kamera-basla" onClick={kaydaBasla}>
            <i aria-hidden="true" />{k.kaydaBasla}
          </button>
        </div>
      )}

      {/* Dokunmatik olmayan ve ekran okuyucu kullanan için yuvalar düğme olarak da var (görünmez). */}
      {durum === 'oyun' && !props.bitti && (
        <ol className="kamera-sr">
          {props.yuvalar.map((y, i) => (
            <li key={i}>
              <button type="button" disabled={y !== null || props.kilit} onClick={() => props.onYerlestir(i)}>
                {props.yuvaEtiketleri ? props.yuvaEtiketleri[i].metin : t.siraya(i + 1)}
              </button>
            </li>
          ))}
        </ol>
      )}

      {durum === 'video' && video && (
        <div className="kamera-video">
          <h2>{k.videoHazir}</h2>
          <video src={video.url} className="kamera-oynatici" controls playsInline loop autoPlay muted />
          <p className="kamera-not">{k.videoNot}</p>
          <div className="kamera-islemler">
            {paylasilabilir
              ? <button type="button" className="btn-primary" onClick={paylas}>{k.paylas}</button>
              : <button type="button" className="btn-primary" onClick={indir}>{k.indir}</button>}
            {paylasilabilir && <button type="button" className="btn-quiet" onClick={indir}>{k.indir}</button>}
            <button type="button" className="btn-quiet" onClick={props.onYenidenCek}>{k.yenidenCek}</button>
            <button type="button" className="btn-quiet" onClick={props.onSonuc}>{k.sonucuGor}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tarayıcı kameralı oyunu kaldırabiliyor mu. İlk çizimde false: sayfa sunucuda da
 * çiziliyor, orada kamera yok; düğme hidrasyondan sonra beliriyor.
 */
export function useKameraVar() {
  return useSyncExternalStore(hicAbone, kameraDestekleniyor, () => false);
}

const hicAbone = () => () => {};

/** Girişte "Başla"nın altındaki ikinci yol: kameralı oyun. */
export function KameraDugmesi({ onKamera }: { onKamera: () => void }) {
  const k = useMesajlar().kor.kamera;
  return (
    <>
      <button type="button" className="btn-quiet kor-kamera-ac" onClick={onKamera}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 10l5-3v10l-5-3" /><rect x="3" y="6" width="12" height="12" rx="2.5" />
        </svg>
        {k.ac}
      </button>
      <p className="kor-kamera-alt">{k.acAlt}</p>
    </>
  );
}

/* ── Fotoğraflar ─────────────────────────────────────── */

/**
 * Kayıt fotoğrafları tuvale çizilebilsin diye önceden yükleniyor. `crossOrigin` şart:
 * izinsiz başka kaynaktan bir görsel tuvali "kirletir" ve kayıt alınamaz. CORS izni
 * vermeyen görsel hiç yüklenmiyor; o kayıt baş harfleriyle çiziliyor.
 */
function useFotolar(kayitlar: KameraKaydi[]) {
  const ref = useRef(new Map<string, HTMLImageElement>());
  const adresler = kayitlar.map(k => k.foto).filter((f): f is string => !!f).join('\n');
  useEffect(() => {
    for (const adres of adresler ? adresler.split('\n') : []) {
      if (ref.current.has(adres)) continue;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => ref.current.set(adres, img);
      img.src = adres;
    }
  }, [adresler]);
  return ref;
}

/* ── Çizim ───────────────────────────────────────────── */

interface YaziTipleri { sans: string; serif: string }

/** Sayfanın yazı tipleri (next/font'un ürettiği adlar) CSS değişkenlerinden. */
function yaziTipleri(): YaziTipleri {
  const s = getComputedStyle(document.body);
  return {
    sans: s.getPropertyValue('--sans').trim() || 'system-ui, sans-serif',
    serif: s.getPropertyValue('--serif').trim() || 'Georgia, serif',
  };
}

/** `var(--accent)` gibi bir değeri tuvalin anlayacağı renge çevirir. */
function renkCoz(renk: string, yer: HTMLElement): string {
  if (!renk.startsWith('var(')) return renk;
  const el = document.createElement('span');
  el.style.color = renk;
  yer.parentElement?.appendChild(el);
  const c = getComputedStyle(el).color;
  el.remove();
  return c || '#e5532d';
}

function kutuCiz(ctx: CanvasRenderingContext2D, k: Kutu, r: number) {
  ctx.beginPath();
  ctx.roundRect(k.x, k.y, k.w, k.h, r);
}

function fotoCiz(ctx: CanvasRenderingContext2D, img: HTMLImageElement, k: Kutu, r: number) {
  const c = kapakKirp(img.naturalWidth, img.naturalHeight, k.w, k.h);
  ctx.save();
  kutuCiz(ctx, k, r);
  ctx.clip();
  ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, k.x, k.y, k.w, k.h);
  ctx.restore();
}

function ciz(ctx: CanvasRenderingContext2D, simdi: number, o: {
  anlik: {
    durum: Durum; etiket: string; kayitlar: KameraKaydi[]; yuvalar: (number | null)[]; adim: number; adres: string;
    oyunEtiketi?: string; yuvaEtiketleri?: { metin: string; renk: string }[];
  };
  anim: { ucus: null | { yuva: number; kayit: number; t0: number }; girisT0: number; parlama: null | { yuva: number; t0: number } };
  kamera: HTMLVideoElement | null;
  kutular: Kutu[];
  fotolar: Map<string, HTMLImageElement>;
  yazi: YaziTipleri;
  renk: string;
  durumBasi: number;
  t: ReturnType<typeof useMesajlar>['kor'];
}) {
  const { anlik, anim, kamera, kutular, fotolar, yazi, renk, t } = o;
  const gecen = simdi - o.durumBasi;

  // Zemin: aynadaki gibi ters çevrilmiş ön kamera.
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);
  if (kamera && kamera.readyState >= 2 && kamera.videoWidth) {
    const c = kapakKirp(kamera.videoWidth, kamera.videoHeight, W, H);
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(kamera, c.sx, c.sy, c.sw, c.sh, 0, 0, W, H);
    ctx.restore();
  }

  // Yuvaların arkasında hafif bir karartma: açık renkli arka planda da okunsun.
  // Soldan sağa eriyen tam boy bir geçiş: kenarı görünmesin.
  const golge = ctx.createLinearGradient(0, 0, 360, 0);
  golge.addColorStop(0, 'rgba(0,0,0,0.36)');
  golge.addColorStop(0.6, 'rgba(0,0,0,0.16)');
  golge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = golge;
  ctx.fillRect(0, 0, 360, H);

  // Başlık hapı.
  ctx.font = `600 24px ${yazi.sans}`;
  const baslik = `${anlik.oyunEtiketi ?? t.etiket} · ${anlik.etiket}`;
  const bw = Math.min(W - 80, ctx.measureText(baslik).width + 44);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  kutuCiz(ctx, { x: (W - bw) / 2, y: BASLIK_Y - 22, w: bw, h: 44 }, 22);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sigdir(baslik, bw - 40, [24], (m) => ctx.measureText(m).width).metin, W / 2, BASLIK_Y + 1);

  // Yuvalar.
  kutular.forEach((k, i) => {
    const kayitNo = anlik.yuvalar[i];
    const ucuyor = anim.ucus?.yuva === i;
    const dolu = kayitNo !== null && kayitNo !== undefined && !ucuyor;
    const r = 16;
    ctx.save();
    if (dolu) {
      ctx.fillStyle = renk;
      ctx.globalAlpha = 0.94;
      kutuCiz(ctx, k, r);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (i === 0) { ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); }
    } else {
      ctx.fillStyle = 'rgba(12,12,12,0.42)';
      kutuCiz(ctx, k, r);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.38)';
      ctx.stroke();
    }
    ctx.restore();

    // Yuvanın etiketi: sıra numarası ya da (Kör Tier) renkli kutuda kademe harfi.
    const yEtiket = anlik.yuvaEtiketleri?.[i];
    if (yEtiket) {
      ctx.fillStyle = yEtiket.renk;
      kutuCiz(ctx, { x: k.x + 6, y: k.y + 6, w: 40, h: k.h - 12 }, 10);
      ctx.fill();
    }
    ctx.fillStyle = yEtiket ? '#1a1512' : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 34px ${yazi.serif}`;
    ctx.fillText(yEtiket?.metin ?? String(i + 1), k.x + 26, k.y + k.h / 2 + 2);

    if (dolu) {
      const kayit = anlik.kayitlar[kayitNo];
      let x = k.x + 52;
      const img = kayit.foto ? fotolar.get(kayit.foto) : undefined;
      if (img) {
        const s = k.h - 14;
        fotoCiz(ctx, img, { x, y: k.y + 7, w: s, h: s }, 10);
        x += s + 10;
      }
      ctx.textAlign = 'left';
      const ad = sigdir(kayit.ad, k.x + k.w - x - 12, [26, 23, 20], (m, b) => { ctx.font = `600 ${b}px ${yazi.sans}`; return ctx.measureText(m).width; });
      ctx.font = `600 ${ad.boyut}px ${yazi.sans}`;
      ctx.fillText(ad.metin, x, k.y + k.h / 2 + 1);
    }

    // Yeni dolan yuvanın parlaması.
    if (anim.parlama?.yuva === i) {
      const p = (simdi - anim.parlama.t0) / PARLAMA_MS;
      if (p < 1) {
        const genis = 10 * yumusak(p);
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fff';
        kutuCiz(ctx, { x: k.x - genis, y: k.y - genis, w: k.w + genis * 2, h: k.h + genis * 2 }, r + genis);
        ctx.stroke();
        ctx.restore();
      }
    }
  });

  // Başın üstündeki kart.
  if (anlik.durum === 'hazir' || anlik.durum === 'sayac') {
    // Kayıt başlamadan: kartın yerinde liste adı; geri sayımda ortada iri rakam.
    kartCiz(ctx, KART, 1, 1, renk, yazi, { ust: anlik.durum === 'sayac' ? t.kamera.hazirOl : t.kayitAdet(anlik.kayitlar.length), ad: anlik.etiket }, undefined);
    if (anlik.durum === 'sayac') {
      const kalan = Math.max(1, Math.ceil((SAYAC_MS - gecen) / 1000));
      const p = ((SAYAC_MS - gecen) % 1000) / 1000;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p * 2.5);
      ctx.font = `400 ${200 + 60 * (1 - p)}px ${yazi.serif}`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 30;
      ctx.fillText(String(kalan), W / 2 + 120, H * 0.52);
      ctx.restore();
    }
  } else if (anlik.durum === 'oyun') {
    const ucus = anim.ucus;
    if (ucus) {
      // Kart seçilen yuvaya uçuyor.
      const p = yumusak((simdi - ucus.t0) / UCUS_MS);
      const hedef = kutular[ucus.yuva];
      const kutu = {
        x: KART.x + (hedef.x - KART.x) * p,
        y: KART.y + (hedef.y - KART.y) * p,
        w: KART.w + (hedef.w - KART.w) * p,
        h: KART.h + (hedef.h - KART.h) * p,
      };
      const kayit = anlik.kayitlar[ucus.kayit];
      kartCiz(ctx, kutu, 1 - p * 0.3, 1, renk, yazi, { ad: kayit.ad }, undefined, p);
    } else if (anlik.adim < anlik.kayitlar.length && !anlik.yuvalar.includes(anlik.adim)) {
      // Yerleşen kart, sıradaki gelene kadar (çağıranın kilidi) yeniden çizilmiyor.
      const p = yumusak((simdi - anim.girisT0) / GIRIS_MS);
      const kayit = anlik.kayitlar[anlik.adim];
      const img = kayit.foto ? fotolar.get(kayit.foto) : undefined;
      const olcek = 0.86 + 0.14 * p;
      const kutu = {
        x: KART.x + (KART.w * (1 - olcek)) / 2, y: KART.y - 24 * (1 - p) + (KART.h * (1 - olcek)) / 2,
        w: KART.w * olcek, h: KART.h * olcek,
      };
      kartCiz(ctx, kutu, p, olcek, renk, yazi, {
        ust: `${anlik.adim + 1} / ${anlik.kayitlar.length}`,
        ad: kayit.ad, alt: kayit.alt ?? undefined,
      }, img ?? (kayit.foto === undefined || kayit.foto === null ? undefined : null));
    }
  } else if (anlik.durum === 'kapanis') {
    // Son kart: davet ve adres.
    const p = yumusak(gecen / 400);
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = renk;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 30;
    kutuCiz(ctx, KART, 28);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const soru = sigdir(t.nasilSiralardin, KART.w - 48, [56, 48, 40], (m, b) => { ctx.font = `400 ${b}px ${yazi.serif}`; return ctx.measureText(m).width; });
    ctx.font = `400 ${soru.boyut}px ${yazi.serif}`;
    ctx.fillText(soru.metin, W / 2, KART.y + 68);
    const adres = sigdir(anlik.adres, KART.w - 48, [24, 20, 17], (m, b) => { ctx.font = `600 ${b}px ${yazi.sans}`; return ctx.measureText(m).width; });
    ctx.font = `600 ${adres.boyut}px ${yazi.sans}`;
    ctx.fillText(adres.metin, W / 2, KART.y + 124);
    ctx.restore();
  }
}

/** Kart: beyaz zemin, üstte küçük satır, ortada iri serif ad; varsa solda fotoğraf. */
function kartCiz(
  ctx: CanvasRenderingContext2D, k: Kutu, saydamlik: number, olcek: number, renk: string, yazi: YaziTipleri,
  metin: { ust?: string; ad: string; alt?: string },
  /** Yüklenmiş fotoğraf; null: fotoğraf var ama yüklenemedi (baş harfler); undefined: fotoğrafsız. */
  foto: HTMLImageElement | null | undefined,
  /** Uçuş ilerlemesi: kart küçülürken yazı da sığsın diye. */
  ucus = 0,
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, saydamlik));
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = ucus > 0.5 ? renk : '#fff';
  kutuCiz(ctx, k, 28 - 12 * ucus);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  const pay = 24 * olcek;
  let x = k.x + pay;
  if (foto !== undefined && ucus === 0) {
    const s = k.h - pay * 2;
    const kutu = { x, y: k.y + pay, w: s, h: s };
    if (foto) fotoCiz(ctx, foto, kutu, 16);
    else {
      ctx.fillStyle = '#eee';
      kutuCiz(ctx, kutu, 16);
      ctx.fill();
      ctx.fillStyle = '#999';
      ctx.font = `600 ${s * 0.36}px ${yazi.sans}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(brandInitials(metin.ad), kutu.x + s / 2, kutu.y + s / 2);
    }
    x += s + 20 * olcek;
  }
  const genislik = k.x + k.w - pay - x;
  const ortada = foto === undefined || ucus > 0;
  ctx.textAlign = ortada ? 'center' : 'left';
  const tx = ortada ? k.x + k.w / 2 : x;
  ctx.fillStyle = ucus > 0.5 ? '#fff' : '#161616';

  if (ucus > 0) {
    const ad = sigdir(metin.ad, Math.max(40, genislik), [68, 52, 40, 30, 24].map(b => b * (1 - ucus * 0.55)),
      (m, b) => { ctx.font = `400 ${b}px ${yazi.serif}`; return ctx.measureText(m).width; });
    ctx.font = `400 ${ad.boyut}px ${yazi.serif}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(ad.metin, tx, k.y + k.h / 2 + 2);
    ctx.restore();
    return;
  }

  ctx.textBaseline = 'alphabetic';
  if (metin.ust) {
    ctx.fillStyle = renk;
    ctx.font = `700 ${19 * olcek}px ${yazi.sans}`;
    ctx.fillText(metin.ust.toLocaleUpperCase(), tx, k.y + 46 * olcek);
  }
  ctx.fillStyle = '#161616';
  const ad = sigdir(metin.ad, genislik, [76, 68, 60, 52, 44, 38].map(b => b * olcek),
    (m, b) => { ctx.font = `400 ${b}px ${yazi.serif}`; return ctx.measureText(m).width; });
  ctx.font = `400 ${ad.boyut}px ${yazi.serif}`;
  ctx.fillText(ad.metin, tx, k.y + (metin.alt ? 112 : 124) * olcek);
  if (metin.alt) {
    ctx.fillStyle = '#555';
    const alt = sigdir(metin.alt, genislik, [24 * olcek, 20 * olcek], (m, b) => { ctx.font = `500 ${b}px ${yazi.sans}`; return ctx.measureText(m).width; });
    ctx.font = `500 ${alt.boyut}px ${yazi.sans}`;
    ctx.fillText(alt.metin, tx, k.y + 146 * olcek);
  }
  ctx.restore();
}
