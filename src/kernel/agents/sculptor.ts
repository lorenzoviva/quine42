// The Sculptor writes the programs of the models (ADR-0042); the Artist looks at them and judges.
//
// Per class, as the costs report of step 8.2B proposed: simple things (vegetation, rocks, objects,
// furniture) by the cheap model, two independent programs and the Artist keeps the better one (with that
// model, rounds of improvement make things worse); figures and structures by the better model, with one
// round of revision guided by the Artist; the structures that matter by the best model, while its price
// lasts. Every program goes through the kernel's checks (it compiles, finishes, stands, is whole, is high
// enough, does not fill its box) and goes back with the reason while it does not pass.

import type { Schema } from '../ai/models';
import { analyse } from '../../mj/check';
import { boxOf, classOf, CLASSES, TILE, type AssetClass } from '../../mj/classes';
import { Mj3Error, type RunResult, type Vec3 } from '../../mj/engine';
import { compileMjx, type MjxModel } from '../../mj/model';
import { MJ_PALETTE } from '../../mj/palette';
import { DEFAULT_RENDER, render, sheet } from '../../mj/photo';
import { pngDataUrl } from '../../mj/png';
import { runMjx } from '../../mj/run';
import type { FileMap } from '../types';
import type { Council } from './council';

export type ModelCategory = 'semplice' | 'figura' | 'struttura';

export const categoryOf = (cls: AssetClass): ModelCategory =>
  ['persona', 'animale', 'bestia'].includes(cls.id) ? 'figura' : ['edificio', 'monumento', 'grande'].includes(cls.id) ? 'struttura' : 'semplice';

export interface SculptorModels {
  semplice: string;
  figura: string;
  struttura: string;
  /** For the structures that matter, until `importanteFino` (ISO date: then its price doubles). */
  importante: string;
  importanteFino?: string;
  artista: string;
}

export const DEFAULT_SCULPTORS: SculptorModels = {
  semplice: 'gemini-3.1-flash-lite',
  figura: 'gemini-3.8-flash',
  struttura: 'gemini-3.8-flash',
  importante: 'gemini-4-argon',
  importanteFino: '2026-12-01',
  artista: 'gemini-3.5-flash',
};

export interface SculptRequest {
  /** Id in the library (`models/<id>.xml`). */
  id: string;
  nome: string;
  aspetto: string;
  classe: string;
  contesto?: string;
  /** One program for many things: the letter C takes each thing's colour. */
  tinta?: boolean;
  /** A structure that matters (the best model). */
  importante?: boolean;
  /** The program it had (a request to sculpt it again) and what is wished. */
  previous?: string;
  desiderio?: string;
}

export interface Critique {
  voto: number;
  riconoscibile: boolean;
  problemi: string[];
  consigli: string[];
}

export interface SculptResult {
  xml: string;
  model: string;
  voto?: number;
  calls: number;
}

const CRITIQUE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    voto: { type: 'INTEGER', description: '0-10' },
    riconoscibile: { type: 'BOOLEAN' },
    problemi: { type: 'ARRAY', items: { type: 'STRING' } },
    consigli: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['voto', 'riconoscibile', 'problemi', 'consigli'],
};

const classLine = (c: AssetClass) => {
  const b = boxOf(c);
  return `  - ${c.id} (${c.name}): ${b.join('×')} voxel = ${c.tiles.join('×')} caselle${c.minHeight ? `, alto almeno ${Math.round(c.minHeight * b[2])}` : ''}; ${c.hint}`;
};

/** The Sculptor's instructions (prompts/agents/scultore.md) with the scale, the classes and the palette. */
export function sculptorRole(files: FileMap): string {
  const palette = Object.entries(MJ_PALETTE).map(([k, v]) => `${k} ${v.color.slice(1)}`).join(' · ');
  return (files['prompts/agents/scultore.md'] ?? 'Sei lo Scultore: scrivi programmi MarkovJunior in XML.')
    .replaceAll('@@TILE@@', String(TILE))
    .replace('@@CLASSES@@', CLASSES.map(classLine).join('\n'))
    .replace('@@PALETTE@@', palette);
}

/** Up to two programs of the library of the same class (or family) to learn from: the hand-written first. */
export function examplesFor(files: FileMap, classe: string): string[] {
  let index: Record<string, { classe?: string; autore?: string }> = {};
  try {
    index = JSON.parse(files['models/index.json'] ?? '{}');
  } catch {
    index = {};
  }
  const family: Record<string, string[]> = { persona: ['persona', 'animale'], animale: ['animale', 'persona'], bestia: ['bestia', 'animale'], albero: ['albero', 'cespuglio'], cespuglio: ['cespuglio', 'albero'], roccia: ['roccia', 'sasso'], sasso: ['sasso', 'roccia'], oggetto: ['oggetto', 'mobile'], mobile: ['mobile', 'oggetto'], edificio: ['edificio', 'grande'], grande: ['grande', 'edificio'], monumento: ['monumento', 'edificio'] };
  const ids = Object.keys(index).filter((id) => files[`models/${id}.xml`]);
  const picked: string[] = [];
  for (const cls of family[classe] ?? [classe, 'mobile']) {
    const of = ids.filter((id) => index[id].classe === cls).sort((a, b) => Number(/mano/.test(index[b].autore ?? '')) - Number(/mano/.test(index[a].autore ?? '')));
    for (const id of of) if (picked.length < 2 && !picked.includes(id)) picked.push(id);
  }
  return picked.map((id) => files[`models/${id}.xml`].trim());
}

