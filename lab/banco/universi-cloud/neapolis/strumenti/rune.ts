// Le 12 rune urbane di Neapolis: ognuna passa da validateNewRune (contro le rune già in magic.runes) e dal filtro
// della quarta parete; il canone si scrive con canonWithRune, come fa il kernel quando il Narratore ne inventa una.
// npx vite-node lab/banco/universi-cloud/neapolis/strumenti/rune.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { canonWithRune, MAX_MAGIC_RUNES, validateNewRune, type RuneDraft } from '../../../../../src/kernel/magic';
import { lexiconWords, metaBreak } from '../../../../../src/kernel/fourthwall';
import type { MagicRune } from '../../../../../src/kernel/types';

const DIR = 'lab/banco/universi-cloud/neapolis';
const seed = JSON.parse(readFileSync('universe/modules/magic.runes/manifest.json', 'utf8'));
const words = lexiconWords(readFileSync(`${DIR}/world/lexicon.md`, 'utf8'));

/** Le rune del seme che restano: quattro, così con le dodici nuove sono 16, il massimo (MAX_MAGIC_RUNES). */
const KEPT = ['luce', 'fuoco', 'terra', 'vento'];

interface Urban extends RuneDraft {
  spell: { name: string; description: string; cost: number; effects: Array<Record<string, unknown>> };
}

