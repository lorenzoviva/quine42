// The Musician (T225): from a request to a valid program committed, what fails the thresholds goes back, a room with two teams.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { compose, composerRole, purposeOf, scoreErrors, soundExample } from '../src/kernel/agents/composer';
import { soundId } from '../src/kernel/scoredirector';
import { chooseMusic, readPrograms } from '../src/audio/director';
import { AGENTS } from '../src/kernel/agents/council';
import { councilMayWrite } from '../src/kernel/paths';
import { isCommonTask, COMUNE } from '../src/kernel/cards';
import { CENSUS, FULL_DETAIL, LOW_DETAIL, pieceGap } from '../src/kernel/coefficients';
import { soundPrograms, type SoundProgram } from '../src/mj/sound';
import { renderSoundProgram } from '../src/mj/synth';

const DT = 1 / 60;
const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The local models, named as if they were online, with an answer to the Musician that a test can choose. */
class Scripted extends MockAiModels {
  calls: TextCall[] = [];
  answers: Array<(c: TextCall) => unknown> = [];
  constructor(online = true) {
    super();
    if (online) Object.defineProperty(this, 'name', { value: 'prova' });
  }
  async text(call: TextCall): Promise<string> {
    if (call.task === 'sound.compose') {
      this.calls.push(call);
      const next = this.answers.shift();
      if (next) return JSON.stringify(next(call));
    }
    return super.text(call);
  }
}

async function bootWith(models: MockAiModels, ai: Record<string, unknown> = {}): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, ...ai } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: models });
}

/** A place loaded, of an environment: nothing else of the place matters here. */
function walkIn(k: Kernel, layout: string): void {
  k.tick(DT);
  const chunk = [...k.chunks.values()][0];
  chunk.plan = { ...(chunk.plan ?? ({} as never)), layout };
}

const FLAT = `<sequence name="Fermo" values="BN" size="32 1 4" symmetry="()"><sound bpm="120" scale="dorian" root="50"><track y="0" instrument="lead"/></sound><line at="0 0 0" to="0 0 0" r="0" color="N"/></sequence>`;

