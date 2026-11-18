# ADR-0219 — Gli edifici alla misura della loro classe

Data: 2026-11-19 · Stato: accettato (task T428 del backlog; difetto visto dall'autore in neapolis il 18/11) · Riferimenti: ADR-0216 (la
rigenerazione dei modelli), ADR-0049 (la densità detta dalla voce), ADR-0092 (le taglie), ADR-0134 (le case comuni), ADR-0143 (la generazione
differita)

## Contesto

Nel «Mercato del Pendino» di neapolis alcuni edifici erano cubetti grandi quanto un mobile, con le finestre. Non è una lettura sbagliata della
densità né della taglia: sono i programmi fatti a mano da T273 (Claude Cloud) per la classe `building`, la casa comune dei lotti sotto 5 caselle
(`casa-comune-building-f2e1f8de`, «Palazzina di tufo (piccola)») e l'edicola, scritti in una scatola propria di 25 × 25 × 24 voxel **senza** la
`map` × 2 con cui il casale del seme arriva a 50: a 20 voxel per casella sono 0,95 × 0,9 × 0,85 caselle (l'edicola 0,95 × 0,75 × 0,6) su un lotto
di 4 × 4, dove la classe chiede 2,5 × 2,5 × 2,5 e un'altezza di almeno 1,5. Si vedevano solo ora perché fino a T421 neapolis si apriva come un altro
universo.

Due cose li hanno lasciati così: nessuno misura un programma della libreria contro la sua classe fuori dai controlli dello Scultore (`leastHeight`),
e la rigenerazione dei modelli (ADR-0216), che doveva riscolpire ciò che il mondo indossa, lascia fuori la classe `building`: neapolis è stato
rigenerato il 18/11 e li ha tenuti. Negli altri universi (aurora, orichalcum, sidera) nessuna voce è sotto la misura; la più stretta è la casa comune
piccola di orichalcum, 1,35 × 1,2 caselle ma alta 2,25.

## Decisione

1. **La misura della classe** (`classFit` in `src/mj/check.ts`, pura): i voxel visibili di un modello alla densità a cui si mostra, in caselle,
   contro la scatola della sua classe alla sua taglia (`tilesOf`); è **piccolo** sotto il 60 % (il `minHeight` della classe `building`) sia nel
   lato più lungo sia nell'altezza, e `fit` è la densità che porta il suo lato o la sua altezza, il primo che ci arriva, a quelli della classe (mai
   sotto 4). Non cambia come il gioco mostra niente: la densità resta quella della voce (`vptOf`).
2. **La rigenerazione riscolpisce anche gli edifici** (`REGEN_CLASSES`: `furniture`, `structure`, `building`, `person`, `animal`, `beast`): la casa
   comune dei lotti piccoli e gli edifici che i moduli indossano. Un edificio che sta su un lotto (la casa comune, una struttura di un piano) è
   chiesto come lo chiede il `ModelDirector` in gioco (il concetto, «a building one enters, with the door at the front», abitazione per la casa
   comune) con la sua classe, non `structure`; uno che un modulo indossa come un mobile, da chi lo indossa. I controlli dello Scultore vogliono già
   l'altezza minima della classe.
3. **La diagnosi e la riparazione senza chiamate**: `lab/scripts/edifici-piccoli.ts -- universes/<nome> …` misura le voci `building` e `structure`
   che il mondo indossa (moduli, case comuni, strutture dei piani); con `--ripara` scrive nelle voci piccole la densità `fit` (`vpt`, ADR-0049: lo
   stesso programma disegnato più grande, come gli edifici della corona a 8) e committa nel repository dell'universo come `Kernel`. È un ponte: la
   rigenerazione li riscolpisce poi alla misura della classe e la voce nuova non ha più `vpt`.

## Conseguenze

- La rigenerazione in corso degli altri universi ha qualche passo in più (aurora: il pozzo; orichalcum: la caldaia, la fucina, la casa comune
  piccola; sidera: la casa comune piccola), dentro il loro tetto.
- Riparare neapolis è un comando dell'autore, non del task: subito e senza chiamate
  `npx vite-node lab/scripts/edifici-piccoli.ts -- universes/neapolis --ripara` (le due voci a `vpt: 8`: 2,38 × 2,25 × 2,13 e 2,38 × 1,88 × 1,5
  caselle), poi `npm run genera -- neapolis --rigenera modelli --tipi casa-comune-building-f2e1f8de,edicola` dalla coda per riscolpirle.
- Kernel 0.9.14 (nessun cambio di contratto).
