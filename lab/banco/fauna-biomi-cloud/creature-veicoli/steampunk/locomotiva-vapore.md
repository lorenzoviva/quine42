# Locomotiva a vapore (`locomotiva-vapore`)

La locomotiva delle linee di Orichalcum: caldaia nera, ruote motrici rosse, cabina e fumo che sale.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: quattro scelte a caso (ruote: tre grandi motrici o quattro piccole; caldaia lunga, grossa o corta con duomo doppio; cabina chiusa, aperta o con tender di carbone; fumaiolo a imbuto, dritto o a pallone) e il fumo che sale dal fumaiolo con un camminatore e si gonfia a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.227 | ≥ 0.15 |
| distanza minima fra due semi | 0.098 | — |
| tempo del seme più lento | 138 ms | < 1500 ms |
| voxel per seme (1-5) | 7158, 6761, 8274, 7568, 7907 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`locomotiva-vapore.png`](locomotiva-vapore.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 71 nodi, 236 passi, finito in 127 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), N=caldaia nera, R=ruote motrici, O=fasce d'ottone, C=cabina di legno, K=carbone, S=fumo, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: N 5193, R 879, C 781, O 151, K 146, S 8.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 box×2: 11700 celle x0-24 y1-39 z0-11, passi 11-12
#7-8 one×1, all×1: 10125 celle x0-24 y1-39 z0-11, passi 13-66
#9-25 ellipsoid×6, prl×1: 10125 celle x0-24 y1-39 z0-11, passi 67-73
 #26 box at 12 24 5 size 25 32 16 u su .: ×1, 11521 celle x0-24 y9-39 z5-20, passi 74, .→u 11521
 #27 one u → 1 (+2) passi=1: ×1, 1 celle x23 y34 z13, passi 75, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #28 all 1u → *1 (+2): ×56, 11520 celle x0-24 y9-39 z5-20, passi 76-131, u→1 11520
   r1 1u → *1 ×11520; r2 2u → *2 ×0; r3 3u → *3 ×0
#29-30 line×1, cylinder×1: 2877 celle x7-17 y9-39 z7-19, passi 132-133
 #36 prl u → . (+3): ×1, 8644 celle x0-24 y9-39 z5-20, passi 134, 1→. 8644
   r1 u → . ×0; r2 1 → . ×8644; r3 2 → . ×0; r4 3 → . ×0
 #37 box at 12 8 5 size 25 17 25 u su .: ×1, 9632 celle x0-24 y0-16 z5-29, passi 135, .→u 9632
#38-39 one×1, all×1: 9632 celle x0-24 y0-16 z5-29, passi 136-189
#49-53 box×3, ellipsoid×1, prl×1: 9632 celle x0-24 y0-16 z5-29, passi 190-194
#54-70 box×2, one×2, all×1, cylinder×2, prl×2, ellipsoid×1: 4918 celle x6-18 y29-39 z1-29, passi 195-236
Senza effetto (non hanno mai cambiato una cella):
#15 line 5 12 5 → 5 30 5 O
#16 line 19 12 5 → 19 30 5 O
#17 ellipsoid at 5 7 0 size 3 7 7 R su 2
#18 ellipsoid at 5 15 0 size 3 7 7 R su 2
#19 ellipsoid at 5 23 0 size 3 7 7 R su 2
#20 ellipsoid at 5 31 0 size 3 7 7 R su 2
#21 ellipsoid at 19 7 0 size 3 7 7 R su 2
#22 ellipsoid at 19 15 0 size 3 7 7 R su 2
#23 ellipsoid at 19 23 0 size 3 7 7 R su 2
#24 ellipsoid at 19 31 0 size 3 7 7 R su 2
#31 line 12 16 13 → 12 35 13 N
#32 cylinder at 12 24 18 size 6 6 3 O su 2
… e altri 20
```
