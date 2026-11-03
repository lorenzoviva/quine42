// The way out of the game's sound (ADR-0125): it plays the samples as they are, with gains only. No voices here: the sound is made in src/mj/synth.ts.
//
//   music (crossfades) ─→ music level ─┐
//   effects ───────────→ effect level ─┴→ volume and mute → analyser → speakers

import { SAMPLE_RATE } from '../mj/synth';
import type { PreparedSound } from './prepare';

const MUSIC_LEVEL = 0.6;
const EFFECT_LEVEL = 1;
/** Effects at the same time: a burst of pickups must not pile up into noise. */
const MAX_EFFECTS = 8;
/** How long a change of volume takes, against clicks. */
const VOLUME_GLIDE = 0.03;

export interface SoundPrefs {
  /** 0..1. */
  volume: number;
  muted: boolean;
}

export const DEFAULT_SOUND_PREFS: SoundPrefs = { volume: 0.7, muted: false };
const PREFS_KEY = 'quine-suono';

/** What the browser kept, read with care: whatever is there, an answer comes out. */
export function readSoundPrefs(text: string | null | undefined): SoundPrefs {
  try {
    const raw = JSON.parse(text ?? '{}') as Partial<SoundPrefs> | null;
    const volume = typeof raw?.volume === 'number' && Number.isFinite(raw.volume) ? Math.max(0, Math.min(1, raw.volume)) : DEFAULT_SOUND_PREFS.volume;
    return { volume, muted: raw?.muted === true };
  } catch {
    return { ...DEFAULT_SOUND_PREFS };
  }
}

function loadPrefs(): SoundPrefs {
  try {
    return readSoundPrefs(localStorage.getItem(PREFS_KEY));
  } catch {
    return { ...DEFAULT_SOUND_PREFS };
  }
}

/** What the director needs from the way out. */
export interface SoundOut {
  playMusic(sound: PreparedSound, fade: number): void;
  stopMusic(fade: number): void;
  playEffect(sound: PreparedSound): void;
}

interface MusicVoice {
  src: AudioBufferSourceNode;
  gain: GainNode;
  /** Context time at which the loop was at `phase`. */
  t: number;
  phase: number;
  seconds: number;
}

export class Sfx implements SoundOut {
  ctx?: AudioContext;
  analyser?: AnalyserNode;
  private out?: GainNode;
  private musicBus?: GainNode;
  private effectBus?: GainNode;
  private music?: MusicVoice;
  private effects = 0;
  prefs = loadPrefs();

  /** After a gesture: browsers open audio only then. Safe to call at every one. */
  unlock(): void {
    try {
      if (!this.ctx) {
        // The synthesizer's own rate: nothing gets resampled on the way out.
        const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
        const out = ctx.createGain();
        out.gain.value = this.level();
        const musicBus = ctx.createGain();
        musicBus.gain.value = MUSIC_LEVEL;
        const effectBus = ctx.createGain();
        effectBus.gain.value = EFFECT_LEVEL;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        musicBus.connect(out);
        effectBus.connect(out);
        out.connect(analyser);
        analyser.connect(ctx.destination);
        Object.assign(this, { ctx, out, musicBus, effectBus, analyser });
      }
      if (this.ctx?.state === 'suspended') void this.ctx.resume();
    } catch {
      /* no audio: the game goes on in silence */
    }
  }

  private level(): number {
    // The ear reads loudness on a curve: halfway on the slider should sound like halfway.
    return this.prefs.muted ? 0 : this.prefs.volume ** 2;
  }

  setPrefs(change: Partial<SoundPrefs>): void {
    this.prefs = readSoundPrefs(JSON.stringify({ ...this.prefs, ...change }));
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs));
    } catch {
      /* the choice lasts as long as the page */
    }
    if (this.ctx && this.out) this.out.gain.setTargetAtTime(this.level(), this.ctx.currentTime, VOLUME_GLIDE);
  }

  private buffer(s: PreparedSound): AudioBuffer {
    const buf = this.ctx!.createBuffer(1, s.samples.length, s.sampleRate);
    buf.copyToChannel(s.samples, 0);
    return buf;
  }

  private loopPhase(v: MusicVoice): number {
    const p = v.phase + (this.ctx!.currentTime - v.t) / v.seconds;
    return p - Math.floor(p);
  }

  /** Fades the piece that is playing into this one. Two of the same length stay in step: they are the same music, another seed. */
  playMusic(sound: PreparedSound, fade: number): void {
    if (!this.ctx || !this.musicBus) return;
    const ctx = this.ctx;
    const old = this.music;
    const seconds = sound.samples.length / sound.sampleRate;
    const phase = old && Math.abs(old.seconds - seconds) < 0.001 ? this.loopPhase(old) : 0;
    const src = ctx.createBufferSource();
    src.buffer = this.buffer(sound);
    src.loop = true;
    const gain = ctx.createGain();
    src.connect(gain).connect(this.musicBus);
    const t = ctx.currentTime + 0.02;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + fade);
    src.start(t, phase * seconds);
    if (old) this.fadeOut(old, t, fade);
    this.music = { src, gain, t, phase, seconds };
  }

  stopMusic(fade: number): void {
    if (this.music && this.ctx) this.fadeOut(this.music, this.ctx.currentTime, fade);
    this.music = undefined;
  }

  private fadeOut(v: MusicVoice, t: number, fade: number): void {
    v.gain.gain.cancelAndHoldAtTime(t);
    v.gain.gain.linearRampToValueAtTime(0, t + fade);
    v.src.stop(t + fade + 0.05);
    v.src.onended = () => v.gain.disconnect();
  }

  playEffect(sound: PreparedSound): void {
    if (!this.ctx || !this.effectBus || this.prefs.muted || this.effects >= MAX_EFFECTS) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer(sound);
    src.connect(this.effectBus);
    this.effects++;
    src.onended = () => {
      this.effects--;
      src.disconnect();
    };
    src.start();
  }

  /** How loud the output is now, as the analyser sees it: for whoever measures. */
  outputRms(): number {
    if (!this.analyser) return 0;
    const data = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(data);
    return Math.sqrt(data.reduce((n, x) => n + x * x, 0) / data.length);
  }
}
