# Ragno meccanico (`ragno-meccanico`)

Un ragno a vapore delle miniere di Orichalcum: otto zampe a pistone, addome-caldaia, occhi di vetro rosso.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: due scelte a caso (la postura di tutto il corpo e delle otto zampe: alta, acquattata, in cammino, all'attacco; l'addome: caldaia grande, serbatoio stretto, gabbia di tubi) e valvole che spuntano a caso sul dorso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.509 | ≥ 0.15 |
| distanza minima fra due semi | 0.269 | — |
| tempo del seme più lento | 177 ms | < 1500 ms |
| voxel per seme (1-5) | 4389, 4531, 5162, 3214, 5310 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`ragno-meccanico.png`](ragno-meccanico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 102 nodi, 167 passi, finito in 185 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), O=piastre d'ottone, D=bronzo scuro, I=zampe di ferro, R=occhi di vetro, T=valvole, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: D 2074, I 1603, O 694, T 16, R 2.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 12 20 0 size 25 40 30 u su .: ×1, 29250 celle x0-24 y1-39 z0-29, passi 11, .→u 29250
 #6 one u → 1 (+3) passi=1: ×1, 1 celle x18 y4 z21, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #7 all 1u → *1 (+3): ×74, 29249 celle x0-24 y1-39 z0-29, passi 13-86, u→2 29249
   r1 1u → *1 ×0; r2 2u → *2 ×29249; r3 3u → *3 ×0; r4 4u → *4 ×0
#27-45 box×2, ellipsoid×1, line×16: 1933 celle x0-24 y13-28 z0-16, passi 87-105
 #82 prl u → . (+4): ×1, 27317 celle x0-24 y1-39 z0-29, passi 106, 2→. 27317
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×27317; r4 3 → . ×0; r5 4 → . ×0
 #83 box at 12 10 0 size 25 22 30 u su .: ×1, 14851 celle x0-24 y0-20 z0-29, passi 107, .→u 14851
 #84 one u → 1 (+2) passi=1: ×1, 1 celle x16 y6 z13, passi 108, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #85 all 1u → *1 (+2): ×46, 14850 celle x0-24 y0-20 z0-29, passi 109-154, u→2 14850
   r1 1u → *1 ×0; r2 2u → *2 ×14850; r3 3u → *3 ×0
#89-91 box×1, cylinder×2: 2440 celle x7-17 y5-20 z0-22, passi 155-157
#98-102 prl×3, one×1, all×1: 12509 celle x0-24 y0-27 z0-29, passi 158-167
Senza effetto (non hanno mai cambiato una cella):
#8 box at 10 28 17 size 1 2 1 R su 1
#9 box at 14 28 17 size 1 2 1 R su 1
#10 ellipsoid at 12 22 14 size 10 14 8 O su 1
#11 line 8 14 17 → 2 14 24 I
#12 line 2 14 24 → 0 14 0 I
#13 line 16 14 17 → 22 14 24 I
#14 line 22 14 24 → 24 14 0 I
#15 line 8 18 17 → 2 18 24 I
#16 line 2 18 24 → 0 18 0 I
#17 line 16 18 17 → 22 18 24 I
#18 line 22 18 24 → 24 18 0 I
#19 line 8 22 17 → 2 22 24 I
… e altri 52
```
