// The Musician writes the sound programs of what the world asks for (T225): a program per type, the instances are seeds (rule 11). Like the Sculptor's, a program
// goes through the kernel's checks and goes back with the reason while it does not pass; here the checks are the validator's own, with the thresholds of the analysis
// (ADR-0125), and the names are the world's (rule 0). Nobody hears it first: what the measures cannot say stays for whoever listens (lab/banco/suono.md).

import { internalName, internalValues } from '../internalNames';
import { DAY_PHASES } from '../npc/model';
import type { Schema } from '../ai/models';
import { BudgetError } from '../ai/models';
import { metaBreak } from '../fourthwall';
import { SOUND_THRESHOLDS as T } from '../../mj/soundanalysis';
import { INSTRUMENTS, SCALES, soundPrograms, type SoundPurpose } from '../../mj/sound';
import { modelErrors } from '../validator';
import type { FileMap } from '../types';
import { wordsOf, type Council } from './council';

export const COMPOSE_TASK = 'sound.compose';
/** The moments of the day as the Musician's schema says them, internal since T310; an Italian answer still reads internal. */
export const DAY_MOMENTS = internalValues('momenti');
/** A loop shorter than this is not a piece: a bar (16 steps) would go round every two seconds. */
export const MIN_PIECE_STEPS = 32;

export interface ComposeRequest {
  /** What is wished, in the words of who asks (the world, or a wanderer through the Referente). */
  richiesta: string;
  /** What the kernel has already decided: the Musician's answer does not move it. */
  nome?: string;
  uso?: SoundPurpose['use'];
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
    nome: { type: 'STRING', description: 'what the people of the world would call it, in the language of the world: two or three words' },
    programma: { type: 'STRING', description: 'the whole program, in XML, with <sound> in the root' },
    uso: { type: 'STRING', enum: ['music', 'effect'], description: 'music or effect' },
    ambienti: { type: 'ARRAY', items: { type: 'STRING' }, description: 'for music: the environments it plays in, from the list' },
    momenti: { type: 'ARRAY', items: { type: 'STRING', enum: DAY_MOMENTS }, description: 'for music: when it plays; empty, always' },
    effetto: { type: 'STRING', description: 'for an effect: which one, from the list' },
  },
  required: ['nome', 'programma', 'uso'],
};

/** Hand-written programs to learn from, by use: the first the universe still has. */
const LEARN_FROM: Record<SoundPurpose['use'], string[]> = {
  music: ['sound-music-stone', 'sound-music-sunset', 'sound-music-woods'],
  effect: ['sound-effect-item', 'sound-effect-rune', 'sound-effect-spell'],
};

/** One program of the library to learn from. */
export function soundExample(files: FileMap, uso: SoundPurpose['use']): string | undefined {
  const known = LEARN_FROM[uso].map((id) => files[`models/${id}.xml`]).find(Boolean);
  return (known ?? soundPrograms(files).find((p) => p.sound?.use === uso)?.xml)?.trim();
}

/** The Musician's instructions (prompts/agents/musician.md) with the scales, the instruments and the thresholds of today. */
export function composerRole(files: FileMap): string {
  const limits = [
    `at least ${T.minEventsPerBar} events per bar and ${T.minPitches} different notes`,
    `the loop does not repeat identically every half or less, and different seeds give different scores (distance between the seeds at least ${T.minSeedDistance})`,
    `at most ${Math.round(T.maxSilence * 100)} % of silence and ${T.maxEventsPerStep} events per step`,
    `at most ${Math.round(T.maxHarsh * 100)} % of simultaneous pairs a semitone or a tritone apart`,
    `loudness of the loop between ${T.minRmsDb} and ${T.maxRmsDb} dBFS (RMS), raw peak at most ${T.maxRawPeak}`,
  ];
  return (files['prompts/agents/musician.md'] ?? 'You are the Musician: you write MarkovJunior sound programs in XML.')
    .replace('@@SCALES@@', Object.keys(SCALES).join(', '))
    .replace('@@INSTRUMENTS@@', INSTRUMENTS.join(', '))
    .replace('@@LIMITS@@', limits.map((l) => `- ${l}`).join('\n'));
}

const stringsIn = (v: unknown, allowed: string[]): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && allowed.includes(s)) : []);

/** The names a program carries (`name="…"`, on the root and on its letters): they stand in the corona, and they are the world's words. */
const namesIn = (xml: string): string[] => [...xml.matchAll(/\sname="([^"]*)"/g)].map((m) => m[1]);

