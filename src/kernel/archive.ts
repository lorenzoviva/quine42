// The Council in the flesh: in the corona the agents are figures that walk the archive. When one of
// them works on something (the feed), it goes to the file it is touching, says what it does, and
// whoever it addressed comes to listen. When idle they talk among themselves about recent work.
// Real space, kernel-driven, no Lua and no model calls: cheap and always coherent with the feed.

import { AGENTS, type AgentId, type FeedEntry } from './agents/council';
import type { Corona } from './corona';

export interface Avatar {
  agent: AgentId;
  name: string;
  color: string;
  sigil: string;
  x: number;
  y: number;
  /** Where it is going (real-space point) and the file it goes to. */
  tx: number;
  ty: number;
  path?: string;
  say?: string;
  sayUntil: number;
  /** Not before this time it starts a new idle errand. */
  idleUntil: number;
  /** Cells per second of the current errand (far errands are run: the Council is never late). */
  speed: number;
}

const SPEED = 3.2;

export class Archive {
  readonly avatars = new Map<AgentId, Avatar>();
  /** Recent work per agent, for idle conversations. */
  private recent: FeedEntry[] = [];
  private time = 0;

  constructor(private corona: () => Corona) {}

  /** Places every agent next to its own prompt (its desk in the Council's room). */
  reset(): void {
    const ids = Object.keys(AGENTS) as AgentId[];
    ids.forEach((agent, i) => {
      const home = this.home(agent, i);
      const a = this.avatars.get(agent);
      if (a) return;
      const def = AGENTS[agent];
      this.avatars.set(agent, { agent, name: def.name, color: def.color, sigil: def.sigil, x: home.x, y: home.y, tx: home.x, ty: home.y, sayUntil: 0, idleUntil: 4 + i * 3, speed: SPEED });
    });
  }

  private home(agent: AgentId, i = 0): { x: number; y: number } {
    const c = this.corona();
    const s = c.slotOf(`prompts/agents/${agent}.md`);
    if (s) return this.beside(s);
    const t = (i / 6) * Math.PI * 2;
    const r = c.radius + 1.5;
    return { x: Math.sin(t) * r, y: -Math.cos(t) * r };
  }

  /** A walkable point next to a file cell (towards the inner walkway). */
  private beside(s: { x: number; y: number }): { x: number; y: number } {
    const cx = s.x + 0.5;
    const cy = s.y + 0.5;
    const d = Math.hypot(cx, cy) || 1;
    return { x: cx - (cx / d) * 0.9, y: cy - (cy / d) * 0.9 };
  }

  /** An agent goes to a file and says what it does there. */
  go(agent: AgentId, path: string | undefined, say?: string): void {
    const a = this.avatars.get(agent);
    if (!a) return;
    const slot = path ? this.corona().slotOf(path) : undefined;
    const p = slot ? this.beside(slot) : this.home(agent);
    a.tx = p.x;
    a.ty = p.y;
    a.speed = Math.max(SPEED, Math.hypot(a.tx - a.x, a.ty - a.y) / 3);
    a.path = slot ? path : undefined;
    if (say) this.speak(a, say);
    a.idleUntil = this.time + 20;
  }

  private speak(a: Avatar, text: string): void {
    a.say = text.length > 90 ? `${text.slice(0, 87)}…` : text;
    a.sayUntil = this.time + 4 + Math.min(6, text.length / 18);
  }

  /** What the Council does, the avatars act out. */
  onFeed(e: FeedEntry, pathOf: (e: FeedEntry) => string | undefined): void {
    if (e.from === 'kernel' && !e.to) return;
    this.recent.push(e);
    if (this.recent.length > 40) this.recent.shift();
    const path = pathOf(e);
    if (e.from !== 'kernel') this.go(e.from, path, e.text);
    if (e.to) {
      this.go(e.to, path);
      const to = this.avatars.get(e.to);
      if (to && e.from !== 'kernel') to.say = undefined;
      else if (to) this.speak(to, `(il kernel mi rimanda: ${e.text})`);
    }
  }

  tick(dt: number): void {
    this.time += dt;
    const c = this.corona();
    const R = c.radius;
    const list = [...this.avatars.values()];
    for (const a of list) {
      if (a.say && this.time > a.sayUntil) a.say = undefined;
      // Walk along the ring (polar), never into the simulation circle.
      const [r0, t0] = polar(a.x, a.y);
      const [r1, t1] = polar(a.tx, a.ty);
      let dtheta = t1 - t0;
      if (dtheta > Math.PI) dtheta -= Math.PI * 2;
      if (dtheta < -Math.PI) dtheta += Math.PI * 2;
      const arc = dtheta * r0;
      const dr = r1 - r0;
      const dist = Math.hypot(arc, dr);
      if (dist < 0.05) continue;
      const step = Math.min(dist, a.speed * dt);
      const r = Math.max(R + 0.8, Math.min(c.outer - 0.8, r0 + (dr / dist) * step));
      const t = t0 + ((arc / dist) * step) / r0;
      a.x = Math.sin(t) * r;
      a.y = -Math.cos(t) * r;
    }
    // Idle: two agents meet and talk about recent work (lines from the feed).
    const idle = list.filter((a) => this.time > a.idleUntil);
    if (idle.length >= 2) {
      const [a, b] = [idle[Math.floor(this.time * 7) % idle.length], idle[Math.floor(this.time * 13 + 1) % idle.length]];
      if (a !== b) {
        a.tx = b.x + (b.x === 0 ? 0.8 : Math.sign(b.x) * 0.8);
        a.ty = b.y;
        a.speed = Math.max(SPEED, Math.hypot(a.tx - a.x, a.ty - a.y) / 4);
        a.idleUntil = this.time + 18 + (this.time % 9);
        b.idleUntil = this.time + 18;
        const mine = [...this.recent].reverse().find((e) => e.from === a.agent);
        const theirs = [...this.recent].reverse().find((e) => e.from === b.agent);
        this.speak(a, mine ? `${b.name}, ho appena fatto questo: ${mine.text}` : `${b.name}, com'è il mondo dalla tua parte?`);
        if (theirs) this.speak(b, `Io invece: ${theirs.text}`);
        else this.speak(b, 'Tutto tranquillo, per ora.');
      }
    }
  }

  nearest(x: number, y: number, r = 1.5): Avatar | undefined {
    let best: Avatar | undefined;
    let bd = r;
    for (const a of this.avatars.values()) {
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < bd) [best, bd] = [a, d];
    }
    return best;
  }
}

function polar(x: number, y: number): [number, number] {
  let t = Math.atan2(y, x) + Math.PI / 2;
  if (t < 0) t += Math.PI * 2;
  return [Math.hypot(x, y), t];
}
