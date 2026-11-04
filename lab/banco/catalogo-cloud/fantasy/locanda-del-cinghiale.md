# locanda-del-cinghiale (fantasy)

Programma: `locanda-del-cinghiale.xml` · classe `struttura` (bersaglio `grande`) · **cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 100, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1389 | 2 | 4 | 2,11 | 0,00 | 0 | 0 | 4 | 27 | scarto 0,03, alta 1,50 | — |
| 2 | 1349 | 2 | 4 | 1,82 | 0,00 | 0 | 0 | 6 | 25 | scarto 0,03, alta 1,50 | — |
| 3 | 1804 | 2 | 3 | 1,82 | 0,00 | 0 | 0 | 4 | 24 | scarto 0,03, alta 1,50 | — |
| 4 | 1671 | 2 | 3 | 2,12 | 0,00 | 0 | 0 | 4 | 22 | scarto 0,03, alta 1,50 | — |
| 5 | 1566 | 2 | 4 | 2,10 | 0,00 | 0 | 0 | 4 | 26 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,66, colore 0,14, pianta 0,33, perimetro 0,20, interno 0,73, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1804 ms.

## enorme: 120 × 120 × 112, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2402 | 3 | 4 | 3,35 | 0,00 | 0 | 0 | 8 | 26 | scarto 0,03, alta 1,88 | — |
| 2 | 2386 | 3 | 4 | 3,36 | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 3 | 2635 | 3 | 4 | 3,36 | 0,00 | 0 | 0 | 8 | 34 | scarto 0,03, alta 1,88 | — |
| 4 | 2535 | 3 | 4 | 2,89 | 0,00 | 0 | 0 | 8 | 23 | scarto 0,03, alta 1,88 | — |
| 5 | 2275 | 3 | 5 | 2,87 | 0,00 | 0 | 0 | 5 | 23 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,70, colore 0,14, pianta 0,34, perimetro 0,31, interno 0,81, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 2635 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 3,16 | 1,50 | 2 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×100, 79 nodi, 701 passi, finito in 1413 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 7=insegna, 9=ferro, N=browN, E=Emerald, z=z, a=fondazione, x=botti di rovere, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, m=magenta, o=orange, v=neon, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, j=jungle, M=Magenta, G=legno di castagno (base), A=acciottolato, R=coppi, S=pietra squadrata, C=pietra grezza, W=intonaco a calce, U=pietra grezza (fascia), F=assi di quercia, u=intonaco a calce (fascia), K=pietra della scala, Y=gradino di pietra (testa), T=gradino di pietra, k=portone, L=legno di castagno, Z=Z, D=travi scure, V=vetro piombato.
Alla fine: R 26949, S 11106, C 9051, W 5648, F 4903, K 4819, a 3696, V 2660, U 2234, A 1755, u 1474, D 1444, x 1008, k 330, L 288, 7 44, 9 44, G 36, Y 11, T 11, c 7.
#2-62 prl×16, all×35, one×6: 66975 celle x1-98 y1-99 z20-87, passi 1-555
  .→C 9051: x17-34 y65 z21-51; x5 y36-95 z21-29; x95 y36-95 z21-29; +50 scatole, 7413 celle
  .→S 8272: x65-95 y35-95 z52; x5-35 y35-95 z84; x5-35 y35-65 z52; +28 scatole, 3529 celle
  .→W 5648: x17-34 y65 z54-83; x5 y36-95 z54-61; x6-44 y95 z54-61; +30 scatole, 4316 celle
  .→F 4903: x6-34 y36-64 z21; x6-34 y36-64 z53; x17-34 y66-94 z21; +13 scatole, 2699 celle
  .→U 4718: x6-34 y35 z30-43; x66-94 y35 z30-43; x5 y36-64 z30-43; +10 scatole, 3500 celle
  .→R 4344: x66-94 y36-94 z53; x6-34 y36-94 z85; x36-64 y66-94 z85; +15 scatole, 81 celle
  E→z 3327: x6-34 y6-34 z20; x36-64 y6-34 z20; x66-94 y6-25 z20; +8 scatole, 1065 celle
  .→u 3094: x6-34 y35 z62-75; x5 y36-64 z62-75; x35 y36-64 z62-75; +6 scatole, 1876 celle
  E→S 3010: x5-35 y35-95 z20; x36-64 y65-95 z20; x65 y36-95 z20; +7 scatole, 160 celle
  E→l 1711: x66-94 y36-94 z20
  .→K 352: x35 y66-76 z21-52
  .→k 330: x45-55 y95 z22-51
  .→L 288: x80 y26-34 z21-28; x36-44 y50 z21-28; x56-64 y50 z21-28; +1 scatole, 72 celle
  E→A 44: x45-55 y96-99 z20
  .→7 44: x45-55 y95 z54; x45-55 y95 z56; x45-55 y95 z58; +1 scatole, 11 celle
  .→9 44: x45-55 y95 z55; x45-55 y95 z57; x45-55 y95 z59; +1 scatole, 11 celle
  E→G 36: x80 y26-34 z20; x36-44 y50 z20; x56-64 y50 z20; +1 scatole, 9 celle
  .→N 12: x67 y84-94 z21; x66 y83 z21
  .→Y 11: x51 y66-76 z21
  .→T 11: x52 y66-76 z21
  .→m 11: x66 y84-94 z21
  N→z 1: x50 y50 z20
