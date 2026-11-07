// The cards a master brings into a universe before it starts (T295, ADR-0170), as the store serves them:
//
//   GET  /api/universe/<name>/kin     → { ok, open, reason?, choice?, contract, kin, handmade }   what may come, and whether it may now
//   POST /api/universe/<name>/bring   { cards: [{ universe, model } | { handmade }] }             → { ok, head, brought, changes }
//
// Only the universe's master (`owns`), never its world. Kin are the universes with a root in common (`rootsOf`, server/git.ts: every
// universe born from the seed of a contract starts from the same commit); of them only what is a card (generated content, with its
// `card`), and only from a universe of this kernel's contract. Handmade cards only with the labs open (ADR-0161), of this contract too.
// The choice is open while universe.json says `cardChoice` (the store writes it when a universe is born, `seed`, or cloned, `clone`;
// the kernel takes it away at the Genesis and at the first entry): a universe from the seed with a Genesis behind it, a world lit or a
// generation under way close it too. Every card is read again from the disk (nothing of what it is comes from the client), its
// program checked on the engine as a handmade card's (`ProgramChecker`: in production a process of its own), its name as a text of
// someone else; two cards with one id, or an id already here, stop the choice before anything is written. All or nothing: one commit
// of the kernel. No balance moves (rule 8d): bringing costs no credit, and nothing here reads or writes a ledger.

import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { broughtEntry, broughtId, cardChoiceIn, doubles, kinCards, readBringRefs, readIndex, refText, withBrought, type BringRef, type BringRefusal, type BringSource, type KinView } from '../src/kernel/bring';
import type { ModelInfo } from '../src/kernel/forms';
import { MODELS_DIR, MODELS_INDEX } from '../src/kernel/forms';
import { metaBreak } from '../src/kernel/fourthwall';
import { cleanText, handmadeSummary, type HandmadeCard, type HandmadeSummary } from '../src/kernel/handmade';
import { portedFiles } from '../src/kernel/migrations';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import type { CardChoice, FileMap } from '../src/kernel/types';
import { contractOf, KERNEL_CONTRACT, showContract, universeKernels } from '../src/kernel/version';
import { SOUND_CLASS } from '../src/mj/sound';
import type { Refusal } from './access';
import { isGenerating, isWorldLit } from './generation';
import { rootsOf, runGit } from './git';
import { HandmadeArchive, modelFiles } from './handmade';
import type { ProgramChecker } from './programCheck';

/** The name a brought card keeps: a text of another universe, maybe of another player. One line, no markup, nothing invisible, the fourth wall. */
export function cleanBroughtName(raw: unknown): { text: string } | { error: string } {
  const r = cleanText(raw, 120, 'il nome');
  if ('error' in r) return r;
  const broken = metaBreak(r.text);
  return broken ? { error: `il nome: nel mondo non si dice «${broken}»` } : r;
}

/** What the choice shows (`KinView`): the kin universes with their kernel and, of this contract, their cards; the handmade cards of this contract, the latest first, only with the labs open. */
export type KinAnswer = KinView & { ok: true; handmade: HandmadeSummary[] };
type KinUniverse = KinView['kin'][number];

export interface BringContext {
  /** Every universe's folder. */
  baseDir: string;
  /** Whose the brought cards become: the universe's master. */
  master: string;
  checker: ProgramChecker;
  labs: () => boolean;
  archive: HandmadeArchive;
  /** Who asks, for `mine` of the handmade cards. */
  asker?: string;
}

const GIT: [string, string] = ['Kernel', 'kernel@rune.local'];
const readText = (p: string) => fs.readFile(p, 'utf8').catch(() => undefined);

/** The contract (`X.Y`) a universe.json was last written by, or undefined if it does not say a version that reads. */
function contractIn(universeJson: string | undefined): { contract?: string; kernel: string } {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(universeJson ?? '{}') ?? {};
  } catch {
    return { kernel: '?' };
  }
  const k = universeKernels({ kernel: raw.kernel, kernels: raw.kernels }).kernels;
  return k ? { contract: showContract(contractOf(k.version)), kernel: `${k.version.major}.${k.version.minor}.${k.version.patch}` } : { kernel: String(raw.kernel ?? '?') };
}

/** Whether a universe has a Genesis behind it: a commit of the Council that says so (as `needsGenesis` reads the history). */
async function hasGenesis(root: string): Promise<boolean> {
  const out = await runGit(root, ['log', '-1', '--format=%H', '--grep=^genesi:'], { author: GIT }).catch(() => '');
  return !!out.trim();
}

