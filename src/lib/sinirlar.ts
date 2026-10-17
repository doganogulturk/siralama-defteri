/**
 * Kötüye kullanıma ve farkında olmadan şişen veriye karşı sınırlar. Asıl koruma
 * veritabanında (`supabase/schema.sql`, `supabase/storage.sql`): anonim anahtar
 * tarayıcıda herkese açık, istemci kontrolü atlanabilir. Buradaki değerler
 * oradakilerin aynısı — arayüz sınıra çarpmadan önce söyleyebilsin diye.
 */
export const SINIR = {
  /** Liste başına kayıt — sıralama, "Bir daha asla" ve denenmemişler birlikte. */
  listeKayit: 200,
  kullaniciListe: 50,
  listeKategori: 50,

  kayitAdi: 120,
  altAd: 120,
  not: 2000,
  listeAdi: 80,
  kategoriAdi: 60,
  /** Ek alanın etiketi ("Ekşi mi?"); tanımların tamamı `lists.alanlar`'da 8000 baytla sınırlı. */
  alanAdi: 40,
  /** Ek metin alanının tek değeri ("Satılan market" gibi). */
  alanDegeri: 200,
} as const;

/** Fotoğraflar yüklenmeden önce bu ölçüye küçültülüyor; kova daha büyüğünü reddediyor. */
export const FOTO = {
  /** Uzun kenar, piksel. En büyük gösterim masaüstü detay paneli (~460 px, 2x ekran). */
  kenar: 1000,
  /** Kovanın kabul ettiği en büyük dosya (`storage.sql` → file_size_limit). */
  enFazlaBayt: 300 * 1024,
} as const;
