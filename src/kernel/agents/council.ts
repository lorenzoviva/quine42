// The Council: the agents that generate the universe. Each agent is a role prompt stored in the
// universe (prompts/agents/<id>.md, so it is rewritable and lives in the corona) plus the slice of
// shared world knowledge it needs. They see each other's work and the Arbiter sends it back when
// narrative, graphics, engine and physics disagree.

import { parseJson, type AiModels, type Schema, type Thinking } from '../ai/models';
import { MockAiModels } from '../ai/mock';
import { ruleDecisions, settleDecisions, type DecisionCall, type DecisionModels, type Decisions } from '../ai/decisions';
import { decisionKnob, freeTextDecision } from '../coefficients';
import { COMUNE } from '../cards';
import { COUNCIL_PRINCIPLES, FOURTH_WALL_QUESTIONS, FOURTH_WALL_REASONS, FOURTH_WALL_RULE, GUARD_HAZARDS, GUARD_QUESTIONS, guardNote, guardRoute, guardRule, lexiconWords, metaBreak, quoteWanderer, type FourthWallBreak, type GuardDoor, type GuardHazard, type GuardRoute } from '../fourthwall';
import type { FileMap, MagicRune, Spell, TerrainDef } from '../types';
import type { WorldGraph } from '../graph';
import { gameSetupSummary } from '../gameSetup';
import { repairGameSetup } from '../validator';
import { internalFields, italianName } from '../internalNames';
import { languageBlock, languageOf } from '../language';

export type AgentId = 'narrator' | 'cartographer' | 'artist' | 'sculptor' | 'physicist' | 'engineer' | 'arbiter' | 'liaison' | 'actor' | 'musician';

/**
 * The agents whose system instructions go in an explicit cache of Gemini (T351, ADR-0185, D45.7): the Actor, on 3.8 Flash, which
 * showed no implicit cache (T325: 15 calls, none served); its focus goes in the prompt. The others stay on the implicit cache.
 */
export const CACHED_AGENTS: ReadonlySet<AgentId> = new Set<AgentId>(['actor']);

export const AGENTS: Record<AgentId, { name: string; color: string; sigil: string }> = {
  narrator: { name: 'Narratore', color: '#ffcf5c', sigil: '✒' },
  cartographer: { name: 'Cartografo', color: '#7dd87d', sigil: '⌖' },
  artist: { name: 'Artista', color: '#ff8ad8', sigil: '✎' },
  sculptor: { name: 'Scultore', color: '#ffa65c', sigil: '◈' },
  physicist: { name: 'Fisico', color: '#6fc3ff', sigil: '⚖' },
  engineer: { name: 'Ingegnere', color: '#b9a6ff', sigil: '⚙' },
  arbiter: { name: 'Arbitro', color: '#ff6b6b', sigil: '⚑' },
  liaison: { name: 'Referente', color: '#f2f2f2', sigil: '✉' },
  /** Plays the people with the Narrator's sheets, when the master turns it on (T157, ADR-0116). */
  actor: { name: 'Attore', color: '#5ce0c8', sigil: '◐' },
  /** Writes the sound programs of what the world asks for (T225): in the Artist's house. */
  musician: { name: 'Musicista', color: '#8fb8ff', sigil: '♪' },
};

export type FeedKind = 'propone' | 'obietta' | 'approva' | 'corregge' | 'scolpisce' | 'scarta' | 'info' | 'errore';

export interface CallOptions {
  data?: unknown;
  images?: string[];
  temperature?: number;
  /** A model other than the text model (the Sculptor's per class, the Artist's). */
  model?: string;
  thinking?: Thinking;
  /**
   * What the task is about, as nodes of the graph of the world (ids, or names of people, places,
   * things): the agent gets their neighbourhood instead of the whole bible and catalog (T13).
   */
  focus?: string[];
  /** Who pays (T36); default the Council's `payer` for the task. */
  chi?: string;
}

