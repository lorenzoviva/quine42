// What a sound program plays and what is wrong with it, as text, for who cannot hear (T223, ADR-0125). It reads the score and the very samples the player gets (synth.ts):
// no second idea of the sound, no audio API, no clock, no random numbers. Same program and seeds, same report, to the byte.
//
// The thresholds come from the presets (lab/banco/suono.md says the numbers and what measures cannot say). The validator uses them too: `soundErrors` in validator.ts.

import { run } from './engine';
import type { MjxModel } from './model';
import { SCALES, type Instrument, type Score, type ScoreEvent, type SoundSettings, type SoundTrack, scoreOf } from './sound';
import { renderScore, SOUND_LIMITS, SOUND_MAX_STEPS, type RenderedSound } from './synth';

/** Sixteenths in a bar. Below one bar a program is an effect, not a piece: `piatto` and `ripetitivo` do not apply. */
export const BAR_STEPS = 16;

export const SOUND_DEFECTS = ['vuoto', 'piatto', 'ripetitivo', 'stonato', 'fuori volume', 'giuntura'] as const;
export type SoundDefect = (typeof SOUND_DEFECTS)[number];

/**
 * Where a measure stops being fine. Calibrated on the presets (2000 seeds for the score, 150 for the signal: lab/banco/suono.md): a rare seed of a good program can go past a limit
 * (a fractal repeats itself once in a while), so a limit speaks only when more than half of the seeds pass it.
 */
export const SOUND_THRESHOLDS = {
  /** vuoto: fewer events than this in a bar; a share of the loop under SILENCE_DB; a share of the notes nobody can hear. */
  minEventsPerBar: 4,
  maxSilence: 0.75,
  maxInaudible: 0.25,
  /** piatto: fewer different notes than this; fewer dB than this between the quiet and the loud steps; one band with nearly all the energy. */
  minPitches: 3,
  minDynamics: 3,
  maxBandShare: 0.97,
  /** ripetitivo: the score repeats after half of it or less; the seeds differ by less than this. */
  repeatMatch: 0.95,
  minSeedDistance: 0.05,
  /** stonato: a share of the notes off the declared scale; a share of the simultaneous pairs on a semitone or a tritone. */
  minInScale: 0.9,
  maxHarsh: 0.6,
  /** fuori volume: events per step, loudness of the loop in dBFS; the peak before scaling, the share of samples at the ceiling. */
  maxEventsPerStep: 16,
  minRmsDb: -32,
  maxRmsDb: -8,
  minPeakDb: -18,
  maxRawPeak: 3.5,
  maxClipped: 0.001,
  /** giuntura: the jump over the seam, against the largest jumps inside the loop. */
  maxSeam: 1.5,
} as const;

/** Under this a frame is silence. */
const SILENCE_DB = -50;
const SILENCE_FRAME = 0.01;
/** A sample this close to full scale counts as clipped. */
const CLIP_LEVEL = 0.97;
/** MIDI note of 20 Hz. */
const LOWEST_AUDIBLE = 16;
const FLOOR_DB = -120;
/** Intervals that grate, in semitones from 0 to 11: the semitone, the major seventh, the tritone. */
const HARSH = new Set([1, 6, 11]);

const toDb = (x: number) => (x > 0 ? Math.max(FLOOR_DB, 20 * Math.log10(x)) : FLOOR_DB);
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pitchClass = (midi: number) => ((midi % 12) + 12) % 12;
export const noteName = (midi: number) => `${NOTE_NAMES[pitchClass(midi)]}${Math.floor(midi / 12) - 1}`;

// ---------------------------------------------------------------- the score

export interface TrackMeasure {
  y: number;
  instrument: Instrument;
  volume: number;
  /** Notes of the instrument and hits of the drums on this track. */
  notes: number;
  hits: number;
  lowest?: number;
  highest?: number;
  /** Different notes. */
  pitches: number;
  /** Share of the steps where something starts. */
  density: number;
  /** Mean length of a note, in steps. */
  meanHold: number;
  /** Events per bar. */
  perBar: number[];
  /** The smallest shift after which the track repeats itself, in steps (`steps` if it does not). */
  period: number;
}

export interface KeyGuess {
  root: number;
  scale: string;
  /** How well the notes fit it, -1..1. */
  fit: number;
}

