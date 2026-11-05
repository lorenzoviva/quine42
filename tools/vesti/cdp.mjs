// A headless Chrome of its own for the skins' tools (T284): never the author's browser or profile, a temporary folder that goes away,
// and the DevTools protocol over a WebSocket of Node. Used by misura.mjs (what the effects cost) and cattura.mjs (screenshots).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KNOWN = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

/** The page must be on this machine: these tools never open anything else. */
export function checkLocal(url) {
  const host = new URL(url).hostname;
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) throw new Error('solo una pagina su questa macchina (127.0.0.1 o localhost)');
}

export function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(String(e.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message}`));
      else resolve(msg.result);
    } else if (msg.method) for (const f of listeners.get(msg.method) ?? []) f(msg.params);
  });
  const open = new Promise((r) => ws.addEventListener('open', r));
  return {
    open,
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        pending.set(++id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      }),
    on: (method, f) => listeners.set(method, [...(listeners.get(method) ?? []), f]),
    off: (method) => listeners.delete(method),
    close: () => ws.close(),
  };
}

/** Starts Chrome and connects to its first page. `flags` are added to the usual ones. */
export async function launch({ chrome = KNOWN.find((p) => fs.existsSync(p)), width = 1920, height = 1080, flags = [] } = {}) {
  if (!chrome) throw new Error('Chrome non trovato: --chrome <percorso>');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quine-vesti-'));
  const proc = spawn(
    chrome,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${dir}`,
      `--window-size=${width},${height}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--mute-audio',
      ...flags,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const portFile = path.join(dir, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const page = connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await page.open;
  return {
    page,
    chrome,
    product: version.Browser,
    browserWs: version.webSocketDebuggerUrl,
    async close() {
      page.close();
      proc.kill();
      await sleep(500);
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        /* Chrome may still hold a file for a moment: the temporary folder is the system's */
      }
    },
  };
}

/** Puts on a skin for the site's origin: the browser remembers it, as the picker does. */
export async function wearSkin(page, siteUrl, skin) {
  await page.send('Page.navigate', { url: new URL('/site/notizie.html', siteUrl).href });
  await sleep(1500);
  await page.send('Runtime.evaluate', { expression: `localStorage.setItem('quine:sito:veste', ${JSON.stringify(skin)})` });
}
