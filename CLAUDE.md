@AGENTS.md

## Note specifiche per Claude Code

- Segui il «Protocollo delle sessioni» di `AGENTS.md`: all'inizio pianifica nel backlog
  (`docs/plans/backlog.md`) ciò che è rimasto in `docs/userchats/to-do.md` e toglilo da lì; fai un solo task;
  alla fine dai il prompt per la sessione successiva.
- `AGENTS.md` (importato sopra) è la fonte di verità: se prendi una decisione architetturale,
  aggiorna `AGENTS.md` e aggiungi un ADR in `docs/adr/` nello stesso cambio.
- Ambiente dell'autore: Windows. Per modifiche testuali in-place usa Edit, Bash (`sed`) o `node`,
  mai `Get-Content`/`Set-Content` di PowerShell 5.1 (corrompe UTF-8 senza BOM).
- Identità git di questo repository: `lorenzoviva <lorenzo.vaccaro@hotmail.com>`, impostata in locale.
  La configurazione globale della macchina è un account di lavoro: non usarla e non modificarla.
- Verifica visiva: `NODE_ENV=production npm run build && npx vite preview` (o `npm run dev` su `http://localhost:5173/`).
  URL: `?skip` salta intro e Genesi, `?offline` forza i modelli locali, `?dev&teleport=46,0` mostra la corona.
  *Procedura per gli interni degli edifici della corona (senza trial-and-error)*: non forzare le posizioni ECS da console a loop attivo (vengono ripristinate dal tick/sanitize). Trova la porta dell'edificio da console o test (`window.quine.corona.building('<id>').door`, es. `persone`, `nucleo`), naviga con `?dev&teleport=<door.x>,<door.y>`, premi `E` (o `window.quine.interact()`) per attivare la transizione canonica (`entrance(b)`, `zone = 'studio'`), muoviti con WASD e ruota con `,`/`.` per verificare e fotografare da più angolazioni.
  `window.quine` (o `window.rune`) espone il kernel; `window.quine.feed()` il registro del Concilio, `window.quine.models.usage` i consumi.
- Le prove con Gemini costano: una Genesi più qualche chunk ≈ 80 chiamate di testo e 20 immagini.
  Usa un profilo browser persistente per non rigenerare il mondo a ogni prova, e i test offline per il resto.
- Mai stampare o registrare il valore di `GEMINI_API_KEY`; verifica che non finisca in `dist/`.
