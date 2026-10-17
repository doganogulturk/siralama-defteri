import type { Metadata } from 'next';
import Link from 'next/link';
import YasalSayfa, { Eposta } from '../../components/yasal/YasalSayfa';
import VeriSilmePaneli from '../../components/yasal/VeriSilmePaneli';
import { VERI_SORUMLUSU } from '../../lib/iletisim';

export const metadata: Metadata = {
  title: 'Hesap Silme',
  description: 'Sıralama Defteri hesabını ve verilerini nasıl silersin.',
};

/**
 * Hesap silmenin anlatıldığı sayfa; silme düğmesi de burada, en altta — uygulamanın
 * menülerinde durmuyor (orada görünmesi insanı silmeye yöneltir). Google Play, silmenin
 * uygulama dışından da anlatıldığı bir adres istiyor; bu adres mağaza kaydına yazılır.
 */
export default function HesapSilmeSayfasi() {
  return (
    <YasalSayfa baslik="Hesap Silme">
      <p>
        Bu sayfa, {VERI_SORUMLUSU} tarafından geliştirilen <strong>Sıralama Defteri</strong>&apos;nde verilerini nasıl
        silebileceğini anlatır.
      </p>

      <h2>Uygulamanın içinden (hemen)</h2>
      <ol>
        <li>Sıralama Defteri&apos;ne silmek istediğin hesapla giriş yap.</li>
        <li>Sağ üstteki profil fotoğrafına dokun, açılan pencerede <strong>Hesap silme</strong>&apos;yi seç.</li>
        <li>Bu sayfanın sonundaki <strong>Verilerimi sil</strong> düğmesine dokun ve onayla.</li>
      </ol>
      <p>Verilerin hemen silinir ve oturumun kapanır. Bu işlem geri alınamaz.</p>

      <h2>Neler silinir</h2>
      <ul>
        <li>Bütün listelerin, kategorilerin, kayıtların ve notların,</li>
        <li>Yüklediğin bütün fotoğraflar,</li>
        <li>Paylaşım bağlantıların (bağlantılar artık açılmaz).</li>
      </ul>
      <p>
        Başkalarının &ldquo;Ben de sıralayayım&rdquo; ile kendi hesabına kopyaladığı listeler onlarındır ve silinmez.
        Google ile giriş kaydının (ad ve e-posta) da silinmesini istersen aşağıdaki adrese yazman yeterli.
      </p>

      <h2>Uygulamaya erişemiyorsan</h2>
      <p>
        <Eposta /> adresine &ldquo;Hesap silme&rdquo; konulu bir e-posta gönder ve Google hesabının e-posta adresini yaz.
        Talebin en geç 30 gün içinde sonuçlandırılır. Ayrıntılar için <Link href="/gizlilik">Gizlilik Politikası</Link>.
      </p>

      <VeriSilmePaneli />
    </YasalSayfa>
  );
}
