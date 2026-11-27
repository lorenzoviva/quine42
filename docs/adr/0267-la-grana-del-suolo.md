# ADR-0267 — La grana del suolo: le macchie di un voxel nel materiale del terreno

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T547 (C3 di [`docs/design/terreno-ricco.md`](../design/terreno-ricco.md), § 2.2 e § 7)
- **Estende**: ADR-0093 (il cartone), ADR-0224 (i terreni come dati), ADR-0242 (la mesh dei luoghi in un worker)

## Contesto

L'autore ha chiesto (26/11, T509) un terreno più ricco: arbusti, erba, foglie secche, brecciolino, pietre. Lo studio di T509 ha misurato i
programmi del sottobosco: il brecciolino e le foglie secche sono il caso peggiore della copertura a istanze (C1), perché ogni sasso è un voxel
con tutti i lati in vista e la fusione delle facce non li aiuta (198 → 182 triangoli a seme). Per ciò che giace piatto lo studio propone una
via più economica, la **grana del suolo**: le macchie di un voxel disegnate dal materiale del terreno sopra il suo colore, zero triangoli. Le
risposte dell'autore a D/T509 (27/11) l'hanno approvata, con la riparazione dal nome per gli universi di prima (D6, A).

## Decisione

1. **Un campo del terreno**, `TerrainDef.grain = { color, density }`: il colore delle macchie (#rrggbb) e quante celle della cima ne hanno
   una (0-0,75, a passi di 0,05; 0 nessuna). Una cella è 1/20 di casella (`GRAIN_CELLS`): un voxel alla densità dei modelli dei terreni. Si
   legge senza fidarsi (`readGrain`, `src/kernel/grain.ts`, puro e leggero: lo importa il worker del terreno); il validatore dei manifest la
   vuole con colore e densità nell'intervallo (`grainErrors`).
2. **La Genesi**: lo schema dei terreni del Cartografo (`genesis.terrain`) la offre, facoltativa, per il suolo che si cammina disseminato di
   piccole cose sciolte (ghiaia, massicciata, foglie secche); `toPalette` la tiene solo per `layer: ground`, letta con `readGrain`.
3. **La riparazione dal nome**, per gli universi di prima e per ogni terreno che non la dice: `grainByName` (`grainKind`) riconosce dal nome e
   dall'id, in italiano e in inglese, la massicciata dei binari, la ghiaia e il brecciolino, le foglie secche, solo sul suolo che si cammina;
   le macchie sono del colore del tipo mescolato a quello del terreno. Non si scrive niente: la grana è solo aspetto, e ciò che il nome dice
   si ricava ogni volta che il luogo si disegna (`grainOf`). Un terreno che dice `grain` con densità 0 non ne ha, qualunque sia il nome.
   Nel seme nessun terreno ne ha (il sentiero è «terra battuta con sassolini», ma il nome non lo dice): `aurora` e il seme si disegnano come
   prima, l'impronta del terreno (`lab/scripts/impronta-terreno.ts`) non cambia.
4. **Nella mesh un attributo, nessun triangolo**: le cime di un terreno con la grana portano quattro byte per vertice (`MeshArrays.grain`: il
   colore acceso, 0-255 del lineare, e un byte con la densità a passi e il sale della casella dal suo hash, così due caselle allo stesso
   posto di due luoghi raramente hanno le stesse macchie). I lati, l'acqua, i muri, i pavimenti no. L'attributo c'è solo nelle mesh dei
   luoghi che hanno almeno una cima con la grana (`MeshBuilder.fixedGrain`, i vertici di prima a zero solo da lì): le altre sono quelle di
   prima byte per byte, col materiale di prima. Il worker riceve la grana nella tavolozza della sua copia (`ChunkInput.palette`, quarto
   elemento) e la rifà uguale.
5. **Lo shader del suolo**, `MAT.ground` (`addGrain`, `src/render/materials.ts`): `MAT.world` con le macchie dopo `color_fragment`. La cella è
   presa dalle coordinate del vertice nel suo luogo (relative al suo angolo, ADR-0236: numeri piccoli e esatti anche lontano dall'origine) e
   lo scorrimento del tappeto non la sposta; la macchia c'è dove l'hash della cella e del sale sta sotto la densità, un po' più chiara o
   più scura; dove la cella è più piccola di un pixel (`fwidth`) la cima sfuma verso la media delle macchie, così non sfarfalla allo zoom
   più lontano. L'inchiostro del cartone non la vede (le parti non cambiano).
6. **Solo aspetto**: niente nello stato, nei piani, sul filo, in Lua; un terreno resta ciò che è per il kernel.

## Conseguenze

- Il brecciolino di `neapolis` e i binari di `mesa`, `neapolis` e `orichalcum` hanno la grana senza chiamate né commit; ogni universo nuovo
  la ha dove il Cartografo la dice o dove il nome la dice.
- Costa qualche istruzione per pixel delle cime che la hanno e quattro byte per vertice delle loro mesh; nessuna draw call in più.
- La copertura a istanze (C1, T545) resta per ciò che sta in piedi (ciuffi, arbusti, spighe); la grana per ciò che giace piatto.
- Kernel 0.10.42: il campo è aggiuntivo, gli universi della 0.10 restano buoni.
