// The validator: everything generated (by the Council or by the kernel) passes through here before it
// touches the universe. Invalid content is discarded and regenerated. The player is never
// validated against: the player is allowed to break the game.

import type { Sandbox } from './sandbox';
import type { FileMap, GeneratedRune, Manifest, ModuleKind, TileDef } from './types';
import type { ChunkPlan, FreshObject, PlacedObject } from './agents/cartography';
import { lex, TOKEN_RE, tokenize } from './runes';

const KINDS: ModuleKind[] = ['system', 'entity', 'item', 'player', 'generator', 'data'];
const ID_RE = /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;

/** The Lua API (prelude.lua): generated code may only call these. */
export const LUA_API: Record<string, string[]> = {
  ecs: ['each', 'get', 'set', 'spawn', 'destroy', 'first'],
  world: ['free', 'free_real', 'tile', 'speed_at', 'spawn', 'player', 'player_pos', 'nearest', 'has_tag', 'break_entity', 'say', 'speak'],
  inventory: ['add', 'remove', 'count', 'equipped'],
  input: ['held'],
  bus: ['emit'],
};

/** Calls to functions that do not exist, or to what the sandbox forbids: caught before anything runs. */
export function apiErrors(logic: string): string[] {
  const code = logic.replace(/--\[\[[\s\S]*?\]\]|--[^\n]*/g, '').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  const errors = new Set<string>();
  for (const m of code.matchAll(/\b(ecs|world|inventory|input|bus)\s*[.:]\s*([A-Za-z_]\w*)/g)) {
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
  /** The plan with invalid runes/objects removed (when there are no fatal errors). */
  plan: ChunkPlan;
  /** What was filtered out, for the log. */
  dropped: string[];
  /** Placements snapped to the nearest valid cell. */
  moved: number;
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
      if (m.appearance.sprite !== undefined && !/^img:[0-9a-f]+$/.test(m.appearance.sprite)) err('appearance.sprite deve essere un id di asset "img:…"');
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
        if (code.length !== 1) err(`codice tile "${code}" deve essere un carattere`);
        if (typeof t.name !== 'string' || typeof t.solid !== 'boolean' || typeof t.color !== 'string' || !HEX_RE.test(t.color)) err(`tile "${code}" incompleta (name, color #rrggbb, solid)`);
        if (t.speed !== undefined && (typeof t.speed !== 'number' || t.speed < 0.2 || t.speed > 2)) err(`tile "${code}": speed fuori intervallo`);
      }
    }
    if (m.fragments && !Array.isArray(m.fragments)) err('fragments deve essere una lista');
    return errors.length ? { errors } : { manifest: m as Manifest, errors };
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

  /** A forged module: manifest shape, Lua that compiles and loads, only world kinds. */
  validateForged(manifest: Manifest, logic: string, existingIds: Set<string>): string[] {
    const path = `modules/${manifest.id}/manifest.json`;
    const errors = [...this.parseManifest(path, JSON.stringify(manifest)).errors];
    if (existingIds.has(manifest.id)) errors.push(`id già esistente: ${manifest.id}`);
    if (manifest.kind !== 'entity' && manifest.kind !== 'item') errors.push(`la Fucina non può creare moduli di tipo ${manifest.kind}`);
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

  /** Validates a module given as files (import, legacy agent output). */
  validateModuleFiles(files: FileMap, existingIds: Set<string>): string[] {
    const manifests = Object.keys(files).filter((p) => p.endsWith('/manifest.json'));
    if (manifests.length !== 1) return ['un modulo deve contenere esattamente un manifest.json'];
    const { manifest, errors } = this.parseManifest(manifests[0], files[manifests[0]]);
    if (!manifest) return errors;
    const logicPath = manifests[0].replace(/manifest\.json$/, manifest.logic ?? 'logic.lua');
    return this.validateForged(manifest, files[logicPath] ?? 'return {}', existingIds);
  }

  validateGrid(grid: unknown, size: number, palette: Record<string, TileDef>): string[] {
    if (!Array.isArray(grid) || grid.length !== size) return [`la griglia deve avere ${size} righe (ne ha ${Array.isArray(grid) ? grid.length : 0})`];
    const errors: string[] = [];
    grid.forEach((row, i) => {
      if (typeof row !== 'string' || [...row].length !== size) errors.push(`la riga ${i} deve avere ${size} caratteri`);
      else {
        const bad = [...row].find((c) => !palette[c] || c === '?');
        if (bad) errors.push(`codice sconosciuto "${bad}" alla riga ${i}`);
      }
    });
    return errors.slice(0, 4);
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
   * The Cartographer's plan. Grid and place are essential (fatal errors); runes, objects and new things
   * that break a rule are dropped one by one, so nothing invalid ever enters the world.
   */
  validatePlan(plan: ChunkPlan, size: number, palette: Record<string, TileDef>, placeable: Map<string, string[]>, start: boolean): PlanVerdict {
    const errors: string[] = [];
    const dropped: string[] = [];
    if (!plan.place?.name?.trim() || plan.place.name.length > 60) errors.push('luogo.nome mancante o troppo lungo');
    if (typeof plan.place?.description !== 'string' || plan.place.description.length > 300) errors.push('luogo.descrizione non valida');
    errors.push(...this.validateGrid(plan.grid, size, palette));
    if (errors.length) return { errors, plan, dropped, moved: 0 };
    const grid = plan.grid.map((r) => [...r]);
    const walk = (c: number, r: number) => c >= 0 && r >= 0 && c < size && r < size && palette[grid[r][c]]?.solid === false;
    if (start) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (!walk(c, r)) errors.push(`la piazza di partenza (${c},${r}) deve restare calpestabile`);
    if (errors.length) return { errors: errors.slice(0, 3), plan, dropped, moved: 0 };

    // Models are poor at counting cells: placements express intent, the kernel snaps them to the
    // nearest valid cell. Only what cannot be made valid (bad code, unknown modules) is dropped.
    const occupied = new Set<string>();
    let moved = 0;
    const nearest = (c0: number, r0: number, fits: (c: number, r: number) => boolean, radius = 6): [number, number] | null => {
      const c = Number.isInteger(c0) ? c0 : Math.floor(size / 2);
      const r = Number.isInteger(r0) ? r0 : Math.floor(size / 2);
      for (let d = 0; d <= radius; d++)
        for (let dy = -d; dy <= d; dy++)
          for (let dx = -d; dx <= d; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
            if (fits(c + dx, r + dy)) return [c + dx, r + dy];
          }
      return null;
    };
    const runes: GeneratedRune[] = [];
    for (const r of plan.runes ?? []) {
      const where = `runa «${r?.line}»`;
      if (typeof r?.line !== 'string') {
        dropped.push(`${where}: forma non valida`);
        continue;
      }
      const line = lex(r.line).join(' ');
      const problems = this.runeErrors(line);
      if (problems.length) {
        dropped.push(`${where}: ${problems.join(', ')}`);
        continue;
      }
      const width = tokenize(line).reduce((n, t) => n + t.length, 0);
      const fits = (col: number, row: number) => {
        if (row < 1 || row > size - 2 || col < 1 || col + width > size - 1) return false;
        for (let i = -1; i <= width; i++) if (occupied.has(`${col + i},${row}`)) return false;
        for (let i = 0; i < width; i++) if (!walk(col + i, row)) return false;
        return true;
      };
      const at = nearest(r.col, r.row, fits, size); // runes are rare and precious: anywhere in the chunk
      if (!at) {
        dropped.push(`${where}: nessuna posizione valida vicina`);
        continue;
      }
      if (at[0] !== r.col || at[1] !== r.row) moved++;
      for (let i = 0; i < width; i++) occupied.add(`${at[0] + i},${at[1]}`);
      runes.push({ line, col: at[0], row: at[1] });
    }

    const objects: PlacedObject[] = [];
    const fitsCell = (c: number, r: number) => walk(c, r) && !occupied.has(`${c},${r}`);
    for (const o of (plan.objects ?? []).slice(0, 6)) {
      if (!placeable.has(o.module)) {
        dropped.push(`oggetto ${o.module}: modulo inesistente o non posizionabile`);
        continue;
      }
      const at = nearest(o.col, o.row, fitsCell);
      if (!at) {
        dropped.push(`oggetto ${o.module}: nessuna casella libera vicina`);
        continue;
      }
      if (at[0] !== o.col || at[1] !== o.row) moved++;
      occupied.add(`${at[0]},${at[1]}`);
      objects.push({ module: o.module, col: at[0], row: at[1] });
    }
    const fresh: FreshObject[] = [];
    for (const f of (plan.fresh ?? []).slice(0, 1)) {
      const at = typeof f.concept === 'string' && f.concept.length >= 3 && f.concept.length <= 200 ? nearest(f.col, f.row, fitsCell) : null;
      if (!at) dropped.push(`nuovo «${f.concept}»: non valido`);
      else {
        occupied.add(`${at[0]},${at[1]}`);
        fresh.push({ concept: f.concept, col: at[0], row: at[1] });
      }
    }
    return { errors: [], dropped, moved, plan: { ...plan, place: { name: plan.place.name.trim(), description: plan.place.description.trim() }, runes, objects, fresh } };
  }
}
