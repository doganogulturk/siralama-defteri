import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Görsel üreten yollar yazı tiplerini çalışma anında diskten okuyor
   * (`lib/gorsel-sunucu.ts`); izleme yolu kaçırırsa Vercel'de dosya bulunamaz.
   */
  outputFileTracingIncludes: {
    "/p/**": ["./src/fonts/**/*"],
  },
};

export default nextConfig;
