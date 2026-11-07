# Le vesti del sito

Una veste è una cartella qui dentro (ADR-0145). Il nome della cartella è il suo id: minuscole, cifre e trattini.

- `skin.json`: `nome` (nel selettore), `descrizione`, `icona` (la favicon, un file della cartella).
- `skin.css`: ogni token `--skin-*` che la base legge, sotto `:root[data-skin='<id>']`. Le altre regole sotto `[data-skin='<id>'] …`. È un file servito così com'è: gli `url()` sono relativi alla cartella, i `@font-face` si dichiarano qui.
- Font, sfondi, loghi: file della cartella (`.css .svg .png .jpg .webp .ico .woff2 .woff`).
- `effects.ts`, facoltativo: `export function start() { …; return () => { /* ferma tutto */ }; }`. Si carica solo per la veste in uso; si ferma a scheda nascosta e rispetta `prefers-reduced-motion` per conto suo. Meglio a tick che a ogni fotogramma: la futuristica aspetta il tick con un timer, poi dà a ogni pezzo che si vede un fotogramma suo, e un pezzo che non è cambiato non si ridipinge (ADR-0151, ADR-0164). Un programma MarkovJunior che gira a ogni tick sta su un passo persistente (`Stepper` di `src/mj/engine.ts`), non su un `runOn` per tick. Può importare altri moduli della sua cartella, che Vite porta con lui. Ciò che si muove sta qui e non in `skin.css`, che non può avere `@keyframes` né `@media` (ogni regola sta sotto `[data-skin='<id>']`): la veste a fumetto anima il suo `body::before` con la Web Animations API (`effects.ts` lì).
- Altri file che non sono di quell'elenco (un generatore dei disegni, come `fumetto/genera.ts`) restano nella cartella: non si servono e non entrano nella build.

Le vesti cambiano l'aspetto, non i contenuti né la struttura: spazi e corpi vengono dalla scala di `src/theme.css`.

Il logo è la scritta `.nav-logo` e `.footer-brand`, con i token `--skin-logo-*`; per un'immagine, una regola in `skin.css`. Logo e icona della sobria e della futuristica vengono dalle proposte, estratti così come sono: `npx vite-node --script tools/vesti/estrai.ts` li riscrive (`tools/vesti/logo.ts`, `tools/vesti/scritta.ts`), e i loro test rifiutano un ritocco a mano. Quelli del fumetto (la scritta e l'icona della proposta 01, con la Q in un corpo solo, e i pois) li riscrive `npx vite-node site/skins/fumetto/genera.ts -- --scrivi`, e `tests/site-skin-fumetto.test.ts` li confronta.

Aggiungere una veste non tocca nient'altro. `npx vitest run tests/site-skins.test.ts` dice se manca qualcosa.

Quanto costa ciò che si muove: `node tools/vesti/misura.mjs --url http://127.0.0.1:<porta>/site/index.html` su una preview (un Chrome headless proprio, la CPU rallentata, il thread principale, i ms di ogni tick, ciò che si scarica). Le catture a 1920 e a 390 px: `node tools/vesti/cattura.mjs --url … --cartella docs/design/vesti/<id> --veste <id>`.
