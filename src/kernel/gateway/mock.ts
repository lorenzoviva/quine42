// Mock provider: deterministic, offline, themed (medieval). It sometimes returns broken output on
// purpose, so the validate → discard → regenerate path is exercised from day one.

import type { ChunkContent, GeneratedRune } from '../types';
import { hashStr, Rng } from '../rng';
import { tokenize } from '../runes';
import type { AIProvider, ChunkRequest, ImageRequest, ModuleRequest, ModuleResult, TextRequest } from './gateway';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PLACES: Record<string, { nouns: string[]; descr: string[] }> = {
  forest: {
    nouns: ['Bosco', 'Selva', 'Macchia', 'Foresta'],
    descr: ['Gli alberi crescono in file troppo ordinate.', 'Il vento muove le foglie tutte nello stesso istante.', 'Tra i tronchi qualcosa scorre, come un nastro sotto i piedi.'],
  },
  water: {
    nouns: ['Lago', 'Guado', 'Stagno', 'Palude'],
    descr: ["L'acqua riflette un cielo che non è quello sopra di te.", 'Le onde arrivano a riva a intervalli regolari. Troppo regolari.', 'Sul fondo, lettere luminose si muovono piano.'],
  },
  rock: {
    nouns: ['Colle', 'Rupe', 'Altura', 'Cava'],
    descr: ['Le pietre sono incise con segni che sembrano parole.', "Da quassù l'orizzonte sembra sempre alla stessa distanza.", "L'eco ripete i tuoi passi, ma in ritardo."],
  },
  plain: {
    nouns: ['Piana', 'Radura', 'Prato', 'Campagna', 'Borgo'],
    descr: ["L'erba si piega verso il centro del mondo.", 'Hai la sensazione di essere già stato qui.', 'Cammini da ore, eppure il paesaggio ti segue.', 'Qualcuno ha lasciato segni luminosi nel terreno.'],
  },
};

const SUFFIX = ['di Valmora', 'dei Sussurri', 'del Re Muto', 'delle Lanterne', 'Senza Ritorno', "dell'Eco", 'del Primo Passo', 'delle Rune', 'del Nastro', 'Immobile'];

const VILLAGER = [
  'Benvenuto a Valmora, viandante. Da qui si va ovunque, e si torna sempre qui.',
  'Mio nonno camminò verso est per quaranta giorni. La sera stessa era di nuovo in piazza.',
  'Le lettere che brillano nel terreno... non toccarle in ordine sbagliato. Il cielo si strappa.',
  'Dicono che una parola tenga fermo tutto il regno: «carpet». Ma fermo rispetto a cosa?',
  'Se scrivi qualcosa di sbagliato, il mondo si incrina. Rimetti le rune a posto, e si ricuce.',
  "Il vecchio mago diceva: «zero è la forza dell'oblio». Non ho mai capito cosa intendesse.",
  'Hai mai notato che il bordo del mondo è sempre a quarantaquattro passi?',
  "Ho visto un tale incidere «carpet . active = false» su una pietra. Poi è sparito oltre l'orizzonte.",
  "Quando il mondo si spezza, alcuni dicono «R» ad alta voce. E il tempo torna all'ultimo ricordo buono.",
  'Le rune isolate dicono il vero: guarda la «x» e capirai dove sei davvero.',
];

const CAT = ['Miao.', 'Il gatto ti fissa. Per un istante i suoi occhi sono due «0».', 'Il gatto si struscia contro una runa e fa le fusa.', 'Mrrr... (sembra camminare sempre nello stesso punto)'];

export class MockProvider implements AIProvider {
  readonly name = 'mock';
  /** Probability that a first answer is corrupted, to exercise the validator. */
  corruptRate = 0.15;

