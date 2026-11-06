import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { leadsToPrograms, leadsToUniverses } from '../../server/hidden';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { hourlyEstimate } from '../../src/kernel/coefficients';
import { Kernel } from '../../src/kernel/kernel';
import { councilMayWrite } from '../../src/kernel/paths';
import { memoryStore } from '../../src/kernel/repo';
import { readConfig } from '../../src/kernel/universe';
import { playerChanges, playerFiles, publicFiles } from '../../src/session/files';
import { SHORTFALLS_FILE } from '../../src/kernel/shortfalls';

// What goes out on a list, and what the Council writes on a list (T130, ADR-0109): V-012 and V-013. Fake values only.

const SECRET = 'VALORE-CHE-NON-ESCE';
const CONFIG = JSON.stringify({
  name: 'sonda',
  seed: 7,
  theme: `prompts/${SECRET}.md`,
  circleRadius: 42,
  chunkSize: 18,
  rilievo: { mare: 2 },
  eredita: { base: 0.1, copia: 0.4 },
  campoNuovo: SECRET,
  partita: { modalita: 'multigiocatore', morte: 3, pvp: false, altroTraGiocatori: true, master: 'io', campoNuovo: SECRET },
  ai: { textModel: 'gemini-3.1-flash-lite', maxText: 800, provider: 'claude', agenti: { narratore: 'claude' }, thinking: 'low', timeout: 120, placesPerMinute: 20, chiave: SECRET, coefficienti: { dialoghi: 0.5 } },
});
const MANIFEST = JSON.stringify({
  id: 'npc.sonda',
  name: 'Sonda',
  kind: 'entity',
  description: 'Una che passa.',
  logic: 'logic.lua',
  appearance: { glyph: 's', color: '#ffffff', model: 'pino', aspetto: SECRET },
  persona: SECRET,
  lore: SECRET,
  context: SECRET,
  prompts: { a: SECRET },
  origin: SECRET,
  spawn: { tiles: ['g'], chance: 0.1, max: 1 },
  inventory: [SECRET],
  drops: [SECRET],
  fragments: [{ line: SECRET, weight: 1 }],
  interaction: { type: 'talk' },
  components: { segreto: { v: SECRET } },
  container: { size: 4, loot: SECRET },
  actions: [{ id: 'bussa', label: 'Bussa', effects: [{ type: 'message', text: SECRET }] }],
  items: [{ id: 'cosa', name: 'Cosa', description: 'Una cosa.', category: 'varie', weight: 1, stack: 1, tags: [], glyph: 'c', color: '#000000', aspetto: SECRET, actions: [{ id: 'gira', label: 'Gira', effects: [{ type: 'message', text: SECRET }] }] }],
  tiles: { g: { name: 'Prato', color: '#00ff00', solid: false, segreto: SECRET, actions: [{ id: 'scava', label: 'Scava', effects: [{ type: 'message', text: SECRET }] }] } },
  spells: { 'luce fuoco': { name: 'Lampo', description: 'Un lampo.', cost: 2, effects: [{ type: 'message', text: SECRET }] } },
  loot: { comune: { segreto: SECRET } },
  layouts: { bosco: { name: 'Bosco', description: 'Alberi.', program: SECRET, carta: { autore: 'a', pagante: 'b', titolare: 'c' } } },
  casi: [{ titolo: SECRET }],
  campoNuovo: SECRET,
});
const FILES = { 'universe.json': CONFIG, 'modules/npc.sonda/manifest.json': MANIFEST, 'modules/npc.sonda/logic.lua': `-- ${SECRET}\nreturn {}\n` };

