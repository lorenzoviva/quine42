# ADR-0042 — Lo Scultore nel Concilio, l'Artista giudica

Data: 2026-10-22 · Stato: accettato (step 9, fase F6) · Attua ADR-0037 (punto 4) e le proposte 2, 3, 6 del
[report dei costi](../reports/costi-step8.2B.md).

## Contesto
Con gli asset fatti di programmi (ADR-0041) qualcuno deve scriverli. Lo step 8.2A ha misurato due modelli Gemini
come scultori: 3.1 Flash-Lite regge vegetazione, rocce e oggetti (e peggiora con i giri di miglioramento), 3.8
Flash è costante anche su persone, animali ed edifici; lo step 8.2B ha trovato Argon il migliore sulle strutture
complesse, al doppio del prezzo dal 1/12/2026. Il giudice costa circa $0,002 a voto.

## Decisione
1. **Lo Scultore** è un membro del Concilio (`scultore`, siede al tavolo accanto all'Artista, lavora nella
   Galleria). Le sue istruzioni sono un file dell'universo (`prompts/agents/scultore.md`: coordinate, scala, le
   classi e la palette inserite dal kernel, idiomi e trappole di MarkovJunior); gli esempi sono due programmi
   della libreria della stessa classe o famiglia (prima quelli scritti a mano). Le istruzioni stabili stanno in
   testa al sistema, così la cache le serve.
2. **Per classe** (`agents/sculptor.ts`, `ai.scultori` nella configurazione):
   - *semplici* (alberi, cespugli, rocce, sassi, oggetti, mobili): `gemini-3.1-flash-lite`, **due programmi
     indipendenti**, l'Artista tiene il migliore;
   - *figure* (persone, animali, bestie) e *strutture* (edifici, monumenti, strutture grandi): `gemini-3.8-flash`,
     un programma e, se l'Artista dà meno di 7, un giro di revisione con le sue parole e le foto;
   - strutture **importanti** (`importante`): `gemini-4-argon` fino al 1/12/2026, poi 3.8.
   Ragionamento `low` (ADR-0039). Ogni programma passa i controlli del kernel (compila, finisce in 8 s, poggia,
   è d'un pezzo, è alto quanto la classe chiede, non riempie la scatola); finché non li passa torna allo Scultore
   con il motivo (al massimo 2 volte).
3. **L'Artista giudica**: vede le quattro foto del modello (render software di `src/mj/photo.ts`, PNG senza
   dipendenze `src/mj/png.ts`) e risponde voto, riconoscibile, problemi, consigli (`gemini-3.5-flash`, come nelle
   prove, configurabile).
4. **Chi chiede modelli**: la Fucina dà a ogni cosa nuova un modello suo (`appearance.model` = l'id del modulo,
   con la `classe`); il Narratore dà a ogni oggetto una **forma comune** (`forma-bottiglia`, `forma-sacco`… un
   programma per forma, ricolorato con il colore di ciascun oggetto: la lettera C); la Genesi dà un modello ai
   terreni con cose sopra (`terreno-<nome>`); il Referente porta allo Scultore i «riscolpisci» (un modello suo per
   ciò che ne mostrava uno generico, o una nuova versione con il desiderio). Il `ModelDirector` del kernel trova
   i riferimenti senza programma e li fa scolpire uno alla volta, entro `ai.maxModels` (40) per sessione; intanto
   la cosa mostra il modello generico della sua classe. Ogni programma entra con `addModel` (validato, scritto con
   la voce in `models/index.json`, committato).
5. **Offline** (`MockModels`): lo Scultore risponde con il programma scritto a mano della classe, l'Artista con un
   7: tutto il percorso si prova nei test senza rete.
6. La Galleria dell'Artista espone i modelli sui piedistalli; il pannello mostra la foto del modello e «Riscolpisci».

## Conseguenze
- Il costo dell'aspetto di un mondo è testo: circa $0,024 per tipo semplice, $0,02-0,10 per figura o struttura
  (report 8.2B, sezione 4); un oggetto nuovo non costa nulla se la sua forma esiste.
- Il registro dei consumi distingue `model.sculpt` e `model.judge` per modello.
