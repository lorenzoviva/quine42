// The parts of the world, B: taken from a good model (T472, S6 of T458, ADR-0243). The Sculptor of a trade says which lines of a model it made
// are a part and what the part's contract is; the kernel writes the part and the model with `<import>` in their place, and takes it only if
// the model so rewritten makes the same grid, voxel by voxel, on every seed the world gives it. A part of the world has a name of its program,
// includes nothing, never changes nor goes while a model includes it, is a card of its own (`model.part`), is offered to the requests of its
// trade, and travels with the cards that include it; the clone keeps it, the regeneration does not touch it.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { composePart, importsOf, isWorldPart, numberedLines, partContract, partsInUse, partUsers, readPartAnswer, worldPartErrors, worldPartId, WORLD_PART_RE, WORLD_PARTS, type ComposedPart, type PartAnswer } from '../src/kernel/worldparts';
import { extractPart, PART_SEEDS, PART_TASK, PART_TRIES, partPrompt, sameGridErrors } from '../src/kernel/agents/parts';
import { checkAction, checkProgram, examplesFor, filesOf, partResources, worldPartResources, WORLD_PARTS_LINE } from '../src/kernel/agents/sculptor';
import { Council } from '../src/kernel/agents/council';
import { MockAiModels, mockPart } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { slowTask } from '../src/kernel/ai/subscription';
import { bundledFiles } from '../src/kernel/bundle';
import { broughtEntry, kinCards, withBrought } from '../src/kernel/bring';
import { allCards, CARD_MAKERS, isCommonTask } from '../src/kernel/cards';
import { cloneChanges } from '../src/kernel/clone';
import { CENSUS, FULL_DETAIL, hourlyEstimate } from '../src/kernel/coefficients';
import { Kernel } from '../src/kernel/kernel';
import { kernelModel, regenerationTargets } from '../src/kernel/regenerate';
import { memoryStore } from '../src/kernel/repo';
import type { FileMap } from '../src/kernel/types';
import { readConfig } from '../src/kernel/universe';
import { KERNEL_VERSION } from '../src/kernel/version';
import { modelErrors } from '../src/kernel/validator';
import { inlineChecker } from '../server/programCheck';
import { universeHandler } from '../server/universeStore';
import { classOf } from '../src/mj/classes';
import { mjxIncludes } from '../src/mj/model';
import { artOf } from '../site/carte';

/** A stone with moss and lichen on its top: two `prl` that work on what the ellipsoid drew (lines 6 and 7). */
const MASSO = `<sequence values="BRDM" symmetry="(xy)" size="20 20 16">
  <color symbol="R" value="8a8580" name="pietra"/>
  <color symbol="D" value="4b8f4a" name="muschio"/>
  <color symbol="M" value="d8c27a" name="lichene"/>
  <ellipsoid at="10 10 0" size="16 16 12" color="R"/>
  <prl in="B R" out="* D" p="0.5" steps="1"/>
  <prl in="B D" out="* M" p="0.3" steps="1"/>
</sequence>
`;
const ANSWER = `Here it is:\n<part name="muschio e lichene" lines="6-7" reads="B R" writes="D M">Moss on the tops: draw your stone with R and include it after; R under the air becomes moss D, moss under the air lichen M. Give D and M your colours.</part>`;
const SEED_INDEX = JSON.parse(readFileSync('universe/models/index.json', 'utf8'));
const stamp = (holder = 'me') => ({ author: 'sculptor', payer: 'comune', holder });

/** The seed's files with the stone in the library, as the Sculptor made it, with its card. */
function withStone(extra: Record<string, unknown> = {}): FileMap {
  const index = JSON.parse(bundledFiles['models/index.json']);
  index['masso-di-prova'] = { class: 'rock', name: 'Masso di prova', author: 'gemini-3.1-flash-lite', score: 7, card: stamp(), ...extra };
  return { ...bundledFiles, 'models/masso-di-prova.xml': MASSO, 'models/index.json': JSON.stringify(index, null, 1) + '\n' };
}

const answer = (raw = ANSWER): PartAnswer => {
  const a = readPartAnswer(raw);
  if (a === 'none' || 'error' in a) throw new Error(`not an answer: ${JSON.stringify(a)}`);
  return a;
};
const composed = (xml = MASSO, raw = ANSWER): ComposedPart => {
  const c = composePart(xml, answer(raw), { id: 'masso-di-prova', name: 'Masso di prova' });
  if ('error' in c) throw new Error(c.error);
  return c;
};

/** The local models, named as if they were online (the director sculpts) and asked to cut parts, every call kept. */
class Online extends MockAiModels {
  calls: TextCall[] = [];
  constructor(parts = true) {
    super();
    Object.defineProperty(this, 'name', { value: 'prova' });
    this.parts = parts;
    this.latency = 0;
  }
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
  count(task: string): number {
    return this.calls.filter((c) => c.task === task).length;
  }
}

