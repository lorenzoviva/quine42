// The regions of the master (T375, ADR-0188 §5, ADR-0201, D54.6): a filler region repeats an environment the world has on its new places without
// any call to the Council; a held region keeps them drafts until it is let go; only the master declares them, on the wire too; the players'
// clients do not read what the master holds.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { ATLAS_FILE, MASTER_REGION_LIMITS, masterRegion, readAtlas, regionAt, regionKind, withoutMasterRegion, type Atlas } from '../src/kernel/atlas';
import { situation } from '../src/kernel/situation';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { playerChanges, playerFiles } from '../src/session/files';

const DT = 1 / 60;
const S = 18;
const middleOf = (cx: number, cy: number) => ({ x: cx * S + S / 2, y: cy * S + S / 2 });

/** The local models, writing down every call: what, and for a plan where. */
class Recording extends MockAiModels {
  calls: string[] = [];
  plans: string[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call.task ?? '?');
    if (call.task === 'chunk.plan') {
      const d = call.data as { cx: number; cy: number };
      this.plans.push(`${d.cx},${d.cy}`);
    }
    return super.text(call);
  }
}

async function boot(many = true): Promise<{ k: Kernel; models: Recording }> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const game = many ? { mode: 'multiplayer', death: 3 } : cfg.game;
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game }, null, 2) };
  const models = new Recording();
  const k = await Kernel.boot({ files, store: memoryStore(), ai: models });
  k.giveCredits('me', 100);
  return { k, models };
}

async function run(server: SessionServer, rounds: number) {
  for (let i = 0; i < rounds; i++) {
    server.tick(DT);
    await new Promise((r) => setTimeout(r, 15));
  }
}

function join(server: SessionServer, id: string): SessionClient {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  server.kernel.giveCredits(id, 100);
  return new SessionClient(c, { id });
}

async function asked<T>(server: SessionServer, p: Promise<T>): Promise<T> {
  let done = false;
  void p.finally(() => (done = true));
  for (let i = 0; i < 200 && !done; i++) await run(server, 1);
  return p;
}

function put(k: Kernel, id: string, to: { x: number; y: number }) {
  k.as(id, () => {
    const p = k.wandererPos();
    Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  });
}

/** Ticks until the place is planned (or the rounds end). */
async function until(server: SessionServer, key: string, rounds = 120) {
  for (let i = 0; i < rounds && server.kernel.chunks.get(key)?.stage !== 'planned'; i++) await run(server, 1);
}

const ENVS = { desert: {}, woods: {}, lake: {} };
const desert = { name: 'Le Dune Lente', description: 'sabbia fino a dove arriva lo sguardo', center: [12, 0], radius: 2, kind: 'filler', environment: 'desert' };

