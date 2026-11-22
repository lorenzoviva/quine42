# `<markov>` e `<sequence>`: il nostro motore contro l'originale, dal forte dell'autore (T498)

Data: 2026-11-22 · Step 44 · Richiesta: l'autore, D68.3 del 22/11 ([`docs/userchats/to-do-2026-11-22.md`](../userchats/to-do-2026-11-22.md),
con la copia del forte alle righe citate: [`forte-handmade-2026-11-22.xml`](../userchats/forte-handmade-2026-11-22.xml)) · Nasce da T469
(la guida del ciclo, `tests/mj-markov.test.ts`) e T473 (Argon non scrive mai il ciclo, 0/12) · Banco: [`lab/banco/markov/`](../../lab/banco/markov/README.md)
(programmi, ciò che stampa l'originale, misure) · Test: `tests/mj-markov-originale.test.ts` · Domanda: [`docs/pipeline/domande/T498.md`](../pipeline/domande/T498.md)

Il motore e i prompt non cambiano in questo task (kernel 0.10.22). L'originale non è stato letto soltanto: è stato **fatto girare**, il
repository di mxgmn al commit `42aaf24` (marzo 2026) compilato con .NET 6 e un `Program.cs` senza grafica che parte da una griglia data
([`lab/banco/markov/originale/`](../../lab/banco/markov/originale/Program.cs)). Ogni affermazione sull'originale sotto ha un programma che la
mostra e ciò che l'originale vi ha stampato.

## In breve

1. **L'autore ha ragione: nei cicli il nostro motore non è l'originale.** Le differenze sono quattro nel modo di girare i rami (`sequence`,
   `markov`) e quattro nei nodi di regola; ognuna ha un programma di poche celle, ciò che l'originale vi stampa e un test (§ 3).
2. **Dove un `<markov>` contiene solo regole senza `steps`, i due motori fanno la stessa cosa.** È il caso di 79 dei 93 cicli dei 159 modelli
   del repository di mxgmn, e dei cicli 1 e 2 del forte.
3. **Il forte dell'autore**: i cicli 1, 2 e 3 danno nei due motori lo stesso risultato (la stessa distribuzione su 400 semi; il terzo la
   stessa griglia voxel per voxel). **Il quarto, i piani a moneta, funziona solo da noi**: con l'originale si costruiscono piani fino al tetto
   della scatola e poi il ciclo non finisce mai (15 piani su 15 e mai finito in 400 semi su 400; il forte intero non finisce in 600 s).
4. **La regola che l'autore ne ha ricavato è vera a metà.** «Per uscire serve un'ultima `all` o `one` che non trova» descrive bene il suo
   forte, ma da noi il ciclo finisce in un passo in cui **nessun** figlio cambia niente, qualunque sia l'ultimo: una `prl` a moneta come
   ultimo figlio basta (test). Ciò che è speciale nell'ultimo figlio è un'altra cosa: quando lavora lui, tutti ripartono da capo.
5. **Allineare il motore costerebbe soprattutto fuori dai cicli** (§ 5): pochi programmi usano `<markov>` (6 nel seme, nessuno scritto dal
   Concilio negli universi), ma le strutture degli universi mettono una `<sequence>` dentro la `<map>` per la simmetria, e l'originale la
   ripete: 54 programmi su 64 dei cinque universi darebbero un'altra griglia, 21 non finirebbero più. Nessuno si può riscrivere voxel per voxel.
6. **Il consiglio** (§ 7): non allineare il motore all'originale (A1); aggiungere un ciclo esplicito, `<repeat>` con `p` e `max` (A2), che
   non tocca un solo programma di oggi, e riscrivere la guida dei cicli (B) col modello del § 1 e gli idiomi del forte. La scelta è
   dell'autore: [`domande/T498.md`](../pipeline/domande/T498.md).

## 1. Come gira il nostro motore, in parole semplici

`src/mj/engine.ts`: `RuleRunner.go` (riga 904), `SequenceRunner` (2132), `MarkovRunner` (2169).

