// T27a: the chain of the Systems Room. Every system is a station against the back wall, in the order of the tick; the
// tick measures each (milliseconds, entities touched through the Host) and once a second the stations show the means,
// red with the fault when the code fails. E or a click on a station opens it.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { CHAIN, chainSlots, ROOM_W, WALL_Y } from '../src/kernel/corona';
import { ChainMeter, chainOf, msText, WINDOW } from '../src/kernel/chain';
import type { ModuleEntry } from '../src/kernel/types';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

/** A system that reads the entities with `prova` (or breaks, if asked). */
function addProbe(k: Kernel, logic = 'local M = {}\nfunction M.update(dt)\n  ecs.each("prova", function(id, p) end)\nend\nreturn M\n'): void {
  k.repo.write('modules/sys.prova/manifest.json', JSON.stringify({ id: 'sys.prova', name: 'Prova', kind: 'system', version: '0.1.0', description: 'Legge le cose di prova.', logic: 'logic.lua', order: 35 }, null, 2) + '\n');
  k.repo.write('modules/sys.prova/logic.lua', logic);
  k.applyFiles({ ...k.repo.working });
}

describe('the chain of the Systems Room', () => {
  it('a station per system against the back wall, in the order of the tick, side by side and centred', async () => {
    const k = await boot();
    const f = k.corona.building('sistemi')!.floors[0];
    const stations = f.items.filter((i) => i.kind === 'stazione');
    expect(stations.map((s) => s.target)).toEqual(k.systems.map((m) => m.manifest.id));
    expect(stations.map((s) => s.target)).toEqual(['core.movement', 'core.carpet', 'sys.physics', 'sys.wander', 'sys.follow', 'sys.needs', 'sys.fire']);
    expect(new Set(stations.map((s) => s.y - f.oy))).toEqual(new Set([WALL_Y]));
    for (let j = 1; j < stations.length; j++) expect(stations[j].x).toBe(stations[j - 1].x + (stations[j - 1].w ?? 1));
    // Centred on the exit's column, inside the walls, off the stairs.
    const left = stations[0].x - f.ox, right = stations.at(-1)!.x + stations.at(-1)!.w! - f.ox;
    expect(left + right).toBe(ROOM_W);
    expect(left).toBeGreaterThanOrEqual(CHAIN.x0);
    expect(right - 1).toBeLessThanOrEqual(CHAIN.x1);
    expect(stations.find((s) => s.target === 'sys.fire')?.label).toBe('la catena dei sistemi: Fuoco e cose che passano');
    // Nothing else on them; they block, the walkway in front of them does not.
    for (const s of stations) {
      for (let x = s.x; x < s.x + s.w!; x++) {
        expect(f.items.filter((o) => o.y === s.y && x >= o.x && x < o.x + (o.w ?? 1))).toEqual([s]);
        expect(k.corona.free(x + 0.5, s.y + 0.5)).toBe(false);
        expect(k.corona.free(x + 0.5, s.y + 1.5), `${x}`).toBe(true);
      }
    }
    expect(k.corona.buildings.filter((b) => b.floors.some((fl) => fl.items.some((i) => i.kind === 'stazione'))).map((b) => b.id)).toEqual(['sistemi']);
  });

  it('as wide as they fit: three cells at most, one at least, the first twenty', () => {
    expect(chainSlots(1)).toEqual([{ x: 11, w: 3 }]);
    expect(chainSlots(7).map((s) => s.w)).toEqual(Array(7).fill(2));
    expect(chainSlots(7)[0].x).toBe(5);
    const many = chainSlots(25);
    expect(many.length).toBe(CHAIN.x1 - CHAIN.x0 + 1);
    expect([many[0].x, many.at(-1)!.x, many.at(-1)!.w]).toEqual([CHAIN.x0, CHAIN.x1, 1]);
    expect(chainSlots(0)).toEqual([]);
  });

  it('a system that joins the universe joins the chain, at its place in the tick', async () => {
    const k = await boot();
    addProbe(k);
    const ids = k.corona.building('sistemi')!.floors[0].items.filter((i) => i.kind === 'stazione').map((s) => s.target);
    expect(ids.indexOf('sys.prova')).toBe(ids.indexOf('sys.follow') + 1);
    expect(k.chain().stations.find((s) => s.id === 'sys.prova')).toMatchObject({ step: ids.indexOf('sys.prova') + 1, order: 35, kind: 'sistema', path: 'modules/sys.prova/logic.lua', description: 'Legge le cose di prova.' });
  });

  it('the tick measures each system once a second: time, and the entities it touched', async () => {
    const k = await boot();
    addProbe(k);
    for (let i = 0; i < 3; i++) k.ecs.spawn({ prova: { n: i } });
    expect(k.chain().measured).toBe(false);
    expect(k.chain().stations.every((s) => !s.measure)).toBe(true);
    for (let i = 0; i < WINDOW; i++) k.tick(1 / 60);
    const c = k.chain();
    expect(c.measured).toBe(true);
    expect(c.hz).toBe(60);
    for (const s of c.stations) {
      expect(s.measure, s.id).toBeDefined();
      expect(s.measure!.ms).toBeGreaterThanOrEqual(0);
      expect(s.measure!.peak).toBeGreaterThanOrEqual(s.measure!.ms);
    }
    expect(c.stations.find((s) => s.id === 'sys.prova')!.measure!.touched).toBe(3);
    expect(c.ms).toBeCloseTo(c.stations.reduce((t, s) => t + s.measure!.ms, 0));
    // One more cell of the probe, one more entity touched, at the next window.
    k.ecs.spawn({ prova: { n: 9 } });
    for (let i = 0; i < WINDOW; i++) k.tick(1 / 60);
    expect(k.chain().stations.find((s) => s.id === 'sys.prova')!.measure!.touched).toBe(4);
  });

  it('a system in fault is red with its fault; when it works again the fault goes', async () => {
    const k = await boot();
    addProbe(k, 'local M = {}\nfunction M.update(dt)\n  error("rotto apposta")\nend\nreturn M\n');
    k.tick(1 / 60);
    const s = k.chain().stations.find((x) => x.id === 'sys.prova')!;
    expect(s.fault?.message).toMatch(/rotto apposta/);
    expect(k.chain().stations.filter((x) => x.fault).map((x) => x.id)).toEqual(['sys.prova']);
    addProbe(k);
    k.tick(1 / 60);
    expect(k.chain().stations.find((x) => x.id === 'sys.prova')!.fault).toBeUndefined();
  });

  it('E or a click on a station opens it, with the whole chain', async () => {
    const k = await boot();
    const opened: any[] = [];
    k.bus.on('ui:station', (e) => opened.push(e));
    const st = k.corona.building('sistemi')!.floors[0].items.find((i) => i.kind === 'stazione' && i.target === 'sys.needs')!;
    Object.assign(k.playerPos(), { x: st.x + 0.5, y: st.y + 1.5 });
    k.zone = 'studio';
    await k.interact();
    expect(opened.map((o) => o.station.id)).toEqual(['sys.needs']);
    expect(opened[0].chain.stations.length).toBe(k.systems.length);
    expect(opened[0].station).toMatchObject({ name: 'Bisogni', path: 'modules/sys.needs/logic.lua', kind: 'sistema' });
    expect(k.clickStudio(st.x + st.w! - 0.5, st.y + 1.2)).toBe(true);
    expect(opened.map((o) => o.station.id)).toEqual(['sys.needs', 'sys.needs']);
  });
});

