# Il seme procedurale (Cantiere 2, parte A)

I 24 modelli non-corona di `universe/models/` riscritti come programmi MarkovJunior **davvero procedurali**: stessa palette, stessa classe
(e quindi stessa scatola), stessa sagoma riconoscibile, ma il seme cambia la forma. Prima di questo cantiere, sullo stesso banco, 14 dei 24 davano la
stessa forma a ogni seme (varianza 0: casetta, quercia, sasso, pozzo, colonna, cartello, barile, banco, credenza, letto, cassa, viandante,
contadina, lupo), 3 variavano meno di 0,15 (pino, betulla, cespuglio con bacche) e 2 avevano voxel staccati (fattoria, pino); i 6 che
passavano (casa a graticcio, palma, rocce, cespuglio, falò) variavano per rumore di superficie o per poco. Ora tutti e 24 passano il
validatore a ogni seme senza un solo frammento e hanno una distanza media fra i semi da 0,15 in su (media delle medie 0,44).

Questi file sono il banco da cui sceglierli. Dal 05/11 (T273) sono anche in `universe/models/` e nei tre universi di Claude Cloud, al posto
delle copie del seme (`../universi-cloud/strumenti/integra.ts`, [`../universi-cloud/INTEGRAZIONE.md`](../universi-cloud/INTEGRAZIONE.md)).

## Il banco (`prova.ts`)

```bash
npx vite-node lab/banco/seme-procedurale/prova.ts -- lab/banco/seme-procedurale [id…]
npx vite-node lab/banco/seme-procedurale/prova.ts -- lab/banco/props-tematici [id…]
```

Il programma gira come lo fa girare il gioco: nella scatola della sua classe (`withSize`, `boxOf`), con `FORM_LIMITS` e 8 s di tempo. Per
ogni modello:

- **il validatore del gioco**: `modelErrors` di `src/kernel/validator.ts` (compila, finisce, sta in piedi) e `checkProgram` dello Scultore
  (anche l'altezza minima della classe). Nel codice non esiste una `validateModelProgram`: queste due sono le funzioni che il kernel usa
  per accettare un modello della libreria;
- **a ogni seme 1..5** `analyse` di `src/mj/check.ts` con `grounded`: niente errori, e in più **nessun frammento staccato**, nemmeno uno
  che il validatore lascerebbe passare come avviso;
- **la varianza**: per ogni coppia di semi i voxel visibili pieni in uno e vuoti nell'altro, su quelli pieni in almeno uno (il colore non
  conta); la media delle 10 coppie deve essere ≥ 0,15 e nessuna coppia può essere identica.

Scrive `<id>.md` (esito, distanze di ogni coppia, la traccia di `src/mj/trace.ts` di tre semi a confronto) e `<id>.png` (i cinque semi
in 3/4). `frammenti.ts` dice, per un seme, quali pezzi sono staccati e dove, e con `--strati` stampa la griglia strato per strato.

## Come si fa variare un programma

Le forme (`box`, `cylinder`, …) sono fisse: la varianza viene sempre dalle regole. Gli idiomi usati, dal più generale:

1. **La quota scelta** (barile, banco, credenza, cassa, colonna, pozzo, alberi, casetta): una colonna nascosta in un angolo, `one` ne
   sceglie una cella, lo strato scelto si riempie di `k` (`<all in="k*" out="kk"/>`), poi o fa da soffitto a ciò che cresce (un fusto, i
   muri della fattoria) o, salendo (`<all in="* k" out="k *"/>`), taglia tutto ciò che sta sopra. Poi le regole rifanno la cima su ciò
   che trovano (il coperchio del barile, il piano del banco, la cornice della credenza, il capitello, il tetto della casetta).
2. **Lo stesso taglio in orizzontale** (letto, casetta, casa a graticcio): una riga nascosta lungo x o y, il piano scelto si espande con
   regole a una direzione (`symmetry="()"`) e porta via ciò che sta oltre.
3. **Il dado con alluvione** (barile, viandante, contadina, lupo, pozzo, colonna): le alternative si disegnano in lettere nascoste
   (anelli di una gonna, due teste, tre code, due tetti), un dado sceglie una lettera e la scelta si spande solo nella sua regione; il
   resto torna aria. Dove due alternative si sovrappongono serve una lettera per l'intersezione (il pozzo), altrimenti l'ultima disegnata
   ruba le celle all'altra e ne restano pezzi staccati.
4. **Cammini a caso** (rami del pino, della quercia e della betulla, rametti del cespuglio, spina del masso, fusto della palma): una punta
   nascosta avanza dentro una regione nascosta, in su o di lato con pesi diversi.
5. **Crescita a macchia** (rocce, cespugli, chiome): `one` con molti passi da semi scelti a caso, dentro una sagoma nascosta.
6. **Crescita dritta** (fronde della palma, tavole del cartello): `prl` con la cella dietro la punta nel pattern (`FfB → FFf`), così la
   punta va dritta e solo la lunghezza è a caso.

### I semi consecutivi e la mescola (`mescola.py`)

Il generatore del motore è mulberry32 (`src/kernel/rng.ts`) seminato con il numero del seme: per i semi 1..5 l'estrazione numero *k* dà
valori vicini (le prime: 0,63 0,73 0,72 0,92 0,69), e un dado tirato allo stesso punto del programma cade spesso dalla stessa parte per
semi vicini. Il banco di prima non se ne accorgeva perché provava un seme solo. Il rimedio, senza toccare il kernel: un preambolo che
consuma un numero di estrazioni **diverso per ogni seme**, una striscia nascosta in cima alla scatola cancellata a metà da un `prl` e
poi del tutto da un `all`, che mescola le corrispondenze rimaste e ne consuma tante quante sono:

```xml
<box at="10 0 59" size="20 2 1" color="0"/>
<prl in="0" out="B" p="0.5" steps="1"/>
<all in="0" out="B"/>
```

`python3 lab/banco/seme-procedurale/mescola.py <file.xml> X Y Z` lo aggiunge a un programma. Gli agenti dei props hanno usato varianti
(consumare un numero fisso di estrazioni prima del primo dado): funzionano sui semi 1..5, la mescola funziona anche per gli altri.
Una proposta per il kernel, fuori da questo cantiere: seminare il motore con `hash32(seed)` invece che con `seed`.

## Altre cose imparate

- `all` con l'uscita che riscrive anche la cella di partenza (`in="HB" out="HH"`) cresce di una cella per passo: le corrispondenze
  nelle quattro direzioni si contendono la cella H. Si scrive `out="*H"`.
- Una `box` o un `cylinder` di lato pari cade di una cella fuori centro (lato 14 a x=10 copre 4..17): ciò che deve toccare un altro pezzo va
  messo contro di lui o il banco trova un frammento.
- Una `line` con `r="0"` molto ripida ha dei buchi; `r="0.5"` no.
- Gli orti della fattoria originale erano isole a terra, staccate dal resto: ora un `path` di ghiaia li collega al sentiero.

## I modelli

| modello | nome | classe | media | minima | voxel per seme | ms (max) |
|---|---|---|---|---|---|---|
| [`edificio`](edificio.md) | Casetta | `edificio` | 0.408 | 0.139 | 7040 / 14480 / 14904 / 7488 / 11088 | 101 |
| [`fattoria`](fattoria.md) | Fattoria | `grande` | 0.557 | 0.251 | 27110 / 23249 / 23377 / 26891 / 23103 | 1686 |
| [`grande`](grande.md) | Casa a graticcio | `grande` | 0.347 | 0.006 | 33858 / 27918 / 30888 / 33858 / 40824 | 106 |
| [`albero`](albero.md) | Pino | `albero` | 0.520 | 0.406 | 5153 / 4484 / 5542 / 5298 / 5457 | 136 |
| [`quercia`](quercia.md) | Quercia | `albero` | 0.494 | 0.414 | 12389 / 12291 / 12260 / 12390 / 12191 | 162 |
| [`betulla`](betulla.md) | Betulla | `albero` | 0.667 | 0.523 | 4056 / 4106 / 4097 / 4130 / 4104 | 101 |
| [`palma`](palma.md) | Palma | `albero` | 0.959 | 0.881 | 586 / 425 / 777 / 917 / 421 | 84 |
| [`roccia`](roccia.md) | Masso | `roccia` | 0.482 | 0.405 | 1004 / 1006 / 1001 / 1003 / 966 | 10 |
| [`masso-muschioso`](masso-muschioso.md) | Masso muschioso | `roccia` | 0.345 | 0.301 | 956 / 979 / 1007 / 958 / 948 | 11 |
| [`sasso`](sasso.md) | Sasso | `sasso` | 0.634 | 0.384 | 131 / 131 / 94 / 105 / 113 | 1 |
| [`cespuglio`](cespuglio.md) | Cespuglio | `cespuglio` | 0.556 | 0.427 | 776 / 786 / 753 / 773 / 781 | 16 |
| [`cespuglio-con-bacche`](cespuglio-con-bacche.md) | Cespuglio con bacche | `cespuglio` | 0.600 | 0.512 | 889 / 956 / 791 / 815 / 894 | 8 |
| [`pozzo`](pozzo.md) | Pozzo | `edificio` | 0.271 | 0.008 | 11426 / 11944 / 11683 / 15705 / 11421 | 222 |
| [`monumento`](monumento.md) | Colonna | `monumento` | 0.187 | 0.113 | 4238 / 4586 / 4898 / 5174 / 5677 | 78 |
| [`cartello`](cartello.md) | Cartello | `mobile` | 0.664 | 0.477 | 147 / 217 / 295 / 267 / 273 | 6 |
| [`falo`](falo.md) | Falò | `mobile` | 0.596 | 0.530 | 221 / 220 / 245 / 193 / 210 | 5 |
| [`barile`](barile.md) | Barile | `mobile` | 0.244 | 0.062 | 1750 / 987 / 1423 / 1205 / 1641 | 11 |
| [`banco`](banco.md) | Banco da lavoro | `mobile` | 0.577 | 0.039 | 697 / 697 / 649 / 480 / 697 | 10 |
| [`credenza`](credenza.md) | Credenza | `mobile` | 0.301 | 0.102 | 2239 / 3154 / 2959 / 1795 / 3154 | 9 |
| [`letto`](letto.md) | Letto | `mobile` | 0.180 | 0.015 | 1130 / 1170 / 1127 / 1034 / 1548 | 9 |
| [`mobile`](mobile.md) | Cassa | `mobile` | 0.304 | 0.001 | 1852 / 2381 / 2787 / 1537 / 1852 | 17 |
| [`viandante`](viandante.md) | Viandante | `persona` | 0.195 | 0.000 | 2074 / 1957 / 2683 / 2564 / 2684 | 18 |
| [`contadina`](contadina.md) | Contadina | `persona` | 0.243 | 0.110 | 2153 / 2255 / 2560 / 2674 / 2828 | 24 |
| [`bestia`](bestia.md) | Lupo | `bestia` | 0.182 | 0.027 | 5400 / 5487 / 4466 / 5404 / 4485 | 53 |
