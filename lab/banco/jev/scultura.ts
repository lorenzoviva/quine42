// Group 2 of the Jev bench (T313): judgements on sculpture, in text. The finished grid of every judged program of the bench
// (lab/banco/finale, lab/banco/conferma) as text views — the four sides and the roof like the photos, the storeys cut, at half
// resolution; or per layer; or per symbol, as boxes — with the eight criteria of lab/banco/README.md as rubrics and the judgements
// of giudizio.md as the right answers. And the node that ruins the shape: a passing program with one node added that breaks it (the
// door walled up, the rooms filled, the roof holed, speckle on the walls), the defect said in words, the program's nodes as options.

import fs from 'node:fs';
import path from 'node:path';
import { bersaglio } from '../bersagli';
import { esegui, misura, type Bersaglio, type Eseguito } from '../misure';
import { boxesText, nodeName, traceProgram, type NodeTrace } from '../../../src/mj/trace';
import { MJ_PALETTE } from '../../../src/mj/palette';
import type { Grid3 } from '../../../src/mj/engine';
import type { CaseSpec, Question } from './banco';
import { ROOT } from './domande';

const BANCO = path.join(ROOT, 'lab/banco');
const AIR = 0;

/** The eight criteria of lab/banco/README.md, «Ciò che non si misura», as the levels of a Score: 0 no, 1 in part, 2 yes. */
export const CRITERIA: Array<{ id: string; text: string }> = [
  { id: 'riconosce', text: 'It is recognisable: from the views, without reading the name, one can tell what building it is and in what style.' },
  { id: 'regge', text: 'It holds together: masses and proportions of a real building, not a box with pieces stuck on; no part floats, pierces another or is cut by the box.' },
  { id: 'lati', text: 'The four sides are worked: the sides and the back too; none is the back of a stage set.' },
  { id: 'tetto', text: 'Roof and silhouette: the roof has a designed shape, coherent with the style, that reads from above.' },
  { id: 'dentro', text: 'The inside makes sense: the rooms asked for are there and furnished, the stairs are where they are needed and do not close a room or end in a wall.' },
  { id: 'colori', text: 'The colours: a coherent palette, distinct materials that read at the scale of the game; no noise instead of details.' },
  { id: 'salti', text: 'The jumps have a reason: what one climbs over or jumps across is a thing of the place (crates, benches, pipes, galleries), not a cube put there.' },
  { id: 'dettaglio', text: 'The detail is up to standard: one would look at it gladly next to the models of the game, rich and not just full of pieces.' },
];

const LEVELS = ['no', 'in part', 'yes'];

export function rubricQuestions(): Question[] {
  return [
    ...CRITERIA.map((c): Question => ({ id: c.id, type: 'score', instructions: `Judge the building in \`views\` against this criterion: ${c.text}`, criteria: LEVELS.map((l) => `${l}: ${l === 'yes' ? 'it fully meets the criterion' : l === 'no' ? 'it does not meet the criterion' : 'it meets it only in part'}`) })),
    { id: 'passa', type: 'noul', instructions: 'Would a strict art director accept this building in the game as it is, looking at `views`: all the criteria met, at most one only in part?' },
  ];
}

// ------------------------------------------------------------------------------------------------ the text views of a grid

const at = (g: Grid3, x: number, y: number, z: number) => g.cells[x + y * g.X + z * g.X * g.Y];

/** The letter a cell value stands for ('.' the air). */
const letter = (g: Grid3, v: number) => (v === AIR ? '.' : g.alphabet[v] ?? '?');

/** The most common non-air value of a block, or air when solid is less than `share` of it. */
function majority(values: number[], share: number): number {
  const n = new Map<number, number>();
  let solid = 0;
  for (const v of values) if (v !== AIR) (n.set(v, (n.get(v) ?? 0) + 1), solid++);
  if (!solid || solid < share * values.length) return AIR;
  return [...n].sort((a, b) => b[1] - a[1])[0][0];
}

