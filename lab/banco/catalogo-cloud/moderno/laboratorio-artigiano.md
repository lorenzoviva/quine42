# laboratorio-artigiano (moderno)

Programma: `laboratorio-artigiano.xml` · classe `struttura` (bersaglio `grande`) · **cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida-generatore.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 100, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1304 | 2 | 4 | 2,13 | 0,00 | 0 | 0 | 5 | 28 | scarto 0,03, alta 1,50 | — |
| 2 | 1373 | 2 | 4 | 1,82 | 0,00 | 0 | 0 | 4 | 29 | scarto 0,03, alta 1,50 | — |
| 3 | 1493 | 2 | 3 | 1,83 | 0,00 | 0 | 0 | 4 | 28 | scarto 0,03, alta 1,50 | — |
| 4 | 1303 | 2 | 3 | 2,09 | 0,00 | 0 | 0 | 6 | 24 | scarto 0,03, alta 1,50 | — |
| 5 | 1174 | 2 | 4 | 2,10 | 0,00 | 0 | 0 | 4 | 29 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,60, colore 0,17, pianta 0,33, perimetro 0,19, interno 0,73, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1493 ms.

## enorme: 120 × 120 × 112, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1975 | 3 | 4 | 3,38 | 0,00 | 0 | 0 | 8 | 25 | scarto 0,03, alta 1,88 | — |
| 2 | 2184 | 3 | 4 | 3,38 | 0,00 | 0 | 0 | 5 | 31 | scarto 0,03, alta 1,88 | — |
| 3 | 2913 | 3 | 4 | 3,36 | 0,00 | 0 | 0 | 8 | 36 | scarto 0,03, alta 1,88 | — |
| 4 | 2294 | 3 | 4 | 2,84 | 0,00 | 0 | 0 | 8 | 28 | scarto 0,03, alta 1,88 | — |
| 5 | 2342 | 3 | 5 | 2,93 | 0,00 | 0 | 0 | 5 | 28 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,67, colore 0,17, pianta 0,34, perimetro 0,30, interno 0,81, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 2913 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 3,16 | 1,50 | 2 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×100, 79 nodi, 704 passi, finito in 1410 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 8=tubi d’acciaio, N=browN, E=Emerald, z=z, a=fondazione, x=scaffali del vino, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, m=magenta, o=orange, v=neon, y=yellow, g=green, s=slate, c=camino d’acciaio, d=dead, dark, H=Honey, b=black, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, j=jungle, M=Magenta, G=rovere (base), r=red, A=lastricato, R=ghiaia, S=cemento chiaro, C=cemento grigio, W=intonaco bianco, U=cemento grigio (fascia), F=parquet, u=intonaco bianco (fascia), K=acciaio, Y=gradino (testa), T=gradino, k=porta, L=rovere, Z=Z, D=telaio d’alluminio, V=vetro.
Alla fine: S 11179, C 9671, W 6036, F 4903, K 4819, R 4364, a 3696, V 2660, U 2234, A 1755, u 1474, D 1444, x 1008, k 330, L 288, 8 198, G 36, c 26, Y 11, T 11.
#2-63 prl×16, all×35, one×7: 68209 celle x1-98 y1-99 z20-87, passi 1-560
  .→C 9671: x17-34 y65 z21-51; x5 y36-95 z21-29; x95 y36-95 z21-29; +52 scatole, 8033 celle
  .→S 8322: x65-95 y35-95 z52; x5-35 y35-95 z84; x5-35 y35-65 z52; +31 scatole, 3579 celle
  .→W 6036: x17-34 y65 z54-83; x5 y36-95 z54-61; x6-64 y95 z54-61; +30 scatole, 4544 celle
  .→F 4903: x6-34 y36-64 z21; x6-34 y36-64 z53; x17-34 y66-94 z21; +13 scatole, 2699 celle
  .→U 4718: x6-34 y35 z30-43; x66-94 y35 z30-43; x5 y36-64 z30-43; +10 scatole, 3500 celle
  .→R 4364: x66-94 y36-94 z53; x6-34 y36-94 z85; x36-64 y66-94 z85; +17 scatole, 101 celle
  E→z 3326: x36-64 y6-34 z20; x6-34 y6-25 z20; x66-94 y6-25 z20; +10 scatole, 1325 celle
  .→u 3094: x6-34 y35 z62-75; x5 y36-64 z62-75; x35 y36-64 z62-75; +6 scatole, 1876 celle
  E→S 3033: x5-35 y35-95 z20; x36-64 y65-95 z20; x95 y35-95 z20; +12 scatole, 182 celle
  E→l 1711: x66-94 y36-94 z20
  .→K 352: x35 y66-76 z21-52
  .→k 330: x45-55 y95 z22-51
  .→L 288: x20 y26-34 z21-28; x80 y26-34 z21-28; x56-64 y50 z21-28; +1 scatole, 72 celle
  .→8 198: x94 y34 z21-86; x4 y54 z21-86; x96 y57 z21-86
  E→A 44: x45-55 y96-99 z20
  E→G 36: x20 y26-34 z20; x80 y26-34 z20; x56-64 y50 z20; +1 scatole, 9 celle
  .→N 12: x67 y84-94 z21; x66 y83 z21
  .→Y 11: x51 y66-76 z21
  .→T 11: x52 y66-76 z21
  .→m 11: x66 y84-94 z21
  N→z 1: x50 y50 z20
