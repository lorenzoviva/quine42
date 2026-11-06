// The end-to-end check of orichalcum (Cantiere 4A): every file through the kernel's validators, then the whole universe in a real Kernel
// with the offline models (MockAiModels), 600 ticks of the world with a wanderer who does everything: walks through the nineteen places of
// maps/, talks, picks things and runes up, crafts, uses, acts on every object and person of the 25 modules, speaks the twelve runes of the
// canon and the formulas. At the end `kernel.faults` must be empty, and every check without a line to say.
//   npx vite-node lab/banco/universi-cloud/orichalcum/verifica.ts
// It writes what it saw in lab/banco/universi-cloud/orichalcum/verifica.json (not a file of the universe: allowedPath leaves it out).

import { writeFileSync } from 'node:fs';
import { avvia, RADICE } from '../strumenti/carica';
import { modulo, piani, quartaParete, societa } from '../strumenti/controlli';
import { LUOGHI } from '../strumenti/luoghi';
import { MODELLI, provaModello, provaSuono, SUONI } from '../strumenti/modelli';
import { canonWithRune, MAX_MAGIC_RUNES, validateNewRune } from '../../../../src/kernel/magic';
import { lexiconWords } from '../../../../src/kernel/fourthwall';
import type { Kernel } from '../../../../src/kernel/kernel';
import type { MagicRune } from '../../../../src/kernel/types';

const DIR = RADICE + 'orichalcum/';
const DT = 1 / 60;
const TICKS = 600;
const settle = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const report: Record<string, unknown> = {};
const problemi: string[] = [];
const sezione = (nome: string, righe: string[]) => {
  report[nome] = righe.length ? righe : 'ok';
  problemi.push(...righe.map((r) => `${nome}: ${r}`));
  console.log(`${righe.length ? '✗' : '✓'} ${nome}${righe.length ? `\n  ${righe.slice(0, 20).join('\n  ')}` : ''}`);
};

// --- 1. The files, with the kernel's validators -----------------------------------------------------------------------------------------
const { k, files, maps } = await avvia(DIR);
const NUOVI = Object.keys(files)
  .filter((p) => /^modules\/[^/]+\/manifest\.json$/.test(p))
  .map((p) => p.split('/')[1])
  .filter((id) => !/^(core|sys\.(fire|follow|needs|physics|wander|lavoro)|runes\.fragments|magic\.runes|world)\b/.test(id));
sezione('quarta parete (metaBreak e glossaryBreak su ogni testo del mondo)', quartaParete(files, maps));
sezione('società (repairSociety) e trame (reviewPlot)', societa(files));
sezione(`moduli nuovi (${NUOVI.length}: parseManifest, checkLua, apiErrors, probe, validateForged)`, NUOVI.flatMap((id) => modulo(k, files, id)));
// 25 of Cantiere 4A and the 9 programs of the trades (T298).
if (NUOVI.length !== 34) problemi.push(`moduli nuovi: ${NUOVI.length}, non 34`);
sezione(`piani dei luoghi (${Object.keys(maps).length}, validatePlan)`, piani(k, maps));
{
  const kk = k as any;
  const drafts = LUOGHI.map(([cx, cy]) => kk.rows(kk.genDraft(cx, cy)) as string[]);
  sezione(`ambienti (${Object.keys(k.content.layouts).length}, validateLayout sulle bozze dei 19 luoghi)`, Object.entries(k.content.layouts).flatMap(([id, def]) => k.validator.validateLayout(id, def as any, k.palette, drafts)));
}
{
  const seed: Record<string, MagicRune> = JSON.parse(files['modules/magic.runes/manifest.json']).runes;
  const mine: Record<string, MagicRune> = JSON.parse(files['modules/magic.vapore/manifest.json']).runes;
  const words = lexiconWords(files['world/lessico.md']);
  const out: string[] = [];
  for (const [token, r] of Object.entries(mine)) {
    const others = Object.entries({ ...seed, ...mine }).filter(([t]) => t !== token);
    // Against all the other eighteen, in groups under the Council's cap (MAX_MAGIC_RUNES is for what the Council adds).
    for (let i = 0; i < others.length; i += MAX_MAGIC_RUNES - 1) {
      const v = validateNewRune({ token, nome: r.name, glifo: r.glyph, colore: r.color, elemento: r.element, descrizione: r.description }, Object.fromEntries(others.slice(i, i + MAX_MAGIC_RUNES - 1)), words);
      out.push(...v.errors.map((e) => `${token}: ${e}`));
      if (v.rune && v.rune.rune.glyph !== r.glyph) out.push(`${token}: il segno ${r.glyph} non è libero`);
      if (i === 0 && v.rune && !canonWithRune('', v.rune).includes(`- ${r.glyph} ${r.name} («${token}», ${r.element}):`)) out.push(`${token}: la riga del canone non è quella di canonWithRune`);
    }
    if (!files['world/canone.md'].includes(`- ${r.glyph} ${r.name} («${token}», ${r.element}):`)) out.push(`${token}: manca nel canone`);
    if (!k.content.spells[token]) out.push(`${token}: nessun incantesimo`);
  }
  if (Object.keys(mine).length !== 12) out.push(`rune nuove: ${Object.keys(mine).length}, non 12`);
  sezione('rune del canone (12, validateNewRune contro le altre 18)', out);
}
{
  const out: string[] = [];
  const varianze: Record<string, number> = {};
  for (const id of MODELLI) {
    const r = provaModello(id);
    out.push(...r.errori);
    if (r.varianza !== undefined) varianze[id] = Math.round(r.varianza * 1000) / 1000;
  }
  report['varianza dei modelli'] = varianze;
  sezione(`modelli (${MODELLI.length}, modelErrors e varianza su 5 semi > 0,15)`, out);
  sezione(`suoni (${SUONI.length}, modelErrors e analyzeSound su 10 terne di semi)`, SUONI.flatMap((id) => provaSuono(id).errori));
}

