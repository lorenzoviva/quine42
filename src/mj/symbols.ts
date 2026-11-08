// The symbols of a MarkovJunior program (T342, ADR-0175): the cells' colours as a program writes them. A symbol is a letter (`A`, `z`)
// or `#` and a number (`#0`, `#12`, `#255`): letters alone were 52, too few for a rich structure, and a number has no end. The number is
// read greedily (`#12A` is `#12` and `A`, `#1#2` is `#1` and `#2`), without zeros in front (`#07` is not `#7`: one name per symbol). A
// digit on its own is no longer a symbol, nor a `#` without a number: the compiler says why. Up to the contract 0.5 a digit was a symbol
// (`3`); the migration 0.5 → 0.6 writes it `#3` (migrations.ts, `programFor0_6`).
//
// Inside, the engine holds one character per symbol (its patterns are strings, a cell a byte): a letter is itself; `#0`-`#9` are the
// digits '0'-'9', so a program of before, ported, is the same program to the engine, voxel for voxel; `#10` and on are characters of the
// private use area, one per number. What shows a symbol to a person (the trace, the editor, the SoundLab, the messages) shows its name.

/** The largest number of a symbol: `#0` to `#2047`. A name only: how many a program may hold is `MAX_SYMBOLS`. */
export const MAX_SYMBOL_NUMBER = 2047;
/** Symbols one program may hold besides its empty cell: the engine's cells are bytes, and the air is one of them (`MAX_CODES` is this and one). */
export const MAX_SYMBOLS = 255;

/** Where the characters of `#10` and on begin: the private use area, after the private unions of the compiler (0xE000…). */
const NUMBERED = 0xf000;
/** The first number with a character of the private use area. */
const FIRST_PRIVATE = 10;

export class SymbolError extends Error {}

const isLetter = (ch: string): boolean => (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';

/** The engine's character of `#n`. */
export function numberedSymbol(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > MAX_SYMBOL_NUMBER) throw new SymbolError(`#${n}: i simboli numerati vanno da #0 a #${MAX_SYMBOL_NUMBER}`);
  return n < FIRST_PRIVATE ? String.fromCharCode(48 + n) : String.fromCharCode(NUMBERED + n);
}

/** The number of an engine's character, if it is a numbered symbol's. */
function numberOf(ch: string): number | undefined {
  if (ch.length !== 1) return undefined;
  if (isDigit(ch)) return ch.charCodeAt(0) - 48;
  const n = ch.charCodeAt(0) - NUMBERED;
  return n >= FIRST_PRIVATE && n <= MAX_SYMBOL_NUMBER ? n : undefined;
}

/** Whether an engine's character is a symbol (a letter or a numbered one), not a mark of a pattern nor a union's own sign. */
export const isSymbolCode = (ch: string): boolean => ch.length === 1 && (isLetter(ch) || numberOf(ch) !== undefined);

/** A symbol's name as a program writes it: `A`, `#12`; any other character as it is. */
export function symbolName(ch: string): string {
  const n = numberOf(ch);
  return n === undefined ? ch : `#${n}`;
}

/** A text of the engine's characters (a pattern, a set of symbols) as a program writes it. */
export function showSymbols(s: string): string {
  let out = '';
  for (const ch of s) out += symbolName(ch);
  return out;
}

/** One piece of a text: a symbol as written, with the engine's character, or any other character on its own; `error` if it does not read. */
export interface SymbolToken {
  /** As written: `A`, `#12`, `*`, `/`. */
  text: string;
  /** Where it starts in the text. */
  at: number;
  /** The engine's character, for a symbol. */
  code?: string;
  /** Why it is not a symbol, for a digit on its own, a `#` without a number, a number out of range or with zeros in front. */
  error?: string;
}

/** The pieces of a text, in order: never throws, what does not read says why (the editor shows it, the compiler fails on it). */
export function symbolTokens(s: string): SymbolToken[] {
  const out: SymbolToken[] = [];
  for (let i = 0; i < s.length; ) {
    const ch = s[i];
    if (ch === '#') {
      let j = i + 1;
      while (j < s.length && isDigit(s[j])) j++;
      const digits = s.slice(i + 1, j);
      const text = s.slice(i, j);
      if (!digits) out.push({ text, at: i, error: '"#" senza numero: un simbolo numerato è # e un numero (#12)' });
      else if (digits.length > 1 && digits[0] === '0') out.push({ text, at: i, error: `"${text}": niente zeri davanti al numero (#${Number(digits)})` });
      else if (Number(digits) > MAX_SYMBOL_NUMBER) out.push({ text, at: i, error: `"${text}": i simboli numerati vanno da #0 a #${MAX_SYMBOL_NUMBER}` });
      else out.push({ text, at: i, code: numberedSymbol(Number(digits)) });
      i = j;
    } else if (isDigit(ch)) {
      out.push({ text: ch, at: i, error: `la cifra "${ch}" da sola non è un simbolo: i simboli sono lettere o # e un numero (#${ch})` });
      i++;
    } else {
      out.push({ text: ch, at: i, ...(isLetter(ch) ? { code: ch } : {}) });
      i++;
    }
  }
  return out;
}

/**
 * A text as the engine reads it: every symbol one character (`#12` its own), every other character as it is (`* / [ ] .`, spaces, a
 * union's sign). Throws SymbolError at the first piece that does not read.
 */
export function readSymbols(s: string): string {
  let out = '';
  for (const t of symbolTokens(s)) {
    if (t.error) throw new SymbolError(t.error);
    out += t.code ?? t.text;
  }
  return out;
}

/** The engine's character of one symbol as written (`C`, `#12`), or undefined if the text is not exactly one. */
export function symbolOf(s: unknown): string | undefined {
  if (typeof s !== 'string') return undefined;
  const t = symbolTokens(s);
  return t.length === 1 && !t[0].error ? t[0].code : undefined;
}

/** The symbols of a text as written, one per piece (`values`, a row of a tile): other characters stay pieces of their own. */
export const symbolTexts = (s: string): string[] => symbolTokens(s).map((t) => t.text);

/**
 * A line of a pattern's text (a child `<in>`, a rule file, a tile) that is a note: it starts with "#" and no number follows (`# the
 * roof`); `#12AB` is a row.
 */
export const isNoteLine = (line: string): boolean => /^\s*#(?!\d)/.test(line);

/**
 * A text of symbols of the contract 0.5 in the contract 0.6 (T342): every digit on its own becomes `#` and the digit; what is already a
 * numbered symbol stays (the port is idempotent).
 */
export const hashDigits = (s: string): string => s.replace(/#\d+|\d/g, (m) => (m.length === 1 ? `#${m}` : m));
