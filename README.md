# Sıralama Defteri

Kişisel sıralama uygulaması: denediğin şeyleri kendi listelerinde sürükleyerek sırala, kendi kategorilerini kur, henüz denemediklerini ayrı bir sekmede tut. Çok listeli ve kullanıcı bazlı; her liste kendi kategorilerini, ek alanlarını ve vurgu rengini taşıyor.

---

## Durum

Uygulama çalışır ve **canlıda**: giriş, çok listeli sıralama, kategori ve alan yönetimi, toplu kayıt ekleme, Koleksiyon arayüzü.

**Dağıtım** — Vercel, `main` dalından otomatik: <https://siralama-defteri.vercel.app>. Push üretimi günceller. Vercel'de `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` tanımlı olmalı; Supabase'in Redirect URLs listesinde üretim alan adı da bulunmalı, yoksa build geçer ama Google girişi canlıda **sessizce** başarısız olur — giriş `redirectTo` olarak `window.location.origin` kullandığı için tek kapı o liste.

**Veri** — `si_lists` / `si_categories` / `si_items` şeması RLS ile kurulu. Şemada yalnızca bu üç tablo var.

**Kimlik** — Google girişi Supabase Auth üzerinden; tüm sayfalar `AuthGate` arkasında, asıl koruma RLS'te.

**Arayüz** — Üç ekran: `/` liste indeksi, `/l/[slug]` sıralama, `/l/[slug]/ayarlar` yönetim. Bekleyenler ayrı bir route değil, sıralama ekranının ikinci sekmesi ("Denenmemiş"); iki sekmenin kayıtları da masaüstünde aynı sağ panelde açılıyor. Masaüstünde sıralama ve ayarlar aynı sol rayı paylaşıyor: ray satırları sıralanmış kayıt sayısı + liste adı + ayar simgesi taşıyor.

Listeler ve kategoriler kayıt sayısına göre sıralı — elle sıralama diye bir iş yok. Listelerde ölçü "kaç şeyi sıraladım": bekleyenler sayılmıyor, bir kayıt "Denedim" ile sıralamaya geçtiğinde rakam artıyor. Ray ve indeks sayıları sayfadan ayrı bir sorgudan geldiği için `useListeler`'de küçük bir haber kanalı var: sayfa bir mutasyondan sonra `listeleriTazele()` çağırıyor.

Kodda listeye özel hiçbir alan adı geçmiyor: kategoriler veritabanından, ek alanlar `si_lists.alanlar` tanımından üretiliyor.

Masaüstündeki sağ panel kaydın tamamını gösteriyor (not dahil, satır sonları korunuyor); Düzenle düğmesi yalnızca değiştirmek için. Sırası olmayan kayıtta sıra rozeti yerine "Denenmemiş" yazıyor.

**Toplu ekleme** — Kayıt formunun ikinci sekmesi ("Toplu"). Alt alta yazılan her satır bir kayıt; sonu iki nokta ile biten satır (`Patates:`) listenin içinde bir kategori açar, altındaki satırlar oraya yazılır. Satır içi biçim de geçerli: `Cips: Doritos` satırında iki noktadan önceki kısım kategori, sonrası kayıt. İlk virgülden sonrası kaydın "Çeşit / Alt ad" değeri olur (`Doritos, Nacho`); sonraki virgüller alt adın içinde kalır, bu yüzden bir satıra birden çok kayıt yazılamıyor. Ayrıştırma `lib/toplu.ts`'te; form kaydetmeden önce sonucu önizleme olarak gösteriyor — virgül ya da iki nokta kayıt adının içinde geçtiğinde bölünme yanlış olur, kullanıcı bunu kaydetmeden görmeli. Sekme formun kipini miras alıyor: sıralamadayken kayıtlar yazıldıkları sırayla sıralamanın altına, "Denenmemiş" sekmesindeyken bekleyenlere düşüyor. Aynı kutu Yeni Liste formunda da var (kapalı doğar): listeyi ve kategorilerini tek hamlede kurmak için. Tekrar kontrolü bilerek yok.