**Un nodo di regole riesce quando cambia la griglia.** `one` cambia una corrispondenza a caso (pesata da `p` se le regole hanno `p`
diversi), `all` tutte quelle che non si sovrappongono, `prl` tutte quelle a cui la moneta `p` dice sì. Una corrispondenza c'è **solo dove la
regola cambia qualcosa**: `in="R" out="R"` non trova mai niente. Con `steps="n"` riesce al più n volte, poi tace; senza `steps` finché trova
(anche la `prl`, scritta in XML: `model.ts` riga 473).

**`<sequence>`**: i figli in ordine, ognuno finché riesce; poi il successivo. Finito l'ultimo, la sequenza ha finito, una volta sola.

**`<markov>`, a ogni passo:**

1. prova i figli dall'alto, e il primo che riesce fa **un** passo (se è una sequenza, un passo del suo figlio di turno);
2. se quello che è riuscito è l'**ultimo** figlio, tutti ripartono da capo: i loro `steps` da zero, una sequenza dal suo primo figlio;
3. se nessun figlio riesce, il ciclo è finito.

Cinque conseguenze, che sono tutto ciò che serve per scrivere un ciclo da noi:

- **(a)** Senza `steps` e senza rami dentro è una lista di priorità: a ogni passo il primo che può (come in MarkovJunior).
- **(b)** Un figlio con `steps` che non è l'ultimo lavora al più quei passi fra un passo dell'ultimo e il successivo.
- **(c)** `<markov><sequence>A B C</sequence></markov>`: la sequenza è l'ultimo figlio, quindi riparte da A **a ogni passo**: «a ogni passo,
  il primo fra A, B e C che può fa un passo». Non è «A, poi B, poi C».
- **(d)** Una sequenza che **non** è l'ultimo figlio tiene il suo posto da un passo all'altro: la si percorre tutta (A finché può, poi B,
  poi C), una volta; poi lavorano i figli dopo di lei; quando lavora l'ultimo, ricomincia da A.
- **(e)** Per uscire basta che arrivi un passo in cui nessun figlio può: un segno che l'ultimo consuma e nessuno ricrea, una moneta che dice
  no. Il tipo dell'ultimo figlio non conta.

## 2. Come gira l'originale, in parole semplici

`source/Node.cs` (110 righe: `Branch`, `SequenceNode`, `MarkovNode`), `source/Interpreter.cs` (86: `Run`), `source/RuleNode.cs`,
`OneNode.cs`, `AllNode.cs`, `ParallelNode.cs`.

- **Il ramo al lavoro ha il turno.** L'interprete a ogni passo non chiama la radice ma il ramo che ha il turno (`ip.current`,
  `Interpreter.cs:68`). Quando un figlio che è un ramo riesce, il turno passa a lui e lui lo tiene **finché non ha finito**: il genitore, e i
  fratelli che gli stanno prima, aspettano (`Node.cs:84-85`).
- **Un ramo che finisce rende il turno al genitore e ricomincia da capo** (i passi dei suoi figli da zero, `Reset`); il passo in cui finisce
  non fa niente (`Node.cs:87-88`).
- **Il genitore gli chiede di nuovo**: un `markov` perché riparte sempre dal primo figlio (`Node.cs:107`), una sequenza perché è ancora ferma
  su di lui. Ricominciato da capo, se trova da fare lavora un'altra volta. Quindi **ogni sequenza e ogni markov che non è la radice si ripete
  finché, dal suo inizio, trova qualcosa da fare**; solo la radice gira una volta (una sequenza) o finché può (un markov).
- **`<markov>`**: a ogni passo il primo figlio che può, come da noi; ma i passi dei figli non ripartono finché il ciclo non è finito (un
  `steps="2"` vale per tutto il ciclo), salvo che il genitore, rifacendolo, glieli ridia.
