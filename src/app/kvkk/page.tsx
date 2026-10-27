import type { Metadata } from 'next';
import Link from 'next/link';
import YasalSayfa, { Eposta } from '../../components/yasal/YasalSayfa';
import { VERI_SORUMLUSU, YASAL_TARIH } from '../../lib/iletisim';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Sıralama Defteri aydınlatma metni.',
};

const TURKCE = (
  <>
    <p>
      Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun (&ldquo;KVKK&rdquo;) 10. maddesi uyarınca
      Sıralama Defteri kullanıcılarını bilgilendirmek için hazırlanmıştır. Aynı konuların sade anlatımı{' '}
      <Link href="/gizlilik">Gizlilik Politikası</Link>&apos;nda.
    </p>

    <h2>1. Veri sorumlusu</h2>
    <p>Veri sorumlusu {VERI_SORUMLUSU}&apos;tür. İletişim: <Eposta />.</p>

    <h2>2. İşlenen kişisel veriler</h2>
    <table>
      <thead>
        <tr><th>Kategori</th><th>Veriler</th></tr>
      </thead>
      <tbody>
        <tr><td>Kimlik</td><td>Ad ve soyad, profil fotoğrafı (Google ile girişte)</td></tr>
        <tr><td>İletişim</td><td>E-posta adresi</td></tr>
        <tr><td>Müşteri işlem</td><td>Hesap kimliği; listeler, kayıtlar, notlar, sıralamalar ve yüklenen fotoğraflar</td></tr>
        <tr><td>İşlem güvenliği</td><td>IP adresi, tarayıcı veya cihaz bilgisi, oturum bilgileri ve sunucu kayıtları</td></tr>
        <tr><td>Ziyaret istatistikleri</td><td>Görüntülenen sayfa (paylaşım kodu ve liste adı çıkarılarak), kabaca ülke ve cihaz türü</td></tr>
      </tbody>
    </table>

    <h2>3. Amaçlar ve hukuki sebepler</h2>
    <table>
      <thead>
        <tr><th>Amaç</th><th>Hukuki sebep (KVKK m. 5/2)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Hesap oluşturma, oturum açma, listelerin saklanması, paylaşım ve karşılaştırmanın sunulması</td>
          <td>(c) Sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması</td>
        </tr>
        <tr>
          <td>Hizmetin ve bilgi güvenliğinin sağlanması, kötüye kullanımın önlenmesi</td>
          <td>(f) Veri sorumlusunun meşru menfaati</td>
        </tr>
        <tr>
          <td>Sayfaların ne kadar kullanıldığının anonim olarak ölçülmesi ve uygulamanın iyileştirilmesi</td>
          <td>(f) Veri sorumlusunun meşru menfaati</td>
        </tr>
        <tr>
          <td>Yetkili kurumların talepleri ve hukuki yükümlülüklerin yerine getirilmesi</td>
          <td>(ç) Hukuki yükümlülüğün yerine getirilmesi</td>
        </tr>
      </tbody>
    </table>
    <p>
      Paylaşım bağlantısı oluşturulan listede ad, sıralama ve fotoğraflar kullanıcının kendi tercihiyle bağlantıyı
      alanlara açılır. E-posta adresi hiçbir zaman diğer kullanıcılara gösterilmez.
    </p>

    <h2>4. Toplama yöntemi</h2>
    <p>
      Kişisel veriler uygulama üzerinden elektronik ortamda; hesap bilgileri Google ile girişte Google&apos;dan, diğerleri
      doğrudan kullanıcıdan ve kullanım sırasında otomatik yollarla toplanır.
    </p>

    <h2>5. Aktarım</h2>
    <p>
      Kişisel veriler yalnızca hizmetin sunulması amacıyla, veri işleyen sıfatıyla hizmet veren Supabase (veritabanı,
      kimlik doğrulama, dosya depolama), Vercel (barındırma ve ziyaret istatistikleri) ve Google&apos;a (Google ile
      giriş) aktarılır. Bu sağlayıcıların sunucuları Türkiye dışında olduğundan veriler KVKK m. 9 çerçevesinde yurt
      dışına aktarılmaktadır. Bunun dışında veriler yalnızca kanunen yetkili kurumlara, talep hâlinde aktarılabilir;
      satılmaz, reklam veya pazarlama amacıyla paylaşılmaz.
    </p>

    <h2>6. Saklama süresi</h2>
    <p>
      Kişisel veriler kullanıcı hesabını silene kadar saklanır. Hesap uygulama içinden silindiğinde hesap bilgileri,
      listeler, kayıtlar ve fotoğraflar derhâl ve kalıcı olarak silinir; uygulama içinden tek tek silinen listeler,
      kayıtlar ve fotoğraflar da aynı şekilde silinir. Hizmet sağlayıcıların sunucu kayıtları kendi saklama
      sürelerine tabidir.
    </p>

    <h2>7. KVKK m. 11 kapsamındaki hakların</h2>
    <ol type="a">
      <li>Kişisel verilerinin işlenip işlenmediğini öğrenme,</li>
      <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
      <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
      <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
      <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
      <li>KVKK m. 7 çerçevesinde silinmesini veya yok edilmesini isteme,</li>
      <li>(e) ve (f) bentleri uyarınca yapılan işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
      <li>Münhasıran otomatik sistemlerle analiz sonucu aleyhine bir sonucun ortaya çıkmasına itiraz etme,</li>
      <li>Kanuna aykırı işleme nedeniyle zarara uğrarsan zararın giderilmesini talep etme.</li>
    </ol>

    <h2>8. Başvuru</h2>
    <p>
      Haklarını kullanmak için talebini ve Google hesabının e-posta adresini belirterek <Eposta /> adresine
      yazabilirsin. Başvurun en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. Hesabını ve verilerini silmek için
      başvuru gerekmez; bkz. <Link href="/hesap-silme">Hesap Silme</Link>.
    </p>
  </>
);