export interface ScoreMeasure {
  seed: number;
  finished: boolean;
  truncated: boolean;
  steps: number;
  bars: number;
  events: number;
  /** Share of the steps where something starts, on any track. */
  density: number;
  pitches: number;
  lowest?: number;
  highest?: number;
  /** Share of the notes (by length and force) on the declared scale, on the declared tonic. */
  inScale: number;
  tonicShare: number;
  effective?: KeyGuess;
  declaredFit: number;
  /** Share of the simultaneous pairs of notes a semitone or a tritone apart, over the steps. */
  harsh: number;
  /** Share of the notes below hearing. */
  inaudible: number;
  /** The smallest shift after which the whole score repeats itself. */
  period: number;
  tracks: TrackMeasure[];
}

const isNote = (e: ScoreEvent) => e.midi !== undefined;
/** What a note weighs in the harmony: how long and how strong. */
const weight = (e: ScoreEvent) => e.hold * e.gain;

/** The smallest shift of the loop that lands (nearly) on itself. */
function periodOf(events: readonly ScoreEvent[], steps: number): number {
  if (!events.length) return steps;
  const here = new Set(events.map((e) => `${e.step}:${e.track}:${e.z}:${e.voice}`));
  for (let p = 1; p < steps; p++) {
    if (steps % p) continue;
    let same = 0;
    for (const e of events) if (here.has(`${(e.step + p) % steps}:${e.track}:${e.z}:${e.voice}`)) same++;
    if (same / events.length >= SOUND_THRESHOLDS.repeatMatch) return p;
  }
  return steps;
}

/** The shape of a key: the tonic counts most, then the fifth, the third; off the scale, little. */
function keyTemplate(root: number, scale: readonly number[]): number[] {
  const t = new Array<number>(12).fill(1);
  const degrees = [...new Set(scale.map(pitchClass))];
  for (const d of degrees) t[(root + d) % 12] = 3;
  if (degrees.includes(3)) t[(root + 3) % 12] = 4;
  if (degrees.includes(4)) t[(root + 4) % 12] = 4;
  if (degrees.includes(7)) t[(root + 7) % 12] = 5;
  t[root % 12] = 6;
  return t;
}

function correlation(a: readonly number[], b: readonly number[]): number {
  const mean = (v: readonly number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const ma = mean(a), mb = mean(b);
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    ab += (a[i] - ma) * (b[i] - mb);
    aa += (a[i] - ma) ** 2;
    bb += (b[i] - mb) ** 2;
  }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}

function harshShare(notes: readonly ScoreEvent[], steps: number): number {
  const sounding: ScoreEvent[][] = Array.from({ length: steps }, () => []);
  for (const e of notes) for (let s = e.step; s < Math.min(steps, e.step + e.hold); s++) sounding[s].push(e);
  let pairs = 0, harsh = 0;
  for (const now of sounding)
    for (let i = 0; i < now.length; i++)
      for (let j = i + 1; j < now.length; j++) {
        const w = Math.min(now[i].gain, now[j].gain);
        const interval = pitchClass(now[i].midi! - now[j].midi!);
        if (!interval) continue;
        pairs += w;
        if (HARSH.has(interval)) harsh += w;
      }
  return pairs ? harsh / pairs : 0;
}

