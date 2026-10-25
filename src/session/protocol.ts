// The session protocol (T38, ADR-0058): in a game of many the kernel runs on the server and every client
// speaks to it over one link (a WebSocket at /api/session, or the fake one of the tests). Messages are plain
// JSON; positions are in the world's space (the carpet's, ADR-0004): every wanderer has a carpet of their
// own, so a client draws itself where it likes on its circle and tells the server only where it is in the world.

import type { FileMap } from '../kernel/types';
import type { Inventory } from '../kernel/inventory';
import type { FeedEntry } from '../kernel/agents/council';
import type { PlayerSpot } from '../kernel/situation';

/** A tick of the server's world and its hour. */
export interface Clock {
  tick: number;
  ora: number;
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
  stati?: Record<string, unknown>;
  /** What sits in the slots of the mechanics' panels (T39b). */
  slots?: Record<string, Record<string, { item: string; count: number } | null>>;
}

/** A place near the wanderer: its tiles, sent again when they change. */
export interface PlaceView {
  key: string;
  cx: number;
  cy: number;
  tiles: string;
  stage: 'draft' | 'planned';
  nome?: string;
  descrizione?: string;
  /** The lots of its structures (`x0 y0 x1 y1` in the place's cells): the ground is flat on them (ADR-0048). */
  lotti?: number[][];
  version: number;
}

/** The form of a thing: its program, its seed, how it is turned and coloured, the actions done on it. */
export interface FormView {
  model: string;
  seed: number | string;
  yaw?: number;
  tint?: string;
  done?: string[];
}

/** A thing of the world near the wanderer; after the first time only what moved (`x`, `y`) or changed. */
export interface ThingView {
  id: number;
  x: number;
  y: number;
  /** Its module, or the item it is on the ground. */
  m?: string;
  form?: FormView;
  glyph?: unknown;
  /** The other components a client draws it and makes its menu with (`THING_PARTS`): to pick up, a rune, a body, a light… */
  c?: Record<string, unknown>;
  /** What it is saying, while it says it. */
  testo?: string;
}

/**
 * The components of a thing a client gets (T39): what the renderer and the menus read. Its mind, its memories and
 * what it carries stay on the server; of `identity` only the name, of `mind` only that it has one.
 */
export const THING_PARTS = ['pickup', 'rune', 'body', 'interact', 'luce', 'fuoco', 'attivita', 'wander', 'container', 'identity', 'mind'] as const;

/** Another wanderer in sight. */
export interface OtherView {
  id: string;
  nome: string;
  x: number;
  y: number;
  facing: string;
  form?: FormView;
  /** What they are saying, while they say it. */
  testo?: string;
}

export type ClientMsg =
  | { t: 'entra'; id: string; nome?: string }
  /** Where the client's wanderer is now, in the world: the server checks the step and may correct it. */
  | { t: 'passo'; seq: number; x: number; y: number }
  | { t: 'frase'; seq: number; tokens: string[] }
  | { t: 'incidi'; seq: number }
  | { t: 'pronuncia'; seq: number }
  /** An action of a thing's menu (`raccogli`, `apri`, `usa`, `leggi`, `modello:<nome>`…). */
  | { t: 'azione'; seq: number; entita: number; azione: string }
  /** «Altro…»: what the wanderer tries on a thing, on something they carry (`slot`) or on a tile (`col`, `row`), judged by the Council. */
  | { t: 'altro'; seq: number; entita?: number; slot?: number; col?: number; row?: number; testo: string }
  | { t: 'chat'; seq: number; entita: number; testo: string }
  /** Words to another wanderer nearby (T43a): a bubble above who speaks, and who is spoken to hears them. */
  | { t: 'dici'; seq: number; viandante: string; testo: string }
  /** Something carried (`slot`, `quanti` of it: all by default) to another wanderer beside them (T43a). */
  | { t: 'dai'; seq: number; viandante: string; slot: number; quanti?: number }
  /** Something they carry (T39b): `slot` is a pocket; `verso` where it goes, `borsa` the pocket of the bag, `quanti` how many. */
  | { t: 'oggetto'; seq: number; op: ItemOp; slot: number; verso?: number; borsa?: number; quanti?: number; azione?: string }
  /** A container in the world: opened (its content comes in the answer), something taken from it or put into it. */
  | { t: 'contenitore'; seq: number; entita: number; op: 'apri' | 'prendi' | 'metti'; slot?: number }
  /** Making something: a known recipe, a free description, or two things carried put together. */
  | { t: 'fabbrica'; seq: number; ricetta?: string; testo?: string; unisci?: [number, number] }
  /** A panel of a mechanic (ADR-0028): something put into or taken from its slot `posto`, or a button. */
  | { t: 'pannello'; seq: number; pannello: string; op: 'metti' | 'togli' | 'pulsante'; posto?: string; slot?: number; azione?: string }
  /** An action learned on a kind of terrain, done on a tile (ADR-0029). */
  | { t: 'casella'; seq: number; col: number; row: number; azione: string }
  /**
   * The master's branch (T42b), whole: every file it changes against the main line (null: deleted), and the hash of the
   * main line's version it was changed from (null: it was not there), to tell what the world changed meanwhile.
   */
  | { t: 'ramo'; seq: number; files: FileChanges; base: Record<string, string | null> }
  /** The master publishes their branch: it goes into the world, for everyone. */
  | { t: 'pubblica'; seq: number }
  /** The master follows a player (T42c): what is sent is what is around them; without `id`, around the master again. */
  | { t: 'segui'; seq: number; id?: string }
  /** The master talks to an agent of the Council in the corona (T42e): what it makes goes on their branch. */
  | { t: 'agente'; seq: number; agente: string; testo: string };

