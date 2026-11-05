# Aiuola fiorita (`aiuola-fiorita-urbana`)

Un'aiuola di quartiere a Neapolis: bordo di cemento, terra scura, fiori di tre colori e qualcosa nel mezzo.

- Collezione: `flora-geologia` · ambientazione: `moderno` · classe: `cespuglio` (scatola 20 × 20 × 16)
- Scelte procedurali: il bordo a caso (tondo, quadrato, a ottagono), il centro a caso (un arbusto, un lampioncino, un cartello, una fontanella), poi steli che nascono in punti a caso della terra, salgono di altezze diverse e fioriscono di un colore a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.342 | ≥ 0.15 |
| distanza minima fra due semi | 0.219 | — |
| tempo del seme più lento | 15 ms | < 1500 ms |
| voxel per seme (1-5) | 1069, 1123, 1313, 1277, 1139 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`aiuola-fiorita-urbana.png`](aiuola-fiorita-urbana.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×20×16, 32 nodi, 112 passi, finito in 14 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), S=cemento, E=terra, G=steli, R=fiori rossi, Y=fiori gialli, V=fiori viola, I=ferro, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 553, E 338, G 144, I 12, R 12, Y 6, V 4.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 10 10 0 size 20 20 4 u su .: ×1, 1444 celle x1-19 y1-19 z0-3, passi 11, .→u 1444
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x2 y3 z1, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×35, 1443 celle x1-19 y1-19 z0-3, passi 13-47, u→2 1443
   r1 1u → *1 ×0; r2 2u → *2 ×1443; r3 3u → *3 ×0
#10-11 box×2: 867 celle x2-18 y2-18 z0-2, passi 48-49
 #16 prl u → . (+3): ×1, 577 celle x1-19 y1-19 z0-3, passi 50, 2→. 577
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×577; r4 3 → . ×0
 #17 box at 10 10 2 size 10 10 14 u su .: ×1, 1053 celle x6-14 y6-14 z3-15, passi 51, .→u 1053
#18-19 one×1, all×1: 1053 celle x6-14 y6-14 z3-15, passi 52-75
#23-24 line×1, box×1: 36 celle x7-13 y9-11 z3-12, passi 76-77
 #27 prl u → . (+4): ×1, 1017 celle x6-14 y6-14 z3-15, passi 78, 3→. 1017
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×1017; r5 4 → . ×0
#28-30 one×1, prl×1, all×1: 332 celle x4-16 y4-16 z3-12, passi 79-112
Senza effetto (non hanno mai cambiato una cella):
#8 cylinder at 10 10 1 size 15 15 2 E su 1
#9 cylinder at 10 10 0 size 19 19 3 S su 1
#12 box at 10 10 1 size 12 12 2 E su 3
#13 cylinder at 10 10 1 size 14 14 2 E su 3
#14 cylinder at 10 10 0 size 19 19 3 S su 3
#15 box at 10 10 0 size 16 16 3 S su 3
#20 ellipsoid at 10 10 2 size 8 8 9 F su 1
#21 line 10 10 2 → 10 10 13 I
#22 box at 10 10 13 size 3 3 2 L su 2
#25 cylinder at 10 10 2 size 3 3 9 I su 4
#26 box at 10 11 9 size 1 3 1 I su 4
#31 prl .R → *R (+2): le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 1
```
