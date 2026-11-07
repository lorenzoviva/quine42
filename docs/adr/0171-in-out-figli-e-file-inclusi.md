# ADR-0171 — MarkovJunior: `<in>` e `<out>` figli delle regole, le regole da file, `<import>`

Data: 2026-11-07 · Stato: accettato (task T333 del backlog) · Riferimenti: ADR-0036 (MarkovJunior alla lettera), ADR-0037 (solo testo), ADR-0041 (ogni aspetto è un programma), ADR-0103 (i percorsi di un universo), ADR-0108 (la cache delle forme), ADR-0142 (il motore non cambia un voxel), `lab/banco/pattern.md` §12

## Contesto

L'autore (07/11, `docs/userchats/to-do-2026-11-07.md`, punto 2) scrive le strutture nell'editor del laboratorio: i pattern lunghi negli attributi `in="…"` e `out="…"` sono difficili da scrivere e da sostituire, e vuole poter decomporre le strutture complesse in sottoblocchi in file a parte e ricomporli (con MarkovJunior, o con `wfc`, che arriva con un task suo). Poi (epoca 328): `<in>` e `<out>` non vanno «al posto» degli attributi, sono una seconda forma facoltativa. Le regole da file di MarkovJunior (`file`, `fin`, `fout`) leggono immagini, che qui non ci sono (regola 11): il compilatore le rifiutava.

## Decisione

### `<in>` e `<out>` figli

Ogni nodo che ha una regola (`one`, `all`, `prl`, `convolution`, ogni `<rule>`, anche dentro `map`) può scrivere un lato come testo di un figlio `<in>` o `<out>` invece dell'attributo. La sintassi è la stessa dell'attributo: gli strati dall'alto, separati da spazi o da righe, le righe di uno strato da `/`; in più una `/` può chiudere una riga (la riga dello strato continua sotto: gli spazi attorno a una `/` non contano), e una riga che comincia con `#` è una nota. Lo stesso lato scritto in due modi (attributo e figlio, o un file) è un errore che lo dice. L'attributo resta com'è, letto come prima: i programmi di oggi non cambiano un carattere del compilato.

Il lettore XML (`src/mj/xml.ts`) tiene ora il testo di un elemento, dove ce n'è (`XmlElement.text`), e `writeXml` lo riscrive.

### Le regole da file: solo testo

`fin="a"` e `fout="b"` leggono un lato da `models/a.txt` e `models/b.txt`; `file="c"` legge da `models/c.txt` i due lati, separati da una riga con `->` sola. Il testo è quello di `<in>`/`<out>`. Il validatore controlla un file `.txt` di `models/` da sé (`ruleFileErrors`: nome semplice, solo lettere, cifre, `* / [ ]` e spazi, note dopo `#`, al più una riga `->`, niente pattern vuoti, 100 000 caratteri); se i suoi pattern stanno nel programma lo dice la compilazione di chi lo legge.

### `<import file="x"/>`

Un nodo che esegue lì il programma di `models/x.xml`, come se il suo nodo radice fosse scritto in quel punto, sulle sue lettere (`values` dell'incluso: la prima è il vuoto). Ne vengono le lettere, i colori e le unioni (quelli del programma che include vincono); non ne vengono la scatola, `origin`, `ground`, `soil` (un avviso: valgono quando il programma si apre da sé), il suono, le animazioni e le azioni. Un `symmetry` su `<import>` è la simmetria dell'incluso, se il suo nodo radice non ne dice una. Così un sottoblocco è anche un modello che si apre e si valida da solo (con il suo `ground` su cui lavorare), e ogni file incluso si valida come il resto della libreria.

L'inclusione si fa nel compilatore: il motore riceve gli stessi nodi che avrebbe da un programma scritto intero, e resta voxel per voxel quello di prima (ADR-0142).

### Dove si legge un file, e i tetti

`compileMjx` non tocca il disco: riceve `files`, i testi per nome dentro `models/` (`x.xml`, `x.txt`), e `self`, il nome del programma. `mjxIncludes(xml, read)` raccoglie ciò che un programma legge, anche dagli inclusi, da una funzione di lettura: nel gioco `Forms` legge dai file dell'universo (`Forms.includesOf`, una volta per caricamento), il validatore dal `modelFile` che gli dà il kernel, il laboratorio da `lab/mjx/models/` (`LAB_FILES`, `labIncludes` in `lab/3d/catalog.ts`). Un nome è semplice come l'id di un modello (`MJX_FILE_RE`, lettere, cifre e `-`): nessun percorso, nessuna estensione, nessuna cartella fuori da `models/`. Un file che manca, un ciclo (anche un programma che include sé stesso, con `self`), più di 6 inclusioni una dentro l'altra (`MJX_INCLUDE_DEPTH`), più di 64 inclusioni in un programma (`MJX_INCLUDE_COUNT`, contando ogni uso: un rombo di inclusioni non esplode) o più di un milione di caratteri letti (`MJX_INCLUDE_CHARS`) sono errori col motivo, e il messaggio di un errore dentro un incluso dice il file (`models/x.xml, riga N`).

### La cache delle forme

I file letti sono parte del programma: `FormRequest.files` li porta al worker e alla cache, `formKey` li aggiunge alla chiave (ordinati), l'hash di un modello in `Forms` li conta. Cambiare un file incluso cambia la forma di chi lo include; un programma che non legge file ha la chiave di prima (ADR-0108: ciò che è in cache resta buono). `models/` va già intero ai client (`shownWhole`), quindi anche i `.txt`.

## Conseguenze

- Il kernel sale a 0.5.7: nessun programma esistente cambia (il compilato dei programmi del seme è lo stesso; `tests/mj-engine-determinism.test.ts` non si tocca).
- `tests/mj-include.test.ts`: figli e attributi danno la stessa griglia sui programmi del seme e sul forte di riferimento; include, include mancante, ciclo, profondità, numero, percorsi; regole da file; la cache invalidata; il validatore.
- Nell'editor del laboratorio `import`, `in`, `out`, `fin`, `fout` si evidenziano, il testo di `<in>`/`<out>` ha le pastiglie dei colori come un attributo; il modello di prova è la torre merlata (`torre-merlata.xml`, che include `merli.xml` e legge la porta da `torre-porta.txt`).
- Lo Scultore non sa ancora di `<import>` e delle regole da file (il suo prompt non cambia): se li scrive senza i file, il programma torna con il motivo. Insegnarglieli è dei task sulle strutture grandi (T338, T339).
- Sicurezza: il caricamento di file è una superficie (i percorsi). Il compilatore non legge mai il disco; chi gli dà i file li prende solo da `models/` per nome semplice; i tetti valgono per ogni programma, anche nel processo di un mondo.
