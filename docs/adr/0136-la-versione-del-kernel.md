# ADR-0136 — La versione del kernel: `X.Y.Z`, e un contratto nuovo vuole un universo nuovo

Data: 2026-11-05 · Stato: accettato (task T260 del backlog) · Riferimenti: D32 dell'autore (04/11), T183 (`docs/design/espressivita.md`, regola 7 dei cambi senza wipe), ADR-0021 (due repository), ADR-0128 (fasi e step)

## Contesto

Un universo vive mesi, il kernel cambia ogni giorno. T183 ha misurato che quasi tutto ciò che si aggiunge al kernel è aggiuntivo, ma che alcune cose non lo sono (il caso, MarkovJunior, `layout`, un'API tolta), e che nessun file dell'universo dice con quale kernel è nato: un universo più nuovo del kernel che lo apre si rovinerebbe senza che nessuno lo dica. L'autore (D32) ha deciso che una versione incompatibile del kernel **non è vincolata** dalla retrocompatibilità: chi vuole giocare sul kernel nuovo comincia un universo nuovo; i vecchi girano sul server della loro versione o, in futuro, migrano con l'IA a pagamento. Il versionamento parte subito, da `0.1.0`.

## Decisione

1. **`X.Y.Z` = era . contratto . incremento.**
   - `X` è `0` durante lo sviluppo e la beta (Fase I e II), `1` dal kernel `1.0.0` (Fase III e IV).
   - `Y` sale di uno quando un cambio di `src/kernel/` rompe il contratto con gli universi che esistono: un formato di `world/`, `maps/` o `modules/`, il senso di una primitiva, le regole del terreno, il caso o ciò che è derivato e non salvato. È `9` al congelamento della beta (`0.9.0`, criterio 8 della Fase I). Quando sale `Y`, `Z` torna a `0`.
   - `Z` sale di uno a ogni task integrato che cambia `src/kernel/` restando compatibile con gli universi della stessa `X.Y` (correzioni, misure, aggiunte che un universo di prima non nota).
2. **`KERNEL_VERSION`** sta in `src/kernel/version.ts` ed è uguale a `version` di `package.json` (un test lo afferma). Chi cambia `src/kernel/` aggiorna entrambi.
3. **`universe.json → kernel`** dice il kernel che ha scritto l'universo. Il seme lo porta; il kernel lo scrive prima di ogni commit (`beforeCommit` → `stampKernel`) in un universo compatibile, quindi alla creazione e a ogni salvataggio. Un universo che non lo dice è nato prima del versionamento, da un kernel del primo contratto: vale `0.1.0` e riceve il campo al commit dopo.
4. **`checkKernelVersion(universo, kernel)`**, funzione pura, al caricamento di ogni universo (`applyFiles`): compatibile se stesso `X.Y` e `Z` dell'universo non sopra quello del kernel. Altrimenti il mondo resta in piedi (regola 7) con il guasto `universe:kernel`, il cui testo dice le due versioni e cosa fare (un universo nuovo, o il server della versione `X.Y`); come `universe:config` impedisce i commit del codice, e il kernel non scrive mai la sua versione su un universo che non è suo.
5. **Un effetto senza chi lo applica è un guasto** (`effect:<tipo>`), non un silenzio. Il kernel applica `rilievo` e gli effetti sociali; per gli altri chiede a `core.effects` `M.handles(tipo)`. Un `core.effects` riscritto prima che `handles` esistesse applica gli effetti del contratto 0.1 (la lista `CORE_EFFECTS_0_1` del kernel) e nessun altro: un effetto nuovo che il suo `core.effects` non conosce si vede nei guasti. Senza `core.effects`, ogni effetto che non è del kernel è un guasto. È la trappola 3 di T183 (`TRAP: in a universe that rewrote core.effects`), che ora è un test che riesce.

## Alternative scartate

- **La retrocompatibilità per sempre tra contratti diversi**: lega ogni evoluzione (l'immersione in acqua, un caso migliore) agli universi di ieri; l'autore l'ha esclusa.
- **Congelare i luoghi come caselle** (`plan.tiles`, T261): annullato in D32 per la stessa ragione; dentro la stessa `X.Y`, piano e seme più `plan.edits` sono già deterministici.
- **Rifiutare di aprire un universo incompatibile** (eccezione al caricamento): il kernel è il pavimento, sopravvive; il guasto lo dice al master e ferma i commit.

## Conseguenze

- `AGENTS.md`: chi tocca `src/kernel/` aggiorna `KERNEL_VERSION` e `package.json` secondo `Y` o `Z`. `docs/fasi.md`: il criterio 5 della Fase I si legge così (ciò che non entra senza wipe aspetta la `0.9.0`, il contratto della beta), il criterio 8 vuole `0.9.0` in tutte e tre le righe.
- Il server della beta e quello della produzione apriranno universi di versioni diverse: una cartella per versione è una decisione del deploy, non di questo ADR.
- Sicurezza: il caricamento di un universo legge un campo nuovo, una stringa validata con un'espressione chiusa; nessuna rotta, nessun messaggio, nessuna superficie nuova.
