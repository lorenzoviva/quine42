# L'orchestrazione della pipeline

> La memoria tra un orchestratore e il successivo (`docs/pipeline/orchestra.md`). Il **passaggio di consegne** lo riscrive
> l'orchestratore; il **diario** in fondo lo allunga lo script (lanci, esiti, limiti, integrazioni) e l'orchestratore con `nota`.

## Passaggio di consegne

Aggiornato il 29/10/2026 sera, orchestratore `claude` (Claude Code), dopo la prima esecuzione completa (T43b, T44a, T65, T68, T63,
T66, T43c, T30).

- **In corso / in coda**: T51 e T53 rimessi in coda con `riprendi` (riprendono la loro conversazione: si erano fermati al limite
  delle 5 ore). `esegui` non gira: rilancialo.
- **Da integrare**: nessuno. Tutto ciò che è finito è nel base (`3d`), con gli ADR rinumerati: 0073 «Altro…» e PvP (T43b),
  0074 profilo (T44a), 0075 lessico (T65), 0076 morte e ricollegamento (T43c), 0077 abbonamenti (T68).
- **Verifiche nel browser da fare** (le chiede il «Fatto quando»): T44a (due schede: profilo, mantello, «Chi è», nome doppio,
  ricarica) e T43c (due schede: morte di un giocatore, gli altri continuano, uscita e rientro). Vanno delegate a un subagente
  (`orchestra.md`, punto 3); il primo tentativo per T44a si è fermato al limite.
- **Da approvare** (pianificati il 29/10 sera, priorità al multigiocatore): T44b (account), T45a (crediti), T45b («Low Detail»),
  T45c (eredità dei cloni), T68b (il servitore della coda); dopo di loro T45d, T45e, T45f, T68c.
- **Domande aperte**: `domande/T52.md` (sotterranei), `domande/T54.md` (taglie).
- **Da sapere**: `tests/referente.test.ts` e `tests/determinism.test.ts` a volte falliscono nella suite intera e passano da soli;
  `docs/plans/multiplayer.md` è finito in `docs/archivio/` con T66 ma è ancora il piano del multigiocatore.
- **Prossimo passo**: approvare, `node tools/pipeline/pipeline.mjs esegui`, verificare T44a e T43c nel browser.

## Diario

