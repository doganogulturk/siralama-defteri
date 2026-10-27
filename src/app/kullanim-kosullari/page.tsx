import type { Metadata } from 'next';
import Link from 'next/link';
import YasalSayfa, { Eposta } from '../../components/yasal/YasalSayfa';
import { VERI_SORUMLUSU, YASAL_TARIH } from '../../lib/iletisim';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: "Sıralama Defteri'nin kullanım koşulları ve kaynak lisansları.",
};

const TURKCE = (
  <>
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
  </>
);

const INGILIZCE = (
  <>
    <p>
      By using Sıralama Defteri you accept these terms. How your personal data is processed is explained in the{' '}
      <Link href="/gizlilik">Privacy Policy</Link>.
    </p>

    <h2>The service</h2>
    <p>
      Sıralama Defteri is a free app offered by {VERI_SORUMLUSU}: you rank the things you try in your own lists,
      share them and compare them. The app is provided &ldquo;as is&rdquo;; it is not guaranteed to work without
      interruption or errors. We may change features without notice, or shut down part or all of the service. To
      prevent abuse, there are reasonable limits on the number of lists, entries and photos.
    </p>

    <h2>Your content</h2>
    <ul>
      <li>The lists and notes you write and the photos you upload belong to you, and you are responsible for them.</li>
      <li>Only upload photos you took yourself or have the right to use.</li>
      <li>
        A list you create a share link for is visible to anyone with the link. You can turn the link off at any time.
      </li>
    </ul>

    <h2>Rules</h2>
    <p>The following are not allowed:</p>
    <ul>
      <li>Insulting, hateful or obscene content, or content that harasses others,</li>
      <li>Unlawful content or content that infringes others&apos; rights,</li>
      <li>Attempting to disrupt the service, bypass its limits or break its security.</li>
    </ul>
    <p>We reserve the right to remove content that breaks these rules and to close the account.</p>

    <h2>Intellectual property and credits</h2>
    <p>
      The app&apos;s design and code belong to {VERI_SORUMLUSU}. The typefaces are openly licensed:
    </p>
    <table>
      <thead>
        <tr><th>Asset</th><th>License</th></tr>
      </thead>
      <tbody>
        <tr><td>Geist (text typeface)</td><td>SIL Open Font License 1.1</td></tr>
        <tr><td>Instrument Serif (heading typeface)</td><td>SIL Open Font License 1.1</td></tr>
      </tbody>
    </table>

    <h2>Limitation of liability</h2>
    <p>
      To the extent permitted by applicable law, we cannot be held liable for indirect damages or lost entries
      arising from the use of, or inability to use, the app.
    </p>

    <h2>Changes</h2>
    <p>
      When we update these terms, we publish the new version on this page and change the date above. Continuing to
      use the app after an update means you accept the new terms.
    </p>

    <h2>Governing law and contact</h2>
    <p>These terms are governed by the laws of the Republic of Türkiye. For questions: <Eposta />.</p>
  </>
);

export default function KosullarSayfasi() {
  return (
    <YasalSayfa
      tr={{ baslik: 'Kullanım Koşulları', tarih: YASAL_TARIH.tr, govde: TURKCE }}
      en={{ baslik: 'Terms of Use', tarih: YASAL_TARIH.en, govde: INGILIZCE }}
    />
  );
}
