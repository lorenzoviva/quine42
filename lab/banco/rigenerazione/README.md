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
