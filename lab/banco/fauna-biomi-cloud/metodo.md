# Il metodo del Cantiere 8

Sessanta programmi MarkovJunior 3D che non sono un modello solo ridisegnato: ogni seme fa **scelte iniziali diverse** e il modello che
ne esce ha un'altra postura, altri rami, altre proporzioni. I programmi stanno in `<collezione>/<ambientazione>/<nome>.xml`; il loro
sorgente (che li scrive tutti con gli stessi pochi pattern) è in `creature-veicoli.ts`, `flora-geologia.ts`, `monumenti-rovine.ts`, con gli
attrezzi in `attrezzi.ts`. `scolpisci.ts` riscrive gli XML, `banco.ts` li misura.

```bash
npx vite-node lab/banco/fauna-biomi-cloud/scolpisci.ts [-- nome …]   # riscrive gli XML dal sorgente
npx vite-node lab/banco/fauna-biomi-cloud/banco.ts [-- nome …]       # validatore, 5 semi, rapporti, fogli di contatto, indice
npx vite-node lab/banco/fauna-biomi-cloud/fluttuanti.ts -- <file.xml> <classe>   # dove sono i pezzi staccati, seme per seme
```

## I pattern

### 1. La scelta a caso (`scelta` in `attrezzi.ts`)

Il pattern che dà la varianza grande: una parte del modello (le zampe, il collo, la chioma, la cupola) ha due-sei **opzioni** e ogni seme
ne prende una. In MarkovJunior puro, senza coordinate decise dal seme:

```xml
<box at="12 20 0" size="19 38 15" color="u" on="B"/>          <!-- la regione delle opzioni: solo l'aria diventa u -->
<one steps="1"><rule in="u" out="1"/><rule in="u" out="2"/><rule in="u" out="3"/></one>   <!-- una cella, una regola a caso -->
<all symmetry="(xyz)"><rule in="1u" out="*1"/><rule in="2u" out="*2"/><rule in="3u" out="*3"/></all>   <!-- la scelta invade la regione -->
<cylinder at="8 12 0" size="3 3 14" color="G" on="1"/>        <!-- le forme dell'opzione 1 dipingono solo se la regione è 1 -->
<line at="8 32 0" to="8 28 13" r="1" color="G" on="2"/>       <!-- quelle dell'opzione 2 solo se è 2 -->
<prl><rule in="u" out="B"/><rule in="1" out="B"/>…</prl>        <!-- la regione torna aria -->
```

Ogni regola di `one` corrisponde a tutte le celle `u`, quindi le opzioni sono equiprobabili (con la mescola qui sotto). Il riempimento è un `all` con la simmetria di
tutto il cubo (la radice ha `(xy)`: senza, invaderebbe un solo piano). Costa quanto la regione, non la griglia: per questo la regione è una
scatola che contiene solo le forme delle opzioni (sull'intera griglia di un edificio, 50³, una scelta costava 450 ms; nella sua regione
40-150 ms). Le forme dipingono solo l'aria (`on="k"`): ciò che è già stato costruito resta, e una parte nuova si attacca a quella vecchia
sovrapponendosi di almeno un voxel. Più scelte indipendenti in fila danno il prodotto delle combinazioni (il cervo: 3 × 3 × 4).

### 1b. La mescola (i semi vicini)

Il generatore del motore (`Rng` di `src/kernel/rng.ts`, mulberry32) dà numeri imparentati a semi vicini alla stessa estrazione: la prima
estrazione dei semi 1-5 è 0,63 0,73 0,72 0,92 0,69, la seconda 0,00 0,32 0,04 0,33 0,77 (i semi 1 e 3, 2 e 4 si somigliano). Su 200 semi la
distribuzione è uniforme, ma sui semi che un banco prova la prima scelta di un programma cadeva quasi sempre sulle ultime opzioni (quattro
semi su cinque sullo stesso furgone). Ogni programma comincia quindi con una **mescola**: otto celle nascoste che `one` cancella una per
passo, otto estrazioni consumate. La nona è la prima che, per i semi 1-15 e da due a cinque opzioni, non mette mai la maggior parte dei semi
sulla stessa opzione (misurato provando tutti i valori da 0 a 300). Il motore non si tocca: è una riga in testa al programma.

```xml
<box at="3 0 0" size="7 1 1" color="z" on="B"/>
<box at="0 1 0" size="1 1 1" color="z" on="B"/>
<one in="z" out="B" steps="8"/>
```

