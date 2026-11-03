// Plays what the synthesizer gave, the samples as they are (ADR-0123): no voices or filters here. Gains only to change from one render to the next without a click,
// at the same point of the loop, and an analyser for the oscilloscope and for whoever measures the output.

import { SAMPLE_RATE, type RenderedSound } from '../../src/mj/synth';

type Playable = Pick<RenderedSound, 'samples' | 'sampleRate' | 'loopStart' | 'loopEnd'>;

/** Seconds of crossfade between two renders. The two are the same music at the same point: their sum holds its level with a straight line. */
export const FADE = 0.06;
const SHOT_EDGE = 0.004;

interface Voice {
  src: AudioBufferSourceNode;
  gain: GainNode;
  /** Context time at which the loop was at `phase`. */
  t: number;
  phase: number;
  seconds: number;
}

export class LoopPlayer {
  ctx?: AudioContext;
  out?: GainNode;
  analyser?: AnalyserNode;
  private voice?: Voice;

  /** After a click: browsers open audio only then. */
  unlock(): AudioContext {
    if (!this.ctx) {
      // The synthesizer's own rate: nothing gets resampled on the way out.
      this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      this.out = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.out.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  get playing(): boolean {
    return !!this.voice;
  }

  /** Where the loop is, 0..1. */
  get phase(): number {
    const v = this.voice;
    if (!v || !this.ctx) return 0;
    const p = v.phase + (this.ctx.currentTime - v.t) / v.seconds;
    return p - Math.floor(p);
  }

  private buffer(s: Pick<Playable, 'samples' | 'sampleRate'>, from = 0, to = s.samples.length): AudioBuffer {
    const buf = this.unlock().createBuffer(1, Math.max(1, to - from), s.sampleRate);
    buf.getChannelData(0).set(s.samples.subarray(from, to));
    return buf;
  }

  /** Starts a render where the old one is, and fades one into the other; from the top if nothing was playing. */
  play(s: Playable): void {
    const ctx = this.unlock();
    const old = this.voice;
    const phase = this.phase;
    const seconds = Math.max(1 / s.sampleRate, (s.loopEnd - s.loopStart) / s.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = this.buffer(s);
    src.loop = true;
    src.loopStart = s.loopStart / s.sampleRate;
    src.loopEnd = s.loopEnd / s.sampleRate;
    const gain = ctx.createGain();
    src.connect(gain).connect(this.out!);
    const t = ctx.currentTime + 0.012;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + FADE);
    src.start(t, src.loopStart + phase * seconds);
    if (old) this.fadeOut(old, t);
    this.voice = { src, gain, t, phase, seconds };
  }

  stop(): void {
    if (this.voice && this.ctx) this.fadeOut(this.voice, this.ctx.currentTime);
    this.voice = undefined;
  }

  private fadeOut(v: Voice, t: number): void {
    // Anything the old voice was still ramping to is dropped, from the value it has at `t`.
    v.gain.gain.cancelAndHoldAtTime(t);
    v.gain.gain.linearRampToValueAtTime(0, t + FADE);
    v.src.stop(t + FADE + 0.02);
    v.src.onended = () => v.gain.disconnect();
  }

  /** A piece of samples, once, over whatever is playing, with soft edges: one step, or a cell just painted. */
  shot(s: Pick<Playable, 'samples' | 'sampleRate'>, from = 0, to = s.samples.length): void {
    const ctx = this.unlock();
    const src = ctx.createBufferSource();
    const buf = this.buffer(s, from, to);
    src.buffer = buf;
    const gain = ctx.createGain();
    const t = ctx.currentTime + 0.005;
    const end = t + buf.duration;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + SHOT_EDGE);
    gain.gain.setValueAtTime(1, Math.max(t + SHOT_EDGE, end - SHOT_EDGE));
    gain.gain.linearRampToValueAtTime(0, end);
    src.connect(gain).connect(this.out!);
    src.start(t);
    src.onended = () => gain.disconnect();
  }
}
