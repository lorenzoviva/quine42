// The Scenografo measured for real (T303): the three ways of furnishing a building written by today's Sculptor, on the same bench.
//
//   (a) `insieme`: the interior asked to the Sculptor in the same program (`scultore-gemini.ts --interno`); here only measured: the
//       furniture is what the palette names «arredo…».
//   (b) `programma`: a MarkovJunior program of a second stage that the Scenografo writes once for the building's type. The kernel runs
//       it on a stage of classes, not on the building's letters (`palco`): `W` any part of the building, `F` free floor, `C` free floor
//       under the ground, `P` protected (the door and the way in, the stairs and their landings, what belongs to no room), `A` free floor
//       where the animals stand. What the program writes on air or on those classes becomes furniture; the building is never touched;
//       every piece passes the kernel's guard (`Guardia`).
//   (c) `dati`: rules that choose models of furniture that already exist for each kind of room (`Regola`), placed by the kernel
//       (`arredaDati` with a `Scelta`), never on the animals' place.
//
// (b) and (c) receive what the kernel measures of the built building (`descrivi`): storeys, rooms, door, the habitable parts
// (`habitableParts`), the areas (`areasOf`) and the place of the animals (the tiles of an area that names them).

import { habitableParts } from '../../../src/kernel/forms';
import { WORLD_NODE_LIMITS, worldNodeErrors } from '../../../src/kernel/validator';
import { areasOf, type AreaMap } from '../../../src/mj/areas';
import { partErrors } from '../../../src/mj/check';
import { partVoxels, STRUCTURE_VPT } from '../../../src/mj/classes';
import { Mj3Error, runOn, type Grid3, type PaletteEntry } from '../../../src/mj/engine';
import { compileMjx } from '../../../src/mj/model';
import { FORM_LIMITS } from '../../../src/mj/run';
import { symbolName } from '../../../src/mj/symbols';
import { giudica, misura } from '../misure';
import { copy, Guardia, gruppi, piante, stanze, withGrid, arredaDati, type Arredato, type Mobile, type Scelta, type Scena } from './scenografo';

/**
 * The density whose voxels the parts one lives in are measured against (T406): PARTS are the voxels of before read at STRUCTURE_VPT
 * (T405, ADR-0209: a room 28, a storey 30, a door 11 × 30), so a building read at the bench's 20 (T303) and at the game's 16 is held to
 * the same voxels, those its Sculptor was asked for.
 */
const PARTI = STRUCTURE_VPT;

/** The areas where animals stand (T346 takes them out of the program: the program marks where they go). */
export const ANIMALI = /pasture|paddock|pen|fold|barn|stable|stall|byre|coop|sty|corral|meadow|pascol|stall|recint|ovil|porcil|pollai/i;

/** The furniture of the world the choice (c) may take: the seed's furniture one finds inside a house (not a fire, a sign, the corona's). */
export const MOBILI = ['barile', 'banco', 'credenza', 'letto', 'furniture', 'fantasy-libreria-alchemica', 'fantasy-calderone-bollente', 'fantasy-bancarella-mercato', 'fantasy-trono-di-pietra', 'fantasy-altare-runico'];

/** The classes of the stage (b): the letters the Scenografo's program reads. */
export const CLASSI = { muro: 'W', libero: 'F', cantina: 'C', protetto: 'P', animali: 'A' } as const;
const STAGE = ['.', CLASSI.muro, CLASSI.libero, CLASSI.cantina, CLASSI.protetto, CLASSI.animali];

/** The tiles where animals stand, as a set of `tx + ty·tiles`, and the names of their areas. */
export function animali(s: Scena): { aree: string[]; caselle: Set<string> } {
  const areas = areeDi(s);
  const aree = Object.keys(areas).filter((a) => ANIMALI.test(a));
  return { aree, caselle: new Set(aree.flatMap((a) => areas[a].map(([x, y]) => `${x},${y}`))) };
}

