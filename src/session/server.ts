// The server of a game of many (T38, ADR-0058): the only source of truth. It holds the kernel (headless, as
// in the tests), takes a link per client, gives each one the world as it is when it comes in, then about ten
// times a second what changed near its wanderer. A client says where its wanderer went and what they do; the
// server checks the step with the kernel's collision and pace and corrects it, and answers every action with
// what came of it. No DOM, no network here: the links are given (WebSocket in server/session.ts, fake in tests).

import type { Kernel } from '../kernel/kernel';
import { validWandererId } from '../kernel/wanderers';
import { THING_PARTS, type ClientMsg, type ItemOp, type Dialog, type FormView, type Me, type MyState, type OtherView, type PlaceView, type ServerLink, type ServerMsg, type ThingView } from './protocol';

export interface SessionOptions {
  /** Updates per second to every client. */
  hz?: number;
  /** How far (tiles) a client sees things and other wanderers. */
  near?: number;
  /** How far (tiles) a wanderer reaches the things they act on. */
  reach?: number;
}

/** Seconds of walking a client may send at once (the network bunches steps): more than that is too fast. */
const BURST = 0.5;
/** A step a little faster than the pace still passes (timing of the client's frames). */
const TOLERANCE = 1.15;
/** How far the server's position may be from the claimed one before the client is corrected. */
const CORRECT = 0.05;
/**
 * A step claimed this far from where the wanderer is was not walked: it was sent before the world carried them
 * elsewhere (T39), or it is a lie. Either way they stay where they are and the client is told.
 */
const FAR = 8;

const round = (v: number) => Math.round(v * 1000) / 1000;
/** An index from the wire: an integer, or -1 (which no pocket is). */
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : -1);

/** An answer that is both a verdict and words (a free craft that did not come off still tells why). */
class Said {
  constructor(
    readonly ok: boolean,
    readonly testo: string,
  ) {}
}

/** What the world says back while a wanderer acts: messages, dialogs, the container or bag it opened. */
interface Acted<T> {
  ok: boolean;
  value?: T;
  messaggi: string[];
  dialoghi: Dialog[];
  opened?: number;
  borsa?: number;
}

interface Answer {
  ok: boolean;
  value?: unknown;
  messaggi?: string[];
  dialoghi?: Dialog[];
  motivo?: string;
  opened?: number;
  borsa?: number;
  /** A container changed by the action (taken from, put into): its content goes with the answer. */
  box?: number;
}

interface Client {
  id: string;
  link: ServerLink;
  /** Tiles the wanderer may still walk now. */
  budget: number;
  me?: string;
  stato?: string;
  places: Map<string, number>;
  /** What the client knows of each thing in sight: what it is, and where it last was. */
  things: Map<number, { look: string; x: number; y: number }>;
  others: Map<string, string>;
}

export class SessionServer {
  private clients = new Map<string, Client>();
  private inbox: Array<{ c: Client; msg: ClientMsg }> = [];
  private since = 0;
  readonly hz: number;
  readonly near: number;
  readonly reach: number;

  constructor(
    readonly kernel: Kernel,
    opts: SessionOptions = {},
  ) {
    this.hz = opts.hz ?? 10;
    this.near = opts.near ?? 24;
    this.reach = opts.reach ?? 3;
  }

  /** The wanderers connected now. */
  connected(): string[] {
    return [...this.clients.keys()];
  }

  /** A new link: the client says who it is (`entra`), then it is a wanderer of this world until the link closes. */
  connect(link: ServerLink): void {
    let client: Client | undefined;
    link.onMessage((msg) => {
      if (client) {
        if (msg && typeof msg === 'object') this.inbox.push({ c: client, msg });
        return;
      }
      if (msg?.t !== 'entra') return;
      client = this.join(link, msg.id, msg.nome);
      if (!client) link.close();
    });
    link.onClose(() => {
      if (!client || this.clients.get(client.id) !== client) return;
      this.clients.delete(client.id);
      this.kernel.setRemote(client.id, false);
      // What they carry stays theirs, saved; their entity leaves the world (`io` stays, without a client).
      this.kernel.removeWanderer(client.id);
    });
  }

