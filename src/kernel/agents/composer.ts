// The Musician writes the sound programs of what the world asks for (T225): a program per type, the instances are seeds (rule 11). Like the Sculptor's, a program
// goes through the kernel's checks and goes back with the reason while it does not pass; here the checks are the validator's own, with the thresholds of the analysis
// (ADR-0125), and the names are the world's (rule 0). Nobody hears it first: what the measures cannot say stays for whoever listens (lab/banco/suono.md).

import type { Schema } from '../ai/models';
import { BudgetError } from '../ai/models';
import { metaBreak } from '../fourthwall';
import { SOUND_THRESHOLDS as T } from '../../mj/soundanalysis';
import { INSTRUMENTS, SCALES, soundPrograms, type SoundPurpose } from '../../mj/sound';
import { modelErrors } from '../validator';
import type { FileMap } from '../types';
import { wordsOf, type Council } from './council';

export const COMPOSE_TASK = 'sound.compose';
export const DAY_MOMENTS = ['mattina', 'giorno', 'sera', 'notte'];
/** A loop shorter than this is not a piece: a bar (16 steps) would go round every two seconds. */
export const MIN_PIECE_STEPS = 32;

export interface ComposeRequest {
  /** What is wished, in the words of who asks (the world, or a wanderer through the Referente). */
  richiesta: string;
  /** What the kernel has already decided: the Musician's answer does not move it. */
  nome?: string;
  uso?: SoundPurpose['uso'];
  ambienti?: string[];
  momenti?: string[];
  /** What it is for: the environment's description, the place. */
  contesto?: string;
}

/** What the world can name right now: a program that names anything else would never sound. */
export interface ComposeWorld {
  ambienti: string[];
  effetti: string[];
  /** An environment for a wish that names none: where the one who asks is standing. */
  qui?: string;
}

export interface Composed {
  nome: string;
  xml: string;
  suono: SoundPurpose;
  model: string;
  calls: number;
}

interface Answer {
  nome?: unknown;
  programma?: unknown;
  uso?: unknown;
  ambienti?: unknown;
  momenti?: unknown;
  effetto?: unknown;
}

const COMPOSE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    nome: { type: 'STRING', description: 'come lo chiamerebbe la gente del mondo: due o tre parole' },
    programma: { type: 'STRING', description: 'il programma completo, in XML, con <sound> nella radice' },
    uso: { type: 'STRING', enum: ['musica', 'effetto'] },
    ambienti: { type: 'ARRAY', items: { type: 'STRING' }, description: "per la musica: gli ambienti in cui suona, dall'elenco" },
    momenti: { type: 'ARRAY', items: { type: 'STRING', enum: DAY_MOMENTS }, description: 'per la musica: quando suona; vuoto, sempre' },
    effetto: { type: 'STRING', description: "per un effetto: quale, dall'elenco" },
  },
  required: ['nome', 'programma', 'uso'],
};

/** Hand-written programs to learn from, by use: the first the universe still has. */
const LEARN_FROM: Record<SoundPurpose['uso'], string[]> = {
  musica: ['suono-musica-pietra', 'suono-musica-tramonto', 'suono-musica-selva'],
  effetto: ['suono-effetto-oggetto', 'suono-effetto-runa', 'suono-effetto-incantesimo'],
};

/** One program of the library to learn from. */
export function soundExample(files: FileMap, uso: SoundPurpose['uso']): string | undefined {
  const known = LEARN_FROM[uso].map((id) => files[`models/${id}.xml`]).find(Boolean);
  return (known ?? soundPrograms(files).find((p) => p.suono?.uso === uso)?.xml)?.trim();
}

/** The Musician's instructions (prompts/agents/musicista.md) with the scales, the instruments and the thresholds of today. */
export function composerRole(files: FileMap): string {
  const limits = [
    `almeno ${T.minEventsPerBar} eventi a battuta e ${T.minPitches} note diverse`,
    `il ciclo non si ripete identico ogni metà o meno, e semi diversi danno partiture diverse (distanza tra i semi almeno ${T.minSeedDistance})`,
    `al più ${Math.round(T.maxSilence * 100)} % di silenzio e ${T.maxEventsPerStep} eventi a passo`,
    `al più ${Math.round(T.maxHarsh * 100)} % di coppie simultanee a semitono o tritono`,
    `volume del ciclo tra ${T.minRmsDb} e ${T.maxRmsDb} dBFS (RMS), picco grezzo al più ${T.maxRawPeak}`,
  ];
  return (files['prompts/agents/musicista.md'] ?? 'Sei il Musicista: scrivi programmi sonori MarkovJunior in XML.')
    .replace('@@SCALES@@', Object.keys(SCALES).join(', '))
    .replace('@@INSTRUMENTS@@', INSTRUMENTS.join(', '))
    .replace('@@LIMITS@@', limits.map((l) => `- ${l}`).join('\n'));
}

const stringsIn = (v: unknown, allowed: string[]): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && allowed.includes(s)) : []);

/** The names a program carries (`name="…"`, on the root and on its letters): they stand in the corona, and they are the world's words. */
const namesIn = (xml: string): string[] => [...xml.matchAll(/\sname="([^"]*)"/g)].map((m) => m[1]);

