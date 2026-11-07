// The cards that do not work in a world (T296, ADR-0172): a brought card that fails here (its program throws or stops its worker, makes
// nothing to see, does not stop a solid body, is silent) does not break the world. It is isolated (what wore it wears the generic model of
// its class, the sound is silent), shown to the master with the reason, and the master takes it away from the console with a commit; what
// used it goes back to the generic and to the directors, within their caps, and what the Council cannot make again is a shortfall.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readPrograms, SoundDirector, type SoundState } from '../src/audio/director';
import { tryPrepareSound, type PreparedSound } from '../src/audio/prepare';
import { SoundRenders, type SoundWorker } from '../src/audio/renders';
import type { SoundOut } from '../src/audio/sfx';
import { MockAiModels } from '../src/kernel/ai/mock';
import { broughtEntry, withBrought } from '../src/kernel/bring';
import { breakReason, broughtCardsOf, cardFamily, readBrokenCards, withoutCards, type BrokenCard } from '../src/kernel/brokencards';
import { bundledFiles } from '../src/kernel/bundle';
import { InlineRunner, type FormComp, type FormRequest, type FormResult, type FormRunner, type ModelInfo } from '../src/kernel/forms';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore, type KeyValueStore } from '../src/kernel/repo';
import { readShortfalls, SHORTFALLS_FILE } from '../src/kernel/shortfalls';
import type { FileMap } from '../src/kernel/types';
import { MemoryFormStore, WorkerRunner } from '../src/render/forms';
import { SessionClient } from '../src/session/client';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { ThinClient } from '../src/session/thin';
import { SOUND_CLASS } from '../src/mj/sound';

/** The ways a card breaks, each a program that passed the check where it came from and fails here. */
const PROGRAMS = {
  // A program that reads a file the universe it came into does not have (`<import>`, T333): it throws.
  fault: '<sequence values="BW" size="20 20 20"><import file="manca"/></sequence>',
  // It runs and ends, with nothing one sees.
  empty: '<sequence values="BW" size="20 20 20"><one in="W" out="B"/></sequence>',
  // A rug where a chest should stand: something to see, nothing at body height.
  footless: '<sequence values="BW" size="20 20 20"><box at="0 0 0" size="20 20 1" color="W"/></sequence>',
  // A chest: it works.
  good: '<sequence values="BW" size="20 20 20"><box at="4 4 0" size="12 12 12" color="W"/></sequence>',
};
/** A piece of music whose every track is at volume zero: it plays silence. */
const MUTE = '<sequence values="BN" size="16 3 8"><sound bpm="100"><track y="0" instrument="lead" volume="0"/></sound><box at="0 0 2" size="16 1 1" color="N"/></sequence>';

interface CardSpec {
  id: string;
  xml: string;
  name?: string;
  kind?: 'model' | 'sound';
  sound?: unknown;
  /** A solid thing of the world that wears it. */
  module?: string;
  /** Other ids under which the same card is in the library (as the ModelDirector copies a brought model, T295). */
  copies?: Array<{ id: string; module?: string }>;
}

const solid = (id: string, model: string, name: string) =>
  JSON.stringify({ id, name, kind: 'entity', version: '0.1.0', description: name, appearance: { model, class: 'furniture', glyph: 'o', color: '#a07040', look: name }, physics: { solid: true, radius: 0.45 } }, null, 2) + '\n';

/** A universe with brought cards (as the store makes them: `broughtEntry`, the master's card, a link more), the things that wear them, and a game. */
function universe(cards: CardSpec[], game?: Record<string, unknown>): FileMap {
  const files: FileMap = { ...bundledFiles };
  const entries: Record<string, ModelInfo> = {};
  for (const c of cards) {
    const name = c.name ?? `La carta ${c.id}`;
    const kind = c.kind ?? 'model';
    const entry = { class: kind === 'sound' ? SOUND_CLASS : 'furniture', name, card: { author: 'sculptor', payer: 'comune', holder: 'anna' }, ...(c.sound ? { sound: c.sound } : {}) };
    const made = broughtEntry({ kind, universe: 'alfa', id: c.id, entry, xml: c.xml, name }, game?.master === undefined ? 'me' : String(game.master));
    if ('error' in made) throw new Error(made.error);
    entries[c.id] = made.info;
    files[`models/${c.id}.xml`] = c.xml;
    if (c.module) files[`modules/${c.module}/manifest.json`] = solid(c.module, c.id, name);
    for (const copy of c.copies ?? []) {
      entries[copy.id] = { ...made.info };
      files[`models/${copy.id}.xml`] = c.xml;
      if (copy.module) files[`modules/${copy.module}/manifest.json`] = solid(copy.module, copy.id, name);
    }
  }
  files['models/index.json'] = withBrought(bundledFiles['models/index.json'], entries);
  if (game) files['universe.json'] = JSON.stringify({ ...JSON.parse(bundledFiles['universe.json']), game }, null, 2) + '\n';
  return files;
}

