// Offline models: deterministic, themed (medieval), no network. They answer every agent task from
// its structured `data`, so the whole Council works in tests and without an API key. They cannot
// paint (the renderer then draws layout sketches) and sometimes answer badly on purpose, so the
// discard-and-regenerate path is always exercised.

import { emptyUsage, type ImageCall, type Limits, type Models, type TextCall } from './models';
import { hashStr, Rng } from '../rng';
import { tokenize } from '../runes';
import type { PlanContext } from '../agents/cartography';
import type { Concept, ForgeRequest, PhysicsSpec } from '../agents/forge';
import type { NpcContext } from '../agents/minds';

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

const NPC_WORDS = ['fabbro', 'mercante', 'vecchio', 'vecchia', 'donna', 'uomo', 'bambino', 'bambina', 'guardia', 'mago', 'strega', 'monaco', 'pastore', 'cacciatore', 'eremita', 'oste', 'contadino', 'contadina', 'bardo', 'cavaliere'];
const ITEM_WORDS = ['forbici', 'chiave', 'mela', 'pane', 'lanterna', 'corda', 'spada', 'pozione', 'moneta', 'libro', 'pergamena', 'fiasco', 'ascia', 'martello', 'bacche', 'fungo', 'erba', 'pietra', 'piuma', 'anello'];
const EDIBLE = ['mela', 'pane', 'pozione', 'bacche', 'fungo', 'erba', 'fiasco'];
const STOP = new Set(['un', 'una', 'uno', 'il', 'lo', 'la', 'i', 'gli', 'le', 'che', 'di', 'del', 'della', 'con', 'e', 'a', 'in', 'per', 'crea', 'aggiungi', 'voglio', 'fammi', 'genera', 'nuovo', 'nuova', 'personaggio', 'npc', 'oggetto', 'strumento', 'risultato', 'combinazione']);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]+/g) ?? [];

export class MockModels implements Models {
  readonly name = 'offline';
  readonly canPaint = false;
  readonly usage = emptyUsage();
  limits: Limits = { text: Infinity, images: 0 };
  /** Probability that a first chunk plan is broken on purpose. */
  corruptRate = 0.15;
  latency = 15;

  async text(call: TextCall): Promise<string> {
    this.usage.text++;
    await delay(this.latency);
    return JSON.stringify(this.answer(call));
  }

  async image(_call: ImageCall): Promise<string | null> {
    return null;
  }

  private answer(call: TextCall): unknown {
    const d = (call.data ?? {}) as any;
    switch (call.task) {
      case 'chunk.plan':
        return this.plan(d as PlanContext);
      case 'chunk.survey':
        return { griglia: d.grid, note: 'nessuna differenza' };
      case 'forge.concept':
        return this.concept(d.request as ForgeRequest);
      case 'forge.physics':
        return this.physics(d.concept as Concept);
      case 'forge.code':
        return { logic: this.code(d.concept as Concept), componenti_json: '{}' };
      case 'forge.fix':
        return { logic: `-- ${d.manifest?.name ?? 'modulo'}: riparato offline.\nlocal M = {}\n\nreturn M\n` };
      case 'forge.review':
      case 'genesis.review':
        return { approvato: true, problemi: [] };
      case 'craft.judge':
        return { possibile: false, spiegazione: 'Le provi in ogni modo, ma non succede nulla.' };
      case 'npc.reply':
        return this.reply(d.npc as NpcContext, String(d.playerText ?? ''));
      case 'text.read':
        return { testo: this.sign(d.facts ?? {}, d.what?.name ?? '') };
      case 'genesis.bible':
        return { titolo: 'Il Regno di Valmora', tono: 'meraviglia e sospetto', sintesi: 'Un regno quieto in cui tutti tornano sempre in piazza.', storia: '', luoghi: ['Piazza di Valmora'], personaggi: ['Abitanti di Valmora'], fatti: ['Il bordo è sempre a 44 passi.'], crepe: ['Si torna sempre in piazza.'] };
      case 'genesis.style':
        return { stile: 'pixel art medievale', prospettiva: 'rigorosamente dall\'alto', palette: ['verde', 'ocra', 'blu'], luce: 'diurna morbida', regole: ['niente testo'], protagonista: 'un viandante incappucciato' };
      case 'genesis.terrain':
        return {
          terreni: [
            { codice: 'g', nome: 'prato', descrizione: 'erba bassa', colore: '#4f9a45', solido: false, velocita: 1 },
            { codice: 'p', nome: 'sentiero', descrizione: 'terra battuta', colore: '#c8a868', solido: false, velocita: 1.1 },
            { codice: 't', nome: 'bosco', descrizione: 'alberi fitti', colore: '#1f5a2a', solido: true, velocita: 1 },
            { codice: 'w', nome: 'acqua', descrizione: 'stagni e laghi', colore: '#3a78c8', solido: true, velocita: 1 },
            { codice: 'r', nome: 'roccia', descrizione: 'massi grigi', colore: '#8a8a92', solido: true, velocita: 1 },
          ],
        };
      case 'genesis.physics':
        return { terreni: [] };
      case 'genesis.cast':
        return { moduli: [{ tipo: 'npc', richiesta: 'un vecchio pastore che conta le pecore e perde il conto' }, { tipo: 'strumento', richiesta: 'una mela rossa' }] };
      default:
        return {};
    }
  }

