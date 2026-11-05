// T273: what Claude Cloud made, into the four universes one can explore, without one call to a model (MockAiModels only).
//   npx vite-node lab/banco/universi-cloud/strumenti/integra.ts            all four
//   npx vite-node lab/banco/universi-cloud/strumenti/integra.ts -- sidera  one
// For each universe: the structures of its theme (lab/banco/catalogo-cloud/<tema>/, 12), the procedural seed models (T270) over the seed's copies it
// has, the ten props of its theme, the pieces of its theme, the nineteen effects and the Death made again (T271), all in models/ and in
// models/index.json; then the plans of its places (maps/*.json) get the structures on their lots, as the kernel will build them (`lotti` in
// cloud.ts: the largest lots first, `claimSizes`'s rules: Grande on a lot whose longest side is 5 or more, one Enorme in the whole zone on a lot
// of 8 or more). Aurora has no maps of its own: the places around the start are planned once here by the offline Cartographer and kept in
// lab/banco/universi-cloud/aurora/maps/. Running it again gives the same files.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Kernel } from '../../../../src/kernel/kernel';
import { memoryStore } from '../../../../src/kernel/repo';
import { MockAiModels } from '../../../../src/kernel/ai/mock';
import { MemoryChunks, type ChunkRecord } from '../../../../src/kernel/chunks';
import { commonHouseModel, modelSize } from '../../../../src/kernel/modeldirector';
import type { ChunkPlan } from '../../../../src/kernel/agents/cartography';
import type { FileMap } from '../../../../src/kernel/types';
import { prefissoMappe } from './carica';
import { LUOGHI } from './luoghi';
import { CASA_SIDERA, CASE_SIDERA, collocate, leggi, lotti, luogoDi, modelloDi, PROGETTO, props, semeProcedurale, strutture, suoni, UNIVERSI, xmlDi, xmlLab, xmlStruttura, type Lotto, type Struttura, type Universo } from './cloud';

const solo = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const settle = (ms = 10) => new Promise((r) => setTimeout(r, ms));
const boot = (files: FileMap, chunks = new MemoryChunks()) => Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), chunks });

/** An index written as it was (its own indentation), with the entries in the order given. */
function scriviIndice(path: string, index: Record<string, unknown>, indent: string) {
  writeFileSync(path, JSON.stringify(index, null, indent) + '\n');
}

