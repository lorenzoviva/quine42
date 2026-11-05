# Le vesti del sito

Una veste è una cartella qui dentro (ADR-0145). Il nome della cartella è il suo id: minuscole, cifre e trattini.

- `skin.json`: `nome` (nel selettore), `descrizione`, `icona` (la favicon, un file della cartella).
- `skin.css`: ogni token `--skin-*` che la base legge, sotto `:root[data-skin='<id>']`. Le altre regole sotto `[data-skin='<id>'] …`. È un file servito così com'è: gli `url()` sono relativi alla cartella, i `@font-face` si dichiarano qui.
- Font, sfondi, loghi: file della cartella (`.css .svg .png .jpg .webp .ico .woff2 .woff`).
- `effects.ts`, facoltativo: `export function start() { …; return () => { /* ferma tutto */ }; }`. Si carica solo per la veste in uso; si ferma a scheda nascosta e rispetta `prefers-reduced-motion` per conto suo.

Le vesti cambiano l'aspetto, non i contenuti né la struttura: spazi e corpi vengono dalla scala di `src/theme.css`.

Il logo è la scritta `.nav-logo` e `.footer-brand`, con i token `--skin-logo-*`; per un'immagine, una regola in `skin.css`.

Aggiungere una veste non tocca nient'altro. `npx vitest run tests/site-skins.test.ts` dice se manca qualcosa.
