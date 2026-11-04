# torre-del-mago (fantasy)

Programma: `torre-del-mago.xml` · classe `struttura` (bersaglio `grande`) · **cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 100, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1560 | 2 | 4 | 2,10 | 0,00 | 0 | 0 | 4 | 27 | scarto 0,03, alta 1,50 | — |
| 2 | 1348 | 2 | 4 | 1,83 | 0,00 | 0 | 0 | 4 | 30 | scarto 0,03, alta 1,50 | — |
| 3 | 1223 | 2 | 3 | 1,84 | 0,00 | 0 | 0 | 4 | 25 | scarto 0,03, alta 1,50 | — |
| 4 | 1592 | 2 | 3 | 2,09 | 0,00 | 0 | 0 | 6 | 25 | scarto 0,03, alta 1,50 | — |
| 5 | 1677 | 2 | 4 | 2,10 | 0,00 | 0 | 0 | 4 | 28 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,64, colore 0,18, pianta 0,34, perimetro 0,15, interno 0,73, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1677 ms.

## enorme: 120 × 120 × 112, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2435 | 3 | 4 | 3,38 | 0,00 | 0 | 0 | 8 | 20 | scarto 0,03, alta 1,88 | — |
| 2 | 2645 | 3 | 4 | 3,34 | 0,00 | 0 | 0 | 5 | 31 | scarto 0,03, alta 1,88 | — |
| 3 | 2673 | 3 | 4 | 3,38 | 0,00 | 0 | 0 | 8 | 35 | scarto 0,03, alta 1,88 | — |
| 4 | 2667 | 3 | 4 | 2,90 | 0,00 | 0 | 0 | 8 | 26 | scarto 0,03, alta 1,88 | — |
| 5 | 2483 | 3 | 5 | 2,94 | 0,00 | 0 | 0 | 5 | 22 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,69, colore 0,16, pianta 0,37, perimetro 0,28, interno 0,81, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 2673 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 3,15 | 1,50 | 2 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×100, 82 nodi, 715 passi, finito in 1349 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 6=pietra della torre, N=browN, E=Emerald, z=z, a=fondazione, x=botti di rovere, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, m=magenta, o=orange, v=neon, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, n=lume arcano, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=legno di castagno (base), f=fawn, A=acciottolato, R=lastre di pietra, S=pietra squadrata, C=pietra grezza, W=intonaco a calce, U=pietra grezza (fascia), F=assi di quercia, u=intonaco a calce (fascia), K=pietra della scala, Y=gradino di pietra (testa), T=gradino di pietra, k=portone, L=legno di castagno, V=vetro piombato, Z=Z, D=travi scure.
Alla fine: S 11331, 6 10206, C 9232, W 6006, D 5246, F 4903, K 4819, R 4362, a 3696, V 3238, U 2234, A 1755, u 1582, x 1008, i 948, n 486, h 377, k 330, L 288, q 162, G 36, Y 11, T 11.
#2-63 prl×16, all×35, one×7: 79698 celle x1-98 y1-99 z20-91, passi 1-559
  .→6 10206: x35-43 y27-35 z21-82; x57-65 y27-35 z21-82; +2 scatole, 162 celle
  .→C 9232: x17-34 y65 z21-51; x5 y36-95 z21-29; +38 scatole, 8134 celle
  .→S 8317: x5-34 y35-95 z52; x66-95 y35-95 z52; +32 scatole, 4657 celle
  .→W 6006: x17-34 y65 z54-83; x5 y36-95 z54-61; +30 scatole, 4986 celle
  .→F 4903: x6-34 y36-64 z21; x6-34 y36-64 z53; +14 scatole, 3221 celle
  .→U 4718: x6-34 y35 z30-43; x66-94 y35 z30-43; +11 scatole, 3906 celle
  .→R 4362: x66-94 y36-94 z53; x6-34 y36-94 z85; +16 scatole, 940 celle
  E→z 3199: x36-64 y6-26 z20; x6-34 y6-25 z20; +11 scatole, 2010 celle
  E→S 3190: x5-34 y35-95 z20; x36-64 y65-95 z20; +13 scatole, 461 celle
  .→u 3094: x6-34 y35 z62-75; x5 y36-64 z62-75; +7 scatole, 2282 celle
  E→l 1711: x66-94 y36-94 z20
  .→V 648: x35-43 y27-35 z83-86; x57-65 y27-35 z83-86
  .→n 486: x35-43 y27-35 z87-89; x57-65 y27-35 z87-89
  .→h 377: x66-94 y35 z58; x65 y36-64 z58; +11 scatole, 319 celle
  .→K 352: x35 y66-76 z21-52
  .→k 330: x45-55 y95 z22-51
  .→L 288: x20 y26-34 z21-28; x80 y26-34 z21-28; +2 scatole, 144 celle
  .→q 162: x35-43 y27-35 z91; x57-65 y27-35 z91
  E→A 44: x45-55 y96-99 z20
  E→G 36: x20 y26-34 z20; x80 y26-34 z20; +2 scatole, 18 celle
  .→N 12: x67 y84-94 z21; x66 y83 z21
  .→Y 11: x51 y66-76 z21
  .→T 11: x52 y66-76 z21
  .→m 11: x66 y84-94 z21
  N→z 1: x50 y50 z20
#64-82 prl×3, all×14, one×2: 72371 celle x0-99 y0-99 z0-93, passi 560-715
  Z→. 9824: x0-64 y36-99 z0; x0-99 y0-34 z0; +7 scatole, 2164 celle
  .→K 4399: x68-85 y85-94 z10-12; x68-79 y85-94 z13-15; +22 scatole, 3499 celle
  .→D 3840: x20-35 y65-81 z86-93; x83-94 y79-94 z54-61; +1 scatole, 128 celle
  .→a 3344: x65 y36-94 z1-19; x95 y36-94 z1-19; +2 scatole, 1102 celle
  z→. 3200: x36-64 y6-26 z20; x6-34 y6-25 z20; +11 scatole, 2011 celle
  E→. 1819: x0-99 y0-5 z20; x0-4 y35-79 z20; +20 scatole, 994 celle
  .→A 1711: x66-94 y36-94 z9
  l→. 1664: x68-92 y58-94 z20; x66-94 y36-46 z20; +6 scatole, 420 celle
  U→V 1610: x8-14 y35 z32-41; x23-29 y35 z32-41; +21 scatole, 1470 celle
  .→x 984: x66-67 y47-49 z21-51; x93-94 y58-60 z21-51; +6 scatole, 612 celle
  u→V 980: x12-18 y35 z64-73; x21-27 y35 z64-73; +12 scatole, 840 celle
  .→i 948: x95 y45-58 z59-61; x65 y66-79 z88-90; +62 scatole, 864 celle
  U→D 874: x67-93 y35 z31; x75-76 y35 z32-42; +82 scatole, 825 celle
  u→D 532: x19-20 y35 z64-74; x5 y78-79 z64-74; +46 scatole, 488 celle
  Z→a 176: x65 y36-94 z0; x95 y36-94 z0; +2 scatole, 58 celle
  S→a 176: x65 y36-94 z20; x95 y36-94 z20; +2 scatole, 58 celle
  l→x 24: x66-67 y47-49 z20; x93-94 y58-60 z20; +2 scatole, 12 celle
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
