// The session protocol (T38, ADR-0058): in a multiplayer game the kernel runs on the server and every client
// speaks to it over one link (a WebSocket at /api/session, or the fake one of the tests). Messages are plain
// JSON; positions are in the world's space (the carpet's, ADR-0004): every wanderer has a carpet of their
// own, so a client draws itself where it likes on its circle and tells the server only where it is in the world.

import type { FileMap, LobbySettings } from '../kernel/types';
import type { Inventory } from '../kernel/inventory';
import type { FeedEntry } from '../kernel/agents/council';
import type { PlayerSpot } from '../kernel/situation';
import type { Profile } from '../kernel/wanderers';
import type { BrokenCard } from '../kernel/brokencards';
import type { WornZone } from '../kernel/wearing';
import type { WorldPace } from '../kernel/worldPace';
import type { RegionRequest } from '../kernel/atlas';
import type { VehicleView } from '../kernel/vehicle';
import type { SpendView } from '../kernel/ai/usage';
import type { WindView } from '../kernel/wind';

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
  /** What the models cost in this session as this wanderer is shown it (T496): the world's to the master, their own to the others (`SpendView`). */
  spend?: SpendView;
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
  /** The lot of its block (T370, ADR-0206): `x0 y0 x1 y1` in the place's cells (it goes past the place) and the level it lies flat at. */
  block?: number[];
  /** The cells where its draft has the open sea: its water lies at the sea's level (T51a). */
  sea?: number[];
  /** The ground dug or raised and the water that has flowed (T51b): cell → levels, cell → bed and water. */
  digs?: Record<string, number>;
  water?: Record<string, [number, number] | [number, number, string]>;
  /** The strata under its ground (T418, ADR-0091): rows of codes of the generator's `strata`; sent when the client has not had them yet. */
  strata?: string[];
  /** Its ramps (T474, ADR-0250): the earth the server moved, tile → levels, so the client's ground is the server's; none today. */
  ramps?: Record<string, number>;
  /** Base relief levels of a place in a true-relief world (T475, ADR-0256): S×S whole levels, sent when the client has not had them yet. */
  relief?: number[];
  /** Seabed levels of a place in a true-relief world (T480, ADR-0259): S×S whole levels, sent when the client has not had them yet. */
  bed?: number[];
  /**
   * The instances of its cover that are things of the world (T545, ADR-0269): `tile|model|n` (`uncoveredKey`), so the client does not draw
   * them as cover; the cover itself never travels (every client scatters it from the terrain).
   */
  uncovered?: string[];
  version: number;
}

/** The form of an entity: its program, its seed, how it is turned and coloured, the actions done on it. */
export interface FormView {
  model: string;
  seed: number | string;
  yaw?: number;
  tint?: string;
  done?: string[];
  /** The stratum this building's cellar is dug into (T479, ADR-0253), when it has a cellar. */
  stratum?: string;
  /** The pieces of its interior taken away (T514, ADR-0272): their keys, which the client's form of the building draws without. */
  out?: string[];
}

/**
 * Where something stands on a vehicle's deck (T442, ADR-0232): the vehicle (its id on the server) and the point of its deck, in its own frame
 * (tiles from its middle, its bow toward +y). A client draws it there on the vehicle its mirror carries on, so that it does not tremble.
 */
export interface OnDeck {
  on?: number;
  lx?: number;
  ly?: number;
}

/**
 * An entity of the world near the wanderer; after the first time only where it is (`x`, `y`, and `on` on a deck, `vehicle` for a vehicle:
 * a move, `isMove`) or, when it changed, what it is.
 */
