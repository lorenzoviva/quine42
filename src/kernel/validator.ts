// The validator: everything generated (by the AI or by the kernel) passes through here before it
// touches the universe. Invalid content is discarded and regenerated. The player is never
// validated against: the player is allowed to break the game.

import type { Sandbox } from './sandbox';
import type { ChunkContent, FileMap, Manifest, ModuleKind, TileDef } from './types';
import { TOKEN_RE, tokenize } from './runes';

const KINDS: ModuleKind[] = ['system', 'entity', 'player', 'generator', 'data'];
const ID_RE = /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/;

/** Symbols a generated identity statement (`a = a`) may touch: writing them back changes nothing. */
export const IDENTITY_SAFE = new Set(['x', 'y', 'speed', 'carpet . strength', 'carpet . rate', 'carpet . active']);

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
    if ((m.kind === 'entity' || m.kind === 'player') && !m.appearance) err(`un modulo ${m.kind} richiede appearance`);
    if (m.spawn) {
      const s = m.spawn;
      if (!Array.isArray(s.tiles) || !s.tiles.every((t: unknown) => typeof t === 'string')) err('spawn.tiles deve essere una lista di codici tile');
      if (typeof s.chance !== 'number' || s.chance < 0 || s.chance > 1) err('spawn.chance deve essere in [0,1]');
      if (!Number.isInteger(s.max) || s.max < 0 || s.max > 16) err('spawn.max deve essere un intero 0..16');
    }
    if (m.interaction && !['talk', 'read', 'lua'].includes(m.interaction.type)) err('interaction.type deve essere talk, read o lua');
    if (m.tiles) {
      for (const [code, t] of Object.entries<any>(m.tiles)) {
        if (code.length !== 1) err(`codice tile "${code}" deve essere un carattere`);
        if (typeof t.glyph !== 'string' || typeof t.color !== 'string' || typeof t.bg !== 'string' || typeof t.solid !== 'boolean')
          err(`tile "${code}" incompleta (glyph, color, bg, solid)`);
      }
    }
    if (m.fragments && !Array.isArray(m.fragments)) err('fragments deve essere una lista');
    return errors.length ? { errors } : { manifest: m as Manifest, errors };
  }

  checkLua(path: string, src: string): string[] {
    const e = this.sandbox.check(src, path);
    return e ? [e] : [];
  }

  /** Validates a single file in the context of the universe it would be written into. */
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

  /** Validates a whole generated module before it is committed. */
  validateModule(files: FileMap, existingIds: Set<string>): string[] {
    const errors: string[] = [];
    const manifests = Object.keys(files).filter((p) => p.endsWith('/manifest.json'));
    if (manifests.length !== 1) return ['un modulo generato deve contenere esattamente un manifest.json'];
    const { manifest, errors: me } = this.parseManifest(manifests[0], files[manifests[0]]);
    errors.push(...me);
    if (manifest) {
      if (existingIds.has(manifest.id)) errors.push(`id già esistente: ${manifest.id}`);
      if (manifest.kind === 'system' || manifest.kind === 'player' || manifest.kind === 'generator')
        errors.push(`un agente non può generare moduli di tipo ${manifest.kind} in questa iterazione`);
      if (manifest.logic) {
        const logicPath = manifests[0].replace(/manifest\.json$/, manifest.logic);
        if (!(logicPath in files)) errors.push(`logic dichiarata ma assente: ${logicPath}`);
      }
    }
    for (const [p, src] of Object.entries(files)) if (p.endsWith('.lua')) errors.push(...this.checkLua(p, src));
    return errors;
  }

  /**
   * Generated rune layouts must already be valid, harmless code: they are live the moment they
   * appear. Lines must compile (expression or statement), statements may only be identities on
   * safe symbols, no function calls, and lines never touch each other or the chunk border.
   */
  validateChunkContent(content: ChunkContent, tiles: string, size: number, palette: Record<string, TileDef>): string[] {
    const errors: string[] = [];
    if (!content || typeof content !== 'object') return ['contenuto mancante'];
    const { place, runes } = content;
    if (!place || typeof place.name !== 'string' || !place.name.trim() || place.name.length > 48) errors.push('place.name non valido');
    if (!place || typeof place.description !== 'string' || place.description.length > 280) errors.push('place.description non valida');
    if (!Array.isArray(runes)) return [...errors, 'runes deve essere una lista'];
    const occupied = new Set<string>();
    for (const r of runes) {
      const where = `runa "${r?.line}" @${r?.col},${r?.row}`;
      if (typeof r?.line !== 'string' || !Number.isInteger(r.col) || !Number.isInteger(r.row)) {
        errors.push(`${where}: forma non valida`);
        continue;
      }
      const tokens = tokenize(r.line);
      if (!tokens.length) errors.push(`${where}: vuota`);
      const bad = tokens.find((t) => !TOKEN_RE.test(t));
      if (bad) errors.push(`${where}: token non valido "${bad}"`);
      if (tokens.includes('(')) errors.push(`${where}: chiamate di funzione non ammesse`);
      const src = tokens.join(' ');
      const kind = this.sandbox.runeKind(src);
      if ('error' in kind) errors.push(`${where}: non compila (${kind.error})`);
      else if (kind.kind === 'stmt') {
        const m = /^(.+?) = (.+)$/.exec(src);
        if (!m || m[1] !== m[2] || !IDENTITY_SAFE.has(m[1])) errors.push(`${where}: istruzione con effetti non ammessa`);
      }
      const width = tokens.reduce((n, t) => n + t.length, 0);
      if (r.row < 1 || r.row > size - 2 || r.col < 1 || r.col + width > size - 1) errors.push(`${where}: troppo vicina al bordo del chunk`);
      for (let i = -1; i <= width; i++) {
        const key = `${r.col + i},${r.row}`;
        if (occupied.has(key)) errors.push(`${where}: tocca un'altra runa`);
      }
      for (let i = 0; i < width; i++) {
        const tile = palette[tiles[r.row * size + r.col + i]];
        if (!tile || tile.solid) errors.push(`${where}: poggia su una cella solida`);
        occupied.add(`${r.col + i},${r.row}`);
      }
    }
    return [...new Set(errors)];
  }
}