const boot = (files: FileMap, store: KeyValueStore = memoryStore(), opts: { forms?: FormRunner; ai?: MockAiModels } = {}) => Kernel.boot({ files, store, ai: opts.ai ?? new MockAiModels(), ...(opts.forms ? { forms: opts.forms } : {}) });

/** A clear patch of ground near the start, three tiles a side. */
function clear(k: Kernel): [number, number] {
  for (let r = 2; r <= 12; r++)
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        let ok = true;
        for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.2);
        if (ok) return [x + 0.5, y + 0.5];
      }
  throw new Error('nessun posto libero');
}

/** A thing of a module where there is room, and its form run (the kernel's way: `rebuildSolids` asks for it at the tick). */
async function place(k: Kernel, module: string, origin: string): Promise<number> {
  const [x, y] = clear(k);
  const id = k.spawnModuleEntity(k.modules.get(module)!, x, y, undefined, origin);
  for (let i = 0; i < 6; i++) {
    const fc = k.ecs.get(id, 'form') as FormComp;
    await k.forms.settled(fc.model, fc.seed, fc.tint);
    k.tick(1 / 60);
  }
  return id;
}

const ticks = (k: Kernel, n: number) => {
  for (let i = 0; i < n; i++) k.tick(1 / 60);
};

const otherFaults = (k: Kernel) => k.faults.list().filter((f) => !f.key.startsWith('card:'));

describe('ciò che si sa di una carta guasta senza il kernel (T296)', () => {
  const files = universe([{ id: 'botte', xml: PROGRAMS.good, copies: [{ id: 'npc-botte' }] }, { id: 'altra', xml: PROGRAMS.empty }]);

  it('la famiglia di una carta: le sue copie con lo stesso programma e la stessa provenienza, non le altre carte né il seme', () => {
    expect(cardFamily(files, 'botte')).toEqual(['botte', 'npc-botte']);
    expect(cardFamily(files, 'npc-botte')).toEqual(['npc-botte', 'botte']);
    expect(cardFamily(files, 'altra')).toEqual(['altra']);
    expect(cardFamily(files, 'pozzo')).toEqual([]);
    expect(cardFamily(files, 'nessuna')).toEqual([]);
  });

  it('togliere cambia solo i programmi e le loro voci; le altre voci restano come sono', () => {
    const out = withoutCards(files, ['botte', 'npc-botte']);
    expect(Object.keys(out).sort()).toEqual(['models/botte.xml', 'models/index.json', 'models/npc-botte.xml']);
    expect(out['models/botte.xml']).toBeNull();
    const before = JSON.parse(files['models/index.json']);
    const after = JSON.parse(out['models/index.json']!);
    expect(Object.keys(after)).toEqual(Object.keys(before).filter((id) => id !== 'botte' && id !== 'npc-botte'));
    for (const id of Object.keys(after)) expect(after[id]).toEqual(before[id]);
  });

  it('l’elenco della console: una riga per carta, le copie con lei, il motivo di quella che si è guastata', () => {
    const broken = new Map<string, BrokenCard>([
      ['npc-botte', { id: 'npc-botte', name: 'B', kind: 'model', why: 'empty', reason: breakReason('empty', { seed: 2 }) }],
      ['botte', { id: 'botte', name: 'B', kind: 'model', why: 'empty', reason: 'come npc-botte', same: 'npc-botte' }],
    ]);
    expect(broughtCardsOf(files, broken)).toEqual([
      { id: 'altra', name: 'La carta altra', kind: 'model', class: 'furniture', from: 'alfa', copies: [] },
      { id: 'botte', name: 'La carta botte', kind: 'model', class: 'furniture', from: 'alfa', copies: ['npc-botte'], broken: broken.get('npc-botte') },
    ]);
  });

  it('ciò che dice il filo si legge: ciò che non è una carta guasta resta fuori, i testi sono una riga', () => {
    expect(readBrokenCards('x')).toEqual([]);
    const hostile = [null, 3, { id: '../x', why: 'fault', kind: 'model' }, { id: 'a', why: 'boom', kind: 'model' }, { id: 'a', why: 'fault', kind: 'thing' }, { id: 'ok', why: 'mute', kind: 'sound', name: 'x\n<b>'.repeat(100), reason: 'r'.repeat(1000), same: 7 }];
    const [one, ...rest] = readBrokenCards(hostile);
    expect(rest).toEqual([]);
    expect(one).toMatchObject({ id: 'ok', why: 'mute', kind: 'sound' });
    expect(one.name).not.toMatch(/\n/);
    expect(one.name.length).toBeLessThanOrEqual(120);
    expect(one.reason.length).toBe(300);
    expect(one.same).toBeUndefined();
    expect(readBrokenCards(Array.from({ length: 500 }, (_, i) => ({ id: `c${i}`, why: 'fault', kind: 'model' })))).toHaveLength(64);
  });
});

