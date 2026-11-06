// T263 (ADR-0139, rule 8f): what a panel shows leaves the server as a list, and the keys a client says are only names of directions.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { fakeLink, type ServerMsg } from '../../src/session/protocol';
import { SessionServer } from '../../src/session/server';

const PANEL = {
  'modules/mech.pannello/manifest.json': JSON.stringify({
    id: 'mech.pannello', name: 'Pannello', kind: 'system', logic: 'logic.lua', order: 60,
    ui: { id: 'pannello', titolo: 'Pannello', elementi: [{ tipo: 'testo', etichetta: 'Mostrato', campo: 'segreti.mostrato' }, { tipo: 'pulsante', id: 'x', etichetta: 'x' }] },
  }),
  'modules/mech.pannello/logic.lua': 'local M = {}\nfunction M.update(dt) end\nreturn M\n',
};

async function world() {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, ...PANEL, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multiplayer', morte: 3, master: 'io' } }) };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  const server = new SessionServer(k);
  const { server: s, client } = fakeLink();
  const got: ServerMsg[] = [];
  client.onMessage((m) => got.push(m));
  server.connect(s);
  client.send({ t: 'entra', id: 'bea' });
  return { k, server, send: (m: unknown) => client.send(m as never), got };
}

describe('the fields of the panels on the wire', () => {
  it('V-012 a field a panel names leaves, the other fields of the same component and the other components never do', async () => {
    const { k, server, got } = await world();
    k.as('bea', () => k.ecs.set(k.wandererEntity, 'segreti', { mostrato: 'visibile', nascosto: 'la chiave del forziere' }));
    k.as('bea', () => k.ecs.set(k.wandererEntity, 'altro', { campo: 'mai sul filo' }));
    for (let i = 0; i < 10; i++) server.tick(1 / 60);
    const wire = JSON.stringify(got);
    expect(wire).toContain('visibile');
    expect(wire).not.toContain('la chiave del forziere');
    expect(wire).not.toContain('mai sul filo');
  });

  it('V-012 what a field holds that is not a plain value does not leave, and a long text is cut', async () => {
    const { k, server, got } = await world();
    k.as('bea', () => k.ecs.set(k.wandererEntity, 'segreti', { mostrato: { dentro: 'una tabella intera' } }));
    for (let i = 0; i < 10; i++) server.tick(1 / 60);
    expect(JSON.stringify(got)).not.toContain('una tabella intera');
    k.as('bea', () => k.ecs.set(k.wandererEntity, 'segreti', { mostrato: 'x'.repeat(5000) }));
    for (let i = 0; i < 10; i++) server.tick(1 / 60);
    const last = got.filter((m) => m.t === 'aggiorna' && m.stato?.campi).at(-1) as Extract<ServerMsg, { t: 'aggiorna' }>;
    expect(String(last.stato!.campi!['segreti.mostrato']).length).toBe(200);
  });
});

describe('the keys a client says', () => {
  it('V-021 only the four directions are kept, whatever comes; nothing is answered, nothing throws', async () => {
    const { k, server, send, got } = await world();
    const answers = () => got.filter((m) => m.t === 'esito').length;
    const before = answers();
    for (const tenuti of [['right', 'jump', 'rollback', 'console'], 'right', [{ toString: 'right' }], null, Array.from({ length: 1000 }, () => 'up'), ['__proto__']]) send({ t: 'tasti', tenuti });
    server.tick(1 / 60);
    expect(answers()).toBe(before);
    send({ t: 'tasti', tenuti: ['right', 'jump', 'rollback'] });
    server.tick(1 / 60);
    expect(k.heldBy('bea', 'right')).toBe(true);
    expect(k.heldBy('bea', 'jump')).toBe(false);
    expect(k.heldBy('bea', 'rollback')).toBe(false);
    // One wanderer's keys are never another's.
    expect(k.heldBy('io', 'right')).toBe(false);
  });
});
