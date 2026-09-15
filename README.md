# Sıralama Defteri

Kişisel sıralama uygulaması: denediğin şeyleri kendi listelerinde sürükleyerek sırala, kendi kategorilerini kur, henüz denemediklerini ayrı bir sekmede tut. Çok listeli ve kullanıcı bazlı; her liste kendi kategorilerini ve ek alanlarını taşıyor.

---

## Durum

Uygulama çalışır ve **canlıda**: giriş, çok listeli sıralama, kategori ve alan yönetimi, toplu kayıt ekleme, Koleksiyon arayüzü.

**Dağıtım** — Vercel, `main` dalından otomatik: <https://siralama-defteri.vercel.app>. Push üretimi günceller. Vercel'de `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` tanımlı olmalı; Supabase'in Redirect URLs listesinde üretim alan adı da bulunmalı, yoksa build geçer ama Google girişi canlıda **sessizce** başarısız olur — giriş `redirectTo` olarak `window.location.origin` kullandığı için tek kapı o liste.

**Veri** — `si_lists` / `si_categories` / `si_items` şeması RLS ile kurulu. Şemada yalnızca bu üç tablo ve ana ekranın özetlerini hazırlayan bir fonksiyon (`si_liste_ozetleri`) var.

**Kimlik** — Google girişi Supabase Auth üzerinden; tüm sayfalar `AuthGate` arkasında, asıl koruma RLS'te.

**Arayüz** — İki ekran: `/` liste indeksi ve `/l/[slug]` sıralama. Liste ayarları ayrı bir sayfa değil, sıralama ekranının üstünde açılan bir popup; eski `/l/[slug]/ayarlar` adresi listeye yönlendirip popup'ı açıyor. Bekleyenler de ayrı bir route değil, sıralama ekranının ikinci sekmesi ("Denenmemiş"). Masaüstünde bir kayda tıklayınca sağda detay paneli açılıyor, seçim kalkınca kapanıyor. Sol ray satırları sıralanmış kayıt sayısı + liste adı + şampiyon taşıyor; liste ayarları sıralama başlığındaki düğmeden açılıyor.

Listeler ve kategoriler kayıt sayısına göre sıralı — elle sıralama diye bir iş yok. Listelerde ölçü "kaç şeyi denedim": bekleyenler sayılmıyor, "Bir daha asla" bölümündekiler sayılıyor; bir kayıt "Denedim" ile sıralamaya geçtiğinde rakam artıyor. Ray ve indeks sayıları sayfadan ayrı bir sorgudan geldiği için `useListeler`'de küçük bir haber kanalı var: sayfa bir mutasyondan sonra `listeleriTazele()` çağırıyor.

Kodda listeye özel hiçbir alan adı geçmiyor: kategoriler veritabanından, ek alanlar `si_lists.alanlar` tanımından üretiliyor.

Masaüstündeki sağ panel kaydın tamamını gösteriyor (not dahil, satır sonları korunuyor); sıralamadaki kayıtta "Sıralamadaki yeri" bölümü bir üstünü ve bir altını gösteriyor, onlara tıklayınca panel o kayda geçiyor; Düzenle düğmesi yalnızca değiştirmek için. Sırası olmayan kayıtta sıra rozeti yerine "Denenmemiş" ya da "Bir daha asla" yazıyor. Fotoğraf alanı aynı zamanda yükleme yeri: tıklayarak ya da dosyayı üstüne bırakarak Düzenle'yi açmadan fotoğraf eklenip değiştirilebiliyor. Fotoğraf kırpılmadan sığdırılıyor (ürün fotoğrafları çoğunlukla dikey).