  private join(link: ServerLink, id: unknown, nome: unknown): Client | undefined {
    if (!validWandererId(id)) {
      link.send({ t: 'rifiuto', motivo: 'id del viandante non valido' });
      return undefined;
    }
    if (this.clients.has(id)) {
      link.send({ t: 'rifiuto', motivo: 'questo viandante è già nel mondo' });
      return undefined;
    }
    if (this.kernel.addWanderer(id, typeof nome === 'string' ? nome : undefined) === undefined) {
      link.send({ t: 'rifiuto', motivo: 'il viandante non può entrare' });
      return undefined;
    }
    this.kernel.setRemote(id, true);
    const c: Client = { id, link, budget: this.kernel.paceOf(id) * BURST, places: new Map(), things: new Map(), others: new Map() };
    this.clients.set(id, c);
    const u = this.view(c);
    const w = this.kernel.wanderers().find((x) => x.id === id)!;
    const forma = this.formOf(this.kernel.wandererAt(id)?.entity);
    link.send({
      t: 'ingresso',
      id,
      nome: w.nome,
      ...(forma ? { forma } : {}),
      tick: u.tick,
      ora: u.ora,
      files: this.kernel.files,
      me: u.me!,
      stato: u.stato ?? {},
      luoghi: u.luoghi ?? [],
      cose: u.cose ?? [],
      viandanti: u.viandanti ?? [],
    });
    return c;
  }

  /** One tick of the world: the clients' messages in the order they came, the kernel, and (at `hz`) the updates. */
  tick(dt: number): void {
    for (const c of this.clients.values()) c.budget = Math.min(c.budget + this.kernel.paceOf(c.id) * dt * TOLERANCE, this.kernel.paceOf(c.id) * BURST + 0.25);
    const inbox = this.inbox;
    this.inbox = [];
    for (const { c, msg } of inbox) if (this.clients.get(c.id) === c) this.handle(c, msg);
    this.kernel.tick(dt);
    this.since += dt;
    if (this.since + 1e-9 < 1 / this.hz) return;
    this.since = 0;
    for (const c of this.clients.values()) {
      const u = this.view(c);
      if (u.me || u.stato || u.luoghi || u.cose || u.via || u.viandanti || u.partiti) c.link.send(u);
    }
  }

