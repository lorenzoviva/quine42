// Verifica end-to-end di Sidera (Cantiere 4C). Esegui dalla radice del progetto:
//   npx vite-node lab/banco/universi-cloud/sidera/verifica.ts
// 1. la quarta parete su ogni testo scritto per Sidera (mondo, luoghi, tema, moduli, Lua, modelli);
// 2. i 25 moduli dal validatore (strumenti/moduli.ts), i 19 piani (strumenti/luoghi.ts), le 12 rune (validateNewRune);
// 3. l'universo intero in un Kernel vero con MockAiModels e i piani di maps/ come archivio dei luoghi: almeno 600 tick con il
//    viandante che raccoglie rune e oggetti, parla, agisce su ogni macchina e persona, fabbrica ogni ricetta, usa gli oggetti,
//    impugna lo scanner, pronuncia le 12 rune e le formule, e passa per tutti i 19 luoghi. Alla fine `kernel.faults` è vuoto.
// Scrive il rapporto in lab/banco/universi-cloud/sidera/rapporto-verifica.md; esce con 1 se qualcosa non va.
import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../../../src/kernel/kernel';
import { memoryStore } from '../../../../src/kernel/repo';
import { MockAiModels } from '../../../../src/kernel/ai/mock';
import { MemoryChunks } from '../../../../src/kernel/chunks';
import { bibleBreaks, lexiconWords, metaBreak } from '../../../../src/kernel/fourthwall';
import { validateNewRune } from '../../../../src/kernel/magic';
import { readPeople, repairSociety } from '../../../../src/kernel/society';
import { readPlots } from '../../../../src/kernel/plots';
import { countItem } from '../../../../src/kernel/inventory';
import type { Fault } from '../../../../src/kernel/faults';
import type { MagicRune } from '../../../../src/kernel/types';
import { fileDi, SIDERA } from './strumenti/carica';

process.env.SIDERA_SOLO_FUNZIONI = '1';
const { moduli, MODULI_SIDERA } = await import('./strumenti/moduli');
const { luoghi, chiaveMappa } = await import('./strumenti/luoghi');

const DT = 1 / 60;
const TICK_MINIMI = 600;
const settle = (ms = 5) => new Promise((r) => setTimeout(r, ms));
const problemi: string[] = [];
const rapporto: string[] = [];
const sezione = (t: string) => rapporto.push('', `## ${t}`, '');

// ---------------------------------------------------------------- 1. la quarta parete

const files = fileDi(SIDERA, { mappe: true });
const words = lexiconWords(files['world/lessico.md']);
const testi = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(testi) : v && typeof v === 'object' ? Object.values(v).flatMap(testi) : []);
const nostri = Object.keys(files).filter((p) => {
  if (p.startsWith('world/') || p.startsWith('maps/') || p === 'prompts/theme.md' || p === 'universe.json') return true;
  if (p.startsWith('models/')) return /^models\/(sidera-|suono-sidera-)/.test(p) || p === 'models/index.json';
  const m = /^modules\/([^/]+)\//.exec(p);
  return !!m && MODULI_SIDERA.includes(m[1]);
});
let frasi = 0;
const violazioni: string[] = [];
for (const p of nostri) {
  const src = files[p];
  let list: string[];
  if (p.endsWith('.json')) list = testi(JSON.parse(src));
  else if (p.endsWith('.lua')) list = [...src.replace(/--[^\n]*/g, '').matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => m[1]);
  else if (p.endsWith('.xml')) list = [...src.matchAll(/<!--([\s\S]*?)-->|name="([^"]*)"/g)].map((m) => m[1] ?? m[2]);
  else list = src.split('\n');
  for (const s of list) {
    frasi++;
    // Il lessico definisce le sue parole: lì soltanto non si cercano i glossari.
    const m = metaBreak(s, p === 'world/lessico.md' ? [] : words);
    if (m) violazioni.push(`${p}: «${m}» in «${s.slice(0, 90)}»`);
  }
}
const bibbia = JSON.parse(files['world/bible.json']);
violazioni.push(...bibleBreaks(bibbia, words).map((b) => `world/bible.json: ${b}`));
problemi.push(...violazioni);
sezione('1. Quarta parete');
rapporto.push(`${nostri.length} file, ${frasi} frasi controllate con \`metaBreak\` (e \`bibleBreaks\` sulla bibbia): **${violazioni.length} violazioni**.`);
violazioni.slice(0, 20).forEach((v) => rapporto.push(`- ${v}`));

