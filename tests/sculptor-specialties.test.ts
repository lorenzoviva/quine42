// The Sculptor by specialty (T468, ADR-0239, S2 of T458): one agent, eight roles that the kernel decides from the class, the size and the
// request; the prompt as a core that every trade reads and a section of each, in the order the cache serves (core, principles, «Lingua», style
// guide, section, examples), each stable part with its mark on OpenRouter; the action with the core of the actions and the section of its
// model's trade; the prompt of before, whole, where a universe has it; the specialty in the ledger; the director in a queue by specialty.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { OPENROUTER_MODELS, OpenRouterAiModels, openRouterBody, systemParts, MAX_CACHE_MARKS } from '../src/kernel/ai/openrouter';
import { UsageLog, type CallRecord } from '../src/kernel/ai/usage';
import { Council, systemOf } from '../src/kernel/agents/council';
import {
  CORE_MARK,
  DEFAULT_SCULPTORS,
  examplesFor,
  hasCore,
  sculpt,
  sculptAction,
  sculptorRole,
  sculptorSection,
  sectionPath,
  SPECIALTIES,
  SPECIALTY_CLASSES,
  SPECIALTY_NAMES,
  specialtyOf,
  STRUCTURES_MARK,
  withoutNotes,
  type SculptorSpecialty,
  type SculptRequest,
} from '../src/kernel/agents/sculptor';
import { bySpecialty } from '../src/kernel/modeldirector';
import { CLASSES, classOf } from '../src/mj/classes';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import type { FileMap } from '../src/kernel/types';

const cls = (id: string) => classOf(id)!;
const TRADES = SPECIALTIES.filter((s) => s !== 'architect' && s !== 'actions');

/** A Council that keeps what it sent. */
function recording(files: FileMap = bundledFiles) {
  const calls: TextCall[] = [];
  class Recording extends MockAiModels {
    async text(call: TextCall): Promise<string> {
      calls.push(call);
      return super.text(call);
    }
  }
  return { calls, council: new Council(new Recording(), () => ({ files, palette: {}, catalog: [] })) };
}

const ONE = { semplici: 1, revisione: false, giudizio: false };

/** One request of every kind, with its trade. */
const REQUESTS: Array<{ req: SculptRequest; spec: SculptorSpecialty }> = [
  { req: { id: 't468-castagno', nome: 'Castagno', aspetto: 'un albero dal tronco largo', classe: 'tree' }, spec: 'landscaper' },
  { req: { id: 't468-baule', nome: 'Baule', aspetto: 'un baule di legno', classe: 'furniture' }, spec: 'joiner' },
  { req: { id: 'shape-sack', nome: 'sacco (forma comune degli oggetti)', aspetto: 'un sacco', classe: 'object', tinta: true }, spec: 'joiner' },
  { req: { id: 't468-cappuccio', nome: 'Cappuccio', aspetto: 'un cappuccio di lana', classe: 'object', worn: 'head' }, spec: 'tailor' },
  { req: { id: 't468-mugnaia', nome: 'Mugnaia', aspetto: 'una donna col grembiule', classe: 'person' }, spec: 'figurist' },
  { req: { id: 't468-pozzo', nome: 'Pozzo', aspetto: 'un pozzo di pietra', classe: 'building' }, spec: 'mason' },
  { req: { id: 't468-capanno', nome: 'Capanno', aspetto: 'una baracca di assi', classe: 'structure', taglia: 'medium' }, spec: 'mason' },
  { req: { id: 't468-barca', nome: 'Barca da pesca', aspetto: 'una barca a vela', classe: 'vessel', taglia: 'large' }, spec: 'coachbuilder' },
  { req: { id: 't468-mulino', nome: 'Mulino', aspetto: 'un mulino di pietra', classe: 'structure', taglia: 'large' }, spec: 'architect' },
];

