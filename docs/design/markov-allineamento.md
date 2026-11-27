# Allineare il nostro motore a MarkovJunior di mxgmn: conformità, caso, migrazione, esempi (T500)

Data: 2026-11-23 · Step 44 · Richiesta: la scelta **A1** dell'autore per D/T498 (22/11, «Risposta dell'autore a T498» in
[`docs/userchats/to-do-2026-11-22.md`](../userchats/to-do-2026-11-22.md)): allineare il motore e il compilatore all'originale il più possibile,
non solo `<markov>`/`<sequence>`, per usare i modelli del repository di mxgmn come esempi, per esportare i nostri programmi nell'originale, e
perché forse la bassa varianza dei modelli dell'IA viene da qui · Nasce da T498 ([`markov.md`](markov.md)) · Banco:
[`lab/banco/conformita/`](../../lab/banco/conformita/README.md) · Test: `tests/mj-conformita.test.ts` · Domande:
[`docs/pipeline/domande/T500.md`](../pipeline/domande/T500.md)

Il motore, il compilatore e i prompt non cambiano in questo task (kernel 0.10.29). L'originale non è stato letto soltanto: è stato fatto
girare (il C# al commit `42aaf24`, .NET 6, il `Program.cs` senza grafica di T498), e tradotto riga per riga in TypeScript; ogni affermazione
sotto ha un programma, ciò che il C# vi ha stampato (`lab/banco/conformita/uscite.json`) e un test.

## In breve

1. **Il caso dell'originale si riproduce, voxel per voxel.** `System.Random` di .NET con un seme è l'algoritmo sottrattivo di Knuth, e in
   TypeScript tira gli stessi numeri bit per bit (§ 2). Con quel generatore e l'ordine in cui l'originale tira (le simmetrie, la lista delle
   corrispondenze, i rami) la **traduzione dell'originale** (`lab/banco/conformita/riferimento.ts`, il «riferimento») dà la stessa griglia e
   gli stessi passi del C# su **30 dei 36 modelli 3D** del repository, su 3 semi ciascuno (gli altri 6 leggono risorse non ancora portate in
   testo), su 11 programmi delle differenze nuove (anche dove il C# si ferma con un errore), sui 16 casi di T498 e su un esempio scritto per
   i due motori. Anche `wfc` a tessere, `field` con `temperature`, `observe`, `map` e le regole da file. **Il criterio di conformità è quindi
   voxel per voxel**, passi e fine compresi, non statistico.
2. **Oggi il nostro motore non è l'originale in niente di ciò che tira a caso**: il generatore (mulberry32), l'ordine delle varianti di una
   regola e delle corrispondenze, e 19 differenze di senso con un programma e un `it.fails` (§ 3): le 8 dei rami e dei nodi di regola
   di T498, e 11 nuove (`d="2"` ignorato, la `map` che chiude la corsa, `path` dal `from` più vicino, `path` senza `color`, `path` per spigoli, la
   `convolution` fermata a 30 passi, Moore in 3D, i cambi della `convolution` che i nodi dopo non vedono, l'unione dentro un nodo, la
   `convolution` piana e periodica, la `prl` che scrive solo dove la cella cambia), più quelle che si vedono solo col caso dell'originale.
3. **I modelli di mxgmn da noi**: dei 36 modelli 3D oggi ne giriamo 29 (ModernHouse e SeaVilla solo dalla copia portata ai simboli del
   contratto 0.6: il testo dell'originale usa `8`, `6` e `#` come simboli, che da noi non lo sono più), con lettere distribuite come
   nell'originale tranne StrangeDungeon e SeaVilla; nessuno dà la griglia dell'originale. Dopo l'allineamento: tutti e 36, voxel per voxel (§ 4).
4. **La varianza non viene dal motore** (§ 5): i modelli di mxgmn variano fra i semi quasi uguale nell'originale e nel nostro motore (mediana
   della forma 0,55 nei due), mentre i nostri programmi variano poco perché sono scritti così: 288 su 359 usano le forme (`box`, `cylinder`…)
   e variano 0,004 (mediana), 153 sono statici; i 71 senza forme variano 0,18; quelli del Concilio negli universi 0,03. Allineare il motore
   non alzerà la varianza da solo; la alzeranno i prompt e gli esempi (`one`, le `prl` a moneta, `path`, `wfc`), come mostra l'esempio del
   borgo coi sentieri (`path`).
5. **La migrazione** (§ 6): col caso dell'originale cambia la griglia di ogni programma che tira a caso, anche dove il senso resta: è un
   contratto nuovo (0.11) e nessuna migrazione tiene le griglie di prima. Si può tenere il **senso**: riscritture automatiche per ciò che
   l'originale leggerebbe altrimenti (le `sequence` annidate per la simmetria, i nodi dopo una `map`, le regole che non cambiano niente, `p`
   nella `one`), contate sui cinque universi; i cicli (il forte dell'autore, 2 programmi del seme) a mano; poi ogni programma rivalidato.
6. **Come**: il motore allineato dietro un interruttore finché la catena non è completa (nessun programma di oggi cambia a metà strada), il
   riferimento come modello e come oracolo, poi la migrazione in un colpo solo col contratto 0.11 (§ 7). **La catena**: 15 task, da A1-0 ad A1-14 (§ 8).
7. **Le domande** per l'autore sono otto, ognuna col consiglio (§ 9).

## 1. Il banco: tre motori sugli stessi programmi

| | che cos'è | dove |
|---|---|---|
| **l'originale** | il C# di mxgmn al commit `42aaf24`, costruito senza grafica (il `Program.cs` di T498: un modello, una griglia di partenza facoltativa, un seme o un intervallo, stampa passi, fine e griglia) | `lab/banco/markov/originale/`, costruito in `lab/out/markov/mj/` |
| **il riferimento** | l'originale tradotto riga per riga in TypeScript (`Interpreter`, `Branch`, `MarkovNode`, `MapNode`, `RuleNode`, `OneNode`, `AllNode`, `ParallelNode`, `Rule`, `SymmetryHelper`, `Grid`, `Field`, `Observation`, `PathNode`, `ConvolutionNode`, `ConvChainNode`, `WFCNode`, `OverlapNode`, `TileNode`; non `Search`), con `System.Random` di .NET; legge l'XML dell'originale coi suoi predefiniti, le sue stranezze e i suoi errori; le immagini e i `.vox` di `resources/` li legge nel testo di `lab/mjx/official/resources/` (T335) | `lab/banco/conformita/riferimento.ts`, `dotnet-random.ts` |
| **il nostro motore** | `src/mj/engine.ts` e `src/mj/model.ts`, invariati | |

Lo script è `lab/scripts/conformita-mj.ts` (`--caso`, `--programmi`, `--modelli`, `--varianza`, `--censimento`); ciò che il C# ha stampato
sta in `uscite.json` perché i test non abbiano bisogno di .NET; i 36 modelli 3D di mxgmn sono copiati così come sono in
`lab/banco/conformita/mxgmn/` (la copia di `lab/mjx/official/` segue il nostro contratto: ModernHouse e SeaVilla vi sono già portati ai
simboli 0.6, e non sono più il testo dell'originale). Tutte le tabelle in [`misure.md`](../../lab/banco/conformita/misure.md).

## 2. Il caso: sì, si riproduce

### 2.1 Il generatore

Con un seme, .NET usa ancora l'algoritmo di .NET Framework per compatibilità (`Net5CompatSeedImpl`; qui provato con .NET 6, il
repository oggi si costruisce col 10, che per quanto so lo tiene uguale: da verificare quando si costruirà col 10): il generatore sottrattivo di Knuth, 55 interi, `Next()` un intero in [0, 2³¹−1), `Next(n)` = `(int)(Sample() · n)`,
`NextDouble()` = `Sample()`, con `Sample()` = l'intero · (1/(2³¹−1)). In TypeScript sono una sessantina di righe (`dotnet-random.ts`).
**Misura**: 10 semi (anche 0, −5, −2³¹, 2³¹−1) × 3000 numeri, alternando `Next()`, `Next(n)` con dieci `n` diversi e `NextDouble()`
confrontato come i suoi 64 bit: gli stessi di .NET, tutti.

### 2.2 L'ordine in cui l'originale tira

Lo stesso generatore non basta: conta chi tira, quando e su quale lista. Ciò che l'originale tira, nodo per nodo (dal sorgente, e riprodotto
dal riferimento):

