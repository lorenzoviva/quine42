# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 13/11/2026, epoca 387 (argon). Crediti: vedi `stato`.

## Stato attuale

- **Sei fasi (autore, 10/11):** I kernel 0.9.0, II closed beta, III kernel 1.0.0, **IV open beta** (OpenRouter, hosting esterno e self-hosting, niente partita IVA ora), V raffinamento, VI produzione (Stripe, quote carte). Step 43: T345 integrato (studio `docs/design/open-beta.md`, ADR-0184) → D52 chiusa il 13/11 (tutto sì tranne la 5: Jev resta acceso, OpenRouter dà anche i modelli di TypeSafe) → T361 integrato (`0b0a5889`, ADR-0189: `QUINE_PAGAMENTI=spenti`, `/healthz`, V-035 chiusa; UI non provata nel browser), T362 adattatore OpenRouter + Jev (fable), T363 chiavi e turno comuni (fable), T364 «Collega OpenRouter» (browser), T365 costo carte, T366 inviti (in attesa D54), T367 pacchetto self-hosting, T368 «Come usiamo l'IA», T369 modelli locali (non approvato); T45f ora su VM con il pacchetto di T367.
- **Nuovo generatore MJ (autore, 10/11):** T346 integrato (`598dbeff`): parti abitabili come sottoblocchi `<import>`, aree delle strutture, `mapsBackToBox`, fattoria e forte del banco rifatti. T354 e T359 integrati (`a19c8fca`, `65402d74`, ADR-0183, kernel 0.6.10): prompt strutture senza scheletro a 3 livelli sul piano a 1/5, due blocchi col ritorno in testo, parti del seme nella richiesta, `part-stair` tollerante, villetta e rocca nel banco e nel lab 3D. T356 integrato (`c21d13b3`, ADR-0185, kernel 0.6.11): tetto delle gargantuesche misurato a 20/30/50 caselle, `meshVoxels` in due passate su array tipizzati e `underside: false` (fattoria a 400: mesh 57 → 44 MB, picco 541 → 129 MB), `FORM_LIMITS` 32 M, `FORM_PIECES` 64 M, `MJX_LIMITS` 64 M, quarta scatola 20 × 20 nel lab 3D e nel banco, `misura-frame.mjs --modello`; D53 chiusa il 13/11: T370 lotto 2 × 2 luoghi con `STRUCTURE_SIDE` 500 (fable), T371 il forte dell'autore come riferimento «ottima» (in attesa del forte finito): l'autore disegna a mano un forte 500 × 500 × 150 (25 caselle, `lab/mjx/models/handmade/forte-handmade.xml`), proposta opzione 1 con lato 500. Mancano: aree usate da Narratore/Scenografo, giro dello Scultore su Gemini (T355, in attesa fino al 15/11), scala cortile→camminamento del forte.
- **Vestiti e armature (step 40):** T290 integrato (ADR-0180, `<worn>`); T353 integrato (ADR-0181, kernel 0.6.5: abiti degli individui dalla scheda o dal mestiere); mancano cambio d’abito dopo l’individuazione, abiti nella scheda dell’Attore, gambe/piedi/mani.
- **Launcher (D51.2):** T233 integrato (`492b5e5e`): la home è il launcher; «in gioco ora» provato solo con `/api/session` simulata.
- **Jev e costi del Concilio (D45):** T348 integrato (varco `TypeSafeGate`, strato `decide`, V-034 chiusa); T349 integrato (`model.reuse` nel `ModelDirector`, −16 % sculture stimato); T350 integrato (`2e733d0e`, kernel 0.6.9: guardie `text.guard` locali alle 5 porte senza inviare il testo del viandante a Jev finché `JEV_ZERO_RETENTION` è falso, e quarta parete `text.fourthwall` con `metaBreak` + Jev su Fucina, individui, schede Attore e trame, escluse le battute); T351 integrato (`6912ba9d`, ADR-0186, kernel 0.6.11: cache esplicita di Gemini 3.8 Flash per il prefisso di sistema dell'Attore, `ExplicitCaches` ttl 1800 s scritta alla seconda richiesta, `Price.storage` e `cache.write` pagata da `comune`, `GeminiGate.writeCache` con 4 test V-002, −47 % costo Attore misurato in `lab/banco/jev/cache-attore.md`, non provato contro Gemini vero). T352 integrato (`e28d73ce`, kernel 0.6.12): stima oraria della lobby coi token misurati da T325, un'ora a pieno dettaglio 1,42 $ (prima ~1,04), con l'Attore 1,68 $; restano stimate le uscite non misurate e `forge.fix`. Non provato contro TypeSafe vero né su traffico reale; manca l'archivio di sessione delle domande del viandante (D45.6). `tests/carte-guaste.test.ts` rosso nella suite intera e verde da solo (T352, causa non dimostrata): possibile instabilità sotto carico.
- **Campagna del Master (autore, 10/11):** spese universo a carico del master, universo privato su invito, velocità/pausa di generazione, direttive della campagna nel Referente iniettate per competenza, controllo preventivo cartografia → T347 integrato (`c72f4617`, studio `docs/design/campagna-master.md`, ADR-0188 proposto: pagamento del master in `charge`, universo privato con inviti in `universes/.campaign/`, `pace`, direttive a sezioni `campaign.md`, regioni `mare`/`trattenuta`) → D54 chiusa il 13/11 → T366 (fable, ora anche universo privato e inviti, 6 %), T372 master paga, T373 ritmo/pausa, T374 direttive, T375 regioni riempitivo/trattenuta, T376 individui e trame, T377 campagna nel sito (claude, approvati, ~20 %).
- **Claude Fable (autore, 10/11):** reset settimanale giovedì 12/11 16:00; adozione intensiva per massimizzare l'uso di Fable.
- **Domande chiuse (10/11):** D45 (Jev, ZDR spiegato), D47 (vestiti C+B), D48 (strutture D integrata), D49 (carte solo uso reale), D50 (gestito + self-hosting in VI), D51 (T345 e contatore vesti).
- **Modelli specializzati di Antigravity (autore, 13/11):** T360 integrato (`703c838c`, ADR-0187): provider `hydrogen` (Gemini 4 Hydrogen, conto `gemini`) e `orchestrator` (Orchestrator (Argon), conto `argon`), in prova a tetto 1, senza browser, non orchestrabili senza la casella; sforzo come suffisso `-high|-xhigh`, mai `--effort` su agy. Non misurati: contatori e rapporti 5h/settimana (prime righe di `consumi.jsonl`).
- **Carte fatte a mano (step 41):** T293-T296 integrati (kernel 0.5.8).
- **NPC coeso (step 39):** T327, T332 integrati (kernel 0.5.4) → T245g-i.
- **Nodi MJ (step 30):** T333-T339 integrati (kernel 0.6.3, ADR-0171..0179).

## Pronti e priorità

0. **In corso:** T310b (fable, sospeso al limite 5h, riprende alle 23:01 UTC / 00:01 CET). **Pronti:** T362, T370, T366 (fable, dopo T310b), T372, T374 (claude, fermi per 5h a 0 % fino alle 22:59 UTC); poi T373→T375→T377, T376; T363→T364/T367/T368, T365. T355 `in attesa` fino al 15/11. Fable si esaurisce prima del reset: niente spostamenti su claude per ora.
1. **Da approvare dall'autore:** T369 (dopo).
2. **Crediti (13/11 20:52 UTC):** Claude settimana 54 %, 5h 0 % (reset 22:59 UTC); Fable settimana 25 % (9 % effettivo); Gemini/Hydrogen 98 % (reset 15/11); Argon 71 %; agy Claude 100 %.

## Attese dall'autore

- **D35 (piano di lancio):** in analisi dall'autore per i primi prerequisiti (D3.1 account HN/Reddit da subito).

## Regole attive

- Tetti dell'autore (3 Claude, 1 agy); finestra 5h protetta dallo script; nessun ripiego; Argon solo task piccoli; Fable 5.2 (più forte di Opus 5.5): l'orchestratore ci sposta liberamente i task, senza chiedere, con lo stesso sforzo che avrebbe Opus (autore 12/11).
- Domande per intero in chat con raccomandazione. Finestra 5h con l'ora del reset. Sforzo: qualità prima del tempo. Mai `git commit -a` nel base.

## Ultime 2 epoche

- **387 (argon):** T310b sospeso al limite 5h (reset 22:59 UTC, riprende alle 23:01 UTC).
- **385 (claude):** D54 chiusa (5: via di mezzo); pianificati T372-T377, T366 allargato.