/** The XML in an answer: inside a code fence if there is one, from the first "<" to the last ">". */
export function extractXml(raw: string): string {
  const fence = /```(?:xml)?\s*([\s\S]*?)```/.exec(raw);
  const s = fence ? fence[1] : raw;
  const a = s.indexOf('<'), b = s.lastIndexOf('>');
  return a >= 0 && b > a ? s.slice(a, b + 1).trim() : s.trim();
}

/** Programs that `map` up from a coarse grid (structures). */
const scales = (xml: string) => /<map\b/.test(xml);

/** Writes the class's box into the program's root, so that the library runs it as it was judged. */
export function withSize(xml: string, box: Vec3): string {
  if (scales(xml)) return xml;
  const m = /<(?!!)([a-z]+)\b([^>]*)>/i.exec(xml);
  if (!m) return xml;
  const attrs = /\ssize="[^"]*"/.test(m[2]) ? m[2].replace(/\ssize="[^"]*"/, ` size="${box.join(' ')}"`) : `${m[2]} size="${box.join(' ')}"`;
  return xml.slice(0, m.index) + `<${m[1]}${attrs}>` + xml.slice(m.index + m[0].length);
}

interface Checked {
  xml: string;
  model?: MjxModel;
  result?: RunResult;
  error?: string;
}

/** The kernel's checks on a program: what makes it unusable goes back to the Sculptor with the reason. */
export function checkProgram(xml: string, cls: AssetClass): Checked {
  const box = boxOf(cls);
  try {
    // A program that decides on a coarse grid and maps up keeps its own size; the others get the class's box.
    const model = compileMjx(xml, scales(xml) ? {} : { size: box });
    const result = runMjx(model, 1, { deadline: 8_000 });
    if (!result.finished) return { xml, model, error: 'il programma non finisce in 8 secondi: ogni crescita deve avere steps' };
    const a = analyse(result, model.program.palette, { grounded: true, minHeight: Math.round((cls.minHeight ?? 0) * box[2]) });
    const notes = [...a.errors];
    const cells = result.grid.X * result.grid.Y * result.grid.Z;
    if (a.voxels > cells * 0.85) notes.push(`riempie il ${Math.round((a.voxels / cells) * 100)}% della scatola: qualcosa cresce senza limite (manca steps?) o la prima lettera di values non è la cella vuota`);
    return { xml, model, result, ...(notes.length ? { error: notes.join('; ') } : {}) };
  } catch (e) {
    return { xml, error: e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}` };
  }
}

/** The four photographs the Artist looks at (front, right, back, left), as one image. */
export function views(c: Checked): string {
  const pics = [0, 1, 2, 3].map((v) => render(c.result!.grid, c.model!.program.palette, v, DEFAULT_RENDER));
  const w = pics.reduce((s, v) => s + v.w + 4, 4);
  return pngDataUrl(sheet(pics, Math.max(2, Math.min(6, Math.floor(1024 / w))), 4, [112, 150, 84]));
}

export function describe(req: SculptRequest, cls: AssetClass): string {
  const box = boxOf(cls);
  return [
    `Scolpisci: ${req.nome}`,
    `Com'è: ${req.aspetto}`,
    req.contesto && `Dove si trova: ${req.contesto}`,
    `Classe: ${cls.id} · scatola ${box.join(' × ')} voxel${cls.minHeight ? ` · alto almeno ${Math.round(cls.minHeight * box[2])}` : ''}`,
    req.tinta && 'Vale per molte cose di questo genere: il colore principale è la lettera C (il gioco la ricolora per ciascuna).',
  ]
    .filter(Boolean)
    .join('\n');
}

export function modelFor(req: SculptRequest, cls: AssetClass, m: SculptorModels, today = new Date().toISOString().slice(0, 10)): string {
  const cat = categoryOf(cls);
  if (cat === 'struttura' && req.importante && (!m.importanteFino || today < m.importanteFino)) return m.importante;
  return m[cat];
}

export async function judge(c: Council, req: SculptRequest, cls: AssetClass, checked: Checked, artist: string): Promise<Critique | undefined> {
  try {
    const raw = await c.ask<Partial<Critique>>('artista', 'model.judge', `${describe(req, cls)}\nL'immagine mostra il modello da quattro lati (fronte, destra, retro, sinistra). Giudicalo.`, CRITIQUE_SCHEMA, {
      images: [views(checked)],
      model: artist,
      temperature: 0.3,
      data: { request: req },
    });
    return {
      voto: Math.max(0, Math.min(10, Math.round(Number(raw.voto) || 0))),
      riconoscibile: raw.riconoscibile === true,
      problemi: Array.isArray(raw.problemi) ? raw.problemi.map(String) : [],
      consigli: Array.isArray(raw.consigli) ? raw.consigli.map(String) : [],
    };
  } catch (e) {
    c.say('artista', 'errore', `non riesce a guardare «${req.nome}»: ${(e as Error).message}`, undefined, 'model.judge');
    return undefined;
  }
}

