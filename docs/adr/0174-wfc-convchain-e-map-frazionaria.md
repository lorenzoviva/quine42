# ADR-0174 — MarkovJunior: `wfc` a tessere e a sovrapposizione, `convchain`, la `map` frazionaria, solo testo

Data: 2026-11-08 · Stato: accettato (task T335 del backlog, step 30) · Riferimenti: l'autore in chat (07/11, punti 1 e 2), `lab/banco/pattern.md` §11-12, ADR-0036 e ADR-0038 (MarkovJunior nel gioco e nel laboratorio), ADR-0037 (solo testo, regola 11), ADR-0108 (la cache delle forme), ADR-0136 (la versione del kernel), ADR-0142 (il motore non cambia un voxel), ADR-0171 (le regole da file e `<import>`), ADR-0173 (l'inferenza e i suoi tetti); il sorgente di MarkovJunior (github.com/mxgmn/MarkovJunior, MIT): `WaveFunctionCollapse.cs`, `TileModel.cs`, `OverlapModel.cs`, `ConvChain.cs`, `Map.cs`, `Rule.cs`, `Grid.cs`, `SymmetryHelper.cs`

## Contesto

`wfc` a tessere è il cuore di `ModernHouse`, `SeaVilla`, `Apartemazements`, `PillarsOfEternity`, `Partitioning`, `Surface` e degli `Escher`;
`convchain` di `ChainDungeon`; `ModernHouse` e `SeaVilla` vogliono anche `map` a scala frazionaria (`1/3`, `5/3`). Il compilatore li
rifiutava e il motore accettava solo scale intere (`lab/banco/pattern.md` §12). L'autore vuole ricomporre con `wfc` i sottoblocchi di
T333. L'originale legge tessere e regole da file `.vox` e campioni da immagini PNG: qui solo testo (regola 11).

## Decisione

