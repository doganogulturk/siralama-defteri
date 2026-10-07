import AuthGate from "../../components/AuthGate";

/**
 * Uygulamanın kendisi: oturum ister. Paylaşım sayfaları (`/p/[kod]`) bu grubun
 * dışında — giriş yapmamış biri de açabilsin, sunucuda çizilsin diye.
 */
export default function UygulamaLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
