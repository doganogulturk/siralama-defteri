import type { Metadata } from 'next';
import Link from 'next/link';
import Marka from '../../components/Marka';
import { GIZLILIK_TARIHI, ILETISIM_EPOSTA, VERI_SORUMLUSU } from '../../lib/iletisim';

export const metadata: Metadata = {
  title: 'Gizlilik politikası',
  description: 'Sıralama Defteri hangi verileri neden tutuyor, kimlerle paylaşıyor ve nasıl silinir.',
};

/**
 * Gizlilik politikası ve KVKK aydınlatma metni. Oturum istemiyor (uygulama grubunun
 * dışında): giriş ekranından, Google'ın OAuth doğrulamasından ve mağaza
 * kayıtlarından bağlantı verilebilsin diye. Uygulamanın gerçekte yaptığıyla
 * birebir olmalı — veri akışı değişirse (yeni bir servis, yeni bir alan) burası da.
 */
export default function GizlilikSayfasi() {
  return (
    <div className="metin-sayfa">
      <header className="paylasim-bar">
        <Link href="/" className="paylasim-marka" aria-label="Sıralama Defteri ana sayfa">
          <Marka />
        </Link>
      </header>

      <main>
        <h1 className="paylasim-baslik">Gizlilik</h1>
        <p className="metin-tarih">Son güncelleme: {GIZLILIK_TARIHI}</p>

        <p>
          Sıralama Defteri, denediğin şeyleri kendi listelerinde sıralaman için bir uygulama. Bu metin
          hangi verileri neden tuttuğumuzu, kimlerle paylaştığımızı ve onları nasıl silebileceğini
          anlatıyor. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki aydınlatma
          metni de budur.
        </p>

        <h2>Veri sorumlusu</h2>
        <p>
          {VERI_SORUMLUSU}. Sorular ve başvurular için:{' '}
          <a href={`mailto:${ILETISIM_EPOSTA}`}>{ILETISIM_EPOSTA}</a>
        </p>

        <h2>Hangi verileri tutuyoruz?</h2>
        <ul>
          <li>
            <strong>Google hesabı bilgilerin:</strong> Google ile giriş yaptığında adın, e-posta adresin
            ve profil fotoğrafının adresi. Şifren bize hiç gelmez.
          </li>
          <li>
            <strong>Senin yazdıkların:</strong> listelerin, kategorilerin, kayıtların, notların, ek
            alanların ve sıralaman.
          </li>
          <li>
            <strong>Yüklediğin fotoğraflar:</strong> yüklemeden önce telefonunda küçültülür; bu sırada
            fotoğrafın içindeki konum ve cihaz bilgisi (EXIF) silinir.
          </li>
          <li>
            <strong>Anonim ziyaret istatistikleri:</strong> hangi sayfaların kaç kez açıldığı, kabaca
            hangi ülkeden ve hangi cihaz türünden. Çerez kullanılmaz, seni tanımlayan bir bilgi tutulmaz
            ve siteler arasında takip yapılmaz.
          </li>
        </ul>
        <p>Reklam yok; verilerini satmıyoruz, reklam ya da profil çıkarma amacıyla kullanmıyoruz.</p>

        <h2>Neden tutuyoruz?</h2>
        <p>
          Uygulamanın çalışması için: listelerini sana göstermek, cihazların arasında eşitlemek ve
          paylaşmayı seçtiğin listeleri bağlantıyla açılabilir kılmak. Ziyaret istatistikleri yalnızca
          hangi özelliklerin kullanıldığını görüp uygulamayı geliştirmek için. Hukuki sebep, KVKK
          madde 5/2-c: hizmetin, yani kullanıcıyla kurulan ilişkinin gereği.
        </p>

        <h2>Kimler görebilir?</h2>
        <ul>
          <li>
            Listelerin varsayılan olarak <strong>yalnızca sana</strong> açık.
          </li>
          <li>
            Bir liste için paylaşım bağlantısı oluşturursan bağlantıyı alan herkes giriş yapmadan o
            listenin <strong>sıralamasını, “Bir daha asla” bölümünü, fotoğraflarını ve adını</strong>{' '}
            görür. Notların, denenmemişlerin ve e-posta adresin görünmez. Bağlantıyı istediğin zaman
            yenileyebilir ya da kapatabilirsin.
          </li>
          <li>
            Biri paylaştığın listeyi “Ben de sıralayayım” ile kendi hesabına kopyalarsa, kopyalanan
            kayıtlar ve fotoğraflar artık onun listesidir; senin paylaşımı kapatman o kopyayı silmez.
          </li>
        </ul>

        <h2>Hizmet sağlayıcılar ve yurt dışına aktarım</h2>
        <p>Veriler, uygulamayı çalıştıran şu servislerde tutuluyor:</p>
        <ul>
          <li><strong>Supabase:</strong> veritabanı, giriş ve fotoğraf depolama.</li>
          <li><strong>Vercel:</strong> sitenin barındırılması ve anonim ziyaret istatistikleri.</li>
          <li><strong>Google:</strong> yalnızca giriş için.</li>
        </ul>
        <p>
          Bu servislerin sunucuları Türkiye dışında. Uygulamayı kullanarak verilerinin bu servislere,
          yalnızca yukarıdaki amaçlarla aktarılmasına açık rıza vermiş olursun; rızanı geri çekmek
          için verilerini silmen yeterli.
        </p>

        <h2>Verilerini silmek</h2>
        <p>
          Uygulamada sağ üstteki adına dokun → <strong>Hesabım</strong> → <strong>Verilerimi sil</strong>.
          Bütün listelerin, kayıtların, fotoğrafların ve paylaşım bağlantıların hemen ve kalıcı
          olarak silinir.
        </p>
        <p>
          Giriş kaydın (ad ve e-posta) aynı altyapıyı kullanan başka uygulamalarımla ortak olduğu için
          bu düğmeyle silinmiyor. Onun da silinmesini istersen{' '}
          <a href={`mailto:${ILETISIM_EPOSTA}?subject=Hesap%20silme`}>{ILETISIM_EPOSTA}</a> adresine
          yazman yeterli; en geç 30 gün içinde silinir.
        </p>

        <h2>Hakların</h2>
        <p>
          KVKK madde 11 uyarınca verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini
          ya da silinmesini isteme, aktarıldığı tarafları bilme ve itiraz etme hakların var. Başvurunu
          yukarıdaki e-posta adresine gönderebilirsin; en geç 30 gün içinde yanıtlanır.
        </p>

        <h2>Çocuklar</h2>
        <p>Uygulama 13 yaşından küçükler için tasarlanmadı.</p>

        <h2>Değişiklikler</h2>
        <p>
          Bu metin değişirse güncel hâli bu sayfada, yukarıdaki tarihle yayımlanır.
        </p>
      </main>

      <footer className="paylasim-son">
        <Link href="/" className="btn-quiet">Uygulamaya dön</Link>
      </footer>
    </div>
  );
}
