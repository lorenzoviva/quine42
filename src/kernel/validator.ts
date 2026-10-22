// The validator: everything generated (by the Council or by the kernel) passes through here before it
// touches the universe. Invalid content is discarded and regenerated. The player is never
// validated against: the player is allowed to break the game.

import type { Sandbox } from './sandbox';
import type { Effect, FileMap, ItemDef, LayoutDef, Manifest, ModuleKind, TileDef } from './types';
import { ITEM_CATEGORIES } from './types';
import type { ChunkPlan } from './agents/cartography';
import { lex, TOKEN_RE, tokenize } from './runes';
import { compile, writtenCodes, MjError } from './mj';
import { layout } from './layout';

const KINDS: ModuleKind[] = ['system', 'entity', 'item', 'player', 'generator', 'data'];
const LAYERS = ['ground', 'floor', 'wall', 'door', 'liquid', 'vegetation', 'rock'];
const ID_RE = /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;

/** The Lua API (prelude.lua): generated code may only call these. */
export const LUA_API: Record<string, string[]> = {
  ecs: ['each', 'get', 'set', 'spawn', 'destroy', 'first'],
  world: ['free', 'free_real', 'tile', 'speed_at', 'spawn', 'player', 'player_pos', 'nearest', 'has_tag', 'break_entity', 'say', 'speak', 'set_tile', 'open', 'make_container'],
  inventory: ['add', 'remove', 'count', 'equipped'],
  input: ['held'],
  bus: ['emit'],
  items: ['find', 'def', 'bonus'],
  ui: ['slot'],
};

