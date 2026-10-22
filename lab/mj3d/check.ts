// Mending and judging voxel programs, like src/kernel/validator.ts does for the game: models do not
// count characters, so small shape mistakes are mended; then the model the program builds is measured
// and what makes it unusable goes back to the sculptor with the reason.

import { AIR, MAX_CELLS, MAX_SIDE, PARTS, SHAPES, type Grid3, type Node3, type PaletteEntry, type Program3, type RunResult, type Vec3 } from './engine';

const cellsOf = (row: string) => row.match(/\[[^\]]*\]|./g) ?? [];

/** Pads rows and layers with '*' so that in and out have the same box; cuts what sticks out. */
function mendRule(r: any, notes: string[]): { in: string; out: string; p?: number } | null {
  if (typeof r?.in !== 'string' || typeof r?.out !== 'string') return null;
  const parse = (s: string) => s.trim().split(/\s+/).map((l) => l.split('/').map(cellsOf));
  const li = parse(r.in);
  const lo = parse(r.out);
  const dz = li.length;
  const dy = Math.max(...li.map((l) => l.length));
  const dx = Math.max(...li.flatMap((l) => l.map((row) => row.length)));
  if (!dx || dx * dy * dz > 216) return notes.push(`regola troppo grande rimossa: ${r.in.slice(0, 30)}`), null;
  const fit = (ls: string[][][], output: boolean) =>
    Array.from({ length: dz }, (_, k) =>
      Array.from({ length: dy }, (_, j) =>
        Array.from({ length: dx }, (_, i) => {
          const c = ls[k]?.[j]?.[i] ?? '*';
          return output && c.startsWith('[') ? '*' : c;
        }).join(''),
      ).join('/'),
    ).join(' ');
  const fin = fit(li, false);
  const fout = fit(lo, true);
  if (fin !== r.in.trim() || fout !== r.out.trim()) notes.push(`regola riparata: "${r.in}" → "${r.out}" diventa "${fin}" → "${fout}"`);
  return { in: fin, out: fout, ...(typeof r.p === 'number' ? { p: r.p } : {}) };
}

const vec = (v: unknown): Vec3 | null =>
  Array.isArray(v) && v.length >= 3 && v.slice(0, 3).every((n) => typeof n === 'number' && Number.isFinite(n)) ? (v.slice(0, 3) as Vec3) : null;

export function mendNode(node: unknown, notes: string[], depth = 0): Node3 | null {
  const n = node as any;
  if (!n || typeof n !== 'object' || depth > 16) return null;
  if (Array.isArray(n)) return mendNode({ type: 'sequence', children: n }, notes, depth);
  const type = typeof n.type === 'string' ? n.type.toLowerCase() : n.type;
  if (type === 'sequence' || type === 'markov') {
    const children = (Array.isArray(n.children) ? n.children : Array.isArray(n.nodes) ? n.nodes : []).map((c: unknown) => mendNode(c, notes, depth + 1)).filter(Boolean);
    return children.length ? { type, children } : null;
  }
  if (type === 'one' || type === 'all' || type === 'prl') {
    const rules = (Array.isArray(n.rules) ? n.rules : n.in ? [n] : []).map((r: unknown) => mendRule(r, notes)).filter(Boolean);
    if (!rules.length) return notes.push(`nodo ${type} senza regole valide rimosso`), null;
    const symmetry = ['xy', 'none', 'x', 'all'].includes(n.symmetry) ? n.symmetry : undefined;
    return { type, rules, ...(Number.isInteger(n.steps) && n.steps > 0 ? { steps: n.steps } : {}), ...(symmetry ? { symmetry } : {}), ...(n.optional === true ? { optional: true } : {}) };
  }
  if (type === 'conv' || type === 'convolution') {
    const rules = (Array.isArray(n.rules) ? n.rules : [])
      .filter((r: any) => typeof r?.in === 'string' && typeof r?.out === 'string' && r.out.length === 1 && typeof r?.neighbors === 'string')
      .map((r: any) => ({ in: r.in, out: r.out, neighbors: r.neighbors, ...(Number.isFinite(r.min) ? { min: r.min } : {}), ...(Number.isFinite(r.max) ? { max: r.max } : {}), ...(typeof r.p === 'number' ? { p: r.p } : {}) }));
    if (!rules.length) return notes.push('conv senza regole valide rimosso'), null;
    return { type: 'conv', rules, ...(n.neighborhood === 'vonneumann' ? { neighborhood: 'vonneumann' as const } : {}), ...(Number.isInteger(n.steps) ? { steps: n.steps } : {}) };
  }
  if (type === 'path') {
    const ok = ['from', 'to', 'on', 'color'].every((k) => typeof n[k] === 'string' && n[k]) && n.color.length === 1;
    return ok
      ? { type: 'path', from: n.from, to: n.to, on: n.on, color: n.color, ...(Number.isInteger(n.steps) ? { steps: n.steps } : {}), ...(n.inertia === true ? { inertia: true } : {}), ...(n.longest === true ? { longest: true } : {}) }
      : (notes.push('path incompleto rimosso'), null);
  }
  if (type === 'map') {
    const scale = vec(n.scale) ?? (Number.isInteger(n.scale) ? ([n.scale, n.scale, n.scale] as Vec3) : null);
    if (!scale || scale.some((v) => !Number.isInteger(v) || v < 1 || v > 32)) return notes.push('map senza "scale" valida rimosso'), null;
    const rules = (Array.isArray(n.rules) ? n.rules : []).filter((r: any) => typeof r?.in === 'string' && typeof r?.out === 'string').map((r: any) => ({ in: r.in.trim(), out: r.out.trim() }));
    const symmetry = ['xy', 'none', 'x', 'all'].includes(n.symmetry) ? n.symmetry : undefined;
    return { type: 'map', scale, ...(rules.length ? { rules } : {}), ...(symmetry ? { symmetry } : {}) };
  }
  if (type === 'shape') {
    const shape = SHAPES.includes(n.shape) ? n.shape : n.shape === 'sphere' ? 'ellipsoid' : n.shape === 'cube' ? 'box' : null;
    const at = vec(n.at);
    const color = typeof n.color === 'string' && n.color.length === 1 ? n.color : null;
    if (!shape || !at || !color) return notes.push(`shape non valida rimossa (${n.shape ?? '?'})`), null;
    if (shape === 'line') {
      const to = vec(n.to);
      if (!to) return notes.push('line senza "to" rimossa'), null;
      return { type: 'shape', shape, at, to, color, ...(typeof n.r === 'number' ? { r: n.r } : {}), ...(typeof n.on === 'string' ? { on: n.on } : {}) };
    }
    const size = vec(n.size) ?? (typeof n.size === 'number' ? ([n.size, n.size, n.size] as Vec3) : null);
    if (!size) return notes.push(`shape ${shape} senza "size" rimossa`), null;
    return { type: 'shape', shape, at, size, color, ...(typeof n.on === 'string' ? { on: n.on } : {}) };
  }
  notes.push(`nodo sconosciuto "${n.type}" rimosso`);
  return null;
}

