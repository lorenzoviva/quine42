# Il banco del prompt delle strutture (T154)

Il metodo è dell'autore: si scrive un prompt, lo si prova **senza altro contesto**, si guarda il risultato, si corregge
**il prompt e mai il risultato**, si riparte. Il banco fa la prova e misura; il ciclo è T155.

```bash
npx vite-node lab/scripts/banco-strutture.ts -- --bersagli moderna --giro v1           # un bersaglio; consuma l'abbonamento
npx vite-node lab/scripts/banco-strutture.ts -- --bersagli tutti --giro v2 --tentativi 2 [--modello sonnet] [--prompt altro.md]
npx vite-node lab/scripts/banco-strutture.ts -- --xml lab/banco/esempi/buono.xml --bersagli moderna  # solo le misure, senza chiamate
npx vite-node lab/scripts/banco-strutture.ts -- --bersagli tutti --giro conferma --tentativi 2 --dir lab/banco --insieme 3   # al più 3 insieme: la finestra delle 5 ore
npx vite-node lab/scripts/banco-strutture.ts -- --seconda --giro conferma --dir lab/banco --insieme 3   # la seconda richiesta (T173)
npx vite-node lab/scripts/banco-strutture.ts -- --xml modello.xml --bersagli rocca --varianza   # anche più semi e più taglie (T180)
npx vite-node lab/scripts/banco-varianza.ts -- --xml modello.xml --bersagli rocca [--taglie enorme,gargantuesca] [--semi 5]   # solo quelli: tabella e foglio di contatto
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
| `varianza.json`, `semi.png` | con `--varianza`: ogni seme a ogni taglia, le quote, il foglio di contatto (T180) |

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

## Il suono (T223)

`suono.md` dice come leggere un programma sonoro senza orecchie: `lab/scripts/mjx-sound.ts` ne dà WAV, traccia e rapporto.

## La traccia (T179)

`--seconda --traccia [--tetto 4000]` mette nella seconda richiesta anche cosa ha fatto il programma, nodo per nodo, in testo: `traccia.md` dice le forme, i numeri e la scelta; da sola con `lab/scripts/mjx-trace.ts`. Le foto restano per il risultato finale. Senza il flag la richiesta è quella di T173.

## I pattern e i programmi di riferimento (T181)

Il contrario dei modelli di `finale/` e `conferma/`: `pattern.md` dice con quali pattern di MarkovJunior (letti nei programmi del repository) un edificio **cresce** invece di essere disegnato, e `riferimento/` tiene tre programmi scritti a mano con il metodo del cantiere (`palazzina.xml`, `forte.xml`, `tempio.xml`), con i fogli di contatto e `riferimento/README.md` per i numeri; `lab/tests/riferimento.test.ts` li fa girare nel banco.

**Fauna, flora, veicoli e monumenti** (Cantiere 8): `fauna-biomi-cloud/` tiene sessanta programmi che non sono edifici (creature, veicoli, alberi, formazioni, rovine), cinque per ambientazione in tre collezioni, ognuno con scelte iniziali a caso; il metodo (la scelta a caso in una regione, la mescola dei primi numeri del generatore, i vuoti che si disegnano per primi) è in `fauna-biomi-cloud/metodo.md`, l'indice con le misure in `fauna-biomi-cloud/README.md`.

## Il prompt procedurale (T182)

`prompt.md` contiene lo scheletro `riferimento/cantiere.xml` e chiede di partire da lì. Con `--varianza` un tentativo passa solo se regge a ogni seme e taglia **e** varia (`prova`, `passa` di `misure.json`): i difetti dicono taglia e seme, e `--seconda --traccia --varianza` li riporta con la traccia della prima coppia che cade (`caduta`). Giri in `diario.md`, fogli e modelli in `procedurale/`.

## Su Gemini (T156)

`--provider agy [--modello gemini-3.8-flash-high]` fa la stessa prova su Gemini con `agy -p` (`agy.ts`): da una cartella vuota, nella sua sandbox, prompt e bersaglio in un messaggio solo (agy non ha un prompt di sistema da sostituire; oltre 30 000 caratteri il messaggio va in un file della cartella). Antigravity non esclude i suoi strumenti: per questo non serve mai la coda (ADR-0106), e qui va bene solo perché il prompt è quello fidato del banco. I token sono quelli che agy scrive alla fine: il suo prompt di sistema ne conta circa 10 800 a ogni chiamata, il ragionamento è nell'output (Gemini lo fattura così), i dollari sono a listino (`prices.ts`). Il giro è in `gemini/`, con `gemini/giudizio.md`; il gioco con le stesse idee, `gemini/browser/`. I primi edifici veri che reggono e variano (`gemini/futuristica/1`, `gemini/rocca/1/seconda`) passano la soglia di varianza proposta qui sotto e nel foglio sono edifici diversi dello stesso genere: la proposta resta com'è.

## Varianza e scala (T180)

Il banco qui sopra prova un seme in una scatola: premia i modelli statici. `varianza.ts` prova lo stesso programma con **almeno 5 semi** in **almeno 2 taglie** (`prova`; se nessuno le dice, `taglieDiProva`: quella del bersaglio e la successiva). Niente modelli, solo il motore. Il giudizio è in due parti, separate:

- **regge**: tutte le misure della soglia qui sopra (`giudica`, quindi piani, stanze, rampe, porta, `FORM_LIMITS`, `MODEL_TIME`) passano **a ogni seme e a ogni taglia**, e il programma usa la scatola di quella taglia (`scatola`: chi scrive una `size` sua con `map` non cresce). Una taglia cambia scatola e corpo insieme: a Enorme un gradino è 3 voxel, a Gargantuesca 2.
- **varia**: le mediane delle coppie di semi, a ogni taglia, passano la soglia proposta (`SOGLIA_VARIANZA`):

| misura | proposta | come si conta |
|---|---|---|
| statico | voxel < 0,01 | sotto, il programma è statico, qualunque cosa facciano i colori e qualche puntino |
| voxel | ≥ 0,20 | voxel pieni in un seme solo, su quelli pieni in almeno uno: **solo la forma** |
| colore | non conta | fra i voxel pieni in entrambi, quelli di un'altra lettera: si scrive e non vale |
| pianta | ≥ 0,15 | colonne occupate sopra i piedi in un seme solo, su quelle occupate in almeno uno |
| perimetro | ≥ 0,15, classe `grande` | parte del bordo esterno più lontana di mezza casella dal bordo dell'altro seme; lo tocca l'aria che viene da fuori: un cortile non è perimetro |
| interno | ≥ 0,35 | pavimento coperto raggiunto dal corpo in un seme solo, su quello raggiunto in almeno uno |
| piani e stanze | ≥ 2 liste diverse | fra i semi, liste diverse di quote dei piani o di stanze per piano |
| architetture | ≥ 3 su 5 | semi che sono un altro edificio da tutti quelli contati prima: voxel e, insieme, pianta o interno oltre la soglia |

**Da dove vengono i numeri**: dai programmi del seme, oltre che dagli XML di prova: `circuito-3D` cambia il 76 % delle lettere e 0 voxel (statico); `edificio` il 6 % delle lettere e 0 voxel (statico); `fattoria`, voxel 0,32, pianta 0,09, perimetro 0,01, interno 0,25, è la stessa casa ritoccata e nel foglio si vede: la soglia è sopra di lei, e 0,32 di voxel da solo non basta; `grande`, voxel 0,34, pianta 0,10, perimetro 0, idem; `esempi/variabile.xml`, voxel 0,93, pianta 0,86, perimetro 0,47, interno 0,93, è un altro complesso a ogni seme. **È una proposta**: fra 0,09 e 0,86 di pianta non c'è ancora nessun edificio vero, che regga e vari insieme; quando T156 ne avrà uno si guarda il foglio e si corregge il numero, dicendolo qui. Una volta fissata, non si abbassa per far passare un prompt.

**La misura di partenza**, `varianza/riepilogo.md` (tutti i programmi di `finale` e `conferma`, 5 semi, tre taglie): **l'osservazione dell'autore è esatta. 31 programmi su 31 che girano sono statici**: voxel 0, colore 0, pianta 0, perimetro 0, interno 0, una architettura su 5 semi (altri 2 su 33 il gioco li rifiuta). Sono fatti di sole `<box>`: è ciò che il prompt insegna. E non scalano: dei 27 scritti per Grande che girano, alla loro taglia ne reggono 25, a **Enorme** 2, a **Gargantuesca** 1 (`conferma/futuristica/1/seconda`, l'unico che regge alle tre); le 4 rocche, scritte per Enorme, a Gargantuesca 0. Cadono `piani` e `murato`: la scala con gradini da 4 voxel non si sale più con un gradino da 3 o da 2.

**Il costo in tempo**: 368 ms a esecuzione misurata, in media, sulle scatole di sole `<box>` (massimo 670 ms), su un processo solo mentre altri lavoravano. Con 5 semi e 2 taglie sono 10 esecuzioni: **circa 4 s a programma contro 0,4 s di oggi**, un minuto scarso su un giro di 14 tentativi, nessun costo in token. Un programma a regole costa di più: 0,8 s a esecuzione `variabile.xml`, 1,4 s `fattoria`, 7 s `circuito-3D` (`MODEL_TIME` resta il limite di ognuna): una quindicina di s a programma per gli edifici a regole, e oltre per chi sta vicino al limite.

### Il foglio di contatto

`semi.png` (o `<nome>.png` di `banco-varianza.ts`) è **un solo PNG a basso costo** al posto di quattro foto per seme: una riga per taglia, un modello per seme da sinistra, in 3/4 dal davanti; sotto la prima taglia la pianta del piano terra di ogni seme, con i colori di `pianta.png`. Esempi in `varianza/`: `conferma-rocca-1.png` (statica: cinque volte la stessa; tagliata a Grande), `fattoria-moderna.png` (la stessa casa ritoccata), `variabile-moderna.png` (masse diverse, non è un edificio).

<!-- criteri-semi -->
Ogni criterio vale «sì» solo se si vede nel foglio; per passare servono tutti «sì». I criteri delle foto di ogni seme restano quelli qui sotto: chi passa il foglio si guarda da vicino in un seme solo, poi nel peggiore.

1. **Altri edifici**: coperti i colori, i cinque semi di una riga non sembrano lo stesso edificio ritoccato: masse, tetto e pianta cambiano, non solo gli arredi, la vegetazione o le tinte.
2. **La stessa cosa**: nomi e stile tengono: sono cinque rocche, non una rocca e quattro cumuli; nessun seme è il brutto della famiglia.
3. **Il perimetro**: negli edifici grandi il contorno esterno cambia da seme a seme, non solo ciò che sta dentro.
4. **Le piante**: le stanze e il cammino verde cambiano; nessuna pianta ha pezzi murati, staccati o non raggiunti che le altre non hanno.
5. **La scala**: da una riga all'altra è lo stesso programma più grande, che riempie la sua scatola; non lo stesso edificio in un angolo, né tagliato dal bordo.
<!-- /criteri-semi -->

### Cosa fa oggi il gioco con due taglie

Provato sulla libreria vera (`Forms`, `modelSize`, `withSize`). **Oggi un programma non serve due taglie, e i semi di una struttura non si vedono.** Il banco misura ciò che il gioco dovrebbe fare; non lo corregge T180, lo farà T156:

1. **Il seme di una struttura è sempre 1**: `SEEDS` in `forms.ts` dà un seme solo a `grande` ed `edificio`, `seedFor` restituisce sempre 1 (`lotsOf`, `kernel.ts`). Un programma che varia, oggi, nel mondo si vedrebbe in una forma sola.
2. **L'id non ha la taglia**: `struttura-<concetto>` (`lotsOf`). «Un forte» Enorme e «un forte» Gargantuesco sono lo stesso id; il `ModelDirector` scolpisce il primo (`lacks`) e il secondo veste quello, alla taglia del primo: `struttura.taglia` non arriva a `FormComp` né alla forma.
3. **`ModelInfo.taglia` è una per voce**: due taglie vogliono due voci, o la taglia sull'istanza e nella chiave delle forme (`model#seed#tinta#hash`).
4. **Due voci con lo stesso XML scolpito non bastano**: lo Scultore scrive la scatola nella radice (`withSize`, `sculpt`) e `sizeFor` obbedisce alla `size` del programma: cambia `vpt`, non la griglia. Una voce con l'XML senza `size` sì. Il banco riscrive ogni volta la radice con la scatola della taglia: per questo vede ciò che il gioco oggi non fa. Chi usa `map` tiene comunque la sua (`withSize`, `scales`).
5. **Enorme e Gargantuesca hanno la stessa griglia**: 120 × 120 × 96, per `MAX_SIDE` (`densityOf`); cambia solo la densità, 16 e 12 voxel per casella, cioè 7,5 × 7,5 × 6 e 10 × 10 × 8 caselle. In voxel non c'è **nessuna area di generazione diversa**: l'idea dell'autore del forte enorme e gargantuesco che differiscono nell'area c'è in caselle, non nella griglia; un dettaglio a Gargantuesca è più grosso a vista. Da decidere con T156: si tiene il tetto di 120 per le strutture rare, o si alza?
6. **Il programma non conosce la scatola**: `<box>` ha coordinate assolute e il linguaggio non ha espressioni; ciò che si adatta sono i nodi a regole (`all`, `prl`, `one`, `markov`), che il prompt di oggi non insegna (le regole `prl`/`all` le ha tolte il giro g05). E `checkProgram` prova una taglia e un seme: T156 deve provarne di più, o il banco promuove ciò che lo Scultore non controlla.

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

