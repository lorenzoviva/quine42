# ADR-0185 — Il tetto dei voxel delle strutture gargantuesche: le misure, la mesh in due passate senza il fondo, 32 milioni di celle

Data: 2026-11-13 · Stato: accettato (task T356 del backlog, step 30; il lotto aspetta l'autore, `docs/pipeline/domande/T356.md`) ·
Riferimenti: l'autore (10/11), ADR-0043 (lotti e strutture), ADR-0092 (le taglie), ADR-0105 (`FORM_LIMITS`), ADR-0108 (la cache delle
forme e i suoi tre piani), ADR-0178 (la griglia a pezzi, con il tetto di prima misurato), ADR-0179 (`STRUCTURE_SIDE`, una scala sola);
il banco [`lab/banco/taglie/`](../../lab/banco/taglie/README.md), sezione «Il tetto delle gargantuesche»

## Contesto

L'autore (10/11): a 20 voxel per casella le gargantuesche a 200 voxel sono solo 10 caselle, piccole rispetto alla mappa; va alzato il
tetto, a 20-50 caselle. ADR-0179 ha fissato una scala sola (`TILE`, 20) fino a `STRUCTURE_SIDE` (200); ADR-0178 ha misurato dove sta il
tetto: non il motore ma `FORM_LIMITS` (8 milioni di celle), le scatole delle classi e la mesh.

**Le misure di oggi** (`lab/scripts/misura-tetto.ts`, i quattro programmi del banco delle taglie con le parti del seme incluse, alti 160,
ognuno in un processo suo; la tabella intera nel banco): a 400 di lato (20 caselle, 25,6 milioni di celle) la fattoria gira in 1,8 s, il
forte in 0,9, la rocca e la villetta in 1,7; a 600 (30 caselle, 57,6 milioni) 3,3-3,4 s (il forte 1,4); a 1000 (50 caselle, 160 milioni)
8,3-8,8 s (il forte 2,6) con 250-430 MB di picco. Il motore regge anche le 50 caselle. **La mesh no**: con la mesh di prima la fattoria a
400 faceva 1,22 milioni di vertici e 57,5 MB con un picco di 541 MB nel processo (gli array di numeri che crescono a `push`, otto volte la
mesh), a 1000 5,66 milioni di vertici, 266 MB e un picco di 2,1 GB. Un `WorkerRunner` tiene 128 MB per tutte le forme (ADR-0108) e la
pagina altrettanto di geometrie: a 50 caselle una fattoria sola non entra, a 30 ne prende più della metà.

**Il lotto**: una struttura sta in un lotto del suo luogo (ADR-0043), un luogo è 18 caselle, e `claimSizes` fa scendere una taglia alla
più grande che entra nel lato del lotto. Una gargantuesca di 20 caselle o più non ha oggi dove stare: nessuna scelta del kernel la
mette nel mondo senza una decisione dell'autore su come sia fatto il suo lotto (la domanda in `docs/pipeline/domande/T356.md`, con la
raccomandazione).

## Decisione

1. **La mesh in due passate, senza il fondo** (`meshVoxels` in `src/mj/mesh.ts`): la prima passata conta le facce che toccano il vuoto,
   la seconda le scrive in array tipizzati della misura finale; stessi quadrati, vertici, colori e ordine di prima (le impronte dei
   modelli del seme non cambiano: `tests/mesh-underside.test.ts`, `lab/tests/mesh3d.test.ts`), senza gli array che crescevano. L'opzione
   `underside: false` lascia fuori le facce rivolte in basso sul fondo della griglia (z = 0), che una cosa posata a terra non mostra mai:
   il worker la usa per i corpi e i fotogrammi delle forme del gioco (`formMeshes`), per i corpi con le azioni fatte e per gli stadi
   (`changedBody`, `stagedBody`); un arto le tiene (un piede che si alza mostra la suola); il laboratorio e l'editor, che guardano un
   modello da ogni lato, le tengono. La fattoria a 400 passa da 1,22 a 0,93 milioni di vertici (57,5 → 43,9 MB) e il picco del processo
   da 541 a 129 MB; la mesh si fa in metà tempo (859 → 420 ms); a 200 da 32 a 26 MB. La chiave della cache non cambia (una mesh di prima
   col fondo è buona, solo più pesante): `FORMS_DB_VERSION` resta.
