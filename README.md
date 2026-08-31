# Sıralama Defteri

Kişisel sıralama uygulaması: denediğin şeyleri kendi listelerinde sürükleyerek sırala, kendi kategorilerini kur, henüz denemediklerini bekleme listesinde tut.

Proje "Ayran Gurmesi" olarak başladı; ayran kısıtı kaldırılıp **çok listeli, kullanıcı bazlı** bir yapıya çevrildi. Ayran artık yalnızca listelerden biri (`/l/ayran`). Depo, Vercel projesi ve `package.json` adı `siralama-defteri`; ayrandan kalan tek ad fotoğraf kovası (bkz. yol haritası 3).

---

## Durum

Uygulama çalışır ve **canlıda**: giriş, çok listeli sıralama, kategori ve alan yönetimi, Baskı arayüzü.

**Dağıtım** — Vercel, `main` dalından otomatik: <https://siralama-defteri.vercel.app>. Push üretimi günceller. Vercel'de `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` tanımlı olmalı; Supabase'in Redirect URLs listesinde üretim alan adı da bulunmalı, yoksa build geçer ama Google girişi canlıda **sessizce** başarısız olur — giriş `redirectTo` olarak `window.location.origin` kullandığı için tek kapı o liste.

Eski `ayran-gurmesi.vercel.app` hâlâ aynı deployment'a bağlı ve çalışıyor. Bilinçli: kayıtlı bağlantılar ve telefon kısayolu bir süre yaşasın diye. Temizlenecek iki artık var — Supabase Site URL'i hâlâ eski adresi gösteriyor, ve eski adres hem Vercel Domains'te hem Redirect URLs'te duruyor. İkisi de acele değil, ama Site URL çevrilmeden eski adres silinmemeli.

> Proje adı değişince Vercel yeni kısa adresi kendiliğinden **oluşturmuyor**. Yeniden adlandırma yalnızca üretilen adresleri (hesap kapsamlı ve dal adresleri) çeviriyor; kısa `<proje>.vercel.app` proje kurulurken iliştirildiği için yerinde kalıyor. Yenisi Settings → Domains'ten elle eklendi. Beklemek düzeltmiyor.

**Veri** — `si_lists` / `si_categories` / `si_items` şeması RLS ile kurulu. Eski `ay_ayranlar` tablosundaki 42 kayıt "Ayran" listesine taşındı (38 sıralı + 4 bekleyen); taşıma doğrulandıktan sonra eski tablo düşürüldü. Şemada artık yalnızca üç tablo var.

**Kimlik** — Google girişi Supabase Auth üzerinden; tüm sayfalar `AuthGate` arkasında, asıl koruma RLS'te.

**Arayüz** — Üç ekran: `/` liste indeksi, `/l/[slug]` sıralama, `/l/[slug]/ayarlar` yönetim. Bekleyenler ayrı bir route değil, sıralama ekranının ikinci sekmesi ("Denenmemiş"); iki sekmenin kayıtları da aynı sağ panelde açılıyor. Sekme bir süre "Sırada" adını taşıdı: "Sıralamam" ile aynı kökten, birbirine karışıyordu ve kelimenin kendisinde "henüz denenmedi" yoktu — uygulamanın zaten kullandığı `denedi` sözlüğüne çekildi. Masaüstünde sıralama ve ayarlar aynı sol rayı paylaşıyor: ray satırları sıralanmış kayıt sayısı + liste adı + ayar simgesi taşıyor, listeler de o sayıya göre sıralı. Rakam bekleyenleri saymadığı için bir kayıt "Denedim" ile sıralamaya geçtiğinde artıyor — ölçü "kaç kayıt var" değil, "kaç şeyi sıraladım". Ray sayıları sayfadan ayrı bir sorgudan geldiği için `useListeler`'de küçük bir haber kanalı var: sayfa bir mutasyondan sonra `listeleriTazele()` çağırıyor, yoksa ray sayfa yenilenene kadar eski sayıyı gösteriyordu. Kodda ayrana özel hiçbir alan adı geçmiyor: kategoriler veritabanından, ek alanlar `si_lists.alanlar` tanımından üretiliyor. Hem listeler hem kategoriler kayıt sayısına göre sıralı — elle sıralama diye bir iş yok.

