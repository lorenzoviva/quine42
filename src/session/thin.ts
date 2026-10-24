// The thin client (T39, ADR-0059): in a game of many the browser does not run the world, the server does. The
// client still boots a kernel, a mirror one (`KernelOptions.mirror`): the same files, so the renderer, the menus
// and the HUD read it as they read the world alone, but nothing is generated, judged or saved in it. This class
// fills it with what the session tells (places, things, the other wanderers, what this wanderer carries), walks
// this wanderer at once (prediction: the carpet carries them as alone) and sends where they are; the server's
// corrections put them back. What the wanderer does goes to the server; what can be shown at once is shown at
// once (a thing picked up vanishes, a door opens, the inscribed phrase leaves the hand) and undone if the server
// refuses it, or if its next update says that nothing changed.

import type { Kernel } from '../kernel/kernel';
import type { Id } from '../kernel/ecs';
import type { NpcReply } from '../kernel/agents/minds';
import type { SessionClient, Outcome } from './client';
import type { OtherView, PlaceView, ServerMsg, ThingView } from './protocol';
import { THING_PARTS } from './protocol';

/** Seconds between two steps sent (the server checks the walk at its pace; 20 a second are plenty). */
const STEP_EVERY = 0.05;
/** How fast what moves on the server catches up with where it is (per second): about one update period. */
const FOLLOW = 12;
/** Farther than this (tiles) a thing jumps where it is instead of gliding there. */
const JUMP = 4;
/** Farther than this (tiles) from where the client thinks it is, the server carried its wanderer there (a rune, a door). */
const CARRIED = 8;
/** The components a thing of the server may have here (besides its place). */
const MIRRORED = ['module', 'form', 'glyph', ...THING_PARTS];

/** What the kernel does that goes to the server. The rest of what changes the world waits for later tasks. */
const LATER = ['useSlot', 'equipSlot', 'equip', 'unequip', 'dropSlot', 'moveSlot', 'craft', 'combine', 'freeCraft', 'freeItemAction', 'itemAct', 'takeFromContainer', 'putIntoContainer', 'putIntoBag', 'takeFromBag', 'uiAction', 'freeTileAction', 'openContainer', 'rollback'] as const;

export class ThinClient {
  /** Server entity → entity of the mirror, and back. */
  private local = new Map<number, Id>();
  private server = new Map<Id, number>();
  private others = new Map<string, Id>();
  /** Where each mirrored thing is going (the server's last word). */
  private targets = new Map<Id, { x: number; y: number }>();
  /** Things picked up here and not yet confirmed: the server's updates do not bring them back meanwhile. */
  private hidden = new Set<number>();
  /** Things to set again as the server has them, once its next update has come (an optimistic change that may not hold). */
  private recheck = new Set<number>();
  /** The phrase as the server has it (or will, once what was sent arrives), and the messages about it under way. */
  private told: string[] = [];
  private phrases = 0;
  /** The answers about the phrase are in: the next update says what the server's phrase is now. */
  private adopt = false;
  private lastStep = { x: NaN, y: NaN, t: 0 };
  private clock = 0;
  private lastCorrection = 0;

  constructor(
    readonly k: Kernel,
    readonly session: SessionClient,
  ) {
    this.relay();
    const s = session;
    this.places([...s.places.values()]);
    this.things([...s.things.values()]);
    for (const o of s.others.values()) this.other(o);
    if (s.me) {
      this.putMe(s.me.x, s.me.y);
      this.lastStep = { x: s.me.x, y: s.me.y, t: 0 };
    }
    const pl = k.playerComp();
    if (pl && s.me) pl.facing = s.me.facing;
    if (s.forma) k.ecs.set(k.playerId, 'form', { ...k.ecs.get(k.playerId, 'form'), ...s.forma });
    this.state();
    this.told = [...(s.stato.hand?.tokens ?? [])];
    s.onMessage = (m) => this.receive(m);
  }

  /** Every frame, after the kernel's ticks: what moves on the server glides, the wanderer's step and phrase go. */
  frame(dt: number): void {
    const k = this.k;
    this.clock += dt;
    const f = Math.min(1, dt * FOLLOW);
    for (const [id, to] of this.targets) {
      const p = k.ecs.get(id, 'pos');
      if (!p || !k.ecs.alive.has(id)) {
        this.targets.delete(id);
        continue;
      }
      const d = Math.hypot(to.x - p.x, to.y - p.y);
      if (d > JUMP || d < 0.002) {
        p.x = to.x;
        p.y = to.y;
        this.targets.delete(id);
      } else {
        p.x += (to.x - p.x) * f;
        p.y += (to.y - p.y) * f;
      }
    }
    const at = k.playerCarpet();
    if (this.clock - this.lastStep.t >= STEP_EVERY && !(Math.hypot(at.x - this.lastStep.x, at.y - this.lastStep.y) <= 0.005)) {
      this.lastStep = { ...at, t: this.clock };
      this.session.move(at.x, at.y);
    }
    // The phrase is the wanderer's own: what they compose here goes to the server when nothing else is under way.
    const hand = k.hand();
    if (hand && !this.phrases && hand.tokens.join(' ') !== this.told.join(' ')) this.phrase(hand.tokens);
  }