// ---------------------------------------------------------------- 2. moduli, luoghi, rune, società

const mod = await moduli();
problemi.push(...mod.errori, ...mod.avvisi);
sezione('2. Moduli');
rapporto.push(`${mod.righe.length} moduli: ${mod.errori.length} errori, ${mod.avvisi.length} avvisi.`, '', '| modulo | tipo | righe Lua | azioni | errori | avvisi |', '|---|---|---|---|---|---|', ...mod.righe);
[...mod.errori, ...mod.avvisi].forEach((e) => rapporto.push(`- ${e}`));

const lu = await luoghi(false);
problemi.push(...lu.errori);
sezione('3. Luoghi');
rapporto.push(`${lu.righe.length} piani con \`validatePlan\` e \`layout\`: ${lu.errori.length} errori.`, '', '| luogo | nome | ambiente | regione | oggetti | rune | lotti | calpestabili |', '|---|---|---|---|---|---|---|---|', ...lu.righe);
lu.errori.forEach((e) => rapporto.push(`- ${e}`));

const magia = JSON.parse(files['modules/magic.runes/manifest.json']);
const DI_SEMPRE = ['luce', 'fuoco', 'acqua', 'scudo'];
const NUOVE = Object.keys(magia.runes).filter((t) => !DI_SEMPRE.includes(t));
const viste: Record<string, MagicRune> = Object.fromEntries(DI_SEMPRE.map((t) => [t, magia.runes[t]]));
const runeErr: string[] = [];
for (const t of NUOVE) {
  const r: MagicRune = magia.runes[t];
  const { rune, errors } = validateNewRune({ token: t, nome: r.name, glifo: r.glyph, colore: r.color, elemento: r.element, descrizione: r.description, canone: r.description }, viste, words);
  if (!rune) runeErr.push(`${t}: ${errors.join('; ')}`);
  else if (rune.rune.glyph !== r.glyph || rune.rune.color !== r.color) runeErr.push(`${t}: il validatore ripara il segno o il colore`);
  else viste[t] = r;
  if (!files['world/canone.md'].includes(`(«${t}»`)) runeErr.push(`${t}: assente dal canone`);
}
if (NUOVE.length !== 12) runeErr.push(`le rune nuove sono ${NUOVE.length}, non 12`);
problemi.push(...runeErr);
const soc = repairSociety(readPeople(files), (t) => (JSON.parse(files[`modules/${t}/manifest.json`] ?? '{}').tags?.includes('animale') ? 'animal' : 'person'));
problemi.push(...soc.fixes.map((f) => `società: ${f}`));
const persone = readPeople(files).persone;
const trame = readPlots(files);
const regioni = JSON.parse(files['world/atlas.json']).regioni;
if (persone.length !== 24) problemi.push(`persone: ${persone.length}, non 24`);
if (trame.length !== 8) problemi.push(`trame: ${trame.length}, non 8`);
if (regioni.length !== 10) problemi.push(`regioni: ${regioni.length}, non 10`);
sezione('4. Rune, società, trame, atlante');
rapporto.push(
  `- ${NUOVE.length} rune nuove rivalidate in fila con \`validateNewRune\` contro le 4 di sempre: ${runeErr.length ? runeErr.join('; ') : 'tutte valide, segno e colore invariati, tutte nel canone'}.`,
  `- ${persone.length} persone: \`repairSociety\` ${soc.fixes.length ? `corregge ${soc.fixes.length} cose` : 'non corregge niente'} (legami reciproci, generi, specie, nomi).`,
  `- ${trame.length} trame, ${trame.filter((p) => p.missione).length} con una missione; ${regioni.length} regioni nell'atlante.`,
);

// ---------------------------------------------------------------- 3. il kernel vero

