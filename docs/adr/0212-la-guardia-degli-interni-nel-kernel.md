# ADR-0212 — La guardia degli interni nel kernel: il palco a classi e il cammino che nessun mobile chiude

Data: 2026-11-17 · Stato: accettato (task T409 del backlog, step 30; § 10.1 di `docs/design/scenografo.md`, riscritto da T406) ·
Riferimenti: ADR-0179 (le parti abitabili, `PARTS`, `partErrors`), ADR-0182 (le aree di una struttura, `areasOf`), ADR-0209 (le strutture a
16 voxel per casella), ADR-0135 (la cantina e la lettera del suolo), ADR-0108 (la cache delle forme), ADR-0136 (la versione del kernel); le
misure di T259, T303 e T406 in `docs/design/scenografo.md` § 2-10

## Contesto

L'autore ha deciso (D37, T182 domanda 2, opzione C) che gli interni li scriva un agente a parte, lo **Scenografo**, sull'edificio già
fatto. T259 ha provato sul banco due vie (un programma MarkovJunior di secondo stadio, i mobili esistenti come dati) con le stesse classi
dello strato dei piedi e una «guardia» sulla connessione dei centri; T303 e T406 le hanno misurate con lo Scultore di oggi e la CLI: la
raccomandazione è separare, dati come base e programma come secondo passo. Il § 10.1 chiede il primo pezzo nel gioco, senza modelli: la
guardia nel kernel. Le misure di T406 dicono anche cosa la guardia del banco non difende: la stanza dello Scultore (un mobile contro il muro
la porta sotto 28 voxel su un seme in 3 richieste di dati su 4) e il posto degli animali (il programma ne copre il 2-10 % nella fattoria).
Nel portarla nel kernel è venuto fuori un terzo buco: sulla locanda e sul laboratorio di T259 (le due con la cantina) uno scaffale fino al
soffitto accanto alla scala toglie il piano di sopra, e la guardia del banco non se ne accorge, perché il suo grafo dei centri è più largo del
cammino vero (un passo fra due altezze della scala si chiude anche se i due centri restano in piedi).

## Decisione

1. **Un modulo del kernel, `src/kernel/interior.ts`**, con la sola dipendenza di `forms.ts` (il cammino `walkIn`, i piani `storeysOf`, le
   celle dove si sta in piedi `standingCells`, ora esportati senza cambiare ciò che misurano): l'interno è il pavimento, non un compito
   dell'agente, uguale per tutte le vie.
2. **Il piano** (`interiorPlan`): sullo strato dei piedi di ogni piano raggiunto il pavimento libero (i centri del corpo allargati del
   corpo) **solo dove sopra c'è qualcosa dell'edificio**, il cortile e i campi no, nemmeno dove il corpo sporge oltre la gronda; il protetto
   (la porta e la strada dritta che entra, i piedi e le teste delle scale a riempimento senza passare i muri, ciò che non è di nessuna
   stanza, le stanze sotto `SMALL_ROOM` 0,6 caselle², **i piani sotto `SMALL_STOREY` 2 caselle²** coperte, come in T303 e T406: a 16 i piani
   di Opus a Grande sono di 4,5-6,3 caselle² e la soglia di T259, 4, lasciava un margine stretto); il posto degli animali, le caselle delle
   aree che li nominano (`ANIMAL_AREAS`: `pasture`, `barn`, `stable`, `pen`… e le radici italiane).
3. **Il palco** (`stageGrid`): le classi come lettere, `W` l'edificio, `F` il pavimento libero, `C` quello sotto il suolo, `P` il protetto,
   `A` il pavimento libero degli animali; un programma di secondo stadio legge solo queste, così uno serve ogni seme (un programma per tipo,
   le istanze sono semi).
4. **La guardia** (`InteriorGuard`), un pezzo alla volta (i gruppi di voxel 6-connessi, `furniturePieces`), il pezzo intero o niente.
   Rifiuta (`Refusal`) ciò che scrive sull'edificio (`wall`), sul posto degli animali dal suolo fino a una persona sopra il piano terra
   (`animals`, **come `W`**), sotto il suolo una cima che non arriva al soffitto (`cellar`: un pavimento che nessuno raggiunge annullerebbe
   la cantina, ADR-0135), ciò che porta **la stanza dello Scultore** sotto la sua misura (`room`: il lato del quadrato più grande sotto un
   soffitto alto un piano, come `habitableParts`, mai sotto `partVoxels(vpt).room.side` o sotto quello che era, se era meno), ciò che taglia
   fuori qualcosa (`cut`). Il taglio è **il cammino del kernel** (`walkIn` senza i salti): ogni posto e ogni passo dalla porta, con i
   pavimenti e i bordi di `rampBlocks`; con il pezzo il terreno si rifà (`groundOfForm`) e i passi verso le colonne entro un corpo dal pezzo
   si riprovano; ogni posto raggiunto prima che il pezzo non occupa (un corpo vi starebbe dentro) va raggiunto ancora. Più stretta della
   guardia del banco: un passo nuovo non conta, uno perso sì.
5. **Il mobile non tocca mai l'edificio**: `furnishFromStage` mette nell'edificio ciò che un programma ha scritto sul palco, una lettera con un
   colore dove c'era aria o una classe di pavimento, ogni pezzo dalla guardia; la via dei dati usa la stessa guardia pezzo per pezzo.
6. **La chiave dell'interno** (`interiorKey`, `furnishedResult` in `forms.ts`): un edificio arredato è una voce della cache delle forme con
   la chiave dell'edificio (`formKey`) e quella dell'interno (la via, il testo del programma o delle regole, il seme dell'arredo); la testa è
   un JSON che una `formKey` non ha mai (un seme è un numero), così le due non si scambiano e l'edificio vuoto tiene la sua.
7. **Kernel 0.9.2**: nessun formato cambia, nessun universo è toccato; nessun agente scrive ancora un interno (lo Scenografo è il § 10.2-10.3).

## Conseguenze

- Sugli edifici di `misura/` (a 20) e `misura16/` (a 16) e sui sei di T259 il programma offline sul palco del kernel arreda e regge (la
  misura del banco: piani, porta, cantina, ogni centro non toccato ancora raggiunto); la locanda e il laboratorio, che con la guardia del banco
  perdevano un piano, reggono. Le risposte dei dati di T303 e T406 (2 × 4 semi × 2 edifici × 2 misure, 32 arredi) reggono tutte e la stanza dello Scultore
  resta a 28 dove con la guardia del banco scendeva a 22-27 (8 casi). Sulla fattoria al seme 3 i due programmi di T406 lasciano il posto
  degli animali libero al 100 % (con la guardia del banco 63 % e 94 %) e uno, che con quella non reggeva, regge.
- Arredare costa di più: il terreno si rifà a ogni pezzo, 0,6-1,1 s per edificio sul banco (T259 stimava 100-450 ms). Va nel worker delle
  forme al primo ingresso (§ 6); se pesa, il terreno si può rifare solo nella finestra del pezzo.
- La guardia del banco resta per i numeri di T259-T406; `guardiaDelKernel` e `arredaNelKernel` (`lab/banco/scenografo/misura.ts`) danno la
  guardia del kernel al banco.
- I salti non sono difesi: un posto raggiunto solo saltando non è nel cammino della guardia.
