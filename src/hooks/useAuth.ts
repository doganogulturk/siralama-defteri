'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Oturum durumu. `loading` yalnızca ilk okuma için true — bu ayrım olmadan
 * sayfa her açılışta bir an giriş ekranını gösterirdi.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });

    // Giriş, çıkış ve token yenilemelerini yakalar.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!alive) return;
      setSession(next);
      setLoading(false);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}
