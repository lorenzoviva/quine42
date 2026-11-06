// La verifica di Neapolis, da capo a fondo: npx vite-node lab/banco/universi-cloud/neapolis/verifica.ts
//
// 1. Ciò che si controlla senza far girare il mondo: la quarta parete su ogni testo del mondo; i 25 moduli Lua e i 4 di dati
//    (validateForged o gli stessi controlli: manifest, Lua, API, caricamento di prova; e gli avvisi: oggetti, modelli, tabelle);
//    i 19 piani (validatePlan) e i 12 ambienti (validateLayout sulle bozze vere); la società (checkSociety); le trame (reviewPlot);
//    le 12 rune (validateNewRune, ripetuto contro le altre); i 16 modelli (modelErrors e varianza di forma su 5 semi > 0,15);
//    gli 8 programmi sonori (modelErrors e analyzeSound su 10 terne di semi, nessun difetto).
// 2. Il mondo: un Kernel vero con MockAiModels apre l'universo e i piani di maps/, e in 600 tick il viandante parla con gli
//    individui (e il registro li riconosce), usa ogni azione di ogni cosa, raccoglie oggetti e rune, fabbrica le 12 ricette,
//    mangia e beve, pronuncia le 12 rune urbane e quattro formule, lascia il rione al buio e ridà la corrente, accetta e compie
//    tre missioni, cammina e va in tutti i 19 luoghi. Ogni fault sollevato in qualunque momento si conta: devono essere 0.
// Scrive verifica.json accanto a sé; esce con 1 se qualcosa non va.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Kernel } from '../../../../src/kernel/kernel';
import { validateNewRune } from '../../../../src/kernel/magic';
import { lexiconWords } from '../../../../src/kernel/fourthwall';
import { checkSociety, readPeople } from '../../../../src/kernel/society';
import { readPlots } from '../../../../src/kernel/plots';
import { countItem } from '../../../../src/kernel/inventory';
import { bootNeapolis, DIR, mapFiles, universeFiles } from './strumenti/universo';
import { checkFourthWall } from './strumenti/quarta-parete';
import { DATA_MODULES, LUA_MODULES, validateModules } from './strumenti/moduli';
import { measureModel } from './strumenti/misura-modelli';
import { measureSound } from './strumenti/misura-suoni';

const DT = 1 / 60;
const TICKS = 600;
const settle = (ms = 4) => new Promise((r) => setTimeout(r, ms));
const problems: string[] = [];
const out: Record<string, unknown> = {};
const log = (s: string) => console.log(s);
const fail = (s: string) => {
  problems.push(s);
  log(`  ✗ ${s}`);
};

// ------------------------------------------------------------------ 1. senza far girare il mondo
log('— Quarta parete');
const wall = checkFourthWall();
out.quartaParete = wall;
log(`  ${wall.files} file, ${wall.texts} testi, ${wall.breaks.length} rotture`);
wall.breaks.forEach(fail);

const files = universeFiles();
const k0 = await bootNeapolis({ files });

log('— Moduli');
const mods = validateModules(k0);
const lua = mods.filter((m) => LUA_MODULES.includes(m.id));
out.moduli = { lua: lua.length, dati: DATA_MODULES.length, errori: mods.reduce((n, m) => n + m.errors.length, 0), avvisi: mods.reduce((n, m) => n + m.warnings.length, 0) };
log(`  ${lua.length} moduli Lua + ${DATA_MODULES.length} di dati: ${(out.moduli as { errori: number }).errori} errori, ${(out.moduli as { avvisi: number }).avvisi} avvisi`);
if (lua.length !== 25) fail(`i moduli Lua sono ${lua.length}, non 25`);
for (const m of mods) [...m.errors, ...m.warnings].forEach((e) => fail(`${m.id}: ${e}`));

