// Content: what fills the world. Text is cheap, so the Council writes a lot of it: packs of items
// (with categories, weights, effects, tags), recipes and loot tables; things mentioned in
// conversation; individuals behind every NPC archetype.

import type { Schema } from '../ai/models';
import { hashStr } from '../rng';
import { CATEGORY_GLYPHS, normName } from '../content';
import { ITEM_CATEGORIES, type ItemDef, type LootTable, type Recipe } from '../types';
import { slug } from './forge';
import type { AgentId, Council } from './council';
import { FORME, formaModel } from '../modeldirector';
import { ACTIVITIES, DAY_PHASES, defaultRoutine, inferActivity, RELATION_WORDS, WHERES, type Activity, type DayPhase, type Gender, type Relation, type RoutineStep, type Species, type Where } from '../society';

const ITEM_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    nome: { type: 'STRING' },
    descrizione: { type: 'STRING' },
    categoria: { type: 'STRING', enum: [...ITEM_CATEGORIES] },
    peso: { type: 'NUMBER' },
    pila: { type: 'INTEGER' },
    tag: { type: 'ARRAY', items: { type: 'STRING' } },
    effetti: { type: 'OBJECT', properties: { fame: { type: 'NUMBER' }, sete: { type: 'NUMBER' }, energia: { type: 'NUMBER' }, salute: { type: 'NUMBER' }, mana: { type: 'NUMBER' } } },
    impugnabile: { type: 'BOOLEAN' },
    contenitore: { type: 'INTEGER', description: 'solo per borse, sacche, cesti, bisacce che si portano addosso: quante cose ci stanno dentro (2-12)' },
    posto: { type: 'STRING', description: 'solo per ciò che si indossa o si impugna: testa, corpo, gambe, piedi, mani, arma, scudo, anello, collo, schiena' },
    bonus: { type: 'OBJECT', description: 'solo per ciò che si indossa o si impugna: cosa dà', properties: { difesa: { type: 'NUMBER' }, attacco: { type: 'NUMBER' }, velocita: { type: 'NUMBER', description: 'moltiplicatore, es. 0.95 per un\'armatura pesante, 1.1 per stivali leggeri' }, peso: { type: 'NUMBER', description: 'peso trasportabile in più (zaini)' }, luce: { type: 'NUMBER' }, calore: { type: 'NUMBER' } } },
    aspetto: { type: 'STRING' },
    forma: { type: 'STRING', enum: [...FORME], description: 'la forma comune a cui somiglia (un modello per forma, colorato come l\'oggetto)' },
  },
  required: ['nome', 'descrizione', 'categoria', 'peso', 'pila', 'tag', 'aspetto', 'forma'],
};

interface RawItem {
  nome: string;
  descrizione: string;
  categoria: string;
  peso: number;
  pila: number;
  tag: string[];
  effetti?: { fame?: number; sete?: number; energia?: number; salute?: number; mana?: number };
  impugnabile?: boolean;
  contenitore?: number;
  aspetto: string;
  forma?: string;
  posto?: string;
  bonus?: Record<string, number>;
}

export interface Pack {
  items: ItemDef[];
  recipes: Recipe[];
  loot: Record<string, LootTable>;
}

const clamp = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