**Toplu ekleme** — Kayıt formunun ikinci sekmesi ("Toplu"). Alt alta yazılan her satır bir kayıt; sonu iki nokta ile biten satır (`Patates:`) listenin içinde bir kategori açar, altındaki satırlar oraya yazılır. Satır içi biçim de geçerli: `Cips: Doritos` satırında iki noktadan önceki kısım kategori, sonrası kayıt. İlk virgülden sonrası kaydın "Çeşit / Alt ad" değeri olur (`Doritos, Nacho`); sonraki virgüller alt adın içinde kalır, bu yüzden bir satıra birden çok kayıt yazılamıyor. Ayrıştırma `lib/toplu.ts`'te; form kaydetmeden önce sonucu önizleme olarak gösteriyor — virgül ya da iki nokta kayıt adının içinde geçtiğinde bölünme yanlış olur, kullanıcı bunu kaydetmeden görmeli. Sekme formun kipini miras alıyor: sıralamadayken kayıtlar yazıldıkları sırayla sıralamanın altına, "Denenmemiş" sekmesindeyken bekleyenlere düşüyor. Aynı kutu Yeni Liste formunda da var (kapalı doğar): listeyi ve kategorilerini tek hamlede kurmak için. Yeni Liste formunda ayrıca bir **Kategoriler** alanı var: Enter ya da virgül yazılan adı hapa çeviriyor (yapıştırılan "a, b, c" de bölünüyor), Backspace boş kutuda son hapı siliyor, büyük-küçük harf farkıyla tekrarlar atılıyor, kutuda yazılı kalıp eklenmemiş ad da sayılıyor. Liste oluşunca kategoriler önce açılıyor (sıraları ve renkleri `KATEGORI_PALET` sırasıyla), toplu metindeki aynı adlı başlıklar onlara bağlanıyor. Kategori ya da kayıt girilmişse form ayarlar popup'ı yerine doğrudan sıralamaya gidiyor. Tekrar kontrolü bilerek yok.

**Toplu işlemler** — Kategoriler sonradan açıldığında kayıtları tek tek düzenlemeden dağıtmak, birçok kaydı birden taşımak ya da silmek için. Filtre şeridinin sağındaki "Seç" düğmesi (açık sekmede kayıt varken) seçim modunu açıyor: kartların solunda seçim kutusu beliriyor, karta dokunmak kaydı seçiyor (form açılmıyor, sürükleme kapalı), ekleme düğmesinin yerine mürekkep zeminli bir işlem çubuğu geliyor. Çubuğun üst satırında seçili sayısı ve "Tümünü seç" (açık sekmede filtreye uyan kayıtlar), alt satırında sekmeye göre üç işlem var — **Sıralamam:** Kategori · Bir daha asla · Sil; **Denenmemiş:** Kategori · Denedim · Sil (Kategori düğmesi listede kategori varken). "Bir daha asla" seçili kayıtları mevcut sıralarıyla bölümün sonuna taşıyor ve iki bölümü yeniden numaralıyor; seçilenlerin hepsi zaten o bölümdeyse düğme "Sıralamaya al" oluyor ve onları sıralamanın sonuna ekliyor; karışık seçimde yalnızca sıralamadakiler taşınıyor ve iki satırın arasında bunu söyleyen bir not çıkıyor. Toplu "Denedim" bekleyenleri listede göründükleri sırayla sıralamanın sonuna ekliyor (tek kayıttaki gibi yer sormuyor). "Sil" onay penceresinden sonra kayıtları tek DELETE ile, fotoğrafları kova başına tek istekle kaldırıyor. Toplu işlemler önce yazıp sonra ekranı güncelliyor; hata olursa sayfa veriyi baştan okuyor. "Kategori" alt satırı kategori haplarına çeviriyor (geri okuyla dönülüyor); bir kategoriye basmak seçili kayıtları tek istekte (`update … in (ids)`) oraya taşıyor, seçimi temizliyor ama modu açık bırakıyor ki sıradaki grup seçilebilsin. "Kategoriden çıkar" kayıtları kategorisiz yapıyor. Filtre şeridinde kategorisiz kayıt varken kesik çizgili "Kategorisiz · n" hapı çıkıyor (`lib/filtre.ts` → `KATEGORISIZ`); liste ayarlarında da "n kayıt kategorisiz — Şimdi ata" köprüsü popup'ı kapatıp bu filtreyle seçim modunu açıyor. Seçim sekmeye ait: sekme değişince temizleniyor. Esc ya da "Bitti" modu kapatıyor. Her iki sekmede de çalışıyor.

---

## Tasarım — Koleksiyon

Sıralamayı bir koleksiyon gibi sunan, sıcak ve dokunsal bir arayüz: krem zemin, yumuşak gölgeli kart yüzeyler, tek bir sıcak vurgu rengi, hap biçimli eylemler. Tüm stiller `src/app/globals.css`'te; sınıf adları bileşenlerle birebir.