/** What a score says, before any sound. */
export function measureScore(score: Score, seed = 0, finished = true): ScoreMeasure {
  const { steps, events, settings } = score;
  const bars = Math.max(1, Math.ceil(steps / BAR_STEPS));
  const notes = events.filter(isNote);
  const midis = notes.map((e) => e.midi!);
  const hist = new Array<number>(12).fill(0);
  for (const e of notes) hist[pitchClass(e.midi!)] += weight(e);
  const total = hist.reduce((s, x) => s + x, 0);
  const declared = new Set(SCALES[settings.scale].map(pitchClass));
  let inScale = 0;
  hist.forEach((w, pc) => {
    if (declared.has(pitchClass(pc - settings.root))) inScale += w;
  });
  let effective: KeyGuess | undefined;
  if (total > 0)
    for (const scale of Object.keys(SCALES))
      for (let root = 0; root < 12; root++) {
        const fit = correlation(hist, keyTemplate(root, SCALES[scale]));
        if (!effective || fit > effective.fit + 1e-12) effective = { root, scale, fit };
      }
  const tracks = settings.tracks.map((t): TrackMeasure => {
    const own = events.filter((e) => e.track === t.y);
    const ownNotes = own.filter(isNote);
    const perBar = new Array<number>(bars).fill(0);
    for (const e of own) perBar[Math.floor(e.step / BAR_STEPS)]++;
    const m = ownNotes.map((e) => e.midi!);
    return {
      y: t.y,
      instrument: t.instrument,
      volume: t.volume,
      notes: ownNotes.length,
      hits: own.length - ownNotes.length,
      ...(m.length ? { lowest: Math.min(...m), highest: Math.max(...m) } : {}),
      pitches: new Set(m).size,
      density: steps ? new Set(own.map((e) => e.step)).size / steps : 0,
      meanHold: ownNotes.length ? ownNotes.reduce((s, e) => s + e.hold, 0) / ownNotes.length : 0,
      perBar,
      period: periodOf(own, steps),
    };
  });
  return {
    seed,
    finished,
    truncated: score.truncated,
    steps,
    bars,
    events: events.length,
    density: steps ? new Set(events.map((e) => e.step)).size / steps : 0,
    pitches: new Set(midis).size,
    ...(midis.length ? { lowest: Math.min(...midis), highest: Math.max(...midis) } : {}),
    inScale: total ? inScale / total : 1,
    tonicShare: total ? hist[pitchClass(settings.root)] / total : 0,
    ...(effective ? { effective } : {}),
    declaredFit: total ? correlation(hist, keyTemplate(pitchClass(settings.root), SCALES[settings.scale])) : 0,
    harsh: harshShare(notes, steps),
    inaudible: notes.length ? midis.filter((m) => m < LOWEST_AUDIBLE).length / notes.length : 0,
    period: periodOf(events, steps),
    tracks,
  };
}

// ---------------------------------------------------------------- the signal

export const SPECTRUM_BANDS = [
  { name: 'sub', low: 0, high: 60 },
  { name: 'bassi', low: 60, high: 250 },
  { name: 'medio-bassi', low: 250, high: 500 },
  { name: 'medi', low: 500, high: 2000 },
  { name: 'medio-alti', low: 2000, high: 4000 },
  { name: 'alti', low: 4000, high: 8000 },
  { name: 'brillanza', low: 8000, high: Infinity },
] as const;

export interface SignalMeasure {
  /** The loop, in seconds. */
  seconds: number;
  peak: number;
  /** The peak before the synthesizer scaled it (at most `peak` when it did not). */
  rawPeak: number;
  rmsDb: number;
  peakDb: number;
  /** Peak over RMS, in dB. */
  crestDb: number;
  /** Share of samples at full scale. */
  clipped: number;
  /** Share of the loop in silence, and the longest silence in seconds. */
  silence: number;
  longestSilence: number;
  /** dB between the quieter (10th percentile) and the louder (90th) steps. */
  dynamics: number;
  /** Share of the energy per band, in the order of SPECTRUM_BANDS. */
  bands: number[];
  /** The centre of the spectrum, in Hz. */
  centroid: number;
  /** The jump over the seam of the loop, its size against the largest jumps inside it (1 = like them). */
  seamJump: number;
  seam: number;
}

const FFT_SIZE = 4096;
const MAX_FRAMES = 64;