// --- 2. The universe in a Kernel: 600 ticks with a wanderer who does everything ------------------------------------------------------------
let ticks = 0;
const faultsVisti = new Set<string>();
const tick = async (n = 1) => {
  for (let i = 0; i < n; i++) {
    k.tick(DT);
    ticks++;
    for (const f of k.faults.list()) faultsVisti.add(`${f.key}: ${f.message}`);
  }
  await settle(5);
};
const fatto: Record<string, number> = {};
const conta = (cosa: string, n = 1) => (fatto[cosa] = (fatto[cosa] ?? 0) + n);
const S = k.config.chunkSize;
const kk = k as any;

/** The wanderer to the middle of a place: the carpet's offset moves, as when a saved game is loaded (`applyWandererState`). */
async function vaiA(cx: number, cy: number) {
  const c = k.carpet()!;
  const p = k.wandererPos();
  c.ox = cx * S + S / 2 - p.x;
  c.oy = cy * S + S / 2 - p.y;
  await tick(4);
  conta('spostamenti tra i luoghi');
}

/** An entity in front of the wanderer, facing it. */
function davanti(id: string) {
  const pc = k.wandererCarpet();
  k.wandererComp().facing = 'right';
  return k.spawnModuleEntity(k.modules.get(id)!, pc.x + 0.9, pc.y);
}

async function provaEntita(id: string) {
  const e = davanti(id);
  await tick(2);
  for (const o of k.actionsFor(e)) {
    if (!k.ecs.alive.has(e)) break;
    if (o.id === 'altro') continue;
    await k.perform(e, o.id);
    conta(`azioni (${o.id.startsWith('act:') ? 'del modulo' : o.id})`);
    await tick(1);
  }
  if (k.ecs.alive.has(e) && k.modules.get(id)?.manifest.interaction?.type === 'talk') {
    await k.talk(e, 'Bonombo! Di che cosa vivi, qui?');
    conta('dialoghi con il Narratore (offline)');
  }
  if (k.ecs.alive.has(e)) k.ecs.destroy(e);
}

const giveAll = (items: string[], n = 8) => items.forEach((it) => k.give(it, n));
/** What the wanderer carries goes into a chest of the square (out of the test): every phase starts with free hands and an empty rune pouch. */
function svuota() {
  const inv = k.inventory();
  inv.slots.forEach((s, i) => {
    if (!s) return;
    if (s.inv) s.inv.slots.fill(null);
    else inv.slots[i] = null;
  });
  inv.equipped = null;
  k.phrase().tokens = [];
  k.syncPhrase();
}
const needs = () => k.needs() as any;

// Start: the places around the start are planned from maps/.
for (let i = 0; i < 80 && [...k.chunks.values()].some((c) => c.stage === 'draft'); i++) await tick(1).then(() => settle(20));
const caricati = (): Array<{ key: string; name?: string }> => [...k.chunks.values()].map((c: any) => ({ key: c.key, name: c.place?.name }));