describe('the meter and the stations, pure', () => {
  const entry = (id: string, extra: Record<string, unknown> = {}): ModuleEntry => ({ manifest: { id, name: id.toUpperCase(), kind: 'system', version: '0', ...extra } as any, dir: `modules/${id}`, manifestPath: `modules/${id}/manifest.json`, logicPath: `modules/${id}/logic.lua` });

  it('publishes the means of a window, then starts again', () => {
    const m = new ChainMeter();
    let sum = 3;
    for (let i = 0; i < WINDOW - 1; i++) {
      sum += i % 2 ? 2 : 0;
      m.record('a', i % 2 ? 2 : 0, 4);
      expect(m.endTick()).toBe(false);
    }
    m.record('a', 3, 4);
    expect(m.endTick()).toBe(true);
    expect(m.last.get('a')!.touched).toBe(4);
    expect(m.last.get('a')!.peak).toBe(3);
    expect(m.last.get('a')!.ms).toBeCloseTo(sum / WINDOW);
    expect(m.windows).toBe(1);
  });

  it('the kinds, the panels of the mechanics, the faults by module', () => {
    const m = new ChainMeter();
    const c = chainOf([entry('core.movement'), entry('sys.fire'), entry('mech.armi', { ui: { titolo: 'Armi', elementi: [] } })], m, [{ key: 'module:sys.fire:update', message: 'brucia', since: 0, count: 2 }]);
    expect(c.stations.map((s) => [s.step, s.kind, s.panel, s.fault?.message])).toEqual([
      [1, 'nucleo', undefined, undefined],
      [2, 'sistema', undefined, 'brucia'],
      [3, 'meccanica', 'Armi', undefined],
    ]);
    expect(c.measured).toBe(false);
    expect([msText(0.123), msText(1.44), msText(12.6)]).toEqual(['0.12 ms', '1.4 ms', '13 ms']);
  });
});