export function toItemDef(r: RawItem, taken: Set<string>): ItemDef | null {
  if (!r?.nome?.trim()) return null;
  let id = `item.${slug(r.nome)}`;
  for (let i = 2; taken.has(id); i++) id = `item.${slug(r.nome)}-${i}`;
  taken.add(id);
  const category = (ITEM_CATEGORIES as readonly string[]).includes(r.categoria) ? (r.categoria as ItemDef['category']) : 'varie';
  const e = r.effetti ?? {};
  const effects = { hunger: clamp(e.fame, -50, 60, 0), thirst: clamp(e.sete, -50, 60, 0), energy: clamp(e.energia, -50, 60, 0), health: clamp(e.salute, -50, 60, 0), mana: clamp(e.mana, -50, 60, 0) };
  const bag = category === 'contenitore' && Number(r.contenitore) >= 2 ? { size: Math.round(clamp(r.contenitore, 2, 12, 4)) } : undefined;
  const hasEffects = Object.values(effects).some((v) => v !== 0);
  return {
    id,
    name: r.nome.trim().slice(0, 40),
    description: String(r.descrizione ?? '').slice(0, 240),
    category,
    weight: clamp(r.peso, 0, 30, 1),
    stack: bag ? 1 : Math.round(clamp(r.pila, 1, 50, 1)),
    tags: [...new Set((r.tag ?? []).map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 8))],
    glyph: CATEGORY_GLYPHS[category] ?? '•',
    color: `hsl(${hashStr(id) % 360} 60% 66%)`,
    aspetto: String(r.aspetto ?? r.nome).slice(0, 200),
    ...((FORME as readonly string[]).includes(r.forma ?? '') ? { model: formaModel(r.forma!) } : {}),
    equippable: !!r.impugnabile,
    ...(hasEffects ? { effects } : {}),
    ...(bag ? { container: bag } : {}),
    ...(r.posto && /^[a-z]{3,12}$/.test(String(r.posto).toLowerCase().trim()) ? { slot: String(r.posto).toLowerCase().trim() } : {}),
    ...(r.bonus && typeof r.bonus === 'object' ? { bonus: Object.fromEntries(Object.entries(r.bonus).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)).map(([k, v]) => [k, Math.max(-50, Math.min(50, v as number))])) } : {}),
  };
}