| nodo | che cosa tira dal generatore della corsa (`ip.random`) | da che cosa dipende il risultato |
|---|---|---|
| `one` | `Next(matchCount)` finché pesca una corrispondenza ancora valida (le vecchie le scarta, ognuna un numero) | l'ordine della lista delle corrispondenze: la prima scansione (per regola, le celle a passo della regola dall'angolo, per ognuna gli spostamenti in cui il valore sta nella regola), poi in coda quelle che i cambi dall'ultima volta fanno nascere; chi è pescato lascia il posto all'ultimo |
| `all` | un mescolamento «dall'interno» degli indici, `Next(i+1)` per i da 0 | la stessa lista |
| `prl` | `NextDouble()` per ogni corrispondenza, nell'ordine della scansione (ogni passo è una scansione intera) | la scansione |
| `one`/`all` con `field` o `observe` | `NextDouble()` per ogni corrispondenza con un'euristica, nell'ordine della lista | la lista; `Math.pow`, `Math.exp` con `temperature` |
| `path` | un `Next()` per un generatore suo (`new Random(ip.random.Next())`), che tira il rumore delle partenze e le direzioni | l'ordine delle direzioni (−x, +x, −y, +y, −z, +z) |
| `convolution` | `Next()` per cella e regola, solo se la regola ha `p` diverso da 1 | |
| `convchain` | `Next(2)` per cella da dipingere, poi `Next(celle)` e `NextDouble()` a ogni passo | |
| `wfc` | un `Next()` per tentativo, seme di un generatore suo che sceglie le celle (rumore 10⁻⁶) e i motivi | l'ordine dei motivi e delle tessere (le simmetrie nell'ordine dell'originale) |
| ogni regola | — | l'ordine delle sue varianti: il gruppo del quadrato o del cubo nell'ordine `e, r, a, ra, a², …` di `SymmetryHelper`, senza i doppi |

### 2.3 La prova: il riferimento contro il C#

| che cosa | quanti | uguale al C# |
|---|---|---|
| modelli 3D del repository (models.xml: scatola e passi; 3 semi ciascuno) | 36 | **30 su 30 letti**: la stessa griglia voxel per voxel, gli stessi passi, la stessa fine; i 6 restanti leggono risorse non ancora in testo (`Knots3D` per cartella, le regole di `CarmaTower` e di `DualRetraction`) |
| di cui con `wfc` a tessere | 15 | 11 su 11 letti (ModernHouse e SeaVilla con `map`, `path`, `field`, regole da file e cicli) |
| di cui con `field` e `temperature` | Keys, SoftPath, SeaVilla | sì: `Math.pow` e `Math.exp` di V8 e di .NET hanno dato gli stessi bit |
| di cui con `observe` | StairsPath | sì |
| programmi delle differenze nuove (`c1`-`c11`, 3 semi) | 11 | 11, anche i due errori (`Moore` in 3D, l'unione dentro un nodo) |
| programmi di T498 (`d1`-`d10`, `d9` su 5 semi) | 16 | 16 |
| l'esempio del borgo coi sentieri (3 semi) | 1 | sì |

La stranezza della `convolution` che non mette i suoi cambi nella lista dei cambi (§ 3.5) è riprodotta; con un interruttore solo per la
prova (`VARIANTS.logConvolution`) si vede che su Hills, OpenCave3D e Counting non cambia niente (4 semi).

**La risposta.** Sì: lo stesso programma e lo stesso seme danno la stessa griglia dei due motori. Il criterio di conformità per la catena è
quindi **voxel per voxel contro l'originale**, sui suoi modelli del repository e sui programmi delle differenze: il C# dove c'è (lo script),
`uscite.json` e il riferimento dove non c'è (i test). Resta un limite teorico: `Math.log` (l'entropia di Shannon della `wfc`, nei soli modelli
2D) e `Math.pow`/`Math.exp` potrebbero differire di un'unità nell'ultima cifra fra V8 e .NET in casi rari; nei modelli misurati non è
successo. Il criterio statistico (le quote delle lettere, § 4) serve solo a dire com'è il nostro motore oggi.

## 3. La conformità, nodo per nodo

«Uguale»: lo stesso senso e, col caso dell'originale, lo stesso risultato. «Diverso»: un programma che lo mostra, ciò che l'originale
stampa e un test (`d*`: [`markov.md`](markov.md) e `tests/mj-markov-originale.test.ts`; `c*`: `lab/banco/conformita/programmi/` e
`tests/mj-conformita.test.ts`). «Nostro»: non c'è nell'originale (§ 3.8 dice come si esporta).

### 3.1 Il programma e la griglia

| | l'originale | il nostro | stato |
|---|---|---|---|
| il generatore | `System.Random(seed)` | mulberry32 (`src/kernel/rng.ts`) | **diverso** (§ 2) |
| `values` | una stringa di caratteri qualsiasi (lettere, cifre, `#`, punteggiatura), il primo è la cella vuota; un doppio è un errore; al più 31 (le onde sono interi di 32 bit: con 32 valori `*` non trova più niente) | lettere o `#` e un numero (`#12`); una cifra da sola o `#` senza numero non sono simboli (dal contratto 0.6, ADR-0175); al più 255; un doppio si ripara con un avviso | **diverso**: il testo di ModernHouse (`8`, `#`) e di SeaVilla (`6`) non compila da noi; 28 programmi del seme e 54 degli universi hanno più di 31 valori. **Letto** dal T531 con `compileMjx(…, { original: true })`: la traslitterazione all'ingresso (ADR-0265) |
| `origin` | `True`: la cella al centro della scatola diventa il secondo valore | lo stesso; in più `bottom` (il centro del pavimento) | uguale; `bottom` nostro |
| `symmetry` della radice | in 3D il cubo intero (48), in 2D il quadrato (8); i nomi: in 3D `() (x) (z) (xy) (xyz+) (xyz)`, in 2D `() (x) (y) (x)(y) (xy+) (xy)` | il cubo intero anche su una griglia piana; i nomi `() (x) (y) (z) (xy) (xyz+) (xyz)` per ogni griglia; dal T531 anche `(x)(y)` e `(xy+)`, e leggendo l'originale i suoi nomi per strati e il gruppo della griglia | **diverso**: l'insieme delle varianti che possono combaciare è lo stesso, l'ordine no. **Allineato** dal T527 con l'interruttore acceso: il quadrato su una griglia piana, il cubo sulle altre (ADR-0268) |
| l'ordine delle varianti di una regola | `SquareSymmetries`/`CubeSymmetries`: `e, r, a, ra, a², ra², …` (a e b due rotazioni, r lo specchio), senza i doppi | permutazioni degli assi per specchi (`symmetries` in `engine.ts`) | **diverso** (decide la `one`, la `all`, la `prl` col caso dell'originale). **Allineato** dal T527 con l'interruttore acceso (`originalTurns`), anche per le regole di una `map` |
| le unioni | `<union symbol values>` trovate solo scendendo dalla griglia (radice, `map`, `wfc`) per `markov` e `sequence`; `*` ogni valore | ovunque, per griglia (T335) | **diverso**: un'unione dentro un nodo di regole, l'originale non la trova e non carica il programma (`c8`). **Allineato** dal T531 leggendo l'originale (`original`, con `strict` l'errore); le nostre restano ovunque come estensione |
| `d="2"`, `d="3"` sui nodi | ignorato: il nodo gira | un nodo `d="2"` si salta | **diverso** (`c1`; StrangeDungeon di mxgmn ne ha due, e da noi si distingue anche per le lettere, § 4) |
| `folder` | le regole da file della griglia in `resources/rules/<folder>/` | `models/<folder>-<nome>.txt` | uguale (testo invece di immagini, regola 11) |
| `transparent` | solo per disegnare | ignorato | uguale |
| i passi della corsa | `models.xml → steps` (50 000 se non lo dice, ≤ 0 senza limite); **ogni** chiamata del ramo di turno è un passo, anche quella in cui un ramo finisce senza fare niente, e il passo della `map` e ogni osservazione della `wfc` | `run(…, maxSteps)`; un passo è un passo della radice che cambia qualcosa | **diverso**: i passi dei `d*` di T498 e dei modelli (un modello di sola `wfc`: 75-540 passi nell'originale, 1-4 da noi). Dal T527, con l'interruttore acceso, ogni turno è un passo, anche l'ultimo della radice; dal T528 anche i turni dei rami annidati e il passo vuoto di un ramo che finisce (ADR-0272) |
| le griglie | senza limiti | `MODEL_LIMITS`, `FORM_LIMITS`, i tetti del mondo (`WORLD_NODE_LIMITS`, `NodeCeilings`) | nostro (il mondo ne ha bisogno; sotto i tetti la corsa non cambia) |
| gli errori | un programma che non regge non si carica | come l'originale con `strict`; senza (lo Scultore) ripara ciò che è chiaro: `values` con spazi o doppi, lettere non dichiarate, pattern irregolari completati con `*` | nostro (per i modelli dell'IA) |

