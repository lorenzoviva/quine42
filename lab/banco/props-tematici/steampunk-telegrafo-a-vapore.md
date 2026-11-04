# Telegrafo a vapore (`steampunk-telegrafo-a-vapore.xml`)

Classe `mobile`, scatola 20 × 20 × 20 voxel, ambientazione `steampunk (orichalcum)`.

Un tavolino di legno scuro su una colonna di ghisa con il tasto d'ottone, il ricevitore e una piccola caldaia di rame col fischietto. Il seme sceglie l'altezza della colonna e la disposizione del banco: bobina del nastro, antenna con gli isolatori o caldaia alta fra due bobine.

## Esito

- validatore (`modelErrors`, `checkProgram`, `analyse` a ogni seme): nessun errore, nessun frammento staccato
- varianza su 5 semi (voxel pieni in un seme e vuoti nell'altro, sui pieni in almeno uno; il colore non conta): **media 0.436**, minima 0.023, massima 0.614 (soglia 0.15) → passa
- voxel per seme: 412, 421, 399, 411, 423; tempo per seme: 6, 5, 5, 7, 5 ms
- avvisi: colori mai usati: G Q; tocca il soffitto della griglia: forse è tagliato in alto; colori mai usati: Q

| coppia | 1-2 | 1-3 | 1-4 | 1-5 | 2-3 | 2-4 | 2-5 | 3-4 | 3-5 | 4-5 |
|---|---|---|---|---|---|---|---|---|---|---|
| distanza | 0.446 | 0.590 | 0.614 | 0.445 | 0.309 | 0.580 | 0.023 | 0.463 | 0.309 | 0.577 |

![i cinque semi](steampunk-telegrafo-a-vapore.png)

## Traccia di tre semi a confronto

La traccia di `src/mj/trace.ts` (forma `nodi`): per ogni nodo quante volte gira, quante celle scrive e la scatola di ciò che scrive. Le
righe che cambiano fra i semi sono le scelte del programma.

### Seme 1

```text
Traccia, seme 1: griglia 20×20×20, 18 nodi, 63 passi, finito in 9 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=ghisa, D=legno scuro, O=ottone, C=rame, W=nastro di carta, A=spia ambrata, Q=ghisa della colonna, h=altezze possibili (marcatore), k=la quota scelta (marcatore), s=la cima della colonna (marcatore).
Alla fine: E 184, D 105, O 65, C 36, W 21, A 1.
#2-7 box×6: 307 celle x0-14 y0-14 z0-18, passi 1-6
#8-9 one×1, all×1: 6 celle x0 y0 z6-11, passi 7-8
 #10 all k. → kk: ×38, 390 celle x0-19 y0-19 z9, passi 9-46, .→k 390
 #11 all k[EOQ] → kk: ×2, 9 celle x9-11 y9-11 z9, passi 47-48, E→k 8, Q→k 1
 #12 all [.EOQk] k → k k: ×10, 4000 celle x0-19 y0-19 z10-19, passi 49-58, .→k 3919, E→k 72, Q→k 9
 #13 all k → .: ×1, 4400 celle x0-19 y0-19 z9-19, passi 59, k→. 4400
#14-15 all×2: 8 celle x10 y10 z2-9, passi 60-61
#16-18 one×1, prl×1: 227 celle x4-16 y6-14 z9-18, passi 62-63
Senza effetto (non hanno mai cambiato una cella):
#17 all s → D: in quel momento nella griglia non c'erano celle "s"
```

### Seme 2

```text
Traccia, seme 2: griglia 20×20×20, 18 nodi, 62 passi, finito in 7 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=ghisa, D=legno scuro, O=ottone, C=rame, W=nastro di carta, A=spia ambrata, Q=ghisa della colonna, h=altezze possibili (marcatore), k=la quota scelta (marcatore), s=la cima della colonna (marcatore).
Alla fine: E 193, D 105, O 65, C 36, W 21, A 1.
#2-7 box×6: 307 celle x0-14 y0-14 z0-18, passi 1-6
#8-9 one×1, all×1: 6 celle x0 y0 z6-11, passi 7-8
 #10 all k. → kk: ×38, 390 celle x0-19 y0-19 z10, passi 9-46, .→k 390
 #11 all k[EOQ] → kk: ×2, 9 celle x9-11 y9-11 z10, passi 47-48, E→k 8, Q→k 1
 #12 all [.EOQk] k → k k: ×9, 3600 celle x0-19 y0-19 z11-19, passi 49-57, .→k 3528, E→k 64, Q→k 8
 #13 all k → .: ×1, 4000 celle x0-19 y0-19 z10-19, passi 58, k→. 4000
#14-15 all×2: 9 celle x10 y10 z2-10, passi 59-60
#16-18 one×1, prl×1: 227 celle x4-16 y6-14 z10-19, passi 61-62
Senza effetto (non hanno mai cambiato una cella):
#17 all s → D: in quel momento nella griglia non c'erano celle "s"
```

### Seme 3

```text
Traccia, seme 3: griglia 20×20×20, 18 nodi, 62 passi, finito in 7 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=ghisa, G=isolatore di porcellana, D=legno scuro, O=ottone, C=rame, W=nastro di carta, A=spia ambrata, Q=ghisa della colonna, h=altezze possibili (marcatore), k=la quota scelta (marcatore), s=la cima della colonna (marcatore).
Alla fine: E 194, D 105, O 67, C 27, W 2, A 2, G 2.
#2-7 box×6: 307 celle x0-14 y0-14 z0-18, passi 1-6
#8-9 one×1, all×1: 6 celle x0 y0 z6-11, passi 7-8
 #10 all k. → kk: ×38, 390 celle x0-19 y0-19 z10, passi 9-46, .→k 390
 #11 all k[EOQ] → kk: ×2, 9 celle x9-11 y9-11 z10, passi 47-48, E→k 8, Q→k 1
 #12 all [.EOQk] k → k k: ×9, 3600 celle x0-19 y0-19 z11-19, passi 49-57, .→k 3528, E→k 64, Q→k 8
 #13 all k → .: ×1, 4000 celle x0-19 y0-19 z10-19, passi 58, k→. 4000
#14-15 all×2: 9 celle x10 y10 z2-10, passi 59-60
#16-18 one×1, prl×1: 205 celle x4-16 y6-14 z10-18, passi 61-62
Senza effetto (non hanno mai cambiato una cella):
#17 all s → D: in quel momento nella griglia non c'erano celle "s"
```
