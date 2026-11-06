// Sound as a MarkovJunior program (T221, ADR-0123). The grid is the score: X is time (one cell a sixteenth), Y the track, Z the height on the scale, and the
// letters are what happens. The musical parameters live in the XML, in `<sound>` on the root; the rest of the program is the engine's own nodes.
//
//   <sequence values="BNSAGKHCRTMP" size="16 3 8" symmetry="()">
//     <sound bpm="120" scale="dorian" root="50" swing="0.12" cutoff="4800" space="0.35">
//       <track y="0" instrument="lead" volume="0.82"/>
//     </sound>
//     …nodes…
//   </sequence>
//
// Letters that sound: N note, S sustain (a tail of the note before it), A accent, G ghost, K kick, H hat, C snare. Any other letter is a marker and stays silent.
// Pure and light: compileMjx (the game, the world's process, a worker) imports this file; nothing here knows the page.

import { at, Mj3Error, type Grid3 } from './engine';
import type { XmlElement } from './xml';
import { italianName } from '../kernel/internalNames';

/** The class of a sound program in `models/index.json`. Not one of `CLASSES`: it has no box, nothing in the world wears it. */
export const SOUND_CLASS = 'suono';

export const SCALES: Record<string, readonly number[]> = {
  pentatonic_minor: [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19],
  phrygian: [0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19],
  hirajoshi: [0, 2, 3, 7, 8, 12, 14, 15, 19, 20, 24, 26],
};

export const INSTRUMENTS = ['lead', 'pad', 'bass'] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export interface SoundTrack {
  y: number;
  instrument: Instrument;
  /** 0..1. A track at (almost) 0 does not play. */
  volume: number;
}

export interface SoundSettings {
  bpm: number;
  scale: string;
  /** The tonic, as a MIDI note. */
  root: number;
  /** How late the odd sixteenths come, as a share of a step. */
  swing: number;
  /** Master lowpass, in Hz. */
  cutoff: number;
  /** How much of the delay comes back. */
  space: number;
  tracks: SoundTrack[];
}

type Range = readonly [min: number, max: number, fallback: number];
const RANGES: Record<'bpm' | 'root' | 'swing' | 'cutoff' | 'space' | 'y' | 'volume', Range> = {
  bpm: [20, 400, 122],
  root: [0, 96, 50],
  swing: [0, 0.45, 0.12],
  cutoff: [100, 18_000, 4800],
  space: [0, 0.85, 0.35],
  y: [0, 255, 0],
  volume: [0, 1, 0.8],
};

/** The three tracks of the SoundLab, for a `<sound>` that names none. */
const DEFAULT_TRACKS: readonly SoundTrack[] = [
  { y: 0, instrument: 'lead', volume: 0.82 },
  { y: 1, instrument: 'pad', volume: 0.75 },
  { y: 2, instrument: 'bass', volume: 0.9 },
];

/** What a `<sound>` says; what it does not say is the SoundLab's. A value out of range goes back to whoever wrote it. */
export function soundSettings(el: XmlElement): SoundSettings {
  const fail = (e: XmlElement, msg: string): never => {
    throw new Mj3Error(`riga ${e.line}, <${e.name}>: ${msg}`);
  };
  const num = (e: XmlElement, key: keyof typeof RANGES): number => {
    const [min, max, fallback] = RANGES[key];
    const s = e.attrs[key];
    if (s === undefined) return fallback;
    const n = Number(s);
    if (!s.trim() || !Number.isFinite(n) || n < min || n > max) fail(e, `"${key}" vuole un numero tra ${min} e ${max}, non "${s}"`);
    return n;
  };
  const scale = el.attrs.scale ?? 'dorian';
  if (!Object.hasOwn(SCALES, scale)) fail(el, `scala "${scale}" sconosciuta (note: ${Object.keys(SCALES).join(', ')})`);
  const tracks = el.children.map((t): SoundTrack => {
    if (t.name !== 'track') fail(t, 'dentro <sound> vanno solo <track>');
    if (t.attrs.y === undefined) fail(t, 'manca "y", il piano della griglia');
    const y = num(t, 'y');
    if (!Number.isInteger(y)) fail(t, '"y" vuole il numero del piano della griglia');
    const instrument = t.attrs.instrument as Instrument;
    if (!INSTRUMENTS.includes(instrument)) fail(t, `"instrument" vuole ${INSTRUMENTS.join(', ')}, non "${t.attrs.instrument}"`);
    return { y, instrument, volume: num(t, 'volume') };
  });
  if (new Set(tracks.map((t) => t.y)).size !== tracks.length) fail(el, 'due <track> sullo stesso y');
  const root = num(el, 'root');
  if (!Number.isInteger(root)) fail(el, '"root" vuole una nota MIDI intera');
  return {
    bpm: num(el, 'bpm'),
    scale,
    root,
    swing: num(el, 'swing'),
    cutoff: num(el, 'cutoff'),
    space: num(el, 'space'),
    tracks: tracks.length ? tracks : DEFAULT_TRACKS.map((t) => ({ ...t })),
  };
}

export type Voice = Instrument | 'kick' | 'hat' | 'openhat' | 'snare';

/** One thing that sounds. */
export interface ScoreEvent {
  /** The sixteenth it starts on (the grid's X). */
  step: number;
  /** The track (the grid's Y) and the height on the scale (Z) it comes from. */
  track: number;
  z: number;
  voice: Voice;
  /** MIDI note, of the three instruments. */
  midi?: number;
  /** How many steps it lasts, its sustains counted. */
  hold: number;
  /** The track's volume and the letter's force. */
  gain: number;
  accent: boolean;
}