---

## Tasarım — Koleksiyon

Sıralamayı bir koleksiyon gibi sunan, sıcak ve dokunsal bir arayüz: krem zemin, yumuşak gölgeli kart yüzeyler, liste rengiyle boyanan alanlar, hap biçimli eylemler. Tüm stiller `src/app/globals.css`'te; sınıf adları bileşenlerle birebir.

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
| `--accent` | `si_lists.renk` | listenin vurgu rengi |
| `--r-lg` / `--r-md` / `--r-sm` | `24px` / `18px` / `12px` | köşe yarıçapları |
| `--shadow` / `--shadow-lift` | yumuşak iki katman | kart / yüzen öğe gölgesi |

**Yazı** — Bricolage Grotesque (Google Fonts, `400–800`), tek aile. Başlıklar ve sayılar `800`, sıkı harf aralığıyla; gövde `400–600`. Versal kullanılmıyor: kullanıcının yazdığı adlar ve düğme metinleri olduğu gibi duruyor.

**Vurgu tonları** — `--accent-soft` (%15), `--accent-wash` (%8) ve `--accent-deep` (koyulaştırılmış) `color-mix` ile vurgudan türüyor. Bunlar hem `:root` hem `.app` üzerinde tanımlı: özel özellikler tanımlandıkları öğede çözüldüğü için yalnızca `:root`'ta olsalar `.app`'in ezdiği liste rengini değil hep varsayılanı yansıtırlardı.

### Kurallar

- **Yüzey kartla, derinlik gölgeyle kuruluyor** — çizgi ayraç yok denecek kadar az; bölümler kart, satırlar kart.
- **Renk listeden geliyor** — zirve kartı, sıra rozeti ve "Denedim" düğmesi `--accent`; ana ekrandaki liste kartları kendi renklerinin açık tonunda (`--satir`).
- **Seçili durum mürekkep halka** — `0 0 0 2.5px var(--ink)`; vurgu renginde halka, vurgu renkli kartın üstünde kaybolurdu.
- **Eylemler hap** — birincil düğme mürekkep, ikincil kart zemini + ince çerçeve, tehlikeli işlem vurgunun açık tonu.
- **Seçenek grupları segment kontrolü** — sekmeler, Evet/Hayır, sıraya ekleme yeri: `--tint` zeminde, seçili parça kart gibi yükseliyor.
- **Hareket az ve anlamlı** — giriş destesinin dönüşü, formun alttan kayması; `prefers-reduced-motion` bunları kapatıyor (deste durağan kalıyor).

### Ekranlar

- **Giriş** — Yelpaze biçiminde örnek sıralama kartları, büyük başlık, hap biçimli Google düğmesi. Deste altı örnek listeden (her biri başka bir şey: uygulamanın tek bir şeye bağlı olmadığını söylüyor) 2,8 saniyede bir dönüyor: öndeki kart sola yukarı savrulup kayboluyor, kanatlar birer sıra öne geçiyor, arkadan yenisi giriyor. Masaüstünde deste solda, metin sağda.
- **Listelerin** — Selamlama ve toplam sayılar; her liste kendi renk tonunda, aynı boyda bir kart. Sıralanan kayıt sayısı kartın üstünden altına uzanan silik bir rakam; ad ve denenmemiş sayısı onun üstünde. "x denenmemiş" yalnızca bekleyen kayıt varsa yazıyor. Mobilde iki sütun, masaüstünde dört sütun.
- **Sıralama** — Yuvarlak geri ve ayar düğmeleri, ortada liste adı; segment sekmeler, hap filtre şeridi. Filtresiz görünümde ilk üç kayıt fotoğraflı **podyum**: 1. tam genişlikte vurgu renginde, 2 ve 3 yan yana. Kalan kayıtlar kompakt kart; sıra numarası sağda, soluk ve iri. Filtreli görünümde podyum yok, hepsi kompakt. Ekleme düğmesi yüzen hap.
- **Masaüstü** — Üç sütun: krem ray (seçili liste beyaz kart, ayar simgesi üstüne gelince beliriyor), orta sütunda liste adı başlık olarak + sıralama, sağda detay kartı.
- **Formlar** — Mobilde alttan açılan panel (tutamaklı), masaüstünde ortalanmış yuvarlak kutu. Kaydet çubuğu gövdenin dibine yapışık. Kimlik bandı: fotoğraf kutusu solda, ad ve çeşit sağında.
- **Ayarlar** — Her bölüm ayrı kart. Masaüstünde solda kimlik / renk / silme, sağda kategoriler ve ek alanlar; mobilde tek akış, silme en sonda.

