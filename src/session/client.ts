// The client side of a session (T38, ADR-0058): what a client knows of the world, as the server tells it. It
// keeps the files, its wanderer, the places, the things and the other wanderers in sight, sends its steps and
// actions, and takes back the server's corrections. No kernel and no drawing here: the thin client of T39
// gives this to the renderer.

import type { FileMap } from '../kernel/types';
import type { FeedEntry } from '../kernel/agents/council';
import type { PlayerSpot } from '../kernel/situation';
import type { ClientLink, ClientMsg, ContainerView, Dialog, FileChanges, FormView, Me, MyState, Notice, OtherView, PlaceView, ServerMsg, ThingView } from './protocol';

export interface Outcome {
  ok: boolean;
  testo?: string;
  /** What the Council made of a request (T42e). */
  fatto?: string;
  messaggi?: string[];
  dialoghi?: Dialog[];
  motivo?: string;
  contenitore?: ContainerView;
  borsa?: number;
}

type Action = Exclude<ClientMsg, { t: 'entra' } | { t: 'passo' }>;
type WithoutSeq<T> = T extends { seq: number } ? Omit<T, 'seq'> : never;

export class SessionClient {
  id = '';
  nome = '';
  /** Whether this wanderer is the master (T41): only the master hears the Council and gets all the files. */
  master = false;
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
  readonly places = new Map<string, PlaceView>();
  readonly things = new Map<number, ThingView>();
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
    who: { id: string; nome?: string },
  ) {
    this.ready = new Promise((r) => (this.entered = r));
    link.onMessage((m) => this.receive(m));
    link.onClose(() => {
      for (const done of this.waiting.values()) done({ ok: false, motivo: 'collegamento chiuso' });
      this.waiting.clear();
      this.entered?.();
    });
    link.send({ t: 'entra', id: who.id, ...(who.nome ? { nome: who.nome } : {}) });
  }

  /** The wanderer walked here (world space): it is so here at once, the server may correct it. */
  move(x: number, y: number): number {
    const seq = ++this.seq;
    if (this.me) this.me = { ...this.me, x, y };
    this.link.send({ t: 'passo', seq, x, y });
    return seq;
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
      case 'ingresso':
        Object.assign(this, { id: m.id, nome: m.nome, master: !!m.master, files: m.files, branch: m.ramo ?? {}, me: m.me, forma: m.forma, stato: m.stato });
        this.feed.splice(0, this.feed.length, ...(m.concilio ?? []));
        this.places.clear();
        this.things.clear();
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
        done?.(outcome);
        break;
      }
    }
    this.onMessage?.(m);
  }

  private apply(m: { tick: number; ora: number; luoghi?: PlaceView[]; cose?: ThingView[]; via?: number[]; viandanti?: OtherView[]; partiti?: string[]; giocatori?: PlayerSpot[] }): void {
    this.tick = m.tick;
    this.ora = m.ora;
    if (m.giocatori) this.players = m.giocatori;
    for (const p of m.luoghi ?? []) this.places.set(p.key, p);
    // A thing that only moved keeps what it is.
    for (const t of m.cose ?? []) this.things.set(t.id, Object.keys(t).length > 3 ? t : { ...(this.things.get(t.id) ?? t), x: t.x, y: t.y });
    for (const id of m.via ?? []) this.things.delete(id);
    for (const o of m.viandanti ?? []) this.others.set(o.id, o);
    for (const id of m.partiti ?? []) this.others.delete(id);
  }
}
