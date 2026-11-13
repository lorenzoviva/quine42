# ADR-0186 — La cache esplicita dell'Attore: le sue istruzioni di sistema tenute da Gemini 3.8 Flash

Data: 2026-11-13 · Stato: **accettato** (T351, D45.7) · Riferimenti: ADR-0099 (il varco della chiave), ADR-0110 (i mondi senza segreti),
ADR-0113 (chi paga si dice), ADR-0116 (l'Attore), ADR-0157 (Jev, l'ordine di D45), `lab/banco/jev/casi-d-uso.md` §4-7 (T325),
`lab/banco/jev/cache-attore.md` (la misura)

## Contesto

T325 ha misurato che 3.8 Flash, il modello dell'Attore, non ha servito niente dalla cache implicita in 15 chiamate, anche con lo stesso
prefisso di fila: le righe dell'Attore costano 0,53 $ l'ora, di cui 0,33 di contesto, e il 70 % del loro ingresso è un prefisso stabile
(ruolo, principi, blocco «Lingua», contesto del mondo: canone, lessico, bibbia in breve, regole). La proposta di T325, approvata
dall'autore con D45.7, è di mettere quel prefisso in una **cache esplicita** di Gemini prima di dare l'Attore a Jev.

Una cache esplicita è una risorsa di Google (`cachedContents`): si scrive con il modello, le istruzioni di sistema e una durata (`ttl`); le
chiamate che la nominano (`cachedContent`) non rimandano quelle istruzioni e le pagano al prezzo della cache (0,075 $ al milione su
3.8 Flash, un decimo dell'ingresso); la conservazione si paga a parte, per milione di token e per ora (0,50 $ fino al 31/12/2026, poi
1,00 $; letto il 13/11 da pagine che copiano quella di Google, da confermare sulla prima fattura).

## Decisione

1. **Che cosa va in cache.** Le istruzioni di sistema di un agente di `CACHED_AGENTS` (`council.ts`), oggi solo `actor`: ruolo, principi,
   «Lingua», contesto dell'agente e `opts.system`. Per questi agenti il **focus del grafo** (che cambia a ogni chiamata) apre il prompt
   invece di chiudere il system; gli altri agenti restano come sono, sulla cache implicita. **La scheda dell'individuo resta nel prompt**:
   un prefisso per persona vorrebbe una cache per persona (conservazione moltiplicata, la soglia minima di token, due schede in un dialogo),
   mentre un prefisso solo è lo stesso per ogni persona e ogni dialogo (lo dice il test). Le schede sono 8-14 righe; il prefisso
   4.000-5.400 token.
2. **Il livello dei modelli.** `TextCall.cache` dice che `system` è un prefisso stabile; `GeminiAiModels` lo tiene in cache se il modello
   ha un prezzo di conservazione (`cacheable`, `Price.storage`: oggi solo `gemini-3.8-flash`), altrimenti nulla cambia; i modelli locali
   ignorano il campo. La politica è `ExplicitCaches` (`src/kernel/ai/cache.ts`): un prefisso chiesto una volta non vale una cache (la
   scrittura costa quanto il prompt e la conservazione si paga per tutta la durata), alla **seconda** richiesta entro un `ttl` si scrive; si
   nomina fino a `CACHE_MARGIN` (150 s, più del tempo massimo di una richiesta) prima della fine, poi alla chiamata seguente se ne scrive
   un'altra; un prefisso che Gemini o il varco rifiutano non si riprova per un `ttl`; le chiamate insieme aspettano la stessa scrittura; al
   più `MAX_CACHES` (8) prefissi seguiti. Una chiamata che nomina una cache sparita (scaduta, sconosciuta al varco dopo un riavvio) parte
   intera, una volta sola. La durata è `EXPLICIT_CACHE.ttl` (1800 s), il massimo che il varco accetta `maxTtl` (3600 s); sotto
   `minTokens` (1024, contati larghi a 4 caratteri) non si prova.
