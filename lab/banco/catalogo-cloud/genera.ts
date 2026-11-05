// The generator of the catalogue (cantiere 1): every structure is a MarkovJunior program written here from a few choices (`Scheda`),
// on the skeleton of `lab/banco/riferimento/cantiere.xml` and the cellar of `cantina.xml` (`pattern.md`, `prompt.md`). What is written is
// still a plain program: the XML in `<ambientazione>/<nome>.xml` runs without this file. What the generator adds is what makes it fast
// at Enorme (README-generatore.md, «Perché è veloce»):
//
// - **tall patterns on the plan**: a rule of the plan, a single layer on the ground, gets `*` layers above it up to 80 strata. The engine
//   scans every position of every pattern once per node; a pattern 80 strata tall has only Z − 79 heights to be tried instead of Z.
// - **columns in one stroke**: every letter of the plan writes its whole column with one rule, a single step (`pattern.md`, number 5),
//   instead of a head that climbs one stratum per step under twenty nodes.
// - **rare first cells**: the stair of the cellar looks for the pit (`l`) in the corner the engine reads first, not for the air.
// - **few variants**: `symmetry="()"` where one direction is enough, `prl` instead of `all` for what is written in one step.
//
//   npx vite-node lab/banco/catalogo-cloud/scrivi.ts            writes all the programs of `catalogo-generatore.ts`
//   npx vite-node lab/banco/catalogo-cloud/scrivi.ts -- nome    only those whose name contains `nome`

/** A rule: its patterns on a single layer when the node is on the plan. */
export interface Regola {
  in: string;
  out: string;
  p?: number;
}

export interface Nodo {
  tipo: 'one' | 'all' | 'prl';
  regole: Regola[];
  steps?: number;
  sym?: string;
  /** A node of the plan: a single layer on the ground, tall patterns. */
  alto?: boolean;
  /** A node of the plan with short patterns (it matches too many cells to be tall). */
  pianta?: boolean;
}

const celle = (row: string) => row.match(/\[[^\]]*\]|./g) ?? [];
const area = (p: string) => p.split('/').reduce((s, r) => s + celle(r).length, 0);

/** The tallest the pattern may be (1728 cells), never more than 80 strata: the height of the box above the ground at Grande. */
export const altezzaDi = (p: string) => Math.max(1, Math.min(80, Math.floor(1728 / area(p))));