/** A pack of new items with recipes and loot tables, cross-checked by the Physicist and the Arbiter. */
export async function itemPack(c: Council, opts: { count: number; existing: string[]; hints: string[]; tags: string[] }): Promise<{ items: RawItem[]; recipes: unknown[]; loot: unknown }> {
  const askItems = (feedback = '') =>
    c.ask<{ oggetti: RawItem[] }>(
      'narratore',
      'content.items',
      [
        `Inventa ${opts.count} oggetti per questo mondo, del genere che si trova spesso nelle case, nelle botteghe, nei campi e nei boschi (stile Project Zomboid: tanti oggetti comuni, utili, credibili; pochi rari).`,
        `Varia le categorie: cibo, bevande, medicine, attrezzi, armi, materiali, luci, vestiario, contenitori, varie.`,
        opts.hints.length ? `Includi, se coerenti con il mondo: ${opts.hints.join(', ')}.` : '',
        opts.existing.length ? `Esistono già (non ripeterli): ${opts.existing.slice(-80).join(', ')}.` : '',
        `"effetti" (da -50 a 60) solo per ciò che si consuma: fame/sete/energia/salute recuperate. "pila": quanti se ne impilano (1 per attrezzi e armi). "peso" in unità (il viandante ne porta 20). "tag": parole utili per trovarli e combinarli (es. cucina, legno, metallo, erbe, bottega, contadino). Tag comuni da usare: ${opts.tags.join(', ')}.`,
        feedback && `L'Arbitro ha obiettato: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      { type: 'OBJECT', properties: { oggetti: { type: 'ARRAY', items: ITEM_SCHEMA } }, required: ['oggetti'] },
      { data: { ...opts, feedback }, temperature: 0.95 },
    );
  let { oggetti } = await askItems();
  c.say('narratore', 'propone', `${oggetti.length} oggetti: ${oggetti.slice(0, 8).map((o) => o.nome).join(', ')}${oggetti.length > 8 ? '…' : ''}`);

  // The Physicist checks weights, stacks and effects against what the things are.
  const phys = await c.ask<{ correzioni: Array<{ nome: string; peso?: number; pila?: number; effetti?: RawItem['effetti']; nota?: string }> }>(
    'fisico',
    'content.physics',
    `Controlla peso, pila ed effetti di questi oggetti: correggi solo ciò che è fisicamente incoerente (una incudine non pesa 1, un'ascia non si impila, il pane non dà 60 di energia).\n${oggetti.map((o) => `${o.nome}: peso ${o.peso}, pila ${o.pila}, effetti ${JSON.stringify(o.effetti ?? {})}`).join('\n')}`,
    {
      type: 'OBJECT',
      properties: {
        correzioni: {
          type: 'ARRAY',
          items: { type: 'OBJECT', properties: { nome: { type: 'STRING' }, peso: { type: 'NUMBER' }, pila: { type: 'INTEGER' }, effetti: ITEM_SCHEMA.properties!.effetti, nota: { type: 'STRING' } }, required: ['nome'] },
        },
      },
      required: ['correzioni'],
    },
    { data: { oggetti }, temperature: 0.2 },
  );
  for (const fix of phys.correzioni ?? []) {
    const it = oggetti.find((o) => o.nome === fix.nome);
    if (!it) continue;
    if (typeof fix.peso === 'number') it.peso = fix.peso;
    if (typeof fix.pila === 'number') it.pila = fix.pila;
    if (fix.effetti) it.effetti = fix.effetti;
  }
  if (phys.correzioni?.length) c.say('fisico', 'corregge', phys.correzioni.slice(0, 4).map((f) => `${f.nome}${f.nota ? `: ${f.nota}` : ''}`).join('; '), 'narratore');

  const review = await c.ask<{ approvato: boolean; problemi: Array<{ agente: AgentId; problema: string }> }>(
    'arbitro',
    'content.review',
    `Questi oggetti sono coerenti con il mondo (epoca, tono, tecnologia)? Segnala solo quelli fuori posto.\n${oggetti.map((o) => `${o.nome} (${o.categoria}): ${o.descrizione}`).join('\n')}`,
    { type: 'OBJECT', properties: { approvato: { type: 'BOOLEAN' }, problemi: { type: 'ARRAY', items: { type: 'OBJECT', properties: { agente: { type: 'STRING', enum: ['narratore'] }, problema: { type: 'STRING' } }, required: ['agente', 'problema'] } } }, required: ['approvato', 'problemi'] },
    { data: { oggetti }, temperature: 0.2 },
  );
  if (!review.approvato && review.problemi?.length) {
    const issues = review.problemi.map((p) => p.problema).join('; ');
    c.say('arbitro', 'obietta', issues, 'narratore');
    ({ oggetti } = await askItems(issues));
    c.say('narratore', 'corregge', `${oggetti.length} oggetti riscritti`);
  } else c.say('arbitro', 'approva', 'Gli oggetti appartengono al mondo.');

  const names = [...opts.existing, ...oggetti.map((o) => o.nome)];
  const rec = await c.ask<{ ricette: unknown[]; bottino: unknown }>(
    'narratore',
    'content.recipes',
    [
      `Scrivi 6-10 ricette di fabbricazione usando SOLO questi oggetti (nomi esatti): ${names.slice(-120).join(', ')}.`,
      'Ogni ricetta: ingredienti consumati, attrezzi necessari ma non consumati, un risultato. Devono avere senso (corda + bastone → canna da pesca rudimentale solo se esiste).',
      'Poi "bottino": tabelle di cosa si trova dove. Chiavi consigliate: comune, cucina, cassa, bottega, terreno, contadino, bosco. Ogni voce sceglie per "tag" (una categoria o un tag degli oggetti) o per "oggetto" (nome esatto), con un peso.',
    ].join('\n'),
    {
      type: 'OBJECT',
      properties: {
        ricette: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              nome: { type: 'STRING' },
              ingredienti: { type: 'ARRAY', items: { type: 'OBJECT', properties: { oggetto: { type: 'STRING' }, quantita: { type: 'INTEGER' } }, required: ['oggetto', 'quantita'] } },
              attrezzi: { type: 'ARRAY', items: { type: 'STRING' } },
              risultato: { type: 'OBJECT', properties: { oggetto: { type: 'STRING' }, quantita: { type: 'INTEGER' } }, required: ['oggetto', 'quantita'] },
            },
            required: ['nome', 'ingredienti', 'risultato'],
          },
        },
        bottino: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              tabella: { type: 'STRING' },
              voci: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tag: { type: 'STRING' }, oggetto: { type: 'STRING' }, peso: { type: 'NUMBER' } }, required: ['peso'] } },
            },
            required: ['tabella', 'voci'],
          },
        },
      },
      required: ['ricette', 'bottino'],
    },
    { data: { names }, temperature: 0.6 },
  );
  c.say('narratore', 'propone', `${(rec.ricette ?? []).length} ricette e ${Array.isArray(rec.bottino) ? rec.bottino.length : 0} tabelle di bottino`);
  return { items: oggetti, recipes: rec.ricette ?? [], loot: rec.bottino ?? [] };
}