export interface FeedEntry {
  time: number;
  from: AgentId | 'kernel';
  to?: AgentId;
  kind: FeedKind;
  text: string;
  task?: string;
}

export interface CatalogEntry {
  id: string;
  name: string;
  kind: string;
  tiles: string[];
  context: string;
}

/** What the agents can know about the universe right now. */
export interface WorldView {
  files: FileMap;
  palette: Record<string, TerrainDef>;
  catalog: CatalogEntry[];
  /** The graph of the world (ADR-0045), for the tasks with a focus. */
  graph?: () => WorldGraph;
}

export interface Bible {
  title: string;
  tone: string;
  summary: string;
  history?: string;
  places: string[];
  characters: string[];
  facts: string[];
  /** Legends and mysteries of the world, told from inside it. */
  mysteries?: string[];
  /** Customs and sayings of this universe that enrich the lexicon (world/lexicon.md) without contradicting it (T65). */
  customs?: string[];
  /** Old bibles: hints that the world was a simulation. No longer used (no meta-game, ADR-0025). */
  cracks?: string[];
}

export function readBible(files: FileMap): Bible | null {
  try {
    // A bible of the contract 0.3 (`titolo`, `luoghi`) reads internal (T308a), as one the Narrator writes with its schema's fields.
    return internalFields('bible', JSON.parse(files['world/bible.json'] ?? 'null'));
  } catch {
    return null;
  }
}

