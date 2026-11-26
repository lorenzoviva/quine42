// The climates of the draft (T510, ADR-0261): a world admits the climates of its theme or of its planet (`nature.climates`); the generator
// draws only those, the kernel's floor turns what is left of the others into the base ground, a universe of before takes its theme's
// without a call (`natureOfUniverse`), and a plan of before keeps the draft it was planned on.
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import type { ChunkRecord, ChunkStore } from '../src/kernel/chunks';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import { CLIMATES, climatesOf, DEFAULT_NATURE, offClimate, repairClimates, repairNature, sameNature } from '../src/kernel/nature';
import { natureOfBand, planetPlace } from '../src/kernel/planets';
import { themeClimates, WORLD_THEMES } from '../src/kernel/themes';
import { natureOfUniverse, readConfig } from '../src/kernel/universe';
import { baseCodesFor } from '../src/kernel/agents/genesis';

const S = 18;
const theme = (id: string) => WORLD_THEMES.find((t) => t.id === id)!.text;

function files(nature: Record<string, unknown> | undefined, themeText?: string, logic?: string) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, ...(nature ? { nature } : {}) }, null, 2) + '\n',
    ...(themeText ? { 'prompts/theme.md': themeText + '\n' } : {}),
    ...(logic ? { 'modules/world.terrain/logic.lua': logic } : {}),
  };
}

const boot = (f: Record<string, string>, chunks?: ChunkStore) => Kernel.boot({ files: f, store: memoryStore(), ai: new MockAiModels(), ...(chunks ? { chunks } : {}) });

/** How many tiles of each code the drafts of a square of places have (every `step` places). */
function census(k: Kernel, R: number, step = 1, x0 = 0): Record<string, number> {
  const out: Record<string, number> = {};
  for (let cy = -R; cy <= R; cy += step) for (let cx = -R; cx <= R; cx += step) for (const c of k.placeDraft(x0 + cx, cy).join('')) out[c] = (out[c] ?? 0) + 1;
  return out;
}