/** Radix-2 in place. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const step = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const c = Math.cos(step * k), s = Math.sin(step * k);
        const a = i + k, b = a + len / 2;
        const tr = re[b] * c - im[b] * s;
        const ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
  }
}

function spectrum(loop: Float32Array, rate: number): { bands: number[]; centroid: number } {
  const power = new Float64Array(FFT_SIZE / 2);
  const hop = Math.max(FFT_SIZE / 2, Math.floor(loop.length / MAX_FRAMES));
  const re = new Float64Array(FFT_SIZE), im = new Float64Array(FFT_SIZE);
  for (let start = 0; start === 0 || start + FFT_SIZE <= loop.length; start += hop) {
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = (loop[start + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FFT_SIZE));
      im[i] = 0;
    }
    fft(re, im);
    for (let i = 0; i < power.length; i++) power[i] += re[i] * re[i] + im[i] * im[i];
  }
  const bands = SPECTRUM_BANDS.map(() => 0);
  let total = 0, moment = 0;
  for (let i = 1; i < power.length; i++) {
    const f = (i * rate) / FFT_SIZE;
    const b = SPECTRUM_BANDS.findIndex((x) => f < x.high);
    bands[b] += power[i];
    total += power[i];
    moment += power[i] * f;
  }
  return { bands: bands.map((x) => (total ? x / total : 0)), centroid: total ? moment / total : 0 };
}

/** What the loop of a rendered sound measures. */
export function measureSignal(sound: Pick<RenderedSound, 'samples' | 'sampleRate' | 'loopStart' | 'loopEnd'> & { rawPeak?: number }, stepSamples?: number): SignalMeasure {
  const { samples, sampleRate: rate, loopStart, loopEnd } = sound;
  const loop = samples.subarray(loopStart, loopEnd);
  const n = loop.length;
  let peak = 0, energy = 0, clipped = 0;
  const slews = new Float32Array(Math.max(0, n - 1));
  for (let i = 0; i < n; i++) {
    const a = Math.abs(loop[i]);
    if (a > peak) peak = a;
    energy += a * a;
    if (a >= CLIP_LEVEL) clipped++;
    if (i) slews[i - 1] = Math.abs(loop[i] - loop[i - 1]);
  }
  const rms = n ? Math.sqrt(energy / n) : 0;

  const frame = Math.max(1, Math.round(SILENCE_FRAME * rate));
  const quiet = 10 ** (SILENCE_DB / 20);
  let frames = 0, silent = 0, streak = 0, longest = 0;
  for (let s = 0; s < n; s += frame) {
    let e = 0;
    const end = Math.min(n, s + frame);
    for (let i = s; i < end; i++) e += loop[i] * loop[i];
    frames++;
    if (Math.sqrt(e / (end - s)) < quiet) {
      silent++;
      streak++;
      longest = Math.max(longest, streak);
    } else streak = 0;
  }

  const stepLen = Math.max(1, Math.round(stepSamples ?? rate / 8));
  const levels: number[] = [];
  for (let s = 0; s < n; s += stepLen) {
    let e = 0;
    const end = Math.min(n, s + stepLen);
    for (let i = s; i < end; i++) e += loop[i] * loop[i];
    levels.push(toDb(Math.sqrt(e / (end - s))));
  }
  levels.sort((a, b) => a - b);
  const level = (p: number) => levels[Math.min(levels.length - 1, Math.floor(p * levels.length))] ?? FLOOR_DB;

  const sorted = Float32Array.from(slews).sort();
  const typical = sorted.length ? sorted[Math.floor(sorted.length * 0.999)] : 0;
  const seamJump = n ? Math.abs(loop[0] - loop[n - 1]) : 0;
  return {
    seconds: n / rate,
    peak,
    rawPeak: Math.max(peak, sound.rawPeak ?? 0),
    rmsDb: toDb(rms),
    peakDb: toDb(peak),
    crestDb: rms ? toDb(peak) - toDb(rms) : 0,
    clipped: n ? clipped / n : 0,
    silence: frames ? silent / frames : 1,
    longestSilence: (longest * frame) / rate,
    dynamics: level(0.9) - level(0.1),
    ...spectrum(loop, rate),
    seamJump,
    seam: typical > 1e-9 ? seamJump / typical : 0,
  };
}

// ---------------------------------------------------------------- the program

export interface SeedMeasure {
  score: ScoreMeasure;
  /** Absent when only the score was asked for, or the program did not finish. */
  signal?: SignalMeasure;
}

export interface SoundIssue {
  defect: SoundDefect;
  /** The seeds it shows on; empty when it is about all of them together. */
  seeds: number[];
  /** Italian, for who wrote the program. */
  message: string;
}

export interface SoundReport {
  name?: string;
  settings: SoundSettings;
  seeds: SeedMeasure[];
  /** Mean distance between the scores of two seeds, 0 identical, 1 nothing in common; overall and per track (undefined with one seed). */
  seedDistance?: number;
  trackDistance: Array<{ y: number; distance: number }>;
  /** Fewer steps than a bar: an effect, not a piece. */
  effect: boolean;
  issues: SoundIssue[];
  /** The score of the first seed, for the text. */
  first: Score;
}

