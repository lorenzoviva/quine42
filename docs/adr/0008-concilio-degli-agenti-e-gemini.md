# ADR-0008 — Il Concilio degli agenti e Google Gemini

Data: 2026-10-20 · Stato: accettato · Sostituisce: ADR-0005 (gateway mock), parte di ADR-0007 (resa a glifi)

## Contesto
L'autore vuole che il gioco sia generato da IA in tutti i suoi aspetti tranne il kernel: mappe e tile,
oggetti (anche inerti), personaggi simulati da un LLM, codice dei moduli. Narrativa, grafica, motore e
fisica devono restare coerenti tra loro. Modelli scelti per la prototipazione: `gemini-2.5-flash-lite`
(testo: narrativa, chat, descrizioni, codice) e `gemini-2.5-flash-image` (immagini).

## Decisione
- **Strato dei modelli** (`src/kernel/ai/`): interfaccia `Models` (`text`, `image`), implementata da
  `GeminiModels` (budget di sessione, concorrenza limitata, retry con backoff) e da `MockModels`
  (offline, deterministico, risponde a ogni compito dai dati strutturati).
- **La chiave non arriva mai al browser**: `server/geminiProxy.ts` (plugin Vite, dev e preview) legge
  `GEMINI_API_KEY` da `.env` e inoltra `/api/gemini/models/<gemini-*>:generateContent`.
- **Il Concilio** (`src/kernel/agents/`): sei agenti, ciascuno un prompt di ruolo nell'universo
  (`prompts/agents/*.md`, quindi riscrivibile e visibile nella corona) più la porzione di conoscenza
  condivisa che gli serve (bibbia `world/bible.json`, guida di stile `world/style.md`, palette, catalogo):
  Narratore, Cartografo, Artista, Fisico, Ingegnere, Arbitro.
- **Chunk** (18×18 caselle): bozza procedurale continua (Lua) → il Cartografo progetta griglia, luogo,
  oggetti, rune ed eventuali cose nuove → l'Artista dipinge la griglia come schizzo a colori, con i bordi
  dei vicini già dipinti come cornice (continuità senza cuciture) → il Fisico confronta il dipinto con la
  griglia (visione) e riallinea le collisioni. Tutto in cache (IndexedDB): un luogo si genera una volta.
- **Fucina** dei moduli: Narratore (concetto: tipo npc/oggetto/strumento, contesto, aspetto,
  interazione, comandi, persona, unicità) → Fisico (solidità, spinta, massa, attrito, peso, pile) →
  Ingegnere (Lua) → Arbitro (incoerenze rimandate all'agente responsabile, 1 giro) → validatore
  (manifest, compilazione, API esistente, caricamento di prova; errori all'Ingegnere, 2 giri) →
  Artista (sprite su fondo magenta, ritagliato con chroma-key). Il manifest lo scrive il kernel dai
  contenuti degli agenti: la forma è garantita.
- **Genesi**: dal tema, bibbia → stile → terreni (Fisico rivede solidità e velocità) → Arbitro → cast
  iniziale (2 npc, 2 oggetti, 2 strumenti) forgiato → ritratto del viandante. Durante la Genesi il mondo
  non viene generato (`generationHeld`). Costanti mai generate: tappeto, movimento, fisica, rune, kernel.
- **Memoria del Narratore**: ogni nuovo modulo viene annotato nella bibbia, nello stesso commit.
- **Riparazione automatica**: se un modulo scritto dal Concilio fallisce a runtime, l'errore torna
  all'Ingegnere (una volta per modulo per sessione); la correzione validata viene committata. Non
  accade se l'ultima modifica a quel file è del giocatore: le sue rotture si rispettano.
- **Budget**: `universe.json → ai` (`maxText`, `maxImages`, `maxForges` autonome per sessione).

## Conseguenze
- Una Genesi costa ~40 chiamate di testo e ~7 immagini (~1 minuto); ogni chunk 1 piano, 1 immagine,
  1 rilievo. Misurato: Genesi + 24 chunk pianificati + ~15 dipinti ≈ 80 testi e 22 immagini.
- Gli LLM non sanno contare le caselle: le posizioni proposte sono intenzioni; il kernel le sposta
  nella casella valida più vicina e ripara le griglie con piccoli difetti (≤15% di caselle) dalla bozza.
- Senza chiave (o con `?offline`) tutto funziona con i modelli locali: luoghi abbozzati (schizzo del
  layout), personaggi con battute predefinite.
- Gli agenti vedono solo testo e immagini: la coerenza è garantita dall'Arbitro e, in ultima istanza,
  dal validatore e dalla fisica del kernel.
