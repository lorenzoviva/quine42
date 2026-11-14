// Offline models: deterministic, themed (medieval), no network. They answer every agent task from
// its structured `data`, so the whole Council works in tests and without an API key. They sometimes
// answer badly on purpose, so the discard-and-regenerate path is always exercised.

import { emptyUsage, type Limits, type AiModels, type TextCall } from './models';
import { ruleDecisions, type DecisionCall, type DecisionModels, type Decisions } from './decisions';
import { hashStr, Rng } from '../rng';
import { tokenize } from '../runes';
import type { PlanContext } from '../agents/cartography';
import type { Concept, ForgeRequest, PhysicsSpec } from '../agents/forge';
import type { NpcContext } from '../agents/minds';
import { fallbackDeath } from '../gameSetup';
import { italianName } from '../internalNames';
import { symbolTokens } from '../../mj/symbols';

const PLACES: Record<string, { nouns: string[]; descr: string[] }> = {
  forest: {
    nouns: ['Bosco', 'Selva', 'Macchia', 'Foresta'],
    descr: ['Gli alberi crescono in file troppo ordinate.', 'Il vento muove le foglie tutte nello stesso istante.', 'Tra i tronchi qualcosa scorre, come un nastro sotto i piedi.'],
  },
  water: {
    nouns: ['Lago', 'Guado', 'Stagno', 'Palude'],
    descr: ["L'acqua è fredda e limpida.", 'Le onde arrivano a riva lente, portando foglie.', 'Sul fondo si vedono sassi lisci e qualche pesce.'],
  },
  rock: {
    nouns: ['Colle', 'Rupe', 'Altura', 'Cava'],
    descr: ['Le pietre sono coperte di muschio.', 'Da quassù si vedono i tetti del borgo.', "L'eco ripete i tuoi passi."],
  },
  plain: {
    nouns: ['Piana', 'Radura', 'Prato', 'Campagna', 'Borgo'],
    descr: ["L'erba si piega al vento.", 'Un sentiero di pecore attraversa il prato.', 'In lontananza suona una campana.', 'Qualcuno ha lasciato un cesto vuoto sul sasso.'],
  },
};
const SUFFIX = ['di Valmora', 'dei Sussurri', 'del Re Muto', 'delle Lanterne', 'Senza Ritorno', "dell'Eco", 'del Primo Passo', 'delle Rune', 'del Nastro', 'Immobile'];

const VILLAGER = [
  'Benvenuto a Valmora, viandante. Il pane del forno di piazza è il migliore del regno.',
  'Mio nonno camminò verso est per quaranta giorni. Dice che la strada lo riportò a casa: io dico che sbagliava strada.',
  'Le lettere che brillano nel terreno? Mia madre diceva di non toccarle in ordine sbagliato. Superstizioni.',
  'Al mercato di domani arrivano i tessitori dal nord: se cerchi stoffa buona, è il momento.',
  'Le guardie del castello pagano bene chi porta notizie dei briganti del bosco.',
  'Dicono che il vecchio mago della torre sappia leggere le rune. Io non ci andrei, di notte.',
  'Se hai sete, il pozzo dietro la locanda ha l’acqua più fresca.',
  "Ho perso una pecora nel bosco dei sussurri. Se la trovi, ti offro una forma di formaggio.",
  'Il fabbro dice che quest’inverno sarà lungo: sta già forgiando ferri per le slitte.',
  'Le rune isolate portano fortuna, dicono. Io ne tengo una sotto il cuscino.',
];
const CAT = ['Miao.', 'Il gatto ti fissa, poi si lecca una zampa con aria di superiorità.', 'Il gatto si struscia contro una runa e fa le fusa.', 'Mrrr... (insegue una farfalla e la perde)'];

const NPC_WORDS = ['fabbro', 'mercante', 'vecchio', 'vecchia', 'donna', 'uomo', 'bambino', 'bambina', 'guardia', 'mago', 'strega', 'monaco', 'pastore', 'cacciatore', 'eremita', 'oste', 'contadino', 'contadina', 'bardo', 'cavaliere'];
const ITEM_WORDS = ['forbici', 'chiave', 'mela', 'pane', 'lanterna', 'corda', 'spada', 'pozione', 'moneta', 'libro', 'pergamena', 'fiasco', 'ascia', 'martello', 'bacche', 'fungo', 'erba', 'pietra', 'piuma', 'anello'];
const EDIBLE = ['mela', 'pane', 'pozione', 'bacche', 'fungo', 'erba', 'fiasco'];
const STOP = new Set(['un', 'una', 'uno', 'il', 'lo', 'la', 'i', 'gli', 'le', 'che', 'di', 'del', 'della', 'con', 'e', 'a', 'in', 'per', 'crea', 'aggiungi', 'voglio', 'fammi', 'genera', 'nuovo', 'nuova', 'personaggio', 'npc', 'oggetto', 'strumento', 'risultato', 'combinazione']);

const NAMES = ['Berta', 'Gualtiero', 'Ilde', 'Ottone', 'Mirella', 'Tancredi', 'Gemma', 'Ugolino', 'Fiora', 'Corrado', 'Agnese', 'Bastiano'];
const STOCK: Array<[string, string, string, number, number, string[], Record<string, number>?]> = [
  ['Fiasco di vino', 'drink', 'un fiasco impagliato', 1.2, 4, ['locanda', 'cucina'], { thirst: 20, energy: -5 }],
  ['Castagne secche', 'food', 'un sacchetto di castagne', 0.3, 10, ['bosco', 'cucina'], { hunger: 15 }],
  ['Ago e filo', 'tool', 'per rammendare', 0.05, 5, ['stoffa', 'casa']],
  ['Falcetto', 'tool', "una piccola falce per l'erba", 0.8, 1, ['contadino', 'taglio', 'metallo']],
  ['Fune di canapa', 'material', 'corda robusta', 0.8, 5, ['bottega']],
  ['Lucerna', 'light', 'una lampada a olio di terracotta', 0.5, 1, ['luce', 'casa']],
  ['Ricotta', 'food', 'ricotta fresca in un canestro', 0.5, 3, ['cucina', 'contadino'], { hunger: 20 }],
  ['Erba medica', 'medicine', 'un mazzetto di erbe che curano', 0.05, 10, ['erbe'], { health: 15 }],
];
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]+/g) ?? [];

/**
 * The offline Sculptor's program when the library has none of the class (T336, ADR-0176): on the ground a goal and a walker, the walker
 * goes down the potential of a `field` toward the goal leaving a wall, which then rises to the top of the box. It passes the validator.
 */