export interface AnalyzeOptions {
  /** The seeds of the program, default 1 to 5. */
  seeds?: readonly number[];
  /** The validator's price: render only the first seed, and only if the scores alone found nothing. Default false. */
  frugal?: boolean;
  /** Milliseconds a run of the program may take; none by default, as a count of steps already stops it. */
  deadline?: number;
  /** Passes of the render, default 2. */
  loops?: number;
}

export const DEFAULT_SOUND_SEEDS: readonly number[] = [1, 2, 3, 4, 5];

function distance(a: readonly ScoreEvent[], b: readonly ScoreEvent[]): number {
  const key = (e: ScoreEvent) => `${e.step}:${e.track}:${e.z}:${e.voice}`;
  const A = new Set(a.map(key)), B = new Set(b.map(key));
  let both = 0;
  for (const k of A) if (B.has(k)) both++;
  const any = A.size + B.size - both;
  return any ? 1 - both / any : 0;
}

function meanDistance(lists: ReadonlyArray<readonly ScoreEvent[]>): number | undefined {
  if (lists.length < 2) return undefined;
  let sum = 0, pairs = 0;
  for (let i = 0; i < lists.length; i++)
    for (let j = i + 1; j < lists.length; j++) {
      sum += distance(lists[i], lists[j]);
      pairs++;
    }
  return sum / pairs;
}

const num = (x: number, digits = 2) => x.toFixed(digits);
const pct = (x: number) => `${Math.round(x * 100)} %`;

