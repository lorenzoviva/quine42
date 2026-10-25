// The thin client (T39, ADR-0059): in a game of many the browser does not run the world, the server does. The
// client still boots a kernel, a mirror one (`KernelOptions.mirror`): the same files, so the renderer, the menus
// and the HUD read it as they read the world alone, but nothing is generated, judged or saved in it. This class
// fills it with what the session tells (places, things, the other wanderers, what this wanderer carries), walks
// this wanderer at once (prediction: the carpet carries them as alone) and sends where they are; the server's
// corrections put them back. What the wanderer does goes to the server; what can be shown at once is shown at
// once (a thing picked up vanishes, a door opens, the inscribed phrase leaves the hand, a slot moves) and undone if
// the server refuses it, or if its next update says that nothing changed. What the wanderer carries (T39b) goes the
// same way: pockets, bags, containers, crafting, the mechanics' panels, the actions on tiles. The world's files that
// change come into the mirror; the master's edits stay in theirs, on their branch, until they publish it (T42b).

import type { Kernel } from '../kernel/kernel';
import type { Id } from '../kernel/ecs';
import type { NpcReply } from '../kernel/agents/minds';
import type { FeedEntry } from '../kernel/agents/council';
import type { SessionClient, Outcome } from './client';
import type { ContainerView, FileChanges, OtherView, PlaceView, ServerMsg, ThingView } from './protocol';
import type { FileMap } from '../kernel/types';
import { hashStr, hex } from '../kernel/rng';
import { takeFromSlot } from '../kernel/inventory';
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

/** What the kernel does that a game of many does not do from a player's client yet (the master's R is their branch's). */
const LATER = ['rollback'] as const;

