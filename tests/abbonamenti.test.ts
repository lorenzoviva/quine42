import { describe, expect, it } from 'vitest';
import { mkdtempSync, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { enqueue, look, served } from '../server/subscriptionQueue';
import { QueueModels } from '../src/kernel/ai/subscription';
import {
  buildCliCommand,
  extractUsage,
  parseArgs,
  promptWithSchema,
  readCliOutput,
  serveOne,
} from '../tools/abbonamenti/servi';

/** What the real CLI says first when it has nothing to act with (ADR-0106): a fake one has to say it too. */
const INIT = "console.log(JSON.stringify({ type: 'system', subtype: 'init', tools: [], mcp_servers: [], skills: [], slash_commands: [], plugins: [{ path: 'builtin' }] }));";

const dir = () => mkdtempSync(path.join(tmpdir(), 'coda-test-'));

/** A disk-backed fetch implementation matching the Vite /api/coda middleware. */
function diskFetch(d: string): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body }) as Response;
    const route = String(url).slice('/api/coda'.length).replace(/^\//, '');
    if (!route && init?.method === 'POST') {
      const raw = JSON.parse(String(init.body));
      return json(200, { id: await enqueue(d, raw) });
    }
    if (route === 'stato') return json(200, { serviti: await served(d) });
    return json(200, await look(d, route));
  }) as typeof fetch;
}

describe('servi (T68b) — comando e argomenti delle CLI', () => {
  it('Claude: -p, gli eventi, --tools "", --system-prompt se presente, il testo su stdin', () => {
    const cmd = buildCliCommand('claude', {
      id: '1',
      provider: 'claude',
      agent: 'scultore',
      task: 'model.sculpt',
      system: 'Sei lo Scultore',
      prompt: 'Scolpisci una roccia',
      creata: new Date().toISOString(),
    });
    expect(cmd.cmd).toBe('claude');
    expect(cmd.args).toContain('-p');
    expect(cmd.args).toContain('--output-format');
    expect(cmd.args).toContain('stream-json');
    expect(cmd.args).toContain('--tools');
    expect(cmd.args).toContain('');
    expect(cmd.args).toContain('--system-prompt');
    expect(cmd.args).toContain('Sei lo Scultore');
    expect(cmd.stdin).toBe('Scolpisci una roccia');
    expect(cmd.args).not.toContain('Scolpisci una roccia');
  });

  it('Antigravity non serve la coda: non può escludere gli strumenti (ADR-0106)', () => {
    expect(() => parseArgs(['--provider', 'antigravity'])).toThrow(/Antigravity non serve la coda/);
    expect(() => parseArgs(['--provider=antigravity'])).toThrow(/Antigravity non serve la coda/);
    expect(parseArgs(['--provider', 'claude']).provider).toBe('claude');
  });

  it('aggiunge lo schema JSON al prompt se specificato', () => {
    const schema = { type: 'OBJECT', properties: { nome: { type: 'STRING' } } };
    const p = promptWithSchema('Genera dati', schema);
    expect(p).toContain('Genera dati');
    expect(p).toContain('Rispondi esclusivamente con un oggetto JSON valido');
    expect(p).toContain('"type": "OBJECT"');
  });
});

describe('servi (T68b) — parsing output e token usage', () => {
  it('estrae i token da usage della CLI', () => {
    const usage = extractUsage({
      usage: {
        input_tokens: 120,
        output_tokens: 45,
        cache_read_tokens: 300,
        thinking_tokens: 10,
      },
    });
    expect(usage).toEqual({ prompt: 120, output: 45, cached: 300, thoughts: 10 });
  });

  it('legge JSON su riga singola o multilinea con log su altre righe', () => {
    const out = readCliOutput(`avvisi di debug\n${JSON.stringify({ result: 'OK', usage: { prompt_tokens: 20, output_tokens: 5 } })}\n`);
    expect(out.result).toBe('OK');
    expect(out.usage).toEqual({ prompt: 20, output: 5 });
    expect(out.error).toBeUndefined();
  });

  it('riconosce output di errore', () => {
    const out = readCliOutput(JSON.stringify({ status: 'ERROR', error: 'Quota exceeded' }));
    expect(out.error).toBe('Quota exceeded');
  });
});

