import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../../src/kernel/ai/mock';
import type { DecisionCall, DecisionModels } from '../../src/kernel/ai/decisions';
import { bundledFiles } from '../../src/kernel/bundle';
import { CAMPAIGN_FILE } from '../../src/kernel/campaign';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { fakeLink } from '../../src/session/protocol';
import { playerChanges, playerFiles, publicFiles } from '../../src/session/files';
import { SessionServer } from '../../src/session/server';
import { SessionClient } from '../../src/session/client';

// The master's directives in the Council's prompts (T374, ADR-0191): V-036. Fake values only.

const SECRET = 'DIRETTIVA-CHE-NON-ESCE';
const CAMPAIGN = `# Campagna\n\n## Per tutti\n- niente draghi (${SECRET})\n\n## Narratore\n- parlata arcaica (${SECRET})\n`;

async function boot(game: Record<string, unknown> = {}): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, [CAMPAIGN_FILE]: CAMPAIGN, 'universe.json': JSON.stringify({ ...cfg, game: { ...cfg.game, ...game } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

describe('le direttive del master', () => {
  it('V-036 il file delle direttive non esce a un client che non è il master, né per HTTP né sul filo', async () => {
    const k = await boot({ mode: 'multiplayer', death: 3 });
    for (const shown of [playerFiles(k.files), publicFiles(k.files), playerChanges(k.files, [CAMPAIGN_FILE])]) {
      expect(Object.keys(shown)).not.toContain(CAMPAIGN_FILE);
      expect(JSON.stringify(shown)).not.toContain(SECRET);
    }
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const anna = new SessionClient(c, { id: 'anna' });
    await anna.ready;
    expect(anna.files[CAMPAIGN_FILE]).toBeUndefined();
    expect(JSON.stringify(anna.files)).not.toContain(SECRET);
  });

  it('V-036 la scrive solo il master: un giocatore non la chiede al Referente, non la porta col ramo, non la scrive dal kernel', async () => {
    const k = await boot({ mode: 'multiplayer', death: 3 });
    const server = new SessionServer(k);
    const join = async (id: string) => {
      const { server: s, client: c } = fakeLink();
      server.connect(s);
      const session = new SessionClient(c, { id });
      await session.ready;
      return session;
    };
    await join('me');
    const anna = await join('anna');
    // The server reads its messages at its beat.
    const answered = async <T>(p: Promise<T>): Promise<T> => {
      let out: T | undefined;
      void p.then((v) => (out = v));
      for (let i = 0; i < 200 && out === undefined; i++) {
        server.tick(1 / 60);
        await new Promise((r) => setTimeout(r, 0));
      }
      expect(out).toBeDefined();
      return out!;
    };
    const ask = await answered(anna.act({ t: 'agent', agent: 'liaison', text: "d'ora in poi niente lupi" }));
    expect(ask).toMatchObject({ ok: false, reason: expect.stringMatching(/solo il master/) });
    const branch = await answered(anna.act({ t: 'branch', files: { [CAMPAIGN_FILE]: '## Per tutti\n- niente lupi\n' }, base: {} }));
    expect(branch).toMatchObject({ ok: false });
    expect(k.as('anna', () => k.addDirective('all', 'niente lupi'))).toMatchObject({ ok: false, reason: expect.stringMatching(/solo il master/) });
    expect(k.files[CAMPAIGN_FILE]).toBe(CAMPAIGN);
    expect(server.branchFiles()[CAMPAIGN_FILE]).toBeUndefined();
  });

  it('V-036 il testo del master non arriva a Jev: né le direttive scritte, né quella chiesta al Referente', async () => {
    const k = await boot();
    const asked: DecisionCall[] = [];
    const jev: DecisionModels = { name: 'jev-finto', decide: async (call) => (asked.push(call), call.rule) };
    k.council.decisions = jev;
    // A Council text that goes to the fourth wall of Jev, with the directives in the requests around it.
    await k.council.fourthWall('Il fornaio impasta prima dell’alba.');
    await k.talkToAgent('liaison', `d'ora in poi la gente parla piano (${SECRET}-referente)`);
    expect(k.files[CAMPAIGN_FILE]).toContain(`${SECRET}-referente`);
    expect(asked.length).toBeGreaterThan(0);
    for (const call of asked) expect(JSON.stringify(call)).not.toContain(SECRET);
  });

  it('V-036 una direttiva è una riga senza markup né caratteri invisibili, entro i tetti', async () => {
    const k = await boot();
    for (const bad of ['<script>x</script>', 'a‮b', 'x'.repeat(301), '   ']) expect(k.addDirective('all', bad), JSON.stringify(bad)).toMatchObject({ ok: false });
    const ok = k.addDirective('narrator', 'riga\ncon\n## Per tutti\n- un a capo');
    expect(ok).toMatchObject({ ok: true });
    // Folded into one line: no new section, no new line of the file.
    expect(k.files[CAMPAIGN_FILE].split('\n').filter((l) => l.startsWith('## Per tutti'))).toHaveLength(1);
  });
});
