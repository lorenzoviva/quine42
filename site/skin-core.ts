// What the page, the picker and the build agree on about the skins (T283, ADR-0145): no Node here, both sides read it.

/** Where the browser remembers the choice. */
export const SKIN_KEY = 'quine:sito:veste';
/** The skin of whoever has not chosen, and of a choice that no longer exists. */
export const DEFAULT_SKIN = 'sobria';
/** A skin's id is the name of its folder and part of an address. */
export const SKIN_ID_RE = /^[a-z][a-z0-9-]{0,31}$/;
/** Fired on `document` when the skin changes, for what paints without CSS (the three.js stages). */
export const SKIN_EVENT = 'quine:skin';
/** A plain file name in the skin's folder: it goes into an address and into the page. */
export const SKIN_FILE_RE = /^[a-z0-9][a-z0-9._-]*$/i;

/** `site/skins/<id>/skin.json`: what a skin says of itself. */
export interface SkinManifest {
  nome: string;
  descrizione: string;
  /** The favicon, a file of its folder. */
  icona: string;
}

/** The manifest, or the reason it is not one. */
export function checkManifest(raw: unknown): SkinManifest | string {
  const m = raw as Partial<SkinManifest> | null;
  if (!m || typeof m !== 'object') return 'skin.json non è un oggetto';
  if (typeof m.nome !== 'string' || !m.nome.trim()) return 'manca `nome`';
  if (typeof m.descrizione !== 'string' || !m.descrizione.trim()) return 'manca `descrizione`';
  if (typeof m.icona !== 'string' || !SKIN_FILE_RE.test(m.icona)) return 'manca `icona`, un file della cartella';
  return { nome: m.nome, descrizione: m.descrizione, icona: m.icona };
}

/** The default first, then by id: the order of the picker. */
export function orderSkins(ids: string[]): string[] {
  return [...ids].sort((a, b) => Number(b === DEFAULT_SKIN) - Number(a === DEFAULT_SKIN) || a.localeCompare(b));
}

/** The skin's value of a token, for what paints without CSS; `fallback` if no stylesheet has said it. */
export function skinColor(token: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || fallback;
}
