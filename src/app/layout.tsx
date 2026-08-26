import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "../components/AuthGate";

export const metadata: Metadata = {
  title: {
    default: "Sıralama Defteri",
    template: "%s | Sıralama Defteri",
  },
  description: "Denediklerini kendi listelerinde sırala: kola, döner, kahve — ne istersen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
