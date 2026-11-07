// The Jev bench with images (T324): the photographs the Artist judges (`model.judge`, the four sides in 3/4 as the world draws them),
// asked as closed questions to Jev (images are a Danger Zone feature of TypeSafe: `TypeSafe-Danger-Zone-Images: true`) and to Gemini
// 3.1 Flash-Lite with the same pictures. Only `lab/`: nothing goes into the game.
//
// The cases (`--prepara immagini` → casi/immagini.json, the photographs in lab/out/jev/foto):
// - `artista`: the programs the bench judged (finale, conferma) with the Artist's rubric — the criteria one sees from outside, a pass,
//   a mark at thresholds — in four forms of photograph (the four sides in a row as the game sends them, the front alone, a 2×2 grid, four
//   separate pictures); and the passing programs with a defect made on purpose, which must not pass.
// - `concetto`: which of the seven buildings of the bench it is, from the photograph alone.
// - `difetto`: the passing programs, whole and with one defect made on the finished grid (a hole in the roof, speckle on the walls, a
//   part cut off, one colour for everything, the door walled up), five yes/no questions: the right answers are known, not judged.
// - `confronto`, `migliore`: which of two (a pass and a fail of the same building, or a whole one and its defect) or of four is better.
// - `riconosci`: the library's models of the world, which one it is among the library's names.
// - `modello-foto`: the thing → model of the library of T313 with the photographs instead of the names (eight candidates, or all).
// - `quarta-parete-foto`: the studio's models (the corona, never in the world) and the world's, «does it belong in Valmora?».

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { bersaglio } from '../bersagli';
import { esegui, misura, type Bersaglio, type Eseguito } from '../misure';
import { parseColor } from '../../../src/mj/photo';
import type { Grid3, PaletteEntry } from '../../../src/mj/engine';
import type { CaseSpec, LedgerLine, Question } from './banco';
import { BERSAGLI } from '../bersagli';
import { CRITERIA, judgements, wallLetter } from './scultura';
import { ROOT } from './domande';
import { FORMS, runLibraryModel, save, seedForms, shoot, type PhotoForm } from './foto';

const AIR = 0;
/** Apart from casi/: the bench of T313 loads that folder whole, and these cases want their photographs on the disk. */
export const CASES_DIR_IMAGES = path.join(ROOT, 'lab/banco/jev/casi-immagini');
export const CASES_FILE = path.join(CASES_DIR_IMAGES, 'immagini.json');

/** A reference for an image that cannot occur in the text by chance (docs.typesafe.ai/images.md → References), stable for its photo. */
export const refOf = (name: string) => `img-${createHash('sha256').update(name).digest('hex').slice(0, 10)}`;

const noul = (id: string, instructions: string): Question => ({ id, type: 'noul', instructions });

// ------------------------------------------------------------------------------------------------ the questions

/** The criteria of lab/banco/README.md one sees on the outside of a building: `dentro` and `salti` need the cuts and the plans. */
export const VISIBLE = ['riconosce', 'regge', 'lati', 'tetto', 'colori', 'dettaglio'] as const;

const LEVELS = ['no: it does not meet the criterion', 'in part: it meets it only in part', 'yes: it fully meets the criterion'];

/** The Artist's mark (sculptor.ts: `voto`, 0-10, approved from 7) as four levels: the right answers are «at least 7» or «below 7». */
export const MARKS = [
  'poor (0-4 out of 10): it does not read as what is asked, or it has evident defects',
  'weak (5-6 out of 10): it reads, but with defects one notices at once',
  'good (7-8 out of 10): it reads well, only small defects',
  'excellent (9-10 out of 10): rich and clean, nothing to fix',
];

