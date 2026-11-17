# Lo Scenografo: gli interni separati dall'edificio (T259)

Decisione dell'autore del 04/11 (`docs/pipeline/domande/T182.md`, domanda 2, opzione C): interni, arredi e oggetti di scena non li scrive lo
Scultore ma un agente a parte, lo **Scenografo**, come il Cartografo passa allo Scultore. Questo documento risponde ai punti di T259 con un
banco che gira davvero (`lab/banco/scenografo/`, `lab/scripts/banco-scenografo.ts`) e propone la strada. In T259 nessun modello è stato
chiamato e i costi del § 7 erano stime; **la misura vera l'ha fatta T303** (17/11) con lo Scultore di oggi e la CLI di Claude: i numeri e la
raccomandazione che ne esce sono al § 9.

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
- **Costo, stima non misurata in T259** (i numeri veri sono al § 9: il programma 0,07 $, i dati 0,014 $, l'interno insieme circa 0,5 $ in più a tipo). T182 misura 1,15-1,22 $ per un edificio con output di 55-60 mila token, quasi tutto ragionamento per un
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

## 9. La misura vera (T303, 17/11)

Due edifici del banco delle taglie scritti dallo **Scultore di oggi** (Opus 5.5 sulla CLI dell'abbonamento, lo strumento di T391, il `sculpt`
del gioco con le correzioni e il voto dell'Artista), a Grande, e le tre vie con **2 richieste ciascuna**, tutte alla CLI di Claude (Opus 5.5,
sforzo `low` come il ragionamento del gioco), mai a una chiave a consumo; l'Artista della via (a) sul suo modello di Gemini, come nel gioco
(0,05 $ in tutto). Ogni risposta passa dal motore, dalla guardia, dalle misure del banco e dai controlli dello Scultore sull'edificio
arredato (piani raggiunti, `partErrors`); una risposta che il kernel non prende torna allo Scenografo una volta col motivo (regola 2), e
nessuna ne ha avuto bisogno. Il costo è quello dei token che la CLI riporta al listino API di Anthropic, uguale al suo `total_cost_usd`.
Tutto in `lab/banco/scenografo/misura/` (il README del banco dice i file), lo script è `lab/scripts/scenografo-misura.ts`.

- **(a) insieme**: lo Scultore riceve nella richiesta anche l'interno (`scultore-gemini.ts --interno`: ogni stanza di ogni piano arredata,
  i passaggi liberi, i colori dei mobili che cominciano con «arredo», così il banco li conta).
- **(b) programma**: un programma MarkovJunior di secondo stadio scritto una volta per il tipo di edificio, eseguito con il seme
  dell'edificio su un palco a classi (`W` l'edificio, `F` pavimento libero, `C` cantina, `P` protetto, `A` il posto degli animali: `palco` di
  `lab/banco/scenografo/misura.ts`); il prompt (`prompt-programma.md`) porta le sezioni del linguaggio del prompt dello Scultore.
- **(c) dati**: regole che scelgono fra 10 mobili del seme per tipo di stanza (piano, area, sala, stanza o piccola) e quanti
  (`prompt-dati.md`); li posa il kernel contro i muri, mai sul posto degli animali.

(b) e (c) ricevono ciò che il kernel misura dell'edificio fatto, sui semi 1 e 2 (`descrivi`): piani raggiunti, porta, le parti abitabili
(`habitableParts`), le stanze col tipo, l'area e il soffitto, le aree del suolo (`areasOf`) e il posto degli animali (le caselle di
un'area che li nomina: `barn` nella fattoria). Le misure sono su tutti e 4 i semi dell'edificio, coi suoi piani coperti (la soglia del piano
piccolo a 2 caselle², vedi il § 10).

