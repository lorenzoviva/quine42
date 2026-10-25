// Runes on the carpet. A rune is one lexical token occupying one cell, drawn as a glyph.
// Runes touching horizontally form a line; every line is Lua code that runs every tick.

import type { Id } from './ecs';

export interface RuneComp {
  token: string;
  col: number;
  row: number;
  source: 'gen' | 'player';
  /** For generated runes: stable origin "chunkKey#index", so a picked rune never respawns. */
  origin?: string;
  /** For inscribed runes: the wanderer who wrote them (T37): the line runs as them, with their rights. */
  by?: string;
}

export interface RuneLine {
  key: string;
  row: number;
  col: number;
  width: number;
  ids: Id[];
  tokens: string[];
  src: string;
}

/** Lua tokens a rune may carry. */
export const TOKEN_RE =
  /^(?:[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|==|~=|<=|>=|\.\.|[-+*/%^#<>=(){}[\];:,.])$/;

export function tokenize(line: string): string[] {
  return line.trim().split(/\s+/).filter(Boolean);
}

/** Splits Lua source into rune tokens even without spaces: "carpet.active=false" → carpet . active = false. */
export function lex(line: string): string[] {
  return line.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|==|~=|<=|>=|\.\.|[-+*/%^#<>=(){}[\];:,.]|\S/g) ?? [];
}

export function joinTokens(tokens: string[]): string {
  return tokens.join(' ');
}

export const lineKey = (row: number, col: number) => `${row}:${col}`;

/** Groups runes into maximal horizontal runs of touching cells, in reading order. */
export function extractLines(runes: Array<{ id: Id; rune: RuneComp }>): RuneLine[] {
  const byRow = new Map<number, Array<{ id: Id; rune: RuneComp }>>();
  for (const r of runes) {
    let row = byRow.get(r.rune.row);
    if (!row) byRow.set(r.rune.row, (row = []));
    row.push(r);
  }
  const lines: RuneLine[] = [];
  for (const row of [...byRow.keys()].sort((a, b) => a - b)) {
    const items = byRow.get(row)!.sort((a, b) => a.rune.col - b.rune.col);
    let cur: RuneLine | null = null;
    for (const { id, rune } of items) {
      if (cur && rune.col <= cur.col + cur.width) {
        cur.ids.push(id);
        cur.tokens.push(rune.token);
        cur.width = Math.max(cur.width, rune.col + 1 - cur.col);
      } else {
        cur = { key: lineKey(row, rune.col), row, col: rune.col, width: 1, ids: [id], tokens: [rune.token], src: '' };
        lines.push(cur);
      }
    }
  }
  for (const l of lines) l.src = joinTokens(l.tokens);
  return lines;
}

/** Map "col,row" → rune id for every cell covered by a rune. */
export function cellIndex(runes: Array<{ id: Id; rune: RuneComp }>): Map<string, Id> {
  const m = new Map<string, Id>();
  for (const { id, rune } of runes) m.set(`${rune.col},${rune.row}`, id);
  return m;
}

const FUTHARK = [...'ᚠᚢᚦᚩᚱᚷᚹᚺᚾᛁᛃᛇᛈᛏᛖᛗᛜᛞᚳᚸᛣᛤᛥᛯᛰᛱᛲᛳᛴᛵ'];

/**
 * How a rune looks: magic runes have their own glyph; short tokens (operators, digits, `x`) are their
 * own sign; longer words get a stable runic letter, with the word written small beneath.
 */
export function runeGlyph(token: string, magic?: { glyph: string; color: string }): { glyph: string; label?: string; color?: string } {
  if (magic) return { glyph: magic.glyph, label: token, color: magic.color };
  if (token.length <= 2) return { glyph: token };
  let h = 0;
  for (const ch of token) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { glyph: FUTHARK[h % FUTHARK.length], label: token };
}

/** Tokens that touch the carpet: rare, and never close to where the world begins. */
export const CARPET_TOKENS = new Set(['carpet', 'active', 'strength', 'rate', 'ox', 'oy']);

/** The symbols bound to the wanderer and the carpet (ADR-0002). */
export const BINDINGS = new Set(['x', 'y', 'speed', 'carpet', 'time']);

/** The master's only carpet rune in a game of many (T37): spoken or written, it takes them to the Council's hall. */
export const COUNCIL_RUNE = 'concilio';

/**
 * A line of the carpet (T37): it touches the carpet, writes a binding (a binding before the first `=`, not
 * as a field), or is the master's rune. In a game of many, none of these is generated for the players.
 */
export function carpetLine(line: string): boolean {
  const t = lex(line);
  if (t.some((w) => CARPET_TOKENS.has(w) || w === COUNCIL_RUNE)) return true;
  const eq = t.indexOf('=');
  return eq > 0 && t.slice(0, eq).some((w, i) => BINDINGS.has(w) && t[i - 1] !== '.');
}

/** At most this many runes come of one request to the Referente (T42f). */
export const ASKED_RUNES_MAX = 12;

/**
 * The runes the master asked the Referente for (T42f): every word a model wrote, split into tokens as on the carpet
 * ("carpet.active=false" → carpet . active = false), those a rune may carry, a repeated one twice; never the Council's
 * rune (the master always has it), at most `ASKED_RUNES_MAX`.
 */
export function askedRunes(words: unknown): string[] {
  if (!Array.isArray(words)) return [];
  const out: string[] = [];
  for (const w of words) {
    if (typeof w !== 'string') continue;
    for (const t of lex(w)) if (t.length <= 24 && TOKEN_RE.test(t) && t !== COUNCIL_RUNE && out.length < ASKED_RUNES_MAX) out.push(t);
  }
  return out;
}