describe('the Musician writes what is asked', () => {
  it('from a request of the Referente to a valid program, committed, as a card of who asks, in the index, played by the game', async () => {
    const models = new Scripted(false);
    const k = await bootWith(models);
    const before = k.repo.head().id;
    const r = await k.talkToAgent('liaison', 'vorrei una musica per il castello');
    expect(r.forged).toMatch(/Il Musicista ha scritto/);
    const head = k.repo.head();
    expect(head.id).not.toBe(before);
    expect(head.message).toMatch(/^musicista: /);
    const added = soundPrograms(head.files).find((p) => p.name?.startsWith('Aria'));
    expect(added?.id).toMatch(/^sound-music-/);
    expect(councilMayWrite(`models/${added!.id}.xml`)).toBe(true);
    // It is a card: who wrote it, who paid.
    const info = JSON.parse(head.files['models/index.json']!)[added!.id];
    expect(info.card).toMatchObject({ author: 'musician', payer: k.wanderer().id });
    expect(info.class).toBe('suono');
    // The environment it names: the game plays it there, over the piece of the seed, by day and by night.
    const env = added!.sound!.environments![0];
    expect(env).toBe('castle');
    const choice = chooseMusic({ beyond: false, environment: env, phase: 'day', seed: 7 }, readPrograms(head.files));
    expect(choice?.id).toBe(added!.id);
    expect(chooseMusic({ beyond: false, environment: env, phase: 'night', seed: 7 }, readPrograms(head.files))?.id).toBe(added!.id);
    // And it sounds: the samples the browser would play.
    const sound = renderSoundProgram(choice!.xml, choice!.seed);
    expect(sound.samples.reduce((m, x) => Math.max(m, Math.abs(x)), 0)).toBeGreaterThan(0.01);
  }, 60_000);

  it('the world asks too: an environment no program names gets its piece, once, paid by all, by day only', async () => {
    const models = new Scripted();
    const k = await bootWith(models);
    k.content.layouts['forra_nera'] = { ...k.content.layouts['bosco'], name: 'Forra Nera', description: 'una gola stretta tra pareti scure' };
    walkIn(k, 'forra_nera');
    const asked = k.composing.missing();
    expect(asked.map((r) => r.ambienti)).toEqual([['forra_nera']]);
    expect(asked[0]).toMatchObject({ nome: 'Forra Nera', uso: 'music', momenti: ['morning', 'day'] });
    expect(await k.composing.make(asked[0])).toMatchObject({ ok: true });
    const info = JSON.parse(k.repo.head().files['models/index.json']!)['sound-music-forra-nera'];
    expect(info.sound).toEqual({ use: 'music', environments: ['forra_nera'], moments: ['morning', 'day'] });
    expect(info.card.payer).toBe(COMUNE);
    expect(k.composing.missing()).toEqual([]);
  }, 60_000);

  it('the pump respects the budget, the coefficient and being offline', async () => {
    const offline = await bootWith(new Scripted(false));
    expect(offline.composing.active).toBe(false);
    const k = await bootWith(new Scripted(), { maxPieces: 0 });
    k.content.layouts['forra_nera'] = { ...k.content.layouts['bosco'], name: 'Forra Nera' };
    walkIn(k, 'forra_nera');
    k.composing.pump();
    await settle(5);
    expect(k.composing.count).toBe(0);
    expect(k.screens().costs).toBeDefined();
    const none = await bootWith(new Scripted(), { coefficienti: { brani: 0 } });
    none.content.layouts['forra_nera'] = { ...none.content.layouts['bosco'], name: 'Forra Nera' };
    walkIn(none, 'forra_nera');
    none.composing.pump();
    expect(none.composing.count).toBe(0);
  }, 60_000);

  it('a wanderer can replace an effect: it takes the id of the one there is, and the game plays the new one', async () => {
    const models = new Scripted(false);
    const k = await bootWith(models);
    const old = bundledFiles['models/sound-effect-item.xml'];
    const xml = old.replace('bpm="300"', 'bpm="280"');
    models.answers.push(() => ({ nome: 'Tocco di Legno', programma: xml, uso: 'effetto', effetto: 'item' }));
    const r = await k.talkToAgent('liaison', 'rifammi la melodia di quando raccolgo un oggetto');
    expect(r.forged).toMatch(/effetto: item/);
    const head = k.repo.head().files;
    expect(head['models/sound-effect-item.xml']).toContain('bpm="280"');
    expect(soundPrograms(head).filter((p) => p.sound?.effects?.includes('item')).map((p) => p.id)).toEqual(['sound-effect-item']);
  }, 60_000);

  it('talking to the Musician in the house of the Artist works like the Referente', async () => {
    const models = new Scripted(false);
    const k = await bootWith(models);
    const original = models.text.bind(models);
    models.text = async (c: TextCall) => (c.task === 'agent.chat' ? JSON.stringify({ risposta: 'Volentieri.', richiesta_fucina: 'un canto per il bosco di notte' }) : original(c));
    const r = await k.talkToAgent('musician', 'scrivimi un canto per il bosco');
    expect(r.forged).toMatch(/Il Musicista ha scritto/);
  }, 60_000);
});

