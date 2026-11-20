// T454: a universe of the Council cleaned of what the local models (`MockAiModels`) saved in it before T433, and of the seed's medieval
// environments a world of another age never takes (T433, `seedAged`, `TIMELESS_LAYOUTS`):
//   npx vite-node lab/scripts/pulisci-offline.ts -- universes/<nome> [--scrivi] [--multigiocatore]
// Without --scrivi it says what it would do and writes nothing. With --scrivi it writes the files of the universe's working tree and commits them in
// its repository (never rewriting its history: a tag before is the caller's). What it does:
//   - the seed's environments of an age (castle, fortress, dragon_lair…) leave the universe's manifests, when the universe is not of the seed's age;
//   - a plan the local models wrote (their names «Prato di Valmora», «Borgo del Re Muto»…, their descriptions) or laid out on one of those
//     environments goes: back to its last version of before in the history when it had a true one (a real place a session offline overwrote),
//     otherwise deleted, so that the Cartographer plans it again (`npm run genera`);
//   - an individual the local Narrator made (its story, its routine) leaves world/people.json, with the bonds the others had with them;
//   - the cards of the places and individuals gone leave world/cards.json, their nodes and links world/graph.json (the kernel rebuilds it whole at
//     the next commit: its hash no longer matches);
//   - with --multigiocatore, `universe.json → game.mode` becomes `multiplayer`, its master `me` (D66.3, C1).
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { bundledFiles } from '../../src/kernel/bundle';
import { seedAged, TIMELESS_LAYOUTS } from '../../src/kernel/themes';
import { slug } from '../../src/kernel/graph';

/** The local models' places: a noun of a biome and a suffix, a description of the biome (src/kernel/ai/mock.ts, `PLACES`, `SUFFIX`). */
const LOCAL_NOUNS = ['Bosco', 'Selva', 'Macchia', 'Foresta', 'Lago', 'Guado', 'Stagno', 'Palude', 'Colle', 'Rupe', 'Altura', 'Cava', 'Piana', 'Radura', 'Prato', 'Campagna', 'Borgo'];
const LOCAL_SUFFIXES = ['di Valmora', 'dei Sussurri', 'del Re Muto', 'delle Lanterne', 'Senza Ritorno', "dell'Eco", 'del Primo Passo', 'delle Rune', 'del Nastro', 'Immobile'];
const LOCAL_DESCRIPTIONS = new Set([
  'Gli alberi crescono in file troppo ordinate.',
  'Il vento muove le foglie tutte nello stesso istante.',
  'Tra i tronchi qualcosa scorre, come un nastro sotto i piedi.',
  "L'acqua è fredda e limpida.",
  'Le onde arrivano a riva lente, portando foglie.',
  'Sul fondo si vedono sassi lisci e qualche pesce.',
  'Le pietre sono coperte di muschio.',
  'Da quassù si vedono i tetti del borgo.',
  "L'eco ripete i tuoi passi.",
  "L'erba si piega al vento.",
  'Un sentiero di pecore attraversa il prato.',
  'In lontananza suona una campana.',
  'Qualcuno ha lasciato un cesto vuoto sul sasso.',
]);
/** The local Narrator's individuals: their story and their day (mock.ts, `npc.individuate`). */
const LOCAL_STORY = 'È nata qui e da qui non è mai riuscita ad andarsene, anche se ci ha provato.';
const LOCAL_DAY = ['apre le imposte', 'lavora', 'chiacchiera in piazza', 'dorme'];

export interface PlanLike {
  place?: { name?: string; description?: string };
  layout?: string;
}
export interface PersonLike {
  name?: string;
  story?: string;
  routine?: Array<{ does?: string }>;
  family?: Array<{ name?: string }>;
  origin?: string;
  place?: string;
}

/** Whether a place's plan is the local models' (its name or its description). */
export function isLocalPlan(p: PlanLike | undefined): boolean {
  const name = p?.place?.name ?? '';
  return LOCAL_DESCRIPTIONS.has(p?.place?.description ?? '') || LOCAL_NOUNS.some((n) => LOCAL_SUFFIXES.some((s) => name === `${n} ${s}`));
}

/** Whether an individual is the local Narrator's (its story, or its day as they write it). */
export function isLocalPerson(p: PersonLike): boolean {
  const day = (p.routine ?? []).map((r) => r.does);
  return p.story === LOCAL_STORY || (day.length === LOCAL_DAY.length && day.every((d, i) => d === LOCAL_DAY[i]));
}

/** The seed's environments of an age (all but `TIMELESS_LAYOUTS`): what a universe of another age does not keep. */
export function agedSeedLayouts(seed: Record<string, string> = bundledFiles): string[] {
  const ids = new Set<string>();
  for (const [p, text] of Object.entries(seed)) {
    if (!p.endsWith('manifest.json')) continue;
    try {
      for (const id of Object.keys(JSON.parse(text).layouts ?? {})) if (!TIMELESS_LAYOUTS.has(id)) ids.add(id);
    } catch {
      /* not a manifest that reads */
    }
  }
  return [...ids].sort();
}

