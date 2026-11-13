# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 13/11/2026, epoca 361 (claude). Crediti: vedi `stato`.

## Stato attuale

- **Sei fasi (autore, 10/11):** I kernel 0.9.0, II closed beta, III kernel 1.0.0, **IV open beta** (OpenRouter, hosting esterno e self-hosting, niente partita IVA ora), V raffinamento, VI produzione (Stripe, quote carte). Step 43 aperto con T345 (in coda).
- **Nuovo generatore MJ (autore, 10/11):** T346 integrato (`598dbeff`): parti abitabili come sottoblocchi `<import>`, aree delle strutture, `mapsBackToBox`, fattoria e forte del banco rifatti. Mancano: aree usate da Narratore/Scenografo, Scultore su Gemini (T354, T355), tetto voxel (T356), scala cortile→camminamento del forte. T346 diceva kernel 0.6.6 come T357 → T358 (0.6.7 + suite).
- **Vestiti e armature (step 40):** T290 integrato (ADR-0180, `<worn>`); T353 integrato (ADR-0181, kernel 0.6.5: abiti degli individui dalla scheda o dal mestiere); mancano cambio d’abito dopo l’individuazione, abiti nella scheda dell’Attore, gambe/piedi/mani.
- **Launcher (D51.2):** T233 integrato (`492b5e5e`): la home è il launcher; «in gioco ora» provato solo con `/api/session` simulata.
- **Jev nel gioco (D45):** T348 integrato (varco `TypeSafeGate`, strato `decide`, V-034 chiusa); T349 integrato (13/11, `model.reuse` nel `ModelDirector`, −16 % sculture stimato, kernel 0.6.7 senza T346); non provato contro TypeSafe vero; manca la stima nella lobby multigiocatore; segue T350.
- **Campagna del Master (autore, 10/11):** spese universo a carico del master, universo privato su invito, velocità/pausa di generazione, direttive della campagna nel Referente iniettate per competenza, controllo preventivo cartografia → proposto T347 (step 43).
- **Claude Fable (autore, 10/11):** reset settimanale giovedì 12/11 16:00; adozione intensiva da giovedì per massimizzare il reset di Fable (portare Fable a 100% con altri <50%, poi reset).
- **Domande chiuse (10/11):** D45 (Jev, ZDR spiegato), D47 (vestiti C+B), D48 (strutture D integrata), D49 (carte solo uso reale), D50 (gestito + self-hosting in VI), D51 (T345 e contatore vesti).
- **Carte fatte a mano (step 41):** T293-T296 integrati (kernel 0.5.8).
- **NPC coeso (step 39):** T327, T332 integrati (kernel 0.5.4) → T245g-i.
- **Nodi MJ (step 30):** T333-T339 integrati (kernel 0.6.3, ADR-0171..0179).

## Pronti e priorità

0. **In corso/pronti:** T358 (riprende dopo T349: `merge 3d`, kernel 0.6.8, suite con T346+T349; priorità 1), T350 (dopo T349), T347 (fable high), T345, T352; bloccati T351, T354→T355 (non prima del 15/11), T356.
1. **Da approvare dall'autore:** T310b (lingua interna campi schemi, extra 6% p4).
2. **Crediti (13/11 04:20):** Claude settimana 81 %, 5h 63 % (reset 08:00 UTC); Fable settimana 72 %, 5h 62 %; Gemini 98 %; Argon 91 %; agy 100 %. Generatore acceso, fermo (avanzo negativo).

## Attese dall'autore

- **D35 (piano di lancio):** in analisi dall'autore per i primi prerequisiti (D3.1 account HN/Reddit da subito).
- **Approvazione proposte:** T310b (schema campi inglese).

## Regole attive

- Tetti dell'autore (3 Claude, 1 agy); finestra 5h protetta dallo script; nessun ripiego; Argon solo task piccoli; Fable 5.2 (più forte di Opus 5.5): l'orchestratore ci sposta liberamente i task, senza chiedere, con lo stesso sforzo che avrebbe Opus (autore 12/11).
- Domande per intero in chat con raccomandazione. Finestra 5h con l'ora del reset. Sforzo: qualità prima del tempo. Mai `git commit -a` nel base.

## Ultime 2 epoche

- **361 (claude):** T358 aveva ripreso la conversazione vecchia (0.6.7 senza T349): worktree e ramo tolti, riparte da capo per 0.6.8. T354 in corso su Fable.
- **360 (claude):** T349 integrato; T358 interrotto e riscritto per 0.6.8 (T349 aveva preso 0.6.7).
