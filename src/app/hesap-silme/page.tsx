import type { Metadata } from 'next';
import Link from 'next/link';
import YasalSayfa, { Eposta } from '../../components/yasal/YasalSayfa';
import VeriSilmePaneli from '../../components/yasal/VeriSilmePaneli';
import { VERI_SORUMLUSU } from '../../lib/iletisim';

export const metadata: Metadata = {
  title: 'Hesap Silme',
  description: 'Sıralama Defteri hesabını ve verilerini nasıl silersin.',
};

const TURKCE = (
  <>
    <p>
      Bu sayfa, {VERI_SORUMLUSU} tarafından geliştirilen <strong>Sıralama Defteri</strong>&apos;nde hesabını ve
      verilerini nasıl silebileceğini anlatır.
    </p>

    <h2>Uygulamanın içinden (hemen)</h2>
    <ol>
      <li>Sıralama Defteri&apos;ne silmek istediğin hesapla giriş yap.</li>
      <li>Sağ üstteki profil fotoğrafına dokun, açılan pencerede <strong>Hesap silme</strong>&apos;yi seç.</li>
      <li>Bu sayfanın sonundaki <strong>Hesabımı sil</strong> düğmesine dokun ve onayla.</li>
    </ol>
    <p>Hesabın ve bütün verilerin hemen silinir, oturumun kapanır. Bu işlem geri alınamaz.</p>

    <h2>Neler silinir</h2>
    <ul>
      <li>Hesabın: Google ile giriş kaydın (adın, e-posta adresin ve profil fotoğrafının adresi),</li>
      <li>Bütün listelerin, kategorilerin, kayıtların ve notların,</li>
      <li>Yüklediğin bütün fotoğraflar,</li>
      <li>Paylaşım bağlantıların (bağlantılar artık açılmaz).</li>
    </ul>
    <p>
      Başkalarının &ldquo;Ben de sıralayayım&rdquo; ile kendi hesabına kopyaladığı listeler onlarındır ve silinmez. Aynı
      Google hesabıyla daha sonra yeniden giriş yaparsan boş, yeni bir hesap açılır.
    </p>

    <h2>Uygulamaya erişemiyorsan</h2>
    <p>
      <Eposta /> adresine &ldquo;Hesap silme&rdquo; konulu bir e-posta gönder ve Google hesabının e-posta adresini yaz.
      Talebin en geç 30 gün içinde sonuçlandırılır. Ayrıntılar için <Link href="/gizlilik">Gizlilik Politikası</Link>.
    </p>

    <VeriSilmePaneli />
  </>
);

const INGILIZCE = (
  <>
    <p>
      This page explains how to delete your account and data in <strong>Sıralama Defteri</strong>, developed by{' '}
      {VERI_SORUMLUSU}.
    </p>

    <h2>From within the app (immediately)</h2>
    <ol>
      <li>Sign in to Sıralama Defteri with the account you want to delete.</li>
      <li>Tap your profile photo at the top right and choose <strong>Account deletion</strong> in the window that opens.</li>
      <li>Tap <strong>Delete my account</strong> at the end of this page and confirm.</li>
    </ol>
    <p>Your account and all your data are deleted immediately and you are signed out. This cannot be undone.</p>

    <h2>What is deleted</h2>
    <ul>
      <li>Your account: your Google sign-in record (your name, email address and profile photo address),</li>
      <li>All your lists, categories, entries and notes,</li>
      <li>All photos you uploaded,</li>
      <li>Your share links (they will no longer open).</li>
    </ul>
    <p>
      Lists that others copied to their own accounts with &ldquo;Rank it myself&rdquo; belong to them and are not
      deleted. If you sign in again later with the same Google account, a new, empty account is created.
    </p>

    <h2>If you can&apos;t access the app</h2>
    <p>
      Send an email with the subject &ldquo;Account deletion&rdquo; to <Eposta /> and include your Google account&apos;s
      email address. Your request will be completed within 30 days. For details, see the{' '}
      <Link href="/gizlilik">Privacy Policy</Link>.
    </p>

    <VeriSilmePaneli />
  </>
);

/**
 * Hesap silmenin anlatıldığı sayfa; silme düğmesi de burada, en altta — uygulamanın
 * menülerinde durmuyor (orada görünmesi insanı silmeye yöneltir). Google Play, silmenin
 * uygulama dışından da anlatıldığı bir adres istiyor; bu adres mağaza kaydına yazılır.
 */
export default function HesapSilmeSayfasi() {
  return (
    <YasalSayfa
      tr={{ baslik: 'Hesap Silme', govde: TURKCE }}
      en={{ baslik: 'Account Deletion', govde: INGILIZCE }}
    />
  );
}
