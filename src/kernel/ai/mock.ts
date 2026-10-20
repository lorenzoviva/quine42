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

const NAMES = ['Berta', 'Gualtiero', 'Ilde', 'Ottone', 'Mirella', 'Tancredi', 'Gemma', 'Ugolino', 'Fiora', 'Corrado', 'Agnese', 'Bastiano'];
const STOCK: Array<[string, string, string, number, number, string[], Record<string, number>?]> = [
  ['Fiasco di vino', 'bevanda', 'un fiasco impagliato', 1.2, 4, ['locanda', 'cucina'], { thirst: 20, energy: -5 }],
  ['Castagne secche', 'cibo', 'un sacchetto di castagne', 0.3, 10, ['bosco', 'cucina'], { hunger: 15 }],
  ['Ago e filo', 'attrezzo', 'per rammendare', 0.05, 5, ['stoffa', 'casa']],
  ['Falcetto', 'attrezzo', "una piccola falce per l'erba", 0.8, 1, ['contadino', 'taglio', 'metallo']],
  ['Fune di canapa', 'materiale', 'corda robusta', 0.8, 5, ['bottega']],
  ['Lucerna', 'luce', 'una lampada a olio di terracotta', 0.5, 1, ['luce', 'casa']],
  ['Ricotta', 'cibo', 'ricotta fresca in un canestro', 0.5, 3, ['cucina', 'contadino'], { hunger: 20 }],
  ['Erba medica', 'medicina', 'un mazzetto di erbe che curano', 0.05, 10, ['erbe'], { health: 15 }],
];
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
            { codice: 'g', nome: 'pascolo', descrizione: 'erba rasa da pecore', colore: '#6aa84f', strato: 'ground', solido: false, velocita: 1 },
            { codice: 'p', nome: 'tratturo', descrizione: 'terra battuta dalle greggi', colore: '#c8a868', strato: 'ground', solido: false, velocita: 1.1 },
            { codice: 't', nome: 'macchia', descrizione: 'cespugli e querce basse', colore: '#2f6a2a', strato: 'vegetation', solido: true, velocita: 1 },
            { codice: 'w', nome: 'torrente', descrizione: 'acqua fredda tra i sassi', colore: '#3a78c8', strato: 'liquid', solido: true, velocita: 1 },
            { codice: 'r', nome: 'pietraia', descrizione: 'massi calcarei', colore: '#9a9a92', strato: 'rock', solido: true, velocita: 1 },
            { codice: 'h', nome: 'muro a secco', descrizione: 'pietre sovrapposte', colore: '#8a7a62', strato: 'wall', solido: true, velocita: 1 },
            { codice: 'f', nome: 'pavimento di cotto', descrizione: 'mattonelle rosse', colore: '#b06a4a', strato: 'floor', solido: false, velocita: 1 },
            { codice: 'd', nome: 'uscio', descrizione: 'porta di castagno', colore: '#d8a040', strato: 'door', solido: false, velocita: 1 },
            { codice: 'm', nome: 'orto', descrizione: 'solchi di terra coltivata', colore: '#6e5434', strato: 'ground', solido: false, velocita: 0.8 },
          ],
          tetto: '#8a3a2a',
        };
      case 'genesis.physics':
        return { terreni: [] };
      case 'genesis.layouts':
        return {
          ambienti: [
            {
              id: 'stazzo',
              nome: 'Stazzo',
              descrizione: 'casupole di pietra e recinti per le greggi',
              tipo: 'misto',
              programma_json: JSON.stringify({ type: 'sequence', children: [{ type: 'prl', rules: [{ in: 't', out: 'g', p: 0.8 }] }, { type: 'one', rules: [{ in: 'gggg/gggg/gggg/gggg', out: 'hhhh/hffh/hffh/hdhh' }], steps: 2 }, { type: 'path', from: 'd', to: 'p', on: 'gm', color: 'p', steps: 2 }] }),
            },
            { id: 'macchia', nome: 'Macchia', descrizione: 'boscaglia fitta con radure', tipo: 'esterno', programma_json: JSON.stringify({ type: 'prl', rules: [{ in: 'g', out: 't', p: 0.3 }] }) },
            { id: 'rotto', nome: 'Programma rotto', descrizione: 'non compila', tipo: 'esterno', programma_json: '{"type":"teletrasporta","dove":"altrove"}' },
          ],
        };
      case 'genesis.cast':
        return {
          moduli: [
            { tipo: 'npc', richiesta: 'un vecchio pastore che conta le pecore e perde il conto' },
            { tipo: 'oggetto', richiesta: 'una madia di legno per il pane' },
            { tipo: 'strumento', richiesta: 'un bastone da pastore' },
          ],
        };
      case 'content.items':
        return { oggetti: this.items(d.count ?? 6, d.existing ?? [], d.hints ?? []) };
      case 'content.define':
        return { oggetti: (d.names ?? []).map((n: string) => this.item(n)) };
      case 'content.physics':
        return { correzioni: [] };
      case 'content.review':
        return { approvato: true, problemi: [] };
      case 'content.recipes': {
        const names: string[] = d.names ?? [];
        const ricette = names.length >= 3 ? [{ nome: `${names[names.length - 1]} grezzo`, ingredienti: [{ oggetto: names[names.length - 2], quantita: 1 }], attrezzi: [], risultato: { oggetto: names[names.length - 1], quantita: 1 } }] : [];
        return { ricette, bottino: [{ tabella: 'comune', voci: [{ tag: 'cibo', peso: 3 }, { tag: 'materiale', peso: 2 }] }] };
      }
      case 'npc.individuate': {
        const rng = new Rng(hashStr(`${d.archetype?.name}|${d.ctx?.place}|${Math.random()}`));
        const nome = rng.pick(NAMES);
        const common: string[] = d.ctx?.common ?? [];
        return {
          nome,
          persona: `Sei ${nome}, ${d.archetype?.description ?? ''}. ${d.archetype?.persona ?? ''}`,
          aspetto: rng.pick(['ha le mani screpolate dal lavoro', 'porta un fazzoletto rosso al collo', 'zoppica leggermente', 'ha un sorriso sdentato e gentile']),
          porta: [common.length ? rng.pick(common) : 'pane', common.length > 1 ? rng.pick(common) : 'moneta', 'Fischietto di canna'],
          mestiere: rng.pick(['contadina', 'fornaio', 'pastore', 'tessitrice', 'boscaiolo', 'locandiera']),
          eta: rng.pick(['giovane', 'adulto', 'anziana']),
          storia: `È nata qui e da qui non è mai riuscita ad andarsene, anche se ci ha provato.`,
          // Someone already known becomes family; otherwise a relative not met yet.
          famiglia: (() => {
            const known = [...String(d.ctx?.society ?? '').split('Nominate')[0].matchAll(/^- ([^,]+),/gm)].pop()?.[1];
            return known && known !== nome ? [{ nome: known, legame: rng.pick(['fratello', 'sorella', 'figlio', 'amico', 'rivale']) }] : [{ nome: rng.pick(NAMES.filter((n) => n !== nome)), legame: 'madre' }];
          })(),
          routine: [
            { quando: 'mattina', fa: 'apre le imposte', dove: 'casa' },
            { quando: 'giorno', fa: 'lavora', dove: 'lavoro' },
            { quando: 'sera', fa: 'chiacchiera in piazza', dove: 'piazza' },
            { quando: 'notte', fa: 'dorme', dove: 'casa' },
          ],
        };
      }
      case 'agent.chat': {
        const t = String(d.text ?? '');
        const wants = /\b(crea|creare|aggiungi|fammi|voglio)\b/i.test(t);
        return { risposta: wants ? `Si può fare. Lo passo alla Fucina: «${t}».` : `Sono il ${d.agent}. Qui ogni cosa del mondo è un file: tocca un libro o un cristallo e leggerai come è fatta.`, richiesta_fucina: wants ? t : '' };
      }
      case 'action.judge':
        return this.judgeAction(d);
      case 'genesis.atlas': {
        const special = (d.layouts ?? []).filter((l: { id: string }) => !/^(borgo|bosco|campi|rovine|locanda)$/.test(l.id));
        const dirs = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'];
        return { regioni: special.map((l: { id: string; name: string; description: string }, i: number) => ({ nome: `${l.name} ${SUFFIX[i % SUFFIX.length]}`, descrizione: l.description, ambiente: l.id, direzione: dirs[(i * 3) % 8], distanza: 3 + (i % 5), raggio: 1 })) };
      }
      case 'cartographer.environment': {
        const t = String(d.request ?? '');
        const elves = /elf|fat|incant/i.test(t);
        return {
          id: elves ? 'bosco_elfi' : 'luogo_nuovo',
          nome: elves ? 'Bosco degli Elfi' : t.slice(0, 30),
          descrizione: elves ? 'alberi altissimi e argentei, case sugli alberi, sentieri di luce' : t,
          tipo: 'esterno',
          programma_json: JSON.stringify({ type: 'sequence', children: [{ type: 'prl', rules: [{ in: 'g', out: 'E', p: 0.3 }] }, { type: 'stamp', shape: 'torre', codes: { muro: 'E' } }] }),
          nuovi_terreni: [{ codice: 'E', nome: elves ? 'albero argenteo' : 'pietra strana', colore: '#c8d8e8', strato: 'vegetation', solido: true, descrizione: 'alberi dalla corteccia d\'argento' }],
          regione: { nome: elves ? 'Bosco degli Elfi' : t.slice(0, 30), descrizione: 'dove la luce cade a fili', direzione: 'nord-est', distanza: 4, raggio: 1 },
        };
      }
      case 'council.session':
        return { valutazione: 'Il mondo cresce, ma la piazza è vuota di mestieri.', intervento: 'abitante', richiesta: 'una guaritrice che conosce le erbe del bosco' };
      case 'craft.free': {
        // An honest craftsman: one thing you carry becomes what you ask for, unless it is a marvel.
        const carrying: string[] = (d.carrying ?? []).map((c: string) => c.replace(/ ×\d+$/, '')).filter((c: string) => !/^Runa|Borsa/.test(c));
        const t = String(d.text ?? '');
        if (!carrying.length || /drago|oro|stella|magia/i.test(t)) return { possibile: false, racconto: `Con quello che hai non puoi fare ${t}.` };
        return { possibile: true, racconto: `Lavori ${carrying[0]} con pazienza.`, risultato: t.replace(/^(un|una|uno|il|la)\s+/i, '').replace(/^./, (c) => c.toUpperCase()), descrizione: `${t}, fatto a mano`, quantita: 1, ingredienti: [{ oggetto: carrying[0], quantita: 1 }], attrezzi: [] };
      }
      case 'spell.name': {
        // Combines what the single runes already do, a little stronger.
        const runes: Array<{ token: string; name: string; element: string }> = d.runes ?? [];
        const BASE: Record<string, unknown> = { luce: { tipo: 'luce', raggio: 7, durata: 120 }, fuoco: { tipo: 'fuoco', raggio: 2, durata: 10 }, vita: { tipo: 'bisogni', salute: 30 }, scudo: { tipo: 'scudo', durata: 45 }, vento: { tipo: 'spingi', forza: 7 }, terra: { tipo: 'terreno', a: 'sentiero', raggio: 2 }, acqua: { tipo: 'terreno', a: 'acqua', raggio: 1 } };
        const effetti = [...new Set(runes.map((r) => r.token))].map((t) => BASE[t]).filter(Boolean).slice(0, 3);
        return { nome: runes.map((r) => r.name.slice(0, 3)).join('').replace(/^./, (c) => c.toUpperCase()), descrizione: `Le rune ${runes.map((r) => r.element).join(' e ')} insieme.`, costo: 8 * runes.length, effetti };
      }
      case 'text.examine':
        return { testo: `Osservi ${d.what?.name ?? 'la cosa'} da vicino. ${d.what?.description ?? ''} Per un istante ti sembra di averla già vista, identica, altrove.` };
      default:
        return {};
    }
  }

  /** A plain-minded Council: a verb it recognises becomes an effect, anything else does not happen. */
  private judgeAction(d: any): unknown {
    const ws = words(d.text ?? '');
    const has = (...xs: string[]) => ws.some((w) => xs.some((x) => w.startsWith(x)));
    const name = d.target?.name ?? 'la cosa';
    const label = String(d.text ?? '').trim().replace(/^./, (c: string) => c.toUpperCase()).slice(0, 30);
    if (has('apr', 'forz', 'scassin')) return { possibile: true, racconto: `Fai leva su ${name} finché cede.`, effetti: [d.target?.container ? { tipo: 'apri' } : { tipo: 'contenitore', capienza: 4, bottino: 'cassa' }, { tipo: 'apri' }], ripetibile: true, etichetta: label };
    if (has('romp', 'sfond', 'spacc', 'distrugg')) return { possibile: true, racconto: `Colpisci ${name} con tutta la forza: va in pezzi.`, effetti: [{ tipo: 'distruggi' }, { tipo: 'bisogni', energia: -5 }], ripetibile: true, etichetta: label };
    if (has('bruc', 'incend', 'appicc')) return { possibile: true, racconto: `Le fiamme attecchiscono a ${name}.`, effetti: [{ tipo: 'fuoco', raggio: 1, durata: 8 }], ripetibile: true, etichetta: label };
    if (has('scav')) return { possibile: true, racconto: 'Scavi attorno, la terra si smuove.', effetti: [{ tipo: 'terreno', a: (d.terrains ?? []).find((t: string) => /sentier|terra|strada/.test(t)) ?? d.terrains?.[0], raggio: 1 }], ripetibile: true, etichetta: label };
    if (has('spin', 'calc')) return { possibile: true, racconto: `Dai una spinta a ${name}.`, effetti: [{ tipo: 'spingi', forza: 2 }], ripetibile: true, etichetta: label };
    if (has('riemp')) return { possibile: true, racconto: `Riempi ${name} e bevi; poi è di nuovo vuoto.`, effetti: [{ tipo: 'consuma', oggetto: name }, { tipo: 'bisogni', sete: 10 }], ripetibile: true, etichetta: label };
    if (has('bev', 'sorsegg')) return { possibile: true, racconto: `Bevi da ${name}: l'acqua è fresca.`, effetti: [{ tipo: 'bisogni', sete: 15 }], ripetibile: true, etichetta: label };
    if (has('bussa', 'accarezz', 'ascolt')) return { possibile: true, racconto: `${name} non risponde, ma per un attimo ti sembra di sentire un'eco.`, effetti: [{ tipo: 'messaggio', testo: 'Nulla cambia.' }], ripetibile: false, etichetta: label };
    return { possibile: false, racconto: `Provi, ma ${name} non si lascia ${d.text}.`, effetti: [], ripetibile: false, etichetta: label };
  }

  private item(name: string): unknown {
    const ws = words(name);
    const food = ws.some((w) => EDIBLE.includes(w));
    return { nome: name.trim().replace(/^./, (c) => c.toUpperCase()), descrizione: `${name}, come lo si trova nel regno`, categoria: food ? 'cibo' : 'varie', peso: 0.5, pila: food ? 5 : 1, tag: [food ? 'cucina' : 'casa'], effetti: food ? { fame: 15 } : undefined, impugnabile: false, aspetto: name };
  }

  private items(count: number, existing: string[], hints: string[]): unknown[] {
    const out: unknown[] = hints.slice(0, 2).map((h) => this.item(h));
    for (const [nome, categoria, descrizione, peso, pila, tag, e] of STOCK) {
      if (out.length >= count) break;
      if (existing.includes(nome)) continue;
      out.push({ nome, categoria, descrizione, peso, pila, tag, effetti: e ? { fame: e.hunger, sete: e.thirst, energia: e.energy, salute: e.health } : undefined, impugnabile: categoria === 'attrezzo', aspetto: descrizione });
    }
    return out;
  }

  private plan(ctx: PlanContext): unknown {
    const rng = new Rng(hashStr(`plan|${ctx.cx}|${ctx.cy}|${ctx.attempt}`));
    const forest = /bosco (\d+)%/.exec(ctx.terrain);
    const water = /acqua (\d+)%/.exec(ctx.terrain);
    const biome = forest && +forest[1] > 30 ? 'forest' : water && +water[1] > 20 ? 'water' : 'plain';
    const lex = PLACES[biome];
    const ids = ctx.layouts.map((l) => l.id);
    const neighbour = ctx.neighbors.find((n) => ids.includes(n.layout))?.layout;
    const ambiente = ctx.start
      ? (ids.find((i) => i === 'borgo') ?? ids[0])
      : neighbour && rng.chance(0.4)
        ? neighbour
        : biome === 'forest' && ids.includes('bosco')
          ? 'bosco'
          : rng.pick(ids);
    const oggetti: Array<{ modulo: string; dove: string }> = [];
    for (const m of ctx.catalog) {
      if (oggetti.length >= 6) break;
      const p = m.kind === 'mobile' ? 0.45 : m.kind === 'npc' ? 0.35 : 0.25;
      if (rng.chance(p)) oggetti.push({ modulo: m.id, dove: m.kind === 'mobile' ? 'dentro' : 'fuori' });
    }
    const rune: string[] = [];
    const n = rng.chance(0.4) ? 0 : 1 + rng.int(2);
    for (let i = 0; i < n && ctx.fragments.length; i++) rune.push(rng.pick(ctx.fragments));
    // A careless cartographer: a rune line that does not compile (the validator drops it).
    if (!ctx.start && ctx.attempt === 0 && rune.length && rng.chance(this.corruptRate)) {
      const t = tokenize(rune[0]);
      rune[0] = t.length > 1 ? t.slice(0, -1).join(' ') : `${rune[0]} =`;
    }
    return {
      luogo: { nome: `${rng.pick(lex.nouns)} ${rng.pick(SUFFIX)}`, descrizione: rng.pick(lex.descr) },
      ambiente,
      oggetti,
      a_terra: ctx.wanted.length && rng.chance(0.5) ? [rng.pick(ctx.wanted)] : [],
      nuovi: [],
      rune,
    };
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
      azioni: tipo === 'oggetto' ? [{ id: 'tocca', etichetta: `Tocca ${nome.toLowerCase()}` }] : [],
      contenitore: tipo === 'oggetto' && /madia|cassa|credenza|armadio|baule|cesta|scaffale/.test(req.prompt) ? { capienza: 6, bottino: 'cucina' } : undefined,
      porta: tipo === 'npc' ? ['Pagnotta', 'Fune di canapa'] : undefined,
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
    if (c.tipo === 'oggetto') return `-- ${name}: generato offline.\nlocal M = {}\n\nfunction M.on_act(id, user, action)\n  return "${name}. ${c.lore.replace(/"/g, '')}"\nend\n\nfunction M.on_interact(id)\n  return "${name}."\nend\n\nreturn M\n`;
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
    const mention = /\b(?:un|una|uno|del|della|dello)\s+([a-zàèéìòù]{4,})/i.exec(text);
    return { dice: VILLAGER[(npc.history.length + rng.int(3)) % VILLAGER.length], azione: 'nessuna', umore: npc.mood, oggetti_citati: mention ? [mention[1]] : [] };
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
