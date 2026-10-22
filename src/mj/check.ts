// Judging voxel models, like src/kernel/validator.ts does for the game: the model a program builds is
// measured, and what makes it unusable (empty, floating, in pieces, too low) goes back to the sculptor.

import { AIR, type Grid3, type PaletteEntry, type RunResult, type Vec3 } from './engine';

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
