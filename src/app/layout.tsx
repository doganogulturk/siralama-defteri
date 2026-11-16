import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Analitik from "@/components/Analitik";
import Pencereler from "@/components/Pencereler";
import { GezintiIzi } from "@/components/oyna/OyunGeri";
import UygulamaKoprusu from "@/components/UygulamaKoprusu";
import DilKoku from "@/components/DilKoku";
import AcilisPerdesi from "@/components/AcilisPerdesi";
import TemaKoku from "@/components/TemaKoku";
import { temaOzniteligi } from "@/lib/tema";
import { istekTemasi } from "@/lib/tema-sunucu";
import { istekDili } from "@/lib/i18n/sunucu";

/*
 * Yazı tipleri derleme anında indirilip uygulamayla birlikte sunuluyor: tarayıcı
 * Google'a istek atmıyor, yazı yüklenirken sayfa kaymıyor. latin-ext Türkçe
 * harfler (ğ, ş, ı, İ) için şart.
 */
const geist = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
});

/** Başlıklar ve sıra numaraları — yalnızca iri boyutlarda. */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

/**
 * Paylaşım bağlantılarının önizleme görseli tam adres ister. Vercel üretim alan
 * adını kendisi veriyor; yerelde geliştirme sunucusu.
 */
const siteAdresi = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteAdresi),
  title: {
    default: "Sıralama Defteri",
    template: "%s | Sıralama Defteri",
  },
  description: "Denediklerini kendi listelerinde sırala: kola, döner, kahve — ne istersen.",
  // iOS'ta ana ekrana eklenince tarayıcı çubuğu olmadan açılsın (manifest: app/manifest.ts).
  appleWebApp: { capable: true, title: "Sıralama", statusBarStyle: "default" },
};

/*
 * Tarayıcı çubuğu sayfa zeminiyle aynı renkte; tema sistemi izliyor (Profil'de elle seçilirse `TemaKoku`
 * iki etiketi de seçilen temanın rengine çeviriyor).
 * `viewportFit: cover`: sayfa çentiğin ve ana ekran çizgisinin altına uzanıyor; alt menü ve
 * yüzen düğme `env(safe-area-inset-*)` ile kendilerini içeri alıyor. Bu olmadan iPhone'da o
 * değerler hep 0.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#100e0c" },
  ],
};

/**
 * İsteğin dili çerezden ve tarayıcının dilinden okunuyor (`istekDili`): İngilizce kullanan biri de sayfayı
 * ilk çizimden kendi dilinde görsün, bir an Türkçesi görünmesin. Bunun bedeli, sayfaların statik değil her
 * istekte çizilmesi.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dil = await istekDili();
  const tema = await istekTemasi();
  return (
    // `data-tema`: Profil'de elle seçilen tema (`lib/tema.ts`), çerezden; "sistem"de yok. Uygulama paketinde
    // sunucu çerezi göremiyor, seçimi iOS sayfa başlamadan uyguluyor (`UygulamaViewController.swift`); öznitelik
    // bu yüzden sunucununkinden farklı olabiliyor, kök etikette hidrasyon uyarısı kapalı (yalnızca bu etiket).
    <html
      lang={dil}
      className={`${geist.variable} ${instrumentSerif.variable}`}
      data-tema={temaOzniteligi(tema)}
      suppressHydrationWarning
    >
      <body>
        <DilKoku baslangic={dil}>
          {children}
          <Pencereler />
          <GezintiIzi />
          <UygulamaKoprusu />
          <AcilisPerdesi />
          <TemaKoku />
        </DilKoku>
        <Analitik />
      </body>
    </html>
  );
}