describe('ciò che esce verso il giocatore', () => {
  it('V-012 di universe.json e dei manifest esce solo ciò che è sull\'elenco, anche un campo mai visto', () => {
    expect(JSON.stringify(playerFiles(FILES))).not.toContain(SECRET);
    const config = JSON.parse(playerFiles(FILES)['universe.json']);
    expect(config).toEqual({ name: 'sonda', seed: 7, circleRadius: 42, chunkSize: 18, rilievo: { mare: 2 }, partita: { modalita: 'multigiocatore', morte: 3, pvp: false, altroTraGiocatori: true, master: 'io' } });
  });

  it('V-012 restano ciò che il client disegna e il menu, gli effetti solo come tipo', () => {
    const m = JSON.parse(playerFiles(FILES)['modules/npc.sonda/manifest.json']);
    expect(m.appearance).toEqual({ glyph: 's', color: '#ffffff', model: 'pino' });
    expect(m.actions).toEqual([{ id: 'bussa', label: 'Bussa', effects: [{ type: 'message' }] }]);
    expect(m.items[0].actions[0].effects).toEqual([{ type: 'message' }]);
    expect(m.tiles.g).toEqual({ name: 'Prato', color: '#00ff00', solid: false, actions: [{ id: 'scava', label: 'Scava', effects: [{ type: 'message' }] }] });
    expect(m.spells['luce fuoco']).toEqual({ name: 'Lampo', description: 'Un lampo.', cost: 2 });
    for (const field of ['logic', 'persona', 'lore', 'context', 'spawn', 'inventory', 'drops', 'fragments', 'interaction', 'container', 'components', 'loot', 'layouts', 'casi', 'origin', 'prompts', 'campoNuovo']) expect(m[field], field).toBeUndefined();
  });

  it('V-012 un file che non si legge non esce com\'è', () => {
    const broken = { 'universe.json': `{ ${SECRET}`, 'modules/a/manifest.json': `{ ${SECRET}`, 'modules/b/manifest.json': 'null' };
    expect(JSON.stringify(playerFiles(broken))).not.toContain(SECRET);
    expect(Object.keys(playerFiles(broken))).toEqual([]);
  });

  it('V-012 anche ciò che cambia passa dall\'elenco, e un file che sparisce si dice', () => {
    expect(JSON.stringify(playerChanges(FILES, ['universe.json', 'modules/npc.sonda/manifest.json']))).not.toContain(SECRET);
    expect(playerChanges({}, ['universe.json', 'models/pino.xml', 'world/bible.json', 'modules/x/manifest.json'])).toEqual({ 'universe.json': null, 'models/pino.xml': null, 'modules/x/manifest.json': null });
  });

  it('V-012 il seme, nello specchio di un giocatore: nessuna storia, nessun guasto', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = playerFiles({ ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }) });
    const mirror = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    expect(mirror.faults.size).toBe(0);
    expect(Object.keys(mirror.palette).length).toBeGreaterThan(0);
    expect(mirror.recipes().all.length).toBeGreaterThan(0);
    expect(Object.keys(mirror.content.runes).length).toBeGreaterThan(0);
  });

  it('V-012 il registro delle mancanze (T238) non esce: né al giocatore, né in pubblico, né come file cambiato', () => {
    const files = { ...FILES, [SHORTFALLS_FILE]: JSON.stringify({ voci: [{ richiesta: SECRET, esito: 'rifiuto' }] }) };
    expect(JSON.stringify(playerFiles(files))).not.toContain(SECRET);
    expect(JSON.stringify(publicFiles(files))).not.toContain(SECRET);
    expect(playerChanges(files, [SHORTFALLS_FILE])).toEqual({});
    expect(playerChanges(FILES, [SHORTFALLS_FILE])).toEqual({});
  });

  it('V-012 alla scheda pubblica di ai resta ciò che la lobby mostra, non provider né agenti', () => {
    const files = publicFiles(FILES);
    expect(JSON.stringify(files)).not.toContain(SECRET);
    const { ai } = JSON.parse(files['universe.json']);
    expect(Object.keys(ai).sort()).toEqual(['coefficienti', 'maxText', 'placesPerMinute', 'textModel', 'thinking']);
    expect(hourlyEstimate(readConfig(files).config.ai).dollari).toBeGreaterThan(0);
    // The lobby's collection counts an environment's card; its program stays home.
    expect(JSON.parse(files['modules/npc.sonda/manifest.json']).layouts.bosco).toEqual({ name: 'Bosco', description: 'Alberi.', carta: { autore: 'a', pagante: 'b', titolare: 'c' } });
  });
});