const INGILIZCE = (
  <>
    <p>
      This notice has been prepared under Article 10 of Turkish Law No. 6698 on the Protection of Personal Data
      (&ldquo;KVKK&rdquo;) to inform users of Sıralama Defteri. The same topics are explained in plain language in the{' '}
      <Link href="/gizlilik">Privacy Policy</Link>.
    </p>

    <h2>1. Data controller</h2>
    <p>The data controller is {VERI_SORUMLUSU}. Contact: <Eposta />.</p>

    <h2>2. Personal data processed</h2>
    <table>
      <thead>
        <tr><th>Category</th><th>Data</th></tr>
      </thead>
      <tbody>
        <tr><td>Identity</td><td>First and last name, profile photo (when signing in with Google)</td></tr>
        <tr><td>Contact</td><td>Email address</td></tr>
        <tr><td>Customer transactions</td><td>Account ID; lists, entries, notes, rankings and uploaded photos</td></tr>
        <tr><td>Transaction security</td><td>IP address, browser or device information, session information and server logs</td></tr>
        <tr><td>Visit statistics</td><td>Page viewed (with share code and list name removed), approximate country and device type</td></tr>
      </tbody>
    </table>

    <h2>3. Purposes and legal grounds</h2>
    <table>
      <thead>
        <tr><th>Purpose</th><th>Legal ground (KVKK Art. 5/2)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Creating accounts, signing in, storing lists, and providing sharing and comparison</td>
          <td>(c) Directly related to the conclusion or performance of a contract</td>
        </tr>
        <tr>
          <td>Ensuring the service and information security, and preventing abuse</td>
          <td>(f) Legitimate interest of the data controller</td>
        </tr>
        <tr>
          <td>Anonymously measuring how much pages are used and improving the app</td>
          <td>(f) Legitimate interest of the data controller</td>
        </tr>
        <tr>
          <td>Responding to requests from competent authorities and fulfilling legal obligations</td>
          <td>(ç) Fulfilment of a legal obligation</td>
        </tr>
      </tbody>
    </table>
    <p>
      For a list with a share link, the name, ranking and photos are made visible to people with the link at the
      user&apos;s own choice. The email address is never shown to other users.
    </p>

    <h2>4. Method of collection</h2>
    <p>
      Personal data is collected electronically through the app: account details from Google when signing in with
      Google, and other data directly from the user and automatically during use.
    </p>

    <h2>5. Transfers</h2>
    <p>
      Personal data is transferred only to provide the service, to processors acting on our behalf: Supabase
      (database, authentication, file storage), Vercel (hosting and visit statistics) and Google (Sign in with
      Google). As these providers&apos; servers are outside Türkiye, data is transferred abroad within the framework of
      KVKK Article 9. Otherwise, data may only be transferred to legally authorised bodies upon request; it is not
      sold or shared for advertising or marketing.
    </p>

    <h2>6. Retention period</h2>
    <p>
      Personal data is kept until the user deletes their account. When the account is deleted from within the app,
      account details, lists, entries and photos are deleted immediately and permanently; lists, entries and photos
      deleted individually in the app are deleted the same way. Service providers&apos; server logs are subject to
      their own retention periods.
    </p>

    <h2>7. Your rights under KVKK Article 11</h2>
    <ol type="a">
      <li>To learn whether your personal data is processed,</li>
      <li>If it is processed, to request information about it,</li>
      <li>To learn the purpose of processing and whether it is used in line with that purpose,</li>
      <li>To know the third parties to whom it is transferred in Türkiye or abroad,</li>
      <li>To request correction if it is incomplete or inaccurate,</li>
      <li>To request its deletion or destruction under KVKK Article 7,</li>
      <li>To request that third parties to whom it was transferred be notified of actions under (e) and (f),</li>
      <li>To object to a result against you arising from analysis exclusively by automated systems,</li>
      <li>To claim compensation if you suffer damage due to unlawful processing.</li>
    </ol>

    <h2>8. Applications</h2>
    <p>
      To exercise your rights, write to <Eposta /> stating your request and your Google account&apos;s email address.
      Your application will be concluded free of charge within 30 days at the latest. No application is needed to
      delete your account and data; see <Link href="/hesap-silme">Account Deletion</Link>.
    </p>
  </>
);

/** KVKK m. 10 aydınlatma metni. İngilizcesi bilgi amaçlı çeviri; esas metin Türkçe. */
export default function KvkkSayfasi() {
  return (
    <YasalSayfa
      tr={{ baslik: 'KVKK Aydınlatma Metni', tarih: YASAL_TARIH.tr, govde: TURKCE }}
      en={{ baslik: 'KVKK Information Notice', tarih: YASAL_TARIH.en, govde: INGILIZCE, bilgiAmacli: true }}
    />
  );
}
