// The names the kernel coins from syllables (T462): a planet nobody named (`planetName`), a person when the pool of names is spent
// (`freshName`). A coined name must never say, nor sound like, a word that offends, a vulgar one or a ridiculous one, in Italian, English,
// French or Spanish (the languages of the world, `ORBIT_NAME`): «Teruna» heard as «terrone», «Pene», «Kaka», «Ruto». The names are folded
// the same way as the roots (no accents, no doubles, `k`/`c`, `th`/`t` and their kin alike) and a name that holds a root is coined again,
// from the next seed, by whoever coins it. Pure and light: a function of the text, the same in every kernel.

/**
 * A name as the filter hears it: lower case, no accents, letters only, the sounds that are spelt two ways spelt one way (`ph` f, `th` t,
 * `kh` `ck` `k` `q` c, `y` `j` i, `w` v) and every double letter single. «Thetta» and «tete», «Kakka» and «caca» are the same.
 */
export function foldName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/kh|ck|k|q/g, 'c')
    .replace(/[yj]/g, 'i')
    .replace(/w/g, 'v')
    .replace(/(.)\1+/g, '$1');
}

/** The roots no coined name may hold anywhere (folded, see `foldName`): long enough to be themselves wherever they stand. */
const ROOTS_EVERYWHERE = [
  // Italian: the vulgar words, the insults, the words for the body that make one laugh, the slurs.
  'cazo', 'merd', 'stronz', 'troi', 'putan', 'puta', 'fot', 'figa', 'fica', 'pene', 'pisel', 'pisci', 'vagin', 'culo', 'culat', 'caca', 'scoreg',
  'ruto', 'teta', 'tete', 'pompin', 'sega', 'minchi', 'pirla', 'cogli', 'ricion', 'recion', 'froc', 'finoc', 'zocol', 'mignot', 'bagasc', 'baldrac',
  'terun', 'teron', 'polenton', 'negr', 'niger', 'nigr', 'zingar', 'porc', 'scem', 'cretin', 'idiot', 'stupid', 'imbecil', 'deficien', 'sfiga', 'bastard',
  // English.
  'fuc', 'shit', 'cunt', 'dic', 'coc', 'puss', 'arse', 'anal', 'anus', 'turd', 'tvat', 'vanc', 'slut', 'vhor', 'bitch', 'fagot', 'nazi', 'hitler', 'rape',
  'penis', 'boob', 'tit', 'poop', 'pis', 'spic', 'chinc', 'retard',
  // French.
  'pute', 'salop', 'couil', 'encul', 'conar', 'nique', 'bordel', 'chier', 'bite',
  // Spanish.
  'mierd', 'pendej', 'cabron', 'maricon', 'gilipol', 'verga', 'chinga', 'folar', 'cono', 'pedo',
];

/** The short words a coined name may not be, nor begin with: they would be too many to forbid everywhere. */
const WORDS_WHOLE = ['ano', 'cul', 'cum', 'as', 'fag', 'con', 'pola', 'popo', 'pupu', 'sex', 'sesso', 'xxx'];

/** The roots, folded once: a root is written plainly above and heard as `foldName` hears a name. */
const EVERYWHERE = [...new Set(ROOTS_EVERYWHERE.map(foldName))];
const WHOLE = [...new Set(WORDS_WHOLE.map(foldName))];

/** The root a coined name holds, or `undefined` when it holds none: what makes the kernel coin it again. */
export function badRootOf(name: string): string | undefined {
  const f = foldName(name);
  return EVERYWHERE.find((r) => f.includes(r)) ?? WHOLE.find((w) => f === w || (f.startsWith(w) && f.length <= w.length + 2));
}

/** True when a coined name says nothing it should not. */
export const cleanCoined = (name: string): boolean => badRootOf(name) === undefined;

/** Every root of the filter, folded (for the tests). */
export const COINED_ROOTS: readonly string[] = [...EVERYWHERE, ...WHOLE];
