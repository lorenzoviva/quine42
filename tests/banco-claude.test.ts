// The Sculptor on Claude's subscription for the bench (T391): the isolated CLI with the model, the effort and the images the bench
// chooses (`runIsolated`, `buildCliCommand`), the queue of the game unchanged, the dollars at Anthropic's API list from the CLI's usage.
// Offline: a fake CLI, no model is called.

import { describe, expect, it } from 'vitest';
import { mkdtempSync, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildCliCommand, imageBlock, runIsolated } from '../tools/abbonamenti/servi';
import { ANTHROPIC_PRICES, anthropicCost, priceOf, PRICES } from '../src/kernel/ai/prices';
import { claudeCliModels, priceRun, routed } from '../lab/scripts/claude-cli';
import { MockAiModels } from '../src/kernel/ai/mock';

const INIT = "console.log(JSON.stringify({ type: 'system', subtype: 'init', tools: [], mcp_servers: [], skills: [], slash_commands: [], plugins: [{ path: 'builtin' }] }));";
const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('T391 — la CLI isolata con la scelta del banco', () => {
  it('modello e sforzo come opzioni, le immagini come un messaggio di eventi; la coda senza scelta resta com’era', () => {
    const req = { system: 'Sei lo Scultore', prompt: 'Scolpisci un forte', images: [PNG] };
    const plain = buildCliCommand('claude', req);
    expect(plain.args).not.toContain('--model');
    expect(plain.args).not.toContain('--input-format');
    expect(plain.stdin).toBe('Scolpisci un forte');

    const cmd = buildCliCommand('claude', req, undefined, { model: 'claude-opus-5-5', effort: 'low', images: true });
    expect(cmd.args).toEqual(expect.arrayContaining(['--model', 'claude-opus-5-5', '--effort', 'low', '--input-format', 'stream-json', '--tools', '', '--strict-mcp-config']));
    // The system prompt still last, in place of the CLI's.
    expect(cmd.args.slice(-2)).toEqual(['--system-prompt', 'Sei lo Scultore']);
    const msg = JSON.parse(cmd.stdin.trim());
    expect(msg.type).toBe('user');
    expect(msg.message.content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0KGgo=' } });
    expect(msg.message.content[1]).toEqual({ type: 'text', text: 'Scolpisci un forte' });
  });

  it('una scelta che sembra un’opzione o un’immagine che non è un data URL si rifiutano', () => {
    expect(() => buildCliCommand('claude', { system: '', prompt: 'x' }, undefined, { model: '--dangerously-skip-permissions' })).toThrow(/non valida/);
    expect(() => buildCliCommand('claude', { system: '', prompt: 'x' }, undefined, { effort: 'low --tools Bash' })).toThrow(/non valida/);
    expect(() => imageBlock('https://example.com/a.png')).toThrow(/immagine non valida/);
    expect(() => imageBlock('data:image/svg+xml;base64,PHN2Zz4=')).toThrow(/immagine non valida/);
  });

  it('runIsolated con una CLI finta: le immagini arrivano, il risultato e l’uso per modello tornano', async () => {
    const d = mkdtempSync(path.join(tmpdir(), 'banco-claude-'));
    const script = path.join(d, 'cli.mjs');
    await fs.writeFile(script, `
      ${INIT}
      let s = ''; process.stdin.on('data', (x) => (s += x)); process.stdin.on('end', () => {
        const m = JSON.parse(s.trim()).message.content;
        const model = process.argv[process.argv.indexOf('--model') + 1];
        console.log(JSON.stringify({ type: 'result', result: 'immagini ' + m.filter((c) => c.type === 'image').length + ' ' + model,
          total_cost_usd: 0.5, usage: { input_tokens: 10, output_tokens: 1000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
          modelUsage: { [model]: { inputTokens: 10, outputTokens: 1000, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, costUSD: 0.5 } } }));
      });`, 'utf8');
    const r = await runIsolated('claude', { system: 's', prompt: 'p', images: [PNG, PNG] }, { cmd: `node ${script}`, choice: { model: 'claude-sonnet-5-5', images: true } });
    expect(r.status).toBe('ok');
    expect(r.text).toBe('immagini 2 claude-sonnet-5-5');
    const priced = priceRun(r.raw, 'claude-sonnet-5-5');
    expect(priced.usd).toBeCloseTo((10 * 2 + 1000 * 10) / 1e6, 9);
    expect(priced.usdCli).toBe(0.5);
  });

  it('le chiamate dello Scultore su un modello di Claude vanno alla CLI, il resto (l’Artista) agli altri modelli; la finestra ferma il giro', async () => {
    const seen: string[] = [];
    let stop: string | undefined;
    const cli = claudeCliModels({ cmd: 'node -e 0', gate: () => stop });
    const ai = routed(new MockAiModels(), async (call) => {
      seen.push(`${call.agent}:${call.model}`);
      return cli(call);
    });
    stop = 'finestra delle 5 ore di Claude al 85 %';
    await expect(ai.text({ agent: 'sculptor', task: 'model.sculpt', system: '', prompt: 'x', model: 'claude-opus-5-5' })).rejects.toThrow(/finestra delle 5 ore/);
    await ai.text({ agent: 'artist', task: 'model.judge', system: '', prompt: 'x', model: 'gemini-3.5-flash', schema: { type: 'OBJECT' } }).catch(() => undefined);
    expect(seen).toEqual(['sculptor:claude-opus-5-5']);
  });
});

describe('T391 — i prezzi', () => {
  it('Carbon al prezzo di Argon (anche dopo l’1/12), Hydrogen un quarto meno', () => {
    expect(priceOf('gemini-4-carbon', '2026-11-14')).toEqual(priceOf('gemini-4-argon', '2026-11-14'));
    expect(priceOf('gemini-4-carbon', '2026-12-02')).toEqual(priceOf('gemini-4-argon', '2026-12-02'));
    expect(PRICES['gemini-4-hydrogen'].input / PRICES['gemini-4-argon'].input).toBe(0.75);
    expect(PRICES['gemini-4-hydrogen'].output / PRICES['gemini-4-argon'].output).toBe(0.75);
  });

  it('il listino di Anthropic: scritture in cache a 1,25 (5 minuti) e 2 volte (un’ora) l’ingresso, letture al prezzo della cache; in priceOf solo Opus 5.5 e Fable 5.1, che il gioco chiama via OpenRouter (T397, T398)', () => {
    expect(anthropicCost('claude-opus-5-5', { input: 1e6, output: 0 })).toBe(4);
    expect(anthropicCost('claude-opus-5-5', { input: 0, written5m: 1e6, written1h: 1e6, read: 1e6, output: 1e6 })).toBeCloseTo(5 + 8 + 0.2 + 20, 9);
    expect(anthropicCost('claude-haiku-5-5', { input: 1, output: 1 })).toBeUndefined();
    for (const id of Object.keys(ANTHROPIC_PRICES)) {
      const { write: _, ...list } = ANTHROPIC_PRICES[id];
      if (id === 'claude-opus-5-5' || id === 'claude-fable-5-1') expect(priceOf(id)).toMatchObject(list);
      else expect(priceOf(id)).toBeUndefined();
    }
  });

  it('priceRun divide le scritture fra 5 minuti e un’ora e prende il costo detto per un modello fuori listino', () => {
    const raw = {
      total_cost_usd: 1,
      usage: { cache_creation: { ephemeral_5m_input_tokens: 300, ephemeral_1h_input_tokens: 100 } },
      modelUsage: {
        'claude-sonnet-5-5': { inputTokens: 1000, outputTokens: 2000, cacheReadInputTokens: 500, cacheCreationInputTokens: 400 },
        'claude-haiku-5-5': { inputTokens: 10, outputTokens: 10, costUSD: 0.001 },
      },
    };
    const p = priceRun(raw, 'claude-sonnet-5-5');
    expect(p.written1h).toBe(100);
    expect(p.written5m).toBe(300);
    expect(p.usd).toBeCloseTo((1000 * 2 + 300 * 2.5 + 100 * 4 + 500 * 0.2 + 2000 * 10) / 1e6 + 0.001, 9);
  });
});
