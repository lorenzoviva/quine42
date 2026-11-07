// T325, point 1: how much of what the Council sends today is context. Every recorded call (registratore.ts) is cut into its parts:
// the fixed instructions (the agent's role, the Council's principles, the task's own lines, the response schema), the context of the
// world (the game, the bible, what exists, the rune canon, the lexicon, the rules, terrains, atlas, style, the graph's focus), the
// context of the thing (its state, the persona or sheet, memories and secrets, the history, the society) and the request itself (the
// wanderer's words, the thing to judge or to make). Each part is counted in Gemini's tokens (countTokens, free; offline an estimate),
// and an hour of play (the calls of `CENSUS` at the rhythms of `hourlyEstimate`) says what each part costs, with and without the cache.

import { createHash } from 'node:crypto';
import { COUNCIL_PRINCIPLES } from '../../../../src/kernel/fourthwall';
import { costOf, priceOf } from '../../../../src/kernel/ai/prices';
import { DEFAULT_SCULPTORS } from '../../../../src/kernel/agents/sculptor';
import { ACTOR_MODEL, HOUR } from '../../../../src/kernel/coefficients';
import type { RecordedCall } from './registratore';

/** The principles as the requests recorded before T310 carry them (Italian): the cases of the bank were recorded then. */
export const PRINCIPLES_BEFORE_T310 = `## Principi del Concilio (il kernel li garantisce)
Due tavoli, come in Dungeons & Dragons. Il Concilio è il Dungeon Master: sta fuori dal mondo, lo crea e
lo fa evolvere. Dentro il mondo ci sono il viandante e le persone: per loro il mondo è reale.
- Niente meta-gioco nei contenuti (persone, oggetti, luoghi, dialoghi, testi, trame, fatti, leggende): mai
  codice, simulazioni, programmi, computer, giochi, giocatori, agenti, Concilio, «crepe della realtà», bordi
  del mondo misurati, mondi che si ripetono o si riavviano.
- Nemmeno allusioni travestite da leggenda. Il mondo non sa di essere un gioco, quindi nessuno racconta che:
  chi cammina troppo torna sempre in piazza o non si perde mai; qualcuno o qualcosa (un re sotto il lago, la
  luna, un dio) osserva ogni viandante; un confine (il bosco, la valle, il regno) non si può superare o fa
  tornare sui propri passi; il mondo finisce, si ripete, ricomincia o esiste solo per chi lo guarda.
- Niente doppioni degli elementi del gioco. Le rune sono una cosa sola, quella del canone: nessun altro
  «simbolo luminoso», «glifo», «lettera di luce» o «scritta che brilla» nel terreno, e nessun comportamento
  delle rune che il canone non dice. Lo stesso per ciò che esiste già (oggetti, persone, incantesimi).
- Mestieri e ruoli concreti (fornaio, guardia, pastore, guaritrice, mercante, brigante, mago di
  villaggio), mai custodi della realtà, censori delle identità, archivisti del mondo, misuratori di anomalie.
- Storie semplici e concrete, fatte di persone: amori, debiti, mestieri, furti, feste, rivalità, viaggi,
  bestie, magia delle rune come la dice il canone. Il mistero non è un obbligo.
- Il Concilio fa evolvere il gioco, non lo censura: ciò che ha senso nel mondo (un cavallo sellato, una
  barca, un'arma, un rituale) va reso possibile con oggetti, azioni, effetti, stati e codice, con
  conseguenze coerenti.
- Ogni mondo ha la sua epoca: macchine e mestieri sono cose del mondo. Le parole vietate
  non si usano nemmeno per altro: di' calcolatore, trasmissione, calciatore.`;
/** The principles a recorded system carries: the ones of now, or the Italian ones of before T310. */
export const principlesIn = (system: string): string | undefined => [COUNCIL_PRINCIPLES, PRINCIPLES_BEFORE_T310].find((p) => system.includes(p));
/** The Language block (T310) that follows the principles: fixed instructions, like them. */
const LANGUAGE_HEADING = '## Language of the world';

// ---------------------------------------------------------------------------------------------------------- the parts

