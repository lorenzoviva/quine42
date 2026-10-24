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
- Verifica visiva: la procedura è in `AGENTS.md`, «Convalida nel browser» (build, preview su una porta libera, spostarsi
  ovunque dalla console fermando il tappeto, `interact()` per `E`). Con Claude in Chrome: carica in una sola ToolSearch
  `tabs_context_mcp`, `navigate`, `javascript_tool` (la console: `window.quine`), `computer` (screenshot e tasti `,` `.`),
  `read_console_messages`, `tabs_close_mcp`; lavora in una scheda nuova e chiudila alla fine. La preview in background si ferma
  chiudendo il processo che ascolta sulla porta (`netstat -ano`).
- Le prove con Gemini costano: una Genesi più qualche chunk ≈ 80 chiamate di testo e 20 immagini.
  Usa un profilo browser persistente per non rigenerare il mondo a ogni prova, e i test offline per il resto.
- Mai stampare o registrare il valore di `GEMINI_API_KEY`; verifica che non finisca in `dist/`.
