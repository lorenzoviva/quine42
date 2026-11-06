// The session protocol (T38, ADR-0058): in a multiplayer game the kernel runs on the server and every client
// speaks to it over one link (a WebSocket at /api/session, or the fake one of the tests). Messages are plain
// JSON; positions are in the world's space (the carpet's, ADR-0004): every wanderer has a carpet of their
// own, so a client draws itself where it likes on its circle and tells the server only where it is in the world.

import type { AiSettings, FileMap } from '../kernel/types';
import type { Inventory } from '../kernel/inventory';
import type { FeedEntry } from '../kernel/agents/council';
import type { PlayerSpot } from '../kernel/situation';
import type { Profile } from '../kernel/wanderers';

/** A tick of the server's world and its hour. */
export interface Clock {
  tick: number;
  time: number;
}

/** The wanderer of this client: where they are, and what they carry and are (when it changed). */
export interface Me {
  x: number;
  y: number;
  facing: string;
}

export interface MyState {
  needs?: Record<string, number>;
  hand?: { tokens: string[]; sel: number };
  inventory?: unknown;
  states?: Record<string, unknown>;
  /** What sits in the slots of the mechanics' panels (T39b). */
  slots?: Record<string, Record<string, { item: string; count: number } | null>>;
  /** The wanderer's credit balance in USD (T45a). */
  credits?: number;
  /** What the panels of the mechanics show (T263, ADR-0139): `component.field` → value, only the fields a manifest's `ui` names. */
  fields?: Record<string, string | number | boolean>;
}

/** A place near the wanderer: its tiles, sent again when they change. */
export interface ChunkView {
  key: string;
  cx: number;
  cy: number;
  tiles: string;
  stage: 'draft' | 'planned';
  name?: string;
  description?: string;
  /** The lots of its structures (`x0 y0 x1 y1` in the place's cells): the ground is flat on them (ADR-0048). */
  lots?: number[][];
  /** The cells where its draft has the open sea: its water lies at the sea's level (T51a). */
  sea?: number[];
  /** The ground dug or raised and the water that has flowed (T51b): cell → levels, cell → bed and water. */
  digs?: Record<string, number>;
  water?: Record<string, [number, number] | [number, number, string]>;
  version: number;
}

/** The form of an entity: its program, its seed, how it is turned and coloured, the actions done on it. */
export interface FormView {
  model: string;
  seed: number | string;
  yaw?: number;
  tint?: string;
  done?: string[];
}

/** An entity of the world near the wanderer; after the first time only what moved (`x`, `y`) or changed. */
export interface EntityView {
  id: number;
  x: number;
  y: number;
  /** Its module, or the item it is on the ground. */
  m?: string;
  form?: FormView;
  glyph?: unknown;
  /** The other components a client draws it and makes its menu with (`ENTITY_PARTS`): to pick up, a rune, a body, a light…; and `structure: {stage}` for a building under way (T245e). */
  c?: Record<string, unknown>;
  /** What it is saying, while it says it. */
  text?: string;
}

/**
 * The components of an entity a client gets (T39): what the renderer and the menus read. Its mind, its memories and
 * what it carries stay on the server; of `identity` only the name, of `mind` only that it has one. `placed` (T291): the height of
 * the shelf a thing lies on, from which the mirror rests it on the furniture it has too.
 */
export const ENTITY_PARTS = ['pickup', 'rune', 'body', 'interact', 'light', 'fire', 'activity', 'wander', 'container', 'identity', 'mind', 'placed'] as const;

/** Another wanderer in sight. */
export interface OtherView {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: string;
  form?: FormView;
  /** What they are saying, while they say it. */
  text?: string;
  /** What they say of themselves (their profile, T44a). */
  introduction?: string;
}