log('— Luoghi e ambienti');
const layouts = (k0 as unknown as { content: { layouts: Record<string, unknown> } }).content.layouts;
const placeable = new Set(k0.catalog().map((c) => c.id));
const maps = mapFiles();
let planIssues = 0;
for (const [file, rec] of Object.entries(maps)) {
  const v = k0.validator.validatePlan((rec as { plan: never }).plan, new Set(Object.keys(layouts)), placeable);
  for (const e of [...v.errors, ...v.dropped]) {
    planIssues++;
    fail(`maps/${file}: ${e}`);
  }
}
const drafts: string[][] = [];
for (const file of Object.keys(maps)) {
  const [cx, cy] = file.replace(/\.json$/, '').split('_').slice(-2).map(Number);
  const d: string = (k0 as unknown as { genDraft(x: number, y: number): string }).genDraft(cx, cy);
  drafts.push(Array.from({ length: 18 }, (_, r) => d.slice(r * 18, r * 18 + 18)));
}
let layoutIssues = 0;
for (const [id, def] of Object.entries(layouts)) {
  const e = k0.validator.validateLayout(id, def as never, (k0 as unknown as { palette: never }).palette, drafts);
  layoutIssues += e.length;
  e.forEach(fail);
}
out.luoghi = { piani: Object.keys(maps).length, problemi: planIssues, ambienti: Object.keys(layouts).length, bozze: drafts.length, problemiAmbienti: layoutIssues };
log(`  ${Object.keys(maps).length} piani, ${Object.keys(layouts).length} ambienti su ${drafts.length} bozze: ${planIssues + layoutIssues} problemi`);
if (Object.keys(maps).length !== 19) fail(`i piani sono ${Object.keys(maps).length}, non 19`);

log('— Società, trame, atlante');
const people = readPeople(files);
const society = checkSociety(people, (tipo) => (tipo === 'npc.gatto' ? 'animal' : 'person'));
society.forEach((s) => fail(`società: ${s}`));
const plots = readPlots(files);
const atlas = JSON.parse(files['world/atlas.json']).regioni as Array<{ ambiente: string; nome: string }>;
for (const r of atlas) if (!layouts[r.ambiente]) fail(`atlante: la regione ${r.nome} ha l'ambiente ${r.ambiente}, che non c'è`);
out.societa = { individui: people.people.length, legami: people.people.reduce((n, p) => n + p.family.length, 0) / 2, problemi: society.length, trame: plots.length, regioni: atlas.length };
log(`  ${people.people.length} individui, ${(out.societa as { legami: number }).legami} legami, ${plots.length} trame, ${atlas.length} regioni: ${society.length} problemi`);
if (people.people.length !== 24 || plots.length !== 8 || atlas.length !== 10) fail('i numeri della società, delle trame o dell\'atlante non tornano');

log('— Rune');
const magic = JSON.parse(files['modules/magic.runes/manifest.json']);
const seedRunes = JSON.parse(readFileSync('universe/modules/magic.runes/manifest.json', 'utf8')).runes;
const urban = Object.keys(magic.runes).filter((t) => !(t in seedRunes));
const words = lexiconWords(files['world/lexicon.md']);
for (const t of urban) {
  const others = Object.fromEntries(Object.entries(magic.runes).filter(([x]) => x !== t)) as never;
  const r = magic.runes[t];
  const { errors } = validateNewRune({ token: t, nome: r.name, glifo: r.glyph, colore: r.color, elemento: r.element, descrizione: r.description }, others, words);
  errors.forEach((e) => fail(`runa ${t}: ${e}`));
  if (!magic.spells[t]) fail(`la runa ${t} non ha un incantesimo`);
  if (!files['world/canon.md'].includes(`(«${t}»`)) fail(`la runa ${t} non è nel canone`);
}
out.rune = { urbane: urban.length, totali: Object.keys(magic.runes).length, incantesimi: Object.keys(magic.spells).length };
log(`  ${urban.length} rune urbane (${Object.keys(magic.runes).length} in tutto), ${Object.keys(magic.spells).length} incantesimi`);
if (urban.length !== 12) fail(`le rune urbane sono ${urban.length}, non 12`);

