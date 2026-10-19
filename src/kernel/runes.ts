// Runes on the carpet. A rune is one lexical token occupying `token.length` cells on a row.
// Runes touching horizontally form a line; every line is Lua code that runs every tick.

import type { Id } from './ecs';

export interface RuneComp {
  token: string;
  col: number;
  row: number;
  source: 'gen' | 'player';
  /** For generated runes: stable origin "chunkKey#index", so a picked rune never respawns. */
  origin?: string;
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
        cur.width = Math.max(cur.width, rune.col + rune.token.length - cur.col);
      } else {
        cur = { key: lineKey(row, rune.col), row, col: rune.col, width: rune.token.length, ids: [id], tokens: [rune.token], src: '' };
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
  for (const { id, rune } of runes) for (let i = 0; i < rune.token.length; i++) m.set(`${rune.col + i},${rune.row}`, id);
  return m;
}
