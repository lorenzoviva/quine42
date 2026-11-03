// Module discovery: every directory under modules/ with a manifest.json is a self-contained module.
// Modules talk only through components and events; no implicit dependencies.

import type { AiMinimums, FileMap, ModuleEntry, UniverseConfig } from './types';
import { repairActor, repairCoefficients, repairGameSetup, type Validator } from './validator';
import { DEFAULT_GAME_SETUP } from './gameSetup';

export const DEFAULT_CONFIG: UniverseConfig = {
  name: 'universo',
  seed: 1,
  theme: 'prompts/theme.md',
  circleRadius: 42,
  chunkSize: 18,
  ai: { textModel: 'gemini-3.1-flash-lite', maxText: 800, maxForges: 3, maxPacks: 4, maxCast: 3, thinking: 'low', timeout: 120 },
  partita: DEFAULT_GAME_SETUP,
};

/** Repairs quality and spending minimums of an universe (T45d). */
export function repairMinimums(raw: unknown): AiMinimums | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const out: AiMinimums = {};
  if (typeof r.textModel === 'string' && r.textModel.trim()) out.textModel = r.textModel.trim();
  if (r.scultori && typeof r.scultori === 'object') out.scultori = { ...(r.scultori as any) };
  if (typeof r.tetto === 'number' && Number.isFinite(r.tetto) && r.tetto >= 0) out.tetto = Math.round(r.tetto * 100) / 100;
  if (r.coefficienti && typeof r.coefficienti === 'object') out.coefficienti = repairCoefficients(r.coefficienti);
  return Object.keys(out).length > 0 ? out : undefined;
}

export function readConfig(files: FileMap): { config: UniverseConfig; error?: string } {
  const src = files['universe.json'];
  if (!src) return { config: DEFAULT_CONFIG, error: 'universe.json mancante' };
  try {
    const parsed = JSON.parse(src);
    return {
      config: {
        ...DEFAULT_CONFIG,
        ...parsed,
        ai: {
          ...DEFAULT_CONFIG.ai,
          ...(parsed.ai ?? {}),
          coefficienti: repairCoefficients(parsed.ai?.coefficienti),
          minimi: repairMinimums(parsed.ai?.minimi),
          attore: repairActor(parsed.ai?.attore),
        },
        partita: repairGameSetup(parsed.partita),
      },
    };
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
