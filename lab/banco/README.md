# Il banco del prompt delle strutture (T154)

Il metodo è dell'autore: si scrive un prompt, lo si prova **senza altro contesto**, si guarda il risultato, si corregge
**il prompt e mai il risultato**, si riparte. Il banco fa la prova e misura; il ciclo è T155.

```bash
npx vite-node lab/scripts/banco-strutture.ts -- --bersagli moderna --giro v1           # un bersaglio; consuma l'abbonamento
npx vite-node lab/scripts/banco-strutture.ts -- --bersagli tutti --giro v2 --tentativi 2 [--modello sonnet] [--prompt altro.md]
npx vite-node lab/scripts/banco-strutture.ts -- --xml lab/banco/esempi/buono.xml --bersagli moderna  # solo le misure, senza chiamate
npx vite-node lab/scripts/banco-strutture.ts -- --bersagli tutti --giro conferma --tentativi 2 --dir lab/banco --insieme 3   # al più 3 insieme: la finestra delle 5 ore
npx vite-node lab/scripts/banco-strutture.ts -- --seconda --giro conferma --dir lab/banco --insieme 3   # la seconda richiesta (T173)
```

Ogni tentativo è una cartella che non si sovrascrive, `lab/out/banco/<giro>/<bersaglio>/<n>/` (`--dir` per un'altra radice):

| file | cosa |
|---|---|
| `prompt.md`, `bersaglio.txt` | tutto ciò che il modello ha ricevuto |
| `risposta.txt`, `modello.xml` | la risposta intera e il programma che se ne estrae |
| `lati.png` | fronte, destra, retro, sinistra e il fronte con un altro seme |
| `sezioni.png` | ogni piano tagliato poco sopra i piedi, dal davanti e dal retro |
| `pianta.png` | ogni piano dall'alto, il davanti in basso: verde dove sta il centro del corpo, blu più in alto (le scale), rosso la porta, giallo dove si atterra saltando |
| `misure.json` | token (`inputTotale` è ciò che il prompt deve abbassare), misure, voci della soglia, difetti |
| `giudizio.md` | i criteri qui sotto, da compilare da chi guarda le foto |

`riepilogo.md` nella cartella del giro dice una riga per tentativo.

**La prova.** `claude -p` da una cartella vuota, senza strumenti, MCP, hook, impostazioni né file del progetto, con l'ambiente ridotto: gli
stessi argomenti e la stessa conferma di isolamento della coda degli abbonamenti (`tools/abbonamenti/servi.ts`, ADR-0106). `--system-prompt`
sostituisce quello di Claude Code: il prompt è `prompt.md`, il messaggio è il bersaglio (`testoBersaglio`).

**Le misure** (`misure.ts`) girano con il codice del gioco, sulla scatola della classe (`withSize`, `modelSize`, `Forms.request`, `FORM_LIMITS`, `MODEL_TIME`). Se il modello ha un'azione
`apr…` la porta si misura aperta. Un corpo largo come il viandante (`BODY_R`) parte dal davanti e cammina a passi di un voxel con `rampBlocks` e `levelAt`, come `Kernel.free` e `floorAt`:
una scala larga un voxel, che `bodyGround` conta perché ragiona per colonne, per lui non c'è (`tests`: `scala-stretta.xml`). I salti rifanno `Kernel.jump` con `topUnder`. Le foto non fanno la trasparenza: un vetro con `alpha` vi appare pieno nel suo colore (nel gioco no, `meshVoxels`).

## La soglia

Passa chi soddisfa **tutte** le misure (`SOGLIA`, `giudica`) **e** i criteri scritti per chi guarda.

| misura | richiesto | come si conta |
|---|---|---|
| finisce, valido | entro 8 s, nessun errore | `runMjx` con i limiti del gioco; `analyse` di `src/mj/check.ts` con l'altezza minima della classe |
| piani | ≥ 2 | altezze con almeno (1,1 caselle)² di pavimento coperto dove il corpo arriva camminando (rampe, non salti), distanti almeno 0,7 caselle |
| testa | ≥ 1,5 caselle su ogni piano | altezza mediana fino al soffitto: una persona è alta 1,5 caselle |
| stanze | ≥ 3 | su ogni piano, i pezzi che restano chiudendo i passaggi più stretti di circa 1,2 caselle |
| cantina | ≥ 1,2 caselle², se il bersaglio ne ha una (T155) | pavimento sotto il suolo dove sta il centro del corpo; 0 se il kernel prende il modello senza cantina (`groundOfForm`: un solo pavimento irraggiungibile laggiù la annulla) |
| murato | ≤ 0,25 | pavimento coperto dove il corpo starebbe e non arriva, a pezzi grandi come un piano, sul pavimento coperto che raggiunge; fuori dalla cantina la terra è piena fino al suolo, come nel kernel (T155) |
| porta | sul davanti, scarto ≤ ⅓ della larghezza, alta ≥ 1,5, libera | dove un pavimento coperto grande quanto una stanza si apre verso `y` grande, con la strada dritta libera fino al bordo |
| salti | ≥ 2 | atterraggi separati, da un posto piano a uno piano, che salgono più di un gradino o attraversano un vuoto o un ostacolo; si atterra solo dove si arriva anche a piedi (`bodyGround` segna gli altri pavimenti come `block`): la cima di una cassa non conta, come nel gioco |
| materiali, dominante | ≥ 6, ≤ 60 % | lettere con almeno lo 0,2 % dei voxel; la più usata |
| finestre | ≥ 6 su ≥ 3 lati | visti da fuori: vetro (`alpha`, `glow`, o il nome), fori o nicchie nel piano principale, da 6 voxel a (1,5 caselle)², sopra i piedi |
| dettagli | ≥ 24, al più 1 lato vuoto | pezzi di una lettera da 2 voxel a una casella² sulle quattro facciate; vuoto un lato con meno di 3 |
| rumore | ≤ 0,7 | fra quei pezzi, i voxel isolati: puntini, non dettagli |
| sagoma | ≥ 4 | altezze della cima, ciascuna su almeno l'1,5 % della pianta |
| rilievo | ≥ 0,12 | parte delle facciate fuori dal loro piano principale |
| ingombro | ≥ 0,3 | parte della pianta della scatola occupata |

La soglia non si abbassa per far passare un prompt (T155).

### Cosa conta ora: entro due richieste (T173)

Misure e criteri sono gli stessi; cambia quante richieste ha un tentativo. Come nel gioco, dove l'invalido torna con il motivo all'agente (regola 2 di `AGENTS.md`), un tentativo che non passa riceve una seconda richiesta, con lo stesso prompt. Passa il giro se **tutti i 14 tentativi passano misure e foto entro due richieste, nello stesso giro**.

`--seconda` guarda ogni tentativo del giro e scrive in `<n>/seconda/` (`richiesta.txt` è il messaggio intero, `seconda.ts` lo compone):

- misure che non passano: tornano il suo XML, i difetti con il loro significato, i piani raggiunti, dove sta il pavimento non raggiunto, la porta; le foto no;
- misure che passano, foto no: tornano il suo XML e i problemi scritti da chi giudica, in `<n>/problemi.md`;
- tutto passa: non torna. Si riprende da dove ci si è fermati: un tentativo con `seconda/misure.json` non si rifà.

Una terza richiesta non c'è.

## La traccia (T179)

`--seconda --traccia [--tetto 4000]` mette nella seconda richiesta anche cosa ha fatto il programma, nodo per nodo, in testo: `traccia.md` dice le forme, i numeri e la scelta; da sola con `lab/scripts/mjx-trace.ts`. Le foto restano per il risultato finale. Senza il flag la richiesta è quella di T173.

## Ciò che non si misura

<!-- criteri -->
Ogni criterio vale «sì» solo se si vede nelle foto; per passare servono tutti «sì» e al più un «in parte».

1. **Si riconosce**: dalle foto dei lati, senza leggere il nome, si dice che edificio è e in che stile (moderno, steampunk, futuristico…).
2. **Regge**: masse e proporzioni da edificio vero, non una scatola con pezzi appiccicati; nessuna parte che galleggia, buca un'altra o è tagliata dalla scatola.
3. **I quattro lati**: anche i lati e il retro sono lavorati; nessuno è il fondo di una scena.
4. **Tetto e sagoma**: il tetto ha una forma pensata, coerente con lo stile, che si legge dall'alto (nel gioco la camera è in 3/4).
5. **Dentro ha un senso** (`sezioni.png`, `pianta.png`): le stanze sono quelle chieste e arredate, la scala sta dove serve, non chiude una stanza e non sbuca in un muro.
6. **I colori**: tavolozza coerente, materiali distinti che si leggono alla scala del gioco; niente rumore al posto dei dettagli.
7. **I salti hanno un motivo**: ciò che si scavalca o si attraversa è una cosa del luogo (casse, banchi, tubi, ballatoi), non un cubo messo lì.
8. **Il dettaglio è all'altezza**: si guarderebbe volentieri accanto ai modelli del gioco, ricco e non solo pieno di pezzi.
<!-- /criteri -->

## I bersagli

In `bersagli.ts`: `moderna`, `steampunk`, `futuristica`, `locanda` (con la cantina), `tempio`, `rocca` (Enorme, 120 × 120 × 96 a 16 voxel per casella), `pagoda`.

## Gli esempi

`esempi/buono.xml` (scritto a mano, passa le misure), `esempi/scala-stretta.xml` (lo stesso con la scala larga 4 voxel), `esempi/brutto.xml` (una scatola): li usa
`lab/tests/banco.test.ts`, insieme a un giro dentro il kernel vero. Il primo giudizio è in `prima-prova/`.

## Il ciclo (T155)

`diario.md` dice ogni giro; `finale/` tiene i modelli, le foto, le misure e il giudizio dell'ultimo giro completo, anche i tentativi falliti. La soglia di T155 non è raggiunta: `docs/pipeline/domande/T155.md`.

## Il giro di conferma (T173)

`conferma/` tiene i 14 tentativi con le seconde richieste e `giudizio.md`. **12 su 14**: la soglia non è raggiunta, `docs/pipeline/domande/T173.md`.
