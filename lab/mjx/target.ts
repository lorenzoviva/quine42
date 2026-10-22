// What the lab sculpts and how the Artist judges it: the target (name, class, description), the prompt
// that describes it, the four photographs and the review. Kept from the JSON sculptor of steps 8A-8E,
// which is gone; the XML sculptor (sculptor.ts) and the trial scripts use it.

import { parseJson, type Models, type Schema } from '../../src/kernel/ai/models';
import { boxOf, classOf, guessClass, type AssetClass } from '../../src/mj/classes';
import type { PaletteEntry, RunResult, Vec3 } from '../../src/mj/engine';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import ARTIST from '../prompts/artista.md?raw';

export type Category = 'semplice' | 'struttura' | 'figura';

export const CATEGORY_LABEL: Record<Category, string> = {
  semplice: 'elemento semplice (oggetto, roccia, pianta)',
  struttura: 'struttura (edificio, colonna, porta, mobile grande)',
  figura: 'figura (persona, animale, mostro)',
};

export interface Target {
  id: string;
  name: string;
  category: Category;
  description?: string;
  look?: string;
  context?: string;
  /** Asset class (src/mj/classes.ts): gives the box. Guessed from the text when missing. */
  kind?: string;
  /** A box that overrides the class one. */
  size?: Vec3;
  source?: string;
}

export interface Critique {
  voto: number;
  riconoscibile: boolean;
  problemi: string[];
  consigli: string[];
  verdetto: 'approvato' | 'da rifare';
}

export function classFor(t: Target): { cls: AssetClass; box: Vec3; minHeight: number } {
  const cls = classOf(t.kind) ?? guessClass(`${t.name} ${t.description ?? ''} ${t.look ?? ''}`, t.category);
  const box = t.size ?? boxOf(cls);
  return { cls, box, minHeight: t.size ? 0 : Math.round((cls.minHeight ?? 0) * box[2]) };
}

export function describe(t: Target, style?: string): string {
  const { cls, box, minHeight } = classFor(t);
  return [
    `Scolpisci: ${t.name}`,
    `Tipo: ${CATEGORY_LABEL[t.category]}`,
    t.description && `Descrizione: ${t.description}`,
    t.look && `Aspetto: ${t.look}`,
    t.context && `Dove si trova: ${t.context}`,
    `Classe: ${cls.id} · scatola [${box.join(', ')}]${minHeight ? ` · alto almeno ${minHeight} voxel` : ''}`,
    style && `Guida di stile del mondo:\n${style.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');
}

const CRITIQUE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    voto: { type: 'INTEGER' },
    riconoscibile: { type: 'BOOLEAN' },
    problemi: { type: 'ARRAY', items: { type: 'STRING' } },
    consigli: { type: 'ARRAY', items: { type: 'STRING' } },
    verdetto: { type: 'STRING', enum: ['approvato', 'da rifare'] },
  },
  required: ['voto', 'riconoscibile', 'problemi', 'consigli', 'verdetto'],
};

export async function review(models: Models, t: Target, views: string, reference?: string, style?: string): Promise<Critique> {
  const raw = await models.text({
    agent: 'Artista',
    task: 'lab.review',
    system: ARTIST.trim(),
    prompt: describe(t, style) + (reference ? "\nL'ultima immagine è il riferimento." : ''),
    images: [views, ...(reference ? [reference] : [])],
    schema: CRITIQUE_SCHEMA,
    temperature: 0.3,
    data: { target: t },
  });
  const c = parseJson<Partial<Critique>>(raw);
  const voto = Math.max(0, Math.min(10, Math.round(Number(c.voto) || 0)));
  const riconoscibile = c.riconoscibile === true;
  return {
    voto,
    riconoscibile,
    problemi: Array.isArray(c.problemi) ? c.problemi.map(String) : [],
    consigli: Array.isArray(c.consigli) ? c.consigli.map(String) : [],
    verdetto: voto >= 7 && riconoscibile ? 'approvato' : 'da rifare',
  };
}

/** The four views on the grass, enlarged so a model can see them: what the artist looks at. */
export function contactSheet(r: RunResult, p: { palette: Record<string, PaletteEntry> }, scale = 0): Picture {
  const views = [0, 1, 2, 3].map((v) => render(r.grid, p.palette, v, DEFAULT_RENDER));
  const w = views.reduce((s, v) => s + v.w + 4, 4);
  return sheet(views, scale || Math.max(2, Math.min(6, Math.floor(1024 / w))), 4, [112, 150, 84]);
}
