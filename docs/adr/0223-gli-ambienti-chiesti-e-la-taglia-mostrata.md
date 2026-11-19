# ADR-0223 — Gli ambienti chiesti al Cartografo, il giro a parte e la taglia mostrata

Data: 2026-11-19 · Stato: accettato (task T436 del backlog; proposta D di T153) · Riferimenti: ADR-0218 (il Cartografo riscrive l'ambiente che il
kernel non sa allargare), ADR-0216 (la rigenerazione dei modelli), ADR-0209 (le strutture a 16 voxel per casella), ADR-0143 (la generazione differita)

## Contesto

Dopo la rigenerazione dei modelli (ADR-0216) quattro strutture di `neapolis` erano rimaste a 20 voxel per casella: la palazzina delle case comuni,
il bistrot, il mercato coperto rionale e la torre panoramica. Le cause, misurate su `universes/neapolis` con `piano-rigenerazione.ts`:

- `porto`: i magazzini di 7 × 5 non tengono una Grande a 16 (7 × 7); nessuna via del kernel li allarga senza che il «Porto commerciale» perda una
  struttura, quindi va al Cartografo (ADR-0218). Il Cartografo ha fallito sette volte: non sapeva che il **bordo del luogo resta quello della bozza**
  anche sotto una regola che vi scrive (a (1, 2) la sabbia del bordo resta sabbia mentre quella dentro diventa banchina), e vedeva la bozza, non
  ciò che le sue regole vi disegnavano.
- `uffici`: il bistrot è Enorme (10 × 10 a 16, 8 × 8 a 20) sul «Piazzale degli Uffici», che ha case di 7 × 8 e 7 × 7. I timbri a 16 non fanno perdere
  strutture, quindi il kernel non chiedeva niente; chiesto al Cartografo (tre tentativi), la regola di ADR-0218 («ogni edificio di 5 o più almeno
  10 × 10») vuole due 10 × 10 anche alla «Torre C del Centro Direzionale», dove in 18 caselle col bordo fermo non entrano. E un 10 × 10 accanto a un
  7 × 7 non entra neppure: 1 + 10 + 1 + 7 + 1 = 20 > 18.
- Il bistrot però **a 20 non sta già** nel suo 7 × 8 (vuole 8): `claimSizes` lo mostra Grande comunque. Tenerlo a 20 non salva niente: a 16 è Grande
  anche lui, a 6,25 caselle invece di 5.

## Decisione

1. **La taglia mostrata decide il 20** (`shownRank` in `src/kernel/regenerate.ts`): una struttura riscolpita resta a 20 solo se un lotto che la porta
   la mostrerebbe a 16 più piccola di quanto la mostra oggi (la taglia più grande, dalla sua in giù, che il lotto tiene alla densità di oggi contro
   quella a 16). Un lotto che non la tiene né a 20 né a 16 la scala comunque, e allora va a 16.
2. **Gli ambienti chiesti** (`--ambienti <id,…>` di `npm run genera -- <universo> --rigenera modelli`, `RegenOptions.environments`, il parametro
   `rewrite` di `regenerationPlan`): vanno al Cartografo anche dove una via del kernel non perde strutture, a meno che il giro li abbia già fatti.
   Lo prova anche `piano-rigenerazione.ts --ambienti`.
3. **Il giro a parte** (`--giro <nome>`): il progresso in `universes/.generation/<universo>.rigenera-modelli-<nome>.json`, così un compito rifà tipi e
   ambienti che il generatore ha già fatto senza toccare il file del generatore. Il nome è di lettere minuscole, cifre e trattini (`RUN_NAME_RE`).
4. **Il prompt di `environment.recut`** (`recutEnvironment`): un lato per tutti gli edifici grandi (`least`, 7) e uno per la struttura più grande
   (`need`), che si disegna per prima, una per luogo; a ogni struttura la misura che il kernel controllerà (quella della sua voce se non si
   riscolpisce, `needAt16`); il bordo che resta quello della bozza; gli edifici ancorati alle strade della bozza; gli input che prendono anche i
   terreni che le regole stesse disegnano (una banchina).
5. **Il ritorno al Cartografo** dice, oltre al motivo, la pianta dei luoghi che non tengono (al più due) dopo il suo programma
   (`Kernel.placeLaidOut`); il registro del comando scrive il programma scartato.
6. `piano-rigenerazione.ts` prova un programma d'ambiente sui suoi luoghi come il kernel prova quello del Cartografo (`--prova <ambiente> <file>`) e
   stampa le bozze (`--bozze`).

## Conseguenze

- In `neapolis` (T436) `porto` è del Cartografo (all'ottavo tentativo in tutto, il secondo col bordo detto nel prompt), `uffici` resta coi timbri a 16 e il
  bistrot va a 16 (Grande nel suo lotto, come già si vedeva). Nessuna struttura resta a 20.
- Un'Enorme su un luogo che ne ha altre resta difficile: il Cartografo non sa a quale luogo un programma si applica, e 10 + 7 non entrano in un luogo.
- Kernel 0.9.21 (stesso contratto: i piani e le voci di prima restano buoni).