export const PARTS = {
  // Fixed instructions: the same in every call of the task.
  ruolo: 'istruzioni',
  principi: 'istruzioni',
  compito: 'istruzioni',
  schema: 'istruzioni',
  // The context of the world: what the agent is told of the universe.
  partita: 'mondo',
  bibbia: 'mondo',
  catalogo: 'mondo',
  canone: 'mondo',
  lessico: 'mondo',
  regole: 'mondo',
  terreni: 'mondo',
  atlante: 'mondo',
  stile: 'mondo',
  grafo: 'mondo',
  // The context of the thing: the place, the person, what they remember, what happened, the people around.
  stato: 'cosa',
  persona: 'cosa',
  ricordi: 'cosa',
  storia: 'cosa',
  societa: 'cosa',
  // What is asked this time.
  richiesta: 'richiesta',
  immagini: 'richiesta',
} as const;
export type Part = keyof typeof PARTS;
export type Family = (typeof PARTS)[Part];
export const FAMILIES: Family[] = ['istruzioni', 'mondo', 'cosa', 'richiesta'];
export const FAMILY_NAME: Record<Family, string> = { istruzioni: 'istruzioni fisse', mondo: 'contesto del mondo', cosa: 'contesto della cosa', richiesta: 'richiesta' };
/** The parts that make the context the author asks about: what the world and the thing are, not what to do with them. */
export const CONTEXT: Family[] = ['mondo', 'cosa'];

export interface Piece {
  part: Part;
  text: string;
  /** Whether it sits in the stable prefix of the request (role, principles, the agent's context): what Gemini's implicit cache can serve. */
  prefix: boolean;
  /** It goes on the same line as the piece before (a list cut off its line). */
  inline?: boolean;
}

/** The context the Council gives an agent: every part begins with one of these headings (council.ts → context()). */
const CONTEXT_HEADINGS: Array<[string, Part]> = [
  // The headings of now (English since T310), then those the recorded cases carry.
  ['## The game (chosen before the Genesis', 'partita'],
  ['## Bible of the world', 'bibbia'],
  ['## The world\n', 'bibbia'],
  ['## Bible (summary)', 'bibbia'],
  ['## Tone\n', 'bibbia'],
  ['## Existing modules', 'catalogo'],
  ['## Placeable modules', 'catalogo'],
  ['## Canon of the runes', 'canone'],
  ['## Lexicon of the world', 'lessico'],
  ['## Rules the Council has already established', 'regole'],
  ['## Terrains\n', 'terreni'],
  ['## Atlas (centre in places', 'atlante'],
  ['## Style guide', 'stile'],
  ['## La partita (scelta prima della Genesi', 'partita'],
  ['## Bibbia del mondo', 'bibbia'],
  ['## Il mondo\n', 'bibbia'],
  ['## Bibbia (sintesi)', 'bibbia'],
  ['## Tono\n', 'bibbia'],
  ['## Moduli esistenti', 'catalogo'],
  ['## Moduli posizionabili', 'catalogo'],
  ['## Canone delle rune', 'canone'],
  ['## Lessico del mondo', 'lessico'],
  ['## Regole già stabilite dal Concilio', 'regole'],
  ['## Terreni\n', 'terreni'],
  ['## Atlante (centro in luoghi', 'atlante'],
  ['## Guida di stile', 'stile'],
];
export const FOCUS_HEADING = '## What the world knows about this task';
/** The focus as the recorded cases of before T310 say it. */
const FOCUS_HEADING_BEFORE_T310 = '## Ciò che il mondo sa di questo compito';

/**
 * The system instruction: role, principles, the agent's context, the task's own system lines, the graph's focus. With the context as the
 * Council gave it (`context`, recorded with the call) the cut is exact; without it the context ends at the first block that is not one of
 * its headings or a sub-heading of the part before.
 */
