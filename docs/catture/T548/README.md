# T548 — Il rientro dei terreni, il cordolo e le strade larghe, le foto

Preview della build (`?universo=neapolis&skip&offline`), una copia di `neapolis` della run #2 clonata in `universes/` del worktree, la luce di
mezzogiorno dalla console (`k.daylight = () => 1`), la camera di base 3/4. Nessuna chiamata ai modelli.

1. `1-prima-strada-stretta-col-cordolo.jpg`: i piani di `neapolis` così come sono (senza il segno `streets`): la «strada» è larga una casella,
   ma rientra già di 0,12 dal nome (la riparazione degli universi di prima) e il marciapiede ha il suo cordolo; il viandante sta sulla strada,
   sulla sua cima.
2. `2-strada-larga-col-cordolo.jpg`: gli stessi luoghi coi piani segnati `streets: true` (solo nella copia, per la foto: un piano di prima non
   lo prende da sé): la strada è larga tre caselle, col cordolo dove tocca il marciapiede.
3. `3-strade-larghe-da-lontano.jpg`: l'incrocio fra «Redazione del Mattino» e «Officine dei Granili» più da lontano. Il viandante è a 0,63,
   cioè 0,75 del suolo che il kernel dice meno il rientro.

Dove c'è un edificio la strada resta com'era: la struttura riporta il suo lotto al suolo (`lotsOf`).
