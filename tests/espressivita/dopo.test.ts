// T183: a kernel of tomorrow, built in the test without touching src/kernel/: the prelude and the Host get a primitive the kernel of today does not have, a store of the
// world's. An older universe opens on it with no change, and a module of tomorrow keeps its data across restarts. This is what «additive» means, proved once, on the primitive that matters most.
// And a kernel whose shared random has changed: what is not stored comes out different, the plans and the edits of the universe do not save it.

import { describe, expect, it, vi } from 'vitest';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { MemoryChunks } from '../../src/kernel/chunks';
import { Kernel } from '../../src/kernel/kernel';
import { allowedPath } from '../../src/kernel/paths';
import { memoryStore } from '../../src/kernel/repo';
import { LUA_API } from '../../src/kernel/validator';
import { closeWorld, developAll, DT, newLasting, open, universeWith } from './banco';

vi.mock('../../src/kernel/prelude.lua?raw', async (original) => {
  const real = (await original()) as { default: string };
  const api = 'local world = {\n    store_get = function(key) return host.store_get(tostring(key)) end,\n    store_set = function(key, value) return host.store_set(tostring(key), value) end,';
  return { default: real.default.replace('local world = {', api) };
});

const STORE = 'world/moduli.json';

/** Tomorrow's Host and tomorrow's save: the only two changes the primitive needs in the kernel, besides the two lines of the prelude and the list of the validator. */
function tomorrow(): void {
  const proto = Kernel.prototype as any;
  if (proto.tomorrow) return;
  proto.tomorrow = true;
  const makeHost = proto.makeHost;
  proto.makeHost = function (this: any) {
    const data = (): Record<string, unknown> => (this.store_ ??= JSON.parse(this.files?.[STORE] ?? '{}'));
    return { ...makeHost.call(this), store_get: (k: string) => data()[k], store_set: (k: string, v: unknown) => void (data()[k] = v) };
  };
  const saveState = proto.saveState;
  proto.saveState = function (this: any) {
    if (this.store_ && !this.mirror) {
      const text = JSON.stringify(this.store_);
      this.repo.write(STORE, text);
      this.files = { ...this.files, [STORE]: text };
    }
    return saveState.call(this);
  };
  LUA_API.world.push('store_get', 'store_set');
}

const LASTING_MARKET = `-- Il mercato di domani: il prezzo sta nel magazzino del mondo.
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

describe('a kernel with one more primitive, and a universe of before', () => {
  it('the same universe opens with no fault: its modules never called it', async () => {
    tomorrow();
    const k = await open(newLasting(bundledFiles));
    expect(k.faults.list()).toEqual([]);
  });

  it('a name the universe already used for itself still works: its local is its own', async () => {
    tomorrow();
    const own = 'local M = {}\nlocal store_get = function() return 7 end\nfunction M.update(dt) ecs.set(world.player(), "mio", { v = store_get() }) end\nreturn M\n';
    const k = await open(newLasting({ ...universeWith('mech.posa'), 'modules/mech.posa/logic.lua': own }));
    k.tick(DT);
    expect(k.ecs.get(k.wandererEntity, 'mio').v).toBe(7);
  });

  it('the validator of tomorrow takes a module that uses it, its data survive the restart, and the path was already allowed', async () => {
    tomorrow();
    const w = newLasting({ ...universeWith('mech.mercato'), 'modules/mech.mercato/logic.lua': LASTING_MARKET });
    const first = await open(w);
    const manifest = { id: 'mech.nuova', name: 'x', kind: 'system', ui: { id: 'n', titolo: 'n', elementi: [{ tipo: 'pulsante', id: 'a', etichetta: 'a' }] } } as any;
    expect(first.validator.validateForged(manifest, LASTING_MARKET, new Set(), { system: true })).toEqual([]);
    for (let i = 0; i < 3; i++) first.uiAction('mercato', 'compra');
    first.give('item.pane', 1);
    await closeWorld(first, w);
    expect(allowedPath(STORE)).toBe(true);
    expect(JSON.parse(w.files[STORE]).mercato.prezzo).toBe(13);
    const second = await open(w);
    second.uiAction('mercato', 'compra');
    expect((second as any).store_.mercato.prezzo).toBe(14);
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
});