  private handle(c: Client, msg: ClientMsg): void {
    if (msg.t === 'passo') return this.step(c, msg.seq, msg.x, msg.y);
    const seq = Number((msg as { seq?: unknown }).seq) || 0;
    const k = this.kernel;
    if (msg.t === 'altro' && (msg.slot !== undefined || msg.col !== undefined || msg.row !== undefined)) return this.freeOn(c, seq, msg);
    switch (msg.t) {
      case 'frase': {
        const tokens = Array.isArray(msg.tokens) ? msg.tokens.filter((t) => typeof t === 'string').slice(0, 24) : [];
        // Only what they carry stays in the hand (`syncHand`).
        const hand = this.act(c, () => {
          Object.assign(k.hand(), { tokens, sel: Math.max(0, tokens.length - 1) });
          k.syncHand();
          return k.hand().tokens.join(' ');
        });
        return this.answer(c, seq, { ...hand, ok: hand.value === tokens.join(' ') });
      }
      case 'incidi':
        return this.answer(c, seq, this.act(c, () => k.inscribeHand()));
      case 'pronuncia':
        return void this.later(c, seq, () => k.castSpell());
      case 'oggetto':
        return this.item(c, seq, msg);
      case 'contenitore': {
        const id = Number(msg.entita);
        const why = this.outOfReach(c, id) ?? (k.ecs.has(id, 'container') ? undefined : 'non si apre');
        if (why) return this.answer(c, seq, { ok: false, motivo: why });
        const slot = int(msg.slot);
        if (msg.op === 'apri') return this.answer(c, seq, this.act(c, () => !!k.openContainer(id)));
        if (msg.op === 'prendi') return this.answer(c, seq, { ...this.act(c, () => k.takeFromContainer(id, slot)), box: id });
        if (msg.op === 'metti') return this.answer(c, seq, { ...this.act(c, () => k.putIntoContainer(id, slot)), box: id });
        break;
      }
      case 'fabbrica': {
        const recipe = msg.ricetta;
        const text = msg.testo;
        if (typeof recipe === 'string') return this.answer(c, seq, this.act(c, () => k.craft(recipe)));
        if (typeof text === 'string')
          return void this.later(c, seq, async () => {
            const r = await k.freeCraft(text);
            return new Said(r.ok, r.story);
          });
        if (Array.isArray(msg.unisci)) {
          const [a, b] = msg.unisci.map(int);
          return void this.later(c, seq, () => k.combine(a, b));
        }
        break;
      }
      case 'pannello': {
        const panel = String(msg.pannello ?? '');
        const slot = String(msg.posto ?? '');
        if (msg.op === 'metti') return this.answer(c, seq, this.act(c, () => k.equip(panel, slot, int(msg.slot))));
        if (msg.op === 'togli') return this.answer(c, seq, this.act(c, () => k.unequip(panel, slot)));
        if (msg.op === 'pulsante') return this.answer(c, seq, this.act(c, () => k.uiAction(panel, String(msg.azione ?? ''))));
        break;
      }
      case 'casella': {
        const why = this.tileOutOfReach(c, msg.col, msg.row) ?? (typeof msg.azione === 'string' && msg.azione && msg.azione !== 'altro' ? undefined : 'azione sconosciuta');
        if (why) return this.answer(c, seq, { ok: false, motivo: why });
        return void this.later(c, seq, () => k.performMenu(`t:${msg.azione}`, -1, msg.col, msg.row));
      }
      case 'azione':
      case 'altro':
      case 'chat': {
        const why = this.outOfReach(c, msg.entita);
        if (why) return this.answer(c, seq, { ok: false, motivo: why });
        // A rune on the ground is picked up as with E in front of it.
        if (msg.t === 'azione' && msg.azione === 'raccogli' && k.ecs.has(msg.entita, 'rune')) return this.answer(c, seq, this.act(c, () => k.pickUpRune(msg.entita)));
        if (msg.t === 'azione') return void this.later(c, seq, () => k.perform(msg.entita, String(msg.azione ?? '')));
        if (msg.t === 'altro') return void this.later(c, seq, () => k.freeAction(Number(msg.entita), String(msg.testo ?? '')));
        return void this.later(c, seq, async () => (await k.talk(msg.entita, String(msg.testo ?? ''), c.id)).say);
      }
    }
    this.answer(c, seq, { ok: false, motivo: 'messaggio sconosciuto' });
  }

  /** A step claimed by the client: as far as the pace allows and the world lets them, corrected if it differs. */
  private step(c: Client, seq: unknown, x: unknown, y: unknown): void {
    const k = this.kernel;
    const at = k.wandererAt(c.id);
    if (!at) return;
    // Only numbers: on the wire what is not a number becomes null, and null is not 0.
    const to = { x: typeof x === 'number' ? x : NaN, y: typeof y === 'number' ? y : NaN };
    if (!Number.isFinite(to.x) || !Number.isFinite(to.y) || Math.hypot(to.x - at.x, to.y - at.y) > FAR) return c.link.send({ t: 'correzione', seq: Number(seq) || 0, x: round(at.x), y: round(at.y) });
    const got = k.stepWanderer(c.id, to, Math.max(0, c.budget)) ?? at;
    c.budget -= Math.hypot(got.x - at.x, got.y - at.y);
    if (Math.hypot(got.x - to.x, got.y - to.y) > CORRECT) c.link.send({ t: 'correzione', seq: Number(seq) || 0, x: round(got.x), y: round(got.y) });
  }