/** Things someone talked about that do not exist yet: the Narrator defines them, coherently. */
export async function defineItems(c: Council, names: string[], context: string): Promise<RawItem[]> {
  if (!names.length) return [];
  const r = await c.ask<{ oggetti: RawItem[] }>(
    'narratore',
    'content.define',
    `Nel mondo si è parlato di: ${names.join(', ')} (${context}). Definisci ognuno come oggetto del mondo, coerente con la bibbia. Se qualcosa non può esistere in questo mondo, omettilo.`,
    { type: 'OBJECT', properties: { oggetti: { type: 'ARRAY', items: ITEM_SCHEMA } }, required: ['oggetti'] },
    { data: { names, context }, temperature: 0.6 },
  );
  if (r.oggetti?.length) c.say('narratore', 'propone', `nuovi oggetti nel mondo: ${r.oggetti.map((o) => o.nome).join(', ')}`);
  return r.oggetti ?? [];
}

/** Raw model output → typed pack. Names in recipes and loot are resolved against all known items. */
export function assemblePack(raw: { items: RawItem[]; recipes: unknown[]; loot: unknown }, known: Map<string, string>, taken: Set<string>): Pack {
  const items = raw.items.map((r) => toItemDef(r, taken)).filter((d): d is ItemDef => !!d);
  const ids = new Map(known);
  for (const d of items) ids.set(normName(d.name), d.id);
  // Models rarely repeat names exactly ("Pane" for "Pagnotta di pane"): exact first, then by containment.
  const resolve = (name: unknown): string | undefined => {
    const n = normName(String(name ?? ''));
    if (!n) return undefined;
    if (ids.has(n)) return ids.get(n);
    let best: [string, number] | undefined;
    for (const [k, id] of ids) {
      if (!(k.includes(n) || n.includes(k)) || Math.min(k.length, n.length) < 3) continue;
      const score = Math.abs(k.length - n.length);
      if (!best || score < best[1]) best = [id, score];
    }
    return best?.[0];
  };
  const recipes: Recipe[] = [];
  for (const r of (raw.recipes ?? []) as Array<any>) {
    const inputs = (r?.ingredienti ?? []).map((i: any) => ({ item: resolve(i?.oggetto), count: Math.round(clamp(i?.quantita, 1, 10, 1)) }));
    const out = resolve(r?.risultato?.oggetto);
    const tools = (r?.attrezzi ?? []).map(resolve).filter(Boolean);
    if (!out || !inputs.length || inputs.some((i: any) => !i.item) || inputs.some((i: any) => i.item === out)) continue;
    recipes.push({ id: `ricetta.${slug(String(r.nome))}-${recipes.length}`, name: String(r.nome).slice(0, 50), inputs, tools, output: { item: out, count: Math.round(clamp(r?.risultato?.quantita, 1, 10, 1)) } });
  }
  const loot: Record<string, LootTable> = {};
  for (const t of (Array.isArray(raw.loot) ? raw.loot : []) as Array<any>) {
    const key = slug(String(t?.tabella ?? ''));
    const entries = (t?.voci ?? [])
      .map((v: any) => (v?.oggetto ? { item: resolve(v.oggetto), weight: clamp(v.peso, 0.1, 100, 1) } : { tag: String(v?.tag ?? '').toLowerCase(), weight: clamp(v?.peso, 0.1, 100, 1) }))
      .filter((v: any) => v.item || v.tag);
    if (key && entries.length) loot[key] = { rolls: [1, 3], entries };
  }
  return { items, recipes, loot };
}