### 3.2 I rami: `sequence`, `markov`, la corsa

Le otto differenze di T498, che il riferimento riproduce tutte (§ 2.3): il ramo che comincia tiene il turno (`d4`); un ramo che finisce
rende il turno con un passo vuoto e ricomincia da capo, e chi l'ha chiamato gli chiede di nuovo, quindi ogni `sequence` o `markov` che non è
la radice si ripete finché, dal suo inizio, trova da fare (`d3`, `d5`); un `markov` riparte dal primo figlio a ogni passo e i passi dei figli
valgono per tutto il ciclo (`d1`, `d1b`); `<markov><sequence>` è «rifai il corpo finché un giro intero non trova niente» (`d2`). **Allineate**
dal T528 con l'interruttore acceso ([ADR-0272](../adr/0272-i-rami-dell-originale.md): `OriginalBranch`, il turno in `current.branch`). In più:

| | l'originale | il nostro | stato |
|---|---|---|---|
| la fine della corsa dopo una `map` o una `wfc` | la `map` e la `wfc` non hanno genitore: quando i loro nodi finiscono, la corsa è finita, e ciò che viene dopo nel ramo non gira | la `map` è il primo figlio di una sequenza col suo resto, e dopo si va avanti | **diverso** (`c2`; 1 programma del seme, 1 del laboratorio e 49 degli universi hanno nodi dopo una `map`). **Allineato** dal T528 con l'interruttore acceso: la sequenza di una `map` col segno `grid`, quella di una `wfc` col suo `gated`, una `map` o una `wfc` senza nodi un ramo a sé; un'onda senza soluzione tiene il turno, come nell'originale |
| il passo della `map` | uno | uno | uguale |
| la radice che non è un ramo | un `markov` con lei dentro | lei | uguale nel risultato |

### 3.3 I nodi di regola: `one`, `all`, `prl`

| | l'originale | il nostro | stato |
|---|---|---|---|
| la corrispondenza | dove l'ingresso combacia, anche se l'uscita non cambia niente | solo dove la regola cambia qualcosa (fuori dall'inferenza) | **diverso** (`d7`, `d8`: una `prl` che non cambia niente non finisce mai; 9 programmi del seme, 1 del laboratorio e 16 degli universi hanno una regola che non cambia niente, e mxgmn ne usa 3, come passo vuoto: Division, Rosettes). **Allineato** dal T527 con l'interruttore acceso |
| la lista | pigra: la prima scansione per regola e per spostamento, poi in coda ciò che i cambi fanno nascere (`matchMask` contro i doppi), le vecchie scartate quando si pescano | un insieme tenuto aggiornato a ogni scrittura (ADR-0142), nell'ordine della nostra scansione | **diverso** (l'ordine). **Allineato** dal T527 con l'interruttore acceso (`OriginalList`, ADR-0268) |
| `one` | una corrispondenza a caso, uniforme; `p` non conta | uniforme, o pesata da `p` se le regole hanno `p` diversi | **diverso** (`d9`; `p` nelle regole di una `one`: 12 programmi del seme, 7 del laboratorio, 24 degli universi). **Allineato** dal T527 con l'interruttore acceso (risposta 4: `p` non si legge) |
| `all` | le corrispondenze in un ordine a caso, ognuna se le celle che scrive non sono già state scritte in questo passo; l'ingresso non si ricontrolla; ogni cella scritta va nella lista dei cambi, anche se non cambia | lo stesso, col nostro mescolamento | uguale nel senso, diverso nel caso. **Allineato** dal T527 con l'interruttore acceso (il mescolamento «dall'interno») |
| `prl` | ogni corrispondenza con probabilità `p` (`NextDouble() > p` la salta), sulla griglia di prima; scrive solo dove il valore cambia rispetto a com'era, quindi una regola che scriverebbe il valore di prima non copre quella che lo cambia | decide prima e scrive dopo, una sopra l'altra nell'ordine delle corrispondenze | **diverso** (`c10`). **Allineato** dal T527 con l'interruttore acceso |
| `prl` e i passi | un giro in cui non applica niente conta fra i suoi `steps` | non conta | **diverso** (`d6`, `d6b`). **Allineato** dal T527 con l'interruttore acceso (`d6`; `d6b` dal T528, coi rami) |
| `p="0"` | non applica mai | vale 1 | **diverso** (`d10`; 4 programmi di sidera). **Allineato** dal T527 con l'interruttore acceso |
| `steps` | al più tanti passi, contati dall'ultimo `Reset` (che i rami dell'originale fanno a ogni fine) | contati dall'ultima volta che il ramo riparte (i nostri rami) | diverso con i rami (§ 3.2). **Allineato** dal T528 con l'interruttore acceso: i figli ripartono solo quando il loro ramo finisce |
| `<rule symmetry>`, `in`/`out` della stessa misura | come da noi | come da noi | uguale |
| `fin`, `fout`, `file`, `legend` | un'immagine o un `.vox` con la sua legenda | un file di testo di `models/` con le lettere | uguale (testo, regola 11; `legend` ignorata con un avviso) |
| `[AB]` negli ingressi, `#12`, `<in>`/`<out>` figli | — | sì | nostri |

### 3.4 L'inferenza: `field`, `temperature`, `observe`, `search`

Le formule sono quelle dell'originale da T334 (`src/mj/infer.ts`): il potenziale per valore, `DeltaPointwise`, la chiave `−h + 0,001·u` o
`u^exp((h − h₀)/T)`, i potenziali all'indietro dal futuro. Le differenze:

| | l'originale | il nostro | stato |
|---|---|---|---|
| `all` con i campi che non applica niente | conta il passo | si ferma subito | diverso |
| una corrispondenza senza euristica in una `all` con i campi | la sua marca resta: non torna mai più nella lista (una stranezza) | torna | diverso |
| l'osservazione riscrive il presente (`from`) | senza metterlo nella lista dei cambi | con `write`, nella lista | diverso |
| `search` | solo in 2D (combacia ignorando z), 1 tentativo senza `limit`, 20 con, senza tetti | in 3D, coi tetti di stati, byte e tempo (ADR-0173) | nostro in 3D; l'ordine della coda con priorità (`PriorityQueue` di .NET, rumore 10⁻⁴) non è ancora tradotto né provato |

### 3.5 `map`, `path`, `convolution`, `convchain`

| | l'originale | il nostro | stato |
|---|---|---|---|
| `map scale` | tre interi o frazioni, la griglia nuova `M·N/D` | lo stesso | uguale |
| `map` e la griglia nuova | vuota; le regole leggono la vecchia girando attorno ai bordi e scrivono a `x·N/D` | lo stesso; in più `clear="False"` tiene la vecchia, ogni cella un blocco di sé | uguale; `clear` nostro |
| `path`: la partenza | il `from` più vicino all'arrivo (`longest`: il più lontano), con un rumore di 0,1 solo fra i pari | uno a caso fra quelli raggiunti (`longest`: uno a caso fra i più lontani) | **diverso** (`c3`) |
| `path`: le direzioni | candidate in ordine −x, +x, −y, +y, −z, +z, una a caso fra quelle che scendono; `inertia` tiene la direzione se scende | +x, −x, +y, −y, +z, −z | diverso nel caso |
| `path`: `edges`, `vertices` | anche per spigoli e vertici (con `inertia` il coseno più vicino, col rumore) | solo per facce, con un avviso | **manca** (`c11`; ModernHouse, CarmaTower) |
| `path`: `color` | se manca, il primo simbolo di `from` | obbligatorio | **diverso** (`c4`) |
| `path`: quando riesce | ogni volta che c'è una via, anche se non disegna niente (un sentiero già fatto): in una sequenza può non finire mai | solo se cambia qualcosa; `steps` (nostro) | diverso (`c4` non finisce nell'originale) |
| `convolution`: i passi | `steps` quanti ne dice (senza: finché cambia) | al più 30, e 200 senza `steps` | **diverso** (`c5`) |
| `convolution`: i vicinati | in 2D `VonNeumann` e `Moore`, in 3D `VonNeumann` e `NoCorners`; `Moore` in 3D è un errore | `moore`, `vonneumann`, `nocorners` sempre (in 3D `Moore` sono 26 vicini) | **diverso** (`c6`) |
| `convolution` su una griglia piana e `periodic` | i vicini del piano | i 26 del cubo, i tre strati sullo stesso: ogni vicino contato tre volte | **diverso** (`c9`, un difetto nostro) |
| `convolution` e la lista dei cambi | ciò che scrive non va nella lista: un nodo di regole che aveva già cercato non lo vede | lo vede | **diverso** (`c7`; sui modelli di mxgmn misurati non conta, § 2.3) |
| `convolution`: `p` | `Next() < p · (2³¹−1)`, tirato solo se `p` ≠ 1 | `next() < p`, solo se `p` < 1 | diverso nel caso |
| `convchain` | solo su una griglia piana (in 3D è un errore); il campione un'immagine; ciò che scrive non va nella lista dei cambi | lo stesso algoritmo e gli stessi tiri; su più strati, strato per strato (ADR-0240); il campione testo o `<sample>` | uguale in 2D salvo la lista; nostro in 3D |

### 3.6 `wfc`

| | l'originale | il nostro | stato |
|---|---|---|---|
| le tessere, i motivi, il propagatore, le simmetrie | `TileModel`, `OverlapModel`, `SymmetryHelper` | lo stesso, dal T335 (`src/mj/wfc.ts`), nell'ordine dell'originale | uguale (testo invece di `.vox` e immagini) |
| i passi | il primo cerca un seme buono (fino a `tries`, ognuno un `Next()`) e svuota la griglia nuova; poi **un'osservazione per passo**; poi i nodi dentro, sulla griglia nuova; poi la corsa è finita | tutta l'onda in un passo, poi i nodi dentro, poi si va avanti | **diverso** (i passi: Surface 509 contro 1, un `it.fails`; la fine della corsa come la `map`, § 3.2) |
| la contraddizione | guarda solo la cella 0 | ogni cella | diverso in casi rari |
| la `wfc` a sovrapposizione: i pesi | conta le finestre del campione sulla misura della griglia d'uscita, non del campione (una stranezza: su una griglia più piccola del campione delle finestre non le vede) | sulla misura del campione | diverso (solo in 2D) |

### 3.7 Che cosa dei nostri programmi l'originale non ha, o legge altrimenti

Il censimento (`--censimento`, statico: legge l'XML) sul seme, sul laboratorio, sul forte dell'autore, sui cinque universi (solo i programmi
del Concilio, non le copie del seme) e, per confronto, sui 159 modelli di mxgmn:

| | seme (94) | laboratorio (60) | forte | aurora (8) | mesa (48) | neapolis (69) | orichalcum (69) | sidera (70) | mxgmn (159) |
|---|---|---|---|---|---|---|---|---|---|
| forme (`box`, `cylinder`…) | 74 | 53 | 0 | 8 | 46 | 52 | 54 | 54 | 0 |
| `[..]` negli ingressi | 40 | 5 | 1 | 0 | 14 | 28 | 27 | 25 | 0 |
| simboli `#N` | 38 | 12 | 1 | 2 | 12 | 23 | 26 | 16 | 0 |
| più di 31 valori | 28 | 11 | 1 | 1 | 2 | 17 | 20 | 14 | 0 |
| `origin="bottom"`, `soil` | 20, 13 | 2, 0 | 1, 0 | 0 | 2 | 17 | 15-17 | 16 | 0 |
| `ground` | 11 | 2 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| `import` | 0 | 1 | 0 | 0 | 2 | 17 | 14 | 16 | 0 |
| `sequence` dentro `map` | 0 | 0 | 0 | 0 | 2 | 17 | 14 | 16 | 2 |
| nodi dopo una `map` | 1 | 1 | 0 | 0 | 2 | 17 | 14 | 16 | 0 |
| `markov` con dentro una `sequence` | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 8 |
| `p` nelle regole di una `one` | 12 | 7 | 0 | 1 | 3 | 5 | 1 | 14 | 0 |
| una regola che non cambia niente | 9 | 1 | 0 | 1 | 1 | 4 | 2 | 8 | 3 |
| `p="0"` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| `optional`, `path steps`, `<in>`/`<out>` figli | 7, 1, 0 | 7, 2, 2 | 0, 1, 0 | 1, 0, 0 | 0, 0, 1 | 0 | 0 | 0 | 0 |
| animazioni, azioni, capi indossati; `<color>` con `part`, `hidden`, `glow`, `alpha`, `area` | 35; 90 | 20; 41 | 0; 1 | 1; 5 | 1; 23 | 5; 50 | 4; 47 | 5; 65 | 0 |

### 3.8 L'esportazione: i nostri in più, come si traducono o si tolgono

Un programma nostro diventa un programma dell'originale (l'XML, i file di `resources/` e una riga di `models.xml`) con una traslitterazione:

| nostro | nell'originale |
|---|---|
| `#N`, un simbolo qualsiasi | un carattere libero (l'originale accetta ogni carattere): una tabella simbolo → carattere; oltre 31 valori per griglia **non si esporta** |
| `[AB]` in un ingresso | un'`<union>` con un simbolo libero, sulla radice della griglia |
| un'unione dentro un nodo | spostata sulla radice della sua griglia |
| `<in>`/`<out>` figli, `<sample>` di un `convchain`, `fin`/`fout`/`file` di testo | attributi; il campione e i file di regole riscritti come immagini o `.vox` (lo strumento dell'esportazione, non il gioco) |
| `<import>` | il programma incluso scritto al suo posto (i suoi valori e le sue unioni uniti a quelli della griglia, entro 31) |
| `<pieces>` | i suoi figli al suo posto (col margine giusto è la stessa griglia, ADR-0178) |
| `map clear="False"` | una regola per valore che scrive un blocco di sé (solo scale intere) |
| `size` | la riga di `models.xml` (`length`, `width`, `height`) |
| `ground`, `soil`, `origin="bottom"`, `under` | **non si esporta nel solo XML**: l'originale non ha una griglia di partenza fuori da `origin`; con un `Program.cs` come quello del banco sì |
| forme (`box`, `ellipsoid`, `cylinder`, `cone`, `line`) | **non si esportano**: l'originale non ha coordinate assolute |
| `convchain` su più strati, `search` in 3D, `path steps`, `optional` | non si esportano / si tolgono |
| `<color>` | la sua riga `<color symbol value>` in `models.xml`; `part`, `hidden`, `glow`, `alpha`, `area` si tolgono |
| `<animation>`, `<action>`, `<sound>`, `<worn>`, `vpt`, `name` | si tolgono (sono del gioco) |

Oggi un programma del Concilio usa quasi sempre forme o `#N`: l'esportazione esatta vale per ciò che si scrive dopo l'allineamento senza
forme (i prompt, § 5).

## 4. I modelli del repository: oggi e dopo

**La licenza**: MIT, © 2022 Maxim Gumin: si copiano e si modificano con l'avviso (`lab/banco/conformita/mxgmn/LICENSE`, come
`lab/mjx/official/riferimento/LICENSE`). Un esempio nei prompt porta una riga di attribuzione.

**Oggi** (`--modelli`, 3 semi; le tabelle in [`misure.md`](../../lab/banco/conformita/misure.md)): dei 36 modelli 3D il nostro motore ne fa
girare 29, dalla copia del laboratorio (`lab/mjx/official/`): ModernHouse e SeaVilla solo perché la copia è stata portata ai simboli del
contratto 0.6 (il testo dell'originale non compila: `8`, `6`, `#`); ClosedSurface non ha la copia, sei leggono risorse da portare in testo.
Le quote delle lettere che scrivono (la distanza di variazione totale fra la nostra media e quella del riferimento, accanto a quanto si
allontana dalla sua media un seme del riferimento) sono nella varianza naturale tranne **StrangeDungeon** (0,165 contro 0,005: il `d="2"`
che saltiamo) e SeaVilla (0,038 contro 0,007); i passi sono altri (un modello di sola `wfc` ne fa 1-4 invece di 75-540); nessuna griglia è quella
dell'originale. **ModernHouse** dice quanto conti la fine della corsa: nell'originale, coi semi 1 e 3, la seconda `wfc` non trova una
soluzione, la corsa finisce coi nodi della `map` che la contiene e la griglia resta quella grossa (17 × 17 × 4, 112 e 140 passi); col 2
arriva alla casa intera; da noi la casa arriva sempre in fondo (51 × 51 × 24). Dal T531 (A1-6) tutti e 36 si compilano dal loro testo (`original`) e girano nel nostro motore, senza la copia del laboratorio. **Dopo** l'allineamento:
36 su 36, voxel per voxel (30 già provati sul riferimento, 6 quando le risorse saranno in testo).

**Come esempi per gli Scultori** (`examplesFor`, T467): oggi due esempi per richiesta, un modello scritto a mano della classe e il migliore
dell'universo con voto ≥ 6, entro `EXAMPLE_CHARS` (12 000 caratteri, circa 5 000 token); le strutture che crescono a regole non ne hanno
(compongono dal concetto). I modelli 3D di mxgmn sono piccoli (Growth 50 caratteri, Hills 316, River 483, Keys 764, OddScale3D 1 086,
StairsPath 1 334, Apartemazements 2 397) tranne i tre architettonici (CarmaTower 16 749, SeaVilla 19 959, ModernHouse 30 653, più le loro
risorse). Proposta (domanda 7): una terza fonte, «un modello di mxgmn del mestiere», scelta senza chiamate e fissa per la cache:

| mestiere | modelli di mxgmn | perché |
|---|---|---|
| Paesaggista | Hills (prl, one, convolution), River (one, all), OpenCave3D, Voronoi, Noise, SoftPath (field) | terreni che crescono, erosione, acqua, caverne |
| Capomastro, Architetto | un estratto commentato di ModernHouse e SeaVilla (le parti che crescono: la partizione, le colonne, i ponti e le scale con `markov` e `path`), entro 2-3 000 token, nella sezione del mestiere e non come esempio intero; Apartemazements e PillarsOfEternity come esempi di `wfc` | gli unici modelli di edifici dell'originale sono troppo lunghi interi |
| Mobiliere, Figurinista, Sarto, Carrozziere | nessuno: l'originale non ha mobili, figure, capi né mezzi | |

Gli esempi entrano solo dopo l'allineamento (prima insegnerebbero una semantica che il motore non ha) e dopo la misura dei token
(`lab/scripts/prompt-tokens.ts -- --scultore --conta`).

## 5. La varianza

`--varianza`, 6 semi per programma, alla scatola del gioco (i nostri) o di models.xml (mxgmn); per ogni coppia di semi la **forma** (i voxel
pieni in un seme e vuoti nell'altro, sui pieni in almeno uno) e le **lettere** (le celle piene in almeno uno con un'altra lettera); la
mediana delle coppie; statico sotto 0,01 di forma (la soglia di `lab/banco/varianza.ts`, T180).

| dove | programmi | forma: mediana | statici | lettere: mediana |
|---|---|---|---|---|
| seme | 94 | 0,062 | 46 | 0,180 |
| forte dell'autore | 1 | 0,915 | 0 | 0,955 |
| i cinque universi, i programmi del Concilio | 264 | 0,033 | 115 | 0,058 |
| (aurora, mesa, neapolis, orichalcum, sidera) | 8, 48, 69, 69, 70 | 0,003, 0,000, 0,031, 0,043, 0,128 | 6, 30, 30, 29, 20 | |
| mxgmn nell'originale (il riferimento) | 30 | 0,547 | 5 | 0,612 |
| mxgmn nel nostro motore | 29 | come nell'originale, modello per modello (Growth 0,484 e 0,467, Keys 0,582 e 0,584, Apartemazements 0,585 e 0,585, Escher 0,753 e 0,750; solo ModernHouse 0,22 e 0,47) | | |

Con i costrutti (tutti i programmi misurati):

| | programmi | forma: mediana | statici |
|---|---|---|---|
| nostri con le forme | 288 | 0,004 | 153 |
| nostri senza forme | 71 | 0,183 | 8 |
| nostri senza `one`, `prl` a moneta, `path`, `wfc`, `convchain` | 91 | 0,000 | 91 |
| con `one` / senza | 241 / 148 | 0,212 / 0,000 | |
| con `wfc` / con `field` / con `path` | 11 / 6 / 5 | 0,753 / 0,412 / 0,217 | 0 / 0 / 1 |

**La risposta all'ipotesi dell'autore.** No, la bassa varianza dei modelli dell'IA non viene dal motore: gli stessi programmi variano nei due
motori quasi uguale (i 29 modelli di mxgmn che girano nei due), e i nostri variano poco perché sono scritti con le forme (coordinate assolute, che non tirano a
caso) e con regole che non scelgono (`all` e `prl` senza moneta). La varianza la danno la crescita scelta a caso (`one`), le monete (`prl` con
`p`), `path` (le partenze e le direzioni), `wfc` (0,75 di mediana), `field` con `temperature`. L'allineamento serve per altro (gli esempi,
l'esportazione, ciò che i modelli conoscono di MarkovJunior); la varianza si guadagna coi prompt e con un controllo (domanda 6).

**`path` in un modello nostro**: `lab/banco/conformita/esempi/borgo-sentieri.xml`, scritto per i due motori. La piazza al centro, dieci case
con la porta, poi un ciclo: «la porta che tocca la rete si segna; se non ce n'è, `path` porta un sentiero dalla porta più vicina alla piazza
o a un sentiero già fatto, sul prato, andando dritto finché può»:

```xml
<markov>
  <one in="DW" out="dW"/>
  <one in="DS" out="dS"/>
  <path from="D" to="SW" on="B" color="W" inertia="True"/>
</markov>
```

Nell'originale e nel riferimento la stessa griglia su 3 semi (33 passi), da noi le stesse dieci porte collegate con un altro albero di
sentieri; il ciclo finisce perché il primo figlio toglie dalle partenze la porta appena collegata (senza, `path` ridisegnerebbe per sempre
nell'originale: `c4`). È l'idioma che un Architetto userebbe sul piano grossolano di un borgo o di un forte (le vie fra le porte, i camminamenti),
prima della `map` ai voxel.

## 6. La migrazione

### 6.1 Che cosa cambia

Col generatore e l'ordine dell'originale **cambia la griglia di ogni programma che tira a caso**, anche dove il senso è lo stesso (§ 2.2):
l'ADR-0142 («voxel per voxel identico») vale dentro un contratto, non attraverso questo. È un **contratto nuovo, 0.11** (cambia il senso delle
primitive e il caso): un universo di prima o si porta (con una migrazione in `src/kernel/migrations.ts`) o resta in sola lettura (ADR-0156).
Nessuna riscrittura dà la griglia di prima; si può tenere il **senso** di un programma (ciò che il suo autore voleva), e poi rivalidarlo.

### 6.2 Le riscritture automatiche (il senso di oggi nella semantica dell'originale)

| ciò che c'è oggi | perché cambia | la riscrittura | quanti (seme, laboratorio, universi) |
|---|---|---|---|
| una `sequence` dentro una `map` o una `sequence`, per cambiare la simmetria | l'originale la ripete finché trova | togliere la `sequence`, la sua `symmetry` su ognuno dei suoi figli | 0, 0, 49 |
| nodi dopo una `map` (o una `wfc`) nello stesso ramo | l'originale non li esegue | portarli dentro la `map`, in fondo (sulla griglia nuova, che è quella su cui giravano già) | 1, 1, 49 |
| una regola che non cambia niente | da noi non combacia mai; nell'originale è un passo vuoto, o in una `prl` un ciclo senza fine | toglierla (e il nodo rimasto senza regole) | 9, 1, 16 |
| `p` nelle regole di una `one` | l'originale non lo legge | togliere `p` e accettare la scelta uniforme, o la domanda 4 | 12, 7, 24 |
| `p="0"` | da noi vale 1, nell'originale mai | `p="1"` (ciò che fa oggi) | 0, 0, 4 |
| `d="2"` | l'originale lo esegue | toglierlo in 3D | 0, 0, 0 |
| `convolution steps` oltre 30, o senza | da noi si ferma a 30 o 200 | `steps` = ciò che fa oggi | da contare nella migrazione (nessuno oltre 30 nel censimento) |
| `convolution` con `Moore` in 3D | l'originale non la carica | `NoCorners` (18 vicini) o tenerla come nostra | da contare |
| un'unione dentro un nodo | l'originale non la trova | spostarla sulla radice della griglia | 0 |

### 6.3 Ciò che va riscritto a mano

- **I cicli** (`markov` con dentro una `sequence`): `circuito-3D` e `part-wheel` del seme, i 27 del laboratorio di T498, il forte
  dell'autore. Il senso di oggi («a ogni passo il primo che può», «una sequenza che tiene il posto») nell'originale non ha una forma
  diretta. Il forte: i cicli 1-3 danno lo stesso risultato (T498); **i piani a moneta** vanno riscritti con l'idioma dell'originale, dove
  ogni nodo del corpo del piano dipende da un segno che solo la moneta rimette (domanda 5):
  ```xml
  <sequence>                          <!-- dentro un ramo: l'originale lo ripete finché un giro trova da fare -->
    <one in="M" out="N" steps="1"/>   <!-- c'è un piano da fare: il segno M diventa N -->
    … il piano, ogni regola che legge N …
    <prl in="N" out="M" p="0.5"/>     <!-- testa: un altro piano -->
    <all in="N" out="E"/>             <!-- croce: il segno finisce, e al giro dopo nessuno trova niente -->
  </sequence>
  ```
- **I programmi del Concilio che non finissero** dopo le riscritture automatiche (T498 ne contava 21 su 64 col solo flusso dei rami; le
  riscritture del § 6.2 ne tolgono la causa principale, le `sequence` nelle `map`): li dice la rivalidazione, e tornano allo Scultore.

### 6.4 Le carte, le parti, il validatore

- **Le carte fatte a mano** (`universes/.handmade/`): la stessa funzione della migrazione quando si leggono, come `portedProgram` per il
  contratto 0.6; il giocatore vede la carta nuova e il motivo.
- **Le carte portate** (ADR-0170) e i modelli dei cloni: si portano con il loro universo.
- **Le parti del mondo** (ADR-0243): una parte si prende solo se dà la stessa griglia su ogni seme del mondo (`sameGridErrors`); col caso
  nuovo le griglie cambiano, quindi ogni parte si riprova e quelle che non reggono si tolgono (con chi le include riscritto senza `<import>`).
- **Il validatore e i controlli dello Scultore**: nella semantica dell'originale non finire diventa facile (un ramo annidato che ritrova
  sempre qualcosa, una regola che non cambia niente in una `prl`, `path` che ridisegna). Il validatore fa già girare i programmi sulle bozze
  col tempo contato; servono il motivo giusto nell'errore («la sequenza dentro la map si ripete: …») e avvisi statici (le regole che non
  cambiano niente, `path` senza un nodo che tolga le partenze, una `sequence` annidata senza un segno che la fermi).

