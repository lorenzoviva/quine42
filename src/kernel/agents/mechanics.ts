// The Forge of mechanics (ADR-0028): the Council adds a mechanic to the game — equipment slots, a
// quiver, saddlebags, a reputation sheet — as a system module with an interface panel (drawn by the
// kernel) and Lua logic (on_slot / on_ui / update). The kernel validates both before anything runs.

import type { Schema } from '../ai/models';
import type { UiElement, UiPanel } from '../types';
import type { Council } from './council';

const ELEMENT: Schema = {
  type: 'OBJECT',
  properties: {
    tipo: { type: 'STRING', enum: ['slot', 'barra', 'testo', 'pulsante'] },
    id: { type: 'STRING', description: 'slot: il suo id (es. testa); pulsante: l\'azione che riceve on_ui' },
    etichetta: { type: 'STRING' },
    accetta: { type: 'ARRAY', items: { type: 'STRING' }, description: 'slot: cosa ci va (posti degli oggetti come testa/corpo/arma, categorie come vestiario/arma, o tag)' },
    campo: { type: 'STRING', description: 'barra/testo: "componente.campo" del viandante (es. needs.health, reputazione.valore)' },
    max: { type: 'NUMBER' },
  },
  required: ['tipo', 'etichetta'],
};

const MECHANIC_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    nome: { type: 'STRING' },
    descrizione: { type: 'STRING', description: 'cosa aggiunge al gioco e quali conseguenze ha' },
    pannello: { type: 'OBJECT', properties: { titolo: { type: 'STRING' }, elementi: { type: 'ARRAY', items: ELEMENT } }, required: ['titolo', 'elementi'] },
    componenti_json: { type: 'STRING', description: 'componenti iniziali del viandante, come JSON (es. {"reputazione":{"valore":0}}), facoltativo' },
    logica: { type: 'STRING', description: 'logic.lua del modulo (return M), con on_slot(user, slot, item, panel), on_ui(user, azione) e/o update(dt)' },
  },
  required: ['nome', 'descrizione', 'pannello', 'logica'],
};

export interface MechanicDraft {
  name: string;
  description: string;
  panel: Omit<UiPanel, 'id'>;
  components?: Record<string, unknown>;
  logic: string;
}

export async function designMechanic(c: Council, request: string, ctx: { items: string[]; mechanics: string[]; feedback?: string }): Promise<MechanicDraft> {
  const r = await c.ask<{ nome: string; descrizione: string; pannello: { titolo: string; elementi: UiElement[] }; componenti_json?: string; logica: string }>(
    'ingegnere',
    'mechanic.design',
    [
      `Il Concilio introduce una meccanica nel gioco: «${request}».`,
      `Oggetti esistenti (con il posto dove si indossano, se c'è): ${ctx.items.slice(0, 60).join(', ') || 'nessuno'}.`,
      `Meccaniche già presenti: ${ctx.mechanics.join(', ') || 'nessuna'}.`,
      'Scrivi un modulo di sistema con un pannello (il kernel lo disegna come scheda dell\'inventario) e la sua logica Lua. Vedi il tuo ruolo, sezione «Meccaniche e interfacce», per gli elementi del pannello e l\'API (ui.slot, items.bonus, stati del viandante). La meccanica deve avere conseguenze vere nel gioco (es. le armature danno difesa e pesano, le armi si impugnano, uno zaino dà peso).',
      ctx.feedback ? `IL TENTATIVO PRECEDENTE NON ANDAVA: ${ctx.feedback}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    MECHANIC_SCHEMA,
    { data: { request, ...ctx }, temperature: 0.4 },
  );
  let components: Record<string, unknown> | undefined;
  try {
    components = r.componenti_json ? JSON.parse(r.componenti_json) : undefined;
  } catch {
    components = undefined;
  }
  return {
    name: String(r.nome ?? request).slice(0, 40),
    description: String(r.descrizione ?? '').slice(0, 300),
    panel: { titolo: String(r.pannello?.titolo ?? r.nome ?? 'Meccanica').slice(0, 30), elementi: Array.isArray(r.pannello?.elementi) ? r.pannello.elementi : [] },
    components,
    logic: String(r.logica ?? ''),
  };
}

/** A panel the kernel can draw: known element kinds, ids and labels cleaned, at most 16 elements. */
export function cleanPanel(panel: { titolo?: string; elementi?: unknown[] }, id: string): { panel?: UiPanel; errors: string[] } {
  const errors: string[] = [];
  const elementi: UiElement[] = [];
  const seen = new Set<string>();
  for (const raw of (panel.elementi ?? []).slice(0, 16) as Array<Record<string, unknown>>) {
    const tipo = raw?.tipo;
    if (tipo !== 'slot' && tipo !== 'barra' && tipo !== 'testo' && tipo !== 'pulsante') continue;
    const el: UiElement = { tipo, etichetta: String(raw.etichetta ?? raw.id ?? '').slice(0, 40) };
    const sid = String(raw.id ?? '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
    if (tipo === 'slot' || tipo === 'pulsante') {
      if (!sid || seen.has(sid)) {
        errors.push(`${tipo} senza id unico («${el.etichetta}»)`);
        continue;
      }
      seen.add(sid);
      el.id = sid;
    }
    if (tipo === 'slot') el.accetta = (Array.isArray(raw.accetta) ? raw.accetta : []).map((a) => String(a).toLowerCase().trim()).filter(Boolean).slice(0, 8);
    if ((tipo === 'barra' || tipo === 'testo') && typeof raw.campo === 'string' && /^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$/i.test(raw.campo)) el.campo = raw.campo;
    if (tipo === 'barra') el.max = typeof raw.max === 'number' && raw.max > 0 ? raw.max : 100;
    elementi.push(el);
  }
  if (!elementi.length) errors.push('il pannello non ha elementi validi');
  return errors.length && !elementi.length ? { errors } : { panel: { id, titolo: String(panel.titolo ?? 'Meccanica').slice(0, 30), elementi }, errors };
}
