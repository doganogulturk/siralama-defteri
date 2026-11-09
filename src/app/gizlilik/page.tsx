import type { Metadata } from 'next';
import Link from 'next/link';
import YasalSayfa, { Eposta } from '@/components/yasal/YasalSayfa';
import { VERI_SORUMLUSU, YASAL_TARIH } from '@/lib/iletisim';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'Sıralama Defteri hangi verileri neden işler, kimlerle paylaşır ve ne kadar saklar.',
};

const TURKCE = (
  <>
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

    <h2>Kamera ve mikrofon</h2>
    <p>
      Kör Sıralama&apos;yı &ldquo;Kamerayla oyna&rdquo; ile açarsan tarayıcın ön kamera ve mikrofon izni ister.
      Görüntü ve ses yalnızca kendi cihazında işlenir: videon tarayıcının içinde bir dosyaya dönüşür, bize ya da
      başka bir sunucuya gönderilmez ve saklanmaz. Videoyu paylaşmak ya da indirmek senin elindedir; paylaştığın
      uygulamanın kendi kuralları geçerlidir. Yüzün tanınmaz, yüz verisi çıkarılmaz. İzni istediğin an
      tarayıcının ayarlarından kaldırabilirsin; kamerasız oynamak her zaman mümkündür.
    </p>

    <h2>İşlenen veriler</h2>
    <ul>
      <li>
        <strong>Hesap bilgileri:</strong> Google ile girişte adın, e-posta adresin ve profil fotoğrafının adresi;
        Apple ile girişte Apple&apos;ın paylaşmana izin verdiği ad ve e-posta (gizlersen Apple&apos;ın aktarma adresi).
        Google ya da Apple şifrene hiçbir zaman erişmeyiz. Apple ile girişte Apple&apos;ın verdiği oturum jetonu da
        saklanır; tek kullanımı, hesabını sildiğinde Apple&apos;a bu girişi iptal ettirmektir.
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
        <strong>Bildirimler ve engeller:</strong> bir paylaşımı bildirirsen sebebi, açıklaman ve giriş yapmışsan
        hesabın; birini engellersen kimi engellediğin. Bildirimi yalnızca biz görürüz, paylaşana kim olduğun söylenmez.
      </li>
      <li>
        <strong>Ziyaret istatistikleri:</strong> çerezsiz, anonim sayfa görüntüleme sayıları (Vercel Web Analytics).
        Seni tanımaz, siteler arasında takip etmez; paylaşım kodları ve liste adları adresten çıkarılarak gönderilir.
      </li>
    </ul>
    <p>
      Oturumun ve dil tercihin (Türkçe / English) yalnızca kendi cihazında, tarayıcı depolamasında ve bir tercih
      çerezinde tutulur. Reklam ya da izleme çerezi kullanılmaz; verilerin satılmaz, reklam veya pazarlama için
      kullanılmaz.
    </p>

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
      Verilerin, hesabını silene kadar saklanır. Hesabını sildiğinde hesap bilgilerin ve bütün verilerin hemen
      silinir; nasıl yapılacağı <Link href="/hesap-silme">Hesap Silme</Link> sayfasında. Hizmet sağlayıcıların sunucu
      kayıtları kendi saklama sürelerine tabidir.
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
  </>
);

