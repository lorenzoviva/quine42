// The one source of sound (T221, ADR-0123): score + seed → samples. A pure function, with no audio API, no clock and no random numbers of its own: it gives the same
// numbers in Node, in a worker and in the page, and the page plays those numbers, so what an agent measures is what the player hears.
//
// It redoes in plain arithmetic the Web Audio graph of the SoundLab, the sound the author chose (docs/userchats/mj_3d_soundlab_…html):
//   voices → master lowpass ─┬───────────────────────────────┬→ compressor → out
//                            └→ delay ⇄ bandpass + feedback → wet
// The numbers below are the SoundLab's. Filters follow the Web Audio formulas (Q in dB for lowpass and highpass), the compressor the static curve browsers use.

import { Rng } from '../kernel/rng';
import { Mj3Error, run, type GridLimits } from './engine';
import { compileMjx } from './model';
import { scoreOf, type Score, type ScoreEvent } from './sound';

export const SAMPLE_RATE = 44_100;
/** The longest sound a render gives: a program can say many steps and few beats per minute. */
export const MAX_SECONDS = 120;
/** Seconds of voices a render will synthesize, summed: beyond them the later ones stay silent (and the sound says `truncated`). */
const MAX_VOICE_SECONDS = 1200;
/** A held note stops growing here. */
const MAX_HOLD_SECONDS = 8;
/** What comes after the last pass, for the tails of the voices and of the delay. */
const TAIL_SECONDS = 1;
/** Above this peak the whole sound is scaled down: never clipped, whatever the program wrote. */
const CEILING = 0.98;

/** A grid for a sound: a map can grow it, but it is a score. */
export const SOUND_LIMITS: GridLimits = { side: 256, cells: 1 << 20 };
/** The steps a sound program may take. A count and not a time: the clock must not choose the notes. */
export const SOUND_MAX_STEPS = 200_000;

export interface RenderedSound {
  /** Mono, -1..1. */
  samples: Float32Array;
  sampleRate: number;
  /** Where the loop runs: the last pass, which already holds the tails of the one before. */
  loopStart: number;
  loopEnd: number;
  /** Something was left out to stay within the limits. */
  truncated: boolean;
}

export interface RenderOptions {
  sampleRate?: number;
  /** Passes of the loop, default 2 (one to play the tails into, one to loop). */
  loops?: number;
}

const TWO_PI = 2 * Math.PI;
const dbToLinear = (db: number) => 10 ** (db / 20);
const linearToDb = (x: number) => 20 * Math.log10(x);

// ---- automation: setValueAtTime, linearRampToValueAtTime, exponentialRampToValueAtTime ----

type Segment = readonly ['lin' | 'exp', number, number];

/** A parameter over a voice's time, read forward: starts at `v0`; every segment says how it reaches a value at a time; after the last one it stays. */
function ramp(v0: number, segments: readonly Segment[]): (t: number) => number {
  let i = 0;
  let t0 = 0;
  let from = v0;
  return (t) => {
    while (i < segments.length && t >= segments[i][2]) {
      from = segments[i][1];
      t0 = segments[i][2];
      i++;
    }
    if (i === segments.length) return from;
    const [kind, to, t1] = segments[i];
    const u = (t - t0) / (t1 - t0);
    return kind === 'lin' ? from + (to - from) * u : from * (to / from) ** u;
  };
}

// ---- filters, as the Web Audio spec computes them ----

