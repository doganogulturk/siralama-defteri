# Sıralama Defteri

Kişisel sıralama uygulaması: denediğin şeyleri kendi listelerinde sürükleyerek sırala, kendi kategorilerini kur, henüz denemediklerini ayrı bir sekmede tut. Çok listeli ve kullanıcı bazlı; her liste kendi kategorilerini ve ek alanlarını taşıyor.

---

## Durum

Uygulama çalışır ve **canlıda**: giriş, çok listeli sıralama, kategori ve alan yönetimi, toplu kayıt ekleme, Vitrin arayüzü (açık ve koyu tema).

**Dağıtım** — Vercel, `main` dalından otomatik: <https://siralama-defteri.vercel.app>. Push üretimi günceller. Vercel'de `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` tanımlı olmalı; Supabase'in Redirect URLs listesinde üretim alan adı da bulunmalı, yoksa build geçer ama Google girişi canlıda **sessizce** başarısız olur — giriş `redirectTo` olarak `window.location.origin` kullandığı için tek kapı o liste.

**Veri** — `si_lists` / `si_categories` / `si_items` şeması RLS ile kurulu. Şemada bu üç tablo, ana ekranın özetlerini hazırlayan `si_liste_ozetleri` ve paylaşılan listeyi okuyan `si_paylasilan_liste` fonksiyonları var.

**Kimlik** — Google girişi Supabase Auth üzerinden; uygulama sayfaları (`app/(uygulama)/`) `AuthGate` arkasında, asıl koruma RLS'te. Paylaşım sayfaları bu grubun dışında: oturum istemiyor.

**Arayüz** — İki ekran: `/` liste indeksi ve `/l/[slug]` sıralama. Liste ayarları ayrı bir sayfa değil, sıralama ekranının üstünde açılan bir popup; eski `/l/[slug]/ayarlar` adresi listeye yönlendirip popup'ı açıyor. Bekleyenler de ayrı bir route değil, sıralama ekranının ikinci sekmesi ("Denenmemiş"). Masaüstünde bir kayda tıklayınca sağda detay paneli açılıyor, seçim kalkınca kapanıyor. Sol ray satırları sıralanmış kayıt sayısı + liste adı + şampiyon taşıyor; liste ayarları sıralama başlığındaki düğmeden açılıyor.

Listeler ve kategoriler kayıt sayısına göre sıralı — elle sıralama diye bir iş yok. Listelerde ölçü "kaç şeyi denedim": bekleyenler sayılmıyor, "Bir daha asla" bölümündekiler sayılıyor; bir kayıt "Denedim" ile sıralamaya geçtiğinde rakam artıyor. Ray ve indeks sayıları sayfadan ayrı bir sorgudan geldiği için `useListeler`'de küçük bir haber kanalı var: sayfa bir mutasyondan sonra `listeleriTazele()` çağırıyor.

Kodda listeye özel hiçbir alan adı geçmiyor: kategoriler veritabanından, ek alanlar `si_lists.alanlar` tanımından üretiliyor.

Masaüstündeki sağ panel kaydın tamamını gösteriyor (not dahil, satır sonları korunuyor); sıralamadaki kayıtta "Sıralamadaki yeri" bölümü bir üstünü ve bir altını gösteriyor, onlara tıklayınca panel o kayda geçiyor; Düzenle düğmesi yalnızca değiştirmek için. Sırası olmayan kayıtta sıra rozeti yerine "Denenmemiş" ya da "Bir daha asla" yazıyor. Fotoğraf alanı aynı zamanda yükleme yeri: tıklayarak ya da dosyayı üstüne bırakarak Düzenle'yi açmadan fotoğraf eklenip değiştirilebiliyor. Fotoğraf kırpılmadan sığdırılıyor (ürün fotoğrafları çoğunlukla dikey).

