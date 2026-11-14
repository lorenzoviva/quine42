// The campaign from the site (T377, ADR-0188 §6 row 7, ADR-0202): the store's `campaign` route, with which the session page of the site reads and
// changes the master's directives (`world/campaign.md`) and the regions of the master in the atlas, as the console and the Direction do in the game.
// The guests and the invites (`guests`) and the pace (`pace`) have their own routes already (server/campaign.ts).
//
//   GET  /api/universe/<name>/campaign                                 → { running, text, template, regions, environments, places }
//   POST /api/universe/<name>/campaign { op: 'text', text }            the directives whole, checked as the validator checks them
//   POST /api/universe/<name>/campaign { op: 'region', region }        a region of the master declared, or changed with its `id` (`masterRegion`)
//   POST /api/universe/<name>/campaign { op: 'release', id }           a region of the master let go
//
// Only the master of a universe of many, never a world's token. A running world does it itself (`WorldCalls.campaign`, a commit of its main line,
// and everyone in it has it at once); a world that is not running finds it on the disk, written here with a commit, in the universe's own line. The
// checks are the same pure functions either way (src/kernel/campaignEdit.ts); nothing here calls a model.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { campaignEdit, campaignSeen, environmentsIn, readCampaignEdit, type CampaignDone, type CampaignEdit, type CampaignSeen } from '../src/kernel/campaignEdit';
import { ATLAS_FILE } from '../src/kernel/atlas';
import { CAMPAIGN_FILE } from '../src/kernel/campaign';
import type { FileMap } from '../src/kernel/types';
import { contractOf, KERNEL_CONTRACT, parseVersion, showContract } from '../src/kernel/version';
import { owns, type Caller, type Game } from './access';
import type { GuestsAnswer } from './campaign';

/** A place planned, as the atlas of the page draws it: where, its name and its environment. */
export interface CampaignPlace {
  cx: number;
  cy: number;
  name: string;
  layout: string;
}

/** The most places the page draws: the nearest to the first, beyond it they are not read. */
export const CAMPAIGN_PLACES = 2000;

export interface CampaignSiteContext {
  name: string;
  who: Caller;
  game: Game;
  masterUid?: string;
  /** The universe's folder. */
  root: string;
  /** The running world of the universe, if there is one: what it has, and an edit made by it. */
  world?: (name: string, edit?: CampaignEdit) => Promise<{ seen: CampaignSeen; done?: CampaignDone } | undefined>;
  /** One operation at a time in the universe's line (the store's `serial`). */
  serial: <T>(fn: () => Promise<T>) => Promise<T>;
  /** A file written and committed in the universe's repository: the head after. */
  commit: (rel: string, text: string, message: string, author: string) => Promise<string>;
}

const refused = (status: number, error: string, reasons?: string[]): GuestsAnswer => ({ status, body: { error, ...(reasons ? { reasons } : {}) } });

/** What the page reads of a universe on the disk: its configuration, the two files and the lexicon, the manifests (for the environments). */
async function campaignFiles(root: string): Promise<FileMap> {
  const files: FileMap = {};
  const read = async (rel: string) => {
    const t = await fs.readFile(path.join(root, rel), 'utf8').catch(() => undefined);
    if (t !== undefined) files[rel] = t;
  };
  await Promise.all(['universe.json', ATLAS_FILE, CAMPAIGN_FILE, 'world/lexicon.md'].map(read));
  const modules = await fs.readdir(path.join(root, 'modules'), { withFileTypes: true }).catch(() => []);
  await Promise.all(modules.filter((d) => d.isDirectory()).map((d) => read(`modules/${d.name}/manifest.json`)));
  return files;
}

/** The places planned, from `maps/`: the surface's only (`<cx>_<cy>.json`), the nearest to the first within `CAMPAIGN_PLACES`. */
export async function campaignPlaces(root: string): Promise<CampaignPlace[]> {
  const dir = path.join(root, 'maps');
  const names = (await fs.readdir(dir).catch(() => [] as string[]))
    .map((f) => /^(-?\d{1,4})_(-?\d{1,4})\.json$/.exec(f))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ file: m[0], cx: Number(m[1]), cy: Number(m[2]) }))
    .sort((a, b) => Math.max(Math.abs(a.cx), Math.abs(a.cy)) - Math.max(Math.abs(b.cx), Math.abs(b.cy)))
    .slice(0, CAMPAIGN_PLACES);
  const out: CampaignPlace[] = [];
  for (const n of names) {
    try {
      const rec = JSON.parse(await fs.readFile(path.join(dir, n.file), 'utf8'));
      out.push({ cx: n.cx, cy: n.cy, name: String(rec?.plan?.place?.name ?? '').slice(0, 80), layout: String(rec?.plan?.layout ?? '').slice(0, 80) });
    } catch {
      /* a broken map is not drawn */
    }
  }
  return out;
}

/** Whether a universe on the disk is of this kernel's contract: one of another waits for its world to port it (`migrateUniverse`), the site does not write it. */
function ofThisContract(files: FileMap): boolean {
  try {
    const v = parseVersion((JSON.parse(files['universe.json'] ?? '{}') as { kernel?: unknown }).kernel);
    return !!v && showContract(contractOf(v)) === KERNEL_CONTRACT;
  } catch {
    return false;
  }
}

/**
 * The store's `campaign` route: what the master reads and changes. The caller is through `gate` and the universe exists. A running world answers for
 * itself; otherwise the disk, read and written in the universe's line.
 */
export async function campaignAnswer(method: string, body: Record<string, unknown>, o: CampaignSiteContext): Promise<GuestsAnswer> {
  const { name, who, game } = o;
  if (!game.many) return refused(409, 'la campagna dal sito solo negli universi di molti: da soli la scrivi nel gioco');
  if (who.server || !owns(who, game, o.masterUid)) return refused(403, 'solo il master di questo universo');
  let edit: CampaignEdit | undefined;
  if (method === 'POST') {
    edit = readCampaignEdit(body);
    if (!edit) return refused(400, 'chiedi le direttive (text), una regione (region) o di liberarne una (release)');
  } else if (method !== 'GET') return refused(405, 'metodo non ammesso');
  const places = campaignPlaces(o.root);
  const live = await o.world?.(name, edit).catch(() => undefined);
  if (live) {
    if (live.done && !live.done.ok) return refused(400, live.done.reasons.join(' · '), live.done.reasons);
    return { status: 200, body: { ok: true, running: true, ...(live.done ? { done: live.done } : {}), ...live.seen, places: await places } };
  }
  type Disk = { seen: CampaignSeen; done?: CampaignDone } | { refused: string; status: number; reasons?: string[] };
  const r = await o.serial(async (): Promise<Disk> => {
    const files = await campaignFiles(o.root);
    const environments = environmentsIn(files);
    if (!edit) return { seen: campaignSeen(files, environments) };
    if (!ofThisContract(files)) return { status: 409, refused: 'questo universo è di un altro kernel: entra una volta nel mondo, che lo porta a questo, poi riprova' };
    const change = campaignEdit(files, edit, environments);
    if (!('path' in change)) return { status: 400, refused: change.reasons.join(' · '), reasons: change.reasons };
    await o.commit(change.path, change.text, `${change.message} (dal sito)`, change.author);
    return { done: change.done, seen: campaignSeen({ ...files, [change.path]: change.text }, environments) };
  });
  if ('refused' in r) return refused(r.status, r.refused, r.reasons);
  return { status: 200, body: { ok: true, running: false, ...(r.done ? { done: r.done } : {}), ...r.seen, places: await places } };
}