/** The `<worn>` section the offline Sculptor writes for a zone (T290): the second letter of the program's values, one voxel over the zone. */
export function mockWorn(program: string, zone: string): string {
  const values = /<(?!!)[a-z]+\b[^>]*\svalues="([^"]*)"/i.exec(program.replace(/<!--[\s\S]*?-->/g, ''))?.[1] ?? '';
  const main = symbolTokens(values).filter((t) => t.code !== undefined && !t.error)[1]?.text ?? 'W';
  const rules = zone === 'back' ? [`[rm]/z`, `[rm] z`].map((i) => `<rule in="${i}" out="${main}${i.slice(4)}"/>`) : [`<rule in="[rm] z" out="${main} z"/>`, `<rule in="[rm]z" out="${main}z"/>`, `<rule in="z[rm]" out="z${main}"/>`, `<rule in="[rm]/z" out="${main}/z"/>`];
  return `<worn zone="${zone}">\n  <all>${rules.join('')}</all>\n</worn>`;
}

export const MOCK_FIELD_PROGRAM = `<sequence values="BCRGW" ground="C" symmetry="(xy)">
  <one in="B C" out="G *" steps="1"/>
  <one in="B C" out="R *" steps="1"/>
  <one temperature="0.2" steps="60">
    <in>RB</in><out>WR</out>
    <field for="R" to="G" on="B"/>
  </one>
  <all in="B W" out="W *"/>
  <prl><rule in="R" out="W"/><rule in="G" out="W"/></prl>
</sequence>`;
export class MockAiModels implements AiModels, DecisionModels {
  readonly name = 'offline';
  readonly usage = emptyUsage();
  /** Closed decisions answered (ADR-0157): always with today's rule. */
  decided = 0;
  limits: Limits = { text: Infinity };
  /** Probability that a first chunk plan is broken on purpose. */
  corruptRate = 0.15;
  latency = 15;
  /** Individuals drawn so far: each a different individual, the same ones in every run (T35). */
  private drawn = 0;

  /** A closed decision (ADR-0157): the local models answer with the rule the kernel brings, so the game without a key is the game of before. */
  async decide(call: DecisionCall): Promise<Decisions> {
    this.decided++;
    return ruleDecisions(call);
  }

  async text(call: TextCall): Promise<string> {
    this.usage.text++;
    await delay(this.latency);
    const a = this.answer(call);
    // Programs (the Sculptor's) are text, not JSON.
    return typeof a === 'string' ? a : JSON.stringify(a);
  }

