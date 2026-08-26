const TR: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
};

/** "Türk Kahvesi" → "turk-kahvesi". Boş kalırsa çağıran taraf yedek üretmeli. */
export function slugify(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâîû]/g, ch => TR[ch] ?? ch)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/** Aynı slug varsa sonuna -2, -3 … ekler. */
export function benzersizSlug(taban: string, mevcut: string[]): string {
  const kok = taban || 'liste';
  if (!mevcut.includes(kok)) return kok;
  for (let i = 2; ; i++) {
    const aday = `${kok}-${i}`;
    if (!mevcut.includes(aday)) return aday;
  }
}