1. **Il formato testuale.** Un tileset è un file di `models/` (`<wfc tileset="x">` legge `models/x.xml`) con radice `<tileset values
   fullSymmetry>`, `<tiles><tile name weight file>…</tile></tiles>` e `<neighbors><neighbor left right | top bottom/></neighbors>`, come i
   tileset dell'originale. I voxel di una tessera sono la sintassi di un pattern (strati dall'alto, righe separate da `/`, `#` una nota):
   il testo del suo `<tile>`, oppure `models/<file>.txt`, oppure `models/<tiles>-<nome>.txt` (`tiles` sulla `wfc`, se no il nome del
   tileset, come la cartella dei `.vox` dell'originale). Le lettere del tileset, nell'ordine dei suoi `values`, vanno su quelle del nodo
   per posizione, come l'originale stende sui `values` i colori dei suoi `.vox` nell'ordine in cui compaiono: lo stesso tileset serve
   programmi con lettere diverse (Escher e PeriodicEscher); senza `values` le sue lettere sono quelle del nodo. Un campione (`sample`
   della `wfc` a sovrapposizione e di `convchain`) è un pattern piano `models/<nome>.txt`, nelle lettere del nodo (per `convchain` le sue
   `black` e `white`). Una regola da file in una griglia con `folder="F"` si legge da `models/F-<nome>.txt` (l'originale:
   `resources/rules/F/<nome>.vox`); `legend`, che dà lettere ai colori di un'immagine, su un file di testo non serve e si ignora con un
   avviso. Tutto per nome semplice dentro `models/` (ADR-0171): `mjxIncludes` raccoglie tileset, tessere, campioni e i file nelle cartelle,
   e la cache delle forme li conta.

2. **Come nell'originale.** `src/mj/wfc.ts` (funzioni pure e il `WfcSolver`): le 8 simmetrie del quadrato e le 48 del cubo nell'ordine
   di `SymmetryHelper`, le tessere con le loro rotazioni senza doppioni, i vicini con le rotazioni scritte davanti al nome, il propagatore
   nelle sei direzioni; le finestre N×N di un campione con le simmetrie del nodo, contate, e il propagatore delle finestre che si
   accordano; l'onda: la cella di meno entropia (`shannon`) o di meno motivi con un rumore di un milionesimo, il motivo estratto per peso,
   le esclusioni propagate; fino a `tries` tentativi (1000), ognuno da un seme estratto dal generatore della corsa. La griglia nuova: a
   tessere `(S - overlap)·M + overlap` per asse (le tessere scritte in ordine, l'ultima vince dove si sovrappongono; `overlap` negativo
   lascia spazi vuoti), a sovrapposizione la stessa griglia, sempre periodica e solo piana. Le `<rule in out>` della `wfc` dicono quali
   tessere (per nome, con `|`) o quali lettere può avere una lettera della griglia. `convchain`: le celle `on` diventano a caso `black` o
   `white`, poi ogni passo è una passata di Metropolis sulle finestre del campione, ammorbidita da `temperature`; solo piana. `map
   scale="5/3 …"`: la griglia nuova è M·N/D (divisione intera) e una regola scrive a x·N/D, solo con la griglia nuova vuota. Con i tileset
   e il campione dell'originale portati in testo, il numero dei motivi e dei vicini per direzione è quello dell'originale, voce per voce
   (`tests/mj-wfc.test.ts`).

3. **Il compilatore fa lo statico, il motore l'onda.** Rotazioni, vicini e finestre si calcolano nella compilazione: il nodo `wfc` del
   motore (`WfcNode`) porta motivi, pesi, propagatore e le regole come indici, e il motore li controlla da sé (il pavimento). Il
   `WfcRunner` in **un passo** osserva l'onda e cambia la griglia come una `map`; i nodi dentro la `wfc` girano sulla griglia nuova in una
   sequenza `gated`: se l'onda non ha soluzione la griglia resta e quei nodi non girano, come il ramo dell'originale. Una `map` intera,
   una sequenza senza `gated` e ogni altro nodo restano identici (ADR-0142, `tests/mj-engine-determinism.test.ts`).

4. **Le unioni appartengono alla loro griglia.** Nell'originale ogni griglia (la radice, una `map`, una `wfc`) ha le sue unioni:
   ModernHouse scrive `.` tre volte con lettere diverse, SeaVilla `?` due volte. Un simbolo scritto con lettere diverse in due griglie (e
   `.`, che nel motore è l'aria) diventa in ognuna un simbolo privato (dall'area d'uso privato di Unicode, mai scritto da nessuno);
   un'unione con un solo significato resta nella tabella del programma, come prima: i programmi di oggi compilano uguali.

5. **Dove si scosta dall'originale, e perché.** (a) Una cella senza motivi è sempre una contraddizione: l'originale guarda solo la prima
   cella e altrimenti lascia una cella senza motivo, che disegna a caso con un generatore senza seme. (b) L'onda si osserva in un passo:
   l'originale conta un passo per osservazione (lo stesso esito, meno passi). (c) `convchain` senza celle `on` non fa niente, ora né poi:
   l'originale conterebbe passate vuote. (d) I campioni e le tessere sono testo nelle lettere del programma (punto 1): un `.vox` o un PNG
   dell'originale si porta con `lab/scripts/mjx-risorse.ts`, che stende i colori sulle lettere nell'ordine in cui compaiono.

6. **I tetti** (`WFC_LIMITS`): 2048 motivi per nodo, 1000 tentativi, 4 milioni di vicini, 128 MB per le due onde di un nodo, N di
   `convchain` fino a 4 (2^16 pesi), campioni fino a 16 384 celle: contano unità, sono gli stessi su ogni macchina, e oltre sono un errore
   del programma col motivo. Il tempo è un tetto a parte, come la ricerca di ADR-0173: **10 s** per `wfc` e comunque entro la scadenza della
   corsa; chi lo supera ferma la corsa, che **non è finita**: mai un esito diverso per una macchina più lenta. `convchain` senza `steps`
   prosegue fino al tetto dei passi della corsa.

7. **Il gioco non li prende ancora**: il validatore (`modelErrors`) e le carte fatte a mano (`handmadeProgramErrors`) rifiutano un
   programma con `wfc` o `convchain` (e, come prima, `field` e `observe`) con il motivo (`newNodesRefusal`, `newNodesIn`). Li apre T336,
   con il prompt dello Scultore; allora il validatore dovrà anche riconoscere un tileset fra i file `.xml` di `models/` (oggi lo prende per
   un programma senza radice valida e lo rifiuta) e controllare tessere e campioni come i `.txt` delle regole. La `map` frazionaria passa:
   è una `map`.

8. **Il laboratorio.** In `lab/mjx/official/` ModernHouse, SeaVilla, Apartemazements, PillarsOfEternity, Partitioning, Surface, Escher,
   EscherSurface, OrientedEscher, PeriodicEscher, ChainDungeon, ChainDungeonMaze, WaveDungeon e StairsPath intero, copiati invariati, con
   le risorse dell'originale in testo in `lab/mjx/official/resources/` (nel laboratorio anche per i programmi scritti lì; nella build dei
   giocatori no). Le foto dai quattro lati in `lab/banco/wfc/`, accanto a quelle della griglia che dà l'originale in C# (un `Program.cs`
   che legge i PNG senza ImageSharp, `lab/banco/wfc/originale/`). La traccia scrive cosa fa una `wfc` e a che tentativo ha trovato;
   l'editor colora i nodi e gli attributi nuovi e non prende per pattern le regole di una `wfc`.

## Conseguenze

- `src/mj/` è del kernel: il kernel sale a **0.5.10** (Z, ADR-0136). Il contratto con gli universi non cambia: nessun programma di
  oggi cambia un voxel (il compilato di una `map` intera e delle unioni con un solo significato è lo stesso).
- Il confronto con l'originale è esatto dove non dipende dal caso (motivi e vicini di ogni tileset e del campione di WaveDungeon) e
  nelle distribuzioni dove ne dipende (la sola onda di SeaVilla e Apartemazements, su più semi). ModernHouse, come l'originale, a volte
  si ferma alla pianta di 17×17×4, quando la seconda onda è contraddittoria fin dall'inizio. SeaVilla dopo l'onda si scosta: nei nodi di
  prima (path, field) un seme su dodici lascia una `l` senza strada e la villa resta piccola; l'originale su otto semi mai. Non viene dai
  nodi nuovi: è da indagare in un task a parte.
- Sicurezza: nessuna superficie nuova verso i client (i programmi del mondo non arrivano ancora a `wfc` e `convchain`, punto 7); i file
  letti sono quelli di ADR-0171, per nome semplice dentro `models/`; i tetti del punto 6 sono ciò che T336 dovrà tenere quando li apre.