- **Le regole**: una corrispondenza è dove l'ingresso combacia, anche se l'uscita non cambia niente (`RuleNode.cs:124-218`); `one` non legge
  `p` (`OneNode.cs`, `RandomMatch`); una `prl` conta fra i suoi passi anche il giro in cui non ha applicato niente (`ParallelNode.cs:47-48`);
  con `p="0"` una regola non applica mai (`ParallelNode.cs:19`).

In una riga: nell'originale **`<markov><sequence>corpo</sequence></markov>` è «rifai il corpo intero finché un giro intero, dal suo inizio,
non trova niente»**, e una `<sequence>` dentro un'altra fa lo stesso.

## 3. Le differenze, una per una

Ogni riga è un programma di [`lab/banco/markov/programmi/`](../../lab/banco/markov/programmi) su una riga di celle, dove la corsa non dipende
dal caso; «l'originale» è ciò che il C# ha stampato (`originale.json`); in `tests/mj-markov-originale.test.ts` un `it` fissa il nostro motore
e un `it.fails` dice ciò che fa l'originale (passerebbe, e romperebbe la suite, il giorno che il motore girasse come lui).

| | il programma | il nostro motore | l'originale | perché |
|---|---|---|---|---|
| d1 | `markov` radice: R cresce (`steps="2"`), G cresce (`steps="1"`), da `RBBBBBBBBBBG` | `RRRRRRRRGGGG` | `RRRBBBBBBBGG` | da noi l'ultimo figlio fa ripartire i passi di tutti; nell'originale valgono per tutto il ciclo |
| d1b | lo stesso `markov` dentro una sequenza | `RRRRRRRRGGGG`, 10 passi | la stessa griglia, 15 passi | l'originale rifà il ciclo finito, e gli ridà i passi: si arriva allo stesso punto per un'altra via |
| d2 | `markov` con dentro una sequenza: R un passo, G un passo | `RRRRRRRRRRRG` | `RRRRRRGGGGGG` | da noi la sequenza riparte dal primo figlio a ogni passo (§ 1 c); nell'originale corre intera a ogni giro |
| d3 | una sequenza dentro una sequenza: R un passo, poi G un passo | `RRBBBBBBBBGG` | `RRRRRRRRRRRG` | da noi la sequenza interna gira una volta; nell'originale si ripete finché trova (§ 2) |
| d4 | `markov`: prima `Ra → Rc`, poi una sequenza che scrive `a` e lo fa crescere | `RcBBBBBBBB` | `Rcaaaaaaaa` | da noi il primo figlio interrompe la sequenza; nell'originale la sequenza tiene il turno fino in fondo |
| d5 | `markov`: una sequenza (R un passo) e poi G un passo | `RRRRRRGGGGGG` | `RRRRRRRRRRRG` | da noi la sequenza fa un passo e tocca a G (§ 1 d); nell'originale la sequenza si ripete finché trova |
| d6 | `markov` radice: `prl` G → W con `steps="2"`, poi una `one` che scrive G | `WWWGB` | `WWGBB` | nell'originale il primo giro della `prl`, senza G, è già uno dei suoi due passi |
| d6b | lo stesso dentro una sequenza | `WWWGB` | `WWWWW` | l'originale rifà il ciclo e ridà alla `prl` i suoi passi |
| d7 | una `one` che non cambia niente (`RB → R*`), poi una che scrive G | `RGBB`, 1 passo | `RGBB`, 3 passi | nell'originale la prima regola applica dove combacia, senza cambiare: un passo vuoto |
| d8 | una `prl` che non cambia niente (`R → R`) | `RGBB`, finisce | non finisce mai | nell'originale trova R a ogni giro: la corsa gira fino al tetto dei passi |
| d9 | una `one` con due regole, R con `p="0.001"`, G con `p` 1 | R non cresce mai | R e G crescono a caso | l'originale non legge `p` nella `one` |
| d10 | una `prl` con `p="0"` | applica (`p` 0 vale 1) | non applica mai | da noi un `p` che non è positivo vale 1 (`parsePattern`, riga 459) |