  async generateChunk(req: ChunkRequest): Promise<ChunkContent> {
    await delay(20 + (hashStr(`${req.cx},${req.cy}`) % 60));
    const rng = new Rng(hashStr(`chunk|${req.seed}|${req.cx}|${req.cy}|${req.attempt}`));
    const counts: Record<string, number> = {};
    for (const t of req.tiles) counts[t] = (counts[t] ?? 0) + 1;
    const biome = (counts['t'] ?? 0) > 70 ? 'forest' : (counts['w'] ?? 0) > 50 ? 'water' : (counts['r'] ?? 0) > 40 ? 'rock' : 'plain';
    const lex = PLACES[biome];
    const place = { name: `${rng.pick(lex.nouns)} ${rng.pick(SUFFIX)}`, description: rng.pick(lex.descr) };

    const runes: GeneratedRune[] = [];
    const used = new Set<string>();
    // The first square always offers a way in: a symbol to watch, an assignment, a carpet field.
    const start = req.cx === 0 && req.cy === 0;
    const forced = start ? ['x', 'speed = speed', 'carpet . active'] : [];
    const count = start ? forced.length : rng.chance(0.35) ? 0 : 1 + rng.int(3);
    const widthOf = (line: string) => tokenize(line).reduce((w, t) => w + t.length, 0);
    const catalog = req.catalog.filter((f) => widthOf(f.line) <= req.size - 2);
    const total = catalog.reduce((n, f) => n + f.weight, 0);
    for (let n = 0; n < count && total > 0; n++) {
      let pick = rng.next() * total;
      const frag = forced[n] ? { line: forced[n] } : (catalog.find((f) => (pick -= f.weight) < 0) ?? catalog[0]);
      const width = widthOf(frag.line);
      for (let tries = 0; tries < 20; tries++) {
        const col = 1 + rng.int(req.size - 1 - width);
        const row = 1 + rng.int(req.size - 2);
        let ok = true;
        for (let i = -1; i <= width && ok; i++) if (used.has(`${col + i},${row}`)) ok = false;
        for (let i = 0; i < width && ok; i++) if (req.palette[req.tiles[row * req.size + col + i]]?.solid !== false) ok = false;
        if (!ok) continue;
        for (let i = 0; i < width; i++) used.add(`${col + i},${row}`);
        runes.push({ line: frag.line, col, row });
        break;
      }
    }
    // A careless model: drops the last token of a line, producing code that does not compile.
    if (!start && req.attempt === 0 && runes.length && rng.chance(this.corruptRate)) {
      const r = runes[0];
      const tokens = tokenize(r.line);
      r.line = tokens.length > 1 ? tokens.slice(0, -1).join(' ') : `${r.line} =`;
    }
    return { place, runes };
  }

  async generateText(req: TextRequest): Promise<string> {
    await delay(120);
    const rng = new Rng(hashStr(`text|${req.seed}|${req.speaker}|${JSON.stringify(req.context)}`));
    if (req.kind === 'read') {
      const steps = Math.round(Number(req.context.distanceToEdge ?? 44));
      return rng.pick([
        `⟶ Bordo del Regno: ${steps} passi.`,
        `«Viandante: il confine dista ${steps} passi. Lo dista da sempre.»`,
        `⟵ Valmora: 0 passi   ⟶ Fine del mondo: ${steps} passi`,
        '«Ciò che è scritto, accade.» — incisione anonima',
      ]);
    }
    if (req.persona.includes('gatto')) return rng.pick(CAT);
    const talks = Number(req.context.talks ?? 0);
    if (req.persona.startsWith('generato:')) {
      const who = req.persona.slice('generato:'.length);
      return rng.pick([`Sono ${who}. Mi hanno scritto da poco, sento ancora l'inchiostro.`, `${who}, per servirti. Il mio codice è giovane, ma valido.`, 'Qualcuno fuori dal mondo mi ha chiesto di esistere. Ed eccomi.']);
    }
    return VILLAGER[(talks + rng.int(3)) % VILLAGER.length];
  }

  async generateModule(req: ModuleRequest): Promise<ModuleResult> {
    await delay(300);
    const STOP = new Set(['un', 'una', 'uno', 'il', 'lo', 'la', 'i', 'gli', 'le', 'che', 'di', 'del', 'della', 'con', 'e', 'a', 'crea', 'aggiungi', 'voglio', 'fammi', 'genera', 'nuovo', 'nuova', 'personaggio', 'npc']);
    const words = req.prompt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]+/g) ?? [];
    const noun = words.find((w) => !STOP.has(w) && w.length > 2) ?? 'viandante';
    let id = `npc.${noun}`;
    for (let i = 2; req.existingIds.includes(id); i++) id = `npc.${noun}-${i}`;
    const name = noun[0].toUpperCase() + noun.slice(1);
    const hue = hashStr(noun) % 360;
    const manifest = {
      id,
      name,
      kind: 'entity',
      version: '0.1.0',
      description: `Generato dall'agente: ${req.prompt}`,
      logic: 'logic.lua',
      appearance: { glyph: name[0], color: `hsl(${hue} 70% 70%)`, imagePrompt: `${req.prompt}, ${req.theme}, pixel art top-down` },
      physics: { solid: false, radius: 0.35 },
      components: { wander: { dx: 0, dy: 0, t: 0, speed: 1 } },
      interaction: { type: 'talk', persona: `generato:${name}` },
      spawn: { tiles: ['g', 'p', 'f'], chance: 0.25, max: 1 },
      prompts: { dialogue: req.prompt },
    };
    const logic = `-- ${name}: modulo generato dall'agente.\n-- Richiesta: ${req.prompt.replace(/\n/g, ' ')}\nlocal M = {}\n\nfunction M.on_spawn(id)\n  log("${name} è apparso", id)\nend\n\nreturn M\n`;
    const dir = `modules/${id}/`;
    return { id, summary: `Nuovo abitante «${name}» (${id})`, files: { [`${dir}manifest.json`]: JSON.stringify(manifest, null, 2) + '\n', [`${dir}logic.lua`]: logic } };
  }

  async generateImage(_req: ImageRequest): Promise<string | null> {
    return null;
  }
}