/** A plan that goes: local, or on an environment that leaves. */
export const planGoes = (p: PlanLike | undefined, gone: ReadonlySet<string>): boolean => isLocalPlan(p) || (!!p?.layout && gone.has(p.layout));

/** The people without the local ones, and the bonds the others had with someone gone (a name another kept person has stays). */
export function cleanPeople<T extends PersonLike>(people: T[]): { kept: T[]; gone: T[]; bonds: number } {
  const gone = people.filter(isLocalPerson);
  const kept = people.filter((p) => !isLocalPerson(p));
  const keptNames = new Set(kept.map((p) => p.name));
  const goneNames = new Set(gone.map((p) => p.name).filter((n) => !keptNames.has(n)));
  let bonds = 0;
  const out = kept.map((p) => {
    if (!p.family?.some((f) => goneNames.has(f.name))) return p;
    const family = p.family.filter((f) => !goneNames.has(f.name));
    bonds += p.family.length - family.length;
    return { ...p, family };
  });
  return { kept: out, gone, bonds };
}

interface GraphData {
  graph: Record<string, unknown>;
  nodes: Array<Record<string, unknown> & { id: string }>;
  links: Array<Record<string, unknown> & { source: string; target: string }>;
}

/** The graph without the places, individuals and environments gone, in the kernel's own layout (`WorldGraph.toJson`). */
export function cleanGraph(text: string, places: ReadonlySet<string>, people: ReadonlySet<string>, layouts: ReadonlySet<string>): { text: string; nodes: number } {
  const g = JSON.parse(text) as GraphData;
  const goes = (n: Record<string, unknown> & { id: string }) =>
    (n.tipo === 'chunk' && (places.has(`${n.cx},${n.cy}`) || isLocalPlan({ place: { name: n.label as string, description: n.descrizione as string } }) || layouts.has(n.ambiente as string))) ||
    (n.tipo === 'individual' && people.has(n.id)) ||
    (n.tipo === 'environment' && layouts.has(n.id.replace(/^environment:/, '')));
  const out = new Set(g.nodes.filter(goes).map((n) => n.id));
  const nodes = g.nodes.filter((n) => !out.has(n.id));
  const links = g.links.filter((l) => !out.has(l.source) && !out.has(l.target));
  const rows = (xs: unknown[]) => (xs.length ? `[\n${xs.map((x) => JSON.stringify(x)).join(',\n')}\n]` : '[]');
  return { text: `{"directed":true,"multigraph":true,"graph":${JSON.stringify(g.graph)},\n"nodes":${rows(nodes)},\n"links":${rows(links)}}\n`, nodes: out.size };
}