describe('what does not pass goes back to the Musician, with the reason', () => {
  const world = { ambienti: ['bosco', 'castello'], effetti: ['item'], qui: 'bosco' };

  it('a program that fails the thresholds goes back; the second answer is the one kept', async () => {
    const models = new Scripted(false);
    const k = await bootWith(models);
    const good = soundExample(k.files, 'music')!;
    models.answers.push(() => ({ nome: 'Il Fermo', programma: FLAT, uso: 'music' }), () => ({ nome: 'La Forra', programma: good, uso: 'music' }));
    const r = await compose(k.council, { richiesta: 'una musica' }, world, 'prova');
    expect(r?.nome).toBe('La Forra');
    expect(r?.calls).toBe(2);
    expect(models.calls[1].prompt).toMatch(/Non va: .*suono /);
    expect(models.calls[1].prompt).toContain(FLAT.slice(0, 40));
    expect(k.feed().some((e) => e.kind === 'scarta' && e.to === 'musician')).toBe(true);
  }, 60_000);

  it('after the last try nothing enters the library, and the world goes on', async () => {
    const models = new Scripted(false);
    const k = await bootWith(models);
    models.answers.push(...[1, 2, 3].map(() => () => ({ nome: 'Il Fermo', programma: FLAT, uso: 'music' })));
    const before = k.repo.head().id;
    const r = await k.composing.make({ richiesta: 'una musica', uso: 'music', ambienti: ['bosco'] });
    expect(r.ok).toBe(false);
    expect(models.calls.length).toBe(3);
    expect(k.repo.head().id).toBe(before);
  }, 60_000);

  it('an answer that is no program, or not JSON, goes back too and throws nothing', async () => {
    const models = new Scripted(false);
    const k = await bootWith(models);
    const original = models.text.bind(models);
    let n = 0;
    models.text = async (c: TextCall) => (c.task === 'sound.compose' && n++ === 0 ? 'non è JSON' : original(c));
    models.answers.push(() => ({ nome: 7, programma: null, uso: 'boh', ambienti: 'x' }));
    const r = await compose(k.council, { richiesta: 'una musica' }, world, 'prova');
    expect(r?.xml).toContain('<sound');
  }, 60_000);

  it('rule 0: a name that breaks the fourth wall goes back, the root’s and the one in `nome`', () => {
    const good = bundledFiles['models/sound-music-stone.xml'];
    expect(scoreErrors('models/x.xml', good, 'Il Glitch del Bosco', 'music').join()).toMatch(/non è una parola del mondo/);
    expect(scoreErrors('models/x.xml', good.replace('name="Pietra"', 'name="Il Kernel"'), 'La Forra', 'music').join()).toMatch(/Il Kernel/);
  });

  it('a model is no piece, and a loop of a bar is not a piece of music', () => {
    expect(scoreErrors('models/x.xml', bundledFiles['models/pebble.xml'] ?? '<sequence values="BC" size="8 8 8"/>', 'Sasso', 'music').join()).toMatch(/manca <sound>/);
    expect(scoreErrors('models/x.xml', FLAT.replace('size="32', 'size="8'), 'Corto', 'music').join()).toMatch(/almeno 32 passi/);
  });

  it('what the world cannot name is dropped: environments out of the list, an effect nobody plays goes back', () => {
    expect(purposeOf({ uso: 'music', ambienti: ['bosco', 'marte'], momenti: ['notte', 'mai'] }, { richiesta: 'x' }, world).suono).toEqual({ use: 'music', environments: ['bosco'], moments: ['night'] });
    expect(purposeOf({ uso: 'music', ambienti: ['marte'] }, { richiesta: 'x' }, world).suono?.environments).toEqual(['bosco']);
    expect(purposeOf({ uso: 'music' }, { richiesta: 'x' }, { ...world, qui: undefined }).error).toMatch(/ambienti/);
    expect(purposeOf({ uso: 'effect', effetto: 'starnuto' }, { richiesta: 'x' }, world).error).toMatch(/item/);
    // What the kernel decided, the answer does not move.
    expect(purposeOf({ uso: 'effect', ambienti: ['castello'] }, { richiesta: 'x', uso: 'music', ambienti: ['bosco'], momenti: ['giorno'] }, world).suono).toEqual({ use: 'music', environments: ['bosco'], moments: ['giorno'] });
  });

  it('an id is free, or the effect it replaces', () => {
    const programs: SoundProgram[] = [{ id: 'sound-effect-rune', xml: '', sound: { use: 'effect', effects: ['rune'] } }];
    expect(soundId('Tocco', { use: 'effect', effects: ['rune'] }, programs, () => true)).toBe('sound-effect-rune');
    const taken = new Set(['sound-music-la-forra']);
    expect(soundId('La Forra!', { use: 'music' }, programs, (id) => taken.has(id))).toBe('sound-music-la-forra-2');
  });
});

describe('the choice of the music with the Musician in the house', () => {
  const p = (id: string, ambienti: string[]): SoundProgram => ({ id, xml: `<x id="${id}"/>`, sound: { use: 'music', environments: ambienti } });
  const state = { beyond: false, phase: 'day' as const, seed: 3 };

  it('who names the environment exactly beats who names part of its id, and the last written plays', () => {
    const old = p('vecchio', ['castello']);
    const own = p('suo', ['castello_nero']);
    expect(chooseMusic({ ...state, environment: 'castello_nero' }, [old, own])?.id).toBe('suo');
    expect(chooseMusic({ ...state, environment: 'castello_nero' }, [own, old])?.id).toBe('suo');
    expect(chooseMusic({ ...state, environment: 'castello' }, [old, p('nuovo', ['castello'])])?.id).toBe('nuovo');
  });
});