**Paylaşım** — Liste ayarlarının en üstündeki "Paylaşım" bölümü salt okunur bir bağlantı (`/p/[kod]`) oluşturuyor; alan herkes giriş yapmadan sıralamayı görüyor. Kod liste adresinden bağımsız, 16 rastgele harf-rakam (`si_lists.paylasim_kodu`, boşsa paylaşım kapalı). "Bağlantıyı yenile" yeni kod üretip eski bağlantıyı geçersiz kılıyor, "Paylaşımı kapat" kodu siliyor. Telefonda "Paylaş" sistemin paylaşım menüsünü açıyor; "Kopyala" ve "WhatsApp" her yerde var. Sayfa sunucuda çiziliyor (WhatsApp önizleme kartını hazırlarken JavaScript çalıştırmıyor) ve canlı: sıralama değiştikçe bağlantı da değişiyor. Veri tek kapıdan geliyor: `si_paylasilan_liste` (security definer) yalnızca liste adını, ek alan tanımlarını, kategorileri, sıralamayı, "Bir daha asla"yı ve sahibin Google'daki adını döndürüyor — e-posta, kullanıcı kimliği, notlar ve denenmemişler dönmüyor; tablolara anonim okuma açılmadı. Sayfada tamlayan ekli başlık ("Doğan Oğultürk'ün sıralaması", `lib/paylasim.ts` → `tamlayan`), aynı satırlar (dokunma ve sürükleme yok, kategori renkli hap) ve altta uygulamaya davet var; arama motorlarına kapalı (`noindex`). Önizleme görseli (`opengraph-image.tsx`) sahibi, liste adını ve fotoğraflarıyla ilk üçü çiziyor; yazı tipleri `src/fonts/`'ta (OFL). Fotoğraflar yalnızca uygulamanın kendi Supabase kovasındaysa gösteriliyor ve görsel için sunucuda indiriliyor (`guvenliFoto`): `fotograf_url` sahibinin yazabildiği bir alan, başka bir adres sunucuyu oraya istek atmaya yöneltirdi. Görsel motorunun çizemediği biçimler (HEIC gibi) baş harfe düşüyor. Üretimde çalışması için `supabase/008_paylasim.sql` Supabase'de çalıştırılmış olmalı.

**Toplu ekleme** — Kayıt formunun ikinci sekmesi ("Toplu"). Alt alta yazılan her satır bir kayıt; sonu iki nokta ile biten satır (`Patates:`) listenin içinde bir kategori açar, altındaki satırlar oraya yazılır. Satır içi biçim de geçerli: `Cips: Doritos` satırında iki noktadan önceki kısım kategori, sonrası kayıt. İlk virgülden sonrası kaydın "Çeşit / Alt ad" değeri olur (`Doritos, Nacho`); sonraki virgüller alt adın içinde kalır, bu yüzden bir satıra birden çok kayıt yazılamıyor. Ayrıştırma `lib/toplu.ts`'te; form kaydetmeden önce sonucu önizleme olarak gösteriyor — virgül ya da iki nokta kayıt adının içinde geçtiğinde bölünme yanlış olur, kullanıcı bunu kaydetmeden görmeli. Sekme formun kipini miras alıyor: sıralamadayken kayıtlar yazıldıkları sırayla sıralamanın altına, "Denenmemiş" sekmesindeyken bekleyenlere düşüyor. Aynı kutu Yeni Liste formunda da var (kapalı doğar): listeyi ve kategorilerini tek hamlede kurmak için. Yeni Liste formunda ayrıca bir **Kategoriler** alanı var: Enter ya da virgül yazılan adı hapa çeviriyor (yapıştırılan "a, b, c" de bölünüyor), Backspace boş kutuda son hapı siliyor, büyük-küçük harf farkıyla tekrarlar atılıyor, kutuda yazılı kalıp eklenmemiş ad da sayılıyor. Liste oluşunca kategoriler önce açılıyor (sıraları ve renkleri `KATEGORI_PALET` sırasıyla), toplu metindeki aynı adlı başlıklar onlara bağlanıyor. Kategori ya da kayıt girilmişse form ayarlar popup'ı yerine doğrudan sıralamaya gidiyor. Tekrar kontrolü bilerek yok.

