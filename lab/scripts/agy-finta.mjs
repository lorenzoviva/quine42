#!/usr/bin/env node
// A fake agy for the offline proof of the Sculptor on Antigravity (T516, `lab/scripts/agy-cli.ts`): it reads the one message of
// `--input-format stream-json`, answers in agy's stream (`init`, the steps, the `result` with its usage) with the program of a file,
// and writes down what it was asked (arguments, folder, photos, the length of the message) in a log. No model is called.
//
//   node lab/scripts/agy-finta.mjs <programma.xml> <log.jsonl> [--nel-file] [--irraggiungibile <modello>]

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const [xmlFile, logFile] = argv;
const flag = (k) => argv.includes(k);
const model = argv[argv.indexOf('--model') + 1];
const gone = flag('--irraggiungibile') ? argv[argv.indexOf('--irraggiungibile') + 1] : undefined;
const id = `finta-${process.pid}`;
const say = (v) => process.stdout.write(`${JSON.stringify(v)}\n`);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  const msg = JSON.parse(input.trim().split('\n')[0]);
  const text = String(msg.message?.content ?? '');
  const photos = fs.readdirSync(process.cwd()).filter((f) => /^foto-\d+\./.test(f));
  fs.appendFileSync(logFile, `${JSON.stringify({ args: argv.slice(2), cwd: process.cwd(), photos, chars: text.length, sistema: text.includes('<system_instructions>'), event: msg.event })}\n`);
  say({ event: 'init', conversation_id: id, init: { model, cwd: process.cwd(), tools: ['view_file'], permission_mode: 'request-review' } });
  if (gone && model.startsWith(gone)) {
    say({ event: 'result', result: { conversation_id: id, status: 'ERROR', response: '', error: `model ${model} not available`, num_turns: 0, usage: { input_tokens: 0, output_tokens: 0, thinking_tokens: 0, cache_read_tokens: 0 } } });
    process.exit(1);
  }
  const xml = fs.readFileSync(xmlFile, 'utf8');
  for (const p of photos) say({ event: 'step_update', step_update: { conversation_id: id, step_index: 1, state: 'DONE', step_type: 'view_file', path: p } });
  let response = `\`\`\`xml\n${xml}\n\`\`\``;
  if (flag('--nel-file')) {
    fs.writeFileSync(path.join(process.cwd(), 'programma.xml'), xml);
    response = 'I wrote the program to programma.xml.';
  }
  const usage = { input_tokens: Math.round(text.length / 4) + 15_000, output_tokens: Math.round(xml.length / 3), thinking_tokens: 500, cache_read_tokens: 13_000 };
  say({ event: 'step_update', step_update: { conversation_id: id, step_index: 2, state: 'DONE', step_type: 'agent_response', text_delta: response, usage } });
  say({ event: 'result', result: { conversation_id: id, status: 'SUCCESS', response, num_turns: 1, usage } });
});