/** What a side shows: for each column and height the first solid cell from the viewer, `f` voxels a character. */
function elevation(g: Grid3, side: 'fronte' | 'retro' | 'destra' | 'sinistra', f: number): string[] {
  const W = side === 'fronte' || side === 'retro' ? g.X : g.Y;
  const D = side === 'fronte' || side === 'retro' ? g.Y : g.X;
  const first = (u: number, z: number) => {
    for (let d = 0; d < D; d++) {
      const [x, y] =
        side === 'fronte' ? [u, g.Y - 1 - d] : side === 'retro' ? [g.X - 1 - u, d] : side === 'destra' ? [g.X - 1 - d, g.Y - 1 - u] : [d, u];
      const v = at(g, x, y, z);
      if (v !== AIR) return v;
    }
    return AIR;
  };
  const rows: string[] = [];
  for (let z = g.Z - 1; z >= 0; z -= f) {
    let row = '';
    for (let u = 0; u < W; u += f) {
      const vs: number[] = [];
      for (let dz = 0; dz < f && z - dz >= 0; dz++) for (let du = 0; du < f && u + du < W; du++) vs.push(first(u + du, z - dz));
      row += letter(g, majority(vs, 0.5));
    }
    rows.push(row);
  }
  return trimRows(rows);
}

/** From above: the top solid letter of every column, the front at the bottom; and its height, 0-9 of the box. */
function roof(g: Grid3, f: number): { lettere: string[]; altezze: string[] } {
  const lettere: string[] = [];
  const altezze: string[] = [];
  for (let y = 0; y < g.Y; y += f) {
    let a = '';
    let h = '';
    for (let x = 0; x < g.X; x += f) {
      const vs: number[] = [];
      const zs: number[] = [];
      for (let dy = 0; dy < f && y + dy < g.Y; dy++)
        for (let dx = 0; dx < f && x + dx < g.X; dx++) {
          let z = g.Z - 1;
          while (z >= 0 && at(g, x + dx, y + dy, z) === AIR) z--;
          vs.push(z >= 0 ? at(g, x + dx, y + dy, z) : AIR);
          zs.push(z);
        }
      const v = majority(vs, 0.5);
      a += letter(g, v);
      const top = Math.max(...zs);
      h += v === AIR || top < 0 ? '.' : String(Math.min(9, Math.floor((10 * (top + 1)) / (g.Z + 1))));
    }
    lettere.push(a);
    altezze.push(h);
  }
  return { lettere, altezze };
}

/** A horizontal cut `z` voxels from the bottom, the front at the bottom: walls, furniture, the air of the rooms. */
function section(g: Grid3, z0: number, f: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < g.Y; y += f) {
    let row = '';
    for (let x = 0; x < g.X; x += f) {
      const vs: number[] = [];
      for (let dz = 0; dz < Math.max(1, f) && z0 + dz < g.Z; dz++) for (let dy = 0; dy < f && y + dy < g.Y; dy++) for (let dx = 0; dx < f && x + dx < g.X; dx++) vs.push(at(g, x + dx, y + dy, z0 + dz));
      row += letter(g, majority(vs, 0.25));
    }
    rows.push(row);
  }
  return rows;
}

/** Rows of air at the top go: an elevation starts where the building does. */
function trimRows(rows: string[]): string[] {
  let i = 0;
  while (i < rows.length - 1 && /^\.*$/.test(rows[i])) i++;
  return rows.slice(i);
}