Masaüstünde formların hepsi ortalanmış kutu. Kayıt formu bir süre sağ kenardan açıldı — "şunun altına ekle" seçerken arkadaki sıralama görünsün diye — ama yanında ortalanan başka formlar durunca iki davranış tutarsız kaldı; tek dil seçildi. Yükseklik içeriğe göre, taşarsa gövde kendi içinde kayıyor.

**Toplu ekleme** — Kayıt formunun ikinci sekmesi ("Toplu"). Alt alta yazılan her satır bir kayıt; sonu iki nokta ile biten satır (`Patates:`) listenin içinde bir kategori açar, altındaki satırlar oraya yazılır. İlk virgülden sonrası kaydın "Çeşit / Alt ad" değeri olur (`Doritos, Nacho`) — sonraki virgüller alt adın içinde kalır. Virgül önce kayıtları ayırıyordu; asıl işe yarayan ayrım bu çıktı, çünkü toplu girilen listeler genelde tek markanın çeşitleri oluyor. Karşılığında bir satıra birden çok kayıt yazılamıyor. Ayrıştırma `lib/toplu.ts`'te; form kaydetmeden önce sonucu önizleme olarak gösteriyor — virgül ya da iki nokta kayıt adının içinde geçtiğinde bölünme yanlış olur, kullanıcı bunu kaydetmeden görmeli. Sekme formun kipini miras alıyor: sıralamadayken kayıtlar yazıldıkları sırayla sıralamanın altına, "Denenmemiş" sekmesindeyken bekleyenlere düşüyor. Aynı kutu Yeni Liste formunda da var (kapalı doğar): listeyi ve kategorilerini tek hamlede kurmak için. Tekrar kontrolü bilerek yok.

**Tasarım** — Baskı yönü uygulandı, sonra bir sadeleştirme turundan geçti. Liste vurgu rengi `si_lists.renk`'ten gelip `--accent` olarak uygulanıyor. Turda değişenler:

- **Kural çizgileri inceldi** — kalınlıklar `3/2/1px`'ten `2/1/1px`'e indi; hiyerarşi kalınlıktan çok değerle kuruluyor (mürekkep çizgi mi, soluk çizgi mi). Tekrar eden çizgiler kaldırıldı.
- **Yazı ağırlıkları indi** — `700` → `600`, gövde metni sayılan yerler `500`.
- **Dolu yüzeyler seyreltildi** — düğme ve seçili kutular saf mürekkep değil `--fill` (`rgba(19,18,16,.82)`). Tek yerden ayarlanır.
- **Versal daraldı** — büyük harf yalnızca küçük aralıklı etiketlerde ve sabit başlıklarda. Kullanıcının yazdığı adlar (liste, kayıt, kategori) ve düğme metinleri normal yazımda; harf aralığı ve punto buna göre yeniden ayarlandı.
- **Dikey ritim açıldı** — satır, bölüm ve sütun boşlukları ~%20-25 arttı.

Sonraki turda sol ray ve sekmeler ele alındı:

- **Sekmelerden dolu bant kalktı** — seçili sekme mürekkep bloğu yerine altındaki kuralın vurgu rengine dönmesiyle işaretleniyor; iki dolu blok yan yana fazla baskındı. Aynı şerit kayıt formunun sekmelerinde de kullanılıyor.
- **Ray satırı üç bölgeye ayrıldı** — sayı bloğu, liste adı, ayar hücresi. Sayı bloğunun zemini listenin kendi vurgu rengi (`si_lists.renk`, satıra `--satir` olarak veriliyor); ray böylece renkle taranabilir bir indeks oluyor ve renk artık yalnızca o listenin sayfasında değil, indekste de görünüyor. Ayar hücresi nötr `--tint` zeminde, üstüne gelinince satırın rengine dönüyor. Aradaki ad büyüyüp satırın asıl öğesi oldu. Hücreyi ayıran dikey çizgi denendi, kaldırıldı: zemin farkı ayırmaya zaten yetiyor, çizgi fazlaydı.
- **Sağ panel kaydın tamamını gösteriyor** — not da panele girdi (satır sonları korunuyor). Amaç, bir şeyi okumak için Düzenle'ye basmak zorunda kalmamak; düğme yalnızca değiştirmek için. Sırası olmayan kayıt künye şeridinde rakam yerine "Denenmemiş" yazıyor, Evet/Hayır rozetleri de metin alanları gibi kategori kapsamına uyuyor.
- **Kayıt formunun tepesi bir kimlik bandı oldu** — fotoğraf kutusu solda, ad ve çeşit sağında alt alta. Üstteki üç öğe yan yana durunca form ~170px kısaldı ve "listeye ekleneceği yer" seçimi 900px yükseklikte kaydırmadan görünüyor; fotoğraf kutusu artık sabit yükseklik değil, yanındaki iki alan kadar. Yer kalmadığı için kutunun "sürükle bırak veya tıkla" alt satırı düştü — sürükleme çalışmaya devam ediyor.
- **Ayar simgesi sürgüye döndü** — ışınlı daire 15 pikselde güneşe benziyordu; yerine üç kural çizgisi ve tutamakları geldi, sekme simgesiyle aynı sözlük.

**Sekme simgesi** — `src/app/icon.svg`: mürekkep zeminde azalan uzunlukta üç kural çizgisi. Baskı yönü hiyerarşiyi zaten kural çizgileriyle kurduğu için simge aynı sözlükten; harf yok, 16 pikselde monogram okunmuyor. Vurgu rengi bilerek kullanılmadı — `--accent` liste başına değişiyor, simge sabit olmalı. Koyu sekme şeridinde mürekkep zemin şeride karışıp geriye üç kağıt rengi çizgi kalıyor; okunurluk korunduğu için kabul edildi.

---

## Yol haritası

Öncelik sırasıyla; maddeler birbirinden bağımsız. Üçü de "ne zaman yapılacağı belli değil" kategorisinde — uygulama bunlarsız da tam çalışıyor.

| # | İş | Neden / not |
|---|---|---|
| 1 | **Ek alan filtresine yeni bir yer bul** *(ayrıntılandırılacak)* | Evet/Hayır alanlarına göre filtreleme (ör. "yalnızca ekşi olanlar") arayüzden çıkarıldı: şeridi kalabalıklaştırıyordu. Ayrımın kendisi işe yarıyor, kaybolmaması gerek — ikincil bir kontrol ya da açılır menü. Mantık `lib/filtre.ts`'te duruyor, `FilterPanel`'in `stack` düzeni de hâlâ çiziyor; eksik olan yalnızca ona giden bir kapı. |
| 2 | **İkili karşılaştırma ekranı** *(gerekli mi, karar verilmedi)* | "Hangisi daha iyi?" akışı — 42 kayıtta telefonda sürükleyerek sıralamak zahmetli. Tasarım kararının parçasıydı. Yeni bir sıralama algoritması demek; maliyeti yüksek, ihtiyaç netleşmeden başlanmayacak. |
| 3 | **Fotoğraf kovasını yeniden adlandır** *(ayrıntılandırılacak)* | Kova hâlâ `ayran`; ayrandan kalan son ad, ama kullanıcıya görünmüyor. `lib/items.ts` içindeki `KOVA` sabiti tek değişiklik noktası, silme işlevi kova adını URL'den kendi çözüyor. **Dikkat:** Supabase kovaları yeniden adlandırılamıyor; yeni kova açmak mevcut `fotograf_url` değerlerini kırar. Göründüğü kadar ucuz değil. |

### Kapananlar

Yol haritasından çıkanlar, kaydı kalsın diye:

