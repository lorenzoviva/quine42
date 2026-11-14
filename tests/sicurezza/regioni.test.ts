// V-041 (T375, ADR-0201): the regions of the master. Only the master declares or lets one go, in the kernel and on the wire (with the pace of
// `pace`); what the wire says is checked field by field and the atlas does not change when it does not hold; the players' clients do not read
// the regions the master holds nor what a region of the master does; a filler region makes nobody pay. Fake values only.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../../src/kernel/ai/mock';
import type { TextCall } from '../../src/kernel/ai/models';
import { ATLAS_FILE, readAtlas } from '../../src/kernel/atlas';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { fakeLink } from '../../src/session/protocol';
import { LIMITS, SessionServer } from '../../src/session/server';
import { SessionClient } from '../../src/session/client';
import { playerFiles } from '../../src/session/files';

class Counting extends MockAiModels {
  calls = 0;
  async text(call: TextCall): Promise<string> {
    this.calls++;
    return super.text(call);
  }
}

async function bootMany(models = new MockAiModels()): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: models });
}

async function asked<T>(server: SessionServer, p: Promise<T>): Promise<T> {
  let done = false;
  void p.finally(() => (done = true));
  for (let i = 0; i < 200 && !done; i++) {
    server.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 5));
  }
  return p;
}

function link(server: SessionServer, id: string): SessionClient {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  return new SessionClient(c, { id });
}

const sea = { name: 'Il Mare Grigio', center: [14, 0], radius: 2, kind: 'filler', environment: 'lake' };
const mine = (k: Kernel) => readAtlas(k.files).regions.filter((r) => r.master);

describe('V-041 le regioni del master', () => {
  it('V-041 solo il master dichiara e libera una regione, nel kernel e sul filo', async () => {
    const k = await bootMany();
    expect((await k.declareRegion(sea, 'anna')).ok).toBe(false);
    const server = new SessionServer(k);
    const master = link(server, 'me');
    const anna = link(server, 'anna');
    await asked(server, Promise.all([master.ready, anna.ready]));
    expect((await asked(server, anna.act({ t: 'region', op: 'declare', region: sea as never }))).ok).toBe(false);
    expect(mine(k)).toEqual([]);
    const yes = await asked(server, master.act({ t: 'region', op: 'declare', region: sea as never }));
    expect(yes.ok).toBe(true);
    const id = JSON.parse(yes.text!).id;
    expect((await asked(server, anna.act({ t: 'region', op: 'release', id }))).ok).toBe(false);
    expect((await k.releaseRegion(id, 'anna')).ok).toBe(false);
    expect(mine(k)).toHaveLength(1);
    // A region of the Cartographer is never the master's to change or let go.
    const theirs = readAtlas(k.files).regions.find((r) => !r.master)!;
    expect((await asked(server, master.act({ t: 'region', op: 'release', id: theirs.id }))).ok).toBe(false);
    expect((await asked(server, master.act({ t: 'region', op: 'declare', region: { ...sea, id: theirs.id } as never }))).ok).toBe(false);
  });

  it('V-041 ciò che arriva dal filo si controlla campo per campo, e l’atlante non cambia quando non regge', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = link(server, 'me');
    await asked(server, master.ready);
    const before = k.files[ATLAS_FILE];
    const odd: unknown[] = [
      { ...sea, name: '<script>x</script>' },
      { ...sea, name: 'x'.repeat(5000) },
      { ...sea, description: 'oltre la simulazione' },
      { ...sea, center: [1e9, 0] },
      { ...sea, center: { 0: 1, 1: 2 } },
      { ...sea, radius: 1e6 },
      { ...sea, kind: 'mare' },
      { ...sea, environment: '__proto__' },
      { ...sea, environment: 'constructor' },
      { ...sea, center: [0, 0] },
      'mare',
      null,
    ];
    for (const region of odd) {
      const r = await asked(server, master.act({ t: 'region', op: 'declare', region: region as never }));
      expect(r.ok, JSON.stringify(region)?.slice(0, 60)).toBe(false);
      // The pace of the master's commands: wait for it, the refusals here are the kernel's.
      for (let i = 0; i < 400; i++) server.tick(1 / 60);
    }
    expect(k.files[ATLAS_FILE]).toBe(before);
    expect((await asked(server, master.act({ t: 'region', op: 'nuke' } as never))).ok).toBe(false);
  });

  it('V-041 ha il ritmo dei comandi del master: oltre il colpo, il server rifiuta', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = link(server, 'me');
    await asked(server, master.ready);
    const answers = await asked(server, Promise.all(Array.from({ length: LIMITS.paceBurst + 2 }, (_, i) => master.act({ t: 'region', op: 'declare', region: { ...sea, center: [20 + i, 0], radius: 0 } as never }))));
    expect(answers.filter((a) => a.ok).length).toBe(LIMITS.paceBurst);
    expect(mine(k)).toHaveLength(LIMITS.paceBurst);
  });

  it('V-041 i client dei giocatori non leggono le regioni trattenute né che cosa fa una regione del master', async () => {
    const k = await bootMany();
    expect((await k.declareRegion({ name: 'La Valle Taciuta', center: [-12, 3], radius: 1, kind: 'held' }, k.masterId())).ok).toBe(true);
    expect((await k.declareRegion(sea, k.masterId())).ok).toBe(true);
    const shown = playerFiles(k.files)[ATLAS_FILE];
    expect(shown).not.toMatch(/Valle Taciuta/);
    expect(shown).not.toMatch(/"kind"|"master"/);
    expect(shown).toMatch(/Il Mare Grigio/);
  });

  it('V-041 un riempitivo non fa pagare nessuno: i suoi luoghi nascono senza chiamate', async () => {
    const models = new Counting();
    const k = await bootMany(models);
    const server = new SessionServer(k);
    const anna = link(server, 'anna');
    await asked(server, anna.ready);
    expect((await k.declareRegion(sea, k.masterId())).ok).toBe(true);
    for (let i = 0; i < 80; i++) {
      server.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 10));
    }
    const before = models.calls;
    k.as('anna', () => {
      const p = k.wandererPos();
      Object.assign(k.carpet()!, { ox: 14 * 18 + 9 - p.x, oy: 9 - p.y });
    });
    for (let i = 0; i < 120 && k.chunks.get('14,0')?.stage !== 'planned'; i++) {
      server.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(k.chunks.get('14,0')?.stage).toBe('planned');
    expect(models.calls).toBe(before);
  }, 60_000);
});
