// The server of a game of many (T38, ADR-0058): the only source of truth. It holds the kernel (headless, as
// in the tests), takes a link per client, gives each one the world as it is when it comes in, then about ten
// times a second what changed near its wanderer. A client says where its wanderer went and what they do; the
// server checks the step with the kernel's collision and pace and corrects it, and answers every action with
// what came of it. No DOM, no network here: the links are given (WebSocket in server/session.ts, fake in tests).

import { PER_WANDERER, type Kernel } from '../kernel/kernel';
import { AGENTS, type AgentId, type FeedEntry } from '../kernel/agents/council';
import { ATLAS_FILE } from '../kernel/atlas';
import { RELIEF_PATH } from '../kernel/relief';
import type { FileMap } from '../kernel/types';
import { validWandererId } from '../kernel/wanderers';
import { hashStr, hex } from '../kernel/rng';
import { THING_PARTS, type ClientMsg, type FileChanges, type ItemOp, type Dialog, type FormView, type Me, type MyState, type Notice, type OtherView, type PlaceView, type ServerLink, type ServerMsg, type ThingView } from './protocol';

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

/** What the Council said that the master has not heard yet: older words are dropped past this. */
const FEED_KEEP = 400;

/**
 * The files a player's client gets (T41): what it draws and walks with. The universe's settings, the models, the
 * relief and the atlas; the modules' manifests without their code and their cases, but for the systems the client
 * runs itself (`PER_WANDERER`). Prompts, the bible, the rules, the people and their memories, the plots, the graph,
 * the cards, the costs and the other wanderers stay on the server: they are the studio's, the master's.
 */
export function playerFiles(files: FileMap): FileMap {
  const out: FileMap = {};
  for (const [path, text] of Object.entries(files)) {
    if (path === 'universe.json' || path === ATLAS_FILE || path === RELIEF_PATH || path.startsWith('models/')) out[path] = text;
    if (!/^modules\/[^/]+\/manifest\.json$/.test(path)) continue;
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(text);
    } catch {
      // Unreadable on the server too: the client fails on it the same way.
      out[path] = text;
      continue;
    }
    const dir = path.slice(0, -'manifest.json'.length);
    if (typeof m.logic === 'string' && PER_WANDERER.has(String(m.id)) && files[dir + m.logic] !== undefined) out[dir + m.logic] = files[dir + m.logic];
    else delete m.logic;
    delete m.casi;
    out[path] = JSON.stringify(m, null, 2) + '\n';
  }
  return out;
}

/**
 * What a player's client gets of the files that changed (T42b), as `playerFiles` gives them: a module goes again whole (its
 * manifest without code, its code only for `PER_WANDERER`), a file gone goes as null if it is one a client would have.
 */
export function playerChanges(files: FileMap, changed: string[]): FileChanges {
  const dirOf = (p: string) => /^modules\/[^/]+\//.exec(p)?.[0];
  const dirs = new Set<string>();
  const subset: FileMap = {};
  for (const p of changed) {
    const d = dirOf(p);
    if (d) dirs.add(d);
    else if (files[p] !== undefined) subset[p] = files[p];
  }
  for (const [p, v] of Object.entries(files)) if (dirs.has(dirOf(p) ?? '')) subset[p] = v;
  const out: FileChanges = { ...playerFiles(subset) };
  for (const p of changed) if (files[p] === undefined && (dirOf(p) || p in playerFiles({ [p]: '' }))) out[p] = null;
  return out;
}

/** Files with changes on top (null: gone). */
export function withChanges(files: FileMap, changes: FileChanges): FileMap {
  const out = { ...files };
  for (const [p, v] of Object.entries(changes)) {
    if (v === null) delete out[p];
    else out[p] = v;
  }
  return out;
}

/** What changed from one set of files to the next. */
export function changesBetween(a: FileMap, b: FileMap): FileChanges {
  const out: FileChanges = {};
  for (const [p, v] of Object.entries(b)) if (a[p] !== v) out[p] = v;
  for (const p of Object.keys(a)) if (b[p] === undefined) out[p] = null;
  return out;
}

/** The hash of a file's text as a branch's base says it (null: there was no such file). */
export const fileHash = (text: string | undefined): string | null => (text === undefined ? null : hex(hashStr(text)));

/** The branch of the universe's repository where the master's changes wait to be published (T42b). */
export const BRANCH = 'master';
/** At most this many files in a branch, each at most this long. */
const BRANCH_FILES = 2000;
const BRANCH_TEXT = 4 * 1024 * 1024;
const PATH_RE = /^[\w.-]+(?:\/[\w.-]+)*$/;

