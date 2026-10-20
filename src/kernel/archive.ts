// The Council in the flesh. Every agent is a team (the Engineer is a team of engineers, and so on):
// a member works in each building where its kind of work is done, at a desk, and goes to the shelf
// of the file it is changing; members appear (teleport) where they are needed instead of walking
// round the ring. Only those actually talking to each other in the Council's feed are seen talking.
// The Referente waits for the wanderer on the ring and takes requests to the right team.
// Real space, kernel-driven, no Lua and no model calls.

import { AGENTS, type AgentId, type FeedEntry } from './agents/council';
import type { Building, Corona } from './corona';

export interface Avatar {
  /** Agent kind (or 'referente'). */
  agent: AgentId;
  name: string;
  color: string;
  sigil: string;
  /** Building where this member works ('' = on the ring). */
  building: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  path?: string;
  say?: string;
  sayUntil: number;
  /** Back to the desk after this time. */
  idleUntil: number;
  speed: number;
}

const SPEED = 3.2;

export class Archive {
  /** Team members by "agent@building". */
  readonly avatars = new Map<string, Avatar>();
  private time = 0;

  constructor(private corona: () => Corona) {}

  /** One member of the right team at a desk of every building; the Referente on the ring. */
  reset(): void {
    const c = this.corona();
    const keep = new Set<string>();
    for (const b of c.buildings) {
      if (b.id === 'concilio') {
        // The whole Council sits at the round table, each at its place.
        for (const seat of b.floors[0].items.filter((i) => i.kind === 'desk' && i.target)) {
          const key = `${seat.target}@concilio`;
          keep.add(key);
          if (!this.avatars.has(key)) {
            const def = AGENTS[seat.target as AgentId];
            const p = { x: seat.x + 0.5, y: seat.y + 0.4 };
            this.avatars.set(key, { agent: seat.target as AgentId, name: def.name, color: def.color, sigil: def.sigil, building: b.id, ...p, tx: p.x, ty: p.y, sayUntil: 0, idleUntil: 0, speed: SPEED });
          }
        }
        continue;
      }
      const key = `${b.team}@${b.id}`;
      keep.add(key);
      if (!this.avatars.has(key) || this.avatars.get(key)!.building !== b.id) this.avatars.set(key, this.member(b.team as AgentId, b));
    }
    keep.add('referente@');
    if (!this.avatars.has('referente@')) {
      const p = { x: 0.5, y: -(c.radius + 1.5) };
      this.avatars.set('referente@', { agent: 'referente', name: AGENTS.referente.name, color: AGENTS.referente.color, sigil: AGENTS.referente.sigil, building: '', ...p, tx: p.x, ty: p.y, sayUntil: 0, idleUntil: 0, speed: SPEED });
    }
    for (const k of [...this.avatars.keys()]) if (!keep.has(k) && !k.includes('#')) this.avatars.delete(k);
  }

  private desk(b: Building, n = 0): { x: number; y: number } {
    const desks = b.floors[0].items.filter((i) => i.kind === 'desk' && (b.id !== 'concilio' || !i.target));
    const d = desks[n % Math.max(1, desks.length)];
    return d ? { x: d.x + 0.5, y: d.y - 0.6 } : { x: b.floors[0].ox + 3.5, y: b.floors[0].oy + 3.5 };
  }

  private member(agent: AgentId, b: Building, n = 0): Avatar {
    const p = this.desk(b, n);
    const def = AGENTS[agent];
    return { agent, name: def.name, color: def.color, sigil: def.sigil, building: b.id, x: p.x, y: p.y, tx: p.x, ty: p.y, sayUntil: 0, idleUntil: 0, speed: SPEED };
  }

  /** The member of a team working in a building (created the first time: teams are many). */
  private memberIn(agent: AgentId, b: Building, n = 0): Avatar {
    const key = n ? `${agent}@${b.id}#${n}` : `${agent}@${b.id}`;
    let a = this.avatars.get(key);
    if (!a) this.avatars.set(key, (a = this.member(agent, b, n)));
    return a;
  }