/**
 * One program that passes the kernel's checks, or the last error. `previous` turns the request into a
 * revision (the program, the photographs, the Artist's words).
 */
async function write(c: Council, req: SculptRequest, cls: AssetClass, model: string, previous?: { checked: Checked; critique: Critique }, retries = 2): Promise<{ checked?: Checked; calls: number; error?: string }> {
  const role = sculptorRole(c.files);
  const examples = examplesFor(c.files, cls.id);
  const system = examples.length ? `## Esempi (programmi della libreria)\n${examples.join('\n\n')}` : undefined;
  let prompt = describe(req, cls);
  const images: string[] = [];
  if (req.previous) prompt += `\n\nIl suo programma attuale:\n${req.previous}\n${req.desiderio ? `Si desidera: ${req.desiderio}\n` : ''}Rifallo: rispondi con il programma completo.`;
  if (previous) {
    prompt += `\n\nIl tuo programma:\n${previous.checked.xml}\nL'immagine allegata lo mostra da quattro lati. L'Artista gli ha dato ${previous.critique.voto}/10.\nProblemi: ${previous.critique.problemi.join('; ') || '—'}\nConsigli: ${previous.critique.consigli.join('; ') || '—'}\nMiglioralo: rispondi con il programma completo.`;
    images.push(views(previous.checked));
  }
  let last: Checked | undefined;
  let calls = 0;
  for (let i = 0; i <= retries; i++) {
    const p = i === 0 ? prompt : `${prompt}\n\nIl programma che hai scritto:\n${last!.xml.slice(0, 6000)}\nNon va: ${last!.error}\nCorreggilo e rispondi con il programma completo.`;
    calls++;
    const raw = await c.write('scultore', 'model.sculpt', p, { role, system, images, model, temperature: 0.7, data: { request: req, classe: cls.id, example: examples[0] } });
    last = checkProgram(extractXml(raw), cls);
    if (!last.error) return { checked: last, calls };
    c.say('kernel', 'scarta', `«${req.nome}»: ${last.error.slice(0, 160)}`, 'scultore', 'model.sculpt');
  }
  return { calls, error: last?.error };
}

/**
 * Sculpts a model: the program (with its box written in), who wrote it, the Artist's vote. Undefined
 * if no program passed the checks (the thing keeps the generic model of its class).
 */
export async function sculpt(c: Council, req: SculptRequest, m: SculptorModels = DEFAULT_SCULPTORS): Promise<SculptResult | undefined> {
  const cls = classOf(req.classe) ?? classOf('oggetto')!;
  const model = modelFor(req, cls, m);
  const cat = categoryOf(cls);
  c.say('scultore', 'propone', `«${req.nome}» (${cls.name}, ${model})`, undefined, 'model.sculpt');
  let calls = 0;
  const candidates: Array<{ checked: Checked; critique?: Critique }> = [];
  // Simple things: two independent programs. Figures and structures: one, and a revision if needed.
  for (let n = 0; n < (cat === 'semplice' && !req.previous ? 2 : 1); n++) {
    const w = await write(c, req, cls, model);
    calls += w.calls;
    if (w.checked) candidates.push({ checked: w.checked, critique: await judge(c, req, cls, w.checked, m.artista) });
  }
  if (cat !== 'semplice' && candidates[0]?.critique && candidates[0].critique.voto < 7) {
    const w = await write(c, req, cls, model, { checked: candidates[0].checked, critique: candidates[0].critique }, 1);
    calls += w.calls;
    if (w.checked) candidates.push({ checked: w.checked, critique: await judge(c, req, cls, w.checked, m.artista) });
  }
  if (!candidates.length) {
    c.say('scultore', 'errore', `«${req.nome}»: nessun programma valido`, undefined, 'model.sculpt');
    return undefined;
  }
  const best = candidates.reduce((a, b) => ((b.critique?.voto ?? -1) > (a.critique?.voto ?? -1) ? b : a));
  const voto = best.critique?.voto;
  if (best.critique) c.say('artista', voto !== undefined && voto >= 7 ? 'approva' : 'obietta', `«${req.nome}»: ${voto}/10${best.critique.problemi.length ? ` — ${best.critique.problemi[0]}` : ''}`, 'scultore', 'model.judge');
  const xml = `<!-- ${req.nome}: scolpito da ${model} (step 9)${voto !== undefined ? `, voto dell'Artista ${voto}/10` : ''} -->\n${withSize(best.checked.xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''), boxOf(cls))}\n`;
  return { xml, model, voto, calls };
}