/** What an answer is for, or why it cannot be: what the kernel decided wins, what the world cannot name is dropped. */
export function purposeOf(a: Answer, req: ComposeRequest, world: ComposeWorld): { suono?: SoundPurpose; error?: string } {
  const uso = req.uso ?? (typeof a.uso === 'string' && internalName('suoni', a.uso) === 'effect' ? 'effect' : 'music');
  if (uso === 'effect') {
    const effect = typeof a.effetto === 'string' ? a.effetto.trim() : '';
    if (!world.effetti.includes(effect)) return { error: `un effetto risponde a un momento del gioco: "effetto" è uno tra ${world.effetti.join(', ')}` };
    return { suono: { use: uso, effects: [effect] } };
  }
  // An environment of the seed by its Italian id of the contract 0.1 is the one it became (T307a; the prompts are English since T310, the repair stays a contract more).
  const named = req.ambienti ?? stringsIn(Array.isArray(a.ambienti) ? a.ambienti.map((x) => (typeof x === 'string' && !world.ambienti.includes(x) ? internalName('ambienti', x) : x)) : a.ambienti, world.ambienti);
  const ambienti = !named.length && world.qui ? [world.qui] : named;
  if (!ambienti.length) return { error: `"ambienti" nomina almeno uno tra ${world.ambienti.join(', ')}` };
  const momenti = req.momenti ?? stringsIn(Array.isArray(a.momenti) ? a.momenti.map((x) => (typeof x === 'string' ? internalName('momenti', x) : x)) : a.momenti, DAY_PHASES);
  return { suono: { use: uso, environments: ambienti, ...(momenti.length ? { moments: momenti } : {}) } };
}

/** What sends a program back, or nothing: the validator of every model, and what only a program of the Council must respect. */
export function scoreErrors(path: string, xml: string, nome: string, uso: SoundPurpose['use'], words: string[] = []): string[] {
  if (!/<sound\b/.test(xml)) return ['manca <sound> nella radice: senza, il programma è un modello e non suona'];
  const broken = [nome, ...namesIn(xml)].flatMap((n) => {
    const m = metaBreak(n, words);
    return m ? [`il nome «${n}» non è una parola del mondo («${m}»)`] : [];
  });
  if (broken.length) return broken;
  const steps = Number(/<(?!!)[a-z]+\b[^>]*\ssize="(\d+)/i.exec(xml)?.[1] ?? 0);
  if (uso === 'music' && steps < MIN_PIECE_STEPS) return [`un brano dura almeno ${MIN_PIECE_STEPS} passi (la prima cifra di size): questo ne ha ${steps}`];
  return modelErrors(path, xml);
}

const describe = (req: ComposeRequest, world: ComposeWorld): string =>
  [
    `Write: ${req.richiesta}`,
    req.nome && `It is called: ${req.nome}`,
    req.contesto && `Where it is heard: ${req.contesto}`,
    req.uso ? `It is ${req.uso === 'music' ? 'a piece: music' : 'an effect'}.` : 'Decide whether it is music (a loop that plays in an environment) or an effect (a short moment of the game).',
    !req.ambienti && `Environments of the world: ${world.ambienti.join(', ')}.`,
    !req.uso && `Moments of the game that have an effect: ${world.effetti.join(', ')}.`,
  ]
    .filter(Boolean)
    .join('\n');

/**
 * A program that passes every check, or undefined when no answer did: the world goes on with the music it has. The model is the caller's (`scultori.musicista`), and so is
 * who pays: `chi` when a wanderer asked, the world otherwise (`sound.compose` is a common task).
 */
export async function compose(c: Council, req: ComposeRequest, world: ComposeWorld, model: string, opts: { chi?: string; retries?: number } = {}): Promise<Composed | undefined> {
  const example = soundExample(c.files, req.uso ?? 'music');
  // Who decides the use sees both: an effect is not a short piece.
  const shown = req.uso ? [example] : [example, soundExample(c.files, 'effect')];
  const system = shown.some(Boolean) ? `## Examples from the library\n${shown.filter(Boolean).join('\n\n')}` : undefined;
  const prompt = describe(req, world);
  const words = wordsOf(c.files);
  let last: { xml?: string; error: string } | undefined;
  let calls = 0;
  for (let i = 0; i <= (opts.retries ?? 2); i++) {
    const p = last ? `${prompt}\n\nThe program you wrote:\n${(last.xml ?? '(none)').slice(0, 6000)}\nIt does not pass: ${last.error}\nFix it and answer with the whole program.` : prompt;
    calls++;
    let a: Answer;
    try {
      a = await c.ask<Answer>('musician', COMPOSE_TASK, p, COMPOSE_SCHEMA, { role: composerRole(c.files), system, model, temperature: 0.8, data: { request: req, world, example }, ...(opts.chi ? { chi: opts.chi } : {}) });
    } catch (e) {
      if (e instanceof BudgetError) throw e;
      last = { error: `la risposta non si legge: ${(e as Error).message.slice(0, 160)}` };
      c.say('kernel', 'scarta', `«${req.nome ?? 'brano'}»: ${last.error}`, 'musician', COMPOSE_TASK);
      continue;
    }
    const xml = typeof a.programma === 'string' ? a.programma.trim() : '';
    const nome = req.nome ?? (typeof a.nome === 'string' ? a.nome.trim() : '');
    const { suono, error } = purposeOf(a, req, world);
    const errors = error ? [error] : !nome ? ['manca "nome"'] : scoreErrors('models/sound-test.xml', xml, nome, suono!.use, words);
    if (!errors.length) return { nome, xml, suono: suono!, model, calls };
    last = { xml, error: errors.join('; ') };
    c.say('kernel', 'scarta', `«${nome || 'brano'}»: ${last.error.slice(0, 160)}`, 'musician', COMPOSE_TASK);
  }
  c.say('musician', 'errore', `«${req.nome ?? req.richiesta.slice(0, 40)}»: nessun programma valido`, undefined, COMPOSE_TASK);
  return undefined;
}
