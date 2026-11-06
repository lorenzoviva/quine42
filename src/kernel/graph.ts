// The graph of the world (ADR-0045): the contents of a universe as typed nodes and edges — people
// and their relations, kinds, places, regions, environments, structures, plots, items, recipes, runes,
// spells, rules, facts of the bible — built from the universe's files, deterministic, no model calls.
// The Council asks it what exists instead of inventing (T13); the kernel asks it what does not hold
// (`check`). It is written to world/graph.json with every commit, in Graphify's node-link format, and
// is always derived: it can be rebuilt from the files (the places come from the chunk plans, which
// live outside the text snapshot, so a rebuild keeps the places of the previous graph).

import { internalFields, internalName, italianName } from './internalNames';
import type { FileMap, Manifest } from './types';
import { readPeople, relationProblem, relationsAgree, similarNames, type Individual, type Species } from './society';
import { readPlots } from './plots';
import { readAtlas, regionAt } from './atlas';
import { normName } from './content';
import { hashStr, hex } from './rng';
import { bondWith, playerFile, readWandererState, SOLO, STATE_FILE, wandererOf, wanderersIn } from './wanderers';

export const GRAPH_FILE = 'world/graph.json';
export const GRAPH_SCHEMA = 1;
/** The version of the builder: raise it when the graph is built differently, so the files are rewritten. */
export const GRAPH_BUILD = 4;

export type NodeType = 'individual' | 'kind' | 'chunk' | 'region' | 'environment' | 'structure' | 'plot' | 'item' | 'recipe' | 'rune' | 'spell' | 'rule' | 'fact';

export type EdgeType =
  | 'legame' // persona → persona (attribute `legame`: what the source is to the target)
  | 'e_un' // persona → tipo
  | 'abita' // persona → luogo
  | 'lavora' // persona → luogo
  | 'porta' // persona → oggetto (what the wanderer carries)
  | 'coinvolge' // trama → persona
  | 'tappa' // trama → luogo
  | 'in_regione' // luogo → regione
  | 'ambiente' // luogo, regione → ambiente
  | 'contiene' // luogo → tipo, oggetto, struttura
  | 'ingrediente' // ricetta → oggetto (`strumento: true` when it is not consumed)
  | 'produce' // ricetta → oggetto
  | 'usa' // incantesimo → runa
  | 'riguarda' // regola → tipo, oggetto
  | 'cita'; // fatto → persona, luogo, regione

/** How the Nucleus shows the graph (T28): a colour for each kind of node, a name for each kind of edge. */
export const NODE_COLOR: Record<NodeType, string> = {
  individual: '#ffb38a',
  kind: '#d89a6a',
  chunk: '#7dd87d',
  region: '#3fa35f',
  environment: '#9ad27a',
  structure: '#c8b27a',
  plot: '#ff8ad8',
  item: '#e0b070',
  recipe: '#f0d890',
  rune: '#c48aff',
  spell: '#9a6aff',
  rule: '#ffcf5c',
  fact: '#6fc3ff',
};
export const NODE_NAME: Record<NodeType, string> = {
  individual: 'persone',
  kind: 'tipi',
  chunk: 'luoghi',
  region: 'regioni',
  environment: 'ambienti',
  structure: 'strutture',
  plot: 'trame',
  item: 'oggetti',
  recipe: 'ricette',
  rune: 'rune',
  spell: 'incantesimi',
  rule: 'regole',
  fact: 'fatti',
};
export const EDGE_NAME: Record<EdgeType, string> = {
  legame: 'legame',
  e_un: 'è un',
  abita: 'abita a',
  lavora: 'lavora a',
  porta: 'porta',
  coinvolge: 'coinvolge',
  tappa: 'tappa a',
  in_regione: 'nella regione',
  ambiente: 'ambiente',
  contiene: 'contiene',
  ingrediente: 'ingrediente',
  produce: 'produce',
  usa: 'usa la runa',
  riguarda: 'riguarda',
  cita: 'cita',
};

export interface GraphNode {
  id: string;
  label: string;
  tipo: NodeType;
  source_file: string;
  [attr: string]: unknown;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: EdgeType;
  confidence: 'EXTRACTED';
  source_file: string;
  [attr: string]: unknown;
}

/** NetworkX node-link data, as Graphify reads it (`graphify explain|path|query --graph world/graph.json`). */
export interface GraphData {
  directed: true;
  multigraph: true;
  graph: { schema_version: number; nome: string; hash: string };
  nodes: GraphNode[];
  links: GraphLink[];
}

