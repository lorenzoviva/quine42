// The campaign from the site (T377, ADR-0188 §6 row 7, ADR-0202): what the session page of the site reads and changes of a universe of many, the
// master's directives (`world/campaign.md`) and the regions of the master in the atlas, as the console and the Direction do. Pure, on the files:
// the store applies it to the disk when the world is not running, the world to itself (with `Kernel.publish`) when it is. The same checks as in the
// game: `readCampaign` for the directives, `masterRegion` and `withoutMasterRegion` for the regions; nothing here calls a model.

import type { FileMap } from './types';
import { ATLAS_FILE, masterRegion, readAtlas, REGION_KIND_NAME, withoutMasterRegion, writeAtlas, type Region } from './atlas';
import { CAMPAIGN_FILE, campaignTemplate, readCampaign, type LeftOut } from './campaign';
import { lexiconWords } from './fourthwall';
import { languageOf } from './language';

/** The longest file of directives the site sends: comments and blank lines included, a few times what the requests carry (`CAMPAIGN_CHARS`). */
export const CAMPAIGN_TEXT_CHARS = 32_000;

/** What the site asks: the directives whole, a region declared (or changed, with its `id`), a region let go. */
export type CampaignEdit = { op: 'text'; text: string } | { op: 'region'; region: unknown } | { op: 'release'; id: string };

/** What a change did: what to say, and the lines the fourth wall keeps out of the requests (said, not refused, as in the editor); or every reason why not. */
export type CampaignDone = { ok: true; said: string; region?: Region; left?: LeftOut[] } | { ok: false; reasons: string[] };

/** An environment the world has, as the form offers it. */
export interface CampaignEnvironment {
  id: string;
  name: string;
}

/** What the site shows of a universe's campaign: the directives (the template when there are none), the regions, the environments. */
export interface CampaignSeen {
  text: string;
  /** Whether `text` is the empty template, not a file of the universe. */
  template: boolean;
  regions: Region[];
  environments: CampaignEnvironment[];
}

/** The environments of a universe from its modules' manifests (`layouts`), as `Content.rebuild` gathers them: id and name. A manifest that does not read is not one. */
export function environmentsIn(files: FileMap): Record<string, { name: string }> {
  const out: Record<string, { name: string }> = {};
  for (const [p, text] of Object.entries(files)) {
    if (!/^modules\/[^/]+\/manifest\.json$/.test(p) || typeof text !== 'string') continue;
    try {
      const layouts = (JSON.parse(text) as { layouts?: unknown }).layouts;
      if (!layouts || typeof layouts !== 'object' || Array.isArray(layouts)) continue;
      for (const [id, l] of Object.entries(layouts as Record<string, unknown>)) {
        const name = l && typeof l === 'object' && typeof (l as { name?: unknown }).name === 'string' ? (l as { name: string }).name : id;
        out[id] = { name };
      }
    } catch {
      /* a broken manifest offers nothing */
    }
  }
  return out;
}

/** What the site shows, from the files and the environments the world has. */
export function campaignSeen(files: FileMap, environments: Record<string, { name?: string }>): CampaignSeen {
  const text = files[CAMPAIGN_FILE];
  return {
    text: typeof text === 'string' ? text : campaignTemplate(languageOf(files)),
    template: typeof text !== 'string',
    regions: readAtlas(files).regions,
    environments: Object.entries(environments)
      .map(([id, e]) => ({ id, name: typeof e?.name === 'string' && e.name ? e.name : id }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** An edit as it came from the wire: one of the three, with the right types, or undefined. */
export function readCampaignEdit(raw: unknown): CampaignEdit | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const b = raw as Record<string, unknown>;
  if (b.op === 'text' && typeof b.text === 'string') return { op: 'text', text: b.text };
  if (b.op === 'region' && b.region && typeof b.region === 'object' && !Array.isArray(b.region)) return { op: 'region', region: b.region };
  if (b.op === 'release' && typeof b.id === 'string') return { op: 'release', id: b.id };
  return undefined;
}

/** A change to make: the file and its text, the commit's message and author, and what it did. */
export interface CampaignChange {
  path: string;
  text: string;
  message: string;
  author: 'player' | 'agent';
  done: Extract<CampaignDone, { ok: true }>;
}

/**
 * An edit on the files of a universe: the change to make, or the reasons why not. The directives are checked as the validator checks them (the form
 * of the file, the caps) and their left-out lines are said; the regions as the kernel checks them (`masterRegion`: the texts of a player, the fourth
 * wall, the caps, an environment the world has). Never throws.
 */
export function campaignEdit(files: FileMap, edit: CampaignEdit, environments: Record<string, unknown>): CampaignChange | Extract<CampaignDone, { ok: false }> {
  const words = lexiconWords(files['world/lexicon.md'] ?? '');
  if (edit.op === 'text') {
    if (edit.text.length > CAMPAIGN_TEXT_CHARS) return { ok: false, reasons: [`al più ${CAMPAIGN_TEXT_CHARS} caratteri, commenti compresi`] };
    const text = edit.text.replace(/\r\n?/g, '\n');
    const read = readCampaign(text, { words, lang: languageOf(files) });
    if (read.errors.length) return { ok: false, reasons: read.errors };
    return {
      path: CAMPAIGN_FILE,
      text: text.endsWith('\n') ? text : `${text}\n`,
      message: 'direttive del master',
      author: 'player',
      done: { ok: true, said: 'direttive salvate', ...(read.left.length ? { left: read.left } : {}) },
    };
  }
  const atlas = readAtlas(files);
  if (edit.op === 'region') {
    const r = masterRegion(atlas, edit.region, environments, words);
    if ('errors' in r) return { ok: false, reasons: r.errors };
    const message = `regione del master «${r.region.name}» (${REGION_KIND_NAME[r.region.kind ?? 'plan']})`;
    return { path: ATLAS_FILE, text: writeAtlas(r.atlas), message, author: 'agent', done: { ok: true, said: message, region: r.region } };
  }
  const r = withoutMasterRegion(atlas, edit.id);
  if (!r) return { ok: false, reasons: ['nessuna regione del master con questo nome'] };
  const message = `regione del master «${r.region.name}» liberata`;
  return { path: ATLAS_FILE, text: writeAtlas(r.atlas), message, author: 'agent', done: { ok: true, said: message, region: r.region } };
}