describe('the rules of a content of the Council', () => {
  it('a task of the census, with its coefficient, common when the world asks; «Low Detail» thins it and takes the cheap model', () => {
    expect(CENSUS.find((c) => c.compito === 'sound.compose')).toMatchObject({ agente: 'musician', coefficiente: 'pieces' });
    expect(isCommonTask('sound.compose')).toBe(true);
    expect(LOW_DETAIL.coefficients.pieces).toBeLessThan(FULL_DETAIL.pieces);
    expect(pieceGap(1)).toBe(120);
    expect(pieceGap(LOW_DETAIL.coefficients.pieces)).toBeGreaterThan(pieceGap(1));
    expect(pieceGap(0)).toBe(Infinity);
    expect(LOW_DETAIL.sculptors.musician).toBe('gemini-3.1-flash-lite');
  });

  it('the role carries the scales, the instruments and the limits; no placeholder stays', () => {
    const role = composerRole(bundledFiles);
    expect(role).toContain('hirajoshi');
    expect(role).toContain('lead, pad, bass');
    expect(role).toMatch(/almeno 4 eventi a battuta/);
    expect(role).not.toContain('@@');
    expect(AGENTS.musician.name).toBe('Musicista');
  });
});

describe('a room with two teams', () => {
  it('the house of the Artist holds both, each at its own place before the screen, with no building more', async () => {
    const k = await bootWith(new MockAiModels());
    const gallery = k.corona.building('galleria')!;
    expect(gallery.teams).toEqual(['artist', 'musician']);
    k.archive.tick(30);
    k.archive.tick(30);
    const screen = gallery.storeys[0].items.find((i) => i.kind === 'screen')!;
    const artist = k.archive.avatars.get('artist@galleria')!;
    const musician = k.archive.avatars.get('musician@galleria')!;
    expect([artist.x, artist.y]).toEqual([screen.x + 1.5, screen.y - 0.5]);
    expect([musician.x, musician.y]).toEqual([screen.x + 3, screen.y - 0.5]);
    expect(k.corona.free(musician.x, musician.y)).toBe(true);
    // No building of its own, no team of its own anywhere else.
    expect(k.corona.buildings.filter((b) => b.teams.includes('musician')).map((b) => b.id)).toEqual(['galleria']);
    expect(k.corona.buildings.map((b) => b.id)).not.toContain('musica');
  });

  it('the door says both, the rooms with one team say one; every seat and teleport of the round table is free of the others', async () => {
    const k = await bootWith(new MockAiModels());
    for (const b of k.corona.buildings) expect(b.teams.length, b.id).toBe(b.id === 'galleria' || b.id === 'persone' ? 2 : 1);
    const items = k.corona.building('concilio')!.storeys[0].items.filter((i) => i.kind === 'desk' || i.kind === 'portal' || i.kind === 'table');
    const cells = items.map((i) => `${i.x},${i.y}`);
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('the Musician at work is seen in the house, speaking; sent back by the kernel, stays there', async () => {
    const models = new Scripted(false);
    const k = await bootWith(models);
    const before = k.archive.avatars.get('musician@galleria')!;
    const [x, y] = [before.x, before.y];
    models.answers.push(() => ({ nome: 'Il Fermo', programma: FLAT, uso: 'music' }));
    await k.composing.make({ richiesta: 'il brano della gola', uso: 'music', ambienti: ['bosco'] });
    const m = k.archive.avatars.get('musician@galleria')!;
    expect(m.say).toBeDefined();
    expect(m.building).toBe('galleria');
    k.tick(DT);
    expect([m.x, m.y]).toEqual([x, y]);
  }, 60_000);

  it('the wandering Sculptor, who has no room of its own, does not stand on the Musician', async () => {
    const k = await bootWith(new MockAiModels());
    k.council.say('sculptor', 'scolpisce', 'il pozzo ha un programma suo', 'artist', 'model.sculpt');
    k.archive.tick(1);
    const positions = [...k.archive.avatars.entries()].filter(([, a]) => a.building === 'galleria' && !a.path).map(([, a]) => `${a.x},${a.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });
});