export type ClientMsg =
  /**
   * Coming in, as who (T44a): the profile, if the client has one, is checked and repaired by the server. With accounts
   * (T44b, ADR-0082) `token` is the account's (Firebase) and the server makes the id from it; `id` is then not heard;
   * `cap` is the spending cap in USD for this session (T45d, ADR-0086), which the server keeps within the balance. Being anonymous is
   * the token's to say, not the client's (T120, ADR-0102).
   */
  | { t: 'join'; id: string; name?: string; profile?: Partial<Profile>; token?: string; cap?: number; settings?: AiSettings }
  /** The wanderer chooses again who they are (T44a): the answer says the profile as the server repaired it. */
  | { t: 'profile'; seq: number; profile: Partial<Profile> }
  /** Where the client's wanderer is now, in the world: the server checks the step and may correct it. */
  | { t: 'step'; seq: number; x: number; y: number }
  /** The directions the wanderer holds, in the world's terms (T263): what `input.held(action, id)` reads on the server. No answer. */
  | { t: 'keys'; held: string[] }
  | { t: 'phrase'; seq: number; tokens: string[] }
  | { t: 'inscribe'; seq: number }
  | { t: 'cast'; seq: number }
  /** An action of an entity's menu (`raccogli`, `apri`, `usa`, `leggi`, `modello:<nome>`…). */
  | { t: 'action'; seq: number; entity: number; action: string }
  /** «Altro…»: what the wanderer tries on an entity, on something they carry (`slot`) or on a tile (`col`, `row`), judged by the Council. */
  | { t: 'other'; seq: number; entity?: number; slot?: number; col?: number; row?: number; wanderer?: string; text: string }
  | { t: 'chat'; seq: number; entity: number; text: string }
  /** Words to another wanderer nearby (T43a): a bubble above who speaks, and who is spoken to hears them. */
  | { t: 'say'; seq: number; wanderer: string; text: string }
  /** Something carried (`slot`, `count` of it: all by default) to another wanderer beside them (T43a). */
  | { t: 'give'; seq: number; wanderer: string; slot: number; count?: number }
  /** Something they carry (T39b): `slot` is a slot; `toward` where it goes, `bag` the slot of the bag, `count` how many. */
  | { t: 'item'; seq: number; op: ItemOp; slot: number; toward?: number; bag?: number; count?: number; action?: string }
  /** A container in the world: opened (its content comes in the answer), something taken from it or put into it. */
  | { t: 'container'; seq: number; entity: number; op: 'open' | 'take' | 'put'; slot?: number }
  /** Making something: a known recipe, a free description, or two things carried put together. */
  | { t: 'craft'; seq: number; recipe?: string; text?: string; combine?: [number, number] }
  /** A panel of a mechanic (ADR-0028): something put into or taken from its slot `socket`, or a button. */
  | { t: 'panel'; seq: number; panel: string; op: 'put' | 'remove' | 'button'; socket?: string; slot?: number; action?: string }
  /** An action learned on a kind of terrain, done on a tile (ADR-0029). */
  | { t: 'tile'; seq: number; col: number; row: number; action: string }
  /**
   * The master's branch (T42b), whole: every file it changes against the main line (null: deleted), and the hash of the
   * main line's version it was changed from (null: it was not there), to tell what the world changed meanwhile.
   */
  | { t: 'branch'; seq: number; files: FileChanges; base: Record<string, string | null> }
  /** The master publishes their branch: it goes into the world, for everyone. */
  | { t: 'publish'; seq: number }
  /** The master follows a player (T42c): what is sent is what is around them; without `id`, around the master again. */
  | { t: 'follow'; seq: number; id?: string }
  /** The master talks to an agent of the Council in the corona (T42e): what it makes goes on their branch. */
  | { t: 'agent'; seq: number; agent: string; text: string }
  /** The master gives credits by hand (ADR-0104), within the day's cap. */
  | { t: 'recharge'; seq: number; wanderer: string; count: number };


/** Files changed: their new text, or null when they are gone. */
export type FileChanges = Record<string, string | null>;

/** What can be done with something carried: use, hold, drop, move, put into or take from a bag, a learned action. */
export type ItemOp = 'use' | 'wield' | 'put_down' | 'move' | 'to_bag' | 'from_bag' | 'action';

/** A container as the wanderer sees it once open; `open` when this answer opened it. */
export interface ContainerView {
  entity: number;
  inv: Inventory;
  open?: boolean;
}

