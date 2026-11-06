// Genesis: from a theme, the Council writes the world bible, the art direction, the terrains (with
// their layers), the environments (layout programs) and plans the first inhabitants and furniture.
// Constants never generated: the carpet, movement, physics, needs, runes, the kernel.

import type { Schema } from '../ai/models';
import type { FileMap, EnvironmentDef, TerrainDef, TerrainLayer } from '../types';
import type { AgentId, Bible, Council } from './council';
import { wordsOf } from './council';
import { designLayouts } from './cartography';
import { repairProgram } from '../mj';
import { bibleBreaks, cleanBible, metaBreak } from '../fourthwall';
import { internalFields } from '../internalNames';

/** Codes the procedural draft and the kernel rely on: every palette must define them. */
export const BASE_CODES: Record<string, { meaning: string; layer: TerrainLayer; solid: boolean; indoor?: boolean }> = {
  g: { meaning: 'terreno base calpestabile (prato, sabbia, terra…)', layer: 'ground', solid: false },
  p: { meaning: 'sentiero o strada (anche i sentieri scavati dal kernel)', layer: 'ground', solid: false },
  t: { meaning: 'vegetazione che blocca il passo (alberi, rovi…)', layer: 'vegetation', solid: true },
  w: { meaning: 'acqua o liquido invalicabile', layer: 'liquid', solid: true },
  r: { meaning: 'roccia, rilievo o macerie invalicabili', layer: 'rock', solid: true },
  h: { meaning: 'muro degli edifici', layer: 'wall', solid: true },
  f: { meaning: 'pavimento interno degli edifici', layer: 'floor', solid: false, indoor: true },
  d: { meaning: 'porta o soglia', layer: 'door', solid: false },
  // Biomes of the procedural draft (world.terrain): they must exist in every world.
  s: { meaning: 'terreno arido calpestabile (sabbia, deserto, spiaggia)', layer: 'ground', solid: false },
  j: { meaning: 'vegetazione fittissima e invalicabile dei climi caldi (giungla)', layer: 'vegetation', solid: true },
  o: { meaning: 'acqua profonda del mare o dell’oceano', layer: 'liquid', solid: true },
  k: { meaning: 'montagna, pareti invalicabili', layer: 'rock', solid: true },
  n: { meaning: 'terreno freddo calpestabile e lento (neve, gelo)', layer: 'ground', solid: false },
};

/** The seed's environments that belong to no age (ADR-0134): a Genesis that wrote too few keeps these, not a castle in a city of neon. */
const TIMELESS_LAYOUTS = new Set(['woods', 'fields', 'ruins', 'dungeon', 'desert', 'jungle', 'mountains', 'lake']);

export interface CastEntry {
  tipo: 'npc' | 'oggetto' | 'strumento';
  richiesta: string;
}

export interface GenesisPlan {
  files: FileMap;
  cast: CastEntry[];
  wandererPrompt: string;
  palette: Record<string, TerrainDef>;
}

const BIBLE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    titolo: { type: 'STRING' },
    tono: { type: 'STRING' },
    sintesi: { type: 'STRING' },
    storia: { type: 'STRING' },
    luoghi: { type: 'ARRAY', items: { type: 'STRING' } },
    personaggi: { type: 'ARRAY', items: { type: 'STRING' } },
    fatti: { type: 'ARRAY', items: { type: 'STRING' } },
    misteri: { type: 'ARRAY', items: { type: 'STRING' }, description: 'leggende raccontate dalla gente del mondo (persone, bestie, dei, potenti del passato)' },
    usanze: { type: 'ARRAY', items: { type: 'STRING' }, description: 'al più 3 usanze o modi di dire propri di questo mondo, che arricchiscono il lessico senza contraddirlo né spiegarlo' },
  },
  required: ['titolo', 'tono', 'sintesi', 'storia', 'luoghi', 'personaggi', 'fatti', 'misteri'],
};

const STYLE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    stile: { type: 'STRING' },
    forme: { type: 'STRING', description: 'proporzioni e forme dei modelli (teste grandi o realistiche, edifici tozzi o slanciati…)' },
    palette: { type: 'ARRAY', items: { type: 'STRING' } },
    luce: { type: 'STRING' },
    regole: { type: 'ARRAY', items: { type: 'STRING' } },
    protagonista: { type: 'STRING', description: 'aspetto del viandante (il giocatore)' },
    case_comuni: { type: 'STRING', description: 'come sono le case comuni, se non sono casette di pietra, legno e paglia; altrimenti vuoto' },
  },
  required: ['stile', 'forme', 'palette', 'luce', 'regole', 'protagonista'],
};