export const areeDi = (s: Scena): AreaMap => areasOf(s.e.result.grid, s.e.model.program.palette, s.e.scatola.vpt, s.e.scatola.base);

/** Whether a feet cell `x + y·X` stands on a tile of the animals. */
function suAnimali(s: Scena, caselle: Set<string>): (i: number) => boolean {
  const { X } = s.e.grid;
  const vpt = s.e.scatola.vpt;
  return (i) => caselle.has(`${Math.floor((i % X) / vpt)},${Math.floor(Math.floor(i / X) / vpt)}`);
}

// ---------------------------------------------------------------- what the Scenografo receives

const n1 = (v: number) => v.toFixed(1);

/** A room of a seed as the request says it: storey, kind, size, area, ceiling, where. */
export interface StanzaDetta {
  id: string;
  piano: number;
  z: number;
  tipo: 'sala' | 'stanza' | 'piccola';
  caselle: number;
  area?: string;
  soffitto: number;
  /** The bounding box of its body centres, in tiles (x0, y0, x1, y1). */
  dove: [number, number, number, number];
}

/** The rooms of a seed, as `arredaDati` finds and types them (the largest of a storey is its hall). */
export function stanzeDi(s: Scena): StanzaDetta[] {
  const g = s.e.grid;
  const { vpt } = s.e.scatola;
  const areas = areeDi(s);
  const tileArea = new Map<string, string>();
  for (const [a, ts] of Object.entries(areas)) for (const [x, y] of ts) tileArea.set(`${x},${y}`, a);
  const out: StanzaDetta[] = [];
  const ps = piante(s).filter((p) => !p.cantina);
  ps.forEach((p, piano) => {
    const rooms = stanze(p, g.X, g.Y, Math.round(0.4 * vpt)).sort((a, b) => b.length - a.length);
    rooms.forEach((room, n) => {
      const caselle = room.length / (vpt * vpt);
      const tipo = n === 0 ? 'sala' : caselle >= 1.5 ? 'stanza' : 'piccola';
      const count = new Map<string, number>();
      let x0 = g.X, y0 = g.Y, x1 = 0, y1 = 0;
      const heads: number[] = [];
      for (const i of room) {
        const x = i % g.X, y = Math.floor(i / g.X);
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        const a = tileArea.get(`${Math.floor(x / vpt)},${Math.floor(y / vpt)}`);
        if (a) count.set(a, (count.get(a) ?? 0) + 1);
        let z = p.z;
        while (z < g.Z && g.cells[i + z * g.X * g.Y] === 0) z++;
        heads.push(z >= g.Z ? Infinity : z - p.z);
      }
      heads.sort((a, b) => a - b);
      const area = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const ceiling = heads[Math.floor(heads.length / 2)];
      out.push({ id: `${piano}.${n + 1}`, piano, z: p.z, tipo, caselle, ...(area ? { area } : {}), soffitto: ceiling === Infinity ? -1 : ceiling, dove: [x0 / vpt, y0 / vpt, (x1 + 1) / vpt, (y1 + 1) / vpt].map((v) => Math.round(v * 10) / 10) as [number, number, number, number] });
    });
  });
  return out;
}

