# ADR-0255 — Il vento (A2 di T459: la risoluzione di D3, il vento dominante, la vela, il fuoco, il fumo, la vegetazione, il vento grossolano ai client)

Data: 2026-11-23 · Stato: accettato (task T484 del backlog, la riga 11 dello studio di T459, `docs/design/terreno-3d.md` § 5.3-5.6; decisione D67 **D3** dell'autore del 21/11: la massima definizione) · Estende ADR-0254 (la primitiva degli automi), ADR-0227 (il veicolo), ADR-0244 (i veicoli del Concilio), ADR-0109 (ciò che esce, a elenco) · Sicurezza: V-049 (`docs/sicurezza/registro.md`)

## Contesto

T482 (ADR-0254) ha dato al kernel la famiglia `wind` (un reticolo di Boltzmann D2Q9) a una cella ogni tre caselle, come proponeva lo studio di T459, ma nessuno la leggeva: la vela dava `power` da Lua, il fuoco di `sys.fire` bruciava in tondo, la vegetazione oscillava con un vento uguale dappertutto (`U.wind` nei materiali), e ai client non arrivava niente. La riga 11 dello studio chiede il vento che il mondo legge; **D3** chiede la risoluzione più fine che il carico fisso regge accanto all'acqua a due celle per lato di casella, misurata e scritta.

## Decisione

1. **La risoluzione (D3), misurata** (`lab/scripts/misura-vento.ts`, rapporto in `lab/terreno-3d/misure/vento.md`; Node 22, la finestra di riferimento 108 × 90 caselle, l'implementazione vera):

   | vento, cella (caselle) | celle | passo intero, mediana | ns/cella | statico ms/tick a 10 Hz | acqua D3 + vento | + fumo e fuoco |
   |---:|---:|---:|---:|---:|---:|---:|
   | 0,5 | 38 880 | 4,39 ms | 113 | 0,745 | **2,106: non entra** | 2,190 |
   | **1** | 9 720 | 1,09 ms | 113 | 0,186 | **1,547: entra** | 1,631 |
   | 2 | 2 430 | 0,27 ms | 113 | 0,047 | 1,407 | 1,492 |
   | 3 | 1 080 | 0,12 ms | 113 | 0,021 | 1,382 | 1,466 |

   Il vento è **a una cella per casella** (`DEFAULT_CELL.wind = 1`, dieci passi al secondo): la più fine accanto all'acqua di D3 (`flow` a `cell: 0.5`, 1,361 ms/tick statici) entro il bilancio fisso di 2,0 ms/tick, con il posto per il fumo e il fuoco (`diffuse`, `table`). A due celle per lato di casella supera il bilancio già da solo con l'acqua, e il validatore non l'ammette (`CELL_SIZES.wind` resta `1 | 2 | 3`). Il costo per cella è rimisurato: `NS_PER_CELL.wind` da 100 a **115 ns**.
2. **Il passo spezzato nei tick fra due**: un passo del vento sono `2 × H` unità (prima ogni riga collide, poi ogni riga scorre nell'altro buffer, poi i buffer si scambiano: `WindField.work`, `step`), e il motore ne fa in ogni tick la stessa parte di ciò che resta, intero nel tick che l'accumulatore dice (`AutomataEngine.windTick`). **Lo stesso campo byte per byte** di un passo alla volta (`tests/vento.test.ts`), e chi legge il campo legge sempre un passo intero (la collisione conserva i momenti che `velocity` legge; durante lo scorrimento si legge il buffer collisionato). Misurato: il vento da solo costa 0,20 ms a ogni tick (p95 0,22) invece di 1,09 ms ogni sesto, e un tick con l'acqua di D3 e il vento a una cella per casella ha il massimo da 4,5-11,3 ms (tre corse) a 2,8-3,0 (sul banco condiviso con altri agenti: le mediane e i p95 dell'acqua hanno il rumore che dice il rapporto). Una finestra che cambia finisce prima il passo del campo che lascia (`copyFrom`).
3. **Il vento dominante dal tempo del mondo**: `prevailingAt(seed, giorni, spec)`, una funzione lenta del giorno del mondo (`time / daySeconds`, come la luce) e del seme, mai dell'orologio: quattro chiavi al giorno (`PREVAILING.perDay`), ognuna che gira la direzione media fino a 0,6 radianti e ne toglie fino a metà della forza, con l'interpolazione liscia fra due; la media è `prevailing` della specifica, o 0,06 verso una delle 16 direzioni della rosa dal seme. Solo aritmetica (il giro è un polinomio, la lunghezza una radice quadrata): uguale in ogni motore. Un passo nuovo comincia col vento dominante di quel momento; l'`AutomataWorld` dice i giorni (`days`).
4. **Il vento del mondo**: il primo automa `wind` dichiarato (`windSpecOf`). Si legge nelle **unità del mondo** (1 = il vento dominante più forte, `WIND_LIMITS.inflow`; una raffica fino a `WIND_MAX` = 1,5): `Kernel.worldWind(x, y)` → `{vx, vy, speed}`, una copia, il vento dominante fuori dalla finestra, `undefined` senza vento; in uno specchio ciò che dice il server. In `src/kernel/wind.ts`, puro.
5. **La vela** (`vehicle.sail`, 0-1, solo sull'acqua): la parte della spinta che dà il vento; il passo del veicolo prende un fattore (`vehicleStep(…, push)`), `sailPush(sail, prua, vento)` = `1 − sail + sail × polare × forza`, la polare un polinomio del coseno fra la prua e il vento (al traverso tutto, in poppa 0,7, di bolina meno, controvento niente). Senza vela o senza vento la spinta di prima; `power` di Lua moltiplica ancora. Il kernel dà `sail` 0,75 (`SAIL`) a ciò che la Fucina fa sull'acqua col nome di un veliero (`saysSail`: vela, veliero, galeone, brigantino, caravella, goletta, sloop…, in `vehicleFor`); il resto della spinta è dei remi, così controvento si avanza appena.
6. **Il fuoco sottovento**: `world.wind(x, y)` per Lua (`Host`, `prelude.lua`, `LUA_API`, il prompt dell'Ingegnere), una copia; `sys.fire` del seme brucia più lontano dalla parte dove il vento soffia e meno contro (il centro spostato di `0,8 × r × vento`, la portata `r + 0,6 + 0,4 × forza`), come prima dove il mondo non ha vento.
7. **Il vento grossolano ai client, a elenco** (regola 8f, V-049): `update.wind` (e `welcome.wind`) è un `WindView`: l'angolo della finestra in caselle, le celle, una cella ogni tre caselle su 108 × 90 attorno al viandante (36 × 30 celle, la media delle sue 9 caselle), il vento dominante, e due byte con segno a cella (est, sud, su `WIND_MAX`) in base64; al più `WIND_VIEW.hz` (2) volte al secondo del mondo e solo quando è cambiato, `null` quando il mondo non ha più vento. Misurato: 1,5 ms a farla, 2 953 byte a messaggio, 5,9 KB al secondo; il server ne fa una per finestra e per mezzo secondo e la dà a chi vi sta. Il client la legge senza fidarsi (`readWindView`: interi entro i tetti, una cella che il kernel conosce, il vento dominante entro `WIND_MAX`, celle quante la misura dice); niente altro degli automi esce, e uno specchio non ne fa girare nessuno.
8. **L'erba e gli alberi**: la vista grossolana (da soli quella del kernel, in molti quella del server: `Kernel.windView`) è una piccola texture (`U.windTex`, `windToTexture`); ciò che ha i pesi `sway` si piega dalla parte dove il vento soffia quanto è forte, respira con lui e trema di traverso, nel riferimento del modello (`WIND_VERTEX`). Senza vento come prima, uguale dappertutto; la corona mai (non è il mondo).
9. **Il fumo**: ciò che brucia (un'entità con `fire`) fa sbuffi grigi che salgono e vanno dove il vento soffia, letto dalla vista grossolana (`src/render/smoke.ts`): solo disegno, ogni client il suo, niente nel kernel né sul filo; senza vento niente fumo, come prima. Il fumo come campo resta il `diffuse` con `advect` di T482.

## Conseguenze

- **Aggiuntivo**: il contratto resta `0.10` (kernel `0.10.31`). Senza `nature.automata` niente cambia: nessun vento, la vela come prima, il fuoco in tondo, la vegetazione di prima, niente sul filo. Un mondo con un `wind` di T482 senza `cell` passa a una cella per casella (nessun universo ne ha ancora uno).
- **Nessuna ambientazione porta ancora il vento**: lo dichiara il Fisico su richiesta del Referente (`physics.automaton`); i Pirati e le vele lo aspettano dalla natura della Genesi.
- **Non provato**: una chiamata vera al Fisico (solo `MockAiModels`), una rete vera (i collegamenti finti e una preview), le GPU integrate.

## Alternative scartate

- **Il vento a due celle per lato di casella**: 0,745 ms/tick statici, con l'acqua di D3 2,106 oltre il bilancio; si dovrebbe alzare il bilancio o abbassare l'acqua, contro D3.
- **Il passo intero in un tick**: lo stesso campo, ma un picco di 1,1 ms (4,5 con quattro finestre in molti) ogni sesto tick.
- **`power` scritto dal kernel nel componente**: cancellerebbe ciò che chiede Lua; il fattore nel passo li tiene tutti e due.
- **Il vento intero sul filo** (una cella per casella, 9 720 celle): 26 KB al secondo a client per un aspetto che la vista grossolana filtrata già dà.
- **Il fumo come campo disegnato** (il `diffuse` sulla GPU): è l'aspetto di A3.