const coords = (file: string) => /_(-?\d+)_(-?\d+)\.json$/.exec(file);

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const dir = path.resolve(args[0] ?? '');
  const write = args.includes('--scrivi');
  const multiplayer = args.includes('--multigiocatore');
  const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 });
  const read = (p: string) => fs.readFile(path.join(dir, p), 'utf8');
  const changes = new Map<string, string | null>();

  // The environments.
  const theme = await read('prompts/theme.md').catch(() => undefined);
  const aged = seedAged(theme);
  const seedAgedIds = agedSeedLayouts();
  const goneLayouts = new Set<string>();
  const manifests = git('ls-files', 'modules').split('\n').filter((p) => p.endsWith('/manifest.json'));
  if (!aged)
    for (const p of manifests) {
      const text = await read(p);
      const m = JSON.parse(text);
      if (!m.layouts) continue;
      const out = seedAgedIds.filter((id) => id in m.layouts);
      if (!out.length) continue;
      for (const id of out) {
        delete m.layouts[id];
        goneLayouts.add(id);
      }
      changes.set(p, JSON.stringify(m, null, 2) + '\n');
      console.log(`${p}: tolti ${out.length} ambienti del seme medievale (${out.join(', ')})`);
    }
  else console.log('universo dell’età del seme: gli ambienti restano');

  // The plans.
  const maps = git('ls-files', 'maps').split('\n').filter((p) => p.endsWith('.json'));
  const deleted = new Set<string>();
  const restored = new Map<string, string>();
  const cardsBack = new Map<string, unknown>();
  for (const p of maps) {
    const plan = JSON.parse(await read(p)).plan as PlanLike;
    if (!planGoes(plan, goneLayouts)) continue;
    const c = coords(p)!;
    const at = `${c[1]},${c[2]}`;
    let back: string | undefined;
    for (const h of git('log', '--format=%H', '--', p).split('\n').filter(Boolean)) {
      let text: string;
      try {
        text = git('show', `${h}:${p}`);
      } catch {
        continue;
      }
      if (planGoes(JSON.parse(text).plan, goneLayouts)) continue;
      back = text;
      try {
        const card = JSON.parse(git('show', `${h}:world/cards.json`)).chunks?.[`${c[1]}_${c[2]}`];
        if (card) cardsBack.set(`${c[1]}_${c[2]}`, card);
      } catch {
        /* no cards then */
      }
      console.log(`${at} «${plan.place?.name}» (${plan.layout}) → torna «${JSON.parse(text).plan.place?.name}» (${JSON.parse(text).plan.layout}) di ${h.slice(0, 7)}`);
      break;
    }
    if (back) {
      restored.set(at, back);
      changes.set(p, back);
    } else {
      deleted.add(at);
      changes.set(p, null);
    }
  }
  console.log(`piani: ${maps.length}; tolti ${deleted.size}; tornati alla versione vera ${restored.size}; restano ${maps.length - deleted.size}`);

  // The people.
  const peopleFile = JSON.parse(await read('world/people.json'));
  const people = cleanPeople(peopleFile.people ?? []);
  if (people.gone.length) changes.set('world/people.json', JSON.stringify({ ...peopleFile, people: people.kept }, null, 2) + '\n');
  console.log(`individui: ${(peopleFile.people ?? []).length}; tolti ${people.gone.length} (${people.gone.map((p) => `${p.name}, ${(p as { job?: string }).job}`).join('; ') || '-'}); legami tolti ${people.bonds}`);
  const goneSlugs = new Set(people.gone.map((p) => `individual:${slug(p.name ?? '')}`));
  for (const p of people.kept) {
    const o = (p.origin ?? '').split('#')[0];
    if (deleted.has(o)) console.log(`  attenzione: ${p.name} è nato in ${o}, che il Cartografo ripianifica`);
  }

  // The cards.
  const cards = JSON.parse(await read('world/cards.json'));
  let cardsGone = 0;
  for (const at of [...deleted, ...restored.keys()]) {
    const key = at.replace(',', '_');
    if (cards.chunks?.[key]) {
      if (cardsBack.has(key)) cards.chunks[key] = cardsBack.get(key);
      else delete cards.chunks[key];
      cardsGone++;
    }
    if (cards.uses?.[`chunk:${key}`]) delete cards.uses[`chunk:${key}`];
  }
  for (const s of goneSlugs) if (cards.uses?.[s]) delete cards.uses[s];
  changes.set('world/cards.json', JSON.stringify(cards, null, 1) + '\n');
  console.log(`carte dei luoghi tolte o tornate: ${cardsGone}`);

  // The graph.
  const graph = cleanGraph(await read('world/graph.json'), new Set([...deleted, ...restored.keys()]), goneSlugs, goneLayouts);
  changes.set('world/graph.json', graph.text);
  console.log(`grafo: tolti ${graph.nodes} nodi (il kernel lo ricostruisce al prossimo commit)`);

  // The game.
  if (multiplayer) {
    const u = JSON.parse(await read('universe.json'));
    if (u.game?.mode !== 'multiplayer') {
      // As a Genesis of many writes it (`repairGameSetup`): the master is who made it, `me` before accounts (the server's `QUINE_MASTER`).
      u.game = { ...u.game, mode: 'multiplayer', master: u.game?.master ?? 'me' };
      changes.set('universe.json', JSON.stringify(u, null, 2) + '\n');
      console.log('universe.json: game.mode multiplayer, master me');
    }
  }

  for (const [p, t] of [...changes]) if (t !== null && t === (await read(p).catch(() => undefined))) changes.delete(p);
  if (!write) {
    console.log(`(prova: ${changes.size} file cambierebbero; --scrivi per scriverli e committarli)`);
    return;
  }
  for (const [p, t] of changes) {
    if (t === null) await fs.rm(path.join(dir, p));
    else await fs.writeFile(path.join(dir, p), t);
  }
  git('add', '-A', '--', ...[...changes.keys()]);
  const what = [
    goneLayouts.size ? `${goneLayouts.size} ambienti del seme medievale` : '',
    deleted.size ? `${deleted.size} luoghi dei modelli locali` : '',
    restored.size ? `${restored.size} luoghi tornati alla versione vera` : '',
    people.gone.length ? `${people.gone.length} individui dei modelli locali` : '',
    multiplayer ? 'partita multigiocatore' : '',
  ].filter(Boolean);
  git('-c', 'user.name=lorenzoviva', '-c', 'user.email=lorenzo.vaccaro@hotmail.com', 'commit', '-q', '-m', `T454: pulizia dei modelli locali: ${what.join(', ')}`);
  console.log(`commit: ${git('log', '-1', '--format=%h %s').trim()}`);
}

// vite-node does not put the script in argv: the command runs unless a test imports the functions.
if (!process.env.VITEST) void main().then(() => process.exit(0));