/** The Artist's rubric on a photograph: `subject` is how the questions name it (`photo`, or `photos` for the four pictures). */
export function artistQuestions(subject: string): Question[] {
  const crit = CRITERIA.filter((c) => (VISIBLE as readonly string[]).includes(c.id));
  return [
    ...crit.map((c): Question => ({ id: c.id, type: 'score', instructions: `Judge the building in \`${subject}\`, which should be what \`request\` asks for, against this criterion: ${c.text}`, criteria: LEVELS })),
    noul('passa', `Would a strict art director accept the building in \`${subject}\` in the game as it is, as what \`request\` asks for: recognisable, solid proportions, four worked sides, a designed roof, coherent colours, detail up to standard, with at most one of these only in part?`),
    { id: 'voto', type: 'score', instructions: `What mark would a strict art director give the building in \`${subject}\`, as what \`request\` asks for?`, criteria: MARKS },
  ];
}

export const DEFECTS = {
  tetto: 'Does the roof of the building in `photo` have a large hole, through which one sees inside?',
  rumore: 'Are the walls of the building in `photo` covered with scattered dots of another colour, like noise, instead of real details?',
  mezzo: 'Is a part of the building in `photo` missing, cut off flat as with a knife, so that its rooms show from the side?',
  grigio: 'Is the building in `photo` all of one single colour, so that walls, roof, windows and doors cannot be told apart by their colour?',
  porta: 'Is the main entrance of the building in `photo` walled up or blocked, so that nobody can go in from the front?',
} as const;
export type Defect = keyof typeof DEFECTS;
export const DEFECT_IDS = Object.keys(DEFECTS) as Defect[];

/** The criterion a defect fails (the others stay as the judgement says: unknown). */
const FAILS: Record<Defect, string | undefined> = { tetto: 'tetto', rumore: 'colori', mezzo: 'regge', grigio: 'colori', porta: undefined };

// ------------------------------------------------------------------------------------------------ the defects, on the finished grid

const copy = (g: Grid3): Grid3 => ({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet] });
const idx = (g: Grid3, x: number, y: number, z: number) => x + y * g.X + z * g.X * g.Y;
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

function footprint(g: Grid3): { x0: number; x1: number; y0: number; y1: number; top: Int16Array } {
  const top = new Int16Array(g.X * g.Y).fill(-1);
  let x0 = g.X, x1 = -1, y0 = g.Y, y1 = -1;
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++) {
      let z = g.Z - 1;
      while (z >= 0 && g.cells[idx(g, x, y, z)] === AIR) z--;
      top[x + y * g.X] = z;
      if (z >= 0) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  return { x0, x1, y0, y1, top };
}

/** The letter of the alphabet whose colour is farthest from the walls' (the speckle must show). */
function farLetter(g: Grid3, palette: Record<string, PaletteEntry>, wall: string): string {
  const w = parseColor(palette[wall]?.color) ?? [128, 128, 128];
  let best = wall;
  let d = -1;
  for (const l of g.alphabet.slice(1)) {
    const c = parseColor(palette[l]?.color);
    if (!c) continue;
    const dd = (c[0] - w[0]) ** 2 + (c[1] - w[1]) ** 2 + (c[2] - w[2]) ** 2;
    if (dd > d) (d = dd), (best = l);
  }
  return best;
}

/**
 * The grid with one defect, and how many cells it changed. `door`: the entrance the bench measured (misure.ts → porta), for `porta`.
 * The defect is made on what the program finished, never in the program: what one sees is the defect and nothing else.
 */
