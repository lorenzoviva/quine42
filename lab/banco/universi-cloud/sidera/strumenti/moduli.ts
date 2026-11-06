// I 25 moduli di Sidera passano dal validatore come un modulo della Fucina: manifest, Lua che compila, solo l'API
// ammessa, caricamento di prova in una VM a parte; poi la quarta parete su ogni testo e gli avvisi di coerenza
// (oggetti, rune e modelli nominati che devono esistere). Esegui: npx vite-node lab/banco/universi-cloud/sidera/strumenti/moduli.ts
import { Sandbox } from '../../../../../src/kernel/sandbox';
import { apiErrors, Validator } from '../../../../../src/kernel/validator';
import { lexiconWords, metaBreak } from '../../../../../src/kernel/fourthwall';
import { fakeHost } from '../../../../../tests/helpers';
import { fileDi } from './carica';

/** I moduli scritti per Sidera (gli altri sono il pavimento del seme, copiati così come sono). */
export const MODULI_SIDERA = [
  'world.terreno-sidera', 'world.ambienti-sidera', 'items.sidera', 'magic.runes', 'item.scanner',
  'obj.sintetizzatore', 'obj.reattore', 'obj.serra-idroponica', 'obj.capsula-criogenica', 'obj.faro-telemetria',
  'obj.estrattore-plasma', 'obj.camera-equilibrio', 'obj.relitto', 'obj.armadietto', 'obj.drone-ricognizione',
  'npc.colono', 'npc.xenobotanica', 'npc.ingegnere-fusione', 'npc.navigatore', 'npc.medico-criogenico',
  'npc.astroarcheologo', 'npc.sintetista', 'npc.corvo-tetto', 'sys.anomalie', 'sys.cordone',
];

/** Le stringhe di un valore JSON, tutte. */
const testi = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(testi) : v && typeof v === 'object' ? Object.values(v).flatMap(testi) : []);
/** Le stringhe di un sorgente Lua (i commenti esclusi). */
const stringheLua = (src: string) => [...src.replace(/--[^\n]*/g, '').matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => m[1]);

export async function moduli(): Promise<{ righe: string[]; errori: string[]; avvisi: string[] }> {
  const files = fileDi();
  const sandbox = await Sandbox.create(fakeHost().host);
  const v = new Validator(sandbox);
  const words = lexiconWords(files['world/lexicon.md']);
  const items = new Map<string, string>();
  const runes = new Set<string>();
  const models = new Set(Object.keys(files).filter((p) => /^models\/[^/]+\.xml$/.test(p)).map((p) => p.slice(7, -4)));
  for (const [p, src] of Object.entries(files)) {
    if (!p.endsWith('manifest.json')) continue;
    const m = JSON.parse(src);
    for (const it of m.items ?? []) items.set(it.id, it.name);
    if (m.kind === 'item') items.set(m.id, m.name);
    for (const t of Object.keys(m.runes ?? {})) runes.add(t);
  }
  const names = new Set(items.values());
  const righe: string[] = [];
  const errori: string[] = [];
  const avvisi: string[] = [];
  for (const id of MODULI_SIDERA) {
    const dir = `modules/${id}`;
    const mp = `${dir}/manifest.json`;
    const e: string[] = [];
    const w: string[] = [];
    if (!files[mp]) {
      errori.push(`${id}: manca il manifest`);
      continue;
    }
    const { manifest, errors } = v.parseManifest(mp, files[mp]);
    e.push(...errors);
    const logic = manifest?.logic ? files[`${dir}/${manifest.logic}`] : undefined;
    if (manifest?.logic && logic === undefined) e.push(`${id}: manca ${manifest.logic}`);
    if (logic !== undefined) {
      e.push(...v.checkLua(`${dir}/${manifest!.logic}`, logic), ...apiErrors(logic));
      if (!e.length) {
        const probe = sandbox.probe(logic, `${dir}/${manifest!.logic}`);
        if (probe) e.push(probe);
      }
      for (const m of logic.matchAll(/items\.find\("([^"]+)"\)/g)) if (!names.has(m[1])) w.push(`items.find("${m[1]}"): nessun oggetto con questo nome`);
      for (const m of logic.matchAll(/"rune:([a-z]+)"/g)) if (!runes.has(m[1])) w.push(`rune:${m[1]}: non è una runa magica`);
      for (const s of stringheLua(logic)) {
        const b = metaBreak(s, words);
        if (b) e.push(`${id}: quarta parete in logic «${b}»`);
      }
    }
    const raw = JSON.parse(files[mp]);
    for (const s of testi(raw)) {
      const b = metaBreak(s, words);
      if (b) e.push(`${id}: quarta parete nel manifest «${b}»`);
    }
    const model = raw.appearance?.model;
    if (model && !models.has(model)) w.push(`modello «${model}» assente in models/`);
    for (const a of raw.actions ?? []) if (a.requires && !items.has(a.requires)) w.push(`azione ${a.id}: richiede ${a.requires}, che non esiste`);
    for (const it of raw.inventory ?? []) if (!items.has(it)) w.push(`inventario: ${it} non esiste`);
    for (const d of raw.drops ?? []) if (!items.has(d)) w.push(`drops: ${d} non esiste`);
    for (const it of raw.items ?? []) if (it.model && !models.has(it.model)) w.push(`oggetto ${it.id}: modello ${it.model} assente`);
    for (const t of Object.values<any>(raw.tiles ?? {})) if (t.model && !models.has(t.model)) w.push(`terreno ${t.name}: modello ${t.model} assente`);
    if (raw.interaction?.type === 'talk' && !raw.persona) w.push('parla ma non ha persona');
    errori.push(...e);
    avvisi.push(...w.map((x) => `${id}: ${x}`));
    const lines = logic ? logic.split('\n').length : 0;
    righe.push(`| ${id} | ${raw.kind} | ${lines} | ${(raw.actions ?? []).length} | ${e.length} | ${w.length} |`);
  }
  return { righe, errori, avvisi };
}

if (process.env.SIDERA_SOLO_FUNZIONI !== '1') {
  const { righe, errori, avvisi } = await moduli();
  console.log('| modulo | tipo | righe Lua | azioni | errori | avvisi |\n|---|---|---|---|---|---|');
  console.log(righe.join('\n'));
  if (errori.length) console.log(`ERRORI (${errori.length}):\n${errori.join('\n')}`);
  if (avvisi.length) console.log(`AVVISI (${avvisi.length}):\n${avvisi.join('\n')}`);
  console.log(`${righe.length} moduli; ${errori.length} errori, ${avvisi.length} avvisi`);
  if (errori.length || avvisi.length) process.exit(1);
}