const archivio = new MemoryChunks();
const mappe = Object.keys(files).filter((p) => p.startsWith('maps/'));
const piani = new Map<string, string>();
for (const v of JSON.parse(fs.readFileSync(path.join(SIDERA, 'strumenti/luoghi.json'), 'utf8')) as Array<{ cx: number; cy: number; plan: { place: { name: string } } }>) {
  const key = chiaveMappa(files, v.cx, v.cy);
  const file = `maps/${key.replace(/[:,]/g, '_')}.json`;
  if (!files[file]) problemi.push(`manca ${file}`);
  else await archivio.save(key, JSON.parse(files[file]));
  piani.set(`${v.cx},${v.cy}`, v.plan.place.name);
}
const universo = Object.fromEntries(Object.entries(files).filter(([p]) => !p.startsWith('maps/')));
const k = await Kernel.boot({ files: universo, store: memoryStore(), ai: new MockAiModels(), chunks: archivio });
const guasti: Fault[] = [];
const prima = k.faults.onRaise;
k.faults.onRaise = (f, isNew) => {
  if (isNew) guasti.push(f);
  prima?.(f, isNew);
};
const dialoghi: Array<{ speaker: string; text: string }> = [];
k.bus.on('ui:dialog', (d: { speaker: string; text: string }) => dialoghi.push(d));
const messaggi: string[] = [];
k.bus.on('message', (m: { text?: string } | string) => messaggi.push(typeof m === 'string' ? m : String(m?.text ?? '')));

let ticks = 0;
const tick = async (n = 1, ms = 2) => {
  for (let i = 0; i < n; i++) {
    k.tick(DT);
    ticks++;
    if (ms) await settle(ms);
  }
};
const S = k.config.chunkSize;
const chunkDi = (cx: number, cy: number) => k.chunks.get(`${cx},${cy}`);

/** Porta il viandante nel luogo (cx, cy) muovendo il tappeto, non lui: resta al centro del cerchio. */
async function vai(cx: number, cy: number): Promise<boolean> {
  const c = k.carpet()!;
  const p = k.wandererPos();
  Object.assign(p, { x: 0.5, y: 0.5 });
  c.ox = cx * S + S / 2 - 0.5;
  c.oy = cy * S + S / 2 - 0.5;
  for (let i = 0; i < 400; i++) {
    c.ox = cx * S + S / 2 - 0.5;
    c.oy = cy * S + S / 2 - 0.5;
    Object.assign(k.wandererPos(), { x: 0.5, y: 0.5 });
    await tick(1, 4);
    if (chunkDi(cx, cy)?.stage === 'planned') return true;
  }
  return false;
}

/** Accanto a un'entità: il tappeto si sposta perché il viandante le stia davanti. */
function accanto(id: number): void {
  const pos = k.ecs.get(id, 'pos');
  if (!pos) return;
  const c = k.carpet()!;
  Object.assign(k.wandererPos(), { x: 0.5, y: 0.5 });
  c.ox = pos.x - 1.1 - 0.5;
  c.oy = pos.y - 0.5;
  k.wandererComp().facing = 'right';
}

const carpet = k.carpet()!;
carpet.active = false;
const n0 = k.needs()!;
const ristora = () => Object.assign(k.needs()!, { hunger: 90, thirst: 90, energy: 90, health: 100, mana: 100 });
ristora();

// Il primo luogo: i piani escono dall'archivio, non dal Cartografo.
const chiamatePrima = k.ai.usage.text;
await vai(0, 0);
await tick(30);

const visitati: string[] = [];
const fuoriPiano: string[] = [];
const azioniFatte: string[] = [];
const conosciuti = new Set<string>();
let raccolte = 0;
let runeRaccolte = 0;