  private plan(ctx: PlanContext): unknown {
    const rng = new Rng(hashStr(`plan|${ctx.cx}|${ctx.cy}|${ctx.attempt}`));
    const tiles = ctx.draft.join('');
    const count = (c: string) => [...tiles].filter((t) => t === c).length;
    const biome = count('t') > tiles.length * 0.27 ? 'forest' : count('w') > tiles.length * 0.2 ? 'water' : count('r') > tiles.length * 0.16 ? 'rock' : 'plain';
    const lex = PLACES[biome];
    const size = ctx.size;
    const walk = (col: number, row: number) => ctx.palette[ctx.draft[row]?.[col]]?.solid === false;

    const used = new Set<string>();
    const rune: Array<{ codice: string; col: number; riga: number }> = [];
    const widthOf = (line: string) => tokenize(line).reduce((w, t) => w + t.length, 0);
    const pool = ctx.fragments.filter((f) => widthOf(f) <= size - 2);
    const forced = ctx.start ? ['x', 'speed = speed', 'carpet . active'] : [];
    const n = ctx.start ? forced.length : rng.chance(0.35) ? 0 : 1 + rng.int(3);
    for (let i = 0; i < n && pool.length; i++) {
      const line = forced[i] ?? rng.pick(pool);
      const width = widthOf(line);
      for (let tries = 0; tries < 30; tries++) {
        const col = 1 + rng.int(size - 1 - width);
        const row = 1 + rng.int(size - 2);
        let ok = true;
        for (let k = -1; k <= width && ok; k++) if (used.has(`${col + k},${row}`)) ok = false;
        for (let k = 0; k < width && ok; k++) if (!walk(col + k, row)) ok = false;
        if (!ok) continue;
        for (let k = 0; k < width; k++) used.add(`${col + k},${row}`);
        rune.push({ codice: line, col, riga: row });
        break;
      }
    }

    const oggetti: Array<{ modulo: string; col: number; riga: number }> = [];
    for (const m of ctx.catalog) {
      if (oggetti.length >= 3 || !rng.chance(m.kind === 'item' ? 0.25 : 0.3)) continue;
      for (let tries = 0; tries < 12; tries++) {
        const col = rng.int(size);
        const row = rng.int(size);
        const tile = ctx.draft[row]?.[col];
        if (!walk(col, row) || (m.tiles.length && !m.tiles.includes(tile)) || used.has(`${col},${row}`)) continue;
        if (ctx.start && col < 3 && row < 3) continue;
        used.add(`${col},${row}`);
        oggetti.push({ modulo: m.id, col, riga: row });
        break;
      }
    }

    // A careless cartographer: a rune line that does not compile.
    if (!ctx.start && ctx.attempt === 0 && rune.length && rng.chance(this.corruptRate)) {
      const t = tokenize(rune[0].codice);
      rune[0].codice = t.length > 1 ? t.slice(0, -1).join(' ') : `${rune[0].codice} =`;
    }
    return { luogo: { nome: `${rng.pick(lex.nouns)} ${rng.pick(SUFFIX)}`, descrizione: rng.pick(lex.descr) }, griglia: ctx.draft, oggetti, nuovi: [], rune };
  }