export function withDefect(e: Eseguito, d: Defect, palette: Record<string, PaletteEntry>, door?: { x: number; y: number }): { grid: Grid3; changed: number } {
  const g = copy(e.result.grid);
  const wall = wallLetter(g);
  const W = g.alphabet.indexOf(wall);
  const f = footprint(g);
  const vpt = e.scatola.vpt;
  let changed = 0;
  const set = (i: number, v: number) => {
    if (g.cells[i] !== v) (g.cells[i] = v), changed++;
  };
  if (d === 'tetto') {
    // A square a third of the footprint, where the roof is highest on average: one storey dug from the top.
    const side = Math.max(4, Math.round(0.32 * Math.min(f.x1 - f.x0 + 1, f.y1 - f.y0 + 1)));
    let best = { x: f.x0, y: f.y0, h: -1 };
    for (let y = f.y0; y + side <= f.y1 + 1; y += 2)
      for (let x = f.x0; x + side <= f.x1 + 1; x += 2) {
        let s = 0;
        for (let dy = 0; dy < side; dy++) for (let dx = 0; dx < side; dx++) s += f.top[x + dx + (y + dy) * g.X];
        if (s / (side * side) > best.h) best = { x, y, h: s / (side * side) };
      }
    const depth = Math.ceil(1.5 * vpt);
    for (let dy = 0; dy < side; dy++)
      for (let dx = 0; dx < side; dx++) {
        const x = best.x + dx, y = best.y + dy;
        const t = f.top[x + y * g.X];
        for (let z = t; z >= Math.max(0, t - depth); z--) set(idx(g, x, y, z), AIR);
      }
  } else if (d === 'rumore') {
    const noise = g.alphabet.indexOf(farLetter(g, palette, wall));
    for (let i = 0; i < g.cells.length; i++) if (g.cells[i] === W && hash(`${i}`) % 100 < 12) set(i, noise);
  } else if (d === 'mezzo') {
    // The right part of the building, 38 % of its width, gone.
    const cut = f.x0 + Math.round(0.62 * (f.x1 - f.x0));
    for (let z = 0; z < g.Z; z++) for (let y = 0; y < g.Y; y++) for (let x = cut; x <= f.x1; x++) set(idx(g, x, y, z), AIR);
  } else if (d === 'grigio') {
    for (let i = 0; i < g.cells.length; i++) if (g.cells[i] !== AIR) set(i, W);
  } else if (d === 'porta' && door) {
    // The opening filled with the walls' letter, from the ground to over a person's head, a tile and a half each side.
    const base = e.scatola.base;
    for (let z = base; z < Math.min(g.Z, base + e.scatola.persona + 3); z++)
      for (let y = Math.max(0, door.y - 4); y < Math.min(g.Y, door.y + 5); y++)
        for (let x = Math.max(0, door.x - Math.ceil(0.75 * vpt)); x <= Math.min(g.X - 1, door.x + Math.ceil(0.75 * vpt)); x++) {
          const i = idx(g, x, y, z);
          if (g.cells[i] === AIR) set(i, W);
        }
  }
  return { grid: g, changed };
}

// ------------------------------------------------------------------------------------------------ the cases

interface Photo {
  ref: string;
  file: string;
}

/** Photographs a grid in a form: its references and files (four for `separate`). */
function photos(grid: Grid3, palette: Record<string, PaletteEntry>, form: PhotoForm, name: string): Photo[] {
  const s = shoot(grid, palette, form);
  return s.pictures.map((p, i) => {
    const n = s.pictures.length > 1 ? `${name}/${form}-${i}` : `${name}/${form}`;
    return { ref: refOf(n), file: save(p, n).file };
  });
}

const SIDES = ['front', 'right', 'back', 'left'];

/** The state's photograph(s): `photo` for one picture, `photos` with the four sides for `separate`. */
function photoState(ps: Photo[]): { subject: string; state: Record<string, unknown>; images: Record<string, string> } {
  const images = Object.fromEntries(ps.map((p) => [p.ref, p.file]));
  if (ps.length === 1) return { subject: 'photo', state: { photo: ps[0].ref }, images };
  return { subject: 'photos', state: { photos: Object.fromEntries(ps.map((p, i) => [SIDES[i], p.ref])) }, images };
}

const requestOf = (b: Bersaglio) => ({ name: b.nome, style: b.stile, description: b.descrizione });

/** What the T313 bench's text answers put first for a thing (the shortlist of the names), its right models, then more of the same class. */
function shortlist(caseId: string, expected: string[], library: Array<{ id: string; name: string; class: string }>, ledger: LedgerLine[], n = 8): string[] {
  const ids = new Set(library.map((m) => m.id));
  const seen: string[] = [];
  const add = (id: string) => {
    if (ids.has(id) && !seen.includes(id)) seen.push(id);
  };
  for (const e of expected) add(e);
  for (const l of ledger) {
    if (l.case !== caseId || !l.ok || !/^giro-1$/.test(l.run) || !['base', 'rovescio'].includes(l.variant)) continue;
    const a = l.answers?.model;
    for (const [k] of a?.top ?? []) add(k);
    if (a) add(String(a.v));
  }
  const cls = library.find((m) => m.id === seen[0])?.class;
  for (const m of library) if (seen.length < n && m.class === cls) add(m.id);
  for (const m of library) if (seen.length < n) add(m.id);
  // The order: neither the right one first nor the text's favourite; a shuffle by the case's id.
  return seen.slice(0, n).sort((a, b) => hash(`${caseId}|${a}`) - hash(`${caseId}|${b}`));
}