/** What is wrong, by thresholds. Every defect at most once, in the order of SOUND_DEFECTS; each message says the number and the limit. */
export function soundIssues(report: Pick<SoundReport, 'seeds' | 'settings' | 'seedDistance' | 'effect'>): SoundIssue[] {
  const T = SOUND_THRESHOLDS;
  const out: SoundIssue[] = [];
  const seeds = report.seeds;
  const some = seeds.filter((m) => m.score.events > 0);
  const listened = some.filter((m) => m.signal);
  const say = (defect: SoundDefect, bad: SeedMeasure[], text: (m: SeedMeasure) => string) => out.push({ defect, seeds: bad.map((m) => m.score.seed), message: text(bad[0]) });
  /** A limit speaks when most of the seeds that measure it pass it; the first of them says the number. */
  const flag = (defect: SoundDefect, test: (m: SeedMeasure) => boolean, text: (m: SeedMeasure) => string, among: SeedMeasure[] = some) => {
    const bad = among.filter(test);
    if (bad.length * 2 > among.length) say(defect, bad, text);
  };
  const flagHeard = (defect: SoundDefect, test: (s: SignalMeasure) => boolean, text: (s: SignalMeasure) => string) => flag(defect, (m) => test(m.signal!), (m) => text(m.signal!), listened);

  // These are not matters of chance: one seed is enough.
  const unfinished = seeds.filter((m) => !m.score.finished);
  const silent = seeds.filter((m) => m.score.finished && !m.score.events);
  if (unfinished.length) say('vuoto', unfinished, () => 'il programma non finisce: ogni crescita deve avere steps');
  if (silent.length) say('vuoto', silent, () => 'la partitura è vuota: nessuna lettera che suona (N S A G K H C) su una traccia di <sound>');

  if (!report.effect) flag('vuoto', (m) => m.score.events / m.score.bars < T.minEventsPerBar, (m) => `${num(m.score.events / m.score.bars, 1)} eventi a battuta: ne servono almeno ${T.minEventsPerBar}`);
  for (const t of report.settings.tracks) {
    if (t.volume <= 0.01) continue;
    flag('vuoto', (m) => m.score.tracks.some((x) => x.y === t.y && !x.notes && !x.hits), () => `la traccia y=${t.y} (${t.instrument}) è dichiarata e resta muta`);
  }
  flag('vuoto', (m) => m.score.inaudible > T.maxInaudible, (m) => `${pct(m.score.inaudible)} delle note sta sotto i 20 Hz: alza root`);
  flagHeard('vuoto', (g) => g.silence > T.maxSilence, (g) => `${pct(g.silence)} del ciclo è silenzio (al più ${pct(T.maxSilence)})`);

  if (!report.effect) {
    flag('piatto', (m) => m.score.tracks.some((t) => t.notes > 0) && m.score.pitches < T.minPitches, (m) => `${m.score.pitches} note diverse in tutto: ne servono almeno ${T.minPitches}`);
    flagHeard('piatto', (g) => g.dynamics < T.minDynamics, (g) => `${num(g.dynamics, 1)} dB tra i passi deboli e quelli forti: ne servono almeno ${T.minDynamics}`);
    flagHeard('piatto', (g) => Math.max(...g.bands) > T.maxBandShare, (g) => {
      const i = g.bands.indexOf(Math.max(...g.bands));
      return `${pct(g.bands[i])} dell'energia nella banda «${SPECTRUM_BANDS[i].name}» (al più ${pct(T.maxBandShare)}): guarda cutoff e root`;
    });
    flag('ripetitivo', (m) => m.score.events > 1 && m.score.period * 2 <= m.score.steps, (m) => `la partitura si ripete ogni ${m.score.period} passi su ${m.score.steps}: il ciclo dice una volta sola ciò che ripete`);
    if (report.seedDistance !== undefined && report.seedDistance < T.minSeedDistance && some.length > 1)
      out.push({ defect: 'ripetitivo', seeds: [], message: `i semi danno quasi la stessa partitura (distanza ${num(report.seedDistance)}, almeno ${num(T.minSeedDistance)}): il programma non estrae niente` });
  }

  flag('stonato', (m) => m.score.inScale < T.minInScale, (m) => `${pct(m.score.inScale)} delle note sulla scala dichiarata (almeno ${pct(T.minInScale)}): le altezze sbattono sul tetto MIDI, abbassa root`);
  flag('stonato', (m) => m.score.harsh > T.maxHarsh, (m) => `${pct(m.score.harsh)} delle coppie di note insieme a un semitono o un tritono (al più ${pct(T.maxHarsh)})`);

  flag('fuori volume', (m) => m.score.truncated || m.score.events > m.score.steps * T.maxEventsPerStep, (m) => `troppe note: ${num(m.score.events / m.score.steps, 1)} eventi a passo (al più ${T.maxEventsPerStep})${m.score.truncated ? ', e la coda è tagliata' : ''}`);
  flagHeard('fuori volume', (g) => g.rmsDb < T.minRmsDb, (g) => `RMS ${num(g.rmsDb, 1)} dBFS: troppo piano (almeno ${T.minRmsDb})`);
  flagHeard('fuori volume', (g) => g.rmsDb > T.maxRmsDb, (g) => `RMS ${num(g.rmsDb, 1)} dBFS: troppo forte (al più ${T.maxRmsDb})`);
  flagHeard('fuori volume', (g) => g.peakDb < T.minPeakDb, (g) => `picco ${num(g.peakDb, 1)} dBFS: troppo piano (almeno ${T.minPeakDb})`);
  flagHeard('fuori volume', (g) => g.rawPeak > T.maxRawPeak, (g) => `picco grezzo ${num(g.rawPeak)} prima della scalatura (al più ${T.maxRawPeak}): tutto il resto è stato abbassato`);
  flagHeard('fuori volume', (g) => g.clipped > T.maxClipped, (g) => `${num(g.clipped * 100, 2)} % dei campioni al limite (al più ${num(T.maxClipped * 100, 2)} %)`);

  flagHeard('giuntura', (g) => g.seam > T.maxSeam, (g) => `il salto alla giuntura è ${num(g.seam, 1)} volte i salti più grandi del ciclo (al più ${T.maxSeam}): si sente un clic a ogni giro`);

  // Every defect once, its first reason speaking and all the seeds together.
  const merged = new Map<SoundDefect, SoundIssue>();
  for (const i of out) {
    const had = merged.get(i.defect);
    if (!had) merged.set(i.defect, { ...i, seeds: [...i.seeds] });
    else {
      had.seeds = [...new Set([...had.seeds, ...i.seeds])].sort((a, b) => a - b);
      if (!had.message.includes(i.message)) had.message += `; ${i.message}`;
    }
  }
  return SOUND_DEFECTS.flatMap((d) => (merged.has(d) ? [merged.get(d)!] : []));
}