describe('the answer and the part composed (T472)', () => {
  it('the id is of the name and of the program: the same text the same id, another text another one; a part of the seed is not one', () => {
    const a = worldPartId('Ruota del carro', '<sequence values="BW"/>');
    expect(a).toMatch(/^part-ruota-del-carro-[0-9a-f]{8}$/);
    expect(WORLD_PART_RE.test(a)).toBe(true);
    expect(worldPartId('Ruota del carro', '<sequence values="BW"/>')).toBe(a);
    expect(worldPartId('Ruota del carro', '<sequence values="BX"/>')).not.toBe(a);
    expect(worldPartId('Àncora lunghissima di una nave di linea', 'x').length).toBeLessThanOrEqual(41);
    for (const seed of ['part-wheel', 'part-window', 'part-leaf', 'part-door', 'part-stair', 'part-cellar']) expect(WORLD_PART_RE.test(seed), seed).toBe(false);
    expect(isWorldPart(a, { part: true })).toBe(true);
    expect(isWorldPart(a, { class: 'rock' })).toBe(false);
    expect(isWorldPart('part-wheel', { part: true })).toBe(false);
  });

  it('reads the answer: its lines, its letters, its contract; <none/>; what does not read says why', () => {
    expect(answer()).toEqual({ name: 'muschio e lichene', from: 6, to: 7, reads: ['B', 'R'], writes: ['D', 'M'], contract: expect.stringMatching(/^Moss on the tops/) });
    expect(readPartAnswer('Nothing here to share. <none/>')).toBe('none');
    expect(readPartAnswer('<sequence values="BW"/>')).toEqual({ error: expect.stringMatching(/manca <part/) });
    expect(readPartAnswer('<part name="x" lines="7-3" writes="D">c</part>')).toEqual({ error: expect.stringMatching(/lines/) });
    expect(readPartAnswer('<part name="x" lines="6" writes="">c</part>')).toEqual({ error: expect.stringMatching(/writes/) });
    expect(readPartAnswer('<part name="x" lines="6" writes="3">c</part>')).toEqual({ error: expect.stringMatching(/writes/) });
    expect(readPartAnswer(`<part name="x" lines="6" writes="D">${'a '.repeat(600)}</part>`)).toEqual({ error: expect.stringMatching(/contratto è lungo/) });
    // A comment of its own, "--" and numbered letters: the contract goes into a comment, so neither stays.
    const a = answer('<part name="x" lines="6" reads="#12" writes="#80,D"><!-- a -- b --></part>');
    expect(a).toMatchObject({ from: 6, to: 6, writes: [expect.any(String), 'D'], contract: 'a — b' });
  });

  it('composes the part from those lines as they are, and the model with the import in their place', () => {
    const c = composed();
    expect(c.id).toMatch(/^part-muschio-e-lichene-[0-9a-f]{8}$/);
    expect(c.original).toBe(MASSO);
    expect(c.rewritten).toBe(MASSO.replace('  <prl in="B R" out="* D" p="0.5" steps="1"/>\n  <prl in="B D" out="* M" p="0.3" steps="1"/>', `  <import file="${c.id}"/>`));
    // The contract first, with the letters; then where it comes from; the grid's values and the model's colours of its letters.
    expect(partContract(c.part)).toBe('Moss on the tops: draw your stone with R and include it after; R under the air becomes moss D, moss under the air lichen M. Give D and M your colours. Reads: B R. Writes: D M.');
    expect(c.part).toMatch(/lines 6-7 of «Masso di prova» \(masso-di-prova\)/);
    expect(c.part).toContain('<sequence values="BRDM">');
    for (const s of ['R', 'D', 'M']) expect(c.part).toContain(`<color symbol="${s}"`);
    expect(c.part).toContain('<prl in="B D" out="* M" p="0.3" steps="1"/>');
    expect(importsOf(c.rewritten)).toEqual([c.id]);
    expect(worldPartErrors(c.part)).toEqual([]);
    // Alone it is a model the validator takes as a part, not as a thing (it draws nothing alone).
    expect(modelErrors(`models/${c.id}.xml`, c.part).join(' ')).toMatch(/vuoto/);
  });

  it('refuses lines that are not whole nodes, an animation or an action, an import, files, the letters the seed keeps', () => {
    const err = (xml: string, raw: string) => {
      const r = composePart(xml, answer(raw), { id: 'x', name: 'X' });
      return 'error' in r ? r.error : '';
    };
    const ans = (lines: string, writes = 'D') => `<part name="p" lines="${lines}" reads="R" writes="${writes}">c</part>`;
    expect(err(MASSO, ans('6-9'))).toMatch(/il programma ha 9 righe|non sono elementi interi|dentro il programma/);
    expect(err(MASSO, ans('1-7'))).toMatch(/non sono elementi interi/);
    expect(err(MASSO, ans('2-4'))).toMatch(/non hanno nodi/);
    expect(err(MASSO, ans('6-7', 'B'))).toMatch(/writes: «B»/);
    expect(err(MASSO, ans('6-7', 'Q'))).toMatch(/writes: «Q»/);
    const action = `${MASSO}<action name="lava" label="Lava">\n  <all in="D" out="R"/>\n</action>\n`;
    expect(err(action, ans('10'))).toMatch(/non sono dentro il programma: le animazioni, le azioni/);
    const imports = MASSO.replace('  <prl in="B D"', '  <import file="part-wheel"/>\n  <prl in="B D"');
    expect(err(imports, ans('6-7'))).toMatch(/non include niente/);
    const reads = MASSO.replace('<prl in="B D" out="* M" p="0.3" steps="1"/>', '<all file="muschio" steps="1"/>');
    expect(err(reads, ans('7'))).toMatch(/non legge file/);
    const rules = MASSO.replace('  <prl in="B D" out="* M" p="0.3" steps="1"/>', '  <prl steps="1">\n    <rule in="B D" out="* M"/>\n  </prl>');
    expect(err(rules, ans('8'))).toMatch(/non hanno nodi/);
    expect(err(rules, ans('7-8'))).toMatch(/non sono elementi interi/);
    const seedLetters = MASSO.replace('values="BRDM"', 'values="BRDMS"').replace('<color symbol="M"', '<color symbol="S" value="000000"/>\n  <color symbol="M"');
    expect(err(seedLetters, ans('7-8'))).toMatch(/S o #90-#97/);
  });

  it('the light rules of a part: one program, nothing included nor read, a contract, none of the seed’s letters', () => {
    expect(worldPartErrors(composed().part)).toEqual([]);
    expect(worldPartErrors('<sequence values="BD"><prl in="B" out="D"/></sequence>')).toEqual(['manca il contratto: il primo paragrafo del commento in cima']);
    expect(worldPartErrors('<!--\nc\n-->\n<sequence values="BD"><import file="part-wheel"/></sequence>')).toContain('una parte non include niente');
    expect(worldPartErrors('<!--\nc\n-->\n<sequence values="BD"><all file="x"/></sequence>')).toContain('una parte non legge file di models/');
    expect(worldPartErrors('<!--\nc\n-->\n<sequence values="BD"><prl in="B" out="D"/></sequence><action name="a" label="A"><all in="D" out="B"/></action>')[0]).toMatch(/un programma solo/);
    expect(worldPartErrors('<!--\nc\n-->\n<sequence values="BS"><prl in="B" out="S"/></sequence>')).toEqual(['la sua griglia usa S o #90-#97, che le parti del seme tengono per sé']);
  });

  it('who includes what: imports anywhere, never in a comment; a model is not its own user', () => {
    const c = composed();
    const files: FileMap = { [`models/${c.id}.xml`]: c.part, 'models/masso-di-prova.xml': c.rewritten, 'models/part-door.xml': '<!-- <import file="part-door"/> --><sequence values="B"/>', 'models/altro.xml': `<sequence values="B"><sequence values="B"><import file="${c.id}"/></sequence></sequence>` };
    expect(partUsers(files, c.id)).toEqual(['altro', 'masso-di-prova']);
    expect(partUsers(files, 'part-door')).toEqual([]);
    expect([...partsInUse(files).keys()]).toEqual([c.id]);
    expect(numberedLines('a\nb').split('\n')).toEqual(['1 | a', '2 | b']);
  });
});

describe('the same grid (T472)', () => {
  it('the stone rewritten with its part makes the same grid on every seed; a part a little different does not', async () => {
    const k = await Kernel.boot({ files: withStone(), store: memoryStore(), ai: new MockAiModels() });
    const c = composed();
    expect(await sameGridErrors(k.forms, 'masso-di-prova', c, 6)).toEqual([]);
    const other = { ...c, part: c.part.replace('p="0.5"', 'p="0.6"') };
    expect((await sameGridErrors(k.forms, 'masso-di-prova', other, 3))[0]).toMatch(/^seme 1: \d+ voxel diversi \(il primo a \d+,\d+,\d+: /);
    const colour = { ...c, part: c.part.replace('<prl in="B D" out="* M"', '<prl in="B D" out="* R"') };
    expect((await sameGridErrors(k.forms, 'masso-di-prova', colour, 3))[0]).toMatch(/voxel diversi/);
  }, 60_000);

  it('every program of the seed the local Sculptor cuts is the same grid with its part, on every seed the world gives it', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    let cut = 0;
    for (const [id, info] of Object.entries<Record<string, unknown>>(SEED_INDEX)) {
      if (/^(part-|corona-|schermo-|circuito-|sound-)/.test(id) || info.class === 'suono' || !classOf(String(info.class))) continue;
      const xml = k.files[`models/${id}.xml`];
      const raw = mockPart(xml, String(info.name ?? id));
      if (raw === '<none/>') continue;
      const c = composePart(xml, answer(raw), { id, name: String(info.name ?? id) });
      if ('error' in c) continue;
      cut++;
      expect(await sameGridErrors(k.forms, id, c, Math.max(PART_SEEDS, k.forms.seedsOf(id))), id).toEqual([]);
    }
    // 16 of the 54 on 22/11 (misure-s6.md): what matters is that every one of them is the same grid.
    expect(cut).toBeGreaterThanOrEqual(10);
    console.info(`[T472] programmi del seme che lo Scultore locale taglia: ${cut}, tutti con la stessa griglia su ogni seme del mondo`);
  }, 240_000);
});

describe('the kernel takes a part (T472)', () => {
  it('one commit of the Council: the part with its card, the model with its import; it is offered to its trade only', async () => {
    const k = await Kernel.boot({ files: withStone(), store: memoryStore(), ai: new MockAiModels() });
    const c = composed();
    const before = k.repo.log().length;
    expect(await k.addWorldPart('masso-di-prova', c, { specialty: 'landscaper', author: 'gemini-3.1-flash-lite' })).toEqual({ id: c.id });
    expect(k.repo.log().length).toBe(before + 1);
    expect(k.repo.head().message).toBe('scultore: la parte «muschio e lichene» da «Masso di prova»');
    expect(k.files[`models/${c.id}.xml`]).toBe(c.part);
    expect(k.files['models/masso-di-prova.xml']).toBe(c.rewritten);
    const index = JSON.parse(k.files['models/index.json']);
    expect(index[c.id]).toEqual({ class: 'rock', specialty: 'landscaper', part: true, name: 'Parte: muschio e lichene', author: 'gemini-3.1-flash-lite', score: 7, from: 'masso-di-prova', card: { author: 'sculptor', payer: 'comune', holder: 'me' } });
    // The model's card stays as it was; the part is a card of the world, of its own task.
    expect(index['masso-di-prova'].card).toEqual(stamp());
    expect(allCards(k.files).find((x) => x.id === `model:${c.id}`)).toMatchObject({ tipo: 'model', author: 'sculptor', payer: 'comune' });
    // The validator knows it as a part, without being told.
    expect(k.validator.validateFile(`models/${c.id}.xml`, c.part)).toEqual([]);
    expect(k.forms.info(c.id)?.part).toBe(true);
    // Its trade's requests offer it, after the parts of the seed; another trade's do not; the parts of the seed do not list it.
    expect(worldPartResources(k.files, 'landscaper')).toEqual([`- <import file="${c.id}"/> (from «Masso di prova»): ${partContract(c.part)}`]);
    expect(worldPartResources(k.files, 'joiner')).toEqual([]);
    for (const s of ['landscaper', 'joiner', 'architect', 'mason'] as const) expect(partResources(k.files, s).join('\n')).not.toContain(c.id);
    expect(k.worldParts('landscaper').map((p) => p.id)).toEqual([c.id]);
    // The model including it is an example for the stones, and a program of the Sculptor that includes it passes the checks.
    expect(examplesFor(k.files, { classe: 'rock' }).some((x) => x.includes(`<import file="${c.id}"/>`))).toBe(true);
    const mine = `<sequence values="BRDM">\n  <ellipsoid at="10 10 0" size="12 12 9" color="R"/>\n  <import file="${c.id}"/>\n</sequence>\n`;
    expect(checkProgram(mine, classOf('rock')!, undefined, filesOf(mine, k.files)).error).toBeUndefined();
    // The model that includes it is a use of its card.
    expect(k.withParts(['model:masso-di-prova'])).toEqual(['model:masso-di-prova', `model:${c.id}`]);
    expect(partUsers(k.files, c.id)).toEqual(['masso-di-prova']);
    // On the site its card shows the model it came from: alone it draws nothing.
    const card = allCards(k.files).find((x) => x.id === `model:${c.id}`)!;
    expect(artOf(card, k.files, k.forms)?.model).toBe('masso-di-prova');
  }, 60_000);

  it('a part never changes: the library does not write it anew, and a part already there with another program is another one', async () => {
    const k = await Kernel.boot({ files: withStone(), store: memoryStore(), ai: new MockAiModels() });
    const c = composed();
    expect(await k.addWorldPart('masso-di-prova', c, { specialty: 'landscaper', author: 'm' })).toEqual({ id: c.id });
    expect(k.addModel(c.id, c.part.replace('p="0.3"', 'p="0.4"'), { class: 'rock', part: true } as never, 'riscritta')).toBe(false);
    expect(k.feed().at(-1)?.text).toMatch(/è una parte del mondo: non si riscrive/);
    expect(k.files[`models/${c.id}.xml`]).toBe(c.part);
  }, 60_000);

  it('what it refuses, and why: another grid, a model changed meanwhile, a brought card, a trade with its parts', async () => {
    const k = await Kernel.boot({ files: withStone(), store: memoryStore(), ai: new MockAiModels() });
    const c = composed();
    const other = { ...c, part: c.part.replace('p="0.5"', 'p="0.6"') };
    const refused = await k.addWorldPart('masso-di-prova', other, { specialty: 'landscaper', author: 'm' });
    expect(refused).toEqual({ error: expect.stringMatching(/seme 1: \d+ voxel diversi/) });
    expect(k.files[`models/${c.id}.xml`]).toBeUndefined();
    expect(k.files['models/masso-di-prova.xml']).toBe(MASSO);
    expect(await k.addWorldPart('masso-di-prova', { ...c, original: MASSO.replace('0.3', '0.2') }, { specialty: 'landscaper', author: 'm' })).toEqual({ error: 'il modello è cambiato nel frattempo', final: true });
    const brought = await Kernel.boot({ files: withStone({ brought: 'aurora' }), store: memoryStore(), ai: new MockAiModels() });
    expect(await brought.addWorldPart('masso-di-prova', c, { specialty: 'landscaper', author: 'm' })).toMatchObject({ final: true, error: expect.stringMatching(/carta portata/) });
    // A trade with its parts takes no more (four other parts: another moss each).
    const index = JSON.parse(withStone()['models/index.json']);
    const full: FileMap = { ...withStone() };
    for (let i = 0; i < WORLD_PARTS; i++) {
      const id = worldPartId(`altra ${i}`, `x${i}`);
      index[id] = { class: 'rock', specialty: 'landscaper', part: true, name: `Parte ${i}` };
      full[`models/${id}.xml`] = c.part.replace('p="0.3"', `p="0.3${i + 1}"`);
    }
    full['models/index.json'] = JSON.stringify(index, null, 1) + '\n';
    const busy = await Kernel.boot({ files: full, store: memoryStore(), ai: new MockAiModels() });
    expect(await busy.addWorldPart('masso-di-prova', c, { specialty: 'landscaper', author: 'm' })).toMatchObject({ final: true, error: expect.stringMatching(/ha già le sue 4 parti/) });
  }, 90_000);

  it('an action is learned on a model that includes a part: the checks read it', async () => {
    const k = await Kernel.boot({ files: withStone(), store: memoryStore(), ai: new MockAiModels() });
    const c = composed();
    await k.addWorldPart('masso-di-prova', c, { specialty: 'landscaper', author: 'm' });
    const clip = '<action name="lava" label="Lava"><all in="M" out="D"/></action>';
    const rock = classOf('rock')!;
    expect(checkAction(c.rewritten, clip, 'lava', rock).error).toMatch(/manca il file models\/part-muschio/);
    expect(checkAction(c.rewritten, clip, 'lava', rock, filesOf(c.rewritten, k.files))).toMatchObject({ xml: expect.stringContaining('<action name="lava"') });
  }, 60_000);
});

describe('the Sculptor asked for a part (T472)', () => {
  const tree = { id: 'quercia-di-prova', nome: 'Quercia di prova', aspetto: 'una quercia', classe: 'tree' };

  it('after a good model the director asks its trade once, on the model that sculpted it; the next request of the trade offers the part', async () => {
    const ai = new Online();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
    expect(await k.sculpting.make(tree)).toBe(true);
    expect(ai.count(PART_TASK)).toBe(1);
    const call = ai.calls.find((x) => x.task === PART_TASK)!;
    expect(call).toMatchObject({ agent: 'sculptor', model: 'gemini-3.1-flash-lite', specialty: 'landscaper', temperature: 0.4 });
    // The core and the trade's section in the system, as for its sculptures; the program with its lines numbered in the request.
    expect(call.prompt).toMatch(/Take a part of this world from a program of yours: «Quercia di prova» \(class tree; Paesaggista\) passed the kernel's checks and the Artist gave it 7\/10/);
    expect(call.prompt).toContain(numberedLines((call.data as { xml: string }).xml));
    expect(k.sculpting.partsTaken).toBe(1);
    const [part] = k.worldParts('landscaper');
    expect(part.id).toMatch(/^part-finitura-[0-9a-f]{8}$/);
    expect(JSON.parse(k.files['models/index.json'])[part.id]).toMatchObject({ class: 'tree', specialty: 'landscaper', part: true, from: 'quercia-di-prova', score: 7, card: { author: 'sculptor', payer: 'comune' } });
    expect(importsOf(k.files['models/quercia-di-prova.xml'])).toEqual([part.id]);
    expect(k.feed().some((e) => e.task === PART_TASK && e.kind === 'approva' && /la stessa griglia su 3 semi/.test(e.text))).toBe(true);
    // The next tree: its request lists the part of the world, and so does the next request of a part, so that it takes no second of the same.
    ai.calls = [];
    expect(await k.sculpting.make({ ...tree, id: 'pino-di-prova', nome: 'Pino di prova' })).toBe(true);
    const sculpt = ai.calls.find((x) => x.task === 'model.sculpt')!;
    expect(sculpt.prompt).toContain(`${WORLD_PARTS_LINE}\n- <import file="${part.id}"/> (from «Quercia di prova»): `);
    const again = ai.calls.find((x) => x.task === PART_TASK);
    expect(again?.prompt).toMatch(/This world already has these parts of your trade/);
    // The local Sculptor cut the same nodes again: the pine includes the part that was there, no second one is written.
    expect(k.worldParts('landscaper').map((p) => p.id)).toEqual([part.id]);
    expect(importsOf(k.files['models/pino-di-prova.xml'])).toEqual([part.id]);
    expect(k.repo.head().message).toBe(`scultore: «Pino di prova» include la parte «Parte: finitura»`);
    // A person is another trade's: its request has no part of the landscaper's.
    ai.calls = [];
    await k.sculpting.make({ id: 'mugnaio-di-prova', nome: 'Mugnaio di prova', aspetto: 'un mugnaio', classe: 'person' });
    expect(ai.calls.find((x) => x.task === 'model.sculpt')!.prompt).not.toContain(part.id);
  }, 120_000);

  it('at most PART_TRIES times a session per trade; never with the local models, the knob at 0 or a universe only read', async () => {
    const ai = new Online(false);
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
    for (let i = 0; i < PART_TRIES + 2; i++) await k.sculpting.make({ ...tree, id: `albero-${i}`, nome: `Albero ${i}` });
    expect(ai.count(PART_TASK)).toBe(PART_TRIES);
    expect(k.feed().filter((e) => e.task === PART_TASK && /niente da condividere/.test(e.text))).toHaveLength(PART_TRIES);
    // Offline the director asks nothing (a game without a key never sculpts by itself).
    const local = new MockAiModels();
    local.parts = true;
    const offline = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: local });
    expect(offline.sculpting.partWanted({ classe: 'tree' }, 9)).toBeUndefined();
    // A vote under the threshold, the actions, the knob at 0.
    const on = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Online() });
    expect(on.sculpting.partWanted({ classe: 'tree' }, 9)).toBe('landscaper');
    expect(on.sculpting.partWanted({ classe: 'tree' }, 5)).toBeUndefined();
    expect(on.sculpting.partWanted({ classe: 'tree' }, undefined)).toBeUndefined();
    expect(on.setAi({ coefficients: { ...FULL_DETAIL, models: 0 } })).toBe(true);
    expect(on.sculpting.partWanted({ classe: 'tree' }, 9)).toBeUndefined();
  }, 120_000);

  it('what does not pass goes back once with the reason; nothing comes of it', async () => {
    class Scripted extends MockAiModels {
      answers = ['<part name="x" lines="1-3" reads="R" writes="D">c</part>', '<part name="x" lines="2" reads="R" writes="D">c</part>'];
      prompts: string[] = [];
      async text(call: TextCall): Promise<string> {
        this.prompts.push(call.prompt);
        return this.answers.shift() ?? '<none/>';
      }
    }
    const models = new Scripted();
    const c = new Council(models, () => ({ files: withStone(), palette: {}, catalog: [] }));
    const taken: string[] = [];
    const out = await extractPart(c, { id: 'masso-di-prova', xml: MASSO, nome: 'Masso di prova', classe: 'rock', score: 7 }, 'm', async (made) => (taken.push(made.id), { id: made.id }));
    expect(out).toMatchObject({ calls: 2, error: expect.stringMatching(/non hanno nodi/) });
    expect(taken).toEqual([]);
    expect(models.prompts[1]).toMatch(/You answered:\n<part name="x" lines="1-3"[\s\S]*It does not pass: le righe 1-3 non sono elementi interi/);
    expect(partPrompt({ id: 'x', xml: MASSO, nome: 'X', classe: 'rock', score: 6 }, 'landscaper')).toMatch(/If nothing in it is worth sharing, answer <none\/>/);
  });
});