## 7. Come si fa

1. **Un interruttore, non due motori.** Il motore allineato nasce dentro `src/mj/engine.ts` dietro un interruttore della corsa
   (`semantics: 'mj'`, deciso dal compilatore per il contratto dell'universo, o dalla prova), spento per ogni programma di oggi: ogni task
   della catena allinea una famiglia di nodi, gira i suoi `it.fails` di `tests/mj-conformita.test.ts` (e di `tests/mj-markov-originale.test.ts`)
   in `it` sotto l'interruttore, e non cambia una griglia di oggi (ADR-0142 regge fino alla fine). L'ultimo task accende l'interruttore per il
   contratto 0.11 con la migrazione; il flusso di prima si toglie dopo, quando nessun universo lo usa più (domanda 3).
2. **Il riferimento è il modello e l'oracolo.** Ogni nodo allineato si scrive guardando `riferimento.ts` (è già l'algoritmo dell'originale
   in TypeScript) e si prova contro di lui e contro `uscite.json`: i 30 modelli voxel per voxel su 3 semi a ogni task che tocca il motore.
3. **Le estensioni restano** (forme, `pieces`, `import`, `#N`, `[..]`, `ground`/`soil`, `clear`, i tetti del mondo, `Stepper`, la traccia):
   dentro la semantica dell'originale, dove l'originale non dice niente.
4. **Le prestazioni**: l'algoritmo dell'originale è già incrementale (gli spostamenti per valore, la lista dei cambi); il censimento per righe
   (ADR-0142) si tiene solo dove non cambia l'ordine. Si misura sul seme e sugli universi (`lab/scripts/misura-mj.ts`).
