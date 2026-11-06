// Le rune di Sidera: le quattro del seme che restano (lux, ignis, aqua, scutum: `lux` è tra le rune con cui si parte; dal contratto 0.2, T307a)
// e le dodici quantistiche e gravitazionali, ognuna validata con `validateNewRune` contro quelle già entrate.
// Scrive modules/magic.runes/manifest.json e world/canone.md. Esegui: npx vite-node lab/banco/universi-cloud/sidera/strumenti/rune.ts
import fs from 'node:fs';
import path from 'node:path';
import { canonWithRune, MAX_MAGIC_RUNES, validateNewRune, type RuneDraft } from '../../../../../src/kernel/magic';
import { lexiconWords, metaBreak } from '../../../../../src/kernel/fourthwall';
import { validateEffects } from '../../../../../src/kernel/validator';
import type { MagicRune, Spell } from '../../../../../src/kernel/types';
import { SIDERA } from './carica';

const seed = JSON.parse(fs.readFileSync(path.join(SIDERA, '../../../../universe/modules/magic.runes/manifest.json'), 'utf8'));
const KEEP = ['lux', 'ignis', 'aqua', 'scutum'];

export const NUOVE: RuneDraft[] = [
  { token: 'grava', nome: 'Gravis', glifo: '⊛', colore: '#7a5af0', elemento: 'gravità', descrizione: "il peso: ancora a terra, rende pesante ciò che tocca", canone: "Gravis è la runa del peso: pronunciata, fa sentire la terra più vicina, i passi lenti e sicuri, ciò che si porta più leggero da reggere." },
  { token: 'lieve', nome: 'Levis', glifo: '⊚', colore: '#c8f0ff', elemento: 'leggerezza', descrizione: "la piuma: alleggerisce il corpo e allunga il passo", canone: "Levis è la runa della leggerezza: per un poco il corpo pesa meno e il passo si allunga, come in una cabina che sale." },
  { token: 'tunnel', nome: 'Traforo', glifo: '⟁', colore: '#5af0c8', elemento: 'attraversamento', descrizione: "il passaggio: apre un varco nel terreno davanti, anche nei muri", canone: "Traforo è la runa che passa attraverso: davanti a chi la pronuncia il terreno si apre in un sentiero, anche dove c'erano rocce o paratie." },
  { token: 'intreccio', nome: 'Gemella', glifo: '⧖', colore: '#f05ac8', elemento: 'legame', descrizione: "il nodo: lega due persone come se fossero una", canone: "Gemella è la runa dei legami: chi la pronuncia davanti a qualcuno ne diventa amico, e quella persona se lo ricorda." },
  { token: 'onda', nome: 'Risacca', glifo: '◬', colore: '#5ab8ff', elemento: 'onda', descrizione: "la risonanza: un'onda che spinge via ciò che è davanti", canone: "Risacca è la runa dell'onda: parte da chi la pronuncia e spinge via ciò che ha davanti, come un'ondata sulla passerella." },
  { token: 'vuoto', nome: 'Nulla', glifo: '⨀', colore: '#2a3a6a', elemento: 'vuoto', descrizione: "il freddo del vuoto: gela il suolo davanti", canone: "Nulla è la runa del freddo che sta tra le stelle: il suolo davanti si copre di brina e chi è vicino sente il gelo." },
  { token: 'marea', nome: 'Afelio', glifo: '⟡', colore: '#3a8ad8', elemento: 'marea', descrizione: "la marea: abbassa il terreno attorno", canone: "Afelio è la runa della marea: il terreno attorno si abbassa, come la sabbia quando l'acqua si ritira." },
  { token: 'massa', nome: 'Accresco', glifo: '⦿', colore: '#a8784a', elemento: 'massa', descrizione: "l'accumulo: solleva il terreno davanti", canone: "Accresco è la runa dell'accumulo: il terreno davanti si gonfia e si alza di qualche palmo." },
  { token: 'spin', nome: 'Trottola', glifo: '⧗', colore: '#f0e05a', elemento: 'rotazione', descrizione: "la rotazione: fa girare veloce chi la pronuncia", canone: "Trottola è la runa della rotazione: chi la pronuncia gira su sé stesso e per un poco si muove più svelto." },
  { token: 'quanto', nome: 'Scintilla', glifo: '⌬', colore: '#5af07a', elemento: 'energia', descrizione: "il granello di energia: carica una cella e il corpo", canone: "Scintilla è la runa dell'energia: ridà forze a chi la pronuncia e lascia nelle sue mani una cella energetica carica." },
  { token: 'orbita', nome: 'Perielio', glifo: '⟐', colore: '#b9a6ff', elemento: 'orbita', descrizione: "il giro attorno: un anello di polvere ruota attorno e protegge", canone: "Perielio è la runa dell'orbita: un anello di polvere luminosa gira attorno a chi la pronuncia e lo ripara per un poco." },
  { token: 'stasi', nome: 'Sospesa', glifo: '⊗', colore: '#9fe8ff', elemento: 'stasi', descrizione: "la sospensione: ferma il corpo e lo ristora, come nelle capsule", canone: "Sospesa è la runa della stasi: il corpo rallenta quasi fino a fermarsi e intanto le ferite si chiudono, come nelle capsule dei dormienti." },
];

