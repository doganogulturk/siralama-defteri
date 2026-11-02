'use client';

import { createContext, use } from 'react';
import { sozluk, type Dil, type Mesajlar } from './index';

/**
 * Çizilen ağacın dili. `DilKoku` veriyor; değeri ilk çizimde sunucunun isteğe göre bulduğu dil
 * (`sunucu.ts` → `istekDili`), sonra kişinin seçimi.
 *
 * Sunucuda da çizilen istemci bileşenleri metni buradan okumalı (`useMesajlar`), `messages()`tan değil:
 * `messages()` modül düzeyinde tek bir değişkenden okuyor, sunucuda aynı anda çizilen iki isteğin dili
 * birbirine karışabilirdi. Yalnızca tarayıcıda çalışan yerler (olay işleyicileri, `AuthGate` arkasındaki
 * ekranlar) `messages()`ı kullanmaya devam edebilir.
 */
export const DilBaglami = createContext<Dil>('tr');

/** Çizilen ağacın dili. */
export function useDilim(): Dil {
  return use(DilBaglami);
}

/** Çizilen ağacın dilinde metinler. */
export function useMesajlar(): Mesajlar {
  return sozluk(useDilim());
}
