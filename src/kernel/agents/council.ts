// The Council: the agents that generate the universe. Each agent is a role prompt stored in the
// universe (prompts/agents/<id>.md, so it is rewritable and lives in the corona) plus the slice of
// shared world knowledge it needs. They see each other's work and the Arbiter sends it back when
// narrative, graphics, engine and physics disagree.

import { parseJson, type AiModels, type Schema, type Thinking } from '../ai/models';
import { MockAiModels } from '../ai/mock';
import { COMUNE } from '../cards';
import { COUNCIL_PRINCIPLES, lexiconWords } from '../fourthwall';
import type { FileMap, MagicRune, Spell, TerrainDef } from '../types';
import type { WorldGraph } from '../graph';
import { gameSetupSummary } from '../gameSetup';
import { repairGameSetup } from '../validator';

export type AgentId = 'narratore' | 'cartografo' | 'artista' | 'scultore' | 'fisico' | 'ingegnere' | 'arbitro' | 'referente' | 'attore' | 'musicista';

export const AGENTS: Record<AgentId, { name: string; color: string; sigil: string }> = {
  narratore: { name: 'Narratore', color: '#ffcf5c', sigil: '✒' },
  cartografo: { name: 'Cartografo', color: '#7dd87d', sigil: '⌖' },
  artista: { name: 'Artista', color: '#ff8ad8', sigil: '✎' },
  scultore: { name: 'Scultore', color: '#ffa65c', sigil: '◈' },
  fisico: { name: 'Fisico', color: '#6fc3ff', sigil: '⚖' },
  ingegnere: { name: 'Ingegnere', color: '#b9a6ff', sigil: '⚙' },
  arbitro: { name: 'Arbitro', color: '#ff6b6b', sigil: '⚑' },
  referente: { name: 'Referente', color: '#f2f2f2', sigil: '✉' },
  /** Plays the people with the Narrator's sheets, when the master turns it on (T157, ADR-0116). */
  attore: { name: 'Attore', color: '#5ce0c8', sigil: '◐' },
  /** Writes the sound programs of what the world asks for (T225): in the Artist's house. */
  musicista: { name: 'Musicista', color: '#8fb8ff', sigil: '♪' },
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
  titolo: string;
  tono: string;
  sintesi: string;
  storia?: string;
  luoghi: string[];
  personaggi: string[];
  fatti: string[];
  /** Legends and mysteries of the world, told from inside it. */
  misteri?: string[];
  /** Customs and sayings of this universe that enrich the lexicon (world/lessico.md) without contradicting it (T65). */
  usanze?: string[];
  /** Old bibles: hints that the world was a simulation. No longer used (no meta-game, ADR-0025). */
  crepe?: string[];
}

export function readBible(files: FileMap): Bible | null {
  try {
    return JSON.parse(files['world/bible.json'] ?? 'null');
  } catch {
    return null;
  }
}