describe('servi (T68b) — esecuzione con una CLI finta', () => {
  it('serve una richiesta con schema e ripara JSON sporcato da markdown/prosa', async () => {
    const d = dir();
    // A fake CLI script that prints markdown code fences around JSON
    const scriptPath = path.join(d, 'mock-cli.mjs');
    await fs.writeFile(
      scriptPath,
      `
      ${INIT}
      const out = {
        result: "Ecco il JSON richiesto:\\n\`\`\`json\\n{\\"titolo\\":\\"Torre\\",\\"piani\\":3}\\n\`\`\`",
        usage: { input_tokens: 50, output_tokens: 25 }
      };
      console.log(JSON.stringify(out));
      `,
      'utf8',
    );

    const id = await enqueue(d, {
      provider: 'claude',
      agent: 'scultore',
      task: 'model.sculpt',
      system: 'sys',
      prompt: 'Fai una torre',
      schema: { type: 'OBJECT' },
    });

    const res = await serveOne(d, 'claude', { cmd: `node ${scriptPath}` });
    expect(res.served).toBe(true);
    expect(res.status).toBe('ok');
    expect(res.text).toBe('{"titolo":"Torre","piani":3}');
    expect(res.usage).toEqual({ prompt: 50, output: 25 });

    const looked = await look(d, id);
    expect(looked.stato).toBe('fatta');
    expect(looked.text).toBe('{"titolo":"Torre","piani":3}');
    expect(looked.usage).toEqual({ prompt: 50, output: 25 });
  });

  it('serve una richiesta di testo grezzo (XML MarkovJunior) senza schema', async () => {
    const d = dir();
    const scriptPath = path.join(d, 'mock-sculpt.mjs');
    const xml = '<model size="5 5 5"><rules><rule/></rules></model>';
    await fs.writeFile(
      scriptPath,
      `
      ${INIT}
      console.log(JSON.stringify({
        result: ${JSON.stringify(xml)},
        usage: { input_tokens: 150, output_tokens: 200 }
      }));
      `,
      'utf8',
    );

    await enqueue(d, {
      provider: 'claude',
      agent: 'scultore',
      task: 'model.sculpt',
      system: 'sys',
      prompt: 'Scolpisci una sedia',
    });

    const res = await serveOne(d, 'claude', { cmd: `node ${scriptPath}` });
    expect(res.served).toBe(true);
    expect(res.status).toBe('ok');
    expect(res.text).toBe(xml);
    expect(res.usage).toEqual({ prompt: 150, output: 200 });
  });

  it('rifiuta le richieste con immagini perché non supportate da CLI da riga di comando', async () => {
    const d = dir();
    const id = await enqueue(d, {
      provider: 'claude',
      agent: 'artista',
      task: 'model.judge',
      system: '',
      prompt: 'Giudica',
      images: ['data:image/png;base64,abc'],
    });

    const res = await serveOne(d, 'claude');
    expect(res.served).toBe(true);
    expect(res.status).toBe('error');
    expect(res.errore).toMatch(/non supporta immagini/);

    const looked = await look(d, id);
    expect(looked.stato).toBe('fallita');
    expect(looked.errore).toMatch(/non supporta immagini/);
  });

  it('rileva un limite di abbonamento, genera errore chiaro e data di reset', async () => {
    const d = dir();
    const scriptPath = path.join(d, 'mock-limit.mjs');
    await fs.writeFile(
      scriptPath,
      `
      console.error("You've hit your 5-hour limit · resets 8am (Europe/Rome)");
      process.exit(1);
      `,
      'utf8',
    );

    const id = await enqueue(d, {
      provider: 'claude',
      agent: 'scultore',
      task: 'model.sculpt',
      system: '',
      prompt: 'Pietra',
    });

    const res = await serveOne(d, 'claude', { cmd: `node ${scriptPath}` });
    expect(res.served).toBe(true);
    expect(res.status).toBe('limit');
    expect(res.reset).toBeInstanceOf(Date);
    expect(res.errore).toMatch(/limite abbonamento claude raggiunto/);

    const looked = await look(d, id);
    expect(looked.stato).toBe('fallita');
    expect(looked.errore).toMatch(/limite abbonamento claude raggiunto/);
  });

  it('funziona end-to-end con QueueModels', async () => {
    const d = dir();
    const scriptPath = path.join(d, 'mock-server.mjs');
    await fs.writeFile(
      scriptPath,
      `
      ${INIT}
      console.log(JSON.stringify({
        result: "{\\"creato\\":true}",
        usage: { input_tokens: 10, output_tokens: 5 }
      }));
      `,
      'utf8',
    );

    const q = new QueueModels({ provider: 'claude', fetchImpl: diskFetch(d), poll: 5 });
    const callPromise = q.text({
      agent: 'scultore',
      task: 'model.sculpt',
      system: 'sys',
      prompt: 'prompt',
      schema: { type: 'OBJECT' },
    });

    let step;
    for (let i = 0; i < 50; i++) {
      step = await serveOne(d, 'claude', { cmd: `node ${scriptPath}` });
      if (step.served) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(step?.status).toBe('ok');

    const result = await callPromise;
    expect(result).toBe('{"creato":true}');
    expect(q.usage.text).toBe(1);
    expect(q.usage.inputTokens).toBe(10);
    expect(q.usage.outputTokens).toBe(5);
  });
});

describe('servi (T68b) — prova con la CLI reale di Claude Code su model.sculpt', () => {
  it('interroga Claude Code con model.sculpt (successo o limite riconosciuto con reset)', async () => {
    const d = dir();
    const id = await enqueue(d, {
      provider: 'claude',
      agent: 'scultore',
      task: 'model.sculpt',
      system: 'Sei lo Scultore di QUINE42.',
      prompt: 'Scolpisci una pietra semplice in formato XML MarkovJunior.',
    });

    // Run against real Claude CLI installed on this machine
    const res = await serveOne(d, 'claude');
    expect(res.served).toBe(true);
    expect(res.id).toBe(id);

    // Depending on whether subscription quota is available right now:
    // If quota is active: status is 'ok' with XML text and usage.
    // If 5-hour limit was reached: status is 'limit' with clear reset timestamp.
    if (res.status === 'ok') {
      expect(typeof res.text).toBe('string');
      expect(res.text!.length).toBeGreaterThan(0);
      const looked = await look(d, id);
      expect(looked.stato).toBe('fatta');
    } else {
      expect(res.status).toBe('limit');
      expect(res.reset).toBeInstanceOf(Date);
      expect(res.errore).toMatch(/limite abbonamento claude raggiunto/);
      const looked = await look(d, id);
      expect(looked.stato).toBe('fallita');
    }
  });
});
