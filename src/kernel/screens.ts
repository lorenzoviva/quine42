// The Direction's wall of screens (T46b): three fields as wide as the war room. On the left the timeline of the
// commits (a film: «<» «>» move it, a click says what changed and who wanted it; looking never goes back, R is the
// only way), in the middle the Council's live log (who is working, on what, with which model), on the right the
// board of the costs (the usage ledger by agent and by task, in dollars, the budgets of universe.json as full scale).
// Under the ceiling a band of light says how things are (T46c): green, amber or red, the reasons in the panel.
// Everything comes from what the kernel already has; these are pure functions, the kernel feeds them.

import type { Author, Commit } from './repo';
import { AGENTS, type AgentId, type FeedEntry, type FeedKind } from './agents/council';
import { emptyTally, type Tally, type UsageLedger } from './ai/usage';

export type ScreenField = 'tempo' | 'registro' | 'costi';

export const SCREEN_NAME: Record<ScreenField, string> = {
  tempo: 'la linea del tempo',
  registro: 'il registro dal vivo',
  costi: 'il quadro dei costi',
};

/** The frames of the film on the screen at once; the chosen one is in the middle when it can be. */
export const FILM = 5;

export interface Frame {
  id: string;
  message: string;
  author: Author;
  /** Who wanted it, in words. */
  who: string;
  time: number;
  /** The files it changed; undefined when it is not known (a commit of an earlier session). */
  changed?: string[];
}

export interface Timeline {
  /** The frames on the film, the oldest on the left. */
  frames: Frame[];
  /** Of the frames, the chosen one. */
  at: number;
  /** The chosen commit in the log (0 = the newest) and how many there are. */
  index: number;
  count: number;
  chosen?: Frame;
}

