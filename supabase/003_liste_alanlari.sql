-- Listeye özel ek alanlar. Alanlar kodda sabit değil, veri olarak tutuluyor:
-- her liste kendi alanlarını ayarlar ekranından tanımlayabilsin diye.
--
-- Biçim: [{ anahtar, tip: 'bool'|'metin', etiket, kisa?, ipucu?,
--           filtre?: bool alanı filtre şeridinde göster,
--           kategori_id?: yalnızca bu kategori seçiliyken görünür }]
alter table si_lists add column alanlar jsonb not null default '[]';
