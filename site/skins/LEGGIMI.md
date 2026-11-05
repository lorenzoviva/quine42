# Le vesti del sito

Una veste è una cartella qui dentro (ADR-0145). Il nome della cartella è il suo id: minuscole, cifre e trattini.

- `skin.json`: `nome` (nel selettore), `descrizione`, `icona` (la favicon, un file della cartella).
- `skin.css`: ogni token `--skin-*` che la base legge, sotto `:root[data-skin='<id>']`. Le altre regole sotto `[data-skin='<id>'] …`. È un file servito così com'è: gli `url()` sono relativi alla cartella, i `@font-face` si dichiarano qui.
- Font, sfondi, loghi: file della cartella (`.css .svg .png .jpg .webp .ico .woff2 .woff`).
- `effects.ts`, facoltativo: `export function start() { …; return () => { /* ferma tutto */ }; }`. Si carica solo per la veste in uso; si ferma a scheda nascosta e rispetta `prefers-reduced-motion` per conto suo. Meglio a tick che a ogni fotogramma: la futuristica aspetta il tick con un timer e dipinge un fotogramma solo, e muove solo ciò che si vede (ADR-0151). Può importare altri moduli della sua cartella, che Vite porta con lui.

Le vesti cambiano l'aspetto, non i contenuti né la struttura: spazi e corpi vengono dalla scala di `src/theme.css`.

Il logo è la scritta `.nav-logo` e `.footer-brand`, con i token `--skin-logo-*`; per un'immagine, una regola in `skin.css`.

Aggiungere una veste non tocca nient'altro. `npx vitest run tests/site-skins.test.ts` dice se manca qualcosa.

Quanto costa ciò che si muove: `node tools/vesti/misura.mjs --url http://127.0.0.1:<porta>/site/index.html` su una preview (un Chrome headless proprio, la CPU rallentata, il thread principale, i ms di ogni tick, ciò che si scarica). Le catture a 1920 e a 390 px: `node tools/vesti/cattura.mjs --url … --cartella docs/design/vesti/<id> --veste <id>`.