/** A place as the graph knows it: a planned chunk. */
export interface GraphChunk {
  cx: number;
  cy: number;
  nome: string;
  descrizione?: string;
  ambiente?: string;
  /** Module ids of the entities placed there. */
  cose?: string[];
  /** Names of the items lying around. */
  a_terra?: string[];
  strutture?: string[];
}

export interface GraphIssue {
  tipo: 'riferimento' | 'simmetria' | 'impossibile' | 'nomi' | 'trama';
  testo: string;
  nodi: string[];
}

/** The id part of a node: lowercase, no accents, words joined by «-». */
export function slug(s: string): string {
  return (
    String(s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+(?!\d)|-+$/g, '') || 'x'
  );
}

/** True when a normalised text contains a normalised name as whole words. */
const hasWords = (text: string, name: string) => ` ${text} `.includes(` ${name} `);
const json = (files: FileMap, path: string): any => {
  try {
    return JSON.parse(files[path] ?? 'null');
  } catch {
    return null;
  }
};

/** The files the graph is made of (a change elsewhere does not touch it). */
export function graphSources(files: FileMap): string[] {
  return Object.keys(files)
    .filter((p) => /^world\/(people|plots|atlas|rules|bible)\.json$/.test(p) || /^modules\/[^/]+\/manifest\.json$/.test(p))
    .sort();
}

/** The places of a graph file, to carry them into the next build. */
export function chunksOf(data: GraphData | null | undefined): GraphChunk[] {
  return (data?.nodes ?? [])
    .filter((n) => (n.tipo === 'chunk' || (n.tipo as string) === 'luogo') && typeof n.cx === 'number' && typeof n.cy === 'number')
    .map((n) => ({ cx: n.cx as number, cy: n.cy as number, nome: n.label, descrizione: n.descrizione as string | undefined, ambiente: typeof n.ambiente === 'string' ? internalName('ambienti', n.ambiente) : undefined, cose: n.cose as string[] | undefined, a_terra: n.a_terra as string[] | undefined, strutture: n.strutture as string[] | undefined }));
}

/** The places of the previous graph file, then those given (which win), in a stable order. */
export function mergeChunks(files: FileMap, chunks: GraphChunk[]): GraphChunk[] {
  const known = new Map<string, GraphChunk>();
  for (const p of [...chunksOf(readGraph(files)), ...chunks]) known.set(`${p.cx},${p.cy}`, p);
  return [...known.values()].sort((a, b) => a.cx - b.cx || a.cy - b.cy);
}

/** The node of a wanderer (T34): `individual:viandante` for `io`, `individual:viandante-<id>` for the others. */
export function wandererNode(id: string): string {
  return `individual:${slug(wandererKey(id))}`;
}

function wandererKey(id: string): string {
  return id === SOLO ? 'viandante' : `viandante-${id}`;
}

/** What a wanderer carries (their state changes with every save: only this goes into the graph). */
export function carriedOf(files: FileMap, wanderer: string = SOLO): string[] {
  const out = new Set<string>();
  const walk = (inv: any) => {
    for (const s of Array.isArray(inv?.slots) ? inv.slots : []) {
      if (s?.item) out.add(String(s.item));
      if (s?.inv) walk(s.inv);
    }
  };
  walk(readWandererState(files, wanderer)?.inventory);
  return [...out].sort();
}

/** What the graph is made of, as a hash: the same hash, the same graph (the file is not rewritten). */
export function graphHash(files: FileMap, chunks: GraphChunk[]): string {
  return hex(hashStr(`${GRAPH_BUILD}|` + graphSources(files).map((p) => `${p}\0${files[p]}`).join('\u0001') + JSON.stringify(chunks) + wanderersOf(files).map((w) => `${w.id}:${w.name}:${carriedOf(files, w.id).join(',')}`).join(';')));
}

/** The wanderers of the graph: `io` always, then one per player file. */
function wanderersOf(files: FileMap): Array<{ id: string; name: string }> {
  return [{ id: SOLO, name: 'il viandante' }, ...wanderersIn(files).filter((w) => w.id !== SOLO)];
}

export function readGraph(files: FileMap): GraphData | null {
  const g = json(files, GRAPH_FILE);
  return g && Array.isArray(g.nodes) && Array.isArray(g.links) ? (g as GraphData) : null;
}

