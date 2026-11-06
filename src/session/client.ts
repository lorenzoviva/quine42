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
  text?: string;
  /** The profile as the server repaired it, and the look that came of it (T44a). */
  profile?: Profile;
  form?: FormView;
  /** What the Council made of a request (T42e). */
  done?: string;
  messages?: string[];
  dialogues?: Dialog[];
  reason?: string;
  container?: ContainerView;
  bag?: number;
}

type Action = Exclude<ClientMsg, { t: 'join' } | { t: 'step' } | { t: 'keys' }>;
type WithoutSeq<T> = T extends { seq: number } ? Omit<T, 'seq'> : never;

export class SessionClient {
  id = '';
  name = '';
  /** Who this wanderer is to the others (T44a), as the server repaired it; what it repaired when they came in. */
  profile?: Profile;
  repaired: string[] = [];
  /** Signed in anonymously (T44b): what they ask is made with the local models, until they link a Google account. */
  anonymous = false;
  /** What the server made of the settings the master brought from the lobby (T247): refused when a match is under way. */
  settingsAnswer?: { ok: boolean; reason?: string; repaired?: string[] };
  /** Whether this wanderer is the master (T41): only the master hears the Council and gets all the files. */
  master = false;
  /** The platform fee, as the server said to the master (ADR-0132). */
  fee?: number;
  /** What the Council said (the master's only), oldest first. */
  readonly feed: FeedEntry[] = [];
  /** The world's files: those it came in with, as the server said they changed since. */
  files: FileMap = {};
  /** The master's branch as the server kept it (T42b): what they changed that the world does not have yet. */
  branch: FileChanges = {};
  tick = 0;
  time = 0;
  me?: Me;
  /** The look of this client's wanderer. */
  form?: FormView;
  state: MyState = {};
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
    private who: { id: string; name?: string; profile?: Partial<Profile>; token?: string; cap?: number; settings?: AiSettings; freshToken?: () => Promise<string> },
  ) {
    this.ready = new Promise((r) => (this.entered = r));
    link.onMessage((m) => this.receive(m));
    link.onClose(() => {
      for (const done of this.waiting.values()) done({ ok: false, reason: 'collegamento chiuso' });
      this.waiting.clear();
      this.entered?.();
    });
    this.enter(who.token);
  }

  private enter(token: string | undefined): void {
    const who = this.who;
    this.link.send({
      t: 'join',
      id: who.id,
      ...(who.name ? { name: who.name } : {}),
      ...(who.profile ? { profile: who.profile } : {}),
      ...(token ? { token } : {}),
      ...(typeof who.cap === 'number' ? { cap: who.cap } : {}),
      ...(who.settings ? { settings: who.settings } : {}),
    });
    // The master's settings are said once: entering again, into a world started again, is not choosing again.
    delete who.settings;
  }

  /** The world started again (T127): what was asked of the old one has no answer, and this client comes in again as the wanderer it was. */
  private reenter(): void {
    for (const done of this.waiting.values()) done({ ok: false, reason: 'il mondo è ripartito' });
    this.waiting.clear();
    // The first token may have expired by now.
    void (this.who.freshToken?.() ?? Promise.resolve(this.who.token)).catch(() => this.who.token).then((token) => this.enter(token));
  }

  /** The wanderer walked here (world space): it is so here at once, the server may correct it. */
  move(x: number, y: number): number {
    const seq = ++this.seq;
    if (this.me) this.me = { ...this.me, x, y };
    this.link.send({ t: 'step', seq, x, y });
    return seq;
  }

  private heldSaid = '';

  /** The directions the wanderer holds (T263): said to the server only when they change. */
  keys(held: string[]): void {
    const key = held.join(',');
    if (key === this.heldSaid) return;
    this.heldSaid = key;
    this.link.send({ t: 'keys', held });
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
      case 'refusal':
        this.refused = m.reason;
        this.entered?.();
        break;
      case 'world':
        if (m.state === 'restarted') this.reenter();
        break;
      case 'welcome':
        Object.assign(this, { id: m.id, name: m.name, profile: m.profile, repaired: m.repaired ?? [], anonymous: !!m.anonymous, master: !!m.master, fee: m.fee, files: m.files, branch: m.branch ?? {}, me: m.me, form: m.form, state: m.state });
        if (m.settings) this.settingsAnswer = m.settings;
        this.feed.splice(0, this.feed.length, ...(m.council ?? []));
        this.places.clear();
        this.entities.clear();
        this.others.clear();
        this.apply(m);
        this.entered?.();
        break;
      case 'update':
        if (m.me) this.me = m.me;
        if (m.state) this.state = m.state;
        this.notices.push(...(m.notices ?? []));
        if (this.notices.length > 100) this.notices.splice(0, this.notices.length - 100);
        this.apply(m);
        break;
      case 'correction':
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
      case 'council':
        this.feed.push(...m.entries);
        if (this.feed.length > 400) this.feed.splice(0, this.feed.length - 400);
        break;
      case 'result': {
        const done = this.waiting.get(m.seq);
        this.waiting.delete(m.seq);
        const { t: _t, seq: _seq, ...outcome } = m;
        if (m.profile) Object.assign(this, { profile: m.profile, name: m.profile.name });
        if (m.form) this.form = m.form;
        done?.(outcome);
        break;
      }
    }
    this.onMessage?.(m);
  }

  private apply(m: { tick: number; time: number; chunks?: ChunkView[]; entities?: EntityView[]; gone?: number[]; wanderers?: OtherView[]; departed?: string[]; players?: PlayerSpot[] }): void {
    this.tick = m.tick;
    this.time = m.time;
    if (m.players) this.players = m.players;
    for (const p of m.chunks ?? []) this.places.set(p.key, p);
    // An entity that only moved keeps what it is.
    for (const t of m.entities ?? []) this.entities.set(t.id, Object.keys(t).length > 3 ? t : { ...(this.entities.get(t.id) ?? t), x: t.x, y: t.y });
    for (const id of m.gone ?? []) this.entities.delete(id);
    for (const o of m.wanderers ?? []) this.others.set(o.id, o);
    for (const id of m.departed ?? []) this.others.delete(id);
  }
}