export function bibleSummary(b: Bible | null, full = false): string {
  if (!b) return '(no bible of the world)';
  const list = (xs: string[] | undefined, n: number) => (xs ?? []).slice(-n).map((x) => `- ${x}`).join('\n');
  return [
    `Title: ${b.title}`,
    `Tone: ${b.tone}`,
    `Summary: ${b.summary}`,
    full && b.history ? `History: ${b.history}` : '',
    `Known places:\n${list(b.places, full ? 30 : 12)}`,
    `Known characters:\n${list(b.characters, full ? 20 : 8)}`,
    `Established facts:\n${list(b.facts, full ? 30 : 12)}`,
    b.mysteries?.length ? `Mysteries and legends of the world:\n${list(b.mysteries, 8)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** The head of the bible, for the tasks that bring their own context from the graph. */
export function bibleHead(b: Bible | null): string {
  if (!b) return '(no bible of the world)';
  return [`Title: ${b.title}`, `Tone: ${b.tone}`, `Summary: ${b.summary}`].join('\n');
}

/** Characters of graph context a focused task gets (about 700 tokens), and how many recent rules. */
export const FOCUS_BUDGET = 2800;
const FOCUSED_RULES = 12;

export function paletteSummary(palette: Record<string, TerrainDef>): string {
  return Object.entries(palette)
    .filter(([code]) => code !== '?')
    .map(([code, t]) => `- ${code} = ${t.name} (${t.color}${t.solid ? ', solid' : ''}${t.speed && t.speed !== 1 ? `, speed ×${t.speed}` : ''})${t.description ? `: ${t.description}` : ''}`)
    .join('\n');
}

/** Rules established while the world was played (world/rules.json): later judgements must respect them. */
export function rulesSummary(files: FileMap, n = 30): string {
  let list: Array<{ text: string; possible: boolean; story: string; effects?: string[] }> = [];
  try {
    list = internalFields('rules', JSON.parse(files['world/rules.json'] ?? '{}')).rules ?? [];
  } catch {
    return '';
  }
  if (!list.length) return '';
  const lines = list.slice(-n).map((r) => `- ${r.text}: ${r.possible ? `possible${r.effects?.length ? ` (${r.effects.join(', ')})` : ''}` : 'not possible'} — ${r.story}`);
  return `## Rules the Council has already established (respect them, be consistent)\n${lines.join('\n')}`;
}

/**
 * The rune canon (world/canon.md): what the people of the world know about runes, plus the magic runes
 * and incantations the universe actually has. Every narrative task gets it, so no story invents new rune
 * behaviours.
 */
export function canonSummary(files: FileMap): string {
  const canon = (files['world/canon.md'] ?? '').replace(/^# .*\n+/, '').trim();
  if (!canon) return '';
  const runes: string[] = [];
  const spells: string[] = [];
  for (const [path, text] of Object.entries(files)) {
    if (!path.endsWith('manifest.json') || !text.includes('"runes"')) continue;
    let m: { runes?: Record<string, MagicRune>; spells?: Record<string, Spell> };
    try {
      m = JSON.parse(text);
    } catch {
      continue;
    }
    for (const [token, r] of Object.entries(m.runes ?? {})) runes.push(`- ${r.glyph} ${r.name} («${token}», ${italianName('elementi', r.element)}): ${r.description}`);
    for (const [seq, sp] of Object.entries(m.spells ?? {})) spells.push(`- ${seq.split(' ').join(' + ')} → ${sp.name}: ${sp.description}`);
  }
  return [
    '## Canon of the runes (always holds: no plot, fact, mystery or dialogue gives the runes behaviours that are not here)',
    canon,
    runes.length ? `### The magic runes of this world\n${runes.join('\n')}` : '',
    spells.length ? `### The known incantations\n${spells.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** The words of the lexicon (world/lexicon.md) no text of the world explains (T65). */
export function wordsOf(files: FileMap): string[] {
  return lexiconWords(files['world/lexicon.md'] ?? '');
}

/**
 * The lexicon (world/lexicon.md): how people speak and behave in every universe, whatever the setting, plus
 * the few customs this universe added (bible → usanze). Every narrative task gets it, like the rune canon.
 */
export function lexiconSummary(files: FileMap): string {
  const lexicon = (files['world/lexicon.md'] ?? '').replace(/^# .*\n+/, '').trim();
  if (!lexicon) return '';
  const own = readBible(files)?.customs ?? [];
  return [
    "## Lexicon of the world (always holds: people speak and behave like this, in every age; use it in dialogue, in things and in the bible, never explaining it)",
    lexicon,
    own.length ? `### Customs of this world\n${own.map((l) => `- ${l}`).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** The game chosen before the Genesis (universe.json → game), as a principle of the Council (ADR-0053). */
export function gameSummary(files: FileMap): string {
  let raw: unknown;
  try {
    raw = internalFields('config', JSON.parse(files['universe.json'] ?? '{}')).game;
  } catch {
    raw = undefined;
  }
  return gameSetupSummary(repairGameSetup(raw));
}

export function catalogSummary(catalog: CatalogEntry[]): string {
  return catalog.map((m) => `- ${m.id} «${m.name}» [${m.kind}] terrains ${m.tiles.join('') || '-'}: ${m.context}`).join('\n');
}

export class Council {
  readonly feed: FeedEntry[] = [];
  onFeed?: (e: FeedEntry) => void;
  /** Who pays for a task asked now (T36): the kernel's policy (cards.ts); without one, the world. */
  payer?: (task: string) => string;
  /** Whether a wanderer has credits for online calls (T45a); when false, local models are used. */
  hasCredits?: (chi: string) => boolean;
  /** Whether a knob of the master keeps this call from the models (T247, ADR-0133): it goes to the local ones, as without credits. */
  rationed?: (task: string) => boolean;
  /**
   * Why the universe is read-only now (T312, ADR-0156), or undefined: nothing the Council makes would be saved, so no call reaches the models,
   * every one goes to the local ones and the world stays playable.
   */
  readOnly?: () => string | undefined;
  /** The reasoning of every call that does not say its own (`ai.thinking`): the lobby sets it (T247). */
  thinking?: () => CallOptions['thinking'];
  localAiModels: AiModels & DecisionModels = new MockAiModels();
  /** Who takes the closed decisions (ADR-0157): Jev through its gate, or (without a key) the local models, which answer with the rule. */
  decisions: DecisionModels = this.localAiModels;
  /** The nodes of the graph a prompt carried as its focus (the kernel counts the cards' uses, T36). */
  onFocus?: (ids: string[]) => void;

  constructor(
    public ai: AiModels,
    private view: () => WorldView,
  ) {}

  get files(): FileMap {
    return this.view().files;
  }

  world(): WorldView {
    return this.view();
  }

  say(from: AgentId | 'kernel', kind: FeedKind, text: string, to?: AgentId, task?: string): void {
    const e: FeedEntry = { time: Date.now(), from, to, kind, text, task };
    this.feed.push(e);
    if (this.feed.length > 400) this.feed.shift();
    this.onFeed?.(e);
  }

  /**
   * The slice of shared knowledge each agent works with. `focused`: the task brings its own context
   * from the graph, so the Narrator gets only the head of the bible (no list of everything, no catalog).
   */
  context(agent: AgentId, focused = false): string {
    const v = this.view();
    const bible = readBible(v.files);
    const style = v.files['world/style.md'] ?? '';
    const parts: string[] = [];
    const rules = rulesSummary(v.files);
    // The rune canon goes with every narrative task (the Narrator's, the Actor's and the Arbiter's).
    const narrative = agent === 'narrator' || agent === 'actor' || agent === 'arbiter';
    const canon = narrative ? canonSummary(v.files) : '';
    // So does the lexicon: how people speak and behave, the same in every universe (T65).
    const lexicon = narrative ? lexiconSummary(v.files) : '';
    // The game chosen at the Genesis goes to whoever builds on it: stories, coherence, mechanics, requests.
    if (narrative || agent === 'engineer' || agent === 'liaison') parts.push(gameSummary(v.files));
    switch (agent) {
      // The Actor plays the people (T157): it reads what the Narrator reads for those tasks, never more.
      case 'actor':
      case 'narrator':
        if (focused) parts.push(`## The world\n${bibleHead(bible)}`);
        else parts.push(`## Bible of the world\n${bibleSummary(bible, true)}`, `## Existing modules\n${catalogSummary(v.catalog)}`);
        if (canon) parts.push(canon);
        if (lexicon) parts.push(lexicon);
        if (rules) parts.push(focused ? rulesSummary(v.files, FOCUSED_RULES) : rules);
        break;
      case 'cartographer': {
        parts.push(`## Bible of the world\n${bibleSummary(bible)}`, `## Terrains\n${paletteSummary(v.palette)}`, `## Placeable modules\n${catalogSummary(v.catalog)}`);
        let regions: Array<{ name: string; environment: string; center: [number, number]; radius: number }> = [];
        try {
          regions = internalFields('atlas', JSON.parse(v.files['world/atlas.json'] ?? '{}')).regions ?? [];
        } catch {
          regions = [];
        }
        if (regions.length) parts.push(`## Atlas (centre in places; north = negative y)\n${regions.map((r) => `- ${r.name} [${r.environment}] centre ${r.center.join(',')} radius ${r.radius}`).join('\n')}`);
        break;
      }
      case 'sculptor':
        parts.push(`## Style guide\n${style}`);
        break;
      case 'artist':
        parts.push(`## Style guide\n${style}`, `## Tone\n${bible?.tone ?? ''}`);
        break;
      case 'musician':
        parts.push(`## The world\n${bibleHead(bible)}`);
        break;
      case 'physicist':
        parts.push(`## Terrains\n${paletteSummary(v.palette)}`, `## Tone\n${bible?.tone ?? ''}`);
        if (rules) parts.push(rules);
        break;
      case 'engineer':
        parts.push(`## Bible (summary)\n${bible?.summary ?? ''}`, `## Terrains\n${paletteSummary(v.palette)}`);
        break;
      case 'arbiter':
        parts.push(`## Bible of the world\n${bibleSummary(bible)}`, `## Style guide\n${style}`, `## Terrains\n${paletteSummary(v.palette)}`);
        if (canon) parts.push(canon);
        if (lexicon) parts.push(lexicon);
        if (rules) parts.push(rules);
        break;
      case 'liaison':
        parts.push(`## Bible of the world\n${bibleSummary(bible)}`, `## Existing modules\n${catalogSummary(v.catalog)}`);
        if (rules) parts.push(rules);
        break;
    }
    return parts.join('\n\n');
  }

  /**
   * The neighbourhood in the graph of what a task is about (people with their bonds, the place, the
   * plots, the facts that name them), or '' when the graph knows none of it.
   */
  focusContext(focus: string[] | undefined): string {
    if (!focus?.length) return '';
    let graph: WorldGraph | undefined;
    try {
      graph = this.view().graph?.();
    } catch {
      return '';
    }
    const ids = graph?.resolve(focus) ?? [];
    if (!graph || !ids.length) return '';
    this.onFocus?.(ids);
    return `## What the world knows about this task (use these names and these bonds, do not invent others)\n${graph.context(ids, FOCUS_BUDGET)}`;
  }

  /**
   * A closed decision (ADR-0157): the state and the questions to the layer of decisions, today's rule as the floor. Only a task the census
   * names as a decision (`via: 'decide'`) is asked; the knob at 0, a read-only universe and a payer without credits get the rule from the
   * local models, as a call that writes gets them; a failure or an answer outside the options gets the rule, question by question. Never
   * throws: whoever asks always has an answer it can use.
   */
  async decide(agent: AgentId, task: string, call: Pick<DecisionCall, 'state' | 'questions' | 'rule'> & { chi?: string }): Promise<Decisions> {
    const chi = call.chi ?? this.payer?.(task) ?? COMUNE;
    const full: DecisionCall = { agent, task, state: call.state, questions: call.questions, rule: call.rule, chi };
    try {
      if (decisionKnob(task) === undefined) {
        this.say('kernel', 'info', `«${task}» non è una decisione del censimento: vale la regola`, undefined, task);
        return ruleDecisions(full);
      }
      const sealed = this.readOnly?.() !== undefined;
      // The free text of a wanderer stays here (D45.3): whatever else holds, the local models answer.
      const local = freeTextDecision(task) || sealed || (!!this.hasCredits && !this.hasCredits(chi)) || !!this.rationed?.(task);
      return settleDecisions(full, await (local ? this.localAiModels : this.decisions).decide(full));
    } catch (e) {
      this.say('kernel', 'info', `«${task}»: ${(e as Error).message}; vale la regola`, undefined, task);
      return ruleDecisions(full);
    }
  }

  /**
   * The guard on what a wanderer writes, before the Council reads it (T350, D45.5, a closed decision `text.guard`): the five hazards, the
   * local patterns as the rule (`guardRule`), and while TypeSafe keeps what it reads the rule alone (D45.3). Nothing is stopped (rule 3):
   * the call goes with the wanderer's words quoted so that they cannot close the quote, and with a note when the route is not `pass`.
   */
  async guard(door: GuardDoor, text: string, chi?: string): Promise<{ route: GuardRoute; hazards: GuardHazard[]; quoted: string; note: string }> {
    const d = await this.decide('arbiter', 'text.guard', { state: { door, text }, questions: GUARD_QUESTIONS, rule: guardRule(text), ...(chi ? { chi } : {}) });
    const seen = Object.fromEntries(GUARD_HAZARDS.map((h) => [h, d[h] === true])) as Record<GuardHazard, boolean>;
    const hazards = GUARD_HAZARDS.filter((h) => seen[h]);
    const route = guardRoute(door, seen);
    // The route and the hazards, never the words (they are already in the feed of whoever asked).
    if (route !== 'pass') this.say('kernel', 'info', `guardia (${hazards.join(', ')}): ${route === 'isolate' ? 'le parole del viandante vanno tra virgolette, nessun ordine' : 'il Concilio risponde dal mondo'}`, undefined, 'text.guard');
    return { route, hazards, quoted: quoteWanderer(text), note: guardNote(door, seen) };
  }

  /**
   * Whether a text the Council wrote for the world breaks the fourth wall (T350, ADR-0157 §4.4, a closed decision `text.fourthwall`): the
   * words `metaBreak` knows first, without a call; then four atomic questions, the world in a line beside the text. What it says, for the
   * feedback to whoever wrote it, or undefined. Only texts of the Council come here, never a wanderer's (D45.3).
   */
  async fourthWall(text: string, chi?: string): Promise<string | undefined> {
    const files = this.files;
    const hit = metaBreak(text, wordsOf(files), languageOf(files));
    if (hit) return hit;
    if (!text.trim()) return undefined;
    const world = bibleHead(readBible(files)).slice(0, 600);
    const d = await this.decide('arbiter', 'text.fourthwall', { state: { world, text: text.slice(0, 4000) }, questions: FOURTH_WALL_QUESTIONS, rule: FOURTH_WALL_RULE, ...(chi ? { chi } : {}) });
    const broken = (Object.keys(FOURTH_WALL_QUESTIONS) as FourthWallBreak[]).filter((k) => d[k] === true);
    return broken.length ? broken.map((k) => FOURTH_WALL_REASONS[k]).join(', ') : undefined;
  }

  async ask<T>(agent: AgentId, task: string, prompt: string, schema: Schema, opts: CallOptions & { system?: string; role?: string } = {}): Promise<T> {
    try {
      return parseJson<T>(await this.write(agent, task, prompt, { ...opts, schema }));
    } catch (e) {
      if (e instanceof Error) (e as Error & { agent?: AgentId }).agent ??= agent;
      throw e;
    }
  }

  /**
   * A call whose answer is not JSON (the Sculptor's programs). The stable part first — role, principles,
   * the agent's context, then `system` (instructions that change rarely) — so the cache serves it.
   */
  async write(agent: AgentId, task: string, prompt: string, opts: CallOptions & { schema?: Schema; system?: string; role?: string } = {}): Promise<string> {
    const role = opts.role ?? this.files[`prompts/agents/${agent}.md`] ?? `You are the ${agent} of the Council.`;
    // The focus goes last: what comes before it is the same for every focused task of the agent (the cache).
    const focus = this.focusContext(opts.focus);
    const chi = opts.chi ?? this.payer?.(task) ?? COMUNE;
    const sealed = this.readOnly?.() !== undefined;
    const noCredits = !sealed && !!this.hasCredits && !this.hasCredits(chi);
    const useLocal = sealed || noCredits || !!this.rationed?.(task);
    if (sealed) this.say('kernel', 'info', `«${task}»: questo universo si legge soltanto, i modelli locali`, undefined, task);
    else if (useLocal && !noCredits) this.say('kernel', 'info', `«${task}»: i modelli locali, come ha regolato il master`, undefined, task);
    if (noCredits) {
      this.say('kernel', 'info', chi === COMUNE ? `Nessuno dei collegati ha crediti: la richiesta «${task}» viene gestita con i modelli locali.` : `I crediti di ${chi} sono esauriti: la richiesta «${task}» viene gestita con i modelli locali.`, undefined, task);
    }
    const models = useLocal ? this.localAiModels : this.ai;
    // An agent with an explicit cache (T351, ADR-0185): its system instructions are the stable prefix the cache keeps, the focus
    // changes at every call and opens the prompt instead.
    const cache = CACHED_AGENTS.has(agent);
    const stable = [role, COUNCIL_PRINCIPLES, languageBlock(languageOf(this.files)), this.context(agent, !!focus), opts.system];
    return models.text({
      agent,
      task,
      system: [...stable, cache ? '' : focus].filter(Boolean).join('\n\n'),
      prompt: cache && focus ? `${focus}\n\n${prompt}` : prompt,
      ...(cache ? { cache } : {}),
      schema: opts.schema,
      images: opts.images,
      temperature: opts.temperature,
      data: opts.data,
      model: opts.model,
      thinking: opts.thinking ?? this.thinking?.(),
      chi,
    });
  }
}
