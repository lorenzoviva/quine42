// The session protocol (T38, ADR-0058): in a game of many the kernel runs on the server and every client
// speaks to it over one link (a WebSocket at /api/session, or the fake one of the tests). Messages are plain
// JSON; positions are in the world's space (the carpet's, ADR-0004): every wanderer has a carpet of their
// own, so a client draws itself where it likes on its circle and tells the server only where it is in the world.

import type { FileMap } from '../kernel/types';

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
}

/** A place near the wanderer: its tiles, sent again when they change. */
export interface PlaceView {
  key: string;
  cx: number;
  cy: number;
  tiles: string;
  stage: 'draft' | 'planned';
  nome?: string;
  version: number;
}

/** A thing of the world near the wanderer; after the first time only what moved (`x`, `y`) or changed. */
export interface ThingView {
  id: number;
  x: number;
  y: number;
  /** Its module, or the item it is on the ground. */
  m?: string;
  form?: { model: string; seed: number | string; yaw?: number; tint?: string; done?: string[] };
  glyph?: unknown;
  /** What it is saying, while it says it. */
  testo?: string;
}

/** Another wanderer in sight. */
export interface OtherView {
  id: string;
  nome: string;
  x: number;
  y: number;
  facing: string;
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
  /** «Altro…» on a thing: what the wanderer tries, judged by the Council. */
  | { t: 'altro'; seq: number; entita: number; testo: string }
  | { t: 'chat'; seq: number; entita: number; testo: string };

export type ServerMsg =
  | ({ t: 'ingresso'; id: string; nome: string; files: FileMap; me: Me; stato: MyState; luoghi: PlaceView[]; cose: ThingView[]; viandanti: OtherView[] } & Clock)
  | ({ t: 'aggiorna'; me?: Me; stato?: MyState; luoghi?: PlaceView[]; cose?: ThingView[]; via?: number[]; viandanti?: OtherView[]; partiti?: string[] } & Clock)
  /** The step was not possible (too fast, through a wall): the wanderer is here. */
  | { t: 'correzione'; seq: number; x: number; y: number }
  /** What came of a message: what the world said back meanwhile, and the answer if there is one. */
  | { t: 'esito'; seq: number; ok: boolean; testo?: string; messaggi?: string[]; motivo?: string }
  | { t: 'rifiuto'; motivo: string };

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