describe('le regioni del master, funzioni pure (T375)', () => {
  it('una regione dichiarata passa dai controlli: testi di un giocatore, quarta parete, centro, raggio, ambiente del mondo, non sul primo luogo', () => {
    const atlas: Atlas = { regions: [] };
    const ok = masterRegion(atlas, desert, ENVS);
    expect('region' in ok && ok.region).toEqual({ id: 'master-1', name: 'Le Dune Lente', description: 'sabbia fino a dove arriva lo sguardo', environment: 'desert', center: [12, 0], radius: 2, master: true, kind: 'filler' });
    const no = (raw: unknown) => {
      const r = masterRegion(atlas, raw, ENVS);
      return 'errors' in r ? r.errors : [];
    };
    expect(no({ ...desert, environment: 'sea' }).join()).toMatch(/ambiente/);
    expect(no({ ...desert, kind: 'mare' }).join()).toMatch(/tipo/);
    expect(no({ ...desert, radius: MASTER_REGION_LIMITS.radius + 1 }).join()).toMatch(/raggio/);
    expect(no({ ...desert, radius: 1.5 }).join()).toMatch(/raggio/);
    expect(no({ ...desert, center: [1e6, 0] }).join()).toMatch(/centro/);
    expect(no({ ...desert, center: ['1', 0] }).join()).toMatch(/centro/);
    expect(no({ ...desert, center: [1, 1], radius: 2 }).join()).toMatch(/primo luogo/);
    expect(no({ ...desert, name: '<b>x</b>' }).join()).toMatch(/nome/);
    expect(no({ ...desert, name: 'x'.repeat(MASTER_REGION_LIMITS.name + 1) }).join()).toMatch(/nome/);
    // The fourth wall (rule 0): the name and the description are read by the people too.
    expect(no({ ...desert, description: 'qui finisce la simulazione' }).length).toBeGreaterThan(0);
    expect(no('mare').length).toBeGreaterThan(0);
    // Held needs no environment; any other kind does.
    expect('region' in masterRegion(atlas, { ...desert, kind: 'held', environment: '' }, ENVS)).toBe(true);
    expect(no({ ...desert, kind: 'plan', environment: '' }).join()).toMatch(/ambiente/);
  });

  it('cambia solo una regione del master, mai una del Cartografo; libera solo le sue; un tetto di regioni', () => {
    const atlas: Atlas = { regions: [{ id: 'desert', name: 'Deserto', description: '', environment: 'desert', center: [12, 0], radius: 2 }] };
    expect('errors' in masterRegion(atlas, { ...desert, id: 'desert' }, ENVS)).toBe(true);
    expect(withoutMasterRegion(atlas, 'desert')).toBeUndefined();
    const one = masterRegion(atlas, desert, ENVS);
    if (!('atlas' in one)) throw new Error('no');
    const changed = masterRegion(one.atlas, { ...desert, id: one.region.id, kind: 'held' }, ENVS);
    if (!('atlas' in changed)) throw new Error('no');
    expect(changed.atlas.regions).toHaveLength(2);
    expect(regionKind(changed.region)).toBe('held');
    expect(withoutMasterRegion(changed.atlas, one.region.id)!.atlas.regions).toEqual(atlas.regions);
    let full: Atlas = atlas;
    for (let i = 0; i < MASTER_REGION_LIMITS.regions; i++) {
      const r = masterRegion(full, { ...desert, center: [20 + i, 0], radius: 0 }, ENVS);
      if (!('atlas' in r)) throw new Error(r.errors.join());
      full = r.atlas;
    }
    expect('errors' in masterRegion(full, desert, ENVS)).toBe(true);
  });

  it('dove copre, la regione del master vince su quella del Cartografo; fra le sue la più vicina (un’isola nel mare)', () => {
    const atlas: Atlas = {
      regions: [
        { id: 'desert', name: 'Deserto', description: '', environment: 'desert', center: [12, 0], radius: 3 },
        { id: 'master-1', name: 'Mare', description: '', environment: 'lake', center: [15, 0], radius: 4, master: true, kind: 'filler' },
        { id: 'master-2', name: 'Isola', description: '', environment: 'woods', center: [17, 0], radius: 0, master: true },
      ],
    };
    expect(regionAt(atlas, 12, 0)?.id).toBe('master-1');
    expect(regionAt(atlas, 9, 0)?.id).toBe('desert');
    expect(regionAt(atlas, 17, 0)?.id).toBe('master-2');
    // Only a region of the master has a kind.
    expect(regionKind({ ...atlas.regions[0], kind: 'held' })).toBeUndefined();
  });

  it('i client dei giocatori non leggono le regioni trattenute né che cosa fa una regione del master', () => {
    const atlas: Atlas = {
      regions: [
        { id: 'desert', name: 'Deserto', description: 'sabbia', environment: 'desert', center: [12, 0], radius: 3 },
        { id: 'master-1', name: 'Le Dune', description: '', environment: 'desert', center: [20, 0], radius: 1, master: true, kind: 'filler' },
        { id: 'master-2', name: 'La valle segreta', description: 'la scrivo dopo', environment: '', center: [-9, 0], radius: 1, master: true, kind: 'held' },
      ],
    };
    const files = { [ATLAS_FILE]: JSON.stringify(atlas) };
    const shown = JSON.parse(playerFiles(files)[ATLAS_FILE]);
    expect(shown.regions.map((r: { id: string }) => r.id)).toEqual(['desert', 'master-1']);
    expect(shown.regions[1]).toEqual({ id: 'master-1', name: 'Le Dune', description: '', environment: 'desert', center: [20, 0], radius: 1 });
    expect(JSON.stringify(playerChanges(files, [ATLAS_FILE]))).not.toMatch(/segreta|held|master"/);
    expect(playerChanges({}, [ATLAS_FILE])).toEqual({ [ATLAS_FILE]: null });
  });

  it('il tavolo della situazione dice i luoghi trattenuti e il tipo delle regioni', () => {
    const atlas: Atlas = { regions: [{ id: 'master-1', name: 'Valle', description: '', environment: '', center: [5, 5], radius: 1, master: true, kind: 'held' }] };
    const s = situation({ atlas, plots: [], faults: [], wanderer: { cx: 0, cy: 0 }, chunks: [{ cx: 5, cy: 6, stage: 'draft' }, { cx: 9, cy: 9, stage: 'draft' }], locate: () => undefined, chunkSize: S });
    expect(s.regions[0].kind).toBe('held');
    const details = s.ops.filter((o) => o.kind === 'chunk').map((o) => o.detail);
    expect(details).toEqual(['trattenuto: la regione aspetta il master', 'in coda']);
  });
});

describe('le regioni del master nel kernel (T375)', () => {
  it('un luogo in una regione di riempitivo prende l’ambiente detto senza nessuna chiamata, e torna uguale', async () => {
    const { k, models } = await boot();
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    await anna.ready;
    await run(server, 30);
    expect((await k.declareRegion(desert, 'anna')).ok).toBe(false);
    const r = await k.declareRegion(desert, k.masterId());
    expect(r.ok).toBe(true);
    expect(readAtlas(k.files).regions.find((x) => x.master)).toMatchObject({ name: 'Le Dune Lente', kind: 'filler', environment: 'desert' });
    expect(k.repo.log()[0]?.message).toMatch(/Le Dune Lente/);
    // Let what is in flight around the first place finish, then walk into the region: nothing goes to the models for it.
    await run(server, 60);
    const before = models.calls.length;
    put(k, 'anna', middleOf(12, 0));
    await until(server, '12,0');
    const ch = k.chunks.get('12,0')!;
    expect(ch.stage).toBe('planned');
    expect(ch.plan).toMatchObject({ layout: 'desert', objects: [], ground: [], fresh: [], runes: [] });
    expect(ch.place?.name).toBe('Le Dune Lente');
    expect(ch.plan?.card).toBeUndefined();
    expect(models.plans).not.toContain('12,0');
    // The places of the region around it too, all without the Cartographer.
    await run(server, 60);
    const inside = [...k.chunks.values()].filter((c) => Math.max(Math.abs(c.cx - 12), Math.abs(c.cy)) <= 2);
    expect(inside.length).toBeGreaterThan(1);
    for (const c of inside) expect(models.plans).not.toContain(c.key);
    // Nothing at all went to the models: no plan, no thing, no rhythm of the world that exploring would beat.
    expect(models.calls.slice(before)).toEqual([]);
  }, 60_000);

  it('`trattenuta` resta bozza finché non si libera; poi il Cartografo la pianifica come il resto', async () => {
    const { k, models } = await boot();
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    await anna.ready;
    const held = await k.declareRegion({ name: 'La Valle Muta', center: [-10, 4], radius: 1, kind: 'held' }, k.masterId());
    expect(held.ok).toBe(true);
    if (!held.ok) return;
    await run(server, 60);
    put(k, 'anna', middleOf(-10, 4));
    for (let i = 0; i < 4; i++) {
      await run(server, 30);
      k.time += 70;
    }
    const ch = k.chunks.get('-10,4')!;
    expect(ch.stage).toBe('draft');
    expect(models.plans).not.toContain('-10,4');
    // The deferred generation does not plan it either.
    expect(await k.planAhead(-10, 5)).toBe('no');
    // Let go: planned as the rest of the world, the place where the player is first.
    const free = await k.releaseRegion(held.region.id, k.masterId());
    expect(free.ok).toBe(true);
    expect(readAtlas(k.files).regions.some((r) => r.master)).toBe(false);
    await until(server, '-10,4');
    expect(k.chunks.get('-10,4')!.stage).toBe('planned');
    expect(models.plans).toContain('-10,4');
  }, 60_000);

  it('un luogo già pianificato resta com’è; da soli la regione la dichiara il viandante, che è il master', async () => {
    const { k } = await boot(false);
    expect(k.manyPlayers()).toBe(false);
    const r = await k.declareRegion({ ...desert, center: [0, 9], radius: 0 });
    expect(r.ok).toBe(true);
    expect((await k.releaseRegion('desert')).ok).toBe(false);
  });
});

describe('le regioni del master sul filo (T375)', () => {
  it('solo il master le dichiara e le libera; i giocatori ricevono l’atlante senza ciò che trattiene', async () => {
    const { k } = await boot();
    const server = new SessionServer(k);
    const master = join(server, 'me');
    const anna = join(server, 'anna');
    await Promise.all([master.ready, anna.ready]);
    const no = await asked(server, anna.act({ t: 'region', op: 'declare', region: { ...desert, kind: 'filler' } as never }));
    expect(no.ok).toBe(false);
    expect(readAtlas(k.files).regions.some((r) => r.master)).toBe(false);
    const bad = await asked(server, master.act({ t: 'region', op: 'declare', region: { ...desert, environment: 'sea' } as never }));
    expect(bad.ok).toBe(false);
    expect(bad.reason).toMatch(/ambiente/);
    const yes = await asked(server, master.act({ t: 'region', op: 'declare', region: { name: 'La Valle Muta', center: [-10, 4], radius: 1, kind: 'held' } as never }));
    expect(yes.ok).toBe(true);
    const region = JSON.parse(yes.text!);
    expect(region).toMatchObject({ name: 'La Valle Muta', kind: 'held', master: true });
    await run(server, 6);
    // The master's client has the atlas as it is; a player's, without what the master holds.
    expect(readAtlas(master.files).regions.some((r) => r.id === region.id)).toBe(true);
    expect(anna.files[ATLAS_FILE] ?? '').not.toMatch(/Valle Muta/);
    const gone = await asked(server, anna.act({ t: 'region', op: 'release', id: region.id }));
    expect(gone.ok).toBe(false);
    const freed = await asked(server, master.act({ t: 'region', op: 'release', id: region.id }));
    expect(freed.ok).toBe(true);
    expect(readAtlas(k.files).regions.some((r) => r.master)).toBe(false);
  });
});
