# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle ~09:03 UTC, fine epoca 51 (gemini orchestratore: claude all'8 % della sessione 5h, reset 12:00 UTC; settimana 61 %; gemini 5h all'88 %, settimana 63 %; argon fermo fino al 04/11).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T75 completato con successo**: integrato T44b (account/Firebase) con T45a (crediti), ADR-0082 registrato, meccanismo anonimo unificato sui crediti e suite di test/typecheck verdi nel worktree `t75`.
  - **Tentativo di merge `integra T75`**: riscontrato conflitto in `src/main.ts` con T44c (che era stato integrato nel base `3d` durante l'esecuzione di T75).
  - **Creato e avviato T76** (gemini, p0, stima 1%, approvato): integra `task/T75` nel base `3d` risolvendo il conflitto in `src/main.ts` preservando sia le novità di T44c (profilo per universo/viandante, «Chi è», hover/clic destro, schermata della morte) sia quelle di T75/T44b/T45a (gestione account Firebase, login Google/anonimo, crediti anonimo).
  - **T70 in corso su Claude** (p0, pid 23712): integra T53b (più piani) con T56b (salto).
  - **T44c integrato nel base `3d`**: fix «Chi è», profilo per universo/viandante, hover/clic destro e schermata della morte.
- **Cosa si aspetta**:
  1. **T76** (gemini, p0): completamento del merge di T75 con `src/main.ts`; poi `integra T76`, `integra T75` e `integra T44b`. Questo sblocca T45d/T45e/T45f.
  2. **T70** (claude, p0): completamento integrazione T53b con salto T56b; poi `integra T70` e `integra T53b`.
  3. Reset crediti 5h di Claude alle 12:00 UTC (~13:00 locali) per T45b e T45c.
- **Intenzioni / prossimi passi**:
  1. Integrare T76, T75 e T44b appena T76 conclude positivamente (sblocca T45d lobby, T45e Stripe, T45f server cloud).
  2. Integrare T70 + T53b appena T70 conclude positivamente.
  3. Mantenere priorità assoluta alla catena multigiocatore: T52 e T54 (p50) restano in attesa che la coda multigiocatore si svuoti.
  4. Gestione T45b (coefficienti / low detail) e T45c (eredità cloni): in attesa dello sblocco crediti di Claude o dirottamento su Gemini se il carico lo richiede.

## Task attivi e in corso

- **In corso**:
  - **T76** (gemini, p0): integrare T75 (account T44b e crediti T45a) con T44c in `src/main.ts`.
  - **T70** (claude, p0, pid 23712): integrare T53b con T56b.
  - **T45b** (claude, p6) e **T45c** (claude, p7): priorità multigiocatore.
- **Completati in attesa di integrazione**:
  - **T75** (gemini): in attesa di T76.
  - **T44b** (claude): in attesa di T76.
  - **T53b** (claude): in attesa di T70.
- **In coda / sospesi**:
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Gemini**: 5h all'88 %, settimana al 63 % (orchestratore Epoca 51 e task T76).
  - **Claude**: 5h all'8 %, settimana al 61 % (reset 12:00 UTC).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