/** Gli incantesimi di ogni runa da sola e qualche formula; effetti dall'insieme chiuso, passano da validateEffects. */
export const INCANTESIMI: Record<string, Spell> = {
  grava: { name: 'Ancora', description: 'La terra ti tira giù: passi lenti, ma reggi più peso.', cost: 6, effects: [{ type: 'state', name: 'zavorrato', duration: 45, speed: 0.7, weight: 20 }] },
  lieve: { name: 'Piuma', description: 'Il corpo si fa leggero e il passo si allunga.', cost: 8, effects: [{ type: 'state', name: 'alleggerito', duration: 40, speed: 1.5 }] },
  tunnel: { name: 'Traforo', description: 'Davanti a te il terreno si apre in un sentiero, anche attraverso le paratie.', cost: 14, effects: [{ type: 'terrain', to: 'p', radius: 1 }] },
  intreccio: { name: 'Nodo gemello', description: 'Tra te e chi hai davanti si stringe un nodo che non si scioglie.', cost: 12, effects: [{ type: 'bond', bond: 'amico' }, { type: 'memory', text: 'ha sentito un nodo gemello stringersi con il viandante', weight: 2 }] },
  onda: { name: 'Risacca', description: "Un'onda parte da te e spinge via ciò che hai davanti.", cost: 6, effects: [{ type: 'push', force: 6 }] },
  vuoto: { name: 'Gelo del vuoto', description: 'Il suolo davanti si copre di brina; il freddo ti morde le dita.', cost: 10, effects: [{ type: 'terrain', to: 'n', radius: 1 }, { type: 'state', name: 'intirizzito', duration: 20, speed: 0.85 }] },
  marea: { name: 'Bassa marea', description: 'Il terreno attorno si abbassa, come sabbia quando l’acqua si ritira.', cost: 12, effects: [{ type: 'relief', delta: -2, radius: 2 }] },
  massa: { name: 'Accumulo', description: 'Il terreno davanti si gonfia e si alza.', cost: 12, effects: [{ type: 'relief', delta: 2, radius: 1 }] },
  spin: { name: 'Trottola', description: 'Giri su te stesso e riparti più svelto.', cost: 5, effects: [{ type: 'state', name: 'in rotazione', duration: 20, speed: 1.3 }, { type: 'push', force: 2 }] },
  quanto: { name: 'Scintilla', description: 'Una scarica ti ridà forze e ti lascia in mano una cella carica.', cost: 15, effects: [{ type: 'needs', energy: 15 }, { type: 'create_item', item: 'item.cella-energetica', quantity: 1 }] },
  orbita: { name: 'Perielio', description: 'Un anello di polvere luminosa ti gira attorno e ti ripara.', cost: 10, effects: [{ type: 'shield', duration: 25 }, { type: 'light', radius: 3, duration: 25 }] },
  stasi: { name: 'Sospensione', description: 'Il corpo rallenta quasi fino a fermarsi, e intanto si ristora.', cost: 12, effects: [{ type: 'state', name: 'sospeso', duration: 8, speed: 0.3 }, { type: 'needs', health: 20 }] },
  'grava grava': { name: 'Collasso', description: 'Il peso si raddoppia: il terreno davanti sprofonda.', cost: 18, effects: [{ type: 'relief', delta: -3, radius: 1 }, { type: 'state', name: 'zavorrato', duration: 30, speed: 0.6, weight: 30 }] },
  'lieve onda': { name: 'Planata', description: "Leggero, l'onda ti porta avanti come una foglia.", cost: 14, effects: [{ type: 'state', name: 'alleggerito', duration: 30, speed: 1.8 }, { type: 'push', force: 4 }] },
  'orbita grava': { name: 'Satellite', description: 'Ciò che hai davanti ti gira attorno e poi viene scagliato via.', cost: 16, effects: [{ type: 'push', force: 9 }, { type: 'shield', duration: 15 }] },
  'quanto stasi': { name: 'Riposo del dormiente', description: 'Ti fermi un istante e ti rialzi come dopo una notte intera.', cost: 20, effects: [{ type: 'needs', energy: 35, health: 25 }] },
  'tunnel massa tunnel': { name: 'Galleria', description: 'Il terreno si apre e si richiude in archi sopra di te: una galleria breve.', cost: 26, effects: [{ type: 'terrain', to: 'p', radius: 2 }, { type: 'relief', delta: 1, radius: 1 }] },
};

