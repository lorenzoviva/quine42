# taverna-delle-caldaie (steampunk)

Programma: `taverna-delle-caldaie.xml` · classe `struttura` (bersaglio `grande`) · **cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 100, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1367 | 2 | 4 | 2,11 | 0,00 | 0 | 0 | 5 | 26 | scarto 0,03, alta 1,50 | — |
| 2 | 1374 | 2 | 4 | 1,85 | 0,00 | 0 | 0 | 4 | 32 | scarto 0,03, alta 1,50 | — |
| 3 | 1306 | 2 | 3 | 1,82 | 0,00 | 0 | 0 | 4 | 33 | scarto 0,03, alta 1,50 | — |
| 4 | 1233 | 2 | 3 | 2,11 | 0,00 | 0 | 0 | 6 | 24 | scarto 0,03, alta 1,50 | — |
| 5 | 1295 | 2 | 4 | 2,09 | 0,00 | 0 | 0 | 4 | 30 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,60, colore 0,16, pianta 0,33, perimetro 0,19, interno 0,73, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1374 ms.

## enorme: 120 × 120 × 112, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2255 | 3 | 4 | 3,34 | 0,00 | 0 | 0 | 8 | 26 | scarto 0,03, alta 1,88 | — |
| 2 | 2435 | 3 | 4 | 3,32 | 0,00 | 0 | 0 | 5 | 28 | scarto 0,03, alta 1,88 | — |
| 3 | 2072 | 3 | 4 | 3,35 | 0,00 | 0 | 0 | 8 | 35 | scarto 0,03, alta 1,88 | — |
| 4 | 2440 | 3 | 4 | 2,88 | 0,00 | 0 | 0 | 8 | 22 | scarto 0,03, alta 1,88 | — |
| 5 | 2305 | 3 | 5 | 2,91 | 0,00 | 0 | 0 | 5 | 26 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,67, colore 0,17, pianta 0,34, perimetro 0,30, interno 0,81, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 2440 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 3,16 | 1,50 | 2 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×100, 79 nodi, 702 passi, finito in 1199 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 7=insegna, 8=rame, 9=ottone, N=browN, E=Emerald, z=z, a=fondazione, x=botti cerchiate, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, m=magenta, o=orange, v=neon, y=yellow, g=green, s=slate, c=mattoni della ciminiera, d=dead, dark, H=Honey, b=black, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, j=jungle, M=Magenta, G=legno oliato (base), r=red, A=basolato, R=lamiera di ghisa, S=mattoni cotti, C=mattoni rossi, W=mattoni chiari, U=mattoni rossi (fascia), F=tavolato annerito, u=mattoni chiari (fascia), K=ferro battuto, Y=gradino d’ottone (testa), T=gradino d’ottone, k=porta ferrata, L=legno oliato, Z=Z, D=ghisa, V=vetro ambrato.
Alla fine: S 11180, C 9671, W 5948, F 4903, K 4819, R 4364, a 3696, V 2660, U 2126, A 1755, u 1582, D 1444, x 1008, k 330, L 288, 8 264, 7 44, 9 44, G 36, Y 11, T 11, c 11.
#2-63 prl×16, all×35, one×7: 68277 celle x1-98 y1-99 z20-87, passi 1-561
  .→C 9671: x17-34 y65 z21-51; x5 y36-95 z21-29; x95 y36-95 z21-29; +52 scatole, 8033 celle
  .→S 8322: x65-95 y35-95 z52; x5-35 y35-95 z84; x5-35 y35-65 z52; +31 scatole, 3579 celle
  .→W 5948: x17-34 y65 z54-83; x5 y36-95 z54-61; x6-44 y95 z54-61; +31 scatole, 4616 celle
  .→F 4903: x6-34 y36-64 z21; x6-34 y36-64 z53; x17-34 y66-94 z21; +13 scatole, 2699 celle
  .→U 4718: x6-34 y35 z30-43; x66-94 y35 z30-43; x5 y36-64 z30-43; +10 scatole, 3500 celle
  .→R 4364: x66-94 y36-94 z53; x6-34 y36-94 z85; x36-64 y66-94 z85; +17 scatole, 101 celle
  E→z 3326: x36-64 y6-34 z20; x6-34 y6-25 z20; x66-94 y6-25 z20; +10 scatole, 1325 celle
  .→u 3094: x6-34 y35 z62-75; x5 y36-64 z62-75; x35 y36-64 z62-75; +6 scatole, 1876 celle
  E→S 3034: x5-35 y35-95 z20; x36-64 y65-95 z20; x95 y35-95 z20; +13 scatole, 183 celle
  E→l 1711: x66-94 y36-94 z20
  .→K 352: x35 y66-76 z21-52
  .→k 330: x45-55 y95 z22-51
  .→L 288: x20 y26-34 z21-28; x80 y26-34 z21-28; x56-64 y50 z21-28; +1 scatole, 72 celle
  .→8 264: x94 y34 z21-86; x4 y54 z21-86; x96 y57 z21-86; +1 scatole, 66 celle
  E→A 44: x45-55 y96-99 z20
  .→7 44: x45-55 y95 z54; x45-55 y95 z56; x45-55 y95 z58; +1 scatole, 11 celle
  .→9 44: x45-55 y95 z55; x45-55 y95 z57; x45-55 y95 z59; +1 scatole, 11 celle
  E→G 36: x20 y26-34 z20; x80 y26-34 z20; x56-64 y50 z20; +1 scatole, 9 celle
  .→N 12: x67 y84-94 z21; x66 y83 z21
  .→Y 11: x51 y66-76 z21
  .→T 11: x52 y66-76 z21
  .→m 11: x66 y84-94 z21
  N→z 1: x50 y50 z20
