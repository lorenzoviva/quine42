# faro-a-vapore (steampunk)

Programma: `faro-a-vapore.xml` · classe `struttura` (bersaglio `grande`) · **cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida-generatore.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 100, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1450 | 2 | 4 | 2,09 | 0,00 | 0 | 0 | 4 | 27 | scarto 0,03, alta 1,50 | — |
| 2 | 1440 | 2 | 4 | 1,82 | 0,00 | 0 | 0 | 4 | 29 | scarto 0,03, alta 1,50 | — |
| 3 | 1419 | 2 | 3 | 1,83 | 0,00 | 0 | 0 | 4 | 29 | scarto 0,03, alta 1,50 | — |
| 4 | 1274 | 2 | 3 | 2,09 | 0,00 | 0 | 0 | 6 | 25 | scarto 0,03, alta 1,50 | — |
| 5 | 1376 | 2 | 4 | 2,11 | 0,00 | 0 | 0 | 4 | 28 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,65, colore 0,18, pianta 0,34, perimetro 0,15, interno 0,73, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1450 ms.

## enorme: 120 × 120 × 112, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2401 | 3 | 4 | 3,37 | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 2 | 2258 | 3 | 4 | 3,34 | 0,00 | 0 | 0 | 5 | 31 | scarto 0,03, alta 1,88 | — |
| 3 | 2766 | 3 | 4 | 3,35 | 0,00 | 0 | 0 | 8 | 35 | scarto 0,03, alta 1,88 | — |
| 4 | 2267 | 3 | 4 | 2,91 | 0,00 | 0 | 0 | 8 | 24 | scarto 0,03, alta 1,88 | — |
| 5 | 2423 | 3 | 5 | 2,93 | 0,00 | 0 | 0 | 5 | 26 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,70, colore 0,16, pianta 0,37, perimetro 0,28, interno 0,81, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 2766 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 3,15 | 1,50 | 2 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×100, 82 nodi, 717 passi, finito in 1482 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 6=mattoni del faro, 8=rame, N=browN, E=Emerald, z=z, a=fondazione, x=botti cerchiate, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, m=magenta, o=orange, v=neon, y=yellow, g=green, s=slate, c=mattoni della ciminiera, d=dead, dark, H=Honey, b=black, n=lanterna, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, j=jungle, M=Magenta, G=legno oliato (base), f=fawn, r=red, A=basolato, R=lamiera di ghisa, S=mattoni cotti, C=mattoni rossi, W=mattoni chiari, U=mattoni rossi (fascia), F=tavolato annerito, u=mattoni chiari (fascia), K=ferro battuto, Y=gradino d’ottone (testa), T=gradino d’ottone, k=porta ferrata, L=legno oliato, V=vetro ambrato, Z=Z, D=ghisa.
Alla fine: S 11334, 6 10206, C 9609, D 6030, W 6006, F 4903, K 4819, R 4362, a 3696, V 3238, U 2234, A 1755, u 1582, x 1008, n 486, k 330, L 288, 8 198, q 162, G 36, Y 11, T 11.
#2-64 prl×16, all×35, one×8: 79902 celle x1-98 y1-99 z20-91, passi 1-562
  .→6 10206: x35-43 y27-35 z21-82; x57-65 y27-35 z21-82; +2 scatole, 162 celle
  .→C 9609: x17-34 y65 z21-51; x5 y36-95 z21-29; +51 scatole, 8511 celle
  .→S 8317: x5-34 y35-95 z52; x66-95 y35-95 z52; +32 scatole, 4657 celle
  .→W 6006: x17-34 y65 z54-83; x5 y36-95 z54-61; +30 scatole, 4986 celle
  .→F 4903: x6-34 y36-64 z21; x6-34 y36-64 z53; +14 scatole, 3221 celle
  .→U 4718: x6-34 y35 z30-43; x66-94 y35 z30-43; +11 scatole, 3906 celle
  .→R 4362: x66-94 y36-94 z53; x6-34 y36-94 z85; +16 scatole, 940 celle
  E→z 3198: x36-64 y6-26 z20; x6-34 y6-25 z20; +13 scatole, 2009 celle
  E→S 3193: x5-34 y35-95 z20; x36-64 y65-95 z20; +16 scatole, 464 celle
  .→u 3094: x6-34 y35 z62-75; x5 y36-64 z62-75; +7 scatole, 2282 celle
  E→l 1711: x66-94 y36-94 z20
  .→V 648: x35-43 y27-35 z83-86; x57-65 y27-35 z83-86
  .→n 486: x35-43 y27-35 z87-89; x57-65 y27-35 z87-89
  .→K 352: x35 y66-76 z21-52
  .→k 330: x45-55 y95 z22-51
  .→L 288: x20 y26-34 z21-28; x80 y26-34 z21-28; +2 scatole, 144 celle
  .→8 198: x36 y58 z21-86; x96 y64 z21-86; +1 scatole, 66 celle
  .→q 162: x35-43 y27-35 z91; x57-65 y27-35 z91
  E→A 44: x45-55 y96-99 z20
  E→G 36: x20 y26-34 z20; x80 y26-34 z20; +2 scatole, 18 celle
  .→N 12: x67 y84-94 z21; x66 y83 z21
  .→Y 11: x51 y66-76 z21
  .→T 11: x52 y66-76 z21
  .→m 11: x66 y84-94 z21
  N→z 1: x50 y50 z20
#65-82 prl×3, all×13, one×2: 72204 celle x0-99 y0-99 z0-93, passi 563-717
  Z→. 9824: x0-64 y36-99 z0; x0-99 y0-34 z0; +7 scatole, 2164 celle
  .→D 4624: x71-87 y58-74 z54-61; x16-32 y78-94 z86-93
  .→K 4399: x68-85 y85-94 z10-12; x68-79 y85-94 z13-15; +22 scatole, 3499 celle
  .→a 3344: x65 y36-94 z1-19; x95 y36-94 z1-19; +2 scatole, 1102 celle
  z→. 3199: x36-64 y6-26 z20; x6-34 y6-25 z20; +13 scatole, 2010 celle
  E→. 1817: x0-99 y0-5 z20; x0-4 y35-79 z20; +24 scatole, 992 celle
  .→A 1711: x66-94 y36-94 z9
  l→. 1664: x68-92 y63-94 z20; x68-94 y47-62 z20; +6 scatole, 432 celle
  U→V 1610: x8-14 y35 z32-41; x23-29 y35 z32-41; +21 scatole, 1470 celle
  .→x 984: x93-94 y44-46 z21-51; x66-67 y47-49 z21-51; +6 scatole, 612 celle
  u→V 980: x11-17 y35 z64-73; x23-29 y35 z64-73; +12 scatole, 840 celle
  U→D 874: x5 y37-63 z31; x5 y45-46 z32-42; +80 scatole, 825 celle
  u→D 532: x5 y51-52 z64-74; x5 y43-60 z63; +52 scatole, 492 celle
  Z→a 176: x65 y36-94 z0; x95 y36-94 z0; +2 scatole, 58 celle
  S→a 176: x65 y36-94 z20; x95 y36-94 z20; +2 scatole, 58 celle
  l→x 24: x93-94 y44-46 z20; x66-67 y47-49 z20; +2 scatole, 12 celle
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