In `bersagli.ts`: `moderna`, `steampunk`, `futuristica`, `locanda` (con la cantina), `tempio`, `rocca` (Enorme, 120 × 120 × 96 a 16 voxel per casella), `pagoda`; da T337 `castello` (Enorme), `palazzina` e `villetta`.

## Varianza tra concetti e metodo a zone (T337)

`metodo/README.md`: perché gli edifici dello Scultore sembrano tutti lo stesso (misura tra concetti e tra semi, `concetti.ts`: col prompt di oggi due concetti distano quanto due semi, e il 78-92 % di ogni programma è lo scheletro), il metodo provato (la composizione per concetto su una griglia a 1/4, `metodo/prompt-zone.md`) e il ritorno in testo dopo ogni blocco (`blocchi.ts`, `viste.ts`; `lab/scripts/banco-blocchi.ts`, `banco-ritorno.ts`, `banco-concetti.ts`, `banco-rimisura.ts`). **La porta**: dal contratto 0.5 l'azione si chiama `open`; `esegui` la apriva solo con `apr…`, e un giro col prompt di oggi risultava tutto chiuso (corretto, T337).

## Gli esempi

`esempi/buono.xml` (scritto a mano, passa le misure ma è statico), `esempi/scala-stretta.xml` (lo stesso con la scala larga 4 voxel), `esempi/brutto.xml` (una scatola), `esempi/variabile.xml` (varia e non è un edificio, T180): li usa
`lab/tests/banco.test.ts`, insieme a un giro dentro il kernel vero. Il primo giudizio è in `prima-prova/`.

## Il ciclo (T155)

`diario.md` dice ogni giro; `finale/` tiene i modelli, le foto, le misure e il giudizio dell'ultimo giro completo, anche i tentativi falliti. La soglia di T155 non è raggiunta: `docs/pipeline/domande/T155.md`.

## Il giro di conferma (T173)

`conferma/` tiene i 14 tentativi con le seconde richieste e `giudizio.md`. **12 su 14**: la soglia non è raggiunta, `docs/pipeline/domande/T173.md`.
