# Yol haritası

Üç grup: yayına çıkış için panellerde (Vercel, Supabase, Google Cloud) yapılacaklar, mobil uygulamaya (App Store / Play Store) geçiş ve sıradaki özellikler. Gruplar kendi içinde öncelik sırasında.

## Yayına çıkış (panellerde yapılacaklar)

| # | İş | Not |
|---|---|---|
| 1 | **Domain** | Satın al, Vercel'e bağla; Supabase → Authentication → URL Configuration → Redirect URLs'e ekle. Eklenmezse Google girişi yeni domainde **sessizce** bozulur (giriş `redirectTo` olarak `window.location.origin` kullanıyor). `metadataBase`, story ve Kör Sıralama görsellerindeki adres domaine kendiliğinden geçer. |
| 2 | **Google giriş ekranının markası** | Google Cloud Console → OAuth onay ekranı: uygulama adı, logo, gizlilik politikası (`/gizlilik`) ve koşullar (`/kullanim-kosullari`) adresleri, domain doğrulaması. Doğrulanmamışken ekranda "…supabase.co'ya devam et" yazar. Uygulamanın kendi Google Cloud projesi ve OAuth istemcisi Ekim 2026'da kuruldu (adı ve adresleri girildi); kalan logo ve domain doğrulaması. |
| 3 | **Gerçek cihazda deneme** | Başka bir hesapla "Ben de sıralayayım" ve karşılaştırma, story'yi Instagram'a paylaşma, Kör Sıralama bağlantısının WhatsApp önizlemesi ve arkadaş modu, ana ekrana ekleme (PWA). |

## Mobil uygulama (Capacitor, App Store / Play Store)

Apple Developer hesabı onaylanınca. Harita Avcısı aynı yoldan geçti (Capacitor, yerel geri tuşu, titreşim, paylaşım, sistem tarayıcısı); çözümleri oradan uyarlanabilir.

| # | İş | Not |
|---|---|---|
| 1 | **Mimari kararı** *(önce bu)* | Harita Avcısı statik paket (`output: "export"`); Sıralama Defteri sunucu istiyor (paylaşım sayfası, story/önizleme/Kör Sıralama görselleri, ikonlar). Siteyi açan bir kabuk Apple'da **4.2 Asgari İşlevsellik**'ten reddedilmeye açık. Doğru yol: uygulama ekranları statik pakette, görseller ve paylaşım sayfaları Vercel'de; uygulama onları tam adresle çağırır. Diğer maddelerin çoğu bu karara bağlı. |
| 2 | **Hesabın tamamen silinmesi** | Apple 5.1.1(v) ve Google Play verilerin değil **hesabın** silinmesini istiyor. "Verilerimi sil" giriş kaydını (`auth.users`) bırakıyor, çünkü Supabase projesi başka uygulamalarla paylaşılıyor. Seçenekler: Sıralama Defteri'ni kendi Supabase projesine taşımak (o zaman bir Edge Function kaydı silebilir) ya da paylaşılan projede yalnızca bu uygulamaya ait bir hesap kavramı kurmak. |
| 3 | **Apple ile giriş** | Apple 4.8: Google ile giriş varsa gizliliği koruyan ikinci bir seçenek (pratikte Sign in with Apple) zorunlu. Supabase'de hazır sağlayıcı; Apple Developer hesabı gerekiyor. [Kabul edilmiş sınırlar](kararlar.md)'daki "Apple girişi yok" maddesi iOS için geçersizleşiyor. |
| 4 | **Google girişi sistem tarayıcısında** | Google gömülü web görünümünde girişi engelliyor (`disallowed_useragent`). Giriş sistem tarayıcısında açılmalı (`@capacitor/browser` / ASWebAuthenticationSession), derin bağlantıyla uygulamaya dönmeli; dönüş adresi Supabase Redirect URLs'e eklenmeli. |
| 5 | **Kullanıcı içeriği: bildir ve engelle** | Apple 1.2: paylaşılan listelerde (fotoğraflar dahil) uygunsuz içeriği bildirme, kötüye kullananı engelleme ve iletişim bilgisi gerekiyor. Şu an yalnızca iletişim var; paylaşım ve karşılaştırma sayfalarına "Bildir" ve bir inceleme yolu. |
| 6 | **Android geri tuşu** | Açık pencereler (formlar, liste ayarları, Hesabım, paylaşım menüsü) geri tuşuyla kapanmalı. "Denenmemiş" sekmesinin adresi yok — geri tuşu listeden çıkıyor; sekme adrese yazılmalı (bkz. [kabul edilmiş sınırlar](kararlar.md)). Harita Avcısı'ndaki `NativeBackButton` uyarlanabilir. |
| 7 | **Bağlantıların uygulamada açılması** | `/p/…`, `/kiyasla/…` ve `/kor/…?s=` uygulama yüklüyse uygulamada açılmalı: domaine `apple-app-site-association` (Universal Links) ve `assetlinks.json` (App Links). Domain gerekiyor. |
| 8 | **Analitik uygulamada kapalı** | Harita Avcısı'ndaki gibi `Capacitor.isNativePlatform()` ise `Analitik` hiç yüklenmesin; mağaza beyanlarında "analitik yok" denebilsin. Gizlilik ve KVKK metinlerine "yalnızca web sitesinde" notu. |
| 9 | **Yerel özellikler** | 4.2'ye karşı da kalkan: titreşim (`@capacitor/haptics`; iOS Safari Vibration API'yi desteklemiyor, `lib/his.ts`), sistemin paylaşım menüsü (`@capacitor/share`; story dosyası), kamera ile fotoğraf. |
| 10 | **Mağaza formları** | App Store gizlilik etiketi ve Play "Veri güvenliği": ad, e-posta, fotoğraflar, kullanıcı içeriği. Yaş derecelendirmesinde "kullanıcıların oluşturduğu içerik". iOS'ta kamera ve fotoğraf arşivi izin metinleri (Türkçe). Mağaza kaydına `/gizlilik` ve `/hesap-silme` adresleri. |
| 11 | **Alt menüdeki "Yeni liste"** *(not)* | Apple'ın tasarım rehberi alt sekme çubuğunu gezinme için öneriyor, eylem için değil. Reddedilme sebebi değil; uygulamaya geçerken yeniden bakılabilir. |