**La copia col flusso dell'originale.** Per sapere che cosa l'originale farebbe dei nostri programmi, che lui non legge (`#6`, `[Nx]`, `ground`,
`<import>`, `<pieces>`), `lab/scripts/markov-originale.ts` scrive in `lab/out/markov/` una copia del nostro motore in cui i rami girano come
`Branch` e `MarkovNode` (il turno, il passo vuoto, il ricominciare, i passi contati per tutto il ciclo, la `map` che chiude la corsa) e la
`prl` conta i giri vuoti; i nodi di regola restano i nostri. Su d1-d6b la copia stampa **la griglia e i passi** dell'originale vero; su d7-d10
no, di proposito. Dove sotto si dice «col flusso dell'originale» si intende la copia.

## 4. I quattro cicli del forte, spiegati

Le misure: i cicli ridotti a programmi piccoli (`programmi/l*.xml`, la forma delle righe del forte, scritte perché le legga anche
l'originale), 400 semi per motore ([`misure.md`](../../lab/banco/markov/misure.md)); i due generatori casuali sono diversi, quindi si
confrontano le distribuzioni.

### Il ciclo 1 (righe 21-24): le quattro braccia

```xml
<markov>
  <prl in="a" out="l" p="0.035"/>
  <all in="[Nx]azzzzzzz" out="*xa******"/>
</markov>
```

**Da noi.** A ogni passo prima la moneta: se per almeno un braccio dice sì (quel braccio si ferma, `a → l`), il passo è quello; se non dice sì
a nessuno, crescono di una cella tutte le braccia che hanno ancora sette `z` davanti. Il ciclo finisce nel primo passo in cui la moneta non
ferma nessuno e nessun braccio può crescere. Le braccia arrivate a sette celle dal bordo restano `a` (la moneta le prova fino a quel passo).
**Nell'originale**: lo stesso (un `markov` di sole regole senza `steps`); in più, finito il ciclo, il genitore lo rifà una volta, e la
moneta ha un tiro in più sulle braccia ferme al bordo. **Misura**: il cortile 1 894 celle in media nell'originale, 2 080 da noi (da 13-18 a
9 089-10 099): lo stesso ciclo. Col flusso dell'originale la nostra griglia voxel per voxel in 182 semi su 400 (negli altri decide il
tiro in più). **La lettura dell'autore è giusta.**

### Il ciclo 2 (righe 31-35): le braccia dagli estremi

Lo stesso ciclo con un terzo figlio, il riempimento dei rettangoli (`[Ax]z/*[Ax] → *x/**`). **Da noi** a ogni passo: la moneta, se non ferma
nessuno la crescita, se nessuno cresce il riempimento; il riempimento è l'ultimo figlio, ma dentro non ci sono `steps` da far ripartire: è
ancora una lista di priorità. Finisce quando nessuno dei tre trova. **Nell'originale** lo stesso, col tiro in più dei due cicli. **Misura**: 5 030
celle contro 5 052; col flusso dell'originale la nostra griglia in 96 semi su 400. **La lettura dell'autore è giusta.**

### Il ciclo 3 (righe 94-104): il mastio che cresce

```xml
<markov>
  <sequence>
    <prl p="0.00005" in="k" out="z"/>
    <prl in="kz" out="zz" steps="100"/>
    <all steps="1"> crescita di un anello; vk → vz </all>
  </sequence>
</markov>
```

