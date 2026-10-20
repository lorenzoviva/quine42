// Characters: an NPC is an LLM playing the module's persona. It answers in character and picks one
// action from a closed set; the kernel validates it and Lua systems carry it out.

import type { Schema } from '../ai/models';
import type { Council } from './council';

export const NPC_ACTIONS = ['nessuna', 'segui', 'resta', 'vaga', 'dai'] as const;
export type NpcAction = (typeof NPC_ACTIONS)[number];

export interface Turn {
  who: 'giocatore' | 'npc';
  text: string;
}

export interface NpcContext {
  name: string;
  persona: string;
  mood: string;
  mode: string;
  /** Names of what the NPC carries. */
  carrying: string[];
  place: string;
  history: Turn[];
  /** Facts the world exposes to characters (distance to the edge, held item…). */
  facts: Record<string, unknown>;
}

export interface NpcReply {
  say: string;
  action: NpcAction;
  item?: string;
  mood: string;
  /** Concrete things mentioned in the exchange: the world may make them real. */
  mentioned?: string[];
}

const REPLY_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    dice: { type: 'STRING' },
    azione: { type: 'STRING', enum: [...NPC_ACTIONS] },
    oggetto: { type: 'STRING', description: 'solo per "dai": il nome esatto di ciò che porti e cedi' },
    umore: { type: 'STRING' },
    oggetti_citati: { type: 'ARRAY', items: { type: 'STRING' }, description: 'oggetti concreti di cui si è parlato in questo scambio (da te o dal viandante)' },
  },
  required: ['dice', 'azione', 'umore'],
};

export async function npcReply(c: Council, npc: NpcContext, playerText: string): Promise<NpcReply> {
  const history = npc.history.slice(-10).map((t) => `${t.who === 'giocatore' ? 'Viandante' : npc.name}: ${t.text}`).join('\n');
  const prompt = [
    `Interpreta questo personaggio, in prima persona, restando sempre nel personaggio.`,
    `SCHEDA DEL PERSONAGGIO\n${npc.persona}`,
    `Stato: umore ${npc.mood}; ora stai ${npc.mode === 'segui' ? 'seguendo il viandante' : npc.mode === 'resta' ? 'fermo' : 'girovagando'}; luogo: ${npc.place || 'sconosciuto'}; porti con te: ${npc.carrying.join(', ') || 'niente'}.`,
    `Fatti che percepisci: ${JSON.stringify(npc.facts)}`,
    history ? `Conversazione finora:\n${history}` : 'Il viandante ti si avvicina per la prima volta.',
    `Il viandante dice: «${playerText}»`,
    `Rispondi in "dice" (1-3 frasi, italiano, stile del personaggio). Scegli "azione": segui (lo accompagni), resta (ti fermi), vaga (riprendi a girovagare), dai (gli cedi una cosa che porti: metti il nome esatto in "oggetto"), nessuna. Non inventare oggetti che non porti. Non rivelare mai apertamente che il mondo è una simulazione: al massimo lascia intuire le crepe.`,
  ].join('\n\n');
  const r = await c.ask<{ dice: string; azione: string; oggetto?: string; umore?: string; oggetti_citati?: string[] }>('narratore', 'npc.reply', prompt, REPLY_SCHEMA, {
    data: { npc, playerText },
    temperature: 0.9,
  });
  const action = (NPC_ACTIONS as readonly string[]).includes(r.azione) ? (r.azione as NpcAction) : 'nessuna';
  return { say: String(r.dice ?? '…'), action, item: r.oggetto, mood: String(r.umore ?? npc.mood), mentioned: (r.oggetti_citati ?? []).map(String).slice(0, 5) };
}

/** "Esamina": the Narrator describes what the player looks at (cached by the kernel). */
export async function examine(c: Council, what: { name: string; description: string; lore?: string }, facts: Record<string, unknown>): Promise<string> {
  const r = await c.ask<{ testo: string }>(
    'narratore',
    'text.examine',
    `Il viandante osserva da vicino «${what.name}» (${what.description}${what.lore ? `; ${what.lore}` : ''}). Descrivi in 2-3 frasi cosa nota: dettagli concreti, materiali, odori, un piccolo indizio narrativo. Contesto: ${JSON.stringify(facts)}.`,
    READ_SCHEMA,
    { data: { what, facts }, temperature: 0.9 },
  );
  return String(r.testo ?? '');
}

const READ_SCHEMA: Schema = { type: 'OBJECT', properties: { testo: { type: 'STRING' } }, required: ['testo'] };

/** Text written on things (signs, inscriptions): the Narrator writes it, with the world's measurements. */
export async function narrate(c: Council, what: { name: string; description: string; lore?: string }, facts: Record<string, unknown>): Promise<string> {
  const r = await c.ask<{ testo: string }>(
    'narratore',
    'text.read',
    `Il viandante legge «${what.name}» (${what.description}${what.lore ? `; ${what.lore}` : ''}). Scrivi ciò che c'è scritto, breve (max 2 righe), nel tono del mondo. Fatti misurabili del mondo da usare se pertinenti: ${JSON.stringify(facts)}.`,
    READ_SCHEMA,
    { data: { what, facts }, temperature: 0.9 },
  );
  return String(r.testo ?? '');
}
