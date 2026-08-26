-- Liste başına vurgu rengi. Listenin başlığında, zirve bandında ve
-- eylem düğmelerinde kullanılıyor; arayüzde --accent değişkenine bağlanıyor.
alter table si_lists add column renk text not null default '#e03c10';

-- Ayran listesi vermilyonla kalıyor (varsayılan zaten o).
update si_lists set renk = '#e03c10' where slug = 'ayran';