describe('the cards of the parts (T472)', () => {
  it('a task of the census on the knob of the models, a card of the world, a slow task; an hour of play counts it', () => {
    expect(CENSUS.find((c) => c.compito === PART_TASK)).toMatchObject({ agente: 'sculptor', modo: 'diretta', coefficiente: 'models' });
    expect(CARD_MAKERS[PART_TASK]).toEqual([PART_TASK]);
    expect(isCommonTask(PART_TASK)).toBe(true);
    expect(slowTask(PART_TASK)).toBe(true);
    const ai = readConfig(bundledFiles).config.ai;
    const row = (coefficients: typeof FULL_DETAIL) => hourlyEstimate({ ...ai, coefficients }).righe.find((r) => r.voce === 'Parti del mondo')!;
    expect(row(FULL_DETAIL).chiamate).toBeGreaterThan(0);
    expect(row(FULL_DETAIL).dollari).toBeGreaterThan(0);
    expect(row({ ...FULL_DETAIL, models: 0 }).chiamate).toBe(0);
  });

  it('a part that comes with a card stays a part: its trade, the model it came from, the chain one link longer; the choice does not list it', () => {
    const c = composed();
    const entry = { class: 'rock', specialty: 'landscaper', part: true, name: 'Parte: muschio e lichene', author: 'm', score: 7, from: 'masso-di-prova', card: stamp('anna') };
    const made = broughtEntry({ kind: 'model', universe: 'aurora', id: c.id, entry, xml: c.part, name: 'Parte: muschio e lichene' }, 'me');
    if ('error' in made) throw new Error(made.error);
    expect(made.info).toMatchObject({ class: 'rock', part: true, specialty: 'landscaper', from: 'masso-di-prova', brought: 'aurora', card: { author: 'sculptor', holder: 'me', origins: [{ holder: 'anna', universe: 'aurora' }] } });
    // A model that only says `part`, without an id of a part of the world, is no part.
    const fake = broughtEntry({ kind: 'model', universe: 'aurora', id: 'masso', entry: { ...entry }, xml: c.part, name: 'Masso' }, 'me');
    expect('info' in fake && fake.info.part).toBeFalsy();
    const files: FileMap = { 'models/index.json': JSON.stringify({ [c.id]: entry, 'masso-di-prova': { class: 'rock', name: 'Masso', card: stamp('anna') } }), [`models/${c.id}.xml`]: c.part, 'models/masso-di-prova.xml': c.rewritten };
    expect(kinCards(files).map((k) => k.id)).toEqual(['masso-di-prova']);
  });

  it('the clone keeps the part and its user, and gives its card one more link', () => {
    const c = composed();
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const index = JSON.parse(bundledFiles['models/index.json']);
    index['masso-di-prova'] = { class: 'rock', name: 'Masso di prova', score: 7, card: stamp() };
    index[c.id] = { class: 'rock', specialty: 'landscaper', part: true, name: 'Parte', from: 'masso-di-prova', card: stamp() };
    const files: FileMap = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, name: 'prima', game: { mode: 'multiplayer', death: 2, pvp: true, freeActionsBetweenPlayers: false, master: 'me' } }), 'models/index.json': JSON.stringify(index), [`models/${c.id}.xml`]: c.part, 'models/masso-di-prova.xml': c.rewritten };
    const { changes } = cloneChanges(files, { nome: 'seconda', master: 'anna' });
    const after = JSON.parse(changes['models/index.json']);
    expect(after[c.id]).toMatchObject({ part: true, specialty: 'landscaper', card: { holder: 'me', origins: [{ holder: 'me', universe: 'prima' }] } });
    expect(changes[`models/${c.id}.xml`]).toBeUndefined();
    expect(partUsers({ ...files, ...changes }, c.id)).toEqual(['masso-di-prova']);
  });

  it('the regeneration of the models never sculpts a part again', async () => {
    const k = await Kernel.boot({ files: withStone(), store: memoryStore(), ai: new MockAiModels() });
    const c = composed();
    await k.addWorldPart('masso-di-prova', c, { specialty: 'landscaper', author: 'm' });
    expect(kernelModel(c.id, { class: 'rock' })).toBe(true);
    expect(regenerationTargets(k, [], { classes: ['rock'], only: [c.id, 'masso-di-prova'] }).map((t) => t.id)).toEqual(['masso-di-prova']);
  }, 60_000);

  it('a part brought with a card is not taken away while a model includes it; the card that includes it is', async () => {
    const c = composed();
    const index = JSON.parse(bundledFiles['models/index.json']);
    index['masso-di-prova'] = { class: 'rock', name: 'Masso di prova', score: 7, brought: 'aurora', card: stamp() };
    index[c.id] = { class: 'rock', specialty: 'landscaper', part: true, name: 'Parte: muschio e lichene', from: 'masso-di-prova', brought: 'aurora', card: stamp() };
    const files: FileMap = { ...bundledFiles, 'models/index.json': JSON.stringify(index), [`models/${c.id}.xml`]: c.part, 'models/masso-di-prova.xml': c.rewritten };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    expect(k.broughtModels().map((b) => b.id)).toEqual(['masso-di-prova']);
    expect(await k.removeCard(c.id)).toEqual({ ok: false, reason: 'la parte «Parte: muschio e lichene» è inclusa da «Masso di prova»: si toglie quando nessuno la include più' });
    expect(await k.removeCard('masso-di-prova')).toMatchObject({ ok: true, removed: ['masso-di-prova'] });
    expect(k.files[`models/${c.id}.xml`]).toBe(c.part);
    expect(await k.removeCard(c.id)).toMatchObject({ ok: true, removed: [c.id] });
  }, 60_000);
});