/** Ogni cosa del luogo: le persone parlano e si riconoscono, ogni azione dei moduli di Sidera si fa, gli oggetti si raccolgono. */
async function vivi(cx: number, cy: number): Promise<void> {
  const key = `${cx},${cy}`;
  const qui = k.ecs.query('module').filter((id) => k.ecs.get(id, 'chunk')?.key === key);
  for (const id of qui) {
    const modId: string = k.ecs.get(id, 'module').id;
    const man = k.modules.get(modId)?.manifest;
    if (!man || !MODULI_SIDERA.includes(modId)) continue;
    accanto(id);
    await tick(1);
    if (man.persona) {
      const who = await k.ensureIdentity(id);
      if (who) {
        const p = persone.find((x) => x.nome === who.name);
        if (p && p.origine === k.ecs.get(id, 'origin')?.key) conosciuti.add(p.nome);
      }
    }
    for (const a of man.actions ?? []) {
      if (a.requires && countItem(k.inventory(), a.requires) < 1) {
      svuota();
      k.give(a.requires, 3);
    }
      await k.perform(id, `act:${a.id}`);
      azioniFatte.push(`${modId}:${a.id}`);
      await tick(1);
      if (!k.ecs.alive.has(id)) break;
    }
    if (k.ecs.alive.has(id) && k.ecs.has(id, 'container')) await k.perform(id, 'apri');
  }
  // Ciò che sta a terra: si raccoglie.
  for (const id of k.ecs.query('pickup').filter((e) => k.ecs.get(e, 'chunk')?.key === key)) {
    accanto(id);
    await k.perform(id, 'raccogli');
    raccolte++;
  }
  // Le rune del luogo: si raccolgono anche quelle.
  for (const id of k.ecs.query('rune').filter((e) => k.ecs.get(e, 'chunk')?.key === key)) {
    if (k.pickUpRune(id)) runeRaccolte++;
  }
  ristora();
  svuota();
}

/** Le tasche si svuotano (resta la borsa delle rune): ciò che si è preso è già contato. */
function svuota(): void {
  const inv = k.inventory();
  inv.slots.forEach((s, i) => {
    if (s && !k.content.get(s.item)?.container) inv.slots[i] = null;
  });
  inv.equipped = null;
}

// Tutti i 19 luoghi, in ordine di vicinanza.
const ordine = [...piani.keys()].map((s) => s.split(',').map(Number) as [number, number]).sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
for (const [cx, cy] of ordine) {
  const ok = await vai(cx, cy);
  const ch = chunkDi(cx, cy);
  if (!ok || ch?.place?.name !== piani.get(`${cx},${cy}`)) fuoriPiano.push(`${cx},${cy}: ${ch?.place?.name ?? 'non pianificato'} (atteso ${piani.get(`${cx},${cy}`)})`);
  else visitati.push(`${cx},${cy} ${ch!.place!.name}`);
  await tick(5);
  await vivi(cx, cy);
}
problemi.push(...fuoriPiano.map((f) => `luogo fuori piano: ${f}`));

// Di nuovo in piazza: fabbricare, usare, impugnare, pronunciare.
await vai(0, 0);
ristora();
const ricette: string[] = [];
for (const r of k.content.recipes) {
  svuota();
  for (const i of r.inputs) k.give(i.item, i.count);
  for (const t of r.tools ?? []) if (countItem(k.inventory(), t) < 1) k.give(t, 1);
  if (k.craft(r.id)) ricette.push(r.id);
  else problemi.push(`ricetta ${r.id}: non riesce`);
  await tick(1);
}

const usati: string[] = [];
const daUsare = [...k.content.items.values()].filter((d) => ['cibo', 'bevanda', 'medicina', 'magia', 'luce', 'vestiario'].includes(d.category) && !d.id.startsWith('rune:'));
for (const d of daUsare) {
  k.give(d.id, 1);
  const i = k.inventory().slots.findIndex((s) => s?.item === d.id);
  if (i < 0) continue;
  k.useSlot(i);
  usati.push(d.id);
  ristora();
  await tick(1);
  // Ciò che resta in mano (vestiti, lampade) si lascia, per non riempire le tasche.
  const j = k.inventory().slots.findIndex((s) => s?.item === d.id);
  if (j >= 0) k.inventory().slots[j] = null;
}

// Lo scanner: impugnato su un faro, sul suolo, e usato da solo.
svuota();
k.give('item.scanner', 1);
const si = k.inventory().slots.findIndex((s) => s?.item === 'item.scanner');
k.equipSlot(si);
const faro = k.ecs.query('module').find((id) => k.ecs.get(id, 'module').id === 'obj.faro-telemetria');
if (faro !== undefined) {
  accanto(faro);
  await tick(1);
  k.action(faro);
}
k.action();
k.useSlot(si);
await tick(2);

