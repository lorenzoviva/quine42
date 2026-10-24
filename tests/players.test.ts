import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { playerFiles, SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';

const DT = 1 / 60;

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

/** A client of the session, with everything the server ever sent it. */
function join(server: SessionServer, id: string): { client: SessionClient; heard: ServerMsg[] } {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const heard: ServerMsg[] = [];
  c.onMessage((m) => heard.push(m));
  return { client: new SessionClient(c, { id }), heard };
}

describe('the player’s client, without corona nor Council (T41)', () => {
  it('a player gets only what a client draws and walks with', async () => {
    const k = await bootMany();
    const files = playerFiles(k.files);
    const paths = Object.keys(files);
    // The studio's files stay on the server: prompts, bible, style, canon, people, plots, rules, graph, cards, costs, wanderers.
    expect(paths.some((p) => p.startsWith('prompts/'))).toBe(false);
    expect(paths.filter((p) => p.startsWith('world/'))).toEqual(paths.filter((p) => p === 'world/atlas.json' || p === 'world/rilievo.xml'));
    // Of the code, only the systems the client runs itself.
    expect(paths.filter((p) => p.endsWith('.lua')).sort()).toEqual(['modules/core.carpet/logic.lua', 'modules/core.movement/logic.lua']);
    for (const p of paths.filter((p) => p.endsWith('manifest.json'))) {
      const m = JSON.parse(files[p]);
      expect(m.casi).toBeUndefined();
      if (m.logic) expect(files[p.replace('manifest.json', m.logic)]).toBeDefined();
    }
    expect(paths.filter((p) => p.startsWith('models/')).length).toBe(Object.keys(k.files).filter((p) => p.startsWith('models/')).length);
    // A mirror booted on them is whole: no fault, every module, the same content.
    const mirror = await Kernel.boot({ files, store: memoryStore(), models: new MockModels(), mirror: true });
    expect(mirror.faults.size).toBe(0);
    expect([...mirror.modules.keys()].sort()).toEqual([...k.modules.keys()].sort());
    expect(Object.keys(mirror.content.items).length).toBe(Object.keys(k.content.items).length);
  });

  it('the Council speaks to the master only', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    k.council.say('narratore', 'info', 'prima della partita: la bibbia è pronta');
    const master = join(server, 'io');
    const anna = join(server, 'anna');
    await Promise.all([master.client.ready, anna.client.ready]);
    expect(master.client.master).toBe(true);
    expect(anna.client.master).toBe(false);
    // Coming in: the master hears what was said so far and gets every file; the player neither.
    expect(master.client.feed.map((e) => e.text)).toContain('prima della partita: la bibbia è pronta');
    expect(Object.keys(master.client.files).length).toBe(Object.keys(k.files).length);
    expect(anna.client.feed).toEqual([]);
    expect(anna.client.files['world/bible.json']).toBeUndefined();
    // While they play: the Council at work is heard by the master, never by the player.
    k.council.say('cartografo', 'propone', 'un luogo nuovo a nord, con un pozzo');
    for (let i = 0; i < 12; i++) server.tick(DT);
    expect(master.heard.some((m) => m.t === 'concilio' && m.voci.some((e) => e.text === 'un luogo nuovo a nord, con un pozzo'))).toBe(true);
    expect(anna.heard.some((m) => m.t === 'concilio')).toBe(false);
    const wire = JSON.stringify(anna.heard);
    expect(wire).not.toContain('un luogo nuovo a nord');
    expect(wire).not.toContain('la bibbia è pronta');
    const came = anna.heard.find((m) => m.t === 'ingresso');
    expect(came?.t === 'ingresso' && Object.keys(came.files).sort()).toEqual(Object.keys(playerFiles(k.files)).sort());
  });

  it('the master’s mirror hears the Council: its feed, as alone', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const { client } = join(server, 'io');
    await client.ready;
    const mirror = await Kernel.boot({ files: client.files, store: memoryStore(), models: new MockModels(), mirror: true });
    const thin = new ThinClient(mirror, client);
    const seen: string[] = [];
    mirror.bus.on('council', (e: { text: string }) => seen.push(e.text));
    k.council.say('scultore', 'scolpisce', 'il pozzo ha un programma suo');
    for (let i = 0; i < 12; i++) server.tick(DT);
    expect(thin.k.feed().map((e) => e.text)).toContain('il pozzo ha un programma suo');
    expect(seen).toEqual(['il pozzo ha un programma suo']);
  });
});