/** A compiled sound program + seeds → what it plays and what is wrong. Pure: no clock decides anything unless `deadline` is given. */
export function analyzeSound(m: Pick<MjxModel, 'program' | 'sound'>, opts: AnalyzeOptions = {}): SoundReport {
  if (!m.sound) throw new Error('non è un programma sonoro: manca <sound>');
  const settings = m.sound;
  const seedList = opts.seeds?.length ? opts.seeds : DEFAULT_SOUND_SEEDS;
  const seeds: SeedMeasure[] = [];
  const scores = seedList.map((seed) => {
    const r = run(m.program, seed, SOUND_MAX_STEPS, SOUND_LIMITS, opts.deadline === undefined ? {} : { deadline: opts.deadline });
    const score = scoreOf(r.grid, settings);
    seeds.push({ score: measureScore(score, seed, r.finished) });
    return score;
  });
  const seedDistance = meanDistance(scores.map((s) => s.events));
  const trackDistance = settings.tracks.flatMap((t) => {
    const d = meanDistance(scores.map((s) => s.events.filter((e) => e.track === t.y)));
    return d === undefined ? [] : [{ y: t.y, distance: d }];
  });
  const effect = (scores[0]?.steps ?? 0) < BAR_STEPS;
  const base = { settings, seeds, ...(seedDistance === undefined ? {} : { seedDistance }), effect };
  // The score costs nothing and the samples do: what the score already refuses is not rendered.
  const renders = opts.frugal ? (soundIssues(base).length ? 0 : 1) : seeds.length;
  seeds.slice(0, renders).forEach((seed, i) => {
    if (!seed.score.finished || !seed.score.events) return;
    const sound = renderScore(scores[i], seed.score.seed, { loops: opts.loops ?? 2 });
    seed.signal = measureSignal(sound, (60 / settings.bpm / 4) * sound.sampleRate);
  });
  return { ...base, trackDistance, issues: soundIssues(base), first: scores[0] };
}

// ---------------------------------------------------------------- the text

const range = (lo?: number, hi?: number) => (lo === undefined || hi === undefined ? '-' : lo === hi ? noteName(lo) : `${noteName(lo)}..${noteName(hi)} (${hi - lo} semitoni)`);
const keyName = (root: number, scale: string) => `${NOTE_NAMES[pitchClass(root)]} ${scale}`;
/** How many bars the text writes out: past them a score says the same in numbers. */
const MAX_BARS_SHOWN = 8;

const DRUM: Partial<Record<ScoreEvent['voice'], string>> = { kick: 'K', hat: 'H', openhat: 'O', snare: 'C' };

/** One event as a word: D4 a note, D4! an accent, d4 a ghost, ~n its sustains; K H O C the drums. */
function eventWord(e: ScoreEvent, t: SoundTrack): string {
  const drum = DRUM[e.voice];
  if (drum) return drum;
  const name = noteName(e.midi!);
  const ghost = !e.accent && e.gain < t.volume * 0.5;
  return `${ghost ? name.toLowerCase() : name}${e.accent ? '!' : ''}${e.hold > 1 ? `~${e.hold}` : ''}`;
}

/** The score, track by track and bar by bar, one word per step. */
export function scoreLines(score: Score): string[] {
  const bars = Math.max(1, Math.ceil(score.steps / BAR_STEPS));
  const out: string[] = [];
  for (let b = 0; b < Math.min(bars, MAX_BARS_SHOWN); b++) {
    if (bars > 1) out.push(`battuta ${b + 1}:`);
    for (const t of score.settings.tracks) {
      const words: string[] = [];
      for (let s = b * BAR_STEPS; s < Math.min(score.steps, (b + 1) * BAR_STEPS); s++) {
        const now = score.events.filter((e) => e.step === s && e.track === t.y);
        words.push(now.length ? now.map((e) => eventWord(e, t)).join('+') : '.');
      }
      out.push(`  y${t.y} ${t.instrument}: ${words.join(' ')}`);
    }
  }
  if (bars > MAX_BARS_SHOWN) out.push(`… altre ${bars - MAX_BARS_SHOWN} battute`);
  return out;
}

