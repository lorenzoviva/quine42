import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { buildGraph, GRAPH_FILE, readGraph, type GraphPlace } from '../src/kernel/graph';
import { writePlots, PLOTS_FILE, type Plot } from '../src/kernel/plots';
import type { FileMap } from '../src/kernel/types';

/** Ticks until every loaded chunk has been planned (as in kernel.test.ts). */
async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
}

const cats = (t: string) => (t === 'npc.cat' ? 'animale' : t ? 'persona' : undefined) as 'animale' | 'persona' | undefined;

const person = (nome: string, tipo: string, famiglia: Array<[string, string]>, extra: Record<string, unknown> = {}) => ({
  nome,
  tipo,
  mestiere: 'contadino',
  famiglia: famiglia.map(([n, legame]) => ({ nome: n, legame })),
  routine: [{ quando: 'giorno', fa: 'lavora', dove: 'lavoro' }, { quando: 'notte', fa: 'dorme', dove: 'casa' }],
  ...extra,
});

const manifest = (m: Record<string, unknown>) => JSON.stringify({ version: '0.1.0', ...m });

/** A small universe with the cases of valmora (the measures of T07): a cat brother of a man, one-sided bonds, a bond to nobody, names alike. */
function universe(): { files: FileMap; places: GraphPlace[] } {
  const plots: Plot[] = [
    {
      id: 'trama-lago',
      titolo: 'Il Ritmo del Lago',
      mistero: 'Qualcuno ruba le reti di Nereo.',
      coinvolti: ['Nereo', 'Bastiano', 'Gaspare'],
      tappe: [
        { giorno: 0, momento: 'mattina', chi: 'Nereo', dove: 'Sulle rive del Lago Muto', cosa: 'conta le reti' },
        { giorno: 1, momento: 'sera', chi: 'Bastiano', dove: "Prato dell'Eco", cosa: 'aspetta' },
      ],
      inizio: 0,
      stato: 'attiva',
    },
  ];
  const files: FileMap = {
    'universe.json': JSON.stringify({ name: 'prova' }),
    'modules/npc.cat/manifest.json': manifest({ id: 'npc.cat', name: 'Gatto', kind: 'entity', appearance: { classe: 'animale' } }),
    'modules/npc.villager/manifest.json': manifest({ id: 'npc.villager', name: 'Abitante', kind: 'entity' }),
    'modules/obj.banco/manifest.json': manifest({ id: 'obj.banco', name: 'Banco', kind: 'entity' }),
    'modules/item.forbici/manifest.json': manifest({ id: 'item.forbici', name: 'Forbici', kind: 'item', tags: ['strumento'] }),
    'modules/items.pacco-1/manifest.json': manifest({
      id: 'items.pacco-1',
      name: 'Pacchetto 1',
      kind: 'data',
      items: [
        { id: 'item.pane', name: 'Pane', category: 'cibo' },
        { id: 'item.farina', name: 'Farina', category: 'materiale' },
      ],
      recipes: [
        { id: 'pane', name: 'Pane', inputs: [{ item: 'item.farina', count: 2 }], tools: ['item.forbici'], output: { item: 'item.pane', count: 1 } },
        { id: 'torta', name: 'Torta', inputs: [{ item: 'item.mela', count: 1 }], output: { item: 'item.torta', count: 1 } },
      ],
    }),
    'modules/magic.runes/manifest.json': manifest({ id: 'magic.runes', name: 'Rune magiche', kind: 'data', runes: { luce: { name: 'Luce' }, acqua: { name: 'Acqua' } } }),
    'modules/magic.spells/manifest.json': manifest({ id: 'magic.spells', name: 'Incantesimi', kind: 'data', spells: { 'luce acqua': { name: 'Arcobaleno', cost: 5, effects: [] }, 'luce vento': { name: 'Brezza', cost: 5, effects: [] } } }),
    'modules/world.layouts/manifest.json': manifest({ id: 'world.layouts', name: 'Ambienti', kind: 'data', layouts: { borgo: { name: 'Borgo', description: '', environment: 'villaggio' }, lago: { name: 'Lago', description: '', environment: 'acqua' } } }),
    'world/atlas.json': JSON.stringify({ regioni: [{ id: 'lago-muto', nome: 'Lago Muto', descrizione: 'un lago fermo', ambiente: 'lago', centro: [3, 0], raggio: 1 }] }),
    'world/people.json': JSON.stringify({
      persone: [
        person('Fiocco', 'npc.cat', [['Bastiano', 'fratello'], ['Micetto', 'madre']], { luogo: 'Piazza del Borgo', genere: 'femmina' }),
        person('Micetto', 'npc.cat', [['Fiocco', 'figlio'], ['Nessuno Mai', 'padrone']], { genere: 'maschio' }),
        person('Bastiano', 'npc.villager', [['Fiocco', 'fratello'], ['Bastiano del Mulino', 'cugino']], { luogo: 'Piazza del Borgo', genere: 'maschio', specie: 'persona' }),
        person('Bastiano del Mulino', 'npc.villager', [], { luogo: 'Sulle rive del Lago Muto' }),
        person('Nereo', 'npc.villager', [['Gaspare', 'padre'], ['Viandante', 'rivale']], { genere: 'femmina', luogo: 'Riva del Lago' }),
        person('Gaspare', 'npc.villager', [['Nereo', 'padre']], { genere: 'maschio' }),
      ],
      attesi: [{ nome: 'Ilaria', legame: 'sorella', di: 'Gaspare' }, { nome: 'Batuffolo', legame: 'figlio', di: 'Micetto' }],
    }),
    [PLOTS_FILE]: writePlots(plots),
    'world/rules.json': JSON.stringify({ regole: [{ chiave: 'obj.banco|apri', testo: '«apri» su Banco', possibile: true }, { chiave: 'craft|fionda', testo: 'fabbricare una fionda', possibile: false }, { chiave: 'obj.forno|accendi', testo: '«accendi» su Forno', possibile: true }] }),
    'world/bible.json': JSON.stringify({ titolo: 'Prova', luoghi: ['Piazza del Borgo', 'Collina dei Venti'], fatti: ['Nereo pesca nel Lago Muto da quando era bambina.', 'Il pane di Piazza del Borgo è il più buono.'], misteri: ['Nessuno sa chi abbia costruito la Collina dei Venti.'] }),
    'world/stato.json': JSON.stringify({ viandante: { inventory: { slots: [{ item: 'item.pane', count: 2 }, null, { item: 'item.forbici', count: 1, inv: { slots: [{ item: 'item.farina', count: 1 }] } }] } } }),
  };
  const places: GraphPlace[] = [
    { cx: 0, cy: 0, nome: 'Piazza del Borgo', ambiente: 'borgo', cose: ['npc.villager', 'obj.banco', 'obj.forno'], a_terra: ['Pane'], strutture: ['mulino'] },
    { cx: 3, cy: 0, nome: 'Riva del Lago', ambiente: 'lago', cose: ['npc.cat'] },
  ];
  return { files, places };
}

