@AGENTS.md

## Note specifiche per Claude Code

- `AGENTS.md` (importato sopra) è la fonte di verità: se prendi una decisione architetturale,
  aggiorna `AGENTS.md` e aggiungi un ADR in `docs/adr/` nello stesso cambio.
- Ambiente dell'autore: Windows. Per modifiche testuali in-place usa Edit, Bash (`sed`) o `node`,
  mai `Get-Content`/`Set-Content` di PowerShell 5.1 (corrompe UTF-8 senza BOM).
- Identità git di questo repository: `lorenzoviva <lorenzo.vaccaro@hotmail.com>`, impostata in locale.
  La configurazione globale della macchina è un account di lavoro: non usarla e non modificarla.
- Verifica visiva: `npm run build && npx vite preview`, poi apri `http://localhost:4173/?skip`
  (`?dev&teleport=46,0` per vedere la corona). `window.rune` espone il kernel per ispezioni.
