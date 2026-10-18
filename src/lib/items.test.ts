import { beforeEach, describe, expect, it, vi } from 'vitest';

/* Supabase istemcisinin taklidi: RPC ve satır satır UPDATE çağrılarını kaydediyor. */
const { rpc, cagrilar } = vi.hoisted(() => ({
  rpc: vi.fn(),
  cagrilar: [] as string[],
}));
vi.mock('./supabase', () => ({
  supabase: {
    rpc,
    from: () => ({
      update: (degerler: { sira: number }) => ({
        eq: async (_: string, id: string) => {
          cagrilar.push(`${id}:${degerler.sira}`);
          return { error: null };
        },
      }),
    }),
  },
}));

import { updateItemsSira } from './items';

const bekle = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('updateItemsSira', () => {
  beforeEach(() => {
    rpc.mockReset();
    cagrilar.length = 0;
  });

  it('bütün değişiklikleri tek RPC ile gönderiyor', async () => {
    rpc.mockResolvedValue({ error: null });
    await updateItemsSira([{ id: 'a', sira: 0 }, { id: 'b', sira: 1, asla: true }]);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('siralamayi_yaz', {
      degisiklikler: [{ id: 'a', sira: 0 }, { id: 'b', sira: 1, asla: true }],
    });
    expect(cagrilar).toEqual([]);
  });

  it('boş listede istek atmıyor', async () => {
    await updateItemsSira([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('yazımlar sırayla gidiyor: yavaş ilk istek bitmeden ikincisi başlamıyor', async () => {
    const sira: string[] = [];
    rpc.mockImplementationOnce(async () => { sira.push('1 başladı'); await bekle(20); sira.push('1 bitti'); return { error: null }; })
       .mockImplementationOnce(async () => { sira.push('2 başladı'); return { error: null }; });
    await Promise.all([
      updateItemsSira([{ id: 'a', sira: 0 }]),
      updateItemsSira([{ id: 'a', sira: 1 }]),
    ]);
    expect(sira).toEqual(['1 başladı', '1 bitti', '2 başladı']);
  });

  it('hata sonraki yazımları durdurmuyor', async () => {
    rpc.mockResolvedValueOnce({ error: { code: '42501', message: 'yetki yok' } })
       .mockResolvedValueOnce({ error: null });
    await expect(updateItemsSira([{ id: 'a', sira: 0 }])).rejects.toMatchObject({ code: '42501' });
    await expect(updateItemsSira([{ id: 'a', sira: 1 }])).resolves.toBeUndefined();
  });

  it('fonksiyon veritabanında yoksa satır satır yazıyor', async () => {
    rpc.mockResolvedValue({ error: { code: 'PGRST202', message: 'not found' } });
    await updateItemsSira([{ id: 'a', sira: 0 }, { id: 'b', sira: 1 }]);
    expect(cagrilar).toEqual(['a:0', 'b:1']);
  });
});