function indentDi(text: string): string {
  return /^\{\n( +)"/.exec(text)?.[1] ?? ' ';
}

const SEED_AUTORE = 'procedurale, a mano (Claude Cloud, T270)';
const STRUTTURE_AUTORE = (s: Struttura) => `procedurale, a mano (Claude Cloud, ${s.catalogo === 'primo' ? 'catalogo delle strutture, T269' : 'catalogo gemello, T273'})`;

// --- 1. models/ and models/index.json -----------------------------------------------------------------------------------------------------

function registra(u: Universo): string[] {
  const dir = join(PROGETTO, u.radice, 'models');
  const indexPath = join(dir, 'index.json');
  const text = readFileSync(indexPath, 'utf8');
  const index = JSON.parse(text) as Record<string, Record<string, unknown>>;
  const fatti: string[] = [];
  const put = (id: string, xml: string, voce: Record<string, unknown>) => {
    writeFileSync(join(dir, `${id}.xml`), xml.endsWith('\n') ? xml : xml + '\n');
    index[id] = { ...(index[id] ?? {}), ...voce };
  };
  // The seed's models, where the universe still has the seed's copy: the procedural program in its place, the entry kept (its name, its tint).
  let seme = 0;
  for (const m of semeProcedurale()) {
    if (!index[m.id] || !existsSync(join(dir, `${m.id}.xml`))) continue;
    const { voto: _, ...rest } = index[m.id];
    index[m.id] = { ...rest, autore: SEED_AUTORE };
    writeFileSync(join(dir, `${m.id}.xml`), xmlDi(m));
    seme++;
  }
  fatti.push(`${seme} modelli del seme procedurali`);
  for (const m of props(u.tema)) put(m.id, xmlDi(m), m.voce);
  fatti.push(`${props(u.tema).length} props`);
  // A structure's entry is written anew (its size comes later, from where it stands): a cellar is one tile under the ground (ADR-0135).
  for (const s of strutture(u.tema)) {
    delete index[s.id];
    put(s.id, xmlStruttura(s), { classe: 'grande', nome: s.nome, autore: STRUTTURE_AUTORE(s), ...(s.cantina ? { sotto: 1 } : {}) });
  }
  fatti.push(`${strutture(u.tema).length} strutture`);
  const sounds = suoni(u);
  for (const m of sounds) put(m.id, xmlDi(m), m.voce);
  fatti.push(`${sounds.length} suoni`);
  if (u.nome === 'sidera') fatti.push(...sidera(dir, index));
  // What an earlier version of this script wrote beside the seed's Death.
  delete index['suono-effetto-morte-v2'];
  rmSync(join(dir, 'suono-effetto-morte-v2.xml'), { force: true });
  const keys = Object.keys(index);
  scriviIndice(indexPath, Object.fromEntries(keys.map((k) => [k, index[k]])), indentDi(text));
  return fatti;
}

/**
 * Sidera: its common houses (it had none, so the seed's cottages stood in a city of light alloy), and its own two structures (T272) under
 * the names its plans give them, so that nobody has to write them: the dome of Serralta is its hydroponic dome, the rib of the hull its wreck.
 */
function sidera(dir: string, index: Record<string, Record<string, unknown>>): string[] {
  const terrain = join(PROGETTO, 'lab/banco/universi-cloud/sidera/modules/world.terreno-sidera/manifest.json');
  const t = JSON.parse(readFileSync(terrain, 'utf8'));
  if (t.commonHouse !== CASA_SIDERA) writeFileSync(terrain, JSON.stringify({ ...t, commonHouse: CASA_SIDERA }, null, 2) + '\n');
  const out: string[] = [];
  for (const classe of ['edificio', 'grande'] as const) {
    const id = commonHouseModel(CASA_SIDERA, classe);
    writeFileSync(join(dir, `${id}.xml`), xmlLab(CASE_SIDERA[classe]));
    index[id] = { classe, nome: classe === 'edificio' ? 'Modulo abitativo (casa comune)' : 'Residenza modulare (casa comune)', autore: 'Claude Cloud (T272, T273)' };
    out.push(id);
  }
  const alias: Record<string, [string, string, string]> = {
    'struttura-la-grande-cupola-di-serralta-v': ['sidera-cupola', 'edificio', 'La grande cupola di Serralta'],
    'struttura-la-costola-ricurva-di-uno-scaf': ['sidera-relitto', 'monumento', 'La costola dello scafo antico'],
  };
  for (const [id, [from, classe, nome]] of Object.entries(alias)) {
    writeFileSync(join(dir, `${id}.xml`), readFileSync(join(dir, `${from}.xml`), 'utf8'));
    index[id] = { classe, nome, autore: `Claude Cloud (T272, come ${from})` };
    out.push(id);
  }
  return [`case comuni e strutture proprie: ${out.join(', ')}`];
}

// --- 2. Aurora's places, planned once offline -----------------------------------------------------------------------------------------------

/**
 * Four places of aurora the offline Cartographer would leave without a lot (fields, a lake in a village): planned by hand in an environment of
 * the seed that has lots, so that the twelve structures of its theme find room near the start. In-world words only (rule 0).
 */
const AURORA_A_MANO: Record<string, Pick<ChunkPlan, 'layout' | 'place'>> = {
  '1,-1': { layout: 'tempio', place: { name: 'Santuario della Luna Bianca', description: "Un tempio di pietra chiara sul poggio, dove i pellegrini lasciano candele e nastri d'argento ai piedi delle colonne." } },
  '1,0': { layout: 'torre_mago', place: { name: "Torre dell'Astrologo", description: "Una torre di pietra scura in mezzo al prato, con la lanterna sempre accesa in cima e i libri dell'astrologo impilati sul davanzale." } },
  '2,0': { layout: 'castello', place: { name: 'Rocca del Passo', description: 'Una rocca di guardia sulla strada del passo, con le mura merlate, la torre e le stalle dei soldati.' } },
  '0,1': { layout: 'borgo_mattoni', place: { name: 'Contrada dei Mattoni', description: 'Case di mattoni rossi attorno a una piazzetta col pozzo, il forno del borgo e le botteghe degli artigiani.' } },
};

async function mappeAurora(u: Universo, files: FileMap): Promise<Record<string, ChunkRecord>> {
  const dir = join(PROGETTO, u.mappe);
  const prefix = prefissoMappe(files);
  const have = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith(prefix + '_')) : [];
  if (have.length >= LUOGHI.length) return {};
  const chunks = new MemoryChunks();
  const k = await boot(files, chunks);
  const kk = k as any;
  const out: Record<string, ChunkRecord> = {};
  for (const [cx, cy] of LUOGHI) {
    kk.genBudget = 1000;
    const ch = kk.ensureChunk(cx, cy);
    if (ch.stage === 'draft') await kk.develop(ch);
    for (let i = 0; i < 50 && ch.stage === 'draft'; i++) await settle();
    if (!ch.plan) throw new Error(`aurora: il luogo ${cx},${cy} non è stato pianificato`);
    const plan: ChunkPlan = JSON.parse(JSON.stringify(ch.plan));
    // Nothing that would call a model once the place is loaded: no new things for the Forge, only things on the ground the world knows.
    plan.fresh = [];
    plan.ground = plan.ground.filter((g) => !!k.content.byName(g));
    delete plan.carta;
    plan.strutture = [];
    Object.assign(plan, AURORA_A_MANO[`${cx},${cy}`] ?? {});
    out[`${prefix}_${cx}_${cy}`] = { plan };
  }
  return out;
}