5. **L'esportazione** è una funzione pura (`src/mj/export.ts`), provata così: il programma esportato fatto girare nel riferimento dà la
   griglia del motore allineato.

## 8. La catena dei task

Ogni task tocca il motore dietro l'interruttore (tranne quelli detti), lascia invariate le griglie di oggi fino alla migrazione (A1-8), e chiude con i
suoi test di conformità girati da `it.fails` a `it`. Le stime sono nella scala del backlog.

| | task | provider · sforzo · stima | dipende da | i test che fissano l'originale |
|---|---|---|---|---|
| A1-0 | **Le risorse che mancano in testo**: `Knots3D` per cartella (`tiles="Knots3D/Tubes"`, `/3`, `/4`), le regole di `CarmaTower` e `DualRetraction`, la copia di `ClosedSurface`; `tiles` con la barra nel compilatore | hydrogen · medium · 2% | — | il riferimento legge i 6 modelli e dà ciò che `uscite.json` tiene già del C# (`--modelli --originale`); il loro testo è già in `mxgmn/` |
| A1-1 | **L'interruttore e il generatore**: `semantics` nella corsa e nel compilatore (spento), `System.Random` in `src/` (da `dotnet-random.ts`), il motore tira dove l'originale tira; l'ADR della scelta A1 e del criterio; il riferimento nei test resta l'oracolo | claude · high · 4% | risposte a T500 | `System.Random` contro `uscite.json`; con l'interruttore spento le griglie di oggi invariate (`tests/mj-engine-determinism.test.ts`) |
| A1-2 | **Le regole e le corrispondenze dell'originale**: le varianti nell'ordine di `SymmetryHelper` (i sottogruppi del quadrato in 2D, del cubo in 3D), la corrispondenza dove l'ingresso combacia, la lista pigra (scansione a passo con gli spostamenti, la coda dai cambi, `matchMask`), `one` uniforme senza `p`, `all` col mescolamento dall'interno, `prl` con `NextDouble`, la nuova griglia e i giri vuoti, `p="0"` | claude · max · 8% | A1-1 | `d6`-`d10`, `c10`; Growth, MazeGrowth, RegularSAW, ParallelGrowth voxel per voxel |
| A1-3 | **I rami dell'originale**: il turno (`ip.current`), il passo vuoto di un ramo che finisce, il ricominciare, `markov` dal primo figlio coi passi per tutto il ciclo, la `map` e la `wfc` che chiudono la corsa, i passi contati come l'originale | claude · xhigh · 6% | A1-2 | `d1`-`d5`, `c2`; NoDeadEnds, RegularSAWRestart, Noise, River, StrangeDungeon |
| A1-4 | **`map`, `path`, `convolution`, `convchain` dell'originale**: `path` dal più vicino col suo generatore, le direzioni, `edges`/`vertices`, `color` di `from`, riesce anche senza disegnare; `convolution` senza tetto di passi, i vicinati per dimensione, la lista dei cambi, `p`; `convchain` e la lista; `d` ignorato | claude · xhigh · 6% | A1-3 | `c1`, `c3`-`c7`, `c9`, `c11`; Hills, OpenCave3D, Counting, OddScale3D, Voronoi, StochasticVoronoi |
| A1-5 | **`wfc` e inferenza dell'originale**: un'osservazione per passo, la contraddizione sulla cella 0, i pesi della sovrapposizione, la `all` coi campi, l'osservazione fuori dalla lista; `search` tradotta nel riferimento (la coda con priorità) e allineata in 2D, la nostra in 3D come estensione | claude · max · 7% | A1-4 | i passi di Surface; i modelli con `wfc` (Apartemazements, Escher, Surface, PillarsOfEternity, Partitioning…), Keys, SoftPath, StairsPath, ModernHouse, SeaVilla; i modelli 2D con `search` del repository |
| A1-6 | **Il compilatore legge l'originale così com'è**: le cifre e `#` come simboli dove l'originale li usa (la traslitterazione all'ingresso, come `programFor0_6`), le unioni come l'originale (e le nostre ovunque come estensione), `(x)(y)` e `(xy+)`, gli errori dell'originale in `strict` | claude · high · 4% | A1-1 | i 36 modelli dal loro testo (`mxgmn/`), `c8` |
| A1-7 | **Le prestazioni del motore allineato**: misure sul seme, sugli universi e sui modelli di mxgmn (tempo, memoria), il censimento per righe dove tiene l'ordine, `Stepper` e le luci del sito, i tempi delle forme (`MODEL_TIME`) | claude · xhigh · 5% | A1-5 | nessun test nuovo di conformità; tetti di tempo nei test delle forme |
| A1-8 | **La migrazione 0.10 → 0.11** (non dietro l'interruttore: lo accende): le riscritture del § 6.2 in `migrations.ts`, pure e idempotenti; il forte dell'autore riscritto coi piani a segno (domanda 5); la rivalidazione di ogni programma dei cinque universi, delle carte fatte a mano e delle parti del mondo; contratto 0.11.0, ADR, `AGENTS.md`; i programmi che non reggono in un rapporto (`world/shortfalls.json`) | claude · max · 9% | A1-5, A1-6, A1-7, risposte 3-5 | ogni `it.fails` di conformità diventa `it`; i 36 modelli voxel per voxel; la migrazione voxel per voxel sui programmi che non tirano a caso |
| A1-9 | **Il validatore e i controlli dello Scultore**: i motivi dei programmi che non finiscono, gli avvisi statici (regole che non cambiano niente, `path` che ridisegna, `sequence` annidate senza segno), i tetti del mondo per la `wfc` a passi | claude · high · 4% | A1-8 | i casi che non finiscono di T498 e `c4` danno il motivo giusto |
| A1-10 | **I prompt**: il nucleo e l'Architetto con la semantica dell'originale (i rami, la `map` che chiude, i cicli col segno), le forme come ancore e non come corpo, la crescita che varia (`one`, `prl` a moneta, `path`, `wfc`); la misura `prompt-tokens --scultore --conta` | claude · high · 5% | A1-8 | i test degli idiomi del prompt (`tests/sculptor-architect-guide.test.ts`) girati sul motore allineato |
| A1-11 | **I modelli di mxgmn come esempi**: la terza fonte di `examplesFor` per mestiere, l'estratto commentato per l'Architetto, l'attribuzione, i token | claude · high · 4% | A1-0, A1-10, domanda 7 | gli esempi compilano e girano nel motore allineato voxel per voxel come nell'originale |
| A1-12 | **Il controllo della varianza**: due semi a confronto nei controlli dello Scultore per le classi che devono variare (un avviso sotto la soglia, poi un errore se l'autore vuole) | claude · high · 3% | A1-10, domanda 6 | — |
| A1-13 | **L'esportazione**: `src/mj/export.ts` (la tabella del § 3.8), il testo, le risorse e la riga di `models.xml`; dove si offre (laboratorio, editor, sito) | claude · high · 6% | A1-8 | ogni programma esportabile del seme e dei test: l'esportato nel riferimento = il nostro motore |
| A1-14 | **La varianza, dopo**: la stessa misura di questo task sul motore allineato e, con l'autore, una prova pagata degli Scultori coi prompt nuovi | claude · high · 3% (più la prova pagata) | A1-11, A1-12 | — |

**A1-3 è fatto** (T528, [ADR-0272](../adr/0272-i-rami-dell-originale.md)): con l'interruttore acceso sequenze e `markov` sono il `Branch`
dell'originale (`OriginalBranch` in `src/mj/engine.ts`): il ramo al lavoro ha il turno (`current.branch`, `ip.current`) e la corsa chiede lui,
non la radice; un ramo che non trova niente rende il turno al padre con un passo vuoto e ricomincia coi figli, che ripartono solo allora
(i loro `steps` valgono finché il ramo dura); un `markov` chiede dal primo figlio a ogni passo; la sequenza di una `map` (il segno `grid` del
compilatore) e quella di una `wfc` sono rami senza padre, e così una `map` o una `wfc` senza nodi: quando i loro nodi finiscono la corsa è
finita (`c2`); un'onda senza soluzione tiene il turno e, chiesta di nuovo, riprova (`WFCNode.Go`). Lo `Stepper` e i pezzi fanno i turni dei rami.
`d1`-`d5`, `d6b`, `c2` e RegularSAWRestart, Keys, OddScale3D sono voxel per voxel l'originale (`it`), e così i quattro cicli del forte dell'autore
come piccoli programmi (`l1`-`l4`, i 400 semi di `originale.json`) e i piani del forte: **19 modelli su 36**. StrangeDungeon tolti i `d` (A1-4)
è già l'originale; CarmaTower col seme 1. Restano ad A1-4 `d` e `path` (un nostro `path` dentro un `markov` che riesce sempre allunga la
corsa: SeaVilla col seme 3), ad A1-5 la `wfc` a passi.

**A1-2 è fatto** (T527, [ADR-0268](../adr/0268-le-regole-e-le-corrispondenze-dell-originale.md)): con l'interruttore acceso i nodi di regola sono
quelli dell'originale (`RuleRunner` e `GuidedRunner` sotto `mj`): le varianti nell'ordine di `SymmetryHelper` coi sottogruppi del quadrato
sulla griglia piana e del cubo sulle altre (`originalTurns`, anche per le regole di una `map`), la corrispondenza dove l'ingresso combacia, la
lista pigra (`OriginalList`: la scansione al passo con gli spostamenti, la coda dai cambi dal turno in cui il nodo ha combaciato, le marche),
`one` uniforme senza `p`, `all` col mescolamento dall'interno e ogni cella scritta nel registro, `prl` con un `NextDouble` per corrispondenza
sulla griglia di prima, i giri vuoti e `p="0"`, e ogni turno un passo (anche l'ultimo della radice). `d6`, `d7`, `d8`, `d9` (cinque semi),
`d10`, `c10` e Growth, MazeGrowth, RegularSAW, ParallelGrowth sono voxel per voxel l'originale (`it`); lo sono già anche Counting,
DualRetraction3D, Hills, MazeTrail, NoDeadEnds, Noise, OpenCave3D, River, SoftPath, StairsPath, StochasticVoronoi e Voronoi: 16 modelli su 36
(`tests/mj-conformita.test.ts`, `--modelli --mj`, [`misure.md`](../../lab/banco/conformita/misure.md)). Restano ai rami (A1-3) `d1`-`d5`, `d6b`,
Keys, RegularSAWRestart e OddScale3D (la stessa griglia, due passi in meno): il nostro `markov` fa ripartire i figli quando lavora l'ultimo.

**A1-6 è fatto** (T531, [ADR-0265](../adr/0265-il-testo-dell-originale.md)): `compileMjx(…, { original: true })` legge il testo dell'originale così com'è (`src/mj/original.ts`, anche i file che legge), con le unioni, i nomi delle simmetrie (`(x)(y)` e `(xy+)` anche nostri) e, con `strict`, gli errori dell'originale; i 36 modelli 3D si compilano dal loro testo e girano nel nostro motore, `c8` è un `it` (`tests/mj-original.test.ts`). Gli errori dei nodi (`Moore` in 3D, `path` senza `color`, `d`) restano ad A1-4.

**A1-1 è fatto** (T526, [ADR-0263](../adr/0263-la-semantica-dell-originale.md)): `Semantics` `ours|mj` e `SystemRandom` in `src/mj/random.ts`, `compileMjx(…, { semantics })`, `RunOptions.semantics`, `runSemantics()`; con `mj` la corsa tira da `System.Random` e i generatori propri (la `wfc`, la `search`, i `pieces`) da un `Next()`; `path` prende il suo con A1-4. Dove l'ordine è già quello dell'originale (una regola su una riga) la griglia è già la sua (`tests/mj-random.test.ts`).

L'ordine: A1-0 subito (indipendente); A1-1 → A1-2 → A1-3 → A1-4 → A1-5 in fila (lo stesso file); A1-6 dopo A1-1, in parallelo ai nodi
se non tocca `engine.ts`; A1-7 dopo A1-5; A1-8 quando i nodi, il compilatore e le misure ci sono e l'autore ha risposto; poi A1-9 …
A1-14. In tutto circa il 76 % della scala, più la prova pagata.

## 9. Le domande per l'autore

In [`docs/pipeline/domande/T500.md`](../pipeline/domande/T500.md), ognuna col consiglio: (1) il criterio voxel per voxel; (2) le stranezze
dell'originale, riprodotte o corrette; (3) gli universi che esistono: portati al contratto 0.11 accettando che ogni modello cambi aspetto, o
lasciati sul flusso di prima; (4) `p` nella `one`; (5) il forte dell'autore coi piani a segno; (6) un controllo della varianza; (7) quali
modelli di mxgmn come esempi; (8) le nostre estensioni che l'originale non ha (le forme soprattutto): restano, e con che peso nei prompt.

## 10. Che cosa non è provato

- I 6 modelli 3D che leggono risorse non ancora in testo (Knots3D, ColoredKnots, SelectLongKnots, SubmergedKnots, CarmaTower,
  DualRetraction3D; ClosedSurface sì nel riferimento, ma non ha la copia del laboratorio): il C# li fa girare, il riferimento no.
- Il generatore e i modelli sono provati con .NET 6 (il `Program.cs` di T498); il repository di mxgmn oggi si costruisce col 10: il confronto
  `--caso` e `--modelli --originale` va rifatto quando il banco si costruirà col 10.
- `search` non è tradotta (l'ordine della coda con priorità di .NET); i 123 modelli 2D del repository non sono stati confrontati (solo i 3D, più i
  programmi delle differenze e il borgo, che sono piani e passano dalle simmetrie del quadrato); l'entropia di Shannon della `wfc` (solo 2D).
- La varianza del forte è su 6 semi, quella degli universi sui programmi che finiscono in 8 s; la «forma» non vede la varianza dei modelli
  che riempiono tutta la griglia (River, Voronoi: si legge nelle lettere).
- Le riscritture del § 6.2 sono contate, non fatte né fatte girare; quanti programmi del Concilio, riscritti, finiscano e passino i
  controlli lo dirà A1-8.
- Che gli Scultori, con la semantica dell'originale e gli esempi di mxgmn, scrivano programmi che variano di più: nessuna prova pagata qui.
- Dal T527: oltre i 2 milioni di scritture del registro della griglia (o dopo una `map`, una `wfc`, i `pieces`) la lista di un nodo si
  ritrova con una scansione, e lì una corsa con l'interruttore acceso lascia l'originale, che tiene ogni cambio; nessun modello misurato ci
  arriva. Le prestazioni con l'interruttore acceso sui programmi del gioco sono di A1-7 (sui modelli di mxgmn: come il motore di sempre,
  CarmaTower 3-6 s contro 3,2-3,7 s ma con più passi). Un'unione che vale tutti i valori della griglia e un `*` nella stessa regola sono per
  `Rule.Same` la stessa cella, per noi due (nessun modello misurato li ha).
- Dal T528: che un'onda senza soluzione tenga il turno e, chiesta di nuovo sulla griglia cambiata, riprovi (`WFCNode.Go`) segue la lettura
  del sorgente e del riferimento, ma non è stato fatto girare né nel C# né nel riferimento (che non legge i nostri tileset): nessun modello
  del repository misurato vi passa.
