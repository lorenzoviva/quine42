# Catalogo delle strutture 3D procedurali (Cantiere 1)

Ventiquattro programmi MarkovJunior di strutture (`classe` grande, «struttura grande»), sei per ognuna delle quattro ambientazioni, metà con la
cantina (`suolo="E"`, `ground="Z"`, `sotto: 1`, ADR-0135). Ogni programma serve **due taglie** (Grande 100×100×80, 20 voxel per casella;
Enorme 120×120×96, 16 voxel per casella; con la cantina 100 e 112 di altezza) e **cinque semi**, e a ogni seme è un altro edificio. Nessun
modello è stato chiamato: i programmi sono scritti a mano con il metodo di [`../pattern.md`](../pattern.md) e misurati con il corpo del gioco.

Per ogni ambientazione: una locanda/taverna con cantina, un tempio/santuario/cattedrale, una torre/faro/osservatorio con sotterraneo, una
fucina/officina/laboratorio con cantina, una palazzina/residenza a due piani, un forte/stazione/mercato coperto.

## Esito

{{TABELLA}}

Le colonne: **semi G / E** quanti dei 5 semi passano tutte le misure di `../misure.ts` (`giudica`) a Grande e a Enorme; **ms max** il tempo più
lungo dei 5 semi (il tetto di questo cantiere è **4500 ms a Enorme**, quello del gioco 8000); le quote di varianza sono le mediane delle coppie di
semi (`../varianza.ts`, soglie: voxel ≥ 0,20, pianta ≥ 0,15, perimetro ≥ 0,15, interno ≥ 0,35, architetture ≥ 3 su 5). Ogni rapporto
(`<ambientazione>/<nome>.md`) ha la tabella delle misure per seme e per taglia, la varianza, il foglio di contatto (`<nome>.png`) e la traccia del
seme 1 (`src/mj/trace.ts`, forma «differenze»).

Cosa vuol dire «passa», misura per misura: tutti i piani coperti raggiunti a piedi dalla porta (2 piani, ≥ 3 stanze, testa ≥ 1,5 caselle, `murato`
≤ 0,25: nessun pavimento coperto che il corpo non raggiunge), la porta libera sul davanti, la cantina raggiunta (≥ 1,2 caselle²), nessun voxel
staccato (`valido`: i controlli di `src/mj/check.ts` con `grounded`), il programma finito, ≥ 2 salti, ≥ 6 finestre su ≥ 3 lati, ≥ 6 materiali e
il più usato ≤ 60 %, ≥ 24 dettagli, ≥ 4 altezze della cima, ≥ 12 % di rilievo, ≥ 30 % di ingombro; più la varianza alle due taglie.

## Il collo di bottiglia: perché la cantina a Enorme costava 7 s e qui ne costa 2,5

Il riferimento `../riferimento/cantina.xml` girava in **7,0-7,6 s** a Enorme (e cadeva a 8,2 s su un seme); `../riferimento/cantiere.xml`, senza
cantina, in 5 s. Misurato nodo per nodo (`valida.ts --profilo`, un motore con il cronometro su ogni foglia, tentativi falliti compresi):

| dove | costo prima | perché | rimedio | dopo |
|---|---|---|---|---|
| la scala che scende in cantina (`mN****** … **BBBBBB`) | 830-880 ms | 4 varianti di un pattern 8×1×4 la cui prima cella è `*` e la riga sotto aria: ~25 celle controllate per posizione su 1,6 milioni | la riga sotto è il vuoto del pozzo, `l`, che si toglie **dopo** la scala: la scansione si ferma alla terza cella | 90 ms |
| le colonne (16 nodi `all steps="N"`, «la testa sale») | 2,0 s | ogni passo riscrive tutte le teste (~12 000 celle) e ognuna si riconfronta con tutte le regole del nodo: milioni di operazioni sull'insieme delle corrispondenze | una regola alta per lettera, tutta la colonna in un passo (`steps="1"`, pattern 5): nessun lavoro incrementale | 130 ms |
| i nodi del progetto (~60) | 1,5-2 s | ogni variante di ogni pattern scandisce tutti i 112 strati, ma il progetto sta su uno | **imbottitura**: sopra il pattern 79 strati di `*` (fino a 1728 celle): il pattern entra solo alle quote fra il fondo e il suolo, 33 strati su 112 a Enorme, 21 su 100 a Grande, 1 su 80 senza cantina | ÷3-5 |
| gli angoli `*` dei pattern grandi del progetto | ~400 ms | `*` passa ovunque, la scansione continua | `9`, unione di tutte le lettere tranne l'aria: nel progetto non c'è aria, sopra c'è solo aria, quindi fallisce alla prima cella | ÷2 |
| riempimenti e camminatori `all` | ~1 ms a passo | `all` alloca un buffer di tutta la griglia a ogni passo | `prl` (stesse celle: ogni corrispondenza scrive la stessa lettera) | ÷1,5 |
| la pulizia (14 regole) e due nodi che non scattano mai | 350 ms | una scansione per regola; un nodo che non trova nulla conta le lettere di tutta la griglia | regole accorpate per uscita (`[UwXJjM] → C`), tolti `tHb`/`tb` | 150 ms |