describe('le specialità dello Scultore (T468)', () => {
  it('ogni classe ha la sua: la taglia fa l’Architetto, ciò che si indossa il Sarto', () => {
    const expected: Record<string, SculptorSpecialty> = { pebble: 'landscaper', cover: 'landscaper', rock: 'landscaper', bush: 'landscaper', tree: 'landscaper', object: 'joiner', furniture: 'joiner', person: 'figurist', animal: 'figurist', beast: 'figurist', monument: 'mason', building: 'mason', structure: 'architect', vessel: 'coachbuilder' };
    for (const c of CLASSES) expect(specialtyOf(c), c.id).toBe(expected[c.id]);
    // The structures grow by rules from Large up: below it they are built in one box, the mason's.
    for (const taglia of ['tiny', 'small', 'medium'] as const) expect(specialtyOf(cls('structure'), { taglia })).toBe('mason');
    for (const taglia of ['large', 'huge', 'gargantuan'] as const) expect(specialtyOf(cls('structure'), { taglia })).toBe('architect');
    expect(specialtyOf(cls('object'), { worn: 'head' })).toBe('tailor');
    // Every trade is reached by some class or request, and every trade has its name and its classes.
    const reached = new Set([...CLASSES.map((c) => specialtyOf(c)), 'tailor', 'mason', 'actions']);
    for (const s of SPECIALTIES) {
      expect(reached.has(s), s).toBe(true);
      expect(SPECIALTY_NAMES[s]).toBeTruthy();
    }
    expect(Object.values(SPECIALTY_NAMES).slice(0, 7)).toEqual(['Paesaggista', 'Mobiliere', 'Sarto', 'Figurinista', 'Capomastro', 'Architetto', 'Carrozziere']);
    for (const c of CLASSES) expect(SPECIALTY_CLASSES[specialtyOf(c)], c.id).toContain(c.id);
  });

  it('il seme ha il nucleo e una sezione per mestiere; il nucleo è lo stesso per tutti, senza ciò che è di uno solo', () => {
    expect(hasCore(bundledFiles)).toBe(true);
    for (const s of [...TRADES, 'architect' as const]) expect(bundledFiles[sectionPath(s)], s).toBeTruthy();
    const core = sculptorRole(bundledFiles, 'landscaper');
    for (const s of TRADES) expect(sculptorRole(bundledFiles, s), s).toBe(core);
    expect(sculptorRole(bundledFiles)).toBe(core);
    for (const title of ['## Coordinates and scale', '## The program', '## The palette and the colours', '## Patterns', '## Nodes (the same', '## Nodes that look ahead', '## How to sculpt well', '## Traps']) expect(core).toContain(title);
    // What is of one trade only, and what serves nobody (the showcase of three programs the Sculptor never sees), is not in the core.
    for (const not of ['## Worn things', '## Vessels', '## The colour of the thing', 'part="leg"', '- People:', 'Sizes (D&D)', '  - tree:', 'schermo-scritte', '## Tiles and files', '<wfc', '<!--', '@@']) expect(core, not).not.toContain(not);
    expect(core).toMatch(/^# The Sculptor\n\nYou are the Sculptor/);
  });

  it('ogni sezione dice le sue classi e ciò che è suo, e niente degli altri', () => {
    const owns: Record<string, string[]> = {
      landscaper: ['  - tree:', '  - bush:', '  - rock:', '  - pebble:'],
      joiner: ['  - furniture:', '  - object:', '## The colour of the thing'],
      tailor: ['  - object:', '## Worn things', '<worn zone="head|torso|back">'],
      figurist: ['  - person:', '  - animal:', '  - beast:', 'part="leg"', '- People: legs'],
      mason: ['  - building:', '  - monument:', '  - structure:', 'Sizes (D&D)'],
      coachbuilder: ['  - vessel:', '## Vessels', 'waterline="N"'],
    };
    const all = Object.values(owns).flat();
    for (const s of TRADES) {
      const section = sculptorSection(bundledFiles, s);
      expect(section, s).toMatch(/^## Your trade: the /);
      for (const own of owns[s]) expect(section, `${s}: ${own}`).toContain(own);
      for (const other of all.filter((x) => !owns[s].includes(x) && !(s === 'tailor' && x === '## The colour of the thing'))) expect(section, `${s} ≠ ${other}`).not.toContain(other);
      expect(section, s).not.toMatch(/<!--|@@/);
    }
    // The architect's section is its role; the actions have none of their own.
    expect(sculptorSection(bundledFiles, 'architect')).toBe('');
    expect(sculptorSection(bundledFiles, 'actions')).toBe('');
  });

  it('l’Architetto legge il suo prompt intero, quello delle strutture di prima, coi commenti dei pezzi di programma', () => {
    const role = sculptorRole(bundledFiles, 'architect');
    expect(role).toBe(bundledFiles['prompts/agents/sculptor/architect.md']!.trim());
    expect(sculptorRole(bundledFiles, true)).toBe(role);
    expect(role).toMatch(/^Write a MarkovJunior XML program that \*\*grows\*\*/);
    expect(role).toContain('## How to answer, block by block');
    // The comments inside the code fences are pieces of program: they stay.
    expect(role).toContain('<!-- A. the composition, on the plan (z=0)');
    expect(role).not.toContain('## Traps');
  });

  it('ogni richiesta ha il suo prompt, nell’ordine che la cache serve, con le sue parti stabili segnate', async () => {
    for (const { req, spec } of REQUESTS) {
      const { calls, council } = recording();
      await sculpt(council, req, DEFAULT_SCULPTORS, ONE);
      const call = calls.find((x) => x.task === 'model.sculpt')!;
      expect(call.specialty, req.id).toBe(spec);
      const system = call.system;
      const role = sculptorRole(bundledFiles, spec);
      expect(system.startsWith(role), req.id).toBe(true);
      const breaks = call.cacheBreaks!;
      expect(breaks[breaks.length - 1], req.id).toBe(system.length);
      // The common part ends with the style guide; after it the section, then the examples.
      expect(system.slice(0, breaks[0]).trimEnd().endsWith(council.context('sculptor').trimEnd()), req.id).toBe(true);
      if (spec === 'architect') {
        expect(breaks, req.id).toHaveLength(1);
        continue;
      }
      const section = sculptorSection(bundledFiles, spec);
      expect(system.slice(breaks[0], breaks[1]).trim(), req.id).toBe(section);
      const examples = examplesFor(bundledFiles, { ...req, classe: cls(req.classe).id });
      if (examples.length) expect(system.slice(breaks[1]).trim(), req.id).toBe(`## Examples (programs of the library)\n${examples.join('\n\n')}`);
      expect(system.indexOf(section), req.id).toBeGreaterThan(system.indexOf('## Style guide'));
      // Nobody reads another trade's section.
      for (const other of TRADES.filter((s) => s !== spec)) if (sculptorSection(bundledFiles, other) !== section) expect(system, `${req.id} ≠ ${other}`).not.toContain(sculptorSection(bundledFiles, other));
    }
  }, 30_000);

  it('un’azione: il nucleo delle azioni e la sezione del mestiere del suo modello', async () => {
    const actions = sculptorRole(bundledFiles, 'actions');
    for (const has of ['## Coordinates and scale', '## The program', '## Patterns', '## Nodes (the same', '<rule><in>RB</in><out>WR</out></rule>', '## Traps']) expect(actions, has).toContain(has);
    for (const not of ['## The palette and the colours', '## Nodes that look ahead', '## How to sculpt well', '<field for=', ' · ']) expect(actions, not).not.toContain(not);
    expect(sculptorSection(bundledFiles, 'actions', 'joiner')).toBe(sculptorSection(bundledFiles, 'joiner'));
    // A structure that grows by rules: the mason's section, not the method of a whole composition.
    expect(sculptorSection(bundledFiles, 'actions', 'architect')).toBe(sculptorSection(bundledFiles, 'mason'));
    const { calls, council } = recording();
    const xml = bundledFiles['models/barile.xml']!;
    const r = await sculptAction(council, { nome: 'Barile', xml, classe: 'furniture', azione: 'open', etichetta: 'Apri il barile', testo: 'apro il barile', cambia: 'il coperchio si apre' }, DEFAULT_SCULPTORS.simple, 0);
    expect(r?.xml).toContain('<action name="open"');
    const call = calls.find((x) => x.task === 'model.action')!;
    expect(call.specialty).toBe('actions');
    expect(call.system.startsWith(actions)).toBe(true);
    expect(call.system).toContain(sculptorSection(bundledFiles, 'joiner'));
    expect(call.system).not.toContain('## How to sculpt well');
  }, 30_000);

  it('le sezioni dei file vanno solo dove models/ ne ha, e mai a un’azione', () => {
    const tileset = '<tileset values="BW"><tile name="Room"/><tile name="Hall"/></tileset>';
    const withFiles: FileMap = { ...bundledFiles, 'models/stanze.xml': tileset };
    expect(sculptorRole(withFiles, 'joiner')).toContain('## Tiles and files (as in MarkovJunior)');
    expect(sculptorRole(withFiles, 'joiner')).toContain('<wfc tileset="x"');
    expect(sculptorRole(withFiles, 'actions')).not.toContain('## Tiles and files');
    expect(sculptorRole(bundledFiles, 'joiner')).not.toContain('## Tiles and files');
  });

  it('il prompt di prima, senza il segno del nucleo, va intero come prima', () => {
    const before = [
      '# The Sculptor',
      '',
      'You are the Sculptor.',
      '',
      '## Coordinates and scale',
      '- A tile is @@TILE@@ voxels.',
      '@@CLASSES@@',
      '',
      '## The program',
      '@@PALETTE@@',
      '',
      '## Worn things',
      'Worn.',
      '',
      STRUCTURES_MARK,
      'Write a program that grows the building.',
    ].join('\n');
    const files: FileMap = { ...bundledFiles, 'prompts/agents/sculptor.md': before };
    expect(hasCore(files)).toBe(false);
    const general = sculptorRole(files, 'landscaper');
    for (const s of TRADES) expect(sculptorRole(files, s)).toBe(general);
    expect(sculptorRole(files, 'actions')).toBe(general);
    for (const c of CLASSES) expect(general).toContain(`  - ${c.id}:`);
    expect(general).toContain('Sizes (D&D)');
    expect(general).toContain('## Worn things');
    expect(general).not.toContain('@@');
    expect(general).not.toContain('grows the building');
    expect(sculptorRole(files, 'architect')).toBe('Write a program that grows the building.');
    // The sections from the seed are there, and nobody reads them: the prompt of before already says everything.
    for (const s of SPECIALTIES) expect(sculptorSection(files, s), s).toBe('');
    // Without the file at all, the line of always.
    const none = { ...bundledFiles } as Record<string, string>;
    delete none['prompts/agents/sculptor.md'];
    expect(sculptorRole(none, 'joiner')).toBe('You are the Sculptor: you write MarkovJunior programs in XML.');
  });

  it('una sezione che l’universo non ha manca e basta; l’Architetto senza il suo file legge il nucleo', () => {
    const files = { ...bundledFiles } as Record<string, string>;
    delete files[sectionPath('figurist')];
    delete files[sectionPath('architect')];
    expect(sculptorSection(files, 'figurist')).toBe('');
    expect(sculptorRole(files, 'architect')).toBe(sculptorRole(files, 'mason'));
  });

  it('le note per chi scrive il prompt non arrivano al modello, i commenti dei programmi sì', () => {
    expect(withoutNotes('# A\n<!-- a note -->\ntext\n```xml\n<!-- in the program -->\n<one/>\n```\n  <!-- another -->\nend')).toBe('# A\ntext\n```xml\n<!-- in the program -->\n<one/>\n```\nend');
    expect(bundledFiles['prompts/agents/sculptor.md']).toContain(CORE_MARK);
  });
});

describe('il sistema in parti e i segni della cache (T468)', () => {
  it('systemOf: lo stesso testo di sempre, e dove finisce ogni parte stabile', () => {
    const { system, breaks } = systemOf(['ruolo', 'principi', '', 'contesto'], ['sezione', undefined, 'esempi'], 'focus');
    expect(system).toBe(['ruolo', 'principi', 'contesto', 'sezione', 'esempi', 'focus'].join('\n\n'));
    expect(breaks.map((b) => system.slice(0, b).split('\n\n').pop())).toEqual(['contesto', 'sezione', 'esempi']);
    expect(systemOf(['ruolo'], [undefined]).breaks).toEqual(['ruolo'.length]);
  });

  it('su OpenRouter un segno alla fine di ogni parte stabile, al più quattro; senza parti un segno alla fine, come prima', () => {
    const text = 'comune\n\nsezione\n\nesempi\n\nfocus';
    const parts = systemParts(text, [6, 15, 23]);
    expect(parts.map((p) => p.text).join('')).toBe(text);
    expect(parts.map((p) => !!p.cache_control)).toEqual([true, true, true, false]);
    expect(parts[3].text).toBe('\n\nfocus');
    expect(systemParts('tutto')).toEqual([{ type: 'text', text: 'tutto', cache_control: { type: 'ephemeral' } }]);
    // Never more than four marks: the first three and the last.
    const many = systemParts('abcdefgh', [1, 2, 3, 4, 5, 6, 8]);
    expect(many.filter((p) => p.cache_control)).toHaveLength(MAX_CACHE_MARKS);
    expect(many.map((p) => p.text)).toEqual(['a', 'b', 'c', 'defgh']);
    // A part of blanks goes with the next one, and nothing is lost.
    expect(systemParts('abc\n\n  \n\ndef', [3, 8, 13]).map((p) => p.text)).toEqual(['abc', '\n\n  \n\ndef']);
  });

  it('la richiesta di un Capomastro va a Opus in tre parti segnate, a Flash come testo', async () => {
    const { calls, council } = recording();
    await sculpt(council, REQUESTS.find((x) => x.spec === 'mason')!.req, DEFAULT_SCULPTORS, ONE);
    const call = calls.find((x) => x.task === 'model.sculpt')!;
    const opus = openRouterBody(call, OPENROUTER_MODELS['claude-opus-5-5'], 'low') as { messages: Array<{ content: unknown }> };
    const content = opus.messages[0].content as Array<{ text: string; cache_control?: unknown }>;
    expect(content).toHaveLength(3);
    expect(content.every((p) => p.cache_control)).toBe(true);
    expect(content.map((p) => p.text).join('')).toBe(call.system);
    expect(content[1].text.trim()).toBe(sculptorSection(bundledFiles, 'mason'));
    const flash = openRouterBody(call, OPENROUTER_MODELS['gemini-3.1-flash-lite'], 'low') as { messages: Array<{ content: unknown }> };
    expect(flash.messages[0].content).toBe(call.system);
  }, 30_000);
});

describe('la specialità nel registro dei consumi (T468)', () => {
  const rec = (specialty?: string): CallRecord => ({ model: 'gemini-3.1-flash-lite', agent: 'sculptor', task: 'model.sculpt', prompt: 1000, cached: 0, output: 500, thoughts: 0, day: '2026-11-21', ...(specialty ? { specialty } : {}) });

  it('conta ogni specialità a parte, e il file la scrive solo se una chiamata la dice', () => {
    const log = new UsageLog();
    log.record(rec());
    expect(JSON.parse(log.toJson())).not.toHaveProperty('specialties');
    log.record(rec('joiner'));
    log.record(rec('joiner'));
    log.record(rec('landscaper'));
    expect(log.specialties('2026-11-21').joiner.calls).toBe(2);
    expect(log.sessionBySpecialty.landscaper.calls).toBe(1);
    const saved = JSON.parse(log.toJson());
    expect(Object.keys(saved.specialties['2026-11-21'])).toEqual(['joiner', 'landscaper']);
    // The days and the payers are as they were: four calls.
    expect(log.day('2026-11-21').total.calls).toBe(4);
    const again = new UsageLog();
    again.load(log.toJson());
    again.load(log.toJson());
    expect(again.specialties().joiner.calls).toBe(4);
  });

  it('il modello la copia dalla chiamata nel suo registro', async () => {
    const records: CallRecord[] = [];
    const answer = { choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: '<sequence values="BW"/>' } }], usage: { prompt_tokens: 100, completion_tokens: 50, cost: 0.0001 } };
    const impl = (async () => new Response(JSON.stringify(answer), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch;
    const m = new OpenRouterAiModels({ textModel: 'gemini-3.1-flash-lite', limits: { text: 5 }, fetchImpl: impl });
    m.onCall = (r) => records.push(r);
    await m.text({ agent: 'sculptor', task: 'model.sculpt', system: 'core', prompt: 'a chest', specialty: 'joiner' });
    expect(records[0]).toMatchObject({ task: 'model.sculpt', specialty: 'joiner' });
  });
});

describe('il direttore in fila per specialità (T468)', () => {
  it('bySpecialty: chi è stato scolpito per ultimo prima, poi gli altri a gruppi dove compare il primo', () => {
    const reqs = ['j1', 'f1', 'j2', 'l1', 'f2'];
    const trade = (r: string) => r[0];
    expect(bySpecialty(reqs, trade)).toEqual(['j1', 'j2', 'f1', 'f2', 'l1']);
    expect(bySpecialty(reqs, trade, 'l')).toEqual(['l1', 'j1', 'j2', 'f1', 'f2']);
    expect(bySpecialty(reqs, trade, 'x')).toEqual(['j1', 'j2', 'f1', 'f2', 'l1']);
  });

  it('ciò che manca dopo la Genesi è in fila per specialità, e il mestiere appena scolpito passa avanti', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    await k.runGenesis('un regno quieto di prati e borghi');
    const trades = (rs: SculptRequest[]) => rs.filter((r) => !r.id.startsWith('casa-comune-')).map((r) => specialtyOf(classOf(r.classe) ?? cls('object'), r));
    const runs = (xs: string[]) => xs.filter((x, i) => i === 0 || x !== xs[i - 1]);
    const before = trades(k.sculpting.missing());
    expect(new Set(before).size).toBeGreaterThan(1);
    // Each trade in one run.
    expect(runs(before)).toEqual([...new Set(before)]);
    // The last trade of the queue, sculpted now: what is left of it comes first.
    const last = before[before.length - 1];
    const req = k.sculpting.missing().find((r) => specialtyOf(classOf(r.classe) ?? cls('object'), r) === last)!;
    await k.sculpting.make(req);
    const after = trades(k.sculpting.missing());
    if (after.includes(last)) expect(after[0]).toBe(last);
    expect(runs(after)).toEqual([...new Set(after)]);
  }, 60_000);
});