  /** Something carried (T39b): what the kernel does with a pocket of the inventory, as the wanderer. */
  private item(c: Client, seq: number, msg: Extract<ClientMsg, { t: 'oggetto' }>): void {
    const k = this.kernel;
    const slot = this.pocket(c, msg.slot);
    const to = this.pocket(c, msg.verso);
    const bag = this.pocket(c, msg.borsa);
    const count = msg.quanti === undefined ? undefined : int(msg.quanti);
    const ops: Record<ItemOp, () => unknown> = {
      usa: () => k.useSlot(slot),
      impugna: () => k.equipSlot(slot),
      posa: () => (count === undefined || count > 0) && k.dropSlot(slot, count),
      sposta: () => to >= 0 && k.moveSlot(slot, to),
      in_borsa: () => k.putIntoBag(bag, slot),
      // In a bag the index is of the bag's own pockets (the kernel checks it).
      da_borsa: () => bag >= 0 && k.takeFromBag(bag, int(msg.slot)),
      azione: () => k.itemAct(slot, String(msg.azione ?? '')),
    };
    if (!Object.hasOwn(ops, msg.op)) return this.answer(c, seq, { ok: false, motivo: 'messaggio sconosciuto' });
    if (msg.op !== 'da_borsa' && slot < 0) return this.answer(c, seq, { ok: false, motivo: 'non porti niente lì' });
    this.answer(c, seq, this.act(c, ops[msg.op]));
  }

  /** «Altro…» on something carried, or on a tile. */
  private freeOn(c: Client, seq: number, msg: Extract<ClientMsg, { t: 'altro' }>): void {
    const k = this.kernel;
    const text = String(msg.testo ?? '');
    if (msg.slot !== undefined) {
      const slot = this.pocket(c, msg.slot);
      if (slot < 0) return this.answer(c, seq, { ok: false, motivo: 'non porti niente lì' });
      return void this.later(c, seq, () => k.freeItemAction(slot, text));
    }
    const why = this.tileOutOfReach(c, msg.col, msg.row);
    if (why) return this.answer(c, seq, { ok: false, motivo: why });
    void this.later(c, seq, () => k.freeTileAction(msg.col!, msg.row!, text));
  }

  /** A pocket of the wanderer's inventory from the wire, or -1. */
  private pocket(c: Client, v: unknown): number {
    const i = int(v);
    return i >= 0 && i < this.kernel.as(c.id, () => this.kernel.inventory().slots.length) ? i : -1;
  }

  private tileOutOfReach(c: Client, col: unknown, row: unknown): string | undefined {
    const x = int(col);
    const y = int(row);
    if (x !== col || y !== row) return 'non c’è niente lì';
    const at = this.kernel.wandererAt(c.id)!;
    return Math.hypot(x + 0.5 - at.x, y + 0.5 - at.y) > this.reach ? 'è troppo lontano' : undefined;
  }

  private outOfReach(c: Client, entity: unknown): string | undefined {
    const k = this.kernel;
    const id = Number(entity);
    const p = Number.isInteger(id) && k.ecs.alive.has(id) ? k.ecs.get(id, 'pos') : undefined;
    if (!p || k.ecs.has(id, 'player')) return 'non c’è niente lì';
    const at = k.wandererAt(c.id)!;
    return Math.hypot(p.x - at.x, p.y - at.y) > this.reach ? 'è troppo lontano' : undefined;
  }