describe('a card travels with its parts (T472, the store)', () => {
  let dir: string;
  let close: () => Promise<void>;
  let ask: (method: string, target: string, body?: unknown) => Promise<{ status: number; body: any }>;
  const git = (root: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root, encoding: 'utf8' }).trim();
  const c = composed();
  const PART = { class: 'rock', specialty: 'landscaper', part: true, name: 'Parte: muschio e lichene', author: 'gemini-3.1-flash-lite', score: 7, from: 'masso-di-prova', card: stamp('anna') };
  const STONE = { class: 'rock', name: 'Masso di prova', author: 'gemini-3.1-flash-lite', score: 7, card: stamp('anna') };
  const lib = (entries: Record<string, { entry: unknown; xml: string }>) => ({ 'models/index.json': JSON.stringify(Object.fromEntries(Object.entries(entries).map(([id, e]) => [id, e.entry])), null, 1) + '\n', ...Object.fromEntries(Object.entries(entries).map(([id, e]) => [`models/${id}.xml`, e.xml])) });

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-parti-portate-'));
    const handler = universeHandler(dir, { checker: inlineChecker() });
    const server = http.createServer((req, res) => handler(req as never, res, () => ((res.statusCode = 404), res.end('{}'))));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    close = () => new Promise<void>((r) => server.close(() => r()));
    ask = (method, target, body) =>
      new Promise((resolve, reject) => {
        const r = http.request({ host: '127.0.0.1', port, path: target, method, headers: { Host: `127.0.0.1:${port}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) } }, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (x) => chunks.push(x));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null') }));
        });
        r.on('error', reject);
        r.end(body === undefined ? undefined : JSON.stringify(body));
      });
    const create = (name: string) => ask('POST', `/api/universe/${name}/create`, { files: { 'universe.json': JSON.stringify({ name, kernel: KERNEL_VERSION }, null, 2) + '\n', 'models/index.json': '{}\n' }, message: 'nasce dal seme del kernel' });
    const commit = (name: string, changes: Record<string, string>) => ask('POST', `/api/universe/${name}/commit`, { changes, message: 'concilio: modelli', author: 'agent' });
    for (const name of ['fonte', 'nuovo', 'altro', 'porta']) expect((await create(name)).status).toBe(200);
    const door = MASSO.replace('  <prl in="B D"', '  <import file="part-door"/>\n  <prl in="B D"');
    expect((await commit('fonte', lib({ 'masso-di-prova': { entry: STONE, xml: c.rewritten }, [c.id]: { entry: PART, xml: c.part }, 'masso-porta': { entry: { ...STONE, name: 'Masso con la porta' }, xml: door } }))).status).toBe(200);
    // Another universe with a part of the same name and another program.
    expect((await commit('altro', lib({ [c.id]: { entry: PART, xml: c.part.replace('Moss', 'Musk') } }))).status).toBe(200);
  });
  afterAll(async () => {
    await close?.();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });

  it('the choice lists the model, not its part; the model comes with its part, a card of its own with the chain one link longer', async () => {
    const kin = await ask('GET', '/api/universe/nuovo/kin');
    expect(kin.body.kin.find((u: { name: string }) => u.name === 'fonte').cards.map((x: { id: string }) => x.id)).toEqual(['masso-di-prova', 'masso-porta']);
    const r = await ask('POST', '/api/universe/nuovo/bring', { cards: [{ universe: 'fonte', model: 'masso-di-prova' }] });
    expect(r.status).toBe(200);
    expect(r.body.brought).toEqual([
      { id: 'masso-di-prova', kind: 'model', name: 'Masso di prova', from: 'fonte' },
      { id: c.id, kind: 'model', name: 'Parte: muschio e lichene', from: 'fonte' },
    ]);
    const root = path.join(dir, 'nuovo');
    expect(git(root, 'log', '-1', '--format=%s')).toBe('carte portate prima della Genesi: «Masso di prova» (fonte), «Parte: muschio e lichene» (fonte)');
    expect(readFileSync(path.join(root, 'models', `${c.id}.xml`), 'utf8')).toBe(c.part);
    expect(readFileSync(path.join(root, 'models', 'masso-di-prova.xml'), 'utf8')).toBe(c.rewritten);
    const index = JSON.parse(readFileSync(path.join(root, 'models', 'index.json'), 'utf8'));
    expect(index[c.id]).toMatchObject({ class: 'rock', part: true, specialty: 'landscaper', from: 'masso-di-prova', brought: 'fonte', score: 7, card: { author: 'sculptor', holder: 'me', origins: [{ holder: 'anna', universe: 'fonte' }] } });
    expect(Object.keys(r.body.changes).sort()).toEqual([`models/${c.id}.xml`, 'models/index.json', 'models/masso-di-prova.xml'].sort());
  });

  it('a part alone does not come; one already here with another program, or what the universe does not have, stops the card', async () => {
    const alone = await ask('POST', '/api/universe/porta/bring', { cards: [{ universe: 'fonte', model: c.id }] });
    expect(alone.status).toBe(422);
    expect(alone.body.cards[0].reason).toMatch(/viene con le carte che la includono/);
    const door = await ask('POST', '/api/universe/porta/bring', { cards: [{ universe: 'fonte', model: 'masso-porta' }] });
    expect(door.status).toBe(422);
    expect(door.body.cards[0].reason).toBe("legge models/part-door.xml, che in questo universo non c'è");
    const clash = await ask('POST', '/api/universe/altro/bring', { cards: [{ universe: 'fonte', model: 'masso-di-prova' }] });
    expect(clash.status).toBe(422);
    expect(clash.body.cards[0].reason).toMatch(/c'è con un altro programma/);
    expect(existsSync(path.join(dir, 'porta', 'models', 'masso-porta.xml'))).toBe(false);
  });

  it('the program of a brought card is checked with the files it reads', () => {
    const files = mjxIncludes(c.rewritten, (f) => (f === `${c.id}.xml` ? c.part : undefined));
    const check = inlineChecker();
    return Promise.all([
      check.check({ kind: 'model', xml: c.rewritten, class: 'rock' }).then((r) => expect('errors' in r && r.errors.join(' ')).toMatch(/manca il file/)),
      check.check({ kind: 'model', xml: c.rewritten, class: 'rock', files }).then((r) => expect(r).toEqual({ errors: [] })),
      check.check({ kind: 'model', xml: c.rewritten, class: 'rock', files: { '../x.xml': 'a' } }).then((r) => expect('errors' in r && r.errors[0]).toMatch(/file del programma non valido/)),
    ]);
  });
});

describe('a library with parts, brought by hand', () => {
  it('withBrought keeps the parts it is given', () => {
    const c = composed();
    const out = JSON.parse(withBrought('{}', { [c.id]: { class: 'rock', part: true } as never }));
    expect(out[c.id]).toEqual({ class: 'rock', part: true });
  });
});