/** The world models of the seed's library (no sounds, nothing of the studio). */
export function worldLibrary(): Array<{ id: string; name: string; class: string }> {
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'universe/models/index.json'), 'utf8')) as Record<string, { class?: string; classe?: string; name?: string; nome?: string }>;
  return Object.entries(index)
    .map(([id, m]) => ({ id, name: m.name ?? m.nome ?? id, class: m.class ?? m.classe ?? '' }))
    .filter((m) => m.class !== 'suono' && !/^(corona-|schermo-|circuito-)/.test(m.id));
}

/** Names that mean the same building or thing in the library: recognising one for the other is right. */
const SAME: string[][] = [
  ['struttura-locanda', 'struttura-locanda-del-cinghiale'],
  ['struttura-casa-del-borgomastro', 'struttura-residenza-del-borgomastro'],
  ['struttura-fucina', 'struttura-fucina-nanica'],
  ['struttura-forte-di-frontiera', 'struttura-fortino'],
  ['struttura-santuario', 'struttura-tempio-della-luna'],
  ['building', 'structure', 'fattoria'],
];
const sameAs = (id: string) => SAME.find((s) => s.includes(id)) ?? [id];

/**
 * The studio's models and the world's for the fourth wall in pictures: the corona's buildings (neon, signs of the Council's
 * departments) and machines are never in the world; the jerboas, the screens and the circuit (blank boxes until the game writes on
 * them) say nothing from a photograph and stay out.
 */
const STUDIO_OUT = /^(corona-gerboa|schermo-|circuito-)/;
const STUDIO_NOT_VOTED = ['corona-panchina', 'corona-totem', 'corona-albero-luce'];

export const WORLD = 'Il Regno di Valmora: un regno medievale quieto: prati, boschi, laghi, colline, borghi di gente semplice, castelli lontani; contadini, artigiani, mercanti, guardie, maghi di villaggio, animali di casa e di bosco; qua e là, nel suolo, rune: lastre con un segno inciso che manda una luce tenue.';