2. **I tetti delle celle**: `FORM_LIMITS` da 8 a **32 milioni** di celle (il lato resta 512): la scatola di una gargantuesca di 20 × 20
   caselle è 400 × 400 × 160, 25,6 milioni; una griglia è un byte a cella, il tempo resta quello del validatore (8 s o il `tempo` del
   modello) e del worker. `FORM_PIECES` da 32 a **64 milioni** (a pezzi si può fare il doppio della griglia intera, come prima: il test di
   ADR-0178 lo afferma a 35 milioni); `MJX_LIMITS` del laboratorio a 1024 di lato e 64 milioni, così la sandbox 3D mostra le 20 caselle.
   Le carte fatte a mano tengono i loro tetti (2 milioni, ADR-0161); `WORLD_NODE_LIMITS` non cambiano.
3. **`STRUCTURE_SIDE` e le caselle della gargantuesca non cambiano ancora** (200, 10 × 10): alzarli senza un lotto farebbe sparire la taglia
   dal mondo (`claimSizes` la farebbe scendere a Enorme ovunque) e lo Scultore scriverebbe per una scatola che nessun luogo riceve. Il
   motore, i tetti e la mesh sono pronti per 20 caselle (e per 30 con la mesh entro i 128 MB solo se la struttura non riempie l'area);
   il lotto è la decisione dell'autore. Nel laboratorio 3D e nel banco i quattro programmi delle taglie hanno una quarta scatola,
   «Gargantuesca a 20 × 20» (`lab/3d/catalog.ts`, `banco-taglie.ts -- --venti`), per vederli e misurarli.
4. **Kernel 0.6.11** (sale `Z`: gli universi della `0.6` restano buoni, nessun programma del seme cambia, le mesh di prima in cache restano
   valide).

## Alternative scartate

- **50 caselle a 20 voxel per casella**: 160 milioni di celle (160 MB di griglia per forma, in tre copie fra worker, pagina e disco) e una
  mesh di 180-270 MB per una fattoria: non entra in un browser; a 10 voxel per casella entrerebbe (la fattoria di T339) ma è la scala doppia
  che ADR-0179 ha scartato (porte e stanze a misura).
- **Una mesh per pezzo**: il renderer disegnerebbe solo i pezzi in vista, ma la memoria delle geometrie resta la stessa, e dopo il fondo
  tolto la fattoria a 20 caselle sta in un terzo del tetto del worker; resta la via per le 30 caselle se l'autore le vuole.
- **Attributi più stretti** (normali in byte, colori in byte): un quarto in meno di byte per vertice, ma cambia il formato delle mesh in cache
  (`FORMS_DB_VERSION`) e i materiali; fuori da questo task.
- **Alzare `FORM_LIMITS` solo per le strutture**: i limiti sono della corsa, non della classe; il validatore e il worker li condividono, e
  un tetto solo è più facile da tenere.

## Conseguenze

- Un programma del Concilio può ora chiedere al validatore e ai client griglie fino a 32 MB (prima 8): il tempo è lo stesso, la memoria per
  forma quadruplica al più. Sicurezza: nessuna superficie nuova (un tetto di memoria del motore più alto, a tempo invariato; nessuna rotta,
  nessun dato dal filo).
- Il banco `lab/banco/taglie/` ha le tabelle del tetto (`misure/tetto.json`), le foto a 20 caselle (`fattoria-gargantuan-20.png`,
  `scultore-villetta-gargantuan-20.png`) e i frame nel browser (`misure/frame.json`, `misura-frame.mjs --modello`): la fattoria a 400 arriva
  dal worker in 2,0-2,4 s e, disegnata, il frame sta in 3,2 ms di JS e 2,9 di GPU (2,96 milioni di triangoli) su una RTX 2070.
- **Il validatore rifiuta la fattoria a 20 caselle** per i pezzi staccati (48 % dei voxel: i recinti dei pascoli e i campi lontani dalla casa):
  una struttura di 20 caselle è un insieme, non un corpo solo; la regola (`analyse`, `mainPart` < 0,92) va ripensata per le strutture che
  crescono a regole nel task del lotto (ciò che tocca il suolo della struttura è attaccato, o una soglia per taglia).
- Il lotto delle gargantuesche di 20 caselle è un task dopo la risposta dell'autore; con il lotto, `STRUCTURE_SIDE` sale a 400 e
  `tilesOf` per la gargantuesca delle strutture a 20 × 20 (prompt dello Scultore, controlli e `claimSizes` seguono).
