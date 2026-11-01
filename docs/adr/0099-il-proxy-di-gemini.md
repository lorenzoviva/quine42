# ADR-0099 — Il proxy di Gemini: un solo varco per la chiave

Data: 2026-11-01 · Stato: accettato (task T123 del backlog) · Riferimenti: V-002 (R2 dell'audit T117), ADR-0098 (il processo delle vulnerabilità), ADR-0058 (il kernel sul server), regola 9 di `AGENTS.md`

## Contesto
`/api/gemini` spendeva la chiave per chiunque raggiungesse la porta, con qualunque modello `gemini-*` e fino a 12 MB; i budget di `universe.json` stanno nel kernel e il proxy non li vedeva. Il mondo in multigiocatore chiamava
la stessa route via HTTP, quindi la route doveva esistere anche su un server che accetta giocatori. Un altro sito aperto nel browser dell'autore poteva chiamarla.

## Decisione
1. **Un solo varco, `GeminiGate`** (`server/geminiProxy.ts`), l'unico che tiene la chiave. Due porte: la route per il kernel nel browser di chi gioca da solo su questa macchina, `direct()` per i mondi di molti.
2. **In multigiocatore niente route**: `openUniverse` riceve da `server/session.ts` un `fetch` (`gate.direct()`) che va a Google con gli stessi limiti; `src/session/host.ts` non conosce né la chiave né un indirizzo. Senza chiave, i modelli locali.
3. **La route solo da questa macchina e dalla stessa origine**: indirizzo di loopback, nessuna intestazione di inoltro (un tunnel arriva da loopback), `Host` di loopback (un nome di un altro sito puntato su 127.0.0.1), `Origin`, se c'è, uguale all'`Host`; il corpo dev'essere `application/json`. Vale anche per `/api/gemini/status`: chi non può usarla vede «non disponibile» e gioca con i modelli locali.
4. **Modelli**: quelli di `prices.ts` (certi e stimati), più quelli nominati da un `universe.json` (`ai.textModel`, `ai.scultori`), letti solo per un modello fuori dai prezzi. Il modello senza prezzo si conta al prezzo del più caro.
5. **Corpo massimo 2 MB** (`MAX_BODY`): la richiesta vera più grande è un prompt lungo con il foglio di quattro foto dell'Artista.
6. **Tetto di spesa giornaliero** in dollari, per tutto il processo: `GEMINI_TETTO_GIORNALIERO` nel `.env`, predefinito 10. La spesa è letta da `usageMetadata` di ogni risposta e sta in `universes/.spesa-gemini.json`, così un riavvio non la azzera; il giorno è UTC. Ogni chiamata in volo trattiene il suo prompt stimato più 8192 token di risposta: tante insieme non passano tutte sotto il tetto. Ciò che Google rifiuta non conta; ciò che cade senza risposta resta contato, perché può essere stato fatturato.
7. **Al tetto la risposta è 402**, che `GeminiModels` non ripete e traduce in `BudgetError`: chi si ferma a un budget si ferma anche qui. Una connessione caduta nella porta diretta arriva al kernel come tale e non si ripete; nella route resta un 502.

## Alternative scartate
- **Un segreto condiviso tra il server e il kernel nel browser**: un segreto nel browser non è un segreto (regola 9); il controllo di origine e indirizzo basta per chi gioca da solo.
- **Il tetto per universo o per viandante**: quelli sono i budget del kernel e i crediti (ADR-0081); il varco difende la chiave, che è una.
- **Solo i modelli dei prezzi**: un universo con un modello nuovo smetterebbe di funzionare fino al prossimo aggiornamento dei prezzi; il costo al prezzo più alto lo tiene sotto il tetto.
- **Il tetto solo in memoria**: un riavvio lo azzererebbe.

## Conseguenze
Il gioco in singola aperto da un altro dispositivo della rete locale resta offline: è voluto. In multigiocatore non cambia nulla per chi si collega da fuori, perché il suo kernel specchio non genera.
Finché V-001 è aperta, chi scrive un `universe.json` allarga l'elenco dei modelli, ma per usarli passa comunque dal loopback e dal tetto. Il tetto predefinito è basso per un server pubblico: T133 dovrà chiederlo nel `.env`.
