# Il rapporto aureo nel prompt dello Scultore (T242)

La richiesta dell'autore (04/11, `docs/pipeline/domande/T232.md`): proporzioni auree e spirali di Fibonacci come **indicazione per ciò che
si genera da qui in poi**. I modelli esistenti non si toccano e non si rigenerano.

## Le righe

- `universe/prompts/agents/sculptor.md`, nella parte di ogni classe («How to sculpt well»): il rapporto aureo (circa 8 a 5) fra le parti
  dove nient'altro fissa una misura, i passi di Fibonacci dove c'è una spirale (foglie, conchiglie, scale a chiocciola, cupole); un'indicazione,
  non una regola: la classe, la scatola e la lettura da lontano vengono prima.
- La stessa, nella parte delle strutture (dopo `<!-- strutture -->`, ADR-0183, sotto «What matters most»): fra volume e ala, cortile e
  mastio, muri e tetto; le parti abitabili tengono le loro misure minime.
- `universe/prompts/agents/artist.md`: il principio va nella guida di stile che l'Artista scrive alla Genesi, e un modello non si boccia
  solo perché le sue proporzioni non sono auree.
- `universe/world/style.md`: una regola in più nella guida del seme.

Circa 100 token in più per richiesta dello Scultore (input: da 17 785 a 17 892 sulla conchiglia).

## La misura

`npx vite-node lab/scripts/banco-aureo.ts` (ripetibile; `--rimisura` rifà solo le misure): le stesse quattro richieste con il prompt del
seme **senza** la riga (`base`) e **con** (`aureo`), un tentativo ciascuna, come le compone il gioco (`sculptorRole`, gli esempi della
libreria, `describe`), su Gemini 3.8 Flash via `agy` (abbonamento, nessuna API), con il ritorno dell'errore una volta come in `write`.
Misure: i controlli del gioco (`checkProgram`), materiali sopra lo 0,2 %, la lettera dominante, il pezzo principale, la snellezza (altezza
sul lato maggiore) e la varianza (distanza di Jaccard media fra le celle piene di 4 semi). Le foto sono `<richiesta>/<variante>/1/lati.png`.

| richiesta | variante | passa | materiali | dominante | snellezza | varianza | token in/out | $ (listino) |
|---|---|---|---|---|---|---|---|---|
| albero | base | sì, 1ª | 6 | 0,80 | 1,73 | 0,50 | 19 523 / 7 097 | 0,04 |
| albero | aureo | sì, 1ª | 6 | 0,80 | 1,73 | 0,50 | 19 622 / 9 438 | 0,05 |
| girasole | base | sì, 1ª | 5 | 0,52 | 1,45 | 0,77 | 18 511 / 61 930 | 0,25 |
| girasole | aureo | sì, 1ª | 5 | 0,38 | 0,68 | 0,51 | 18 620 / 70 557 | 0,28 |
| conchiglia | base | sì, 1ª | 4 | 0,45 | 1,10 | 0,00 | 17 785 / 34 586 | 0,14 |
| conchiglia | aureo | sì, 1ª | 5 | 0,59 | 0,88 | 0,00 | 17 892 / 45 641 | 0,18 |
| tempietto | base | sì, 1ª | 8 | 0,57 | 1,22 | 0,00 | 21 660 / 79 665 | 0,31 |
| tempietto | aureo | sì, 1ª | 8 | 0,34 | 1,16 | 0,00 | 21 767 / 44 479 | 0,18 |

8 chiamate, 1,44 $ al listino (sull'abbonamento di Antigravity).

**Cosa dice.** Con la riga nulla peggiora: 4 su 4 passano alla prima richiesta come senza, materiali uguali o uno in più, la lettera
dominante uguale o più bassa (meno monotono) in tre casi su quattro. La varianza fra semi è uguale in tre richieste e più bassa nel girasole (0,77 →
0,51): con la riga il modello ha fatto capolini grandi e regolari al posto di steli sparsi; la forma resta riconoscibile, e un tentativo
solo non distingue la riga dal caso. La conchiglia con la riga ha la spira a giri crescenti (ellissoidi 2, 3, 4, 5, 7), senza ha i giri
uguali; il tempietto con la riga ha la cupola verde staccata e una porta, ma un intonaco più rumoroso (caso del modello, non della riga).

**Cosa non dice.**
- L'albero è uguale voxel per voxel nelle due varianti: il modello ha copiato `quercia.xml`, l'esempio della libreria per la classe. Dove
  la libreria ha un esempio vicino la riga non cambia niente; non è un difetto, ma non è una misura.
- La varianza di conchiglia e tempietto è 0: sono forme pronte (`ellipsoid`, `cylinder`) senza crescita casuale; i semi cambiano solo i
  colori (muschio, crepe), che la misura sulle celle piene non vede.
- Le strutture procedurali (la riga nella parte dopo `<!-- strutture -->`) non sono misurate qui: si scrivono a blocchi, con le viste che
  tornano, e il loro giro sul banco con Gemini è T355; la riga dice che le parti abitabili non si rimpiccioliscono per una proporzione.
- Un tentativo per variante: nessuna statistica, solo che la riga non rompe niente.
