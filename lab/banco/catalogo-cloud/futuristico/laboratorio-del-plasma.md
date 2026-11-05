# laboratorio-del-plasma (futuristico)

Programma: `laboratorio-del-plasma.xml` · classe `struttura` (bersaglio `grande`) · **cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida-generatore.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 100, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1173 | 2 | 4 | 2,11 | 0,00 | 0 | 0 | 5 | 27 | scarto 0,03, alta 1,50 | — |
| 2 | 1414 | 2 | 4 | 1,85 | 0,00 | 0 | 0 | 4 | 26 | scarto 0,03, alta 1,50 | — |
| 3 | 1437 | 2 | 3 | 1,82 | 0,00 | 0 | 0 | 4 | 30 | scarto 0,03, alta 1,50 | — |
| 4 | 1338 | 2 | 3 | 2,11 | 0,00 | 0 | 0 | 6 | 29 | scarto 0,03, alta 1,50 | — |
| 5 | 1306 | 2 | 4 | 2,12 | 0,00 | 0 | 0 | 4 | 31 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,61, colore 0,18, pianta 0,33, perimetro 0,19, interno 0,73, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1437 ms.

## enorme: 120 × 120 × 112, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2201 | 3 | 4 | 3,35 | 0,00 | 0 | 0 | 8 | 26 | scarto 0,03, alta 1,88 | — |
| 2 | 2187 | 3 | 4 | 3,32 | 0,00 | 0 | 0 | 5 | 30 | scarto 0,03, alta 1,88 | — |
| 3 | 2450 | 3 | 4 | 3,35 | 0,00 | 0 | 0 | 8 | 41 | scarto 0,03, alta 1,88 | — |
| 4 | 2354 | 3 | 4 | 2,94 | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 5 | 2183 | 3 | 5 | 2,88 | 0,00 | 0 | 0 | 5 | 25 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,67, colore 0,17, pianta 0,34, perimetro 0,30, interno 0,81, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 2450 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 3,16 | 1,50 | 2 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×100, 79 nodi, 707 passi, finito in 1293 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 8=condotti, N=browN, E=Emerald, z=z, a=fondazione, x=serbatoi, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, m=magenta, o=orange, v=neon ciano, y=yellow, g=green, s=slate, c=scarico di titanio, d=dead, dark, H=Honey, b=black, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, j=jungle, M=Magenta, G=polimero (base), r=red, A=pista, R=pannelli solari, S=lega bianca, C=metallo bianco, W=composito, U=metallo bianco (fascia), F=pannelli del pavimento, u=composito (fascia), K=titanio, Y=gradino luminoso (testa), T=gradino luminoso, k=portello, L=polimero, Z=Z, D=telaio nero, V=vetro scuro.
Alla fine: S 10612, C 9671, W 6036, F 4903, K 4819, R 4364, a 3696, V 2660, U 2342, A 1755, D 1444, u 1366, x 1008, v 569, 8 330, k 330, L 288, c 39, G 36, Y 11, T 11.
#2-63 prl×16, all×35, one×7: 68345 celle x1-98 y1-99 z20-87, passi 1-562
  .→C 9671: x17-34 y65 z21-51; x5 y36-95 z21-29; x95 y36-95 z21-29; +52 scatole, 8033 celle
  .→S 7753: x6-34 y36-94 z52; x66-94 y36-94 z52; x6-34 y36-94 z84; +53 scatole, 2620 celle
  .→W 6036: x17-34 y65 z54-83; x5 y36-95 z54-61; x6-64 y95 z54-61; +30 scatole, 4544 celle
  .→F 4903: x6-34 y36-64 z21; x6-34 y36-64 z53; x17-34 y66-94 z21; +13 scatole, 2699 celle
  .→U 4718: x6-34 y35 z30-43; x66-94 y35 z30-43; x5 y36-64 z30-43; +10 scatole, 3500 celle
  .→R 4364: x66-94 y36-94 z53; x6-34 y36-94 z85; x36-64 y66-94 z85; +17 scatole, 101 celle
  E→z 3326: x36-64 y6-34 z20; x6-34 y6-25 z20; x66-94 y6-25 z20; +10 scatole, 1325 celle
  .→u 3094: x6-34 y35 z62-75; x5 y36-64 z62-75; x35 y36-64 z62-75; +6 scatole, 1876 celle
  E→S 3035: x5-35 y35-95 z20; x36-64 y65-95 z20; x95 y35-95 z20; +14 scatole, 184 celle
  E→l 1711: x66-94 y36-94 z20
  .→v 569: x6-34 y35 z52; x66-94 y35 z52; x5 y36-64 z52; +18 scatole, 482 celle
  .→K 352: x35 y66-76 z21-52
  .→k 330: x45-55 y95 z22-51
  .→8 330: x94 y34 z21-86; x4 y54 z21-86; x96 y57 z21-86; +2 scatole, 132 celle
  .→L 288: x20 y26-34 z21-28; x80 y26-34 z21-28; x56-64 y50 z21-28; +1 scatole, 72 celle
  E→A 44: x45-55 y96-99 z20
  E→G 36: x20 y26-34 z20; x80 y26-34 z20; x56-64 y50 z20; +1 scatole, 9 celle
  .→N 12: x67 y84-94 z21; x66 y83 z21
  .→Y 11: x51 y66-76 z21
  .→T 11: x52 y66-76 z21
  .→m 11: x66 y84-94 z21
  N→z 1: x50 y50 z20