// a) the nineteen places, one after the other
const nomi: Record<string, string> = {};
for (const [cx, cy] of LUOGHI) {
  await vaiA(cx, cy);
  for (let i = 0; i < 40; i++) {
    const ch = k.chunks.get(`${cx},${cy}`) as any;
    if (ch?.stage && ch.stage !== 'draft' && !ch.developing) break;
    await tick(1);
    await settle(15);
  }
  const ch = k.chunks.get(`${cx},${cy}`) as any;
  nomi[`${cx},${cy}`] = ch?.place?.name ?? '(non pianificato)';
  // What lies on the ground here and the runes of the place: picked up.
  for (const id of k.ecs.query('rune')) {
    const r = k.ecs.get(id, 'rune');
    if (Math.floor(r.col / S) === cx && Math.floor(r.row / S) === cy && k.pickUpRune(id)) conta('rune raccolte dal suolo');
  }
  for (const id of k.ecs.query('pickup', 'chunk')) {
    if (k.ecs.get(id, 'chunk')?.key !== `${cx},${cy}` || !k.ecs.alive.has(id)) continue;
    const pk = k.ecs.get(id, 'pickup');
    const pos = k.ecs.get(id, 'pos');
    if (!pos) continue;
    const p = k.wandererPos();
    const c = k.carpet()!;
    c.ox = pos.x - 0.9 - p.x;
    c.oy = pos.y - p.y;
    k.wandererComp().facing = 'right';
    await tick(1);
    if (pk) {
      await k.interact();
      conta('oggetti raccolti da terra');
    }
  }
  // E on whatever stands in front, with the menu of the tile.
  await k.interact();
  conta('interact (E)');
  await tick(3);
}
// The people met in the nineteen places are the 24 of world/people.json (their origin is the object of the plan they stand for).
{
  const persone = JSON.parse(files['world/people.json']).persone as Array<{ nome: string; origine: string; tipo: string }>;
  const incontrati = new Set<string>();
  const sconosciuti: string[] = [];
  for (const [cx, cy] of LUOGHI) {
    await vaiA(cx, cy);
    for (const id of k.ecs.query('mind', 'origin')) {
      const o = k.ecs.get(id, 'origin').key as string;
      const atteso = persone.find((p) => p.origine === o);
      if (!atteso) continue;
      const i = await k.ensureIdentity(id);
      if (i?.name === atteso.nome) incontrati.add(atteso.nome);
      else sconosciuti.push(`${o}: «${i?.name}» invece di «${atteso.nome}»`);
    }
  }
  report['individui incontrati'] = [...incontrati];
  conta('individui della società incontrati', incontrati.size);
  sezione('gli individui dei luoghi sono quelli della società', sconosciuti);
}
const fuoriMappa = LUOGHI.filter(([cx, cy]) => {
  const name = nomi[`${cx},${cy}`];
  return !Object.values(maps).some((m) => m.plan.place.name === name);
});
sezione('i 19 luoghi vengono dalle mappe', fuoriMappa.map(([cx, cy]) => `(${cx},${cy}) è «${nomi[`${cx},${cy}`]}», non un piano di maps/`));
report['luoghi visitati'] = nomi;

// b) back in the square: every object and every person of the 25 modules, with every action, without and with the states the runes leave
await vaiA(0, 0);
svuota();
giveAll(['item.carbone', 'item.acqua-termale', 'item.chiave-inglese', 'item.cacciavite-fine', 'item.manometro-rotto', 'item.vetro-manometro', 'item.molla-acciaio', 'item.ingranaggio',
  'item.lamina-ottone', 'item.minerale-rosso', 'item.lingotto-rame', 'item.lingotto-zinco', 'item.piccone', 'item.soldo-rame', 'item.capsula-pneumatica', 'item.tubo-rame', 'item.straccio',
  'item.pane-nero', 'item.salsiccia', 'item.oliatore', 'item.mappa-cunicoli', 'item.mela-renetta', 'item.lingotto-oricalco', 'item.caffe-nero', 'item.lente-orologiaio', 'item.pinze-colata'], 6);
const entita = NUOVI.filter((id) => k.modules.get(id)?.manifest.kind === 'entity');
const STATI = [{}, { 'nel vapore': 20, 'nella fuliggine': 40, "tempra d'ottone": 60, 'passo a molla': 30, calamitato: 30 }];
for (const st of STATI) {
  kk.ecs.set(kk.wandererEntity, 'stati', Object.fromEntries(Object.entries(st).map(([n, d]) => [n, { velocita: 1, peso: 0, luce: 0, fino: k.time + (d as number) }])));
  for (const id of entita) await provaEntita(id);
}
kk.ecs.set(kk.wandererEntity, 'stati', {});

// c) the wrench in hand, F on a boiler, a guardian, a valve
{
  const inv = k.inventory();
  const slot = inv.slots.findIndex((s) => s?.item === 'item.chiave-inglese');
  if (slot >= 0) {
    k.equipSlot(slot);
    for (const id of ['obj.caldaia', 'npc.automa-guardia', 'obj.valvola-manometro', 'obj.enigma-ingranaggi']) {
      const e = davanti(id);
      await tick(1);
      k.action(e);
      conta('la chiave inglese usata (F)');
      k.ecs.destroy(e);
    }
    k.equipSlot(slot);
  } else problemi.push('la chiave inglese non è nell’inventario');
}