#64-79 prl×3, all×11, one×2: 67858 celle x0-99 y0-99 z0-96, passi 562-702
  Z→. 9824: x0-64 y36-99 z0; x0-99 y0-34 z0; x66-94 y36-94 z0; +6 scatole, 453 celle
  .→K 4399: x67-85 y84-94 z10-12; x67-79 y84-94 z13-15; x36-51 y66-76 z22-23; +18 scatole, 2991 celle
  .→a 3344: x65 y36-94 z1-19; x95 y36-94 z1-19; x66-94 y35 z1-19; +1 scatole, 551 celle
  z→. 3327: x36-64 y6-34 z20; x6-34 y6-25 z20; x66-94 y6-25 z20; +10 scatole, 1326 celle
  E→. 1848: x0-99 y0-5 z20; x0-5 y6-34 z20; x95-99 y6-34 z20; +24 scatole, 929 celle
  .→A 1711: x66-94 y36-94 z9
  U→V 1680: x8-14 y35 z32-41; x19-25 y35 z32-41; x71-77 y35 z32-41; +21 scatole, 1470 celle
  l→. 1664: x68-85 y63-94 z20; x66-85 y36-62 z20; x86-88 y38-94 z20; +6 scatole, 377 celle
  .→x 984: x86-88 y36-37 z21-51; x93-94 y59-61 z21-51; x66-67 y63-65 z21-51; +5 scatole, 426 celle
  u→V 980: x8-14 y35 z64-73; x24-30 y35 z64-73; x35 y39-45 z64-73; +11 scatole, 770 celle
  U→D 912: x5 y37-63 z31; x37-63 y65 z31; x5 y45-46 z32-42; +81 scatole, 836 celle
  u→D 532: x5 y81-82 z64-74; x5 y73-90 z63; x7 y35 z64-74; +51 scatole, 481 celle
  Z→a 176: x65 y36-94 z0; x95 y36-94 z0; x66-94 y35 z0; +1 scatole, 29 celle
  S→a 176: x65 y36-94 z20; x95 y36-94 z20; x66-94 y35 z20; +1 scatole, 29 celle
  l→x 24: x86-88 y36-37 z20; x93-94 y59-61 z20; x66-67 y63-65 z20; +1 scatole, 6 celle
  l→K 23: x66 y83-94 z20; x67 y84-94 z20
  N→K 12: x67 y84-94 z21; x66 y83 z21
  Y→K 11: x51 y66-76 z21
  T→K 11: x52 y66-76 z21
  m→K 11: x66 y84-94 z21
  .→Y 11: x35 y66-76 z53
  .→T 11: x36 y66-76 z53
  .→c 11: x30 y76 z86-96
Senza effetto (non hanno mai cambiato una cella):
#47 one *** *** *** *** *** *** *** *** *** *** *** ***… → *** *** *** *** *** *** *** *** *** *** *** ***… passi=1: in quel momento nella griglia non c'erano celle "b"
#48 all ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **… → ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **… (+1): in quel momento nella griglia non c'erano celle "n"
#49 one ********* ********* ********* ********* *******… → ********* ********* ********* ********* *******… passi=1: in quel momento nella griglia non c'erano celle "n"
#53 prl * * * * * * * * * * * * * * * * * * * * * * * *… → * * * * * * * * * * * * * * * * * * * * * * * *…: in quel momento nella griglia non c'erano celle "n"
```