  private answer(call: TextCall): unknown {
    const d = (call.data ?? {}) as any;
    switch (call.task) {
      case 'chunk.plan':
        return this.plan(d as PlanContext);
      case 'forge.concept':
        return this.concept((d.request ?? { prompt: call.prompt }) as ForgeRequest);
      case 'forge.physics':
        return this.physics((d.concept ?? { name: 'Cosa', type: 'object', description: call.prompt, look: call.prompt, class: 'object' }) as Concept);
      case 'forge.code':
        return { logic: this.code((d.concept ?? { name: 'Cosa', type: 'object', description: call.prompt, look: call.prompt, class: 'object' }) as Concept), components_json: '{}' };
      case 'forge.fix':
        return { logic: `-- ${d.manifest?.name ?? 'modulo'}: riparato offline.\nlocal M = {}\n\nreturn M\n` };
      case 'forge.review':
      case 'genesis.review':
        return { approved: true, problems: [] };
      case 'craft.judge':
        return { possible: false, reason: 'Le provi in ogni modo, ma non succede nulla.' };
      case 'npc.reply':
        return this.reply(d.npc as NpcContext, String(d.wandererText ?? ''));
      case 'text.read':
        return { text: this.sign(d.facts ?? {}, d.what?.name ?? '') };
      case 'genesis.bible':
        return { mysteries: ['i vecchi non calpestano le rune: dicono che porti sfortuna'], title: 'Il Regno di Valmora', tone: 'concreto e caldo', summary: 'Un regno quieto di prati, boschi e borghi.', history: '', places: ['Piazza di Valmora'], characters: ['Abitanti di Valmora'], facts: ['Il pane del forno di piazza è famoso in tutto il regno.'], customs: ['Chi sforna il primo pane del giorno lo lascia sulla soglia per il primo che passa.'] };
      case 'genesis.style':
        return { style: 'voxel medievale, semplice e caldo', shapes: 'persone tozze dalla testa grande, case basse', palette: ['verde', 'ocra', 'blu'], light: 'diurna morbida', rules: ['niente testo'], protagonist: 'un viandante incappucciato' };
      case 'model.sculpt': {
        // Offline the Sculptor answers with the library's hand-written program of the class; without one, a program of the nodes of
        // T333-T336 (a field leads a walker to its goal, the rule written in <in>/<out> children), which holds in every box but a procedural one.
        const program = String(d.example ?? MOCK_FIELD_PROGRAM);
        // A thing worn (T290): a section for its zone, a layer of its main letter over the zone, as the prompt asks.
        return d.worn ? `${program.trimEnd()}\n${mockWorn(program, String(d.worn))}\n` : program;
      }
      case 'sound.compose': {
        // Offline the Musician plays the library's hand-written program a little faster or slower: it passes every check, and it is not the same text.
        const r = d.request ?? {};
        const n = hashStr(String(r.richiesta));
        const program = String(d.example ?? '').replace(/bpm="(\d+)"/, (_, b) => `bpm="${Number(b) + (n % 13) - 6}"`);
        return { name: r.nome ?? `Aria ${SUFFIX[n % SUFFIX.length]}`, program, use: r.uso ?? 'music', environments: r.ambienti ?? (d.world?.ambienti ?? []).filter((a: string) => String(r.richiesta).includes(a) || String(r.richiesta).includes(italianName('ambienti', a))), moments: r.momenti ?? [] };
      }
      case 'model.action': {
        // Offline the Sculptor recolours part of the most used letter (or chips it away, if it cracks).
        const ls: Array<{ lettera: string }> = d.letters ?? [];
        const r = d.request ?? {};
        const chip = /scheggi|ammacc|incid|crep|romp/.test(`${r.testo} ${r.cambia}`);
        const to = chip || ls.length < 2 ? d.background : ls[1].lettera;
        return `<action name="${r.azione}" label="${r.etichetta}"><prl in="${ls[0]?.lettera ?? 'C'}" out="${to}" p="0.3" steps="1"/></action>`;
      }
      case 'model.judge':
        return { score: 7, recognizable: true, problems: [], advice: [] };
      case 'genesis.terrain':
        return {
          terrains: [
            { code: 'g', name: 'pascolo', description: 'erba rasa da pecore', color: '#6aa84f', layer: 'ground', solid: false, speed: 1 },
            { code: 'p', name: 'tratturo', description: 'terra battuta dalle greggi', color: '#c8a868', layer: 'ground', solid: false, speed: 1.1 },
            { code: 't', name: 'macchia', description: 'cespugli e querce basse', color: '#2f6a2a', layer: 'vegetation', solid: true, speed: 1 },
            { code: 'w', name: 'torrente', description: 'acqua fredda tra i sassi', color: '#3a78c8', layer: 'liquid', solid: true, speed: 1 },
            { code: 'r', name: 'pietraia', description: 'massi calcarei', color: '#9a9a92', layer: 'rock', solid: true, speed: 1 },
            { code: 'h', name: 'muro a secco', description: 'pietre sovrapposte', color: '#8a7a62', layer: 'wall', solid: true, speed: 1 },
            { code: 'f', name: 'pavimento di cotto', description: 'mattonelle rosse', color: '#b06a4a', layer: 'floor', solid: false, speed: 1 },
            { code: 'd', name: 'uscio', description: 'porta di castagno', color: '#d8a040', layer: 'door', solid: false, speed: 1 },
            { code: 'm', name: 'orto', description: 'solchi di terra coltivata', color: '#6e5434', layer: 'ground', solid: false, speed: 0.8 },
            { code: 's', name: 'sabbia', description: 'sabbia dorata', color: '#d8c27a', layer: 'ground', solid: false, speed: 0.85 },
            { code: 'j', name: 'boscaglia', description: 'intrico di rovi e liane', color: '#1f6b34', layer: 'vegetation', solid: true, speed: 1 },
            { code: 'o', name: 'mare', description: 'acque profonde', color: '#1d4f8a', layer: 'liquid', solid: true, speed: 1 },
            { code: 'k', name: 'monte', description: 'pareti di calcare', color: '#6e6a66', layer: 'rock', solid: true, speed: 1 },
            { code: 'n', name: 'neve', description: 'neve alta', color: '#e8eef2', layer: 'ground', solid: false, speed: 0.7 },
            { code: 'b', name: 'muro di pietra', description: 'grosse pietre squadrate', color: '#8a8580', layer: 'wall', solid: true, speed: 1 },
            { code: 'l', name: 'lastricato', description: 'pietre lisce', color: '#9c958c', layer: 'floor', solid: false, speed: 1 },
            { code: 'z', name: 'ponte levatoio', description: 'assi sul fossato', color: '#8b6a42', layer: 'floor', solid: false, speed: 1 },
          ],
          roof: '#8a3a2a',
        };
      case 'genesis.physics':
        return { terrains: [] };
      case 'genesis.layouts':
        return {
          environments: [
            {
              id: 'stazzo',
              name: 'Stazzo',
              description: 'casupole di pietra e recinti per le greggi',
              type: 'mixed',
              program_json: JSON.stringify({ type: 'sequence', children: [{ type: 'prl', rules: [{ in: 't', out: 'g', p: 0.8 }] }, { type: 'one', rules: [{ in: 'gggg/gggg/gggg/gggg', out: 'hhhh/hffh/hffh/hdhh' }], steps: 2 }, { type: 'path', from: 'd', to: 'p', on: 'gm', color: 'p', steps: 2 }] }),
            },
            { id: 'macchia', name: 'Macchia', description: 'boscaglia fitta con radure', type: 'outdoor', program_json: JSON.stringify({ type: 'prl', rules: [{ in: 'g', out: 't', p: 0.3 }] }) },
            { id: 'rotto', name: 'Programma rotto', description: 'non compila', type: 'outdoor', program_json: '{"type":"teletrasporta","dove":"altrove"}' },
          ],
        };
      case 'genesis.cast':
        return {
          modules: [
            { type: 'npc', request: 'un vecchio pastore che conta le pecore e perde il conto' },
            { type: 'object', request: 'una madia di legno per il pane' },
            { type: 'item', request: 'un bastone da pastore' },
          ],
        };
      case 'content.items':
        return { items: this.items(d.count ?? 6, d.existing ?? [], d.hints ?? []) };
      case 'content.define':
        return { items: (d.names ?? []).map((n: string) => this.item(n)) };
      case 'content.physics':
        return { fixes: [] };
      case 'content.review':
        return { approved: true, problems: [] };
      case 'content.recipes': {
        const names: string[] = d.names ?? [];
        const recipes = names.length >= 3 ? [{ name: `${names[names.length - 1]} grezzo`, inputs: [{ item: names[names.length - 2], quantity: 1 }], tools: [], result: { item: names[names.length - 1], quantity: 1 } }] : [];
        return { recipes, loot: [{ table: 'comune', entries: [{ tag: 'food', weight: 3 }, { tag: 'material', weight: 2 }] }] };
      }
      case 'npc.individuate': {
        const rng = new Rng(hashStr(`${d.archetype?.name}|${d.ctx?.place}|${this.drawn++}`));
        // A careful narrator: a name not taken (the kernel says which ones are).
        const avoid: string[] = d.ctx?.avoid ?? [];
        // An individual the master declared (T376): the name and the facts given are kept, the story says them.
        const facts = typeof d.ctx?.facts === 'string' ? d.ctx.facts : undefined;
        const nome = typeof d.ctx?.name === 'string' && d.ctx.name ? d.ctx.name : rng.pick(NAMES.filter((n) => !avoid.includes(n)).length ? NAMES.filter((n) => !avoid.includes(n)) : NAMES);
        const common: string[] = d.ctx?.common ?? [];
        // The bonds of the world with their kinds (T310b), as the Narrator's schema says them.
        const BONDS: Array<[string, string]> = [['fratello', 'sibling'], ['sorella', 'sibling'], ['figlio', 'child'], ['amico', 'friend'], ['rivale', 'rival']];
        return {
          name: nome,
          persona: `Sei ${nome}, ${d.archetype?.description ?? ''}. ${d.archetype?.persona ?? ''}`,
          look: rng.pick(['ha le mani screpolate dal lavoro', 'porta un fazzoletto rosso al collo', 'zoppica leggermente', 'ha un sorriso sdentato e gentile']),
          carries: [common.length ? rng.pick(common) : 'pane', common.length > 1 ? rng.pick(common) : 'moneta', 'Fischietto di canna'],
          job: ((j: string) => (facts ? (/\b(fabbr[oa]|mugnai[oa]|fornai[oa]|pescator[ea]|guardia|locandier[ae]|pastor[ea]|tessitrice|erborist[ae])\b/i.exec(facts)?.[1] ?? j) : j))(rng.pick(['contadina', 'fornaio', 'pastore', 'tessitrice', 'boscaiolo', 'locandiera'])),
          gender: /a$|e$/.test(nome) && !/one$/.test(nome) ? 'female' : 'male',
          age: rng.pick(['giovane', 'adulto', 'anziana']),
          story: facts ? facts.slice(0, 300) : `È nata qui e da qui non è mai riuscita ad andarsene, anche se ci ha provato.`,
          // Someone already known becomes family; otherwise a relative not met yet.
          family: (() => {
            const known = [...String(d.ctx?.society ?? '').split('Nominate')[0].matchAll(/^- ([^,]+),/gm)].pop()?.[1];
            if (known && known !== nome) {
              const [bond, kind] = rng.pick(BONDS);
              return [{ name: known, bond, kind }];
            }
            return [{ name: rng.pick(NAMES.filter((n) => n !== nome)), bond: 'madre', kind: 'parent' }];
          })(),
          routine: [
            { when: 'morning', does: 'apre le imposte', where: 'home' },
            { when: 'day', does: 'lavora', where: 'work' },
            { when: 'evening', does: 'chiacchiera in piazza', where: 'square' },
            { when: 'night', does: 'dorme', where: 'home' },
          ],
          // What they wear (T353): a common garment when the world has one, by the words of its name; an animal nothing. Last, so
          // that the draws before it are those of before.
          wears: ((garments: string[]) => (d.archetype?.specie === 'animal' || !garments.length ? [] : [rng.pick(garments)]))(common.filter((n: string) => /mantell|sciall|cappell|berrett|cappucc|tunic|giubb|grembiul|camici/i.test(n))),
        };
      }
      case 'agent.chat': {
        const t = String(d.text ?? '');
        const wants = /\b(crea|creare|aggiungi|fammi|voglio)\b/i.test(t);
        return { reply: wants ? `Si può fare. Lo passo alla Fucina: «${t}».` : `Sono il ${d.agent}. Qui ogni cosa del mondo è un file: tocca un libro o un cristallo e leggerai come è fatta.`, forge_request: wants ? t : '' };
      }
      case 'action.judge':
        return this.judgeAction(d);
      case 'mechanic.design':
        // A careful engineer: equipment slots whose bonuses become a state of the wanderer (the slots' ids are its own words, the
        // places and the bonuses the ids of T310b; the components of 0.4 in its Lua are ported by the kernel, luaFor0_5).
        return {
          name: 'Equipaggiamento',
          description: 'Slot per indossare e impugnare: armature e vestiti danno difesa e cambiano il passo.',
          panel: {
            title: 'Equipaggiamento',
            elements: [
              { type: 'slot', id: 'head', label: 'Testa', accepts: ['head'] },
              { type: 'slot', id: 'torso', label: 'Corpo', accepts: ['torso', 'clothing'] },
              { type: 'slot', id: 'feet', label: 'Piedi', accepts: ['feet'] },
              { type: 'slot', id: 'weapon', label: 'Arma', accepts: ['weapon'] },
              { type: 'text', label: 'Difesa', field: 'difesa.valore' },
              { type: 'bar', label: 'Salute', field: 'needs.health', max: 100 },
            ],
          },
          components_json: '{"difesa":{"valore":0}}',
          logic: [
            '-- Equipaggiamento: ciò che indossi dà difesa e cambia il passo.',
            'local M = {}',
            'local SLOTS = { "head", "torso", "feet", "weapon" }',
            'function M.on_slot(user, slot, item, panel)',
            '  local difesa, passo = 0, 1',
            '  for _, p in ipairs(SLOTS) do',
            '    local it = ui.slot(panel, p)',
            '    if it then',
            '      difesa = difesa + items.bonus(it, "defense")',
            '      local v = items.bonus(it, "speed")',
            '      if v > 0 then passo = passo * v end',
            '    end',
            '  end',
            '  ecs.set(user, "difesa", { valore = difesa })',
            '  local st = ecs.get(user, "stati") or {}',
            '  st["equipaggiamento"] = { velocita = passo, peso = 0, luce = 0, fino = 0 }',
            '  ecs.set(user, "stati", st)',
            '  if item then return "Ti senti più protetto." end',
            '  return nil',
            'end',
            'return M',
          ].join('\n'),
          cases: [
            {
              title: "Si indossa l'elmo",
              story: "Il viandante mette l'elmo in testa: la difesa sale a 3 e il passo rallenta un poco.",
              items: [{ name: 'Elmo di prova', slot: 'head', bonus_json: '{"defense":3,"speed":0.95}' }],
              steps: [{ type: 'slot', slot: 'head', item: 'Elmo di prova' }],
              duration: 1,
              watch: ['difesa.valore', 'stati.equipaggiamento'],
              lines: [4, 9, 14, 17],
            },
          ],
        };
      case 'referente.coordinate': {
        const t = String(d.text ?? '');
        if (/distrugg.*universo|cancella tutto/i.test(t)) return { reply: 'Questo no.', task: 'none', refusal: "distruggerebbe l'universo" };
        // An individual the master declares (T376): who they are, by name, and where they live («vive a Valdorso», «sta nella Piana»).
        if (/\bindividuo\b|\bsi chiama\b|\bdi nome\b/i.test(t)) {
          const name = /(?:si chiama|di nome)\s+([\p{Lu}][\p{L}']+)/u.exec(t)?.[1];
          const target = /(?:vive|sta|abita|lavora)\s+(?:a|ad|in|nel|nella|nello|al|alla)\s+«?([^«»,.;]+?)»?\s*(?:[,.;]|$)/iu.exec(t)?.[1]?.trim();
          return { reply: 'Lo dico al Narratore.', task: 'individual', request: t, ...(name ? { name } : {}), ...(target ? { target } : {}) };
        }
        // A directive of the master (T374): how the world is made from now on, for the team its words name.
        if (/direttiva|d'ora in (poi|avanti)|da ora in poi/i.test(t)) {
          const section = /nom[ei] dei luoghi|luogh|region|mappa|villagg|città/i.test(t)
            ? 'cartographer'
            : /aspetto|forma|colore|modell|case di|pietra|legno/i.test(t)
              ? 'sculptor-artist'
              : /musica|suon|canzon/i.test(t)
                ? 'musician'
                : /codice|meccanic|fisica|peso/i.test(t)
                  ? 'engineer-physicist'
                  : /storia|storie|trama|personagg|parla|dialog|gente/i.test(t)
                    ? 'narrator'
                    : 'all';
          return { reply: 'La scrivo fra le direttive.', task: 'directive', section, request: t.replace(/^.*?(direttiva|d'ora in (poi|avanti)|da ora in poi)\s*:?\s*/i, '') || t };
        }
        if (/riscolp/i.test(t)) return { reply: 'Lo dico allo Scultore.', task: 'resculpt', target: t.replace(/.*riscolpisci\s+(il |la |lo |l')?/i, '').split(' ')[0], request: t };
        if (/\brun[ae]\b/i.test(t)) return { reply: 'Eccole.', task: 'rune', runes: [t.replace(/.*\brun[ae]\s+/i, '')] };
        if (/musica|brano|canzone|melodia/i.test(t)) return { reply: 'Lo porto al Musicista.', task: 'music', request: t };
        if (/\bcredit[io]\b/i.test(t)) return { reply: 'I crediti non passano dal Concilio.', task: 'none' };
        if (/regola/i.test(t)) return { reply: 'Sarà una regola del mondo.', task: 'rule', request: t.replace(/.*regola:?\s*/i, '') };
        if (/bosco|luogo|regione|castello|deserto/i.test(t)) return { reply: 'Il Cartografo ci pensa.', task: 'environment', request: t };
        if (/personaggio|abitante|persona/i.test(t)) return { reply: 'La Fucina lo farà nascere.', task: 'character', request: t };
        if (/spada|oggetto|strumento|crea/i.test(t)) return { reply: 'Alla Fucina.', task: 'item', request: t };
        return { reply: 'Benvenuto nello studio. Chiedi pure: qui si fa il mondo.', task: 'none' };
      }
      case 'npc.sheet': {
        const w = d.who ?? {};
        const bonds: string[] = Array.isArray(w.bonds) ? w.bonds : [];
        return {
          sheet: [
            `Sei ${w.name ?? 'qualcuno'}, ${w.job ?? 'del posto'}. ${w.persona ?? ''}`.trim(),
            'Parli a frasi corte, con un «bonombo» a chi arriva, e non ti fidi di chi parla troppo.',
            bonds.length ? `Tieni ai tuoi: ${bonds.join(', ')}.` : 'Non hai nessuno, e lo dici come se non pesasse.',
            w.story ? `Ciò che ti ha fatto: ${w.story}` : 'Hai sempre vissuto qui.',
            'Vuoi una giornata tranquilla; temi il freddo e le cattive notizie.',
            'Con uno sconosciuto sei cortese e breve; con chi ti è caro ti sciogli.',
          ].join('\n'),
        };
      }
      case 'npc.dialogue':
        return {
          lines: [
            { who: 'a', say: `${d.b?.name ?? 'Ehi'}, hai sentito anche tu quel rumore stanotte?` },
            { who: 'b', say: d.b?.secrets ? 'Non qui. Ne parliamo dopo.' : 'Sarà stato il vento. Come sempre.' },
          ],
          memory_a: `ha chiesto a ${d.b?.name} del rumore di notte`,
          memory_b: `${d.a?.name} ha fatto domande sul rumore di notte`,
        };
      case 'plot.weave': {
        const names = [...String(d.society ?? '').split('Nominate')[0].matchAll(/^- ([^,]+),/gm)].map((m) => m[1]);
        const [x, y, z] = [names[0], names[1] ?? names[0], names[2] ?? names[0]];
        return {
          title: 'Il rumore sotto la piazza',
          mystery: `${x} scava di notte sotto la piazza: cerca una runa che suo nonno avrebbe sepolto lì. ${y} lo sa e lo copre.`,
          involved: [x, y, z],
          beats: [
            { day: 0, moment: 'night', who: x, where: 'square', what: 'scava in silenzio vicino al pozzo', line: 'Ancora un poco…', clue: 'terra smossa vicino al pozzo' },
            { day: 1, moment: 'morning', who: y, where: 'square', what: 'ricopre la terra smossa', line: 'Nessuno deve vedere.' },
            { day: 1, moment: 'evening', who: z, where: 'home', what: 'scrive una lettera e la nasconde' },
          ],
          quest: { from: z, text: `Porta questa mela a ${x}, e guarda bene cosa ha nelle mani.`, type: 'talk', to: x, reward: 'Lanterna' },
        };
      }
      case 'genesis.atlas': {
        const special = (d.layouts ?? []).filter((l: { id: string }) => !/^(village|woods|fields|ruins|inn)$/.test(l.id));
        const dirs = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
        return { regions: special.map((l: { id: string; name: string; description: string }, i: number) => ({ name: `${l.name} ${SUFFIX[i % SUFFIX.length]}`, description: l.description, environment: l.id, direction: dirs[(i * 3) % 8], distance: 3 + (i % 5), radius: 1 })) };
      }
      case 'cartographer.environment': {
        const t = String(d.request ?? '');
        const elves = /elf|fat|incant/i.test(t);
        return {
          id: elves ? 'bosco_elfi' : 'luogo_nuovo',
          name: elves ? 'Bosco degli Elfi' : t.slice(0, 30),
          description: elves ? 'alberi altissimi e argentei, case sugli alberi, sentieri di luce' : t,
          type: 'outdoor',
          program_json: JSON.stringify({ type: 'sequence', children: [{ type: 'prl', rules: [{ in: 'g', out: 'E', p: 0.3 }] }, { type: 'stamp', shape: 'tower', codes: { wall: 'E' } }] }),
          new_terrains: [{ code: 'E', name: elves ? 'albero argenteo' : 'pietra strana', color: '#c8d8e8', layer: 'vegetation', solid: true, description: 'alberi dalla corteccia d\'argento' }],
          region: { name: elves ? 'Bosco degli Elfi' : t.slice(0, 30), description: 'dove la luce cade a fili', direction: 'north-east', distance: 4, radius: 1 },
        };
      }
      case 'council.session':
        return { assessment: 'Il mondo cresce, ma la piazza è vuota di mestieri.', action: 'inhabitant', request: 'una guaritrice che conosce le erbe del bosco' };
      case 'craft.free': {
        // An honest craftsman: one thing you carry becomes what you ask for, unless it is a marvel.
        const carrying: string[] = (d.carrying ?? []).map((c: string) => c.replace(/ ×\d+$/, '')).filter((c: string) => !/^Runa|Borsa/.test(c));
        const t = String(d.text ?? '');
        if (!carrying.length || /drago|oro|stella|magia/i.test(t)) return { possible: false, story: `Con quello che hai non puoi fare ${t}.` };
        return { possible: true, story: `Lavori ${carrying[0]} con pazienza.`, result: t.replace(/^(un|una|uno|il|la)\s+/i, '').replace(/^./, (c) => c.toUpperCase()), description: `${t}, fatto a mano`, quantity: 1, inputs: [{ item: carrying[0], quantity: 1 }], tools: [] };
      }
      case 'player.death': {
        // The level, literally: what the kernel does when the Narrator is silent.
        const v = fallbackDeath(Number(d.level), Array.isArray(d.carried) ? d.carried : []);
        return { story: v.story, lose_all: v.loseAll, restart: v.restart, effects: v.effects };
      }
      case 'rune.invent': {
        // A rune of an element nobody has yet (T57b): the first of a few that is not taken.
        const known: Array<{ token: string; name: string }> = d.known ?? [];
        const CANDIDATES = [
          // As the prompt asks since T310: the token in Latin like the others, the element an English id, the rest in the language of the world.
          { token: 'sanguis', name: 'Wunjo', glyph: 'ᚹ', color: '#c8323c', element: 'blood', description: 'la vena: lega, scambia, chiama', canon: 'segna i patti: chi la pronuncia dà qualcosa di sé per avere qualcosa' },
          { token: 'glacies', name: 'Isaz', glyph: 'ᛁ', color: '#bfe9ff', element: 'ice', description: 'il gelo: ferma, indurisce', canon: "ferma ciò che scorre: l'acqua, il passo, il fuoco" },
          { token: 'umbra', name: 'Eihwaz', glyph: 'ᛇ', color: '#5a4a7a', element: 'shadow', description: 'il tasso: nasconde, attenua', canon: 'spegne la luce attorno e nasconde chi la pronuncia' },
        ];
        return CANDIDATES.find((c) => !known.some((k) => k.token === c.token || k.name === c.name)) ?? { ...CANDIDATES[0], token: 'tonitrus', name: 'Thurisaz' };
      }
      case 'spell.name': {
        // A program (T57a): the first rune gives the main effect, stronger for every time it is repeated;
        // the others follow, weaker. Order matters: «terra ventus» is not «ventus terra».
        const runes: Array<{ token: string; name: string; element: string }> = d.runes ?? [];
        const s = runes.map((r) => r.token).join(' ');
        if (/^terra ventus terra$/.test(s)) {
          return { name: 'Innalza', description: 'La terra si solleva in una collina.', cost: 24, effects: [{ type: 'relief', delta: 2, radius: 1 }] };
        }
        if (/^ventus terra ventus$/.test(s)) {
          return { name: 'Abbassa', description: 'La terra si abbassa in una conca.', cost: 24, effects: [{ type: 'relief', delta: -2, radius: 1 }] };
        }
        // The terrains by their internal ids (T307a): the validator finds the tile of this world that has it.
        const BASE: Record<string, Record<string, unknown>> = { lux: { type: 'light', radius: 4, duration: 60 }, ignis: { type: 'fire', radius: 1, duration: 6 }, vita: { type: 'needs', health: 15 }, scutum: { type: 'shield', duration: 20 }, ventus: { type: 'push', force: 4 }, terra: { type: 'terrain', to: 'path', radius: 1 }, aqua: { type: 'terrain', to: 'water', radius: 0 } };
        const times = (t: string) => runes.filter((r) => r.token === t).length;
        const scaled = (t: string, k: number) => Object.fromEntries(Object.entries(BASE[t] ?? {}).map(([f, v]) => [f, typeof v === 'number' ? Math.min(f === 'radius' ? 3 : 40, Math.round(v * k)) : v]));
        const order = [...new Set(runes.map((r) => r.token))].filter((t) => BASE[t]);
        const effects = order.map((t, i) => scaled(t, i === 0 ? 1 + times(t) : 0.5 * times(t) + 0.5)).slice(0, 3);
        return { name: runes.map((r) => r.name.slice(0, 3)).join('').replace(/^./, (c) => c.toUpperCase()), description: `Le rune ${runes.map((r) => italianName('elementi', r.element)).join(' e ')} insieme.`, cost: 8 * runes.length, effects };
      }
      case 'text.examine':
        return { text: `Osservi ${d.what?.name ?? 'la cosa'} da vicino. ${d.what?.description ?? ''} Per un istante ti sembra di averla già vista, identica, altrove.` };
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
    // An entity with a shape of its own changes it: the Sculptor will write the rule.
    if (d.shape && has('scheggi', 'ammacc', 'incid', 'accend', 'spegn', 'dipin')) return { possible: true, story: `${name} cambia sotto le tue mani.`, effects: [{ type: 'needs', energy: -2 }], repeatable: true, label, shape: `${name} ${ws.find((w) => /scheggi|ammacc|incid/.test(w)) ? 'si scheggia in parte' : 'cambia colore in parte'}` };
    // Another wanderer (T43b): a blow hurts, care heals (the kernel takes away what the game does not allow).
    if (d.target?.kind === 'another wanderer' && has('colp', 'pugn', 'ferisc', 'picchi')) return { possible: true, story: `Colpisci ${name}.`, effects: [{ type: 'needs', health: -20, energy: -5 }, { type: 'message', text: 'Ahi!' }], repeatable: true, label };
    if (d.target?.kind === 'another wanderer' && has('cur', 'medic', 'fascia')) return { possible: true, story: `Curi ${name}.`, effects: [{ type: 'needs', health: 15 }], repeatable: true, label };
    if (has('apr', 'forz', 'scassin')) return { possible: true, story: `Fai leva su ${name} finché cede.`, effects: [d.target?.container ? { type: 'open' } : { type: 'container', capacity: 4, loot: 'cassa' }, { type: 'open' }], repeatable: true, label };
    if (has('romp', 'sfond', 'spacc', 'distrugg')) return { possible: true, story: `Colpisci ${name} con tutta la forza: va in pezzi.`, effects: [{ type: 'destroy' }, { type: 'needs', energy: -5 }], repeatable: true, label };
    if (has('bruc', 'incend', 'appicc')) return { possible: true, story: `Le fiamme attecchiscono a ${name}.`, effects: [{ type: 'fire', radius: 1, duration: 8 }], repeatable: true, label };
    if (has('scav')) return { possible: true, story: 'Scavi attorno, la terra si smuove.', effects: [{ type: 'terrain', to: (d.terrains ?? []).find((t: string) => /sentier|terra|strada/.test(t)) ?? d.terrains?.[0], radius: 1 }], repeatable: true, label };
    if (has('innalz', 'sollev')) return { possible: true, story: 'La terra si solleva.', effects: [{ type: 'relief', delta: 2, radius: 1 }], repeatable: true, label };
    if (has('abbass', 'spian')) return { possible: true, story: 'La terra si abbassa.', effects: [{ type: 'relief', delta: -2, radius: 1 }], repeatable: true, label };
    if (has('spin', 'calc')) return { possible: true, story: `Dai una spinta a ${name}.`, effects: [{ type: 'push', force: 2 }], repeatable: true, label };
    if (has('mont', 'cavalc', 'sell')) return { possible: true, story: `Sali in sella: ${name} sbuffa e parte al trotto.`, effects: [{ type: 'state', name: 'a cavallo', speed: 1.8, weight: 30, duration: 0 }], repeatable: true, label: 'Monta in sella' };
    if (has('smont', 'scend')) return { possible: true, story: 'Scendi di sella.', effects: [{ type: 'remove_state', name: 'a cavallo' }], repeatable: true, label: 'Scendi di sella' };
    if (has('riemp')) return { possible: true, story: `Riempi ${name} e bevi; poi è di nuovo vuoto.`, effects: [{ type: 'consume', item: name }, { type: 'needs', thirst: 10 }], repeatable: true, label };
    if (has('bev', 'sorsegg')) return { possible: true, story: `Bevi da ${name}: l'acqua è fresca.`, effects: [{ type: 'needs', thirst: 15 }], repeatable: true, label };
    if (d.target?.kind === 'person' && has('figli', 'bambin')) return { possible: true, story: `${name} ti stringe la mano: tra qualche tempo, una nuova vita.`, effects: [{ type: 'birth' }, { type: 'memory', text: 'abbiamo deciso di avere un figlio', weight: 3 }], repeatable: false, label };
    if (d.target?.kind === 'person' && has('abbracc', 'regal')) return { possible: true, story: `${name} sorride, sorpreso.`, effects: [{ type: 'memory', text: 'il viandante è stato gentile', weight: 2 }, { type: 'bond', bond: 'amico' }], repeatable: false, label };
    if (has('bussa', 'accarezz', 'ascolt')) return { possible: true, story: `${name} non risponde, ma per un attimo ti sembra di sentire un'eco.`, effects: [{ type: 'message', text: 'Nulla cambia.' }], repeatable: false, label };
    return { possible: false, story: `Provi, ma ${name} non si lascia ${d.text}.`, effects: [], repeatable: false, label };
  }

  private item(name: string): unknown {
    const ws = words(name);
    const food = ws.some((w) => EDIBLE.includes(w));
    // A garment (T353): a thing of clothing with its place (the ids of T310b), so that whoever names it wears it.
    const slot = /cappell|berrett|cappucc|elm/i.test(name) ? 'head' : /tunic|giubb|grembiul|camici|corazz|vest/i.test(name) ? 'torso' : /mantell|sciall|capp[ae]\b/i.test(name) ? 'back' : undefined;
    if (slot) return { name: name.trim().replace(/^./, (c) => c.toUpperCase()), description: `${name}, come lo portano nel regno`, category: 'clothing', weight: 0.8, stack: 1, tags: ['stoffa'], slot, equippable: false, look: name, shape: 'sack' };
    return { name: name.trim().replace(/^./, (c) => c.toUpperCase()), description: `${name}, come lo si trova nel regno`, category: food ? 'food' : 'misc', weight: 0.5, stack: food ? 5 : 1, tags: [food ? 'cucina' : 'casa'], effects: food ? { hunger: 15 } : undefined, equippable: false, look: name, shape: food ? 'bread' : 'sack' };
  }

  private items(count: number, existing: string[], hints: string[]): unknown[] {
    const out: unknown[] = hints.slice(0, 2).map((h) => this.item(h));
    for (const [name, category, description, weight, stack, tags, e] of STOCK) {
      if (out.length >= count) break;
      if (existing.includes(name)) continue;
      out.push({ name, category, description, weight, stack, tags, effects: e ? { hunger: e.hunger, thirst: e.thirst, energy: e.energy, health: e.health } : undefined, equippable: category === 'tool', look: description, shape: category === 'food' ? 'fruit' : category === 'drink' ? 'bottle' : category === 'tool' ? 'tool' : 'sack' });
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
      ? (ids.find((i) => i === 'village') ?? ids[0])
      : neighbour && rng.chance(0.4)
        ? neighbour
        : biome === 'forest' && ids.includes('woods')
          ? 'woods'
          : rng.pick(ids);
    const objects: Array<{ module: string; where: string }> = [];
    // In the order of the ids of before T307b (`obj.letto`, not `obj.bed`): the offline worlds of the seed stay the ones they were.
    const legacy = (id: string) => italianName('moduli-seme', id);
    for (const m of [...ctx.catalog].sort((a, b) => (legacy(a.id) < legacy(b.id) ? -1 : legacy(a.id) > legacy(b.id) ? 1 : 0))) {
      if (objects.length >= 6) break;
      const p = m.kind === 'furniture' ? 0.45 : m.kind === 'npc' ? 0.35 : 0.25;
      if (rng.chance(p)) objects.push({ module: m.id, where: m.kind === 'furniture' ? 'inside' : 'outside' });
    }
    const runes: string[] = [];
    const n = rng.chance(0.4) ? 0 : 1 + rng.int(2);
    for (let i = 0; i < n && ctx.fragments.length; i++) runes.push(rng.pick(ctx.fragments));
    // A careless cartographer: a rune line that does not compile (the validator drops it).
    if (!ctx.start && ctx.attempt === 0 && runes.length && rng.chance(this.corruptRate)) {
      const t = tokenize(runes[0]);
      runes[0] = t.length > 1 ? t.slice(0, -1).join(' ') : `${runes[0]} =`;
    }
    return {
      place: { name: `${rng.pick(lex.nouns)} ${rng.pick(SUFFIX)}`, description: rng.pick(lex.descr) },
      environment: ambiente,
      objects,
      ground: ctx.wanted.length && rng.chance(0.5) ? [rng.pick(ctx.wanted)] : [],
      fresh: [],
      runes,
      // The start has its bakery: a structure of its own, which the Sculptor writes.
      structures: ctx.start ? [{ concept: 'il forno del borgo' }] : [],
    };
  }

  private concept(req: ForgeRequest): Concept {
    const ws = words(req.prompt);
    const noun = ws.find((w) => NPC_WORDS.includes(w) || ITEM_WORDS.includes(w)) ?? ws.find((w) => !STOP.has(w) && w.length > 2) ?? 'viandante';
    const type = req.kind ?? (NPC_WORDS.includes(noun) ? 'npc' : ITEM_WORDS.includes(noun) ? 'item' : 'object');
    let nome = noun[0].toUpperCase() + noun.slice(1);
    // A careful narrator: no duplicates of what exists.
    const taken = new Set((req.existingNames ?? []).map((n) => n.toLowerCase()));
    if (taken.has(nome.toLowerCase())) {
      const other = (type === 'npc' ? NPC_WORDS : ITEM_WORDS).find((w) => !taken.has(w));
      if (other) nome = other[0].toUpperCase() + other.slice(1);
    }
    const edible = EDIBLE.includes(noun);
    return {
      name: nome,
      type,
      description: req.prompt,
      lore: `Nessuno ricorda da quando ${type === 'npc' ? 'vive' : 'si trova'} qui.`,
      look: req.prompt,
      class: type === 'npc' ? (/gatto|cane|pecora|uccello|corvo|volpe/.test(req.prompt.toLowerCase()) ? 'animal' : 'person') : type === 'item' ? 'object' : 'furniture',
      context: { terrains: (req.paletteCodes ?? ['g', 'p']).filter((c) => c === 'g' || c === 'p'), places: 'prati e sentieri', rarity: 0.2 },
      interaction: type === 'npc' ? 'talk' : type === 'object' ? 'use' : 'none',
      controls: type === 'item' ? [edible ? { action: 'use', description: 'mangialo' } : { action: 'action', description: 'usalo su ciò che hai davanti' }] : [],
      unique: type === 'npc' && !/gatto|cane|pecora|uccello|corvo/.test(req.prompt.toLowerCase()),
      persona: type === 'npc' ? `Sei ${nome}, ${req.prompt}. Parli poco, con frasi semplici. Conosci bene i sentieri attorno al borgo.` : undefined,
      tags: type === 'object' ? ['tagliabile'] : [],
      actions: type === 'object' ? [{ id: 'tocca', label: `Tocca ${nome.toLowerCase()}` }] : [],
      container: type === 'object' && /madia|cassa|credenza|armadio|baule|cesta|scaffale/.test(req.prompt) ? { capacity: 6, loot: 'cucina' } : undefined,
      carries: type === 'npc' ? ['Pagnotta', 'Fune di canapa'] : undefined,
      // A careful narrator (T292): furniture and small things are lifted and set down elsewhere; what is built in place is not.
      ...(type === 'object' ? { takeable: /madia|cassa|credenza|armadio|baule|cesta|scaffale|sgabello|panca|sedia|tavol|botte|forziere|cassett/.test(req.prompt.toLowerCase()) && !/pozzo|forno|statua|altare|fontana|colonna|torre/.test(req.prompt.toLowerCase()) } : {}),
    };
  }

  private physics(c: Concept): PhysicsSpec {
    const npc = c.type === 'npc';
    const item = c.type === 'item';
    const controls = c.controls ?? [];
    return { solid: !npc && !item, pushable: false, mass: npc ? 70 : item ? 0.5 : 40, friction: 0.6, radius: npc ? 0.35 : item ? 0.25 : 0.45, speed: npc ? 1.1 : 0, weight: item ? 1 : 0, stackable: item && EDIBLE.includes(words(c.name ?? '')[0] ?? ''), max_stack: 10, equippable: item && !controls.some((x) => x.action === 'use') };
  }

  private code(c: Concept): string {
    const name = (c.name ?? 'Cosa').replace(/"/g, '');
    const lore = (c.lore ?? '').replace(/"/g, '');
    const controls = c.controls ?? [];
    if (c.type === 'item') {
      if (controls.some((x) => x.action === 'use'))
        return `-- ${name}: generato offline.\nlocal M = {}\n\nfunction M.on_use(user, item)\n  inventory.remove(user, item, 1)\n  return "Hai consumato: ${name}."\nend\n\nreturn M\n`;
      return `-- ${name}: generato offline.\nlocal M = {}\n\nfunction M.on_action(user, target, item)\n  if not target then return "Non c'è niente davanti a te." end\n  if world.has_tag(target, "tagliabile") then\n    world.break_entity(target)\n    return "Fatto."\n  end\n  return "Non funziona su questo."\nend\n\nreturn M\n`;
    }
    if (c.type === 'object') return `-- ${name}: generato offline.\nlocal M = {}\n\nfunction M.on_act(id, user, action)\n  return "${name}. ${lore}"\nend\n\nfunction M.on_interact(id)\n  return "${name}."\nend\n\nreturn M\n`;
    return `-- ${name}: generato offline. Il dialogo è simulato dal Narratore (persona).\nlocal M = {}\n\nfunction M.on_spawn(id)\nend\n\nreturn M\n`;
  }

  private reply(npc: Partial<NpcContext> | undefined, text: string): unknown {
    const t = text.toLowerCase();
    const name = npc?.name ?? 'Villico';
    const histLen = npc?.history?.length ?? 0;
    const persona = npc?.persona ?? '';
    const rng = new Rng(hashStr(`${name}|${histLen}|${text}`));
    if (persona.includes('gatto')) return { say: rng.pick(CAT), action: rng.chance(0.3) ? 'follow' : 'none', mood: 'felino' };
    if (/segui|vieni|accompagn/.test(t)) return { say: 'Va bene, ti seguo. Tanto si torna sempre qui.', action: 'follow', mood: 'curioso' };
    if (/ferm|aspett|resta/.test(t)) return { say: 'Resto qui. Il mondo verrà da me.', action: 'stay', mood: 'calmo' };
    if (/vai|lascia|addio/.test(t)) return { say: 'Torno ai miei giri.', action: 'wander', mood: 'tranquillo' };
    if (/dammi|hai qualcosa|regal|scambi/.test(t) && npc?.carrying?.length) return { say: `Tieni, prendi questo: ${npc.carrying[0]}.`, action: 'give', item: npc.carrying[0], mood: 'generoso' };
    // Feelings, promises, requests: what an individual will remember.
    if (/sposami|ti amo|vuoi essere mia|vuoi essere mio/.test(t)) return { say: 'Sì… sì, lo voglio.', action: 'stay', mood: 'felice', memory: 'il viandante mi ha chiesto di sposarlo, e ho detto sì', weight: 3, bond: 'moglie', bond_kind: 'spouse' };
    if (/prometto|giuro/.test(t)) return { say: 'Lo terrò a mente. Non deludermi.', action: 'none', mood: 'speranzoso', memory: `il viandante ha promesso: ${text.slice(0, 80)}`, weight: 3 };
    if (/aiut|posso fare|serve qualcosa|richiesta/.test(t) && npc?.secrets?.includes('richiesta per il viandante')) return { say: 'Sì. Ho bisogno di te. Ti spiego tutto.', action: 'quest', mood: 'sollevato', memory: 'ho affidato una richiesta al viandante', weight: 2 };
    if (npc?.memories && /ricord|ti ricordi/.test(t)) return { say: `Mi ricordo, eccome: ${npc.memories.split('\n').pop()?.replace(/^- \([^)]*\) /, '') ?? ''}`, action: 'none', mood: npc.mood };
    const mention = /\b(?:un|una|uno|del|della|dello)\s+([a-zàèéìòù]{4,})/i.exec(text);
    return { say: VILLAGER[(histLen + rng.int(3)) % VILLAGER.length], action: 'none', mood: npc?.mood ?? 'calmo', mentioned: mention ? [mention[1]] : [] };
  }

  private sign(facts: Record<string, unknown>, name: string): string {
    const near = ((facts.dintorni as string[] | undefined) ?? []).filter((d) => d.startsWith('«')).slice(0, 2);
    const rng = new Rng(hashStr(`${name}|${near.join()}`));
    if (near.length) return near.map((d) => `⟶ ${d.replace(/, a \d+ luoghi da qui|, appena oltre/, '')}`).join('   ');
    return rng.pick(['⟶ Valmora', '«Attenti ai briganti del bosco.» — la guardia', '⟵ Mulino   ⟶ Lago']);
  }
}
