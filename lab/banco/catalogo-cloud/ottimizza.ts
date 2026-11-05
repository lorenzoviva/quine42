// How a structure is written for speed (Cantiere 1), as text transforms of a readable program. The engine scans the whole grid once per
// variant of every pattern the first time a node runs, and then checks every written cell against every offset of every pattern: a box
// of 120 × 120 × 112 makes both expensive. Three transforms keep the program's meaning and cut the time:
//
// 1. `colonne`: the nodes that raise the columns a step at a time (`<all steps="30" symmetry="()"><rule in="B t" out="t B"/>…`) become one
//    node of tall rules, a whole column per plan letter in one step (pattern 5 of `../pattern.md`): no incremental work, one scan per letter.
// 2. `senzaAria`: a union `9` of every letter but the air: a `*` of a plan pattern (single layer, before the columns) becomes `9`, so the
//    pattern fails at its first cell on every layer that is not the plan (the plan has no air; everything above it is air).
// 3. `imbottisci`: a plan pattern gets layers of `*` on top, up to 80 (or 1728 cells): it then fits only at the heights from the bottom to
//    the plan, and the scan touches those (21 layers of 100 at Large with the cellar, 33 of 112 at Huge) instead of all. Only for nodes that
//    write little per step: each written cell is checked against every offset of the pattern. A node that does one step says `steps="1"`,
//    so it does not look again.
//
// `valida.ts --ottimizza` applies them and checks, cell by cell on every seed and size, that 3 does not change the grid of 1+2.

/** The tokens of a row: a `[…]` set is one cell. */
const cellsOf = (row: string) => row.match(/\[[^\]]*\]|[^/ ]/g) ?? [];

/** The column nodes: `<all steps="N" symmetry="()">` with rules `B x → y z` only. */
const COLUMN = /\s*<all (?:steps="(\d+)" )?symmetry="\(\)"(?: steps="(\d+)")?>((?:<rule in="B \w" out="\w \w"\/>)+)<\/all>/g;

/** 1. The contiguous column nodes as one node of tall rules (what each plan letter leaves, from the plan up). */
export function colonne(xml: string): string {
  const found = [...xml.matchAll(COLUMN)];
  if (!found.length) return xml;
  const nodes = found.map((m) => ({ steps: Number(m[1] ?? m[2] ?? 0), rules: new Map([...m[3].matchAll(/<rule in="B (\w)" out="(\w) (\w)"\/>/g)].map((r) => [r[1], [r[2], r[3]] as const])) }));
  const letters: string[] = [];
  for (const n of nodes) for (const l of n.rules.keys()) if (!letters.includes(l)) letters.push(l);
  const rules = letters.flatMap((L) => {
    const col = [L];
    for (const n of nodes)
      for (let k = 0; k < n.steps; k++) {
        const r = n.rules.get(col[col.length - 1]);
        if (!r) break;
        col[col.length - 1] = r[1];
        col.push(r[0]);
      }
    if (col.length < 2) return [];
    return [`<rule in="${[...Array(col.length - 1).fill('B'), L].join(' ')}" out="${[...col].reverse().join(' ')}"/>`];
  });
  const first = found[0], last = found[found.length - 1];
  const node = `\n  <all steps="1" symmetry="()">${rules.join('')}</all>`;
  return xml.slice(0, first.index) + node + xml.slice(last.index! + last[0].length);
}

/** Where the plan ends: the first rule that raises a column. */
const planEnd = (xml: string) => {
  const i = xml.search(/<rule in="B B B/);
  return i < 0 ? xml.indexOf('</sequence>') : i;
};

/** 2. `*` → `9` (every letter but the air) in the single-layer patterns of the plan. */
export function senzaAria(xml: string): string {
  const values = /values="(\w+)"/.exec(xml)![1];
  if (!xml.includes('<union symbol="9"')) xml = xml.replace(/(<sequence[^>]*>)/, `$1\n  <union symbol="9" values="${values.replace('B', '')}"/>`);
  const end = planEnd(xml);
  const head = xml.slice(0, end).replace(/(<(?:one|all|prl|rule)\b[^>]*?\bin=")([^"]*)"/g, (all, pre: string, inp: string) => (inp.includes(' ') ? all : `${pre}${inp.replace(/\*/g, '9')}"`));
  return head + xml.slice(end);
}

/** The leaves of the program body, in the order of the XML (the order the engine runs a sequence). */
export function leaves(xml: string): Array<{ start: number; end: number; text: string; tag: string }> {
  const body = xml.slice(0, xml.indexOf('</sequence>'));
  return [...body.matchAll(/<(one|all|prl|convolution|path|map)\b([^>]*?)(\/>|>([\s\S]*?)<\/\1>)/g)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, text: m[0], tag: m[1] }));
}

function padRule(inp: string, out: string, h: number): [string, string] | undefined {
  if (inp.includes(' ') || out.includes(' ')) return undefined;
  const rows = inp.split('/');
  const dx = cellsOf(rows[0]).length, dy = rows.length;
  const H = Math.min(h, Math.floor(1728 / (dx * dy)));
  if (H < 2) return undefined;
  const layer = rows.map(() => '*'.repeat(dx)).join('/');
  const top = Array(H - 1).fill(layer).join(' ');
  return [`${top} ${inp}`, `${top} ${out}`];
}

/** 3. Pads the leaves at the given indices (in `leaves` order); those in `oneStep` also get `steps="1"`. */
export function imbottisci(xml: string, pad: Set<number>, oneStep: Set<number>, h = 80): string {
  const ls = leaves(xml);
  const end = planEnd(xml);
  let out = '', last = 0;
  ls.forEach((l, i) => {
    if (!pad.has(i) || l.start >= end || !['one', 'all', 'prl'].includes(l.tag)) return;
    let ok = true;
    let text = l.text.replace(/(<(?:one|all|prl|rule)\b[^>]*?)\bin="([^"]*)"([^>]*?)\bout="([^"]*)"/g, (all, a: string, inp: string, b: string, o: string) => {
      const r = padRule(inp, o, h);
      if (!r) {
        ok = false;
        return all;
      }
      return `${a}in="${r[0]}"${b}out="${r[1]}"`;
    });
    if (!ok) return;
    if (oneStep.has(i)) {
      const open = text.slice(0, text.indexOf('>'));
      text = /\bsteps="\d+"/.test(open) ? text.replace(/\bsteps="\d+"/, 'steps="1"') : text.replace(`<${l.tag}`, `<${l.tag} steps="1"`);
    }
    out += xml.slice(last, l.start) + text;
    last = l.end;
  });
  return out + xml.slice(last);
}

/** The plan leaves (before the columns): their indices in `leaves` order. */
export function planLeaves(xml: string): number[] {
  const end = planEnd(xml);
  return leaves(xml).flatMap((l, i) => (l.start < end ? [i] : []));
}