  private concept(req: ForgeRequest): Concept {
    const ws = words(req.prompt);
    const noun = ws.find((w) => NPC_WORDS.includes(w) || ITEM_WORDS.includes(w)) ?? ws.find((w) => !STOP.has(w) && w.length > 2) ?? 'viandante';
    const tipo = req.kind ?? (NPC_WORDS.includes(noun) ? 'npc' : ITEM_WORDS.includes(noun) ? 'strumento' : 'oggetto');
    const nome = noun[0].toUpperCase() + noun.slice(1);
    const edible = EDIBLE.includes(noun);
    return {
      nome,
      tipo,
      descrizione: req.prompt,
      lore: `Nessuno ricorda da quando ${tipo === 'npc' ? 'vive' : 'si trova'} qui.`,
      aspetto: `${req.prompt}, visto dall'alto`,
      contesto: { terreni: req.paletteCodes.filter((c) => c === 'g' || c === 'p'), luoghi: 'prati e sentieri', rarita: 0.2 },
      interazione: tipo === 'npc' ? 'parla' : tipo === 'oggetto' ? 'usa' : 'nessuna',
      comandi: tipo === 'strumento' ? [edible ? { azione: 'usa', descrizione: 'mangialo' } : { azione: 'azione', descrizione: 'usalo su ciò che hai davanti' }] : [],
      unico: tipo === 'npc' && !/gatto|cane|pecora|uccello|corvo/.test(req.prompt.toLowerCase()),
      persona: tipo === 'npc' ? `Sei ${nome}, ${req.prompt}. Parli poco, con frasi semplici. Sai che chi cammina torna sempre in piazza, ma non ne parli volentieri.` : undefined,
      tags: tipo === 'oggetto' ? ['tagliabile'] : [],
    };
  }

  private physics(c: Concept): PhysicsSpec {
    const npc = c.tipo === 'npc';
    const item = c.tipo === 'strumento';
    return { solido: !npc && !item, spingibile: false, massa: npc ? 70 : item ? 0.5 : 40, attrito: 0.6, raggio: npc ? 0.35 : item ? 0.25 : 0.45, velocita: npc ? 1.1 : 0, peso: item ? 1 : 0, impilabile: item && EDIBLE.includes(words(c.nome)[0] ?? ''), max_pila: 10, equipaggiabile: item && !c.comandi.some((x) => x.azione === 'usa') };
  }

  private code(c: Concept): string {
    const name = c.nome.replace(/"/g, '');
    if (c.tipo === 'strumento') {
      if (c.comandi.some((x) => x.azione === 'usa'))
        return `-- ${name}: generato offline.\nlocal M = {}\n\nfunction M.on_use(user, item)\n  inventory.remove(user, item, 1)\n  return "Hai consumato: ${name}."\nend\n\nreturn M\n`;
      return `-- ${name}: generato offline.\nlocal M = {}\n\nfunction M.on_action(user, target, item)\n  if not target then return "Non c'è niente davanti a te." end\n  if world.has_tag(target, "tagliabile") then\n    world.break_entity(target)\n    return "Fatto."\n  end\n  return "Non funziona su questo."\nend\n\nreturn M\n`;
    }
    if (c.tipo === 'oggetto') return `-- ${name}: generato offline.\nlocal M = {}\n\nfunction M.on_interact(id)\n  return "${name}. ${c.lore.replace(/"/g, '')}"\nend\n\nreturn M\n`;
    return `-- ${name}: generato offline. Il dialogo è simulato dal Narratore (persona).\nlocal M = {}\n\nfunction M.on_spawn(id)\nend\n\nreturn M\n`;
  }

  private reply(npc: NpcContext, text: string): unknown {
    const t = text.toLowerCase();
    const rng = new Rng(hashStr(`${npc.name}|${npc.history.length}|${text}`));
    if (npc.persona.includes('gatto')) return { dice: rng.pick(CAT), azione: rng.chance(0.3) ? 'segui' : 'nessuna', umore: 'felino' };
    if (/segui|vieni|accompagn/.test(t)) return { dice: 'Va bene, ti seguo. Tanto si torna sempre qui.', azione: 'segui', umore: 'curioso' };
    if (/ferm|aspett|resta/.test(t)) return { dice: 'Resto qui. Il mondo verrà da me.', azione: 'resta', umore: 'calmo' };
    if (/vai|lascia|addio/.test(t)) return { dice: 'Torno ai miei giri.', azione: 'vaga', umore: 'tranquillo' };
    if (/dammi|hai qualcosa|regal|scambi/.test(t) && npc.carrying.length) return { dice: `Tieni, prendi questo: ${npc.carrying[0]}.`, azione: 'dai', oggetto: npc.carrying[0], umore: 'generoso' };
    return { dice: VILLAGER[(npc.history.length + rng.int(3)) % VILLAGER.length], azione: 'nessuna', umore: npc.mood };
  }

  private sign(facts: Record<string, unknown>, name: string): string {
    const steps = Math.round(Number(facts.distanceToEdge ?? 44));
    const rng = new Rng(hashStr(`${name}|${steps}`));
    return rng.pick([
      `⟶ Bordo del Regno: ${steps} passi.`,
      `«Viandante: il confine dista ${steps} passi. Lo dista da sempre.»`,
      `⟵ Valmora: 0 passi   ⟶ Fine del mondo: ${steps} passi`,
      '«Ciò che è scritto, accade.» — incisione anonima',
    ]);
  }
}