/** What an answer is for, or why it cannot be: what the kernel decided wins, what the world cannot name is dropped. */
export function purposeOf(a: Answer, req: ComposeRequest, world: ComposeWorld): { suono?: SoundPurpose; error?: string } {
  const uso = req.uso ?? (a.uso === 'effetto' ? 'effetto' : 'musica');
  if (uso === 'effetto') {
    const effect = typeof a.effetto === 'string' ? a.effetto.trim() : '';
    if (!world.effetti.includes(effect)) return { error: `un effetto risponde a un momento del gioco: "effetto" è uno tra ${world.effetti.join(', ')}` };
    return { suono: { uso, effetti: [effect] } };
  }
  const named = req.ambienti ?? stringsIn(a.ambienti, world.ambienti);
  const ambienti = !named.length && world.qui ? [world.qui] : named;
  if (!ambienti.length) return { error: `"ambienti" nomina almeno uno tra ${world.ambienti.join(', ')}` };
  const momenti = req.momenti ?? stringsIn(a.momenti, DAY_MOMENTS);
  return { suono: { uso, ambienti, ...(momenti.length ? { momenti } : {}) } };
}

/** What sends a program back, or nothing: the validator of every model, and what only a program of the Council must respect. */
export function scoreErrors(path: string, xml: string, nome: string, uso: SoundPurpose['uso'], words: string[] = []): string[] {
  if (!/<sound\b/.test(xml)) return ['manca <sound> nella radice: senza, il programma è un modello e non suona'];
  const broken = [nome, ...namesIn(xml)].flatMap((n) => {
    const m = metaBreak(n, words);
    return m ? [`il nome «${n}» non è una parola del mondo («${m}»)`] : [];
  });
  if (broken.length) return broken;
  const steps = Number(/<(?!!)[a-z]+\b[^>]*\ssize="(\d+)/i.exec(xml)?.[1] ?? 0);
  if (uso === 'musica' && steps < MIN_PIECE_STEPS) return [`un brano dura almeno ${MIN_PIECE_STEPS} passi (la prima cifra di size): questo ne ha ${steps}`];
  return modelErrors(path, xml);
}

const describe = (req: ComposeRequest, world: ComposeWorld): string =>
  [
    `Scrivi: ${req.richiesta}`,
    req.nome && `Si chiama: ${req.nome}`,
    req.contesto && `Dove si sente: ${req.contesto}`,
    req.uso ? `È ${req.uso === 'musica' ? 'un brano: musica' : 'un effetto'}.` : 'Decidi se è musica (un ciclo che suona in un ambiente) o un effetto (un momento breve del gioco).',
    !req.ambienti && `Ambienti del mondo: ${world.ambienti.join(', ')}.`,
    !req.uso && `Momenti del gioco che hanno un effetto: ${world.effetti.join(', ')}.`,
  ]
    .filter(Boolean)
    .join('\n');

/**
 * A program that passes every check, or undefined when no answer did: the world goes on with the music it has. The model is the caller's (`scultori.musicista`), and so is
 * who pays: `chi` when a wanderer asked, the world otherwise (`sound.compose` is a common task).
 */
export async function compose(c: Council, req: ComposeRequest, world: ComposeWorld, model: string, opts: { chi?: string; retries?: number } = {}): Promise<Composed | undefined> {
  const example = soundExample(c.files, req.uso ?? 'musica');
  // Who decides the use sees both: an effect is not a short piece.
  const shown = req.uso ? [example] : [example, soundExample(c.files, 'effetto')];
  const system = shown.some(Boolean) ? `## Esempi della libreria\n${shown.filter(Boolean).join('\n\n')}` : undefined;
  const prompt = describe(req, world);
  const words = wordsOf(c.files);
  let last: { xml?: string; error: string } | undefined;
  let calls = 0;
  for (let i = 0; i <= (opts.retries ?? 2); i++) {
    const p = last ? `${prompt}\n\nIl programma che hai scritto:\n${(last.xml ?? '(nessuno)').slice(0, 6000)}\nNon va: ${last.error}\nCorreggilo e rispondi con il programma completo.` : prompt;
    calls++;
    let a: Answer;
    try {
      a = await c.ask<Answer>('musicista', COMPOSE_TASK, p, COMPOSE_SCHEMA, { role: composerRole(c.files), system, model, temperature: 0.8, data: { request: req, world, example }, ...(opts.chi ? { chi: opts.chi } : {}) });
    } catch (e) {
      if (e instanceof BudgetError) throw e;
      last = { error: `la risposta non si legge: ${(e as Error).message.slice(0, 160)}` };
      c.say('kernel', 'scarta', `«${req.nome ?? 'brano'}»: ${last.error}`, 'musicista', COMPOSE_TASK);
      continue;
    }
    const xml = typeof a.programma === 'string' ? a.programma.trim() : '';
    const nome = req.nome ?? (typeof a.nome === 'string' ? a.nome.trim() : '');
    const { suono, error } = purposeOf(a, req, world);
    const errors = error ? [error] : !nome ? ['manca "nome"'] : scoreErrors('models/suono-prova.xml', xml, nome, suono!.uso, words);
    if (!errors.length) return { nome, xml, suono: suono!, model, calls };
    last = { xml, error: errors.join('; ') };
    c.say('kernel', 'scarta', `«${nome || 'brano'}»: ${last.error.slice(0, 160)}`, 'musicista', COMPOSE_TASK);
  }
  c.say('musicista', 'errore', `«${req.nome ?? req.richiesta.slice(0, 40)}»: nessun programma valido`, undefined, COMPOSE_TASK);
  return undefined;
}