  // --- What the server says ----------------------------------------------------------------------

  private receive(m: ServerMsg): void {
    switch (m.t) {
      case 'aggiorna':
        this.places(m.luoghi ?? []);
        this.things(m.cose ?? []);
        for (const id of m.via ?? []) this.drop(id);
        for (const o of m.viandanti ?? []) this.other(o);
        for (const id of m.partiti ?? []) {
          const e = this.others.get(id);
          if (e !== undefined) this.k.ecs.destroy(e);
          this.others.delete(id);
        }
        if (m.me) this.carried(m.me.x, m.me.y);
        if (m.stato || this.adopt) this.state();
        this.adopt = false;
        if (Math.abs(m.ora - this.k.time) > 0.5) this.k.time = m.ora;
        // What was shown at once is now what the server says.
        for (const id of this.recheck) this.resync(id);
        this.recheck.clear();
        break;
      case 'correzione':
        // The latest word wins: an older correction, overtaken by steps already corrected, is not applied again.
        if (m.seq < this.lastCorrection) break;
        this.lastCorrection = m.seq;
        this.putMe(m.x, m.y);
        this.lastStep = { x: m.x, y: m.y, t: this.clock };
        break;
    }
  }

  /** The wanderer is here in the world: on their circle where they are, their carpet under them. */
  private putMe(x: number, y: number): void {
    const c = this.k.carpet();
    const p = this.k.playerPos();
    if (c && p) Object.assign(c, { ox: x - p.x, oy: y - p.y });
  }

  /** Where the server has the wanderer: lag is a step or two behind, farther means they were carried. */
  private carried(x: number, y: number): void {
    const at = this.k.playerCarpet();
    if (Math.hypot(x - at.x, y - at.y) <= CARRIED) return;
    this.putMe(x, y);
    this.lastStep = { x, y, t: this.clock };
  }

  private places(list: PlaceView[]): void {
    for (const v of list)
      this.k.chunks.set(v.key, {
        cx: v.cx,
        cy: v.cy,
        key: v.key,
        draft: v.tiles,
        tiles: v.tiles,
        version: v.version,
        stage: v.stage,
        ...(v.nome ? { place: { name: v.nome, description: v.descrizione ?? '' } } : {}),
        buildings: (v.lotti ?? []).map(([x0, y0, x1, y1]) => ({ x0, y0, x1, y1, floor: [], walls: [], doors: [] })),
      });
  }

  private things(list: ThingView[]): void {
    for (const t of list) {
      if (this.hidden.has(t.id)) continue;
      const known = this.local.get(t.id);
      // Only where it is now: it glides there.
      if (known !== undefined && Object.keys(t).length <= 3) {
        this.targets.set(known, { x: t.x, y: t.y });
        continue;
      }
      this.look(t);
    }
  }

  /** A thing as the server sees it: made here if new, its components set to what they are. */
  private look(t: ThingView): Id {
    const k = this.k;
    let id = this.local.get(t.id);
    if (id === undefined || !k.ecs.alive.has(id)) {
      id = k.ecs.spawn({ pos: { x: t.x, y: t.y } });
      this.local.set(t.id, id);
      this.server.set(id, t.id);
    } else this.targets.set(id, { x: t.x, y: t.y });
    const parts: Record<string, unknown> = { ...(t.c ?? {}) };
    // An item on the ground has no module: what it is, is what it would be in the hand.
    if (t.m && (t.c?.pickup as { item?: string } | undefined)?.item !== t.m) parts.module = { id: t.m };
    if (t.form) parts.form = { ...t.form };
    if (t.glyph) parts.glyph = t.glyph;
    for (const name of MIRRORED) {
      if (name in parts) k.ecs.set(id, name, parts[name]);
      else k.ecs.remove(id, name);
    }
    if (t.testo) this.say(id, t.testo);
    else k.bubbles.delete(id);
    return id;
  }

  private drop(sid: number): void {
    const id = this.local.get(sid);
    if (id !== undefined) this.k.ecs.destroy(id);
    this.local.delete(sid);
    if (id !== undefined) this.server.delete(id);
    this.hidden.delete(sid);
  }