describe('una carta guasta nel mondo, per ogni modo di guastarsi (T296)', () => {
  for (const why of ['fault', 'empty', 'footless'] as const) {
    it(`${why}: nessun crash, la cosa resta col modello generico, il master vede il motivo, la toglie con un commit, e dopo la riapertura non c’è più`, async () => {
      const files = universe([{ id: 'botte', name: 'Botte di Anna', xml: PROGRAMS[why], module: 'obj.botte' }]);
      const store = memoryStore();
      const k = await boot(files, store);
      expect(otherFaults(k)).toEqual([]);
      const thing = await place(k, 'obj.botte', 'prova#botte');
      // Isolated: the thing is there, in the generic of its class, waiting for its own.
      expect(k.ecs.alive.has(thing)).toBe(true);
      const fc = k.ecs.get(thing, 'form') as FormComp;
      expect(fc).toMatchObject({ model: 'furniture', wanted: 'botte', classe: 'furniture' });
      expect(k.forms.resolve('botte', 'furniture')).toBe('furniture');
      expect(k.brokenCards()).toEqual([expect.objectContaining({ id: 'botte', name: 'Botte di Anna', kind: 'model', why })]);
      const reason = k.brokenCards()[0].reason;
      expect(reason).toMatch(why === 'fault' ? /si guasta \(seme \d\): .*manca il file/ : why === 'empty' ? /non produce niente \(seme \d\)/ : /senza impronta \(seme \d\)/);
      // Shown to the master: a fault with the reason, the console's list, a line of the log.
      expect(k.faults.get('card:botte')?.message).toBe(`la carta «Botte di Anna» non funziona in questo mondo: ${reason}`);
      expect(k.broughtCards()).toEqual([expect.objectContaining({ id: 'botte', broken: expect.objectContaining({ why }) })]);
      expect(k.feed().some((e) => e.task === 'card.broken' && e.text.includes('Botte di Anna'))).toBe(true);
      // Nothing else broke, and the world goes on: the thing blocks with the generic's voxels.
      expect(otherFaults(k)).toEqual([]);
      expect(() => ticks(k, 120)).not.toThrow();
      expect(k.ecs.alive.has(thing)).toBe(true);
      // A thing that comes later does not wear it either.
      const [x, y] = clear(k);
      const later = k.spawnModuleEntity(k.modules.get('obj.botte')!, x, y, undefined, 'prova#dopo');
      expect((k.ecs.get(later, 'form') as FormComp).model).toBe('furniture');
      // The master takes it away: one commit of the kernel, only the library of models changes.
      const before = { ...k.repo.head().files };
      const r = await k.removeCard('botte');
      expect(r).toMatchObject({ ok: true, removed: ['botte'] });
      expect(r.text).toMatch(/«Botte di Anna» è tolta/);
      const head = k.repo.head();
      expect(head.message).toBe(`il master toglie la carta «Botte di Anna» (botte): ${reason}`);
      expect(head.author).toBe('kernel');
      const changed = [...new Set([...Object.keys(before), ...Object.keys(head.files)])].filter((p) => before[p] !== head.files[p]);
      expect(changed.filter((p) => !p.startsWith('world/'))).toEqual(expect.arrayContaining(['models/botte.xml', 'models/index.json']));
      expect(changed.filter((p) => !p.startsWith('world/')).sort()).toEqual(['models/botte.xml', 'models/index.json']);
      expect(k.files['models/botte.xml']).toBeUndefined();
      expect(JSON.parse(k.files['models/index.json']).botte).toBeUndefined();
      expect(k.brokenCards()).toEqual([]);
      expect(k.faults.get('card:botte')).toBeUndefined();
      // What used it waits for the Sculptor; offline nobody can make it: a shortfall says so.
      expect(k.sculpting.missing().map((m) => m.id)).toContain('botte');
      expect(k.shortfalls.list()).toEqual([expect.objectContaining({ request: 'il modello di «Botte di Anna»', agent: 'sculptor', task: 'model.sculpt', outcome: 'fault', reason: expect.stringContaining('i modelli sono locali') })]);
      expect(readShortfalls(k.repo.head().files[SHORTFALLS_FILE])).toHaveLength(1);
      expect(k.ecs.alive.has(thing)).toBe(true);
      expect(() => ticks(k, 60)).not.toThrow();
      expect(k.saveState()).toBe(true);
      // Opened again: the card is gone, the thing comes back in the generic, and nothing is broken.
      const again = await boot(files, store);
      expect(again.files['models/botte.xml']).toBeUndefined();
      expect(again.broughtCards()).toEqual([]);
      const back = await place(again, 'obj.botte', 'prova#botte');
      expect(again.ecs.get(back, 'form')).toMatchObject({ model: 'furniture', wanted: 'botte' });
      expect(again.brokenCards()).toEqual([]);
      expect(again.faults.list()).toEqual([]);
    }, 60_000);
  }

  it('una carta che funziona non si isola; il master può toglierla comunque, e chi la indossava torna al generico', async () => {
    const k = await boot(universe([{ id: 'botte', xml: PROGRAMS.good, module: 'obj.botte' }]));
    const thing = await place(k, 'obj.botte', 'prova#botte');
    expect((k.ecs.get(thing, 'form') as FormComp).model).toBe('botte');
    expect(k.brokenCards()).toEqual([]);
    expect(k.broughtCards()).toEqual([expect.objectContaining({ id: 'botte' })]);
    expect(k.broughtCards()[0].broken).toBeUndefined();
    expect(await k.removeCard('botte')).toMatchObject({ ok: true });
    expect(k.ecs.get(thing, 'form')).toMatchObject({ model: 'furniture', wanted: 'botte' });
    expect(k.repo.head().message).toBe('il master toglie la carta «La carta botte» (botte)');
  }, 60_000);

  it('il guasto di un worker: la carta si isola col motivo del worker, le altre forme vengono; tolta, dopo la riapertura non c’è', async () => {
    const inline = new InlineRunner();
    const crashing: FormRunner = { run: (q: FormRequest): Promise<FormResult> => (q.model === 'botte' ? Promise.reject(new Error('il worker si è fermato: out of memory')) : inline.run(q)) };
    const files = universe([{ id: 'botte', xml: PROGRAMS.good, module: 'obj.botte' }, { id: 'cassa', xml: PROGRAMS.good, module: 'obj.cassa' }]);
    const store = memoryStore();
    const k = await boot(files, store, { forms: crashing });
    const a = await place(k, 'obj.botte', 'prova#a');
    const b = await place(k, 'obj.cassa', 'prova#b');
    expect(k.brokenCards()).toEqual([expect.objectContaining({ id: 'botte', why: 'fault', reason: expect.stringMatching(/il worker si è fermato: out of memory/) })]);
    expect((k.ecs.get(a, 'form') as FormComp).model).toBe('furniture');
    expect((k.ecs.get(b, 'form') as FormComp).model).toBe('cassa');
    expect(k.forms.ready('cassa', (k.ecs.get(b, 'form') as FormComp).seed)?.status).toBe('ready');
    expect(otherFaults(k)).toEqual([]);
    expect(() => ticks(k, 60)).not.toThrow();
    expect((await k.removeCard('botte')).ok).toBe(true);
    expect(k.ecs.alive.has(a)).toBe(true);
    k.saveState();
    const again = await boot(files, store, { forms: crashing });
    expect(again.files['models/botte.xml']).toBeUndefined();
    expect(again.files['models/cassa.xml']).toBeDefined();
    expect(again.broughtCards().map((c) => c.id)).toEqual(['cassa']);
  }, 60_000);

  it('una copia che si guasta isola anche la carta da cui viene; il direttore non la copia di nuovo; togliere toglie tutte e due', async () => {
    const files = universe([{ id: 'botte-di-alfa', name: 'Botte', xml: PROGRAMS.empty, copies: [{ id: 'npc-botte', module: 'obj.botte' }] }]);
    const k = await boot(files);
    await place(k, 'obj.botte', 'prova#botte');
    expect(k.brokenCards().map((b) => [b.id, b.why, b.same])).toEqual([
      ['npc-botte', 'empty', undefined],
      ['botte-di-alfa', 'empty', 'npc-botte'],
    ]);
    // Neither is offered to the Cartographer, the Narrator or the ModelDirector any more.
    expect(k.broughtModels()).toEqual([]);
    expect(k.sculpting.reused({ id: 'altro-id', nome: 'Botte', aspetto: 'una botte', classe: 'furniture' })).toBeUndefined();
    expect(k.broughtCards()).toEqual([expect.objectContaining({ id: 'botte-di-alfa', copies: ['npc-botte'], broken: expect.objectContaining({ id: 'npc-botte' }) })]);
    const r = await k.removeCard('botte-di-alfa');
    expect(r.removed).toEqual(['botte-di-alfa', 'npc-botte']);
    expect(k.files['models/npc-botte.xml']).toBeUndefined();
    expect(k.files['models/botte-di-alfa.xml']).toBeUndefined();
  }, 60_000);

  it('una carta riscritta a mano non è più guasta: si prova di nuovo, e chi la aspettava la indossa', async () => {
    const k = await boot(universe([{ id: 'botte', xml: PROGRAMS.empty, module: 'obj.botte' }]));
    const thing = await place(k, 'obj.botte', 'prova#botte');
    expect(k.brokenCards()).toHaveLength(1);
    k.repo.write('models/botte.xml', PROGRAMS.good);
    k.applyFiles({ ...k.repo.working });
    expect(k.brokenCards()).toEqual([]);
    expect(k.faults.get('card:botte')).toBeUndefined();
    expect((k.ecs.get(thing, 'form') as FormComp).model).toBe('botte');
  }, 60_000);

  it('un ritorno a prima della rimozione riporta la carta: si riprova, e si ritrova guasta', async () => {
    const k = await boot(universe([{ id: 'botte', name: 'Botte', xml: PROGRAMS.empty, module: 'obj.botte' }]));
    await place(k, 'obj.botte', 'prova#botte');
    const withCard = k.repo.head().id;
    expect(k.brokenCards()).toHaveLength(1);
    expect((await k.removeCard('botte')).ok).toBe(true);
    k.rollback(withCard);
    expect(k.files['models/botte.xml']).toBeDefined();
    expect(k.brokenCards()).toEqual([]);
    // Tried again as it comes back: it still makes nothing, and it is found broken, isolated and shown again.
    const thing = await place(k, 'obj.botte', 'prova#ancora');
    expect(k.brokenCards()).toEqual([expect.objectContaining({ id: 'botte', why: 'empty' })]);
    expect(k.ecs.get(thing, 'form')).toMatchObject({ model: 'furniture', wanted: 'botte' });
    expect(k.faults.get('card:botte')).toBeDefined();
  }, 60_000);

  it('R non guarisce una carta guasta: dopo il ritorno resta isolata, e il master la vede ancora', async () => {
    const k = await boot(universe([{ id: 'botte', name: 'Botte', xml: PROGRAMS.fault, module: 'obj.botte' }]));
    const thing = await place(k, 'obj.botte', 'prova#botte');
    expect(k.faults.get('card:botte')).toBeDefined();
    k.rollback();
    expect(k.brokenCards()).toEqual([expect.objectContaining({ id: 'botte', why: 'fault' })]);
    expect(k.faults.get('card:botte')?.message).toMatch(/la carta «Botte» non funziona/);
    expect(k.forms.resolve('botte', 'furniture')).toBe('furniture');
    if (k.ecs.alive.has(thing)) expect((k.ecs.get(thing, 'form') as FormComp).model).toBe('furniture');
  }, 60_000);

  it('ciò che non si toglie: una carta che non c’è, un modello del seme, un id ostile, un universo che si legge soltanto', async () => {
    const k = await boot(universe([{ id: 'botte', xml: PROGRAMS.good }]));
    const head = k.repo.head().id;
    expect(await k.removeCard('nessuna')).toEqual({ ok: false, reason: expect.stringMatching(/nessuna carta/) });
    expect(await k.removeCard('pozzo')).toEqual({ ok: false, reason: expect.stringMatching(/solo le carte portate/) });
    for (const bad of ['../universe', 'a/b', '', 'x'.repeat(80), 3 as unknown as string]) expect((await k.removeCard(bad)).ok).toBe(false);
    expect(k.repo.head().id).toBe(head);
    expect(k.files['models/pozzo.xml']).toBeDefined();
    // A universe of a kernel to come is only read (ADR-0156): nothing is taken away from it.
    const later = universe([{ id: 'botte', xml: PROGRAMS.good }]);
    later['universe.json'] = JSON.stringify({ ...JSON.parse(later['universe.json']), kernel: '0.9.0', kernels: { from: '0.9' } }, null, 2) + '\n';
    const read = await boot(later);
    expect(read.readOnly()).toBeDefined();
    expect(await read.removeCard('botte')).toEqual({ ok: false, reason: expect.stringMatching(/si legge soltanto/) });
    expect(read.files['models/botte.xml']).toBeDefined();
  }, 60_000);
});