export interface Identity {
  name: string;
  persona: string;
  look: string;
  carrying: string[];
  /** Their place in society (ADR-0018). */
  job?: string;
  gender?: Gender;
  age?: string;
  family?: Relation[];
  routine?: RoutineStep[];
  story?: string;
}

const INDIVIDUAL_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    nome: { type: 'STRING' },
    persona: { type: 'STRING' },
    aspetto: { type: 'STRING' },
    porta: { type: 'ARRAY', items: { type: 'STRING' } },
    mestiere: { type: 'STRING' },
    genere: { type: 'STRING', enum: ['maschio', 'femmina'] },
    eta: { type: 'STRING', description: 'giovane, adulto, anziano…' },
    storia: { type: 'STRING', description: 'due frasi: da dove viene, cosa le è successo' },
    famiglia: { type: 'ARRAY', items: { type: 'OBJECT', properties: { nome: { type: 'STRING' }, legame: { type: 'STRING', description: 'ciò che QUESTO individuo è per quella persona, al suo genere: madre, padre, figlia, figlio, sorella, fratello, moglie, marito, amica, amico, rivale, maestra, apprendista, padrone (di un animale), animale (di un padrone)…' } }, required: ['nome', 'legame'] } },
    routine: {
      type: 'ARRAY',
      description: 'la sua giornata: 4 voci, una per momento',
      items: { type: 'OBJECT', properties: { quando: { type: 'STRING', enum: [...DAY_PHASES] }, fa: { type: 'STRING', description: 'cosa fa, breve (es. "impasta il pane")' }, dove: { type: 'STRING', enum: [...WHERES] }, azione: { type: 'STRING', enum: [...ACTIVITIES], description: 'il gesto che si vede fare' } }, required: ['quando', 'fa', 'dove', 'azione'] },
    },
  },
  required: ['nome', 'persona', 'aspetto', 'porta', 'mestiere', 'genere', 'famiglia', 'routine'],
};

/** What the Narrator must know of relations for this species (the kernel repairs the rest). */
function relationRules(specie: Species): string {
  return [
    `In "famiglia" ogni legame dice cosa sei TU per quella persona, nella forma del tuo genere: {"nome": "Tazio", "legame": "figlia"} vuol dire che sei la figlia di Tazio. Parole possibili: ${RELATION_WORDS.join(', ')}.`,
    specie === 'animale'
      ? 'È un ANIMALE: niente mestieri da persona (il "mestiere" è ciò che fa: caccia topi, fa la guardia), niente parenti, maestri o apprendisti umani. Con una persona può essere solo "animale" (di un padrone: uno solo), "amico" o "rivale"; madre, padre, figlio, fratello solo con altri animali della sua specie.'
      : 'È una PERSONA: un animale non è suo parente né suo apprendista; di un animale può essere "padrone" (l\'animale ne ha uno solo). Al massimo un padre, una madre e un coniuge.',
    'Il nome deve essere nuovo: diverso, anche nella prima parola, da quelli delle persone già conosciute (niente "Elias il Giovane" accanto a "Elias il Vecchio", niente "Ombroso" accanto a "Ombra").',
  ].join('\n');
}

/**
 * Behind every archetype there are individuals: a name, a past, their own pockets — and a place in
 * society: a job, a family related to the people already known, a daily routine.
 */