/** The names of the letters a program uses: its own `<color name>`, else the palette's colour name. */
function materialNames(xml: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of xml.matchAll(/<color\s+[^>]*symbol="(.)"[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(m[0])?.[1];
    if (name) out[m[1]] = name;
  }
  return out;
}

function materials(g: Grid3, xml: string): string[] {
  const names = materialNames(xml);
  const n = new Map<number, number>();
  let solid = 0;
  for (const v of g.cells) if (v !== AIR) (n.set(v, (n.get(v) ?? 0) + 1), solid++);
  return [...n]
    .sort((a, b) => b[1] - a[1])
    .map(([v, c]) => `${letter(g, v)}: ${names[letter(g, v)] ?? MJ_PALETTE[letter(g, v)]?.name.toLowerCase() ?? 'colore'} (${Math.round((1000 * c) / solid) / 10} %)`);
}

export type ViewKind = 'viste' | 'strati' | 'simboli';

/** A judged program as text: what was asked, the box, the materials and the views of one kind. */
export function viewsOf(e: Eseguito, b: Bersaglio, kind: ViewKind, storeys: number[]): Record<string, unknown> {
  const g = e.grid;
  const f = 2;
  const head = {
    building: { name: b.nome, style: b.stile, description: b.descrizione },
    box: `${g.X} × ${g.Y} × ${g.Z} voxel (x across, y from the back to the front, z up); a tile is ${e.scatola.vpt} voxels, a person is ${e.scatola.persona} voxels tall`,
    materials: materials(g, e.xml),
    legend: `every character is ${kind === 'simboli' ? 'a letter of the palette' : `${f}×${f} voxels`}: a letter of \`materials\`, '.' the air`,
  };
  if (kind === 'viste') {
    const r = roof(g, f);
    return {
      ...head,
      views: {
        fronte: elevation(g, 'fronte', f),
        destra: elevation(g, 'destra', f),
        retro: elevation(g, 'retro', f),
        sinistra: elevation(g, 'sinistra', f),
        tetto: r.lettere,
        altezze_del_tetto: r.altezze,
        ...Object.fromEntries(storeys.map((z, i) => [`pianta_piano_${i}`, section(g, Math.min(g.Z - 1, z + Math.ceil(e.scatola.persona / 2)), f)])),
      },
    };
  }
  if (kind === 'strati') {
    const step = Math.max(2, Math.round(e.scatola.vpt / 2));
    const layers: Record<string, string[]> = {};
    for (let z = 0; z < g.Z; z += step) {
      const s = section(g, z, f);
      if (s.some((row) => /[^.]/.test(row))) layers[`z${z}`] = s;
    }
    return { ...head, legend: `${head.legend}; one horizontal layer every ${step} voxels from the bottom, the front at the bottom of each`, views: layers };
  }
  // Per symbol: the static model as boxes of one letter each (trace.ts → boxesText), the largest first.
  return { ...head, legend: 'every line: a letter, its voxels, then boxes x0-x1 y0-y1 z0-z1 of that letter that do not overlap, the largest first', views: { scatole: boxesText({ step: 0, X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: g.alphabet }, 6) } };
}

// ------------------------------------------------------------------------------------------------ the judgements of the bench

interface Judged {
  /** finale/moderna/1, conferma/locanda/1/seconda */
  dir: string;
  bersaglio: string;
  levels: Record<string, number>;
  passa: boolean;
  note: string;
}

const LEVEL: Record<string, number> = { sì: 2, parte: 1, no: 0 };

/** The rows of a giudizio.md with a judgement of the photos (the ones the game or the measures turned down have none). */
export function judgements(giro: 'finale' | 'conferma'): Judged[] {
  const md = fs.readFileSync(path.join(BANCO, giro, 'giudizio.md'), 'utf8');
  const out: Judged[] = [];
  for (const line of md.split('\n')) {
    const cells = line.split('|').map((c) => c.trim().replace(/\*\*/g, ''));
    const m = /^([a-z]+)\/(\d)( seconda)?$/.exec(cells[1] ?? '');
    if (!m) continue;
    const first = giro === 'finale' ? 3 : 4;
    const vals = cells.slice(first, first + 8);
    if (vals.some((v) => !(v in LEVEL))) continue;
    const levels = Object.fromEntries(CRITERIA.map((c, i) => [c.id, LEVEL[vals[i]]]));
    const partial = vals.filter((v) => v === 'parte').length;
    const passa = vals.every((v) => v !== 'no') && partial <= 1;
    out.push({ dir: `${giro}/${m[1]}/${m[2]}${m[3] ? '/seconda' : ''}`, bersaglio: m[1], levels, passa, note: cells[giro === 'finale' ? 12 : 12] ?? '' });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ the node that ruins the shape

interface Letters {
  /** The letter of the outer walls, its name, the air (the first of `values`), another letter of the program for the speckle. */
  wall: string;
  name: string;
  air: string;
  noise: string;
}

interface Sabotage {
  id: 'riempie' | 'porta' | 'tetto' | 'rumore';
  /** The node added to the program, and what one sees, in words, without saying the node. */
  node: (e: Eseguito, l: Letters, door: { x: number; y: number }, top: number) => string;
  defect: (l: Letters) => string;
}

const center = (lo: number, size: number) => lo + size / 2;

const SABOTAGES: Sabotage[] = [
  {
    id: 'riempie',
    node: (e, l) => {
      const g = e.grid;
      const sx = Math.round(g.X * 0.45), sy = Math.round(g.Y * 0.35);
      return `<box at="${center(Math.round(g.X * 0.28), sx)} ${center(Math.round(g.Y * 0.3), sy)} 2" size="${sx} ${sy} ${e.scatola.persona + 4}" color="${l.wall}"/>`;
    },
    defect: (l) => `Al piano terra un blocco pieno di ${l.name} riempie le stanze: dentro non si cammina più, il pavimento coperto non si raggiunge.`,
  },
  {
    id: 'porta',
    node: (e, l, door) => `<box at="${door.x} ${Math.min(e.grid.Y - 3, door.y)} 2" size="${e.scatola.vpt * 2} 6 ${e.scatola.persona + 6}" color="${l.wall}"/>`,
    defect: (l) => `La porta sul davanti è murata: un muro di ${l.name} chiude l'ingresso da cui si entra.`,
  },
  {
    id: 'tetto',
    node: (e, l, _door, top) => {
      const g = e.grid;
      const s = Math.round(g.X * 0.3);
      return `<box at="${center(Math.round(g.X * 0.35), s)} ${center(Math.round(g.Y * 0.35), s)} ${Math.max(0, top - 6)}" size="${s} ${s} 12" color="${l.air}"/>`;
    },
    defect: () => 'Il tetto ha un buco grande e quadrato in mezzo: da sopra si vedono le stanze, la pioggia ci entra.',
  },
  {
    id: 'rumore',
    node: (_e, l) => `<prl in="${l.wall}" out="${l.noise}" p="0.08" steps="1"/>`,
    defect: (l) => `Le facciate di ${l.name} sono piene di puntini sparsi di un altro colore: rumore al posto dei dettagli.`,
  },
];

/** The most used letter of the outer walls: the one a sabotage writes with. */
function wallLetter(g: Grid3): string {
  const n = new Map<number, number>();
  for (let z = 2; z < g.Z; z += 2)
    for (let x = 0; x < g.X; x += 2) {
      for (let y = g.Y - 1; y >= 0; y--) {
        const v = at(g, x, y, z);
        if (v !== AIR) {
          n.set(v, (n.get(v) ?? 0) + 1);
          break;
        }
      }
    }
  return g.alphabet[[...n].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 1];
}

/** The program with a node added before the `at`-th child of the root that is not a color or a palette line. */
function insertNode(xml: string, node: string, frac: number): { xml: string; ok: boolean } {
  const close = xml.lastIndexOf('</sequence>');
  if (close < 0) return { xml, ok: false };
  const body = xml.slice(0, close);
  // Top-level elements are the lines that start at the root's indentation: a cut between two of them keeps the XML whole.
  const starts = [...body.matchAll(/\n  <(?!color|\/)[a-z]+[\s>]/g)].map((m) => m.index! + 1);
  if (starts.length < 4) return { xml: body + `  ${node}\n` + xml.slice(close), ok: true };
  const i = starts[Math.min(starts.length - 1, Math.max(1, Math.floor(frac * starts.length)))];
  return { xml: xml.slice(0, i) + `  ${node}\n` + xml.slice(i), ok: true };
}

const nodeLine = (n: NodeTrace) => {
  const ch = [...n.changes].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(', ');
  const box = n.box ? ` x${n.box.x0}-${n.box.x1} y${n.box.y0}-${n.box.y1} z${n.box.z0}-${n.box.z1}` : '';
  return `${nodeName(n.node).slice(0, 90)} — ${n.cells} celle (${ch})${box}, passi ${n.first}-${n.last}`;
};

/** The id the sabotage got in the program: the trace's id of the node whose XML is the one added. */
function findAdded(nodes: NodeTrace[], before: NodeTrace[]): NodeTrace | undefined {
  const old = new Set(before.map((n) => nodeName(n.node) + `@${n.depth}`));
  const fresh = nodes.filter((n) => !old.has(nodeName(n.node) + `@${n.depth}`));
  return fresh.length === 1 ? fresh[0] : fresh.sort((a, b) => b.cells - a.cells)[0];
}

// ------------------------------------------------------------------------------------------------ the case file

export function prepare(log: (s: string) => void = console.log): string {
  const cases: CaseSpec[] = [];
  const judged = [...judgements('finale'), ...judgements('conferma')];
  for (const j of judged) {
    const b = bersaglio(j.bersaglio)!;
    const xml = fs.readFileSync(path.join(BANCO, j.dir, 'modello.xml'), 'utf8');
    const e = esegui(xml, b, 1);
    const m = misura(e, b);
    const storeys = m.piani.filter((p) => p.quota >= 0).map((p) => p.z);
    for (const kind of ['viste', 'strati', 'simboli'] as ViewKind[]) {
      cases.push({
        id: `rubrica-${kind}/${j.dir}`,
        group: 'scultura',
        kind: `rubrica-${kind}`,
        source: `lab/banco/${j.dir}/modello.xml; giudizio: lab/banco/${j.dir.split('/')[0]}/giudizio.md`,
        note: j.note,
        state: viewsOf(e, b, kind, storeys),
        questions: rubricQuestions(),
        expected: { ...j.levels, passa: j.passa },
      });
    }
  }
  log(`rubriche: ${judged.length} programmi giudicati × 3 forme`);
  // The node that ruins the shape: on programs that pass both measures and photos, one sabotage each, in turn.
  const passing = judged.filter((j) => j.passa);
  let k = 0;
  for (const j of passing) {
    const b = bersaglio(j.bersaglio)!;
    const xml = fs.readFileSync(path.join(BANCO, j.dir, 'modello.xml'), 'utf8');
    const e = esegui(xml, b, 1);
    const m = misura(e, b);
    const before = traceProgram(e.model, 1).nodes;
    const wall = wallLetter(e.grid);
    const values = /values="([^"]+)"/.exec(xml)?.[1] ?? 'B';
    const letters: Letters = { wall, name: materialNames(xml)[wall] ?? MJ_PALETTE[wall]?.name.toLowerCase() ?? wall, air: values[0], noise: [...values.slice(1)].reverse().find((c) => c !== wall && MJ_PALETTE[c]?.color !== MJ_PALETTE[wall]?.color) ?? values[1] };
    let top = e.grid.Z - 1;
    while (top > 0 && ![...Array(e.grid.X).keys()].some((x) => at(e.grid, x, Math.floor(e.grid.Y / 2), top) !== AIR)) top--;
    for (const pick of [0, 1]) {
      const s = SABOTAGES[(k + pick * 2) % SABOTAGES.length];
      const frac = 0.55 + 0.4 * (((k * 7 + pick * 3) % 10) / 10);
      const door = m.porta ?? { x: Math.floor(e.grid.X / 2), y: e.grid.Y - 2 };
      const node = s.node(e, letters, door, top);
      const sab = insertNode(xml, node, frac);
      if (!sab.ok) continue;
      let e2: Eseguito;
      try {
        e2 = esegui(sab.xml, b, 1);
      } catch (err) {
        log(`sabotaggio ${s.id} su ${j.dir}: il gioco lo rifiuta (${(err as Error).message})`);
        continue;
      }
      const m2 = misura(e2, b);
      // The defect has to show: the measures say so for the door and the rooms; the roof and the speckle change the cells.
      const shows = s.id === 'porta' ? !m2.porta?.libera || m2.porta.x !== m.porta?.x || m2.murato > m.murato + 0.05 : s.id === 'riempie' ? m2.murato > m.murato + 0.05 || m2.piani.length < m.piani.length : true;
      if (!shows) {
        log(`sabotaggio ${s.id} su ${j.dir}: non si vede, salto`);
        continue;
      }
      const nodes = traceProgram(e2.model, 1).nodes;
      const added = findAdded(nodes, before);
      if (!added || added.cells === 0) {
        log(`sabotaggio ${s.id} su ${j.dir}: il nodo aggiunto non cambia nulla, salto`);
        continue;
      }
      const options = nodes.filter((n) => n.cells > 0);
      if (options.length > 255) options.splice(0, options.length - 255);
      if (!options.includes(added)) continue;
      cases.push({
        id: `colpevole/${j.dir}/${s.id}`,
        group: 'scultura',
        kind: 'colpevole',
        source: `lab/banco/${j.dir}/modello.xml con un nodo aggiunto (${node})`,
        state: { building: { name: b.nome, style: b.stile }, box: `${e2.grid.X} × ${e2.grid.Y} × ${e2.grid.Z} voxel (x across, y from the back to the front, z up)`, defect: s.defect(letters), program: 'every option is a node of the program that changed some cells: what it is, how many cells, which letters into which, where (its box) and in which steps' },
        questions: [
          {
            id: 'nodo',
            type: 'choice',
            instructions: 'The finished building has the defect in `defect`. Which node of the program, among the options, causes it?',
            criteria: Object.fromEntries(options.map((n) => [`#${n.id}`, nodeLine(n)])),
          },
        ],
        expected: { nodo: [`#${added.id}`] },
      });
    }
    k++;
  }
  log(`colpevoli: ${cases.filter((c) => c.kind === 'colpevole').length}`);
  const file = path.join(ROOT, 'lab/banco/jev/casi/scultura.json');
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        group: 'scultura',
        description:
          'Gruppo 2 (T313), generato da `--prepara scultura`: i programmi giudicati del banco (finale, conferma) in tre forme di testo, con i criteri del banco come rubriche e i giudizi di giudizio.md come risposte giuste; e i programmi che passano con un nodo aggiunto che rovina la forma, il difetto detto a parole e i nodi del programma come opzioni.',
        cases,
      },
      null,
      1,
    ) + '\n',
  );
  return file;
}
