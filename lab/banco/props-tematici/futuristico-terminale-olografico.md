# Terminale olografico (`futuristico-terminale-olografico.xml`)

Classe `mobile`, scatola 20 × 20 × 20 voxel, ambientazione `futuristico (sidera)`.

Una colonna di grafite con un leggio di ceramica bianca e, sopra, un ologramma ciano e magenta che sale dall'emettitore. Il seme sceglie l'altezza della colonna e la forma dell'ologramma.

## Esito

- validatore (`modelErrors`, `checkProgram`, `analyse` a ogni seme): nessun errore, nessun frammento staccato
- varianza su 5 semi (voxel pieni in un seme e vuoti nell'altro, sui pieni in almeno uno; il colore non conta): **media 0.540**, minima 0.334, massima 0.620 (soglia 0.15) → passa
- voxel per seme: 345, 344, 344, 346, 343; tempo per seme: 5, 5, 5, 5, 6 ms
- avvisi: tocca il soffitto della griglia: forse è tagliato in alto

| coppia | 1-2 | 1-3 | 1-4 | 1-5 | 2-3 | 2-4 | 2-5 | 3-4 | 3-5 | 4-5 |
|---|---|---|---|---|---|---|---|---|---|---|
| distanza | 0.521 | 0.543 | 0.572 | 0.450 | 0.334 | 0.580 | 0.620 | 0.589 | 0.606 | 0.579 |

![i cinque semi](futuristico-terminale-olografico.png)

## Traccia di tre semi a confronto

La traccia di `src/mj/trace.ts` (forma `nodi`): per ogni nodo quante volte gira, quante celle scrive e la scatola di ciò che scrive. Le
righe che cambiano fra i semi sono le scelte del programma.

### Seme 1

```text
Traccia, seme 1: griglia 20×20×20, 23 nodi, 215 passi, finito in 5 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: W=ceramica bianca, w=ceramica in ombra, G=grafite, g=grafite chiara, C=luce ciano, M=luce magenta, V=vetro dell'emettitore, h=quote possibili (marcatore), k=la quota scelta (marcatore), r=la colonna che sale (marcatore), e=l'emettitore (marcatore), x=il leggio che si allarga (marcatore), H=ologramma.
Alla fine: G 104, H 87, C 51, W 33, g 32, w 20, M 17, V 1.
#2-6 box×3, one×1, all×1: 120 celle x0-14 y0-14 z0-12, passi 1-5
 #7 all k. → kk: ×38, 399 celle x0-19 y0-19 z10, passi 6-43, .→k 399
#8-9 box×1, one×1: 15 celle x10 y10 z2-9, passi 44-51
 #10 all k → .: ×1, 400 celle x0-19 y0-19 z10, passi 52, k→. 400
#11-15 all×4: 77 celle x6-14 y6-14 z1-10, passi 53-58
#16-17 all×2: 55 celle x6-14 y6-14 z9-11, passi 59-60
 #18 one . H → H H (+1) passi=150: ×150, 150 celle x5-13 y6-15 z11-17, passi 61-210, .→H 150
   r1 . H → H H ×45; r2 H. → HH ×105
#20-23 prl×3, all×1: 88 celle x5-14 y6-14 z9-17, passi 211-215
Senza effetto (non hanno mai cambiato una cella):
#13 all r → G: in quel momento nella griglia non c'erano celle "r"
#19 all e → g: in quel momento nella griglia non c'erano celle "e"
```

### Seme 2

```text
Traccia, seme 2: griglia 20×20×20, 23 nodi, 216 passi, finito in 4 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: W=ceramica bianca, w=ceramica in ombra, G=grafite, g=grafite chiara, C=luce ciano, M=luce magenta, V=vetro dell'emettitore, h=quote possibili (marcatore), k=la quota scelta (marcatore), r=la colonna che sale (marcatore), e=l'emettitore (marcatore), x=il leggio che si allarga (marcatore), H=ologramma.
Alla fine: G 105, H 93, C 45, g 33, W 33, w 20, M 14, V 1.
#2-6 box×3, one×1, all×1: 120 celle x0-14 y0-14 z0-12, passi 1-5
 #7 all k. → kk: ×38, 399 celle x0-19 y0-19 z11, passi 6-43, .→k 399
#8-9 box×1, one×1: 17 celle x10 y10 z2-10, passi 44-52
 #10 all k → .: ×1, 400 celle x0-19 y0-19 z11, passi 53, k→. 400
#11-15 all×4: 78 celle x6-14 y6-14 z1-11, passi 54-59
#16-17 all×2: 55 celle x6-14 y6-14 z10-12, passi 60-61
 #18 one . H → H H (+1) passi=150: ×150, 150 celle x5-14 y6-14 z12-18, passi 62-211, .→H 150
   r1 . H → H H ×47; r2 H. → HH ×103
#20-23 prl×3, all×1: 79 celle x6-14 y6-14 z10-17, passi 212-216
Senza effetto (non hanno mai cambiato una cella):
#13 all r → G: in quel momento nella griglia non c'erano celle "r"
#19 all e → g: in quel momento nella griglia non c'erano celle "e"
```

### Seme 3

```text
Traccia, seme 3: griglia 20×20×20, 23 nodi, 216 passi, finito in 4 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: W=ceramica bianca, w=ceramica in ombra, G=grafite, g=grafite chiara, C=luce ciano, M=luce magenta, V=vetro dell'emettitore, h=quote possibili (marcatore), k=la quota scelta (marcatore), r=la colonna che sale (marcatore), e=l'emettitore (marcatore), x=il leggio che si allarga (marcatore), H=ologramma.
Alla fine: G 105, H 95, C 39, g 33, W 33, w 20, M 18, V 1.
#2-6 box×3, one×1, all×1: 120 celle x0-14 y0-14 z0-12, passi 1-5
 #7 all k. → kk: ×38, 399 celle x0-19 y0-19 z11, passi 6-43, .→k 399
#8-9 box×1, one×1: 17 celle x10 y10 z2-10, passi 44-52
 #10 all k → .: ×1, 400 celle x0-19 y0-19 z11, passi 53, k→. 400
#11-15 all×4: 78 celle x6-14 y6-14 z1-11, passi 54-59
#16-17 all×2: 55 celle x6-14 y6-14 z10-12, passi 60-61
 #18 one . H → H H (+1) passi=150: ×150, 150 celle x6-13 y5-12 z12-18, passi 62-211, .→H 150
   r1 . H → H H ×40; r2 H. → HH ×110
#20-23 prl×3, all×1: 77 celle x6-14 y5-14 z10-18, passi 212-216
Senza effetto (non hanno mai cambiato una cella):
#13 all r → G: in quel momento nella griglia non c'erano celle "r"
#19 all e → g: in quel momento nella griglia non c'erano celle "e"
```
