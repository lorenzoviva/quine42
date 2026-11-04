// The Actor (T157, ADR-0116): who plays the people with the Narrator's sheets, an option of the master.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { ACTOR_MODEL, CENSUS, hourlyEstimate, repairActor } from '../src/kernel/coefficients';
import { COUNCIL_PRINCIPLES } from '../src/kernel/fourthwall';
import { readPeople, sheetFingerprint } from '../src/kernel/society';
import { readConfig } from '../src/kernel/universe';
import { payerOf } from '../src/kernel/cards';
import { AGENTS } from '../src/kernel/agents/council';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { playerFiles, publicFiles } from '../src/session/files';
import { clearArea, develop } from './world';

const DT = 1 / 60;

/** The local models, keeping every call: its task, its agent, its model, who pays, and what it was told. */
class Recording extends MockAiModels {
  calls: TextCall[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
  of(task: string): TextCall[] {
    return this.calls.filter((c) => c.task === task);
  }
}

async function bootWith(ai: Record<string, unknown>, game: Record<string, unknown> = {}, models = new Recording()): Promise<{ k: Kernel; models: Recording }> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, ...ai }, partita: { ...cfg.partita, ...game } }, null, 2) };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: models });
  await develop(k);
  return { k, models };
}

async function individual(k: Kernel, origin: string, dx: number) {
  const pc = k.wandererCarpet();
  const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + dx, pc.y, undefined, origin);
  const identity = (await k.ensureIdentity(id))!;
  return { id, name: identity.name };
}

