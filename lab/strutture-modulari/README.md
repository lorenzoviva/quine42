# Il prototipo delle strutture modulari (T522)

Lo studio è [`docs/design/strutture-modulari.md`](../../docs/design/strutture-modulari.md). Qui un set di **tasselli** nello stile delle palazzine
di `neapolis`, la lettura delle loro facce dai voxel come la farebbe il kernel, il **tessuto** a WFC sopra 3 × 3 luoghi (col risolutore della
`wfc` di MarkovJunior, `WfcSolver` di `src/mj/wfc.ts`), la regola 10 sul grafo dei tasselli e col cammino del kernel (`walkIn`), le foto. Nessun
modello è stato chiamato e niente del gioco cambia.

```bash
npx vite-node lab/scripts/strutture-modulari.ts -- [--semi 10] [--piani 5] [--foto] [--json f.json]
```

Senza `--foto` circa un minuto a seme su una macchina carica (il modo col collaudo della regola 10 è il più lento); le foto vanno in `foto/`,
`misure.json` è la corsa di 6 semi con le foto.

## I file

| file | che cosa |
|---|---|
| `tasselli.ts` | il set: 24 tasselli scritti a mano come li scriverebbe lo Scultore (nel gioco sarebbero programmi MarkovJunior; qui poche scatole in TypeScript, perché il prototipo misura il tessuto, non il disegno), coi colori della «Palazzina di tufo» di `neapolis` e un cemento a vista; il vano è 2 × 2 caselle e un piano, 32 × 32 × 32 voxel a 16 per casella |
| `facce.ts` | la lettura delle facce dai voxel (aria, muro, parapetto, passaggio alla sua quota, porta; le etichette delle facce interne dei tasselli di più vani), la tabella di ciò che si accosta, i motivi con le rotazioni, il propagatore per `WfcSolver`, i controlli del set |
| `tessuto.ts` | il tessitore (`Weaver`): angoli, bordi e interni dei luoghi, ognuno un'onda da un seme suo coi margini; la massa (`Massing`: altezze, nuclei, la metà di ogni nucleo); il tessuto di base (`baseFabric`); il collaudo della regola 10 nella finestra di una regione; il grafo dei raggiunti (`reached`, `reachFrom`); le coppie incompatibili (`violations`); i voxel di un rettangolo di vani |
| `../scripts/strutture-modulari.ts` | le misure, le scale col cammino del kernel, la sovraimpressione, il cammino del kernel sul luogo di mezzo, le foto |

## Le misure (6 semi, 3 × 3 luoghi, 27 × 27 vani, 5 piani)

| | stanze a terra | stanze sopra | scale e nuclei | regioni senza soluzione | coppie incompatibili | ms per 3 × 3 luoghi | stesso risultato nell'altro ordine |
|---|---|---|---|---|---|---|---|
| WFC libero | 2 160 / 2 490 (87 %) | 39 / 5 656 (1 %) | 153 / 825 (19 %) | 0 su 294 | 0 | 4 779 | 6/6 |
| massa e nuclei, margini liberi | 726 / 1 168 (62 %) | 1 368 / 2 378 (58 %) | 2 564 / 3 661 (70 %) | 34 su 294 | 2 565 | 12 695 | 6/6 |
| massa, nuclei e tessuto di base | 1 008 / 1 678 (60 %) | 1 078 / 2 382 (45 %) | 2 156 / 3 653 (59 %) | 0 su 294 | 0 | 4 566 | 6/6 |
| massa, nuclei, tessuto di base e collaudo della regola 10 | 1 590 / 1 699 (94 %) | 2 061 / 2 400 (86 %) | 3 276 / 3 632 (90 %) | 75 su 294 (resta la base) | 0 | 23 097 | 6/6 |
| il tessuto di base da solo (seme 1) | 292 / 294 | 374 / 376 | 570 / 574 | — | 0 | — | — |

«Raggiunte» sono i vani coperti raggiunti dalle strade sul grafo dei tasselli (passaggi e porte entro un gradino, le cuciture interne delle scale
e dei nuclei); i tetti non contano (le case del gioco non li fanno raggiungere). «Regioni senza soluzione» col tessuto di base vuol dire che lì
è rimasta la base, che è valida; senza base (margini liberi) una regione senza soluzione è invalida e le coppie incompatibili lo dicono.