- [2026-10-29T18:52:35.129Z] lancio T43b su claude (H:\projects\rune\.claude\worktrees\t43b)
- [2026-10-29T18:52:35.878Z] lancio T44a su claude (H:\projects\rune\.claude\worktrees\t44a)
- [2026-10-29T18:52:36.528Z] lancio T63 su gemini (H:\projects\rune\.claude\worktrees\t63)
- [2026-10-29T18:52:37.298Z] lancio T66 su gemini (H:\projects\rune\.claude\worktrees\t66)
- [2026-10-29T18:52:38.008Z] lancio T65 su claude (H:\projects\rune\.claude\worktrees\t65)
- [2026-10-29T19:01:35.956Z] T43b: ESITO: fatto — «Altro…» su un altro viandante (solo con `altroTraGiocatori`), effetti applicati dal server sul suo corpo, ciò che ferisce solo con `pvp`, sul master solo parole; ADR-0073 e 3 test. (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T43b)
- [2026-10-29T19:02:11.247Z] lancio T68 su claude (H:\projects\rune\.claude\worktrees\t68)
- [2026-10-29T19:06:04.643Z] T44a: ESITO: fatto — profilo del viandante (nome, seme, mantello, presentazione) riparato dal server, salvato, dato agli altri client e al Narratore, con il pannello `P`; verifica con due schede nel browser non fatta (niente strumenti del browser) (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T44a)
- [2026-10-29T19:06:12.229Z] lancio T51 su claude (H:\projects\rune\.claude\worktrees\t51)
- [2026-10-29T19:06:41.351Z] T65: ESITO: fatto — lessico del seme (`world/lessico.md`, 18 voci, 5 parole sostituite) nel contesto di Narratore e Arbitro, al più 3 usanze per bibbia, controllo anti-glossario dentro `metaBreak`, ADR-0073, test. (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T65)
- [2026-10-29T19:07:14.040Z] lancio T53 su claude (H:\projects\rune\.claude\worktrees\t53)
- [2026-10-29T19:10:02.977Z] T68: ESITO: fatto — T68 spezzato in T68a/T68b/T68c; T68a fatto: tabella `ai.provider`/`agenti`, `RoutedModels`, `QueueModels`, coda su disco `/api/coda`, chiamate degli abbonamenti a zero dollari nel registro, ADR-0073. (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T68)
- [2026-10-29T19:10:14.105Z] T43c: claude non può, va su argon
- [2026-10-29T19:10:14.707Z] lancio T43c su argon (H:\projects\rune\.claude\worktrees\t43c)
- [2026-10-29T19:10:41.235Z] T66: ESITO: fatto — archiviati i documenti delle 3 metodologie precedenti in docs/archivio/ (1-thread-unico, 2-step, 3-to-do-backlog) mantenendo intatti contenuti e link relativi interni; redatto docs/README.md con resoconto metodologico e tabella di corrispondenza; aggiornati percorsi in AGENTS.md e README.md; conservati intatti i file attivi di pipeline, backlog, to-do, adr e design. (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T66)
- [2026-10-29T19:11:16.737Z] lancio T30 su gemini (H:\projects\rune\.claude\worktrees\t30)
- [2026-10-29T19:15:10.787Z] T51: ESITO: fallito (codice 1) (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T51)
- [2026-10-29T19:15:13.436Z] T53: ESITO: fallito (codice 1) (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T53)
- [2026-10-29T19:30:45.569Z] T63: ESITO: fatto — Portati i modelli `schermo-scritte`, `schermo-struttura` e `circuito-3D` nella libreria, integrati negli scaffali della corona con animazioni e menzionati nei prompt dello Scultore (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T63)
- [2026-10-29T19:46:56.217Z] T43c: ESITO: fatto — Morte di un giocatore sul server con la punizione di T33 senza fermare gli altri (avviso `morte` al client), salvataggio di `pos` in `world/giocatori/<id>.json` e ricollegamento completo (ADR-0074). (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T43c)
- [2026-10-29T19:54:37.750Z] T30: ESITO: fatto — quattro schermate del 3D in docs/img/3d/ e reinserite nel README (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T30)
- [2026-10-29T21:00:00.000Z] nota: integrati T43b, T44a (ADR del profilo 0073 → 0074), T65 (lessico 0073 → 0075), T43c (morte 0074 → 0076; conflitti in kernel.ts e wanderers.ts: `profilo` e `pos` tenuti entrambi), T68 (abbonamenti 0073 → 0077), T66, T63, T30. Test verdi dopo ogni merge (475 dopo T43c, 485 dopo T68).
- [2026-10-29T21:05:00.000Z] nota: T66 ha archiviato in docs/archivio/ anche docs/plans/multiplayer.md (ancora il piano attivo di T44b e T45): 20 link del backlog ricollegati (commit 44719a3).
- [2026-10-29T21:06:00.000Z] nota: tests/referente.test.ts (3 test) fallisce a volte con la suite intera e passa da solo; come tests/determinism.test.ts in T43a.
- [2026-10-29T21:07:00.000Z] nota: T51 e T53 «falliti» erano il limite delle 5 ore di Claude («You've hit your 5-hour limit · resets 10pm»), non riconosciuto da usageLimit; corretto, e `riprendi`. In pipeline.mjs c'erano caratteri backspace veri al posto di `\b429\b`.
- [2026-10-29T21:08:00.000Z] nota: verifica nel browser di T44a delegata a un subagente: fermato dal limite delle 5 ore dopo l'avvio del server e la prima scheda (nessun esito). T43c (morte, ricollegamento, due schede) non verificato.
- [2026-10-29T21:23:54.971Z] T51: rimesso in coda (riprende la sua conversazione)
- [2026-10-29T21:23:55.040Z] T53: rimesso in coda (riprende la sua conversazione)
- [2026-10-29T21:26:28.866Z] riprendo T51 su claude (H:\projects\rune\.claude\worktrees\t51)
- [2026-10-29T21:26:28.890Z] riprendo T53 su claude (H:\projects\rune\.claude\worktrees\t53)
- [2026-10-29T21:26:30.319Z] lancio T64 su gemini (H:\projects\rune\.claude\worktrees\t64)
- [2026-10-29T21:32:16.155Z] T64: ESITO: fallito (codice 1) (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T64)
- [2026-10-29T21:32:32.009Z] T64: rimesso in coda (riprende la sua conversazione)
- [2026-10-29T21:32:32.211Z] nota: T64: connessione con agy interrotta (stream lost), non un errore del task: riprendi
- [2026-10-29T21:32:37.238Z] riprendo T64 su gemini (H:\projects\rune\.claude\worktrees\t64)
- [2026-10-29T21:34:36.158Z] T53: ESITO: fatto — T53a: le scale sono rampe (ogni colonna ha il suo pavimento, si sale al più un gradino alla volta, i muri restano muri); T53b (più piani) resta da fare. (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T53)
- [2026-10-29T21:34:58.486Z] task/T53 integrato in 3d; worktree e branch tolti.
- [2026-10-29T21:35:39.241Z] lancio T53b su claude (H:\projects\rune\.claude\worktrees\t53b)
- [2026-10-29T21:35:41.516Z] lancio T56b su claude (H:\projects\rune\.claude\worktrees\t56b)
- [2026-10-29T21:41:14.696Z] T51: ESITO: in attesa — T51a fatto (livello del mare, laghi e fiumi a un solo livello tra i chunk, mai sopra la riva, test e verifica nel browser); T51b aspetta la risposta in `docs/pipeline/domande/T51.md`. (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia T51)
- [2026-10-29T21:50:47.762Z] nota: verifica nel browser di T44a e T43c (subagente, 4025cba): profilo, nome doppio riparato, morte di un giocatore (gli altri continuano), uscita e rientro con posizione, inventario e bisogni OK; KO «Chi è» nel client sottile e il profilo di localStorage condiviso tra viandanti (sovrascrive quello salvato): task T44c