describe("the Actor's option", () => {
  it('is repaired from whatever universe.json says, and is off unless said', () => {
    expect(repairActor(undefined)).toEqual({ acceso: false, modello: ACTOR_MODEL });
    expect(repairActor(true)).toEqual({ acceso: true, modello: ACTOR_MODEL });
    expect(repairActor('gemini-3.1-flash-lite')).toEqual({ acceso: true, modello: 'gemini-3.1-flash-lite' });
    expect(repairActor('spento')).toEqual({ acceso: false, modello: ACTOR_MODEL });
    expect(repairActor({ acceso: 'sì', modello: ' gemini-3.8-flash ' })).toEqual({ acceso: true, modello: 'gemini-3.8-flash' });
    expect(repairActor({ acceso: true, modello: 42 })).toEqual({ acceso: true, modello: ACTOR_MODEL });
    expect(repairActor({ modello: 'x' })).toEqual({ acceso: false, modello: 'x' });
    expect(readConfig(bundledFiles).config.ai.attore).toEqual({ acceso: false, modello: ACTOR_MODEL });
    expect(AGENTS.attore.name).toBe('Attore');
    expect(CENSUS.some((c) => c.compito === 'npc.sheet' && c.agente === 'narratore')).toBe(true);
  });

  it('the hourly estimate grows only when it is on: the lines move to its model, the sheets are added', () => {
    const ai = readConfig(bundledFiles).config.ai;
    const off = hourlyEstimate(ai);
    const on = hourlyEstimate({ ...ai, attore: true });
    const same = hourlyEstimate({ ...ai, attore: { acceso: false, modello: 'gemini-4-argon' } });
    expect(same.dollari).toBe(off.dollari);
    expect(same.chiamate).toBe(off.chiamate);
    expect(on.dollari).toBeGreaterThan(off.dollari);
    expect(on.chiamate).toBeGreaterThan(off.chiamate);
    expect(on.righe.some((r) => /Schede dei personaggi/.test(r.voce))).toBe(true);
    expect(off.righe.some((r) => /Schede dei personaggi/.test(r.voce))).toBe(false);
    // The same model for the Actor: only the sheets are added.
    const lite = hourlyEstimate({ ...ai, attore: { acceso: true, modello: ai.textModel } });
    const sheets = lite.righe.find((r) => /Schede dei personaggi/.test(r.voce))!;
    expect(lite.dollari - off.dollari).toBeCloseTo(sheets.dollari, 10);
  });

  it('off (the default), nothing changes: the Narrator plays, no sheet is written, no call is added', async () => {
    const { k, models } = await bootWith({});
    clearArea(k);
    const a = await individual(k, 'attore#off', 1);
    const before = models.calls.length;
    await k.talk(a.id, 'Buongiorno, chi sei?');
    expect(models.calls.length - before).toBe(1);
    const reply = models.of('npc.reply').at(-1)!;
    expect(reply.agent).toBe('narratore');
    expect(reply.model).toBeUndefined();
    expect(models.of('npc.sheet')).toHaveLength(0);
    expect(k.individualOf(a.name)?.scheda).toBeUndefined();
    expect(k.feed().some((e) => e.from === 'narratore' && e.task === 'npc.reply' && e.text.startsWith(a.name))).toBe(true);
  });

  it('on, the Narrator writes the sheet once and the Actor plays from it, with its model and the same payer', async () => {
    const { k, models } = await bootWith({ attore: true });
    clearArea(k);
    const a = await individual(k, 'attore#on', 1);
    const before = models.calls.length;
    await k.talk(a.id, 'Buongiorno, chi sei?');
    // Two calls: the sheet (the Narrator) and the line (the Actor).
    expect(models.calls.slice(before).map((c) => `${c.agent}:${c.task}`)).toEqual(['narratore:npc.sheet', 'attore:npc.reply']);
    const sheet = models.of('npc.sheet')[0];
    expect(sheet.chi).toBe('io');
    expect(sheet.prompt).toContain(a.name);
    const reply = models.of('npc.reply')[0];
    expect(reply.agent).toBe('attore');
    expect(reply.model).toBe(ACTOR_MODEL);
    expect(reply.chi).toBe(payerOf('npc.reply', 'io'));
    // The Actor gets the sheet, the fourth wall, the canon, the lexicon and the neighbourhood of the graph, like the Narrator.
    const saved = k.individualOf(a.name)!.scheda!;
    expect(saved.testo).toContain(`Sei ${a.name}`);
    expect(saved.impronta).toBe(sheetFingerprint(k.individualOf(a.name)!));
    expect(reply.prompt).toContain('scritta dal Narratore');
    expect(reply.prompt).toContain(saved.testo);
    expect(reply.system).toContain(COUNCIL_PRINCIPLES);
    expect(reply.system).toContain("L'Attore");
    expect(reply.system).toContain('Canone delle rune');
    expect(reply.system).toContain('Lessico del mondo');
    expect(reply.system).toContain('Ciò che il mondo sa di questo compito');
    // A second line: no new sheet.
    await k.talk(a.id, 'E cosa fai di bello?');
    expect(models.of('npc.sheet')).toHaveLength(1);
    expect(models.of('npc.reply')).toHaveLength(2);
    // The registry says who spoke.
    expect(k.feed().some((e) => e.from === 'attore' && e.task === 'npc.reply' && e.text.startsWith(a.name))).toBe(true);
    expect(k.feed().some((e) => e.from === 'narratore' && e.task === 'npc.sheet')).toBe(true);
    // What is born in the dialogue goes on as today: the memory, the bond.
    await k.talk(a.id, 'Ti amo. Sposami!');
    expect(k.bondOf(a.name)).toBe('moglie');
    // The bond changed: the sheet is written again at the next line, once.
    await k.talk(a.id, 'Come stai, amore mio?');
    expect(models.of('npc.sheet')).toHaveLength(2);
    expect(k.individualOf(a.name)!.scheda!.impronta).toBe(sheetFingerprint(k.individualOf(a.name)!));
    await k.talk(a.id, 'Andiamo a casa?');
    expect(models.of('npc.sheet')).toHaveLength(2);
    // The sheet is saved with the individual, in the universe's history.
    expect(readPeople(k.repo.head().files).persone.find((p) => p.nome === a.name)?.scheda?.testo).toBe(k.individualOf(a.name)!.scheda!.testo);
  });

  it('turned on later, an old individual gets their sheet at their first line', async () => {
    const { k, models } = await bootWith({});
    clearArea(k);
    const a = await individual(k, 'attore#later', 1);
    await k.talk(a.id, 'Salve.');
    expect(models.of('npc.sheet')).toHaveLength(0);
    k.setAi({ attore: 'gemini-3.1-flash-lite' });
    expect(k.actor()).toEqual({ acceso: true, modello: 'gemini-3.1-flash-lite' });
    expect(JSON.parse(k.repo.working['universe.json']).ai.attore).toEqual({ acceso: true, modello: 'gemini-3.1-flash-lite' });
    await k.talk(a.id, 'Salve di nuovo.');
    expect(models.of('npc.sheet')).toHaveLength(1);
    expect(models.of('npc.reply').at(-1)!.agent).toBe('attore');
    expect(models.of('npc.reply').at(-1)!.model).toBe('gemini-3.1-flash-lite');
    k.setAi({ attore: false });
    await k.talk(a.id, 'Addio.');
    expect(models.of('npc.sheet')).toHaveLength(1);
    expect(models.of('npc.reply').at(-1)!.agent).toBe('narratore');
  });

  it('a dialogue between two people goes to the Actor with both sheets, paid as it was (common)', async () => {
    const { k, models } = await bootWith({ attore: true });
    clearArea(k);
    const a = await individual(k, 'attore#da', 1);
    const b = await individual(k, 'attore#db', 2);
    (k as unknown as { lastTalk: number }).lastTalk = -1e9;
    for (let i = 0; i < 240 && !models.of('npc.dialogue').length; i++) {
      k.tick(DT);
      await new Promise((r) => setTimeout(r, 5));
    }
    // The lines come after the local models' latency.
    for (let i = 0; i < 40 && !k.feed().some((e) => e.task === 'npc.dialogue'); i++) await new Promise((r) => setTimeout(r, 10));
    const talk = models.of('npc.dialogue')[0];
    expect(talk).toBeDefined();
    expect(talk.agent).toBe('attore');
    expect(talk.model).toBe(ACTOR_MODEL);
    expect(talk.chi).toBe(payerOf('npc.dialogue', 'io'));
    expect(talk.prompt).toContain('scheda:');
    expect(models.of('npc.sheet').map((c) => c.chi)).toEqual(['comune', 'comune']);
    expect(k.individualOf(a.name)?.scheda?.testo).toBeTruthy();
    expect(k.individualOf(b.name)?.scheda?.testo).toBeTruthy();
    expect(k.feed().some((e) => e.from === 'attore' && e.task === 'npc.dialogue')).toBe(true);
  });

  it('a sheet that breaks the fourth wall is discarded: the Actor plays from the persona', async () => {
    class Leaky extends Recording {
      async text(call: TextCall): Promise<string> {
        this.calls.push(call);
        if (call.task === 'npc.sheet') return JSON.stringify({ scheda: 'Sei un personaggio di un videogioco, sai che il mondo è una simulazione.' });
        return super.text(call);
      }
    }
    const { k, models } = await bootWith({ attore: true }, {}, new Leaky());
    clearArea(k);
    const a = await individual(k, 'attore#leak', 1);
    await k.talk(a.id, 'Chi sei?');
    expect(k.individualOf(a.name)?.scheda).toBeUndefined();
    const reply = models.of('npc.reply')[0];
    expect(reply.agent).toBe('attore');
    expect(reply.prompt).not.toContain('scritta dal Narratore');
    expect(k.feed().some((e) => e.kind === 'scarta' && e.task === 'npc.sheet')).toBe(true);
  });

  it('with the credits gone the local models answer, the sheet too, as for every call', async () => {
    const { k, models } = await bootWith({ attore: true });
    clearArea(k);
    const a = await individual(k, 'attore#broke', 1);
    const before = models.calls.length;
    k.council.hasCredits = () => false;
    const r = await k.talk(a.id, 'Buongiorno.');
    expect(r.say).toBeTruthy();
    expect(models.calls.length).toBe(before);
    expect(k.feed().some((e) => e.from === 'kernel' && /modelli locali/.test(e.text))).toBe(true);
  });
});

