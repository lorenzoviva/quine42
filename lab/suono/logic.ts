// What the SoundLab (/lab/suono/, T222) does that needs no page: the program's text changed by its knobs and its piano roll, the WAV, the roll's geometry.
// The text is changed in place and never rewritten from a parsed tree: comments and layout are the author's, and saving then loading gives the same characters.
//
// The piano roll writes into the program: what differs from what the rules gave becomes <box> nodes at the end of the root <sequence>, between two comments
// (`RETOUCH_OPEN`, `RETOUCH_CLOSE`), so the file says everything and the game plays the same grid. They draw over whatever a seed gives.
// What does not fit (a root that is not a sequence, a program that never ends) is said, with the reason: `retouch` runs the result and compares.

import { AIR, Mj3Error, run, runOn, type Grid3 } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import type { RenderedSound } from '../../src/mj/synth';
import { SOUND_LIMITS, SOUND_MAX_STEPS } from '../../src/mj/synth';
import type { SoundTrack } from '../../src/mj/sound';

/** A grid as it travels to and from the worker. */
export type GridData = Pick<Grid3, 'X' | 'Y' | 'Z' | 'cells' | 'alphabet'>;

export const toGrid3 = (g: GridData): Grid3 => ({ X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 });
const indexOf = (g: GridData, x: number, y: number, z: number) => x + y * g.X + z * g.X * g.Y;
export const letterAt = (g: GridData, x: number, y: number, z: number) => g.alphabet[g.cells[indexOf(g, x, y, z)]];

// ---- the tags of a text, comments skipped ----

interface Tag {
  name: string;
  start: number;
  end: number;
  closing: boolean;
  selfClosing: boolean;
}

