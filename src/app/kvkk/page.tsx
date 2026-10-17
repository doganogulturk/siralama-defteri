import type { Metadata } from 'next';
import Link from 'next/link';
import YasalSayfa, { Eposta } from '../../components/yasal/YasalSayfa';
import { VERI_SORUMLUSU, YASAL_TARIH } from '../../lib/iletisim';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Sıralama Defteri aydınlatma metni.',
};

export default function KvkkSayfasi() {
  return (
    <YasalSayfa baslik="KVKK Aydınlatma Metni" tarih={YASAL_TARIH}>
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
        Kişisel veriler kullanıcı silene kadar saklanır. Uygulama içinden silinen listeler, kayıtlar ve fotoğraflar
        derhâl ve kalıcı olarak silinir. Hizmet sağlayıcıların sunucu kayıtları kendi saklama sürelerine tabidir.
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
        yazabilirsin. Başvurun en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. Verilerini silmek için başvuru
        gerekmez; bkz. <Link href="/hesap-silme">Hesap Silme</Link>.
      </p>
    </YasalSayfa>
  );
}
