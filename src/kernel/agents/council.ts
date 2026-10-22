// The Council: the agents that generate the universe. Each agent is a role prompt stored in the
// universe (prompts/agents/<id>.md, so it is rewritable and lives in the corona) plus the slice of
// shared world knowledge it needs. They see each other's work and the Arbiter sends it back when
// narrative, graphics, engine and physics disagree.

import { parseJson, type Models, type Schema, type Thinking } from '../ai/models';
import { COUNCIL_PRINCIPLES } from '../fourthwall';
import type { FileMap, MagicRune, Spell, TileDef } from '../types';

export type AgentId = 'narratore' | 'cartografo' | 'artista' | 'scultore' | 'fisico' | 'ingegnere' | 'arbitro' | 'referente';

export const AGENTS: Record<AgentId, { name: string; color: string; sigil: string }> = {
  narratore: { name: 'Narratore', color: '#ffcf5c', sigil: '✒' },
  cartografo: { name: 'Cartografo', color: '#7dd87d', sigil: '⌖' },
  artista: { name: 'Artista', color: '#ff8ad8', sigil: '✎' },
  scultore: { name: 'Scultore', color: '#ffa65c', sigil: '◈' },
  fisico: { name: 'Fisico', color: '#6fc3ff', sigil: '⚖' },
  ingegnere: { name: 'Ingegnere', color: '#b9a6ff', sigil: '⚙' },
  arbitro: { name: 'Arbitro', color: '#ff6b6b', sigil: '⚑' },
  referente: { name: 'Referente', color: '#f2f2f2', sigil: '✉' },
};

export type FeedKind = 'propone' | 'obietta' | 'approva' | 'corregge' | 'scolpisce' | 'scarta' | 'info' | 'errore';

export interface CallOptions {
  data?: unknown;
  images?: string[];
  temperature?: number;
  /** A model other than the text model (the Sculptor's per class, the Artist's). */
  model?: string;
  thinking?: Thinking;
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
  palette: Record<string, TileDef>;
  catalog: CatalogEntry[];
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

export function paletteSummary(palette: Record<string, TileDef>): string {
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

export function catalogSummary(catalog: CatalogEntry[]): string {
  return catalog.map((m) => `- ${m.id} «${m.name}» [${m.kind}] terreni ${m.tiles.join('') || '-'}: ${m.context}`).join('\n');
}

export class Council {
  readonly feed: FeedEntry[] = [];
  onFeed?: (e: FeedEntry) => void;

  constructor(
    public models: Models,
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

  /** The slice of shared knowledge each agent works with. */
  context(agent: AgentId): string {
    const v = this.view();
    const bible = readBible(v.files);
    const style = v.files['world/style.md'] ?? '';
    const parts: string[] = [];
    const rules = rulesSummary(v.files);
    // The rune canon goes with every narrative task (the Narrator's and the Arbiter's).
    const canon = agent === 'narratore' || agent === 'arbitro' ? canonSummary(v.files) : '';
    switch (agent) {
      case 'narratore':
        parts.push(`## Bibbia del mondo\n${bibleSummary(bible, true)}`, `## Moduli esistenti\n${catalogSummary(v.catalog)}`);
        if (canon) parts.push(canon);
        if (rules) parts.push(rules);
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
        if (rules) parts.push(rules);
        break;
      case 'referente':
        parts.push(`## Bibbia del mondo\n${bibleSummary(bible)}`, `## Moduli esistenti\n${catalogSummary(v.catalog)}`);
        if (rules) parts.push(rules);
        break;
    }
    return parts.join('\n\n');
  }

  async ask<T>(agent: AgentId, task: string, prompt: string, schema: Schema, opts: CallOptions = {}): Promise<T> {
    return parseJson<T>(await this.write(agent, task, prompt, { ...opts, schema }));
  }

  /**
   * A call whose answer is not JSON (the Sculptor's programs). The stable part first — role, principles,
   * the agent's context, then `system` (instructions that change rarely) — so the cache serves it.
   */
  async write(agent: AgentId, task: string, prompt: string, opts: CallOptions & { schema?: Schema; system?: string; role?: string } = {}): Promise<string> {
    const role = opts.role ?? this.files[`prompts/agents/${agent}.md`] ?? `Sei il ${AGENTS[agent].name} del gioco.`;
    return this.models.text({
      agent,
      task,
      system: [role, COUNCIL_PRINCIPLES, this.context(agent), opts.system].filter(Boolean).join('\n\n'),
      prompt,
      schema: opts.schema,
      images: opts.images,
      temperature: opts.temperature,
      data: opts.data,
      model: opts.model,
      thinking: opts.thinking,
    });
  }
}
