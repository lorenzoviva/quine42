# La prova vera della rigenerazione dei modelli (T411, ADR-0216)

Il 18/11, su una copia di `orichalcum` nel worktree di T411 (non l'universo vero), con la CLI di Claude Code e Opus 5.5 a sforzo `low`:

```bash
npm run abbonamento   # in un altro terminale: chi serve la coda
npm run genera -- orichalcum --rigenera modelli --tipi struttura-palazzina-degli-inventori --tetto 5
```

- `prova.txt`: ciò che il comando ha detto (l'ambiente `quartiere_telai` ritagliato coi timbri a 16, la palazzina riscolpita, il suo interno).
- `struttura-palazzina-degli-inventori.xml` e `voce.json`: il programma riscolpito e la sua voce di `models/index.json` (a 16, senza `vpt`; quattro
  semi; il voto dell'Artista 6/10; l'interno dello Scenografo, 6 regole).
- `palazzina-dopo.png` e `palazzina-prima.png`: le due palazzine alla Grande (100 × 100 × 80 voxel), semi 1 e 2, dai quattro lati, a cartone. Quella
  di prima è il programma procedurale di Claude Cloud (T273) com'era nella storia sotto il tag `prima-della-rigenerazione`.

Il costo: 8 chiamate (7 dello Scultore e dell'Artista, 1 dello Scenografo), 9 minuti, almeno 1,36 $ al listino di Opus 5.5 senza i token scritti
nella cache del prompt; la settimana dell'abbonamento 75 → 76 %, la finestra delle 5 ore 14 → 21 %, con altri agenti al lavoro.

## Sidera, i due ambienti riscritti dal Cartografo (T422, ADR-0218)

Il 18/11, sull'universo vero (`universes/sidera` della cartella del generatore), dopo i quattro ambienti già ritagliati da T411:

```bash
npx vite-node --script tools/abbonamenti/servi.ts -- --coda <universi>/.queue
npm run genera -- sidera --rigenera modelli --tetto 20 --universi <universi> \
  --tipi casa-comune-structure-052c7ac8,struttura-laboratorio-del-plasma,struttura-laboratorio-di-fusione,struttura-residenza-modulare,struttura-scalo-navette,struttura-stazione-di-transito
```

- `vicoli_pioggia` e `cantiere_fusione` riscritti dal Cartografo al primo tentativo (una chiamata ciascuno, 0,13 $): edifici di 7 × 7 col loro anello,
  poi case di 4 × 4; sgombrati boschetti, felci e speroni; nel cantiere le sale anche sopra i canali. 15 luoghi tagliati a 16, ogni struttura sul
  suo 7 × 7. I programmi, quelli di prima e le bozze vere dei luoghi: `sidera-ambienti.json` (lo prova `tests/rigenera-sidera.test.ts`).
- Le sei strutture che sarebbero rimaste a 20 riscolpite a 16 e arredate: 39 chiamate dello Scultore e dell'Artista, 6 dello Scenografo; voti 4-6/10.
- In tutto 47 chiamate in circa 50 minuti, almeno 7,0 $ al listino di Opus 5.5; la settimana 80 → 85 % con altri agenti al lavoro (1 % contato a sidera).
- Dopo: `lab/scripts/piano-rigenerazione.ts` non trova ambienti da ritagliare né strutture a 20; `lab/scripts/controlla-universo.ts` legge i 56 piani.

## La Piazza dei Viadotti senza lotti (T435)

La partenza di sidera, «Piazza dei Viadotti» (0, 0), nomina il bar orbitale e il santuario della luce (Grandi) ma dopo la rigenerazione non aveva
edifici. **La causa**: `piazza_neon` disegnava case di 5 × 4 (`steps: 3`): sulla partenza tre lotti che, a 20, mostravano le due strutture senza
tenerle (una Grande a 20 vuole 5 × 5). T411 le ha allargate a 7 × 7 (`stretched`, `steps: 2`), e sulla bozza della partenza, una piazza con le pozze
sparse ovunque (la prima regola toglie il 60 % dell'acqua, una volta), nessun 7 × 7 di lastricato è libero: zero lotti. Il kernel l'aveva presa perché
contava solo le strutture *tenute*, zero prima e zero dopo; ora conta anche quelle che *stanno* su un lotto (`losesStructure` in
`src/kernel/regenerate.ts`) e ritaglia anche un ambiente con una struttura senza lotto: sul repository al tag `prima-della-rigenerazione`
`piano-rigenerazione.ts` manda `piazza_neon` al Cartografo, il kernel di prima la allargava.

**La riparazione** (a mano, senza chiamate: la coda degli abbonamenti era spenta): dopo il nodo delle case 7 × 7, un nodo di riserva che disegna una
coppia di case 7 × 7 una sopra l'altra, con una fila libera in mezzo, le porte verso fuori su una fila camminabile e le case che possono stare sulle
pozze; una volta sola. Dove le prime case hanno trovato posto la coppia non entra più: la Fermata del Treno Sospeso (-1, 1) è identica casella per
casella; la partenza ha due lotti 7 × 7, (1, 1)-(7, 7) e (1, 9)-(7, 15), il bar a nord e il santuario a sud, le porte raggiunte dai varchi.
Validatore degli ambienti e `recutFaults` verdi. Commit nel repository di sidera sopra il tag `prima-di-t435`; i programmi e le bozze dei due luoghi
in `sidera-piazza.json` (lo prova `tests/rigenera-sidera.test.ts`); le foto nel browser, offline su una copia: `sidera-piazza-dei-viadotti.jpg`
(il bar con le luci ciano in alto a sinistra, il santuario con i merli a sinistra) e `sidera-piazza-santuario.jpg` (la porta del santuario).

## neapolis, le quattro strutture a 16 e la figura dei cittadini (T436, ADR-0223)

Il 19/11, sull'universo vero (`universes/neapolis` della cartella del generatore), dopo il tag `prima-di-t436`, in un giro a parte (il progresso in
`universes/.generation/neapolis.rigenera-modelli-t436.json`, quello del generatore non si tocca):

```bash
npx vite-node --script tools/abbonamenti/servi.ts -- --coda <universi>/.queue
npm run genera -- neapolis --rigenera modelli --giro t436 --tetto 10 --universi <universi> \
  --tipi casa-comune-structure-f2e1f8de,struttura-bistrot,struttura-mercato-coperto-rionale,struttura-torre-panoramica,neapolis-cittadino
```

- **La figura**: un commit a mano nell'universo (autore Kernel) aggiunge `neapolis-cittadino` (classe `person`, `tint: C`, per ora il programma
  del Fabbro) e la fa indossare agli 11 mestieri `npc.*` al posto di `person`, il generico del kernel che la rigenerazione non tocca; poi lo
  Scultore la riscolpisce («Cittadino di Neapolis (anni Novanta)», giacca, pantaloni, scarpe; il colore principale è quello di ogni mestiere).
- **`porto`** (i magazzini di 7 × 5 del Porto commerciale e del Molo Vecchio): il Cartografo ha fallito sette volte (gli edifici 7 × 7 trovavano
  posto per uno solo: la riva di (1, 2) ha nove righe di terra e il bordo del luogo resta sabbia anche sotto una regola) e ha riuscito
  all'ottavo, il secondo col prompt che dice il bordo (ADR-0223): i magazzini 7 × 7 con l'anello anche sulla banchina e sulla strada del bordo,
  due per luogo. Il programma: `neapolis-porto.json`. Prima di riprovarlo, un programma scritto a mano provato con
  `piano-rigenerazione.ts --prova porto <file>` aveva mostrato che due 7 × 7 ci stanno.
- **`uffici`** (chiesto con `--ambienti uffici` per il bistrot Enorme): tre tentativi, e non si può: alla Torre C due strutture e un 10 × 10
  non entrano con un 7 × 7 in 18 caselle col bordo fermo. Ma il bistrot su una casa di 7 × 8 era già Grande a 20 (vuole 8): ora resta a 20 solo
  una struttura che il 16 mostrerebbe più piccola (`shownRank`), e il bistrot va a 16, Grande come si vedeva.
- `village` e `inn` (ambienti del seme medievale con case di 6 × 5) presi dal seme di oggi, come il generatore avrebbe fatto.
- Le strutture riscolpite a 16 e arredate dallo Scenografo, senza merli né feritoie (solo `part-door`, `part-stair` e, con la cantina,
  `part-cellar`): la palazzina delle case comuni 6/10 (al secondo giro: il primo un piano solo), il bistrot 5/10, il mercato coperto rionale
  4/10, la torre panoramica 4/10; il cittadino 6/10.
- **Il costo**: 46 chiamate, almeno 5,1 $ al listino di Opus 5.5 (11 del Cartografo, 0,63 $; 31 dello Scultore e dell'Artista, 4,40 $; 4 dello
  Scenografo, 0,07 $), più al più una chiamata interrotta quando ho fermato il primo giro prima che riscolpisse a 20; la settimana 96 → 97 %.
- **Dopo**: `piano-rigenerazione.ts` non trova strutture a 20; `controlla-universo.ts` legge i 107 piani, 0 guasti. Nel browser (copia offline):
  il Porto commerciale coi due magazzini, il mercato a sinistra e la torre a destra (`neapolis-porto-commerciale.jpg`), e i cittadini col corpo
  nuovo (`neapolis-cittadino.jpg`, `neapolis-cittadino-vicino.png`).