/** The report in text. Numbers at a fixed precision and nothing from the clock: the same program and seeds give the same bytes. */
export function soundReportText(r: SoundReport): string {
  const s = r.settings;
  const head = r.seeds[0].score;
  const seconds = (head.steps * 60) / s.bpm / 4;
  const lines: string[] = [
    `# Suono${r.name ? `: ${r.name}` : ''} (semi ${r.seeds.map((m) => m.score.seed).join(', ')})`,
    '',
    `${head.steps} passi, ${head.bars} ${head.bars === 1 ? 'battuta' : 'battute'}, ciclo di ${num(seconds)} s a ${num(s.bpm, 0)} bpm${r.effect ? ' (meno di una battuta: un effetto, non si misura come un brano)' : ''}.`,
    `Dichiarata: ${keyName(s.root, s.scale)} (root ${s.root}); swing ${num(s.swing)}, cutoff ${num(s.cutoff, 0)} Hz, space ${num(s.space)}.`,
    `Tracce: ${s.tracks.map((t) => `y${t.y} ${t.instrument} ${num(t.volume)}`).join(', ')}.`,
    '',
    '## Verdetto',
    ...(r.issues.length ? r.issues.map((i) => `- ${i.defect.toUpperCase()}${i.seeds.length ? ` (semi ${i.seeds.join(', ')})` : ''}: ${i.message}`) : ['Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.']),
    '',
    `## La partitura, seme ${head.seed}`,
    'Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.',
    ...scoreLines(r.first),
    '',
    '## Per seme',
    '| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...r.seeds.map(({ score: m }) => `| ${m.seed}${m.finished ? '' : ' (non finito)'}${m.truncated ? ' (tagliato)' : ''} | ${m.events} | ${pct(m.density)} | ${m.pitches} | ${range(m.lowest, m.highest)} | ${pct(m.inScale)} | ${pct(m.tonicShare)} | ${m.effective ? `${keyName(m.effective.root, m.effective.scale)} (${num(m.effective.fit)})` : '-'} | ${num(m.declaredFit)} | ${pct(m.harsh)} | ${m.period}/${m.steps} |`),
    '',
    '## Per traccia, per seme',
    '| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...r.seeds.flatMap(({ score: m }) => m.tracks.map((t) => `| ${m.seed} | y${t.y} ${t.instrument} | ${t.notes} | ${t.hits} | ${t.perBar.slice(0, MAX_BARS_SHOWN).join(' ')}${t.perBar.length > MAX_BARS_SHOWN ? ' …' : ''} | ${t.pitches} | ${range(t.lowest, t.highest)} | ${pct(t.density)} | ${num(t.meanHold, 1)} | ${t.period}/${m.steps} |`)),
    '',
    '## Tra i semi',
    r.seedDistance === undefined ? 'Un seme solo: nessuna varianza da dire.' : `Distanza media tra le partiture (0 uguali, 1 niente in comune): ${num(r.seedDistance)}; ${r.trackDistance.map((t) => `y${t.y} ${num(t.distance)}`).join(', ')}.`,
  ];
  const heard = r.seeds.filter((m) => m.signal);
  if (heard.length) {
    lines.push(
      '',
      '## Il segnale (il ciclo)',
      '| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |',
      '|---|---|---|---|---|---|---|---|---|---|---|---|',
      ...heard.map(({ score, signal: g }) => `| ${score.seed} | ${num(g!.seconds)} s | ${num(g!.peakDb, 1)} | ${num(g!.rawPeak)} | ${num(g!.rmsDb, 1)} | ${num(g!.crestDb, 1)} | ${num(g!.clipped * 100, 2)} % | ${pct(g!.silence)} | ${num(g!.longestSilence)} s | ${num(g!.dynamics, 1)} | ${num(g!.centroid, 0)} | ${num(g!.seam)} |`),
      '',
      '## Lo spettro (quota di energia per banda)',
      `| seme | ${SPECTRUM_BANDS.map((b) => b.name).join(' | ')} |`,
      `|---|${SPECTRUM_BANDS.map(() => '---').join('|')}|`,
      ...heard.map(({ score, signal: g }) => `| ${score.seed} | ${g!.bands.map(pct).join(' | ')} |`),
    );
  }
  return `${lines.join('\n')}\n`;
}
