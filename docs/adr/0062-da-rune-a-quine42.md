# ADR-0062 — Da Rune a QUINE42: refactoring del nome del gioco

Data: 2026-10-24 · Stato: accettato (task T59 del backlog)

## Contesto
Il progetto è nato con il titolo di lavoro provvisorio «Rune», ispirato alla presenza nel terreno di token di codice (rune) che formano righe di istruzioni Lua eseguite a ogni tick.
Con la maturazione del design e le consultazioni con l'autore, il nome ufficiale del gioco diventa **QUINE42**:
- **Quine**: in informatica, un quine è un programma autosufficiente che produce come output il proprio stesso codice sorgente. È l'essenza profonda del gioco: un mondo 3D che è fatto del proprio codice sorgente, lo riflette e permette a chi gioca di comprenderlo, toccarlo e riscriverlo.
- **42**: la celebre Risposta Fondamentale alla Vita, all'Universo e a Tutto di Douglas Adams (*Guida Galattica per gli Autostoppisti*), opera a cui il gioco rende omaggio per atmosfera, temi della simulazione e del Concilio.
- **Distinzione fondamentale tra nome del gioco e meccanica delle rune**: la parola e la meccanica delle **rune** (le lastre luminose nel terreno, i token Lua, il canone delle rune, la borsa delle rune, la composizione della frase e la magia pronunciata con `T`) restano inalterate e centrali nella diegesi del mondo; ciò che cambia è il **nome del gioco** stesso, il branding e la sua identità di progetto.

## Decisione
1. **Configurazione e metadati di progetto**:
   - `package.json`: `name` diventa `"quine42"` con descrizione aggiornata (`"QUINE42 — un mondo in 3D fatto del proprio codice sorgente."`).
2. **Interfaccia utente e HTML**:
   - `index.html`: tag `<title>` impostato a `QUINE42`, schermata intro `#intro` con `.name` impostato a `QUINE42` (mantenendo il glifo runico ᚱ ᚢ ᚾ ᛖ e il payoff diegetico), intestazione della guida `<div id="help">` con `<h2>QUINE42</h2>`.
3. **Console del browser e retrocompatibilità**:
   - In `src/main.ts` vengono esposti `window.quine` e `window.quine42` come riferimenti primari, mantenendo `window.rune` come alias per piena retrocompatibilità con comandi rapidi di console, test e documentazione esistente.
4. **Documentazione e guide per agenti**:
   - Aggiornati titoli, aperture e riferimenti in `README.md`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md` e `docs/design.md`.

## Conseguenze
- Il gameplay, la sandbox Lua, i componenti ECS (`rune`, `RuneComp`), le tabelle di bottino e i salvataggi (`universe.json`, `stato.json`) rimangono completamente invariati.
- Nessuna rottura di compatibilità per script o utenti che usano `window.rune` in console: punta allo stesso oggetto di `window.quine`.
- Il progetto guadagna un'identità concettuale forte e prepara il terreno per l'allineamento del raggio del cerchio a 42 caselle (task T60).
