// The channel between the server and the process of a world (T127, ADR-0110). Each message is plain JSON: the world sends a client's
// messages already written, so that the server does not read them twice and never needs to understand them.

import type { ClientMsg } from './protocol';
import type { HandmadeProgram } from '../kernel/handmade';

/** What a world needs in order to open, sent over the channel: never in its environment nor on its command line. */
export interface WorldOpen {
  name: string;
  /** This same server: the store is its HTTP route. */
  base: string;
  /** Proves this world to the store for its own universe only. */
  token: string;
  offline?: boolean;
  /** Whether the server has a key: the calls to Gemini go over the channel. */
  gemini?: boolean;
  /** Whether the server has accounts: tokens are verified over the channel. */
  verify?: boolean;
  masterUid?: string;
  ledgerFile?: string;
  grantCap?: number;
  /** A commit to go back to before opening: the world kept dying on what came after. */
  restore?: string;
}

/** The calls a route may make to a running world; anything else is not a call. */
export const WORLD_CALLS = ['creditRecharge', 'isAnonymous', 'wallet', 'view', 'keepProfile'] as const;
export type WorldCallName = (typeof WORLD_CALLS)[number];

export type ToWorld =
  | { t: 'apri'; open: WorldOpen }
  | { t: 'client'; cid: number }
  | { t: 'msg'; cid: number; m: ClientMsg }
  | { t: 'chiuso'; cid: number }
  | { t: 'chiedi'; id: number; op: WorldCallName; args: unknown[] }
  | { t: 'risposta'; id: number; ok: boolean; value?: unknown; error?: string }
  | { t: 'ferma' }
  /** The program of a handmade card to check (ADR-0161): a process started only for this (`server/programCheck.ts`) opens no universe. New on the wire, so in English (ADR-0153). */
  | { t: 'check'; id: number; program: HandmadeProgram };

export type FromWorld =
  | { t: 'pronto' }
  | { t: 'errore'; motivo: string }
  /** The world's clock is turning: sent from the timer of its ticks. */
  | { t: 'vivo'; tick: number }
  | { t: 'invia'; cid: number; json: string }
  | { t: 'chiudi'; cid: number }
  | { t: 'chiedi'; id: number; op: 'gemini' | 'verify'; args: unknown[] }
  | { t: 'risposta'; id: number; ok: boolean; value?: unknown; error?: string }
  /** Why the program cannot be a card; empty: it can. */
  | { t: 'checked'; id: number; errors: string[] };

/** A call to Gemini as it crosses the channel. */
export interface GeminiCall {
  url: string;
  method?: string;
  body?: string;
}
export interface GeminiAnswer {
  status: number;
  text: string;
}