export interface EntityView extends OnDeck {
  id: number;
  x: number;
  y: number;
  /** A vehicle (T442): its heading, way and turn, the anchor, who holds the helm; its form comes without `yaw`, which is its heading. */
  vehicle?: VehicleView;
  /** Its module, or the item it is on the ground. */
  m?: string;
  form?: FormView;
  glyph?: unknown;
  /** The other components a client draws it and makes its menu with (`ENTITY_PARTS`): to pick up, a rune, a body, a light…; and `structure: {stage}` for a building under way (T245e). */
  c?: Record<string, unknown>;
  /** What it is saying, while it says it. */
  text?: string;
  /** What it wears (T353, ADR-0181): zone → the thing's id, as `OtherView.worn`; of what it carries nothing else. */
  worn?: Partial<Record<WornZone, string>>;
}

/**
 * The components of an entity a client gets (T39): what the renderer and the menus read. Its mind, its memories and
 * what it carries stay on the server; of `identity` only the name, of `mind` only that it has one. `placed` (T291): the height of
 * the shelf a thing lies on, from which the mirror rests it on the furniture it has too. `below` (T417): the height of the cellar's floor a
 * thing stands on, from which the mirror keeps it down there. `fitted` (T514): a piece of a building's interior, what it is and where
 * (`shownFitted`: never who it is), which the mirror finds by its box on its storey and does not draw.
 */
export const ENTITY_PARTS = ['pickup', 'rune', 'body', 'interact', 'light', 'fire', 'activity', 'wander', 'container', 'identity', 'mind', 'placed', 'below', 'fitted'] as const;

/** The fields of an `EntityView` that only say where it is (T442): a view with no other is a move, the look stays as it was. */
export const MOVE_FIELDS: ReadonlySet<string> = new Set(['id', 'x', 'y', 'on', 'lx', 'ly', 'vehicle']);

/** Whether a view of an entity only says where it is (a move), not what it is. */
export const isMove = (t: object): boolean => Object.keys(t).every((k) => MOVE_FIELDS.has(k));

/** Another wanderer in sight; on a vehicle's deck (T442) where on it too (`on`, `lx`, `ly`). */
export interface OtherView extends OnDeck {
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
  /** The item they wield (T288, ADR-0167): its id, which the client's files make a look of. Nothing else of what they carry. */
  held?: string;
  /** When what they hold is a thing of the world they carry (T292, ADR-0168): the seed of its look, as it stood. Not who it is. */
  heldSeed?: number;
  /** What they wear (T290, ADR-0180): zone → the thing's id, which the client's files dress their body with. Nothing else of what they carry. */
  worn?: Partial<Record<WornZone, string>>;
}

export type ClientMsg =
  /**
   * Coming in, as who (T44a): the profile, if the client has one, is checked and repaired by the server. With accounts
   * (T44b, ADR-0082) `token` is the account's (Firebase) and the server makes the id from it; `id` is then not heard;
   * `cap` is the spending cap in USD for this session (T45d, ADR-0086), which the server keeps within the balance. Being anonymous is
   * the token's to say, not the client's (T120, ADR-0102).
   */
  | { t: 'join'; id: string; name?: string; profile?: Partial<Profile>; token?: string; cap?: number; settings?: LobbySettings }
  /** The wanderer chooses again who they are (T44a): the answer says the profile as the server repaired it. */
  | { t: 'profile'; seq: number; profile: Partial<Profile> }
  /**
   * Where the client's wanderer is now, in the world: the server checks the step and may correct it. With `on` (T442) they stand on that
   * vehicle's deck and `x`, `y` are in its frame: the server puts them at that point of its deck, where it has it, and the step is what they
   * walked on it, not the voyage.
   */
  | { t: 'step'; seq: number; x: number; y: number; on?: number }
  /** The directions the wanderer holds, in the world's terms (T263): what `input.held(action, id)` reads on the server. No answer. */
  | { t: 'keys'; held: string[] }
  /**
   * A jump (T477): toward (`dx`, `dy`), where the client's keys or face point. The server jumps on its world (`Kernel.jump`) and carries the
   * body; no step of the client counts until it lands, and where it lands is the server's. No answer: refused, a correction.
   */
  | { t: 'jump'; dx?: number; dy?: number }
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
  | { t: 'recharge'; seq: number; wanderer: string; count: number }
  /** The master takes a brought card away from the world (T296, ADR-0172): the card and its copies, with a commit of the kernel. */
  | { t: 'card'; seq: number; op: 'remove'; id: string }
  /**
   * The master sets the pace of the world (T373, ADR-0188 §3): `normal`, `slow` (`placesPerMinute`, never above the lobby's) or `hold`. Only the
   * master, at a pace of its own (`LIMITS.paceRate`); the answer's `text` is the pace as the world took it.
   */
  | { t: 'pace'; seq: number; mode: string; placesPerMinute?: number }
  /**
   * The master declares a region of the atlas or lets one go (T375, ADR-0188 §5, ADR-0201): the world checks it (`masterRegion`) and writes
   * `world/atlas.json` with a commit of the kernel, without calls. Only the master, at the pace of `pace` (`LIMITS.paceRate`); the answer's `text`
   * is the region as the world wrote it.
   */
  | { t: 'region'; seq: number; op: 'declare'; region: RegionRequest }
  | { t: 'region'; seq: number; op: 'release'; id: string };