/** A branch from the wire: paths inside the universe, texts or null; undefined if anything is not so. */
function cleanBranch(files: unknown): FileChanges | undefined {
  if (!files || typeof files !== 'object' || Array.isArray(files)) return undefined;
  const entries = Object.entries(files as Record<string, unknown>);
  if (entries.length > BRANCH_FILES) return undefined;
  const out: FileChanges = {};
  for (const [p, v] of entries) {
    if (!PATH_RE.test(p) || p.split('/').some((s) => s === '.' || s === '..' || s === '.git')) return undefined;
    if (v !== null && (typeof v !== 'string' || v.length > BRANCH_TEXT)) return undefined;
    out[p] = v;
  }
  return out;
}

/** The first files of a list, for a commit's message. */
const listOf = (paths: string[]) => paths.slice(0, 6).join(', ') + (paths.length > 6 ? '…' : '');
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
  /** What the Council made of a request (T42e). */
  fatto?: string;
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
  /** The master follows this player (T42c): what they get is what is around them. */
  watch?: string;
  /** The players connected, as the master last heard of them. */
  players?: string;
  /** What the other wanderers did to this one since the last update (T43a). */
  notices: Notice[];
}

export class SessionServer {
  private clients = new Map<string, Client>();
  private inbox: Array<{ c: Client; msg: ClientMsg }> = [];
  private since = 0;
  /** The Council's feed since the last update, for the masters connected. */
  private voices: FeedEntry[] = [];
  /**
   * The master's branch (T42b): the files they changed and try alone, and the main line's version each was changed
   * from. The world does not have them until they publish.
   */
  private branch: { files: FileChanges; base: Record<string, string | null> } = { files: {}, base: {} };
  /** The kernel of the master's branch, where their requests to the Council run (T42e), and the queue of those requests. */
  private forked?: Promise<Kernel>;
  private asking: Promise<unknown> = Promise.resolve();
  /** The world's files as the clients last heard of them (a copy: the kernel's may be the repository's working files, written in place). */
  private told: FileMap;
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
    this.told = { ...kernel.files };
    kernel.bus.on('council', (e: FeedEntry) => {
      this.voices.push(e);
      if (this.voices.length > FEED_KEEP) this.voices.shift();
    });
    // Words and gifts between wanderers (T43a): who they were for hears of them with the next update.
    const notify = (tipo: Notice['tipo']) => (e: { da?: unknown; a?: unknown; testo?: unknown }) => {
      const to = typeof e?.a === 'string' ? this.clients.get(e.a) : undefined;
      const da = String(e?.da ?? '');
      if (to && to.notices.length < 50) to.notices.push({ tipo, da, nome: kernel.wanderers().find((w) => w.id === da)?.nome ?? da, testo: String(e?.testo ?? '') });
    };
    kernel.bus.on('wanderer:said', notify('dici'));
    kernel.bus.on('wanderer:gave', notify('dai'));
  }

  /** The master's branch now: what they changed that the world does not have yet. */
  branchFiles(): FileChanges {
    return { ...this.branch.files };
  }

  /** A branch kept on disk (the server started again): changed from the main line as it is now. */
  restoreBranch(files: FileChanges): void {
    const clean = cleanBranch(files) ?? {};
    this.branch = { files: clean, base: Object.fromEntries(Object.keys(clean).map((p) => [p, fileHash(this.kernel.files[p])])) };
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
    const c: Client = { id, link, budget: this.kernel.paceOf(id) * BURST, places: new Map(), things: new Map(), others: new Map(), notices: [] };
    this.clients.set(id, c);
    const u = this.view(c);
    const w = this.kernel.wanderers().find((x) => x.id === id)!;
    const forma = this.formOf(this.kernel.wandererAt(id)?.entity);
    const master = this.kernel.isMaster(id);
    link.send({
      t: 'ingresso',
      id,
      nome: w.nome,
      ...(master ? { master: true as const, concilio: this.kernel.feed().slice(-FEED_KEEP), ...(Object.keys(this.branch.files).length ? { ramo: { ...this.branch.files } } : {}) } : {}),
      ...(forma ? { forma } : {}),
      tick: u.tick,
      ora: u.ora,
      files: master ? this.kernel.files : playerFiles(this.kernel.files),
      me: u.me!,
      stato: u.stato ?? {},
      luoghi: u.luoghi ?? [],
      cose: u.cose ?? [],
      viandanti: u.viandanti ?? [],
      ...(u.giocatori ? { giocatori: u.giocatori } : {}),
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
    const voices = this.voices;
    this.voices = [];
    const files = this.kernel.files;
    const changed = changesBetween(this.told, files);
    if (Object.keys(changed).length) this.told = { ...files };
    const paths = Object.keys(changed);
    let shown: FileChanges | undefined;
    for (const c of this.clients.values()) {
      if (voices.length && this.kernel.isMaster(c.id)) c.link.send({ t: 'concilio', voci: voices });
      // The world's files that changed (the Council, a publication): the master hears of all, a player of what it has.
      if (paths.length) {
        const mine = this.kernel.isMaster(c.id) ? changed : (shown ??= playerChanges(files, paths));
        if (Object.keys(mine).length) c.link.send({ t: 'file', files: mine });
      }
      const u = this.view(c);
      if (u.me || u.stato || u.luoghi || u.cose || u.via || u.viandanti || u.partiti || u.avvisi) c.link.send(u);
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
      case 'ramo':
        return this.answer(c, seq, this.takeBranch(c, msg.files, msg.base));
      case 'pubblica':
        return this.answer(c, seq, this.publish(c));
      case 'segui':
        return this.answer(c, seq, this.watch(c, msg.id));
      case 'agente':
        return this.askOnBranch(c, seq, msg.agente, msg.testo);
      case 'dici':
        return this.answer(c, seq, this.act(c, () => k.sayTo(String(msg.viandante ?? ''), String(msg.testo ?? ''))));
      case 'dai': {
        const slot = this.pocket(c, msg.slot);
        if (slot < 0) return this.answer(c, seq, { ok: false, motivo: 'non porti niente lì' });
        return this.answer(c, seq, this.act(c, () => k.giveTo(String(msg.viandante ?? ''), slot, msg.quanti === undefined ? undefined : int(msg.quanti))));
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

  /** The master's branch, whole, as their client has it now; kept on disk too, on the branch `master`. */
  private takeBranch(c: Client, files: unknown, base: unknown): Answer {
    const k = this.kernel;
    if (!k.isMaster(c.id)) return { ok: false, motivo: 'solo il master ha un ramo' };
    const clean = cleanBranch(files);
    if (!clean) return { ok: false, motivo: 'ramo non valido' };
    const b = base && typeof base === 'object' ? (base as Record<string, unknown>) : {};
    this.branch = { files: clean, base: Object.fromEntries(Object.keys(clean).map((p) => [p, typeof b[p] === 'string' ? (b[p] as string) : null])) };
    void k.repo.backend?.branch?.(BRANCH, clean, `ramo del master: ${listOf(Object.keys(clean)) || 'vuoto'}`, 'player');
    return { ok: true };
  }

  /**
   * The master talks to an agent of the Council (T42e), the Referente or a team in the corona: the request runs here, on
   * the server's Council, in a kernel of their branch, one at a time; what it commits there goes on the branch, the world
   * does not have it until they publish. The master hears of the files (`ramo`), then the answer.
   */
  private askOnBranch(c: Client, seq: number, agente: unknown, testo: unknown): void {
    if (!this.kernel.isMaster(c.id)) return this.answer(c, seq, { ok: false, motivo: 'solo il master parla con il Concilio' });
    if (typeof agente !== 'string' || !(agente in AGENTS) || typeof testo !== 'string' || !testo.trim()) return this.answer(c, seq, { ok: false, motivo: 'richiesta non valida' });
    const ask = this.asking.then(() => this.onBranch(c, agente as AgentId, testo.slice(0, 2000)));
    this.asking = ask.catch(() => undefined);
    void ask.then(
      (r) => this.answer(c, seq, r),
      (e) => this.answer(c, seq, { ok: false, motivo: (e as Error).message }),
    );
  }

  private async onBranch(c: Client, agente: AgentId, testo: string): Promise<Answer> {
    const k = this.kernel;
    const main = { ...k.files };
    const fork = await (this.forked ??= k.branchKernel(withChanges(main, this.branch.files), c.id));
    // The branch kernel comes up to the world and the branch as they are now.
    const repo = fork.repo;
    const now = changesBetween(repo.restore(), withChanges(main, this.branch.files));
    if (Object.keys(now).length) {
      for (const [p, v] of Object.entries(now)) repo.write(p, v);
      fork.applyFiles({ ...repo.working });
      repo.commit('il mondo e il ramo del master', 'kernel');
    }
    const before = { ...repo.head().files };
    const r = await fork.talkToAgent(agente, testo);
    // Runes are not files (T42f): they go into the master's pouch in the world, now.
    if (r.runes?.length) k.as(c.id, () => k.grantRunes(r.runes!));
    // Only what was committed (valid) goes on the branch.
    const made = changesBetween(before, repo.head().files);
    const paths = Object.keys(made);
    if (paths.length) {
      const { files, base } = this.branch;
      for (const [p, v] of Object.entries(made)) {
        if ((main[p] ?? null) === v) {
          delete files[p];
          delete base[p];
          continue;
        }
        if (!(p in files)) base[p] = fileHash(main[p]);
        files[p] = v;
      }
      void k.repo.backend?.branch?.(BRANCH, { ...files }, `ramo del master: ${AGENTS[agente].name}, ${listOf(paths)}`, 'agent');
      if (this.clients.get(c.id) === c) c.link.send({ t: 'ramo', files: made });
    }
    return { ok: true, value: r.say, ...(r.forged ? { fatto: r.forged } : {}) };
  }

  /**
   * The master's branch into the world: one commit of the main line, then (on disk) the branch merged into it. What the
   * world changed meanwhile in the same files gives way to the master's version, and the Council's feed says so.
   */
  private publish(c: Client): Answer {
    const k = this.kernel;
    if (!k.isMaster(c.id)) return { ok: false, motivo: 'solo il master pubblica' };
    const { files, base } = this.branch;
    const paths = Object.keys(files);
    if (!paths.length) return { ok: false, motivo: 'niente da pubblicare' };
    const conflicts = paths.filter((p) => base[p] !== fileHash(k.files[p]));
    const r = k.publish(files, `pubblicazione del master: ${listOf(paths)}`);
    if (!r.ok) return { ok: false, motivo: r.motivo };
    for (const p of conflicts) k.council.say('kernel', 'info', `pubblicazione: ${p} era cambiato anche nel mondo, resta la versione del master`);
    this.branch = { files: {}, base: {} };
    void k.repo.backend?.merge?.(BRANCH, `il ramo ${BRANCH} nel mondo (${r.commit!.id})`);
    return { ok: true, value: `Pubblicato: ${paths.length} file${conflicts.length ? `, ${conflicts.length} cambiati anche nel mondo (resta il tuo)` : ''}.` };
  }

  /**
   * The master follows a player (T42c), without leaving where they are: the places, things and wanderers sent are those
   * around the player, until they stop (no id) or the player leaves.
   */
  private watch(c: Client, id: unknown): Answer {
    if (!this.kernel.isMaster(c.id)) return { ok: false, motivo: 'solo il master segue i giocatori' };
    if (id === undefined || id === null || id === '') {
      c.watch = undefined;
      return { ok: true };
    }
    if (typeof id !== 'string' || id === c.id || !this.clients.has(id)) return { ok: false, motivo: 'nessun giocatore collegato con questo nome' };
    c.watch = id;
    return { ok: true };
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
      ...(r.fatto ? { fatto: r.fatto } : {}),
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
    if (c.notices.length) out.avvisi = c.notices.splice(0);
    const at = k.wandererAt(c.id);
    if (!at) return out;
    const me: Me = { x: round(at.x), y: round(at.y), facing: at.facing };
    const meKey = JSON.stringify(me);
    if (meKey !== c.me) out.me = me;
    c.me = meKey;
    // What is around: the wanderer, or the player the master follows (T42c), while they are in the world.
    if (c.watch && (!this.clients.has(c.watch) || !k.inWorld(c.watch))) c.watch = undefined;
    const centre = (c.watch && k.wandererAt(c.watch)) || at;
    if (k.isMaster(c.id)) {
      const players = [...this.clients.keys()].flatMap((id) => {
        const o = id !== c.id && k.inWorld(id) ? k.wandererAt(id) : undefined;
        return o ? [{ id, nome: k.wanderers().find((w) => w.id === id)?.nome ?? id, x: round(o.x), y: round(o.y) }] : [];
      });
      const key = JSON.stringify(players);
      if (key !== c.players) out.giocatori = players;
      c.players = key;
    }
    const stato: MyState = k.as(c.id, () => ({ needs: k.needs() as unknown as Record<string, number>, hand: k.hand(), inventory: k.inventory(), stati: k.states(), slots: k.slots() }));
    const sKey = JSON.stringify(stato);
    if (sKey !== c.stato) out.stato = JSON.parse(sKey);
    c.stato = sKey;
    const S = k.config.chunkSize;
    const places: PlaceView[] = [];
    for (const ch of k.chunks.values()) {
      const far = Math.max(Math.abs(ch.cx * S + S / 2 - centre.x), Math.abs(ch.cy * S + S / 2 - centre.y)) - S / 2;
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
      if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y) || Math.hypot(p.x - centre.x, p.y - centre.y) > this.near) continue;
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
      if (w.id === c.id || !k.inWorld(w.id)) continue;
      const o = k.wandererAt(w.id);
      if (!o || Math.hypot(o.x - centre.x, o.y - centre.y) > this.near) continue;
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
