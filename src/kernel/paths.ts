// Which paths a universe may hold (T121, ADR-0103): a list of what is admitted, not a list of what is forbidden. On NTFS
// `.GIT`, `.git.`, `GIT~1` and `.git::$INDEX_ALLOCATION` all are git's own folder, and writing there can become running code
// on this machine: the server runs git in it. So a path is what the kernel writes, in the plainest form there is, or nothing.
// Pure and light: the store on the dev server, the world on the server and the client all import it.

/** The folders of a universe. `assets/` of the old 2D universes stays on disk, but nothing writes there any more. */
const FOLDERS = new Set(['modules', 'models', 'world', 'maps', 'prompts']);
/** The files at its root. `.gitattributes` is the store's own and goes through no path from outside. */
const ROOT_FILES = new Set(['universe.json', 'seed.json']);
/** Letters and digits of ASCII, `_ - .`, never a dot first (a map may be `-1_0.json`; a whole path starts with a folder, so never with a dash): no `~` (short names), `:` (streams), space, `\`, `,` (git's `--cacheinfo`), Unicode that a file system folds. */
const SEGMENT_RE = /^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/;
const MAX_PATH = 200;

/** Whether Windows takes this name for a device, with or without an extension (`nul`, `COM1.txt`). */
export function reservedName(name: string): boolean {
  return /^(?:con|prn|aux|nul|clock|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name);
}

/** Why a universe-relative path is not admitted, or undefined if it is. */
export function refusedPath(rel: unknown): string | undefined {
  if (typeof rel !== 'string' || !rel) return 'vuoto';
  if (rel.length > MAX_PATH) return 'troppo lungo';
  const parts = rel.split('/');
  if (parts.length === 1 ? !ROOT_FILES.has(rel) : !FOLDERS.has(parts[0])) return 'fuori dalle cartelle di un universo';
  for (const part of parts) {
    if (!SEGMENT_RE.test(part)) return `nome non ammesso: ${part}`;
    if (part.endsWith('.')) return `nome con un punto finale: ${part}`;
    if (reservedName(part)) return `nome riservato di Windows: ${part}`;
  }
  return undefined;
}

export const allowedPath = (rel: unknown): rel is string => refusedPath(rel) === undefined;

/** What the Council may change in a commit of its own (T130, ADR-0107): the world's content. Not `universe.json` (budgets and providers are real money), not the agents' prompts, not `seed.json`. */
const COUNCIL_FOLDERS = new Set(['modules', 'models', 'world', 'maps']);
export const councilMayWrite = (rel: unknown): boolean => allowedPath(rel) && (COUNCIL_FOLDERS.has(rel.split('/')[0]) || rel === 'prompts/theme.md');

/** A universe's name: a folder of `universes/`. No dots here, so a device name can only be the whole of it. */
export const UNIVERSE_NAME_RE = /^(?!(?:con|prn|aux|nul|clock|com[0-9]|lpt[0-9])$)[a-z0-9][a-z0-9-]{0,40}$/;
