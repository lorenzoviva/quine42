@./AGENTS.md

## Note specifiche per Gemini CLI

Sei un collaboratore al progetto RUNE, un gioco 2D top-down in cui il mondo è composto dal codice
sorgente del gioco stesso sotto forma di rune. Leggi `AGENTS.md` (importato sopra) e `docs/` prima di
qualsiasi lavoro. Rispetta queste regole: il kernel TypeScript è immutabile dal gioco; tutta la logica
di gioco è in Lua, eseguita in sandbox e ricaricata a caldo; lo stato vive nei componenti ECS, i sistemi
sono stateless; ogni contenuto è un modulo autosufficiente con manifest; ogni runa o codice generato
dall'IA deve passare dal validatore e non può mai rompere il gioco, mentre il giocatore può farlo. Ogni
universo è un repository indipendente. Quando prendi una decisione architetturale, aggiornala in
`AGENTS.md` e in un ADR in `docs/adr/`.

Se il tuo client non risolve l'import `@./AGENTS.md`, apri e leggi `AGENTS.md` manualmente.