#64-79 prl×3, all×11, one×2: 67885 celle x0-99 y0-99 z0-98, passi 563-707
  Z→. 9824: x0-64 y36-99 z0; x0-99 y0-34 z0; x66-94 y36-94 z0; +6 scatole, 453 celle
  .→K 4399: x67-85 y84-94 z10-12; x67-79 y84-94 z13-15; x36-51 y66-76 z22-23; +18 scatole, 2991 celle
  .→a 3344: x65 y36-94 z1-19; x95 y36-94 z1-19; x66-94 y35 z1-19; +1 scatole, 551 celle
  z→. 3327: x36-64 y6-34 z20; x6-34 y6-25 z20; x66-94 y6-25 z20; +10 scatole, 1326 celle
  E→. 1847: x0-99 y0-5 z20; x0-5 y6-34 z20; x95-99 y6-34 z20; +25 scatole, 928 celle
  .→A 1711: x66-94 y36-94 z9
  l→. 1664: x68-92 y61-94 z20; x66-92 y43-60 z20; x66-94 y36-42 z20; +5 scatole, 125 celle
  U→V 1540: x8-14 y35 z32-41; x19-25 y35 z32-41; x68-74 y35 z32-41; +19 scatole, 1330 celle
  u→V 1120: x9-15 y35 z64-73; x24-30 y35 z64-73; x5 y38-44 z64-73; +13 scatole, 910 celle
  .→x 984: x93-94 y43-45 z21-51; x66-67 y61-63 z21-51; x66-67 y72-74 z21-51; +5 scatole, 426 celle
  U→D 836: x49-50 y65 z32-42; x16-17 y95 z32-42; x41-58 y65 z31; +81 scatole, 774 celle
  u→D 608: x5 y37-63 z63; x7-33 y95 z63; x5 y45-46 z64-74; +53 scatole, 532 celle
  Z→a 176: x65 y36-94 z0; x95 y36-94 z0; x66-94 y35 z0; +1 scatole, 29 celle
  S→a 176: x65 y36-94 z20; x95 y36-94 z20; x66-94 y35 z20; +1 scatole, 29 celle
  .→c 39: x82 y68 z54-66; x9 y64 z86-98; x42 y74 z86-98
  l→x 24: x93-94 y43-45 z20; x66-67 y61-63 z20; x66-67 y72-74 z20; +1 scatole, 6 celle
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