describe('the graph of the world (ADR-0045)', () => {
  it('turns the files of a universe into typed nodes and edges', () => {
    const { files, places } = universe();
    const g = buildGraph(files, places, cats);
    const n = (id: string) => g.node(id);
    expect(n('persona:fiocco')).toMatchObject({ label: 'Fiocco', tipo: 'persona', specie: 'animale', genere: 'femmina', source_file: 'world/people.json' });
    expect(n('persona:bastiano-del-mulino')?.tipo).toBe('persona');
    expect(n('persona:ilaria')?.atteso).toBe(true);
    expect(n('persona:viandante')?.viandante).toBe(true);
    expect(n('tipo:npc.cat')?.label).toBe('Gatto');
    expect(n('oggetto:item.forbici')?.tipo).toBe('oggetto');
    expect(n('oggetto:item.pane')?.tipo).toBe('oggetto');
    expect(n('ricetta:pane')?.tipo).toBe('ricetta');
    expect(n('runa:luce')?.tipo).toBe('runa');
    expect(n('incantesimo:arcobaleno')?.tipo).toBe('incantesimo');
    expect(n('ambiente:borgo')?.tipo).toBe('ambiente');
    expect(n('regione:lago-muto')?.tipo).toBe('regione');
    expect(n('luogo:0_0')).toMatchObject({ label: 'Piazza del Borgo', cx: 0, cy: 0 });
    expect(n('luogo:collina-dei-venti')?.dalla_bibbia).toBe(true);
    expect(n('struttura:mulino')?.tipo).toBe('struttura');
    expect(n('trama:trama-lago')?.tipo).toBe('trama');
    expect(n('regola:obj.banco-apri')?.tipo).toBe('regola');
    expect(n('fatto:1')?.tipo).toBe('fatto');
    expect(n('fatto:3')?.mistero).toBe(true);

    const has = (s: string, t: string, relation: string, attrs: Record<string, unknown> = {}) => g.links.some((l) => l.source === s && l.target === t && l.relation === relation && Object.entries(attrs).every(([k, v]) => l[k] === v));
    expect(has('persona:fiocco', 'persona:bastiano', 'legame', { legame: 'fratello' })).toBe(true);
    expect(has('persona:fiocco', 'tipo:npc.cat', 'e_un')).toBe(true);
    expect(has('persona:fiocco', 'luogo:0_0', 'abita')).toBe(true);
    expect(has('persona:bastiano', 'luogo:0_0', 'lavora')).toBe(true);
    expect(has('persona:nereo', 'persona:viandante', 'legame', { legame: 'rivale' })).toBe(true);
    expect(has('persona:ilaria', 'persona:gaspare', 'legame', { legame: 'sorella' })).toBe(true);
    expect(has('persona:viandante', 'oggetto:item.farina', 'porta')).toBe(true);
    expect(has('trama:trama-lago', 'persona:nereo', 'coinvolge')).toBe(true);
    // «Sulle rive del Lago Muto» is in the region of that name.
    expect(has('trama:trama-lago', 'regione:lago-muto', 'tappa', { giorno: 0, momento: 'mattina', chi: 'persona:nereo' })).toBe(true);
    expect(has('luogo:3_0', 'regione:lago-muto', 'in_regione')).toBe(true);
    expect(has('luogo:0_0', 'ambiente:borgo', 'ambiente')).toBe(true);
    expect(has('regione:lago-muto', 'ambiente:lago', 'ambiente')).toBe(true);
    expect(has('luogo:0_0', 'tipo:obj.banco', 'contiene')).toBe(true);
    expect(has('luogo:0_0', 'oggetto:item.pane', 'contiene')).toBe(true);
    expect(has('luogo:0_0', 'struttura:mulino', 'contiene')).toBe(true);
    expect(has('ricetta:pane', 'oggetto:item.farina', 'ingrediente', { quanti: 2 })).toBe(true);
    expect(has('ricetta:pane', 'oggetto:item.forbici', 'ingrediente', { strumento: true })).toBe(true);
    expect(has('ricetta:pane', 'oggetto:item.pane', 'produce')).toBe(true);
    expect(has('incantesimo:arcobaleno', 'runa:acqua', 'usa')).toBe(true);
    expect(has('regola:obj.banco-apri', 'tipo:obj.banco', 'riguarda')).toBe(true);
    expect(has('fatto:1', 'persona:nereo', 'cita')).toBe(true);
    expect(has('fatto:1', 'regione:lago-muto', 'cita')).toBe(true);
    expect(has('fatto:2', 'luogo:0_0', 'cita')).toBe(true);
  });

  it('answers by name, by neighbourhood and with a compact context for the Council', () => {
    const { files, places } = universe();
    const g = buildGraph(files, places, cats);
    // The same name first, then names alike.
    expect(g.find('bastiano').map((x) => x.id)).toEqual(['persona:bastiano', 'persona:bastiano-del-mulino']);
    expect(g.find('Piazza del Borgo', 'luogo').map((x) => x.id)).toEqual(['luogo:0_0']);
    expect(g.find('lago muto')[0].id).toBe('regione:lago-muto');
    expect(g.find('')).toEqual([]);
    const near = g.neighbors('persona:fiocco').map((x) => x.id);
    expect(near).toEqual(expect.arrayContaining(['persona:bastiano', 'persona:micetto', 'tipo:npc.cat', 'luogo:0_0']));
    expect(near).not.toContain('persona:fiocco');
    expect(g.neighbors('persona:fiocco', 1, ['legame']).map((x) => x.id).sort()).toEqual(['persona:bastiano', 'persona:micetto']);
    expect(g.neighbors('persona:fiocco', 2, ['legame']).map((x) => x.id)).toContain('persona:bastiano-del-mulino');
    const ctx = g.context(['persona:fiocco', 'trama:trama-lago'], 600);
    expect(ctx.split('\n')[0]).toMatch(/^- Fiocco, animale femmina, contadino: fratello di Bastiano; madre di Micetto; abita a Piazza del Borgo/);
    expect(ctx).toMatch(/trama «Il Ritmo del Lago»: Qualcuno ruba le reti di Nereo\.: tappa a Lago Muto \(giorno 0, mattina, Nereo\); coinvolge Nereo, Bastiano, Gaspare/);
    expect(ctx.length).toBeLessThanOrEqual(600);
    expect(g.context(['persona:fiocco'], 50).split('\n')).toHaveLength(1);
  });

  it('finds what does not hold: references to nothing, one-sided or impossible bonds, names alike, plots without people or places', () => {
    const { files, places } = universe();
    const issues = buildGraph(files, places, cats).check();
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

  it('is written in the node-link format of Graphify, one row per node or edge, and keeps its places', () => {
    const { files, places } = universe();
    const g = buildGraph(files, places, cats);
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
    expect(buildGraph(files, places, cats).toJson()).toBe(text);
    // Rebuilt from the files alone (no chunk plan known), the places of the previous graph are kept.
    const again = buildGraph({ ...files, [GRAPH_FILE]: text }, [], cats);
    expect(again.node('luogo:3_0')).toMatchObject({ label: 'Riva del Lago', cose: ['npc.cat'] });
    expect(again.hash).toBe(g.hash);
    expect(readGraph({ [GRAPH_FILE]: text })?.nodes.length).toBe(data.nodes.length);
  });

  it('the kernel keeps world/grafo.json with every commit, with the places planned', async () => {
    const files: FileMap = { ...bundledFiles, [PLOTS_FILE]: writePlots([]) };
    const k = await Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
    await develop(k);
    const planned = [...k.chunks.values()].filter((c) => c.stage === 'planned' && c.place);
    expect(planned.length).toBeGreaterThan(0);
    expect(k.saveState()).toBe(true);
    const head = k.repo.head().files;
    const data = readGraph(head)!;
    expect(data.graph.hash).toBe(k.graph().hash);
    for (const ch of planned) expect(data.nodes.find((x) => x.id === `luogo:${ch.cx}_${ch.cy}`)?.label).toBe(ch.place!.name);
    expect(data.nodes.some((x) => x.id === 'tipo:npc.cat')).toBe(true);
    expect(k.graph().node('persona:viandante')).toBeDefined();
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
    const places: GraphPlace[] = readdirSync(join(valmora!, 'maps')).map((f) => {
      const [, cx, cy] = /_(-?\d+)_(-?\d+)\.json$/.exec(f)!;
      const { plan } = JSON.parse(readFileSync(join(valmora!, 'maps', f), 'utf8'));
      return { cx: +cx, cy: +cy, nome: plan.place.name, ambiente: plan.layout, cose: plan.objects.map((o: { module: string }) => o.module), a_terra: plan.ground };
    });
    const g = buildGraph(files, places, cats);
    const { nodi } = g.counts();
    expect([...g.nodes.values()].filter((x) => x.tipo === 'persona' && !x.viandante && !x.atteso)).toHaveLength(57);
    // The registry's own bonds (not those of the awaited ones; Thalric's «nemico» of the wanderer is said twice, counted once).
    const own = g.links.filter((l) => l.relation === 'legame' && !g.node(l.source)!.atteso);
    expect(own).toHaveLength(215);
    expect(nodi.trama).toBe(3);
    const issues = g.check();
    expect(issues.filter((i) => i.tipo === 'riferimento' && /è .* di .*, che non esiste/.test(i.testo))).toEqual([]);
    expect(g.links.some((l) => l.relation === 'legame' && l.target === 'persona:viandante')).toBe(true);
    expect(issues.some((i) => i.tipo === 'impossibile' && /Fiocco è fratello di Bastiano/.test(i.testo))).toBe(true);
    expect(issues.filter((i) => i.tipo === 'nomi').length).toBeGreaterThan(10);
    expect(g.toJson().length).toBeLessThan(1_000_000);
  });
});
