# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 12/11/2026, epoca 356 (claude). Crediti: vedi `stato`.

## Stato attuale

- **Sei fasi (autore, 10/11):** I kernel 0.9.0, II closed beta, III kernel 1.0.0, **IV open beta** (OpenRouter, hosting esterno e self-hosting, niente partita IVA ora), V raffinamento, VI produzione (Stripe, quote carte). Step 43 aperto con T345 (in coda).
- **Nuovo generatore MJ (autore, 10/11):** D48 chiusa con D integrata (T346 approvato: porte torri, merli, feritoie, staccionata, via animali dal modello MJ verso Narratore/Scenografo, campi incastrati e varianza T339 + architettura T338, tetti gargantua con `<pieces>`).
- **Vestiti e armature (step 40):** T290 integrato (ADR-0180, `<worn>`); T353 integrato (ADR-0181, kernel 0.6.5: abiti degli individui dalla scheda o dal mestiere); mancano cambio d’abito dopo l’individuazione, abiti nella scheda dell’Attore, gambe/piedi/mani.
- **Launcher (D51.2):** T233 integrato (`492b5e5e`): la home è il launcher; «in gioco ora» provato solo con `/api/session` simulata.
- **Jev nel gioco (D45):** T348 integrato (varco `TypeSafeGate`, strato `decide`, ADR-0157 accettato, V-034 chiusa); non provato contro TypeSafe vero; segue T349.
- **Campagna del Master (autore, 10/11):** spese universo a carico del master, universo privato su invito, velocità/pausa di generazione, direttive della campagna nel Referente iniettate per competenza, controllo preventivo cartografia → proposto T347 (step 43).
- **Claude Fable (autore, 10/11):** reset settimanale giovedì 12/11 16:00; adozione intensiva da giovedì per massimizzare il reset di Fable (portare Fable a 100% con altri <50%, poi reset).
- **Domande chiuse (10/11):** D45 (Jev, ZDR spiegato), D47 (vestiti C+B), D48 (strutture D integrata), D49 (carte solo uso reale), D50 (gestito + self-hosting in VI), D51 (T345 e contatore vesti).
- **Carte fatte a mano (step 41):** T293-T296 integrati (kernel 0.5.8).
- **NPC coeso (step 39):** T327, T332 integrati (kernel 0.5.4) → T245g-i.
- **Nodi MJ (step 30):** T333-T339 integrati (kernel 0.6.3, ADR-0171..0179).

## Pronti e priorità

0. **In corso/pronti:** T357 (claude, p1: kernel 0.6.6 dopo T353+T348, suite insieme), T346 (fable high), T345, T347 (fable high, approvato), T349→T350 (Jev nel gioco, D45), T352; bloccati T351, T354→T355 (non prima del 15/11), T356.
1. **Da approvare dall'autore:** T310b (lingua interna campi schemi, extra 6% p4).
2. **Crediti (12/11 23:15):** Claude settimana 91 %, 5h 77 % (reset 02:59 UTC); Fable settimana 91 %, 5h 75 %; Gemini 98 %; Argon 92 %; agy 100 %. Generatore acceso, fermo (avanzo negativo).

## Attese dall'autore

- **D35 (piano di lancio):** in analisi dall'autore per i primi prerequisiti (D3.1 account HN/Reddit da subito).
- **Approvazione proposte:** T310b (schema campi inglese).

## Regole attive

- Tetti dell'autore (3 Claude, 1 agy); finestra 5h protetta dallo script; nessun ripiego; Argon solo task piccoli; Fable 5.2 (più forte di Opus 5.5): l'orchestratore ci sposta liberamente i task, senza chiedere, con lo stesso sforzo che avrebbe Opus (autore 12/11).
- Domande per intero in chat con raccomandazione. Finestra 5h con l'ora del reset. Sforzo: qualità prima del tempo. Mai `git commit -a` nel base.

## Ultime 2 epoche

- **356 (claude):** T353 e T348 integrati (entrambi a kernel 0.6.5) → T357 per 0.6.6 e la suite insieme.
- **355 (argon):** rotazione su Argon per finestra 5h di Claude a 0 % (reset 22:00 UTC); T353 in attesa del reset (22:01 UTC).
