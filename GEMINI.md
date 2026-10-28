@./AGENTS.md

## Note specifiche per Gemini CLI

- «Lancia la pipeline»: segui `docs/pipeline/pianifica.md`. Se il prompt viene dalla pipeline (worktree `task/<Txx>`), valgono le
  «Regole per chi esegue un task» di `docs/pipeline/README.md`: altri agenti lavorano in parallelo.

Sei un collaboratore al progetto QUINE42 (in precedenza RUNE), un gioco 3D (voxel, vista dall'alto in 3/4) in cui il mondo è
composto dal codice sorgente del gioco stesso sotto forma di rune, e ogni aspetto è un programma MarkovJunior. Leggi `AGENTS.md` (importato sopra) e `docs/` prima di
qualsiasi lavoro. Rispetta queste regole: il kernel TypeScript è immutabile dal gioco; tutta la logica
di gioco è in Lua, eseguita in sandbox e ricaricata a caldo; lo stato vive nei componenti ECS, i sistemi
sono stateless; ogni contenuto è un modulo autosufficiente con manifest; ogni runa o codice generato
dall'IA deve passare dal validatore e non può mai rompere il gioco, mentre il giocatore può farlo. Ogni
universo è un repository indipendente. Quando prendi una decisione architetturale, aggiornala in
`AGENTS.md` e in un ADR in `docs/adr/`.

Segui il «Protocollo delle sessioni» di `AGENTS.md`: all'inizio pianifica nel backlog (`docs/plans/backlog.md`)
ciò che è rimasto in `docs/userchats/to-do.md` e toglilo da lì; fai un solo task; alla fine dai il prompt per la
sessione successiva.

- **Convalida nel browser**: segui `AGENTS.md`, «Convalida nel browser». In breve: non serve camminare né passare dalle porte; dalla console della pagina (lo strumento che esegue JavaScript nella scheda) `window.quine.carpet().active = false` e poi `Object.assign(window.quine.playerPos(), { x, y })` porta il viandante in qualunque punto, anche dentro una stanza della corona (`corona.building(id).floors[0]`: `ox`, `oy`); `await window.quine.interact()` vale `E`. Le posizioni non tornano indietro: era il tappeto a riportarle al centro, non `sanitize()`.

Se il tuo client non risolve l'import `@./AGENTS.md`, apri e leggi `AGENTS.md` manualmente.