### Uygulama ayrıntıları

- **Podyum yalnızca CSS** — `.rows.has-zirve` bir ızgara; satırlar listeden çıkarılmıyor ki sürüklenebilir kalsınlar. Sıralanabilir bağlam `rectSortingStrategy` kullanıyor (2 ve 3 yan yana), satır dönüşümü `CSS.Translate` — ölçekleme farklı boydaki kartları eziyordu.
- **Fotoğrafsız kayıt** — Satır yedek görseline marka rengi `background` olarak değil `--marka` değişkeniyle veriliyor; böylece CSS podyumda ve detay panelinde onu listenin tonuna çevirebiliyor. Kompakt satırlarda marka rengi kalıyor.
- **Liste kartındaki rakam** — Kart sabit boylu bir boyut kabı (`container-type: size`); rakamın puntosu kart yüksekliğine göre (`cqh`) veriliyor. Üç ve dört haneli sayılar taşmasın diye `data-hane` ile küçülüyor.
- **Giriş destesi** — `AuthGate` içindeki `GirisDestesi` her adımda kartların `data-yuva` değerini kaydırıyor (`1`, `2`, `3`, `cikis`, `bekle`); konumları CSS çiziyor. Tüm kartlar aynı boyda ve aynı noktada, arkadakiler ölçekle küçülüyor — geçiş yalnızca transform, opaklık ve renk.
- **Hesap bloğu** — Google profil fotoğrafı (`avatar_url` / `picture`) ve ad; e-posta gösterilmiyor. Fotoğraf `referrerPolicy="no-referrer"` ile yükleniyor (Google aksi hâlde 403 verebiliyor), yüklenemezse baş harfe dönüyor. `AuthGate` bloğu sayfanın kardeşi olarak çiziyor; her ekranda sol altta. Masaüstünde sıralama ve ayarlarda rayın dibinde, ana ekranda aynı yerde kart olarak. Mobilde yalnızca ana ekranda (avatar + çıkış): sıralama ekranlarının altı ekleme düğmesiyle dolu.
- **Sekme simgesi** — `src/app/icon.svg`: mürekkep zeminde azalan uzunlukta üç çizgi. Ayar simgesi de aynı sözlükten (üç çizgi ve tutamakları). Vurgu rengi bilerek kullanılmadı — `--accent` liste başına değişiyor, simge sabit olmalı.

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
- **Liste simgesi yok** — kayıtların çoğunda zaten fotoğraf var, listenin ayrıca simge taşımasına gerek yok. `si_lists.emoji` kolonu şemada duruyor ama kod ne yazıyor ne okuyor. Ayarlardaki kimlik kutusu listenin monogramını gösteriyor.
- **Kategori sırası elle ayarlanmaz** — kategoriler kayıt sayısına göre sıralanıyor (eşitlikte `sira`, sonra `created_at`). `si_categories.sira` yalnızca eşitlik bozucu.
- **`si_lists.sira` arayüzde kullanılmıyor** — listeler de sıralanmış kayıt sayısına göre diziliyor.
- **Alan tipini değiştirmek veriyi dönüştürmez** — Evet/Hayır'dan Metin'e çevrilen alanın eski `true/false` değerleri kayıtta kalır ama okunmaz olur.
- **Kategori silmek kayıtları silmez** — `on delete set null` ile kayıtlar kategorisiz kalır.
- **`si_items.sira` benzersiz değil** — sürükle-bırak satırları tek tek UPDATE ettiği için ara durumlarda geçici çakışma olur.
- **Bekleyenlerin kendi URL'i yok** — "Denenmemiş" bir sekme; donanım geri tuşu sekmeler arasında gezmiyor, listeden çıkıyor.
- **Filtre şeridi yalnızca kategori taşıyor** — "Tümü" + kategoriler. Ek alan ayrımı sağ paneldeki kapsam sekmelerinde duruyor, ama orası yalnızca podyumu ve son eklenenleri daraltıyor, listeyi değil.
- **Podyum yalnızca filtresiz görünümde** — sıralama da yalnızca orada değiştirilebiliyor; filtreli görünüm kompakt ve sürüklenemez.
- **Liste adı değişince slug değişmez** — kayıtlı bağlantılar kırılmasın diye.
- **Fotoğraf kovasının adı değişmeyecek** — `lib/items.ts` içindeki `KOVA` sabiti genel bir ad değil ama kullanıcıya görünmüyor. Supabase kovaları yeniden adlandırılamıyor; "adı değiştirmek" yeni kovaya kopyalamak ve tüm `fotograf_url` değerlerini güncellemek demek. Kazancı yalnızca kozmetik, riski fotoğraf kaybı. Silme işlevi kova adını URL'den okuduğu için ileride taşınırsa eski ve yeni kova bir süre yan yana çalışabilir.
- **Sunucu tarafı koruma yok** — uygulama tamamen istemci tarafında; `AuthGate` bir kapı, güvenlik RLS'te.