/** Calls to functions that do not exist, or to what the sandbox forbids: caught before anything runs. */
export function apiErrors(logic: string): string[] {
  const code = logic.replace(/--\[\[[\s\S]*?\]\]|--[^\n]*/g, '').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  const errors = new Set<string>();
  for (const m of code.matchAll(/\b(ecs|world|inventory|input|bus|items|ui)\s*[.:]\s*([A-Za-z_]\w*)/g)) {
    if (!LUA_API[m[1]].includes(m[2])) errors.add(`${m[1]}.${m[2]} non esiste nell'API (disponibili: ${LUA_API[m[1]].join(', ')})`);
  }
  for (const m of code.matchAll(/\b(os|io|debug|package)\s*\.|\b(require|load|loadstring|dofile|setfenv|getmetatable)\s*\(/g)) errors.add(`${m[1] ?? m[2]} non è disponibile nella sandbox`);
  return [...errors];
}

/** Symbols a generated identity statement (`a = a`) may touch: writing them back changes nothing. */
export const IDENTITY_SAFE = new Set(['x', 'y', 'speed', 'carpet . strength', 'carpet . rate', 'carpet . active']);

export interface PlanVerdict {
  /** Fatal problems: the plan is discarded and requested again. */
  errors: string[];
  /** The plan with invalid parts removed (when there are no fatal errors). */
  plan: ChunkPlan;
  /** What was filtered out, for the log. */
  dropped: string[];
}

export class Validator {
  constructor(private sandbox: Sandbox) {}

  parseManifest(path: string, src: string): { manifest?: Manifest; errors: string[] } {
    let m: any;
    try {
      m = JSON.parse(src);
    } catch (e) {
      return { errors: [`${path}: JSON non valido (${(e as Error).message})`] };
    }
    const errors: string[] = [];
    const err = (s: string) => errors.push(`${path}: ${s}`);
    if (typeof m !== 'object' || m === null) return { errors: [`${path}: deve essere un oggetto`] };
    if (typeof m.id !== 'string' || !ID_RE.test(m.id)) err(`id non valido "${m.id}" (es. "npc.villager")`);
    if (typeof m.name !== 'string' || !m.name) err('name mancante');
    if (!KINDS.includes(m.kind)) err(`kind deve essere uno tra ${KINDS.join(', ')}`);
    if (m.logic !== undefined && typeof m.logic !== 'string') err('logic deve essere un percorso relativo');
    if (m.appearance) {
      if (typeof m.appearance.glyph !== 'string' || [...m.appearance.glyph].length !== 1) err('appearance.glyph deve essere un singolo carattere');
      if (typeof m.appearance.color !== 'string') err('appearance.color mancante');
    }
    if (['entity', 'item', 'player'].includes(m.kind) && !m.appearance) err(`un modulo ${m.kind} richiede appearance`);
    if (m.physics) {
      for (const k of ['radius', 'mass', 'friction', 'speed'])
        if (m.physics[k] !== undefined && (typeof m.physics[k] !== 'number' || !Number.isFinite(m.physics[k]))) err(`physics.${k} deve essere un numero`);
      if (m.physics.radius !== undefined && (m.physics.radius < 0.1 || m.physics.radius > 0.6)) err('physics.radius deve stare tra 0.1 e 0.6');
    }
    if (m.spawn) {
      const s = m.spawn;
      if (!Array.isArray(s.tiles) || !s.tiles.every((t: unknown) => typeof t === 'string')) err('spawn.tiles deve essere una lista di codici tile');
      if (typeof s.chance !== 'number' || s.chance < 0 || s.chance > 1) err('spawn.chance deve essere in [0,1]');
      if (!Number.isInteger(s.max) || s.max < 0 || s.max > 16) err('spawn.max deve essere un intero 0..16');
    }
    if (m.interaction && !['talk', 'read', 'lua'].includes(m.interaction.type)) err('interaction.type deve essere talk, read o lua');
    if (m.interaction?.type === 'talk' && typeof m.persona !== 'string') err('un personaggio (talk) richiede "persona"');
    if (m.kind === 'item') {
      const it = m.item;
      if (!it || typeof it !== 'object') err('un modulo item richiede "item"');
      else {
        if (typeof it.stackable !== 'boolean' || typeof it.equippable !== 'boolean') err('item.stackable e item.equippable devono essere booleani');
        if (!Number.isInteger(it.maxStack) || it.maxStack < 1 || it.maxStack > 99) err('item.maxStack deve essere 1..99');
        if (typeof it.weight !== 'number' || it.weight < 0 || it.weight > 50) err('item.weight deve essere 0..50');
      }
    }
    if (m.tiles) {
      for (const [code, t] of Object.entries<any>(m.tiles)) {
        if (code.length !== 1 || code === '?' || code === '*' || code === '/' || code === '[' || code === ']') err(`codice tile "${code}" non valido`);
        if (typeof t.name !== 'string' || typeof t.solid !== 'boolean' || typeof t.color !== 'string' || !HEX_RE.test(t.color)) err(`tile "${code}" incompleta (name, color #rrggbb, solid)`);
        if (t.speed !== undefined && (typeof t.speed !== 'number' || t.speed < 0.2 || t.speed > 2)) err(`tile "${code}": speed fuori intervallo`);
        if (t.layer !== undefined && !LAYERS.includes(t.layer)) err(`tile "${code}": layer deve essere uno tra ${LAYERS.join(', ')}`);
      }
    }
    if (m.container && (!Number.isInteger(m.container.size) || m.container.size < 1 || m.container.size > 24 || typeof m.container.loot !== 'string')) err('container: size 1..24 e loot');
    if (m.actions && (!Array.isArray(m.actions) || m.actions.some((a: any) => typeof a?.id !== 'string' || typeof a?.label !== 'string'))) err('actions: lista di {id, label}');
    if (m.items) errors.push(...this.validateItems(m.items).map((e) => `${path}: ${e}`));
    if (m.fragments && !Array.isArray(m.fragments)) err('fragments deve essere una lista');
    return errors.length ? { errors } : { manifest: m as Manifest, errors };
  }

  validateItems(items: unknown): string[] {
    if (!Array.isArray(items)) return ['items deve essere una lista'];
    const errors: string[] = [];
    const seen = new Set<string>();
    for (const it of items as ItemDef[]) {
      const w = `oggetto ${it?.id}`;
      if (typeof it?.id !== 'string' || !/^item\.[a-z0-9-]+$/.test(it.id)) errors.push(`${w}: id non valido`);
      else if (seen.has(it.id)) errors.push(`${w}: id duplicato`);
      seen.add(it?.id);
      if (typeof it?.name !== 'string' || !it.name) errors.push(`${w}: name mancante`);
      if (!(ITEM_CATEGORIES as readonly string[]).includes(it?.category)) errors.push(`${w}: categoria sconosciuta`);
      if (typeof it?.weight !== 'number' || it.weight < 0 || it.weight > 50) errors.push(`${w}: weight 0..50`);
      if (!Number.isInteger(it?.stack) || it.stack < 1 || it.stack > 99) errors.push(`${w}: stack 1..99`);
      if (!Array.isArray(it?.tags)) errors.push(`${w}: tags`);
    }
    return errors.slice(0, 6);
  }

  checkLua(path: string, src: string): string[] {
    const e = this.sandbox.check(src, path);
    return e ? [e] : [];
  }

  validateFile(path: string, content: string): string[] {
    if (path.endsWith('.lua')) return this.checkLua(path, content);
    if (path.endsWith('manifest.json')) return this.parseManifest(path, content).errors;
    if (path.endsWith('.json')) {
      try {
        JSON.parse(content);
        return [];
      } catch (e) {
        return [`${path}: JSON non valido (${(e as Error).message})`];
      }
    }
    return [];
  }

  /** A forged module: manifest shape, Lua that compiles, uses only the API and loads. */
  validateForged(manifest: Manifest, logic: string, existingIds: Set<string>, opts: { system?: boolean } = {}): string[] {
    const path = `modules/${manifest.id}/manifest.json`;
    const errors = [...this.parseManifest(path, JSON.stringify(manifest)).errors];
    if (existingIds.has(manifest.id)) errors.push(`id già esistente: ${manifest.id}`);
    // Systems only from the Forge of mechanics, and only with a panel (ADR-0028).
    if (manifest.kind !== 'entity' && manifest.kind !== 'item' && !(opts.system && manifest.kind === 'system' && manifest.ui)) errors.push(`la Fucina non può creare moduli di tipo ${manifest.kind}`);
    errors.push(...this.checkLua(`modules/${manifest.id}/logic.lua`, logic));
    errors.push(...apiErrors(logic));
    if (!errors.length) {
      // Dry load: the chunk must run and return a table, without touching the live universe.
      const probe = `__probe.${manifest.id}`;
      const err = this.sandbox.loadModule(probe, logic, `modules/${manifest.id}/logic.lua`);
      this.sandbox.unloadModule(probe);
      if (err) errors.push(err);
    }
    return errors;
  }

  validateModuleFiles(files: FileMap, existingIds: Set<string>): string[] {
    const manifests = Object.keys(files).filter((p) => p.endsWith('/manifest.json'));
    if (manifests.length !== 1) return ['un modulo deve contenere esattamente un manifest.json'];
    const { manifest, errors } = this.parseManifest(manifests[0], files[manifests[0]]);
    if (!manifest) return errors;
    const logicPath = manifests[0].replace(/manifest\.json$/, manifest.logic ?? 'logic.lua');
    return this.validateForged(manifest, files[logicPath] ?? 'return {}', existingIds);
  }

  /** A rune line is valid generated code: it compiles, has no calls, statements only `a = a` on safe symbols. */
  runeErrors(line: string): string[] {
    const tokens = tokenize(line);
    if (!tokens.length) return ['vuota'];
    const bad = tokens.find((t) => !TOKEN_RE.test(t));
    if (bad) return [`token non valido "${bad}"`];
    if (tokens.includes('(')) return ['chiamate di funzione non ammesse'];
    const src = tokens.join(' ');
    const kind = this.sandbox.runeKind(src);
    if ('error' in kind) return [`non compila (${kind.error})`];
    if (kind.kind === 'stmt') {
      const m = /^(.+?) = (.+)$/.exec(src);
      if (!m || m[1] !== m[2] || !IDENTITY_SAFE.has(m[1])) return ['istruzione con effetti non ammessa'];
    }
    return [];
  }

  /**
   * A layout program must compile, write only known terrain, terminate, and leave a playable chunk on
   * real drafts (enough walkable ground once the kernel has carved its paths).
   */
  validateLayout(id: string, def: LayoutDef, palette: Record<string, TileDef>, drafts: string[][]): string[] {
    const errors: string[] = [];
    if (!def || typeof def.name !== 'string' || typeof def.description !== 'string') return [`${id}: name e description obbligatori`];
    try {
      compile(def.program);
    } catch (e) {
      return [`${id}: ${(e as Error).message}`];
    }
    const unknown = [...writtenCodes(def.program)].filter((c) => !palette[c] || c === '?');
    if (unknown.length) errors.push(`${id}: scrive codici inesistenti ${unknown.join(', ')}`);
    if (errors.length) return errors;
    drafts.forEach((draft, i) => {
      try {
        const r = layout(draft, palette, { cx: 100 + i, cy: -100, seed: 1, program: def.program, pathCode: 'p' });
        const open = (rows: string[]) => rows.join('').split('').filter((c) => palette[c]?.solid === false).length;
        // Judged against what the draft offered: a forest draft is allowed to stay mostly forest.
        const cells = draft.length * draft.length;
        const needed = Math.min(cells * 0.25, open(draft) * 0.5);
        if (open(r.grid) < needed) errors.push(`${id}: lascia troppo poco spazio calpestabile`);
        if (r.steps >= 4000) errors.push(`${id}: non termina (troppi passi): usa "steps"`);
      } catch (e) {
        errors.push(`${id}: ${e instanceof MjError ? e.message : (e as Error).message}`);
      }
    });
    return [...new Set(errors)];
  }

  /**
   * The Cartographer's plan: place and environment are essential (fatal); objects, runes and new
   * things that break a rule are dropped one by one, so nothing invalid ever enters the world.
   */
  validatePlan(plan: ChunkPlan, layouts: Set<string>, placeable: Set<string>): PlanVerdict {
    const errors: string[] = [];
    const dropped: string[] = [];
    if (!plan.place?.name || plan.place.name.length > 60) errors.push('luogo.nome mancante o troppo lungo');
    if (typeof plan.place?.description !== 'string' || plan.place.description.length > 300) errors.push('luogo.descrizione non valida');
    if (!layouts.has(plan.layout)) errors.push(`ambiente sconosciuto "${plan.layout}" (scegli tra: ${[...layouts].join(', ')})`);
    if (errors.length) return { errors, plan, dropped };
    const objects = plan.objects.filter((o) => {
      if (placeable.has(o.module)) return true;
      dropped.push(`oggetto ${o.module}: modulo inesistente o non posizionabile`);
      return false;
    });
    const runes = plan.runes
      .map((r) => lex(r).join(' '))
      .filter((line) => {
        const e = this.runeErrors(line);
        if (e.length) dropped.push(`runa «${line}»: ${e.join(', ')}`);
        return !e.length;
      });
    const fresh = plan.fresh.filter((f) => {
      const ok = f.concept.length >= 3 && f.concept.length <= 200;
      if (!ok) dropped.push(`nuovo «${f.concept}»: non valido`);
      return ok;
    });
    return { errors, dropped, plan: { ...plan, objects, runes, fresh, ground: plan.ground.filter((g) => g.trim().length >= 2 && g.length <= 60) } };
  }
}

export interface EffectContext {
  palette: Record<string, TileDef>;
  /** Item id by (fuzzy) name. */
  item: (name: string) => string | undefined;
  /** Summonable entity module id by id or name. */
  module: (name: string) => string | undefined;
  loot: Set<string>;
}

export interface EffectVerdict {
  effects: Effect[];
  dropped: string[];
  /** Items named by crea_oggetto that do not exist yet (the Narrator can define them, then validate again). */
  unknownItems: string[];
}

const num = (v: unknown, lo: number, hi: number, def: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def;
};

/**
 * Effects chosen by the Council, from the closed set: unknown types are dropped, numbers clamped,
 * names resolved to ids (items, modules, terrains). What remains is safe to apply.
 */
export function validateEffects(raw: unknown, ctx: EffectContext): EffectVerdict {
  const out: EffectVerdict = { effects: [], dropped: [], unknownItems: [] };
  const list = Array.isArray(raw) ? raw.slice(0, 8) : [];
  const tileCode = (v: unknown): string | undefined => {
    const s = String(v ?? '').trim();
    if (!s) return undefined;
    if (ctx.palette[s] && s !== '?') return s;
    const n = s.toLowerCase();
    return Object.keys(ctx.palette).find((c) => c !== '?' && ctx.palette[c].name.toLowerCase() === n) ?? Object.keys(ctx.palette).find((c) => c !== '?' && (ctx.palette[c].name.toLowerCase().includes(n) || n.includes(ctx.palette[c].name.toLowerCase())));
  };
  for (const r of list) {
    if (!r || typeof r !== 'object') continue;
    const e = r as Record<string, unknown>;
    const tipo = String(e.tipo ?? '');
    switch (tipo) {
      case 'messaggio':
        if (typeof e.testo === 'string' && e.testo.trim()) out.effects.push({ tipo, testo: e.testo.trim().slice(0, 300) });
        break;
      case 'bisogni': {
        const b: Effect & { tipo: 'bisogni' } = { tipo };
        for (const k of ['fame', 'sete', 'energia', 'salute'] as const) if (e[k] !== undefined && e[k] !== null) b[k] = Math.round(num(e[k], -40, 40, 0));
        if (Object.keys(b).length > 1) out.effects.push(b);
        else out.dropped.push('bisogni senza variazioni');
        break;
      }
      case 'crea_oggetto':
      case 'consuma': {
        const name = String(e.oggetto ?? '').trim();
        const id = name ? ctx.item(name) : undefined;
        const quantita = Math.round(num(e.quantita, 1, tipo === 'crea_oggetto' ? 5 : 10, 1));
        if (id) out.effects.push({ tipo, oggetto: id, quantita });
        else if (tipo === 'crea_oggetto' && name.length >= 2) out.unknownItems.push(name);
        else out.dropped.push(`${tipo}: «${name}» non esiste`);
        break;
      }
      case 'distruggi':
      case 'apri':
        out.effects.push({ tipo });
        break;
      case 'contenitore': {
        const bottino = typeof e.bottino === 'string' && ctx.loot.has(e.bottino) ? e.bottino : ctx.loot.has('cassa') ? 'cassa' : [...ctx.loot][0];
        if (bottino) out.effects.push({ tipo, capienza: Math.round(num(e.capienza, 2, 12, 6)), bottino });
        else out.dropped.push('contenitore: nessuna tabella di bottino');
        break;
      }
      case 'terreno': {
        const a = tileCode(e.a);
        if (!a) {
          out.dropped.push(`terreno: «${String(e.a ?? '')}» non è un terreno`);
          break;
        }
        const da = e.da !== undefined && e.da !== null && e.da !== '' ? tileCode(e.da) : undefined;
        out.effects.push({ tipo, a, ...(da ? { da } : {}), raggio: Math.round(num(e.raggio, 0, 3, 1)) });
        break;
      }
      case 'fuoco':
      case 'luce':
        out.effects.push({ tipo, raggio: num(e.raggio, 0.5, tipo === 'fuoco' ? 3 : 8, tipo === 'fuoco' ? 1 : 4), durata: num(e.durata, 2, tipo === 'fuoco' ? 30 : 300, tipo === 'fuoco' ? 10 : 60) });
        break;
      case 'scudo':
        out.effects.push({ tipo, durata: num(e.durata, 2, 120, 20) });
        break;
      case 'spingi':
        out.effects.push({ tipo, forza: num(e.forza, 0.5, 10, 3) });
        break;
      case 'evoca': {
        const id = ctx.module(String(e.modulo ?? ''));
        if (id) out.effects.push({ tipo, modulo: id });
        else out.dropped.push(`evoca: «${String(e.modulo ?? '')}» non esiste`);
        break;
      }
      case 'legame':
        if (typeof e.legame === 'string' && e.legame.trim()) out.effects.push({ tipo, legame: e.legame.trim().toLowerCase().slice(0, 30) });
        else out.dropped.push('legame senza legame');
        break;
      case 'ricordo':
        if (typeof e.testo === 'string' && e.testo.trim()) out.effects.push({ tipo, testo: e.testo.trim().slice(0, 200), peso: Math.round(num(e.peso, 1, 3, 2)) });
        break;
      case 'stato': {
        const nome = typeof e.nome === 'string' ? e.nome.trim().toLowerCase().slice(0, 30) : '';
        if (!nome) {
          out.dropped.push('stato senza nome');
          break;
        }
        const st: Effect & { tipo: 'stato' } = { tipo, nome, durata: Math.round(num(e.durata, 0, 3600, 0)) };
        if (e.velocita !== undefined) st.velocita = num(e.velocita, 0.3, 3, 1);
        if (e.peso !== undefined) st.peso = num(e.peso, -20, 60, 0);
        if (e.luce !== undefined) st.luce = num(e.luce, 0, 8, 0);
        out.effects.push(st);
        break;
      }
      case 'togli_stato':
        if (typeof e.nome === 'string' && e.nome.trim()) out.effects.push({ tipo, nome: e.nome.trim().toLowerCase().slice(0, 30) });
        break;
      case 'nascita':
        out.effects.push({ tipo, ...(typeof e.nome === 'string' && e.nome.trim() ? { nome: e.nome.trim().slice(0, 30) } : {}) });
        break;
      default:
        out.dropped.push(`effetto sconosciuto «${tipo}»`);
    }
  }
  return out;
}
