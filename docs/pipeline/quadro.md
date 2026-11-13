# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 13/11/2026, epoca 369 (claude). Crediti: vedi `stato`.

## Stato attuale

- **Sei fasi (autore, 10/11):** I kernel 0.9.0, II closed beta, III kernel 1.0.0, **IV open beta** (OpenRouter, hosting esterno e self-hosting, niente partita IVA ora), V raffinamento, VI produzione (Stripe, quote carte). Step 43: T345 integrato (`e2ac9a0c`, studio `docs/design/open-beta.md`, ADR-0184 proposto) → D52 con 7 domande; i 10 task dello studio si pianificano dopo le risposte.
- **Nuovo generatore MJ (autore, 10/11):** T346 integrato (`598dbeff`): parti abitabili come sottoblocchi `<import>`, aree delle strutture, `mapsBackToBox`, fattoria e forte del banco rifatti. T354 e T359 integrati (`a19c8fca`, `65402d74`, ADR-0183, kernel 0.6.10): prompt strutture senza scheletro a 3 livelli sul piano a 1/5, due blocchi col ritorno in testo, parti del seme nella richiesta, `part-stair` tollerante, villetta e rocca nel banco e nel lab 3D. Mancano: aree usate da Narratore/Scenografo, giro dello Scultore su Gemini (T355, in attesa fino al 15/11), tetto voxel (T356), scala cortile→camminamento del forte.
- **Vestiti e armature (step 40):** T290 integrato (ADR-0180, `<worn>`); T353 integrato (ADR-0181, kernel 0.6.5: abiti degli individui dalla scheda o dal mestiere); mancano cambio d’abito dopo l’individuazione, abiti nella scheda dell’Attore, gambe/piedi/mani.
- **Launcher (D51.2):** T233 integrato (`492b5e5e`): la home è il launcher; «in gioco ora» provato solo con `/api/session` simulata.
- **Jev nel gioco (D45):** T348 integrato (varco `TypeSafeGate`, strato `decide`, V-034 chiusa); T349 integrato (`model.reuse` nel `ModelDirector`, −16 % sculture stimato); T350 integrato (`2e733d0e`, kernel 0.6.9: guardie `text.guard` locali alle 5 porte senza inviare il testo del viandante a Jev finché `JEV_ZERO_RETENTION` è falso, e quarta parete `text.fourthwall` con `metaBreak` + Jev su Fucina, individui, schede Attore e trame, escluse le battute). Non provato contro TypeSafe vero né su traffico reale; manca la stima nella lobby multigiocatore; segue T351.
- **Campagna del Master (autore, 10/11):** spese universo a carico del master, universo privato su invito, velocità/pausa di generazione, direttive della campagna nel Referente iniettate per competenza, controllo preventivo cartografia → proposto T347 (step 43).
- **Claude Fable (autore, 10/11):** reset settimanale giovedì 12/11 16:00; adozione intensiva da giovedì per massimizzare il reset di Fable (portare Fable a 100% con altri <50%, poi reset).
- **Domande chiuse (10/11):** D45 (Jev, ZDR spiegato), D47 (vestiti C+B), D48 (strutture D integrata), D49 (carte solo uso reale), D50 (gestito + self-hosting in VI), D51 (T345 e contatore vesti).
- **Carte fatte a mano (step 41):** T293-T296 integrati (kernel 0.5.8).
- **NPC coeso (step 39):** T327, T332 integrati (kernel 0.5.4) → T245g-i.
- **Nodi MJ (step 30):** T333-T339 integrati (kernel 0.6.3, ADR-0171..0179).

## Pronti e priorità

0. **In corso/pronti:** T356 su Fable (dalle 13:04 UTC); pronti T347 (Fable), T351 e T352 (Claude); T355 `in attesa` fino al 15/11 (D48 passo 3).
1. **Da approvare dall'autore:** T310b (lingua interna campi schemi, extra 6% p4).
2. **Crediti (13/11 13:25 UTC):** Claude settimana 65 %, 5h 56 % (reset 18:00 UTC); Fable settimana 43 %, 5h 63 %; Gemini 98 %; Argon 76 %; agy 100 %. Generatore acceso, fermo (avanzo negativo).

## Attese dall'autore

- **D35 (piano di lancio):** in analisi dall'autore per i primi prerequisiti (D3.1 account HN/Reddit da subito).
- **Approvazione proposte:** T310b (schema campi inglese).
- **D52 (ADR-0184, open beta):** 7 domande di T345, tutte con consiglio «sì».

## Regole attive

- Tetti dell'autore (3 Claude, 1 agy); finestra 5h protetta dallo script; nessun ripiego; Argon solo task piccoli; Fable 5.2 (più forte di Opus 5.5): l'orchestratore ci sposta liberamente i task, senza chiedere, con lo stesso sforzo che avrebbe Opus (autore 12/11).
- Domande per intero in chat con raccomandazione. Finestra 5h con l'ora del reset. Sforzo: qualità prima del tempo. Mai `git commit -a` nel base.

## Ultime 2 epoche

- **369 (claude):** lanciati T356 (Fable) e T345 (Claude); T345 integrato (`e2ac9a0c`), domande D52 all'autore.
- **368 (argon):** riavvio dopo `ferma --ora` (12:25 UTC): nessun task in corso né da integrare; coda pronta per il reset 5h delle 12:59 UTC (13:59 ora locale).