  /** Another wanderer: their model with their seed and colour, walking where the server has them. */
  private other(o: OtherView): void {
    const k = this.k;
    let id = this.others.get(o.id);
    if (id === undefined || !k.ecs.alive.has(id)) {
      const me = k.ecs.get(k.playerId, 'glyph');
      id = k.ecs.spawn({ pos: { x: o.x, y: o.y }, glyph: { ...(me ?? { glyph: '@', color: '#ffffff' }) }, body: { r: 0.3, solid: false }, wander: {} });
      this.others.set(o.id, id);
    } else this.targets.set(id, { x: o.x, y: o.y });
    k.ecs.set(id, 'remote', { id: o.id, nome: o.nome });
    k.ecs.set(id, 'identity', { name: o.nome });
    if (o.form) k.ecs.set(id, 'form', { ...o.form });
    if (o.testo) this.say(id, o.testo);
  }

  private say(id: Id, text: string): void {
    const b = this.k.bubbles.get(id);
    if (b?.text !== text) this.k.bubbles.set(id, { text, until: this.k.time + 4 + text.length / 25 });
  }

  /** What the wanderer carries and is, as the server has it. The phrase only when the server changed it. */
  private state(): void {
    const k = this.k;
    const s = this.session.stato;
    const pid = k.playerId;
    if (s.needs) k.ecs.set(pid, 'needs', { ...(k.needs() ?? {}), ...s.needs });
    if (s.inventory) k.ecs.set(pid, 'inventory', structuredClone(s.inventory));
    if (s.stati) k.ecs.set(pid, 'stati', structuredClone(s.stati));
    const tokens = s.hand?.tokens;
    if (tokens && !this.phrases && tokens.join(' ') !== this.told.join(' ')) {
      // A rune picked up, the phrase spoken or inscribed: the server's phrase becomes the hand's.
      this.told = [...tokens];
      const hand = k.hand();
      hand.tokens = [...tokens];
      hand.sel = Math.max(0, Math.min(s.hand?.sel ?? 0, tokens.length - 1));
    }
  }

  /** Sets a thing again as the server's last update has it (or takes it away, if it is not there any more). */
  private resync(sid: number): void {
    this.hidden.delete(sid);
    const t = this.session.things.get(sid);
    if (t) this.look(t);
    else this.drop(sid);
  }

  // --- What the wanderer does ----------------------------------------------------------------------

  /** The kernel's actions that change the world become messages to the server. */
  private relay(): void {
    const k = this.k;
    const studio = k.interact.bind(k);
    k.interact = async () => (k.zone === 'sim' ? this.interact() : studio());
    k.perform = (id, action) => this.perform(id, action);
    k.performMenu = async (option, entity) => {
      if (option.startsWith('e:') && entity >= 0) return this.perform(entity, option.slice(2));
      this.later();
    };
    k.freeAction = async (id, text) => {
      const r = await this.send(id, { t: 'altro', testo: text });
      return r?.testo ?? r?.motivo ?? '';
    };
    k.talk = async (id, text): Promise<NpcReply> => {
      const r = await this.send(id, { t: 'chat', testo: text });
      return { say: r?.testo ?? (r?.motivo ? `(${r.motivo})` : '…'), action: 'nessuna', mood: 'tranquillo' };
    };
    k.inscribeHand = () => void this.inscribe(k.hand().tokens.length);
    k.dropSelected = () => {
      const hand = k.hand();
      const token = hand.tokens[hand.sel];
      if (token === undefined) return k.message('Non hai rune in mano.', 'warn');
      // One rune: the phrase is that rune, inscribed, then what is left of it.
      void this.inscribe(1, hand.sel);
    };
    k.castSpell = async () => {
      if (!k.hand().tokens.length) {
        k.message('Non hai rune in mano.', 'warn');
        return false;
      }
      this.syncPhrase();
      const r = await this.sent(this.session.act({ t: 'pronuncia' }));
      if (r.ok) k.bus.emit('spell:cast', {});
      return r.ok;
    };
    k.action = (target) => {
      const sid = target !== undefined ? this.server.get(target) : this.server.get(k.targetInFront() ?? -1);
      if (sid === undefined) return k.message('Non c’è niente davanti a te.', 'warn');
      void this.show(this.session.act({ t: 'azione', entita: sid, azione: 'strumento' }));
    };
    for (const name of LATER) (k as unknown as Record<string, () => undefined>)[name] = () => this.later();
  }

  private later(): undefined {
    this.k.message('Tra molti viandanti questo non si può ancora fare.', 'warn');
    return undefined;
  }