Karar bu kanvastan çıktı: [Görünüm yönleri](https://claude.ai/code/artifact/6a56ee8e-2e9c-426e-bf8c-003156655c97). Kanvas yön seçiminin kaydı; uyuşmazlıkta doğru kaynak koddur.

### Temel değerler

| Token | Değer | Kullanım |
|---|---|---|
| `--paper` | `#f3eee5` | sayfa zemini |
| `--card` | `#fffdf9` | kart yüzeyleri |
| `--sunk` | `#ebe4d7` | masaüstü ray zemini |
| `--ink` | `#1d1a16` | metin, birincil düğme, seçili hap |
| `--soft` / `--mute` / `--faint` | mürekkebin %70 / %52 / %28'i | ikincil metin kademeleri |
| `--rule` / `--tint` | mürekkebin %10 / %6'sı | ince çerçeve, segment zemini |
| `--accent` | `#e03c10` | uygulamanın tek vurgu rengi |
| `--r-lg` / `--r-md` / `--r-sm` | `24px` / `18px` / `12px` | köşe yarıçapları |
| `--shadow` / `--shadow-lift` | yumuşak iki katman | kart / yüzen öğe gölgesi |

**Yazı** — Bricolage Grotesque (Google Fonts, `400–800`), tek aile. Başlıklar ve sayılar `800`, sıkı harf aralığıyla; gövde `400–600`. Versal kullanılmıyor: kullanıcının yazdığı adlar ve düğme metinleri olduğu gibi duruyor.

**Vurgu tonları** — `--accent-soft` (%15), `--accent-wash` (%8) ve `--accent-deep` (koyulaştırılmış) `color-mix` ile vurgudan türüyor.

### Kurallar

- **Yüzey kartla, derinlik gölgeyle kuruluyor** — çizgi ayraç yok denecek kadar az; bölümler kart, satırlar kart.
- **Tek vurgu rengi** — ilk üç sıranın numarası, detaydaki sıra rozeti, raydaki açık listenin sayısı ve "Denedim" düğmesi `--accent`. Listelerin kendi rengi yok; onları ad ve sayı ayırıyor.
- **Seçili durum mürekkep halka** — `0 0 0 2.5px var(--ink)`; vurgu renginde halka, vurgu renkli kartın üstünde kaybolurdu.
- **Eylemler hap** — birincil düğme mürekkep, ikincil kart zemini + ince çerçeve, tehlikeli işlem vurgunun açık tonu.
- **Seçenek grupları segment kontrolü** — sekmeler, Evet/Hayır, sıraya ekleme yeri: `--tint` zeminde, seçili parça kart gibi yükseliyor. Sekmeler boydan boya değil, içerik genişliğinde. Masaüstünde sekmeler, ortalanmış kategori şeridi, Kart / Satır geçişi ve "Seç" tek satırda (`.liste-arac`); mobilde satır sarıyor, sekmeler kendi satırında ortalı. Başlık, şampiyon satırı, sekmeler ve filtreler tek bir yapışkan kapsayıcıda (`.sticky-top`): kaydırmada sabit, yalnızca kayıtlar hareket ediyor.
- **Hareket az ve anlamlı** — giriş destesinin dönüşü, formun alttan kayması; `prefers-reduced-motion` bunları kapatıyor (deste durağan kalıyor).

### Ekranlar

- **Giriş** — İki katman: üst kısım hissettiriyor, alt kısım açıklıyor. Üstte yelpaze biçiminde örnek sıralama kartları, büyük başlık, hap biçimli Google düğmesi ve özelliklere inen bir bağlantı. Deste altı örnek listeden (her biri başka bir şey: uygulamanın tek bir şeye bağlı olmadığını söylüyor) 2,8 saniyede bir dönüyor: öndeki kart sola yukarı savrulup kayboluyor, kanatlar birer sıra öne geçiyor, arkadan yenisi giriyor. Her kart küçük bir sıralama ekranı: kategori hapları, fotoğraflı ilk üç ve kırmızı çizginin altında bir "Bir daha asla". Masaüstünde deste solda, metin sağda. Üst kısım ekranın %92'si; altındaki "Neler yapabilirsin?" bölümünün tepesi görünüyor ki aşağısı olduğu anlaşılsın. Bölümde altı özellik kartı var (listeler, sıralama, kategoriler, denenmemiş, bir daha asla, fotoğraf). Her birinin görseli genel bir ikon değil, uygulamanın arayüzünden küçük bir parça. Kartlar mobilde tek, tablette iki, masaüstünde üç sütun. Sayfanın dibinde Google düğmesi tekrar ediyor.
- **Listelerin** — Sayfanın tamamını kullanıyor. Başlıkta selamlama, liste / sıralanan / denenmemiş toplamları; sağında "Yeni liste" (masaüstü) ve hesap hapı. Her liste aynı boyda bir podyum kartı: üstte solda liste adı, sağda vurgu renginde sıralanan kayıt sayısı (etiketsiz; ekran okuyucu için `aria-label`), dipte ilk üç ve varsa "x denenmemiş". Şampiyonun (sıralamanın 1.'si) fotoğrafı kartın ortasında soluk bir zemin — maskeyle iki ucundan kart rengine eriyor, üstüne gelince biraz belirginleşiyor; fotoğrafı yoksa kart sade. Sıralaması olmayan liste gölgesiz ve kesik çizgili, ilk üç yerine "Henüz sıralama yok". Kategoriler bilerek gösterilmiyor: ana ekranın işi hangi listeye girileceğini hızla söylemek. Mobilde tek sütun (fotoğraf kartın ortasından sağına uzanıp yanlardan eriyor), tablette iki sütun, masaüstünde sütun sayısı genişliğe göre (en az 270px'lik kartlar; fotoğraf başlığın altından ilk üçün arkasına uzanıp alt ve üst uçlarından eriyor).
- **Sıralama** — Yuvarlak geri ve ayar düğmeleri, ortada liste adı ve altında şampiyon ("Şampiyon: …"; sıralama boşsa "Henüz sıralama yok"); segment sekmeler, hap filtre şeridi. Her kayıt aynı kompakt kart: sürükleme tutamağı, fotoğraf, ad ve alt bilgi, rozetler, sağda soluk ve iri sıra numarası (ilk üçte vurgu renginde). Sıralamanın altında kırmızı çizgiyle ayrılan **Bir daha asla** bölümü: kart çizginin altına sürüklenince oraya geçiyor, üstüne sürüklenince sıralamaya dönüyor; bölüm kendi içinde de sürüklenerek sıralanıyor. Bu kartlarda numara yerine çarpı var, fotoğrafları soluk. Bölüm boşken çizginin altında kısa bir ipucu duruyor. Ekleme düğmesi yüzen hap. Boş durumlar (liste yok, kayıt yok, denenmemiş yok) giriş ekranındaki özellik kartlarının küçük sahnelerini taşıyor; taslak parçalar kesik çizgili (`components/Sahne.tsx`).
- **Masaüstü** — Krem ray (her satırda liste adının altında şampiyonu; açık liste beyaz kart ve vurgu renkli sayı; satırlarda ayar simgesi yok, başlıktaki "Liste ayarları" bağlantı görünümlü bir metin düğmesi (simgesiz, zeminsiz, vurgu renginde ve altı çizili); sürükle-bırak sonrası ray yeniden okunuyor ki şampiyon güncel kalsın), yanında liste adı başlık olarak + sıralama. Kayıt seçilince sağda detay kartı açılıyor ve sıralama sütunu daralıyor; seçim yokken sıralama ortalanmış 760px'lik bir sütun.
- **Formlar** — Mobilde alttan açılan panel (tutamaklı), masaüstünde ortalanmış yuvarlak kutu. Kaydet çubuğu gövdenin dibine yapışık. Kimlik bandı: fotoğraf kutusu solda, ad ve çeşit sağında.
- **Liste ayarları** — Kayıt formuyla aynı kabukta popup (mobilde alttan panel, masaüstünde 600px kutu). Başlık düzenlenebilir liste adı; altında kategoriler ve ek alanlar kartları, en altta yalnızca "Listeyi sil" düğmesi (neyin silineceğini onay penceresi söylüyor). Açıklama satırı yok; değişiklikler anında kaydediliyor. Başlıktaki ayar düğmesi (masaüstünde "Liste ayarları" metin düğmesi, mobilde yuvarlak simge) popup'ı yerinde açıyor; yeni liste açılışı `?ayarlar=1` ile gidiyor, sayfa parametreyi okuyup adresten siliyor.

### Uygulama ayrıntıları

- **Kart görünümü** — Masaüstünde kayıtlar varsayılan olarak ızgarada kart: fotoğraf üstte ve kırpılmadan sığdırılıyor, sıra numarası fotoğrafın sol üstünde hap (ilk üçte vurgu renginde), tutamak üstüne gelince sağ üstte beliriyor. İşaretleme satırla aynı (`ItemRow`, `WishlistPanel`); yerleşimi `.rows-kart` / `.wish-kart` sınıfları değiştiriyor. Sıralamam ve Denenmemiş aynı görünümde. Filtre şeridinin sağındaki Kart / Satır geçişi tercihi `localStorage`'da tutuyor (`siralama-defteri:gorunum`). Sütunlar `auto-fill, minmax(200px, 1fr)`: detay paneli kapalıyken sütun en fazla 1080px'e genişliyor (geniş ekranda 5 kart yan yana), açıkken 2. "Bir daha asla" çizgisi ızgarada tam genişlikte ayraç. Mobil hep satır.
- **Sürükle-bırak** — dnd-kit; satır görünümünde `verticalListSortingStrategy`, kart görünümünde `rectSortingStrategy`; satır dönüşümü `CSS.Translate`, çünkü alt bilgisi olan satır daha uzun ve ölçekleme onu ezerdi. Sıralama ve "Bir daha asla" tek sıralanabilir liste; kırmızı çizgi de listenin sürüklenemeyen bir öğesi (`ASLA_SINIRI`). Bırakınca çizginin üstü `asla = false`, altı `asla = true` oluyor ve iki taraf `sira`'yı kendi içinde 0'dan numaralıyor. Kayıt ekleme (tek ve toplu) yalnızca sıralamayı hedefliyor.
- **Fotoğrafsız kayıt** — Yedek görsel her kayıtta aynı: sade zemin (`--sunk`) üstünde soluk baş harfler. Kayıt başına ad özetinden üretilen renk bilerek kaldırıldı; özellikle kart görünümünde fotoğraflı kartların arasında gürültü yapıyordu. Renk fotoğrafa kalıyor.
- **Liste özetleri** — Ana ekranın sayıları ve ilk üçü tek bir RPC'den geliyor (`si_liste_ozetleri`, `supabase/007_liste_ozetleri.sql`): liste başına bir satır, sayım veritabanında. Önceden istemci bütün kayıtları çekip sayıyordu ve PostgREST'in 1000 satır sınırında sayılar sessizce yanlışlaşıyordu. Fonksiyon `security invoker`, yani RLS geçerli. İlk üçün seçimi `lib/sort.ts` ile aynı kural: denenmiş, `asla` değil, `sira` artan, eşitlikte en yeni önce. RPC hata verirse indeks yine açılıyor, sayılar sıfır görünüyor ve konsola uyarı düşüyor.
- **Giriş destesi** — `AuthGate` içindeki `GirisDestesi` her adımda kartların `data-yuva` değerini kaydırıyor (`1`, `2`, `3`, `cikis`, `bekle`); konumları CSS çiziyor. Tüm kartlar aynı boyda ve aynı noktada, arkadakiler ölçekle küçülüyor — geçiş yalnızca transform, opaklık ve renk. Kartın içindeki renkler `currentColor`dan türüyor, böylece kart öne geçip beyaz metne döndüğünde içerik de onunla birlikte geçiyor. Fotoğraflar gerçek görsel değil, renkli kutucuklar (`--f`).
- **Hesap bloğu** — Google profil fotoğrafı (`avatar_url` / `picture`) ve ad; e-posta gösterilmiyor. Fotoğraf `referrerPolicy="no-referrer"` ile yükleniyor (Google aksi hâlde 403 verebiliyor), yüklenemezse baş harfe dönüyor. Blok tek bileşen (`Hesap`), yeri ekrana göre değişiyor. Masaüstü sıralama ekranında `AuthGate` onu sayfanın kardeşi olarak rayın dibine çiziyor. Ana ekranda sayfa kendisi başlığın sağ üstüne hap olarak çiziyor (mobilde avatar + çıkış, masaüstünde ad da); `AuthGate`'in bloğu orada CSS ile gizli. Mobil sıralama ekranlarında hesap yok: altları ekleme düğmesiyle dolu.
- **Sekme simgesi** — `src/app/icon.svg`: mürekkep zeminde azalan uzunlukta üç çizgi. Ayar simgesi de aynı sözlükten (üç çizgi ve tutamakları). Vurgu rengi bilerek kullanılmadı: simge mürekkep ve kağıtla sade kalıyor.

---

## Yol haritası

Öncelik sırasıyla; maddeler birbirinden bağımsız. İkisi de "ne zaman yapılacağı belli değil" kategorisinde — uygulama bunlarsız da tam çalışıyor.

| # | İş | Neden / not |
|---|---|---|
| 1 | **Ek alan filtresine bir yer bul** *(ayrıntılandırılacak)* | Evet/Hayır alanlarına göre filtreleme şeritte yok: sıralamanın hemen üstünü kalabalıklaştırıyordu. Ayrımın kendisi işe yarıyor — ikincil bir kontrol ya da açılır menü. Mantık `lib/filtre.ts`'te duruyor, `FilterPanel`'in `stack` düzeni de hâlâ çiziyor; eksik olan yalnızca ona giden bir kapı. |
| 2 | **İkili karşılaştırma ekranı** *(gerekli mi, karar verilmedi)* | "Hangisi daha iyi?" akışı — uzun listelerde telefonda sürükleyerek sıralamak zahmetli. Yeni bir sıralama algoritması demek; maliyeti yüksek, ihtiyaç netleşmeden başlanmayacak. |

### Kabul edilmiş sınırlar

Bunlar iş değil, bilinçli kararlar:

- **Apple girişi yok** — Supabase'de hazır provider ama Apple Developer hesabı ($99/yıl) gerektiriyor. Google girişi tek yol.
- **Liste simgesi yok** — kayıtların çoğunda zaten fotoğraf var, listenin ayrıca simge taşımasına gerek yok. `si_lists.emoji` kolonu şemada duruyor ama kod ne yazıyor ne okuyor.
- **Liste rengi yok** — listeler renkle ayrışmıyor, uygulamanın tek vurgu rengi var. `si_lists.renk` kolonu şemada duruyor ama kod okumuyor; yeni listeler varsayılanla doğuyor.
- **Kategori sırası elle ayarlanmaz** — kategoriler kayıt sayısına göre sıralanıyor (eşitlikte `sira`, sonra `created_at`). `si_categories.sira` yalnızca eşitlik bozucu.
- **`si_lists.sira` arayüzde kullanılmıyor** — listeler de sıralanmış kayıt sayısına göre diziliyor.
- **Alan tipini değiştirmek veriyi dönüştürmez** — Evet/Hayır'dan Metin'e çevrilen alanın eski `true/false` değerleri kayıtta kalır ama okunmaz olur.
- **Kategori silmek kayıtları silmez** — `on delete set null` ile kayıtlar kategorisiz kalır.
- **Toplu kategori atama ek alan değerlerine dokunmaz** — yalnızca belirli bir kategoride görünen bir alanın değeri, kayıt başka kategoriye taşınınca kayıtta kalır ama görünmez olur. Tek kayıt formu kaydederken bu değerleri temizliyor; toplu yol `ozellikler`i hiç okumadığı için temizlemiyor.
- **Toplu işlemlerde geri alma yok** — taşımalar anında yazılıyor, silme onay penceresinden sonra kalıcı. Sıralamadaki kayıtları toplu olarak "Denenmemiş"e geri gönderme de bilerek yok: nadir bir ihtiyaç, tek kayıt formundan yapılıyor.
- **Bölüm taşıma satır satır yazılıyor** — "Bir daha asla" / "Sıralamaya al" iki bölümün bütün kayıtlarını yeniden numaraladığı için sürükle-bırak gibi kayıt başına bir UPDATE atıyor; toplu "Denedim" yalnızca taşınanlar kadar. Kategori atama ve silme tek istek.
- **`si_items.sira` benzersiz değil** — sürükle-bırak satırları tek tek UPDATE ettiği için ara durumlarda geçici çakışma olur.
- **Bekleyenlerin kendi URL'i yok** — "Denenmemiş" bir sekme; donanım geri tuşu sekmeler arasında gezmiyor, listeden çıkıyor.
- **Filtre şeridi yalnızca kategori taşıyor** — "Tümü" + kategoriler (+ kategorisiz kayıt varken "Kategorisiz"), tek seçim: bir kategori seçmek öncekini bırakıyor, seçimi "Tümü" temizliyor. Evet/Hayır alanlarına göre ayrım şu an arayüzün hiçbir yerinde yok; yol haritasında 1. sırada.
- **Sıralama yalnızca filtresiz görünümde ve seçim modu kapalıyken değiştirilebilir** — filtreli görünümde ve seçim modunda kartlar sürüklenemiyor; "Bir daha asla"ya taşımak da yalnızca filtresizken.
- **Liste adı değişince slug değişmez** — kayıtlı bağlantılar kırılmasın diye.
- **Fotoğraf kovasının adı değişmeyecek** — `lib/items.ts` içindeki `KOVA` sabiti genel bir ad değil ama kullanıcıya görünmüyor. Supabase kovaları yeniden adlandırılamıyor; "adı değiştirmek" yeni kovaya kopyalamak ve tüm `fotograf_url` değerlerini güncellemek demek. Kazancı yalnızca kozmetik, riski fotoğraf kaybı. Silme işlevi kova adını URL'den okuduğu için ileride taşınırsa eski ve yeni kova bir süre yan yana çalışabilir.
- **Sunucu tarafı koruma yok** — uygulama tamamen istemci tarafında; `AuthGate` bir kapı, güvenlik RLS'te.

---

## Veri modeli

Üç tablo — liste sayısı ne olursa olsun tablo sayısı sabit. Her sıralama `si_lists` içinde **bir satır**.

```
si_lists       id, user_id, ad, slug, emoji, renk, sira, alanlar(jsonb), created_at
               └ emoji, renk ve sira kullanılmıyor (bkz. kabul edilmiş sınırlar)
si_categories  id, list_id, ad, renk, sira, created_at
si_items       id, list_id, category_id, ad, alt_ad, fotograf_url,
               sira, denendi, asla, notlar, ozellikler(jsonb), created_at
```

Kritik ayrıntılar:

- **`si_lists.alanlar`** — listeye özel ek alan tanımları. Biçim:
  `[{anahtar, tip: 'bool'|'metin', etiket, kisa?, ipucu?, filtre?, kategori_id?}]`
  Örneğin bir içecek listesinde "Ekşi mi?" (Evet/Hayır) ya da "Satılan market" (Metin). Filtre şeridi, form ve detay paneli bu tanımdan üretiliyor.
- **`si_items.asla`** — denenmiş ama sıralamada değil: "Bir daha asla" bölümünde. Sıralama ve bölüm `sira`'yı kendi içlerinde ayrı ayrı numaralıyor; ayrımı bu kolon yapıyor.
- **`si_items.ozellikler`** — yukarıdaki alanların değerleri (`{"eksi": true, "market": "Migros"}`).
- **`category_id` nullable, `on delete set null`** — kategori silinince kayıtlar kategorisiz kalır.
- **RLS** — üç tabloda da açık; `si_lists` doğrudan `user_id` ile, diğer ikisi liste üzerinden.

### Migration dosyaları

`supabase/` altında, çalıştırıldıkları sırayla. **006'ya kadar hepsi uygulanmış durumda; `007` Supabase SQL Editor'da elle çalıştırılmalı** (çalıştırılmadan ana ekranın sayıları sıfır görünür); boş bir projede sırayla çalıştırılınca şemayı eksiksiz kurarlar. Numaralardaki boşluklar (`002`, `005`) bilinçli: o numaralar tek seferlik veri işlerine aitti, şemaya katkıları yoktu.

| Dosya | Ne yapar |
|---|---|
| `001_sema.sql` | Üç tabloyu ve RLS politikalarını kurar |
| `003_liste_alanlari.sql` | `alanlar` kolonunu ekler |
| `004_liste_rengi.sql` | `renk` kolonunu ekler (şu an kullanılmıyor) |
| `006_bir_daha_asla.sql` | `asla` kolonunu ekler ("Bir daha asla" bölümü) |
| `007_liste_ozetleri.sql` | `si_liste_ozetleri()` fonksiyonu: ana ekranın sayıları ve ilk üçü |

---

## Kimlik doğrulama

Google girişi, Supabase Auth üzerinden. Uygulama tamamen istemci tarafında çalıştığı için `@supabase/ssr` ve proxy (Next 16'da `middleware` bu ada taşındı) kullanılmıyor: oturum tarayıcıda tutuluyor, asıl koruma RLS'te.

Kurulum notları:
- Google Cloud'da OAuth client → Authorized redirect URI: `https://<proje-ref>.supabase.co/auth/v1/callback`
- Authorized domain olarak `supabase.co` kabul edilmiyor, **proje kodlu tam hâli** girilmeli
- Supabase → Authentication → URL Configuration → Redirect URLs'e hem `http://localhost:3000/**` hem üretim adresi eklenmiş olmalı
- Site URL örtük olarak izinli yönlendirme sayılıyor: Redirect URLs'te olmayan bir adres yalnızca Site URL olduğu için çalışıyor olabilir — alan adı değiştirirken bu sıralamayı bozmamak gerek

---

## Proje yapısı

```
src/
  app/
    layout.tsx                    kök düzen, AuthGate sarmalayıcısı
    page.tsx                      liste indeksi (Listelerin)
    globals.css                   tüm stiller — Koleksiyon tasarım sistemi
    icon.svg                      sekme simgesi — azalan üç çizgi
    l/[slug]/
      page.tsx                    sıralama ekranı — sekmeler, detay paneli, ayarlar popup'ı
      ayarlar/page.tsx            eski adres: listeye yönlendirip ayarlar popup'ını açar
  components/
    AuthGate.tsx                  giriş ekranı + hesap bloğu (kimlik + çıkış)
    ItemRow.tsx                   sıralama kartı (statik + sürüklenebilir)
    ItemForm.tsx                  kayıt ekleme/düzenleme formu (tek + toplu sekmeleri)
    TopluAlan.tsx                 toplu giriş kutusu ve ayrıştırma önizlemesi
    ListeRayi.tsx                 masaüstü sol ray (künye + liste indeksi + şampiyon)
    ListeEkleModal.tsx            yeni liste formu (ana ekran ve raydan açılır)
    FilterPanel.tsx               veri güdümlü filtre şeridi
    DetailPane.tsx                masaüstü detay paneli — yalnızca bir kayıt seçiliyken
    ListeAyarlariModal.tsx        liste ayarları popup'ı (ad, kategoriler, ek alanlar, silme)
    WishlistPanel.tsx             "Denenmemiş" sekmesinin kartları
    Hesap.tsx                     hesap bloğu (avatar, ad, çıkış) — ray dibi ve ana ekran başlığı
    Sahne.tsx                     küçük arayüz sahneleri — giriş özellikleri ve boş durumlar
  hooks/
    useAuth.ts                    oturum durumu
    useListStore.ts               bir listenin tüm verisi (liste + kategoriler + öğeler)
    useListeler.ts                liste indeksi + kayıt sayıları, sayıya göre sıralı
    useIsDesktop.ts
  lib/
    supabase.ts                   istemci (PKCE, oturum kalıcılığı)
    auth.ts                       signInWithGoogle / signOut
    items.ts                      si_* CRUD + fotoğraf
    toplu.ts                      toplu giriş ayrıştırma ve kaydetme
    filtre.ts                     filtre durumu, uygulama ve sayımlar
    sort.ts                       sıralama mantığı
    slug.ts                       Türkçe slug üretimi
    hata.ts                       Supabase hata nesnelerini okunur metne çevirir
  types/item.ts                   Item, Kategori, Liste, AlanTanimi + yardımcılar
supabase/                         migration dosyaları
```

Sekme simgesi `app/icon.svg` konvansiyonuyla geliyor; `public/` klasörü yok.

---

## Çalıştırma

```bash
npm install
npm run dev
```

`.env.local` gerekli:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Üretim build'i:

```bash
npm run build
```

## Teknolojiler

Next.js 16.2.7 · React 19.2.4 · TypeScript · Supabase (Postgres + Auth + Storage) · dnd-kit
