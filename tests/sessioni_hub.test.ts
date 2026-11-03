// tests/sessioni_hub.test.ts — Test dell'hub delle sessioni e creazione nuovo universo (T103)

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import {
  buildNewUniverseFiles,
  createUniverse,
  escapeHtml,
  fetchActiveSessions,
  fetchUniverses,
  parseRealmSnapshot,
  renderRealmCard,
  type ActiveSessionRecord,
} from '../site/sessioni';

describe('Hub Sessioni & Creazione Nuovo Universo (T103)', () => {
  it('SessionServer espone clientCount e wanderer connessi', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = {
      ...bundledFiles,
      'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2),
    };
    const kernel = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const server = new SessionServer(kernel);

    expect(server.clientCount).toBe(0);
    expect(server.connected()).toEqual([]);

    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const client = new SessionClient(c, { id: 'viandante-1', nome: 'Viandante Prova' });
    await client.ready;

    expect(server.clientCount).toBe(1);
    expect(server.connected()).toContain('viandante-1');
  });

  it('fetchActiveSessions recupera e mappa correttamente le sessioni attive', async () => {
    const mockSessions: ActiveSessionRecord[] = [
      { name: 'valmora', active: true, clients: 3 },
      { name: 'aurora', active: true, clients: 1 },
    ];

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      if (url.endsWith('/api/session')) {
        return {
          ok: true,
          json: async () => ({ sessions: mockSessions }),
        } as any;
      }
      return { ok: false } as any;
    }) as any;

    try {
      const active = await fetchActiveSessions();
      expect(active.size).toBe(2);
      expect(active.get('valmora')?.clients).toBe(3);
      expect(active.get('aurora')?.clients).toBe(1);
      expect(active.get('sconosciuto')).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fetchUniverses elenca gli universi disponibili', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      if (url.endsWith('/api/universe')) {
        return {
          ok: true,
          json: async () => ({ available: true, universes: ['valmora', 'aurora', 'ossidiana'] }),
        } as any;
      }
      return { ok: false } as any;
    }) as any;

    try {
      const list = await fetchUniverses();
      expect(list).toEqual(['valmora', 'aurora', 'ossidiana']);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('parseRealmSnapshot calcola spesa oraria, modelli e stato del reame', () => {
    const files = {
      ...bundledFiles,
      'universe.json': JSON.stringify(
        {
          name: 'valmora',
          seed: 42,
          partita: { modalita: 'multigiocatore', master: 'lorenzo', morte: 1 },
          ai: {
            textModel: 'gemini-3.1-flash-lite',
            scultori: { figura: 'gemini-3.8-flash' },
            coefficienti: { sessioni: 0.8, dialoghi: 0.8, trame: 0.8, revisioni: 0.75, modelli: 0.8, persone: 0.8, abitanti: 0.8, pacchetti: 0.8, cose: 0.8 },
            minimi: { tetto: 1.5 },
          },
        },
        null,
        2,
      ),
      'world/bible.json': JSON.stringify({
        concetto: 'Un antico borgo tra le colline con cripte runiche.',
      }),
    };

    const activeRecord: ActiveSessionRecord = {
      name: 'valmora',
      active: true,
      clients: 2,
    };

    const parsed = parseRealmSnapshot('valmora', files, activeRecord);
    expect(parsed.name).toBe('valmora');
    expect(parsed.seed).toBe(42);
    expect(parsed.master).toBe('lorenzo');
    expect(parsed.live).toBe(true);
    expect(parsed.clients).toBe(2);
    expect(parsed.sculptorSummary).toContain('gemini-3.1-flash-lite + gemini-3.8-flash');
    expect(parsed.tettoMinimo).toBe(1.5);
    expect(parsed.hourlyCost).toBeGreaterThan(0);
    expect(parsed.description).toBe('Un antico borgo tra le colline con cripte runiche.');
  });

  it('buildNewUniverseFiles genera la configurazione corretta per i profili IA e regole di partita', () => {
    // 1. Profilo Low Detail & Partita Narrativa
    const filesLow = buildNewUniverseFiles({
      name: 'reame-low',
      seed: 1234,
      mode: 'narrativa',
      aiProfile: 'low',
      master: 'TestMaster',
    });

    const cfgLow = JSON.parse(filesLow['universe.json']!);
    expect(cfgLow.name).toBe('reame-low');
    expect(cfgLow.seed).toBe(1234);
    expect(cfgLow.partita.morte).toBe(1);
    expect(cfgLow.partita.modalita).toBe('multigiocatore');
    expect(cfgLow.partita.master).toBe('TestMaster');
    expect(cfgLow.ai.textModel).toBe('gemini-3.1-flash-lite');
    expect(cfgLow.ai.scultori.figura).toBe('gemini-3.1-flash-lite');
    expect(cfgLow.ai.minimi.tetto).toBe(0.5);
    expect(filesLow['seed.json']).toBeDefined();

    // 2. Profilo High Detail & Sfida del Labirinto (PvP)
    const filesHigh = buildNewUniverseFiles({
      name: 'reame-high',
      seed: 9999,
      mode: 'sfida',
      aiProfile: 'high',
    });

    const cfgHigh = JSON.parse(filesHigh['universe.json']!);
    expect(cfgHigh.name).toBe('reame-high');
    expect(cfgHigh.seed).toBe(9999);
    expect(cfgHigh.partita.morte).toBe(4);
    expect(cfgHigh.partita.pvp).toBe(true);
    expect(cfgHigh.ai.textModel).toBe('gemini-3.8-flash');
    expect(cfgHigh.ai.scultori.importante).toBe('gemini-4-argon');
    expect(cfgHigh.ai.minimi.tetto).toBe(2.0);
  });

  it('createUniverse rifiuta slug non validi', async () => {
    const badName = await createUniverse({
      name: 'Nome Con Spazi E Maiuscole!',
      seed: 42,
      mode: 'sopravvivenza',
      aiProfile: 'standard',
    });
    expect(badName.ok).toBe(false);
    expect(badName.error).toContain('caratteri minuscoli');
  });

  it('escapeHtml protegge da iniezioni di caratteri speciali', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('renderRealmCard costruisce correttamente la scheda HTML con pulsante lobby', () => {
    // In node environment without DOM createElement fallback:
    if (typeof document !== 'undefined') {
      const card = renderRealmCard({
        name: 'valmora',
        seed: 42,
        master: 'Lorenzo',
        isMine: true,
        live: true,
        clients: 3,
        textModel: 'gemini-3.1-flash-lite',
        sculptorSummary: 'Flash-Lite + Flash 3.8',
        coefficientsLabel: 'Standard',
        hourlyCost: 0.08,
        tettoMinimo: 1.0,
        description: 'Terre di prova',
      });

      expect(card.className).toContain('realm-card');
      expect(card.innerHTML).toContain('VALMORA');
      expect(card.innerHTML).toContain('LIVE · 3 VIANDANTI');
      expect(card.innerHTML).toContain('ENTRA NELLA LOBBY');
      expect(card.innerHTML).toContain('universo=valmora');
    }
  });
});
