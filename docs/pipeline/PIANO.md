# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-29T21:04:35.328Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

- **claude**: settimana 89 %, 5 ore 97 % (letto da /usage il 2026-10-29T21:04:30.976Z)
  - session, 5h: 97 % residuo, reset 2026-10-30T01:59:00.000Z
  - week (all models), settimana: 89 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 91 %, 5 ore 68 % (letto da /usage il 2026-10-29T21:04:35.323Z)
  - Gemini Models, settimana: 91 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 68 % residuo, reset 2026-10-29T22:37:53.000Z
- **argon**: settimana 64 %, 5 ore 100 % (letto da /usage il 2026-10-29T21:04:35.323Z)
  - Gemini 4 Argon, settimana: 64 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (7)

- **T51** Il livello del mare e un motore dell'acqua — ESITO: fallito (codice 1) — claude, 6 %
- **T53** Le scale come rampe e le strutture su più piani — ESITO: fallito (codice 1) — claude, 6 %
- **T43c** Morte e ricollegamento in multigiocatore — ESITO: fatto — Morte di un giocatore sul server con la punizione di T33 senza fermare gli altri (avviso `morte` al client), salvataggio di `pos` in `world/giocatori/<id>.json` e ricollegamento completo (ADR-0074). — argon, 5 %
- **T30** Immagini del 3D nel README — ESITO: fatto — quattro schermate del 3D in docs/img/3d/ e reinserite nel README — gemini, 2 %
- **T63** I modelli disegnati a mano per i file della corona — ESITO: fatto — Portati i modelli `schermo-scritte`, `schermo-struttura` e `circuito-3D` nella libreria, integrati negli scaffali della corona con animazioni e menzionati nei prompt dello Scultore — gemini, 4 %
- **T66** Riorganizzare la documentazione per metodologia — ESITO: fatto — archiviati i documenti delle 3 metodologie precedenti in docs/archivio/ (1-thread-unico, 2-step, 3-to-do-backlog) mantenendo intatti contenuti e link relativi interni; redatto docs/README.md con resoconto metodologico e tabella di corrispondenza; aggiornati percorsi in AGENTS.md e README.md; conservati intatti i file attivi di pipeline, backlog, to-do, adr e design. — gemini, 3 %
- **T68** Generare l'universo con gli abbonamenti — ESITO: fatto — T68 spezzato in T68a/T68b/T68c; T68a fatto: tabella `ai.provider`/`agenti`, `RoutedModels`, `QueueModels`, coda su disco `/api/coda`, chiamate degli abbonamenti a zero dollari nel registro, ADR-0073. — claude, 8 %

## Pronti, in ordine di priorità (0)

_nessuno_

## Da approvare (provider e stima proposti) (0)

_nessuno_

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (3)

- **T56b** Il salto, e le cose che chiudono i sentieri — claude, 4 % (aspetta T53)
- **T57** Le rune come codice: sequenze ordinate, effetti, rune nuove — claude, 8 % (aspetta T51)
- **T64** Le varianti precalcolate dei modelli pesanti — gemini, 5 % (aspetta T63)

## In attesa dell'autore (4)

- **T52** I sotterranei
- **T54** Le taglie di D&D per strutture e creature
- **T44b** L'account e l'autenticazione
- **T45** Crediti, lobby, carte e server su Google Cloud