- **Kategori sırasını sürüklenebilir yap** — yapılmadı, gereksiz kılındı: kategoriler listeler gibi kayıt sayısına göre sıralanıyor. Ayarlardaki göstermelik tutamak kaldırıldı.
- **Depo ve Vercel projesi adını değiştir** — `siralama-defteri`. GitHub, Vercel, `git remote`, `package.json`, yeni alan adı ve Redirect URLs tamam.
- **`ay_ayranlar` tablosunu DROP et** — `005_eski_tablo_dusur.sql` doğrulanıp çalıştırıldı.
- **Apple girişi** — ücret gerektirdiği için kabul edilmiş sınırlara taşındı.
- **Liste simgesi (emoji)** — iki tur denendi, tamamen kaldırıldı. Aşağıda.

### Kabul edilmiş sınırlar

Bunlar iş değil, bilinçli kararlar:

- **Apple girişi yok** — Supabase'de hazır provider ama Apple Developer hesabı ($99/yıl) gerektiriyor; ücret ödenmeyecek. Google girişi tek yol.
- **Liste simgesi yok** — emoji seçimi denendi (elle yazma, sonra küratörlü ızgara) ve kaldırıldı: kayıtların çoğunda zaten fotoğraf var, listenin ayrıca simge taşımasına gerek yok. `si_lists.emoji` kolonu şemada duruyor ama kod ne yazıyor ne okuyor. Ayarlardaki kimlik kutusu listenin monogramını gösteriyor.
- **Kategori sırası elle ayarlanmaz** — kategoriler de listeler gibi kayıt sayısına göre sıralanıyor (eşitlikte `sira`, sonra `created_at`). `si_categories.sira` sütunu şemada duruyor ama yalnızca eşitlik bozucu.
- **Alan tipini değiştirmek veriyi dönüştürmez** — Evet/Hayır'dan Metin'e çevrilen alanın eski `true/false` değerleri kayıtta kalır ama okunmaz olur. Nadir işlem; dönüştürme yazmaya değmedi.
- **Kategori silmek kayıtları silmez** — `on delete set null` ile kayıtlar kategorisiz kalır.
- **`si_items.sira` benzersiz değil** — sürükle-bırak satırları tek tek UPDATE ettiği için ara durumlarda geçici çakışma olur.
- **`si_lists.sira` arayüzde kullanılmıyor** — yukarıdaki kategori kuralının aynısı listeler için de geçerli.
- **Bekleyenlerin kendi URL'i yok** — "Denenmemiş" bir sekme; donanım geri tuşu sekmeler arasında gezmiyor, listeden çıkıyor.
- **Filtre şeridi yalnızca kategori taşıyor** — "Tümü" + kategoriler. Ek alanların Evet/Hayır seçenekleri sıralamanın hemen üstünü kalabalıklaştırdığı için çıkarıldı. Ayrım tamamen kaybolmadı: sağ paneldeki kapsam sekmelerinde duruyor — ama orası yalnızca podyumu ve son eklenenleri daraltıyor, listeyi değil. Geri getirmek yol haritasında 1. sırada.
- **Liste adı değişince slug değişmez** — kayıtlı bağlantılar kırılmasın diye.
- **Sunucu tarafı koruma yok** — uygulama tamamen istemci tarafında; `AuthGate` bir kapı, güvenlik RLS'te.

---

## Tasarım

**Seçilen yön: BASKI** — editoryal/tipografi öncelikli. Kağıt beyazı zemin, neredeyse siyah mürekkep, liste başına tek vurgu rengi. Keskin köşeler, gölge yok, derinlik yerine kural çizgileri. Archivo + Archivo Black.

Neden bu: uygulama markette, gündüz, telefon parlarken kullanılıyor — açık zemin orada en okunaklısı; fotoğraflar açık zemine oturuyor; sıralama zaten bir isim-numara listesi, tipografi öncelikli düzen tam olarak onu servis ediyor; ve mevcut kod zaten kağıt/mürekkep paletinde, geçiş en ucuz olan bu.

