// Genesis: from a theme, the Council writes the world bible, the art direction and the terrains,
// cross-checks them, and plans the first inhabitants (which then go through the Forge).
// Constants never generated: the carpet, movement, physics, runes, the kernel.

import type { Schema } from '../ai/models';
import type { FileMap, TileDef } from '../types';
import type { AgentId, Bible, Council } from './council';

/** Codes the procedural draft (world.terrain) produces: every palette must define them. */
export const BASE_CODES: Record<string, string> = {
  g: 'terreno base calpestabile (prato, sabbia, pavimento…)',
  p: 'sentiero o strada',
  t: 'vegetazione che blocca il passo',
  w: 'acqua o liquido invalicabile',
  r: 'roccia, rilievo o rovina invalicabile',
};

export interface CastEntry {
  tipo: 'npc' | 'oggetto' | 'strumento';
  richiesta: string;
}

export interface GenesisPlan {
  files: FileMap;
  cast: CastEntry[];
  playerPrompt: string;
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
    crepe: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['titolo', 'tono', 'sintesi', 'storia', 'luoghi', 'personaggi', 'fatti', 'crepe'],
};

const STYLE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    stile: { type: 'STRING' },
    prospettiva: { type: 'STRING' },
    palette: { type: 'ARRAY', items: { type: 'STRING' } },
    luce: { type: 'STRING' },
    regole: { type: 'ARRAY', items: { type: 'STRING' } },
    protagonista: { type: 'STRING', description: 'aspetto del viandante (il giocatore)' },
  },
  required: ['stile', 'prospettiva', 'palette', 'luce', 'regole', 'protagonista'],
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
          descrizione: { type: 'STRING' },
          colore: { type: 'STRING', description: 'esadecimale #rrggbb, ben distinto dagli altri' },
          solido: { type: 'BOOLEAN' },
          velocita: { type: 'NUMBER' },
        },
        required: ['codice', 'nome', 'descrizione', 'colore', 'solido', 'velocita'],
      },
    },
  },
  required: ['terreni'],
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
      items: { type: 'OBJECT', properties: { agente: { type: 'STRING', enum: ['narratore', 'artista', 'cartografo'] }, problema: { type: 'STRING' } }, required: ['agente', 'problema'] },
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
  prospettiva: string;
  palette: string[];
  luce: string;
  regole: string[];
  protagonista: string;
}

interface RawTerrain {
  codice: string;
  nome: string;
  descrizione: string;
  colore: string;
  solido: boolean;
  velocita: number;
}

export function styleMarkdown(s: RawStyle): string {
  return [
    `# Guida di stile`,
    `Stile: ${s.stile}`,
    `Prospettiva: ${s.prospettiva}`,
    `Luce: ${s.luce}`,
    `Palette: ${(s.palette ?? []).join(', ')}`,
    `Regole:\n${(s.regole ?? []).map((r) => `- ${r}`).join('\n')}`,
    `Protagonista: ${s.protagonista}`,
  ].join('\n');
}

