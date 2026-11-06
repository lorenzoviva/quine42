import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { buildGraph, GRAPH_FILE, readGraph, type GraphChunk } from '../src/kernel/graph';
import { writePlots, PLOTS_FILE, type Plot } from '../src/kernel/plots';
import type { FileMap } from '../src/kernel/types';

/** Ticks until every loaded chunk has been planned (as in world.ts). */
async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
}

const cats = (t: string) => (t === 'npc.cat' ? 'animal' : t ? 'person' : undefined) as 'animal' | 'person' | undefined;

const individual = (nome: string, tipo: string, famiglia: Array<[string, string]>, extra: Record<string, unknown> = {}) => ({
  nome,
  tipo,
  mestiere: 'contadino',
  famiglia: famiglia.map(([n, legame]) => ({ nome: n, legame })),
  routine: [{ quando: 'day', fa: 'lavora', dove: 'work' }, { quando: 'night', fa: 'dorme', dove: 'home' }],
  ...extra,
});

const manifest = (m: Record<string, unknown>) => JSON.stringify({ version: '0.1.0', ...m });

/** A small universe with the cases of valmora (the measures of T07): a cat brother of a man, one-sided bonds, a bond to nobody, names alike. */
function universe(): { files: FileMap; chunks: GraphChunk[] } {
  const plots: Plot[] = [
    {
      id: 'trama-lago',
      titolo: 'Il Ritmo del Lago',
      mistero: 'Qualcuno ruba le reti di Nereo.',
      coinvolti: ['Nereo', 'Bastiano', 'Gaspare'],
      tappe: [
        { giorno: 0, momento: 'morning', chi: 'Nereo', dove: 'Sulle rive del Lago Muto', cosa: 'conta le reti' },
        { giorno: 1, momento: 'evening', chi: 'Bastiano', dove: "Prato dell'Eco", cosa: 'aspetta' },
      ],
      inizio: 0,
      stato: 'active',
    },
  ];
  const files: FileMap = {
    'universe.json': JSON.stringify({ name: 'prova' }),
    'modules/npc.cat/manifest.json': manifest({ id: 'npc.cat', name: 'Gatto', kind: 'entity', appearance: { classe: 'animal' } }),
    'modules/npc.villager/manifest.json': manifest({ id: 'npc.villager', name: 'Abitante', kind: 'entity' }),
    'modules/obj.counter/manifest.json': manifest({ id: 'obj.counter', name: 'Banco', kind: 'entity' }),
    'modules/item.forbici/manifest.json': manifest({ id: 'item.scissors', name: 'Forbici', kind: 'item', tags: ['strumento'] }),
    'modules/items.pacco-1/manifest.json': manifest({
      id: 'items.pacco-1',
      name: 'Pacchetto 1',
      kind: 'data',
      items: [
        { id: 'item.pane', name: 'Pane', category: 'cibo' },
        { id: 'item.farina', name: 'Farina', category: 'materiale' },
      ],
      recipes: [
        { id: 'pane', name: 'Pane', inputs: [{ item: 'item.farina', count: 2 }], tools: ['item.scissors'], output: { item: 'item.pane', count: 1 } },
        { id: 'torta', name: 'Torta', inputs: [{ item: 'item.mela', count: 1 }], output: { item: 'item.torta', count: 1 } },
      ],
    }),
    'modules/magic.runes/manifest.json': manifest({ id: 'magic.runes', name: 'Rune magiche', kind: 'data', runes: { luce: { name: 'Luce' }, acqua: { name: 'Acqua' } } }),
    'modules/magic.spells/manifest.json': manifest({ id: 'magic.spells', name: 'Incantesimi', kind: 'data', spells: { 'luce acqua': { name: 'Arcobaleno', cost: 5, effects: [] }, 'luce vento': { name: 'Brezza', cost: 5, effects: [] } } }),
    'modules/world.layouts/manifest.json': manifest({ id: 'world.layouts', name: 'Ambienti', kind: 'data', layouts: { village: { name: 'Borgo', description: '', environment: 'villaggio' }, lake: { name: 'Lago', description: '', environment: 'acqua' } } }),
    'world/atlas.json': JSON.stringify({ regioni: [{ id: 'lago-muto', nome: 'Lago Muto', descrizione: 'un lago fermo', ambiente: 'lake', centro: [3, 0], raggio: 1 }] }),
    'world/people.json': JSON.stringify({
      persone: [
        individual('Fiocco', 'npc.cat', [['Bastiano', 'fratello'], ['Micetto', 'madre']], { luogo: 'Piazza del Borgo', genere: 'female' }),
        individual('Micetto', 'npc.cat', [['Fiocco', 'figlio'], ['Nessuno Mai', 'padrone']], { genere: 'male' }),
        individual('Bastiano', 'npc.villager', [['Fiocco', 'fratello'], ['Bastiano del Mulino', 'cugino']], { luogo: 'Piazza del Borgo', genere: 'male', specie: 'person' }),
        individual('Bastiano del Mulino', 'npc.villager', [], { luogo: 'Sulle rive del Lago Muto' }),
        individual('Nereo', 'npc.villager', [['Gaspare', 'padre'], ['Viandante', 'rivale']], { genere: 'female', luogo: 'Riva del Lago' }),
        individual('Gaspare', 'npc.villager', [['Nereo', 'padre']], { genere: 'male' }),
      ],
      attesi: [{ nome: 'Ilaria', legame: 'sorella', di: 'Gaspare' }, { nome: 'Batuffolo', legame: 'figlio', di: 'Micetto' }],
    }),
    [PLOTS_FILE]: writePlots(plots),
    'world/rules.json': JSON.stringify({ regole: [{ chiave: 'obj.counter|apri', testo: '«apri» su Banco', possibile: true }, { chiave: 'craft|fionda', testo: 'fabbricare una fionda', possibile: false }, { chiave: 'obj.forno|accendi', testo: '«accendi» su Forno', possibile: true }] }),
    'world/bible.json': JSON.stringify({ titolo: 'Prova', luoghi: ['Piazza del Borgo', 'Collina dei Venti'], fatti: ['Nereo pesca nel Lago Muto da quando era bambina.', 'Il pane di Piazza del Borgo è il più buono.'], misteri: ['Nessuno sa chi abbia costruito la Collina dei Venti.'] }),
    'world/stato.json': JSON.stringify({ viandante: { inventory: { slots: [{ item: 'item.pane', count: 2 }, null, { item: 'item.scissors', count: 1, inv: { slots: [{ item: 'item.farina', count: 1 }] } }] } } }),
  };
  const chunks: GraphChunk[] = [
    { cx: 0, cy: 0, nome: 'Piazza del Borgo', ambiente: 'village', cose: ['npc.villager', 'obj.counter', 'obj.forno'], a_terra: ['Pane'], strutture: ['mulino'] },
    { cx: 3, cy: 0, nome: 'Riva del Lago', ambiente: 'lake', cose: ['npc.cat'] },
  ];
  return { files, chunks };
}

