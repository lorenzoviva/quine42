// The JSON programs of steps 8A-8E (lab/mj3d) written as MarkovJunior XML (lab/mjx/model.ts), so the
// models of those sessions keep working: same nodes, same seeds, the same voxels.
// What changes in writing: the air '.' becomes the first letter of `values`; layers are written top
// first; prl, conv and path, which ran once by default, get steps="1"; a map that copied every cell
// gets one rule per letter that does the copying; colours go into <color> elements.

import type { Node3, Program3, Rule3, Sym } from '../mj3d/engine';
import { MJ_LETTERS } from './palette';
import { writeXml, type XmlElement } from './xml';

const SYM: Record<Sym, string> = { xy: '(xy)', none: '()', x: '(x)', y: '(y)', z: '(z)', rot: '(xyz+)', all: '(xyz)' };

const el = (name: string, attrs: Record<string, string | number | undefined>, children: XmlElement[] = []): XmlElement => ({
  name,
  attrs: Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])),
  children,
  line: 0,
});

/** The same program with one letter called another. */
function rename(p: Program3, from: string, to: string): Program3 {
  const r = (s: string) => s.split(from).join(to);
  const node = (n: Node3): Node3 => {
    switch (n.type) {
      case 'one':
      case 'all':
      case 'prl':
        return { ...n, rules: n.rules.map((x) => ({ ...x, in: r(x.in), out: r(x.out) })) };
      case 'map':
        return { ...n, rules: n.rules?.map((x) => ({ ...x, in: r(x.in), out: r(x.out) })) };
      case 'conv':
        return { ...n, rules: n.rules.map((x) => ({ ...x, in: r(x.in), out: r(x.out), neighbors: r(x.neighbors) })) };
      case 'path':
        return { ...n, from: r(n.from), to: r(n.to), on: r(n.on), color: r(n.color) };
      case 'shape':
        return { ...n, color: r(n.color), ...(n.on !== undefined ? { on: r(n.on) } : {}) };
      default:
        return { ...n, children: n.children.map(node) };
    }
  };
  return {
    ...p,
    palette: Object.fromEntries(Object.entries(p.palette).map(([k, v]) => [r(k), v])),
    ...(p.unions ? { unions: Object.fromEntries(Object.entries(p.unions).map(([k, v]) => [r(k), r(v)])) } : {}),
    ...(p.origin ? { origin: r(p.origin) } : {}),
    ...(p.ground ? { ground: r(p.ground) } : {}),
    program: node(p.program),
  };
}

/** Every letter a node writes or reads. */
function lettersOf(node: Node3, out: Set<string>): void {
  const add = (s: string | undefined) => {
    for (const ch of s ?? '') if (!'*/ [].'.includes(ch)) out.add(ch);
  };
  switch (node.type) {
    case 'one':
    case 'all':
    case 'prl':
      for (const r of node.rules) (add(r.in), add(r.out));
      break;
    case 'map':
      for (const r of node.rules ?? []) (add(r.in), add(r.out));
      break;
    case 'conv':
      for (const r of node.rules) (add(r.in), add(r.out), add(r.neighbors));
      break;
    case 'path':
      [node.from, node.to, node.on, node.color].forEach(add);
      break;
    case 'shape':
      (add(node.color), add(node.on));
      break;
    default:
      for (const c of node.children) lettersOf(c, out);
  }
}