const TAG_RE = /<!--[\s\S]*?(?:-->|$)|<\?[\s\S]*?\?>|<![^>]*>|<\/([\w:.-]+)\s*>|<([\w:.-]+)(?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*\s*(\/?)>/g;

function tagsOf(xml: string): Tag[] {
  const out: Tag[] = [];
  for (const m of xml.matchAll(TAG_RE)) {
    const name = m[1] ?? m[2];
    if (name) out.push({ name, start: m.index, end: m.index + m[0].length, closing: !!m[1], selfClosing: m[3] === '/' });
  }
  return out;
}

const CLIPS = new Set(['animation', 'action']);

/** The root node of a program: its name, and where its closing tag starts if it has one. */
function rootOf(xml: string): { name: string; closeStart?: number } | undefined {
  let depth = 0;
  let root: { name: string; closeStart?: number } | undefined;
  for (const t of tagsOf(xml)) {
    if (t.closing) {
      depth--;
      if (depth === 0 && root && root.closeStart === undefined && t.name === root.name) return { ...root, closeStart: t.start };
      continue;
    }
    if (depth === 0 && !root && !CLIPS.has(t.name)) {
      root = { name: t.name };
      if (t.selfClosing) return root;
    }
    if (!t.selfClosing) depth++;
  }
  return root;
}

function setAttrOf(tag: string, key: string, value: string): string {
  const re = new RegExp(`(\\s${key}\\s*=\\s*)("[^"]*"|'[^']*')`);
  if (re.test(tag)) return tag.replace(re, (_, head: string) => `${head}"${value}"`);
  return tag.replace(/\s*(\/?)>$/, (_, slash: string) => ` ${key}="${value}"${slash}>`);
}

const attrOf = (tag: string, key: string): string | undefined => new RegExp(`\\s${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(tag)?.slice(1).find((v) => v !== undefined);

// ---- the knobs write into <sound> ----

/** An attribute of `<sound>`, changed in place; the text as it was if there is no `<sound>`. */
export function setSoundAttr(xml: string, key: 'bpm' | 'scale' | 'root' | 'swing' | 'cutoff' | 'space', value: string | number): string {
  const t = tagsOf(xml).find((x) => x.name === 'sound' && !x.closing);
  if (!t) return xml;
  return xml.slice(0, t.start) + setAttrOf(xml.slice(t.start, t.end), key, String(value)) + xml.slice(t.end);
}

/** A track's volume. A `<sound>` that names no tracks gets the ones it was playing (`tracks`), since a volume has to be written somewhere. */
export function setTrackVolume(xml: string, y: number, volume: number, tracks: readonly SoundTrack[]): string {
  const tags = tagsOf(xml);
  const own = tags.filter((x) => x.name === 'track' && !x.closing);
  const t = own.find((x) => Number(attrOf(xml.slice(x.start, x.end), 'y')) === y);
  if (t) return xml.slice(0, t.start) + setAttrOf(xml.slice(t.start, t.end), 'volume', String(volume)) + xml.slice(t.end);
  const open = tags.find((x) => x.name === 'sound' && !x.closing);
  if (!open || own.length) return xml;
  const close = open.selfClosing ? undefined : tags.find((x) => x.closing && x.name === 'sound' && x.start > open.start);
  const lines = tracks.map((k) => `    <track y="${k.y}" instrument="${k.instrument}" volume="${k.y === y ? volume : k.volume}"/>`).join('\n');
  const head = xml.slice(open.start, open.end).replace(/\s*\/>$/, '>');
  return `${xml.slice(0, open.start)}${head}\n${lines}\n  </sound>${xml.slice(close ? close.end : open.end)}`;
}

// ---- the seed travels with the file, in a comment ----

const SEED_NOTE = /^<!-- SoundLab: seme (\d+) -->\r?\n/;

/** The text as it goes to disk: the seed it was heard with on the first line, so the same file gives the same sound. */
export function withSeedNote(xml: string, seed: number): string {
  return `<!-- SoundLab: seme ${seed} -->\n${xml.replace(SEED_NOTE, '')}`;
}

export const seedNote = (xml: string): number | undefined => {
  const m = SEED_NOTE.exec(xml);
  return m ? Number(m[1]) : undefined;
};

/** The comment on top of a program: what the program is. */
export function leadComment(xml: string): string {
  return /^\s*<!--\s*([\s\S]*?)\s*-->/.exec(xml.replace(SEED_NOTE, ''))?.[1] ?? '';
}

// ---- the piano roll writes into the program ----

export const RETOUCH_OPEN = '<!-- ritocchi del piano roll: stanno sopra a ciò che le regole scrivono -->';
export const RETOUCH_CLOSE = '<!-- fine dei ritocchi -->';
const RETOUCH_RE = /^[ \t]*<!-- ritocchi del piano roll[\s\S]*?<!-- fine dei ritocchi -->[ \t]*\r?\n?/m;

export const withoutRetouches = (xml: string) => xml.replace(RETOUCH_RE, '');
export const retouchCount = (xml: string) => RETOUCH_RE.exec(xml)?.[0].match(/<box\b/g)?.length ?? 0;

/** What differs between two grids of a size, as runs along X; `air` is the letter that writes an empty cell. */
export function retouchBoxes(base: GridData, target: GridData, air: string): Array<{ x: number; y: number; z: number; n: number; letter: string }> {
  const out: Array<{ x: number; y: number; z: number; n: number; letter: string }> = [];
  for (let z = 0; z < target.Z; z++)
    for (let y = 0; y < target.Y; y++)
      for (let x = 0; x < target.X; x++) {
        const want = letterAt(target, x, y, z);
        if (letterAt(base, x, y, z) === want) continue;
        const letter = want === AIR ? air : want;
        const last = out[out.length - 1];
        if (last && last.z === z && last.y === y && last.letter === letter && last.x + last.n === x) last.n++;
        else out.push({ x, y, z, n: 1, letter });
      }
  return out;
}

/** The block before the root's closing tag. Undefined if the root is not a <sequence>: nothing could come after what it does. */
function insertRetouches(xml: string, boxes: ReturnType<typeof retouchBoxes>): string | undefined {
  if (!boxes.length) return xml;
  const root = rootOf(xml);
  if (root?.name !== 'sequence' || root.closeStart === undefined) return undefined;
  let at = root.closeStart;
  while (at > 0 && (xml[at - 1] === ' ' || xml[at - 1] === '\t')) at--;
  const lines = boxes.map((b) => `  <box at="${b.x + (b.n - 1) / 2} ${b.y} ${b.z}" size="${b.n} 1 1" color="${b.letter}"/>`);
  const block = `  ${RETOUCH_OPEN}\n${lines.join('\n')}\n  ${RETOUCH_CLOSE}\n`;
  return `${xml.slice(0, at)}${at > 0 && xml[at - 1] !== '\n' ? '\n' : ''}${block}${xml.slice(at)}`;
}

export function gridOf(xml: string, seed: number): Grid3 {
  return run(compileMjx(xml).program, seed, SOUND_MAX_STEPS, SOUND_LIMITS).grid;
}

export const sameGrid = (a: GridData, b: GridData): boolean => {
  if (a.X !== b.X || a.Y !== b.Y || a.Z !== b.Z) return false;
  for (let z = 0; z < a.Z; z++) for (let y = 0; y < a.Y; y++) for (let x = 0; x < a.X; x++) if (letterAt(a, x, y, z) !== letterAt(b, x, y, z)) return false;
  return true;
};

export type Retouched = { ok: true; xml: string; boxes: number } | { ok: false; why: string };

/** A grid as the program's own output: the text that gives exactly `target` with this seed, or why there is none. */
export function retouch(xml: string, seed: number, target: GridData): Retouched {
  try {
    const clean = withoutRetouches(xml);
    const base = gridOf(clean, seed);
    if (base.X !== target.X || base.Y !== target.Y || base.Z !== target.Z) return { ok: false, why: `la griglia è ${target.X}×${target.Y}×${target.Z}, il programma ne scrive una di ${base.X}×${base.Y}×${base.Z}` };
    const boxes = retouchBoxes(base, target, compileMjx(clean).background);
    const next = insertRetouches(clean, boxes);
    if (next === undefined) return { ok: false, why: `la radice è <${rootOf(clean)?.name}>: i ritocchi vanno in fondo a una <sequence>` };
    if (!sameGrid(gridOf(next, seed), target)) return { ok: false, why: 'rieseguito, il programma non dà questa griglia (non arriva in fondo, o una lettera ha un altro senso dopo una map)' };
    return { ok: true, xml: next, boxes: boxes.length };
  } catch (e) {
    if (e instanceof Mj3Error) return { ok: false, why: e.message };
    throw e;
  }
}

/** The program's rules once more, on a grid that exists (the mockup's «RunOn»). Its retouches are not rules, and stay out. */
export function runOnGrid(xml: string, seed: number, grid: GridData): Grid3 {
  const g = toGrid3(grid);
  runOn(g, compileMjx(withoutRetouches(xml)).program, seed, SOUND_MAX_STEPS, SOUND_LIMITS);
  return g;
}

// ---- the piano roll's geometry and brush ----

export const ROLL = { left: 46, right: 8, top: 4, bottom: 20 };

/** The cell under a point of a roll of `w`×`h`. With `layer` undefined all the planes are drawn in bands, one a row: the band says the plane. */
export function rollCell(px: number, py: number, w: number, h: number, g: Pick<GridData, 'X' | 'Y' | 'Z'>, layer?: number): { x: number; y: number; z: number } | undefined {
  const gw = w - ROLL.left - ROLL.right;
  const gh = h - ROLL.top - ROLL.bottom;
  const mx = px - ROLL.left;
  const my = py - ROLL.top;
  if (mx < 0 || my < 0 || mx >= gw || my >= gh) return undefined;
  const row = (my / gh) * g.Z;
  const y = layer ?? Math.min(g.Y - 1, Math.floor((row - Math.floor(row)) * g.Y));
  return { x: Math.floor((mx / gw) * g.X), y: Math.min(g.Y - 1, y), z: g.Z - 1 - Math.floor(row) };
}

/** Writes a letter in a cell of the grid; AIR empties it. */
export function paintCell(g: GridData, c: { x: number; y: number; z: number }, letter: string): void {
  let code = g.alphabet.indexOf(letter);
  if (code < 0) code = g.alphabet.push(letter) - 1;
  g.cells[indexOf(g, c.x, c.y, c.z)] = code;
}

/** What a click writes: the brush, or an empty cell if the brush is already there. */
export const brushFor = (g: GridData, c: { x: number; y: number; z: number }, brush: string) => (letterAt(g, c.x, c.y, c.z) === brush ? AIR : brush);

const NOTES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
export const noteName = (midi: number) => `${NOTES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

// ---- what comes out ----

/** The samples of a step of the loop: what «+1» plays. */
export function stepSlice(s: Pick<RenderedSound, 'loopStart' | 'loopEnd'>, step: number, steps: number): { from: number; to: number } {
  const n = (s.loopEnd - s.loopStart) / Math.max(1, steps);
  return { from: Math.round(s.loopStart + step * n), to: Math.round(s.loopStart + (step + 1) * n) };
}

/** A mono 16-bit PCM WAV. */
export function wavBytes(samples: Float32Array, rate: number): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const v = new DataView(bytes.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
  return bytes;
}

export function levels(samples: Float32Array): { peak: number; rms: number } {
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
    sum += a * a;
  }
  return { peak, rms: Math.sqrt(sum / Math.max(1, samples.length)) };
}
