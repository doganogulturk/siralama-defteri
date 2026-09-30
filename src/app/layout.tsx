import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import AuthGate from "../components/AuthGate";

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

export const metadata: Metadata = {
  title: {
    default: "Sıralama Defteri",
    template: "%s | Sıralama Defteri",
  },
  description: "Denediklerini kendi listelerinde sırala: kola, döner, kahve — ne istersen.",
};

/* Tarayıcı çubuğu sayfa zeminiyle aynı renkte; tema sistemi izliyor. */
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#100e0c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geist.variable} ${instrumentSerif.variable}`}>
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