export class WorldGraph {
  readonly nodes = new Map<string, GraphNode>();
  readonly links: GraphLink[] = [];
  private out = new Map<string, GraphLink[]>();
  private in = new Map<string, GraphLink[]>();
  /** References to nothing found while building (a relation to someone who does not exist…). */
  private dangling: GraphIssue[] = [];
  private byLabel = new Map<string, string[]>();

  constructor(
    readonly nome: string,
    readonly hash: string,
  ) {}

  // --- building ----------------------------------------------------------------------------------

  /** Adds a node; a second node with the same id gets a numbered id. Returns the id. */
  add(tipo: NodeType, key: string, label: string, source_file: string, attrs: Record<string, unknown> = {}, unique = false): string {
    let id = `${tipo}:${slug(key)}`;
    if (this.nodes.has(id)) {
      if (unique) return id;
      let i = 2;
      while (this.nodes.has(`${id}-${i}`)) i++;
      id = `${id}-${i}`;
    }
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) clean[k] = v;
    this.nodes.set(id, { id, label, tipo, source_file, ...clean });
    const k = normName(label);
    this.byLabel.set(k, [...(this.byLabel.get(k) ?? []), id]);
    return id;
  }

  link(source: string, target: string, relation: EdgeType, source_file: string, attrs: Record<string, unknown> = {}): void {
    if (!this.nodes.has(source) || !this.nodes.has(target)) return;
    const l: GraphLink = { source, target, relation, confidence: 'EXTRACTED', source_file, ...attrs };
    this.links.push(l);
    this.out.set(source, [...(this.out.get(source) ?? []), l]);
    this.in.set(target, [...(this.in.get(target) ?? []), l]);
  }

  missing(testo: string, nodi: string[]): void {
    this.dangling.push({ tipo: 'riferimento', testo, nodi });
  }

  // --- queries -----------------------------------------------------------------------------------

  node(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /** Nodes by name: the same name first (ignoring case and accents), then similar names, then names that contain it. */
  find(name: string, tipo?: NodeType): GraphNode[] {
    const k = normName(name);
    if (!k) return [];
    const ok = (n: GraphNode) => !tipo || n.tipo === tipo;
    const exact = (this.byLabel.get(k) ?? []).map((id) => this.nodes.get(id)!).filter(ok);
    const seen = new Set(exact.map((n) => n.id));
    const near: GraphNode[] = [];
    const within: GraphNode[] = [];
    for (const n of this.nodes.values()) {
      if (seen.has(n.id) || !ok(n)) continue;
      const l = normName(n.label);
      if (n.tipo === 'individual' && similarNames(n.label, name)) near.push(n);
      else if (k.length >= 4 && (l.includes(k) || (l.length >= 4 && k.includes(l)))) within.push(n);
    }
    return [...exact, ...near, ...within];
  }

  /** Node ids for some references: ids as they are, names by their exact label (people first); the unknown are left out. */
  resolve(refs: string[]): string[] {
    const out = new Set<string>();
    for (const r of refs) {
      if (!r) continue;
      if (this.nodes.has(r)) {
        out.add(r);
        continue;
      }
      const k = normName(r);
      const same = (this.byLabel.get(k) ?? []).map((id) => this.nodes.get(id)!);
      const n = same.find((x) => x.tipo === 'individual') ?? same[0];
      if (n) out.add(n.id);
    }
    return [...out];
  }

  /** The edges from and to a node. */
  edges(id: string): GraphLink[] {
    return [...(this.out.get(id) ?? []), ...(this.in.get(id) ?? [])];
  }

  /** The nodes within `depth` edges of a node (itself excluded), optionally along some kinds of edge only. */
  neighbors(id: string, depth = 1, relations?: EdgeType[]): GraphNode[] {
    const seen = new Set([id]);
    let frontier = [id];
    for (let d = 0; d < depth && frontier.length; d++) {
      const next: string[] = [];
      for (const n of frontier)
        for (const l of this.edges(n)) {
          if (relations && !relations.includes(l.relation)) continue;
          const o = l.source === n ? l.target : l.source;
          if (!seen.has(o)) {
            seen.add(o);
            next.push(o);
          }
        }
      frontier = next;
    }
    seen.delete(id);
    return [...seen].map((x) => this.nodes.get(x)!).filter(Boolean);
  }

  /** One line describing a node with its edges, in Italian, for an agent. */
  describe(id: string): string {
    const n = this.nodes.get(id);
    if (!n) return '';
    const name = (x: string) => this.nodes.get(x)?.label ?? x;
    const head = DESCRIBE[n.tipo]?.(n) ?? n.label;
    const parts: string[] = [];
    for (const l of this.out.get(id) ?? []) {
      const t = name(l.target);
      switch (l.relation) {
        case 'legame': parts.push(`${l.legame} ${l.target === wandererNode(SOLO) ? 'del viandante' : `di ${t}`}`); break;
        case 'e_un': break;
        case 'abita': parts.push(`abita a ${t}`); break;
        case 'lavora': parts.push(`lavora a ${t}`); break;
        case 'porta': parts.push(`porta ${t}`); break;
        case 'coinvolge': parts.push(`coinvolge ${t}`); break;
        case 'tappa': parts.push(`tappa a ${t} (giorno ${l.giorno}, ${italianName('momenti', String(l.momento))}, ${name(String(l.chi))})`); break;
        case 'in_regione': parts.push(`in ${t}`); break;
        case 'ambiente': parts.push(`ambiente ${t}`); break;
        case 'contiene': parts.push(`c'è ${t}`); break;
        case 'ingrediente': parts.push(`${l.strumento ? 'con' : 'da'} ${t}`); break;
        case 'produce': parts.push(`fa ${t}`); break;
        case 'usa': parts.push(`runa ${t}`); break;
        case 'riguarda': parts.push(`su ${t}`); break;
        case 'cita': break;
      }
    }
    const merged = new Map<string, string[]>();
    for (const p of parts) {
      const [verb, ...rest] = p.split(' ');
      if (verb === "c'è" || verb === 'porta' || verb === 'coinvolge') merged.set(verb, [...(merged.get(verb) ?? []), rest.join(' ')]);
    }
    const flat = parts.filter((p) => !merged.has(p.split(' ')[0]));
    for (const [verb, xs] of merged) flat.push(`${verb} ${xs.join(', ')}`);
    return `- ${head}${flat.length ? `: ${flat.join('; ')}` : ''}`;
  }

  /**
   * The compact text of some nodes and their neighbourhood for a task of the Council: the nodes
   * asked first, then their neighbours, then the neighbours of those (not through hubs: a kind, a
   * region, an environment, the wanderer lead to everything), until the budget in characters is
   * spent. Leaves (items, kinds, environments…) are named in the lines of who has them, and get a
   * line of their own only when asked.
   */
  context(ids: string[], budget = 2000): string {
    const order: string[] = [];
    const seen = new Set<string>();
    const push = (id: string) => {
      const n = this.nodes.get(id);
      if (n && !seen.has(id)) {
        seen.add(id);
        if (ids.includes(id) || !LEAVES.has(n.tipo)) order.push(id);
      }
    };
    for (const id of ids) push(id);
    const first = ids.flatMap((id) => this.neighbors(id, 1));
    for (const n of first) push(n.id);
    for (const n of first) if (!HUBS.has(n.tipo) && !n.viandante) for (const m of this.neighbors(n.id, 1)) if (m.tipo !== 'fact') push(m.id);
    const lines: string[] = [];
    let used = 0;
    for (const id of order) {
      const line = this.describe(id);
      if (!line) continue;
      if (used + line.length + 1 > budget && lines.length) break;
      lines.push(line);
      used += line.length + 1;
    }
    return lines.join('\n');
  }

  /**
   * What does not hold among the files: references to nothing, relations that are one-sided, that
   * disagree or that cannot be (species, gender), people whose names would be mistaken, plots with
   * people or places that are not there.
   */
  check(): GraphIssue[] {
    const issues = [...this.dangling];
    const people = [...this.nodes.values()].filter((n) => n.tipo === 'individual' && !n.atteso && !n.viandante);
    const rel = (a: string, b: string) => (this.out.get(a) ?? []).filter((l) => l.relation === 'legame' && l.target === b);
    const pairs = new Set<string>();
    for (const l of this.links) {
      if (l.relation !== 'legame') continue;
      const a = this.nodes.get(l.source)!;
      const b = this.nodes.get(l.target)!;
      if (a.viandante || b.viandante) continue;
      // The graph's nodes keep their attributes in the graph's own words (`specie`, `genere`).
      const why = relationProblem(String(l.legame), { species: a.specie as Individual['species'], gender: a.genere as Individual['gender'] }, { species: b.specie as Individual['species'] });
      if (why) issues.push({ tipo: 'impossibile', testo: `${a.label} è ${l.legame} di ${b.label}: ${why}`, nodi: [a.id, b.id] });
      if (a.atteso || b.atteso) continue;
      const back = rel(b.id, a.id);
      if (!back.length) issues.push({ tipo: 'simmetria', testo: `${a.label} è ${l.legame} di ${b.label}, ma ${b.label} non ha legami con ${a.label}`, nodi: [a.id, b.id] });
      else {
        const key = [a.id, b.id].sort().join('|');
        if (!pairs.has(key) && !back.some((x) => relationsAgree(String(l.legame), String(x.legame)))) {
          pairs.add(key);
          issues.push({ tipo: 'simmetria', testo: `${a.label} è ${l.legame} di ${b.label}, ma ${b.label} è ${back.map((x) => x.legame).join(' e ')} di ${a.label}`, nodi: [a.id, b.id] });
        }
      }
    }
    for (let i = 0; i < people.length; i++)
      for (let j = i + 1; j < people.length; j++)
        if (similarNames(people[i].label, people[j].label)) issues.push({ tipo: 'nomi', testo: `${people[i].label} e ${people[j].label} hanno nomi che si confondono`, nodi: [people[i].id, people[j].id] });
    for (const t of this.nodes.values()) {
      if (t.tipo !== 'plot' || t.stato === 'closed') continue;
      for (const nome of (t.senza_persona as string[] | undefined) ?? []) issues.push({ tipo: 'trama', testo: `la trama «${t.label}» parla di ${nome}, che non esiste`, nodi: [t.id] });
      for (const dove of (t.senza_luogo as string[] | undefined) ?? []) issues.push({ tipo: 'trama', testo: `la trama «${t.label}» ha una tappa a «${dove}», che non è un luogo noto`, nodi: [t.id] });
    }
    return issues;
  }

  counts(): { nodi: Record<string, number>; archi: Record<string, number> } {
    const nodi: Record<string, number> = {};
    const archi: Record<string, number> = {};
    for (const n of this.nodes.values()) nodi[n.tipo] = (nodi[n.tipo] ?? 0) + 1;
    for (const l of this.links) archi[l.relation] = (archi[l.relation] ?? 0) + 1;
    return { nodi, archi };
  }

  toData(): GraphData {
    return { directed: true, multigraph: true, graph: { schema_version: GRAPH_SCHEMA, nome: this.nome, hash: this.hash }, nodes: [...this.nodes.values()], links: this.links };
  }

  /** The file: one node or edge per line, so a commit shows what changed. */
  toJson(): string {
    const d = this.toData();
    const rows = (xs: unknown[]) => (xs.length ? `[\n${xs.map((x) => JSON.stringify(x)).join(',\n')}\n]` : '[]');
    return `{"directed":true,"multigraph":true,"graph":${JSON.stringify(d.graph)},\n"nodes":${rows(d.nodes)},\n"links":${rows(d.links)}}\n`;
  }
}