describe('il suono muto (T296)', () => {
  const files = universe([{ id: 'sound-music-silenzio', kind: 'sound', name: 'Il silenzio', xml: MUTE, sound: { use: 'music', environments: ['village'], moments: ['day'] } }]);
  const state: SoundState = { beyond: false, environment: 'village', phase: 'day', seed: 42 };

  /** A worker of the sound that answers from the real code, at once. */
  const inlineWorker = (): SoundWorker => {
    const w: SoundWorker = {
      onmessage: null,
      onerror: null,
      terminate: vi.fn(),
      postMessage(job) {
        const made = tryPrepareSound(job.req);
        setTimeout(() => w.onmessage?.({ data: 'error' in made ? { id: job.id, error: made.error } : { id: job.id, sound: made.sound, ms: 1, fromDisk: false } }), 0);
      },
    };
    return w;
  };
  class Out implements SoundOut {
    music: PreparedSound[] = [];
    playMusic(s: PreparedSound) {
      this.music.push(s);
    }
    stopMusic() {}
    playEffect() {}
  }

  it('tace, si isola, si mostra al master; tolto, l’ambiente torna al Musicista, che offline non può: una mancanza; riaperto, non c’è', async () => {
    const store = memoryStore();
    const k = await boot(files, store);
    const out = new Out();
    const d = new SoundDirector(out, new SoundRenders(inlineWorker));
    d.onFail = (id, reason) => void k.cardBroke(id, 'mute', breakReason('mute', { error: reason }));
    d.setPrograms(readPrograms(k.files));
    d.unlock();
    d.update(state);
    for (let i = 0; i < 40 && !k.brokenCards().length; i++) await new Promise((r) => setTimeout(r, 10));
    expect(d.now?.id).toBe('sound-music-silenzio');
    expect(out.music).toEqual([]);
    expect(k.brokenCards()).toEqual([expect.objectContaining({ id: 'sound-music-silenzio', kind: 'sound', why: 'mute', reason: 'il suono è muto: non suona nulla' })]);
    expect(k.faults.get('card:sound-music-silenzio')?.message).toMatch(/«Il silenzio» non funziona/);
    const r = await k.removeCard('sound-music-silenzio');
    expect(r).toMatchObject({ ok: true, removed: ['sound-music-silenzio'] });
    expect(r.text).toMatch(/suona la musica del momento/);
    expect(k.shortfalls.list()).toEqual([expect.objectContaining({ request: 'la musica di village', agent: 'musician', task: 'sound.compose', outcome: 'fault' })]);
    // The music of the place again: the seed's for the village, which plays.
    expect(readPrograms(k.files).some((p) => p.id === 'sound-music-silenzio')).toBe(false);
    const heard = new Out();
    const next = new SoundDirector(heard, new SoundRenders(inlineWorker));
    next.setPrograms(readPrograms(k.files));
    next.unlock();
    next.update(state);
    for (let i = 0; i < 400 && !heard.music.length; i++) await new Promise((r) => setTimeout(r, 20));
    expect(next.now?.id).toBe('sound-music-pastoral');
    expect(heard.music.length).toBe(1);
    expect(otherFaults(k)).toEqual([]);
    expect(k.saveState()).toBe(true);
    const again = await boot(files, store);
    expect(readPrograms(again.files).some((p) => p.id === 'sound-music-silenzio')).toBe(false);
    expect(again.broughtCards()).toEqual([]);
    expect(again.faults.list()).toEqual([]);
  }, 60_000);

  it('un brano del seme che fallisce sul client non è una carta: niente si isola', async () => {
    const k = await boot(files);
    expect(k.cardBroke('sound-music-pastoral', 'mute', 'non suona nulla')).toBe(false);
    expect(k.brokenCards()).toEqual([]);
  }, 60_000);
});