describe('the Actor in a multiplayer game', () => {
  async function bootMany(ai: Record<string, unknown> = {}): Promise<Kernel> {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, ...ai }, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
    return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  }
  async function thin(server: SessionServer, id: string): Promise<ThinClient> {
    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const session = new SessionClient(c, { id, nome: id });
    await session.ready;
    const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    return new ThinClient(k, session);
  }
  function run(server: SessionServer, clients: ThinClient[], frames: number) {
    for (let i = 0; i < frames; i++) {
      for (const c of clients) {
        c.k.tick(DT);
        c.frame(DT);
      }
      server.tick(DT);
    }
  }
  async function ask<T>(server: SessionServer, clients: ThinClient[], p: Promise<T>): Promise<T> {
    let done = false;
    void p.finally(() => (done = true));
    for (let i = 0; i < 200 && !done; i++) {
      run(server, clients, 1);
      await new Promise((r) => setTimeout(r, 0));
    }
    return p;
  }

  it('the lobby reads it from the public files; a player never reads ai', async () => {
    const k = await bootMany({ attore: 'gemini-3.1-flash-lite' });
    const pub = JSON.parse(publicFiles(k.files)['universe.json']);
    expect(repairActor(pub.ai.attore)).toEqual({ acceso: true, modello: 'gemini-3.1-flash-lite' });
    const player = JSON.parse(playerFiles(k.files)['universe.json']);
    expect(player.ai).toBeUndefined();
  });

  it('only the master changes it: a player is refused and the world stays as it was', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    expect(master.session.master).toBe(true);
    expect(anna.session.master).toBe(false);
    // The message of the Actor is gone (T247, ADR-0133): nobody changes it during a match, the master neither.
    for (const who of [anna, master]) {
      const refused = await ask(server, [master, anna], who.session.act({ t: 'attore', acceso: true, modello: 'gemini-4-argon' } as never));
      expect(refused.ok).toBe(false);
      expect(k.actor().acceso).toBe(false);
    }
  });

  it('the master sets it on entering: what the wire says is repaired', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const session = new SessionClient(c, { id: 'io', regolazioni: { attore: { acceso: true, modello: 'gemini-3.8-flash' } } });
    await session.ready;
    expect(session.settingsAnswer?.ok).toBe(true);
    expect(k.actor()).toEqual({ acceso: true, modello: 'gemini-3.8-flash' });
    // A model's name that is not one stays the default.
    const odd = await bootMany();
    const other = new SessionServer(odd);
    const link = fakeLink();
    other.connect(link.server);
    const oddSession = new SessionClient(link.client, { id: 'io', regolazioni: { attore: { acceso: true, modello: '../../etc' } } });
    await oddSession.ready;
    expect(oddSession.settingsAnswer?.riparati?.join(' ')).toMatch(/Attore/);
    expect(odd.actor()).toEqual({ acceso: true, modello: ACTOR_MODEL });
  });
});