export type ServerMsg =
  /**
   * Coming in: the files (a player gets only what a client draws and walks with, `playerFiles`), whether this
   * wanderer is the master (T41) and, only for the master, the platform fee their console shows (ADR-0132), the Council's feed so far and their branch (T42b); the
   * master's updates say (`players`) every player connected and where they are, when it changes (T42c).
   */
  | ({ t: 'welcome'; id: string; name: string; profile?: Profile; repaired?: string[]; settings?: { ok: boolean; reason?: string; repaired?: string[] }; anonymous?: true; master?: true; fee?: number; council?: FeedEntry[]; branch?: FileChanges; files: FileMap; me: Me; form?: FormView; state: MyState; chunks: ChunkView[]; entities: EntityView[]; wanderers: OtherView[]; players?: PlayerSpot[] } & Clock)
  | ({ t: 'update'; me?: Me; state?: MyState; chunks?: ChunkView[]; entities?: EntityView[]; gone?: number[]; wanderers?: OtherView[]; departed?: string[]; players?: PlayerSpot[]; notices?: Notice[] } & Clock)
  /** The step was not possible (too fast, through a wall): the wanderer is here. */
  | { t: 'correction'; seq: number; x: number; y: number }
  /**
   * What came of a message: what the world said back meanwhile, and the answer if there is one; the container it
   * opened or changed, with what is in it, and the slot of a bag it opened.
   */
  | { t: 'result'; seq: number; ok: boolean; text?: string; profile?: Profile; form?: FormView; done?: string; messages?: string[]; dialogues?: Dialog[]; reason?: string; container?: ContainerView; bag?: number }
  | { t: 'refusal'; reason: string }
  /** The world's process has stopped, went on, or started again (T127): the client stays, and after `restarted` comes in again. */
  | { t: 'world'; state: 'stopped' | 'resumed' | 'restarted'; text: string }
  /** What the Council said meanwhile (T41): only to the master, never to a player. */
  | { t: 'council'; entries: FeedEntry[] }
  /** The world's files changed (the Council, a publication: T42b); a player hears only of those its client has. */
  | { t: 'file'; files: FileChanges }
  /** What the Council made on the master's branch (T42e): only to the master, the files it changed there. */
  | { t: 'branch'; files: FileChanges };

/** What another wanderer did to this one (T43a, T43b), what death cost them (T43c), or credits notice (T45d). */
export interface Notice {
  type: 'say' | 'give' | 'other' | 'death' | 'credits';
  from: string;
  name: string;
  text: string;
  /** A death (T44c): what it took, and where the wanderer wakes up. */
  lost?: string[];
  where?: 'here' | 'square';
  /** Why, when the credits or the cap are exhausted (T45d). */
  reason?: 'exhausted' | 'cap';
}

/** A line someone (or something) said back, as the game shows it in its dialog box. */
export interface Dialog {
  speaker?: string;
  text: string;
}

/** One side of a link between a client and the server. */
export interface Link<In, Out> {
  send(msg: Out): void;
  onMessage(fn: (msg: In) => void): void;
  onClose(fn: () => void): void;
  close(): void;
}

export type ServerLink = Link<ClientMsg, ServerMsg>;
export type ClientLink = Link<ServerMsg, ClientMsg>;

/**
 * Two ends of a link in the same process (the tests' transport): what one sends the other receives at once,
 * through JSON as on the wire, so nothing that would not survive the network gets through.
 */
export function fakeLink(): { server: ServerLink; client: ClientLink } {
  type End = { fns: Array<(m: any) => void>; closes: Array<() => void> };
  const a: End = { fns: [], closes: [] };
  const b: End = { fns: [], closes: [] };
  let open = true;
  const close = () => {
    if (!open) return;
    open = false;
    for (const f of [...a.closes, ...b.closes]) f();
  };
  const end = (mine: End, theirs: End) => ({
    send: (msg: unknown) => {
      if (!open) return;
      const wire = JSON.parse(JSON.stringify(msg));
      for (const f of theirs.fns) f(wire);
    },
    onMessage: (fn: (m: any) => void) => void mine.fns.push(fn),
    onClose: (fn: () => void) => void mine.closes.push(fn),
    close,
  });
  return { server: end(a, b), client: end(b, a) };
}
