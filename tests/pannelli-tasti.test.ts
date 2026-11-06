// T263 (ADR-0139): the panels and the keys of every wanderer in a game of many. W: the `campo` a manifest's `ui` names travel in `MyState`,
// and nothing else; K: `world.wanderers()` and `input.held(azione, id)`, with the keys each client says.

import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { apiErrors } from '../src/kernel/validator';
import { SessionClient } from '../src/session/client';
import { fakeLink, type ClientMsg } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { DT, manifestOf, manyPlayers, universeWith } from './espressivita/banco';

const many = (files: Record<string, string>) => Kernel.boot({ files: manyPlayers(files), store: memoryStore(), ai: new MockAiModels() });

function join(server: SessionServer, id: string): { client: SessionClient; sent: ClientMsg[] } {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const sent: ClientMsg[] = [];
  const send = c.send.bind(c);
  c.send = (m: ClientMsg) => {
    sent.push(m);
    send(m);
  };
  return { client: new SessionClient(c, { id }), sent };
}

/** The mechanics of T183 whose panels show a field of the wanderer. */
const WITH_FIELDS = readdirSync('tests/espressivita/moduli').filter((id) => id.startsWith('mech.') && (manifestOf(id).ui?.elements ?? []).some((e) => e.field));

describe('W: what a panel shows, in a game of many', () => {
  it('every mechanic of T183 with a panel field has it reach the client of the wanderer it belongs to', async () => {
    expect(WITH_FIELDS.length).toBeGreaterThanOrEqual(6);
    for (const id of WITH_FIELDS) {
      const k = await many(universeWith(id));
      const server = new SessionServer(k);
      const { client } = join(server, 'bea');
      await client.ready;
      const fields = manifestOf(id).ui!.elements.flatMap((e) => (e.field ? [e.field] : []));
      k.as('bea', () => {
        for (const [i, campo] of fields.entries()) {
          const [c, f] = campo.split('.');
          if (['needs', 'states'].includes(c)) continue;
          const comp = k.ecs.get(k.wandererEntity, c) ?? k.ecs.set(k.wandererEntity, c, {});
          comp[f] = `valore-${i}`;
        }
      });
      for (let t = 0; t < 10; t++) server.tick(DT);
      for (const [i, campo] of fields.entries()) {
        if (campo.startsWith('needs.') || campo.startsWith('stati.')) continue;
        expect(client.state.fields?.[campo], `${id}: ${campo}`).toBe(k.as('bea', () => k.uiValue(campo)) ?? `valore-${i}`);
      }
    }
  });

  it('each wanderer reads their own: another’s value never reaches them', async () => {
    const k = await many(universeWith('mech.partita'));
    const server = new SessionServer(k);
    const bea = join(server, 'bea').client;
    const ugo = join(server, 'ugo').client;
    await Promise.all([bea.ready, ugo.ready]);
    k.as('bea', () => k.ecs.set(k.wandererEntity, 'partita', { noi: 3, loro: 1, via: false }));
    k.as('ugo', () => k.ecs.set(k.wandererEntity, 'partita', { noi: 0, loro: 5, via: false }));
    for (let t = 0; t < 10; t++) server.tick(DT);
    expect(bea.state.fields).toEqual({ 'partita.noi': 3, 'partita.loro': 1 });
    expect(ugo.state.fields).toEqual({ 'partita.noi': 0, 'partita.loro': 5 });
  });

  it('on a client the fields become what its panels read; the kernel’s own components are never written from there', async () => {
    const k = await Kernel.boot({ files: universeWith('mech.torneo', 'mech.partita'), store: memoryStore(), ai: new MockAiModels() });
    const needs = { ...k.needs() };
    k.takePanelFields({ 'torneo_visto.tabellone': 'in gioco', 'partita.noi': 2, 'needs.health': 1, 'altro.campo': 'x', 'torneo_visto.tocca': { oggetto: 1 } });
    expect(k.uiValue('torneo_visto.tabellone')).toBe('in gioco');
    expect(k.uiValue('partita.noi')).toBe(2);
    expect(k.uiValue('torneo_visto.tocca')).toBeUndefined();
    expect(k.ecs.get(k.wandererEntity, 'altro')).toBeUndefined();
    expect(k.needs()).toEqual(needs);
  });
});

const SEES = `-- Chi c'è e chi tiene la destra.
local M = {}
function M.update(dt)
  local nomi, destra = {}, {}
  for _, w in ipairs(world.wanderers()) do
    nomi[#nomi + 1] = w.chi
    if input.held("right", w.id) then destra[#destra + 1] = w.chi end
  end
  table.sort(nomi)
  table.sort(destra)
  local id = ecs.first("visto") or ecs.spawn({ visto = {} })
  ecs.set(id, "visto", { chi = table.concat(nomi, ","), destra = table.concat(destra, ",") })
end
return M
`;
const seer = {
  'modules/sys.vede/manifest.json': JSON.stringify({ id: 'sys.vede', name: 'Vede', kind: 'system', logic: 'logic.lua', order: 95 }),
  'modules/sys.vede/logic.lua': SEES,
};

describe('K: the keys and the places of every wanderer', () => {
  it('are in the API of Lua', () => {
    expect(apiErrors(SEES)).toEqual([]);
  });

  it('a system sees every wanderer, and the keys of each as their client says them', async () => {
    const k = await many({ ...bundledFiles, ...seer });
    const server = new SessionServer(k);
    const bea = join(server, 'bea');
    await bea.client.ready;
    const seen = () => k.ecs.get(k.ecs.query('visto')[0], 'visto');
    server.tick(DT);
    expect(seen().chi).toBe('bea,me');
    expect(seen().destra).toBe('');
    bea.client.keys(['right']);
    server.tick(DT);
    expect(seen().destra).toBe('bea');
    // Said once, not at every frame.
    bea.client.keys(['right']);
    expect(bea.sent.filter((m) => m.t === 'keys').length).toBe(1);
    bea.client.keys([]);
    server.tick(DT);
    expect(seen().destra).toBe('');
  });

  it('in a game alone the wanderer is one, and the keys are this kernel’s keyboard, as before', async () => {
    const k = await Kernel.boot({ files: { ...bundledFiles, ...seer }, store: memoryStore(), ai: new MockAiModels() });
    k.input.setHeld('right', true);
    k.tick(DT);
    expect(k.ecs.get(k.ecs.query('visto')[0], 'visto')).toEqual({ chi: 'me', destra: 'me' });
  });

  it('who leaves takes their keys with them', async () => {
    const k = await many({ ...bundledFiles, ...seer });
    k.addWanderer('bea');
    k.setHeldOf('bea', ['left']);
    expect(k.heldBy('bea', 'left')).toBe(true);
    k.removeWanderer('bea');
    expect(k.heldBy('bea', 'left')).toBe(false);
  });
});