// --- 3. The structures on the lots ------------------------------------------------------------------------------------------------------------

const PAROLE: Array<[RegExp, RegExp]> = [
  // What a structure is → the words of the places where it stands well (environment id, place name, description).
  [/locanda|taverna|trattoria|bistrot|bar|lounge/, /piazza|borgo|rione|mercato|quartiere|vicoli|baracche|locanda|corso|neon|porto/],
  [/santuario|tempio|cattedrale|chiesa|cappella/, /tempio|rovine|collina|piazza|giardino|cupola|santuario|sacr|canyon|cristall/],
  [/torre|faro|osservatorio/, /porto|torre|collina|lungomare|ormeggio|costa|canyon|telemetr|faro|spazioporto|relitti/],
  [/fucina|officina|laboratorio/, /officin|fonderia|miniera|cantiere|laboratorio|fusione|magazzin|fabbric/],
  [/residenza|palazzina|palazzo|condominio|casa/, /quartiere|rione|borgo|corso|uffici|torri|vicoli|abitat/],
  [/forte|fortino|stazione|scalo|mercato/, /stazione|scalo|spazioporto|mercato|porto|fortezza|castello|caserma|viadotti|confine/],
];

/** Which kind of building a structure is (the row of PAROLE), so that a place does not get two of the same. */
const tipo = (s: Struttura) => PAROLE.findIndex(([what]) => what.test(s.concetto));

function affinita(s: Struttura, plan: ChunkPlan): number {
  const where = `${plan.layout} ${plan.place.name} ${plan.place.description}`.toLowerCase();
  let n = 0;
  for (const [what, places] of PAROLE) if (what.test(s.concetto)) n += (where.match(new RegExp(places.source, 'g')) ?? []).length;
  return n;
}

