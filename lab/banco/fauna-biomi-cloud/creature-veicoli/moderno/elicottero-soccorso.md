# Elicottero di soccorso (`elicottero-soccorso`)

L'elisoccorso di Neapolis, bianco e rosso, posato sui pattini.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (fusoliera grande, compatta o a goccia con la sua trave di coda; rotore a quattro pale dritte, a X, a tre o a cinque pale; dotazione: scaletta, verricello con la barella a terra, galleggianti, faro di ricerca) e i numeri di bordo che compaiono a caso sulle fiancate.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.431 | ≥ 0.15 |
| distanza minima fra due semi | 0.248 | — |
| tempo del seme più lento | 497 ms | < 1500 ms |
| voxel per seme (1-5) | 3165, 4706, 5121, 3155, 4094 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`elicottero-soccorso.png`](elicottero-soccorso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 64 nodi, 279 passi, finito in 444 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), W=fusoliera bianca, R=fascia rossa, K=pale e pattini, V=vetri, Y=numeri di bordo, O=galleggianti, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: W 1523, K 1188, R 288, O 129, V 28, Y 9.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-11 line×6, box×1: 35774 celle x11-39 y1-47 z0-29, passi 11-17
#12-13 one×1, all×1: 35350 celle x11-39 y1-47 z4-29, passi 18-94
#19-23 box×3, ellipsoid×1, line×1: 1802 celle x19-31 y1-35 z6-21, passi 95-99
 #28 prl u → . (+3): ×1, 33548 celle x11-39 y1-47 z4-29, passi 100, 2→. 33548
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×33548; r4 3 → . ×0
#29-50 box×2, cylinder×1, one×1, all×1, line×3, prl×1: 21059 celle x1-49 y3-49 z10-31, passi 101-173
 #51 box at 25 30 0 size 50 40 24 u su .: ×1, 43722 celle x1-49 y11-49 z0-23, passi 174, .→u 43722
 #52 one u → 1 (+3) passi=1: ×1, 1 celle x43 y13 z20, passi 175, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #53 all 1u → *1 (+3): ×98, 43721 celle x1-49 y11-49 z0-23, passi 176-273, u→2 43721
   r1 1u → *1 ×0; r2 2u → *2 ×43721; r3 3u → *3 ×0; r4 4u → *4 ×0
#55-58 line×2, box×2: 294 celle x30-43 y24-36 z0-17, passi 274-277
 #63 prl u → . (+4): ×1, 43428 celle x1-49 y11-49 z0-23, passi 278, 2→. 43428
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×43428; r4 3 → . ×0; r5 4 → . ×0
 #64 prl .W → *Y passi=1: ×1, 9 celle x22-30 y3-34 z7-17, passi 279, W→Y 9
Senza effetto (non hanno mai cambiato una cella):
#14 box at 25 39 13 size 9 1 5 V su 1
#15 ellipsoid at 25 26 5 size 16 26 15 W su 1
#16 line 25 14 13 → 25 1 16 W
#17 box at 25 2 16 size 2 4 9 R su 1
#18 line 25 2 21 → 25 2 21 K
#24 box at 25 37 12 size 9 1 6 V su 3
#25 ellipsoid at 25 28 5 size 15 20 15 W su 3
#26 line 25 19 12 → 25 2 17 W
#27 cone at 25 2 17 size 3 5 8 R su 3
#34 line 25 27 30 → 48 27 30 K
#35 line 25 27 30 → 25 50 30 K
#36 line 25 27 30 → 2 27 30 K
… e altri 15
```
