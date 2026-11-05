# Drone esapode (`drone-esapode`)

Il drone a sei zampe che pattuglia le colonie di Sidera: guscio bianco, giunti grigi, un occhio azzurro.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (le sei zampe: larghe e basse, alte, in cammino a tripode; il modulo sul dorso: cupola di sensori, rotori spiegati, torretta, antenna; il carico sotto la pancia: capsula, pinza, sfera dei sensori, niente) e un'antenna che cresce a rami dal guscio, luci di posizione a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.428 | ≥ 0.15 |
| distanza minima fra due semi | 0.054 | — |
| tempo del seme più lento | 168 ms | < 1500 ms |
| voxel per seme (1-5) | 3264, 2410, 2622, 3103, 2553 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`drone-esapode.png`](drone-esapode.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 82 nodi, 193 passi, finito in 202 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), W=guscio bianco, G=giunti, K=nero opaco, E=occhio, L=luci di posizione, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: G 1511, W 1317, K 416, L 10, E 10.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-8 box×3, ellipsoid×1: 21710 celle x0-24 y1-39 z0-21, passi 11-14
 #9 one u → 1 (+2) passi=1: ×1, 1 celle x23 y28 z5, passi 15, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #10 all 1u → *1 (+2): ×66, 20092 celle x0-24 y1-39 z0-21, passi 16-81, u→2 20092
   r1 1u → *1 ×0; r2 2u → *2 ×20092; r3 3u → *3 ×0
#23-34 line×12: 1176 celle x1-23 y13-27 z0-21, passi 82-93
 #47 prl u → . (+3): ×1, 18917 celle x0-24 y1-39 z0-21, passi 94, 2→. 18917
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×18917; r4 3 → . ×0
 #48 box at 12 20 14 size 25 40 16 u su .: ×1, 14818 celle x0-24 y1-39 z14-29, passi 95, .→u 14818
 #49 one u → 1 (+3) passi=1: ×1, 1 celle x5 y30 z22, passi 96, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #50 all 1u → *1 (+3): ×56, 14817 celle x0-24 y1-39 z14-29, passi 97-152, u→2 14817
   r1 1u → *1 ×0; r2 2u → *2 ×14817; r3 3u → *3 ×0; r4 4u → *4 ×0
#54-61 line×4, ellipsoid×4: 479 celle x0-24 y6-34 z15-19, passi 153-160
 #67 prl u → . (+4): ×1, 14339 celle x0-24 y1-39 z14-29, passi 161, 2→. 14339
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×14339; r4 3 → . ×0; r5 4 → . ×0
#68-82 box×1, one×1, all×1, line×1, ellipsoid×1, prl×2: 7381 celle x6-18 y8-32 z0-13, passi 162-193
Senza effetto (non hanno mai cambiato una cella):
#11 line 7 14 12 → 2 14 14 G
#12 line 2 14 14 → 1 14 0 G
#13 line 17 14 12 → 22 14 14 G
#14 line 22 14 14 → 23 14 0 G
#15 line 7 20 12 → 2 20 14 G
#16 line 2 20 14 → 1 20 0 G
#17 line 17 20 12 → 22 20 14 G
#18 line 22 20 14 → 23 20 0 G
#19 line 7 26 12 → 2 26 14 G
#20 line 2 26 14 → 1 26 0 G
#21 line 17 26 12 → 22 26 14 G
#22 line 22 26 14 → 23 26 0 G
… e altri 28
```