/** A single-layer pattern with `*` layers above it, the top first as in the XML. */
export function alto(p: string, D: number): string {
  const stelle = p
    .split('/')
    .map((r) => '*'.repeat(celle(r).length))
    .join('/');
  return [...Array(D - 1).fill(stelle), p].join(' ');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** In a rule of the plan every cell is on the ground: `*` there is any letter of the plan (`0`), so the engine stops at the first cell off the ground. */
const sulSuolo = (p: string) => p.replace(/\*/g, '0');

function regolaXml(r: Regola, nodoAlto: boolean, pianta = false): string {
  const D = nodoAlto ? altezzaDi(r.in) : 1;
  const base = pianta ? sulSuolo(r.in) : r.in;
  const i = D > 1 ? alto(base, D) : base;
  const o = D > 1 ? alto(r.out, D) : r.out;
  return `<rule in="${esc(i)}" out="${esc(o)}"${r.p !== undefined ? ` p="${r.p}"` : ''}/>`;
}

export function nodoXml(n: Nodo): string {
  const pianta = !!(n.alto || n.pianta);
  const attrs = `${n.steps !== undefined ? ` steps="${n.steps}"` : ''}${n.sym !== undefined ? ` symmetry="${n.sym}"` : ''}`;
  if (n.regole.length === 1 && n.regole[0].p === undefined) {
    const r = regolaXml(n.regole[0], !!n.alto, pianta).replace(/^<rule /, '').replace(/\/>$/, '');
    return `<${n.tipo} ${r}${attrs}/>`;
  }
  return `<${n.tipo}${attrs}>${n.regole.map((r) => regolaXml(r, !!n.alto, pianta)).join('')}</${n.tipo}>`;
}

/** Shorthands for the nodes, as the XML would say them. `P` is a node of the plan (tall). */
export const all = (i: string, o: string, x: Partial<Nodo> = {}): Nodo => ({ tipo: 'all', regole: [{ in: i, out: o }], ...x });
export const one = (i: string, o: string, x: Partial<Nodo> = {}): Nodo => ({ tipo: 'one', regole: [{ in: i, out: o }], ...x });
export const prl = (i: string, o: string, x: Partial<Nodo> = {}): Nodo => ({ tipo: 'prl', regole: [{ in: i, out: o }], ...x });
export const many = (tipo: Nodo['tipo'], regole: Array<[string, string] | [string, string, number]>, x: Partial<Nodo> = {}): Nodo => ({ tipo, regole: regole.map(([i, o, p]) => ({ in: i, out: o, ...(p !== undefined ? { p } : {}) })), ...x });
export const P = (n: Nodo): Nodo => ({ ...n, alto: true });
/** A node of the plan kept short. */
export const S = (n: Nodo): Nodo => ({ ...n, pianta: true });

/** A column from the ground up: `S F .30 S` is S, F, thirty air, S. */
export function colonna(s: string): string[] {
  return s
    .trim()
    .split(/\s+/)
    .flatMap((t) => {
      const m = t.match(/^(.)(\d*)$/);
      if (!m) throw new Error(`colonna: «${t}»`);
      return Array(m[2] ? Number(m[2]) : 1).fill(m[1] === '.' ? 'B' : m[1]);
    });
}

/** One node that raises every column of the plan in one step: per letter its whole column, the letter on the ground rewritten. */
export function colonne(c: Record<string, string>): Nodo {
  return {
    tipo: 'all',
    steps: 1,
    sym: '()',
    regole: Object.entries(c).map(([L, s]) => {
      const col = colonna(s);
      const inn = [L, ...Array(col.length - 1).fill('B')];
      return { in: [...inn].reverse().join(' '), out: [...col].reverse().join(' ') };
    }),
  };
}

export interface Colore {
  value: string;
  name: string;
  alpha?: number;
  glow?: boolean;
}

export interface Programma {
  /** Letters in order: the first is the air, the second the origin. */
  values: string;
  cantina: boolean;
  unions: Record<string, string>;
  colori: Record<string, Colore>;
  /** Sections, each a comment and its nodes (or raw XML). */
  sezioni: Array<{ titolo: string; nodi: Array<Nodo | string> }>;
  azioni: string[];
}

export function xmlDi(p: Programma): string {
  const usate = new Set<string>();
  const vedi = (s: string) => {
    for (const c of s.replace(/\[|\]/g, '')) if (/[A-Za-z4-9]/.test(c)) usate.add(c);
  };
  const suolo = new Set<string>(['E', 'N']);
  for (const s of p.sezioni)
    for (const n of s.nodi)
      if (typeof n !== 'string')
        for (const r of n.regole) {
          vedi(r.in), vedi(r.out);
          if (n.alto || n.pianta) for (const c of (r.in + r.out).replace(/\[|\]/g, '')) if (/[A-Za-z4-9]/.test(c)) suolo.add(c);
        }
  // Not the air, not the bottom of the box: they are also off the ground.
  const unions = { ...p.unions, '0': [...suolo].filter((c) => !(c in p.unions) && c !== 'B' && c !== 'Z').join('') };
  // A colour only for a letter some rule writes: the others would be colours never used.
  const colori = Object.fromEntries(Object.entries(p.colori).filter(([k]) => usate.has(k)));
  for (const k of Object.keys(unions)) usate.delete(k);
  let values = p.values;
  for (const c of usate) if (!values.includes(c)) values += c;
  const radice = `<sequence values="${values}" symmetry="(xy)" suolo="E"${p.cantina ? ' ground="Z"' : ''} origin="bottom">`;
  const righe = [radice];
  for (const [k, v] of Object.entries(unions)) righe.push(`  <union symbol="${k}" values="${v}"/>`);
  righe.push(
    `  ${Object.entries(colori)
      .map(([k, c]) => `<color symbol="${k}" value="${c.value}"${c.alpha !== undefined ? ` alpha="${c.alpha}"` : ''}${c.glow ? ' glow="True"' : ''} name="${esc(c.name)}"/>`)
      .join('')}`,
  );
  for (const s of p.sezioni) {
    righe.push(`  <!-- ${s.titolo} -->`);
    for (const n of s.nodi) righe.push(`  ${typeof n === 'string' ? n : nodoXml(n)}`);
  }
  righe.push('</sequence>', ...p.azioni);
  return `${righe.join('\n')}\n`;
}