**Da noi.** La sequenza è l'unico figlio, quindi l'ultimo: riparte dal suo primo figlio a ogni passo (§ 1 c). A ogni passo dunque: la moneta
rarissima (un `k` diventa il segno `z`); se non lo fa, ciò che allarga il segno (`kz → zz`), che trova solo se un segno c'è; se non c'è,
la crescita di un anello, che toccando la strada `v` mette il segno da sé. Così il mastio cresce un anello a passo finché la strada o la
moneta non mettono un segno; poi il segno si allarga a tutto il mastio, un passo dopo l'altro; poi non c'è più un `k` da far crescere né da
segnare, e il ciclo finisce; dopo, `z → k`. **La lettura dell'autore va corretta in due punti**: la sequenza non «esce alla prima regola che
non trova» (riparte dall'inizio a ogni passo, e lavora la prima che trova), e le `prl` non «trovano sempre» (la moneta rara quasi mai,
l'allargamento solo dove c'è un segno). **Nell'originale** la sequenza è un giro intero: la moneta, poi l'allargamento fino a 100 passi,
poi un anello; giro dopo giro, finché un giro non trova niente. Lo stesso risultato: col flusso dell'originale la stessa griglia voxel per
voxel, in 400 semi su 400 (le monete in più che il nostro tira mentre il segno si allarga non decidono più niente). **Misura**: il mastio dell'autore (moneta
0,00005) arriva alla strada in 387 semi su 400 nell'originale, 377 da noi; con una moneta più probabile (0,003) 98 celle in media contro 96.

### Il ciclo 4 (righe 198-260): i piani a moneta

```xml
<one in="B x" out="#6 x" steps="1"/>
<markov>
  <sequence> #6 → #7, … un piano intero, col ciclo del mastio dentro (216-226) … </sequence>
  <prl in="B r" out="r R" steps="1" symmetry="()"/>
  <prl p="0.5" in="#7" out="#6"/>
  <all in="#7" out="#6" steps="1" symmetry="()"/>
</markov>
```

**Da noi.** La sequenza non è l'ultimo figlio: tiene il suo posto (§ 1 d) e la si percorre tutta, una volta: `#6 → #7` apre il piano, poi
pavimento, scale, il mastio del piano (il ciclo 216-226, che gira come il ciclo 3), muri, porta, i segni tolti, la `r` alzata. Finita lei, la
`prl` di `B r` una volta (`steps="1"`). Poi la moneta: **testa** (`#7 → #6`), e la moneta non è l'ultimo figlio, quindi niente riparte; al
passo dopo la sequenza ha finito, la `prl` ha speso il suo passo, la moneta e l'ultimo figlio non trovano più `#7`: il ciclo finisce (il `#6`
lo toglie la riga 261). **Croce**: la moneta non cambia niente; l'ultimo figlio trasforma `#7` in `#6` e fa ripartire tutti: la sequenza
ricomincia da `#6 → #7`, un altro piano. Quindi un piano sicuro e poi uno in più con probabilità 1/2 (misura: 1,95 piani in media sulla
torre di prova, 212 su 400 con un piano, 93 con due, 52 con tre). **La lettura dell'autore ha i due rami scambiati** (non «se la moneta
converte l'istruzione successiva trova e il ciclo continua»: con testa si esce, con croce si continua), il risultato è lo stesso 50 %. E non
è «finché `#6` è presente a inizio ciclo»: a testa `#6` c'è e il ciclo finisce; ciò che fa un piano in più è l'ultimo figlio che lavora. Lo
stesso si scrive più corto: **la moneta da sola come ultimo figlio** (testa: `#7 → #6`, ultimo figlio, tutti ripartono, un piano in più;
croce: nessuno può, fine) dà la stessa distribuzione (test).

**Nell'originale** la sequenza, appena riesce, tiene il turno fino in fondo e fa il piano; poi il ciclo, ripartendo dal primo figlio, le
chiede di nuovo: ricominciata da capo, trova in cima le `r` che il piano ha alzato (`B r → B #4`) e costruisce un altro piano, senza `#6` e
senza che la moneta venga mai chiesta. Piani finché trova dove costruirli; poi la moneta e l'ultimo figlio rigirano `#7` e `#6` per sempre:
la corsa non finisce. **Misura**: sulla torre di prova 15 piani su 15 (fino al tetto) e mai finita, in 400 semi su 400, nell'originale vero e
nella copia. **Il forte intero**, semi 1-3: da noi finisce in 6,7-7,6 s (454-865 passi), il mastio alto 39-99 voxel; col flusso
dell'originale fa sei solai sul piano a un quarto e lì resta, 110-139 mila passi in 120 s (690 mila in 600 s col seme 1), senza arrivare mai
alla scala piena. Nel gioco sarebbe un modello che non finisce: fallito.