interface Posto {
  name: string;
  cx: number;
  cy: number;
  plan: ChunkPlan;
  lots: Lotto[];
  /** The structures the plan keeps (the universe's own), then the Cloud's. */
  tiene: NonNullable<ChunkPlan['strutture']>;
  nuove: Array<{ s: Struttura; taglia: 'grande' | 'enorme' }>;
}

/** The lots a structure can still take: they are taken in order, the largest first, and a grande model needs a longest side of 5. */
const liberi = (p: Posto) => {
  const from = p.tiene.length + p.nuove.length;
  let n = 0;
  while (from + n < p.lots.length && p.lots[from + n].lato >= 5) n++;
  return n;
};

const MAX_PER_LUOGO = 2;

function colloca(u: Universo, files: FileMap, k: Kernel, maps: Record<string, ChunkRecord>): { maps: Record<string, ChunkRecord>; righe: string[] } {
  const known = new Set(Object.keys(JSON.parse(files['models/index.json'])));
  const catalogo = strutture(u.tema);
  const posti: Posto[] = [];
  for (const [name, rec] of Object.entries(maps)) {
    const at = luogoDi(files, name);
    if (!at) continue;
    const plan: ChunkPlan = JSON.parse(JSON.stringify(rec.plan));
    // What the universe had and has a model (neapolis's tower and market, sidera's dome and wreck) stays, first; the rest goes.
    const tiene = (plan.strutture ?? []).filter((s) => known.has(modelloDi(s.concetto)) && !catalogo.some((c) => c.id === modelloDi(s.concetto)));
    const bare = { ...plan, strutture: tiene };
    posti.push({ name, cx: at[0], cy: at[1], plan: bare, lots: lotti(k, at[0], at[1], bare), tiene, nuove: [] });
  }
  const dist = (p: Posto) => Math.hypot(p.cx, p.cy);
  posti.sort((a, b) => dist(a) - dist(b) || a.cy - b.cy || a.cx - b.cx);
  const restano = [...catalogo];
  // One Enorme in the zone (ADR-0092): a structure with a cellar on a free lot of 8 or more, where it fits best (the words of the place), then on
  // the lot whose shorter side is the longest (the model is 7.5 tiles a side: on a narrow lot it would stand over the next one), the nearest.
  const corto = (p: Posto) => Math.min(p.lots[p.tiene.length].w, p.lots[p.tiene.length].h);
  let enorme: { p: Posto; s: Struttura } | undefined;
  for (const p of posti.filter((p) => liberi(p) > 0 && p.lots[p.tiene.length].lato >= 8))
    for (const s of restano.filter((x) => x.cantina)) {
      const better = !enorme || affinita(s, p.plan) - affinita(enorme.s, enorme.p.plan) || corto(p) - corto(enorme.p) || dist(enorme.p) - dist(p);
      if (better === true || (typeof better === 'number' && better > 0)) enorme = { p, s };
    }
  if (enorme) {
    enorme.p.nuove.push({ s: enorme.s, taglia: 'enorme' });
    restano.splice(restano.indexOf(enorme.s), 1);
  }
  // The others: each where it fits best (the words of the place), then the nearest to the start, at most two to a place.
  while (restano.length) {
    let best: { p: Posto; s: Struttura; score: number } | undefined;
    for (const s of restano)
      for (const p of posti) {
        if (!liberi(p) || p.nuove.length >= MAX_PER_LUOGO) continue;
        const score = affinita(s, p.plan) * 10 - dist(p) * 3 - p.nuove.length * 8 - (p.nuove.some((n) => tipo(n.s) === tipo(s)) ? 40 : 0);
        if (!best || score > best.score) best = { p, s, score };
      }
    if (!best) break;
    best.p.nuove.push({ s: best.s, taglia: 'grande' });
    restano.splice(restano.indexOf(best.s), 1);
  }
  const righe: string[] = [];
  if (restano.length) righe.push(`✗ non trovano un lotto: ${restano.map((s) => s.id).join(', ')}`);
  // The sizes as the kernel will leave them (`claimSizes`, which saves the plan it changes): a plan of the universe's own whose size does not
  // fit its lot is written already fitted, so loading it changes nothing.
  const kk = k as any;
  const out: Record<string, ChunkRecord> = {};
  for (const p of posti) {
    const plan: ChunkPlan = { ...p.plan, strutture: [...p.tiene, ...p.nuove.map((n) => ({ concetto: n.s.concetto, taglia: n.taglia }))] };
    kk.claimSizes({ cx: p.cx, cy: p.cy, key: `${p.cx},${p.cy}`, lots: lotti(k, p.cx, p.cy, plan).map((l) => ({ x0: 0, y0: 0, x1: l.w - 1, y1: l.h - 1 })) }, plan);
    if (!plan.strutture?.length && !('strutture' in maps[p.name].plan)) delete plan.strutture;
    out[p.name] = { ...maps[p.name], plan };
  }
  return { maps: out, righe };
}