log('— Modelli');
const index = JSON.parse(files['models/index.json']);
const ours = Object.entries<{ autore?: string; classe: string }>(index).filter(([, e]) => e.autore === 'a mano (Claude Code, Neapolis)');
const shapes = ours.filter(([, e]) => e.classe !== 'suono').map(([id]) => id);
const sounds = ours.filter(([, e]) => e.classe === 'suono').map(([id]) => id);
const modelRows: Array<{ id: string; varianza: number; errori: number }> = [];
for (const id of shapes) {
  const r = measureModel(join(DIR, 'models', `${id}.xml`));
  modelRows.push({ id, varianza: Math.round(r.varianza * 1000) / 1000, errori: r.errors.length });
  r.errors.forEach((e) => fail(e));
  if (!(r.varianza > 0.15)) fail(`${id}: varianza ${r.varianza.toFixed(3)} ≤ 0,15`);
}
log(`  ${shapes.length} modelli: varianza minima ${Math.min(...modelRows.map((r) => r.varianza)).toFixed(3)}, ${modelRows.reduce((n, r) => n + r.errori, 0)} errori`);
if (shapes.length !== 16) fail(`i modelli sono ${shapes.length}, non 16`);
const soundRows: Array<{ id: string; effetto: boolean; difetti: number }> = [];
for (const id of sounds) {
  const r = measureSound(join(DIR, 'models', `${id}.xml`));
  soundRows.push({ id, effetto: r.effect, difetti: r.errors.length + r.issues.length });
  [...r.errors, ...r.issues].forEach((e) => fail(`${id}: ${e}`));
}
const music = soundRows.filter((r) => !r.effetto).length;
log(`  ${sounds.length} programmi sonori (${music} brani, ${sounds.length - music} effetti) su 10 terne di semi: ${soundRows.reduce((n, r) => n + r.difetti, 0)} difetti`);
if (music !== 5 || sounds.length !== 8) fail('i brani devono essere 5 e gli effetti 3');
out.modelli = modelRows;
out.suoni = soundRows;

// ------------------------------------------------------------------ 2. il mondo che gira
log('— Il mondo: 600 tick');
const k: Kernel = await bootNeapolis({ files });
const raised: string[] = [];
k.bus.on('fault', ({ fault }: { fault: { key: string; message: string } }) => raised.push(`${fault.key}: ${fault.message}`));
if (k.faults.size) raised.push(...k.faults.list().map((f) => `${f.key}: ${f.message} (all'avvio)`));
let ticks = 0;
const tick = async (n: number) => {
  for (let i = 0; i < n && ticks < TICKS; i++) {
    k.tick(DT);
    ticks++;
    if (ticks % 4 === 0) await settle();
  }
};
const said: string[] = [];
k.bus.on('ui:dialog', ({ text }: { text: string }) => said.push(text));
const counts = { individui: 0, riconosciuti: 0, azioni: 0, raccolti: 0, rune: 0, ricette: 0, usati: 0, incantesimi: 0, luoghi: 0, missioni: 0, buio: 0, riaccesi: 0 };
const mod = (id: number): string | undefined => k.ecs.get(id, 'module')?.id;
const inv = () => k.inventory();
/** Un posto libero in tasca: si svuota la tasca più vecchia che non è la borsa delle rune. */
const room = () => {
  const s = inv().slots;
  if (s.some((x) => !x)) return;
  const i = s.findIndex((x) => x && x.item !== 'item.borsa-rune');
  if (i >= 0) s[i] = null;
};
const give = (item: string, n = 1) => {
  room();
  return k.give(item, n);
};
const needs = () => k.needs()!;

// I luoghi attorno alla piazza si aprono dai piani.
await tick(60);
const planned = () => [...k.chunks.values()].filter((c) => c.stage === 'planned');
log(`  dopo ${ticks} tick: ${planned().length} luoghi pianificati`);