Il risultato: la cantina a Enorme in **2,0-2,4 s**, la base senza cantina in **1,0-1,2 s**, con ~1,5 s di margine per i moduli di stile. Le prime
due voci cambiano il programma (e quindi l'edificio di un seme), le altre no: `valida.ts --ottimizza` applica colonne, `9` e imbottitura e
**confronta le griglie cella per cella** su ogni seme e taglia prima e dopo l'imbottitura (sempre uguali: `steps="1"` solo ai nodi che fanno un
passo, imbottitura solo a quelli che scrivono poche celle per passo, perché ogni cella scritta si riconfronta con ogni posizione del pattern).
La regola generale, per chi scrive un programma: **il costo è la somma, su ogni nodo, delle varianti dei suoi pattern per le posizioni in cui il
pattern entra, più le celle scritte per le posizioni del pattern nei nodi che fanno molti passi**. Un nodo da 1 variante costa ~10 ms a Enorme;
uno da 8 varianti con un angolo `*` 100-180 ms.

## Come è fatto

- `scheletri/cantina.xml` e `scheletri/piano.xml`: lo scheletro del prompt con e senza la cantina, nella forma leggibile, con i punti d'innesto
  `@progetto` (arredi contro un muro pieno, prima che la scala restituisca le campate), `@facciate` (sui muri, prima delle finestre), `@tetto`
  (dopo le finestre), `@colori`, `@pulizia`.
- `catalogo.ts`: i moduli (falde, padiglione, merli, torre, cuspide, feritoie, ciminiere, tubi, piastre, travi, fascia, anello, pannelli,
  antenne, le finestre ad arco, bifora, a nastro, a occhio) e le 24 strutture: materiali, moduli, finestra. Scrive `sorgenti/<ambientazione>/<nome>.xml`.
  I moduli usano solo le lettere che lo scheletro non usa più dopo le colonne (`r g v n q O P t b s c d e f y H I`) e partono da una lettera rara.
- `ottimizza.ts`: le trasformazioni che tengono il significato (colonne alte, `9`, imbottitura); `valida.ts --ottimizza` le applica e confronta.
- `valida.ts`: la prova (`prova` di `../varianza.ts` su 5 semi, Grande ed Enorme), il rapporto, il foglio di contatto, `--profilo`, `--indice`.

```bash
npx vite-node lab/banco/catalogo-cloud/catalogo.ts -- locanda                                    # sorgenti/fantasy/locanda.xml
npx vite-node lab/banco/catalogo-cloud/valida.ts -- --ottimizza lab/banco/catalogo-cloud/sorgenti/fantasy/locanda.xml lab/banco/catalogo-cloud/fantasy/locanda.xml
npx vite-node lab/banco/catalogo-cloud/valida.ts -- fantasy/locanda.xml                          # fantasy/locanda.md, .png, .json
npx vite-node lab/banco/catalogo-cloud/valida.ts -- --profilo lab/banco/catalogo-cloud/fantasy/locanda.xml --taglia enorme
npx vite-node lab/banco/catalogo-cloud/valida.ts -- --indice                                     # questo README
```

I tempi sono misurati su una macchina a 4 core con fino a tre prove in parallelo: da soli sono più bassi del 10-30 %.

## Ciò che non è provato

Nessuno di questi programmi è stato provato dentro il gioco: lo Scultore non passa ancora `base` a `checkProgram` e `withSize` scrive la scatola
senza la cantina (ADR-0135, «Conseguenze»: serve T156). I giudizi estetici (lo stile si riconosce? la torre è una torre?) sono dell'autore, sui
fogli di contatto; le misure dicono che si entra, si sale, si scende, che nulla è murato o staccato e che i semi danno edifici diversi.
