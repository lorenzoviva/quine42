// T183: a kernel of tomorrow, built in the test without touching src/kernel/: the prelude and the Host get a primitive the kernel of today does not have, a store of the
// world's. An older universe opens on it with no change, and a module of tomorrow keeps its data across restarts. This is what «additive» means, proved once, on the primitive that matters most.
// And a kernel whose shared random has changed: what is not stored comes out different, the plans and the edits of the universe do not save it.

import { describe, expect, it, vi } from 'vitest';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { checkKernelVersion, KERNEL_VERSION } from '../../src/kernel/version';
import { MemoryChunks } from '../../src/kernel/chunks';
import { Kernel } from '../../src/kernel/kernel';
import { allowedPath } from '../../src/kernel/paths';
import { memoryStore } from '../../src/kernel/repo';
import { LUA_API } from '../../src/kernel/validator';
import { closeWorld, developAll, DT, newLasting, open, universeWith } from './banco';

const STORE = 'world/magazzino/mech.mercato.json';

const LASTING_MARKET = `-- Il mercato che ricorda: il prezzo sta nel magazzino del mondo.
local M = {}
function M.on_ui(user, azione)
  local m = world.store_get("mercato") or { prezzo = 10 }
  m.prezzo = m.prezzo + 1
  world.store_set("mercato", m)
  return nil
end
function M.update(dt) end
return M
`;

// T183 built this primitive here, on a kernel of tomorrow (the prelude and the Host extended in the test). T245a (ADR-0138) put it in the
// kernel as it was measured: the same three tests now run on the kernel of today.
describe('a kernel with one more primitive, and a universe of before', () => {
  it('the same universe opens with no fault: its modules never called it', async () => {
    const k = await open(newLasting(bundledFiles));
    expect(k.faults.list()).toEqual([]);
  });

  it('a name the universe already used for itself still works: its local is its own', async () => {
    const own = 'local M = {}\nlocal store_get = function() return 7 end\nfunction M.update(dt) ecs.set(world.player(), "mio", { v = store_get() }) end\nreturn M\n';
    const k = await open(newLasting({ ...universeWith('mech.posa'), 'modules/mech.posa/logic.lua': own }));
    k.tick(DT);
    expect(k.ecs.get(k.wandererEntity, 'mio').v).toBe(7);
  });

  it('the validator takes a module that uses it, its data survive the restart, and the path was already allowed', async () => {
    const w = newLasting({ ...universeWith('mech.mercato'), 'modules/mech.mercato/logic.lua': LASTING_MARKET });
    const first = await open(w);
    const manifest = { id: 'mech.nuova', name: 'x', kind: 'system', ui: { id: 'n', titolo: 'n', elementi: [{ tipo: 'pulsante', id: 'a', etichetta: 'a' }] } } as any;
    expect(first.validator.validateForged(manifest, LASTING_MARKET, new Set(), { system: true })).toEqual([]);
    expect(LUA_API.world).toEqual(expect.arrayContaining(['store_get', 'store_set']));
    for (let i = 0; i < 3; i++) first.uiAction('mercato', 'compra');
    first.give('item.pane', 1);
    await closeWorld(first, w);
    expect(allowedPath(STORE)).toBe(true);
    expect(JSON.parse(w.files[STORE]).mercato.prezzo).toBe(13);
    const second = await open(w);
    second.uiAction('mercato', 'compra');
    expect(second.stores.get('mech.mercato', 'mercato')).toEqual({ prezzo: 14 });
  });
});

describe('a kernel whose shared random changed', () => {
  async function world(chunks: MemoryChunks, K: typeof Kernel): Promise<{ tiles: Record<string, string>; edit: string; size: number }> {
    const k = await K.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks });
    await developAll(k);
    const planned = [...k.chunks.values()].filter((c) => c.stage === 'planned');
    const S = k.config.chunkSize;
    const ch = planned.find((c) => c.cx === 0 && c.cy === 0)!;
    k.setTile(S - 1, S - 1, 'l');
    const tiles = Object.fromEntries(planned.map((c) => [c.key, c.tiles]));
    await new Promise((r) => setTimeout(r, 700));
    const edit = ch.tiles[S * S - 1];
    return { tiles, edit, size: planned.length };
  }

  it('MEASURE: the places are not stored as tiles: a new random draws them anew under the same plans, and only the edits stay where they were', async () => {
    const chunks = new MemoryChunks();
    const before = await world(chunks, Kernel);
    vi.resetModules();
    vi.doMock('../../src/kernel/rng', async (original) => {
      const real = (await original()) as typeof import('../../src/kernel/rng');
      return { ...real, hash32: (...v: number[]) => real.hash32(...v, 12345) };
    });
    const { Kernel: Next } = await import('../../src/kernel/kernel');
    const after = await world(chunks, Next);
    vi.doUnmock('../../src/kernel/rng');
    let same = 0;
    let all = 0;
    for (const [key, t] of Object.entries(before.tiles)) {
      const u = after.tiles[key];
      if (!u) continue;
      for (let i = 0; i < t.length; i++) {
        all++;
        if (t[i] === u[i]) same++;
      }
    }
    console.log(`[T183] caso cambiato: ${((1 - same / all) * 100).toFixed(1)}% di ${all} caselle diverse in ${after.size} luoghi, con gli stessi piani`);
    expect(all).toBeGreaterThan(1000);
    expect(same).toBeLessThan(all);
    // The edit made before the change is still there: it is stored by index.
    expect(after.edit).toBe('l');
  });

  it('such a kernel is another contract (T260, ADR-0136): it goes up in Y, and the universe of before does not open on it as if nothing changed', () => {
    const made = JSON.parse(bundledFiles['universe.json']).kernel;
    const next = KERNEL_VERSION.replace(/^(\d+)\.(\d+)\.\d+$/, (_, x, y) => `${x}.${Number(y) + 1}.0`);
    expect(checkKernelVersion(made, KERNEL_VERSION).ok).toBe(true);
    expect(checkKernelVersion(made, next)).toMatchObject({ ok: false, motivo: expect.stringMatching(/universo nuovo/) });
  });
});