describe('the graph of the world (ADR-0045)', () => {
  it('turns the files of a universe into typed nodes and edges', () => {
    const { files, chunks } = universe();
    const g = buildGraph(files, chunks, cats);
    const n = (id: string) => g.node(id);
    expect(n('individual:fiocco')).toMatchObject({ label: 'Fiocco', tipo: 'individual', specie: 'animal', genere: 'female', source_file: 'world/people.json' });
    expect(n('individual:bastiano-del-mulino')?.tipo).toBe('individual');
    expect(n('individual:ilaria')?.atteso).toBe(true);
    expect(n('individual:viandante')?.viandante).toBe(true);
    expect(n('kind:npc.cat')?.label).toBe('Gatto');
    expect(n('item:item.scissors')?.tipo).toBe('item');
    expect(n('item:item.pane')?.tipo).toBe('item');
    expect(n('recipe:pane')?.tipo).toBe('recipe');
    expect(n('rune:luce')?.tipo).toBe('rune');
    expect(n('spell:arcobaleno')?.tipo).toBe('spell');
    expect(n('environment:village')?.tipo).toBe('environment');
    expect(n('region:lago-muto')?.tipo).toBe('region');
    expect(n('chunk:0_0')).toMatchObject({ label: 'Piazza del Borgo', cx: 0, cy: 0 });
    expect(n('chunk:collina-dei-venti')?.dalla_bibbia).toBe(true);
    expect(n('structure:mulino')?.tipo).toBe('structure');
    expect(n('plot:trama-lago')?.tipo).toBe('plot');
    expect(n('rule:obj.counter-apri')?.tipo).toBe('rule');
    expect(n('fact:1')?.tipo).toBe('fact');
    expect(n('fact:3')?.mistero).toBe(true);

    const has = (s: string, t: string, relation: string, attrs: Record<string, unknown> = {}) => g.links.some((l) => l.source === s && l.target === t && l.relation === relation && Object.entries(attrs).every(([k, v]) => l[k] === v));
    expect(has('individual:fiocco', 'individual:bastiano', 'legame', { legame: 'fratello' })).toBe(true);
    expect(has('individual:fiocco', 'kind:npc.cat', 'e_un')).toBe(true);
    expect(has('individual:fiocco', 'chunk:0_0', 'abita')).toBe(true);
    expect(has('individual:bastiano', 'chunk:0_0', 'lavora')).toBe(true);
    expect(has('individual:nereo', 'individual:viandante', 'legame', { legame: 'rivale' })).toBe(true);
    expect(has('individual:ilaria', 'individual:gaspare', 'legame', { legame: 'sorella' })).toBe(true);
    expect(has('individual:viandante', 'item:item.farina', 'porta')).toBe(true);
    expect(has('plot:trama-lago', 'individual:nereo', 'coinvolge')).toBe(true);
    // «Sulle rive del Lago Muto» is in the region of that name.
    expect(has('plot:trama-lago', 'region:lago-muto', 'tappa', { giorno: 0, momento: 'morning', chi: 'individual:nereo' })).toBe(true);
    expect(has('chunk:3_0', 'region:lago-muto', 'in_regione')).toBe(true);
    expect(has('chunk:0_0', 'environment:village', 'ambiente')).toBe(true);
    expect(has('region:lago-muto', 'environment:lake', 'ambiente')).toBe(true);
    expect(has('chunk:0_0', 'kind:obj.counter', 'contiene')).toBe(true);
    expect(has('chunk:0_0', 'item:item.pane', 'contiene')).toBe(true);
    expect(has('chunk:0_0', 'structure:mulino', 'contiene')).toBe(true);
    expect(has('recipe:pane', 'item:item.farina', 'ingrediente', { quanti: 2 })).toBe(true);
    expect(has('recipe:pane', 'item:item.scissors', 'ingrediente', { strumento: true })).toBe(true);
    expect(has('recipe:pane', 'item:item.pane', 'produce')).toBe(true);
    expect(has('spell:arcobaleno', 'rune:acqua', 'usa')).toBe(true);
    expect(has('rule:obj.counter-apri', 'kind:obj.counter', 'riguarda')).toBe(true);
    expect(has('fact:1', 'individual:nereo', 'cita')).toBe(true);
    expect(has('fact:1', 'region:lago-muto', 'cita')).toBe(true);
    expect(has('fact:2', 'chunk:0_0', 'cita')).toBe(true);
  });

  it('answers by name, by neighbourhood and with a compact context for the Council', () => {
    const { files, chunks } = universe();
    const g = buildGraph(files, chunks, cats);
    // The same name first, then names alike.
    expect(g.find('bastiano').map((x) => x.id)).toEqual(['individual:bastiano', 'individual:bastiano-del-mulino']);
    expect(g.find('Piazza del Borgo', 'chunk').map((x) => x.id)).toEqual(['chunk:0_0']);
    expect(g.find('lago muto')[0].id).toBe('region:lago-muto');
    expect(g.find('')).toEqual([]);
    const near = g.neighbors('individual:fiocco').map((x) => x.id);
    expect(near).toEqual(expect.arrayContaining(['individual:bastiano', 'individual:micetto', 'kind:npc.cat', 'chunk:0_0']));
    expect(near).not.toContain('individual:fiocco');
    expect(g.neighbors('individual:fiocco', 1, ['legame']).map((x) => x.id).sort()).toEqual(['individual:bastiano', 'individual:micetto']);
    expect(g.neighbors('individual:fiocco', 2, ['legame']).map((x) => x.id)).toContain('individual:bastiano-del-mulino');
    const ctx = g.context(['individual:fiocco', 'plot:trama-lago'], 600);
    expect(ctx.split('\n')[0]).toMatch(/^- Fiocco, animale femmina, contadino: fratello di Bastiano; madre di Micetto; abita a Piazza del Borgo/);
    expect(ctx).toMatch(/trama «Il Ritmo del Lago»: Qualcuno ruba le reti di Nereo\.: tappa a Lago Muto \(giorno 0, mattina, Nereo\); coinvolge Nereo, Bastiano, Gaspare/);
    expect(ctx.length).toBeLessThanOrEqual(600);
    expect(g.context(['individual:fiocco'], 50).split('\n')).toHaveLength(1);
  });

  it('finds what does not hold: references to nothing, one-sided or impossible bonds, names alike, plots without people or chunks', () => {
    const { files, chunks } = universe();
    const issues = buildGraph(files, chunks, cats).check();
    const texts = (tipo: string) => issues.filter((i) => i.tipo === tipo).map((i) => i.testo);
    expect(texts('riferimento')).toEqual(
      expect.arrayContaining([
        'Micetto è padrone di Nessuno Mai, che non esiste',
        'la ricetta Torta usa oggetti che non esistono: item.mela, item.torta',
        "l'incantesimo Brezza usa la runa «vento», che non esiste",
        'a Piazza del Borgo (0,0) ci sono cose che non esistono: obj.forno',
        'la regola ««accendi» su Forno» riguarda obj.forno, che non esiste',
      ]),
    );
    expect(texts('riferimento')).toHaveLength(5);
    expect(texts('impossibile')).toEqual(
      expect.arrayContaining([
        'Fiocco è fratello di Bastiano: «fratello» non si dà tra un animale e una persona',
        'Bastiano è fratello di Fiocco: «fratello» non si dà tra una persona e un animale',
        'Nereo è padre di Gaspare: «padre» non si dice di una femmina',
      ]),
    );
    // An awaited kitten is a cat, like who named it.
    expect(texts('impossibile').some((t) => t.includes('Batuffolo'))).toBe(false);
    expect(texts('simmetria')).toEqual(
      expect.arrayContaining([
        'Bastiano è cugino di Bastiano del Mulino, ma Bastiano del Mulino non ha legami con Bastiano',
        'Nereo è padre di Gaspare, ma Gaspare è padre di Nereo',
      ]),
    );
    // Fiocco madre di Micetto, Micetto figlio di Fiocco: the two sides agree.
    expect(texts('simmetria').some((t) => t.includes('Micetto'))).toBe(false);
    expect(texts('nomi')).toEqual(['Bastiano e Bastiano del Mulino hanno nomi che si confondono']);
    expect(texts('trama')).toEqual(["la trama «Il Ritmo del Lago» ha una tappa a «Prato dell'Eco», che non è un luogo noto"]);
  });

  it('is written in the node-link format of Graphify, one row per node or edge, and keeps its chunks', () => {
    const { files, chunks } = universe();
    const g = buildGraph(files, chunks, cats);
    const text = g.toJson();
    const data = JSON.parse(text);
    expect(data).toMatchObject({ directed: true, multigraph: true, graph: { schema_version: 1, nome: 'prova', hash: g.hash } });
    expect(text.split('\n').length).toBe(data.nodes.length + data.links.length + 6);
    const ids = new Set(data.nodes.map((x: { id: string }) => x.id));
    expect(ids.size).toBe(data.nodes.length);
    for (const nd of data.nodes) expect(nd).toEqual(expect.objectContaining({ id: expect.stringMatching(/^[a-z]+:[a-z0-9._-]+$/), label: expect.any(String), tipo: expect.any(String), source_file: expect.any(String) }));
    for (const l of data.links) {
      expect(ids.has(l.source) && ids.has(l.target)).toBe(true);
      expect(l).toEqual(expect.objectContaining({ relation: expect.any(String), confidence: 'EXTRACTED', source_file: expect.any(String) }));
    }
    // Deterministic: the same files, the same file.
    expect(buildGraph(files, chunks, cats).toJson()).toBe(text);
    // Rebuilt from the files alone (no chunk plan known), the places of the previous graph are kept.
    const again = buildGraph({ ...files, [GRAPH_FILE]: text }, [], cats);
    expect(again.node('chunk:3_0')).toMatchObject({ label: 'Riva del Lago', cose: ['npc.cat'] });
    expect(again.hash).toBe(g.hash);
    expect(readGraph({ [GRAPH_FILE]: text })?.nodes.length).toBe(data.nodes.length);
  });

  it('the kernel keeps world/grafo.json with every commit, with the chunks planned', async () => {
    const files: FileMap = { ...bundledFiles, [PLOTS_FILE]: writePlots([]) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    await develop(k);
    const planned = [...k.chunks.values()].filter((c) => c.stage === 'planned' && c.place);
    expect(planned.length).toBeGreaterThan(0);
    expect(k.saveState()).toBe(true);
    const head = k.repo.head().files;
    const data = readGraph(head)!;
    expect(data.graph.hash).toBe(k.graph().hash);
    for (const ch of planned) expect(data.nodes.find((x) => x.id === `chunk:${ch.cx}_${ch.cy}`)?.label).toBe(ch.place!.name);
    expect(data.nodes.some((x) => x.id === 'kind:npc.cat')).toBe(true);
    expect(k.graph().node('individual:viandante')).toBeDefined();
    // The cache: the same files and places, the same graph.
    expect(k.graph()).toBe(k.graph());
    // A save that changes nothing the graph is made of does not rewrite it.
    k.time += 30;
    expect(k.saveState()).toBe(true);
    expect(k.repo.head().files[GRAPH_FILE]).toBe(head[GRAPH_FILE]);
  });

  // The universe of the 2D game, if this machine has it (it is not in git): the measures of T07.
  const valmora = [resolve(__dirname, '../universes/valmora'), resolve(__dirname, '../../../../universes/valmora')].find((p) => existsSync(join(p, 'world/people.json')));
  it.skipIf(!valmora)('on a copy of valmora: 57 people, 215 bonds, the one to nobody is the wanderer, less than a megabyte', () => {
    const files: FileMap = {};
    const walk = (root: string, d: string) => {
      for (const e of readdirSync(join(root, d))) {
        const p = d ? `${d}/${e}` : e;
        if (p === 'maps' || p === 'assets' || p === '.git') continue;
        if (statSync(join(root, p)).isDirectory()) walk(root, p);
        else if (e.endsWith('.json')) files[p] = readFileSync(join(root, p), 'utf8');
      }
    };
    walk(resolve(__dirname, '../universe'), '');
    walk(valmora!, '');
    const chunks: GraphChunk[] = readdirSync(join(valmora!, 'maps')).map((f) => {
      const [, cx, cy] = /_(-?\d+)_(-?\d+)\.json$/.exec(f)!;
      const { plan } = JSON.parse(readFileSync(join(valmora!, 'maps', f), 'utf8'));
      return { cx: +cx, cy: +cy, nome: plan.place.name, ambiente: plan.layout, cose: plan.objects.map((o: { module: string }) => o.module), a_terra: plan.ground };
    });
    const g = buildGraph(files, chunks, cats);
    const { nodi } = g.counts();
    expect([...g.nodes.values()].filter((x) => x.tipo === 'individual' && !x.viandante && !x.atteso)).toHaveLength(57);
    // The registry's own bonds (not those of the awaited ones; Thalric's «nemico» of the wanderer is said twice, counted once).
    const own = g.links.filter((l) => l.relation === 'legame' && !g.node(l.source)!.atteso);
    expect(own).toHaveLength(215);
    expect(nodi.plot).toBe(3);
    const issues = g.check();
    expect(issues.filter((i) => i.tipo === 'riferimento' && /è .* di .*, che non esiste/.test(i.testo))).toEqual([]);
    expect(g.links.some((l) => l.relation === 'legame' && l.target === 'individual:viandante')).toBe(true);
    expect(issues.some((i) => i.tipo === 'impossibile' && /Fiocco è fratello di Bastiano/.test(i.testo))).toBe(true);
    expect(issues.filter((i) => i.tipo === 'nomi').length).toBeGreaterThan(10);
    expect(g.toJson().length).toBeLessThan(1_000_000);
  });
});
