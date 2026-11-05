// The checks of a universe written by hand, with the kernel's own validators: the fourth wall on every text of the world, the plans of the
// places, the plots against the registry of people. Each returns one line per problem (empty: all good).

import { bibleBreaks, lexiconWords, metaBreak } from '../../../../src/kernel/fourthwall';
import { readPeople, repairSociety, similarNames } from '../../../../src/kernel/society';
import { readPlots, reviewPlot } from '../../../../src/kernel/plots';
import { readFileSync } from 'node:fs';
import type { Kernel } from '../../../../src/kernel/kernel';
import type { ChunkRecord } from '../../../../src/kernel/chunks';
import type { FileMap } from '../../../../src/kernel/types';

const SEED = new URL('../../../../universe/', import.meta.url).pathname;
const seedText = (rel: string) => {
  try {
    return readFileSync(SEED + rel, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    return undefined;
  }
};

/** The files of the world (what people inside it can read or meet): everything but the agents' prompts and what is the seed's own, unchanged. */
export function fileDelMondo(files: FileMap): string[] {
  return Object.keys(files).filter((p) => !p.startsWith('prompts/agents/') && seedText(p) !== files[p]);
}

/** Every string in a JSON value, with where it is. */
function strings(v: unknown, at: string, out: Array<[string, string]>): void {
  if (typeof v === 'string') out.push([at, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${at}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, `${at}.${k}`, out);
}

/** The texts of a file the fourth wall applies to: the strings of a JSON, the comments and strings of Lua, the names and comments of a program, the whole of Markdown. */
export function testiDi(path: string, text: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  if (path.endsWith('.json')) strings(JSON.parse(text), path, out);
  else if (path.endsWith('.lua')) {
    for (const m of text.matchAll(/--[^\n]*|"(?:\\.|[^"\\])*"/g)) out.push([path, m[0]]);
  } else if (path.endsWith('.xml')) {
    for (const m of text.matchAll(/<!--[\s\S]*?-->|name="[^"]*"/g)) out.push([path, m[0]]);
  } else out.push([path, text]);
  return out;
}

/** The fourth wall (metaBreak, with the lexicon's words: no glossary either) on every text of the world, and the bible's own check. */
export function quartaParete(files: FileMap, maps: Record<string, ChunkRecord>): string[] {
  const words = lexiconWords(files['world/lessico.md'] ?? '');
  const out: string[] = [];
  const texts: Array<[string, string]> = [];
  for (const p of fileDelMondo(files)) texts.push(...testiDi(p, files[p]));
  for (const [name, rec] of Object.entries(maps)) strings(rec, `maps/${name}.json`, texts);
  for (const [where, t] of texts) {
    // The lexicon itself names its words: only the meta-game is looked for there.
    const m = metaBreak(t, where === 'world/lessico.md' ? [] : words);
    if (m) out.push(`${where}: «${m}» in «${t.slice(0, 90)}»`);
  }
  const bible = JSON.parse(files['world/bible.json']);
  out.push(...bibleBreaks(bible, words).map((b) => `world/bible.json: ${b}`));
  return out;
}

/** Every plan through Validator.validatePlan, as the kernel would judge it: nothing fatal, nothing dropped. */
export function piani(k: Kernel, maps: Record<string, ChunkRecord>): string[] {
  const layouts = new Set(Object.keys(k.content.layouts));
  const placeable = new Set([...k.modules.values()].filter((m) => m.manifest.kind === 'entity' || m.manifest.kind === 'item').map((m) => m.manifest.id));
  const out: string[] = [];
  for (const [name, rec] of Object.entries(maps)) {
    const v = k.validator.validatePlan(rec.plan, layouts, placeable);
    for (const e of [...v.errors, ...v.dropped]) out.push(`maps/${name}.json: ${e}`);
    for (const g of rec.plan.ground) if (!k.content.byName(g)) out.push(`maps/${name}.json: a terra «${g}» non è un oggetto noto`);
  }
  return out;
}

/** The people: names unlike each other, relations that go both ways; the plots through reviewPlot. */
export function societa(files: FileMap): string[] {
  const people = readPeople(files);
  const words = lexiconWords(files['world/lessico.md'] ?? '');
  const out: string[] = [];
  const names = people.persone.map((p) => p.nome);
  names.forEach((a, i) => names.slice(i + 1).forEach((b) => similarNames(a, b) && out.push(`persone: «${a}» e «${b}» sono troppo simili`)));
  for (const p of people.persone) {
    if (p.routine?.length !== 4) out.push(`${p.nome}: la routine non ha quattro momenti`);
    for (const f of p.famiglia) {
      const other = people.persone.find((x) => x.nome === f.nome);
      if (!other) out.push(`${p.nome}: legame con ${f.nome}, che non c'è`);
      else if (!other.famiglia.some((g) => g.nome === p.nome)) out.push(`${p.nome}: ${f.nome} non sa di essere ${f.legame}`);
    }
  }
  for (const f of repairSociety(people, (t) => (/gatto/.test(t) ? 'animale' : 'persona')).fixes) out.push(`persone: il kernel correggerebbe «${f}»`);
  for (const plot of readPlots(files)) for (const pr of reviewPlot(plot, people, words).problems) out.push(`trama ${plot.id}: ${pr}`);
  return out;
}

/**
 * A module as the kernel takes it from the universe's files, and as the Forge would take it: the manifest (`parseManifest`), the Lua that compiles
 * (`checkLua`), calls only the API (`apiErrors`) and loads in a VM apart (`probe`); an entity or an item also through `validateForged`, the
 * Forge's own gate. Systems and data never come from the Forge (ADR-0028), so for them the first four are the whole of it.
 */
export function modulo(k: Kernel, files: FileMap, id: string): string[] {
  const path = `modules/${id}/manifest.json`;
  const { manifest, errors } = k.validator.parseManifest(path, files[path] ?? '');
  if (!manifest) return errors;
  const logicPath = `modules/${id}/${manifest.logic ?? 'logic.lua'}`;
  const logic = manifest.logic ? files[logicPath] : undefined;
  if (manifest.logic && logic === undefined) return [`${logicPath}: manca`];
  const out = [...errors];
  if (logic !== undefined) {
    out.push(...k.validator.checkLua(logicPath, logic), ...apiErrorsOf(logic).map((e) => `${logicPath}: ${e}`));
    if (!out.length) {
      const e = (k as any).sandbox.probe(logic, logicPath) as string | null;
      if (e) out.push(e);
    }
  }
  if (manifest.kind === 'entity' || manifest.kind === 'item') out.push(...k.validator.validateForged(manifest, logic ?? 'return {}', new Set()));
  return [...new Set(out)];
}

import { apiErrors as apiErrorsOf } from '../../../../src/kernel/validator';
