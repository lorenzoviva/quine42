# ADR-0039 — Registro dei consumi e chiamate senza sorprese

Data: 2026-10-22 · Stato: accettato (step 9, fase F2)

## Contesto
Il report dei costi dello step 8.2B ([`costi-step8.2B.md`](../reports/costi-step8.2B.md), sezione 5) ha trovato
due difetti in `GeminiModels`: non contava il ragionamento (`thoughtsTokenCount`) né la cache, e non salvava
nulla (alla chiusura i consumi sparivano); ripeteva una richiesta fino a 4 volte anche dopo un tempo scaduto,
quando Gemini può averla generata e fatta pagare comunque. La pagina di Google aggrega i consumi con ore di
ritardo. Nel gioco non si impostava il ragionamento, quindi valeva quello predefinito (fino a 3 volte la
risposta). L'autore conferma le proposte del report.

## Decisione
1. **Un solo file dei prezzi**: `src/kernel/ai/prices.ts`, con la data di lettura (`PRICES_READ_ON`), i
   cambi di prezzo datati (Argon dal 1/12/2026, 3.8 Flash dal 2027) e le stime per i modelli senza prezzo
   pubblicato (3.5 e 3.7 Flash, alla stima più alta del report). Lo usano il kernel e il laboratorio.
2. **`GeminiModels`**: ragionamento `low` esplicito in ogni chiamata (`ai.thinking`, o `thinking` della
   chiamata; `off` non manda nulla); un modello per chiamata (`TextCall.model`: lo Scultore e l'Artista hanno il
   loro); un tempo massimo (`ai.timeout`, 120 s); **mai ripetere** una richiesta senza risposta (tempo scaduto o
   rete): si conta e si segnala; si ripete solo una risposta 429/5xx, al più 3 volte, e le ripetizioni si contano.
   Conta prompt, cache, risposta e ragionamento, e passa ogni chiamata a `onCall`.
3. **Registro dei consumi del kernel** (`src/kernel/ai/usage.ts`): per giorno → modello → compito, chiamate,
   token (prompt, di cui in cache, risposta, ragionamento), dollari, ripetizioni, tempi scaduti. Vive in memoria
   e va in `world/consumi.json` **prima di ogni commit** (`Repo.beforeCommit`), così sopravvive al rollback e
   accompagna l'universo; alla chiusura della pagina un commit «consumi dei modelli» se è cambiato (mai con un
   guasto aperto: si committano solo stati validi). Il file di una sessione precedente si somma.
4. **Il costo si vede subito**: nel pannello del Concilio (sessione, oggi, in tutto; il dettaglio per modello al
   passaggio del mouse) e nella console (`kernel.usage`).
5. **Cache**: il sistema di ogni agente comincia con le parti stabili (ruolo, principi, contesto dell'agente) e la
   richiesta variabile è nel messaggio dell'utente, così l'inizio si ripete fra chiamate vicine.

## Conseguenze
- Il laboratorio non ha più contatori suoi (`meter.ts` tolto): gli script usano `GeminiModels` con il registro.
- Una chiamata scaduta è persa anche se pagata: meglio che pagarla due volte.
- I prezzi vanno riletti quando cambiano (data nel file, calcoli nel report).