### 2. I camminatori (`ramifica`, e le code e le orecchie)

Una punta (`P`) avanza lasciando una scia: sale (`in="B P" out="P A"`), va di sbieco (`in="B* *P" out="P* *A"`) o si biforca
(`in="B*B *P*" out="P*P *A*"`), con pesi diversi su `one`; il numero di passi è fisso, la forma no. Palchi, corna, il fumo della locomotiva, le
code dei cani e dei gatti (che crescono anche in orizzontale), i rami degli alberi.

### 3. Le punte sulla faccia alta (`punte`)

`<one in="B X" out="P *" steps="n"/>` sceglie `n` celle a caso sulla faccia che guarda il cielo di un materiale; ognuna cresce in alto o di
sbieco con un `all` (ogni punta prende una regola a caso). Spine, cristalli, comignoli, valvole.

### 4. Le macchie (`macchie`, `sopra`)

`prl` con una probabilità sulle facce laterali (`in="BX" out="*Y"`: rune, rivetti, adesivi) o su quelle in alto (`in="B X" out="* Y"`:
muschio, neve, ruggine), e chiazze che si allargano (`prl in="DF" out="*D" p="0.35" steps="3"`). Cambiano soprattutto il colore, che il
banco non conta come varianza.

## Le misure

Il banco (`banco.ts`) prova ogni programma come il gioco: la scatola della sua classe (`boxOf` di `src/mj/classes.ts`, scritta nel
programma con `withSize`), il validatore del gioco (`modelErrors` di `src/kernel/validator.ts`, che compila, esegue il seme 1 e
analizza), poi cinque semi (1-5) con l'analisi di `src/mj/check.ts` (tocca terra, nessun pezzo staccato, l'altezza minima della classe).

- **Voxel fluttuanti**: i voxel visibili fuori dal pezzo più grande (26-connesso), al seme peggiore. Devono essere 0, e non solo sui cinque
  semi della distanza: errori e pezzi staccati si cercano sui **semi 1-20**, perché le combinazioni delle scelte sono molte più di cinque
  e un attacco sbagliato si vede solo in una (le borse laterali della moto da turismo staccate dalla sella, una scala del ponteggio a un
  voxel dalla platea).
- **Distanza fra i semi**: per ogni coppia di semi, i voxel pieni in uno e vuoti nell'altro su quelli pieni in almeno uno (la misura
  `voxel` di `lab/banco/varianza.ts`); la media delle dieci coppie deve essere ≥ 0,15. Il colore non conta.
- **Tempo**: il seme più lento sotto 1500 ms.

La distanza minima è nel rapporto: con quattro opzioni e cinque semi due semi possono cadere sulla stessa combinazione e differire
solo per ciò che cresce a caso.

## Le classi

| classe | scatola (voxel) | chi |
|---|---|---|
| `animale` | 15 × 20 × 15 | cane, gatto |
| `persona` | 20 × 15 × 30 | golem, automa |
| `bestia` | 25 × 40 × 30 | quadrupedi, ragno, locomotiva, furgone, moto, rover… |
| `albero` | 40 × 40 × 60 | alberi, funghi, coralli |
| `monumento` | 20 × 20 × 60 | colonne, statue, tralicci, monoliti |
| `edificio` | 50 × 50 × 50 | drago, dirigibile, elicottero, formazioni, ponti, rovine |

La classe `grande` (100 × 100 × 80) non si usa: otto volte i voxel di un edificio, e le scelte a caso costerebbero oltre il tempo.

## Tre cose imparate

- **L'ordine delle forme in un'opzione conta**: ognuna dipinge solo le celle ancora libere (`on="k"`), quindi il dettaglio interno va
  prima del volume che lo contiene (la terra prima del bordo di cemento dell'aiuola, gli occhi prima della testa del ragno), e uno scavo
  (`color="B" on="W"`) lascia aria, non la lettera della scelta: ciò che deve attraversarlo si disegna prima.
- **Una linea di raggio 0 non diagonale** è continua; **in diagonale ha buchi** (il motore dipinge le celle entro mezzo voxel dai punti
  campionati): i fili diagonali hanno raggio 0,5.
- **I massi accanto a ciò che c'è**: dei semi a caso sul terreno fanno sassi staccati; il seme nasce accanto alla roccia (`in="Rg"`) e il
  mucchio resta un pezzo solo.
