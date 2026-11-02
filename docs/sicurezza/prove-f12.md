# Le prove da fare con F12

Ciò che si vede solo da un browser vero: le regole dell'origine, il DOM, ciò che la pagina tiene. Ogni blocco dice dove aprirlo e stampa come `npm run sicurezza:prove`: `V-NNN.x`, `ok` o `FALLA`, la proprietà. Sono i blocchi di
questo file che il registro nomina nella tabella «Le prove dell'autore».

**Prima**: `npm run sicurezza:prove -- --resta 4871`. Parte il server di prova su `http://localhost:4871`, con universi temporanei e segreti finti, e stampa il valore finto da cercare: non si tocca nulla di tuo. Si ferma con Ctrl+C, che cancella tutto.
**Usa solo questo server**, non il tuo `npm run dev`. Se il server del blocco non risponde, il blocco stampa `ERRORE`: non vale né `ok` né `FALLA`.

Riporta le righe stampate all'orchestratore, oppure incollale in `docs/sicurezza/esiti/<data>-f12.md`.

## Blocco 1 · Nella pagina non c'è la chiave

Apri `http://localhost:4871/?skip&offline`, aspetta il gioco, incolla il blocco e **sostituisci `FINTO`** con il valore stampato dal kit.

```js
await (async () => {
  const FINTO = 'FINTO';
  const say = (id, ok, p, d) => console.log(`${id} ${ok ? 'ok' : 'FALLA'} ${p} (${d})`);
  if (FINTO === 'FINTO') return console.log('V-016.d ERRORE manca il valore finto da cercare');
  const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.startsWith(location.origin) && !u.includes('/api/')))];
  let hits = 0;
  for (const u of [location.href, ...urls]) {
    const t = await fetch(u).then((r) => r.text()).catch(() => '');
    if (t.includes(FINTO)) hits++;
  }
  say('V-016.d', !hits, 'la chiave non arriva al browser, in nessun file che la pagina carica', `${urls.length + 1} file, ${hits} con il valore`);
  const stored = [localStorage, sessionStorage].some((s) => Object.keys(s).some((k) => String(s.getItem(k)).includes(FINTO)));
  say('V-016.e', !stored, 'la chiave non sta in localStorage né in sessionStorage', stored ? 'trovata' : 'assente');
})();
```

## Blocco 2 · Un seme che non è un numero non diventa HTML

Il kit crea l'universo `sonda-seme`, il cui `seed` è un pezzo di HTML innocuo. Apri `http://localhost:4871/site/sessioni.html` e aspetta che compaiano i reami.

```js
await (async () => {
  const say = (id, ok, p, d) => console.log(`${id} ${ok ? 'ok' : 'FALLA'} ${p} (${d})`);
  for (let i = 0; i < 40 && !document.body.textContent.toUpperCase().includes('SONDA-SEME'); i++) await new Promise((r) => setTimeout(r, 250));
  if (!document.body.textContent.toUpperCase().includes('SONDA-SEME')) return console.log('V-015.c ERRORE il reame sonda-seme non si vede nella pagina');
  const el = document.getElementById('sonda-v015');
  say('V-015.c', !el, 'un valore di universe.json non diventa un elemento della pagina', el ? 'elemento creato' : 'nessun elemento');
})();
```

## Blocco 3 · Da un altro sito

Un rifiuto che la pagina può leggere non è una lettura: il CORS di Vite lascia leggere le risposte alle pagine di `localhost` e `127.0.0.1` (T167), quindi conta solo una risposta `ok`. Apri in una scheda `https://example.com` e incolla qui. Le richieste vanno solo al tuo `localhost`: a `example.com` non arriva nulla.

Chrome può chiedere il permesso di accedere alla rete locale, e finché non rispondi la richiesta resta ferma (è ciò che è successo provando il blocco: senza risposta, dopo 40 s, `tempo scaduto`). Falle **due giri**, e riporta entrambi: prima rifiuta il permesso (cosa ottiene un sito qualunque per chi dice no), poi concedilo (cosa ottiene per chi dice sì senza pensarci). Finite le prove, togli il permesso a `example.com` dalle impostazioni del sito.