export function toMjx(source: Program3): string {
  const used = new Set<string>(Object.keys(source.palette));
  lettersOf(source.program, used);
  for (const ch of [source.origin, source.ground]) if (ch) used.add(ch);
  for (const k of Object.keys(source.unions ?? {})) used.add(k);
  // B is the empty cell, as in most MarkovJunior models: a program that used B for something else
  // gets another letter for it.
  const bg = 'B';
  const spare = [...MJ_LETTERS].find((ch) => ch !== bg && !used.has(ch))!;
  const p = used.has(bg) ? rename(source, bg, spare) : source;
  const unions = p.unions ?? {};
  const letters = [...used].map((ch) => (ch === bg ? spare : ch)).filter((ch) => !(ch in unions));
  const tr = (s: string) => s.replace(/\./g, bg);
  const pat = (s: string) => tr(s.trim().split(/\s+/).reverse().join(' '));

  const rulesOf = (rules: Rule3[], node: Record<string, string | number | undefined>, name: string, extra: XmlElement[] = []) => {
    if (rules.length === 1 && !rules[0].symmetry && !extra.length) return el(name, { ...node, in: pat(rules[0].in), out: pat(rules[0].out), p: rules[0].p });
    return el(name, node, [...extra, ...rules.map((r) => el('rule', { in: pat(r.in), out: pat(r.out), p: r.p, symmetry: r.symmetry ? SYM[r.symmetry] : undefined }))]);
  };
  const sym = (s: Sym | undefined) => (s && s !== 'xy' ? SYM[s] : undefined);

  const write = (n: Node3): XmlElement => {
    switch (n.type) {
      case 'one':
      case 'all':
      case 'prl': {
        const steps = n.steps ?? (n.type === 'prl' ? 1 : undefined);
        return rulesOf(n.rules, { steps: Number.isFinite(steps) ? steps : undefined, symmetry: sym(n.symmetry), optional: n.optional ? 'True' : undefined }, n.type);
      }
      case 'sequence':
      case 'markov':
        return el(n.type, {}, n.children.map(write));
      case 'conv':
        return el(
          'convolution',
          { neighborhood: n.neighborhood === 'vonneumann' ? 'VonNeumann' : n.neighborhood === 'nocorners' ? 'NoCorners' : 'Moore', steps: n.steps === Infinity ? undefined : Math.max(1, Math.min(30, n.steps ?? 1)), periodic: n.periodic ? 'True' : undefined },
          n.rules.map((r) => el('rule', { in: tr(r.in), out: tr(r.out), values: tr(r.neighbors), sum: r.sums ? r.sums.join(',') : `${r.min ?? 1}..${r.max ?? 26}`, p: r.p })),
        );
      case 'path':
        return el('path', { from: tr(n.from), to: tr(n.to), on: tr(n.on), color: tr(n.color), steps: Number.isFinite(n.steps ?? 1) ? (n.steps ?? 1) : undefined, inertia: n.inertia ? 'True' : undefined, longest: n.longest ? 'True' : undefined });
      case 'map': {
        const [sx, sy, sz] = n.scale;
        const block = (ch: string) => Array.from({ length: sz }, () => Array.from({ length: sy }, () => ch.repeat(sx)).join('/')).join(' ');
        // The old map copied every cell into its block; MarkovJunior's starts empty, so a rule per letter copies.
        const copy = n.clear ? [] : [bg, ...letters].map((ch) => el('rule', { in: ch, out: block(ch) }));
        return el('map', { scale: `${sx} ${sy} ${sz}`, values: bg + letters.join(''), symmetry: sym(n.symmetry) }, [...copy, ...(n.rules ?? []).map((r) => el('rule', { in: pat(r.in), out: pat(r.out), p: r.p }))]);
      }
      case 'shape':
        return el(n.shape, { at: n.at.join(' '), ...(n.shape === 'line' ? { to: n.to!.join(' '), r: n.r } : { size: n.size!.join(' ') }), color: tr(n.color), on: n.on !== undefined ? tr(n.on) : undefined });
    }
  };

  const body = p.program.type === 'sequence' ? p.program.children.map(write) : [write(p.program)];
  const colors = letters.map((ch) => {
    const e = p.palette[ch];
    return e?.color && !e.hidden ? el('color', { symbol: ch, value: e.color.replace('#', ''), name: e.name, part: e.part }) : el('color', { symbol: ch, hidden: 'True', name: e?.name });
  });
  const unionEls = Object.entries(unions).map(([k, v]) => el('union', { symbol: k, values: tr(v) }));
  const root = el(
    'sequence',
    {
      values: bg + letters.join(''),
      size: p.size.join(' '),
      symmetry: '(xy)',
      // origin is the second value, so the origin's letter goes second.
      origin: p.origin ? 'bottom' : undefined,
      ground: p.ground,
      name: p.name,
    },
    [...colors, ...unionEls, ...body],
  );
  if (p.origin) root.attrs.values = bg + p.origin + letters.filter((ch) => ch !== p.origin).join('');
  return writeXml(root);
}