// Gli individui: il registro li riconosce per origine, senza chiedere al Narratore.
// Chi sta in un luogo dei piani è del registro; nei luoghi oltre i piani il Cartografo (qui i modelli locali) ne mette di nuovi.
const registry = new Set(people.people.map((p) => p.name));
const mapped = new Set(Object.keys(maps).map((f) => f.replace(/\.json$/, '').split('_').slice(-2).join(',')));
const npcs = k.ecs.query('module').filter((id) => mod(id)?.startsWith('npc.'));
const strangers: string[] = [];
let inMaps = 0;
for (const id of npcs) {
  const who = await k.ensureIdentity(id);
  const origin: string = k.ecs.get(id, 'origin')?.key ?? '';
  counts.individui++;
  if (who && registry.has(who.name)) counts.riconosciuti++;
  if (mapped.has(origin.split('#')[0])) {
    inMaps++;
    if (!who || !registry.has(who.name)) fail(`${origin}: ${who?.name ?? '?'} sta in un luogo dei piani ma non è del registro`);
  } else strangers.push(`${who?.name ?? '?'} (${origin})`);
}
log(`  ${counts.individui} individui nel mondo: ${inMaps} nei luoghi dei piani, ${counts.riconosciuti} riconosciuti dal registro; nuovi altrove: ${strangers.join(', ') || 'nessuno'}`);
await tick(10);

// Ogni azione di ogni individuo e di ogni cosa, con ciò che chiede in tasca; con e senza gli stati delle rune addosso.
const actOn = async (id: number) => {
  const m = k.modules.get(mod(id)!)?.manifest;
  for (const a of m?.actions ?? []) {
    if (a.requires) give(a.requires, 3);
    give('item.cento-lire', 3);
    await k.perform(id, `act:${a.id}`);
    counts.azioni++;
  }
};
const urbanTokens = urban;
for (const id of npcs) {
  await actOn(id);
  // Con una runa in tasca, e due volte il quartiere: il discorso va avanti.
  give(`rune:${urbanTokens[id % urbanTokens.length]}`, 1);
  await k.perform(id, 'act:rune');
  await k.perform(id, 'act:quartiere');
  await k.perform(id, 'act:quartiere');
  counts.azioni += 3;
}
await tick(20);
const things = k.ecs.query('module').filter((id) => mod(id)?.startsWith('obj.'));
for (const id of things) {
  await actOn(id);
  if (mod(id) === 'obj.scrivania') for (let i = 0; i < 4; i++) await k.perform(id, 'act:fruga');
}
await tick(20);
log(`  ${npcs.length} individui e ${things.length} cose: ${counts.azioni} azioni`);

// Raccolta: gli oggetti a terra e le rune sul suolo.
for (const id of k.ecs.query('pickup').slice(0, 30)) {
  room();
  if ((k as unknown as { pickUpEntity(i: number): boolean }).pickUpEntity(id)) counts.raccolti++;
}
// Solo le rune magiche: togliere una parola da una frase incisa (la «speed = speed» della piazza) la spezza, ed è il viandante a rompere il mondo.
for (const id of k.ecs.query('rune').filter((r) => k.ecs.get(r, 'rune').token in magic.runes).slice(0, 12)) if (k.pickUpRune(id)) counts.rune++;
await tick(20);
log(`  raccolti ${counts.raccolti} oggetti e ${counts.rune} rune`);

// Le 12 ricette: gli ingredienti in tasca, poi la ricetta.
for (const r of JSON.parse(files['modules/items.neapolis/manifest.json']).recipes as Array<{ id: string; inputs: Array<{ item: string; count: number }>; tools?: string[] }>) {
  inv().slots.forEach((s, i) => s && s.item !== 'item.borsa-rune' && (inv().slots[i] = null));
  for (const x of r.inputs) give(x.item, x.count);
  for (const t of r.tools ?? []) give(t, 1);
  if (k.craft(r.id)) counts.ricette++;
  else fail(`la ricetta ${r.id} non riesce`);
}
await tick(20);