const TERRAIN_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    terreni: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          codice: { type: 'STRING' },
          nome: { type: 'STRING' },
          descrizione: { type: 'STRING', description: "com'è: materiale, colore, dettagli" },
          colore: { type: 'STRING', description: 'esadecimale #rrggbb, ben distinto dagli altri' },
          strato: { type: 'STRING', enum: ['ground', 'floor', 'wall', 'door', 'liquid', 'vegetation', 'rock'] },
          solido: { type: 'BOOLEAN' },
          velocita: { type: 'NUMBER' },
        },
        required: ['codice', 'nome', 'descrizione', 'colore', 'strato', 'solido', 'velocita'],
      },
    },
    tetto: { type: 'STRING', description: 'colore #rrggbb dei tetti degli edifici' },
  },
  required: ['terreni', 'tetto'],
};

const PHYS_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    terreni: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { codice: { type: 'STRING' }, solido: { type: 'BOOLEAN' }, velocita: { type: 'NUMBER' }, nota: { type: 'STRING' } }, required: ['codice', 'solido', 'velocita'] },
    },
  },
  required: ['terreni'],
};

const REVIEW_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    approvato: { type: 'BOOLEAN' },
    problemi: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { agente: { type: 'STRING', enum: ['narrator', 'artist', 'cartographer'] }, problema: { type: 'STRING' } }, required: ['agente', 'problema'] },
    },
  },
  required: ['approvato', 'problemi'],
};

const CAST_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    moduli: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { tipo: { type: 'STRING', enum: ['npc', 'oggetto', 'strumento'] }, richiesta: { type: 'STRING' } }, required: ['tipo', 'richiesta'] },
    },
  },
  required: ['moduli'],
};

interface RawStyle {
  stile: string;
  forme: string;
  palette: string[];
  luce: string;
  regole: string[];
  protagonista: string;
  case_comuni?: string;
}

interface RawTerrain {
  codice: string;
  nome: string;
  descrizione: string;
  colore: string;
  strato: TerrainLayer;
  solido: boolean;
  velocita: number;
}

export function styleMarkdown(s: RawStyle): string {
  return [
    `# Guida di stile`,
    `Stile: ${s.stile}`,
    `Forme: ${s.forme}`,
    `Luce: ${s.luce}`,
    `Palette: ${(s.palette ?? []).join(', ')}`,
    `Regole:\n${(s.regole ?? []).map((r) => `- ${r}`).join('\n')}`,
    `Protagonista: ${s.protagonista}`,
  ].join('\n');
}