  /** Runs what the wanderer does, as them, and keeps what the world says meanwhile (messages and dialogs). */
  private act<T>(c: Client, fn: () => T): Acted<T> {
    const k = this.kernel;
    const said: string[] = [];
    const dialogs: Dialog[] = [];
    const seen: { opened?: number; borsa?: number } = {};
    const off = [
      k.bus.on('ui:message', (m) => said.push(String(m?.text ?? ''))),
      k.bus.on('ui:dialog', (d) => d?.text && dialogs.push({ ...(d.speaker ? { speaker: String(d.speaker) } : {}), text: String(d.text) })),
      // A window the world would open: the container goes with the answer, the bag the client opens itself.
      k.bus.on('ui:container', (b) => Number.isInteger(b?.id) && (seen.opened = b.id)),
      k.bus.on('ui:bag', (b) => Number.isInteger(b?.slot) && (seen.borsa = b.slot)),
    ];
    try {
      const value = k.as(c.id, fn);
      return { ok: value !== false, value, messaggi: said.filter(Boolean), dialoghi: dialogs, ...seen };
    } catch (e) {
      return { ok: false, messaggi: [...said, (e as Error).message], dialoghi: dialogs, ...seen };
    } finally {
      off.forEach((f) => f());
    }
  }

  /** An action that waits for the Council: its synchronous start runs as the wanderer, the answer comes when it is ready. */
  private async later(c: Client, seq: number, fn: () => Promise<unknown>): Promise<void> {
    const started = this.act(c, fn);
    let value: unknown;
    let ok = started.ok;
    let motivo: string | undefined;
    try {
      value = await started.value;
      ok = value !== false;
      if (value instanceof Said) ({ ok, testo: value } = value);
    } catch (e) {
      ok = false;
      motivo = (e as Error).message;
    }
    this.answer(c, seq, { ...started, ok, value, motivo });
  }

  private answer(c: Client, seq: number, r: Answer): void {
    if (this.clients.get(c.id) !== c) return;
    const k = this.kernel;
    const boxId = r.opened ?? r.box;
    const box = boxId !== undefined && k.ecs.alive.has(boxId) ? k.container(boxId) : undefined;
    c.link.send({
      t: 'esito',
      seq,
      ok: r.ok,
      ...(typeof r.value === 'string' && r.value ? { testo: r.value } : {}),
      ...(r.messaggi?.length ? { messaggi: r.messaggi } : {}),
      ...(r.dialoghi?.length ? { dialoghi: r.dialoghi } : {}),
      ...(r.motivo ? { motivo: r.motivo } : {}),
      ...(box ? { contenitore: { entita: boxId!, inv: box.inv, ...(r.opened !== undefined ? { apri: true } : {}) } } : {}),
      ...(r.borsa !== undefined ? { borsa: r.borsa } : {}),
    });
  }