**Toplu işlemler** — Kategoriler sonradan açıldığında kayıtları tek tek düzenlemeden dağıtmak, birçok kaydı birden taşımak ya da silmek için. Filtre şeridinin sağındaki "Seç" düğmesi (açık sekmede kayıt varken) seçim modunu açıyor: kartların solunda seçim kutusu beliriyor, karta dokunmak kaydı seçiyor (form açılmıyor, sürükleme kapalı), ekleme düğmesinin yerine mürekkep zeminli bir işlem çubuğu geliyor. Çubuğun üst satırında seçili sayısı ve "Tümünü seç" (açık sekmede filtreye uyan kayıtlar), alt satırında sekmeye göre üç işlem var — **Sıralamam:** Kategori · Bir daha asla · Sil; **Denenmemiş:** Kategori · Denedim · Sil (Kategori düğmesi listede kategori varken). "Bir daha asla" seçili kayıtları mevcut sıralarıyla bölümün sonuna taşıyor ve iki bölümü yeniden numaralıyor; seçilenlerin hepsi zaten o bölümdeyse düğme "Sıralamaya al" oluyor ve onları sıralamanın sonuna ekliyor; karışık seçimde yalnızca sıralamadakiler taşınıyor ve iki satırın arasında bunu söyleyen bir not çıkıyor. Toplu "Denedim" bekleyenleri listede göründükleri sırayla sıralamanın sonuna ekliyor (tek kayıttaki gibi yer sormuyor). "Sil" onay penceresinden sonra kayıtları tek DELETE ile, fotoğrafları kova başına tek istekle kaldırıyor. Toplu işlemler önce yazıp sonra ekranı güncelliyor; hata olursa sayfa veriyi baştan okuyor. "Kategori" alt satırı kategori haplarına çeviriyor (geri okuyla dönülüyor); bir kategoriye basmak seçili kayıtları tek istekte (`update … in (ids)`) oraya taşıyor, seçimi temizliyor ama modu açık bırakıyor ki sıradaki grup seçilebilsin. "Kategoriden çıkar" kayıtları kategorisiz yapıyor. Filtre şeridinde kategorisiz kayıt varken kesik çizgili "Kategorisiz · n" hapı çıkıyor (`lib/filtre.ts` → `KATEGORISIZ`); liste ayarlarında da "n kayıt kategorisiz — Şimdi ata" köprüsü popup'ı kapatıp bu filtreyle seçim modunu açıyor. Seçim sekmeye ait: sekme değişince temizleniyor. Esc ya da "Bitti" modu kapatıyor. Her iki sekmede de çalışıyor.

---

## Tasarım — Vitrin

Sıralamayı bir vitrin gibi sunan, sakin ve içerik odaklı bir arayüz: nötr yüzeyler, kıl çizgisi çerçeveler, tek sıcak vurgu rengi; başlıklar ve sıra numaraları editoryal bir serif ile. Fotoğraflar ve adlar öne çıkıyor, arayüz geri çekiliyor. Açık ve koyu tema sistem ayarını izliyor. Tüm stiller `src/app/globals.css`'te; sınıf adları bileşenlerle birebir.

