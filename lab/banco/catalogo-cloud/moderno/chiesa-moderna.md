# chiesa-moderna (moderno)

Programma: `chiesa-moderna.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida-generatore.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 666 | 2 | 6 | — | 0,00 | 0 | 0 | 7 | 25 | scarto 0,03, alta 1,50 | — |
| 2 | 911 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 31 | scarto 0,03, alta 1,50 | — |
| 3 | 653 | 2 | 5 | — | 0,00 | 0 | 0 | 7 | 27 | scarto 0,03, alta 1,50 | — |
| 4 | 777 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 31 | scarto 0,03, alta 1,50 | — |
| 5 | 780 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 34 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,70, colore 0,15, pianta 0,56, perimetro 0,35, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 911 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1334 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 23 | scarto 0,03, alta 1,88 | — |
| 2 | 1885 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 28 | scarto 0,03, alta 1,88 | — |
| 3 | 1519 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 24 | scarto 0,03, alta 1,88 | — |
| 4 | 1415 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 26 | scarto 0,03, alta 1,88 | — |
| 5 | 1678 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 40 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,64, colore 0,13, pianta 0,35, perimetro 0,19, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1885 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 67 nodi, 609 passi, finito in 611 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=browN, E=Emerald, z=z, a=fondazione, x=scaffali del vino, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, n=lanterna, e=emerald, q=cuspide di cemento, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=rovere (base), A=lastricato, R=ghiaia, S=cemento chiaro, C=cemento grigio, W=intonaco bianco, U=cemento grigio (fascia), F=parquet, u=intonaco bianco (fascia), K=acciaio, Y=gradino (testa), T=gradino, k=porta, L=rovere, D=telaio d’alluminio, V=vetro.
Alla fine: R 30169, S 13175, C 10764, W 7720, F 6607, K 3355, D 2410, V 2310, U 1854, u 1582, L 344, k 330, A 44, G 43, T 11, Y 11.
#2-56 prl×15, all×31, one×8: 71813 celle x1-98 y1-99 z0-67, passi 1-532
  .→C 10764: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +54 scatole, 8714 celle
  .→S 8424: x65-95 y35-95 z64; x66-95 y35-95 z32; x35-64 y65-95 z64; +46 scatole, 3773 celle
  .→W 7720: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +35 scatole, 6228 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  E→S 4750: x66-95 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +13 scatole, 1545 celle
  .→R 4403: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +24 scatole, 1010 celle
  .→U 3906: x36-64 y5 z10-23; x35 y6-34 z10-23; x65 y6-34 z10-23; +8 scatole, 2688 celle
  E→z 3328: x6-34 y36-64 z0; x6-34 y6-19 z0; x66-94 y6-19 z0; +9 scatole, 1675 celle
  .→u 3094: x66-94 y35 z42-55; x65 y36-64 z42-55; x95 y36-64 z42-55; +6 scatole, 1876 celle
  .→K 352: x65 y66-76 z1-32
  .→L 344: x26-34 y20 z1-8; x66-74 y20 z1-8; x80 y26-34 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  E→A 44: x45-55 y96-99 z0
  E→G 36: x26-34 y20 z0; x66-74 y20 z0; x80 y26-34 z0; +1 scatole, 9 celle
  .→T 11: x48 y66-76 z1
  .→Y 11: x49 y66-76 z1
  .→G 7: x42-48 y35 z9
  N→S 1: x50 y50 z0
#57-67 all×8, one×1, prl×1: 39010 celle x0-99 y0-99 z0-79, passi 533-609
  .→R 25766: x67-93 y37-93 z66-67; x68-92 y38-92 z68-69; x69-91 y39-91 z70-71; +67 scatole, 17500 celle
  z→. 3328: x6-34 y36-64 z0; x6-34 y6-19 z0; x66-94 y6-19 z0; +9 scatole, 1675 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1841: x0-5 y6-99 z0; x0-99 y0-2 z0; x95-99 y6-34 z0; +24 scatole, 832 celle
  U→V 1330: x38-44 y5 z12-21; x47-53 y5 z12-21; x56-62 y5 z12-21; +16 scatole, 1120 celle
  .→D 1156: x81-90 y59-75 z74-79; x69-85 y94 z66-73
  u→V 980: x68-74 y35 z44-53; x85-91 y35 z44-53; x65 y40-46 z44-53; +11 scatole, 770 celle
  U→D 722: x37-63 y5 z11; x45-46 y5 z12-22; x54-55 y5 z12-22; +63 scatole, 651 celle
  u→D 532: x65 y47-48 z44-54; x49-50 y65 z44-54; x95 y79-80 z44-54; +47 scatole, 466 celle
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
Senza effetto (non hanno mai cambiato una cella):
#52 one **********/**********/**********/**********/***… → **********/**********/**********/**********/***… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#62 all ***/*.*/*** *q*/qqq/*q* → ***/*q*/*** ***/***/*** passi=5: in quel momento nella griglia non c'erano celle "q"
```