  /** What changed near the client's wanderer since it last heard (everything, the first time). */
  private view(c: Client): Extract<ServerMsg, { t: 'aggiorna' }> {
    const k = this.kernel;
    const out: Extract<ServerMsg, { t: 'aggiorna' }> = { t: 'aggiorna', tick: k.ticks, ora: round(k.time) };
    const at = k.wandererAt(c.id);
    if (!at) return out;
    const me: Me = { x: round(at.x), y: round(at.y), facing: at.facing };
    const meKey = JSON.stringify(me);
    if (meKey !== c.me) out.me = me;
    c.me = meKey;
    const stato: MyState = k.as(c.id, () => ({ needs: k.needs() as unknown as Record<string, number>, hand: k.hand(), inventory: k.inventory(), stati: k.states(), slots: k.slots() }));
    const sKey = JSON.stringify(stato);
    if (sKey !== c.stato) out.stato = JSON.parse(sKey);
    c.stato = sKey;
    const S = k.config.chunkSize;
    const places: PlaceView[] = [];
    for (const ch of k.chunks.values()) {
      const far = Math.max(Math.abs(ch.cx * S + S / 2 - at.x), Math.abs(ch.cy * S + S / 2 - at.y)) - S / 2;
      if (far > this.near || c.places.get(ch.key) === ch.version) continue;
      c.places.set(ch.key, ch.version);
      places.push({
        key: ch.key,
        cx: ch.cx,
        cy: ch.cy,
        tiles: ch.tiles,
        stage: ch.stage,
        version: ch.version,
        ...(ch.place?.name ? { nome: ch.place.name, descrizione: ch.place.description } : {}),
        ...(ch.buildings.length ? { lotti: ch.buildings.map((b) => [b.x0, b.y0, b.x1, b.y1]) } : {}),
      });
    }
    if (places.length) out.luoghi = places;
    const things: ThingView[] = [];
    const inSight = new Set<number>();
    for (const id of k.ecs.query('pos')) {
      if (k.ecs.has(id, 'player')) continue;
      const p = k.ecs.get(id, 'pos');
      if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y) || Math.hypot(p.x - at.x, p.y - at.y) > this.near) continue;
      inSight.add(id);
      const look = this.lookOf(id);
      const key = JSON.stringify(look);
      const x = round(p.x);
      const y = round(p.y);
      const seen = c.things.get(id);
      if (!seen || seen.look !== key) things.push({ id, x, y, ...look });
      else if (seen.x !== x || seen.y !== y) things.push({ id, x, y });
      c.things.set(id, { look: key, x, y });
    }
    if (things.length) out.cose = things;
    const gone = [...c.things.keys()].filter((id) => !inSight.has(id));
    for (const id of gone) c.things.delete(id);
    if (gone.length) out.via = gone;
    const others: OtherView[] = [];
    const near = new Set<string>();
    for (const w of k.wanderers()) {
      if (w.id === c.id) continue;
      const o = k.wandererAt(w.id);
      if (!o || Math.hypot(o.x - at.x, o.y - at.y) > this.near) continue;
      near.add(w.id);
      const form = this.formOf(o.entity);
      const b = k.bubbles.get(o.entity);
      const v: OtherView = { id: w.id, nome: w.nome, x: round(o.x), y: round(o.y), facing: o.facing, ...(form ? { form } : {}), ...(b ? { testo: b.text } : {}) };
      const key = JSON.stringify(v);
      if (c.others.get(w.id) !== key) others.push(v);
      c.others.set(w.id, key);
    }
    if (others.length) out.viandanti = others;
    const left = [...c.others.keys()].filter((id) => !near.has(id));
    for (const id of left) c.others.delete(id);
    if (left.length) out.partiti = left;
    return out;
  }

  /** What a thing is, for a client that draws it: everything but where it is. */
  private lookOf(id: number): Omit<ThingView, 'id' | 'x' | 'y'> {
    const k = this.kernel;
    const m = k.ecs.get(id, 'module')?.id ?? k.ecs.get(id, 'pickup')?.item;
    const form = this.formOf(id);
    const b = k.bubbles.get(id);
    const parts: Record<string, unknown> = {};
    for (const name of THING_PARTS) {
      if (!k.ecs.has(id, name)) continue;
      const v = k.ecs.get(id, name);
      parts[name] = name === 'mind' ? {} : name === 'identity' ? { name: v?.name } : name === 'container' ? { size: v?.size } : v;
    }
    return {
      ...(m ? { m: String(m) } : {}),
      ...(form ? { form } : {}),
      ...(k.ecs.has(id, 'glyph') ? { glyph: k.ecs.get(id, 'glyph') } : {}),
      ...(Object.keys(parts).length ? { c: parts } : {}),
      ...(b ? { testo: b.text } : {}),
    };
  }

  private formOf(id: number | undefined): FormView | undefined {
    const f = id !== undefined ? this.kernel.ecs.get(id, 'form') : undefined;
    return f ? { model: f.model, seed: f.seed, ...(f.yaw ? { yaw: f.yaw } : {}), ...(f.tint ? { tint: f.tint } : {}), ...(f.done?.length ? { done: [...f.done] } : {}) } : undefined;
  }
}
