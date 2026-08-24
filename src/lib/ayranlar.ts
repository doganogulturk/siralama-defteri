import { supabase } from './supabase';
import { AyranEntry } from '../types/ayran';

const TABLE = 'ay_ayranlar';

/** `denendi` kolonu sonradan eklendi: null/eksik gelen eski satırlar denenmiş sayılır. */
const normalize = (row: AyranEntry): AyranEntry => ({ ...row, denendi: row.denendi ?? true });

export async function getAyranlar(): Promise<AyranEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('sira', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AyranEntry[]).map(normalize);
}

export async function createAyran(
  entry: Omit<AyranEntry, 'id' | 'created_at'>
): Promise<AyranEntry> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return normalize(data as AyranEntry);
}

export async function updateAyran(
  id: string,
  entry: Partial<Omit<AyranEntry, 'id' | 'created_at'>>
): Promise<AyranEntry> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(entry)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalize(data as AyranEntry);
}

export async function deleteAyran(id: string, fotografUrl?: string | null): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  await deleteFotograf(fotografUrl);
}

export async function updateAyranlarSira(
  updates: { id: string; sira: number }[]
): Promise<void> {
  if (updates.length === 0) return;
  // Not a single upsert: Postgres validates NOT NULL columns (e.g. marka) against the
  // INSERT values even when ON CONFLICT redirects to an UPDATE, so a bare {id, sira}
  // payload fails with 23502. Per-row UPDATE avoids that since it never touches other columns.
  const results = await Promise.all(
    updates.map(u => supabase.from(TABLE).update({ sira: u.sira }).eq('id', u.id))
  );
  for (const r of results) {
    if (r.error) throw r.error;
  }
}

export async function uploadFotograf(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('ayran')
    .upload(fileName, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from('ayran')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

function extractFotografPath(url: string): string | null {
  const marker = '/ayran/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function deleteFotograf(url?: string | null): Promise<void> {
  if (!url) return;
  const path = extractFotografPath(url);
  if (!path) return;
  const { error } = await supabase.storage.from('ayran').remove([path]);
  if (error) console.warn('Fotoğraf silinemedi:', error.message);
}