class Biquad {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private z1 = 0;
  private z2 = 0;
  constructor(private type: 'lowpass' | 'highpass' | 'bandpass', private q: number, private sampleRate: number, freq?: number) {
    if (freq !== undefined) this.set(freq);
  }
  set(freq: number): void {
    const w0 = (TWO_PI * Math.min(freq, this.sampleRate * 0.49)) / this.sampleRate;
    const cos = Math.cos(w0);
    const sin = Math.sin(w0);
    // Lowpass and highpass read Q in dB, the bandpass as a plain Q.
    const alpha = this.type === 'bandpass' ? sin / (2 * this.q) : sin / (2 * dbToLinear(this.q));
    const a0 = 1 + alpha;
    if (this.type === 'lowpass') {
      this.b0 = this.b2 = (1 - cos) / 2 / a0;
      this.b1 = (1 - cos) / a0;
    } else if (this.type === 'highpass') {
      this.b0 = this.b2 = (1 + cos) / 2 / a0;
      this.b1 = -(1 + cos) / a0;
    } else {
      this.b0 = alpha / a0;
      this.b1 = 0;
      this.b2 = -alpha / a0;
    }
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  tick(x: number): number {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

/** A moving filter's frequency is read every this many samples: under a millisecond. */
const CONTROL_EVERY = 32;

// ---- oscillators: band-limited as the browser's are, starting where the browser's start ----

/** The correction that keeps a jump from aliasing (PolyBLEP). */
function blep(t: number, dt: number): number {
  if (t < dt) {
    const u = t / dt;
    return u + u - u * u - 1;
  }
  if (t > 1 - dt) {
    const u = (t - 1) / dt;
    return u * u + u + u + 1;
  }
  return 0;
}

const wrap01 = (p: number) => p - Math.floor(p);
const sawAt = (phase: number, dt: number) => {
  const t = wrap01(phase + 0.5);
  return 2 * t - 1 - blep(t, dt);
};
const squareAt = (phase: number, dt: number) => (phase < 0.5 ? 1 : -1) + blep(phase, dt) - blep(wrap01(phase + 0.5), dt);
const triangleAt = (phase: number) => (phase < 0.25 ? 4 * phase : phase < 0.75 ? 2 - 4 * phase : 4 * phase - 4);

// ---- voices: each writes itself into the bus, at its own time ----

interface Bus {
  out: Float64Array;
  rate: number;
  noise: Float32Array;
}

/** Adds `seconds` of a voice from sample `start`; `f` gets the voice's time and its sample number. */
function write(bus: Bus, start: number, seconds: number, f: (t: number, n: number) => number): void {
  const n = Math.min(Math.ceil(seconds * bus.rate), bus.out.length - start);
  for (let i = 0; i < n; i++) bus.out[start + i] += f(i / bus.rate, i);
}

const ZERO = 0.0001;

function lead(bus: Bus, start: number, freq: number, dur: number, gain: number, accent: boolean): void {
  const pitch = accent ? ramp(freq * 0.96, [['exp', freq, 0.035]]) : () => freq;
  const cut = ramp(accent ? freq * 7 : freq * 4, [['exp', Math.max(300, freq * 1.4), dur]]);
  const amp = ramp(ZERO, [['lin', Math.max(ZERO, gain * 0.32), 0.008], ['exp', ZERO, dur + 0.04]]);
  const vcf = new Biquad('lowpass', accent ? 6.5 : 2.5, bus.rate);
  const subDt = (freq * 0.5) / bus.rate;
  let ph = 0;
  write(bus, start, dur + 0.05, (t, n) => {
    if (n % CONTROL_EVERY === 0) vcf.set(cut(t));
    const dt = pitch(t) / bus.rate;
    const osc = accent ? sawAt(ph, dt) : squareAt(ph, dt);
    ph = wrap01(ph + dt);
    return vcf.tick(osc + triangleAt(wrap01(subDt * n))) * amp(t);
  });
}

function pad(bus: Bus, start: number, freq: number, dur: number, gain: number, accent: boolean): void {
  const amp = ramp(ZERO, [['lin', Math.max(ZERO, gain * 0.26), Math.min(0.06, dur * 0.3)], ['exp', ZERO, dur + 0.18]]);
  const vcf = new Biquad('lowpass', 1.2, bus.rate, accent ? 2600 : 1500);
  const dt1 = (freq * 2 ** (-9 / 1200)) / bus.rate;
  const dt2 = (freq * 2 ** (9 / 1200)) / bus.rate;
  write(bus, start, dur + 0.2, (t, n) => vcf.tick(sawAt(wrap01(dt1 * n), dt1) + sawAt(wrap01(dt2 * n), dt2)) * amp(t));
}

function bass(bus: Bus, start: number, freq: number, dur: number, gain: number, accent: boolean): void {
  const depth = ramp(accent ? freq * 3.2 : freq * 1.4, [['exp', 1, Math.min(0.15, dur)]]);
  const amp = ramp(ZERO, [['lin', Math.max(ZERO, gain * 0.48), 0.006], ['exp', ZERO, dur + 0.03]]);
  let ph = 0;
  write(bus, start, dur + 0.04, (t) => {
    const s = triangleAt(ph);
    const f = freq + Math.sin(TWO_PI * freq * 2 * t) * depth(t);
    ph = wrap01(ph + f / bus.rate);
    return s * amp(t);
  });
}

function kick(bus: Bus, start: number, gain: number): void {
  const pitch = ramp(145, [['exp', 42, 0.08], ['exp', 28, 0.24]]);
  const amp = ramp(Math.max(ZERO, gain * 0.75), [['exp', ZERO, 0.26]]);
  let ph = 0;
  write(bus, start, 0.27, (t) => {
    const s = Math.sin(TWO_PI * ph);
    ph = wrap01(ph + pitch(t) / bus.rate);
    return s * amp(t);
  });
}

function snare(bus: Bus, start: number, gain: number): void {
  const hp = new Biquad('highpass', 1, bus.rate, 900);
  const noiseAmp = ramp(Math.max(ZERO, gain * 0.45), [['exp', ZERO, 0.16]]);
  write(bus, start, 0.17, (t, n) => hp.tick(bus.noise[n % bus.noise.length]) * noiseAmp(t));
  const pitch = ramp(190, [['exp', 95, 0.07]]);
  const bodyAmp = ramp(Math.max(ZERO, gain * 0.35), [['exp', ZERO, 0.09]]);
  let ph = 0;
  write(bus, start, 0.1, (t) => {
    const s = triangleAt(ph);
    ph = wrap01(ph + pitch(t) / bus.rate);
    return s * bodyAmp(t);
  });
}

function hat(bus: Bus, start: number, gain: number, open: boolean): void {
  const decay = open ? 0.22 : 0.055;
  const hp = new Biquad('highpass', 1, bus.rate, 6500);
  const amp = ramp(Math.max(ZERO, gain * 0.35), [['exp', ZERO, decay]]);
  write(bus, start, decay + 0.01, (t, n) => hp.tick(bus.noise[n % bus.noise.length]) * amp(t));
}

const midiToFreq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** How long a note is held, and how long the whole voice sounds, in seconds. */
function lengths(e: ScoreEvent, stepSeconds: number): { dur: number; total: number } {
  const held = Math.min(MAX_HOLD_SECONDS, Math.max(0.06, e.hold * stepSeconds * 0.92));
  switch (e.voice) {
    case 'lead':
      return { dur: held, total: held + 0.05 };
    case 'pad':
      return { dur: held * 1.15, total: held * 1.15 + 0.2 };
    case 'bass':
      return { dur: held, total: held + 0.04 };
    case 'kick':
      return { dur: held, total: 0.27 };
    case 'snare':
      return { dur: held, total: 0.27 };
    case 'hat':
      return { dur: held, total: 0.065 };
    default:
      return { dur: held, total: 0.23 };
  }
}

function play(bus: Bus, e: ScoreEvent, start: number, dur: number): void {
  const freq = e.midi === undefined ? 0 : midiToFreq(e.midi);
  switch (e.voice) {
    case 'lead':
      return lead(bus, start, freq, dur, e.gain, e.accent);
    case 'pad':
      return pad(bus, start, freq, dur, e.gain * 0.55, e.accent);
    case 'bass':
      return bass(bus, start, freq, dur, e.gain, e.accent);
    case 'kick':
      return kick(bus, start, e.gain);
    case 'snare':
      return snare(bus, start, e.gain);
    default:
      return hat(bus, start, e.gain, e.voice === 'openhat');
  }
}

// ---- the compressor: threshold -14 dB, ratio 4, and the browser's defaults (knee 30 dB, attack 3 ms, release 250 ms, pre-delay 6 ms, makeup) ----

const THRESHOLD_DB = -14;
const KNEE_DB = 30;
const RATIO = 4;
const ATTACK = 0.003;
const RELEASE = 0.25;
const PRE_DELAY = 0.006;

const THRESHOLD = dbToLinear(THRESHOLD_DB);
const KNEE_END_DB = THRESHOLD_DB + KNEE_DB;
const KNEE_END = dbToLinear(KNEE_END_DB);
const kneeCurve = (x: number, k: number) => (x < THRESHOLD ? x : THRESHOLD + (1 - Math.exp(-k * (x - THRESHOLD))) / k);
/** The curve's slope in dB per dB at x. */
function slopeAt(x: number, k: number): number {
  const x2 = x * 1.001;
  return (linearToDb(kneeCurve(x2, k)) - linearToDb(kneeCurve(x, k))) / (linearToDb(x2) - linearToDb(x));
}
/** The knee's sharpness that lands on the ratio's slope where the knee ends. */
const KNEE_K = (() => {
  let lo = 0.1;
  let hi = 10_000;
  let k = 5;
  for (let i = 0; i < 15; i++) {
    if (slopeAt(KNEE_END, k) < 1 / RATIO) hi = k;
    else lo = k;
    k = Math.sqrt(lo * hi);
  }
  return k;
})();
const KNEE_END_OUT_DB = linearToDb(kneeCurve(KNEE_END, KNEE_K));
const compressed = (x: number) => (x < KNEE_END ? kneeCurve(x, KNEE_K) : dbToLinear(KNEE_END_OUT_DB + (linearToDb(x) - KNEE_END_DB) / RATIO));
const MAKEUP = (1 / compressed(1)) ** 0.6;

/** The master chain, in place: lowpass, delay with feedback, compressor. */
function master(bus: Float64Array, rate: number, bpm: number, cutoff: number, space: number): void {
  const lowpass = new Biquad('lowpass', 2.2, rate, cutoff);
  const band = new Biquad('bandpass', 0.7, rate, 1600);
  const delay = new Float64Array(Math.max(1, Math.round((60 / bpm) * 0.75 * rate)));
  const look = new Float64Array(Math.max(1, Math.round(PRE_DELAY * rate)));
  const attack = 1 - Math.exp(-1 / (ATTACK * rate));
  const release = 1 - Math.exp(-1 / (RELEASE * rate));
  let level = 0;
  for (let i = 0; i < bus.length; i++) {
    const dry = lowpass.tick(bus[i]);
    const d = i % delay.length;
    const wet = band.tick(delay[d]);
    delay[d] = dry + wet * 0.42;
    const x = dry + wet * space;
    const size = Math.abs(x);
    level += (size > level ? attack : release) * (size - level);
    const gain = level > THRESHOLD ? compressed(level) / level : 1;
    const l = i % look.length;
    const late = look[l];
    look[l] = x;
    bus[i] = late * gain * MAKEUP;
  }
}

/** Score + seed → samples. The seed gives the noise the snare and the hats are made of: one second of it, each hit from its start, as in the SoundLab. */
export function renderScore(score: Score, seed: number, opts: RenderOptions = {}): RenderedSound {
  const rate = opts.sampleRate ?? SAMPLE_RATE;
  const { bpm, swing, cutoff, space } = score.settings;
  const stepSeconds = 60 / bpm / 4;
  let truncated = score.truncated;
  const steps = Math.min(score.steps, Math.floor(MAX_SECONDS / stepSeconds));
  if (steps < score.steps) truncated = true;
  let passes = Math.max(1, Math.min(8, Math.floor(opts.loops ?? 2)));
  while (passes > 1 && passes * steps * stepSeconds > MAX_SECONDS) passes--;
  const passSamples = Math.round(steps * stepSeconds * rate);
  const out = new Float64Array(passSamples * passes + Math.round(TAIL_SECONDS * rate));

  const rng = new Rng(seed);
  const noise = new Float32Array(rate);
  for (let i = 0; i < noise.length; i++) noise[i] = rng.next() * 2 - 1;

  const bus: Bus = { out, rate, noise };
  let budget = MAX_VOICE_SECONDS;
  outer: for (let pass = 0; pass < passes; pass++)
    for (const e of score.events) {
      if (e.step >= steps) continue;
      const { dur, total } = lengths(e, stepSeconds);
      budget -= total;
      if (budget < 0) {
        truncated = true;
        break outer;
      }
      // The odd sixteenths come late; a pass is a whole number of samples, so the passes are alike to the sample.
      const when = (e.step + (e.step % 2 === 1 ? swing : 0)) * stepSeconds;
      play(bus, e, pass * passSamples + Math.round(when * rate), dur);
    }

  master(out, rate, bpm, cutoff, space);

  let peak = 0;
  for (let i = 0; i < out.length; i++) {
    if (!Number.isFinite(out[i])) out[i] = 0;
    peak = Math.max(peak, Math.abs(out[i]));
  }
  const scale = peak > CEILING ? CEILING / peak : 1;
  const samples = new Float32Array(out.length);
  for (let i = 0; i < out.length; i++) samples[i] = out[i] * scale;
  return { samples, sampleRate: rate, loopStart: passSamples * (passes - 1), loopEnd: passSamples * passes, truncated };
}

/** XML + seed → the score. No clock here: a run that is too long stops at a number of steps, always the same one. Throws Mj3Error if the program is not valid. */
export function scoreOfProgram(xml: string, seed: number): Score {
  const m = compileMjx(xml);
  if (!m.sound) throw new Mj3Error('non è un programma sonoro: manca <sound>');
  return scoreOf(run(m.program, seed, SOUND_MAX_STEPS, SOUND_LIMITS).grid, m.sound);
}

/** The whole way, from the program's text: XML + seed → grid → score → samples. */
export function renderSoundProgram(xml: string, seed: number, opts: RenderOptions = {}): RenderedSound & { score: Score } {
  const score = scoreOfProgram(xml, seed);
  return { ...renderScore(score, seed, opts), score };
}