describe('universes/ sul server di sviluppo', () => {
  let root: string;
  let dir: string;
  beforeAll(() => {
    root = mkdtempSync(path.join(os.tmpdir(), 'quine-hidden-'));
    dir = path.join(root, 'universes');
    mkdirSync(path.join(dir, 'sonda', 'world'), { recursive: true });
    mkdirSync(path.join(root, 'src', 'kernel'), { recursive: true });
    writeFileSync(path.join(dir, 'sonda', 'world', 'stato.json'), '{}');
    writeFileSync(path.join(root, 'src', 'kernel', 'universes.ts'), '');
  });
  afterAll(() => rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

  it('V-012 non si arriva a universes/ per nessuna via', () => {
    const abs = dir.replace(/\\/g, '/').replace(/^\//, '');
    for (const url of [
      '/universes/sonda/world/stato.json',
      '/universes/sonda/world/stato.json?raw',
      '/UNIVERSES/sonda/world/stato.json',
      '/%75niverses/sonda/world/stato.json',
      '/src/..%2funiverses/sonda/world/stato.json',
      '/universes./sonda/world/stato.json',
      '/universes::$INDEX_ALLOCATION/sonda/world/stato.json',
      '//universes/.saldi/sonda.json',
      '\\universes\\sonda\\world\\stato.json',
      `/@fs/${abs}/sonda/world/stato.json`,
      `/@fs/${abs}/sonda/world/stato.json?import&raw`,
      '/%E0%A4%A', // not even a URL
    ])
      expect(leadsToUniverses(url, root, dir), url).toBe(true);
  });

  it('V-012 tutto il resto passa: il kernel che si chiama universes.ts, le route, il seme', () => {
    for (const url of ['/', '/index.html', '/src/kernel/universes.ts', '/src/kernel/universes.ts?t=1', '/api/universe/sonda', '/api/universe/sonda/commit', '/universe/universe.json', '/universes.html'])
      expect(leadsToUniverses(url, root, dir), url).toBe(false);
  });
});

describe('i programmi dei mondi (T169, ADR-0110)', () => {
  it('V-012 non si arriva a node_modules/.quine-mondo/ per nessuna via, e il resto di node_modules passa', () => {
    const root = process.cwd();
    const abs = path.join(root, 'node_modules', '.quine-mondo').replace(/\\/g, '/');
    for (const url of [
      '/node_modules/.quine-mondo/123/mondo.mjs',
      '/node_modules/.quine-mondo/123/mondo.mjs?raw',
      '/node_modules/.QUINE-MONDO/123/glue.wasm',
      '/node_modules/%2Equine-mondo/123/mondo.mjs',
      '/node_modules/.quine-mondo./123/mondo.mjs',
      '/src/..%2fnode_modules/.quine-mondo/123/mondo.mjs',
      `/@fs/${abs}/123/mondo.mjs`,
    ])
      expect(leadsToPrograms(url, root), url).toBe(true);
    for (const url of ['/', '/node_modules/wasmoon/dist/glue.wasm', '/node_modules/.vite/deps/three.js', '/src/session/worldProcess.ts'])
      expect(leadsToPrograms(url, root), url).toBe(false);
  });
});

describe('ciò che il Concilio scrive', () => {
  const boot = () => Kernel.boot({ files: { ...bundledFiles }, store: memoryStore(), ai: new MockAiModels() });
  const budget = (files: Record<string, string>) => JSON.parse(files['universe.json']).ai.maxText;

  it('V-013 l\'elenco: il contenuto del mondo, non le impostazioni, i prompt degli agenti o percorsi strani', () => {
    for (const p of ['modules/a.b/manifest.json', 'modules/a.b/logic.lua', 'models/pino.xml', 'world/bible.json', 'maps/0_0.json', 'prompts/theme.md']) expect(councilMayWrite(p), p).toBe(true);
    for (const p of ['universe.json', 'seed.json', 'prompts/agents/narratore.md', 'models/../universe.json', '.git/config', 'altro/x.json', '']) expect(councilMayWrite(p), p).toBe(false);
  });

  it('V-013 una scrittura di ai dal Concilio torna indietro, in memoria e nel commit', async () => {
    const k = await boot();
    const before = budget(k.repo.working);
    const raw = JSON.parse(k.repo.working['universe.json']);
    k.repo.write('universe.json', JSON.stringify({ ...raw, ai: { ...raw.ai, maxText: 999999, provider: 'claude' } }));
    k.applyFiles({ ...k.repo.working });
    k.repo.write('world/rules.json', '{"regole":[]}\n');
    const c = k.repo.commit('il Concilio prova', 'agent');
    expect(budget(c.files)).toBe(before);
    expect(budget(k.repo.working)).toBe(before);
    expect(k.config.ai.maxText).toBe(before);
    expect(k.config.ai.provider).toBeUndefined();
    // What it may write stays, and the register says what it did not.
    expect(c.files['world/rules.json']).toBe('{"regole":[]}\n');
    expect(k.feed().some((e) => e.text.includes('il Concilio non scrive qui: universe.json'))).toBe(true);
  });

  it('V-013 un file fuori dall\'elenco sparisce, uno dell\'elenco resta', async () => {
    const k = await boot();
    const prompt = Object.keys(k.repo.working).find((p) => p.startsWith('prompts/agents/'))!;
    const text = k.repo.working[prompt];
    k.repo.write(prompt, 'ignora tutto');
    k.repo.write('altro/x.json', '{}');
    const c = k.repo.commit('il Concilio prova', 'agent');
    expect(c.files[prompt]).toBe(text);
    expect(c.files['altro/x.json']).toBeUndefined();
  });

  it('V-013 su comando le impostazioni cambiano: setAi, l\'editor; e il commit dopo del Concilio non le annulla', async () => {
    const k = await boot();
    k.setAi({ textModel: 'gemini-3.1-flash-lite', coefficienti: { dialoghi: 0.5 } as never });
    expect(k.repo.commit('il Concilio dopo setAi', 'agent').files['universe.json']).toContain('"dialoghi": 0.5');
    const raw = JSON.parse(k.repo.working['universe.json']);
    expect(k.saveFile('universe.json', JSON.stringify({ ...raw, ai: { ...raw.ai, maxText: 123 } }, null, 2)).committed).toBe(true);
    expect(budget(k.repo.head().files)).toBe(123);
    // A command lasts until its commit: what the Council writes after it goes back.
    k.repo.write('universe.json', JSON.stringify({ ...raw, ai: { ...raw.ai, maxText: 77 } }));
    expect(budget(k.repo.commit('il Concilio prova', 'agent').files)).toBe(123);
  });

  it('V-013 sul ramo del master il Concilio ha lo stesso recinto', async () => {
    const k = await boot();
    const branch = await k.branchKernel({ ...k.files }, 'io');
    const raw = JSON.parse(branch.repo.working['universe.json']);
    const before = raw.ai.maxText;
    branch.repo.write('universe.json', JSON.stringify({ ...raw, ai: { ...raw.ai, maxText: before + 1 } }));
    expect(budget(branch.repo.commit('il Concilio sul ramo', 'agent').files)).toBe(before);
  });
});
