# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 27/11/2026 18:34 CET, epoca 731 (neon). Crediti: vedi `stato`.

## Stato attuale

- **Obiettivo imminente (scadenza 1/12):** arrivare al **28-29/11** col nuovo motore MarkovJunior allineato (catena **A1**, T525-T535) e le prove sulle strutture modulari chiuse, per lanciare la generazione degli universi coi **100 $ di crediti API Anthropic** (scadono l'1/12; generatore già predisposto con **T542** integrato). **Soglia concordata:** aspettare al massimo il **27 o 28 sera**; se catena/ecosistema non sono pronti, partire comunque con la generazione per non sprecare i 100 $.
- **Catena A1 (allineamento MJ, step 44, p0):** integrati T525, T526, T527, T528 (via T558, `c2ae1a05`, ADR-0273, kernel `0.10.46`), T529 (`93fb97da`, ADR-0274: `path`/`convolution`/`convchain`/`d`, 21/36 modelli voxel per voxel), T531. **In corso (sospeso per limite 5h):** **T530** (A1-5 `wfc` e inferenza, claude max). Seguono a p0: T532 → T533 (migrazione 0.10→0.11) → T534, T535; poi a p2 T536-T539.
- **Strutture modulari (step 44):** **i quartieri di T543 restano validi** (l'autore li preferisce alle foto degli estratti di T557). **T557** (terza prova, claude max, solo `lab/` e `docs/`) è **sospeso per limite 5h** praticamente finito e si chiude/integra alle 19:01. **T559** (quarta prova, claude high, 4 %, p1, approvato, dipende da T557) già in coda su `lab/banco/conferma/` per **`moderna`** (confronto diretto con `villa` di T543), **`steampunk`** e **`locanda`**.
- **Terreno 3D e copertura (step 45):** rilievo vero, fondale, cascate, strati e regola 10 integrati (T474-T480, T482, T509); copertura C1 (`T545`), grana C3 (`T547`), rientro C4 (`T548`), semi C8 (`T552`) integrati; pronti C2 (`T546`), C5 (`T549`), C6 (`T550`), C7 (`T551`), poi C9 (`T553`).
- **Fasi e piattaforma:** Fase I/II in corso (run #2: T510, T513, T514 integrati; pronto T511→T512); Fase IV open beta preparata (T361-T368 integrati: OpenRouter PKCE + ZDR, `QUINE_PAGAMENTI=spenti`, inviti, Dockerfile/compose, `site/ia.html`; da provare su VM con T45f). Acqua/spazio (step 37): integrati T437-T449 (nuoto, veicoli, arcipelago, porti, vuoto, capsule, pianeti, aria); restano T444, T450.

## Pronti e priorità

- **Spegnimento e ripresa (27/11 17:13Z `ferma --ora`):** `daIntegrare`: nessuno. **Fermi per limite 5h Claude:** **T530** (p0, A1-5) e **T557** (p1, strutture modulari) — riprendono in automatico al reset delle **18:59-19:01 CET** (17:59-18:01Z); appena T557 è integrato parte **T559** (p1).
- **Crediti al 27/11 18:34 CET (residuo):** `claude` settimana 65 % (reset 3/12 16:00Z), **5h 0 % fino alle 19:00 CET** (tetto 3); `fable` sospeso; `agy` (`neon`/`hydrogen`/`gemini`/`argon`/`orchestrator`) Gemini Models settimana 87 %, 5h 98 % (reset 23:14 CET, tetto 1). `generatore` acceso ma fermo finché Claude è fermo.
- **Pronti in coda (tutti su `claude`):** p1 `T511` (più `T559` bloccato su `T557`); p2 `T546`, `T549`, `T550`, `T551`, `T519`, `T520`, `T523`, `T481`, `T483`; p3 `T541`. `daApprovare`: `T369`.

## Attese dall'autore

- **D/T524** (7 domande col consiglio, catena P1-P7 ~17 %; graphify solo col permesso): aperta dal 27/11 13:10 CET.
- **D/T516** (Neon esce dalla prova? 3 opzioni, consiglio 1: tetto 2, moltiplicatore 1,25): aperta dal 27/11 13:10 CET.
- **D/T557 → D/T559:** domande sulle strutture modulari da presentare in blocco dopo T557 + T559 (con gli estratti da `conferma`).
- Restano D3.4 (Fase VI), T45f (`domande/T45f.md`) e V1-V12 di D35 prima del lancio.

## Regole attive

- **Regime incrementato fino al 28-29/11 (autore 26-27/11):** sfruttare aggressivamente la settimana di Claude (slot pieni, sforzi alti) per chiudere **A1** (p0: T530→T535) e le prove modulari prima della generazione con i **100 $ API Anthropic** (scadono l'1/12). Se il 27 o 28 sera A1/ecosistema non è pronto, partire comunque con la generazione per non sprecare i 100 $.
- **Presenza dell'autore:** tornato presente dalle **18:00 CET del 27/11** (era assente fino alle 13:00 e 14:00-18:00 CET). Registrare qui ogni futura finestra di assenza per non fargli domande mentre è via.
- **Tetti e modelli:** tetti fissi dell'autore (3 Claude, 1 agy); finestra 5h protetta dallo script (priorità 0 la scavalca); nessun ripiego; `fable` sospeso (regime normale solo per task difficilissimi); `neon`/`hydrogen`/`orchestrator` in prova su `agy` senza browser (mai architettura, kernel, sicurezza o MarkovJunior).
- **Qualità e disciplina:** sforzo alto (qualità prima del tempo); domande per intero in chat con raccomandazione; finestra 5h sempre con ora del reset; mai `git commit -a` nel base (mai committare file dell'autore).

## Ultime 2 epoche

- **731 (neon):** autore conferma piano A, tiene validi i quartieri di T543 e sceglie la terna `moderna` + `steampunk` + `locanda`; pianificato e approvato **T559** (claude high, 4 %, p1, dipende da T557, step 44).
- **730 (neon):** ripresa dopo spegnimento `ferma --ora` (17:13Z) con Claude a 0 % (5h, reset 18:59 CET). Quadro riscritto con regime incrementato, scadenza 100 $ Anthropic (1/12, ripiego 27-28 sera), presenza autore e chiarimento T557 (`lab/banco/conferma/`). Proposta T559 all'autore; nessuna integrazione pendente.
