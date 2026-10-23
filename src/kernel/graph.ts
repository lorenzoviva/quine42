// The graph of the world (ADR-0045): the contents of a universe as typed nodes and edges — people
// and their relations, kinds, places, regions, environments, structures, plots, items, recipes, runes,
// spells, rules, facts of the bible — built from the universe's files, deterministic, no model calls.
// The Council asks it what exists instead of inventing (T13); the kernel asks it what does not hold
// (`check`). It is written to world/grafo.json with every commit, in Graphify's node-link format, and
// is always derived: it can be rebuilt from the files (the places come from the chunk plans, which
// live outside the text snapshot, so a rebuild keeps the places of the previous graph).

import type { FileMap, Manifest } from './types';
import { readPeople, relationProblem, relationsAgree, similarNames, type Person, type Species } from './society';
import { readPlots } from './plots';
import { readAtlas, regionAt } from './atlas';
import { normName } from './content';
import { hashStr, hex } from './rng';

export const GRAPH_FILE = 'world/grafo.json';
export const GRAPH_SCHEMA = 1;
/** The version of the builder: raise it when the graph is built differently, so the files are rewritten. */
export const GRAPH_BUILD = 2;

export type NodeType = 'persona' | 'tipo' | 'luogo' | 'regione' | 'ambiente' | 'struttura' | 'trama' | 'oggetto' | 'ricetta' | 'runa' | 'incantesimo' | 'regola' | 'fatto';

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
  persona: '#ffb38a',
  tipo: '#d89a6a',
  luogo: '#7dd87d',
  regione: '#3fa35f',
  ambiente: '#9ad27a',
  struttura: '#c8b27a',
  trama: '#ff8ad8',
  oggetto: '#e0b070',
  ricetta: '#f0d890',
  runa: '#c48aff',
  incantesimo: '#9a6aff',
  regola: '#ffcf5c',
  fatto: '#6fc3ff',
};
export const NODE_NAME: Record<NodeType, string> = {
  persona: 'persone',
  tipo: 'tipi',
  luogo: 'luoghi',
  regione: 'regioni',
  ambiente: 'ambienti',
  struttura: 'strutture',
  trama: 'trame',
  oggetto: 'oggetti',
  ricetta: 'ricette',
  runa: 'rune',
  incantesimo: 'incantesimi',
  regola: 'regole',
  fatto: 'fatti',
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

/** NetworkX node-link data, as Graphify reads it (`graphify explain|path|query --graph world/grafo.json`). */
export interface GraphData {
  directed: true;
  multigraph: true;
  graph: { schema_version: number; nome: string; hash: string };
  nodes: GraphNode[];
  links: GraphLink[];
}

/** A place as the graph knows it: a planned chunk. */
export interface GraphPlace {
  cx: number;
  cy: number;
  nome: string;
  descrizione?: string;
  ambiente?: string;
  /** Module ids of the things placed there. */
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
export function placesOf(data: GraphData | null | undefined): GraphPlace[] {
  return (data?.nodes ?? [])
    .filter((n) => n.tipo === 'luogo' && typeof n.cx === 'number' && typeof n.cy === 'number')
    .map((n) => ({ cx: n.cx as number, cy: n.cy as number, nome: n.label, descrizione: n.descrizione as string | undefined, ambiente: n.ambiente as string | undefined, cose: n.cose as string[] | undefined, a_terra: n.a_terra as string[] | undefined, strutture: n.strutture as string[] | undefined }));
}

/** The places of the previous graph file, then those given (which win), in a stable order. */
export function mergePlaces(files: FileMap, places: GraphPlace[]): GraphPlace[] {
  const known = new Map<string, GraphPlace>();
  for (const p of [...placesOf(readGraph(files)), ...places]) known.set(`${p.cx},${p.cy}`, p);
  return [...known.values()].sort((a, b) => a.cx - b.cx || a.cy - b.cy);
}

/** What the wanderer carries (world/stato.json changes with every save: only this goes into the graph). */
export function carriedOf(files: FileMap): string[] {
  const out = new Set<string>();
  const walk = (inv: any) => {
    for (const s of Array.isArray(inv?.slots) ? inv.slots : []) {
      if (s?.item) out.add(String(s.item));
      if (s?.inv) walk(s.inv);
    }
  };
  walk(json(files, 'world/stato.json')?.viandante?.inventory);
  return [...out].sort();
}

/** What the graph is made of, as a hash: the same hash, the same graph (the file is not rewritten). */
export function graphHash(files: FileMap, places: GraphPlace[]): string {
  return hex(hashStr(`${GRAPH_BUILD}|` + graphSources(files).map((p) => `${p}\0${files[p]}`).join('\u0001') + JSON.stringify(places) + carriedOf(files).join(',')));
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
      if (n.tipo === 'persona' && similarNames(n.label, name)) near.push(n);
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
      const n = same.find((x) => x.tipo === 'persona') ?? same[0];
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
        case 'legame': parts.push(`${l.legame} ${l.target === 'persona:viandante' ? 'del viandante' : `di ${t}`}`); break;
        case 'e_un': break;
        case 'abita': parts.push(`abita a ${t}`); break;
        case 'lavora': parts.push(`lavora a ${t}`); break;
        case 'porta': parts.push(`porta ${t}`); break;
        case 'coinvolge': parts.push(`coinvolge ${t}`); break;
        case 'tappa': parts.push(`tappa a ${t} (giorno ${l.giorno}, ${l.momento}, ${name(String(l.chi))})`); break;
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
    for (const n of first) if (!HUBS.has(n.tipo) && !n.viandante) for (const m of this.neighbors(n.id, 1)) if (m.tipo !== 'fatto') push(m.id);
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
    const people = [...this.nodes.values()].filter((n) => n.tipo === 'persona' && !n.atteso && !n.viandante);
    const rel = (a: string, b: string) => (this.out.get(a) ?? []).filter((l) => l.relation === 'legame' && l.target === b);
    const pairs = new Set<string>();
    for (const l of this.links) {
      if (l.relation !== 'legame') continue;
      const a = this.nodes.get(l.source)!;
      const b = this.nodes.get(l.target)!;
      if (a.viandante || b.viandante) continue;
      const why = relationProblem(String(l.legame), a as Pick<Person, 'specie' | 'genere'>, b as Pick<Person, 'specie'>);
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
      if (t.tipo !== 'trama' || t.stato === 'chiusa') continue;
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
const HUBS = new Set<NodeType>(['tipo', 'regione', 'ambiente', 'oggetto', 'runa']);
/** Nodes whose name, in the lines of who has them, says all the context needs. */
const LEAVES = new Set<NodeType>(['oggetto', 'tipo', 'ambiente', 'struttura', 'runa', 'ricetta']);

const DESCRIBE: Partial<Record<NodeType, (n: GraphNode) => string>> = {
  persona: (n) => (n.viandante ? 'il viandante' : `${n.label}${n.atteso ? ' (se ne parla, ma nessuno l’ha incontrata)' : ''}${n.specie === 'animale' ? `, animale${n.genere ? ` ${n.genere}` : ''}` : n.genere === 'femmina' ? ', donna' : n.genere === 'maschio' ? ', uomo' : ''}${n.mestiere ? `, ${n.mestiere}` : ''}`),
  luogo: (n) => `${n.label} (luogo${typeof n.cx === 'number' ? ` ${n.cx},${n.cy}` : ''})`,
  regione: (n) => `${n.label} (regione)${n.descrizione ? `: ${n.descrizione}` : ''}`,
  trama: (n) => `trama «${n.label}»${n.stato === 'chiusa' ? ' (chiusa)' : ''}: ${n.mistero ?? ''}`,
  oggetto: (n) => `${n.label} (oggetto${n.categoria ? `, ${n.categoria}` : ''})`,
  ricetta: (n) => `ricetta ${n.label}`,
  runa: (n) => `runa «${n.label}»`,
  incantesimo: (n) => `incantesimo ${n.label}`,
  regola: (n) => `regola: ${n.label}${n.possibile === false ? ' (non si può)' : ''}`,
  fatto: (n) => `fatto: ${n.label}`,
  tipo: (n) => `${n.label} (tipo)`,
  ambiente: (n) => `${n.label} (ambiente)`,
  struttura: (n) => `${n.label} (struttura)`,
};

/**
 * Builds the graph of a universe from its files and the places known (planned chunks). The places
 * of the previous graph file are kept when `places` does not say otherwise; `speciesOf` gives the
 * species of a kind when the registry does not say it (old registries).
 */
export function buildGraph(files: FileMap, places: GraphPlace[] = [], speciesOf: (tipo: string) => Species | undefined = () => undefined): WorldGraph {
  const sources = graphSources(files);
  const placeList = mergePlaces(files, places);
  const hash = graphHash(files, placeList);
  const nome = json(files, 'universe.json')?.name ?? '';
  const g = new WorldGraph(nome, hash);

  // Modules: kinds of things, items, recipes, runes, spells, environments.
  const manifests = sources
    .filter((p) => p.startsWith('modules/'))
    .map((p) => [p, json(files, p)] as [string, Manifest | null])
    .filter((x): x is [string, Manifest] => !!x[1]?.id);
  const itemByName = new Map<string, string>();
  const pending: Array<() => void> = [];
  for (const [file, m] of manifests) {
    if (m.kind === 'item') itemByName.set(normName(m.name ?? ''), g.add('oggetto', m.id, m.name ?? m.id, file, { categoria: m.tags?.[0] }, true));
    else if (m.kind !== 'data' && m.kind !== 'generator') g.add('tipo', m.id, m.name ?? m.id, file, { kind: m.kind, classe: m.appearance?.classe, modello: m.appearance?.model, unico: m.unique || undefined }, true);
    for (const it of m.items ?? []) {
      const id = g.add('oggetto', it.id, it.name ?? it.id, file, { categoria: it.category }, true);
      itemByName.set(normName(it.name ?? ''), id);
    }
    for (const [lid, l] of Object.entries(m.layouts ?? {})) g.add('ambiente', lid, l.name ?? lid, file, { ambiente: l.environment }, true);
    for (const [tok, r] of Object.entries(m.runes ?? {})) g.add('runa', tok, tok, file, { nome: (r as { name?: string }).name }, true);
    for (const [seq, s] of Object.entries(m.spells ?? {})) {
      const id = g.add('incantesimo', s.name ?? seq, s.name ?? seq, file, { rune: seq }, true);
      pending.push(() => {
        for (const tok of seq.split(/\s+/).filter(Boolean)) {
          if (g.node(`runa:${slug(tok)}`)) g.link(id, `runa:${slug(tok)}`, 'usa', file);
          else g.missing(`l'incantesimo ${s.name ?? seq} usa la runa «${tok}», che non esiste`, [id]);
        }
      });
    }
    for (const r of m.recipes ?? []) {
      const id = g.add('ricetta', r.id, r.name ?? r.id, file);
      pending.push(() => {
        const lacking = new Set<string>();
        const item = (x: string) => {
          const t = g.node(`oggetto:${slug(x)}`)?.id ?? itemByName.get(normName(x));
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
  const thing = (ref: string): string | undefined => g.node(`tipo:${slug(ref)}`)?.id ?? g.node(`oggetto:${slug(ref)}`)?.id;

  // The atlas.
  const atlas = readAtlas(files);
  for (const r of atlas.regioni) {
    const id = g.add('regione', r.id, r.nome, 'world/atlas.json', { descrizione: r.descrizione, centro: r.centro, raggio: r.raggio }, true);
    if (g.node(`ambiente:${slug(r.ambiente)}`)) g.link(id, `ambiente:${slug(r.ambiente)}`, 'ambiente', 'world/atlas.json');
  }

  // Places: the planned chunks, then the places the bible names that no chunk has.
  const placeByName = new Map<string, string>();
  for (const p of placeList) {
    const id = g.add('luogo', `${p.cx}_${p.cy}`, p.nome, 'maps/', { cx: p.cx, cy: p.cy, descrizione: p.descrizione, ambiente: p.ambiente, cose: p.cose, a_terra: p.a_terra, strutture: p.strutture }, true);
    if (!placeByName.has(normName(p.nome))) placeByName.set(normName(p.nome), id);
    const reg = regionAt(atlas, p.cx, p.cy);
    if (reg) g.link(id, `regione:${slug(reg.id)}`, 'in_regione', 'world/atlas.json');
    if (p.ambiente && g.node(`ambiente:${slug(p.ambiente)}`)) g.link(id, `ambiente:${slug(p.ambiente)}`, 'ambiente', 'maps/');
    const lacking = [...new Set(p.cose ?? [])].filter((m) => {
      const t = thing(m);
      if (t) g.link(id, t, 'contiene', 'maps/');
      return !t;
    });
    if (lacking.length) g.missing(`a ${p.nome} (${p.cx},${p.cy}) ci sono cose che non esistono: ${lacking.join(', ')}`, [id]);
    for (const x of new Set(p.a_terra ?? [])) {
      const t = itemByName.get(normName(x)) ?? g.node(`oggetto:${slug(x)}`)?.id;
      if (t) g.link(id, t, 'contiene', 'maps/');
    }
    for (const s of new Set(p.strutture ?? [])) g.link(id, g.add('struttura', s, s, 'maps/', {}, true), 'contiene', 'maps/');
  }
  const bible = json(files, 'world/bible.json');
  for (const nome of (Array.isArray(bible?.luoghi) ? bible.luoghi : []) as string[]) {
    if (typeof nome !== 'string' || placeByName.has(normName(nome))) continue;
    placeByName.set(normName(nome), g.add('luogo', nome, nome, 'world/bible.json', { dalla_bibbia: true }, true));
  }
  for (const r of atlas.regioni) if (!placeByName.has(normName(r.nome))) placeByName.set(normName(r.nome), `regione:${slug(r.id)}`);
  /** A place a text names: the same name, or a known name inside it («sulle rive del Lago del Re Muto»). */
  const placeIn = (text: string): string | undefined => {
    const k = normName(text);
    if (placeByName.has(k)) return placeByName.get(k);
    let best: [string, string] | undefined;
    for (const [n, id] of placeByName) if (n.length >= 4 && hasWords(k, n) && (!best || n.length > best[0].length)) best = [n, id];
    return best?.[1];
  };

  // People: the registry, the awaited ones, the wanderer.
  const people = readPeople(files);
  const personByName = new Map<string, string>();
  const PF = 'world/people.json';
  for (const p of people.persone) {
    const id = g.add('persona', p.nome, p.nome, PF, { specie: p.specie ?? speciesOf(p.tipo), genere: p.genere, tipo_modulo: p.tipo, mestiere: p.mestiere, eta: p.eta, luogo: p.luogo, legame_viandante: p.legameViandante });
    personByName.set(p.nome, id);
  }
  // Someone named and not met is of the species of who named them (as the repair of the society assumes).
  for (const a of people.attesi) if (!personByName.has(a.nome)) personByName.set(a.nome, g.add('persona', a.nome, a.nome, PF, { atteso: true, specie: personByName.has(a.di) ? g.node(personByName.get(a.di)!)!.specie : undefined }));
  const wanderer = g.add('persona', 'viandante', 'il viandante', 'world/stato.json', { viandante: true, specie: 'persona' }, true);
  for (const p of people.persone) {
    const id = personByName.get(p.nome)!;
    if (p.tipo) {
      if (g.node(`tipo:${slug(p.tipo)}`)) g.link(id, `tipo:${slug(p.tipo)}`, 'e_un', PF);
      else g.missing(`${p.nome} è un ${p.tipo}, che non esiste`, [id]);
    }
    for (const r of p.famiglia ?? []) {
      const t = personByName.get(r.nome) ?? (normName(r.nome) === 'viandante' ? wanderer : undefined);
      if (t) g.link(id, t, 'legame', PF, { legame: r.legame });
      else g.missing(`${p.nome} è ${r.legame} di ${r.nome}, che non esiste`, [id]);
    }
    if (p.legameViandante && !(p.famiglia ?? []).some((r) => normName(r.nome) === 'viandante' && r.legame === p.legameViandante)) g.link(id, wanderer, 'legame', PF, { legame: p.legameViandante });
    const home = p.luogo ? placeIn(p.luogo) : undefined;
    if (home?.startsWith('luogo:')) {
      const where = new Set((p.routine ?? []).map((s) => s.dove));
      if (where.has('casa') || !where.size) g.link(id, home, 'abita', PF);
      if (where.has('lavoro')) g.link(id, home, 'lavora', PF);
    }
  }
  for (const a of people.attesi) {
    const id = personByName.get(a.nome)!;
    const t = personByName.get(a.di);
    if (t) g.link(id, t, 'legame', PF, { legame: a.legame });
  }
  for (const it of carriedOf(files)) if (g.node(`oggetto:${slug(it)}`)) g.link(wanderer, `oggetto:${slug(it)}`, 'porta', 'world/stato.json');

  // Plots.
  for (const t of readPlots(files)) {
    const noPerson = new Set<string>();
    const noPlace = new Set<string>();
    const id = g.add('trama', t.id, t.titolo, 'world/plots.json', { mistero: t.mistero, stato: t.stato, inizio: t.inizio });
    for (const n of new Set([...(t.coinvolti ?? []), ...(t.tappe ?? []).map((b) => b.chi), ...(t.missione ? [t.missione.da] : [])])) {
      const p = personByName.get(n);
      if (p) g.link(id, p, 'coinvolge', 'world/plots.json');
      else noPerson.add(n);
    }
    for (const b of t.tappe ?? []) {
      const where = b.dove ? placeIn(b.dove) : undefined;
      if (where) g.link(id, where, 'tappa', 'world/plots.json', { giorno: b.giorno, momento: b.momento, chi: personByName.get(b.chi) ?? b.chi, dove: b.dove });
      else if (b.dove) noPlace.add(b.dove);
    }
    const node = g.node(id)!;
    if (noPerson.size) node.senza_persona = [...noPerson];
    if (noPlace.size) node.senza_luogo = [...noPlace];
  }

  // Rules: what they are about («item.secchio|…», «object.crate|apri»).
  for (const r of (json(files, 'world/rules.json')?.regole ?? []) as Array<{ chiave?: string; testo?: string; possibile?: boolean }>) {
    if (!r?.chiave) continue;
    const id = g.add('regola', r.chiave, r.testo ?? r.chiave, 'world/rules.json', { possibile: r.possibile });
    const about = r.chiave.split('|')[0];
    if (!/^[a-z]+\.[\w.-]+$/.test(about)) continue;
    const t = thing(about);
    if (t) g.link(id, t, 'riguarda', 'world/rules.json');
    else g.missing(`la regola «${r.testo ?? r.chiave}» riguarda ${about}, che non esiste`, [id]);
  }

  // Facts of the bible, and whom or what they name.
  const named = [...g.nodes.values()].filter((n) => (n.tipo === 'persona' && !n.viandante) || n.tipo === 'luogo' || n.tipo === 'regione').filter((n) => normName(n.label).length >= 4);
  const facts = [...((Array.isArray(bible?.fatti) ? bible.fatti : []) as string[]), ...((Array.isArray(bible?.misteri) ? bible.misteri : []) as string[])];
  facts.forEach((f, i) => {
    if (typeof f !== 'string') return;
    const id = g.add('fatto', String(i + 1), f, 'world/bible.json', i >= (bible?.fatti?.length ?? 0) ? { mistero: true } : {});
    const k = normName(f);
    for (const n of named) if (hasWords(k, normName(n.label))) g.link(id, n.id, 'cita', 'world/bible.json');
  });
  return g;
}
