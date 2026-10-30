# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle ~08:57 UTC, fine epoca 50 (gemini orchestratore: claude all'8 % della sessione 5h, reset 12:00 UTC; settimana 61 %; gemini 5h al 91 %, settimana 64 %; argon fermo fino al 04/11).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T44c completato e verificato nel browser** (due schede, «Chi è» nel client sottile, profilo isolato per universo/viandante, hover e clic destro corretti, schermata di morte multigiocatore, fix junction `node_modules` per wasmoon).
  - **T44c integrato in `3d`** (`integra T44c`, commit `906ed6a`): worktree e branch rimossi, typecheck verde.
  - **T44b completato** (account e autenticazione con Firebase Auth, Google/anonimo, verificato con emulatore). In attesa del merge di T75.
  - **T75 in corso su Gemini** (worktree `t75`, pid 28788): integra T44b con T45a, rinumera ADR di T44b in ADR-0082, unifica la gestione dell'anonimo; typecheck, `tests/account.test.ts` e `tests/credits.test.ts` (6/6) passati verdi, suite `tests/session.test.ts` in corso.
  - **T70 in corso su Claude** (p0, pid 23712): integra T53b (più piani) con T56b (salto).
  - **T45a, T68b, T68c, T74 già integrati nel base `3d`**: crediti viandante, servi CLI abbonamenti e integrazione gioco operativi.
- **Cosa si aspetta**:
  1. **T75** (gemini, p0): completamento del merge T44b con T45a; poi `integra T75` e `integra T44b`.
  2. **T70** (claude, p0): completamento integrazione T53b con salto T56b; poi `integra T70` e `integra T53b`.
  3. Reset crediti 5h di Claude alle 12:00 UTC (~13:00 locali) per T45b e T45c.
- **Intenzioni / prossimi passi**:
  1. Integrare T75 + T44b appena T75 conclude positivamente (T44b sblocca T45d/T45e/T45f).
  2. Integrare T70 + T53b appena T70 conclude positivamente.
  3. Mantenere priorità assoluta alla catena multigiocatore: T52 e T54 (p50) restano in attesa che la coda multigiocatore si svuoti.
  4. Gestione T45b (coefficienti / low detail) e T45c (eredità cloni): in attesa dello sblocco crediti di Claude o dirottamento su Gemini se il carico lo richiede.

## Task attivi e in corso

- **In corso**:
  - **T75** (gemini, p0, pid 28788): integrare T44b con T45a.
  - **T70** (claude, p0, pid 23712): integrare T53b con T56b.
  - **T45b** (claude, p6) e **T45c** (claude, p7): priorità multigiocatore.
- **Completati in attesa di integrazione**:
  - **T44b** (claude): in attesa di T75.
  - **T53b** (claude): in attesa di T70.
- **In coda / sospesi**:
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Gemini**: 5h al 91 %, settimana al 64 % (orchestratore Epoca 50).
  - **Claude**: 5h all'8 %, settimana al 61 % (reset 12:00 UTC).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