describe('i climi della natura (T510)', () => {
  it('si ripara: climi noti, una volta, in ordine; tutti o nessuno è il mondo di oggi', () => {
    expect(repairClimates(['frozen', 'temperate', 'frozen', 'lava'])).toEqual(['temperate', 'frozen']);
    expect(repairClimates([...CLIMATES])).toBeUndefined();
    expect(repairClimates(['lava'])).toBeUndefined();
    expect(repairClimates('frozen')).toBeUndefined();
    expect(repairNature({ climates: ['desert', 'temperate'] }).climates).toEqual(['temperate', 'desert']);
    // The world of today does not change.
    expect(repairNature({})).toEqual(DEFAULT_NATURE);
    expect(climatesOf(DEFAULT_NATURE)).toEqual(CLIMATES);
    expect(offClimate(DEFAULT_NATURE).size).toBe(0);
    expect(sameNature(repairNature({ climates: ['temperate'] }), repairNature({}))).toBe(false);
    // A planet keeps its own; the orbit the world's.
    const n = repairNature({ geography: 'void', sky: 'stars', climates: ['temperate'], planets: [{ name: 'Gelida', climates: ['frozen'] }, { name: 'Verde' }] });
    expect(natureOfBand(n, 1).climates).toEqual(['frozen']);
    expect(natureOfBand(n, 2).climates).toBeUndefined();
    expect(natureOfBand(n, 0).climates).toEqual(['temperate']);
  });

  it('ogni ambientazione porta i suoi: niente neve sulla frontiera né nei mari caldi, la colonia lontana e il regno medievale tutti', () => {
    expect(themeClimates(theme('western'))).toEqual(['temperate', 'desert', 'jungle']);
    expect(themeClimates(theme('pirates'))).not.toContain('frozen');
    expect(themeClimates(theme('space'))).toBeUndefined();
    expect(themeClimates(theme('medievale'))).toBeUndefined();
    expect(themeClimates('# Theme: un mondo scritto a mano')).toBeUndefined();
    // A universe of before takes its theme's, never written; one that says them keeps them.
    expect(natureOfUniverse({ geography: 'continent' }, theme('western')).climates).toEqual(['temperate', 'desert', 'jungle']);
    expect(natureOfUniverse({ geography: 'continent', climates: ['temperate', 'frozen'] }, theme('western')).climates).toEqual(['temperate', 'frozen']);
    expect(natureOfUniverse(undefined, theme('medievale')).climates).toBeUndefined();
    expect(readConfig(files({ ...DEFAULT_NATURE }, theme('western'))).config.nature.climates).toEqual(['temperate', 'desert', 'jungle']);
    expect(readConfig(files({ ...DEFAULT_NATURE })).config.nature.climates).toBeUndefined();
  });

  it('un universo western non ha la neve in nessun luogo di una griglia di prova; lo stesso seme medievale sì', async () => {
    const valmora = await boot(files({ ...DEFAULT_NATURE }));
    const western = await boot(files({ ...DEFAULT_NATURE }, theme('western')));
    expect(western.nature().climates).toEqual(['temperate', 'desert', 'jungle']);
    const before = census(valmora, 12, 3);
    const now = census(western, 12, 3);
    // The same grid: the seed's world has snow there, the Far West none, and its prairie instead; its thickets (the cactus) stay.
    expect(before.n).toBeGreaterThan(1000);
    expect(now.n ?? 0).toBe(0);
    expect(now.j).toBe(before.j);
    expect(now.g).toBeGreaterThan(before.g);
    // What is not a climate stays where it was: the sea, the rivers, the roads.
    expect(now.o).toBe(before.o);
    expect(now.p).toBe(before.p);
  }, 60_000);

  it('un pianeta ghiacciato ha la neve dappertutto, uno senza climi i suoi', async () => {
    const planets = [{ name: 'Gelida', climates: ['frozen'] }, { name: 'Verde', climates: ['temperate', 'jungle'] }];
    const k = await boot(files({ ...DEFAULT_NATURE, geography: 'void', sky: 'stars', planets }));
    const ice = census(k, 2, 1, planetPlace(1, S));
    const green = census(k, 2, 1, planetPlace(2, S));
    const land = (c: Record<string, number>) => Object.entries(c).filter(([code]) => !'owprk'.includes(code)).reduce((a, [, n]) => a + n, 0);
    expect(ice.n).toBeGreaterThan(land(ice) * 0.6);
    expect(ice.g ?? 0).toBe(0);
    expect(green.n ?? 0).toBe(0);
    // The globe seen from space says the same.
    const tiles = Array.from({ length: 40 }, (_, i) => k.planetTile(1, 30 + i * 3, -20 + i));
    expect(tiles.filter((c) => c === 'g')).toHaveLength(0);
  }, 60_000);

  it('il pavimento del kernel: un generatore che dà neve dappertutto, nel Far West dà prateria', async () => {
    const logic = 'local M = {}\nfunction M.generate_chunk(cx, cy, seed, size) return string.rep("n", size * size) end\nreturn M\n';
    const western = await boot(files({ ...DEFAULT_NATURE }, theme('western'), logic));
    const valmora = await boot(files({ ...DEFAULT_NATURE }, undefined, logic));
    expect(new Set(western.placeDraft(3, 3).join(''))).toEqual(new Set(['g']));
    expect(new Set(valmora.placeDraft(3, 3).join(''))).toEqual(new Set(['n']));
  }, 60_000);

  it('un ambiente che scrive la neve non si offre ai luoghi nuovi di un mondo senza neve, e uno nuovo così non si prende', async () => {
    const western = await boot(files({ ...DEFAULT_NATURE }, theme('western')));
    const valmora = await boot(files({ ...DEFAULT_NATURE }));
    const mountains = valmora.content.layouts.mountains?.program;
    expect(mountains).toBeDefined();
    expect(valmora.offClimateWrites(mountains)).toEqual([]);
    expect(western.offClimateWrites(mountains)).toEqual(['n']);
    expect(western.offClimateWrites(valmora.content.layouts.woods?.program)).toEqual([]);
    // The Genesis tells the Cartographer that n is another ground of this world.
    expect(baseCodesFor(false, ['temperate', 'desert']).n.meaning).toMatch(/no snow/);
    expect(baseCodesFor(false).n.meaning).toMatch(/snow/);
    expect(baseCodesFor(false, ['temperate', 'desert']).n.layer).toBe('ground');
  }, 60_000);

  it('un piano di prima tiene la bozza su cui è stato fatto; un piano nuovo dice i climi', async () => {
    const valmora = await boot(files({ ...DEFAULT_NATURE }));
    // A place whose draft of before has snow, on land.
    let at: [number, number] | undefined;
    for (let r = 4; r < 14 && !at; r++)
      for (const [cx, cy] of [[r, 0], [0, -r], [-r, 0], [0, r], [r, -r], [-r, -r]] as Array<[number, number]>) {
        const d = valmora.placeDraft(cx, cy).join('');
        if ([...d].filter((c) => c === 'n').length > 40 && [...d].filter((c) => c === 'o').length < 40) {
          at = [cx, cy];
          break;
        }
      }
    expect(at).toBeDefined();
    const [cx, cy] = at!;
    const plan = (mark: boolean): ChunkPlan => ({ place: { name: 'Luogo di prova', description: 'un luogo' }, layout: 'woods', objects: [], ground: [], fresh: [], runes: [], vpt: 16, swim: true, strataDepth: 6, ...(mark ? { climates: true } : {}) });
    const store = (mark: boolean): ChunkStore & { keys: string[] } => {
      const keys: string[] = [];
      return {
        keys,
        async load(key) {
          keys.push(key);
          return key.endsWith(`:${cx},${cy}`) ? ({ plan: plan(mark) } as ChunkRecord) : undefined;
        },
        async save() {},
        async clear() {},
      };
    };
    const draftOf = async (mark: boolean) => {
      const k = await boot(files({ ...DEFAULT_NATURE }, theme('western')), store(mark));
      expect(await k.planAhead(cx, cy)).toBe('noto');
      return k.chunkAt(cx * S + 1, cy * S + 1)!.draft;
    };
    expect([...(await draftOf(false))].filter((c) => c === 'n').length).toBeGreaterThan(40);
    expect([...(await draftOf(true))].filter((c) => c === 'n')).toHaveLength(0);
  }, 60_000);
});