Önceki tasarım (Koleksiyon — krem zemin, gölgeli kartlar, Bricolage Grotesque) bu kanvastan çıkmıştı: [Görünüm yönleri](https://claude.ai/code/artifact/6a56ee8e-2e9c-426e-bf8c-003156655c97). Vitrin onun yapısını (podyum, "Bir daha asla" çizgisi, tek vurgu) koruyup yüzeyi yeniledi; uyuşmazlıkta doğru kaynak koddur.

### Temel değerler

Renkler OKLCH; koyu tema aynı tokenları `@media (prefers-color-scheme: dark)` içinde yeniden tanımlıyor, bileşen kuralları temadan habersiz.

| Token | Açık | Koyu | Kullanım |
|---|---|---|---|
| `--bg` | `oklch(0.975 0.004 85)` | `oklch(0.165 0.006 60)` | sayfa zemini |
| `--bg-2` | `oklch(0.952 …)` | `oklch(0.19 …)` | masaüstü ray, giriş sahneleri |
| `--surface` | `oklch(0.998 …)` | `oklch(0.215 …)` | kartlar, satırlar, alanlar |
| `--surface-2` | `oklch(0.962 …)` | `oklch(0.255 …)` | fotoğraf kutuları, komşu satırları |
| `--ink` | `oklch(0.2 0.01 60)` | `oklch(0.955 …)` | metin, birincil düğme, seçili hap |
| `--soft` / `--mute` / `--faint` | mürekkebin %74 / %54 / %30'u | aynı | ikincil metin kademeleri |
| `--line` / `--tint` | mürekkebin %10 / %5,5'i | %11 / %7 | kıl çizgisi, segment zemini |
| `--accent` | `oklch(0.62 0.205 36)` | `oklch(0.68 0.185 38)` | uygulamanın tek vurgu rengi |
| `--accent-ink` | `oklch(0.5 0.17 36)` | `oklch(0.8 0.13 42)` | vurgu tonlu zeminde okunur metin |
| `--bar` / `--on-bar` | koyu çubuk | yükseltilmiş yüzey | seçim çubuğu, bildirim |
| `--glass` + `--blur` | zeminin %78'i + `blur(18px) saturate(1.8)` | %72 | yapışkan başlık, cam haplar |
| `--r-xl` / `--r-lg` / `--r-md` / `--r-sm` | `28` / `22` / `16` / `12px` | | köşe yarıçapları |
| `--hair` / `--shadow-sm` / `--shadow` / `--shadow-lift` | | koyu temada daha derin | çerçeve ve yükseklik kademeleri |

**Yazı** — İki aile, ikisi de `next/font/google` ile derleme anında indirilip uygulamayla birlikte sunuluyor (tarayıcı Google'a istek atmıyor, yüklenirken sayfa kaymıyor; `latin-ext` Türkçe harfler için şart):
- **Geist** (değişken, `--sans`) — bütün arayüz: gövde `400`, etiketler `500`, adlar ve başlıklar `600`. Sayılarda `tabular-nums`.
- **Instrument Serif** (`--serif`, yalnızca `400` ve italik) — yalnızca iri boyutlarda: sayfa başlıkları, liste adları, sıra numaraları, boş durum başlıkları. Giriş başlığındaki vurgulu kelime (*sırala.*) italik ve vurgu renginde.

Versal kullanılmıyor: kullanıcının yazdığı adlar ve düğme metinleri olduğu gibi duruyor.

**Vurgu tonları** — `--accent-soft` (%14; koyu temada %22) ve `--accent-wash` (%7; koyu temada %11) `color-mix` ile vurgudan türüyor.

### Kurallar

- **Yüzey kıl çizgisiyle, derinlik az gölgeyle** — kartlar ve satırlar `--hair` (1px, mürekkebin %10'u) ve çok hafif bir gölge taşıyor; üstüne gelince çizgi koyulaşıyor, yüzen öğeler (`fab`, seçim çubuğu, pencere) `--shadow-lift` ile ayrılıyor.
- **Tek vurgu rengi** — ilk üç sıranın numarası, şampiyonun kartı, detaydaki sıra rozeti, raydaki açık listenin sayısı, liste kartındaki sayı ve "Denedim" düğmesi `--accent`. Listelerin kendi rengi yok; onları ad ve sayı ayırıyor.
- **Şampiyon ayrışıyor** — sıralamanın 1.'si (`.row.is-sampiyon`) vurgunun hafif tonlu zemini ve vurgu tonlu çerçevesiyle; kart görünümünde numara hapı dolu vurgu renginde.
- **Seçili durum mürekkep halka** — `--ring` (`0 0 0 2px var(--ink)`); vurgu renginde halka, şampiyonun vurgu tonlu kartında kaybolurdu. Klavye odağı vurgu renginde dış çizgi.
- **Eylemler hap** — birincil düğme mürekkep (koyu temada açık renk), ikincil yüzey + kıl çizgisi, tehlikeli işlem vurgunun açık tonu.
- **Seçenek grupları segment kontrolü** — sekmeler, Evet/Hayır, sıraya ekleme yeri, Kart / Satır: `--tint` zeminde, seçili parça yüzey gibi yükseliyor. Sekmeler içerik genişliğinde.
- **Cam yalnızca kayan içeriğin üstünde** — yapışkan başlık (`.sticky-top`), kart görünümündeki numara ve tutamak hapları, fotoğraf üstündeki düğmeler yarı saydam ve bulanık. Başlık kaydırma başlayınca altına kıl çizgisi indiriyor (`animation-timeline: scroll()`, desteklemeyen tarayıcıda çizgisiz kalıyor).
- **Hareket az ve anlamlı** — kartların sırayla yükselişi, pencerelerin yaylı girişi (`--spring`, CSS `linear()`), giriş destesinin dönüşü. Giriş hareketleri `transform` yerine `translate` / `scale` ile yazılı: öğenin kendi transform'uyla (ortalanmış düğme) çakışmıyor. `prefers-reduced-motion` hepsini kapatıyor (deste durağan kalıyor).
- **Yükleniyor = iskelet** — "Yükleniyor…" satırı yerine içeriğin biçiminde soluk, parıldayan taslaklar (`components/Iskelet.tsx`): veri gelince yerleşim yerinde kalıyor.

### Ekranlar

- **Giriş** — İki katman: üst kısım hissettiriyor, alt kısım açıklıyor. En üstte marka işareti; arkada vurgu renginden yumuşak bir ışık. Yelpaze biçiminde örnek sıralama kartları, serif büyük başlık, hap biçimli Google düğmesi ve özelliklere inen bir bağlantı. Deste altı örnek listeden (her biri başka bir şey: uygulamanın tek bir şeye bağlı olmadığını söylüyor) 2,8 saniyede bir dönüyor: öndeki kart sola yukarı savrulup kayboluyor, kanatlar birer sıra öne geçiyor, arkadan yenisi giriyor. Her kart küçük bir sıralama ekranı: kategori hapları, fotoğraflı ilk üç ve vurgu çizgisinin altında bir "Bir daha asla". Masaüstünde deste solda, metin sağda. Altındaki "Neler yapabilirsin?" bölümünde altı özellik kartı var (listeler, sıralama, kategoriler, denenmemiş, bir daha asla, fotoğraf); görselleri genel ikon değil, uygulamanın arayüzünden küçük parçalar. Kartlar mobilde tek, tablette iki, masaüstünde üç sütun. Sayfanın dibinde Google düğmesi tekrar ediyor.
- **Listelerin** — Üstte ince bir çubuk: solda marka, sağda "Yeni liste" (masaüstü) ve hesap hapı. Altında selamlama, serif iri başlık ve liste / sıralanan / denenmemiş toplamları küçük haplar olarak. Her liste bir vitrin kartı: üstte serif liste adı ve vurgu tonlu hapta sıralanan kayıt sayısı (etiketsiz; ekran okuyucu için `aria-label`); ortada ilk üçün fotoğraflarından bir **podyum** — şampiyon ortada ve en yüksekte, ikinci solda, üçüncü sağda, alt kenarları hizalı, her basamakta numara; altında ilk üçün adları ve varsa "x denenmemiş". Fotoğrafsız kayıt basamağında baş harfler, boş basamak kesik çizgili. Sıralaması olmayan liste gölgesiz ve kesik çizgili, ilk üç yerine "Henüz sıralama yok". Kategoriler bilerek gösterilmiyor: ana ekranın işi hangi listeye girileceğini hızla söylemek. Mobilde tek sütun ve podyum solda, adlar sağında; tablette iki sütun, masaüstünde sütun sayısı genişliğe göre (en az 280px'lik kartlar) ve podyum adların üstünde.
- **Sıralama** — Yuvarlak geri ve ayar düğmeleri, ortada serif liste adı ve altında şampiyon ("Şampiyon: …"; sıralama boşsa "Henüz sıralama yok"); segment sekmeler, hap filtre şeridi (taşınca kenarlarından eriyor). Her kayıt aynı kompakt satır: solda iri serif sıra numarası (ilk üçte vurgu renginde), fotoğraf, ad ve alt bilgi, rozetler, sağda sürükleme tutamağı. Sıralamanın altında vurgu çizgisiyle ayrılan **Bir daha asla** bölümü: kart çizginin altına sürüklenince oraya geçiyor, üstüne sürüklenince sıralamaya dönüyor; bölüm kendi içinde de sürüklenerek sıralanıyor. Bu satırlarda numara yerine çarpı var, zeminleri ve fotoğrafları soluk. Bölüm boşken çizginin altında kısa bir ipucu duruyor. Ekleme düğmesi yüzen hap. Boş durumlar (liste yok, kayıt yok, denenmemiş yok) ortalı ve giriş ekranındaki özellik kartlarının küçük sahnelerini taşıyor; taslak parçalar kesik çizgili (`components/Sahne.tsx`).
- **Masaüstü** — Solda ray: marka, "Listeler" başlığı ve sayısı, her satırda liste adının altında şampiyonu; açık liste yüzey kartı ve vurgu renkli sayı; satırlarda ayar simgesi yok. Başlıkta serif liste adı, sağında simgeli, sakin bir "Liste ayarları" hapı (sürükle-bırak sonrası ray yeniden okunuyor ki şampiyon güncel kalsın). Kayıt seçilince sağda detay kartı açılıyor ve sıralama sütunu daralıyor; seçim yokken sıralama ortalanmış 760px'lik bir sütun. Başlık şeridi dar kaldığında (detay paneli açıkken) kategori şeridi kendi satırına iniyor — ölçü sayfa değil şeridin kendisi (`@container ust-serit`).
- **Pencereler** — Kayıt formu, yeni liste ve liste ayarları tek kabukta: yerel `<dialog>` (`components/Sheet.tsx`). `showModal()` pencereyi en üst katmana alıyor, arkadaki sayfayı etkisizleştiriyor ve Tab odağını içeride tutuyor; Esc, zemine dokunma ve kapat düğmesi aynı `onClose`'dan geçiyor. Zemine dokunma yalnızca basış da zeminde başladıysa kapatıyor: alanda başlayıp dışarıda biten metin seçimi formu kapatmasın. Açıkken arkadaki sayfa kaymıyor (`html:has(.sheet[open])`). Mobilde alttan yaylı açılan panel (tutamaklı), masaüstünde ortalanmış kutu; zemin bulanık. Kaydet çubuğu gövdenin dibine yapışık. React'in `autoFocus`'u pencere açılmadan çalışıp boşa gittiği için ilk odaklanacak alan `data-autofocus` ile işaretleniyor.
- **Liste ayarları** — Aynı kabukta (mobilde alttan panel, masaüstünde 600px kutu). Başlık düzenlenebilir serif liste adı; altında kategoriler ve ek alanlar kartları, en altta yalnızca "Listeyi sil" düğmesi (neyin silineceğini onay penceresi söylüyor). Açıklama satırı yok; değişiklikler anında kaydediliyor. Başlıktaki ayar düğmesi pencereyi yerinde açıyor; yeni liste açılışı `?ayarlar=1` ile gidiyor, sayfa parametreyi okuyup adresten siliyor.

### Uygulama ayrıntıları

- **Kart görünümü** — Masaüstünde kayıtlar varsayılan olarak ızgarada kart: fotoğraf üstte ve kırpılmadan sığdırılıyor, sıra numarası fotoğrafın sol üstünde cam hap (ilk üçte vurgu renginde, şampiyonda dolu vurgu), tutamak üstüne gelince sağ üstte beliriyor. İşaretleme satırla aynı (`ItemRow`, `WishlistPanel`); yerleşimi `.rows-kart` / `.wish-kart` sınıfları değiştiriyor. Sıralamam ve Denenmemiş aynı görünümde. Filtre şeridinin sağındaki Kart / Satır geçişi tercihi `localStorage`'da tutuyor (`siralama-defteri:gorunum`). Sütunlar `auto-fill, minmax(196px, 1fr)`: detay paneli kapalıyken sütun en fazla 1080px'e genişliyor (geniş ekranda 5 kart yan yana), açıkken 2. "Bir daha asla" çizgisi ızgarada tam genişlikte ayraç. Mobil hep satır. Açık temada kart ve detay fotoğrafları `mix-blend-mode: multiply` ile kutunun zeminine karışıyor: beyaz fonlu ürün fotoğrafı kenarda şerit bırakmıyor.
- **Satır düzeni** — İşaretlemede tutamak başta, numara sonda duruyor; görsel sıra CSS `order` ile (numara solda, rozetler ve tutamak sağda). Sürükleme yalnızca tutamaktan başlıyor, satıra dokunmak seçiyor.
- **Sürükle-bırak** — dnd-kit; satır görünümünde `verticalListSortingStrategy`, kart görünümünde `rectSortingStrategy`; satır dönüşümü `CSS.Translate`, çünkü alt bilgisi olan satır daha uzun ve ölçekleme onu ezerdi. Sıralama ve "Bir daha asla" tek sıralanabilir liste; vurgu çizgisi de listenin sürüklenemeyen bir öğesi (`ASLA_SINIRI`). Bırakınca çizginin üstü `asla = false`, altı `asla = true` oluyor ve iki taraf `sira`'yı kendi içinde 0'dan numaralıyor. Kayıt ekleme (tek ve toplu) yalnızca sıralamayı hedefliyor.
- **Fotoğrafsız kayıt** — Yedek görsel her kayıtta aynı: sade zemin (`--surface-2`) üstünde soluk baş harfler (`brandInitials`, `types/item.ts`; Türkçe büyük harfle: "ıhlamur" → "I", "ilik" → "İ"). Kayıt başına renk bilerek yok; özellikle kart görünümünde fotoğraflı kartların arasında gürültü yapıyordu. Renk fotoğrafa kalıyor.
- **Liste özetleri** — Ana ekranın sayıları ve ilk üçü (podyumun fotoğrafları dâhil) tek bir RPC'den geliyor (`si_liste_ozetleri`, `supabase/007_liste_ozetleri.sql`): liste başına bir satır, sayım veritabanında. Önceden istemci bütün kayıtları çekip sayıyordu ve PostgREST'in 1000 satır sınırında sayılar sessizce yanlışlaşıyordu. Fonksiyon `security invoker`, yani RLS geçerli. İlk üçün seçimi `lib/sort.ts` ile aynı kural: denenmiş, `asla` değil, `sira` artan, eşitlikte en yeni önce. RPC hata verirse indeks yine açılıyor, sayılar sıfır görünüyor ve konsola uyarı düşüyor.
- **Giriş destesi** — `AuthGate` içindeki `GirisDestesi` her adımda kartların `data-yuva` değerini kaydırıyor (`1`, `2`, `3`, `cikis`, `bekle`); konumları CSS çiziyor. Tüm kartlar aynı boyda ve aynı noktada, arkadakiler ölçekle küçülüyor — geçiş yalnızca transform, opaklık ve renk. Kartın içindeki renkler `currentColor`dan türüyor, böylece kart öne geçip beyaz metne döndüğünde içerik de onunla birlikte geçiyor. Fotoğraflar gerçek görsel değil, renkli kutucuklar (`--f`).
- **Hesap bloğu** — Google profil fotoğrafı (`avatar_url` / `picture`) ve ad; e-posta gösterilmiyor. Fotoğraf `referrerPolicy="no-referrer"` ile yükleniyor (Google aksi hâlde 403 verebiliyor), yüklenemezse baş harfe dönüyor. Blok tek bileşen (`Hesap`), yeri ekrana göre değişiyor. Masaüstü sıralama ekranında `AuthGate` onu sayfanın kardeşi olarak rayın dibine cam bir kart olarak çiziyor. Ana ekranda sayfa kendisi üst çubuğun sağına hap olarak çiziyor (mobilde avatar + çıkış, masaüstünde ad da); `AuthGate`'in bloğu orada CSS ile gizli. Mobil sıralama ekranlarında hesap yok: altları ekleme düğmesiyle dolu.
- **Marka işareti ve sekme simgesi** — Azalan uzunlukta üç yuvarlak çizgi, en uzunu vurgu renginde: bir sıralamanın en sade hâli, en üstteki öne çıkıyor. Arayüzde `components/Marka.tsx` (renkler temadan), sekmede `src/app/icon.svg` (aynı çizim, sabit renkler). Ayar simgesi de aynı sözlükten (üç çizgi ve tutamakları).
- **Tarayıcı çubuğu** — `layout.tsx`'teki `viewport` dışa aktarımı `color-scheme: light dark` ve temaya göre iki `theme-color` veriyor: mobil tarayıcının çubuğu sayfa zeminiyle aynı renkte.

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
- **Tema düğmesi yok** — açık / koyu sistem ayarından geliyor. Elle seçim, ilk boyamada yanlış temanın bir an görünmemesi için `<head>`'e satır içi bir betik ve kalıcı bir tercih ister; kazancı küçük.
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
    layout.tsx                    kök düzen: yazı tipleri (next/font), viewport/tema rengi, AuthGate
    page.tsx                      liste indeksi (Listelerin)
    globals.css                   tüm stiller — Vitrin tasarım sistemi (açık/koyu tema tokenları)
    icon.svg                      sekme simgesi — azalan üç çizgi, en uzunu vurgu renginde
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
    Hesap.tsx                     hesap bloğu (avatar, ad, çıkış) — ray dibi ve ana ekran üst çubuğu
    Sahne.tsx                     küçük arayüz sahneleri — giriş özellikleri ve boş durumlar
    Sheet.tsx                     pencere kabuğu — yerel <dialog>, formlar ve liste ayarları
    Marka.tsx                     marka işareti ve ad — ana ekran, ray, giriş
    Iskelet.tsx                   yükleniyor taslakları — liste kartları ve sıralama satırları
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

`next build` yazı tiplerini (`next/font/google`) derleme anında Google Fonts'tan indirip uygulamaya gömüyor; ağ erişimi olmayan bir ortamda derleme bu adımda durur. Çalışan uygulama Google'a istek atmıyor.

## Teknolojiler

Next.js 16.3.7 · React 19.3 · TypeScript 6 · Supabase (Postgres + Auth + Storage) · dnd-kit · Geist ve Instrument Serif (`next/font`)
