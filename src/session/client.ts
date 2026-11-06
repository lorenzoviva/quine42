// The client side of a session (T38, ADR-0058): what a client knows of the world, as the server tells it. It
// keeps the files, its wanderer, the places, the entities and the other wanderers in sight, sends its steps and
// actions, and takes back the server's corrections. No kernel and no drawing here: the thin client of T39
// gives this to the renderer.

import type { AiSettings, FileMap } from '../kernel/types';
import type { FeedEntry } from '../kernel/agents/council';
import type { PlayerSpot } from '../kernel/situation';
import type { Profile } from '../kernel/wanderers';
import type { ClientLink, ClientMsg, ContainerView, Dialog, FileChanges, FormView, Me, MyState, Notice, OtherView, ChunkView, ServerMsg, EntityView } from './protocol';

export interface Outcome {
  ok: boolean;
  testo?: string;
  /** The profile as the server repaired it, and the look that came of it (T44a). */
  profilo?: Profile;
  forma?: FormView;
  /** What the Council made of a request (T42e). */
  fatto?: string;
  messaggi?: string[];
  dialoghi?: Dialog[];
  motivo?: string;
  contenitore?: ContainerView;
  borsa?: number;
}

type Action = Exclude<ClientMsg, { t: 'entra' } | { t: 'passo' } | { t: 'tasti' }>;
type WithoutSeq<T> = T extends { seq: number } ? Omit<T, 'seq'> : never;

export class SessionClient {
  id = '';
  nome = '';
  /** Who this wanderer is to the others (T44a), as the server repaired it; what it repaired when they came in. */
  profilo?: Profile;
  riparato: string[] = [];
  /** Signed in anonymously (T44b): what they ask is made with the local models, until they link a Google account. */
  anonimo = false;
  /** What the server made of the settings the master brought from the lobby (T247): refused when a match is under way. */
  settingsAnswer?: { ok: boolean; motivo?: string; riparati?: string[] };
  /** Whether this wanderer is the master (T41): only the master hears the Council and gets all the files. */
  master = false;
  /** The platform fee, as the server said to the master (ADR-0132). */
  commissione?: number;
  /** What the Council said (the master's only), oldest first. */
  readonly feed: FeedEntry[] = [];
  /** The world's files: those it came in with, as the server said they changed since. */
  files: FileMap = {};
  /** The master's branch as the server kept it (T42b): what they changed that the world does not have yet. */
  branch: FileChanges = {};
  tick = 0;
  ora = 0;
  me?: Me;
  /** The look of this client's wanderer. */
  forma?: FormView;
  stato: MyState = {};
  readonly places = new Map<string, ChunkView>();
  readonly entities = new Map<number, EntityView>();
  readonly others = new Map<string, OtherView>();
  /** The master's (T42c): every player connected and where they are, as the server last said. */
  players: PlayerSpot[] = [];
  /** What the other wanderers said to this one and gave them (T43a), oldest first. */
  readonly notices: Notice[] = [];
  /** Steps the server did not let through. */
  corrections = 0;
  refused?: string;
  private seq = 0;
  private waiting = new Map<number, (o: Outcome) => void>();
  private entered?: () => void;
  /** Resolves when the server has let the wanderer in (or refused them). */
  readonly ready: Promise<void>;
  onMessage?: (msg: ServerMsg) => void;

  constructor(
    private link: ClientLink,
    private who: { id: string; nome?: string; profilo?: Partial<Profile>; token?: string; tetto?: number; regolazioni?: AiSettings; freshToken?: () => Promise<string> },
  ) {
    this.ready = new Promise((r) => (this.entered = r));
    link.onMessage((m) => this.receive(m));
    link.onClose(() => {
      for (const done of this.waiting.values()) done({ ok: false, motivo: 'collegamento chiuso' });
      this.waiting.clear();
      this.entered?.();
    });
    this.enter(who.token);
  }

  private enter(token: string | undefined): void {
    const who = this.who;
    this.link.send({
      t: 'entra',
      id: who.id,
      ...(who.nome ? { nome: who.nome } : {}),
      ...(who.profilo ? { profilo: who.profilo } : {}),
      ...(token ? { token } : {}),
      ...(typeof who.tetto === 'number' ? { tetto: who.tetto } : {}),
      ...(who.regolazioni ? { regolazioni: who.regolazioni } : {}),
    });
    // The master's settings are said once: entering again, into a world started again, is not choosing again.
    delete who.regolazioni;
  }

