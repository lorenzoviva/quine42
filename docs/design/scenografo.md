# Lo Scenografo: gli interni separati dall'edificio (T259)

Decisione dell'autore del 04/11 (`docs/pipeline/domande/T182.md`, domanda 2, opzione C): interni, arredi e oggetti di scena non li scrive lo
Scultore ma un agente a parte, lo **Scenografo**, come il Cartografo passa allo Scultore. Questo documento risponde ai punti di T259 con un
banco che gira davvero (`lab/banco/scenografo/`, `lab/scripts/banco-scenografo.ts`) e propone la strada. Nessun modello è stato chiamato:
i costi in dollari sono stime, e la misura vera è un task che propongo in fondo.

## 1. Il problema

Un edificio procedurale (T181, T182) cambia a ogni seme: campate, scale, porta, piani. L'interno non può essere un disegno fisso; deve
stare su uno scheletro che non conosce prima. In più gli interni non possono rompere ciò che le misure garantiscono (regola 10 di
`AGENTS.md`: ogni luogo connesso): porte, scale, passaggi, cantina (ADR-0135: una cima bassa sotto il suolo annulla la cantina).

## 2. Come riceve l'edificio: il kernel misura, lo Scenografo vede classi

Lo Scenografo **non riceve coordinate né l'XML dell'edificio**. Il kernel esegue il programma con il seme, misura ciò che un corpo
raggiunge (le stesse funzioni di `lab/banco/misure.ts`, cioè `groundOfForm`, `rampBlocks`, il cammino del viandante) e scrive, sullo strato
dei piedi di ogni piano (`piante()` in `lab/banco/scenografo/scenografo.ts`):

| classe | cosa | chi la decide |
|---|---|---|
| `#` | qualunque lettera dell'edificio (muro, pilastro, gradino) | il kernel, un'unione di tutte le lettere |
| `φ` | pavimento libero: i centri del corpo allargati del corpo, fino ai muri | il kernel |
| `ψ` | pavimento libero sotto il suolo: solo ciò che arriva al soffitto | il kernel |
| `π` | protetto: la porta e la strada dritta che entra, i piedi e le teste delle scale (a riempimento, senza passare i muri), ciò che non appartiene a nessuna stanza (colli di scala, celle troppo piccole), le stanze sotto 0,6 caselle² di centri, i piani con meno di 4 caselle² coperte | il kernel |

Poi il kernel ha una **guardia** (`Guardia`): tutti i centri dove sta un corpo, piani, scale e terreno, come un grafo unico (un voxel di
lato, un gradino in su o in giù). Un pezzo d'arredo entra solo se ciò che resta è in tanti pezzi quanti prima: nessuna stanza, piano o
scala tagliata fuori. Infine le misure del banco prima e dopo (§5). La guardia e le classi sono le stesse per le due vie: è il pavimento,
non un compito dell'agente.

## 3. «Un programma per tipo, le istanze sono semi» su un edificio che cambia

Le due vie confrontate:

1. **Programma** (`programmaArredo`): un programma MarkovJunior di secondo stadio, eseguito con `runOn` sulla griglia già scolpita. Legge
   solo le classi del §2, quindi **uno stesso programma serve ogni edificio e ogni seme**: scaffali contro un muro (al soffitto, anche in
   cantina), letti e panche con un passaggio davanti e ai lati, casse negli angoli, tavoli con un passaggio su ogni lato. È un tipo come gli
   altri della libreria: l'istanza è il seme dell'edificio (o un seme dell'arredo). Il programma provato è scritto a mano: ≈ 1 200 token.
2. **Dati** (`arredaDati`): lo Scenografo sceglie, per tipo di stanza, **modelli che esistono già** (`banco`, `credenza`, `barile`, `letto`,
   `mobile` di `universe/models`, classe `mobile`); il kernel trova le stanze di ogni piano (i centri tagliati ai passaggi stretti), prova
   ogni pezzo contro un muro con una rotazione e lo tiene solo se la guardia lo ammette. Ciò che l'agente scrive è il catalogo
   (`CATALOGO`): ≈ 30 token. Ogni mobile è un tipo con il suo programma e il suo seme, quindi la regola resta vera alla lettera, e i mobili
   usano la cache delle forme come ogni altro modello (ADR-0108).

In tutte e due l'edificio resta un programma solo e l'interno è una funzione deterministica di (edificio, seme): niente da salvare oltre la
chiave, come le forme.

## 4. Il banco

`npx vite-node lab/scripts/banco-scenografo.ts` (5 semi, 6 edifici; senza chiamate, circa 4 minuti). Gli edifici: `palazzina` (moderna,
Grande), `forte` (rocca, Enorme), `tempio` (Grande), `locanda` con la cantina (`suolo/locanda/1/corretta`, Grande), `officina`
(`cantiere.xml` sul bersaglio steampunk, Grande), `laboratorio` ipogeo con la cantina (`suolo/strutture/laboratorio.xml`, D33). Per ogni
seme ogni via arreda due volte (semi d'arredo 1 e 2) per la varianza interna. Se un arredo rompe qualcosa il kernel lo rifà con un altro
seme, al più 4 volte (regola 2: l'invalido torna indietro).

Fogli di contatto (`lab/banco/scenografo/<edificio>.png`): il piano terra tagliato poco sopra la testa, visto dal davanti; prima riga
l'edificio vuoto, seconda il programma, terza i modelli; un seme per colonna.

## 5. Le misure

Tabella completa: `lab/banco/scenografo/riepilogo.md`. Riassunto su 30 edifici per via:

| | programma | dati |
|---|---|---|
| regge al primo arredo | **30/30** | 28/30 |
| regge entro 4 | 30/30 | 30/30 |
| piani, porta, cantina, murato | uguali a prima, murato 0 | uguali a prima, murato 0 |
| centri liberi ancora raggiunti | 100 % | 100 % |
| stanze ancora percorribili (≥ ¼ del pavimento libero e raggiunto) | tutte | tutte |
| tempo di un arredo (media, max), senza le misure | 122 ms, 225 ms | 319 ms, 1 047 ms |
| pezzi per edificio (media) | 8,5 | 4,6 |
| voxel d'arredo per edificio (media) | 4 600 | 8 500 |
| varianza interna (due semi d'arredo, voxel diversi su quelli dell'uno o dell'altro) | 0,86 | 0,77 |
| ciò che scrive l'agente | ≈ 1 200 token, un programma | ≈ 30 token, un catalogo |

Cosa ho imparato facendolo funzionare (ogni punto è stato un fallimento misurato prima della correzione):

- **Senza la guardia il programma chiude i passaggi.** Un programma locale non vede la connessione: un letto accanto a un varco di un
  muro vicino, uno scaffale al piede della scala del tempio hanno tagliato fuori un piano (centri raggiunti 79-91 %). Con la guardia del
  kernel dopo il programma (i pezzi che tagliano qualcosa si tolgono) il programma regge 30 su 30 al primo colpo.
- **La protezione non deve passare i muri e il terreno esterno non è una scala.** Le prime versioni proteggevano tutto il piano terra.
- **Un piano piccolo va guardato dall'area coperta**: la cella del tempio ha molti centri all'aperto e 3 caselle² coperte; arredata, smette
  di essere un piano per `misure` anche se si raggiunge ancora.
- **La misura `stanze` non vale su un edificio arredato.** È un'erosione dei centri (T182, domanda 2): un mobile contro il muro spezza il
  nucleo della stanza. Dopo l'arredo `giudica` cade su `stanze` in quasi tutti gli edifici (colonna «`giudica` perso»), con le stanze
  ancora percorribili tutte. Le misure dello Scultore si prendono sull'edificio vuoto; per lo Scenografo valgono la guardia e le misure del
  §5. In un caso (`laboratorio`, dati) cade `salti`: un mobile sopra un atterraggio. Non è un difetto di connessione, ma va detto.
- **In cantina solo ciò che arriva al soffitto.** Il programma lo fa (gli scaffali crescono fino al soffitto, `ψ`); i modelli di mobili no,
  quindi la via dei dati lascia la cantina vuota.

## 6. Quando parte e cosa si vede prima

- **Generazione differita, al primo ingresso.** L'interno serve solo a chi entra. Il kernel lo calcola quando un viandante arriva a una
  casella dalla porta, nel worker delle forme (100-450 ms, sotto il battito: ADR-0110 fa girare i programmi un turno alla volta), e lo
  mette in cache con la forma (chiave: modello, seme dell'edificio, impronta del programma o del catalogo d'arredo).
- **Prima si vede l'edificio vuoto**, che è già valido e percorribile: la guardia garantisce che l'arredo non lo peggiori, quindi non c'è
  un momento in cui il viandante resta chiuso. Gli arredi compaiono come compaiono oggi i modelli che il `ModelDirector` completa.
- **Il programma o il catalogo si scrivono una volta per tipo di edificio**, non per istanza: quando lo Scultore consegna un tipo nuovo, il
  compito dello Scenografo entra in coda come i modelli mancanti.

## 7. Manopola, chi paga, quanto costa

- **`CENSUS`**: un compito nuovo `interior.design` (agente `scenografo`, modo `diretta`) con un coefficiente suo, `interni` (ADR-0133: ogni
  compito ha una manopola, fissata entrando). A 0 gli edifici restano vuoti e validi: nulla si rompe.
- **Chi paga**: chi paga il modello dell'edificio (`chi` della scultura, ADR-0113), perché l'interno è parte del tipo; il posizionamento del
  kernel non costa nulla.
- **Costo, stima non misurata.** T182 misura 1,15-1,22 $ per un edificio con output di 55-60 mila token, quasi tutto ragionamento per un
  programma di 9-25 kB. Un programma d'arredo come quello provato è ≈ 5 kB: con lo stesso rapporto fra ragionamento e testo, 15-25 mila token
  di output, ≈ 0,3-0,5 $ a tipo sullo stesso modello. Il catalogo è un compito da Flash-Lite con poche centinaia di token: sotto un
  centesimo. Se l'interno si scrive insieme all'edificio il programma cresce di quei 5 kB e porta con sé il rischio del §5 (senza la guardia
  la connessione cade), e una seconda richiesta dello Scultore rifà tutto: separato, un errore dell'arredo costa solo l'arredo.
  **Il risparmio che l'autore si aspetta c'è certamente per la via dei dati; per la via del programma va misurato** (task proposto sotto).

## 8. Raccomandazione

**La via dei dati come base, con la guardia del kernel, e il programma di secondo stadio solo dove i modelli non arrivano** (la cantina e
gli arredi fino al soffitto, i decori fissati ai muri).

Perché:

1. **Costo**: ≈ 30 token contro ≈ 1 200 di testo (e il ragionamento che li accompagna). È ciò che l'autore chiedeva.
2. **Aspetto**: i mobili sono modelli scolpiti e giudicati dall'Artista (foto della riga 3), il programma disegna blocchi (riga 2): la
   coerenza dello stile resta un compito dello Scultore, non di un secondo agente.
3. **Sicurezza**: entrambe reggono 30 su 30 con la guardia; la via dei dati la usa a ogni pezzo e regge 28 su 30 al primo colpo anche
   così, perché le due cadute sono misure di `giudica` estranee alla connessione.
4. **Il programma vince su ciò che conta meno qui**: tempo (122 ms contro 319) e varianza interna (0,86 contro 0,77); il tempo dei dati è
   quasi tutto la guardia, che si può accelerare (una sola BFS incrementale invece di una per candidato).

## 9. Task che ne nascono (proposta per l'autore)

1. **Misura del costo vero** (2 richieste per via, `--insieme 1`): lo stesso edificio di T182 con l'interno insieme contro l'interno a parte
   (programma) e contro il catalogo (dati), con token e dollari.
2. **La guardia nel kernel** (`src/kernel/forms.ts`): classi dello strato dei piedi, guardia, cache con la chiave dell'interno; test con i 6
   edifici del banco. Senza modelli.
3. **Lo Scenografo**: prompt in `prompts/agents/scenografo.md`, compito `interior.design` con schema Gemini, risposta in `MockAiModels`,
   voce nel registro, `CENSUS` con `interni`, una postazione nello studio (convenzione di `AGENTS.md` per un compito nuovo).
4. **Mobili per la cantina**: modelli che arrivano al soffitto (scaffali, botti grandi) nella libreria, perché la via dei dati non la lasci
   vuota.
5. **Le misure dello Scultore sull'edificio vuoto**: dirlo in `lab/banco/README.md` e nel prompt, perché `stanze` non è una misura degli
   interni.