/** Union symbols: one character each, standing for codes; a symbol that is also a palette code is dropped. */
export function mendUnions(raw: unknown, notes: string[], palette: Record<string, unknown> = {}): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const codes = Array.isArray(v) ? v.join('') : typeof v === 'string' ? v : '';
    if (k.length !== 1 || '.*/ []'.includes(k) || !codes || palette[k]) {
      notes.push(`unione "${k}" ignorata`);
      continue;
    }
    out[k] = codes;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Turns whatever the model answered into a program, or says why it cannot. */
export function mendProgram(raw: unknown, notes: string[] = []): Program3 | null {
  const r = raw as any;
  if (!r || typeof r !== 'object') return null;
  const size = vec(r.size)?.map((v) => Math.max(4, Math.min(MAX_SIDE, Math.round(v)))) as Vec3 | undefined;
  if (!size) return notes.push('manca "size": [x, y, z]'), null;
  while (size[0] * size[1] * size[2] > MAX_CELLS) size[2]--;
  const palette: Record<string, PaletteEntry> = {};
  for (const [k, v] of Object.entries(r.palette ?? {})) {
    if (k.length !== 1 || k === AIR || k === '*' || k === '/' || k === ' ' || k === '[' || k === ']') {
      notes.push(`codice di palette non valido "${k}" ignorato`);
      continue;
    }
    const e = (typeof v === 'string' ? { color: v } : v) as PaletteEntry;
    palette[k] = { ...(e?.name ? { name: String(e.name) } : {}), ...(typeof e?.color === 'string' ? { color: e.color } : {}), ...(e?.hidden ? { hidden: true } : {}), ...((PARTS as readonly string[]).includes(e?.part as string) ? { part: e.part } : {}) };
  }
  const program = mendNode(r.program ?? r.root, notes);
  if (!program) return notes.push('nessun nodo valido nel programma'), null;
  const unions = mendUnions(r.unions, notes, palette);
  return {
    ...(unions ? { unions } : {}),
    ...(typeof r.name === 'string' ? { name: r.name } : {}),
    size,
    palette,
    ...(typeof r.origin === 'string' && r.origin.length === 1 ? { origin: r.origin } : {}),
    ...(typeof r.ground === 'string' && r.ground.length === 1 ? { ground: r.ground } : {}),
    program,
  };
}

export interface Analysis {
  voxels: number;
  /** Solid voxels over the volume of their bounding box. */
  density: number;
  /** Solid voxels over the whole grid. */
  fill: number;
  bbox: { min: Vec3; max: Vec3 } | null;
  grounded: boolean;
  /** Share of voxels in the largest 26-connected piece. */
  mainPart: number;
  parts: number;
  colors: Record<string, number>;
  steps: number;
  finished: boolean;
  ms: number;
  /** Reasons to send the program back. */
  errors: string[];
  /** Worth knowing, not worth a retry. */
  warnings: string[];
}

