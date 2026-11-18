// A fake CLI of Claude for the offline proof of the bench (T391): it says the `init` of a run with nothing to act with (ADR-0106),
// reads the prompt from stdin (plain, or one user message of events with `--input-format stream-json`, images included), answers with
// the program in <file.xml> and a `result` with the usage per model the real one gives. The system prompt it reads from the file of
// `--system-prompt-file` (T427), as the real one; an argument `--system-prompt` is refused. What it received goes to <log.jsonl>.
//
//   --cli-cmd "node <abs>/lab/scripts/claude-finta.mjs <abs>/program.xml <abs>/log.jsonl [--irraggiungibile <modello>]"
// With --irraggiungibile the model named answers as one the subscription does not reach: an error, no token.
// No model is called.

import fs from 'node:fs';

const [file, log, ...rest] = process.argv.slice(2);
const arg = (k) => (rest.includes(k) ? rest[rest.indexOf(k) + 1] : undefined);
const model = arg('--model') ?? 'claude-sonnet-5-5';

let stdin = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (stdin += d));
process.stdin.on('end', () => {
  let prompt = stdin;
  let images = 0;
  if (arg('--input-format') === 'stream-json') {
    const msg = JSON.parse(stdin.trim().split('\n')[0]);
    const content = msg.message.content;
    images = content.filter((c) => c.type === 'image').length;
    prompt = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  }
  if (rest.includes('--system-prompt')) {
    console.error('claude-finta: the system prompt goes from a file (--system-prompt-file), never as an argument');
    process.exit(2);
  }
  const systemFile = arg('--system-prompt-file');
  const system = systemFile ? fs.readFileSync(systemFile, 'utf8') : '';
  const argChars = process.argv.slice(2).reduce((n, a) => n + a.length + 1, 0);
  fs.appendFileSync(log, `${JSON.stringify({ model, effort: arg('--effort'), tools: arg('--tools'), images, prompt: prompt.length, system: system.length, systemFile, systemHead: system.slice(0, 40), cwd: process.cwd(), inCwd: fs.readdirSync(process.cwd()), argChars, isolation: ['--strict-mcp-config', '--safe-mode', '--restricted', '--no-session-persistence'].every((k) => rest.includes(k)) })}\n`);
  console.log(JSON.stringify({ type: 'system', subtype: 'init', tools: [], mcp_servers: [], skills: [], slash_commands: [], plugins: [{ path: 'builtin' }], model }));
  if (arg('--irraggiungibile') === model) {
    console.log(JSON.stringify({ type: 'result', subtype: 'error', is_error: true, result: `There's an issue with the selected model (${model}). It may not exist or you may not have access to it.`, total_cost_usd: 0, usage: { input_tokens: 0, output_tokens: 0 } }));
    process.exit(1);
  }
  const xml = fs.readFileSync(file, 'utf8');
  console.log(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: xml }] } }));
  const input = Math.round((prompt.length + system.length) / 4);
  const usage = { input_tokens: 12, cache_creation_input_tokens: input, cache_read_input_tokens: 0, output_tokens: Math.round(xml.length / 4), cache_creation: { ephemeral_5m_input_tokens: input, ephemeral_1h_input_tokens: 0 } };
  console.log(JSON.stringify({
    type: 'result',
    subtype: 'success',
    is_error: false,
    result: `\`\`\`xml\n${xml}\n\`\`\``,
    total_cost_usd: 0.01,
    usage,
    modelUsage: { [model]: { inputTokens: 12, outputTokens: usage.output_tokens, cacheReadInputTokens: 0, cacheCreationInputTokens: input, costUSD: 0.01 } },
  }));
});