/** Nodes the context does not walk through: everything is near them. */
const HUBS = new Set<NodeType>(['kind', 'region', 'environment', 'item', 'rune']);
/** Nodes whose name, in the lines of who has them, says all the context needs. */
const LEAVES = new Set<NodeType>(['item', 'kind', 'environment', 'structure', 'rune', 'recipe']);

const DESCRIBE: Partial<Record<NodeType, (n: GraphNode) => string>> = {
  individual: (n) => (n.viandante ? 'il viandante' : `${n.label}${n.atteso ? ' (se ne parla, ma nessuno l’ha incontrata)' : ''}${n.specie === 'animal' ? `, animale${n.genere ? ` ${italianName('specie', String(n.genere))}` : ''}` : n.genere === 'female' ? ', donna' : n.genere === 'male' ? ', uomo' : ''}${n.mestiere ? `, ${n.mestiere}` : ''}`),
  chunk: (n) => `${n.label} (luogo${typeof n.cx === 'number' ? ` ${n.cx},${n.cy}` : ''})`,
  region: (n) => `${n.label} (regione)${n.descrizione ? `: ${n.descrizione}` : ''}`,
  plot: (n) => `trama «${n.label}»${n.stato === 'closed' ? ' (chiusa)' : ''}: ${n.mistero ?? ''}`,
  item: (n) => `${n.label} (oggetto${n.categoria ? `, ${n.categoria}` : ''})`,
  recipe: (n) => `ricetta ${n.label}`,
  rune: (n) => `runa «${n.label}»`,
  spell: (n) => `incantesimo ${n.label}`,
  rule: (n) => `regola: ${n.label}${n.possibile === false ? ' (non si può)' : ''}`,
  fact: (n) => `fatto: ${n.label}`,
  kind: (n) => `${n.label} (tipo)`,
  environment: (n) => `${n.label} (ambiente)`,
  structure: (n) => `${n.label} (struttura)`,
};