```js
await (async () => {
  const BASE = 'http://localhost:4871';
  const say = (id, ok, p, d) => console.log(`${id} ${ok ? 'ok' : 'FALLA'} ${p} (${d})`);
  const limit = () => AbortSignal.timeout(40000);
  const read = await fetch(`${BASE}/api/universe/sonda-base`, { signal: limit() }).then(async (r) => (r.ok ? r.text() : { blocked: `risposta ${r.status}` })).catch((e) => ({ blocked: e.name === 'TimeoutError' ? 'tempo scaduto: il permesso è ancora in attesa?' : e.message }));
  say('V-001.n', typeof read !== 'string', 'la pagina di un altro sito non legge un universo', typeof read === 'string' ? 'letto' : `non letto: ${read.blocked}`);
  // Sent without reading the answer: whether it arrived is what Blocco 4 looks at.
  const sent = await fetch(`${BASE}/api/universe/sonda-base/commit`, {
    method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, signal: limit(),
    body: JSON.stringify({ changes: { 'world/da-browser.txt': 'sonda\n' }, message: 'sonda', author: 'player' }),
  }).then(() => 'partita', (e) => `non partita: ${e.name === 'TimeoutError' ? 'tempo scaduto' : e.message}`);
  console.log(`V-001.o richiesta ${sent}: il risultato lo dice il blocco 4`);
  const entered = await new Promise((resolve) => {
    const ws = new WebSocket(`${BASE.replace('http', 'ws')}/api/session?universo=sonda-mondo&offline`);
    const done = (v) => { resolve(v); ws.close(); };
    setTimeout(() => done('nessuna risposta in 60 s'), 60000);
    ws.onerror = () => done('rifiutato');
    ws.onopen = () => ws.send(JSON.stringify({ t: 'entra', id: 'sonda-altro-sito', nome: 'Sonda' }));
    ws.onmessage = (m) => { const t = JSON.parse(m.data).t; if (t === 'ingresso') done('entrato'); if (t === 'rifiuto') done('rifiutato'); };
  });
  say('V-006.g', entered !== 'entrato', 'la pagina di un altro sito non entra nel mondo come un viandante', entered);
})();
```

## Blocco 4 · Che cosa è arrivato

Di nuovo in una scheda su `http://localhost:4871/`, dopo il blocco 3.

```js
await (async () => {
  const say = (id, ok, p, d) => console.log(`${id} ${ok ? 'ok' : 'FALLA'} ${p} (${d})`);
  const r = await fetch('/api/universe/sonda-base');
  const files = r.ok ? (await r.json()).files : undefined;
  if (!files) return console.log(`V-001.o ERRORE non so leggere l'universo (risposta ${r.status}): guarda a mano <cartella del kit>/universes/sonda-base/world/`);
  const there = 'world/da-browser.txt' in files;
  say('V-001.o', !there, 'una richiesta senza CORS da un altro sito non scrive', there ? 'il file è stato scritto' : 'nessun file');
})();
```

## Blocco 5 · Un giocatore e ciò che ha in mano

Apri `http://localhost:4871/?universo=sonda-mondo&skip&offline&viandante=sonda-f12` (`skip` salta intro e lobby) e aspetta di essere nel mondo: il primo ingresso avvia il mondo sul server, anche per mezzo minuto.

```js
await (async () => {
  const say = (id, ok, p, d) => console.log(`${id} ${ok ? 'ok' : 'FALLA'} ${p} (${d})`);
  for (let i = 0; i < 120 && !window.quine; i++) await new Promise((r) => setTimeout(r, 500));
  const q = window.quine;
  if (!q) return console.log('V-012.e ERRORE il client non è partito');
  const files = q.k?.files ?? q.session?.files ?? {};
  const paths = Object.keys(files);
  if (!paths.length) return console.log('V-012.e ERRORE non trovo i file del client in window.quine');
  const wrong = paths.filter((p) => /^(prompts\/|world\/(bible|people|plots|rules|giocatori|consumi|pagamenti))/.test(p) || (p.endsWith('.lua') && !/^modules\/core\.(movement|carpet)\//.test(p)));
  say('V-012.e', !wrong.length, 'nella console di un giocatore ci sono solo i file che il client disegna', `${paths.length} file, ${wrong.length} di troppo`);
  const loaded = performance.getEntriesByType('resource').map((e) => e.name);
  const tools = loaded.filter((u) => /\/src\/master\.ts|coronaview/.test(u));
  say('V-012.f', !tools.length, 'gli strumenti del master non si caricano per un giocatore', `${tools.length} moduli`);
})();
```