// Usare: mangiare, bere, medicarsi, accendere la torcia.
for (const item of ['item.cornetto', 'item.tazzina-caffe', 'item.granita', 'item.pizza', 'item.ragu', 'item.garza', 'item.kit-pronto-soccorso', 'item.torcia', 'item.acqua-minerale']) {
  give(item, 1);
  const i = inv().slots.findIndex((s) => s?.item === item);
  if (i >= 0) {
    k.useSlot(i);
    counts.usati++;
  }
}
await tick(20);
log(`  ${counts.ricette} ricette fatte, ${counts.usati} oggetti usati`);

// Le 12 rune urbane, una alla volta, e quattro formule della città.
const cast = async (seq: string[]) => {
  needs().mana = 100;
  give('item.cristallo-magico', 2);
  for (const t of seq) give(`rune:${t}`, 1);
  k.phrase().tokens = [...seq];
  const ok = await k.castSpell();
  if (ok) counts.incantesimi++;
  else fail(`l'incantesimo «${seq.join(' ')}» non parte`);
  await tick(6);
};
for (const t of urbanTokens) await cast([t]);
for (const seq of ['corrente sirena', 'caffe pane', 'marea nebbia', 'tufo asfalto']) await cast(seq.split(' '));
// Gli individui reagiscono agli stati che le rune lasciano addosso (foschia, allerta, carica, corsa).
for (const id of npcs.slice(0, 6)) {
  await k.perform(id, 'act:saluta');
  counts.azioni++;
}
log(`  ${counts.incantesimi} incantesimi pronunciati`);

// Il quartiere al buio: si cerca una notte in cui va via la corrente, poi si cambia il fusibile alla cabina.
const quartiere = () => {
  const q = k.ecs.query('quartiere')[0];
  return q === undefined ? undefined : (k.ecs.get(q, 'quartiere') as { buio: boolean });
};
const cabina = things.find((id) => mod(id) === 'obj.quadro-elettrico');
// Il buio si decide quando comincia la notte: ogni giorno si passa dal pomeriggio alla notte.
for (let day = 1; day < 12 && !quartiere()?.buio; day++) {
  k.time = day * 600 + 0.2 * 600;
  await tick(1);
  k.time = day * 600 + 0.7 * 600;
  await tick(1);
}
if (quartiere()?.buio) {
  counts.buio++;
  if (cabina !== undefined) {
    give('item.fusibile', 1);
    await k.perform(cabina, 'act:fusibile');
    await tick(2);
    if (!quartiere()?.buio) counts.riaccesi++;
  }
} else fail('in undici notti il quartiere non è mai rimasto al buio');
log(`  buio nel quartiere: ${counts.buio ? 'sì' : 'no'}, luce ridata dalla cabina: ${counts.riaccesi ? 'sì' : 'no'}`);

// Tre missioni accettate: andare alla Torre C, portare la busta gialla a Rosaria, i pomodori a Carmela.
const accept = (id: string) =>
  (k as unknown as { updatePlots(f: (p: Array<{ id: string; missione?: { stato: string; viandante?: string } }>) => boolean): void }).updatePlots((ps) => {
    const p = ps.find((x) => x.id === id);
    if (!p?.missione) return false;
    p.missione.stato = 'accettata';
    p.missione.viandante = 'io';
    return true;
  });
for (const id of ['trama-luce-torre', 'trama-busta-gialla', 'trama-ragu-domenica']) accept(id);


