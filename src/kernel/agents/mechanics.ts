// The Forge of mechanics (ADR-0028): the Council adds a mechanic to the game — equipment slots, a
// quiver, saddlebags, a reputation sheet — as a system module with an interface panel (drawn by the
// kernel) and Lua logic (on_slot / on_ui / update). The kernel validates both before anything runs.

import type { Schema } from '../ai/models';
import type { UiElement, UiPanel } from '../types';
import type { Council } from './council';
import { internalComponents, internalFields, internalName, internalValues } from '../internalNames';
import { luaFor0_5, luaFor0_7 } from '../migrations';

/** The places of the things (T310b, `posti`) and the bonuses (`bonus`), as the Engineer's schema names them. */
const SLOTS = internalValues('posti');
const BONUSES = internalValues('bonus');

const ELEMENT: Schema = {
  type: 'OBJECT',
  properties: {
    // An element of a panel as the manifest keeps it (T310): its fields and kinds are internal; cleanPanel still reads the Italian of before.
    type: { type: 'STRING', enum: internalValues('pannelli') },
    id: { type: 'STRING', description: 'slot: its id (e.g. head); button: the action on_ui receives' },
    label: { type: 'STRING', description: 'in the language of the world' },
    accepts: { type: 'ARRAY', items: { type: 'STRING' }, description: `slot: what goes in it (places of the things: ${SLOTS.join(', ')}; categories like clothing/weapon; or tags)` },
    field: { type: 'STRING', description: 'bar/text: "component.field" of the wanderer (e.g. needs.health, reputation.value)' },
    max: { type: 'NUMBER' },
  },
  required: ['type', 'label'],
};

/** A case of the bench (T27): a small scene that shows the mechanic working, run with the real code. */
const CASE: Schema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'the case in a few words, in the language of the world (e.g. «Si indossa l’elmo»)' },
    story: { type: 'STRING', description: 'what one sees happen, before and after' },
    wanderer_json: { type: 'STRING', description: 'components of the wanderer before the case, as JSON (e.g. {"needs":{"health":40}}), optional' },
    items: {
      type: 'ARRAY',
      description: 'what the wanderer carries: a thing that exists (by name) or a test one, with its slot and bonuses',
      items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, slot: { type: 'STRING', enum: SLOTS }, category: { type: 'STRING' }, bonus_json: { type: 'STRING', description: `e.g. {"defense":3} (bonuses: ${BONUSES.join(', ')})` } }, required: ['name'] },
    },
    steps: {
      type: 'ARRAY',
      description: 'what happens, in order: a thing into a slot of the panel, taking it out, a button, some time, the wanderer walking (toward and seconds)',
      items: {
        type: 'OBJECT',
        // The steps and the ways are internal since T310 (cleanCases still reads the Italian of the contract 0.1).
        properties: { type: { type: 'STRING', enum: ['slot', 'remove', 'button', 'wait', 'walk'] }, toward: { type: 'STRING', enum: ['up', 'down', 'left', 'right'] }, slot: { type: 'STRING' }, item: { type: 'STRING' }, action: { type: 'STRING' }, seconds: { type: 'NUMBER' } },
        required: ['type'],
      },
    },
    duration: { type: 'NUMBER', description: 'seconds after the steps (at most 30)' },
    watch: { type: 'ARRAY', items: { type: 'STRING' }, description: 'the fields "component.field" of the wanderer that the case changes (e.g. defense.value)' },
    lines: { type: 'ARRAY', items: { type: 'INTEGER' }, description: 'the lines of logic (from 1) that make the case' },
  },
  required: ['title', 'story', 'duration', 'watch'],
};

const MECHANIC_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    description: { type: 'STRING', description: 'what it adds to the game and what consequences it has' },
    panel: { type: 'OBJECT', properties: { title: { type: 'STRING' }, elements: { type: 'ARRAY', items: ELEMENT } }, required: ['title', 'elements'] },
    components_json: { type: 'STRING', description: 'initial components of the wanderer, as JSON (e.g. {"reputation":{"value":0}}), optional' },
    logic: { type: 'STRING', description: 'logic.lua of the module (return M), with on_slot(user, slot, item, panel), on_ui(user, action) and/or update(dt)' },
    cases: { type: 'ARRAY', items: CASE, description: '1-3 use cases that the bench of the Systems Hall stages with the real code' },
  },
  required: ['name', 'description', 'panel', 'logic', 'cases'],
};

export interface MechanicDraft {
  name: string;
  description: string;
  panel: Omit<UiPanel, 'id'>;
  components?: Record<string, unknown>;
  logic: string;
  /** The cases as the Engineer wrote them (the kernel cleans and runs them, T27). */
  cases: unknown[];
}

