// New magic runes from the Council (T57b, ADR-0096): the Narrator invents a rune (token, name, glyph, colour,
// element, what it means), in a session of the Council or when a formula asks for an element no rune has.
// The validator here decides whether it may enter: a word that is a token of the code and nobody else's, a name
// unlike the others, a glyph of its own, no fourth wall. The kernel repairs the form (glyph, colour, lengths) and
// rejects only what cannot be understood, with the reason, back to the Narrator. Pure functions, no kernel.

import { metaBreak } from './fourthwall';
import { hashStr } from './rng';
import { BINDINGS, CARPET_TOKENS, COUNCIL_RUNE, FUTHARK } from './runes';
import { similarNames } from './society';
import type { MagicRune } from './types';

/** At most this many magic runes in a universe (the seven of the seed and what the Council adds): they stay rare. */
export const MAX_MAGIC_RUNES = 16;

/** Words of Lua and of the prelude a rune never takes: as code it must stay a variable that means nothing. */
const RESERVED = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or',
  'repeat', 'return', 'then', 'true', 'until', 'while', 'math', 'string', 'table', 'utf8', 'pairs', 'ipairs', 'pcall', 'print',
  'ecs', 'world', 'inventory', 'items', 'ui', 'input', 'bus', 'log', 'hash', 'self',
]);

/** The signs a magic rune may take when the one it asked for is taken or is not a sign: the runic letters no word rune uses. */
const SPARE_GLYPHS = [...'ᚡᚣᚤᚥᚧᚨᚪᚫᚬᚭᚮᚯᚰᚲᚴᚵᚶᚻᚼᚽᚿᛀᛂᛄᛅᛆᛉᛊᛋᛌᛍᛎᛐᛑᛒᛓᛔᛕᛘᛙᛚᛛᛝᛟᛠᛡᛢᛦᛨᛩᛪᛮ'];

export interface RuneDraft {
  token?: unknown;
  nome?: unknown;
  glifo?: unknown;
  colore?: unknown;
  elemento?: unknown;
  descrizione?: unknown;
  canone?: unknown;
}

export interface NewRune {
  token: string;
  rune: MagicRune;
  /** One line of the canon: what everybody knows of it. */
  canone: string;
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** A word as a token: lower case, without accents, only letters (it is a Lua identifier too). */
export function runeToken(word: unknown): string {
  return text(word, 40)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}

/**
 * Validates a rune the Narrator invented against the magic runes there are. Fatal (errors): a token that is
 * not a word of 3-12 letters, already a rune, reserved, too like another; a name too like another; a text that
 * breaks the fourth wall; too many runes. Repaired: the glyph (one sign, not of the word runes, not taken), the
 * colour (#rrggbb), the lengths.
 */
export function validateNewRune(draft: RuneDraft, existing: Record<string, MagicRune>, words: string[] = []): { rune?: NewRune; errors: string[] } {
  const errors: string[] = [];
  const tokens = Object.keys(existing);
  if (tokens.length >= MAX_MAGIC_RUNES) return { errors: [`le rune magiche sono già ${tokens.length}, il massimo: restano rare`] };
  const token = runeToken(draft.token);
  const name = text(draft.nome, 20);
  const element = text(draft.elemento, 24) || token;
  const description = text(draft.descrizione, 120);
  const canone = text(draft.canone, 240) || description;
  if (token.length < 3 || token.length > 12) errors.push(`il token «${String(draft.token ?? '')}» deve essere una sola parola di 3-12 lettere`);
  else if (existing[token]) errors.push(`«${token}» è già una runa magica`);
  else if (RESERVED.has(token) || CARPET_TOKENS.has(token) || BINDINGS.has(token) || token === COUNCIL_RUNE) errors.push(`«${token}» è una parola riservata`);
  else {
    const near = tokens.find((t) => similarNames(t, token));
    if (near) errors.push(`il token «${token}» è troppo simile alla runa «${near}»`);
  }
  if (name.length < 2) errors.push('manca il nome della runa');
  else {
    const near = Object.values(existing).find((r) => similarNames(r.name, name));
    if (near) errors.push(`il nome «${name}» è troppo simile a «${near.name}»`);
  }
  if (description.length < 4) errors.push('manca cosa significa la runa');
  for (const t of [name, element, description, canone]) {
    const m = metaBreak(t, words);
    if (m) errors.push(`rompe la quarta parete: «${m}»`);
  }
  if (errors.length) return { errors };
  const used = new Set(Object.values(existing).map((r) => r.glyph));
  const asked = typeof draft.glifo === 'string' ? [...draft.glifo.trim()] : [];
  const glyph = asked.length === 1 && /\p{L}|\p{S}/u.test(asked[0]) && !/[a-z0-9]/i.test(asked[0]) && !used.has(asked[0]) && !FUTHARK.includes(asked[0]) ? asked[0] : SPARE_GLYPHS.find((g) => !used.has(g));
  if (!glyph) return { errors: ['nessun segno libero per una runa nuova'] };
  const color = typeof draft.colore === 'string' && /^#[0-9a-f]{6}$/i.test(draft.colore.trim()) ? draft.colore.trim().toLowerCase() : `#${(hashStr(token) & 0xffffff | 0x404040).toString(16).padStart(6, '0')}`;
  return { rune: { token, rune: { name, glyph, color, element, description }, canone }, errors: [] };
}

/** The canon's section of the runes the Council added: one line each, added as they come. */
export const NEW_RUNES_HEADING = '## Le rune trovate dopo';

/** The canon with one more line for a new rune (under NEW_RUNES_HEADING, made if missing). */
export function canonWithRune(canon: string, r: NewRune): string {
  const line = `- ${r.rune.glyph} ${r.rune.name} («${r.token}», ${r.rune.element}): ${r.canone}`;
  const body = canon.replace(/\s*$/, '');
  if (!body.includes(NEW_RUNES_HEADING))
    return `${body}\n\n${NEW_RUNES_HEADING}\n- Le rune magiche non sono tutte note da sempre: di tanto in tanto qualcuno ne trova una che prima nessuno aveva visto, e da allora si trova come le altre.\n${line}\n`;
  return `${body}\n${line}\n`;
}