/** Files changed: their new text, or null when they are gone. */
export type FileChanges = Record<string, string | null>;

/** What can be done with something carried: use, hold, drop, move, put into or take from a bag, a learned action. */
export type ItemOp = 'usa' | 'impugna' | 'posa' | 'sposta' | 'in_borsa' | 'da_borsa' | 'azione';

/** A container as the wanderer sees it once open; `apri` when this answer opened it. */
export interface ContainerView {
  entita: number;
  inv: Inventory;
  apri?: boolean;
}

export type ServerMsg =
  /**
   * Coming in: the files (a player gets only what a client draws and walks with, `playerFiles`), whether this
   * wanderer is the master (T41) and, only for the master, the Council's feed so far and their branch (T42b); the
   * master's updates say (`giocatori`) every player connected and where they are, when it changes (T42c).
   */
  | ({ t: 'ingresso'; id: string; nome: string; master?: true; concilio?: FeedEntry[]; ramo?: FileChanges; files: FileMap; me: Me; forma?: FormView; stato: MyState; luoghi: PlaceView[]; cose: ThingView[]; viandanti: OtherView[]; giocatori?: PlayerSpot[] } & Clock)
  | ({ t: 'aggiorna'; me?: Me; stato?: MyState; luoghi?: PlaceView[]; cose?: ThingView[]; via?: number[]; viandanti?: OtherView[]; partiti?: string[]; giocatori?: PlayerSpot[]; avvisi?: Notice[] } & Clock)
  /** The step was not possible (too fast, through a wall): the wanderer is here. */
  | { t: 'correzione'; seq: number; x: number; y: number }
  /**
   * What came of a message: what the world said back meanwhile, and the answer if there is one; the container it
   * opened or changed, with what is in it, and the pocket of a bag it opened.
   */
  | { t: 'esito'; seq: number; ok: boolean; testo?: string; fatto?: string; messaggi?: string[]; dialoghi?: Dialog[]; motivo?: string; contenitore?: ContainerView; borsa?: number }
  | { t: 'rifiuto'; motivo: string }
  /** What the Council said meanwhile (T41): only to the master, never to a player. */
  | { t: 'concilio'; voci: FeedEntry[] }
  /** The world's files changed (the Council, a publication: T42b); a player hears only of those its client has. */
  | { t: 'file'; files: FileChanges }
  /** What the Council made on the master's branch (T42e): only to the master, the files it changed there. */
  | { t: 'ramo'; files: FileChanges };

/** What another wanderer did to this one (T43a): words said to them, something given (`testo`: what and how many). */
export interface Notice {
  tipo: 'dici' | 'dai';
  da: string;
  nome: string;
  testo: string;
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
