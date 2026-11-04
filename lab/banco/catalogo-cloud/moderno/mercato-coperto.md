# mercato-coperto (moderno)

Programma: `mercato-coperto.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 627 | 2 | 6 | — | 0,00 | 0 | 0 | 7 | 25 | scarto 0,03, alta 1,50 | — |
| 2 | 745 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 28 | scarto 0,03, alta 1,50 | — |
| 3 | 615 | 2 | 5 | — | 0,00 | 0 | 0 | 5 | 28 | scarto 0,03, alta 1,50 | — |
| 4 | 803 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 31 | scarto 0,03, alta 1,50 | — |
| 5 | 763 | 2 | 7 | — | 0,00 | 0 | 0 | 6 | 35 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,69, colore 0,15, pianta 0,56, perimetro 0,35, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 803 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1502 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 30 | scarto 0,03, alta 1,88 | — |
| 2 | 1588 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 28 | scarto 0,03, alta 1,88 | — |
| 3 | 1483 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 27 | scarto 0,03, alta 1,88 | — |
| 4 | 1344 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 25 | scarto 0,03, alta 1,88 | — |
| 5 | 1287 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 43 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,64, colore 0,13, pianta 0,35, perimetro 0,18, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1588 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 66 nodi, 613 passi, finito in 660 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=browN, E=Emerald, z=z, a=fondazione, x=scaffali del vino, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, n=lanterna, e=emerald, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=rovere (base), A=lastricato, R=lamiera verde, S=cemento chiaro, C=cemento grigio, W=intonaco bianco, U=cemento grigio (fascia), F=parquet, u=intonaco bianco (fascia), K=acciaio, Y=gradino (testa), T=gradino, k=porta, L=rovere, D=telaio d’alluminio, V=vetro.
Alla fine: R 26459, S 13095, C 10144, W 7120, F 6607, K 3355, V 2240, U 1962, u 1582, D 1440, L 344, k 330, A 44, G 43, T 11, Y 11.
#2-56 prl×15, all×31, one×8: 70473 celle x1-98 y1-99 z0-67, passi 1-530
  .→C 10144: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +52 scatole, 8094 celle
  .→S 8364: x65-95 y35-95 z64; x66-95 y35-95 z32; x35-64 y65-95 z64; +42 scatole, 3713 celle
  .→W 7120: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +33 scatole, 5628 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  E→S 4730: x66-95 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +11 scatole, 1525 celle
  .→R 4383: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +22 scatole, 990 celle
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
#57-66 all×8, one×1, prl×1: 34300 celle x0-99 y0-99 z0-76, passi 531-613
  .→R 22076: x67-93 y37-93 z66; x68-92 y38-92 z67; x69-91 y39-91 z68; +204 scatole, 17943 celle
  z→. 3328: x6-34 y36-64 z0; x6-34 y6-19 z0; x66-94 y6-19 z0; +9 scatole, 1675 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1861: x0-5 y6-99 z0; x0-99 y0-2 z0; x96-99 y35-72 z0; +22 scatole, 845 celle
  U→V 1260: x45-51 y5 z12-21; x56-62 y5 z12-21; x65 y10-16 z12-21; +15 scatole, 1050 celle
  u→V 980: x73-79 y35 z44-53; x83-89 y35 z44-53; x95 y38-44 z44-53; +11 scatole, 770 celle
  U→D 684: x35 y47-48 z12-22; x95 y52-53 z12-22; x35 y39-56 z11; +65 scatole, 622 celle
  u→D 532: x72 y35 z44-54; x80 y35 z44-54; x82 y35 z44-54; +53 scatole, 499 celle
  .→D 224: x69 y42-58 z69-76; x66-76 y94 z66-73
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
Senza effetto (non hanno mai cambiato una cella):
#52 one **********/**********/**********/**********/***… → **********/**********/**********/**********/***… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
```