export async function individuate(c: Council, archetype: { name: string; description: string; persona: string; specie?: Species }, ctx: { place: string; common: string[]; society?: string; avoid?: string[] }): Promise<Identity> {
  const specie = archetype.specie ?? 'persona';
  const r = await c.ask<{ nome: string; persona: string; aspetto: string; porta: string[]; mestiere?: string; genere?: string; eta?: string; storia?: string; famiglia?: Relation[]; routine?: Array<{ quando: string; fa: string; dove: string; azione?: string }> }>(
    'narratore',
    'npc.individuate',
    [
      `Crea un individuo di questo tipo di personaggio: «${archetype.name}» (${archetype.description}), ${specie === 'animale' ? 'un animale' : 'una persona'}.`,
      `Scheda del tipo:\n${archetype.persona}`,
      `Luogo in cui si trova: ${ctx.place || 'sconosciuto'}.`,
      ctx.society ? `LA SOCIETÀ DEL MONDO\n${ctx.society}` : '',
      'Dagli un nome proprio, un carattere e una storia brevi e suoi (non generici), un genere (maschio o femmina), un mestiere, un dettaglio d\'aspetto, e 3-6 cose che porta con sé coerenti con la sua vita (attrezzi del mestiere, cibo, ricordi, piccoli oggetti).',
      'Inseriscilo nella società: dagli una famiglia (1-3 legami) e, quando ha senso, legalo a persone già conosciute usando ESATTAMENTE i loro nomi (figlia del mugnaio, fratello del fabbro, rivale della locandiera); può anche nominare parenti che non sono ancora stati incontrati. Se tra le persone nominate e mai incontrate ce n\'è una adatta a questo tipo, puoi essere proprio lei (usa il suo nome).',
      relationRules(specie),
      ctx.avoid?.length ? `Nomi già presi o troppo simili, da NON usare: ${ctx.avoid.join(', ')}.` : '',
      'Descrivi la sua giornata in "routine": mattina, giorno, sera, notte — cosa fa e dove (casa, lavoro, piazza, in giro).',
      `Preferisci oggetti comuni già esistenti quando hanno senso: ${ctx.common.slice(0, 60).join(', ')}.`,
      'In "persona" scrivi la scheda in seconda persona ("Sei …"): come parli, cosa vuoi, chi sono i tuoi cari, cosa sai e cosa credi del tuo mondo (le sue leggende, a modo tuo). Sei una persona del mondo: non sai nulla di giochi, codice o simulazioni.',
    ]
      .filter(Boolean)
      .join('\n'),
    INDIVIDUAL_SCHEMA,
    { data: { archetype, ctx }, temperature: 1 },
  );
  const job = String(r.mestiere ?? '').slice(0, 40);
  const routine = (r.routine ?? [])
    .filter((s) => (DAY_PHASES as string[]).includes(s?.quando) && s?.fa)
    .map((s) => {
      const dove = ((WHERES as string[]).includes(s.dove) ? s.dove : 'in giro') as Where;
      const fa = String(s.fa).slice(0, 60);
      return { quando: s.quando as DayPhase, fa, dove, azione: (ACTIVITIES as readonly string[]).includes(s.azione ?? '') ? (s.azione as Activity) : inferActivity(fa, dove) };
    });
  return {
    name: String(r.nome ?? archetype.name).slice(0, 40),
    persona: String(r.persona ?? archetype.persona),
    look: String(r.aspetto ?? ''),
    carrying: (r.porta ?? []).map(String).slice(0, 8),
    job,
    gender: r.genere === 'maschio' || r.genere === 'femmina' ? r.genere : undefined,
    age: r.eta ? String(r.eta).slice(0, 20) : undefined,
    story: r.storia ? String(r.storia).slice(0, 300) : undefined,
    family: (r.famiglia ?? []).filter((f) => f?.nome && f?.legame).slice(0, 4).map((f) => ({ nome: String(f.nome).slice(0, 40), legame: String(f.legame).toLowerCase().slice(0, 20) })),
    routine: DAY_PHASES.map((q) => routine.find((s) => s.quando === q) ?? defaultRoutine(job).find((s) => s.quando === q)!),
  };
}