/** What the kernel tells the Scenografo of a building: the same for (b) and (c), seed by seed. */
export function descrivi(nome: string, scene: Scena[]): string {
  const s0 = scene[0];
  const { vpt, box, persona, corpo, gradino } = s0.e.scatola;
  const lines = [
    `Building: ${nome} (a structure of size Large: ${box[0] / vpt} × ${box[1] / vpt} tiles, box ${box.join(' × ')} voxels, ${vpt} voxels a tile; x left to right, y from the back to the front where the door is, z up).`,
    `A body needs a passage ${corpo} voxels wide, a person is ${persona} tall, a step is ${gradino}. The program of the building is one for every seed: what follows changes from seed to seed, and your work must serve all of them.`,
  ];
  for (const s of scene) {
    const g = s.e.grid;
    const parts = habitableParts(s.e.result.grid, s.e.model.program.palette, vpt, partVoxels(PARTI).storey.clear, s.e.scatola.base, s.e.model.actions, s.seme);
    const areas = areeDi(s);
    const an = animali(s);
    lines.push('', `Seed ${s.seme}:`);
    lines.push(`- storeys one reaches on foot (z of the floor, covered tiles²): ${s.m.piani.map((p) => `z=${p.z} (${n1(p.area)})`).join(', ') || 'none'}${s.m.cantina ? `; a cellar of ${n1(s.m.cantina)} tiles²` : ''}`);
    if (s.m.porta) lines.push(`- the door: x=${s.m.porta.x}, y=${s.m.porta.y} (tile ${Math.floor(s.m.porta.x / vpt)}, ${Math.floor(s.m.porta.y / vpt)}), ${s.m.porta.libera ? 'open' : 'shut'}`);
    lines.push(`- habitable parts (kernel): ${parts.storeys.length} storeys reached; rooms ${parts.rooms.map((r) => `z=${r.z} side ${r.room} ceiling ${r.clear}`).join(', ')}; doors ${parts.doors.map((d) => `${d.width} × ${d.height}`).join(', ') || 'none'}`);
    lines.push('- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):');
    for (const r of stanzeDi(s)) lines.push(`  ${r.id}: storey ${r.piano} (z=${r.z}), ${r.tipo === 'sala' ? 'hall' : r.tipo === 'stanza' ? 'room' : 'small room'}, ${n1(r.caselle)} tiles², ceiling ${r.soffitto < 0 ? 'open sky' : r.soffitto}, area ${r.area ?? '—'}, ${r.dove.join(',')}`);
    lines.push(`- areas of the ground (tiles of ${vpt} × ${vpt}): ${Object.entries(areas).map(([a, ts]) => `${a} ${ts.length} (${ts.map(([x, y]) => `${x},${y}`).join(' ')})`).join('; ') || 'none'}`);
    lines.push(`- the animals stand on: ${an.aree.length ? `${an.aree.join(', ')}, ${an.caselle.size} tiles: keep their floor free` : 'no area of animals'}`);
    void g;
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------- (b) the program on the stage

/** The stage of a seed (b): the building as `W`, the feet layer of every storey as the classes; the cells of a grid of the building's size. */
export function palco(s: Scena): Grid3 {
  const g = s.e.grid;
  const XY = g.X * g.Y;
  const cells = new Uint8Array(g.cells.length);
  for (let i = 0; i < cells.length; i++) cells[i] = g.cells[i] ? 1 : 0;
  const an = suAnimali(s, animali(s).caselle);
  const ground = piante(s).find((p) => !p.cantina);
  for (const p of piante(s))
    for (let i = 0; i < XY; i++) {
      const at = i + p.z * XY;
      if (cells[at]) continue;
      if (p.protetto[i]) cells[at] = 4;
      else if (p.libero[i]) cells[at] = p.cantina ? 3 : p === ground && an(i) ? 5 : 2;
    }
  return { X: g.X, Y: g.Y, Z: g.Z, cells, alphabet: [...STAGE], log: [], epoch: 0 } as Grid3;
}

/** A program of the Scenografo compiled for a building of this box; the reason if it is not one the world would take. */
export function compilaArredo(xml: string, box: [number, number, number]): ReturnType<typeof compileMjx> {
  const m = compileMjx(xml, { size: box });
  const nodes = worldNodeErrors(m, xml);
  if (nodes.length) throw new Mj3Error(nodes.join('; '));
  return m;
}

/** Runs the Scenografo's program on the stage of a seed and puts what it wrote into the building, piece by piece through the guard. */
export function arredaConProgramma(s: Scena, model: ReturnType<typeof compileMjx>, semeArredo: number): Arredato & { finito: boolean; scartati: number } {
  const t0 = performance.now();
  const stage = palco(s);
  const before = new Uint8Array(stage.cells);
  const r = runOn(stage, model.program, semeArredo, 200_000, FORM_LIMITS, { deadline: 8_000, ceilings: WORLD_NODE_LIMITS });
  const g = copy(s.e.grid);
  const XY = g.X * g.Y;
  const colori: Record<string, PaletteEntry> = {};
  const code = new Map<number, number>();
  let next = 0xe100;
  const voxel = new Set<number>();
  for (let i = 0; i < stage.cells.length; i++) {
    const c = stage.cells[i];
    const ch = stage.alphabet[c];
    // Furniture: a letter of the program written where the building had air (the building is never touched).
    if (c === before[i] || STAGE.includes(ch) || g.cells[i] !== 0) continue;
    const entry = model.program.palette[ch];
    if (!entry || entry.hidden) continue;
    if (!code.has(c)) {
      const sym = String.fromCharCode(next++);
      colori[sym] = entry;
      code.set(c, g.alphabet.push(sym) - 1);
    }
    g.cells[i] = code.get(c)!;
    voxel.add(i);
  }
  const guardia = new Guardia(s);
  let pezzi = 0, scartati = 0;
  for (const group of gruppi(voxel, g.X, XY)) {
    if (guardia.ammetti(group)) {
      pezzi++;
      continue;
    }
    scartati++;
    for (const v of group) {
      g.cells[v] = 0;
      voxel.delete(v);
    }
  }
  const e = withGrid(s.e, g, colori);
  const ms = performance.now() - t0;
  return { e, m: misura(e, s.b), ms, voxel, pezzi, finito: r.finished, scartati };
}

// ---------------------------------------------------------------- (c) the choice as data

/** A rule of the Scenografo's choice: which rooms (any field left out matches all) get which models, how many. */
export interface Regola {
  storey?: number;
  area?: string;
  room?: 'hall' | 'room' | 'small';
  furniture: string[];
  count: number;
}

const TIPO = { sala: 'hall', stanza: 'room', piccola: 'small' } as const;

/** The rules as the kernel's choice: the first rule that matches a room decides; the animals' floor stays free. */
export function sceltaDi(s: Scena, regole: Regola[]): Scelta {
  const g = s.e.grid;
  const { vpt } = s.e.scatola;
  const areas = areeDi(s);
  const tileArea = new Map<string, string>();
  for (const [a, ts] of Object.entries(areas)) for (const [x, y] of ts) tileArea.set(`${x},${y}`, a);
  const an = suAnimali(s, animali(s).caselle);
  const ground = piante(s).find((p) => !p.cantina)?.z;
  return {
    per(r) {
      const count = new Map<string, number>();
      for (const i of r.celle) {
        const a = tileArea.get(`${Math.floor((i % g.X) / vpt)},${Math.floor(Math.floor(i / g.X) / vpt)}`);
        if (a) count.set(a, (count.get(a) ?? 0) + 1);
      }
      const area = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const rule = regole.find((x) => (x.storey === undefined || x.storey === r.piano) && (!x.area || x.area === area) && (!x.room || x.room === TIPO[r.tipo]));
      return rule && rule.count > 0 ? { mobili: rule.furniture, quanti: rule.count } : undefined;
    },
    vietata: (i, z) => z === ground && an(i),
  };
}

/** The answer of (c) read without trusting it: the rules, the ids that are not in the catalogue said apart. */
export function leggiRegole(text: string, catalogo: Map<string, Mobile>): { regole: Regola[]; ignoti: string[] } {
  const json = /```(?:json)?\s*([\s\S]*?)```/.exec(text)?.[1] ?? text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const raw = JSON.parse(json) as { rules?: unknown };
  if (!Array.isArray(raw.rules)) throw new Error('manca «rules»: un elenco di regole');
  const ignoti = new Set<string>();
  const regole: Regola[] = raw.rules.flatMap((r: Record<string, unknown>) => {
    if (!r || typeof r !== 'object') return [];
    const furniture = (Array.isArray(r.furniture) ? r.furniture : []).filter((x): x is string => typeof x === 'string');
    for (const f of furniture) if (!catalogo.has(f)) ignoti.add(f);
    const ok = furniture.filter((f) => catalogo.has(f));
    const count = typeof r.count === 'number' && Number.isFinite(r.count) ? Math.max(0, Math.min(6, Math.round(r.count))) : 0;
    if (!ok.length || !count) return [];
    return [{
      ...(typeof r.storey === 'number' ? { storey: r.storey } : {}),
      ...(typeof r.area === 'string' && r.area !== '*' ? { area: r.area } : {}),
      ...(r.room === 'hall' || r.room === 'room' || r.room === 'small' ? { room: r.room } : {}),
      furniture: ok,
      count,
    }];
  });
  return { regole, ignoti: [...ignoti] };
}

export function arredaConRegole(s: Scena, semeArredo: number, mobili: Map<string, Mobile>, regole: Regola[]): Arredato {
  return arredaDati(s, semeArredo, mobili, sceltaDi(s, regole));
}

// ---------------------------------------------------------------- (a) the interior in the building's own program

/** The furniture of a program written with its interior (a): the letters whose colour is named «arredo…». */
export function arredoInsieme(s: Scena): { voxel: Set<number>; pezzi: number; lettere: string[] } {
  const g = s.e.grid;
  const pal = s.e.model.program.palette;
  const letters = Object.entries(pal).filter(([, v]) => /^arredo/i.test(v.name ?? '')).map(([k]) => k);
  const codes = new Set(letters.map((l) => g.alphabet.indexOf(l)).filter((c) => c > 0));
  const voxel = new Set<number>();
  for (let i = 0; i < g.cells.length; i++) if (codes.has(g.cells[i])) voxel.add(i);
  return { voxel, pezzi: gruppi(voxel, g.X, g.X * g.Y).filter((p) => p.length >= 8).length, lettere: letters.map(symbolName) };
}

// ---------------------------------------------------------------- the checks after, for every way

/** What the Sculptor's checks and the bench say of a furnished building: storeys reached, the parts, `giudica`, the animals' floor. */
export function controlli(s: Scena, a: { e: Arredato['e']; m: Arredato['m']; voxel: Set<number> }): { piani: number; parti: string[]; giudica: string[]; animaliLiberi: number; stanzeArredate: [number, number] } {
  const { vpt, base } = s.e.scatola;
  const parts = habitableParts(a.e.grid, a.e.model.program.palette, vpt, partVoxels(PARTI).storey.clear, base, [], s.seme);
  const g = s.e.grid;
  const XY = g.X * g.Y;
  const an = suAnimali(s, animali(s).caselle);
  const ground = piante(s).find((p) => !p.cantina);
  let tot = 0, free = 0;
  if (ground)
    for (let i = 0; i < XY; i++) {
      if (!ground.libero[i] || !an(i)) continue;
      tot++;
      if (!a.voxel.has(i + ground.z * XY)) free++;
    }
  // Rooms with at least one piece of furniture on their floor or within a body of it.
  let rooms = 0, furnished = 0;
  for (const p of piante(s).filter((q) => !q.cantina))
    for (const room of stanze(p, g.X, g.Y, Math.round(0.4 * vpt))) {
      rooms++;
      const r = Math.ceil(0.5 * vpt);
      const near = room.some((i) => {
        for (let dz = 0; dz < 6; dz++) for (const d of [0, r, -r, r * g.X, -r * g.X]) if (a.voxel.has(i + d + (p.z + dz) * XY)) return true;
        return false;
      });
      if (near) furnished++;
    }
  return {
    piani: parts.storeys.length,
    parti: [...(parts.storeys.length < 2 ? [`piani: ${parts.storeys.length}`] : []), ...partErrors(parts, PARTI)],
    giudica: giudica(a.m, a.e.scatola).difetti.map((d) => d.split(':')[0]),
    animaliLiberi: tot ? free / tot : 1,
    stanzeArredate: [furnished, rooms],
  };
}