describe('i direttori dopo una carta tolta (T296)', () => {
  /** The local models, named as if they were online: the directors work (as in tests/bring.test.ts). */
  class Online extends MockAiModels {
    constructor() {
      super();
      Object.defineProperty(this, 'name', { value: 'prova' });
    }
  }

  it('con lo Scultore al lavoro niente mancanze: il modello torna, con il suo id, entro il tetto', async () => {
    const k = await boot(universe([{ id: 'botte', name: 'Botte', xml: PROGRAMS.empty, module: 'obj.botte' }]), memoryStore(), { ai: new Online() });
    const thing = await place(k, 'obj.botte', 'prova#botte');
    expect(k.brokenCards()).toHaveLength(1);
    expect(await k.removeCard('botte')).toMatchObject({ ok: true, text: expect.stringMatching(/finché lo Scultore non ne scrive uno/) });
    expect(k.shortfalls.list()).toEqual([]);
    for (let i = 0; i < 200 && !k.forms.info('botte'); i++) {
      k.sculpting.pump();
      await new Promise((r) => setTimeout(r, 2));
    }
    expect(k.forms.info('botte')?.brought).toBeUndefined();
    expect(k.sculpting.count).toBe(1);
    expect((k.ecs.get(thing, 'form') as FormComp).model).toBe('botte');
  }, 60_000);

  it('al tetto dei modelli lo Scultore non può: una mancanza col motivo della carta', async () => {
    const base = universe([{ id: 'botte', name: 'Botte', xml: PROGRAMS.empty, module: 'obj.botte' }]);
    const cfg = JSON.parse(base['universe.json']);
    const files = { ...base, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, maxModels: 0 } }, null, 2) + '\n' };
    const k = await boot(files, memoryStore(), { ai: new Online() });
    await place(k, 'obj.botte', 'prova#botte');
    await k.removeCard('botte');
    expect(k.shortfalls.list()).toEqual([expect.objectContaining({ agent: 'sculptor', reason: expect.stringMatching(/non produce niente.*ha già scritto i 0 modelli/) })]);
  }, 60_000);
});

