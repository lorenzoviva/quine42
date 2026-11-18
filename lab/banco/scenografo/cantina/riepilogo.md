# La cantina sul banco dello Scenografo (T419): 7 edifici, 4 semi, la via dei dati

Le regole dei modelli locali: `[{"storey":0,"room":"hall","furniture":["banco","credenza","barile"],"count":3},{"room":"room","furniture":["letto","furniture"],"count":2},{"furniture":["barile"],"count":1},{"room":"cellar","furniture":["cellar-shelf","cellar-rack","barile"],"count":4}]`. Il tempo è quello dell'arredo intero (piano terra, piani di sopra, cantina e la verifica dei piani), senza le misure.

| edificio | seme | cantina (caselle²) | soffitto (voxel) | pezzi in cantina | voxel | mobili | pezzi in tutto | rifiutati (cellar, cut, room) | regge | piani prima → dopo | cantina raggiunta | piede della scala libero | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| villetta | 1 | 10,95 | 19 | 4 | 8559 | cellar-shelf, barile | 11 | 0, 8, 0 | sì | 1 21 53 → 1 21 53 | sì | sì | 1253 |
| villetta | 2 | 10,95 | 19 | 3 | 6024 | cellar-shelf, barile | 9 | 0, 8, 0 | sì | 1 21 53 → 1 21 53 | sì | sì | 1367 |
| villetta | 3 | 10,95 | 19 | 2 | 4564 | cellar-rack, cellar-shelf | 8 | 0, 8, 0 | sì | 1 21 53 → 1 21 53 | sì | sì | 1900 |
| villetta | 4 | 10,95 | 19 | 3 | 3937 | cellar-rack, barile | 10 | 0, 7, 0 | sì | 1 21 53 → 1 21 53 | sì | sì | 1363 |
| struttura-fucina-nanica | 1 | 3,18 | 42 | 0 | 0 | — | 6 | 0, 20, 0 | sì | 10 22 54 → 10 22 54 | sì | sì | 556 |
| struttura-fucina | 1 | 2,53 | 51 | 0 | 0 | — | 8 | 0, 71, 8 | sì | 1 22 54 → 1 22 54 | sì | sì | 706 |
| struttura-locanda-del-cinghiale | 1 | 3,23 | 42 | 0 | 0 | — | 4 | 0, 1, 1 | sì | 6 18 50 → 6 18 50 | sì | sì | 559 |
| struttura-locanda | 1 | 2,53 | 51 | 0 | 0 | — | 8 | 0, 71, 8 | sì | 1 22 54 → 1 22 54 | sì | sì | 658 |
| struttura-torre-del-mago | 1 | 3,20 | 42 | 0 | 0 | — | 6 | 0, 20, 0 | sì | 10 22 54 → 10 22 54 | sì | sì | 525 |
| struttura-torre-di-guardia | 1 | 2,53 | 51 | 0 | 0 | — | 8 | 0, 71, 8 | sì | 1 22 54 → 1 22 54 | sì | sì | 694 |
