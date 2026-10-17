import type { Metadata } from 'next';
import Link from 'next/link';
import YasalSayfa, { Eposta } from '../../components/yasal/YasalSayfa';
import { VERI_SORUMLUSU, YASAL_TARIH } from '../../lib/iletisim';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: "Sıralama Defteri'nin kullanım koşulları ve kaynak lisansları.",
};

export default function KosullarSayfasi() {
  return (
    <YasalSayfa baslik="Kullanım Koşulları" tarih={YASAL_TARIH}>
      <p>
        Sıralama Defteri&apos;ni kullanarak bu koşulları kabul etmiş olursun. Kişisel verilerinin nasıl işlendiği{' '}
        <Link href="/gizlilik">Gizlilik Politikası</Link>&apos;nda anlatılır.
      </p>

      <h2>Hizmet</h2>
      <p>
        Sıralama Defteri, {VERI_SORUMLUSU} tarafından sunulan ücretsiz bir uygulamadır: denediğin şeyleri kendi
        listelerinde sıralar, paylaşır ve karşılaştırırsın. Uygulama &ldquo;olduğu gibi&rdquo; sunulur; kesintisiz ya
        da hatasız çalışacağı garanti edilmez. Özellikleri önceden haber vermeden değiştirebilir, bir bölümünü ya da
        tamamını kapatabiliriz. Kötüye kullanımı önlemek için liste, kayıt ve fotoğraf sayısında makul sınırlar vardır.
      </p>

      <h2>Senin içeriğin</h2>
      <ul>
        <li>Yazdığın listeler, notlar ve yüklediğin fotoğraflar sana aittir; sorumluluğu da sendedir.</li>
        <li>Yalnızca kendi çektiğin ya da kullanma hakkın olan fotoğrafları yükle.</li>
        <li>
          Paylaşım bağlantısı oluşturduğun liste, bağlantıyı alan herkese açılır. Bağlantıyı istediğin an kapatabilirsin.
        </li>
      </ul>

      <h2>Kurallar</h2>
      <p>Şunlar yasaktır:</p>
      <ul>
        <li>Hakaret, nefret söylemi, müstehcenlik içeren ya da başkasını taciz eden içerik,</li>
        <li>Hukuka aykırı ya da başkasının haklarını ihlal eden içerik,</li>
        <li>Hizmetin çalışmasını bozmaya, sınırlarını aşmaya ya da güvenliğini aşmaya çalışmak.</li>
      </ul>
      <p>Bu kurallara uymayan içeriği kaldırma ve hesabı kapatma hakkımız saklıdır.</p>

      <h2>Fikri mülkiyet ve kaynaklar</h2>
      <p>
        Uygulamanın tasarımı ve kodu {VERI_SORUMLUSU}&apos;e aittir. Yazı tipleri açık lisanslıdır:
      </p>
      <table>
        <thead>
          <tr><th>Varlık</th><th>Lisans</th></tr>
        </thead>
        <tbody>
          <tr><td>Geist (metin yazı tipi)</td><td>SIL Open Font License 1.1</td></tr>
          <tr><td>Instrument Serif (başlık yazı tipi)</td><td>SIL Open Font License 1.1</td></tr>
        </tbody>
      </table>

      <h2>Sorumluluğun sınırı</h2>
      <p>
        Yürürlükteki mevzuatın izin verdiği ölçüde, uygulamanın kullanılmasından ya da kullanılamamasından doğan dolaylı
        zararlardan ve kaybolan kayıtlardan sorumlu tutulamayız.
      </p>

      <h2>Değişiklikler</h2>
      <p>
        Bu koşulları güncellediğimizde yeni hâlini bu sayfada yayımlar, üstteki tarihi değiştiririz. Güncellemeden sonra
        uygulamayı kullanmaya devam etmen yeni koşulları kabul ettiğin anlamına gelir.
      </p>

      <h2>Uygulanacak hukuk ve iletişim</h2>
      <p>Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Soruların için: <Eposta />.</p>
    </YasalSayfa>
  );
}