export function cutSystem(system: string, context?: string): Piece[] {
  const out: Piece[] = [];
  const principles = principlesIn(system);
  if (!principles) return [{ part: 'ruolo', text: system, prefix: true }];
  const at = system.indexOf(principles);
  if (at > 0) out.push({ part: 'ruolo', text: system.slice(0, at).replace(/\n\n$/, ''), prefix: true });
  out.push({ part: 'principi', text: principles, prefix: true });
  let rest = system.slice(at + principles.length).replace(/^\n\n/, '');
  // The Language block (T310) is fixed instructions, as the principles are.
  if (rest.startsWith(LANGUAGE_HEADING)) {
    const end = rest.indexOf('\n\n');
    const block = end < 0 ? rest : rest.slice(0, end);
    out.push({ part: 'principi', text: block, prefix: true });
    rest = rest.slice(block.length).replace(/^\n\n/, '');
  }
  let focus = '';
  const f = Math.max(rest.lastIndexOf(FOCUS_HEADING), rest.lastIndexOf(FOCUS_HEADING_BEFORE_T310));
  if (f >= 0) {
    focus = rest.slice(f);
    rest = rest.slice(0, f).replace(/\n\n$/, '');
  }
  // The context's parts follow one another; what comes after the context is the task's system.
  let tail = '';
  if (context && rest.startsWith(context)) {
    tail = rest.slice(context.length).replace(/^\n\n/, '');
    rest = context;
  }
  const blocks = rest.split(/\n\n(?=## )/);
  let current: Part | undefined;
  let inContext = true;
  for (const b of blocks) {
    const known = CONTEXT_HEADINGS.find(([h]) => b.startsWith(h) || `${b}\n`.startsWith(h));
    if (known && inContext) current = known[1];
    else if (!current || !inContext || !/^## /.test(b)) {
      // A block that is not a heading of the context: the task's own system (instructions), and what follows it too.
      inContext = false;
      current = 'compito';
    }
    // Sub-headings inside the canon, the lexicon or the style guide stay with their part (they are not headings of the context).
    out.push({ part: current, text: b, prefix: inContext });
  }
  if (tail) out.push({ part: 'compito', text: tail, prefix: false });
  if (focus) out.push({ part: 'grafo', text: focus, prefix: false });
  return merge(out);
}

/**
 * Lines of the request (the user message), by how they begin: a sticky rule holds for the lines after it until a blank line or another
 * rule. What no rule names is the task's own instruction. Inline lists of what exists («Esistono già: …») are cut off their line.
 */
const LINE_RULES: Array<[RegExp, Part, boolean]> = [
  // The requests of now (English since T310).
  [/^(The wanderer says: «|The wanderer, in front of «|The wanderer wants to make|The wanderer (looks closely at|reads) «|The wanderer died|The wanderer tries to combine|You are asked: «|The Council introduces a mechanic|Request \(|Write: |Create an individual of this kind|In the world people talked about)/, 'richiesta', false],
  [/^(Sculpt: |Review these modules|Concept:|logic\.lua:|Physics:|Check the weight, stack|Are these things consistent|Define the physics)/, 'richiesta', true],
  [/^(They exist already|Tools that already exist|Things that already exist|Existing things( \(|:)|(Available|Existing) environments|Mechanics already there|(Existing|Valid) terrains|Terrains:$|Things and characters: )/, 'catalogo', true],
  [/^"rune": 0-2 fragments/, 'catalogo', false],
  [/^(Design the place|Neighbouring places|This place belongs to the region|State: mood|Carries: |Facts you perceive|You are talking with |How the wanderer introduces themselves|To the wanderer you are|A and B meet|Place where they are|The wanderer is at|Conditions:)/, 'stato', false],
  [/^(Session of the Council\.|Mechanics with an interface|Rules born from play|People met|Places seen|PLACES AND REGIONS)/, 'stato', true],
  [/^(SHEET OF THE CHARACTER|WHO THEY ARE|Sheet of the kind:)/, 'persona', true],
  [/^(In short: )/, 'persona', false],
  [/^(YOUR MEMORIES|Things you know and do not say|memories:|secrets:)/, 'ricordi', true],
  [/^(Conversation so far|THINGS THAT HAPPENED RECENTLY)/, 'storia', true],
  [/^The wanderer comes up to you for the first time/, 'storia', false],
  [/^(PEOPLE|People already known|Named but never met|THE SOCIETY OF THE WORLD)/, 'societa', true],
  // The requests recorded before T310 (Italian).
  // What is asked this time.
  [/^Il viandante dice: «/, 'richiesta', false],
  [/^Il viandante, davanti a «/, 'richiesta', false],
  [/^Il viandante vuole fabbricare/, 'richiesta', false],
  [/^Il viandante (osserva da vicino|legge) «/, 'richiesta', false],
  [/^Il viandante è morto/, 'richiesta', false],
  [/^Il giocatore prova a combinare/, 'richiesta', false],
  [/^Ti chiedono: «/, 'richiesta', false],
  [/^Il Concilio introduce una meccanica/, 'richiesta', false],
  [/^Richiesta \(/, 'richiesta', false],
  [/^Scolpisci: /, 'richiesta', true],
  [/^Scrivi: /, 'richiesta', false],
  [/^Crea un individuo di questo tipo/, 'richiesta', false],
  [/^Nel mondo si è parlato di/, 'richiesta', false],
  [/^Rivedi questi moduli/, 'richiesta', true],
  [/^Concetto:/, 'richiesta', true],
  [/^logic\.lua:/, 'richiesta', true],
  [/^Fisica:/, 'richiesta', true],
  [/^Controlla peso, pila/, 'richiesta', true],
  [/^Questi oggetti sono coerenti/, 'richiesta', true],
  [/^Definisci la fisica/, 'richiesta', true],
  // What exists: the lists the answer must keep to.
  [/^(Esistono già|Strumenti già esistenti|Oggetti che esistono già|Oggetti esistenti( \(|:)|Ambienti (disponibili|esistenti)|Meccaniche già presenti|Terreni (esistenti|validi)|Terreni:$|Oggetti e personaggi: )/, 'catalogo', true],
  [/^"rune": 0-2 frammenti/, 'catalogo', false],
  // The state of the place, of the wanderer, of the world.
  [/^(Progetta il luogo|Luoghi confinanti|Questo luogo fa parte della regione|Stato: umore|Porta: |Porta con sé: |Fatti che percepisci|Parli con |Come si presenta il viandante|Per il viandante sei|A e B si incontrano|Luogo in cui si trova|Il viandante si trova|Condizioni:)/, 'stato', false],
  [/^(Sessione del Concilio\.|Meccaniche con interfaccia|Regole nate dal gioco|Persone incontrate|Luoghi visti|LUOGHI E REGIONI)/, 'stato', true],
  // Who the person is.
  [/^(SCHEDA DEL PERSONAGGIO|CHI È|Scheda del tipo:)/, 'persona', true],
  [/^(In breve: |A: |B: )/, 'persona', false],
  // What they remember, what they keep for themselves.
  [/^(I TUOI RICORDI|Cose che sai e che non dici|ricordi:|segreti:)/, 'ricordi', true],
  // What happened.
  [/^(Conversazione finora|COSE SUCCESSE DI RECENTE)/, 'storia', true],
  [/^Il viandante ti si avvicina per la prima volta/, 'storia', false],
  // The people of the world.
  [/^(PERSONE|Persone già conosciute|Nominate ma mai incontrate|LA SOCIETÀ DEL MONDO)/, 'societa', true],
];

/** Phrases inside a line after which a list of what exists begins (to the end of the sentence). */
const INLINE_LISTS = [/They exist already[^:]*: /, /Tools that already exist: /, /Things that already exist[^:]*: /, /these things \(exact names\): /, /Esistono già[^:]*: /, /Strumenti già esistenti: /, /Oggetti che esistono già[^:]*: /, /questi oggetti \(nomi esatti\): /, /Oggetti noti: /];

export function cutPrompt(prompt: string): Piece[] {
  const out: Piece[] = [];
  let sticky: Part | undefined;
  for (const line of prompt.split('\n')) {
    if (!line.trim()) {
      sticky = undefined;
      out.push({ part: out[out.length - 1]?.part ?? 'compito', text: '', prefix: false });
      continue;
    }
    const rule = LINE_RULES.find(([re]) => re.test(line));
    let part: Part;
    if (rule) {
      part = rule[1];
      sticky = rule[2] ? rule[1] : undefined;
    } else part = sticky ?? 'compito';
    // A list of what exists inside the line: the line's part up to it, the catalog after it, to the end of the sentence.
    const inline = INLINE_LISTS.map((re) => re.exec(line)).find((m) => m && m.index > 0);
    if (inline && part !== 'catalogo') {
      const start = inline.index + inline[0].length;
      const end = line.indexOf('. ', start);
      const stop = end < 0 ? line.length : end + 1;
      out.push({ part, text: line.slice(0, start), prefix: false });
      out.push({ part: 'catalogo', text: line.slice(start, stop), prefix: false, inline: true });
      if (stop < line.length) out.push({ part, text: line.slice(stop), prefix: false, inline: true });
    } else out.push({ part, text: line, prefix: false });
  }
  return merge(out, '\n');
}

function merge(pieces: Piece[], sep = '\n\n'): Piece[] {
  const out: Piece[] = [];
  for (const p of pieces) {
    const last = out[out.length - 1];
    if (last && last.part === p.part && last.prefix === p.prefix) last.text += (p.inline ? '' : sep) + p.text;
    else out.push({ ...p });
  }
  // A piece of blank lines alone goes with the one before, so that the pieces joined again give the text back.
  const kept: Piece[] = [];
  for (const p of out) {
    if (!p.text.trim() && kept.length) kept[kept.length - 1].text += (p.inline ? '' : sep) + p.text;
    else kept.push(p);
  }
  return kept;
}

/** The text of some pieces joined again as they were cut (the system with a blank line between pieces, the request with a newline). */
export function rejoin(pieces: Piece[], sep: string): string {
  return pieces.map((p, i) => (i === 0 ? '' : p.inline ? '' : sep) + p.text).join('');
}

/** Every piece of a call: the system, the request, the schema; images apart. */
export function cut(call: RecordedCall): Piece[] {
  return [...cutSystem(call.system, call.context), ...cutPrompt(call.prompt), ...(call.schema ? [{ part: 'schema' as Part, text: call.schema, prefix: false }] : [])];
}

// ---------------------------------------------------------------------------------------------------------- tokens

/**
 * Characters per token of Gemini's tokenizer on the Council's Italian text, measured with countTokens on the recorded requests
 * (`--conta`; the value is the one of the last measure, written in misure/contesto.json). Offline only this estimate is used.
 */
export const CHARS_PER_TOKEN = 3.3;
/** An image of the Artist (four views of a model in one picture): what countTokens says of the photos the kernel sends. */
export const IMAGE_TOKENS = 1100;

export const hashOf = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 16);

export interface TokenCounter {
  /** Tokens of each text, in order. */
  count(texts: string[]): Promise<number[]>;
  readonly exact: boolean;
}

/** The offline estimate: characters over the measured ratio. */
export const estimateCounter: TokenCounter = {
  exact: false,
  count: async (texts) => texts.map((t) => Math.ceil(t.length / CHARS_PER_TOKEN)),
};

/**
 * Gemini's countTokens (free: it generates nothing), one distinct text at a time, with a cache by hash (in misure/token.json) so a
 * second run asks nothing. The key comes from the caller; it is never written anywhere.
 */
export function geminiCounter(key: string, cache: Record<string, number>, model = 'gemini-3.1-flash-lite', fetchImpl: typeof fetch = fetch): TokenCounter {
  const one = async (text: string): Promise<number> => {
    const h = hashOf(text);
    if (cache[h] !== undefined) return cache[h];
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:countTokens`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }] }),
        signal: AbortSignal.timeout(30_000),
      });
      const j: any = await r.json().catch(() => ({}));
      if (r.ok && typeof j.totalTokens === 'number') return (cache[h] = j.totalTokens);
      if (r.status !== 429 && r.status < 500) throw new Error(`countTokens ${r.status}`);
      await new Promise((ok) => setTimeout(ok, 1000 * 2 ** attempt));
    }
    throw new Error('countTokens: troppi tentativi');
  };
  return {
    exact: true,
    async count(texts) {
      const out: number[] = new Array(texts.length);
      let next = 0;
      const worker = async () => {
        while (next < texts.length) {
          const i = next++;
          out[i] = texts[i].trim() ? await one(texts[i]) : 0;
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
      return out;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------- per task

export interface TaskMeasure {
  task: string;
  agent: string;
  universe: string;
  calls: number;
  /** Mean tokens of each part over the calls recorded. */
  parts: Partial<Record<Part, number>>;
  /** Mean tokens of the stable prefix (what the implicit cache can serve). */
  prefix: number;
  input: number;
  images: number;
  /** Mean characters of the text (images apart): with exact counts, the tokenizer's ratio. */
  chars: number;
}

export async function measure(calls: RecordedCall[], counter: TokenCounter): Promise<TaskMeasure[]> {
  const cutCalls = calls.map((c) => ({ call: c, pieces: cut(c) }));
  const texts = cutCalls.flatMap((x) => x.pieces.map((p) => p.text));
  const tokens = await counter.count(texts);
  let i = 0;
  const by = new Map<string, TaskMeasure>();
  for (const { call, pieces } of cutCalls) {
    const key = `${call.universe}|${call.task}|${call.agent}`;
    const m = by.get(key) ?? by.set(key, { task: call.task, agent: call.agent, universe: call.universe, calls: 0, parts: {}, prefix: 0, input: 0, images: 0, chars: 0 }).get(key)!;
    m.calls++;
    for (const p of pieces) {
      m.chars += p.text.length;
      const t = tokens[i++];
      m.parts[p.part] = (m.parts[p.part] ?? 0) + t;
      m.input += t;
      if (p.prefix) m.prefix += t;
    }
    if (call.images) {
      m.parts.immagini = (m.parts.immagini ?? 0) + call.images * IMAGE_TOKENS;
      m.input += call.images * IMAGE_TOKENS;
      m.images += call.images;
    }
  }
  for (const m of by.values()) {
    for (const p of Object.keys(m.parts) as Part[]) m.parts[p] = Math.round(m.parts[p]! / m.calls);
    m.prefix = Math.round(m.prefix / m.calls);
    m.input = Math.round(m.input / m.calls);
    m.chars = Math.round(m.chars / m.calls);
  }
  return [...by.values()];
}

/** Mean of the measures of a task over the universes. */
export function acrossUniverses(ms: TaskMeasure[]): TaskMeasure[] {
  const by = new Map<string, TaskMeasure[]>();
  for (const m of ms) (by.get(`${m.task}|${m.agent}`) ?? by.set(`${m.task}|${m.agent}`, []).get(`${m.task}|${m.agent}`)!).push(m);
  return [...by.values()].map((list) => {
    const n = list.length;
    const parts: Partial<Record<Part, number>> = {};
    for (const m of list) for (const [p, t] of Object.entries(m.parts) as Array<[Part, number]>) parts[p] = (parts[p] ?? 0) + t / n;
    for (const p of Object.keys(parts) as Part[]) parts[p] = Math.round(parts[p]!);
    return {
      task: list[0].task,
      agent: list[0].agent,
      universe: list.map((m) => m.universe).join('+'),
      calls: list.reduce((s, m) => s + m.calls, 0),
      parts,
      prefix: Math.round(list.reduce((s, m) => s + m.prefix, 0) / n),
      input: Math.round(list.reduce((s, m) => s + m.input, 0) / n),
      images: list.reduce((s, m) => s + m.images, 0),
      chars: Math.round(list.reduce((s, m) => s + m.chars, 0) / n),
    };
  });
}

export const familyOf = (m: Pick<TaskMeasure, 'parts'>, f: Family): number => (Object.entries(m.parts) as Array<[Part, number]>).filter(([p]) => PARTS[p] === f).reduce((s, [, t]) => s + t, 0);

// ---------------------------------------------------------------------------------------------------------- an hour of play

/**
 * The calls of an hour, task by task, as `hourlyEstimate` counts them for the seed with every knob at 1 (FULL_DETAIL) and the Actor off:
 * the same assumptions (`HOUR`), split over the tasks its rows stand for. `modello` is who answers by default.
 */
export function hourCalls(): Array<{ task: string; agent: string; perHour: number; model: string; note: string }> {
  const H = HOUR;
  const places = H.luoghi;
  const sessions = places / 12;
  const packs = Math.min(places / 10, 4);
  const kinds = Math.min(places / 7, 3);
  const fresh = Math.min(places * H.nuovi, 3);
  const forges = sessions / 2 + kinds + fresh;
  const people = places * H.persone;
  const talks = H.vicini / 40;
  const plots = (H.giorni / 4) * 1.3;
  const models = Math.min(kinds + fresh + packs * 2 + places * 0.3, 3600 / 40, 40);
  const lite = 'gemini-3.1-flash-lite';
  return [
    { task: 'chunk.plan', agent: 'cartographer', perHour: places, model: lite, note: 'un luogo nuovo' },
    { task: 'npc.individuate', agent: 'narrator', perHour: people * 1.2, model: lite, note: '1,5 persone per luogo' },
    { task: 'npc.dialogue', agent: 'narrator', perHour: talks, model: lite, note: 'uno ogni 40 s vicino a due persone' },
    { task: 'npc.reply', agent: 'narrator', perHour: H.parole, model: lite, note: '20 battute del viandante' },
    { task: 'text.examine', agent: 'narrator', perHour: H.sguardi * 0.8, model: lite, note: '«Esamina»' },
    { task: 'text.read', agent: 'narrator', perHour: H.sguardi * 0.2, model: lite, note: '«Leggi»' },
    { task: 'action.judge', agent: 'narrator', perHour: H.azioni * 0.75, model: lite, note: '«Altro…»' },
    { task: 'craft.free', agent: 'narrator', perHour: H.azioni * 0.125, model: lite, note: 'fabbricazione libera' },
    { task: 'craft.judge', agent: 'narrator', perHour: H.azioni * 0.125, model: lite, note: 'combinazioni' },
    { task: 'forge.concept', agent: 'narrator', perHour: forges, model: lite, note: 'Fucina: sessioni, abitanti, cose nuove' },
    { task: 'forge.physics', agent: 'physicist', perHour: forges, model: lite, note: '' },
    { task: 'forge.code', agent: 'engineer', perHour: forges, model: lite, note: '' },
    { task: 'forge.review', agent: 'arbiter', perHour: forges, model: lite, note: '' },
    { task: 'forge.fix', agent: 'engineer', perHour: forges, model: lite, note: '«e qualche riparazione»: la quinta chiamata della Fucina' },
    { task: 'content.items', agent: 'narrator', perHour: packs, model: lite, note: 'un pacchetto ogni 10 luoghi' },
    { task: 'content.physics', agent: 'physicist', perHour: packs, model: lite, note: '' },
    { task: 'content.review', agent: 'arbiter', perHour: packs, model: lite, note: '' },
    { task: 'content.recipes', agent: 'narrator', perHour: packs, model: lite, note: '' },
    { task: 'content.define', agent: 'narrator', perHour: places * H.ignoti, model: lite, note: 'oggetti ignoti a terra' },
    { task: 'council.session', agent: 'arbiter', perHour: sessions, model: lite, note: 'ogni 12 luoghi' },
    { task: 'plot.weave', agent: 'narrator', perHour: plots, model: lite, note: '' },
    { task: 'model.sculpt', agent: 'sculptor', perHour: models * 0.5 * 2, model: DEFAULT_SCULPTORS.simple, note: 'cose semplici: due programmi' },
    { task: 'model.sculpt', agent: 'sculptor', perHour: models * 0.5 * 1.5, model: DEFAULT_SCULPTORS.figure, note: 'figure e strutture, metà con revisione' },
    { task: 'model.judge', agent: 'artist', perHour: models * 1.75, model: DEFAULT_SCULPTORS.artist, note: 'con la foto' },
    { task: 'sound.compose', agent: 'musician', perHour: Math.min(H.ambientiSenzaBrano, 30, 8) * 1.34, model: DEFAULT_SCULPTORS.musician, note: '' },
  ];
}

/** With the Actor on (T157): the people's lines on its model, and a sheet for each individual heard for the first time. */
export function actorHour(): Array<{ task: string; agent: string; perHour: number; model: string; note: string }> {
  const people = HOUR.luoghi * HOUR.persone;
  return [
    { task: 'npc.reply', agent: 'actor', perHour: HOUR.parole, model: ACTOR_MODEL, note: "l'Attore acceso" },
    { task: 'npc.dialogue', agent: 'actor', perHour: HOUR.vicini / 40, model: ACTOR_MODEL, note: "l'Attore acceso" },
    { task: 'npc.sheet', agent: 'narrator', perHour: Math.min(people, HOUR.parole / 2 + HOUR.vicini / 40), model: 'gemini-3.1-flash-lite', note: 'una scheda per individuo' },
  ];
}

/**
 * Tokens of an answer, thinking included: as the bench measured them on Flash-Lite with the reasoning `low` of the game (T313 `oggi`; T325
 * `scelta`, the whole requests: npc.reply 172 + 670 of reasoning, npc.individuate 626 + 1506, chunk.plan 366 + 598), or as the hour's
 * estimate assumes them (`default`, 500; the Sculptor's 3000). The Actor on 3.8 Flash answered 110 tokens and no reasoning.
 */
export const OUTPUT_TOKENS: Record<string, number> = {
  default: 500,
  'action.judge': 756,
  'craft.judge': 503,
  'craft.free': 306,
  'referente.coordinate': 379,
  'npc.reply': 842,
  'npc.reply:actor': 110,
  'npc.dialogue:actor': 220,
  'npc.individuate': 2132,
  'chunk.plan': 964,
  'model.sculpt': 3000,
  'sound.compose': 3000,
  'model.judge': 300,
};
export const MEASURED_OUTPUT = new Set(['action.judge', 'craft.judge', 'craft.free', 'referente.coordinate', 'npc.reply', 'npc.reply:actor', 'npc.individuate', 'chunk.plan']);

/**
 * The share of the stable prefix the implicit cache serves: the bench measured 42 % of the whole input cached on `action.judge` and
 * 50 % on `craft.free` (T313, Flash-Lite, calls of four universes mixed), where the prefix is about 70 % of the input: about 0,6 of the
 * prefix. A real session has one universe, so it may be more; it is never all (the first call, a pause, a change of the context).
 */
export const CACHE_SHARE = 0.6;

/**
 * The cache in a session (T325, `scelta`): the same requests of one universe one after another, Flash-Lite served from the cache 70-73 % of
 * the whole input from the second call on (more than the prefix as cut here: the cache also takes what follows it while it is the same), the
 * Narrator's tasks sharing one prefix. So «warm» is the whole prefix. 3.8 Flash served nothing in ten calls in a row: no implicit cache for it.
 */
export const WARM_CACHE_SHARE = 1;
export const NO_IMPLICIT_CACHE = new Set(['gemini-3.8-flash']);
const shareFor = (model: string, share: number) => (NO_IMPLICIT_CACHE.has(model) ? 0 : share);

export interface HourRow {
  task: string;
  agent: string;
  model: string;
  perHour: number;
  input: number;
  context: number;
  /** Dollars per hour: everything, then the context alone; without the cache, with the cache of mixed sessions (T313), with the warm cache (T325). */
  usd: number;
  usdContext: number;
  usdCached: number;
  usdContextCached: number;
  usdWarm: number;
  usdContextWarm: number;
  /** Of every total, what the answer costs (thinking included). */
  usdOutput: number;
  output: number;
  families: Record<Family, number>;
  note: string;
  measured: boolean;
}

/**
 * Dollars of a part of the input: tokens of the prefix are cached at `share`, the rest at the input price. `prefixShare` is how much of
 * these tokens lie in the prefix.
 */
function inputUsd(model: string, tokens: number, prefixTokens: number, share: number, date?: string): number {
  const p = priceOf(model, date);
  if (!p) return 0;
  const cached = prefixTokens * share;
  return ((tokens - cached) * p.input + cached * p.cached) / 1e6;
}

export function hourTable(measures: TaskMeasure[], hour = hourCalls(), date?: string): HourRow[] {
  return hour.map((h) => {
    const m = measures.find((x) => x.task === h.task && x.agent === h.agent) ?? measures.find((x) => x.task === h.task);
    const fam = Object.fromEntries(FAMILIES.map((f) => [f, m ? familyOf(m, f) : 0])) as Record<Family, number>;
    const input = m?.input ?? 3500;
    const context = fam.mondo + fam.cosa;
    // The context in the prefix (the agent's context) and outside it (the focus, the thing's state).
    const ctxPrefix = m ? Math.min(context, Math.max(0, m.prefix - (m.parts.ruolo ?? 0) - (m.parts.principi ?? 0))) : 0;
    const out = OUTPUT_TOKENS[`${h.task}:${h.agent}`] ?? OUTPUT_TOKENS[h.task] ?? OUTPUT_TOKENS.default;
    const outUsd = (costOf(h.model, { prompt: 0, output: out }, date) ?? 0) * h.perHour;
    const prefix = m?.prefix ?? 0;
    return {
      task: h.task,
      agent: h.agent,
      model: h.model,
      perHour: Math.round(h.perHour * 10) / 10,
      input,
      context,
      usd: inputUsd(h.model, input, prefix, 0, date) * h.perHour + outUsd,
      usdContext: inputUsd(h.model, context, ctxPrefix, 0, date) * h.perHour,
      usdCached: inputUsd(h.model, input, prefix, shareFor(h.model, CACHE_SHARE), date) * h.perHour + outUsd,
      usdContextCached: inputUsd(h.model, context, ctxPrefix, shareFor(h.model, CACHE_SHARE), date) * h.perHour,
      usdWarm: inputUsd(h.model, input, prefix, shareFor(h.model, WARM_CACHE_SHARE), date) * h.perHour + outUsd,
      usdContextWarm: inputUsd(h.model, context, ctxPrefix, shareFor(h.model, WARM_CACHE_SHARE), date) * h.perHour,
      usdOutput: outUsd,
      output: out,
      families: fam,
      note: h.note,
      measured: !!m,
    };
  });
}

/** What each part of the requests costs in an hour: tokens, and dollars without the cache and with the warm one. */
export function partsHour(measures: TaskMeasure[], hour = hourCalls(), date?: string): Array<{ part: Part; family: Family; tokens: number; usd: number; usdWarm: number }> {
  const out = new Map<Part, { part: Part; family: Family; tokens: number; usd: number; usdWarm: number }>();
  for (const h of hour) {
    const m = measures.find((x) => x.task === h.task && x.agent === h.agent) ?? measures.find((x) => x.task === h.task);
    const p = priceOf(h.model, date);
    if (!m || !p) continue;
    const warm = shareFor(h.model, WARM_CACHE_SHARE);
    // Which parts lie in the prefix: the agent's role, the principles and its context (not the focus, nor the request).
    const inPrefix = (part: Part) => ['ruolo', 'principi', 'partita', 'bibbia', 'catalogo', 'canone', 'lessico', 'regole', 'terreni', 'atlante', 'stile'].includes(part) && m.prefix > 0;
    for (const [part, t] of Object.entries(m.parts) as Array<[Part, number]>) {
      const row = out.get(part) ?? out.set(part, { part, family: PARTS[part], tokens: 0, usd: 0, usdWarm: 0 }).get(part)!;
      // A catalog in the request (a list of what exists) is not in the prefix: only the share of the part that is, roughly, the agent's context.
      const cached = inPrefix(part) ? Math.min(t, m.prefix) * warm : 0;
      row.tokens += t * h.perHour;
      row.usd += ((t * p.input) / 1e6) * h.perHour;
      row.usdWarm += (((t - cached) * p.input + cached * p.cached) / 1e6) * h.perHour;
    }
  }
  return [...out.values()].sort((a, b) => b.usd - a.usd);
}