export function terrainErrors(terrains: RawTerrain[]): string[] {
  const errors: string[] = [];
  const codes = terrains.map((t) => t.codice);
  for (const code of Object.keys(BASE_CODES)) if (!codes.includes(code)) errors.push(`manca il codice "${code}" (${BASE_CODES[code]})`);
  for (const t of terrains) {
    if (typeof t.codice !== 'string' || t.codice.length !== 1 || t.codice === '?') errors.push(`codice non valido "${t.codice}"`);
    if (!/^#[0-9a-f]{6}$/i.test(t.colore)) errors.push(`colore non valido per ${t.codice}: ${t.colore}`);
  }
  if (new Set(codes).size !== codes.length) errors.push('codici duplicati');
  if (terrains.length > 10) errors.push('al massimo 10 terreni');
  return errors;
}

export function toPalette(terrains: RawTerrain[]): Record<string, TileDef> {
  return Object.fromEntries(
    terrains.map((t) => [t.codice, { name: t.nome, description: t.descrizione, color: t.colore.toLowerCase(), solid: !!t.solido, speed: Math.min(1.5, Math.max(0.3, Number(t.velocita) || 1)) }]),
  );
}

export async function planGenesis(c: Council, theme: string, base: FileMap): Promise<GenesisPlan> {
  const data = { theme };
  const askBible = (feedback = '') =>
    c.ask<Bible>(
      'narratore',
      'genesis.bible',
      `Crea la bibbia di un nuovo universo a partire da questo tema:\n${theme}\n\nÈ un mondo simulato: un tappeto riporta sempre il viandante al centro, e il mondo è scritto in codice (rune). Gli abitanti non lo sanno, o fingono di non saperlo. Elenca 6-10 luoghi, 4-6 personaggi, 6-10 fatti, 4-6 crepe (indizi sottili della simulazione).${feedback ? `\nL'Arbitro ha obiettato: ${feedback}` : ''}`,
      BIBLE_SCHEMA,
      { data },
    );
  const askStyle = (bible: Bible, feedback = '') =>
    c.ask<RawStyle>(
      'artista',
      'genesis.style',
      `Scrivi la guida di stile visiva per tutte le immagini di questo universo (mappe e sprite di un gioco 2D rigorosamente dall'alto).\nTitolo: ${bible.titolo}\nTono: ${bible.tono}\nSintesi: ${bible.sintesi}${feedback ? `\nL'Arbitro ha obiettato: ${feedback}` : ''}`,
      STYLE_SCHEMA,
      { data: { ...data, bible } },
    );
  const askTerrain = (bible: Bible, style: RawStyle, feedback = '') =>
    c.ask<{ terreni: RawTerrain[] }>(
      'cartografo',
      'genesis.terrain',
      `Definisci 6-9 tipi di terreno per le mappe di questo universo.\nTono: ${bible.tono}\nLuoghi: ${bible.luoghi.join('; ')}\nStile: ${style.stile}; palette ${style.palette.join(', ')}\nCodici obbligatori (un carattere ciascuno), adattati al tema:\n${Object.entries(BASE_CODES).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\nPuoi aggiungerne altri (un carattere, es. muri, porte, pavimenti, fango). Colori ben distinti tra loro.${feedback ? `\nDa correggere: ${feedback}` : ''}`,
      TERRAIN_SCHEMA,
      { data: { ...data, bible } },
    );

  let bible = await askBible();
  c.say('narratore', 'propone', `«${bible.titolo}» — ${bible.sintesi}`);
  let style = await askStyle(bible);
  c.say('artista', 'propone', `${style.stile}; ${style.prospettiva}; luce ${style.luce}`);
  let { terreni } = await askTerrain(bible, style);
  let errs = terrainErrors(terreni);
  if (errs.length) {
    c.say('kernel', 'scarta', errs.join('; '), 'cartografo');
    ({ terreni } = await askTerrain(bible, style, errs.join('; ')));
    errs = terrainErrors(terreni);
  }
  if (!errs.length) c.say('cartografo', 'propone', terreni.map((t) => `${t.codice}=${t.nome}`).join(', '));

  // The Physicist decides what can be walked on, and how fast.
  if (!errs.length) {
    const phys = await c.ask<{ terreni: Array<{ codice: string; solido: boolean; velocita: number; nota?: string }> }>(
      'fisico',
      'genesis.physics',
      `Rivedi la fisica di questi terreni: cosa si può attraversare e a che velocità (moltiplicatore 0.3-1.5).\n${terreni.map((t) => `${t.codice} ${t.nome}: ${t.descrizione} (solido=${t.solido}, velocita=${t.velocita})`).join('\n')}\nRegola fissa: g e p calpestabili; w, t, r invalicabili.`,
      PHYS_SCHEMA,
      { data: { terreni } },
    );
    for (const p of phys.terreni ?? []) {
      const t = terreni.find((x) => x.codice === p.codice);
      if (!t) continue;
      if (t.solido !== p.solido || t.velocita !== p.velocita) c.say('fisico', 'corregge', `${t.nome}: ${p.solido ? 'invalicabile' : 'calpestabile'}, velocità ×${p.velocita}${p.nota ? ` — ${p.nota}` : ''}`, 'cartografo');
      t.solido = p.solido;
      t.velocita = p.velocita;
    }
    for (const t of terreni) {
      if (t.codice === 'g' || t.codice === 'p') t.solido = false;
      if (t.codice === 'w' || t.codice === 't' || t.codice === 'r') t.solido = true;
    }
  }

  // The Arbiter checks that the story, the look and the land agree.
  const review = await c.ask<{ approvato: boolean; problemi: Array<{ agente: AgentId; problema: string }> }>(
    'arbitro',
    'genesis.review',
    `Verifica la coerenza tra bibbia, guida di stile e terreni di questo universo nascente. Segnala solo contraddizioni concrete.\nBibbia: ${JSON.stringify(bible)}\nStile: ${JSON.stringify(style)}\nTerreni: ${JSON.stringify(terreni)}`,
    REVIEW_SCHEMA,
    { data: { bible, style, terreni }, temperature: 0.2 },
  );
  if (review.approvato || !review.problemi?.length) c.say('arbitro', 'approva', 'Storia, aspetto e terreni sono coerenti.');
  else {
    for (const p of review.problemi.slice(0, 4)) c.say('arbitro', 'obietta', p.problema, p.agente);
    const issues = (a: AgentId) => review.problemi.filter((p) => p.agente === a).map((p) => p.problema).join('; ');
    if (issues('narratore')) {
      bible = await askBible(issues('narratore'));
      c.say('narratore', 'corregge', bible.sintesi);
    }
    if (issues('artista')) {
      style = await askStyle(bible, issues('artista'));
      c.say('artista', 'corregge', style.stile);
    }
    if (issues('cartografo')) {
      const again = await askTerrain(bible, style, issues('cartografo'));
      if (!terrainErrors(again.terreni).length) {
        terreni = again.terreni;
        c.say('cartografo', 'corregge', terreni.map((t) => `${t.codice}=${t.nome}`).join(', '));
      }
    }
  }

  const { moduli } = await c.ask<{ moduli: CastEntry[] }>(
    'narratore',
    'genesis.cast',
    `Scegli i primi abitanti e le prime cose di «${bible.titolo}»: esattamente 2 npc, 2 oggetti (che stanno nel mondo) e 2 strumenti (che si raccolgono). Per ognuno una richiesta di una frase per la Fucina, coerente con la bibbia. Almeno uno strumento deve servire a interagire con un oggetto.`,
    CAST_SCHEMA,
    { data: { bible } },
  );
  c.say('narratore', 'propone', `Primi abitanti: ${moduli.map((m) => m.richiesta).join(' · ')}`);

  const files: FileMap = {
    'world/bible.json': JSON.stringify(bible, null, 2) + '\n',
    'world/style.md': styleMarkdown(style) + '\n',
    'prompts/theme.md': theme.trim() + '\n',
  };
  if (!terrainErrors(terreni).length) {
    const terrainPath = 'modules/world.terrain/manifest.json';
    const manifest = JSON.parse(base[terrainPath]);
    manifest.tiles = toPalette(terreni);
    files[terrainPath] = JSON.stringify(manifest, null, 2) + '\n';
  }
  return { files, cast: moduli.slice(0, 8), playerPrompt: style.protagonista };
}