const URBAN: Urban[] = [
  { token: 'corrente', nome: 'Naudiz', glifo: 'ᚡ', colore: '#7ad8ff', elemento: 'elettricità', descrizione: 'il filo teso: accende, carica', canone: 'la scossa dei fili: pronunciata accende una luce bianca e mette addosso una fretta elettrica che dura poco.',
    spell: { name: 'Scintilla', description: 'Una luce bianca si accende davanti a te e ti senti carico come una batteria.', cost: 8, effects: [{ tipo: 'luce', raggio: 6, durata: 120 }, { tipo: 'stato', nome: 'carico', velocita: 1.2, durata: 30 }] } },
  { token: 'lamiera', nome: 'Hagalaz', glifo: 'ᚣ', colore: '#9aa4ae', elemento: 'metallo', descrizione: 'la serranda: ripara, resiste', canone: 'la serranda abbassata: chi la pronuncia resta al riparo per un poco, come dietro una lamiera.',
    spell: { name: 'Serranda', description: 'Un guscio duro come una saracinesca ti avvolge.', cost: 9, effects: [{ tipo: 'scudo', durata: 40 }] } },
  { token: 'marea', nome: 'Wunjo', glifo: 'ᚤ', colore: '#3a8ac8', elemento: 'mare', descrizione: 'il mare che sale: bagna, allaga', canone: 'il mare che sale: pronunciata fa affiorare acqua salata dal suolo davanti a sé.',
    spell: { name: 'Risacca', description: 'Dal suolo davanti a te affiora acqua che sa di mare.', cost: 10, effects: [{ tipo: 'terreno', a: 'w', raggio: 0 }] } },
  { token: 'asfalto', nome: 'Raido', glifo: 'ᚥ', colore: '#6b6b70', elemento: 'strada', descrizione: 'la strada: spiana, apre il passo', canone: 'la strada battuta: pronunciata spiana il terreno davanti a sé in una carreggiata.',
    spell: { name: 'Carreggiata', description: 'Il terreno davanti a te si spiana in una strada liscia.', cost: 14, effects: [{ tipo: 'terreno', a: 'p', raggio: 1 }] } },
  { token: 'caffe', nome: 'Jera', glifo: 'ᚧ', colore: '#8a5a32', elemento: 'veglia', descrizione: 'la tazzina: sveglia, scalda', canone: 'la tazzina del mattino: pronunciata toglie il sonno di dosso e scalda lo stomaco.',
    spell: { name: 'Ristretto', description: 'Un calore amaro ti sveglia da capo a piedi.', cost: 6, effects: [{ tipo: 'bisogni', energia: 30, sete: 5 }] } },
  { token: 'voce', nome: 'Gebo', glifo: 'ᚨ', colore: '#ffb347', elemento: 'voce', descrizione: 'il richiamo: spinge, fa largo', canone: 'il richiamo del mercato: pronunciata a voce piena spinge via ciò che si ha davanti.',
    spell: { name: 'Banditore', description: 'Un grido da banco del pesce spinge via ciò che hai davanti.', cost: 6, effects: [{ tipo: 'spingi', forza: 5 }] } },
  { token: 'sirena', nome: 'Tiwaz', glifo: 'ᚪ', colore: '#ff4a4a', elemento: 'allarme', descrizione: 'il lampeggiante: avverte, mette in allerta', canone: 'il lampeggiante: pronunciata manda attorno una luce rossa e fa stare all\'erta chi la dice.',
    spell: { name: 'Lampeggiante', description: 'Una luce rossa gira attorno a te e i sensi si fanno svelti.', cost: 9, effects: [{ tipo: 'luce', raggio: 8, durata: 30 }, { tipo: 'stato', nome: 'allerta', velocita: 1.3, durata: 20 }] } },
  { token: 'pane', nome: 'Fehu', glifo: 'ᚫ', colore: '#e8b860', elemento: 'nutrimento', descrizione: 'la sfornata: sfama', canone: 'la sfornata dell\'alba: pronunciata riempie la pancia come una pagnotta calda.',
    spell: { name: 'Sfornata', description: 'Un profumo di forno ti riempie la pancia.', cost: 8, effects: [{ tipo: 'bisogni', fame: 30 }] } },
  { token: 'nebbia', nome: 'Isaz', glifo: 'ᚬ', colore: '#c8d0d8', elemento: 'nebbia', descrizione: 'la foschia del porto: nasconde', canone: 'la foschia del porto all\'alba: pronunciata avvolge chi la dice, che passa inosservato per un poco.',
    spell: { name: 'Foschia', description: 'Una foschia bassa ti avvolge: la gente ti guarda senza vederti.', cost: 7, effects: [{ tipo: 'stato', nome: 'nascosto', velocita: 0.9, durata: 40 }] } },
  { token: 'motore', nome: 'Ehwaz', glifo: 'ᚭ', colore: '#ffd23a', elemento: 'velocità', descrizione: 'il motorino: corre', canone: 'il motorino in discesa: pronunciata mette nelle gambe una corsa che dura poco.',
    spell: { name: 'Sgasata', description: 'Le gambe ti partono come un motorino in discesa.', cost: 10, effects: [{ tipo: 'stato', nome: 'di corsa', velocita: 1.8, durata: 25 }] } },
  { token: 'sutura', nome: 'Mannaz', glifo: 'ᚮ', colore: '#7ee0b0', elemento: 'cura', descrizione: 'il punto di sutura: ricuce, guarisce', canone: 'il punto di sutura: pronunciata chiude le ferite di chi la dice.',
    spell: { name: 'Ricucitura', description: 'Un fresco di disinfettante ti richiude le ferite.', cost: 12, effects: [{ tipo: 'bisogni', salute: 25 }] } },
  { token: 'tufo', nome: 'Perthro', glifo: 'ᚯ', colore: '#d8c070', elemento: 'pietra gialla', descrizione: 'il tufo del colle: solleva', canone: 'la pietra gialla del colle: pronunciata solleva un poco il suolo davanti a sé.',
    spell: { name: 'Gradone', description: 'Il suolo davanti a te si alza di un gradino di pietra gialla.', cost: 12, effects: [{ tipo: 'rilievo', delta: 1, raggio: 1 }] } },
];