type Act = Parameters<SessionClient['act']>[0];

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
  /** The phrase as the server has it (or will, once what was sent arrives). */
  private told: string[] = [];
  /**
   * Messages under way that changed the hand or what is carried here at once: meanwhile the server's updates do
   * not overwrite them (a slot moved here would jump back for a moment).
   */
  private pending = 0;
  /** Those answers are in: the next update says what the server's hand and inventory are now. */
  private adopt = false;
  /** What is carried as last set here from the server (to tell the inventory window when it changes). */
  private carriedKey = '';
  private lastStep = { x: NaN, y: NaN, t: 0 };
  private clock = 0;
  private lastCorrection = 0;
  /** The world's files as the server last told them: the master's branch is what their mirror has that these do not. */
  private main: FileMap = {};
  /** The branch as the server has it (or will, once what was sent arrives). */
  private branchKey = '';

  constructor(
    readonly k: Kernel,
    readonly session: SessionClient,
  ) {
    this.main = { ...session.files };
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
    this.heard(s.feed);
    s.onMessage = (m) => this.receive(m);
    if (s.master) this.openBranch();
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
    if (hand && !this.pending && hand.tokens.join(' ') !== this.told.join(' ')) this.phrase(hand.tokens);
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
      case 'concilio':
        this.heard(m.voci);
        break;
      case 'file':
        this.worldFiles(m.files);
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

  /** The Council at work on the server (the master's client only, T41): its feed, its avatars in the studio. */
  private heard(voices: FeedEntry[]): void {
    const c = this.k.council;
    for (const e of voices) {
      c.feed.push(e);
      if (c.feed.length > 400) c.feed.shift();
      c.onFeed?.(e);
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
      // An opened container keeps what it was seen to hold (the server sends only its size with the thing).
      if (name === 'container' && name in parts) k.ecs.set(id, name, { ...k.ecs.get(id, name), ...(parts[name] as object) });
      else if (name in parts) k.ecs.set(id, name, parts[name]);
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

  /**
   * What the wanderer carries and is, as the server has it: what is carried and the phrase only when nothing that
   * changed them here is under way, the phrase only when the server changed it.
   */
  private state(): void {
    const k = this.k;
    const s = this.session.stato;
    const pid = k.playerId;
    if (s.needs) k.ecs.set(pid, 'needs', { ...(k.needs() ?? {}), ...s.needs });
    if (s.stati) k.ecs.set(pid, 'stati', structuredClone(s.stati));
    if (!this.pending) {
      if (s.inventory) k.ecs.set(pid, 'inventory', structuredClone(s.inventory));
      if (s.slots) k.ecs.set(pid, 'slots', structuredClone(s.slots));
      const key = JSON.stringify([k.inventory(), k.slots()]);
      if (key !== this.carriedKey) k.bus.emit('inventory:changed', {});
      this.carriedKey = key;
    }
    const tokens = s.hand?.tokens;
    if (tokens && !this.pending && tokens.join(' ') !== this.told.join(' ')) {
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

  // --- The world's files, the master's branch (T42b) -----------------------------------------------

  /**
   * The world's files changed (the Council, a publication): the mirror takes them as a commit of its own, but where the
   * master's branch has a version of theirs (it wins until they publish). An edit not yet committed stays on top.
   */
  private worldFiles(changes: FileChanges): void {
    const k = this.k;
    const repo = k.repo;
    const mine = this.session.master ? this.branch().files : {};
    for (const [p, v] of Object.entries(changes)) {
      if (v === null) delete this.main[p];
      else this.main[p] = v;
    }
    const head = repo.head().files;
    const dirty: FileChanges = {};
    for (const p of new Set([...Object.keys(head), ...Object.keys(repo.working)])) if (repo.working[p] !== head[p]) dirty[p] = repo.working[p] ?? null;
    const took = Object.entries(changes).filter(([p, v]) => !(p in mine) && (head[p] ?? null) !== v);
    const kept = Object.keys(mine).filter((p) => p in changes && (head[p] ?? null) !== changes[p]);
    if (took.length) {
      repo.restore();
      for (const [p, v] of took) repo.write(p, v);
      repo.commit(`dal mondo: ${took.slice(0, 6).map(([p]) => p).join(', ')}${took.length > 6 ? '…' : ''}`, 'kernel');
      for (const [p, v] of Object.entries(dirty)) repo.write(p, v);
      k.applyFiles({ ...repo.working });
    }
    for (const p of kept) k.log('repo', `${p} è cambiato nel mondo: nel tuo ramo resta la tua versione`);
    if (this.session.master) this.sendBranch();
  }

  /** The master's mirror: the branch the server kept comes back into it, and every commit of it goes to the server. */
  private openBranch(): void {
    const k = this.k;
    const kept = Object.entries(this.session.branch);
    if (kept.length) {
      for (const [p, v] of kept) k.repo.write(p, v);
      k.repo.commit('il tuo ramo, com’era', 'player');
      k.applyFiles({ ...k.repo.working });
    }
    this.branchKey = JSON.stringify(this.branch().files);
    k.repo.onCommit = () => this.sendBranch();
    k.publisher = { branch: () => Object.keys(this.branch().files).sort(), publish: () => this.publish() };
  }

  /** What the mirror's last valid commit has that the world does not, and the world's version each was changed from. */
  private branch(): { files: FileChanges; base: Record<string, string | null> } {
    const head = this.k.repo.head().files;
    const files: FileChanges = {};
    const base: Record<string, string | null> = {};
    for (const p of new Set([...Object.keys(head), ...Object.keys(this.main)])) {
      if (head[p] === this.main[p]) continue;
      files[p] = head[p] ?? null;
      base[p] = this.main[p] === undefined ? null : hex(hashStr(this.main[p]));
    }
    return { files, base };
  }

  /** The branch, whole, to the server when it changed. */
  private sendBranch(): void {
    const b = this.branch();
    const key = JSON.stringify(b.files);
    if (key === this.branchKey) return;
    this.branchKey = key;
    void this.session.act({ t: 'ramo', ...b }).then((r) => {
      if (r.ok) return;
      this.branchKey = '';
      this.k.message(`Il tuo ramo non arriva al mondo: ${r.motivo ?? 'rifiutato'}`, 'warn');
    });
  }

  /** The gesture of the master: their branch into the world, for everyone. */
  private async publish(): Promise<Outcome> {
    this.sendBranch();
    const r = await this.show(this.session.act({ t: 'pubblica' }));
    if (r.ok && r.testo) this.k.message(r.testo, 'good');
    return r;
  }

  /**
   * R of the master in a game of many: their branch back to its last valid state (or to a commit of it). The world, its
   * runes and the server's repository stay as they are; what the branch is now goes to the server.
   */
  private rollbackBranch(id?: string): void {
    const k = this.k;
    const repo = k.repo;
    if (id && !repo.find(id)) return void k.message('Quel momento non è nel tuo ramo.', 'warn');
    const files = id ? repo.checkout(id) : repo.restore();
    k.faults.clearAll();
    k.applyFiles({ ...files });
    const head = repo.head();
    k.bus.emit('rollback', { commit: head });
    k.message(`Il tuo ramo torna a «${head.message}» (${head.id})`, 'good');
    this.sendBranch();
  }

  // --- What the wanderer does ----------------------------------------------------------------------

  /** The kernel's actions that change the world become messages to the server. */
  private relay(): void {
    const k = this.k;
    const studio = k.interact.bind(k);
    k.interact = async () => (k.zone === 'sim' ? this.interact() : studio());
    k.perform = (id, action) => this.perform(id, action);
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
    this.relayCarried();
    if (this.session.master) k.rollback = (id?: string) => this.rollbackBranch(id);
    else for (const name of LATER) (k as unknown as Record<string, () => undefined>)[name] = () => this.later();
  }

  /**
   * What the wanderer carries (T39b): every change goes to the server, which does it as them. What only moves
   * things between pockets, bags and an open container is done here at once too, without its words (the answer
   * brings the server's); the rest shows when the answer and the next update come.
   */
  private relayCarried(): void {
    const k = this.k;
    const here = {
      useSlot: k.useSlot.bind(k),
      equipSlot: k.equipSlot.bind(k),
      moveSlot: k.moveSlot.bind(k),
      putIntoBag: k.putIntoBag.bind(k),
      takeFromBag: k.takeFromBag.bind(k),
      takeFromContainer: k.takeFromContainer.bind(k),
      putIntoContainer: k.putIntoContainer.bind(k),
      performMenu: k.performMenu.bind(k),
    };
    const words = async (r: Promise<Outcome>) => {
      const o = await r;
      return o.testo ?? o.motivo ?? '';
    };
    k.useSlot = (i) => {
      const s = k.inventory().slots[i];
      if (!s) return;
      // A bag opens here, a rune joins the phrase here: both are the client's own.
      if (k.content.get(s.item)?.container || s.item.startsWith('rune:')) return here.useSlot(i);
      void this.carry({ t: 'oggetto', op: 'usa', slot: i });
    };
    k.equipSlot = (i) => void this.carry({ t: 'oggetto', op: 'impugna', slot: i }, () => here.equipSlot(i));
    k.moveSlot = (a, b) => void this.carry({ t: 'oggetto', op: 'sposta', slot: a, verso: b }, () => here.moveSlot(a, b));
    k.dropSlot = (i, n) => {
      if (k.zone !== 'sim' || !k.inventory().slots[i]) return;
      // Gone from the pocket at once; the thing on the ground comes with the next update.
      void this.carry({ t: 'oggetto', op: 'posa', slot: i, ...(n !== undefined ? { quanti: n } : {}) }, () => void takeFromSlot(k.inventory(), i, n));
    };
    k.putIntoBag = (bag, i) => void this.carry({ t: 'oggetto', op: 'in_borsa', slot: i, borsa: bag }, () => here.putIntoBag(bag, i));
    k.takeFromBag = (bag, i) => void this.carry({ t: 'oggetto', op: 'da_borsa', slot: i, borsa: bag }, () => here.takeFromBag(bag, i));
    k.itemAct = (i, action) => void this.carry({ t: 'oggetto', op: 'azione', slot: i, azione: action });
    k.freeItemAction = (i, text) => words(this.carry({ t: 'altro', slot: i, testo: text }));
    k.craft = (id) => {
      if (!k.recipes().available.has(id)) {
        k.message('Ti manca qualcosa per farlo.', 'warn');
        return false;
      }
      void this.carry({ t: 'fabbrica', ricetta: id });
      return true;
    };
    k.freeCraft = async (text) => {
      const r = await this.carry({ t: 'fabbrica', testo: text });
      return { ok: r.ok, story: r.testo ?? r.motivo ?? '' };
    };
    k.combine = (a, b) => words(this.carry({ t: 'fabbrica', unisci: [a, b] }));
    k.openContainer = (id) => {
      const sid = this.server.get(id);
      if (sid !== undefined) void this.carry({ t: 'contenitore', entita: sid, op: 'apri' });
      return k.container(id);
    };
    const box = (id: number, op: 'prendi' | 'metti', slot: number, now: () => void) => {
      const sid = this.server.get(id);
      if (sid === undefined) return;
      void this.carry({ t: 'contenitore', entita: sid, op, slot }, k.container(id)?.inv ? now : undefined);
    };
    k.takeFromContainer = (id, slot) => box(id, 'prendi', slot, () => here.takeFromContainer(id, slot));
    k.putIntoContainer = (id, slot) => box(id, 'metti', slot, () => here.putIntoContainer(id, slot));
    k.equip = (panel, slot, i) => {
      void this.carry({ t: 'pannello', pannello: panel, op: 'metti', posto: slot, slot: i });
      return true;
    };
    k.unequip = (panel, slot) => {
      void this.carry({ t: 'pannello', pannello: panel, op: 'togli', posto: slot });
      return true;
    };
    k.uiAction = (panel, action) => void this.carry({ t: 'pannello', pannello: panel, op: 'pulsante', azione: action });
    k.performMenu = async (option, entity, col, row) => {
      if (option.startsWith('e:') && entity >= 0) return this.perform(entity, option.slice(2));
      // «Altro…» on the tile opens its window here; the words go with freeTileAction.
      if (option === 't:altro') return here.performMenu(option, entity, col, row);
      if (option.startsWith('t:')) await this.carry({ t: 'casella', col, row, azione: option.slice(2) });
    };
    k.freeTileAction = (col, row, text) => words(this.carry({ t: 'altro', col, row, testo: text }));
  }

  /**
   * Something done with what the wanderer carries: `now`, if given, does here at once what the server will do (and
   * meanwhile the server's updates do not undo it); the answer is shown.
   */
  private carry(msg: Act, now?: () => void): Promise<Outcome> {
    const answer = this.session.act(msg);
    if (!now) return this.show(answer);
    const k = this.k;
    const say = k.message;
    k.message = () => undefined;
    try {
      now();
    } finally {
      k.message = say;
    }
    return this.show(this.sent(answer));
  }

  /** A container as the server has it: what it holds, and its window if the answer opened it. */
  private container(v: ContainerView): void {
    const k = this.k;
    const id = this.local.get(v.entita);
    if (id === undefined || !k.ecs.alive.has(id)) return;
    k.ecs.set(id, 'container', { ...k.ecs.get(id, 'container'), inv: structuredClone(v.inv), filled: true });
    if (v.apri) k.bus.emit('ui:container', { id, name: k.nameOf(id) });
    else k.bus.emit('inventory:changed', {});
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

  /** A message that changed the hand or what is carried here: while it is under way, the server's do not overwrite them. */
  private async sent(answer: Promise<Outcome>): Promise<Outcome> {
    this.pending++;
    try {
      return await answer;
    } finally {
      this.pending--;
      // Once nothing is under way, the hand is what the server has (it may have kept fewer runes): the answer comes
      // before the update of the same tick, so it is the next update that says it.
      if (!this.pending) this.adopt = true;
    }
  }

  /** What came of something the wanderer did, shown as the world would show it. */
  private async show(answer: Promise<Outcome>): Promise<Outcome> {
    const r = await answer;
    const k = this.k;
    for (const m of r.messaggi ?? []) k.message(m);
    for (const d of r.dialoghi ?? []) k.bus.emit('ui:dialog', d);
    if (!r.ok && r.motivo) k.message(r.motivo, 'warn');
    if (r.contenitore) this.container(r.contenitore);
    // A bag the world opened (an action on something carried): its window is the client's.
    if (r.borsa !== undefined) k.bus.emit('ui:bag', { slot: r.borsa });
    return r;
  }
}
