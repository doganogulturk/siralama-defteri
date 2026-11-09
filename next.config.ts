import type { NextConfig } from "next";

/*
 * Supabase istemcileri modül yüklenirken kuruluyor; derleme de sayfaların ayarlarını toplarken modülleri
 * yüklüyor. Değişken yoksa derleme "supabaseUrl is required" diye anlaşılmaz bir yerde düşüyordu.
 * Vercel'de değişkenler ortam başına: Preview'da (main dışındaki dallar) da tanımlı olmalı.
 */
const EKSIK = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"].filter(a => !process.env[a]);
if (EKSIK.length > 0 && process.argv.includes("build")) {
  const ortam = process.env.VERCEL_ENV ? ` (Vercel ortamı: ${process.env.VERCEL_ENV})` : "";
  throw new Error(
    `Ortam değişkeni eksik${ortam}: ${EKSIK.join(", ")}. `
    + "Yerelde .env.local'e, Vercel'de Settings → Environment Variables'a ekle; "
    + "main dışındaki dallar Preview ortamında derleniyor, değişken orada da işaretli olmalı.",
  );
}

/*
 * Uygulama paketi (Capacitor) için statik dışa aktarma: `NEXT_PUBLIC_MOBIL=1 next build` → `out/`.
 * Sunucu isteyen dosyalar `*.web.tsx` (yalnızca web), uygulamaya özel olanlar `*.mobil.tsx`;
 * ikisi de olmayan her dosya iki derlemede ortak (`lib/site.ts`, docs/mimari.md → Uygulama paketi).
 */
const MOBIL = process.env.NEXT_PUBLIC_MOBIL === "1";

const nextConfig: NextConfig = {
  ...(MOBIL ? { output: "export" as const } : {}),
  pageExtensions: MOBIL ? ["mobil.tsx", "mobil.ts", "tsx", "ts"] : ["web.tsx", "web.ts", "tsx", "ts"],
  /*
   * Görsel üreten yollar yazı tiplerini çalışma anında diskten okuyor
   * (`lib/gorsel-sunucu.ts`); izleme yolu kaçırırsa Vercel'de dosya bulunamaz.
   */
  outputFileTracingIncludes: {
    "/p/**": ["./src/fonts/**/*"],
    "/oyna/**": ["./src/fonts/**/*"],
  },
  /*
   * Oyunlar Kasım 2026'da `/kor`'dan `/oyna`'ya taşındı. Paylaşılmış bağlantılar (sonuç
   * `?s=` ve tohum `?t=` sorgularıyla) kalıcı yönlendirmeyle yeni yerinde açılıyor; sorgu
   * kendiliğinden taşınıyor. Sıra önemli: ilk eşleşen kazanıyor. Statik dışa aktarmada
   * yönlendirme yok; eski /kor bağlantıları uygulamada açılmıyor zaten.
   */
  ...(MOBIL ? {} : { redirects: yonlendirmeler, headers: baslikler }),
};

/*
 * Uygulama paketi sonuç ve story görsellerini canlı siteden `fetch` ile alıyor (adresi
 * `capacitor://localhost`); görseller herkese açık, başka kaynaktan okunabilsin.
 */
async function baslikler() {
  const cors = [{ key: "Access-Control-Allow-Origin", value: "*" }];
  return [
    { source: "/oyna/:yol*/gorsel", headers: cors },
    { source: "/oyna/sayilar/gorsel", headers: cors },
    { source: "/p/:kod/hikaye", headers: cors },
    { source: "/p/:kod/kor/gorsel", headers: cors },
  ];
}

async function yonlendirmeler() {
  return [
    { source: "/kor", destination: "/oyna", permanent: true },
    { source: "/kor/sayilar/:yol*", destination: "/oyna/sayilar/:yol*", permanent: true },
    { source: "/kor/dogru-sira/:yol*", destination: "/oyna/dogru-sira/:yol*", permanent: true },
    { source: "/kor/:liste/:yol*", destination: "/oyna/kor/:liste/:yol*", permanent: true },
    // Kasım 2026: kullanıcıya özel adresler uygulama paketi statik olsun diye sorguya geçti
    // (`/liste?s=`, `/kiyasla?k=`; lib/site.ts). Diğer sorgular (?sekme=, ?ayarlar=) taşınıyor.
    { source: "/l/:slug/ayarlar", destination: "/liste?s=:slug&ayarlar=1", permanent: true },
    { source: "/l/:slug", destination: "/liste?s=:slug", permanent: true },
    { source: "/kiyasla/:kod", destination: "/kiyasla?k=:kod", permanent: true },
  ];
}

export default nextConfig;