/** Whether the choice of the cards is open in this universe now, and why not. */
export async function choiceOf(baseDir: string, name: string): Promise<{ open: boolean; reason?: string; choice?: CardChoice; roots: string[] }> {
  const root = path.join(baseDir, name);
  const closed = (reason: string, choice?: CardChoice, roots: string[] = []) => ({ open: false, reason, ...(choice ? { choice } : {}), roots });
  if (!existsSync(path.join(root, '.git'))) return closed('universo sconosciuto');
  const text = await readText(path.join(root, 'universe.json'));
  const choice = cardChoiceIn(text);
  const roots = await rootsOf(root, GIT);
  if (!choice) return closed("la scelta delle carte è chiusa: si fa prima della Genesi (in un clone, prima che entri il primo viandante); un universo nato prima delle radici non l'ha", undefined, roots);
  if (contractIn(text).contract !== KERNEL_CONTRACT) return closed(`questo universo è di un altro contratto: lo apre prima un kernel ${KERNEL_CONTRACT}`, choice, roots);
  if (choice === 'seed' && (await hasGenesis(root))) return closed('la Genesi è già fatta: le carte si portano prima', choice, roots);
  if (isWorldLit(baseDir, name)) return closed('il mondo è acceso: le carte si portano prima di entrare', choice, roots);
  if (isGenerating(baseDir, name)) return closed('lo sta generando un comando: le carte si portano prima', choice, roots);
  if (!roots.length) return closed('un universo senza storia', choice, roots);
  return { open: true, choice, roots };
}

/** The universes of the folder, but the dot's (the server's own) and `except`. */
async function universes(baseDir: string, except: string): Promise<string[]> {
  const es = await fs.readdir(baseDir, { withFileTypes: true }).catch(() => []);
  return es.filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== except && UNIVERSE_NAME_RE.test(e.name) && existsSync(path.join(baseDir, e.name, '.git'))).map((e) => e.name).sort();
}

/** What a list of a kin universe needs: its settings and its index as this kernel reads them, and which programs it has (not their text). */
async function listingFiles(root: string): Promise<FileMap> {
  const files: FileMap = {};
  for (const rel of ['universe.json', MODELS_INDEX]) {
    const t = await readText(path.join(root, rel));
    if (t !== undefined) files[rel] = t;
  }
  for (const n of await fs.readdir(path.join(root, 'models')).catch(() => [] as string[])) if (n.endsWith('.xml')) files[`${MODELS_DIR}${n}`] = '';
  return portedFiles(files);
}

/** The kin of a universe and their cards, the handmade cards, and whether the choice is open: what the master's choice shows. */
export async function kinOf(name: string, o: Omit<BringContext, 'master' | 'checker'>): Promise<KinAnswer> {
  const choice = await choiceOf(o.baseDir, name);
  const mine = new Set(choice.roots);
  const kin: KinUniverse[] = [];
  if (mine.size) {
    for (const other of await universes(o.baseDir, name)) {
      const root = path.join(o.baseDir, other);
      if (!(await rootsOf(root, GIT)).some((r) => mine.has(r))) continue;
      const files = await listingFiles(root);
      // The contract it was last written by, as it is on the disk: what reads it ported in memory would say this kernel's.
      const v = contractIn(await readText(path.join(root, 'universe.json')));
      if (v.contract !== KERNEL_CONTRACT) kin.push({ name: other, kernel: v.kernel, ok: false, reason: `è del kernel ${v.kernel}: le sue carte vengono solo dal contratto ${KERNEL_CONTRACT}`, cards: [] });
      else kin.push({ name: other, kernel: v.kernel, ok: true, cards: kinCards(files) });
    }
  }
  const handmade = o.labs()
    ? o.archive
        .all()
        .flatMap(({ author, record }) => record.cards.filter((c) => c.kernel === KERNEL_CONTRACT).map((c) => handmadeSummary(c, record.signature, author === o.asker)))
        .sort((a, b) => b.changed.localeCompare(a.changed) || a.id.localeCompare(b.id))
        .slice(0, 200)
    : [];
  return { ok: true, open: choice.open, ...(choice.reason ? { reason: choice.reason } : {}), ...(choice.choice ? { choice: choice.choice } : {}), contract: KERNEL_CONTRACT, kin, handmade };
}

export type BringOutcome =
  | { ok: true; changes: Record<string, string>; message: string; brought: Array<{ id: string; kind: 'model' | 'sound'; name: string; from: string }> }
  | (Refusal & { cards?: BringRefusal[] });

