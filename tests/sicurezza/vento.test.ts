// V-049 (T484, ADR-0255): the coarse wind on the wire and `world.wind` for Lua. Of the automata only the coarse view of the world's wind
// leaves the server (corner, size, cell, prevailing, two signed bytes a cell: nothing of the lattice), at most `WIND_VIEW.hz` times a
// second of the world and only when it changed; a client reads it without trusting it (a view too big, with cells that are not what its
// size says, numbers that are not numbers, is no view) and never writes a field; `world.wind` gives Lua a fresh copy, never the field.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { DEFAULT_NATURE } from '../../src/kernel/nature';
import { memoryStore } from '../../src/kernel/repo';
import { fakeLink, type ServerMsg } from '../../src/session/protocol';
import { SessionServer } from '../../src/session/server';
import { SessionClient } from '../../src/session/client';
import { fromBase64, readWindView, WIND_MAX, WIND_VIEW, windViewOf } from '../../src/kernel/wind';
import type { AutomatonSpec } from '../../src/kernel/automata';
import type { FileMap } from '../../src/kernel/types';

const DT = 1 / 60;

const PROBE_LUA = `local M = {}
function M.update(dt)
  local w = world.wind(4.5, 4.5)
  local bad = { world.wind(0/0, 1), world.wind(1/0, 1), world.wind("x", 1), world.wind(nil, nil) }
  if w then w.vx = 1e9; w.speed = 1e9 end
  local again = world.wind(4.5, 4.5)
  ecs.set(world.player(), "probe", { had = w ~= nil, bad = #bad, vx = again and again.vx or 0, speed = again and again.speed or 0 })
end
return M
`;

async function boot(multiplayer = false, extra: FileMap = {}) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const automata: AutomatonSpec[] = [{ id: 'wind', family: 'wind', prevailing: [0.06, 0.02] }];
  const next = { ...cfg, ...(multiplayer ? { game: { mode: 'multiplayer', death: 3 } } : {}), nature: { ...DEFAULT_NATURE, automata } };
  const files = { ...bundledFiles, 'universe.json': JSON.stringify(next, null, 2) + '\n', ...extra };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 60 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(DT);
    await new Promise((r) => setTimeout(r, 15));
  }
  k.tick(DT);
  return k;
}

describe('V-049: the coarse wind on the wire and world.wind (T484)', () => {
  it('V-049 only the coarse view leaves the server, at most twice a second of the world, and only its listed fields', async () => {
    const k = await boot(true);
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const session = new SessionClient(c, { id: 'anna' });
    const views: unknown[] = [];
    let welcome: unknown;
    const heard = session.onMessage;
    session.onMessage = (m: ServerMsg) => {
      if (m.t === 'update' && m.wind !== undefined) views.push(m.wind);
      heard?.(m);
    };
    await session.ready;
    welcome = session.wind;
    expect(welcome).toBeDefined();
    const at = k.wandererAt('anna')!;
    for (let i = 0; i < 120; i++) {
      // A gust at every tick where anna is: the view could change at every update of the server.
      k.automata.beginTick();
      k.fieldAdd('wind', at.x + (i % 5) - 2, at.y, 0.04 * (i % 2 ? 1 : -1), 0.03);
      server.tick(DT);
    }
    // Two seconds of the world: still at most one view a slice of its time (two a second), one more for the slice it began in.
    expect(views.length).toBeGreaterThan(0);
    expect(views.length).toBeLessThanOrEqual(2 * WIND_VIEW.hz + 1);
    for (const v of [welcome, ...views]) {
      expect(Object.keys(v as object).sort()).toEqual(['cell', 'data', 'h', 'p', 'w', 'x', 'y']);
      const view = readWindView(v)!;
      expect(view).toBeDefined();
      expect(view.w * view.h).toBeLessThanOrEqual(WIND_VIEW.cap);
      expect(fromBase64(view.data)!.length).toBe(view.w * view.h * 2);
      expect(Math.hypot(...view.p)).toBeLessThanOrEqual(WIND_MAX * Math.SQRT2);
    }
    // Nothing of the lattice: no populations, no densities, no other automaton.
    expect(JSON.stringify(views)).not.toMatch(/"f"|rho|populat|inflow|"solid"/);
  }, 60_000);

  it('V-049 a client reads a view without trusting it and a mirror never steps nor writes a field', async () => {
    const big = windViewOf(0, 0, [0, 0], () => [0, 0]);
    expect(readWindView({ ...big, w: 512, h: 512 })).toBeUndefined();
    expect(readWindView({ ...big, data: big.data.slice(4) })).toBeUndefined();
    expect(readWindView({ ...big, p: [Number.NaN, 0] })).toBeUndefined();
    expect(readWindView({ ...big, x: 1e12 })).toBeUndefined();
    expect(readWindView({ ...big, data: 'A'.repeat(WIND_VIEW.cap * 4) })).toBeUndefined();
    const k = await boot(true);
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const session = new SessionClient(c, { id: 'anna' });
    await session.ready;
    const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    mirror.applyWind({ ...big, data: '!!!!' });
    expect(mirror.windView()).toBeUndefined();
    mirror.applyWind(session.wind);
    expect(mirror.windView()).toBeDefined();
    expect(mirror.fieldAdd('wind', 1, 1, 0.04)).toBe(false);
    for (let i = 0; i < 30; i++) mirror.tick(DT);
    expect(mirror.automata.stepCount('wind')).toBe(0);
  }, 60_000);

  it('V-049 world.wind gives Lua a fresh copy, within the limits, nothing for what is not a number', async () => {
    const k = await boot(false, {
      'modules/sys.sonda/manifest.json': JSON.stringify({ id: 'sys.sonda', name: 'Sonda', kind: 'system', logic: 'logic.lua', order: 93 }),
      'modules/sys.sonda/logic.lua': PROBE_LUA,
    });
    for (let i = 0; i < 10; i++) k.tick(DT);
    const p = k.ecs.get(k.wandererEntity, 'probe');
    expect(p.had).toBe(true);
    expect(p.bad).toBe(0);
    expect(Math.abs(p.vx)).toBeLessThanOrEqual(WIND_MAX);
    expect(p.speed).toBeLessThanOrEqual(WIND_MAX);
    expect(p.speed).toBeGreaterThan(0);
  }, 60_000);
});