// Le 12 rune nuove una per una, poi le formule (quelle di tre rune con un cristallo di risonanza).
const pronunciate: string[] = [];
const formule = Object.keys(k.content.spells).filter((s) => s.includes(' ') && s.split(' ').every((t) => NUOVE.includes(t)));
for (const seq of [...NUOVE, ...formule]) {
  ristora();
  const toks = seq.split(' ');
  toks.forEach((t) => k.give(`rune:${t}`, 1));
  if (toks.length >= 3) k.give('item.cristallo-magico', 1);
  k.phrase().tokens = [...toks];
  // Davanti c'è qualcuno da legare (Gemella) o da spingere: il primo che si trova vicino.
  const persona = k.ecs.query('mind')[0];
  if (persona !== undefined && (seq === 'intreccio' || seq === 'onda')) accanto(persona);
  if (await k.castSpell()) pronunciate.push(seq);
  else problemi.push(`incantesimo «${seq}» non pronunciato`);
  await tick(3);
}

// Il resto del tempo: il mondo gira da solo (cordone, anomalie, droni, persone).
while (ticks < TICK_MINIMI) await tick(1, 0);
// Il ciclo della cabina: a 360 s di Sidera la cabina scende (il tempo del mondo, non i tick).
k.time = 356;
await tick(5 * 60, 0);
ristora();

// ---------------------------------------------------------------- 4. il rapporto

const guastiFinali = k.faults.list();
problemi.push(...guasti.map((f) => `fault ${f.key}: ${f.message}`));
if (k.faults.size) problemi.push(...guastiFinali.map((f) => `fault aperto ${f.key}: ${f.message}`));
const chiamateLuoghi = k.ai.usage.text - chiamatePrima;
sezione('5. Il kernel con Sidera');
rapporto.push(
  `- **${ticks} tick** (minimo ${TICK_MINIMI}), tempo del mondo ${Math.round(k.time)} s, con \`MockAiModels\` e i ${mappe.length} piani di \`maps/\` come archivio dei luoghi.`,
  `- Luoghi attraversati: ${visitati.length}/19 con il nome del piano (${fuoriPiano.length} fuori piano).`,
  `- Persone del registro incontrate e riconosciute dall'origine: ${conosciuti.size} (${[...conosciuti].join(', ')}).`,
  `- Azioni dei moduli eseguite: ${azioniFatte.length} (${new Set(azioniFatte).size} diverse); battute di dialogo: ${dialoghi.length}.`,
  `- Raccolti: ${raccolte} oggetti a terra, ${runeRaccolte} rune.`,
  `- Ricette fabbricate: ${ricette.length}/${k.content.recipes.length}; oggetti usati: ${usati.length}; scanner impugnato e usato.`,
  `- Incantesimi pronunciati: ${pronunciate.length} (${NUOVE.length} rune nuove e ${formule.length} formule): ${pronunciate.join(', ')}.`,
  `- Chiamate di testo ai modelli finti durante il giro: ${chiamateLuoghi} (individui, sguardi, luoghi oltre i 19).`,
  `- **Fault: ${guasti.length} sollevati, ${k.faults.size} aperti alla fine.**`,
);
guasti.forEach((f) => rapporto.push(`  - ${f.key}: ${f.message}`));
rapporto.push('', 'Alcune battute raccolte:', '');
for (const d of dialoghi.filter((x) => x.text && !/fatto\.$/.test(x.text)).filter((_, i) => i % 9 === 0).slice(0, 14)) rapporto.push(`> **${d.speaker}**: ${d.text}`, '>');
sezione('Esito');
rapporto.push(problemi.length ? `**${problemi.length} problemi**:\n${problemi.map((p) => `- ${p}`).join('\n')}` : '**Tutto verde**: zero violazioni della quarta parete, zero errori e avvisi nei moduli, 19 luoghi validi, 12 rune valide, 0 fault.');

const testo = [`# Verifica di Sidera`, '', `Generato da \`verifica.ts\` (\`npx vite-node lab/banco/universi-cloud/sidera/verifica.ts\`).`, ...rapporto, ''].join('\n');
fs.writeFileSync(path.join(SIDERA, 'rapporto-verifica.md'), testo);
console.log(testo);
void n0;
process.exit(problemi.length ? 1 : 0);
