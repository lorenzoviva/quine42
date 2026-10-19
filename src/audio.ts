// Tiny synthesized sound: blips for runes, crackle for faults. No assets.

export class Sfx {
  private ctx?: AudioContext;
  private master?: GainNode;
  muted = false;

  unlock(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.25;
      this.master.connect(this.ctx.destination);
    } catch {
      /* no audio */
    }
  }

  blip(freq: number, dur = 0.08, type: OscillatorType = 'square', vol = 0.3): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur);
  }

  noise(dur = 0.25, vol = 0.35): void {
    if (!this.ctx || !this.master || this.muted) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let hold = 0;
    for (let i = 0; i < len; i++) {
      if (i % Math.floor(20 + Math.random() * 200) === 0) hold = Math.random() * 2 - 1;
      data[i] = hold * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g).connect(this.master);
    src.start();
  }

  chord(freqs: number[], dur = 0.6): void {
    freqs.forEach((f, i) => setTimeout(() => this.blip(f, dur, 'triangle', 0.2), i * 90));
  }
}
