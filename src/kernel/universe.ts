// Module discovery: every directory under modules/ with a manifest.json is a self-contained module.
// Modules talk only through components and events; no implicit dependencies.

import type { FileMap, ModuleEntry, UniverseConfig } from './types';
import { repairPartita, type Validator } from './validator';
import { DEFAULT_PARTITA } from './partita';

export const DEFAULT_CONFIG: UniverseConfig = {
  name: 'universo',
  seed: 1,
  theme: 'prompts/theme.md',
  circleRadius: 42,
  chunkSize: 18,
  ai: { textModel: 'gemini-3.1-flash-lite', maxText: 800, maxForges: 3, maxPacks: 4, maxCast: 3, thinking: 'low', timeout: 120 },
  partita: DEFAULT_PARTITA,
};

export function readConfig(files: FileMap): { config: UniverseConfig; error?: string } {
  const src = files['universe.json'];
  if (!src) return { config: DEFAULT_CONFIG, error: 'universe.json mancante' };
  try {
    const parsed = JSON.parse(src);
    return { config: { ...DEFAULT_CONFIG, ...parsed, ai: { ...DEFAULT_CONFIG.ai, ...(parsed.ai ?? {}) }, partita: repairPartita(parsed.partita) } };
  } catch (e) {
    return { config: DEFAULT_CONFIG, error: `universe.json: ${(e as Error).message}` };
  }
}

export function discoverModules(files: FileMap, validator: Validator): { modules: ModuleEntry[]; errors: Array<{ path: string; message: string }> } {
  const modules: ModuleEntry[] = [];
  const errors: Array<{ path: string; message: string }> = [];
  const seen = new Set<string>();
  for (const path of Object.keys(files).sort()) {
    if (!/^modules\/[^/]+\/manifest\.json$/.test(path)) continue;
    const dir = path.slice(0, -'manifest.json'.length);
    const { manifest, errors: errs } = validator.parseManifest(path, files[path]);
    if (!manifest) {
      errors.push({ path, message: errs.join('; ') });
      continue;
    }
    if (seen.has(manifest.id)) {
      errors.push({ path, message: `id duplicato ${manifest.id}` });
      continue;
    }
    seen.add(manifest.id);
    const logicPath = manifest.logic ? dir + manifest.logic : undefined;
    if (logicPath && !(logicPath in files)) {
      errors.push({ path, message: `logic mancante: ${logicPath}` });
    }
    modules.push({ manifest, dir, manifestPath: path, logicPath });
  }
  return { modules, errors };
}