  /** The world started again (T127): what was asked of the old one has no answer, and this client comes in again as the wanderer it was. */
  private reenter(): void {
    for (const done of this.waiting.values()) done({ ok: false, motivo: 'il mondo è ripartito' });
    this.waiting.clear();
    // The first token may have expired by now.
    void (this.who.freshToken?.() ?? Promise.resolve(this.who.token)).catch(() => this.who.token).then((token) => this.enter(token));
  }

  /** The wanderer walked here (world space): it is so here at once, the server may correct it. */
  move(x: number, y: number): number {
    const seq = ++this.seq;
    if (this.me) this.me = { ...this.me, x, y };
    this.link.send({ t: 'passo', seq, x, y });
    return seq;
  }

  private heldSaid = '';

  /** The directions the wanderer holds (T263): said to the server only when they change. */
  keys(held: string[]): void {
    const key = held.join(',');
    if (key === this.heldSaid) return;
    this.heldSaid = key;
    this.link.send({ t: 'tasti', tenuti: held });
  }

  /** Something the wanderer does; the answer is what came of it. */
  act(a: WithoutSeq<Action>): Promise<Outcome> {
    const seq = ++this.seq;
    return new Promise((done) => {
      this.waiting.set(seq, done);
      this.link.send({ ...a, seq } as ClientMsg);
    });
  }

  leave(): void {
    this.link.close();
  }

  private receive(m: ServerMsg): void {
    switch (m.t) {
      case 'rifiuto':
        this.refused = m.motivo;
        this.entered?.();
        break;
      case 'mondo':
        if (m.stato === 'ripartito') this.reenter();
        break;
      case 'ingresso':
        Object.assign(this, { id: m.id, nome: m.nome, profilo: m.profilo, riparato: m.riparato ?? [], anonimo: !!m.anonimo, master: !!m.master, commissione: m.commissione, files: m.files, branch: m.ramo ?? {}, me: m.me, forma: m.forma, stato: m.stato });
        if (m.regolazioni) this.settingsAnswer = m.regolazioni;
        this.feed.splice(0, this.feed.length, ...(m.concilio ?? []));
        this.places.clear();
        this.entities.clear();
        this.others.clear();
        this.apply(m);
        this.entered?.();
        break;
      case 'aggiorna':
        if (m.me) this.me = m.me;
        if (m.stato) this.stato = m.stato;
        this.notices.push(...(m.avvisi ?? []));
        if (this.notices.length > 100) this.notices.splice(0, this.notices.length - 100);
        this.apply(m);
        break;
      case 'correzione':
        this.corrections++;
        if (this.me) this.me = { ...this.me, x: m.x, y: m.y };
        break;
      case 'file': {
        const files = { ...this.files };
        for (const [p, v] of Object.entries(m.files)) {
          if (v === null) delete files[p];
          else files[p] = v;
        }
        this.files = files;
        break;
      }
      case 'concilio':
        this.feed.push(...m.voci);
        if (this.feed.length > 400) this.feed.splice(0, this.feed.length - 400);
        break;
      case 'esito': {
        const done = this.waiting.get(m.seq);
        this.waiting.delete(m.seq);
        const { t: _t, seq: _seq, ...outcome } = m;
        if (m.profilo) Object.assign(this, { profilo: m.profilo, nome: m.profilo.name });
        if (m.forma) this.forma = m.forma;
        done?.(outcome);
        break;
      }
    }
    this.onMessage?.(m);
  }

  private apply(m: { tick: number; ora: number; luoghi?: ChunkView[]; cose?: EntityView[]; via?: number[]; viandanti?: OtherView[]; partiti?: string[]; giocatori?: PlayerSpot[] }): void {
    this.tick = m.tick;
    this.ora = m.ora;
    if (m.giocatori) this.players = m.giocatori;
    for (const p of m.luoghi ?? []) this.places.set(p.key, p);
    // An entity that only moved keeps what it is.
    for (const t of m.cose ?? []) this.entities.set(t.id, Object.keys(t).length > 3 ? t : { ...(this.entities.get(t.id) ?? t), x: t.x, y: t.y });
    for (const id of m.via ?? []) this.entities.delete(id);
    for (const o of m.viandanti ?? []) this.others.set(o.id, o);
    for (const id of m.partiti ?? []) this.others.delete(id);
  }
}