export function terrainErrors(terrains: RawTerrain[]): string[] {
  const errors: string[] = [];
  const codes = terrains.map((t) => t.codice);
  for (const [code, b] of Object.entries(BASE_CODES)) if (!codes.includes(code)) errors.push(`manca il codice "${code}" (${b.meaning})`);
  for (const t of terrains) {
    if (typeof t.codice !== 'string' || t.codice.length !== 1 || '?*/[]'.includes(t.codice)) errors.push(`codice non valido "${t.codice}"`);
    if (!/^#[0-9a-f]{6}$/i.test(t.colore)) errors.push(`colore non valido per ${t.codice}: ${t.colore}`);
  }
  if (new Set(codes).size !== codes.length) errors.push('codici duplicati');
  if (terrains.length > 24) errors.push('al massimo 24 terreni');
  return errors;
}

/** The base codes keep their meaning whatever the models say: the engine depends on them. */
export function toPalette(terrains: RawTerrain[]): Record<string, TerrainDef> {
  return Object.fromEntries(
    terrains.map((t) => {
      const base = BASE_CODES[t.codice];
      const layer = base?.layer ?? t.strato ?? (t.solido ? 'rock' : 'ground');
      const solid = base ? base.solid : layer === 'wall' || layer === 'liquid' || layer === 'vegetation' || layer === 'rock' ? true : layer === 'floor' || layer === 'door' ? false : !!t.solido;
      // What stands on woods and rocks is a model of its own, which the Sculptor writes from the description.
      const model = layer === 'vegetation' || layer === 'rock' ? { model: `terreno-${t.nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || t.codice.charCodeAt(0)}` } : {};
      return [t.codice, { name: t.nome, description: t.descrizione, color: t.colore.toLowerCase(), solid, layer, ...model, ...(base?.indoor || layer === 'floor' ? { indoor: true } : {}), speed: Math.min(1.5, Math.max(0.3, Number(t.velocita) || 1)) }];
    }),
  );
}

export type LayoutCheck = (id: string, def: EnvironmentDef, palette: Record<string, TerrainDef>) => string[];

export async function planGenesis(c: Council, theme: string, base: FileMap, checkLayout: LayoutCheck): Promise<GenesisPlan> {
  const data = { theme };
  // The Narrator still writes the bible with the Italian fields of its schema (until T310): it is read with those of 0.4 (T308a).
  const askBible = async (feedback = ''): Promise<Bible> =>
    internalFields('bible', await c.ask<Bible>(
      'narrator',
      'genesis.bible',
      `Crea la bibbia di un nuovo universo a partire da questo tema:\n${theme}\n\nPer chi ci vive il mondo è reale (vedi i principi). Scrivi un mondo semplice e concreto, fatto di persone e mestieri, nell'epoca che il tema dice: tono e sintesi la dicono chiaramente (la tecnologia, com'è una città), perché gli altri lavoreranno da lì. Le rune sono come le dice il canone: non aggiungere nulla. Elenca 6-10 luoghi, 4-6 personaggi con mestieri concreti, 6-10 fatti, 2-4 leggende raccontate dalla gente (storie di persone, bestie, dei, potenti del passato: mai sul mondo stesso, né sulle rune oltre il canone). La gente parla e si comporta come dice il lessico: usalo dove viene da sé, senza spiegarlo; in «usanze» al più 3 usanze o modi di dire propri di questo mondo, che non contraddicono il lessico e non aggiungono parole che ne sostituiscono altre.${feedback ? `\nL'Arbitro ha obiettato: ${feedback}` : ''}`,
      BIBLE_SCHEMA,
      { data },
    ));
  const askStyle = (bible: Bible, feedback = '') =>
    c.ask<RawStyle>(
      'artist',
      'genesis.style',
      `Scrivi la guida di stile per tutti i modelli di questo universo: è un gioco 3D in cui ogni cosa (persone, animali, alberi, rocce, oggetti, edifici) è un modello a voxel (20 voxel per casella) costruito da un programma di regole, visto dall'alto in 3/4. Il mondo si disegna come un cartone: fasce di luce piatte e un contorno scuro dove cambia la parte. Dì lo stile (semplice e leggibile da lontano), le forme e le proporzioni (tozze e semplificate), la palette (ambiente smorzato e chiaro, pochi accenti saturi sulle cose che contano), la luce, 3-6 regole (tra cui: un colore pieno per parte, parti vicine ben staccate di chiaro e scuro, dettagli come segni scuri) e l'aspetto del protagonista, tutto nell'epoca del tema. In «case_comuni», solo se le case comuni di quest'epoca non sono casette di pietra, legno e paglia, dì in una frase come sono (un condominio con i balconi, una baracca di lamiera con un'insegna); altrimenti lascialo vuoto.\nTema: ${theme}\nTitolo: ${bible.title}\nTono: ${bible.tone}\nSintesi: ${bible.summary}${feedback ? `\nL'Arbitro ha obiettato: ${feedback}` : ''}`,
      STYLE_SCHEMA,
      { data: { ...data, bible } },
    );
  const askTerrain = (bible: Bible, style: RawStyle, feedback = '') =>
    c.ask<{ terreni: RawTerrain[]; tetto: string }>(
      'cartographer',
      'genesis.terrain',
      `Definisci 14-20 tipi di terreno per le mappe di questo universo, esterni e interni, della sua epoca.\nTema: ${theme}\nTono: ${bible.tone}\nLuoghi: ${bible.places.join('; ')}\nStile: ${style.stile}; palette ${style.palette.join(', ')}\nCodici obbligatori (un carattere ciascuno), adattati al tema:\n${Object.entries(BASE_CODES).map(([k, v]) => `- ${k}: ${v.meaning} [strato ${v.layer}]`).join('\n')}\nAggiungine altri (un carattere), ciò che nel tema esiste: in un borgo campi coltivati, fango, muro di pietra, paglia, staccionata, ponte levatoio; in una città asfalto, binari, cemento, vetro, lamiera, rete metallica; ovunque lava, tappeto. Colori ben distinti tra loro.${feedback ? `\nDa correggere: ${feedback}` : ''}`,
      TERRAIN_SCHEMA,
      { data: { ...data, bible } },
    );

  // A bible of the world, not of the Council's table: asked once more if it breaks the fourth wall, then cleaned.
  const worldBible = async (feedback = '') => {
    const words = wordsOf(base);
    let b = await askBible(feedback);
    const breaks = bibleBreaks(b, words);
    if (breaks.length) {
      const why = `rompe la quarta parete, duplica le rune o spiega il lessico come un glossario: ${breaks.slice(0, 4).join('; ')}. Dentro il mondo nessuno sa di essere in un gioco.`;
      c.say('kernel', 'scarta', why, 'narrator');
      b = await askBible([feedback, why].filter(Boolean).join('; '));
    }
    return cleanBible(b, words);
  };
  let bible = await worldBible();
  c.say('narrator', 'propone', `«${bible.title}» — ${bible.summary}`);
  let style = await askStyle(bible);
  c.say('artist', 'propone', `${style.stile}; ${style.forme}; luce ${style.luce}`);
  let terrain = await askTerrain(bible, style);
  let errs = terrainErrors(terrain.terreni);
  if (errs.length) {
    c.say('kernel', 'scarta', errs.join('; '), 'cartographer');
    terrain = await askTerrain(bible, style, errs.join('; '));
    errs = terrainErrors(terrain.terreni);
  }
  if (!errs.length) c.say('cartographer', 'propone', terrain.terreni.map((t) => `${t.codice}=${t.nome}`).join(', '));

  // The Physicist decides what can be walked on, and how fast.
  if (!errs.length) {
    const phys = await c.ask<{ terreni: Array<{ codice: string; solido: boolean; velocita: number; nota?: string }> }>(
      'physicist',
      'genesis.physics',
      `Rivedi la fisica di questi terreni: cosa si può attraversare e a che velocità (moltiplicatore 0.3-1.5).\n${terrain.terreni.map((t) => `${t.codice} ${t.nome} [${t.strato}]: ${t.descrizione} (solido=${t.solido}, velocita=${t.velocita})`).join('\n')}\nRegole fisse: g, p, f, d calpestabili; w, t, r, h invalicabili.`,
      PHYS_SCHEMA,
      { data: { terreni: terrain.terreni } },
    );
    for (const p of phys.terreni ?? []) {
      const t = terrain.terreni.find((x) => x.codice === p.codice);
      if (!t || BASE_CODES[t.codice]) continue;
      if (t.solido !== p.solido || t.velocita !== p.velocita) c.say('physicist', 'corregge', `${t.nome}: ${p.solido ? 'invalicabile' : 'calpestabile'}, velocità ×${p.velocita}${p.nota ? ` — ${p.nota}` : ''}`, 'cartographer');
      t.solido = p.solido;
      t.velocita = p.velocita;
    }
  }
  const palette = errs.length ? (JSON.parse(base['modules/world.terrain/manifest.json']).tiles as Record<string, TerrainDef>) : toPalette(terrain.terreni);

  // The Arbiter checks that the story, the look and the land agree.
  const review = await c.ask<{ approvato: boolean; problemi: Array<{ agente: AgentId; problema: string }> }>(
    'arbiter',
    'genesis.review',
    `Verifica la coerenza tra bibbia, guida di stile e terreni di questo universo nascente. Segnala solo contraddizioni concrete.\nBibbia: ${JSON.stringify(bible)}\nStile: ${JSON.stringify(style)}\nTerreni: ${JSON.stringify(terrain.terreni)}`,
    REVIEW_SCHEMA,
    { data: { bible, style, terreni: terrain.terreni }, temperature: 0.2 },
  );
  if (review.approvato || !review.problemi?.length) c.say('arbiter', 'approva', 'Storia, aspetto e terreni sono coerenti.');
  else {
    for (const p of review.problemi.slice(0, 4)) c.say('arbiter', 'obietta', p.problema, p.agente);
    const issues = (a: AgentId) => review.problemi.filter((p) => p.agente === a).map((p) => p.problema).join('; ');
    if (issues('narrator')) {
      bible = await worldBible(issues('narrator'));
      c.say('narrator', 'corregge', bible.summary);
    }
    if (issues('artist')) {
      style = await askStyle(bible, issues('artist'));
      c.say('artist', 'corregge', style.stile);
    }
  }

  // Environments: the Cartographer writes them as rewrite programs; the kernel test-runs each one.
  const layouts: Record<string, EnvironmentDef> = {};
  let feedback = '';
  for (let round = 0; round < 2 && Object.keys(layouts).length < 4; round++) {
    const designed = await designLayouts(c, palette, feedback);
    const problems: string[] = [];
    for (const d of designed) {
      if ('error' in d) {
        problems.push(d.error);
        continue;
      }
      const notes: string[] = [];
      const repaired = repairProgram(d.def.program, notes);
      if (!repaired) {
        problems.push(`${d.id}: nessuna regola comprensibile`);
        continue;
      }
      if (notes.length) c.say('kernel', 'corregge', `${d.id}: ${notes.slice(0, 3).join('; ')}`, 'cartographer');
      d.def.program = repaired;
      const e = checkLayout(d.id, d.def, palette);
      if (e.length) problems.push(...e);
      else layouts[d.id] = d.def;
    }
    feedback = problems.join('; ');
    c.say('cartographer', 'propone', `ambienti: ${Object.values(layouts).map((l) => l.name).join(', ') || 'nessuno valido'}`);
    if (problems.length) c.say('kernel', 'scarta', problems.slice(0, 3).join('; '), 'cartographer');
  }

  const { moduli } = await c.ask<{ moduli: CastEntry[] }>(
    'narrator',
    'genesis.cast',
    `Scegli i primi abitanti e le prime cose di «${bible.title}»: 5 npc molto diversi tra loro (almeno 3 persone di mestieri, età e generi diversi, e 1 animale; nessuno uguale a un altro), 5 oggetti che stanno nel mondo (almeno 3 mobili o contenitori, come li ha la sua epoca: letto, credenza, cassa, banco da lavoro…, e 1-2 cose all'aperto con cui fare qualcosa: pozzo, altare, falò, cabina, distributore…), 2 strumenti speciali. Per ognuno una richiesta di una frase per la Fucina, coerente con la bibbia.`,
    CAST_SCHEMA,
    { data: { bible } },
  );
  c.say('narrator', 'propone', `Primi abitanti e cose: ${moduli.map((m) => m.richiesta).join(' · ')}`);

  const files: FileMap = {
    'world/bible.json': JSON.stringify(bible, null, 2) + '\n',
    'world/style.md': styleMarkdown(style) + '\n',
    'prompts/theme.md': theme.trim() + '\n',
  };
  const terrainPath = 'modules/world.terrain/manifest.json';
  const tm = JSON.parse(base[terrainPath]);
  tm.tiles = palette;
  if (/^#[0-9a-f]{6}$/i.test(terrain.tetto ?? '')) tm.roof = { color: terrain.tetto.toLowerCase() };
  // Common houses of their own only where the seed's cottages would not fit (ADR-0134): a world of cottages keeps the seed's.
  const house = typeof style.case_comuni === 'string' ? style.case_comuni.trim().slice(0, 200) : '';
  if (house && !metaBreak(house, wordsOf(base))) tm.commonHouse = house;
  else delete tm.commonHouse;
  files[terrainPath] = JSON.stringify(tm, null, 2) + '\n';
  if (Object.keys(layouts).length >= 1) {
    const lp = 'modules/world.layouts/manifest.json';
    const lm = JSON.parse(base[lp]);
    // Too few environments make a monotonous world: previous ones that fit any age and the new terrains stay.
    const keep = Object.keys(layouts).length < 3 ? Object.entries<EnvironmentDef>(lm.layouts ?? {}).filter(([id, def]) => TIMELESS_LAYOUTS.has(id) && !layouts[id] && !checkLayout(id, def, palette).length) : [];
    lm.layouts = { ...layouts, ...Object.fromEntries(keep) };
    files[lp] = JSON.stringify(lm, null, 2) + '\n';
  }
  return { files, cast: moduli.slice(0, 14), wandererPrompt: style.protagonista, palette };
}
