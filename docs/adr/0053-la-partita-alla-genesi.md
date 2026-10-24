# ADR-0053 — La partita si sceglie alla Genesi

Data: 2026-10-24 · Stato: accettato (task T33 del backlog) · Attua la decisione 9 di ADR-0050 (il multiplayer) ed estende
ADR-0026 (morte e trascendenza).

## Contesto
Il piano del multiplayer ([`multiplayer.md`](../plans/multiplayer.md), decisione 9) vuole che alcune scelte si facciano creando
l'universo e non cambino più, perché il Concilio e l'Ingegnere ci costruiscono sopra meccaniche che non si possono disfare:
quanto è punitiva la morte, PvP, «Altro…» tra giocatori, la modalità. Il piano parlava di un testo libero per la morte;
l'autore ha poi scelto (backlog, 24/10/2026) uno **slider da 0 a 4**. Fino a oggi la morte era una sola: tutto perso, di
nuovo nella piazza.

## Decisione
1. **`universe.json → partita`** (`Partita` in `src/kernel/types.ts`): `modalita` (`singola | multigiocatore`), `morte` (0-4),
   `pvp`, `altroTraGiocatori`. I predefiniti sono il gioco di oggi (`DEFAULT_PARTITA` in `src/kernel/partita.ts`: singola,
   morte 3, niente PvP, «Altro…» sì); il seme li dichiara. Un universo vecchio senza la sezione la riceve così.
2. **Il validatore la ripara** (`repairPartita` in `validator.ts`, chiamato da `readConfig`): modalità sconosciuta → singola,
   morte arrotondata e limitata a 0-4 (le parole del piano, «molto» / «poco punitiva», o il nome di un livello diventano un
   livello), i sì/no come booleani, ciò che manca dal predefinito.
3. **I cinque livelli** (`DEATH_LEVELS`): nessuna (ci si rialza dove si è caduti con tutto), lieve (la piazza, al più una cosa
   persa), media (la piazza, una parte di ciò che si porta), dura (la piazza, niente di ciò che si portava né le condizioni: la
   morte di prima), spietata (tutto, anche i vantaggi conquistati: nessuna abilità sopravvive alla morte).
4. **Va al Concilio come principio**: `gameSummary` in `council.ts` (`partitaSummary`) entra nel contesto del Narratore,
   dell'Arbitro, dell'Ingegnere e del Referente, cioè di chi costruisce storie, coerenza, meccaniche e richieste sul mondo; non
   di Scultore, Artista, Cartografo e Fisico.
5. **La morte la decide il Narratore**: `kernel.die` chiede subito `player.death` (`judgeDeath` in `agents/effects.ts`) con il
   livello, ciò che il viandante porta e le sue condizioni; la risposta dice `perde_tutto`, la `ripartenza` (`qui | piazza`) e gli
   effetti, solo tra quelli che tolgono (`consuma togli_stato stato bisogni messaggio`), validati come ogni effetto.
   `continueAfterDeath` (ora asincrona) ridà i bisogni pieni, applica il verdetto e non lascia nessuno a meno di 10 di salute.
   Se il Narratore tace vale il livello alla lettera (`fallbackDeath`, anche la risposta di `MockModels`). La schermata della
   morte dice la punizione.
6. **Non si cambia dopo**: il kernel tiene la partita del primo `universe.json` che carica (`keepGame` in `applyFiles`); un
   `universe.json` riscritto che dice altro viene riscritto con la partita di prima (e il registro lo dice), il resto del file
   resta dell'universo. Solo `runGenesis(tema, progresso, partita)` sceglie una partita, e solo per un universo mai generato
   (`needsGenesis`); se la Genesi fallisce torna la partita di prima. La schermata della Genesi chiede le quattro scelte (PvP e
   «Altro…» solo in multigiocatore); dopo la prima Genesi le mostra bloccate. Nessuna altra UI la cambia.

## Conseguenze
- In singola PvP e «Altro…» tra giocatori sono solo scritti: li useranno T37 e T43. La modalità multigiocatore si può scegliere
  ma per ora si gioca da soli.
- «L'ultimo villaggio» del piano non esiste ancora: si riparte dove si è caduti o nella piazza.
- Ricominciare dal seme (cestino) resta sempre possibile e fa una nuova Genesi, quindi una nuova scelta.
