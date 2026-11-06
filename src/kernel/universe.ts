// Module discovery: every directory under modules/ with a manifest.json is a self-contained module.
// Modules talk only through components and events; no implicit dependencies.

import type { AiConfig, AiMinimums, AiSettings, FileMap, ModuleEntry, UniverseConfig } from './types';
import { repairActor, repairCoefficients, repairGameSetup, type Validator } from './validator';
import { DEFAULT_GAME_SETUP } from './gameSetup';
import { COEFFICIENT_KEYS, pricedAiModels, type Coefficients } from './coefficients';
import { DEFAULT_SCULPTORS, type SculptorAiModels } from './agents/sculptor';
import { priceOf } from './ai/prices';
import { internalCoefficients, internalFields, internalSculptors } from './internalNames';

export const DEFAULT_CONFIG: UniverseConfig = {
  name: 'universo',
  seed: 1,
  theme: 'prompts/theme.md',
  circleRadius: 42,
  chunkSize: 18,
  ai: { textModel: 'gemini-3.1-flash-lite', maxText: 800, maxForges: 3, maxPacks: 4, maxCast: 3, thinking: 'low', timeout: 120 },
  game: DEFAULT_GAME_SETUP,
};

/** Repairs quality and spending minimums of an universe (T45d). */
export function repairMinimums(raw: unknown): AiMinimums | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  // The fields of the contract 0.3 (`scultori`, `tetto`) read internal (T308a).
  const r = internalFields('minimums', raw as Record<string, unknown>);
  const out: AiMinimums = {};
  if (typeof r.textModel === 'string' && r.textModel.trim()) out.textModel = r.textModel.trim();
  if (r.sculptors && typeof r.sculptors === 'object') {
    // Only a class's model: a minimum on anything else means nothing.
    const named = SCULPTOR_CLASSES.flatMap((k) => {
      const m = internalSculptors(r.sculptors as Record<string, unknown>)[k];
      return typeof m === 'string' && m.trim() ? [[k, m.trim()]] : [];
    });
    if (named.length) out.sculptors = Object.fromEntries(named);
  }
  if (typeof r.cap === 'number' && Number.isFinite(r.cap) && r.cap >= 0) out.cap = Math.round(r.cap * 100) / 100;
  if (r.coefficients && typeof r.coefficients === 'object') {
    // Only the knobs it names: a minimum not said is not a minimum of 1.
    const repaired = repairCoefficients(r.coefficients);
    const named = COEFFICIENT_KEYS.filter((k) => internalCoefficients(r.coefficients as Record<string, unknown>)[k] !== undefined);
    if (named.length) out.coefficients = Object.fromEntries(named.map((k) => [k, repaired[k]])) as Partial<Coefficients>;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** The dearer of two models: a minimum is a model at least as good, and what is dearer is what is better on the price list. */
const atLeast = (model: string, min: string | undefined): string => {
  const has = priceOf(model)?.output;
  const floor = min ? priceOf(min)?.output : undefined;
  return floor !== undefined && (has === undefined || has < floor) ? min! : model;
};

/**
 * The configuration within the master's minimums (T247): a knob never below them, a model never cheaper. Every way in passes
 * here (readConfig), so a universe.json written by hand with the world stopped obeys too.
 */
export function withinMinimums(ai: AiConfig): AiConfig {
  const m = ai.minimums;
  if (!m) return ai;
  const out: AiConfig = { ...ai, textModel: atLeast(ai.textModel, m.textModel) };
  if (m.coefficients) {
    const c = repairCoefficients(ai.coefficients);
    for (const k of COEFFICIENT_KEYS) c[k] = Math.max(c[k], m.coefficients[k] ?? 0);
    out.coefficients = c;
  }
  if (m.sculptors) {
    const sculptors: Partial<SculptorAiModels> = { ...internalSculptors(ai.sculptors ?? {}) };
    for (const k of SCULPTOR_CLASSES) if (m.sculptors[k]) sculptors[k] = atLeast(String(sculptors[k] ?? DEFAULT_SCULPTORS[k]), String(m.sculptors[k]));
    out.sculptors = sculptors;
  }
  return out;
}

/** The Sculptor's classes that have a model of their own (the rest of `SculptorAiModels` is not a model). */
export const SCULPTOR_CLASSES = ['simple', 'figure', 'structure', 'important', 'artist', 'musician'] as const;

/** What every budget of `ai` may be, [least, most]: `placesPerMinute` at 0 would stop the world from having places at all. */
export const BUDGET_SCALE = { maxText: [0, 20000], maxForges: [0, 50], maxPacks: [0, 50], maxCast: [0, 50], maxModels: [0, 400], maxPieces: [0, 100], placesPerMinute: [1, 120] } as const;
export type BudgetKey = keyof typeof BUDGET_SCALE;
export const BUDGET_KEYS = Object.keys(BUDGET_SCALE) as BudgetKey[];

/**
 * What the master set in the lobby, whatever came from the wire (T247): only the fields named here pass, a model only if it is
 * on the price list, a budget within its scale. `riparati` says what was changed or dropped.
 */
export function repairAiSettings(raw: unknown): { settings: AiSettings; riparati: string[] } {
  // The fields of the contract 0.3 (`coefficienti`, `attore`) read internal (T308a).
  const r = internalFields('ai', (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>);
  const settings: AiSettings = {};
  const riparati: string[] = [];
  const priced = new Set(pricedAiModels());
  const model = (v: unknown, what: string): string | undefined => {
    if (v === undefined) return undefined;
    if (typeof v === 'string' && priced.has(v.trim())) return v.trim();
    riparati.push(`${what}: modello sconosciuto, resta quello di prima`);
    return undefined;
  };
  const text = model(r.textModel, 'modello del Concilio');
  if (text) settings.textModel = text;
  if (r.coefficients !== undefined) settings.coefficients = repairCoefficients(r.coefficients);
  if (r.sculptors && typeof r.sculptors === 'object') {
    const s = internalSculptors(r.sculptors as Record<string, unknown>);
    const sculptors: Record<string, string | number> = {};
    for (const k of SCULPTOR_CLASSES) {
      const m = model(s[k], `Scultore, ${k}`);
      if (m) sculptors[k] = m;
    }
    if (typeof s.importanteFino === 'number' && Number.isFinite(s.importanteFino) && s.importanteFino >= 0) sculptors.importanteFino = s.importanteFino;
    if (Object.keys(sculptors).length) settings.sculptors = sculptors as Partial<SculptorAiModels>;
  }
  if (r.actor !== undefined) {
    const a = repairActor(r.actor);
    const m = model(a.model, "modello dell'Attore");
    settings.actor = m ? a : { on: a.on };
  }
  for (const k of BUDGET_KEYS) {
    const v = r[k];
    if (v === undefined) continue;
    const [lo, hi] = BUDGET_SCALE[k];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      riparati.push(`${k}: non è un numero, resta quello di prima`);
      continue;
    }
    const n = Math.round(Math.max(lo, Math.min(hi, v)));
    if (n !== v) riparati.push(`${k}: ${n}`);
    settings[k] = n;
  }
  if (r.thinking !== undefined) {
    if (r.thinking === 'low' || r.thinking === 'medium' || r.thinking === 'high' || r.thinking === 'off') settings.thinking = r.thinking;
    else riparati.push('ragionamento: resta quello di prima');
  }
  if (r.minimums !== undefined) {
    const m = repairMinimums(r.minimums);
    if (m?.textModel && !priced.has(m.textModel)) {
      riparati.push('minimo del Concilio: modello sconosciuto');
      delete m.textModel;
    }
    if (m?.sculptors) for (const k of SCULPTOR_CLASSES) if (m.sculptors[k] && !priced.has(String(m.sculptors[k]))) delete m.sculptors[k];
    settings.minimums = m ?? {};
  }
  return { settings, riparati };
}

export function readConfig(files: FileMap): { config: UniverseConfig; error?: string } {
  const src = files['universe.json'];
  if (!src) return { config: DEFAULT_CONFIG, error: 'universe.json mancante' };
  try {
    // A universe.json of the contract 0.3 (`partita`, `ai.coefficienti`) reads internal (T308a): the kernel ports it at boot anyway.
    const parsed = internalFields('config', JSON.parse(src));
    return {
      config: {
        ...DEFAULT_CONFIG,
        ...parsed,
        ai: withinMinimums({
          ...DEFAULT_CONFIG.ai,
          ...(parsed.ai ?? {}),
          coefficients: repairCoefficients(parsed.ai?.coefficients),
          minimums: repairMinimums(parsed.ai?.minimums),
          actor: repairActor(parsed.ai?.actor),
        }),
        game: repairGameSetup(parsed.game),
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