// d) a boiler lit and left to run: pressure, the whistle, the safety valves (sys.pressione), a telegraph capsule arriving (sys.meccanismi)
{
  svuota();
  giveAll(['item.acqua-termale', 'item.carbone', 'item.soldo-rame'], 6);
  const c = davanti('obj.caldaia');
  await k.perform(c, 'act:acqua');
  await k.perform(c, 'act:carbone');
  await k.perform(c, 'act:carbone');
  await k.perform(c, 'act:accendi');
  const t = k.spawnModuleEntity(k.modules.get('obj.telegrafo-pneumatico')!, k.wandererCarpet().x - 0.9, k.wandererCarpet().y);
  await k.perform(t, 'act:invia');
  await tick(60 * 3);
  const p = k.ecs.get(c, 'caldaia')?.pressione ?? 0;
  if (!(p > 0)) problemi.push(`la caldaia accesa non ha pressione (${p})`);
  report['pressione della caldaia dopo 3 s'] = Math.round(p * 100) / 100;
  await tick(60 * 6);
  report['capsule arrivate'] = k.ecs.get(t, 'telegrafo')?.arrivate ?? 0;
  if (!report['capsule arrivate']) problemi.push('la capsula del telegrafo non è arrivata');
  k.ecs.destroy(c);
  k.ecs.destroy(t);
}

// e) crafting: every recipe of the pack, with what it asks
{
  svuota();
  const fatti: string[] = [];
  for (const r of k.content.recipes.filter((r) => r.id.startsWith('ricetta.') && k.content.get(r.output.item)?.id.startsWith('item.'))) {
    svuota();
    for (const i of r.inputs) k.give(i.item, i.count);
    for (const t of r.tools ?? []) k.give(t, 1);
    if (k.craft(r.id)) fatti.push(r.id);
    await tick(1);
  }
  conta('ricette fatte', fatti.length);
  report['ricette fatte'] = fatti;
}

// f) using things: food, drink, medicine (core.items), the bag
{
  svuota();
  needs().hunger = 30;
  needs().thirst = 30;
  needs().health = 50;
  for (const it of ['item.pane-nero', 'item.zuppa-orzo', 'item.caffe-nero', 'item.acqua-termale', 'item.unguento-ustioni', 'item.benda', 'item.uova-sode']) {
    k.give(it, 1);
    const slot = k.inventory().slots.findIndex((s) => s?.item === it);
    if (slot >= 0) {
      k.useSlot(slot);
      conta('oggetti usati');
    }
    await tick(1);
  }
}

// g) magic: the twelve runes of the canon one by one, and every formula of magic.vapore
{
  const spells = Object.keys(JSON.parse(files['modules/magic.vapore/manifest.json']).spells);
  const lanciati: string[] = [];
  for (const key of spells) {
    const tokens = key.split(' ');
    svuota();
    const hand = k.phrase();
    hand.tokens = [];
    hand.sel = 0;
    tokens.forEach((t) => k.give(`rune:${t}`, 1));
    k.give('item.cristallo-magico', 1);
    needs().mana = 100;
    for (const t of tokens) k.composeRune(t);
    // Something in front, for the spells that open, push or burn.
    const e = davanti(tokens[0] === 'ingranaggio' ? 'obj.cassaforte-combinazione' : 'obj.lampione-gas');
    await tick(1);
    if (await k.castSpell()) lanciati.push(key);
    else problemi.push(`l'incantesimo «${key}» non è partito`);
    await tick(20);
    if (k.ecs.alive.has(e)) k.ecs.destroy(e);
  }
  conta('incantesimi pronunciati', lanciati.length);
  report['incantesimi pronunciati'] = lanciati;
}

// h) the rest of the 600 ticks: the world lives on (people, routines, plots, boilers, lamps)
if (ticks < TICKS) await tick(TICKS - ticks);
for (let i = 0; i < 10; i++) await settle(30);
await tick(1);

report.tick = ticks;
report['cose fatte'] = fatto;
report['fault visti durante la prova'] = [...faultsVisti];
report['fault alla fine'] = k.faults.list().map((f) => `${f.key}: ${f.message}`);
report['luoghi caricati'] = caricati().length;
if (faultsVisti.size) problemi.push(...[...faultsVisti].map((f) => `fault: ${f}`));
console.log(`\n${ticks} tick; fatto: ${JSON.stringify(fatto)}`);
console.log(`fault visti: ${faultsVisti.size}; fault alla fine: ${k.faults.list().length}`);
report.esito = problemi.length ? problemi : 'verde';
writeFileSync(DIR + 'verifica.json', JSON.stringify(report, null, 2) + '\n');
console.log(problemi.length ? `\n✗ ${problemi.length} problemi` : '\n✓ verifica verde: 0 fault');
process.exit(problemi.length ? 1 : 0);

export type { Kernel };