#63-69 prl×2, all×5: 43138 celle x65-95 y35-95 z0-21, passi 556-592
  .→a 3344: x65 y36-94 z1-19; x95 y36-94 z1-19; x66-94 y35 z1-19; +1 scatole, 551 celle
  .→A 1711: x66-94 y36-94 z9
  l→. 1711: x66-94 y36-94 z20
  .→K 198: x80-85 y84-94 z12; x74-79 y84-94 z15; x68-73 y84-94 z18
  Z→a 176: x65 y36-94 z0; x95 y36-94 z0; x66-94 y35 z0; +1 scatole, 29 celle
  S→a 176: x65 y36-94 z20; x95 y36-94 z20; x66-94 y35 z20; +1 scatole, 29 celle
  N→K 12: x67 y84-94 z21; x66 y83 z21
  m→K 11: x66 y84-94 z21
#70-79 all×7, one×2, prl×1: 47345 celle x0-99 y0-99 z0-99, passi 593-701
  .→R 22605: x67-93 y37-93 z54; x7-33 y37-93 z86; x68-92 y38-92 z55; +87 scatole, 18152 celle
  Z→. 9824: x0-64 y36-99 z0; x0-99 y0-34 z0; x66-94 y36-94 z0; +6 scatole, 453 celle
  .→K 4224: x67-79 y84-94 z12-14; x67-85 y84-94 z10-11; x36-51 y66-76 z22-23; +18 scatole, 3025 celle
  z→. 3328: x6-34 y6-34 z20; x36-64 y6-34 z20; x66-94 y6-25 z20; +8 scatole, 1066 celle
  E→. 1871: x0-99 y0-5 z20; x0-4 y35-99 z20; x96-99 y35-84 z20; +15 scatole, 746 celle
  U→V 1610: x14-20 y35 z32-41; x24-30 y35 z32-41; x70-76 y35 z32-41; +20 scatole, 1400 celle
  u→V 1050: x8-14 y35 z64-73; x17-23 y35 z64-73; x26-32 y35 z64-73; +12 scatole, 840 celle
  .→x 1008: x66-67 y50-52 z10-51; x66-67 y60-62 z10-51; x93-94 y65-67 z10-51; +1 scatole, 252 celle
  U→D 874: x67-93 y95 z31; x95 y46-47 z32-42; x75-76 y95 z32-42; +83 scatole, 803 celle
  u→D 570: x7-33 y35 z63; x15-16 y35 z64-74; x24-25 y35 z64-74; +49 scatole, 499 celle
  Y→K 11: x51 y66-76 z21
  T→K 11: x52 y66-76 z21
  .→Y 11: x35 y66-76 z53
  .→T 11: x36 y66-76 z53
  .→c 7: x32 y87 z93-99
Senza effetto (non hanno mai cambiato una cella):
#47 one *** *** *** *** *** *** *** *** *** *** *** ***… → *** *** *** *** *** *** *** *** *** *** *** ***… passi=1: in quel momento nella griglia non c'erano celle "b"
#48 all ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **… → ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **… (+1): in quel momento nella griglia non c'erano celle "n"
#49 one ********* ********* ********* ********* *******… → ********* ********* ********* ********* *******… passi=1: in quel momento nella griglia non c'erano celle "n"
#53 prl * * * * * * * * * * * * * * * * * * * * * * * *… → * * * * * * * * * * * * * * * * * * * * * * * *…: in quel momento nella griglia non c'erano celle "n"
```