---

## Veri modeli

Üç tablo — liste sayısı ne olursa olsun tablo sayısı sabit. Her sıralama `si_lists` içinde **bir satır**.

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
  Örneğin bir içecek listesinde "Ekşi mi?" (Evet/Hayır) ya da "Satılan market" (Metin). Filtre şeridi, form ve detay paneli bu tanımdan üretiliyor.
- **`si_items.ozellikler`** — yukarıdaki alanların değerleri (`{"eksi": true, "market": "Migros"}`).
- **`category_id` nullable, `on delete set null`** — kategori silinince kayıtlar kategorisiz kalır.
- **RLS** — üç tabloda da açık; `si_lists` doğrudan `user_id` ile, diğer ikisi liste üzerinden.

### Migration dosyaları

`supabase/` altında, çalıştırıldıkları sırayla. **Hepsi uygulanmış durumda**; boş bir projede sırayla çalıştırılınca şemayı eksiksiz kurarlar. Numaralardaki boşluk (`002`) bilinçli: o numara tek seferlik bir veri işine aitti, şemaya katkısı yoktu.

| Dosya | Ne yapar |
|---|---|
| `001_sema.sql` | Üç tabloyu ve RLS politikalarını kurar |
| `003_liste_alanlari.sql` | `alanlar` kolonunu ekler |
| `004_liste_rengi.sql` | `renk` kolonunu ekler (liste vurgu rengi) |

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
      page.tsx                    sıralama ekranı — "Sıralamam" ve "Denenmemiş" sekmeleri
      ayarlar/layout.tsx          ayarlar sayfasının başlığı (metadata)
      ayarlar/page.tsx            liste, kategori ve alan yönetimi
  components/
    AuthGate.tsx                  giriş ekranı + hesap bloğu (kimlik + çıkış)
    ItemRow.tsx                   sıralama kartı (statik + sürüklenebilir)
    ItemForm.tsx                  kayıt ekleme/düzenleme formu (tek + toplu sekmeleri)
    TopluAlan.tsx                 toplu giriş kutusu ve ayrıştırma önizlemesi
    ListeRayi.tsx                 masaüstü sol ray (künye + liste indeksi + ayar simgesi)
    ListeEkleModal.tsx            yeni liste formu (ana ekran ve raydan açılır)
    FilterPanel.tsx               veri güdümlü filtre şeridi
    DetailPane.tsx                masaüstü detay paneli — iki sekmenin kayıtlarını da açar
    WishlistPanel.tsx             "Denenmemiş" sekmesinin kartları
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