  private speak(a: Avatar, text: string): void {
    a.say = text.length > 90 ? `${text.slice(0, 87)}…` : text;
    a.sayUntil = this.time + 4 + Math.min(6, text.length / 18);
  }

  /** A member goes to the shelf of a file (in the building that holds it) and says what it does. */
  go(agent: AgentId, path: string | undefined, say?: string): Avatar | undefined {
    const c = this.corona();
    const b = path ? c.buildingOf(path) : undefined;
    if (!b) {
      // No file: the member of its own building speaks from the desk.
      const home = c.buildings.find((x) => x.team === agent) ?? c.buildings[0];
      if (!home) return undefined;
      const m = this.memberIn(agent, home);
      if (say) this.speak(m, say);
      return m;
    }
    const m = this.memberIn(agent, b);
    const s = c.slotOf(path!)!;
    m.tx = s.x + 0.5;
    m.ty = s.y + 1.4;
    m.path = path;
    m.speed = Math.max(SPEED, Math.hypot(m.tx - m.x, m.ty - m.y) / 3);
    m.idleUntil = this.time + 20;
    if (say) this.speak(m, say);
    return m;
  }

  /**
   * What the Council does, the teams act out: who works goes to the file; who is called in appears
   * next to them, and only these two are seen talking.
   */
  onFeed(e: FeedEntry, pathOf: (e: FeedEntry) => string | undefined): void {
    if (e.from === 'kernel' && !e.to) return;
    const path = pathOf(e);
    const from = e.from !== 'kernel' ? this.go(e.from, path, e.text) : undefined;
    if (e.to) {
      const c = this.corona();
      const b = (path ? c.buildingOf(path) : undefined) ?? c.building(from?.building) ?? c.buildings.find((x) => x.team === e.to);
      if (!b) return;
      const to = this.memberIn(e.to, b, e.to === from?.agent ? 1 : 0);
      // Called in: appears beside whoever called (the studio is big, the Council is quick).
      const near = from ?? to;
      to.x = to.tx = near.tx + 0.9;
      to.y = to.ty = near.ty;
      to.idleUntil = this.time + 20;
      this.speak(to, e.from === 'kernel' ? `(il kernel mi rimanda: ${e.text})` : `${from?.name ?? ''}, ci penso io.`);
    }
  }

  /** The Referente comes to meet the wanderer on the ring. */
  meet(px: number, py: number): void {
    const r = this.avatars.get('referente@');
    if (!r) return;
    const d = Math.hypot(r.x - px, r.y - py);
    if (d > 2.2) {
      r.tx = px + 1.2;
      r.ty = py;
      r.speed = Math.max(SPEED, d / 2);
    }
  }

  tick(dt: number): void {
    this.time += dt;
    const c = this.corona();
    for (const a of this.avatars.values()) {
      if (a.say && this.time > a.sayUntil) a.say = undefined;
      if (a.building && this.time > a.idleUntil && a.path) {
        // Done: back to the desk (at the round table, back to its seat).
        const b = c.building(a.building);
        const seat = b?.id === 'concilio' ? b.floors[0].items.find((i) => i.kind === 'desk' && i.target === a.agent) : undefined;
        if (seat) {
          a.tx = seat.x + 0.5;
          a.ty = seat.y + 0.4;
        } else if (b) {
          const n = Number(/#(\d+)$/.exec([...this.avatars.entries()].find(([, v]) => v === a)?.[0] ?? '')?.[1] ?? 0);
          const d = this.desk(b, n);
          a.tx = d.x;
          a.ty = d.y;
        }
        a.path = undefined;
      }
      const dx = a.tx - a.x;
      const dy = a.ty - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.05) continue;
      const step = Math.min(dist, a.speed * dt);
      a.x += (dx / dist) * step;
      a.y += (dy / dist) * step;
      // On the ring, never into the simulation circle.
      if (!a.building) {
        const r = Math.hypot(a.x, a.y);
        if (r < c.radius + 0.8) {
          a.x *= (c.radius + 0.8) / r;
          a.y *= (c.radius + 0.8) / r;
        }
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