- **Il set**: 24 tasselli, 42 vani, 149 motivi con le rotazioni, 70 918 coppie nel propagatore, letti in 0,2-0,3 s.
- **Le regioni** (seme 1, col collaudo, macchina carica): un angolo 45 ms in media, un bordo 230-340 ms, un interno 1,8 s; senza collaudo e
  senza massa 3 / 15 / 70 ms.
- **Le scale col cammino del kernel** (ogni tassello di più piani da solo in un cortile): la scala dritta e i nuclei di 2, 3 e 4 piani si
  salgono fino all'ultimo piano (i piedi a 34, 66, 98 voxel).
- **Il grafo contro il cammino del kernel** (luogo di mezzo e un vano attorno, 352 × 352 × 160 voxel, 2-3 s): sul tessuto col collaudo 152 vani
  concordano, 14 solo dal grafo (il vano in cima alla tromba di un nucleo, che a quel piano non ha pavimento, e tetti raggiunti per vie fuori
  dalla finestra), 0 solo dal cammino; sul WFC libero 71 e 0 e 0.
- **La sovraimpressione** (seme 1, senza massa): 56 villette in piedi tenute tutte, 27 con una stanza sopra, nessuna regione senza soluzione.
- **Un luogo** (col collaudo, seme 1): 405 vani, 221 non vuoti, 51 motivi diversi di 17 tasselli, 810 byte.

## Le foto

| | |
|---|---|
| `foto/tasselli.png` | il catalogo: strada, portico, sala, stanze con uno, due e tre muri, le porte, la villetta, la loggia, il muro di cemento, i tetti, il ponte, la scala dritta, i nuclei di 2, 3 e 4 piani |
| `foto/quartiere-massa.png` | 3 × 3 luoghi, massa, tessuto di base e collaudo (seme 1, a metà dei voxel): blocchi, strade, cortili, nuclei di cemento, terrazze con le antenne e i panni |
| `foto/luogo-di-mezzo.png` | il luogo di mezzo, a tutti i voxel, da due lati |
| `foto/quartiere-libero.png` | lo stesso quartiere col WFC libero: tutto pieno fino in cima, illeggibile (e l'1 % delle stanze in alto raggiunte) |
| `foto/quartiere-sovraimpressione.png` | il WFC libero con 56 villette in piedi tenute (senza massa: assomiglia al libero) |

## Che cosa ha insegnato, in ordine

1. Una ringhiera o un parapetto letti sulla sola fascia esterna sembrano un pavimento rialzato: il passaggio deve continuare dentro il vano
   entro un gradino (il terzo strato).
2. Senza la massa il WFC riempie tutto e quasi nessuna stanza in alto si raggiunge (1 %).
3. Una chiocciola in 2 × 2 caselle non si sale: sotto l'impronta del corpo la rampa sale più di un gradino. La scala a due rampe sì, se il
   pianerottolo di mezzo è più profondo dell'impronta (12 contro 9) e la prima rampa è piena sotto (altrimenti `levelAt` sceglie il pavimento
   sotto di lei).
4. I due vani di un nucleo li deve dire la massa: lasciati al WFC, si accoppiano due metà di due nuclei attraverso i blocchi.
5. Un ponte lasciato al WFC è una catena senza fine su una fila di vani bassi (il tunnel infinito di marian42): i ponti li dichiara la massa.
6. Due bordi che immaginano in due modi lo stesso vano dell'interno lo rendono impossibile: i margini vanno fissati al tessuto di base, che
   resta anche dove una regione fallisce.
7. Una porta d'angolo è chirale: le rotazioni non danno la sua immagine allo specchio (`porta-angolo-specchio`).
8. Il WFC, anche valido, peggiora la raggiungibilità del tessuto di base: ogni regione si collauda (il 94 % e l'86 %); il collaudo ingenuo costa
   cinque volte il tempo.

## Che cosa non fa

I tasselli sono funzioni TypeScript e non programmi MarkovJunior, non variano per seme; il tessuto è in piano (niente rilievo vero); i tetti
non si raggiungono; la sovraimpressione non usa la massa; il collaudo guarda la finestra della regione e non il luogo intero; niente è nel kernel,
nel renderer o sul filo.
