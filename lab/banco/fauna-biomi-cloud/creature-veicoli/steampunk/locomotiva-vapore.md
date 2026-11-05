# Locomotiva a vapore (`locomotiva-vapore`)

La locomotiva delle linee di Orichalcum: caldaia nera, ruote motrici rosse, cabina e fumo che sale.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: quattro scelte a caso (ruote: tre grandi motrici o quattro piccole; caldaia lunga, grossa o corta con duomo doppio; cabina chiusa, aperta o con tender di carbone; fumaiolo a imbuto, dritto o a pallone) e il fumo che sale dal fumaiolo con un camminatore e si gonfia a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.221 | ≥ 0.15 |
| distanza minima fra due semi | 0.002 | — |
| tempo del seme più lento | 164 ms | < 1500 ms |
| voxel per seme (1-5) | 7852, 6627, 8748, 6711, 6627 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`locomotiva-vapore.png`](locomotiva-vapore.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 68 nodi, 216 passi, finito in 145 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), N=caldaia nera, R=ruote motrici, O=fasce d'ottone, C=cabina di legno, S=fumo, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: N 5043, C 2291, R 376, O 139, S 3.
#2-3 box×2: 11700 celle x0-24 y1-39 z0-11, passi 1-2
#4-5 one×1, all×1: 10125 celle x0-24 y1-39 z0-11, passi 3-59
#14-22 ellipsoid×8, prl×1: 10125 celle x0-24 y1-39 z0-11, passi 60-68
 #23 box at 12 24 5 size 25 32 16 u su .: ×1, 11929 celle x0-24 y9-39 z5-20, passi 69, .→u 11929
 #24 one u → 1 (+2) passi=1: ×1, 1 celle x4 y33 z13, passi 70, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #25 all 1u → *1 (+2): ×52, 11928 celle x0-24 y9-39 z5-20, passi 71-122, u→1 11928
   r1 1u → *1 ×11928; r2 2u → *2 ×0; r3 3u → *3 ×0
#26-27 line×1, cylinder×1: 2877 celle x7-17 y9-39 z7-19, passi 123-124
 #33 prl u → . (+3): ×1, 9052 celle x0-24 y9-39 z5-20, passi 125, 1→. 9052
   r1 u → . ×0; r2 1 → . ×9052; r3 2 → . ×0; r4 3 → . ×0
 #34 box at 12 8 5 size 25 17 25 u su .: ×1, 9779 celle x0-24 y0-16 z5-29, passi 126, .→u 9779
#35-36 one×1, all×1: 9779 celle x0-24 y0-16 z5-29, passi 127-178
#37-50 box×2, prl×1: 9779 celle x0-24 y0-16 z5-29, passi 179-181
#51-67 box×2, one×2, all×1, cylinder×2, cone×1, prl×2, ellipsoid×1: 4908 celle x6-18 y29-39 z1-29, passi 182-216
Senza effetto (non hanno mai cambiato una cella):
#6 ellipsoid at 5 12 0 size 4 10 10 R su 1
#7 ellipsoid at 5 21 0 size 4 10 10 R su 1
#8 ellipsoid at 5 30 0 size 4 9 9 R su 1
#9 ellipsoid at 20 12 0 size 4 10 10 R su 1
#10 ellipsoid at 20 21 0 size 4 10 10 R su 1
#11 ellipsoid at 20 30 0 size 4 9 9 R su 1
#12 line 5 12 5 → 5 30 5 O
#13 line 19 12 5 → 19 30 5 O
#28 line 12 16 13 → 12 35 13 N
#29 cylinder at 12 24 18 size 6 6 3 O su 2
#30 line 12 18 11 → 12 34 11 N
#31 cylinder at 12 22 15 size 4 4 4 O su 3
… e altri 19
```