function build() {
  const runes: Record<string, MagicRune> = Object.fromEntries(KEPT.map((t) => [t, seed.runes[t]]));
  const spells: Record<string, unknown> = Object.fromEntries(Object.entries(seed.spells).filter(([k]) => k.split(' ').every((t) => KEPT.includes(t))));
  let canon = readFileSync('universe/world/canon.md', 'utf8')
    // Due frasi del seme che il filtro della quarta parete prende alla lettera: dette con altre parole, uguali nel senso.
    .replace('Nessuno ha mai visto una runa nascere: chi passa le trova già lì.', 'Nessuno ha mai assistito alla nascita di una lastra: chi passa le trova già lì.')
    .replace(/né inventare altri segni luminosi nel terreno\s+che facciano le veci delle rune\./, 'né inventare altri segni che brillino nel terreno al posto delle rune.');
  const report: string[] = [];
  for (const u of URBAN) {
    const { rune, errors } = validateNewRune(u, runes, words);
    if (!rune) throw new Error(`runa ${u.token}: ${errors.join('; ')}`);
    for (const t of [u.spell.name, u.spell.description]) {
      const m = metaBreak(t, words);
      if (m) throw new Error(`incantesimo di ${u.token}: rompe la quarta parete («${m}»)`);
    }
    runes[rune.token] = rune.rune;
    spells[rune.token] = u.spell;
    canon = canonWithRune(canon, rune);
    report.push(`${rune.rune.glyph} ${rune.rune.name} «${rune.token}» (${rune.rune.element}) → ${u.spell.name}`);
  }
  if (Object.keys(runes).length > MAX_MAGIC_RUNES) throw new Error('troppe rune');
  // Formule urbane: due rune in fila (l'ordine conta).
  Object.assign(spells, {
    'corrente sirena': { name: 'Blackout', description: 'Una luce rossa e bianca esplode attorno a te e ti lascia all\'erta, carico e svelto.', cost: 16, effects: [{ tipo: 'luce', raggio: 8, durata: 60 }, { tipo: 'stato', nome: 'allerta', velocita: 1.4, durata: 30 }] },
    'caffe pane': { name: 'Colazione al banco', description: 'Cornetto e tazzina: fame e sonno spariscono.', cost: 14, effects: [{ tipo: 'bisogni', fame: 25, energia: 25 }] },
    'marea nebbia': { name: 'Bruma del Molo', description: 'Il mare sale in foschia e ti nasconde a lungo.', cost: 15, effects: [{ tipo: 'stato', nome: 'nascosto', velocita: 1, durata: 70 }] },
    'tufo asfalto': { name: 'Rampa', description: 'Il suolo si alza e si spiana in una rampa di strada.', cost: 18, effects: [{ tipo: 'rilievo', delta: 1, raggio: 1 }, { tipo: 'terreno', a: 'p', raggio: 1 }] },
  });
  const man = {
    id: 'magic.runes',
    name: 'Rune magiche',
    kind: 'data',
    version: '0.2.0',
    description: seed.description,
    runes,
    spells,
    items: seed.items,
    loot: { magia: { rolls: [1, 1], entries: [{ item: 'item.cristallo-magico', weight: 5, min: 1, max: 2 }, ...Object.keys(runes).map((t) => ({ item: `rune:${t}`, weight: 1 })), { item: 'item.sacca', weight: 1 }] } },
  };
  writeFileSync(`${DIR}/modules/magic.runes/manifest.json`, JSON.stringify(man, null, 2) + '\n');
  // Il canone: un paragrafo sulla città prima delle rune trovate dopo.
  canon = canon.replace('## Le rune trovate dopo', '## A Neapolis\n- In città le rune si trovano come altrove: sul basolato dei rioni, nei giardini del Colle, tra i binari morti dello scalo. Alla radio ci ridono sopra; i ragazzi le vendono al mercatino della domenica.\n- Chi pronuncia una runa in città lo racconta sottovoce, al bar, a chi offre il caffè.\n\n## Le rune trovate dopo');
  writeFileSync(`${DIR}/world/canon.md`, canon);
  return report;
}

console.log(build().join('\n'));