export interface Score {
  /** Sixteenths in one pass of the loop. */
  steps: number;
  settings: SoundSettings;
  events: ScoreEvent[];
  /** More events than a score takes: the earliest stayed. */
  truncated: boolean;
}

/** What a score can hold: a whole box of notes (a program can write one) is noise, and its cost is real. */
export const MAX_EVENTS = 4096;
const MAX_MIDI = 127;
/** The letter's force, on a note. */
const FORCE: Record<string, number> = { N: 0.72, S: 0.72, A: 1, G: 0.38 };

/** The note of a height on a track's scale. The scales run over an octave, as they do in the SoundLab: this is how it sounded. */
export function pitchOf(z: number, settings: SoundSettings, instrument: Instrument): number {
  const scale = SCALES[settings.scale];
  const degree = scale[z % scale.length] + Math.floor(z / scale.length) * 12;
  return Math.min(MAX_MIDI, settings.root + degree + (instrument === 'lead' ? 12 : instrument === 'pad' ? 0 : -12));
}

/** The grid → the events. Pure: same grid, same score. */
export function scoreOf(grid: Grid3, settings: SoundSettings): Score {
  const events: ScoreEvent[] = [];
  let truncated = false;
  const tracks = settings.tracks.filter((t) => t.y < grid.Y && t.volume > 0.01);
  const push = (e: ScoreEvent) => {
    if (events.length < MAX_EVENTS) events.push(e);
    else truncated = true;
  };
  for (let x = 0; x < grid.X; x++)
    for (const t of tracks)
      for (let z = 0; z < grid.Z; z++) {
        const c = at(grid, x, t.y, z);
        const base = { step: x, track: t.y, z, hold: 1, accent: false };
        if (c === 'K') push({ ...base, voice: 'kick', gain: t.volume });
        else if (c === 'H') push({ ...base, voice: z > 3 ? 'openhat' : 'hat', gain: t.volume * 0.65 });
        else if (c === 'C') push({ ...base, voice: 'snare', gain: t.volume * 0.8 });
        else if (Object.hasOwn(FORCE, c)) {
          // A sustain goes on sounding what came before it; on its own it is a short note.
          if (c === 'S' && x > 0 && 'NAS'.includes(at(grid, x - 1, t.y, z))) continue;
          let hold = 1;
          if (c === 'N' || c === 'A') while (x + hold < grid.X && at(grid, x + hold, t.y, z) === 'S') hold++;
          const accent = c === 'A';
          // An accent on the lowest bass is also a kick.
          if (accent && z === 0 && t.instrument === 'bass') push({ ...base, voice: 'kick', gain: t.volume });
          push({ ...base, voice: t.instrument, midi: pitchOf(z, settings, t.instrument), hold, gain: t.volume * FORCE[c], accent });
        }
      }
  return { steps: grid.X, settings, events, truncated };
}

/** What a program is for in the game (ADR-0126), in `models/index.json → suono`. Without it the program is for the SoundLab only. */
export interface SoundPurpose {
  uso: 'musica' | 'effetto';
  /** Music: the environments it belongs to (whose id contains one of these); none: any. */
  ambienti?: string[];
  /** Music: the moments of the day it plays in; none: any. */
  momenti?: string[];
  /** Music: it plays beyond the carpet, and only there. */
  oltre?: boolean;
  /** Effect: the names it answers to. */
  effetti?: string[];
}

export interface SoundProgram {
  id: string;
  nome?: string;
  xml: string;
  suono?: SoundPurpose;
}

const strings = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : undefined);

/** The index is a file of the universe: what does not read as a purpose is no purpose. */
function soundPurpose(raw: unknown): SoundPurpose | undefined {
  const r = raw as Record<string, unknown> | null | undefined;
  if (!r || typeof r !== 'object' || (r.uso !== 'musica' && r.uso !== 'effetto')) return undefined;
  const ambienti = strings(r.ambienti);
  const momenti = strings(r.momenti);
  const effetti = strings(r.effetti);
  return { uso: r.uso, ...(ambienti ? { ambienti } : {}), ...(momenti ? { momenti } : {}), ...(r.oltre === true ? { oltre: true } : {}), ...(effetti ? { effetti } : {}) };
}

/** Whether a program names an environment: its id, or one of the Cartographer's whose id contains it («castello_nero» is a castle). */
/**
 * Whether a program names an environment: exactly, or as part of its id; an environment of the seed also by its word of the world, which
 * the Cartographer's ids still carry (T307a: `castle` plays in `castello_nero`).
 */
export const namesEnvironment = (p: SoundProgram, environment: string | undefined): boolean =>
  !!environment && !!p.suono?.ambienti?.some((a) => environment === a || environment.includes(a) || environment.includes(italianName('ambienti', a)));

/** The sound programs among a universe's files: their ids and index entries, in the index's order. */
export function soundPrograms(files: Record<string, string>): SoundProgram[] {
  let index: Record<string, { classe?: string; nome?: string; suono?: unknown }>;
  try {
    index = JSON.parse(files['models/index.json'] ?? '{}');
  } catch {
    return [];
  }
  return Object.entries(index).flatMap(([id, info]) => {
    const xml = files[`models/${id}.xml`];
    if (info?.classe !== SOUND_CLASS || xml === undefined) return [];
    const suono = soundPurpose(info.suono);
    return [{ id, nome: info.nome, xml, ...(suono ? { suono } : {}) }];
  });
}