  /** E in the world: a rune under or in front of the wanderer, a thing to pick up in front, or the menu of the tile. */
  private async interact(): Promise<void> {
    const k = this.k;
    const pc = k.playerCarpet();
    const facing = k.playerComp()?.facing;
    const [dx, dy] = facing === 'left' ? [-1, 0] : facing === 'right' ? [1, 0] : facing === 'up' ? [0, -1] : [0, 1];
    const col = Math.floor(pc.x);
    const row = Math.floor(pc.y);
    const cells = [`${col},${row}`, `${col + dx},${row + dy}`];
    const rune = k.ecs.query('rune').find((id) => {
      const r = k.ecs.get(id, 'rune');
      return cells.includes(`${r?.col},${r?.row}`);
    });
    if (rune !== undefined) return this.perform(rune, 'raccogli');
    const target = k.targetInFront();
    if (target !== undefined && k.ecs.has(target, 'pickup')) return this.perform(target, 'raccogli');
    const at = target !== undefined ? k.ecs.get(target, 'pos') : { x: pc.x + dx, y: pc.y + dy };
    k.openTileMenu(Math.floor(at.x), Math.floor(at.y), target);
  }

  private async perform(id: Id, action: string): Promise<void> {
    const k = this.k;
    const sid = this.server.get(id);
    if (sid === undefined) return;
    const name = k.nameOf(id);
    // What only opens a window here: the words go to the server later.
    if (action === 'parla') return void k.bus.emit('ui:chat', { id, name });
    if (action === 'altro') return void k.bus.emit('ui:freeaction', { id, name });
    const answer = this.session.act({ t: 'azione', entita: sid, azione: action });
    if (action === 'raccogli') {
      // Picked up at once; it comes back if the server says no, or still has it on the ground.
      const rune = k.ecs.get(id, 'rune');
      this.hidden.add(sid);
      k.ecs.destroy(id);
      k.bus.emit(rune ? 'rune:picked' : 'item:picked', rune ? { token: rune.token } : { item: k.ecs.get(id, 'pickup')?.item });
    } else if (action.startsWith('modello:')) {
      // The model's action shows at once (the door opens).
      const f = k.ecs.get(id, 'form');
      if (f) f.done = [...(f.done ?? []), action.slice(8)];
    }
    const r = await this.show(answer);
    if (!r.ok) this.resync(sid);
    else this.recheck.add(sid);
  }

  /** «Altro…» or words to someone: the thing's id on the server, and the answer shown. */
  private async send(id: Id, msg: { t: 'altro' | 'chat'; testo: string }): Promise<Outcome | undefined> {
    const sid = this.server.get(id);
    if (sid === undefined) return undefined;
    return this.show(this.session.act({ ...msg, entita: sid }));
  }

  /**
   * Inscribes `count` runes of the phrase from `from` (all of it, or the one chosen): they leave the hand at once
   * and come back to it if the server refuses.
   */
  private async inscribe(count: number, from = 0): Promise<void> {
    const k = this.k;
    const hand = k.hand();
    if (!hand.tokens.length) return k.message('Non hai rune in mano.', 'warn');
    const before = { tokens: [...hand.tokens], sel: hand.sel };
    const written = hand.tokens.slice(from, from + count);
    this.phrase(written);
    const answer = this.sent(this.session.act({ t: 'incidi' }));
    this.told = [];
    hand.tokens.splice(from, count);
    hand.sel = Math.max(0, Math.min(hand.sel, hand.tokens.length - 1));
    const r = await this.show(answer);
    if (r.ok) k.bus.emit('rune:inscribed', { tokens: written });
    else Object.assign(k.hand(), before);
  }

  /** Tells the server the phrase, if it does not have it. */
  private syncPhrase(): void {
    const tokens = this.k.hand().tokens;
    if (tokens.join(' ') !== this.told.join(' ')) this.phrase(tokens);
  }

  private phrase(tokens: string[]): void {
    this.told = [...tokens];
    void this.sent(this.session.act({ t: 'frase', tokens: [...tokens] }));
  }

  /** A message about the phrase: while it is under way, the server's phrase does not overwrite the hand. */
  private async sent(answer: Promise<Outcome>): Promise<Outcome> {
    this.phrases++;
    try {
      return await answer;
    } finally {
      this.phrases--;
      // Once nothing is under way, the hand is what the server has (it may have kept fewer runes): the answer comes
      // before the update of the same tick, so it is the next update that says it.
      if (!this.phrases) this.adopt = true;
    }
  }

  /** What came of something the wanderer did, shown as the world would show it. */
  private async show(answer: Promise<Outcome>): Promise<Outcome> {
    const r = await answer;
    const k = this.k;
    for (const m of r.messaggi ?? []) k.message(m);
    for (const d of r.dialoghi ?? []) k.bus.emit('ui:dialog', d);
    if (!r.ok && r.motivo) k.message(r.motivo, 'warn');
    return r;
  }
}
