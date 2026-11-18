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