describe('in una partita di molti (T296)', () => {
  const DT = 1 / 60;
  const files = universe([{ id: 'botte', name: 'Botte di Anna', xml: PROGRAMS.fault, module: 'obj.botte' }], { mode: 'multiplayer', death: 3 });

  async function thin(server: SessionServer, id: string): Promise<ThinClient> {
    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const session = new SessionClient(c, { id });
    await session.ready;
    const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    return new ThinClient(k, session);
  }
  const run = (server: SessionServer, clients: ThinClient[], frames: number) => {
    for (let i = 0; i < frames; i++) {
      for (const c of clients) {
        c.k.tick(DT);
        c.frame(DT);
      }
      server.tick(DT);
    }
  };
  async function until<T>(server: SessionServer, clients: ThinClient[], p: Promise<T>): Promise<T> {
    let done = false;
    let out!: T;
    void p.then((v) => {
      done = true;
      out = v;
    });
    for (let i = 0; i < 400 && !done; i++) {
      run(server, clients, 2);
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(done).toBe(true);
    return out;
  }

  it('il mondo la isola e lo dice a tutti; il master la vede nella sua console e la toglie; un giocatore no', async () => {
    const world = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const server = new SessionServer(world);
    const master = await thin(server, 'me');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 4);
    // A thing of the world wears the card: the world runs its program for the collisions, and it throws.
    await place(world, 'obj.botte', 'prova#botte');
    run(server, [master, anna], 12);
    expect(world.brokenCards()).toEqual([expect.objectContaining({ id: 'botte', why: 'fault' })]);
    // Every client hears it; the master's console shows it, with the reason, a player's mirror only draws the generic.
    expect(master.session.broken).toEqual([expect.objectContaining({ id: 'botte', why: 'fault' })]);
    expect(anna.session.broken.map((b) => b.id)).toEqual(['botte']);
    expect(master.k.broughtCards()).toEqual([expect.objectContaining({ id: 'botte', broken: expect.objectContaining({ why: 'fault' }) })]);
    expect(master.k.faults.get('card:botte')).toBeDefined();
    expect(anna.k.faults.get('card:botte')).toBeUndefined();
    expect(anna.k.forms.resolve('botte', 'furniture')).toBe('furniture');
    // The world's log tells the master, not the players.
    expect(master.session.feed.some((e) => e.task === 'card.broken')).toBe(true);
    // A player cannot: not through the kernel of their tab, not with the message.
    expect(await anna.k.removeCard('botte')).toMatchObject({ ok: false });
    const refused = await until(server, [master, anna], anna.session.act({ t: 'card', op: 'remove', id: 'botte' }));
    expect(refused).toMatchObject({ ok: false, reason: expect.stringMatching(/solo il master/) });
    expect(world.files['models/botte.xml']).toBeDefined();
    // Nor in the world's kernel by name.
    expect(await world.removeCard('botte', 'anna')).toMatchObject({ ok: false, reason: expect.stringMatching(/solo il master/) });
    // What does not read is refused, and nothing breaks.
    for (const bad of [{ t: 'card', op: 'remove', id: 7 }, { t: 'card', op: 'burn', id: 'botte' }, { t: 'card' }]) {
      expect((await until(server, [master, anna], master.session.act(bad as never))).ok).toBe(false);
    }
    expect(world.files['models/botte.xml']).toBeDefined();
    // The master can: through their mirror, which asks the world.
    const r = await until(server, [master, anna], master.k.removeCard('botte'));
    expect(r).toMatchObject({ ok: true, text: expect.stringMatching(/è tolta/) });
    expect(world.files['models/botte.xml']).toBeUndefined();
    expect(world.repo.head().message).toMatch(/^il master toglie la carta «Botte di Anna» \(botte\)/);
    run(server, [master, anna], 12);
    expect(master.session.broken).toEqual([]);
    expect(master.k.files['models/botte.xml']).toBeUndefined();
    expect(anna.k.files['models/botte.xml']).toBeUndefined();
    expect(master.k.broughtCards()).toEqual([]);
    expect(master.k.faults.get('card:botte')).toBeUndefined();
  }, 120_000);

  it('un messaggio che non è del master non arriva al kernel', async () => {
    const world = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const spy = vi.spyOn(world, 'removeCard');
    const server = new SessionServer(world);
    const { server: s, client } = fakeLink();
    const got: ServerMsg[] = [];
    client.onMessage((m) => got.push(m));
    server.connect(s);
    client.send({ t: 'join', id: 'anna' });
    client.send({ t: 'card', seq: 1, op: 'remove', id: 'botte' });
    server.tick(DT);
    await new Promise((r) => setTimeout(r, 0));
    expect(got.find((m) => m.t === 'result')).toMatchObject({ ok: false });
    expect(spy).not.toHaveBeenCalled();
  }, 60_000);
});

