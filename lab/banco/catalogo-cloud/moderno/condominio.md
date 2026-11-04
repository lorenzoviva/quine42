# condominio (moderno)

Programma: `condominio.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 648 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 26 | scarto 0,03, alta 1,50 | — |
| 2 | 622 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 29 | scarto 0,03, alta 1,50 | — |
| 3 | 552 | 2 | 5 | — | 0,00 | 0 | 0 | 7 | 26 | scarto 0,03, alta 1,50 | — |
| 4 | 600 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 30 | scarto 0,03, alta 1,50 | — |
| 5 | 729 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 31 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,67, colore 0,13, pianta 0,55, perimetro 0,36, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 729 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1392 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 2 | 1744 | 2 | 7 | — | 0,00 | 0 | 0 | 6 | 30 | scarto 0,03, alta 1,88 | — |
| 3 | 1371 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 25 | scarto 0,03, alta 1,88 | — |
| 4 | 1642 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 25 | scarto 0,03, alta 1,88 | — |
| 5 | 1409 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 42 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,58, colore 0,14, pianta 0,33, perimetro 0,23, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1744 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 64 nodi, 591 passi, finito in 609 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 4=ringhiera, 5=balcone, 9=ferro, N=browN, E=Emerald, z=z, a=fondazione, x=scaffali del vino, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, n=lanterna, e=emerald, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=rovere (base), A=lastricato, S=cemento chiaro, R=ghiaia, C=cemento grigio, W=intonaco bianco, U=cemento grigio (fascia), F=parquet, u=intonaco bianco (fascia), K=acciaio, Y=gradino (testa), T=gradino, k=porta, L=rovere, D=telaio d’alluminio, V=vetro.
Alla fine: R 18845, S 13105, C 9524, F 6607, W 6520, K 3355, V 2310, U 1854, u 1582, D 1254, L 344, k 330, 9 135, A 44, G 43, c 14, T 11, Y 11.
#2-56 prl×15, all×31, one×9: 69538 celle x1-98 y1-99 z0-67, passi 1-533
  .→C 9524: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +50 scatole, 7474 celle
  .→S 8394: x65-95 y35-95 z64; x35-64 y65-95 z64; x56-65 y5-65 z32; +45 scatole, 4963 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  .→W 6520: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +31 scatole, 5028 celle
  E→S 4710: x66-95 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +9 scatole, 1505 celle
  .→R 4363: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +20 scatole, 970 celle
  .→U 3906: x36-64 y5 z10-23; x35 y6-34 z10-23; x65 y6-34 z10-23; +8 scatole, 2688 celle
  E→z 3274: x66-94 y6-25 z0; x6-34 y6-19 z0; x6-34 y36-49 z0; +15 scatole, 1882 celle
  .→u 3094: x66-94 y35 z42-55; x65 y36-64 z42-55; x95 y36-64 z42-55; +6 scatole, 1876 celle
  .→K 352: x65 y66-76 z1-32
  .→L 344: x26-34 y20 z1-8; x80 y26-34 z1-8; x26-34 y50 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  .→9 135: x67-75 y33 z33-35; x82-90 y33 z33-35; x97 y51-59 z33-35; +2 scatole, 54 celle
  E→. 90: x67-75 y33-34 z0; x82-90 y33-34 z0; x96-97 y51-59 z0; +2 scatole, 36 celle
  E→A 44: x45-55 y96-99 z0
  E→G 36: x26-34 y20 z0; x80 y26-34 z0; x26-34 y50 z0; +1 scatole, 9 celle
  .→T 11: x48 y66-76 z1
  .→Y 11: x49 y66-76 z1
  .→G 7: x42-48 y35 z9
  N→S 1: x50 y50 z0
#57-64 all×6, one×1, prl×1: 26534 celle x0-99 y0-99 z0-76, passi 534-591
  .→R 14482: x67-93 y37-93 z66-67; x68-92 y38-92 z68-69; x37-64 y67-93 z66-67; +25 scatole, 7142 celle
  z→. 3274: x66-94 y6-25 z0; x6-34 y6-19 z0; x6-34 y36-49 z0; +15 scatole, 1882 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1845: x0-5 y6-99 z0; x0-99 y0-2 z0; x95-99 y6-34 z0; +21 scatole, 836 celle
  U→V 1330: x38-44 y5 z12-21; x52-58 y5 z12-21; x65 y8-14 z12-21; +16 scatole, 1120 celle
  u→V 980: x68-74 y35 z44-53; x84-90 y35 z44-53; x95 y38-44 z44-53; +11 scatole, 770 celle
  U→D 722: x67-93 y95 z11; x35 y49-50 z12-22; x75-76 y95 z12-22; +67 scatole, 651 celle
  u→D 532: x79-80 y95 z44-54; x71-88 y95 z43; x67 y35 z44-54; +51 scatole, 481 celle
  .→c 14: x51 y63 z36-42; x82 y54 z70-76
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
```
