// The text of a program of MarkovJunior of mxgmn, as it is, in the symbols of our compiler (T531, A1-6, docs/design/markov-allineamento.md
// § 3.1, § 8; ADR-0265). The original reads every character as a symbol (`values="BW8#"`, `<union symbol="2">`, `<union symbol="#">`); ours
// reads letters, or `#` and a number (`#12`), and a few signs as union symbols (ADR-0175). The transliteration is the one the migration
// 0.5 → 0.6 makes (`programFor0_6`), on the original's text: a digit becomes `#` and the digit, a union "#" takes the first sign the program
// does not use; and, for what the migration never met, every other character the original holds as a value that is not a letter (`.`,
// `#`, `?`…) becomes a numbered symbol of its own from `#10` up, and `[` and `]` as union symbols (ours read `[..]` as a set) a free sign.
// The spaces of `values` go, as the original's Grid.Load takes them out. Nothing else changes: sizes, steps, names, comments, files.
//
// The same port, decided by the program's XML, holds for the text files it reads (the rules, samples and tiles of lab/mjx/official/
// resources/, written in the original's characters: CarmaTower's rules hold its union "6"): `originalText`. Pure. Not idempotent, and it
// must not be: it reads the original's text, where `#1` is two symbols, not ours, where it is one.

import { holdsSymbols, PATTERN_TEXTS, rewriteMjxSource, UNION_SIGNS } from './source';

/** What each character of an original's text becomes in ours (a letter, a mark of a pattern and a sign ours reads stay out: themselves). */
export type OriginalPort = ReadonlyMap<string, string>;

const isLetter = (ch: string): boolean => (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';
/** What is a mark of a pattern in both dialects, never a symbol to port: the wildcard, the rows, the layers, a wfc's `|`. */
const isMark = (ch: string): boolean => ch === '*' || ch === '/' || ch === '|' || /\s/.test(ch);
/** The signs our compiler reads as something else in a pattern: `#` starts a numbered symbol, `[` and `]` a set. */
const TAKEN = new Set(['#', '[', ']']);
/** Where the numbered symbols of the characters that are no letter begin: `#0`-`#9` are the digits. */
const FIRST_NUMBERED = 10;

/** The text of `values` as the original reads it: without spaces. */
const valuesText = (name: string, value: string): string => (name === 'values' ? value.replace(/\s+/g, '') : value);

/**
 * What each character of the original's text becomes in ours, by the characters its XML holds as symbols, in their order: a letter itself;
 * a digit `#d`; another value `#10`, `#11`…; `#`, `[` and `]` used only as union symbols (or in patterns) a sign the program does not use.
 */
export function originalPort(xml: string): OriginalPort {
  const used = new Set<string>();
  const values = new Set<string>();
  const note = (value: string, isValues: boolean) => {
    for (const ch of value) {
      used.add(ch);
      if (isValues) values.add(ch);
    }
    return value;
  };
  rewriteMjxSource(
    xml,
    (el, outer, name, value) => (holdsSymbols(el, outer, name) ? note(valuesText(name, value), name === 'values') : value),
    (el, value) => (PATTERN_TEXTS.has(el.name) ? note(value, false) : value),
  );
  const out = new Map<string, string>();
  let next = FIRST_NUMBERED;
  const signs = UNION_SIGNS.filter((s) => !used.has(s));
  for (const ch of used) {
    if (isLetter(ch) || isMark(ch)) continue;
    if (isDigit(ch)) out.set(ch, `#${ch}`);
    else if (values.has(ch)) out.set(ch, `#${next++}`);
    else if (TAKEN.has(ch)) out.set(ch, signs.shift() ?? `#${next++}`);
  }
  return out;
}

/** A text of the original's symbols in ours: each character as the port says, the rest as it is. */
const ported = (value: string, port: OriginalPort): string => (port.size ? [...value].map((ch) => port.get(ch) ?? ch).join('') : value);

/**
 * A pattern's text of the original's characters in ours, line by line: a note (a line starting with "#" and no digit, as the text of the
 * resources writes them) and the line "->" of a rule file stay as they are.
 */
export function originalText(text: string, port: OriginalPort): string {
  if (!port.size) return text;
  return text
    .split(/(\r?\n)/)
    .map((line, k) => (k % 2 || /^\s*#(?!\d)/.test(line) || /^[ \t]*->[ \t]*$/.test(line) ? line : ported(line, port)))
    .join('');
}

/**
 * A program of MarkovJunior of mxgmn, its text as it is, in the symbols of our compiler: what `compileMjx(…, { original: true })` compiles.
 * The same program to the engine, symbol for symbol: one character of the original is one symbol of ours.
 */
export function originalProgram(xml: string, port: OriginalPort = originalPort(xml)): string {
  return rewriteMjxSource(
    xml,
    (el, outer, name, value) => (holdsSymbols(el, outer, name) ? ported(valuesText(name, value), port) : value),
    (el, value) => (PATTERN_TEXTS.has(el.name) ? originalText(value, port) : value),
  );
}