const visibleCodes = (g: Grid3, palette: Record<string, PaletteEntry>) => g.alphabet.map((c) => c !== AIR && !!palette[c]?.color && !palette[c]?.hidden);

export function analyse(r: RunResult, palette: Record<string, PaletteEntry>, opts: { grounded?: boolean; minHeight?: number } = {}): Analysis {
  const g = r.grid;
  const vis = visibleCodes(g, palette);
  const XY = g.X * g.Y;
  const solid = new Uint8Array(g.cells.length);
  const colors: Record<string, number> = {};
  let voxels = 0;
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-1, -1, -1];
  let ground = 0;
  for (let i = 0; i < g.cells.length; i++) {
    if (!vis[g.cells[i]]) continue;
    solid[i] = 1;
    voxels++;
    const ch = g.alphabet[g.cells[i]];
    colors[ch] = (colors[ch] ?? 0) + 1;
    const p: Vec3 = [i % g.X, Math.floor(i / g.X) % g.Y, Math.floor(i / XY)];
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], p[a]);
      max[a] = Math.max(max[a], p[a]);
    }
    if (p[2] === 0) ground++;
  }
  // Connected pieces (26-neighbourhood).
  const seen = new Uint8Array(g.cells.length);
  let parts = 0;
  let biggest = 0;
  let biggestGrounded = false;
  for (let i = 0; i < g.cells.length; i++) {
    if (!solid[i] || seen[i]) continue;
    parts++;
    let size = 0;
    let grounded = false;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const c = stack.pop()!;
      size++;
      const x = c % g.X, y = Math.floor(c / g.X) % g.Y, z = Math.floor(c / XY);
      if (z === 0) grounded = true;
      for (let dz = -1; dz <= 1; dz++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy, nz = z + dz;
            if (nx < 0 || ny < 0 || nz < 0 || nx >= g.X || ny >= g.Y || nz >= g.Z) continue;
            const n = nx + ny * g.X + nz * XY;
            if (solid[n] && !seen[n]) {
              seen[n] = 1;
              stack.push(n);
            }
          }
    }
    if (size > biggest) {
      biggest = size;
      biggestGrounded = grounded;
    }
  }
  const bbox = voxels ? { min, max } : null;
  const boxVolume = bbox ? (max[0] - min[0] + 1) * (max[1] - min[1] + 1) * (max[2] - min[2] + 1) : 1;
  const a: Analysis = {
    voxels,
    density: voxels / boxVolume,
    fill: voxels / g.cells.length,
    bbox,
    grounded: ground > 0,
    mainPart: voxels ? biggest / voxels : 0,
    parts,
    colors,
    steps: r.steps,
    finished: r.finished,
    ms: r.ms,
    errors: [],
    warnings: [],
  };
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  if (!voxels) a.errors.push('il modello è vuoto: nessun voxel visibile (i codici senza colore nella palette sono invisibili)');
  else {
    if (opts.grounded !== false && !a.grounded) a.errors.push(`non tocca terra: il voxel più basso è a z=${min[2]}, deve appoggiarsi a z=0`);
    else if (opts.grounded !== false && !biggestGrounded) a.errors.push('il corpo principale galleggia: la parte più grande non tocca z=0 (ciò che la regge è staccato)');
    if (a.mainPart < 0.92) a.errors.push(`pezzi staccati: ${pct(1 - a.mainPart)} dei voxel non è attaccato al corpo principale (${parts} pezzi)`);
    else if (parts > 1) a.warnings.push(`${parts - 1} frammenti staccati (${pct(1 - a.mainPart)} dei voxel)`);
    if (a.fill > 0.8) a.errors.push(`riempie ${pct(a.fill)} della griglia: sembra un blocco, non una forma`);
    if (voxels < 12) a.errors.push(`troppo piccolo: solo ${voxels} voxel`);
    if (opts.minHeight && bbox && max[2] + 1 < opts.minHeight) a.errors.push(`troppo basso: alto ${max[2] + 1} voxel, la sua classe chiede almeno ${opts.minHeight} (le cose simili hanno le stesse proporzioni)`);
    if (Object.keys(colors).length < 2) a.warnings.push('un solo colore: poca leggibilità, usa toni chiari e scuri');
    if (bbox && (min[0] === 0 || min[1] === 0 || max[0] === g.X - 1 || max[1] === g.Y - 1)) a.warnings.push('tocca i bordi laterali della griglia: forse è tagliato');
    if (bbox && max[2] === g.Z - 1) a.warnings.push('tocca il soffitto della griglia: forse è tagliato in alto');
  }
  if (!r.finished) a.errors.push(`non termina: dopo ${r.steps} passi riscrive ancora (metti "steps" ai nodi che crescono)`);
  const unused = Object.keys(palette).filter((k) => !palette[k].hidden && palette[k].color && !colors[k]);
  if (unused.length) a.warnings.push(`colori mai usati: ${unused.join(' ')}`);
  return a;
}