export function scrivi(): void {
  const lessico = fs.readFileSync(path.join(SIDERA, 'world/lessico.md'), 'utf8');
  const words = lexiconWords(lessico);
  const runes: Record<string, MagicRune> = Object.fromEntries(KEEP.map((t) => [t, seed.runes[t]]));
  let canone = fs.readFileSync(path.join(SIDERA, 'strumenti/canone-base.md'), 'utf8');
  const errori: string[] = [];
  for (const d of NUOVE) {
    const { rune, errors } = validateNewRune(d, runes, words);
    if (!rune) {
      errori.push(`${String(d.token)}: ${errors.join('; ')}`);
      continue;
    }
    runes[rune.token] = rune.rune;
    canone = canonWithRune(canone, rune);
    console.log(`✓ ${rune.rune.glyph} ${rune.rune.name} («${rune.token}», ${rune.rune.element}) ${rune.rune.color}`);
  }
  const terreno = JSON.parse(fs.readFileSync(path.join(SIDERA, 'modules/world.terreno-sidera/manifest.json'), 'utf8'));
  const oggetti = JSON.parse(fs.readFileSync(path.join(SIDERA, 'modules/items.sidera/manifest.json'), 'utf8'));
  const ids = new Set<string>(oggetti.items.map((i: { id: string }) => i.id));
  const spells: Record<string, Spell> = Object.fromEntries(KEEP.map((t) => [t, seed.spells[t]]));
  for (const [seq, sp] of Object.entries(INCANTESIMI)) {
    const missing = seq.split(' ').find((t) => !runes[t]);
    if (missing) errori.push(`incantesimo ${seq}: runa ${missing} sconosciuta`);
    const v = validateEffects(sp.effects, { palette: terreno.tiles, item: (x) => (ids.has(x) ? x : undefined), module: () => undefined, loot: new Set(Object.keys(oggetti.loot)) });
    if (v.dropped.length || v.effects.length !== sp.effects.length) errori.push(`incantesimo ${seq}: ${v.dropped.join('; ') || 'effetti cambiati'}`);
    for (const t of [sp.name, sp.description]) if (metaBreak(t, words)) errori.push(`incantesimo ${seq}: quarta parete «${metaBreak(t, words)}»`);
    spells[seq] = { ...sp, effects: v.effects };
  }
  const tot = Object.keys(runes).length;
  if (tot > MAX_MAGIC_RUNES) errori.push(`troppe rune: ${tot}`);
  const manifest = {
    id: 'magic.runes',
    name: 'Rune magiche',
    kind: 'data',
    version: '1.0.0',
    description: "Le rune della magia a Sidera: ognuna è anche una parola, ma tenute in mano e pronunciate (T) diventano incantesimi. Quattro sono quelle di sempre (luce, fuoco, acqua, scudo); dodici parlano di peso, leggerezza, legami, onde, freddo, maree e stasi. Più rune in fila sono una formula: l'ordine conta e ripetere una runa la rafforza. I cristalli di risonanza ridanno mana; le rune si consumano quando le pronunci.",
    runes,
    spells,
    loot: {
      magia: {
        rolls: [1, 1],
        entries: [
          { item: 'item.cristallo-magico', weight: 5, min: 1, max: 2 },
          ...Object.keys(runes).map((t) => ({ item: `rune:${t}`, weight: 1 })),
          { item: 'item.sacca', weight: 1 },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(SIDERA, 'modules/magic.runes/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(SIDERA, 'world/canone.md'), canone);
  console.log(`${tot} rune magiche, ${Object.keys(spells).length} incantesimi; ${errori.length ? 'ERRORI:\n' + errori.join('\n') : 'nessun errore'}`);
  if (errori.length) process.exit(1);
}

if (process.env.SIDERA_RUNE_SOLO_DATI !== '1') scrivi();