/** Files changed: their new text, or null when they are gone. */
export type FileChanges = Record<string, string | null>;

/** What can be done with something carried: use, hold, wear or take off (T290), drop, move, put into or take from a bag, a learned action. */
export type ItemOp = 'use' | 'wield' | 'wear' | 'put_down' | 'move' | 'to_bag' | 'from_bag' | 'action';

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
  | ({ t: 'welcome'; id: string; name: string; profile?: Profile; repaired?: string[]; settings?: { ok: boolean; reason?: string; repaired?: string[] }; anonymous?: true; master?: true; fee?: number; council?: FeedEntry[]; branch?: FileChanges; files: FileMap; me: Me; form?: FormView; state: MyState; chunks: ChunkView[]; entities: EntityView[]; wanderers: OtherView[]; players?: PlayerSpot[]; broken?: BrokenCard[]; pace?: WorldPace; wind?: WindView } & Clock)
  /**
   * `wind` (T484, ADR-0255): the coarse wind around the wanderer (`WindView`: one cell every three tiles, two signed bytes a cell), in
   * `welcome` and in `update` at most twice a second of the world and only when it changed; `null` when the world has no wind any more.
   * Nothing else of the automata leaves the server (rule 8f, V-049).
   * `pace` (T373): the pace of the world, to every client, in `welcome` when it is not `normal` and in `update` when it changes: the HUD says
   * that the world is held, outside the world (D54.4).
   * `broken` (T296, ADR-0172): the brought cards that do not work in the world, when the list changes: every client draws the generic of their
   * class in their place, as the world does, and the master's console shows why.
   */
  | ({ t: 'update'; me?: Me; state?: MyState; chunks?: ChunkView[]; entities?: EntityView[]; gone?: number[]; wanderers?: OtherView[]; departed?: string[]; players?: PlayerSpot[]; notices?: Notice[]; broken?: BrokenCard[]; pace?: WorldPace; wind?: WindView | null } & Clock)
  /** The step was not possible (too fast, through a wall), or the world moved them (T442: a hull's push, over the side): the wanderer is here; on a deck, there on it too. */
  | ({ t: 'correction'; seq: number; x: number; y: number } & OnDeck)
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
  /** `world` (T442): words of the world to this wanderer outside what they do (a hull that bumps, a helm let go). */
  type: 'say' | 'give' | 'other' | 'death' | 'credits' | 'world';
  from: string;
  name: string;
  text: string;
  /** A death (T44c): what it took, and where the wanderer wakes up. */
  lost?: string[];
  where?: 'here' | 'square';
  /** Why, when the credits or the cap are exhausted (T45d). */
  reason?: 'exhausted' | 'cap';
  /** How words of the world are said (T442). */
  tone?: 'info' | 'warn' | 'good';
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
