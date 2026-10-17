import type { Metadata } from 'next';
import Link from 'next/link';
import YasalSayfa, { Eposta } from '../../components/yasal/YasalSayfa';
import { VERI_SORUMLUSU, YASAL_TARIH } from '../../lib/iletisim';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'Sıralama Defteri hangi verileri neden işler, kimlerle paylaşır ve ne kadar saklar.',
};

/**
 * Gizlilik politikası. Uygulamanın gerçekte yaptığıyla birebir olmalı: veri akışı
 * değişirse (yeni bir servis, yeni bir alan) burası, KVKK metni ve tarih de değişir.
 */
export default function GizlilikSayfasi() {
  return (
    <YasalSayfa baslik="Gizlilik Politikası" tarih={YASAL_TARIH}>
      <p>
        Bu politika, Sıralama Defteri&apos;nde hangi kişisel verilerin neden işlendiğini ve bu veriler üzerindeki
        haklarını anlatır. 6698 sayılı Kanun kapsamındaki ayrıntılar{' '}
        <Link href="/kvkk">KVKK Aydınlatma Metni</Link>&apos;nde.
      </p>

      <h2>Veri sorumlusu</h2>
      <p>
        Sıralama Defteri&apos;ni {VERI_SORUMLUSU} geliştirir ve işletir. Gizlilikle ilgili her soru ve talep için: <Eposta />.
      </p>

      <h2>Giriş yapmadan</h2>
      <p>
        Kör Sıralama ve paylaşılan listeleri görüntüleme giriş gerektirmez. Bu durumda sunucuda sana ait bir veri
        tutulmaz; Kör Sıralama sonucun yalnızca paylaştığın bağlantının içinde durur.
      </p>

      <h2>İşlenen veriler</h2>
      <ul>
        <li>
          <strong>Hesap bilgileri:</strong> Google ile girişte adın, e-posta adresin ve profil fotoğrafının adresi.
          Google şifrene hiçbir zaman erişmeyiz.
        </li>
        <li>
          <strong>Listelerin:</strong> listeler, kategoriler, kayıtlar, notlar ve sıralaman.
        </li>
        <li>
          <strong>Fotoğraflar:</strong> yüklediğin fotoğraflar küçültülerek saklanır; içlerindeki konum ve cihaz bilgisi
          yüklemeden önce silinir.
        </li>
        <li>
          <strong>Teknik veriler:</strong> barındırma sağlayıcılarının güvenlik için kısa süre tuttuğu IP adresi ve
          cihaz bilgisi gibi sunucu kayıtları.
        </li>
        <li>
          <strong>Ziyaret istatistikleri:</strong> çerezsiz, anonim sayfa görüntüleme sayıları (Vercel Web Analytics).
          Seni tanımaz, siteler arasında takip etmez; paylaşım kodları ve liste adları adresten çıkarılarak gönderilir.
        </li>
      </ul>
      <p>Reklam ya da izleme çerezi kullanılmaz; verilerin satılmaz, reklam veya pazarlama için kullanılmaz.</p>

      <h2>Kimler görebilir</h2>
      <p>
        Listelerin yalnızca sana açıktır. Bir liste için paylaşım bağlantısı oluşturursan bağlantıyı alan herkes o
        listenin sıralamasını, fotoğraflarını ve adını görür; notların, denenmemişlerin ve e-posta adresin görünmez.
        Bağlantıyı istediğin an kapatabilirsin. Biri listeni &ldquo;Ben de sıralayayım&rdquo; ile kendi hesabına
        kopyalarsa, kopya artık onundur.
      </p>

      <h2>Hizmet sağlayıcılar</h2>
      <table>
        <thead>
          <tr><th>Sağlayıcı</th><th>Ne için</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase</td><td>Veritabanı, oturum açma ve fotoğraf depolama</td></tr>
          <tr><td>Vercel</td><td>Sitenin barındırılması ve çerezsiz ziyaret istatistikleri</td></tr>
          <tr><td>Google</td><td>Google ile giriş</td></tr>
        </tbody>
      </table>
      <p>Bu sağlayıcıların sunucuları Türkiye dışındadır; bu nedenle verilerin yurt dışına aktarılır.</p>

      <h2>Ne kadar saklıyoruz</h2>
      <p>
        Verilerin, silene kadar saklanır. Nasıl silineceği <Link href="/hesap-silme">Hesap Silme</Link> sayfasında.
      </p>

      <h2>Hakların</h2>
      <p>
        Verilerine erişme, düzeltilmesini ya da silinmesini isteme ve KVKK&apos;nın 11. maddesindeki diğer hakların
        için <Eposta /> adresine yazabilirsin; en geç 30 gün içinde yanıt verilir.
      </p>

      <h2>Çocuklar</h2>
      <p>
        Sıralama Defteri çocuklara yönelik değildir. Google ile giriş yalnızca Google&apos;ın yaş koşullarını karşılayan
        hesaplarla yapılabilir.
      </p>

      <h2>Değişiklikler</h2>
      <p>Bu politikayı güncellediğimizde yeni hâlini bu sayfada yayımlar, üstteki tarihi değiştiririz.</p>
    </YasalSayfa>
  );
}