export async function designMechanic(c: Council, request: string, ctx: { items: string[]; mechanics: string[]; feedback?: string; chi?: string }): Promise<MechanicDraft> {
  const r = await c.ask<{ name: string; description: string; panel: { title: string; elements: UiElement[] }; components_json?: string; logic: string; cases?: unknown[] }>(
    'engineer',
    'mechanic.design',
    [
      `The Council introduces a mechanic into the game: «${request}».`,
      `Existing things (with the slot where they are worn, if any): ${ctx.items.slice(0, 60).join(', ') || 'none'}.`,
      `Mechanics already there: ${ctx.mechanics.join(', ') || 'none'}.`,
      'Write a system module with a panel (the kernel draws it as a tab of the inventory) and its Lua logic. See your role, section "Mechanics and interfaces", for the elements of the panel and the API (ui.slot, items.bonus, states of the wanderer). The mechanic must have real consequences in the game (e.g. armours give defence and weigh, weapons are held, a backpack gives weight).',
      'In "cases" 1-3 use cases, as examples for whoever visits the Systems Hall: the kernel runs them with your code in a miniature world (the wanderer, what they carry, the steps) and checks that the fields of "watch" really change.',
      ctx.feedback ? `THE PREVIOUS ATTEMPT DID NOT WORK: ${ctx.feedback}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    MECHANIC_SCHEMA,
    { data: { request, ...ctx }, temperature: 0.4, chi: ctx.chi },
  );
  let components: Record<string, unknown> | undefined;
  try {
    // The components of 0.4 the Engineer may still write take the names of 0.5 (T308b), and so does its code.
    components = r.components_json ? (internalComponents(JSON.parse(r.components_json)) as Record<string, unknown>) : undefined;
  } catch {
    components = undefined;
  }
  return {
    name: String(r.name ?? request).slice(0, 40),
    description: String(r.description ?? '').slice(0, 300),
    panel: { title: String(r.panel?.title ?? r.name ?? 'Meccanica').slice(0, 30), elements: Array.isArray(r.panel?.elements) ? r.panel.elements : [] },
    components,
    // The names of the contract 0.5 in its Lua (T308b), and the bonuses of 0.7 (`items.bonus(it, "difesa")` → `"defense"`, T310b).
    logic: luaFor0_7(luaFor0_5(String(r.logic ?? ''))),
    cases: Array.isArray(r.cases) ? r.cases : [],
  };
}

/** A panel the kernel can draw: known element kinds, ids and labels cleaned, at most 16 elements. */
export function cleanPanel(panel: { title?: string; elements?: unknown[]; titolo?: string; elementi?: unknown[] }, id: string): { panel?: UiPanel; errors: string[] } {
  const errors: string[] = [];
  const elementi: UiElement[] = [];
  const seen = new Set<string>();
  for (const el0 of (panel.elements ?? panel.elementi ?? []).slice(0, 16) as Array<Record<string, unknown>>) {
    // The Council may still write the Italian of the contracts 0.1 and 0.3 (T307a, T308a; the schema is internal since T310): `barra` is a `bar`, `etichetta` a `label`.
    const raw = (el0 && typeof el0 === 'object' ? internalFields('panelElement', el0) : {}) as Record<string, unknown>;
    const tipo = typeof raw?.type === 'string' ? internalName('pannelli', raw.type) : undefined;
    if (tipo !== 'slot' && tipo !== 'bar' && tipo !== 'text' && tipo !== 'button') continue;
    const el: UiElement = { type: tipo, label: String(raw.label ?? raw.id ?? '').slice(0, 40) };
    const sid = String(raw.id ?? '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
    if (tipo === 'slot' || tipo === 'button') {
      if (!sid || seen.has(sid)) {
        errors.push(`${tipo} senza id unico («${el.label}»)`);
        continue;
      }
      seen.add(sid);
      el.id = sid;
    }
    // What a slot accepts: a place of the things in the Italian of before T310b (`testa`) is the one it means (`head`).
    if (tipo === 'slot') el.accepts = (Array.isArray(raw.accepts) ? raw.accepts : []).map((a) => internalName('posti', String(a).toLowerCase().trim())).filter(Boolean).slice(0, 8);
    if ((tipo === 'bar' || tipo === 'text') && typeof raw.field === 'string' && /^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$/i.test(raw.field)) el.field = raw.field;
    if (tipo === 'bar') el.max = typeof raw.max === 'number' && raw.max > 0 ? raw.max : 100;
    elementi.push(el);
  }
  if (!elementi.length) errors.push('il pannello non ha elementi validi');
  return errors.length && !elementi.length ? { errors } : { panel: { id, title: String(panel.title ?? panel.titolo ?? 'Meccanica').slice(0, 30), elements: elementi }, errors };
}
