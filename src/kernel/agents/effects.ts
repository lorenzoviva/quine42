// Free actions ("Altro…"): the player writes what they do to a thing; the Narrator judges whether it
// can happen and what follows, choosing effects from a closed set (types.ts → Effect). The kernel
// validates them (validator.ts → validateEffects) and core.effects (Lua) applies them. An action that
// makes sense and can be repeated is learned by the object: it enters its menu, no further calls.

import type { Schema } from '../ai/models';
import { EFFECT_TYPES } from '../types';
import type { Council } from './council';

export interface ActionContext {
  /** What the player wrote. */
  text: string;
  target: { name: string; description: string; tags: string[]; container: boolean; kind: string };
  /** Names of what the player carries, and what they hold. */
  carrying: string[];
  holding: string;
  /** Tile under the target and the terrains of the world (names). */
  tile: string;
  terrains: string[];
  /** Modules that can be summoned (names), and loot tables. */
  summonable: string[];
  loot: string[];
  place: string;
}

export interface ActionJudgement {
  possible: boolean;
  story: string;
  effects: unknown[];
  repeatable: boolean;
  label: string;
  /** Item (name) the action needs, if any. */
  requires?: string;
}

const EFFECT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    tipo: { type: 'STRING', enum: [...EFFECT_TYPES] },
    testo: { type: 'STRING' },
    oggetto: { type: 'STRING', description: 'nome di un oggetto (crea_oggetto, consuma)' },
    quantita: { type: 'INTEGER' },
    a: { type: 'STRING', description: 'terreno: nome del terreno risultante' },
    da: { type: 'STRING', description: 'terreno: solo le caselle di questo terreno (facoltativo)' },
    raggio: { type: 'NUMBER' },
    durata: { type: 'NUMBER', description: 'secondi' },
    forza: { type: 'NUMBER' },
    modulo: { type: 'STRING', description: 'evoca: nome di ciò che compare' },
    fame: { type: 'NUMBER' },
    sete: { type: 'NUMBER' },
    energia: { type: 'NUMBER' },
    salute: { type: 'NUMBER' },
    capienza: { type: 'INTEGER' },
    bottino: { type: 'STRING' },
  },
  required: ['tipo'],
};

const JUDGE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    possibile: { type: 'BOOLEAN' },
    racconto: { type: 'STRING', description: "cosa succede, 1-2 frasi, seconda persona" },
    effetti: { type: 'ARRAY', items: EFFECT_SCHEMA },
    ripetibile: { type: 'BOOLEAN', description: "vero se è un'azione sensata che si può rifare sempre allo stesso modo su cose come questa" },
    etichetta: { type: 'STRING', description: "l'azione come voce di menu, 1-3 parole (es. «Forza la serratura»)" },
    serve: { type: 'STRING', description: "oggetto che il viandante deve avere per farlo (facoltativo, tra quelli che porta)" },
  },
  required: ['possibile', 'racconto', 'effetti', 'ripetibile', 'etichetta'],
};

export const EFFECTS_GUIDE = [
  'messaggio {testo}: solo racconto, nessun cambiamento',
  'bisogni {fame, sete, energia, salute}: variazioni da -40 a +40 (positivo = meglio)',
  'crea_oggetto {oggetto, quantita}: compare un oggetto a terra (anche nuovo, se ha senso)',
  'consuma {oggetto, quantita}: il viandante perde un oggetto che porta',
  "distruggi: la cosa si rompe e lascia ciò che conteneva",
  'apri: si apre (se è un contenitore)',
  'contenitore {capienza, bottino}: la cosa diventa apribile (ha uno spazio dentro)',
  'terreno {a, da, raggio}: il terreno attorno cambia (raggio 0-3)',
  'fuoco {raggio, durata}: fiamme che bruciano ciò che è infiammabile',
  'luce {raggio, durata}: una luce',
  'scudo {durata}: il viandante è protetto',
  'spingi {forza}: la cosa viene spinta via',
  'evoca {modulo}: compare qualcosa o qualcuno che esiste già nel mondo',
].join('\n');

export async function judgeAction(c: Council, ctx: ActionContext): Promise<ActionJudgement> {
  const t = ctx.target;
  const prompt = [
    `Il viandante, davanti a «${t.name}» (${t.kind}: ${t.description}${t.tags.length ? `; tag ${t.tags.join(', ')}` : ''}${t.container ? '; è un contenitore' : ''}), scrive: «${ctx.text}».`,
    `Porta: ${ctx.carrying.join(', ') || 'niente'}. Impugna: ${ctx.holding}. Sotto la cosa: ${ctx.tile}. Luogo: ${ctx.place || 'sconosciuto'}.`,
    `Giudica come il Concilio: è possibile, nel mondo e per la fisica? Se no, "possibile" falso e racconta perché non riesce (effetti vuoti o solo messaggio).`,
    `Se sì, scegli gli effetti (al massimo 4) SOLO da questo elenco:\n${EFFECTS_GUIDE}`,
    `Terreni esistenti: ${ctx.terrains.join(', ')}. Cose evocabili: ${ctx.summonable.slice(0, 30).join(', ') || 'nessuna'}. Tabelle di bottino: ${ctx.loot.join(', ')}.`,
    `Sii fedele alla fisica: niente miracoli senza strumenti o rune; serve il giusto attrezzo per scassinare, tagliare, scavare. Se serve un oggetto che il viandante porta, mettilo in "serve".`,
  ].join('\n\n');
  const r = await c.ask<{ possibile: boolean; racconto: string; effetti?: unknown[]; ripetibile?: boolean; etichetta?: string; serve?: string }>('narratore', 'action.judge', prompt, JUDGE_SCHEMA, {
    data: ctx,
    temperature: 0.5,
  });
  return {
    possible: !!r.possibile,
    story: String(r.racconto ?? ''),
    effects: Array.isArray(r.effetti) ? r.effetti : [],
    repeatable: !!r.ripetibile,
    label: String(r.etichetta ?? ctx.text).slice(0, 40),
    requires: r.serve ? String(r.serve) : undefined,
  };
}