| | (a) insieme | (b) programma | (c) dati |
|---|---|---|---|
| costo a richiesta | 0,59 $, 0,69 $ villetta; 0,39 $, **1,32 $** fattoria | 0,08 $, 0,06 $ villetta; 0,08 $, 0,07 $ fattoria | 0,024 $, 0,007 $ villetta; 0,018 $, 0,007 $ fattoria |
| media | 0,75 $ a richiesta, **1,00 $ a edificio riuscito** | **0,071 $** | **0,014 $** (0,021 $ la prima, 0,007 $ col prompt in cache) |
| riuscite | 3 su 4 (la fattoria del giro 2: tre volte «piani: 1», nessun programma) | 4 su 4 alla prima risposta | 4 su 4 alla prima risposta |
| token in uscita | 16-41 mila | 1,5-3,2 mila | 172-221 |
| tempo | 172-407 s | 15-27 s | 3-4 s |
| programma | 8,5-9,8 kB (l'edificio vuoto 7,8 kB) | 2,8-5,5 kB | — |
| regge (guardia e misure del banco), sui semi | — (è nell'edificio: i controlli dello Scultore lo tengono in piedi) | 16 su 16 al primo seme d'arredo | 10 su 16 al primo, 16 su 16 entro 4 |
| pezzi a edificio (media dei semi) | 6 e 7 villetta, 5 fattoria | 12 e 1,5 villetta, 10 e 2 fattoria | 4 villetta, 3,5 fattoria |
| voxel d'arredo a edificio | 430-1 400 | 1 100-2 800 | 2 300-7 200 (i mobili del seme sono più massicci) |
| stanze arredate | tutte | 8/8 e **4/8** villetta, 8/8 e 8/8 fattoria | 8/8 villetta, 7/8 fattoria |
| ciò che l'arredo fa perdere | `stanze` di `giudica` (sempre), `salti` una volta | niente | la stanza dello Scultore (lato sotto 28) su un seme della villetta |
| varianza fra due semi d'arredo | nessuna: l'interno segue il seme dell'edificio | 0,84-0,93 | 0,74-0,82 |
| le due richieste | due edifici diversi | due programmi diversi: per edificio uno ricco e uno povero | **identiche**, parola per parola |

Le basi: gli stessi due edifici vuoti allo stesso Scultore sono costati 0,41 $ (fattoria) e 1,13 $ (villetta, con una correzione della porta
e la revisione sotto 7); T392 misura Opus a Grande 6 su 6 a **0,52 $ a riuscita**. In tutto la misura è costata **4,88 $ a listino** (vuoti
1,54 $, insieme 2,99 $, programma 0,29 $, dati 0,06 $) più 0,05 $ dell'Artista su Gemini. **La finestra delle 5 ore** è passata dal 51 % al
62 % (11 punti in circa un'ora, con altri agenti della pipeline al lavoro nello stesso tempo: `/usage` non separa le sessioni), la settimana
dal 46 al 47 %.

Fogli di contatto: `lab/banco/scenografo/misura/<edificio>.png`, una riga per via (vuoto, a1, a2, b1, b2, c1, c2), due colonne per seme
dell'edificio (il piano terra e quello sopra, tagliati poco sopra la testa, dal davanti). Le righe (a) sono edifici diversi: lo Scultore li
ha scritti di nuovo con l'interno.

Cosa dicono i numeri:

- **Separare conviene, e molto più di quanto stimava il § 7.** L'interno insieme costa in più dell'edificio vuoto circa 0,5 $ a tipo
  (1,00 $ a edificio riuscito contro 0,52 $) e porta con sé il rischio: la fattoria con l'interno è caduta tre volte sui piani raggiunti e ha
  speso 1,32 $ senza un programma; un errore dell'arredo rifà l'edificio intero. A parte, il programma costa 0,07 $ e i dati 0,014 $ a tipo:
  la stima di T259 per il programma (0,3-0,5 $) era 5 volte troppo alta, perché con sforzo `low` Opus scrive un programma di 3-5 kB quasi
  senza ragionamento (1,5-3 mila token in uscita contro i 15-25 mila stimati).
- **La via dei dati è la più sicura e la più economica, ma è povera e ripetitiva.** Risponde in 4 secondi con 200 token, ogni volta la
  stessa risposta, e i mobili sono modelli già giudicati; il kernel però trova posto a 3-4 pezzi per edificio, regge al primo seme d'arredo
  10 volte su 16 (la guardia scarta i pezzi che chiuderebbero un passaggio) e su un seme della villetta un mobile restringe la stanza più
  grande sotto la misura dello Scultore. La cantina resterebbe vuota come in T259 (qui nessuno dei due edifici ne ha una).
- **La via del programma è la più ricca, ma la qualità varia da una richiesta all'altra.** Un programma su due per edificio arreda tutto
  (10-12 pezzi, ogni stanza, ogni seme, la guardia non toglie niente); l'altro è povero: la villetta 2 ha dimenticato la simmetria sulla
  radice (i mobili solo contro i muri a sinistra: 4 stanze su 8), la fattoria 2 mette 2 pezzi. Nessuno rompe niente: 16 su 16. Serve un
  pavimento di qualità che rimandi indietro un programma povero (stanze arredate e pezzi per caselle², misurati sui semi).
- **L'interno insieme è anche il meno vario**: sta nel programma dell'edificio, quindi cambia con l'edificio ma non ha un seme suo (lo stesso
  numero di pezzi e di voxel a ogni seme); (b) e (c) ne hanno uno.

**Raccomandazione per T259: separare, con la via dei dati come base e il programma di secondo stadio come secondo passo.** I dati costano un
centesimo e mezzo a tipo e non rompono niente; il programma, a 7 centesimi, si aggiunge dove i dati non arrivano (cantina, arredi fino al
soffitto, decori ai muri) e per la ricchezza delle sale, con un pavimento di qualità nel kernel che rimandi indietro un programma povero.
L'interno insieme all'edificio no: costa mezzo dollaro in più a tipo, rischia l'edificio intero e non varia col proprio seme.

## 10. Task che ne nascono (proposta per l'autore)

1. **La guardia nel kernel** (`src/kernel/forms.ts`): classi dello strato dei piedi solo sul pavimento coperto, guardia, cache con la chiave
   dell'interno; la soglia del piano piccolo alla scala di oggi (a 20 voxel per casella i piani di Opus a Grande sono di 3-4 caselle²: con la
   soglia di T259, 4, resterebbero tutti vuoti; T303 usa 2) e la stanza dello Scultore (`partErrors`) fra ciò che la guardia difende. Test
   con gli edifici di questo banco e i 6 di T259. Senza modelli.
2. **Lo Scenografo, la via dei dati**: prompt in `prompts/agents/scenografo.md` (da `lab/banco/scenografo/prompt-dati.md`), compito
   `interior.design` con lo schema delle regole, risposta in `MockAiModels`, voce nel registro, `CENSUS` con la manopola `interni`, una
   postazione nello studio; il catalogo dai mobili della libreria (classe `furniture`). La risposta è di 200 token: da provare anche su un
   modello che costi meno (Flash-Lite) con lo stesso banco.
3. **Lo Scenografo, la via del programma**: il palco a classi nel kernel, il prompt di `prompt-programma.md`, il pavimento di qualità che
   rimanda indietro un programma povero; dopo il 2.
4. **Mobili per la cantina**: modelli che arrivano al soffitto (scaffali, botti grandi), perché la via dei dati non la lasci vuota.
5. **Le misure dello Scultore sull'edificio vuoto**: dirlo in `lab/banco/README.md` e nel prompt, perché `stanze` non è una misura degli
   interni (confermato in T303 su tutti gli edifici della via (a)).