3. **I prezzi e il registro.** `Price.storage` (USD per milione di token l'ora) e `Tokens.stored` (token × ore) in `prices.ts`; `costOf`
   li somma (un modello senza prezzo di conservazione la pagherebbe al prezzo d'ingresso: mai meno di quanto può costare). La scrittura è
   una riga del registro con il compito `cache.write`, l'agente che l'ha chiesta, i token nel `prompt` **al prezzo d'ingresso** (le pagine
   non sono d'accordo su un costo della scrittura: si conta il più alto) e `stored` per **tutta** la durata, pagata quando si scrive;
   `Tally.stored` e `tallyLine` la mostrano; `world/usage.json` la tiene. `tokensOf` è l'unico modo di portare una riga ai prezzi (registro
   e addebito del kernel).
4. **Chi paga (regola 8i).** La scrittura la paga il mondo intero, `comune` (`CACHE_PAYER`): la nominano poi le chiamate di tutti. Ogni
   chiamata dell'Attore resta di chi parla, con il prefisso al prezzo della cache. Detto dal livello dei modelli, non ricavato.
5. **Il varco (regola 9, ADR-0099).** `GeminiGate.writeCache`: solo un modello ammesso e con prezzo di conservazione; un `ttl` fra 60 s e
   `maxTtl`; solo istruzioni di sistema in testo; il corpo rifatto da quei tre campi (niente `contents`, `tools`, immagini); la scrittura e
   la conservazione per tutto il `ttl` trattenute e spese nel tetto del giorno; al più `MAX_LIVE_CACHES` (64) vive. Una chiamata può
   nominare solo una cache che questo varco ha scritto, per il suo modello, finché vive (`namedCacheRefusal`: 404 altrimenti, e il kernel
   riparte intero). La route è `/api/gemini/cachedContents` (POST, la stessa porta di `/api/gemini`: solo da questa macchina e dalla stessa
   origine); i mondi di molti passano da `direct()`, che riconosce il percorso. Il server di produzione non ha rotte nuove.
6. **La stima della lobby.** Con l'Attore acceso su un modello con cache, le sue righe pagano il 70 % del prompt al prezzo della cache
   (`ACTOR_CACHED_SHARE`, la misura di T325) e una riga «Cache dell'Attore» (`non regolabile`) conta le scritture di un'ora con la loro
   conservazione su un prefisso di `ACTOR_PREFIX_TOKENS` (5.400).
7. **La misura.** `npx vite-node lab/scripts/prompt-tokens.ts -- --cache`: offline, le richieste vere dell'Attore dopo una Genesi del seme
   e 24 luoghi (il registratore di T325), la politica vera su un orologio al ritmo dell'ora di `HOUR`. Risultato in
   `lab/banco/jev/cache-attore.md`: un prefisso solo, l'87 % della richiesta; tre scritture l'ora; l'86 % dell'ingresso servito dalla
   cache; **0,35 → 0,19 $ l'ora (−47 %, 0,16 $)**, la cache stessa 0,012 $.

## Conseguenze

- Kernel 0.6.11 (incremento: nessun formato cambia; `world/usage.json` ha un campo in più, letto anche dove manca).
- Il contesto scelto da Jev per l'Attore (T325 (c), −38 % a battuta) si misura ora **sopra** la cache: il prefisso costa già un decimo.
- Non provato contro Gemini vero: che 3.8 Flash accetti la cache esplicita, la soglia minima di token, il costo della scrittura e il
  prezzo della conservazione (vanno guardati sul primo uso e sulla fattura). Se Gemini rifiuta, l'Attore va come prima.
- Sicurezza: una porta nuova nel varco della chiave (`cachedContents`), con i suoi limiti e i test V-002 in `tests/sicurezza/gemini.test.ts`;
  nessun dato nuovo verso il client.
