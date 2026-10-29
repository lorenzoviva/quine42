# ADR-0077 — Generare l'universo con gli abbonamenti

Data: 2026-10-29 · Stato: accettato (task T68 del backlog; primo pezzo T68a) · Estende ADR-0039 (registro dei consumi) e ADR-0072 (pipeline).

## Contesto
Il Concilio chiama le API di Gemini a consumo. L'autore vuole far girare le stesse richieste sull'abbonamento di chi gioca (Claude Code
o Antigravity), anche per chi scarica il repository, con una coda servita quasi in tempo reale; la base sono le CLI lanciate da script
della pipeline (T61). Risposte dell'autore (`docs/pipeline/domande/T68.md`, 29/10/2026): solo in locale con l'abbonamento di chi gioca
(singola e sviluppo), mai il server del multigiocatore; solo i compiti già lenti; quale provider per quale agente in una tabella in
`universe.json → ai`, con un provider predefinito.

## Decisione
1. **La tabella**: `universe.json → ai.provider` (`api`, `claude`, `antigravity`; predefinito `api`) e `ai.agenti` (agente → provider,
   le eccezioni). `subscriptionsOf` la ripara: un provider sconosciuto vale `api`.
2. **Solo i compiti lenti** (`slowTask` in `src/kernel/ai/subscription.ts`): `genesis.*`, `forge.*`, `model.sculpt`, `model.resculpt`,
   `council.session`, `mechanic.design`. Il resto va sempre alle API. Il giudizio dell'Artista (`model.judge`) guarda foto: resta sulle API.
3. **`RoutedModels`** è il `Models` del kernel quando la tabella nomina un abbonamento: ogni chiamata al provider della tabella
   (`providerFor`), alle API se quella coda non c'è. `usage` e `limits` sono delle API (il budget di sessione è per ciò che si paga).
4. **La coda su disco**: `QueueModels` (un provider) manda la richiesta (la stessa `TextCall` senza `data`: system, prompt, schema,
   immagini, ragionamento, chi paga) a `/api/coda` (`server/subscriptionQueue.ts`, server di Vite e preview), che la scrive in
   `universes/.coda/<id>.richiesta.json`; un processo che usa le CLI la prende (`take`: rinomina in `.presa`), risponde
   (`answer`: `.risposta.json` con `text` o `errore` e i token se la CLI li dice) e batte il cuore (`servitore-<provider>.json`, vivo
   per 30 s). Il client guarda ogni mezzo secondo; dopo 15 minuti senza risposta la ritira e non la ripete (come le API, ADR-0039).
5. **Lo stesso registro dei consumi**: ogni chiamata della coda è un `CallRecord` col modello `abbonamento-claude` o
   `abbonamento-antigravity`, prezzati a zero dollari (`SUBSCRIPTION_PRICES` in `prices.ts`): si vedono, per agente e compito, senza costo.
6. **Mai sul server del multigiocatore**: `src/session/host.ts` usa solo le API; i `RoutedModels` li costruisce `main.ts` in singola
   e sviluppo (T68c).

## Conseguenze
- Il processo che serve la coda con le CLI (risposta JSON secondo lo schema, token da ciò che la CLI riporta, limiti dell'abbonamento)
  è T68b; il collegamento nel gioco, lo stato nell'HUD e la prova nel browser T68c.
- Senza tabella (o tutta `api`) nulla cambia.
