# Yol haritası

Yeni bir çalışmaya buradan başla: önce **Durum**, sonra **Sıradaki adım**. Altındaki gruplar: bekleyen temizlik, yayına çıkış için panellerde (Vercel, Supabase, Google Cloud) yapılacaklar, mobil uygulamaya (App Store / Play Store) geçiş ve sıradaki özellikler. Gruplar kendi içinde öncelik sırasında.

## Durum (27 Ekim 2026)

Web sürümü canlıda: <https://siralama-defteri.vercel.app> (Vercel, `main`). Mağazalarda değil.

Son yapılanlar:

| Ne | Ayrıntı |
|---|---|
| **Kendi Supabase projesi** | Veritabanı DoganOgulturk'ten (Harita Avcısı ve başka uygulamalarla paylaşılıyordu) yalnızca bu uygulamaya ait projeye taşındı: eski Sensetorial projesi, adı **SiralamaDefteri**, ref `fcttucpqmarcgktrvibb`. Şema adı aynı (`do_siralama_defteri`), Exposed schemas'ta. 3 kullanıcı aynı kimliklerle, 18 liste / 18 kategori / 246 kayıt ve 131 fotoğraf kopyalandı; kova `ayran` → `fotograflar`, kayıtlardaki adresler yeniden yazıldı. İstemci publishable anahtarla bağlanıyor (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). DoganOgulturk'teki `do_siralama_defteri` şeması silindi. |
| **Kendi Google Cloud projesi** | Google girişi "Sıralama Defteri" adlı ayrı bir Google Cloud projesindeki OAuth istemcisinden (eskiden Harita Avcısı'nın projesiydi, giriş ekranında o ad yazıyordu). Onay ekranında ad, ana sayfa, gizlilik ve koşul adresleri girili, yayında (In production); logo ve marka doğrulaması yok. |
| **Hesabın tamamen silinmesi** | "Hesabımı sil" (Hesabım → Hesap silme → sayfanın altı): fotoğraflar Storage API'yle, sonra `hesabimi_sil` (security definer) `auth.users` satırını siliyor; listeler cascade ile gidiyor. App Store 5.1.1(v) ve Play'in hesap silme şartı bununla karşılandı (mobil listesindeki eski madde kaldırıldı). |
| **İngilizce** | Bütün arayüz, yasal sayfalar (KVKK'nın İngilizcesi bilgi amaçlı çeviri), şablonlar, Kör Sıralama, paylaşım sayfası ve görseller iki dilde; ayrıntılar [özellikler](ozellikler.md) → Dil. Yasal sayfaların tarihi 27 Ekim 2026. |

Canlıda denenmedi (gerçek hesap istiyor, sahibin yapması gerekiyor): İngilizce arayüzde giriş yapılmış ekranlar, İngilizce paylaşım bağlantısının (`?l=en`) WhatsApp önizlemesi, ikinci bir Google hesabıyla hesap silme.

## Sıradaki adım

1. Yukarıdaki üç canlı denemeyi yap; sorun çıkarsa önce onu düzelt.
2. **Bekleyen temizlik** (aşağıda) — kısa, ama anahtarlar güvenlik için önemli.
3. **Mobil 1 — mimari kararı**: bütün mobil işler buna bağlı.
4. **Mobil 4 — bildir ve engelle** (Apple 1.2): mimariden bağımsız, web'de şimdiden yapılabilir.
5. **Yayına çıkış 1 — domain**: Google marka doğrulaması (Yayına çıkış 2) ve uygulama içi bağlantılar (Mobil 6) ona bağlı.

## Bekleyen temizlik

| # | İş | Not |
|---|---|---|
| 1 | **DoganOgulturk'te kalanlar** | Storage → `ayran` kovası: önce Empty, sonra Delete (kullanılan fotoğraflar yeni projede). Yalnızca Sıralama Defteri'ni kullanmış 1 kullanıcı ve hiçbir uygulamada verisi olmayan 4 Google hesabı `auth.users`'ta duruyor; silinecekse sorgu hazırlanmalı (Harita Avcısı'nda verisi olan hesaplara dokunulmamalı). |
| 2 | **Vercel** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` artık kullanılmıyor, silinebilir. |
| 3 | **Anahtarlar** | Taşıma için açılan iki secret key (SiralamaDefteri ve DoganOgulturk) silinmeli. SiralamaDefteri'nin legacy anahtarları (anon / service_role) kapatılmalı: eski Sensetorial yayınlarının kodunda herkese açık duruyorlar. |
| 4 | **Yerel dosyalar** | `scripts/tasi-kendi-projesine.mjs` (tek seferlik taşıma betiği, commit edilmedi) ve `.env.local.eski` (eski DoganOgulturk değerleri) silinebilir. `supabase/migrate-public-to-do_siralama_defteri.sql` eski bir geçişin kaydı; artık işe yaramıyor. |

## Yayına çıkış (panellerde yapılacaklar)

| # | İş | Not |
|---|---|---|
| 1 | **Domain** | Satın al, Vercel'e bağla; Supabase → Authentication → URL Configuration → Redirect URLs'e ekle. Eklenmezse Google girişi yeni domainde **sessizce** bozulur (giriş `redirectTo` olarak `window.location.origin` kullanıyor). `metadataBase`, story ve Kör Sıralama görsellerindeki adres domaine kendiliğinden geçer. |
| 2 | **Google giriş ekranının markası** | Google Cloud Console → OAuth onay ekranı: uygulama adı, logo, gizlilik politikası (`/gizlilik`) ve koşullar (`/kullanim-kosullari`) adresleri, domain doğrulaması. Doğrulanmamışken ekranda "…supabase.co'ya devam et" yazar. Uygulamanın kendi Google Cloud projesi ve OAuth istemcisi Ekim 2026'da kuruldu (adı ve adresleri girildi); kalan logo ve domain doğrulaması. |
| 3 | **Gerçek cihazda deneme** | Başka bir hesapla "Ben de sıralayayım" ve karşılaştırma, story'yi Instagram'a paylaşma, Kör Sıralama bağlantısının WhatsApp önizlemesi ve arkadaş modu, ana ekrana ekleme (PWA). İki dilde: İngilizce paylaşımın kartı ve story'si İngilizce çıkmalı, Türkçe kullanan biri bağlantıyı açınca sayfayı kendi dilinde görmeli. |

## Mobil uygulama (Capacitor, App Store / Play Store)

Apple Developer hesabı onaylanınca. Harita Avcısı aynı yoldan geçti (Capacitor, yerel geri tuşu, titreşim, paylaşım, sistem tarayıcısı); çözümleri oradan uyarlanabilir.

| # | İş | Not |
|---|---|---|
| 1 | **Mimari kararı** *(önce bu)* | Harita Avcısı statik paket (`output: "export"`); Sıralama Defteri sunucu istiyor (paylaşım sayfası, story/önizleme/Kör Sıralama görselleri, ikonlar). Siteyi açan bir kabuk Apple'da **4.2 Asgari İşlevsellik**'ten reddedilmeye açık. Doğru yol: uygulama ekranları statik pakette, görseller ve paylaşım sayfaları Vercel'de; uygulama onları tam adresle çağırır. Diğer maddelerin çoğu bu karara bağlı. |
| 2 | **Apple ile giriş** | Apple 4.8: Google ile giriş varsa gizliliği koruyan ikinci bir seçenek (pratikte Sign in with Apple) zorunlu. Supabase'de hazır sağlayıcı; Apple Developer hesabı gerekiyor. [Kabul edilmiş sınırlar](kararlar.md)'daki "Apple girişi yok" maddesi iOS için geçersizleşiyor. |
| 3 | **Google girişi sistem tarayıcısında** | Google gömülü web görünümünde girişi engelliyor (`disallowed_useragent`). Giriş sistem tarayıcısında açılmalı (`@capacitor/browser` / ASWebAuthenticationSession), derin bağlantıyla uygulamaya dönmeli; dönüş adresi Supabase Redirect URLs'e eklenmeli. |
| 4 | **Kullanıcı içeriği: bildir ve engelle** | Apple 1.2: paylaşılan listelerde (fotoğraflar dahil) uygunsuz içeriği bildirme, kötüye kullananı engelleme ve iletişim bilgisi gerekiyor. Şu an yalnızca iletişim var; paylaşım ve karşılaştırma sayfalarına "Bildir" ve bir inceleme yolu. |
| 5 | **Android geri tuşu** | Açık pencereler (formlar, liste ayarları, Hesabım, paylaşım menüsü) geri tuşuyla kapanmalı. "Denenmemiş" sekmesi adreste ama `replaceState` ile — geri tuşu listeden çıkıyor; sekmeye dönmesi istenirse `pushState`'e çevrilmeli (bkz. [kabul edilmiş sınırlar](kararlar.md)). Harita Avcısı'ndaki `NativeBackButton` uyarlanabilir. |
| 6 | **Bağlantıların uygulamada açılması** | `/p/…`, `/kiyasla/…` ve `/kor/…?s=` uygulama yüklüyse uygulamada açılmalı: domaine `apple-app-site-association` (Universal Links) ve `assetlinks.json` (App Links). Domain gerekiyor. |
| 7 | **Analitik uygulamada kapalı** | Harita Avcısı'ndaki gibi `Capacitor.isNativePlatform()` ise `Analitik` hiç yüklenmesin; mağaza beyanlarında "analitik yok" denebilsin. Gizlilik ve KVKK metinlerine "yalnızca web sitesinde" notu. |
| 8 | **Yerel özellikler** | 4.2'ye karşı da kalkan: titreşim (`@capacitor/haptics`; iOS Safari Vibration API'yi desteklemiyor, `lib/his.ts`), sistemin paylaşım menüsü (`@capacitor/share`; story dosyası), kamera ile fotoğraf. |
| 9 | **Mağaza formları** | App Store gizlilik etiketi ve Play "Veri güvenliği": ad, e-posta, fotoğraflar, kullanıcı içeriği. Yaş derecelendirmesinde "kullanıcıların oluşturduğu içerik". iOS'ta kamera ve fotoğraf arşivi izin metinleri (Türkçe). Mağaza kaydına `/gizlilik` ve `/hesap-silme` adresleri. Mağaza sayfası metinleri Türkçe ve İngilizce (uygulama iki dilli). |
| 10 | **Alt menüdeki "Yeni liste"** *(not)* | Apple'ın tasarım rehberi alt sekme çubuğunu gezinme için öneriyor, eylem için değil. Reddedilme sebebi değil; uygulamaya geçerken yeniden bakılabilir. |

## Özellikler

| # | İş | Not |
|---|---|---|
| 1 | **Şablon + herkesin ortalaması** | "Türk yemeklerinde herkesle %64 uyumlusun": Kör Sıralama sonuçlarının anonim olarak toplandığı bir tablo ve ortalama hesabı. Kullanıcı sayısı artınca anlam kazanır. |
| 2 | **Tadım modu** | Yiyecek-içecek listelerinde isimlerin gizlenip harflerle tadıldığı kör tadım: hazırlayan eşleşmeyi görür, tadan harfleri sıralar, sonda isimler açılır ve bilinçli sıralamayla karşılaştırılır. |
| 3 | **Ek alan filtresine bir yer bul** *(ayrıntılandırılacak)* | Evet/Hayır alanlarına göre filtreleme şeritte yok: sıralamanın hemen üstünü kalabalıklaştırıyordu. Mantık `lib/filtre.ts`'te duruyor, `FilterPanel`'in `stack` düzeni de hâlâ çiziyor; eksik olan yalnızca ona giden bir kapı. Masaüstünde doğal yeri rayın açık dalı: kategorilerin altına alan başına Evet/Hayır. |
| 4 | **"Hangisi?" ile yerleştirme** *(ertelendi)* | Yeni kaydı "Denedim" deyince ikili sorularla (ikili arama, ~log₂n soru) yerine oturtmak. Bütün listeyi ikili karşılaştırmayla baştan sıralamaktan çok daha ucuz. |
| 5 | **Konum alanı** *(ertelendi)* | Ek alanlara "Konum" tipi: yazılı adres ya da Maps bağlantısı, "Şu anki konumum", "Yol tarifi" (`google.com/maps/search/?api=1&query=…`). Paylaşım sayfasında yalnızca yazılı adres, koordinat değil. Places API kullanılmayacak (ücretli). |
| 6 | **Görsel arama** *(ertelendi)* | Ücretsiz görsel arama API'si yok; dış adres saklamak (kırılan bağlantı, telif, önizleme görselinin güvenlik kuralı) sorunlu. Ucuz hâli: "Görsel ara" Google Görseller'i kayıt adıyla açar, fotoğraf alanı panodan yapıştırmayı kabul eder; görsel küçültülüp kendi kovamıza girer. |
| 7 | **Ana ekrana ekleme ipucu** *(ertelendi)* | iOS Safari kurulum önerisini kendisi göstermiyor: ana ekranda kapatılabilir bir "Paylaş → Ana Ekrana Ekle" kartı. Mobil uygulama çıkınca gereksizleşir. |