## 5. Chi usa `<markov>`, e che cosa gli succederebbe

Il censimento (`markov-originale.ts -- --censimento`, le righe intere in [`misure.md`](../../lab/banco/markov/misure.md)) legge l'XML del
seme, dei 1 531 programmi di `lab/` nel repository, del forte dell'autore, dei cinque universi generati sul disco (`aurora`, `mesa`,
`neapolis`, `orichalcum`, `sidera`, quelli di `npm run universi:cloud` e della prima run) e, per confronto, dei 159 modelli di mxgmn. Conta i
cicli e come sono fatti e i **rami annidati** (una `sequence` o un `markov` che non è la radice: l'originale li ripete, § 2). Poi fa girare
ogni programma trovato, semi 1 e 2, col nostro motore e con la copia col flusso dell'originale, alla scatola che gli dà il gioco: la stessa
griglia o un'altra.

| dove | programmi letti | con `<markov>` | cicli | con rami annidati | confrontati | un'altra griglia col flusso dell'originale | di cui non finiscono più |
|---|---|---|---|---|---|---|---|
| seme | 140 | 6 | 11 | 5 | 6 | 2 (`circuito-3D`, `part-wheel`) | 0 |
| laboratorio | 1 531 | 51 | 121 | 102 | 100 (17 non compilano fuori dalla loro cartella) | 27 | 2 |
| forte dell'autore | 1 | 1 | 5 | 1 | 1 | 1 | 1 |
| `aurora` | 136 | 4 | 7 | 2 | 4 | 1 | 0 |
| `mesa` | 183 | 3 | 6 | 4 | 5 | 3 | 1 |
| `neapolis` | 187 | 3 | 6 | 19 | 20 | 18 | 10 |
| `orichalcum` | 190 | 3 | 6 | 16 | 17 | 15 | 4 |
| `sidera` | 163 | 2 | 5 | 17 | 18 | 17 | 6 |
| modelli di mxgmn | 159 | 58 | 93 | 52 | — | — | — |

Come si legge:

- **Pochi cicli, e quasi tutti del seme.** Negli universi i programmi con un `<markov>` sono le copie di quelli del seme (`circuito-3D`, le
  parti `part-leaf`, `part-wheel`, `part-window`, `sound-final-battle`, l'animazione di `corona-lampione`); il Concilio non ne ha scritto
  nessuno. Fra i cicli del seme cambiano `circuito-3D` (un `markov` con dentro un `markov` e una sequenza) e `part-wheel` (una sequenza nel
  ciclo); gli altri quattro, liste di regole, no.
- **Ciò che cambierebbe davvero sono le sequenze annidate, non i cicli.** Le strutture degli universi (scritte dallo Scultore o da Claude Cloud)
  mettono una `<sequence symmetry="(xy)">` dentro la `<map>` per cambiare la simmetria: da noi gira una volta, con l'originale si ripete
  finché trova da fare. Su 64 programmi confrontati negli universi 54 darebbero un'altra griglia e **21 non finirebbero più** (le `all
  steps="1"` che rifanno lo stesso lavoro a ogni giro). Il conto è per difetto: una parte del seme inclusa con `<import>` è anch'essa una
  sequenza annidata, e il censimento sull'XML non la vede.
- **Nei modelli di mxgmn** il `<markov>` è quasi sempre una lista di regole (79 cicli su 93 senza rami dentro né `steps`, il caso in cui i
  due motori coincidono); i rami annidati ci sono in 52 programmi su 159, scritti per la sua semantica.

## 6. Le proposte

### A1. Allineare il motore all'originale

`MarkovRunner` e `SequenceRunner` come `Branch` e `MarkovNode` (la copia del banco lo fa in una settantina di righe), la `prl` che conta i
giri vuoti; a parte, se si vuole, `one` che ignora `p` e `p="0"`.

- **Pro.** La semantica di MarkovJunior: la sua documentazione e i suoi 159 modelli valgono anche qui; un modello che conosce MarkovJunior
  scrive ciò che si aspetta. `<markov><sequence>` diventa «rifai il corpo finché un giro non trova niente», che è come l'autore e il
  prompt di T469 descrivono un ciclo a parole.
- **Contro.** (1) **Il contratto cambia** (0.10 → 0.11: cambia il senso di una primitiva) e i programmi di prima **non si possono riscrivere
  perché diano la stessa griglia voxel per voxel**: l'originale tira i numeri casuali in un altro ordine (nel mastio la moneta rara una
  volta a giro invece che a ogni passo, una moneta in più quando rifà un ciclo finito), quindi la migrazione dovrebbe **segnare** ogni
  programma di prima perché giri come oggi (un attributo sulla radice, scritto in ogni `models/*.xml` degli universi, nelle carte fatte a
  mano, nelle carte portate, nelle parti del mondo, nel seme), e il motore terrebbe due flussi per sempre. (2) **I tranelli
  dell'originale**: una sequenza dentro una sequenza si ripete (d3); un ciclo finisce solo quando un giro intero, dal suo inizio, non trova
  niente: i piani a moneta così come sono scritti non finiscono, e scriverli per l'originale vuole che ogni nodo del piano dipenda dal segno;
  una `prl` che non cambia niente gira per sempre (d8). Una forma che non finisce, nel gioco, è una forma fallita (il tempo di
  `MODEL_TIME`), e allo Scultore un programma che non finisce torna con un errore: un giro in più pagato. (3) **Quanto cambierebbe** (§ 5):
  2 programmi del seme, 27 del laboratorio, il forte dell'autore e 54 programmi su 64 dei cinque universi, 21 dei quali non finirebbero
  più; soprattutto per le sequenze annidate, che oggi non sono cicli e lo diventerebbero.

### A2. Un ciclo esplicito, in più

Il `<markov>` e la `<sequence>` restano come sono (nessuna migrazione: ADR-0142 regge per costruzione); un nodo nuovo, per esempio:

```xml
<repeat p="0.5" max="8">   <!-- i figli in sequenza: un giro; poi un altro, finché un giro intero non cambia niente -->
  …                         <!-- p: dopo ogni giro si continua con questa probabilità; max: al più tanti giri -->
</repeat>
```

I cicli 3 e 4 del forte diventano:

```xml
<repeat>                    <!-- il mastio: a ogni giro la moneta rara, l'allargamento del segno, un anello -->
  <prl p="0.00005" in="k" out="z"/>
  <prl in="kz" out="zz" steps="100"/>
  <all steps="1"> … </all>
</repeat>
<repeat p="0.5" max="6">    <!-- i piani: niente #6 né #7, niente figli in fondo -->
  … un piano …
</repeat>
```

- **Pro.** L'uscita si dice: «finché il giro fa qualcosa», «con probabilità», «al più». Finisce sempre (un giro che non cambia niente, `max`,
  il tetto dei passi). Nessun programma di oggi cambia; il kernel sale di `Z` (un nodo in più, gli universi della stessa 0.10 restano
  buoni). Il prompt può dire: per ripetere un corpo `<repeat>`, il `<markov>` solo per una lista di regole (§ 1 a, dove noi e l'originale
  coincidiamo).
- **Contro.** Un terzo nodo di controllo da spiegare; non è di MarkovJunior (un modello non lo conosce, ma non conosce nemmeno il nostro
  `<markov><sequence>`); lavoro in più: il nodo nel motore, nel compilatore, nella traccia, nei tetti del mondo (`max` dentro
  `WORLD_NODE_LIMITS`), nel laboratorio e nell'editor, nei prompt, nei test. Non è provato che gli Scultori lo usino (T473: il ciclo di oggi
  mai).

### B. Lasciare il motore, riscrivere la guida

Nel nucleo (`sculptor.md`) e nell'Architetto (`sculptor/architect.md`) il modello del § 1 in cinque righe e gli idiomi del forte, provati:
le braccia che si fermano a caso (ciclo 1), il mastio che cresce finché un segno non lo ferma (ciclo 3), i piani a moneta con la moneta
come ultimo figlio (la forma corta del ciclo 4); e una riga per chi conosce MarkovJunior: «qui `<markov><sequence>` non rifà la sequenza
intera: a ogni passo lavora il primo figlio che può».

- **Pro.** Nessun rischio, nessuna migrazione, poco lavoro (un task di prompt, la misura `prompt-tokens --scultore --conta`).
- **Contro.** La semantica resta difficile: l'autore, dopo una lunga analisi, descrive due cicli su quattro in un modo diverso da come
  girano; Argon in T473 non ha scritto il ciclo nemmeno una volta su 12, con la guida di T469 che già diceva le stesse cose. «Solo l'ultimo
  figlio fa ripartire tutti» resta un tranello, e `<markov><sequence>` fa una cosa diversa da come si legge.

### Che cosa costerebbe a chi usa `<markov>`

| | cosa cambia nei programmi di oggi | che cosa si scrive | il contratto |
|---|---|---|---|
| A1 | almeno 2 del seme, 27 del laboratorio, il forte, 54 su 64 negli universi (21 non finiscono): tutti da segnare perché girino come oggi | ogni `models/*.xml` degli universi, le carte fatte a mano e portate, le parti del mondo, il seme; due flussi nel motore | cambia (0.11) |
| A2 | niente | il nodo nuovo, dove lo si vuole; i prompt | no (un incremento) |
| B | niente | i prompt | no |

## 7. Il consiglio

**A2 insieme a B, non A1.** B serve in ogni caso: i programmi che esistono, il forte compreso, si leggono con la semantica di oggi, e la
guida di T469 dice cose giuste in un modo che anche l'autore legge diversamente. A2 dà i cicli che l'autore vuole scrivere (un corpo che si
ripete, un'uscita a moneta, un tetto) senza toccare un programma di oggi né il contratto. A1 renderebbe impossibile, così com'è scritto,
l'idioma dei piani, renderebbe facili i cicli che non finiscono e vorrebbe due flussi nel motore per sempre, perché i programmi di prima non
si riscrivono voxel per voxel. Le quattro differenze dei nodi di regola (d7-d10) non si propone di toglierle: cambierebbero programmi ben
oltre i cicli (ogni `one` con regole di `p` diversi). E «una `prl` che non applica niente non conta come progresso», l'esempio del
task, da noi è già così (una corrispondenza c'è solo dove la regola cambia qualcosa): è nell'originale che una `prl` così non finisce mai (d8).

## 8. Che cosa non è provato

- Che gli Scultori usino un ciclo esplicito (A2): nessuna prova pagata qui; T473 dice solo che il ciclo di oggi non lo scrivono.
- La copia imita i rami dell'originale, non i suoi nodi di regola: sui programmi del gioco dice che cosa farebbe l'originale **coi nostri
  nodi**. L'originale vero non legge il forte (usa `#6`, `[Nx]`, `ground`, `origin="bottom"`): i suoi cicli sono stati ridotti (`l*`) e
  fatti girare lì.
- Le distribuzioni sono su 400 semi con due generatori diversi: differenze del 5-10 % nelle medie dei cicli 1 e 3 stanno nel rumore (con
  1 000 semi il mastio probabile dà 96,3 contro 97,0 celle).
- `wfc` e `map` nell'originale non hanno genitore (`Node.cs:73`): finiti i loro nodi la corsa è finita. La copia lo imita per la `map` e lo
  approssima per la `wfc`; non è una differenza dei cicli e non ha un test.