/**
 * Builds the graph of a universe from its files and the places known (planned chunks). The places
 * of the previous graph file are kept when `chunks` does not say otherwise; `speciesOf` gives the
 * species of a kind when the registry does not say it (old registries).
 */
export function buildGraph(files: FileMap, chunks: GraphChunk[] = [], speciesOf: (tipo: string) => Species | undefined = () => undefined): WorldGraph {
  const sources = graphSources(files);
  const chunkList = mergeChunks(files, chunks);
  const hash = graphHash(files, chunkList);
  const nome = json(files, 'universe.json')?.name ?? '';
  const g = new WorldGraph(nome, hash);

  // Modules: kinds of entities, items, recipes, runes, spells, environments.
  const manifests = sources
    .filter((p) => p.startsWith('modules/'))
    .map((p) => [p, json(files, p)] as [string, Manifest | null])
    .filter((x): x is [string, Manifest] => !!x[1]?.id);
  const itemByName = new Map<string, string>();
  const pending: Array<() => void> = [];
  for (const [file, m] of manifests) {
    if (m.kind === 'item') itemByName.set(normName(m.name ?? ''), g.add('item', m.id, m.name ?? m.id, file, { categoria: m.tags?.[0] }, true));
    else if (m.kind !== 'data' && m.kind !== 'generator') g.add('kind', m.id, m.name ?? m.id, file, { kind: m.kind, classe: m.appearance?.class, modello: m.appearance?.model, unico: m.unique || undefined }, true);
    for (const it of m.items ?? []) {
      const id = g.add('item', it.id, it.name ?? it.id, file, { categoria: it.category }, true);
      itemByName.set(normName(it.name ?? ''), id);
    }
    for (const [lid, l] of Object.entries(m.layouts ?? {})) g.add('environment', lid, l.name ?? lid, file, { ambiente: l.environment }, true);
    for (const [tok, r] of Object.entries(m.runes ?? {})) g.add('rune', tok, tok, file, { nome: (r as { name?: string }).name }, true);
    for (const [seq, s] of Object.entries(m.spells ?? {})) {
      const id = g.add('spell', s.name ?? seq, s.name ?? seq, file, { rune: seq }, true);
      pending.push(() => {
        for (const tok of seq.split(/\s+/).filter(Boolean)) {
          if (g.node(`rune:${slug(tok)}`)) g.link(id, `rune:${slug(tok)}`, 'usa', file);
          else g.missing(`l'incantesimo ${s.name ?? seq} usa la runa «${tok}», che non esiste`, [id]);
        }
      });
    }
    for (const r of m.recipes ?? []) {
      const id = g.add('recipe', r.id, r.name ?? r.id, file);
      pending.push(() => {
        const lacking = new Set<string>();
        const item = (x: string) => {
          const t = g.node(`item:${slug(x)}`)?.id ?? itemByName.get(normName(x));
          if (!t) lacking.add(x);
          return t;
        };
        for (const i of r.inputs ?? []) {
          const t = item(i.item);
          if (t) g.link(id, t, 'ingrediente', file, { quanti: i.count });
        }
        for (const x of r.tools ?? []) {
          const t = item(x);
          if (t) g.link(id, t, 'ingrediente', file, { strumento: true });
        }
        if (r.output?.item) {
          const t = item(r.output.item);
          if (t) g.link(id, t, 'produce', file, { quanti: r.output.count });
        }
        if (lacking.size) g.missing(`la ricetta ${r.name ?? r.id} usa oggetti che non esistono: ${[...lacking].join(', ')}`, [id]);
      });
    }
  }
  for (const f of pending) f();
  const thing = (ref: string): string | undefined => g.node(`kind:${slug(ref)}`)?.id ?? g.node(`item:${slug(ref)}`)?.id;

  // The atlas.
  const atlas = readAtlas(files);
  for (const r of atlas.regions) {
    const id = g.add('region', r.id, r.name, 'world/atlas.json', { descrizione: r.description, centro: r.center, raggio: r.radius }, true);
    if (g.node(`environment:${slug(r.environment)}`)) g.link(id, `environment:${slug(r.environment)}`, 'ambiente', 'world/atlas.json');
  }

  // Places: the planned chunks, then the places the bible names that no chunk has.
  const chunkByName = new Map<string, string>();
  for (const p of chunkList) {
    const id = g.add('chunk', `${p.cx}_${p.cy}`, p.nome, 'maps/', { cx: p.cx, cy: p.cy, descrizione: p.descrizione, ambiente: p.ambiente, cose: p.cose, a_terra: p.a_terra, strutture: p.strutture }, true);
    if (!chunkByName.has(normName(p.nome))) chunkByName.set(normName(p.nome), id);
    const reg = regionAt(atlas, p.cx, p.cy);
    if (reg) g.link(id, `region:${slug(reg.id)}`, 'in_regione', 'world/atlas.json');
    if (p.ambiente && g.node(`environment:${slug(p.ambiente)}`)) g.link(id, `environment:${slug(p.ambiente)}`, 'ambiente', 'maps/');
    const lacking = [...new Set(p.cose ?? [])].filter((m) => {
      const t = thing(m);
      if (t) g.link(id, t, 'contiene', 'maps/');
      return !t;
    });
    if (lacking.length) g.missing(`a ${p.nome} (${p.cx},${p.cy}) ci sono cose che non esistono: ${lacking.join(', ')}`, [id]);
    for (const x of new Set(p.a_terra ?? [])) {
      const t = itemByName.get(normName(x)) ?? g.node(`item:${slug(x)}`)?.id;
      if (t) g.link(id, t, 'contiene', 'maps/');
    }
    for (const s of new Set(p.strutture ?? [])) g.link(id, g.add('structure', s, s, 'maps/', {}, true), 'contiene', 'maps/');
  }
  const bible = internalFields('bible', json(files, 'world/bible.json') ?? {}) as { places?: string[]; facts?: string[]; mysteries?: string[] };
  for (const nome of (Array.isArray(bible?.places) ? bible.places : []) as string[]) {
    if (typeof nome !== 'string' || chunkByName.has(normName(nome))) continue;
    chunkByName.set(normName(nome), g.add('chunk', nome, nome, 'world/bible.json', { dalla_bibbia: true }, true));
  }
  for (const r of atlas.regions) if (!chunkByName.has(normName(r.name))) chunkByName.set(normName(r.name), `region:${slug(r.id)}`);
  /** A place a text names: the same name, or a known name inside it («sulle rive del Lago del Re Muto»). */
  const chunkIn = (text: string): string | undefined => {
    const k = normName(text);
    if (chunkByName.has(k)) return chunkByName.get(k);
    let best: [string, string] | undefined;
    for (const [n, id] of chunkByName) if (n.length >= 4 && hasWords(k, n) && (!best || n.length > best[0].length)) best = [n, id];
    return best?.[1];
  };

  // People: the registry, the awaited ones, the wanderer.
  const people = readPeople(files);
  const individualByName = new Map<string, string>();
  const PF = 'world/people.json';
  for (const p of people.people) {
    const id = g.add('individual', p.name, p.name, PF, { specie: p.species ?? speciesOf(p.kind), genere: p.gender, tipo_modulo: p.kind, mestiere: p.job, eta: p.age, luogo: p.place, legame_viandante: bondWith(p, SOLO) });
    individualByName.set(p.name, id);
  }
  // Someone named and not met is of the species of who named them (as the repair of the society assumes).
  for (const a of people.expected) if (!individualByName.has(a.name)) individualByName.set(a.name, g.add('individual', a.name, a.name, PF, { atteso: true, specie: individualByName.has(a.of) ? g.node(individualByName.get(a.of)!)!.specie : undefined }));
  // One node per wanderer, by id; a relation with a wanderer the files do not know yet makes theirs.
  const wandererAt = (id: string, nome?: string) =>
    g.node(wandererNode(id)) ? wandererNode(id) : g.add('individual', wandererKey(id), id === SOLO ? 'il viandante' : nome ?? id, files[playerFile(id)] !== undefined || id !== SOLO ? playerFile(id) : 'world/state.json', { viandante: true, giocatore: id, specie: 'persona' }, true);
  for (const w of wanderersOf(files)) wandererAt(w.id, w.name);
  for (const p of people.people) {
    const id = individualByName.get(p.name)!;
    if (p.kind) {
      if (g.node(`kind:${slug(p.kind)}`)) g.link(id, `kind:${slug(p.kind)}`, 'e_un', PF);
      else g.missing(`${p.name} è un ${p.kind}, che non esiste`, [id]);
    }
    for (const r of p.family ?? []) {
      const w = wandererOf(r);
      const t = w ? wandererAt(w, r.name) : individualByName.get(r.name);
      if (t) g.link(id, t, 'legame', PF, { legame: r.bond });
      else g.missing(`${p.name} è ${r.bond} di ${r.name}, che non esiste`, [id]);
    }
    const home = p.place ? chunkIn(p.place) : undefined;
    if (home?.startsWith('chunk:')) {
      const where = new Set((p.routine ?? []).map((s) => s.where));
      if (where.has('home') || !where.size) g.link(id, home, 'abita', PF);
      if (where.has('work')) g.link(id, home, 'lavora', PF);
    }
  }
  for (const a of people.expected) {
    const id = individualByName.get(a.name)!;
    const t = individualByName.get(a.of);
    if (t) g.link(id, t, 'legame', PF, { legame: a.bond });
  }
  for (const w of wanderersOf(files)) {
    const file = files[playerFile(w.id)] !== undefined ? playerFile(w.id) : STATE_FILE;
    for (const it of carriedOf(files, w.id)) if (g.node(`item:${slug(it)}`)) g.link(wandererNode(w.id), `item:${slug(it)}`, 'porta', file);
  }

  // Plots.
  for (const t of readPlots(files)) {
    const noIndividual = new Set<string>();
    const noChunk = new Set<string>();
    const id = g.add('plot', t.id, t.title, 'world/plots.json', { mistero: t.mystery, stato: t.state, inizio: t.start });
    for (const n of new Set([...(t.involved ?? []), ...(t.beats ?? []).map((b) => b.who), ...(t.quest ? [t.quest.from] : [])])) {
      const p = individualByName.get(n);
      if (p) g.link(id, p, 'coinvolge', 'world/plots.json');
      else noIndividual.add(n);
    }
    for (const b of t.beats ?? []) {
      const where = b.where ? chunkIn(b.where) : undefined;
      if (where) g.link(id, where, 'tappa', 'world/plots.json', { giorno: b.day, momento: b.moment, chi: individualByName.get(b.who) ?? b.who, dove: b.where });
      else if (b.where) noChunk.add(b.where);
    }
    const node = g.node(id)!;
    if (noIndividual.size) node.senza_persona = [...noIndividual];
    if (noChunk.size) node.senza_luogo = [...noChunk];
  }

  // Rules: what they are about («item.secchio|…», «object.crate|apri»).
  for (const r of (internalFields('rules', json(files, 'world/rules.json') ?? {})?.rules ?? []) as Array<{ key?: string; text?: string; possible?: boolean }>) {
    if (!r?.key) continue;
    const id = g.add('rule', r.key, r.text ?? r.key, 'world/rules.json', { possibile: r.possible });
    const about = r.key.split('|')[0];
    if (!/^[a-z]+\.[\w.-]+$/.test(about)) continue;
    const t = thing(about);
    if (t) g.link(id, t, 'riguarda', 'world/rules.json');
    else g.missing(`la regola «${r.text ?? r.key}» riguarda ${about}, che non esiste`, [id]);
  }

  // Facts of the bible, and whom or what they name.
  const named = [...g.nodes.values()].filter((n) => (n.tipo === 'individual' && !n.viandante) || n.tipo === 'chunk' || n.tipo === 'region').filter((n) => normName(n.label).length >= 4);
  const facts = [...((Array.isArray(bible?.facts) ? bible.facts : []) as string[]), ...((Array.isArray(bible?.mysteries) ? bible.mysteries : []) as string[])];
  facts.forEach((f, i) => {
    if (typeof f !== 'string') return;
    const id = g.add('fact', String(i + 1), f, 'world/bible.json', i >= (bible?.facts?.length ?? 0) ? { mistero: true } : {});
    const k = normName(f);
    for (const n of named) if (hasWords(k, normName(n.label))) g.link(id, n.id, 'cita', 'world/bible.json');
  });
  return g;
}
