import Link from 'next/link';
import Marka from '../../../components/Marka';

/** Kod yanlış ya da sahibi paylaşımı kapatmış / bağlantıyı yenilemiş. */
export default function PaylasimYok() {
  return (
    <div className="paylasim">
      <header className="paylasim-bar">
        <Link href="/" className="paylasim-marka" aria-label="Sıralama Defteri ana sayfa">
          <Marka />
        </Link>
      </header>
      <main className="state-empty">
        <p className="state-empty-title">Bu liste artık paylaşılmıyor</p>
        <p>Bağlantı yanlış olabilir ya da listenin sahibi paylaşımı kapatmış olabilir.</p>
      </main>
    </div>
  );
}