/**
 * The size of a structure is its model's (`modelSize`, ADR-0092): the library runs it in that box. The one placed Enorme says so in the index,
 * with the coarser density its box runs at; the others are of their class's size.
 */
function segnaTaglie(u: Universo, maps: Record<string, ChunkRecord>) {
  const indexPath = join(PROGETTO, u.radice, 'models/index.json');
  const text = readFileSync(indexPath, 'utf8');
  const index = JSON.parse(text) as Record<string, Record<string, unknown>>;
  const ids = new Set(strutture(u.tema).map((s) => s.id));
  for (const rec of Object.values(maps))
    for (const s of rec.plan.strutture ?? []) {
      const id = modelloDi(s.concetto);
      if (ids.has(id) && s.taglia && s.taglia !== 'grande') Object.assign(index[id], modelSize({ classe: 'grande', taglia: s.taglia }));
    }
  scriviIndice(indexPath, index, indentDi(text));
}

// --- main -------------------------------------------------------------------------------------------------------------------------------------

{
  const riepilogo: Record<string, unknown> = {};
  for (const u of UNIVERSI) {
    if (solo.length && !solo.includes(u.nome)) continue;
    console.log(`== ${u.nome} (${u.tema})`);
    console.log('  ' + registra(u).join('; '));
    let { files, maps } = leggi(u);
    if (u.nome === 'aurora') {
      const nuove = await mappeAurora(u, files);
      if (Object.keys(nuove).length) {
        mkdirSync(join(PROGETTO, u.mappe), { recursive: true });
        for (const [name, rec] of Object.entries(nuove)) writeFileSync(join(PROGETTO, u.mappe, `${name}.json`), JSON.stringify(rec, null, 1) + '\n');
        console.log(`  ${Object.keys(nuove).length} luoghi pianificati offline in ${u.mappe}`);
        ({ files, maps } = leggi(u));
      }
    }
    const k = await boot(files);
    const placed = colloca(u, files, k, maps);
    for (const [name, rec] of Object.entries(placed.maps)) writeFileSync(join(PROGETTO, u.mappe, `${name}.json`), JSON.stringify(rec, null, 1) + '\n');
    placed.righe.forEach((r) => console.log('  ' + r));
    segnaTaglie(u, placed.maps);
    ({ files } = leggi(u));
    const check = await collocate(files, placed.maps);
    for (const s of check.strutture) console.log(`  (${s.cx}, ${s.cy}) ${s.luogo} [${s.ambiente}]: ${s.concetto} → ${s.modello}${s.taglia ? ` (${s.taglia})` : ''}, lotto ${s.lotto}`);
    check.problemi.forEach((p) => console.log('  ✗ ' + p));
    riepilogo[u.nome] = { strutture: check.strutture.length, problemi: check.problemi.length };
  }
  console.log(JSON.stringify(riepilogo));
  process.exit(0);
}