const INGILIZCE = (
  <>
    <p>
      This policy explains which personal data Sıralama Defteri processes, why, and the rights you have over it.
      Details under Turkish Law No. 6698 on the Protection of Personal Data are in the{' '}
      <Link href="/kvkk">KVKK Information Notice</Link>.
    </p>

    <h2>Data controller</h2>
    <p>
      Sıralama Defteri is developed and operated by {VERI_SORUMLUSU}. For any privacy question or request: <Eposta />.
    </p>

    <h2>Without signing in</h2>
    <p>
      Blind Ranking and viewing shared lists do not require signing in. In that case no data about you is kept on
      the server; your Blind Ranking result exists only inside the link you share.
    </p>

    <h2>Camera and microphone</h2>
    <p>
      If you open Blind Ranking with &ldquo;Play on camera&rdquo;, your browser asks for front camera and microphone
      access. Video and sound are processed only on your own device: your video becomes a file inside the browser
      and is not sent to us or any other server, nor stored. Sharing or downloading the video is up to you; the
      rules of the app you share it to apply. Your face is not recognised and no facial data is extracted. You can
      revoke access in your browser settings at any time; playing without the camera is always possible.
    </p>

    <h2>Data we process</h2>
    <ul>
      <li>
        <strong>Account details:</strong> your name, email address and profile photo address when you sign in with
        Google; with Apple, the name and email Apple lets you share (or Apple&apos;s relay address if you hide it). We
        never have access to your Google or Apple password. With Apple sign-in we also keep the session token Apple
        issues; its only use is asking Apple to revoke that sign-in when you delete your account.
      </li>
      <li>
        <strong>Your lists:</strong> lists, categories, entries, notes and your rankings.
      </li>
      <li>
        <strong>Photos:</strong> photos you upload are stored in reduced size; location and device information inside
        them is removed before upload.
      </li>
      <li>
        <strong>Technical data:</strong> server logs such as IP address and device information that hosting providers
        keep briefly for security.
      </li>
      <li>
        <strong>Reports and blocks:</strong> if you report a share, the reason, your note and, if signed in, your
        account; if you block someone, whom you blocked. Only we see reports; the sharer is not told who reported.
      </li>
      <li>
        <strong>Visit statistics:</strong> cookieless, anonymous page view counts (Vercel Web Analytics). They do not
        identify you or track you across sites; share codes and list names are removed from the address before
        sending.
      </li>
    </ul>
    <p>
      Your session and language preference (Türkçe / English) are kept only on your own device, in browser storage
      and a preference cookie. No advertising or tracking cookies are used; your data is not sold or used for
      advertising or marketing.
    </p>

    <h2>Who can see it</h2>
    <p>
      Your lists are visible only to you. If you create a share link for a list, anyone with the link sees that
      list&apos;s ranking, photos and your name; your notes, untried entries and email address are not shown. You can
      turn the link off at any time. If someone copies your list to their own account with &ldquo;Rank it
      myself&rdquo;, the copy is theirs.
    </p>

    <h2>Service providers</h2>
    <table>
      <thead>
        <tr><th>Provider</th><th>Purpose</th></tr>
      </thead>
      <tbody>
        <tr><td>Supabase</td><td>Database, sign-in and photo storage</td></tr>
        <tr><td>Vercel</td><td>Hosting the site and cookieless visit statistics</td></tr>
        <tr><td>Google</td><td>Sign in with Google</td></tr>
      </tbody>
    </table>
    <p>These providers&apos; servers are outside Türkiye; your data is therefore transferred abroad.</p>

    <h2>How long we keep it</h2>
    <p>
      Your data is kept until you delete your account. When you delete your account, your account details and all
      your data are deleted immediately; see <Link href="/hesap-silme">Account Deletion</Link> for how. Service
      providers&apos; server logs are subject to their own retention periods.
    </p>

    <h2>Your rights</h2>
    <p>
      To access your data, ask for it to be corrected or deleted, or exercise your other rights under Article 11 of
      the KVKK, write to <Eposta />; you will receive a reply within 30 days.
    </p>

    <h2>Children</h2>
    <p>
      Sıralama Defteri is not directed at children. Signing in with Google is only possible with accounts that meet
      Google&apos;s age requirements.
    </p>

    <h2>Changes</h2>
    <p>When we update this policy, we publish the new version on this page and change the date above.</p>
  </>
);

/**
 * Gizlilik politikası. Uygulamanın gerçekte yaptığıyla birebir olmalı: veri akışı
 * değişirse (yeni bir servis, yeni bir alan) burası, KVKK metni ve tarih de değişir.
 */
export default function GizlilikSayfasi() {
  return (
    <YasalSayfa
      tr={{ baslik: 'Gizlilik Politikası', tarih: YASAL_TARIH.tr, govde: TURKCE }}
      en={{ baslik: 'Privacy Policy', tarih: YASAL_TARIH.en, govde: INGILIZCE }}
    />
  );
}
