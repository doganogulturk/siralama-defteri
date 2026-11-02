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

const nextConfig: NextConfig = {
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
   * kendiliğinden taşınıyor. Sıra önemli: ilk eşleşen kazanıyor.
   */
  async redirects() {
    return [
      { source: "/kor", destination: "/oyna", permanent: true },
      { source: "/kor/sayilar/:yol*", destination: "/oyna/sayilar/:yol*", permanent: true },
      { source: "/kor/dogru-sira/:yol*", destination: "/oyna/dogru-sira/:yol*", permanent: true },
      { source: "/kor/:liste/:yol*", destination: "/oyna/kor/:liste/:yol*", permanent: true },
    ];
  },
};

export default nextConfig;