describe('il WorkerRunner del browser (T296)', () => {
  // In Node, with no `Worker`, a program that finds every worker busy would run on this thread (tests/forms-browser-cache.test.ts).
  beforeEach(() => void vi.stubGlobal('Worker', class {}));
  afterEach(() => void vi.unstubAllGlobals());

  /** Workers that answer when told, crash on a program that says so, or say nothing. */
  function pool() {
    const made: Array<{ w: any; jobs: any[] }> = [];
    const factory = () => {
      const entry = { w: undefined as any, jobs: [] as any[] };
      entry.w = {
        onmessage: null,
        onerror: null,
        terminate: vi.fn(),
        postMessage(data: any) {
          entry.jobs.push(data);
          if (data.req?.xml?.includes('crash')) setTimeout(() => entry.w.onerror?.({ message: 'out of memory' }), 0);
        },
      };
      made.push(entry);
      return entry.w as Worker;
    };
    /** The worker that got a program. */
    const holding = (xml: string) => made.find((m) => m.jobs.some((j) => j.req?.xml === xml))!;
    const answer = (xml: string) => {
      const e = holding(xml);
      const job = e.jobs.find((j) => j.req?.xml === xml);
      e.w.onmessage?.({ data: { id: job.id, ok: true, finished: true, result: { grid: { X: 1, Y: 1, Z: 1, cells: new Uint8Array([1]), alphabet: ['B', 'W'] }, palette: {}, actions: [], animations: [] } } });
    };
    return { made, factory, answer, holding };
  }
  const req = (xml: string): FormRequest => ({ xml, seed: 1, vpt: 20, model: xml });
  const flush = () => new Promise((r) => setTimeout(r, 5));

  it('un worker che si ferma fa fallire solo il suo lavoro, e un altro prende il suo posto', async () => {
    const p = pool();
    const runner = new WorkerRunner(2, new MemoryFormStore(), p.factory);
    const bad = runner.run(req('<crash/>'));
    const good = runner.run(req('<buono/>'));
    let failed: Error | undefined;
    bad.catch((e: Error) => (failed = e));
    await flush();
    expect(failed?.message).toMatch(/il worker si è fermato: out of memory/);
    expect(p.made).toHaveLength(3);
    expect(p.holding('<crash/>').w.terminate).toHaveBeenCalled();
    expect(p.holding('<buono/>').w.terminate).not.toHaveBeenCalled();
    // The other job is still running, and is answered.
    p.answer('<buono/>');
    expect((await good).grid.X).toBe(1);
    // The pool is whole again: the next job goes to a worker alive.
    const next = runner.run(req('<dopo/>'));
    await flush();
    expect(p.holding('<dopo/>').w.terminate).not.toHaveBeenCalled();
    p.answer('<dopo/>');
    expect((await next).grid.X).toBe(1);
  });

  it('un worker che non risponde: il cane da guardia lo ferma, il suo lavoro fallisce, un altro prende il suo posto', async () => {
    const p = pool();
    const runner = new WorkerRunner(1, new MemoryFormStore(), p.factory, undefined, undefined, 20);
    const stuck = runner.run(req('<fermo/>'));
    await expect(stuck).rejects.toThrow(/il worker non risponde/);
    expect(p.made).toHaveLength(2);
    expect(runner.respawned).toBe(1);
  });

  it('i worker che si fermano a ripetizione finiscono: ciò che aspetta fallisce, nessun ciclo', async () => {
    const p = pool();
    const runner = new WorkerRunner(1, new MemoryFormStore(), p.factory);
    for (let i = 0; i < 12; i++) await runner.run(req(`<crash n="${i}"/>`)).catch(() => undefined);
    expect(p.made.length).toBeLessThanOrEqual(1 + 8);
    await expect(runner.run(req('<ancora/>'))).rejects.toThrow(/nessun worker/);
  });
});
