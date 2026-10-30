# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle ~09:28 UTC, fine epoca 53 (gemini orchestratore: claude al 0 % della sessione 5h, reset 12:00 UTC; settimana 61 %; gemini 5h all'81 %, settimana 60 %; argon fermo fino al 04/11).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T76 completato**: risolto il conflitto in `src/main.ts` preservando sia T44c (`savedProfile`, `ui:died`, hover/clic) sia T75/T44b/T45a (account Firebase, crediti anonimo).
  - **Integrati in `3d` con successo**: eseguiti in sequenza `integra T76`, `integra T75` e `integra T44b`. Installate le dipendenze npm (Firebase/firebase-admin), verificati con esito positivo `npm run typecheck` (pulito) e `npx vitest run tests/account.test.ts tests/credits.test.ts tests/session.test.ts` (15/15 verdi).
  - Sbloccato **T45e** (pagamenti Stripe) e sbloccato il percorso verso **T45d** (lobby, subordinata a T45b).
  - **T70 in corso su Claude** (p0, pid 23712): integra T53b (più piani) con T56b (salto).
- **Cosa si aspetta**:
  1. **T70** (claude, p0): completamento integrazione T53b con salto T56b; poi `integra T70` e `integra T53b`.
  2. Reset crediti 5h di Claude alle 12:00 UTC (~13:00 locali) per l'avanzamento dei task multigiocatore T45b, T45c e T45e.
- **Intenzioni / prossimi passi**:
  1. Integrare T70 + T53b appena T70 conclude positivamente.
  2. Al reset di Claude (12:00 UTC): avanzare T45b (coefficienti e Low Detail), sbloccando T45d (lobby), e T45c (eredità cloni).
  3. Mantenere priorità assoluta alla catena multigiocatore: T52 e T54 (p50) restano in attesa che la coda multigiocatore si svuoti.

## Task attivi e in corso

- **In corso**:
  - **T70** (claude, p0, pid 23712): integrare T53b con T56b.
  - **T45b** (claude, p6) e **T45c** (claude, p7): priorità multigiocatore (in attesa reset crediti Claude).
- **Completati e integrati nel base `3d`**:
  - **T76**, **T75**, **T44b**, **T44c**.
- **Completati in attesa di integrazione**:
  - **T53b** (claude): in attesa di T70.
- **Sbloccati / In coda**:
  - **T45e** (da approvare / pagamenti Stripe).
  - **T45d** (lobby, attende T45b).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Gemini**: 5h all'81 %, settimana al 60 % (orchestratore Epoca 53).
  - **Claude**: 5h a 0 %, settimana al 61 % (reset 12:00 UTC).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