/** One card read from the disk as it may enter: its source for the entry, or why not. Nothing of what it is comes from the client. */
async function sourceOf(ref: BringRef, o: BringContext, roots: Set<string>, kinRoots: Map<string, Promise<string[]>>, destination: string): Promise<{ source: BringSource } | { reason: string }> {
  if ('handmade' in ref) {
    if (!o.labs()) return { reason: 'i laboratori non sono aperti: le carte fatte a mano non entrano' };
    let found: { card: HandmadeCard } | undefined;
    for (const { record } of o.archive.all()) {
      const card = record.cards.find((c) => c.id === ref.handmade);
      if (card) found = { card };
    }
    if (!found) return { reason: 'carta fatta a mano sconosciuta' };
    const c = found.card;
    if (c.kernel !== KERNEL_CONTRACT) return { reason: `è scritta per il kernel ${c.kernel}, questo universo è del ${KERNEL_CONTRACT}` };
    const name = cleanBroughtName(c.name);
    if ('error' in name) return { reason: name.error };
    return { source: { kind: c.kind, handmade: true, id: c.id, xml: c.xml, name: name.text, ...(c.class ? { class: c.class } : {}), ...(c.size ? { size: c.size } : {}), author: c.author, ...(c.origins ? { origins: c.origins } : {}) } };
  }
  if (ref.universe === destination) return { reason: 'è già di questo universo' };
  const root = path.join(o.baseDir, ref.universe);
  if (!existsSync(path.join(root, '.git'))) return { reason: 'universo sconosciuto' };
  if (!kinRoots.has(ref.universe)) kinRoots.set(ref.universe, rootsOf(root, GIT));
  if (!(await kinRoots.get(ref.universe)!).some((r) => roots.has(r))) return { reason: 'non ha un antenato comune con questo universo: le carte vengono solo dagli universi con la stessa radice' };
  const v = contractIn(await readText(path.join(root, 'universe.json')));
  if (v.contract !== KERNEL_CONTRACT) return { reason: `è del kernel ${v.kernel}: le carte vengono solo dal contratto ${KERNEL_CONTRACT}` };
  const files = await modelFiles(root, ref.model);
  const xml = files[`${MODELS_DIR}${ref.model}.xml`];
  const entry = readIndex(files)[ref.model];
  if (xml === undefined || !entry || typeof entry !== 'object') return { reason: `nessun modello «${ref.model}» in «${ref.universe}»` };
  if (!entry.card) return { reason: 'non è una carta: i modelli del seme sono già in ogni universo' };
  const name = cleanBroughtName(typeof entry.name === 'string' && entry.name.trim() ? entry.name : ref.model);
  if ('error' in name) return { reason: name.error };
  return { source: { kind: entry.class === SOUND_CLASS ? 'sound' : 'model', universe: ref.universe, id: ref.model, entry, xml, name: name.text } };
}

/**
 * What a choice brings into `name`, read and checked; the store writes it and commits it (one commit of the kernel). Refused, with every
 * card's reason, if the choice is closed, if a card cannot come, or if two have one id: nothing is written then.
 */
export async function bringCards(name: string, rawCards: unknown, o: BringContext): Promise<BringOutcome> {
  const said = readBringRefs(rawCards);
  if ('error' in said) return { status: 400, refused: said.error };
  const choice = await choiceOf(o.baseDir, name);
  if (!choice.open) return { status: 409, refused: choice.reason ?? 'la scelta delle carte è chiusa' };
  const root = path.join(o.baseDir, name);
  const index = await readText(path.join(root, MODELS_INDEX));
  const here = readIndex(index === undefined ? {} : { [MODELS_INDEX]: index });
  const has = (id: string) => Object.hasOwn(here, id) || existsSync(path.join(root, MODELS_DIR, `${id}.xml`));
  const twice = doubles(said.refs, has);
  if (twice.size) return { status: 409, refused: 'due carte con lo stesso id, o un id che questo universo ha già: togline una prima di partire', cards: said.refs.filter((r) => twice.has(broughtId(r))).map((r) => ({ card: refText(r), reason: twice.get(broughtId(r))! })) };
  const roots = new Set(choice.roots);
  const kinRoots = new Map<string, Promise<string[]>>();
  const refused: BringRefusal[] = [];
  const entries: Record<string, ModelInfo> = {};
  const programs: Record<string, string> = {};
  const brought: Array<{ id: string; kind: 'model' | 'sound'; name: string; from: string }> = [];
  for (const ref of said.refs) {
    const s = await sourceOf(ref, o, roots, kinRoots, name);
    if ('reason' in s) {
      refused.push({ card: refText(ref), reason: s.reason });
      continue;
    }
    const made = broughtEntry(s.source, o.master);
    if ('error' in made) {
      refused.push({ card: refText(ref), reason: made.error });
      continue;
    }
    // The program as a handmade card's (ADR-0161): every seed of its class in the box the game gives it, within caps measured on the seed.
    const program = made.info.class === SOUND_CLASS ? { kind: 'sound' as const, xml: s.source.xml } : { kind: 'model' as const, xml: s.source.xml, class: made.info.class, ...(made.info.size ? { size: made.info.size } : {}) };
    const checked = await o.checker.check(program);
    if ('busy' in checked) return { status: 503, refused: 'il controllo dei programmi è occupato: riprova tra poco' };
    if (checked.errors.length) {
      refused.push({ card: refText(ref), reason: 'il programma non passa il controllo', errors: checked.errors.slice(0, 6) });
      continue;
    }
    const id = broughtId(ref);
    entries[id] = made.info;
    programs[`${MODELS_DIR}${id}.xml`] = s.source.xml;
    brought.push({ id, kind: s.source.kind, name: s.source.name, from: 'handmade' in ref ? 'fatta a mano' : ref.universe });
  }
  if (refused.length) return { status: 422, refused: refused.length === said.refs.length ? 'nessuna carta può entrare' : 'alcune carte non possono entrare: toglile e riprova', cards: refused };
  const when = choice.choice === 'clone' ? 'prima del primo ingresso' : 'prima della Genesi';
  const message = `carte portate ${when}: ${brought.map((b) => `«${b.name}» (${b.from})`).join(', ')}`;
  return { ok: true, changes: { ...programs, [MODELS_INDEX]: withBrought(index, entries) }, message, brought };
}