export function bibleSummary(b: Bible | null, full = false): string {
  if (!b) return '(nessuna bibbia del mondo)';
  const list = (xs: string[] | undefined, n: number) => (xs ?? []).slice(-n).map((x) => `- ${x}`).join('\n');
  return [
    `Titolo: ${b.titolo}`,
    `Tono: ${b.tono}`,
    `Sintesi: ${b.sintesi}`,
    full && b.storia ? `Storia: ${b.storia}` : '',
    `Luoghi noti:\n${list(b.luoghi, full ? 30 : 12)}`,
    `Personaggi noti:\n${list(b.personaggi, full ? 20 : 8)}`,
    `Fatti stabiliti:\n${list(b.fatti, full ? 30 : 12)}`,
    b.misteri?.length ? `Misteri e leggende del mondo:\n${list(b.misteri, 8)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** The head of the bible, for the tasks that bring their own context from the graph. */
export function bibleHead(b: Bible | null): string {
  if (!b) return '(nessuna bibbia del mondo)';
  return [`Titolo: ${b.titolo}`, `Tono: ${b.tono}`, `Sintesi: ${b.sintesi}`].join('\n');
}

/** Characters of graph context a focused task gets (about 700 tokens), and how many recent rules. */
export const FOCUS_BUDGET = 2800;
const FOCUSED_RULES = 12;

export function paletteSummary(palette: Record<string, TerrainDef>): string {
  return Object.entries(palette)
    .filter(([code]) => code !== '?')
    .map(([code, t]) => `- ${code} = ${t.name} (${t.color}${t.solid ? ', solido' : ''}${t.speed && t.speed !== 1 ? `, velocità ×${t.speed}` : ''})${t.description ? `: ${t.description}` : ''}`)
    .join('\n');
}

/** Rules established while the world was played (world/rules.json): later judgements must respect them. */
export function rulesSummary(files: FileMap, n = 30): string {
  let list: Array<{ testo: string; possibile: boolean; racconto: string; effetti?: string[] }> = [];
  try {
    list = JSON.parse(files['world/rules.json'] ?? '{}').regole ?? [];
  } catch {
    return '';
  }
  if (!list.length) return '';
  const lines = list.slice(-n).map((r) => `- ${r.testo}: ${r.possibile ? `si può${r.effetti?.length ? ` (${r.effetti.join(', ')})` : ''}` : 'non si può'} — ${r.racconto}`);
  return `## Regole già stabilite dal Concilio (rispettale, sii coerente)\n${lines.join('\n')}`;
}

/**
 * The rune canon (world/canone.md): what the people of the world know about runes, plus the magic runes
 * and incantations the universe actually has. Every narrative task gets it, so no story invents new rune
 * behaviours.
 */
export function canonSummary(files: FileMap): string {
  const canon = (files['world/canone.md'] ?? '').replace(/^# .*\n+/, '').trim();
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
    for (const [token, r] of Object.entries(m.runes ?? {})) runes.push(`- ${r.glyph} ${r.name} («${token}», ${r.element}): ${r.description}`);
    for (const [seq, sp] of Object.entries(m.spells ?? {})) spells.push(`- ${seq.split(' ').join(' + ')} → ${sp.name}: ${sp.description}`);
  }
  return [
    '## Canone delle rune (vale sempre: nessuna trama, fatto, mistero o dialogo dà alle rune comportamenti che qui non ci sono)',
    canon,
    runes.length ? `### Le rune magiche di questo mondo\n${runes.join('\n')}` : '',
    spells.length ? `### Gli incantesimi conosciuti\n${spells.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** The words of the lexicon (world/lessico.md) no text of the world explains (T65). */
export function wordsOf(files: FileMap): string[] {
  return lexiconWords(files['world/lessico.md'] ?? '');
}

/**
 * The lexicon (world/lessico.md): how people speak and behave in every universe, whatever the setting, plus
 * the few customs this universe added (bible → usanze). Every narrative task gets it, like the rune canon.
 */
export function lexiconSummary(files: FileMap): string {
  const lexicon = (files['world/lessico.md'] ?? '').replace(/^# .*\n+/, '').trim();
  if (!lexicon) return '';
  const own = readBible(files)?.usanze ?? [];
  return [
    "## Lessico del mondo (vale sempre: le persone parlano e si comportano così, in ogni epoca; usalo nei dialoghi, nelle cose e nella bibbia, senza mai spiegarlo)",
    lexicon,
    own.length ? `### Usanze di questo mondo\n${own.map((l) => `- ${l}`).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** The game chosen before the Genesis (universe.json → partita), as a principle of the Council (ADR-0053). */
export function gameSummary(files: FileMap): string {
  let raw: unknown;
  try {
    raw = JSON.parse(files['universe.json'] ?? '{}').partita;
  } catch {
    raw = undefined;
  }
  return gameSetupSummary(repairGameSetup(raw));
}

export function catalogSummary(catalog: CatalogEntry[]): string {
  return catalog.map((m) => `- ${m.id} «${m.name}» [${m.kind}] terreni ${m.tiles.join('') || '-'}: ${m.context}`).join('\n');
}

export class Council {
  readonly feed: FeedEntry[] = [];
  onFeed?: (e: FeedEntry) => void;
  /** Who pays for a task asked now (T36): the kernel's policy (cards.ts); without one, the world. */
  payer?: (task: string) => string;
  /** Whether a wanderer has credits for online calls (T45a); when false, local models are used. */
  hasCredits?: (chi: string) => boolean;
  /** Whether a knob of the master keeps this call from the models (T247, ADR-0132): it goes to the local ones, as without credits. */
  rationed?: (task: string) => boolean;
  /** The reasoning of every call that does not say its own (`ai.thinking`): the lobby sets it (T247). */
  thinking?: () => CallOptions['thinking'];
  localAiModels: AiModels = new MockAiModels();
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
    const narrative = agent === 'narratore' || agent === 'attore' || agent === 'arbitro';
    const canon = narrative ? canonSummary(v.files) : '';
    // So does the lexicon: how people speak and behave, the same in every universe (T65).
    const lexicon = narrative ? lexiconSummary(v.files) : '';
    // The game chosen at the Genesis goes to whoever builds on it: stories, coherence, mechanics, requests.
    if (narrative || agent === 'ingegnere' || agent === 'referente') parts.push(gameSummary(v.files));
    switch (agent) {
      // The Actor plays the people (T157): it reads what the Narrator reads for those tasks, never more.
      case 'attore':
      case 'narratore':
        if (focused) parts.push(`## Il mondo\n${bibleHead(bible)}`);
        else parts.push(`## Bibbia del mondo\n${bibleSummary(bible, true)}`, `## Moduli esistenti\n${catalogSummary(v.catalog)}`);
        if (canon) parts.push(canon);
        if (lexicon) parts.push(lexicon);
        if (rules) parts.push(focused ? rulesSummary(v.files, FOCUSED_RULES) : rules);
        break;
      case 'cartografo': {
        parts.push(`## Bibbia del mondo\n${bibleSummary(bible)}`, `## Terreni\n${paletteSummary(v.palette)}`, `## Moduli posizionabili\n${catalogSummary(v.catalog)}`);
        let regions: Array<{ nome: string; ambiente: string; centro: [number, number]; raggio: number }> = [];
        try {
          regions = JSON.parse(v.files['world/atlas.json'] ?? '{}').regioni ?? [];
        } catch {
          regions = [];
        }
        if (regions.length) parts.push(`## Atlante (centro in luoghi; nord = y negativa)\n${regions.map((r) => `- ${r.nome} [${r.ambiente}] centro ${r.centro.join(',')} raggio ${r.raggio}`).join('\n')}`);
        break;
      }
      case 'scultore':
        parts.push(`## Guida di stile\n${style}`);
        break;
      case 'artista':
        parts.push(`## Guida di stile\n${style}`, `## Tono\n${bible?.tono ?? ''}`);
        break;
      case 'musicista':
        parts.push(`## Il mondo\n${bibleHead(bible)}`);
        break;
      case 'fisico':
        parts.push(`## Terreni\n${paletteSummary(v.palette)}`, `## Tono\n${bible?.tono ?? ''}`);
        if (rules) parts.push(rules);
        break;
      case 'ingegnere':
        parts.push(`## Bibbia (sintesi)\n${bible?.sintesi ?? ''}`, `## Terreni\n${paletteSummary(v.palette)}`);
        break;
      case 'arbitro':
        parts.push(`## Bibbia del mondo\n${bibleSummary(bible)}`, `## Guida di stile\n${style}`, `## Terreni\n${paletteSummary(v.palette)}`);
        if (canon) parts.push(canon);
        if (lexicon) parts.push(lexicon);
        if (rules) parts.push(rules);
        break;
      case 'referente':
        parts.push(`## Bibbia del mondo\n${bibleSummary(bible)}`, `## Moduli esistenti\n${catalogSummary(v.catalog)}`);
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
    return `## Ciò che il mondo sa di questo compito (usa questi nomi e questi legami, non inventarne altri)\n${graph.context(ids, FOCUS_BUDGET)}`;
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
    const role = opts.role ?? this.files[`prompts/agents/${agent}.md`] ?? `Sei il ${AGENTS[agent].name} del gioco.`;
    // The focus goes last: what comes before it is the same for every focused task of the agent (the cache).
    const focus = this.focusContext(opts.focus);
    const chi = opts.chi ?? this.payer?.(task) ?? COMUNE;
    const noCredits = !!this.hasCredits && !this.hasCredits(chi);
    const useLocal = noCredits || !!this.rationed?.(task);
    if (useLocal && !noCredits) this.say('kernel', 'info', `«${task}»: i modelli locali, come ha regolato il master`, undefined, task);
    if (noCredits) {
      this.say('kernel', 'info', chi === COMUNE ? `Nessuno dei collegati ha crediti: la richiesta «${task}» viene gestita con i modelli locali.` : `I crediti di ${chi} sono esauriti: la richiesta «${task}» viene gestita con i modelli locali.`, undefined, task);
    }
    const models = useLocal ? this.localAiModels : this.ai;
    return models.text({
      agent,
      task,
      system: [role, COUNCIL_PRINCIPLES, this.context(agent, !!focus), opts.system, focus].filter(Boolean).join('\n\n'),
      prompt,
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