Diğer yönlerden alınmasına karar verilenler:
- **Liste başına vurgu rengi** (Sıvı yönünden) — gradyan değil düz renk. Uygulandı: `si_lists.renk`.
- **İkili karşılaştırma** (Deste yönünden) — sürükleyerek sıralamaya alternatif "hangisi daha iyi?" akışı. Henüz yapılmadı; yol haritasında 2. sırada ve gerçekten gerekli mi, karar verilmedi.

**Tasarım kanvasları** (claude.ai bağlantıları, kalıcı):

| Kanvas | İçerik |
|---|---|
| [Üç yön keşfi](https://claude.ai/code/artifact/786eff11-e279-4727-b00b-22f066196047) | Sıvı · Baskı · Deste — her biri mobil + masaüstü. Karar bu kanvastan çıktı. |
| [Baskı · Ekranlar](https://claude.ai/code/artifact/8967975d-e92b-46f0-88bb-b75d81f01dd6) | Kayıt ekleme, denemediklerim, liste ayarları, giriş, masaüstü düzenleri ve **stil sayfası**. |
| [Liste ayarları yönleri](https://claude.ai/code/artifact/ced7ae20-2b3a-4324-a972-822a6d08b185) | Ayarlar ekranı için erken üç seçenek. Baskı kararından önce yapıldı, arşiv değeri var. |

Uygulanacak değerler (tip ölçeği, renkler, kural kalınlıkları, kontrol anatomisi, beş kural) **Baskı · Ekranlar** kanvasının en altındaki stil sayfasında.

> Kanvas ile `globals.css` artık birebir aynı değil. Kanvastaki değerler uygulandıktan sonra bir sadeleştirme turu geçti (yukarıdaki **Durum → Tasarım** maddesi). Uyuşmazlıkta doğru kaynak koddur; kanvas kararın kaydı.

> Kanvasların kaynak dosyaları geçici çalışma klasöründeydi ve oturumla birlikte silinir. Kanvasları düzenlemek gerekirse içerik bağlantıdan geri okunabilir.

---

## Veri modeli

Üç tablo — sıralama sayısı ne olursa olsun tablo sayısı sabit. Her sıralama `si_lists` içinde **bir satır**.

```
si_lists       id, user_id, ad, slug, emoji, renk, sira, alanlar(jsonb), created_at
               └ emoji ve sira kullanılmıyor (bkz. kabul edilmiş sınırlar)
si_categories  id, list_id, ad, renk, sira, created_at
si_items       id, list_id, category_id, ad, alt_ad, fotograf_url,
               sira, denendi, notlar, ozellikler(jsonb), created_at
```

Kritik ayrıntılar:

- **`si_lists.alanlar`** — listeye özel ek alan tanımları. Biçim:
  `[{anahtar, tip: 'bool'|'metin', etiket, kisa?, ipucu?, filtre?, kategori_id?}]`
  Ayrandaki "Ekşi mi / Satılan Market / Yöre" alanları burada tanımlı. Kodda hiçbir yerde ayrana özel alan adı geçmiyor; filtre şeridi, form ve detay paneli bu tanımdan üretiliyor.
- **`si_items.ozellikler`** — yukarıdaki alanların değerleri (`{"eksi": true, "yore": "İzmir"}`).
- **`category_id` nullable, `on delete set null`** — kategori silinince kayıtlar silinmez, kategorisiz kalır.
- **`sira` benzersiz değil** — sürükle-bırak satırları tek tek UPDATE ettiği için ara durumlarda geçici çakışma olur.
- **RLS** — üç tabloda da açık; `si_lists` doğrudan `user_id` ile, diğer ikisi liste üzerinden.

### Migration dosyaları

`supabase/` altında, çalıştırıldıkları sırayla. **Beşi de uygulanmış durumda.**

| Dosya | Ne yapar |
|---|---|
| `001_sema.sql` | Üç tabloyu ve RLS politikalarını kurar |
| `002_veri_tasima.sql` | `ay_ayranlar` → `si_*` tek seferlik taşıma (Google girişi yapılmış olmalı) |
| `003_liste_alanlari.sql` | `alanlar` kolonunu ekler, ayran listesinin alanlarını tanımlar |
| `004_liste_rengi.sql` | `renk` kolonunu ekler (liste vurgu rengi) |
| `005_eski_tablo_dusur.sql` | `ay_ayranlar`'ı düşürür — sayım doğrulandıktan sonra çalıştırıldı |

Taşımada atlanan tek kolon: `ay_ayranlar.sira_eksi` — kodda hiç kullanılmıyordu. Tablo artık yok, kayıt olarak duruyor.

---

## Kimlik doğrulama

Google girişi, Supabase Auth üzerinden. Uygulama tamamen istemci tarafında çalıştığı için `@supabase/ssr` ve proxy (Next 16'da `middleware` bu ada taşındı) kullanılmıyor: oturum tarayıcıda tutuluyor, asıl koruma RLS'te.

Kurulum notları:
- Google Cloud'da OAuth client → Authorized redirect URI: `https://<proje-ref>.supabase.co/auth/v1/callback`
- Authorized domain olarak `supabase.co` kabul edilmiyor, **proje kodlu tam hâli** girilmeli
- Supabase → Authentication → URL Configuration → Redirect URLs'e hem `http://localhost:3000/**` hem üretim adresi eklenmiş olmalı
- Site URL örtük olarak izinli yönlendirme sayılıyor: Redirect URLs'te olmayan bir adres yalnızca Site URL olduğu için çalışıyor olabilir — alan adı değiştirirken bu sıralamayı bozmamak gerek
- Apple girişi yok ve planlanmıyor — Apple Developer hesabı ($99/yıl) gerektiriyor

---

## Proje yapısı

```
src/
  app/
    layout.tsx                    kök düzen, AuthGate sarmalayıcısı
    page.tsx                      liste indeksi (Listelerim)
    globals.css                   tüm stiller — Baskı tasarım sistemi
    icon.svg                      sekme simgesi — azalan üç kural çizgisi
    l/[slug]/
      page.tsx                    sıralama ekranı — "Sıralamam" ve "Denenmemiş" sekmeleri
      ayarlar/page.tsx            liste, kategori ve alan yönetimi
  components/
    AuthGate.tsx                  giriş kapısı + hesap bloğu (kimlik + çıkış)
    ItemRow.tsx                   sıralama satırı (statik + sürüklenebilir)
    ItemForm.tsx                  kayıt ekleme/düzenleme formu
    ListeRayi.tsx                 masaüstü sol ray (künye + liste indeksi + ayar dişlisi)
    ListeEkleModal.tsx            yeni liste formu (ana ekran ve raydan açılır)
    FilterPanel.tsx               veri güdümlü filtre şeridi (sekme görünümlü)
    DetailPane.tsx                masaüstü detay paneli — iki sekmenin kayıtlarını da açar
    WishlistPanel.tsx             "Denenmemiş" sekmesinin satırları
  hooks/
    useAuth.ts                    oturum durumu
    useListStore.ts               bir listenin tüm verisi (liste + kategoriler + öğeler)
    useListeler.ts                liste indeksi + kayıt sayıları, sayıya göre sıralı
    useIsDesktop.ts
  lib/
    supabase.ts                   istemci (PKCE, oturum kalıcılığı)
    auth.ts                       signInWithGoogle / signOut
    items.ts                      si_* CRUD + fotoğraf
    filtre.ts                     filtre durumu, uygulama ve sayımlar
    sort.ts                       sıralama mantığı
    slug.ts                       Türkçe slug üretimi
    hata.ts                       Supabase hata nesnelerini okunur metne çevirir
  types/item.ts                   Item, Kategori, Liste, AlanTanimi + yardımcılar
supabase/                         migration dosyaları
```

`public/` yok: `create-next-app`'ten kalan beş SVG ve `page.module.css` hiçbir yerden referans almadığı için silindi. Sekme simgesi `app/icon.svg` konvansiyonuyla geliyor, `favicon.ico` kaldırıldı.

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