/** Who wanted a commit: the agent its message names, otherwise its author. */
const WANTED: Array<[RegExp, string]> = [
  [/^genesi:/, 'il Concilio, alla Genesi'],
  [/^(cartografo|atlante):/, 'il Cartografo'],
  [/^scultore:/, 'lo Scultore'],
  [/^(meccanica|riparazione):/, "l'Ingegnere"],
  [/^(l'Arbitro|revisione)/, "l'Arbitro"],
  [/^(trama|trame|persone|società|contenuti|nascita|incantesimo|ricetta scoperta|azione imparata|regola):/, 'il Narratore'],
  [/^(agente|combinazione):/, 'la Fucina del Concilio'],
  [/^ritorno a/, 'il viandante, con R'],
  [/^(modifica|salvataggio)/, 'il viandante'],
  [/^consumi/, 'il kernel'],
  [/^(aggiornamento dal kernel|sincronizzato)/, "l'autore del gioco"],
];
const BY_AUTHOR: Record<Author, string> = { genesis: 'la Genesi', player: 'il viandante', agent: 'il Concilio', dev: "l'autore del gioco", kernel: 'il kernel' };

export function whoWanted(message: string, author: Author): string {
  return WANTED.find(([re]) => re.test(message))?.[1] ?? BY_AUTHOR[author] ?? String(author);
}

/** The files a commit changed against its parent (undefined if either snapshot is missing). */
export function changedFiles(c: Commit, parent: Commit | undefined): string[] | undefined {
  if (!Object.keys(c.files).length) return undefined;
  const a = c.files, b = parent?.files ?? {};
  if (c.parent && !parent) return undefined;
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((p) => a[p] !== b[p]).sort();
}

/** Where the film stops: from the newest (0) to the oldest. */
export const clampFrame = (index: number, count: number) => Math.max(0, Math.min(Math.max(0, count - 1), Math.round(index) || 0));

/** The film around the chosen commit. `log` is newest first (Repo.log). */
export function timeline(log: Commit[], index: number, parentOf: (c: Commit) => Commit | undefined): Timeline {
  const count = log.length;
  const i = clampFrame(index, count);
  // On the film time runs left to right: position 0 is the oldest.
  const pos = count - 1 - i;
  const start = Math.max(0, Math.min(count - FILM, pos - Math.floor(FILM / 2)));
  const frame = (c: Commit): Frame => ({ id: c.id, message: c.message, author: c.author, who: whoWanted(c.message, c.author), time: c.time, changed: changedFiles(c, parentOf(c)) });
  const frames: Frame[] = [];
  for (let p = start; p < Math.min(count, start + FILM); p++) frames.push(frame(log[count - 1 - p]));
  return { frames, at: pos - start, index: i, count, ...(count ? { chosen: frames[pos - start] } : {}) };
}

/** An agent at their console: what they did last, and whether they are working now. */
export interface Desk {
  agent: AgentId;
  name: string;
  color: string;
  sigil: string;
  kind?: FeedKind;
  text?: string;
  task?: string;
  model?: string;
  /** Seconds since they last did something. */
  ago?: number;
  working: boolean;
}

export interface LiveLine {
  time: number;
  from: string;
  color: string;
  kind: FeedKind;
  text: string;
}

export interface LiveFeed {
  /** Every agent: who is working first, then who worked last. */
  desks: Desk[];
  /** The last lines of the log, newest last. */
  lines: LiveLine[];
}

/** One counts as working if they spoke or called a model in the last minute and a half. */
export const WORKING_S = 90;
export const LIVE_LINES = 8;

export function liveFeed(feed: FeedEntry[], calls: Record<string, { model: string; task: string; time: number }>, now: number, fallbackModel?: string): LiveFeed {
  const desks = (Object.keys(AGENTS) as AgentId[]).map((agent): Desk => {
    const a = AGENTS[agent];
    let last: FeedEntry | undefined;
    for (let i = feed.length - 1; i >= 0 && !last; i--) if (feed[i].from === agent) last = feed[i];
    const call = calls[agent];
    const t = Math.max(last?.time ?? -Infinity, call?.time ?? -Infinity);
    const ago = Number.isFinite(t) ? Math.max(0, Math.round((now - t) / 1000)) : undefined;
    const model = call?.model ?? (last ? fallbackModel : undefined);
    return {
      agent,
      name: a.name,
      color: a.color,
      sigil: a.sigil,
      ...(last ? { kind: last.kind, text: last.text } : {}),
      ...(last?.task || call?.task ? { task: last?.task ?? call!.task } : {}),
      ...(model ? { model } : {}),
      ...(ago !== undefined ? { ago } : {}),
      working: ago !== undefined && ago <= WORKING_S,
    };
  });
  desks.sort((a, b) => Number(b.working) - Number(a.working) || (a.ago ?? Infinity) - (b.ago ?? Infinity));
  const lines = feed.slice(-LIVE_LINES).map((e) => ({ time: e.time, from: e.from === 'kernel' ? 'kernel' : AGENTS[e.from]?.name ?? e.from, color: e.from === 'kernel' ? '#9fb2a8' : AGENTS[e.from]?.color ?? '#ffffff', kind: e.kind, text: e.text }));
  return { desks, lines };
}

/** A budget of `universe.json → ai`: how much of it this session used. */
export interface Budget {
  nome: string;
  usati: number;
  max: number;
}

export interface CostBoard {
  session: Tally;
  today: Tally;
  total: Tally;
  /** This session, by agent (the ledger keeps agents only for the session), the most expensive first. */
  byAgent: Array<{ agent: string; name: string; color: string; tally: Tally }>;
  /** Today, by model and task, the most expensive first. */
  byTask: Array<{ model: string; task: string; tally: Tally }>;
  budgets: Budget[];
}

export function costBoard(usage: UsageLedger, budgets: Budget[]): CostBoard {
  const day = usage.day();
  const byAgent = Object.entries(usage.sessionByAgent)
    .map(([agent, tally]) => ({ agent, name: AGENTS[agent as AgentId]?.name ?? agent, color: AGENTS[agent as AgentId]?.color ?? '#9fb2a8', tally }))
    .sort((a, b) => b.tally.usd - a.tally.usd || b.tally.calls - a.tally.calls);
  return { session: { ...usage.session }, today: { ...emptyTally(), ...day.total }, total: usage.total(), byAgent, byTask: usage.tasks(), budgets };
}

/** How full a budget is (0-1; a budget of zero or less is full as soon as it is used). */
export const fill = (b: Budget) => (b.max > 0 ? Math.min(1, b.usati / b.max) : b.usati > 0 ? 1 : 0);

/** The alert of the Direction (T46c): the band of light under its ceiling. */
export type AlertLevel = 'verde' | 'ambra' | 'rossa';

export const ALERT_COLOR: Record<AlertLevel, string> = { verde: '#5cff8a', ambra: '#ffb000', rossa: '#ff3b3b' };
export const ALERT_NAME: Record<AlertLevel, string> = { verde: 'tutto in ordine', ambra: 'attenzione', rossa: 'allarme' };

export interface Alert {
  level: AlertLevel;
  /** Why, in words; empty when all is well. */
  reasons: string[];
}

/** The validator's rejections count for an hour; a budget is a worry over 80 %, an alarm when used up. */
export const REJECTS_S = 3600;
export const BUDGET_WARN = 0.8;

/**
 * Red: faults open (code of the universe that fails now) or a budget used up (the Council stops there); amber: the validator
 * rejected something in the last hour, or a budget is over 80 %; green otherwise.
 */
export function alertOf(faults: Array<{ key: string; message: string }>, feed: FeedEntry[], budgets: Budget[], now: number): Alert {
  const red: string[] = [], amber: string[] = [];
  if (faults.length) red.push(`${faults.length === 1 ? 'un guasto aperto' : `${faults.length} guasti aperti`}: ${faults[0].key} — ${faults[0].message.slice(0, 120)}`);
  const rejects = feed.filter((e) => e.from === 'kernel' && e.kind === 'scarta' && now - e.time <= REJECTS_S * 1000);
  if (rejects.length) {
    const last = rejects[rejects.length - 1];
    amber.push(`${rejects.length === 1 ? 'un rifiuto' : `${rejects.length} rifiuti`} del validatore nell'ultima ora (l'ultimo${last.to ? `, al ${AGENTS[last.to]?.name ?? last.to}` : ''}: ${last.text.slice(0, 120)})`);
  }
  for (const b of budgets) {
    const v = fill(b);
    if (v >= 1) red.push(`il budget «${b.nome}» è esaurito (${b.usati} di ${b.max})`);
    else if (v > BUDGET_WARN) amber.push(`il budget «${b.nome}» è al ${Math.round(v * 100)} % (${b.usati} di ${b.max})`);
  }
  return { level: red.length ? 'rossa' : amber.length ? 'ambra' : 'verde', reasons: [...red, ...amber] };
}

export interface Screens {
  tempo: Timeline;
  registro: LiveFeed;
  costi: CostBoard;
  allerta: Alert;
}