export function prepare(log: (s: string) => void = console.log): string {
  const cases: CaseSpec[] = [];
  const t0 = Date.now();
  // ------------------------------------------------------------------ the judged programs
  const judged = [...judgements('finale'), ...judgements('conferma')];
  const built = new Map<string, { e: Eseguito; b: Bersaglio; palette: Record<string, PaletteEntry> }>();
  for (const j of judged) {
    const b = bersaglio(j.bersaglio)!;
    const xml = fs.readFileSync(path.join(ROOT, 'lab/banco', j.dir, 'modello.xml'), 'utf8');
    const e = esegui(xml, b, 1);
    const palette = e.model.program.palette;
    built.set(j.dir, { e, b, palette });
    const visiblePass = VISIBLE.every((k) => j.levels[k] !== 0) && VISIBLE.filter((k) => j.levels[k] === 1).length <= 1;
    for (const form of FORMS) {
      const ps = photos(e.result.grid, palette, form, `edifici/${j.dir}`);
      const { subject, state, images } = photoState(ps);
      cases.push({
        id: `artista/${j.dir}/${form}`,
        group: 'immagini',
        kind: 'artista',
        form,
        source: `lab/banco/${j.dir}/modello.xml; giudizio: lab/banco/${j.dir.split('/')[0]}/giudizio.md`,
        note: `${j.passa ? 'passa' : 'non passa'} il giudizio delle foto${visiblePass !== j.passa ? `; da fuori ${visiblePass ? 'passerebbe' : 'non passerebbe'}` : ''}. ${j.note}`,
        state: { request: requestOf(b), ...state },
        images,
        questions: artistQuestions(subject),
        expected: { ...Object.fromEntries(VISIBLE.map((k) => [k, j.levels[k]])), passa: j.passa, voto: j.passa ? [2, 3] : [0, 1] },
        meta: { visiblePass },
      } as CaseSpec);
      if (form === 'separate') continue;
      cases.push({
        id: `concetto/${j.dir}/${form}`,
        group: 'immagini',
        kind: 'concetto',
        form,
        source: `lab/banco/${j.dir}/modello.xml`,
        state: { photo: ps[0].ref },
        images: { [ps[0].ref]: ps[0].file },
        questions: [{ id: 'building', type: 'choice', instructions: 'Which of these buildings is the one in `photo`?', criteria: Object.fromEntries(BERSAGLI.map((t) => [t.id, `${t.nome} (${t.stile})`])) }],
        expected: { building: [j.bersaglio] },
      } as CaseSpec);
    }
  }
  log(`edifici giudicati: ${judged.length} × ${FORMS.length} forme (${Math.round((Date.now() - t0) / 1000)} s)`);

  // ------------------------------------------------------------------ the defects on the passing programs
  const passing = judged.filter((j) => j.passa);
  const defective = new Map<string, Partial<Record<Defect, Photo[]>>>();
  let k = 0;
  for (const j of passing) {
    const { e, b, palette } = built.get(j.dir)!;
    const t1 = Date.now();
    const door = misura(e, b).porta;
    const versions: Array<[Defect | 'intero', Grid3]> = [['intero', e.result.grid]];
    for (const d of DEFECT_IDS) {
      if (d === 'porta' && !door) continue;
      const r = withDefect(e, d, palette, door);
      if (r.changed < 30) {
        log(`difetto ${d} su ${j.dir}: cambia ${r.changed} celle, salto`);
        continue;
      }
      versions.push([d, r.grid]);
    }
    const mine: Partial<Record<Defect, Photo[]>> = {};
    for (const [d, grid] of versions) {
      for (const form of ['lati4', 'lato1', 'griglia'] as PhotoForm[]) {
        const ps = photos(grid, palette, form, `difetti/${j.dir}/${d}`);
        if (form === 'lati4' && d !== 'intero') mine[d] = ps;
        cases.push({
          id: `difetto/${j.dir}/${d}/${form}`,
          group: 'immagini',
          kind: 'difetto',
          form,
          source: `lab/banco/${j.dir}/modello.xml${d === 'intero' ? '' : `, con il difetto «${d}» fatto sulla griglia finita`}`,
          state: { photo: ps[0].ref },
          images: { [ps[0].ref]: ps[0].file },
          questions: DEFECT_IDS.map((id) => noul(id, DEFECTS[id])),
          expected: Object.fromEntries(DEFECT_IDS.map((id) => [id, id === d])),
        } as CaseSpec);
        // The sabotaged ones also go to the Artist's rubric, in the game's own photograph: they must not pass.
        if (form === 'lati4' && d !== 'intero') {
          const fail = FAILS[d];
          cases.push({
            id: `artista/${j.dir}/${d}/lati4`,
            group: 'immagini',
            kind: 'artista',
            form: 'lati4',
            source: `lab/banco/${j.dir}/modello.xml con il difetto «${d}»`,
            note: `passa il giudizio delle foto; qui con il difetto «${d}»: non deve passare`,
            state: { request: requestOf(b), photo: ps[0].ref },
            images: { [ps[0].ref]: ps[0].file },
            questions: artistQuestions('photo'),
            expected: { passa: false, voto: [0, 1], ...(fail ? { [fail]: [0, 1] } : {}) },
            meta: { defect: d },
          } as CaseSpec);
        }
      }
    }
    defective.set(j.dir, mine);
    log(`  ${j.dir}: ${versions.length - 1} difetti (${Math.round((Date.now() - t1) / 1000)} s)`);
    // Two of them against the whole one, in both orders; and one against three of its defects.
    const whole = photos(e.result.grid, palette, 'lati4', `difetti/${j.dir}/intero`)[0];
    const ds = Object.keys(mine) as Defect[];
    const pick = ds[k % ds.length];
    for (const order of [0, 1]) {
      const [A, B] = order ? [mine[pick]![0], whole] : [whole, mine[pick]![0]];
      cases.push(pair(`confronto/${j.dir}/${pick}/${order ? 'BA' : 'AB'}`, b, A, B, order ? 'B' : 'A', `${j.dir} intero contro il difetto «${pick}»`));
    }
    if (ds.length >= 3) {
      const three = [0, 1, 2].map((i) => ds[(k + i) % ds.length]);
      const slot = k % 4;
      const four: Photo[] = [];
      let t = 0;
      for (let i = 0; i < 4; i++) four.push(i === slot ? whole : mine[three[t++]]![0]);
      const L = ['A', 'B', 'C', 'D'];
      cases.push({
        id: `migliore/${j.dir}`,
        group: 'immagini',
        kind: 'migliore',
        form: 'lati4',
        source: `lab/banco/${j.dir}/modello.xml, intero in ${L[slot]}, con i difetti ${three.join(', ')}`,
        state: { request: requestOf(b), ...Object.fromEntries(four.map((p, i) => [L[i], p.ref])) },
        images: Object.fromEntries(four.map((p) => [p.ref, p.file])),
        questions: [{ id: 'better', type: 'choice', instructions: 'Which of the four buildings would a strict art director prefer in the game as what `request` asks for: well made, recognisable, with no evident defect?', criteria: Object.fromEntries(L.map((l) => [l, `The building in \`${l}\``])) }],
        expected: { better: [L[slot]] },
      } as CaseSpec);
    }
    k++;
  }
  log(`difetti: ${passing.length} edifici che passano (${Math.round((Date.now() - t0) / 1000)} s)`);

  // ------------------------------------------------------------------ the real pairs: a pass and a fail of the same building
  const fails = judged.filter((j) => !j.passa);
  for (const f of fails) {
    const twin = passing.find((p) => p.bersaglio === f.bersaglio && p.dir.split('/')[0] === f.dir.split('/')[0]) ?? passing.find((p) => p.bersaglio === f.bersaglio);
    if (!twin) continue;
    const pf = built.get(f.dir)!;
    const pp = built.get(twin.dir)!;
    const A0 = photos(pf.e.result.grid, pf.palette, 'lati4', `edifici/${f.dir}`)[0];
    const B0 = photos(pp.e.result.grid, pp.palette, 'lati4', `edifici/${twin.dir}`)[0];
    for (const order of [0, 1]) {
      const [A, B] = order ? [B0, A0] : [A0, B0];
      cases.push(pair(`confronto/${f.dir}~${twin.dir.replace(/\//g, '-')}/${order ? 'BA' : 'AB'}`, pf.b, A, B, order ? 'A' : 'B', `${twin.dir} passa, ${f.dir} no (giudizio.md)`));
    }
  }

  // ------------------------------------------------------------------ the library: recognise, the thing → its model, the fourth wall
  const forms = seedForms();
  const lib = worldLibrary();
  const libPhotos = new Map<string, Record<'lati4' | 'lato1', Photo>>();
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'universe/models/index.json'), 'utf8')) as Record<string, { class: string; name: string }>;
  const studio = Object.keys(index).filter((id) => /^(corona-|schermo-|circuito-)/.test(id) && !STUDIO_OUT.test(id));
  for (const id of [...lib.map((m) => m.id), ...studio]) {
    let r: ReturnType<typeof runLibraryModel>;
    try {
      r = runLibraryModel(forms, id);
    } catch (err) {
      log(`${id}: non gira (${(err as Error).message})`);
      continue;
    }
    if (!r) continue;
    const p4 = photos(r.grid, r.model.program.palette, 'lati4', `libreria/${id}`)[0];
    const p1 = photos(r.grid, r.model.program.palette, 'lato1', `libreria/${id}`)[0];
    libPhotos.set(id, { lati4: p4, lato1: p1 });
  }
  const missing = lib.filter((m) => !libPhotos.has(m.id)).map((m) => m.id);
  if (missing.length) throw new Error(`modelli del mondo senza foto: ${missing.join(", ")}`);
  for (const id of studio.filter((s) => !libPhotos.has(s))) studio.splice(studio.indexOf(id), 1);
  for (const m of lib) {
    const p = libPhotos.get(m.id)!.lati4;
    cases.push({
      id: `riconosci/${m.id}`,
      group: 'immagini',
      kind: 'riconosci',
      form: 'lati4',
      source: `universe/models/${m.id}.xml`,
      state: { photo: p.ref },
      images: { [p.ref]: p.file },
      questions: [{ id: 'model', type: 'choice', instructions: 'The picture `photo` shows a model of a video game from four sides. Which model of the game is it?', criteria: Object.fromEntries(lib.map((o) => [o.id, `${o.name} [${o.class}]`])) }],
      expected: { model: sameAs(m.id) },
    } as CaseSpec);
  }
  for (const id of [...lib.map((m) => m.id), ...studio]) {
    const p = libPhotos.get(id)!.lati4;
    const isStudio = studio.includes(id);
    const voted = !STUDIO_NOT_VOTED.includes(id);
    cases.push({
      id: `quarta-parete-foto/${id}`,
      group: 'immagini',
      kind: 'quarta-parete-foto',
      form: 'lati4',
      source: `universe/models/${id}.xml${isStudio ? ' (lo studio della corona: mai nel mondo)' : ''}`,
      state: { world: WORLD, photo: p.ref },
      images: { [p.ref]: p.file },
      questions: [
        noul('modern', 'Does the thing in `photo` show neon lights, screens, electric lamps, drones, trains, robots or other machines of an electric or digital age?'),
        noul('belongs', 'Could the thing in `photo` stand in `world` without looking out of its age or out of that world?'),
      ],
      expected: voted ? { modern: isStudio, belongs: !isStudio } : {},
    } as CaseSpec);
  }
  // The thing → model of T313, with the photographs: the eight the names put first, or the whole library.
  const t313 = JSON.parse(fs.readFileSync(path.join(ROOT, 'lab/banco/jev/casi/decisioni.json'), 'utf8')).cases.filter((c: CaseSpec) => c.kind === 'modello') as CaseSpec[];
  const ledger: LedgerLine[] = fs
    .readFileSync(path.join(ROOT, 'lab/banco/jev/consumi.jsonl'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('"kind":"modello"'))
    .map((l) => JSON.parse(l));
  for (const c of t313) {
    const exp = ((c.expected as any).model as string[]) ?? [];
    const right = exp.filter((x) => x !== 'nuovo');
    const thing = (c.state as any).thing;
    const short = shortlist(c.id, right, lib, ledger);
    const fitsExp = (c.expected as any).fits;
    const base = { group: 'immagini' as const, kind: 'modello-foto', source: `${c.id} (T313)` };
    const instr = (lib: string) => `Which model of \`${lib}\` can show \`thing\` in the world well enough: the same kind of thing with a similar shape, so that nobody would find it odd? Choose \`nuovo\` if none of them can.`;
    const fits = (lib: string): Question => noul('fits', `Is there a model in \`${lib}\` that shows \`thing\` well enough (the same kind of thing, a similar shape)?`);
    // The names (as T313, eight candidates).
    cases.push({
      ...base,
      id: `modello-foto/${c.id.split('/')[1]}/nomi8`,
      form: 'nomi8',
      state: { thing, library: short.map((id) => ({ id, name: lib.find((m) => m.id === id)!.name, class: lib.find((m) => m.id === id)!.class })) },
      questions: [{ id: 'model', type: 'choice', instructions: instr('library'), criteria: { ...Object.fromEntries(short.map((id) => [id, `${lib.find((m) => m.id === id)!.name} [${lib.find((m) => m.id === id)!.class}]`])), nuovo: 'None of the models looks like it: a new model is needed.' } }, fits('library')],
      expected: { model: exp, ...(fitsExp !== undefined ? { fits: fitsExp } : {}) },
    } as CaseSpec);
    // The photographs, without the names: the options are opaque keys.
    for (const [form, ids, side] of [
      ['foto8', short, 'lati4'],
      ['foto50', lib.map((m) => m.id), 'lato1'],
    ] as Array<[string, string[], 'lati4' | 'lato1']>) {
      const keys = ids.map((_, i) => `m${i + 1}`);
      const ps = ids.map((id) => libPhotos.get(id)![side]);
      cases.push({
        ...base,
        id: `modello-foto/${c.id.split('/')[1]}/${form}`,
        form,
        note: `chiavi: ${ids.map((id, i) => `${keys[i]}=${id}`).join(' ')}`,
        state: { thing, models: Object.fromEntries(keys.map((key, i) => [key, ps[i].ref])) },
        images: Object.fromEntries(ps.map((p) => [p.ref, p.file])),
        questions: [
          { id: 'model', type: 'choice', instructions: `${instr('models')} Every entry of \`models\` is a photograph of a model of the game${side === 'lati4' ? ' from four sides' : ''}.`, criteria: { ...Object.fromEntries(keys.map((key) => [key, `The model in \`models.${key}\``])), nuovo: 'None of the models looks like it: a new model is needed.' } },
          fits('models'),
        ],
        expected: { model: exp.map((x) => (x === 'nuovo' ? 'nuovo' : keys[ids.indexOf(x)] ?? x)), ...(fitsExp !== undefined ? { fits: fitsExp } : {}) },
      } as CaseSpec);
    }
  }
  log(`libreria: ${lib.length} modelli del mondo, ${studio.length} dello studio; oggetto → modello: ${t313.length} casi × 3 (${Math.round((Date.now() - t0) / 1000)} s)`);

  // The pixels of every case's pictures (the tokens Jev bills grow with them).
  for (const c of cases) {
    const px = Object.values(c.images ?? {}).reduce((s, f) => {
      const head = fs.readFileSync(path.resolve(ROOT, f)).subarray(16, 24);
      return s + head.readUInt32BE(0) * head.readUInt32BE(4);
    }, 0);
    if (px) c.meta = { ...(c.meta ?? {}), pixels: px };
  }
  fs.mkdirSync(path.dirname(CASES_FILE), { recursive: true });
  fs.writeFileSync(
    CASES_FILE,
    JSON.stringify(
      {
        group: 'immagini',
        description:
          'T324, generato da `--prepara immagini`: le foto dei modelli (lab/out/jev/foto, rigenerate uguali) con le domande chiuse dell\'Artista. Risposte giuste: i giudizi di lab/banco/finale e lab/banco/conferma (giudizio.md), i difetti fatti apposta sulla griglia finita (noti), il bersaglio di ogni edificio, l\'id di ogni modello, lo studio della corona (mai nel mondo) contro i modelli del mondo, le risposte di T313 per l\'oggetto → modello.',
        cases,
      },
      null,
      1,
    ) + '\n',
  );
  log(`casi: ${cases.length} → ${path.relative(ROOT, CASES_FILE)}`);
  return CASES_FILE;
}

function pair(id: string, b: Bersaglio, A: Photo, B: Photo, right: 'A' | 'B', why: string): CaseSpec {
  return {
    id,
    group: 'immagini',
    kind: 'confronto',
    form: 'lati4',
    source: why,
    state: { request: requestOf(b), A: A.ref, B: B.ref },
    images: { [A.ref]: A.file, [B.ref]: B.file },
    questions: [{ id: 'better', type: 'choice', instructions: 'Which of the two buildings would a strict art director prefer in the game as what `request` asks for: well made, recognisable, with no evident defect?', criteria: { A: 'The building in `A`', B: 'The building in `B`' } }],
    expected: { better: [right] },
  } as CaseSpec;
}

/** Whether the photographs of the case file are on the disk (they are generated, not committed). */
export function photosReady(cases: Array<{ images?: Record<string, string> }>): boolean {
  return cases.every((c) => Object.values(c.images ?? {}).every((f) => fs.existsSync(path.resolve(ROOT, f))));
}
