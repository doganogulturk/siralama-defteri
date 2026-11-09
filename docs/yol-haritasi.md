# Yol haritası

Yeni bir çalışmaya buradan başla: önce **Durum**, sonra **Sıradaki adım**. Altındaki gruplar: video ve tier list, bekleyen temizlik, yayına çıkış için panellerde (Vercel, Supabase, Google Cloud) yapılacaklar, mobil uygulamaya (App Store / Play Store) geçiş ve sıradaki özellikler. Gruplar kendi içinde öncelik sırasında.

## Durum (9 Kasım 2026)

Web sürümü canlıda: <https://siralama-defteri.vercel.app> (Vercel, `main`). Mağazalarda değil.

Son yapılanlar:

| Ne | Ayrıntı |
|---|---|
| **Doğru Sıra'da puan: yerindeki her madde 10** | Kendall (ikili uyum) yerine olması gereken sıra ile oyuncunun sırası yan yana; tam yerinde her madde 10 puan. Doğru Sıra'nın bütün listeleri, İşlemler, Bugün kartları, paylaşım görseli ve Kör Sıralama'nın gerçek sıra puanı. Arkadaş ve sahip karşılaştırmaları Kendall kaldı. Sahibinin kararı: 8/10 doğruya %98 diyordu. |
| **İşlemler ve Günün İşlemleri** | Doğrusunu bul'a üretilen bir liste: dört işlemi sonucuna göre dizmek (sayılar 2–99, sonuçlar 10–100, bölme tam, çıkarma negatif değil, × ÷ − işaretleri). Doğru Sıra'nın altyapısıyla çalışıyor (öbür modlar ve görsel dahil); Bugün'e üçüncü kart olarak Günün İşlemleri (telefonda kayan şerit). Sahibinin önerisi. Tarayıcıda serbest tohumla oynandı; gerçek telefonda denenmedi. İleride: Kolay / Zor seçimi (Doğru Sıra'nın zorluk fikriyle birlikte). |
| **Oyna: Zevkine göre / Doğrusunu bul** | Doğru Sıra mod seçiciden çıktı: Oyna'da "Zevkine göre" (Kör Sıralama · Tier · Kör Tier ve on zevk listesi) ve "Doğrusunu bul" (Sayılar ve sekiz Doğru Sıra listesi) iki ayrı bölüm; her liste bir kez. Doğru cevabı olan listeler öbür modlarda oynanmaya devam ediyor. |
| **Oyunlarda tanıtım kartı ve geri düğmesi** | Her oyunun girişinde zıplayan emojinin yerine modun hareketini gösteren dönen bir kart (açılış tanıtımının dili; maddeler listenin kendisinden). Masaüstünde oyunların geri düğmesi görünmüyordu (liste başlığı için yazılmış bir kural); düzeldi, düğme artık geldiğin sayfaya dönüyor. Tarayıcıda denendi. |
| **Masaüstü düzeni, tek katalog, büyük havuz** | Masaüstünde ana ekran ve Oyna liste ekranının sol rayını taşıyor (rayın üstünde "Listelerim · Oyna"); ana ekran ekranın kalanını kullanıyor, Bugün kartları iri, gösterge kutuları başlığın yanında. Oyna'da modlar tek tek bölüm değil: mod seçici ve katalog bir kez (`?mod=`, eski `#mod` bağlantıları çalışıyor). Zevk listeleri on maddeden otuz maddelik havuza çıktı (iki dilde), her oyunda tohumdan on; tohumsuz eski bağlantılar ilk onu açıyor. "Listelerini kör sıralat" ana ekranda da. Sahibinin gözlemi: insanlar listelere "ee, ne olacak?" dedi, oyunları sıkılmadan oynadı. Tarayıcıda (1920, 1440, telefon) denendi. **Yeni maddeler gözden geçirilmeli** (`lib/kor.ts`, özellikle İngilizce adlar). |
| **Defter görünümü** | Kareli kâğıt ekranın tamamında (üstte eriyen desen ve bulanıklık kalktı), en üstte sarmal defter telleri; yapışkan başlık cam değil düz zemin. Ana ekranda "Merhaba Doğan," iri serif, yalnızca ad italik; marka "Sıralama / Defteri" iki satırda. |
| **Kameralı Kör Tier ve "başka modda oyna"** | Kör Tier'de "Kamerayla oyna": kamera tahtası ikişerli kademe grupları (S, S, A, A…), dolu yere dokunmak öbür yere koyuyor. Sonuç ekranlarının altında aynı listenin diğer modlarına bağlantılar. Sahte kamerayla denendi. |
| **Ortak katalog, Tier ve Kör Tier (Oyunlar planı 2)** | Kör ve Doğru Sıra listeleri tek katalogda (`lib/katalog.ts`); her liste Kör Sıralama, Tier ve Kör Tier'de oynanıyor, doğru cevabı olanlar Doğru Sıra'da da. Kör Sıralama'da doğru cevabı olan listede gerçek sırayla uyum ve değerler. Tier (dokun, kademesine dokun) ve Kör Tier (birer birer, her kademede iki yer) modları; sonuç adreste, arkadaşla ve gerçek kademeyle karşılaştırma, tier görseli. Oyna sayfası mod mod, her modun altında katalog şeridi. Ayrıntılar [özellikler](ozellikler.md) → Katalog ve modlar. |
| **Oyna: oyunlar öne çıktı (Oyunlar planı 1)** | Ana ekranda "Bugün" (günün iki oyunu) ve "Oyunlar" şeridi; Kör Sıralama sayfası "Oyna" oldu (`/oyna`, mod mod bölümler); alt menüde "Oyna"; giriş yapmamış ziyaretçi ana sayfada oyunları görüyor, tanıtım `/tanitim`'de. Oyunlar `/kor`'dan `/oyna`'ya taşındı, eski bağlantılar yönlendiriliyor. Ayrıntılar [özellikler](ozellikler.md) → Oyna ve ana ekran. |
| **Liste ekranı: "1→n / Tier" ve geniş masaüstü** | Kademelere ayarlara girmeden geçiş: sıralama sekmesinde her listede "1→n / Tier" seçicisi; kademeleri kapalı listede "Tier" onları açıp S–D'ye dağıtıyor. Masaüstünde sıralama tam genişlik (24px kenar). Arama kapalıyken yalnızca büyüteç düğmesi, basınca kutuya açılıyor. Seçicide "n" yerine sıralamadaki kayıt sayısı ("1→11"). |
| **Doğru Sıra** | Doğru cevabı olan sıralama oyunu: sekiz liste (ülke nüfusu ve yüzölçümü, il nüfusu, dağlar, padişahlar, tarihî olaylar, elementler, Güneş Sistemi), her seferinde havuzdan on madde, sürükleyerek dizme, Kendall uyumu, değerlerin açılışı, Günün Doğru Sırası, arkadaş bağlantısı ve sonuç görseli. Veriler arama sonuçlarıyla doğrulandı, kaynakları listede ([özellikler](ozellikler.md) → Doğru Sıra). Tarayıcıda denendi; gerçek telefonda denenmedi. |
| **Kademeler (tier list)** | Liste ayarlarından açılan S–D kademeleri: listede kademe başlıkları ve sürükleme, "Tier" görünümü ve dokun-kademe-seç, kademeli paylaşım sayfası, tier tablosu olarak story görseli (klasik renkler). Şemaya `lists.kademeler` ve `items.kademe` eklendi; `siralamayi_yaz` ve `paylasilan_liste` güncellendi. Ayrıntılar [özellikler](ozellikler.md) → Kademeler. Sahte veriyle tarayıcıda denendi; gerçek hesapla denenmedi. |
| **Kameralı Kör Sıralama** *(deneme)* | "Kamerayla oyna": ön kamera, başın üstünde kart, solda yuvalar; sesli 9:16 video, sistemin paylaşım menüsüyle paylaşma ya da indirme. Hazır listelerde ve kendi listeni kör sıralatmada. Video cihazdan çıkmıyor; gizlilik politikasına "Kamera ve mikrofon" bölümü eklendi (yasal sayfaların tarihi 2 Kasım 2026). Ayrıntılar [özellikler](ozellikler.md) → Kameralı Kör Sıralama. Geliştirme ortamında sahte kamerayla uçtan uca denendi; **iPhone'da (Safari) denendi ve beğenildi**. Arayüzde küçük düzenlemeler sonraya bırakıldı; Android ve paylaşım hedefleri henüz denenmedi. |
| **Kendi Supabase projesi** | Veritabanı DoganOgulturk'ten (Harita Avcısı ve başka uygulamalarla paylaşılıyordu) yalnızca bu uygulamaya ait projeye taşındı: eski Sensetorial projesi, adı **SiralamaDefteri**, ref `fcttucpqmarcgktrvibb`. Şema adı aynı (`do_siralama_defteri`), Exposed schemas'ta. 3 kullanıcı aynı kimliklerle, 18 liste / 18 kategori / 246 kayıt ve 131 fotoğraf kopyalandı; kova `ayran` → `fotograflar`, kayıtlardaki adresler yeniden yazıldı. İstemci publishable anahtarla bağlanıyor (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). DoganOgulturk'teki `do_siralama_defteri` şeması silindi. |
| **Kendi Google Cloud projesi** | Google girişi "Sıralama Defteri" adlı ayrı bir Google Cloud projesindeki OAuth istemcisinden (eskiden Harita Avcısı'nın projesiydi, giriş ekranında o ad yazıyordu). Onay ekranında ad, ana sayfa, gizlilik ve koşul adresleri girili, yayında (In production); logo ve marka doğrulaması yok. |
| **Hesabın tamamen silinmesi** | "Hesabımı sil" (Hesabım → Hesap silme → sayfanın altı): fotoğraflar Storage API'yle, sonra `hesabimi_sil` (security definer) `auth.users` satırını siliyor; listeler cascade ile gidiyor. App Store 5.1.1(v) ve Play'in hesap silme şartı bununla karşılandı (mobil listesindeki eski madde kaldırıldı). |
| **İngilizce** | Bütün arayüz, yasal sayfalar (KVKK'nın İngilizcesi bilgi amaçlı çeviri), şablonlar, Kör Sıralama, paylaşım sayfası ve görseller iki dilde; ayrıntılar [özellikler](ozellikler.md) → Dil. Yasal sayfaların tarihi 27 Ekim 2026. |

Canlıda denenmedi (gerçek hesap istiyor, sahibin yapması gerekiyor): İngilizce arayüzde giriş yapılmış ekranlar, İngilizce paylaşım bağlantısının (`?l=en`) WhatsApp önizlemesi, ikinci bir Google hesabıyla hesap silme.

## Sıradaki adım

0. **Kademeler için şema** *(yapılmadıysa önce bu)*: `supabase/schema.sql` Supabase SQL Editor'da çalıştırılmalı (idempotent; yeni kolonlar, kısıtlar ve iki fonksiyon). Kademeli sürüm canlıda; şema çalıştırılana kadar uygulamanın geri kalanı etkilenmiyor ama kademeler açılamıyor (kolon yok). Ardından gerçek hesapla kademeleri aç, sürükle, kademe seç, story görselini paylaş.
1. ~~Oyunlar planı 3 — katalog veritabanına, liste önerme ve yönetici onayı~~: **şimdilik ertelendi** (sahibinin kararı, Kasım 2026). Yeniden ele alınırsa açık kararlar ve öneriler aşağıda, Oyunlar planı 3'ün notunda.
2. **Doğru Sıra verilerine göz at:** `src/lib/dogru-sira-listeler.ts` — değerler ve kaynaklar; telefonda sürükleme ve ok düğmeleri.
3. **Kameralı Kör Sıralama: kalan cihaz denemeleri** (Video ve tier list 1): iPhone'da denendi; bir Android (Chrome) ve paylaşım hedefleri (Instagram, TikTok, WhatsApp) kaldı. Sorun çıkarsa önce onu düzelt.
4. Yukarıdaki üç canlı denemeyi yap; sorun çıkarsa önce onu düzelt.
5. ~~Video ve tier list 3 — kör tier list~~: Oyunlar planı 2'ye katıldı.
6. **Bekleyen temizlik** (aşağıda) — kısa, ama anahtarlar güvenlik için önemli.
7. **Mobil 1 — mimari kararı**: bütün mobil işler buna bağlı.
8. **Mobil 4 — bildir ve engelle** (Apple 1.2): mimariden bağımsız, web'de şimdiden yapılabilir.
9. **Yayına çıkış 1 — domain**: Google marka doğrulaması (Yayına çıkış 2) ve uygulama içi bağlantılar (Mobil 6) ona bağlı. Videoların son kartındaki adres de: videoda bağlantıya tıklanamıyor, kısa ve akılda kalan bir adres gerekiyor.

## Oyunlar planı

Kasım 2026'da kararlaştırıldı. Uygulama iki ayak üzerinde: Listelerim ve Oyna. Oyunlarda **mod** (nasıl sıralıyorsun) ile **liste** (neyi sıralıyorsun) ayrılıyor; bir liste birden çok modda oynanıyor.

| Mod | Ne | Hangi listelerle |
|---|---|---|
| Kör Sıralama | Birer birer gelir, yeri değişmez | Hepsi |
| Tier | Maddeleri S–D kademelerine koy, tier tablosunu paylaş | Hepsi |
| Kör Tier | Birer birer gelir, kademeye konur, yeri değişmez; kademelerin sınırı var | Hepsi |
| Doğru Sıra | Sürükleyerek diz, gerçek sıra açılır | Yalnızca doğru cevabı (değeri) olanlar |
| Sayılar | Tek ve sabit | Kendi içeriği |

| # | İş | Not |
|---|---|---|
| 1 | **İskelet** *(yapıldı)* | Ana ekranda Bugün ve Oyunlar, `/oyna` ve yönlendirmeler, alt menüde Oyna, oturumsuz ziyaretçiye oyunlar ([özellikler](ozellikler.md) → Oyna ve ana ekran). |
| 2 | **Ortak katalog, Tier ve Kör Tier** *(yapıldı, kameralı Kör Tier dahil)* | Kör ve Doğru Sıra listeleri tek katalogda (kodda): her listenin maddeleri, isteğe bağlı değerleri (doğru cevap), rengi ve simgesi. Değeri olan liste Kör'de de oynanır ve sonda "gerçek sırayla %70" der. Tier modu (açık: maddeleri kademelere koy) ve Kör Tier (birer birer, sınırlı kademe) katalog listeleriyle; tier görseli ve kamera altyapısı yeniden kullanılıyor. Kişisel listelerdeki kademeler (Kademeler) ayrı bir özellik olarak kalıyor. |
| 3 | **Katalog veritabanına, liste önerme** *(ertelendi)* | Önerilen kararlar (onaylanmadı): koddaki 18 liste yerinde kalır, veritabanı yalnızca önerilenleri tutar; yönetici yalnızca sahibi (yöneticiler tablosunda); giriş yapmış herkes önerir, ilk sürümde yalnızca zevk listeleri (Doğru Sıra önerisi değer ve kaynak ister); öneren onay beklemeden bağlantıyla oynatabilir; yeni öneri haberi ilk sürümde ana ekranda sayaç. Plan: listeler Supabase'e (`taslak / onay bekliyor / yayında`, öneren, maddeler, kaynak); yönetici rolü ve onay ekranı; kullanıcı liste önerir, onaylanınca herkese açık katalogda. Önerilen liste onaysız da öneren kişinin bağlantısıyla oynanabilir (bugünkü "kendi listeni kör sıralat" gibi). Yayımlanan liste değişmez (sonuç bağlantıları sıraya bağlı); düzeltme yeni sürüm. Doğru Sıra önerisinde kaynak zorunlu. Onay kuyruğu Apple 1.2'ye de yardım ediyor. |
| 4 | **Herkesin ortalaması** | Sonuçların anonim toplanması; "Türk yemeklerinde herkesle %64 uyumlusun" (Özellikler 1). Katalog veritabanında olunca kolaylaşıyor. |

## Video ve tier list

Paylaşımı ve uygulamaya yeni gelenleri artırmak için üzerinde anlaşılan sıra (Kasım 2026). İkisinin kesişimi, kameralı kör tier list, hedef.

| # | İş | Not |
|---|---|---|
| 1 | **Kameralı Kör Sıralama: cihaz denemesi** *(yapıldı; iPhone'da denendi)* | Yayında ([özellikler](ozellikler.md) → Kameralı Kör Sıralama); iPhone Safari'de denendi ve beğenildi, arayüzde küçük düzenlemeler yapılacak. Kalan denemeler (iPhone'da da paylaşım hedefleri doğrulanmadıysa onlar): iPhone Safari'de kamera ve mikrofon izni, kayıt sırasında akıcılık (kare kaçırma), kaydedilen MP4'ün süresi ve sesi; Android Chrome'da MP4 (H.264) mi WebM mi yazdığı; videonun Instagram (Story / Reels), TikTok ve WhatsApp'a paylaşım menüsünden gitmesi ve oralarda kart ile yuvaların güvenli alanda kalması; ucuz bir Android'de takılma. Ana ekrana eklenmiş (PWA) hâlde de. |
| 2 | **Tier list** *(yapıldı)* | [Özellikler](ozellikler.md) → Kademeler. Renk kararı: uygulamada vurgunun tonları, paylaşım görselinde klasik renkler ([kabul edilmiş sınırlar](kararlar.md)). Eksik kalanlar: "Ben de sıralayayım" kopyası kademeleri almıyor; karşılaştırmada "aynı kademede: 6/10" ölçüsü 3. adımla birlikte. |
| 3 | **Kör tier list** *(kamerasız hâli yapıldı: Oyunlar planı 2)* | Kayıt geliyor, kişi onu bir kademeye koyuyor, yeri değişmiyor. Kademelerin sınırı olmalı (ör. on kayıtta kademe başına en fazla iki), yoksa her şey A'ya gider. Kameralı ve kamerasız; kamera tarafı `KorKamera`'nın tuvali ve kaydı, yalnızca tahtası (yuvalar yerine kademe satırları) farklı. Karşılaştırmada "aynı kademede: 6/10". |
| 4 | **Cilalama** | iPhone denemesinden sonra konuşulan arayüz düzenlemeleri. Yüz takibi: MediaPipe Face Landmarker ile tarayıcıda, cihazda (WASM/WebGL); kart başla birlikte hareket eder ama yüzü kapatmaz (alnın üstünde); takip ve kayıt birlikte eski telefonlarda kare hızını düşürebilir, takip sıklığı ve çözünürlük cihaza göre ayarlanmalı; yüz verisi saklanmaz, gizlilik metni buna göre. Sayılar'a kamera, videonun son kartında marka işareti ve kısa domain, ön kamera / arka kamera seçimi. |

## Bekleyen temizlik

| # | İş | Not |
|---|---|---|
| 1 | **DoganOgulturk'te kalanlar** | Storage → `ayran` kovası: önce Empty, sonra Delete (kullanılan fotoğraflar yeni projede). Yalnızca Sıralama Defteri'ni kullanmış 1 kullanıcı ve hiçbir uygulamada verisi olmayan 4 Google hesabı `auth.users`'ta duruyor; silinecekse sorgu hazırlanmalı (Harita Avcısı'nda verisi olan hesaplara dokunulmamalı). |
| 2 | **Vercel** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` artık kullanılmıyor, silinebilir. |
| 3 | **Anahtarlar** | Taşıma için açılan iki secret key (SiralamaDefteri ve DoganOgulturk) silinmeli. SiralamaDefteri'nin legacy anahtarları (anon / service_role) kapatılmalı: eski Sensetorial yayınlarının kodunda herkese açık duruyorlar. |
| 0 | **Fotoğraf klasör kuralı** *(önce bu)* | Kullanıcının klasörüne yükleyen sürüm (`claude/vibrant-davinci-zntqaq` dalı) `main`'e alınıp Vercel'de yayına çıktıktan **sonra** `supabase/storage.sql` SQL Editor'da çalıştırılmalı. Önce çalıştırılırsa köke yükleyen eski sürümün fotoğraf yüklemeleri reddedilir. |
| 4 | **Yerel dosyalar** | `scripts/tasi-kendi-projesine.mjs` (tek seferlik taşıma betiği, commit edilmedi) ve `.env.local.eski` (eski DoganOgulturk değerleri) silinebilir. |

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
| 6 | **Bağlantıların uygulamada açılması** | `/p/…`, `/kiyasla/…` ve `/oyna/…?s=` uygulama yüklüyse uygulamada açılmalı: domaine `apple-app-site-association` (Universal Links) ve `assetlinks.json` (App Links). Domain gerekiyor. |
| 7 | **Analitik uygulamada kapalı** | Harita Avcısı'ndaki gibi `Capacitor.isNativePlatform()` ise `Analitik` hiç yüklenmesin; mağaza beyanlarında "analitik yok" denebilsin. Gizlilik ve KVKK metinlerine "yalnızca web sitesinde" notu. |
| 8 | **Yerel özellikler** | 4.2'ye karşı da kalkan: titreşim (`@capacitor/haptics`; iOS Safari Vibration API'yi desteklemiyor, `lib/his.ts`), sistemin paylaşım menüsü (`@capacitor/share`; story dosyası ve Kameralı Kör Sıralama videosu), kamera ile fotoğraf. Kameralı Kör Sıralama Capacitor'da aynı web koduyla çalışır (WKWebView'de kamera iOS 14.3+, kayıt 14.5+); gerekirse yüz takibi ARKit / ML Kit'e taşınır ve video doğrudan galeriye kaydedilir — 4.2'ye karşı güçlü bir yerel özellik. |
| 9 | **Mağaza formları** | App Store gizlilik etiketi ve Play "Veri güvenliği": ad, e-posta, fotoğraflar, kullanıcı içeriği. Yaş derecelendirmesinde "kullanıcıların oluşturduğu içerik". iOS'ta kamera ve fotoğraf arşivi izin metinleri (Türkçe). Mağaza kaydına `/gizlilik` ve `/hesap-silme` adresleri. Mağaza sayfası metinleri Türkçe ve İngilizce (uygulama iki dilli). |
| 10 | **Alt menüdeki "Yeni liste"** *(not)* | Apple'ın tasarım rehberi alt sekme çubuğunu gezinme için öneriyor, eylem için değil. Reddedilme sebebi değil; uygulamaya geçerken yeniden bakılabilir. |

## Özellikler

| # | İş | Not |
|---|---|---|
| 1 | **Şablon + herkesin ortalaması** | "Türk yemeklerinde herkesle %64 uyumlusun": Kör Sıralama sonuçlarının anonim olarak toplandığı bir tablo ve ortalama hesabı. Kullanıcı sayısı artınca anlam kazanır. |
| 2 | **Tadım modu** | Yiyecek-içecek listelerinde isimlerin gizlenip harflerle tadıldığı kör tadım: hazırlayan eşleşmeyi görür, tadan harfleri sıralar, sonda isimler açılır ve bilinçli sıralamayla karşılaştırılır. |
| 3 | **Ek alan filtresine bir yer bul** *(ayrıntılandırılacak)* | Evet/Hayır alanlarına göre filtreleme şeritte yok: sıralamanın hemen üstünü kalabalıklaştırıyordu. Mantık `lib/filtre.ts`'te duruyor, `FilterPanel`'in `stack` düzeni de hâlâ çiziyor; eksik olan yalnızca ona giden bir kapı. Masaüstünde doğal yeri rayın açık dalı: kategorilerin altına alan başına Evet/Hayır. |
| 4 | **Konum alanı** *(ertelendi)* | Ek alanlara "Konum" tipi: yazılı adres ya da Maps bağlantısı, "Şu anki konumum", "Yol tarifi" (`google.com/maps/search/?api=1&query=…`). Paylaşım sayfasında yalnızca yazılı adres, koordinat değil. Places API kullanılmayacak (ücretli). |
| 5 | **Görsel arama** *(ertelendi)* | Ücretsiz görsel arama API'si yok; dış adres saklamak (kırılan bağlantı, telif, önizleme görselinin güvenlik kuralı) sorunlu. Ucuz hâli: "Görsel ara" Google Görseller'i kayıt adıyla açar, fotoğraf alanı panodan yapıştırmayı kabul eder; görsel küçültülüp kendi kovamıza girer. |
| 7 | **Doğru Sıra: yeni listeler ve bakım** | Liste eklemek veri işi (`lib/dogru-sira-listeler.ts`, testler kuralları denetliyor). Adaylar: göllerin büyüklüğü, illerin yüzölçümü, bilim insanlarının doğum yılları, Dünya Kupası'nın ev sahipleri (kronoloji). Bakım: TÜİK il nüfusları her yıl Şubat'ta; BM nüfus tahminleri iki yılda bir. Kameralı Kör Sıralama'da oynanması (madde başın üstünde, yeri değişmez, sonda doğru cevap) ve zorluk seçimi (kolayda %5'ten büyük fark, zorda yakın değerler) sonraki adım. |
| 6 | **Ana ekrana ekleme ipucu** *(ertelendi)* | iOS Safari kurulum önerisini kendisi göstermiyor: ana ekranda kapatılabilir bir "Paylaş → Ana Ekrana Ekle" kartı. Mobil uygulama çıkınca gereksizleşir. |
