// T26: the model of places in the Office of places. A holographic table, 3 × 3 cells, shows a place already planned in
// miniature (its tiles with their levels, the structures on its lots, its things and runes), built by the same code that
// builds the world; «<» «>» pick the place, the one where the wanderer last stood first; looking does not generate anything.
// T26b: «−» «+» go through the six phases of the Cartographer's work on the same place, what each adds lit.

import { describe, expect, it } from 'vitest';
import { Kernel, PLACE_PHASES } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { MemoryChunks } from '../src/kernel/chunks';
import { LEVEL } from '../src/kernel/relief';
import type { FormComp } from '../src/kernel/forms';
import { gates } from '../src/kernel/layout';

/** A kernel whose loaded chunks have all been planned by the Cartographer. */
async function boot(chunks = new MemoryChunks()) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels(), chunks });
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
  return { k, chunks };
}

describe('the model of places (T26)', () => {
  it('stands in the Office of places, 3 × 3, and shows every planned place, the last one visited first', async () => {
    const { k } = await boot();
    const f = k.corona.building('luoghi')!.floors[0];
    const show = f.items.find((i) => i.kind === 'showcase')!;
    expect([show.source, show.device, show.w, show.h]).toEqual(['luoghi', 'plastico', 3, 3]);
    const planned = [...k.chunks.values()].filter((c) => c.stage === 'planned');
    expect(planned.length).toBeGreaterThan(1);
    const entries = k.showcaseEntries('luoghi');
    expect(entries.map((e) => e.id).sort()).toEqual(planned.map((c) => `luogo:${c.cx}_${c.cy}`).sort());
    // The wanderer is in the starting place: it comes first, then the others by distance.
    expect(entries[0].place).toEqual({ cx: 0, cy: 0 });
    const far = entries.map((e) => Math.hypot(e.place!.cx, e.place!.cy));
    expect(far).toEqual([...far].sort((a, b) => a - b));
    const first = entries[0];
    expect(first.label).toBe(k.chunks.get('0,0')!.place!.name);
    const facts = Object.fromEntries(first.facts);
    expect(facts.Dove).toMatch(/^luogo 0, 0/);
    expect(facts.Ambiente).toContain(k.chunks.get('0,0')!.plan!.layout);
    expect(facts.Piano).toMatch(/^maps\/.*0_0\.json$/);
    expect(facts.Rune).toContain('«luce»');
    // «Apri il file» opens the module of its environment.
    expect(first.path && k.files[first.path]).toBeTruthy();
    expect(JSON.parse(k.files[first.path!]).layouts[k.chunks.get('0,0')!.plan!.layout]).toBeDefined();
    // From the studio, the place last visited still comes first; a click on the table opens it.
    const panels: any[] = [];
    k.bus.on('ui:showcase', (e: any) => panels.push(e));
    Object.assign(k.playerPos(), { x: show.x + 1.5, y: show.y + 3.5 });
    k.zone = 'studio';
    expect(k.showcaseEntries('luoghi')[0].id).toBe('luogo:0_0');
    expect(k.clickStudio(show.x + 1.5, show.y + 1.5)).toBe(true);
    expect(panels.at(-1).entry.id).toBe('luogo:0_0');
  }, 30_000);

  it('builds the miniature of a loaded place as the world is: tiles, levels, structures, things, runes', async () => {
    const { k } = await boot();
    const ch = k.chunks.get('0,0')!;
    const S = k.config.chunkSize;
    const mini = k.miniature(0, 0)!;
    expect(mini).toBeDefined();
    expect(mini.size).toBe(S);
    expect(mini.tiles).toBe(ch.tiles);
    for (let i = 0; i < S * S; i += 7) expect(mini.levels[i] * LEVEL, `casella ${i}`).toBeCloseTo(k.groundAt(i % S + 0.5, Math.floor(i / S) + 0.5));
    // The structures where the world has them, with their models, turned the same way.
    const structures = k.ecs.query('struttura', 'origin').filter((id) => k.ecs.get(id, 'chunk')?.key === ch.key);
    expect(mini.structures.length).toBe(structures.length);
    for (const id of structures) {
      const p = k.ecs.get(id, 'pos');
      const fc = k.ecs.get(id, 'form') as FormComp;
      expect(mini.structures.some((s) => s.x === p.x && s.y === p.y && s.model === fc.model && s.yaw === fc.yaw)).toBe(true);
    }
    // The runes on their cells.
    const runes = k.ecs.query('rune').map((id) => k.ecs.get(id, 'rune')).filter((r) => Math.floor(r.col / S) === 0 && Math.floor(r.row / S) === 0);
    expect(runes.length).toBeGreaterThan(0);
    expect(mini.runes.map((r) => `${r.token}@${r.x - 0.5},${r.y - 0.5}`).sort()).toEqual(runes.map((r) => `${r.token}@${r.col},${r.row}`).sort());
    // What the plan put outside, where the world put it (people may have walked away since: the plan's cells).
    expect(mini.things.length).toBeGreaterThan(0);
    for (const t of mini.things) {
      expect(t.x).toBeGreaterThan(0);
      expect(t.x).toBeLessThan(S);
      expect(k.palette[mini.tiles[Math.floor(t.y) * S + Math.floor(t.x)]]?.solid ?? false).toBe(false);
    }
  }, 30_000);

  it('rebuilds the same miniature from the saved plan, without the Council, when the place is not loaded', async () => {
    const { k, chunks } = await boot();
    const loaded = k.miniature(0, 0)!;
    const other = [...k.chunks.values()].find((c) => c.stage === 'planned' && c.key !== '0,0')!;
    const otherMini = k.miniature(other.cx, other.cy)!;
    // A new session on the same universe: nothing loaded yet.
    const k2 = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels(), chunks });
    expect(k2.chunks.size).toBe(0);
    const calls = k2.usage.version;
    expect(k2.miniature(0, 0)).toBeUndefined();
    const version = k2.miniatureVersion;
    for (let i = 0; i < 40 && k2.miniatureVersion === version; i++) await new Promise((r) => setTimeout(r, 10));
    expect(k2.miniature(0, 0)).toEqual(loaded);
    k2.miniature(other.cx, other.cy);
    for (let i = 0; i < 40 && !k2.miniature(other.cx, other.cy); i++) await new Promise((r) => setTimeout(r, 10));
    expect(k2.miniature(other.cx, other.cy)).toEqual(otherMini);
    expect(k2.chunks.size).toBe(0);
    expect(k2.usage.version).toBe(calls);
    // A place never planned has no miniature, and asking does not plan it.
    k2.miniature(40, 40);
    await new Promise((r) => setTimeout(r, 30));
    expect(k2.miniature(40, 40)).toBeUndefined();
    expect(k2.chunks.size).toBe(0);
  }, 30_000);

  it('shows the six phases of the place, from the draft to things and runes, what each adds lit', async () => {
    const { k } = await boot();
    const ch = k.chunks.get('0,0')!;
    const S = k.config.chunkSize;
    const mini = k.miniature(0, 0)!;
    expect(mini.phases.length).toBe(PLACE_PHASES.length);
    const [draft, gated, env, paths, lots, last] = mini.phases;
    // The draft as the generator made it, nothing lit; the last is the place itself.
    expect(draft.tiles).toBe(ch.draft);
    expect(draft.lit).toEqual([]);
    expect([last.tiles, last.levels]).toEqual([mini.tiles, mini.levels]);
    // The gates: one per side, walkable from then on.
    const g = gates(0, 0, S, k.config.seed);
    expect(gated.lit).toEqual([...g].sort((a, b) => a - b));
    for (const c of g) expect(k.palette[gated.tiles[c]]?.solid).toBe(false);
    // The environment and the paths light what they changed; the border stays the draft's (save the gates).
    for (const [before, now] of [[gated, env], [env, paths]]) for (const c of now.lit) expect(now.tiles[c]).not.toBe(before.tiles[c]);
    for (let i = 0; i < S; i++) for (const c of [i, i * S, i * S + S - 1, (S - 1) * S + i]) if (!g.includes(c)) expect(env.tiles[c]).toBe(draft.tiles[c]);
    // The lots: the cells of each building, its structure in the middle of them.
    expect(lots.tiles).toBe(mini.tiles);
    for (const s of mini.structures) expect(lots.lit).toContain(Math.floor(s.y) * S + Math.floor(s.x));
    expect(mini.structures.length ? lots.lit.length : 1).toBeGreaterThan(0);
    // Things and runes, each on its cell.
    for (const p of [...mini.things, ...mini.runes]) expect(last.lit).toContain(Math.floor(p.y) * S + Math.floor(p.x));
    expect(last.lit.length).toBeGreaterThan(0);
    // Each phase's levels are a place's: as many as the tiles, all numbers.
    for (const p of mini.phases) expect(p.levels.length === S * S && p.levels.every(Number.isFinite)).toBe(true);
  }, 30_000);

  it('goes through the phases with the pads «−» «+» in front of the table, walked on, with E or a click', async () => {
    const { k } = await boot();
    const f = k.corona.building('luoghi')!.floors[0];
    const at = (kind: string) => f.items.find((i) => i.kind === kind)!;
    const show = at('showcase');
    const less = at('less'), more = at('more');
    // Under the outer columns of the table, on the floor: one walks on them, and the front of the table stays free.
    expect([less.x, less.y, more.x, more.y]).toEqual([show.x, show.y + 3, show.x + 2, show.y + 3]);
    for (const p of [less, more]) expect(k.corona.free(p.x + 0.5, p.y + 0.5)).toBe(true);
    expect(k.corona.free(show.x + 1.5, show.y + 3.5)).toBe(true);
    // The finished place, until it is moved; the other showcases have no phases.
    expect(k.showcaseOf('luoghi')!.phase).toBe(PLACE_PHASES.length - 1);
    expect(k.showcaseOf('persone')!.phase).toBeUndefined();
    const seen: any[] = [];
    const said: string[] = [];
    k.bus.on('studio:showcase', (e: any) => seen.push(e));
    k.bus.on('ui:message', (e: any) => said.push(e.text));
    // E standing on «−», twice; then a click on «+».
    Object.assign(k.playerPos(), { x: less.x + 0.5, y: less.y + 0.5 });
    k.zone = 'studio';
    await k.interact();
    await k.interact();
    expect(k.showcaseOf('luoghi')!.phase).toBe(PLACE_PHASES.length - 3);
    expect(said.at(-1)).toContain(`Fase ${PLACE_PHASES.length - 2} di ${PLACE_PHASES.length}, ${PLACE_PHASES[PLACE_PHASES.length - 3].name}`);
    expect(k.clickStudio(more.x + 0.5, more.y + 0.5)).toBe(true);
    expect(seen.map((e) => e.phase)).toEqual([4, 3, 4]);
    // Down to the draft and no further; changing place keeps the phase.
    for (let i = 0; i < 9; i++) k.stepPhase('luoghi', -1);
    expect(k.showcaseOf('luoghi')!.phase).toBe(0);
    k.stepShowcase('luoghi', 1);
    expect(k.showcaseOf('luoghi')!.phase).toBe(0);
    for (let i = 0; i < 9; i++) k.stepPhase('luoghi', 1);
    expect(k.showcaseOf('luoghi')!.phase).toBe(PLACE_PHASES.length - 1);
    // Standing in front of the table, E opens the panel, with the phase.
    const panels: any[] = [];
    k.bus.on('ui:showcase', (e: any) => panels.push(e));
    Object.assign(k.playerPos(), { x: show.x + 1.5, y: show.y + 3.5 });
    await k.interact();
    expect(panels.at(-1)?.phase).toBe(PLACE_PHASES.length - 1);
  }, 30_000);
});