// Le missioni «porta»: la busta dall'archivio della Torre C a Rosaria, i pomodori a Carmela (si parla con loro), finché sono nei luoghi caricati: tornando, il tetto di due individui per tipo può lasciare il posto a chi abita i luoghi nuovi.
// Si ritrova ciascuno per origine (sono nei luoghi attorno alla piazza) e gli si parla.
for (const [item, name] of [['item.busta-gialla', 'Rosaria Vitale'], ['item.pomodori', 'Carmela Esposito']] as const) {
  if (!countItem(inv(), item)) give(item, 1);
  const origine = people.people.find((x) => x.name === name)!.origin!;
  const id = k.ecs.query('origin').find((e) => k.ecs.get(e, 'origin').key === origine);
  if (id === undefined) fail(`${name} non è nel suo luogo`);
  else {
    await k.ensureIdentity(id);
    await k.talk(id, 'Ti ho portato quello che mi avevi chiesto.');
  }
}
// Camminare: il viandante va a est per un secondo e mezzo, il tappeto lo riporta al centro e il mondo scorre.
const before = k.wandererCarpet();
k.input.setHeld('right', true);
await tick(90);
k.input.setHeld('right', false);
const walked = Math.hypot(k.wandererCarpet().x - before.x, k.wandererCarpet().y - before.y);
log(`  camminando: ${walked.toFixed(1)} caselle`);
if (walked < 3) fail(`il viandante ha camminato solo ${walked.toFixed(1)} caselle`);

// In tutti i 19 luoghi: il tappeto si ferma e il mondo si sposta sotto i piedi del viandante.
const placeNames = new Map(Object.values(maps).map((r) => [(r as { plan: { place: { name: string } } }).plan.place.name, r]));
const S = k.config.chunkSize;
const visited = new Set<string>();
for (const file of Object.keys(maps)) {
  const [cx, cy] = file.replace(/\.json$/, '').split('_').slice(-2).map(Number);
  const c = k.carpet()!;
  const p = k.wandererPos();
  c.ox = cx * S + S / 2 - p.x;
  c.oy = cy * S + S / 2 - p.y;
  await tick(5);
  for (let i = 0; i < 20 && !k.chunkHere()?.name; i++) await settle(10);
  const here = k.chunkHere()?.name;
  if (here && placeNames.has(here)) visited.add(here);
}
counts.luoghi = visited.size;
log(`  luoghi visitati: ${visited.size} di ${Object.keys(maps).length}`);
if (visited.size !== Object.keys(maps).length) fail(`visitati ${visited.size} luoghi su ${Object.keys(maps).length}`);

// Di nuovo alla Torre C, fino alla fine: le missioni «vai» si guardano una volta al secondo (societyTick).
{
  const c = k.carpet()!;
  const p = k.wandererPos();
  c.ox = 1 * S + S / 2 - p.x;
  c.oy = -1 * S + S / 2 - p.y;
}
if (TICKS - ticks < 70) fail(`restano solo ${TICKS - ticks} tick per la Torre C`);
await tick(TICKS - ticks);
await settle(50);
const done = readPlots(k.files).filter((p) => p.quest?.state === 'completed').map((p) => p.title);
counts.missioni = done.length;
log(`  missioni compiute: ${done.length} (${done.join('; ')})`);
if (done.length < 3) fail(`compiute ${done.length} missioni su 3`);

out.mondo = { tick: ticks, ...counts, faults: raised, faultsAllaFine: k.faults.size, chiamateAiModelli: k.ai.usage.text, frasi: said.length };
log(`  tick: ${ticks}; fault sollevati: ${raised.length}; fault alla fine: ${k.faults.size}`);
raised.forEach((f) => fail(`fault: ${f}`));
if (ticks !== TICKS) fail(`girati ${ticks} tick invece di ${TICKS}`);

out.esito = problems.length ? 'rosso' : 'verde';
out.problemi = problems;
writeFileSync(join(DIR, 'verifica.json'), JSON.stringify(out, null, 1) + '\n');
log(problems.length ? `\nROSSO: ${problems.length} problemi` : '\nVERDE: nessun problema, 0 fault');
void readdirSync;
process.exit(problems.length ? 1 : 0);