#64-79 prl×3, all×11, one×2: 67874 celle x0-99 y0-99 z0-98, passi 561-704
  Z→. 9824: x0-64 y36-99 z0; x0-99 y0-34 z0; x66-94 y36-94 z0; +6 scatole, 453 celle
  .→K 4399: x67-85 y84-94 z10-12; x67-79 y84-94 z13-15; x36-51 y66-76 z22-23; +18 scatole, 2991 celle
  .→a 3344: x65 y36-94 z1-19; x95 y36-94 z1-19; x66-94 y35 z1-19; +1 scatole, 551 celle
  z→. 3327: x36-64 y6-34 z20; x6-34 y6-25 z20; x66-94 y6-25 z20; +10 scatole, 1326 celle
  E→. 1849: x0-99 y0-5 z20; x0-5 y6-34 z20; x95-99 y6-34 z20; +23 scatole, 930 celle
  .→A 1711: x66-94 y36-94 z9
  l→. 1664: x74-86 y36-94 z20; x66-70 y36-82 z20; x71-73 y38-94 z20; +7 scatole, 491 celle
  U→V 1610: x8-14 y35 z32-41; x17-23 y35 z32-41; x26-32 y35 z32-41; +20 scatole, 1400 celle
  u→V 1050: x8-14 y35 z64-73; x23-29 y35 z64-73; x5 y38-44 z64-73; +12 scatole, 840 celle
  .→x 984: x71-73 y36-37 z21-51; x87-89 y36-37 z21-51; x93-94 y50-52 z21-51; +5 scatole, 426 celle
  U→D 874: x7-33 y35 z31; x15-16 y35 z32-42; x24-25 y35 z32-42; +77 scatole, 803 celle
  u→D 570: x5 y37-63 z63; x5 y45-46 z64-74; x5 y54-55 z64-74; +51 scatole, 499 celle
  Z→a 176: x65 y36-94 z0; x95 y36-94 z0; x66-94 y35 z0; +1 scatole, 29 celle
  S→a 176: x65 y36-94 z20; x95 y36-94 z20; x66-94 y35 z20; +1 scatole, 29 celle
  .→c 26: x16 y48 z86-98; x13 y52 z86-98
  l→x 24: x71-73 y36-37 z20; x87-89 y36-37 z20; x93-94 y50-52 z20; +1 scatole, 6 celle
  l→K 23: x66 y83-94 z20; x67 y84-94 z20
  N→K 12: x67 y84-94 z21; x66 y83 z21
  Y→K 11: x51 y66-76 z21
  T→K 11: x52 y66-76 z21
  m→K 11: x66 y84-94 z21
  .→Y 11: x35 y66-76 z53
  .→T 11: x36 y66-76 z53
Senza effetto (non hanno mai cambiato una cella):
#47 one *** *** *** *** *** *** *** *** *** *** *** ***… → *** *** *** *** *** *** *** *** *** *** *** ***… passi=1: in quel momento nella griglia non c'erano celle "b"
#48 all ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **… → ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **… (+1): in quel momento nella griglia non c'erano celle "n"
#49 one ********* ********* ********* ********* *******… → ********* ********* ********* ********* *******… passi=1: in quel momento nella griglia non c'erano celle "n"
#53 prl * * * * * * * * * * * * * * * * * * * * * * * *… → * * * * * * * * * * * * * * * * * * * * * * * *…: in quel momento nella griglia non c'erano celle "n"
```