## Özellikler

| # | İş | Not |
|---|---|---|
| 1 | **Şablon + herkesin ortalaması** | "Türk yemeklerinde herkesle %64 uyumlusun": Kör Sıralama sonuçlarının anonim olarak toplandığı bir tablo ve ortalama hesabı. Kullanıcı sayısı artınca anlam kazanır. |
| 2 | **Tadım modu** | Yiyecek-içecek listelerinde isimlerin gizlenip harflerle tadıldığı kör tadım: hazırlayan eşleşmeyi görür, tadan harfleri sıralar, sonda isimler açılır ve bilinçli sıralamayla karşılaştırılır. |
| 3 | **Ek alan filtresine bir yer bul** *(ayrıntılandırılacak)* | Evet/Hayır alanlarına göre filtreleme şeritte yok: sıralamanın hemen üstünü kalabalıklaştırıyordu. Mantık `lib/filtre.ts`'te duruyor, `FilterPanel`'in `stack` düzeni de hâlâ çiziyor; eksik olan yalnızca ona giden bir kapı. |
| 4 | **"Hangisi?" ile yerleştirme** *(ertelendi)* | Yeni kaydı "Denedim" deyince ikili sorularla (ikili arama, ~log₂n soru) yerine oturtmak. Bütün listeyi ikili karşılaştırmayla baştan sıralamaktan çok daha ucuz. |
| 5 | **Konum alanı** *(ertelendi)* | Ek alanlara "Konum" tipi: yazılı adres ya da Maps bağlantısı, "Şu anki konumum", "Yol tarifi" (`google.com/maps/search/?api=1&query=…`). Paylaşım sayfasında yalnızca yazılı adres, koordinat değil. Places API kullanılmayacak (ücretli). |
| 6 | **Görsel arama** *(ertelendi)* | Ücretsiz görsel arama API'si yok; dış adres saklamak (kırılan bağlantı, telif, önizleme görselinin güvenlik kuralı) sorunlu. Ucuz hâli: "Görsel ara" Google Görseller'i kayıt adıyla açar, fotoğraf alanı panodan yapıştırmayı kabul eder; görsel küçültülüp kendi kovamıza girer. |
| 7 | **Ana ekrana ekleme ipucu** *(ertelendi)* | iOS Safari kurulum önerisini kendisi göstermiyor: ana ekranda kapatılabilir bir "Paylaş → Ana Ekrana Ekle" kartı. Mobil uygulama çıkınca gereksizleşir. |
