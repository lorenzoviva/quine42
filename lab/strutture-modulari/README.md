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
| `tasselli.ts` | il set: 25 tasselli scritti a mano come li scriverebbe lo Scultore (nel gioco sarebbero programmi MarkovJunior; qui poche scatole in TypeScript, perché il prototipo misura il tessuto, non il disegno), coi colori della «Palazzina di tufo» di `neapolis` e un cemento a vista; il vano è 2 × 2 caselle e un piano, 32 × 32 × 32 voxel a 16 per casella |
| `facce.ts` | la lettura delle facce dai voxel (aria, muro, parapetto, passaggio alla sua quota, porta; le etichette delle facce interne dei tasselli di più vani), la tabella di ciò che si accosta, i motivi con le rotazioni, il propagatore per `WfcSolver`, i controlli del set |
| `tessuto.ts` | il tessitore (`Weaver`): angoli, bordi e interni dei luoghi, ognuno un'onda da un seme suo coi margini; la massa (`Massing`: altezze, nuclei, la metà di ogni nucleo); il tessuto di base (`baseFabric`); il collaudo della regola 10 nella finestra di una regione; il grafo dei raggiunti (`reached`, `reachFrom`); le coppie incompatibili (`violations`); i voxel di un rettangolo di vani |
| `../scripts/strutture-modulari.ts` | le misure, le scale col cammino del kernel, la sovraimpressione, il cammino del kernel sul luogo di mezzo, le foto |

## Le misure (6 semi, 3 × 3 luoghi, 27 × 27 vani, 5 piani, 25 tasselli)

| | stanze a terra | stanze sopra | scale e nuclei | regioni senza soluzione | coppie incompatibili | ms per 3 × 3 luoghi | stesso risultato nell'altro ordine |
|---|---|---|---|---|---|---|---|
| WFC libero | 2 201 / 2 627 (84 %) | 79 / 5 609 (1 %) | 189 / 777 (24 %) | 0 su 294 | 0 | 2 936 | 6/6 |
| massa e nuclei, margini liberi | 773 / 1 085 (71 %) | 1 606 / 2 373 (68 %) | 2 925 / 3 663 (80 %) | 40 su 294 | 3 102 | 8 803 | 6/6 |
| massa, nuclei e tessuto di base | 988 / 1 682 (59 %) | 1 004 / 2 392 (42 %) | 1 944 / 3 644 (53 %) | 0 su 294 | 0 | 2 783 | 6/6 |
| massa, nuclei, tessuto di base e collaudo della regola 10 | 1 567 / 1 702 (92 %) | 2 003 / 2 400 (83 %) | 3 134 / 3 632 (86 %) | 74 su 294 (resta la base) | 0 | 15 492 | 6/6 |
| il tessuto di base da solo (seme 1) | 292 / 294 | 374 / 376 | 570 / 574 | — | 0 | — | — |

«Raggiunte» sono i vani coperti raggiunti dalle strade sul grafo dei tasselli (passaggi e porte entro un gradino, le cuciture interne delle scale
e dei nuclei); i tetti non contano (le case del gioco non li fanno raggiungere). «Regioni senza soluzione» col tessuto di base vuol dire che lì
è rimasta la base, che è valida; senza base (margini liberi) una regione senza soluzione è invalida e le coppie incompatibili lo dicono.

- **Il set**: 25 tasselli, 43 vani, 153 motivi con le rotazioni, 76 118 coppie nel propagatore, letti in 0,2-0,3 s.
- **Le regioni** (seme 1, col collaudo, macchina carica): un angolo 30 ms in media, un bordo 160-250 ms, un interno 1,15 s; senza collaudo e
  senza massa 3 / 15 / 70 ms.
- **Le scale col cammino del kernel** (ogni tassello di più piani da solo in un cortile): la scala dritta e i nuclei di 2, 3 e 4 piani si
  salgono fino all'ultimo piano (i piedi a 34, 66, 98 voxel).
- **Il grafo contro il cammino del kernel** (luogo di mezzo e un vano attorno, 352 × 352 × 160 voxel, 1-3 s): sul tessuto col collaudo 139 vani
  concordano, 15 solo dal grafo e 5 solo dal cammino, tutti sul bordo della finestra (vie fuori dalla finestra; la terra fuori dalla finestra
  che il cammino prende per aperta) o in cima alla tromba di un nucleo; sul WFC libero 79, 0 e 0.
- **La sovraimpressione** (seme 1, sulla massa col tessuto di base e il collaudo): 37 villette in piedi tenute tutte, 21 con una stanza sopra (le
  sopraelevazioni), 15 regioni rimaste alla base, 0 coppie incompatibili; stanze raggiunte 279 / 302 a terra e 282 / 376 in alto.
- **Un luogo** (col collaudo, seme 1): 405 vani, 221 non vuoti, 61 motivi diversi di 19 tasselli, 810 byte.

## Le foto

| | |
|---|---|
| `foto/tasselli.png` | il catalogo: strada, portico, sala, stanze con uno, due e tre muri, le porte, la villetta, la loggia, il muro di cemento, i tetti (anche quello coi quattro parapetti), il ponte, la scala dritta, i nuclei di 2, 3 e 4 piani |
| `foto/quartiere-massa.png` | 3 × 3 luoghi, massa, tessuto di base e collaudo (seme 1, a metà dei voxel): blocchi, strade, cortili, nuclei di cemento, terrazze con le antenne e i panni |
| `foto/luogo-di-mezzo.png` | il luogo di mezzo, a tutti i voxel, da due lati |
| `foto/quartiere-libero.png` | lo stesso quartiere col WFC libero: tutto pieno fino in cima, illeggibile (e l'1 % delle stanze in alto raggiunte) |
| `foto/quartiere-sovraimpressione.png` | la massa con 37 villette in piedi tenute, alcune con un piano sopra (a quella scala assomiglia al quartiere con la massa) |

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
8. Il WFC, anche valido, peggiora la raggiungibilità del tessuto di base: ogni regione si collauda; il collaudo ingenuo costa cinque volte il
   tempo.
9. Il tessuto di base è anche un controllo del set: con la sovraimpressione una villetta in piedi in un cortile alza da sola la sua colonna, e
   il suo tetto vuole il parapetto su quattro lati, che il set non aveva (`tetto-isola`).

## Che cosa non fa

I tasselli sono funzioni TypeScript e non programmi MarkovJunior, non variano per seme; il tessuto è in piano (niente rilievo vero); i tetti
non si raggiungono; il collaudo guarda la finestra della regione e non il luogo intero; niente è nel kernel, nel renderer o sul filo.
