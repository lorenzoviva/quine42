# ADR-0127 — Il Musicista sta nella casa dell'Artista: una stanza ha un elenco di squadre, e il mondo chiede la musica che gli manca

Data: 2026-11-04 · Stato: accettato · Riferimenti: ADR-0123 (il suono è un programma), ADR-0125 (le soglie), ADR-0126 (il suono nel gioco), ADR-0085 (i coefficienti), ADR-0056 (le carte), ADR-0109 (ciò che il Concilio scrive), T225

## Contesto

I programmi sonori li scriveva solo l'autore. L'autore vuole un membro del Concilio che lo faccia, ma «la corona è già troppo piena di palazzi»: il Musicista abita nella Galleria dell'Artista. Fin qui una stanza aveva una squadra sola (`team` in `ROOMS`, `Building.team`), e l'`Archive` metteva un membro per stanza davanti allo schermo. Bisognava anche dire che cosa il mondo gli chiede: il seme ha già un brano per ogni ambiente, quindi senza una regola il Musicista non lavorerebbe mai, o scriverebbe doppioni.

## Decisione

- **Una stanza ha un elenco di squadre** (`Building.teams`, `ROOMS`): la prima è quella di casa. Nessun caso speciale: `Archive.reset` fa un membro per squadra, `post` dà a ciascuna il suo posto davanti allo schermo (chi viene da un'altra stanza dopo di loro, così lo Scultore non si sovrappone), la porta dice tutte le squadre. Nessun edificio nuovo.
- **Lavora davanti allo schermo**: i suoi programmi stanno su scaffali dei piani alti, fuori vista, quindi `pathForFeed` non lo manda lì (`sound.*`); parla dal suo posto. Il suo posto al tavolo porta alla Galleria, la sua console è nella Direzione, il suo avatar (`corona-gerboa-musicista`) è la forma del Gerboa Artista in azzurro, con un piffero.
- **`sound.compose`, una risposta JSON** (`src/kernel/agents/composer.ts`): nome, programma, uso, ambienti, momenti, effetto. Il programma passa dal validatore di ogni modello con le soglie dell'analisi; in più servono `<sound>`, i nomi del mondo (`metaBreak` su `nome` e su ogni `name=`, regola 0) e, per un brano, almeno 32 passi. Ciò che non passa torna a lui col motivo, due volte al più; poi non entra niente e il mondo tiene la musica che ha.
- **Che cosa chiede il mondo** (`ScoreDirector`, `src/kernel/scoredirector.ts`): un ambiente di un luogo caricato che nessun programma nomina (`namesEnvironment`) riceve il suo brano, di giorno: sera e notte restano alla musica del momento, come per i brani del seme. Con il seme non chiede nulla: parte solo per gli ambienti che il Cartografo inventa e che non contengono un nome noto. Entro `ai.maxBrani` (8 a sessione) e il coefficiente `brani`, che allunga la pausa e a 0 lo spegne; «Low Detail» lo dirada e usa il modello economico. Il modello è `ai.scultori.musicista`, accanto a `artista`, che non scolpisce neppure lui: così entra da solo in Genesi e «Low Detail».
- **Che cosa chiede il viandante**: il Referente ha l'incarico `musica`, e con `E` si parla al Musicista direttamente. Paga chi chiede (`chi`, preso prima del primo `await`, regola 8i); ciò che chiede il mondo è comune (`sound.compose` è in `COMMON_TASK`). Senza un ambiente nominato il brano è di dove sta chi chiede. Un effetto risponde a un nome che esiste già nell'indice e **sostituisce** il suo programma (stesso id): un effetto che nessun momento del gioco chiama non suonerebbe mai.
- **Chi nomina l'ambiente per intero batte chi ne nomina una parte, e tra pari l'ultimo dell'indice suona** (`chooseMusic`): ciò che si scrive per un luogo si deve sentire lì, e un programma resta per tipo. Prima, due programmi sullo stesso ambiente si spartivano i luoghi con l'hash del nome.
- **`addModel` può timbrare la carta** (`card`): il brano entra con `commitContent`, autore il Musicista. Gli altri chiamanti restano come sono.
- **Il validatore ricorda l'ultimo programma sonoro passato**: il Musicista lo misura e `addModel` lo rimisurerebbe, fino a due secondi in più sul thread della pagina, per lo stesso risultato: le misure sono funzione del testo.

## Alternative scartate

- **Un edificio per il Musicista**: è ciò che l'autore non vuole.
- **Il Musicista come visitatore della Galleria, senza squadra**: avrebbe avuto una porta che non lo nomina e un posto preso a caso; lo stesso caso sarebbe tornato alla prossima squadra.
- **Un brano per ogni richiesta del mondo alla Genesi**: una ventina di chiamate per ambienti che magari nessuno visita, e che il seme copre già.
- **La risposta come XML nudo, come lo Scultore**: nome e scopo sono del Musicista quando chiede un viandante, e andrebbero estratti dal testo; lo schema costa meno di un secondo compito.
- **Un nuovo modulo per l'effetto, a fianco del vecchio**: `effectProgram` prende il primo dell'indice, e il nuovo non suonerebbe; e sarebbero due programmi per un tipo.

## Conseguenze

- La validazione è sincrona, come quella dello Scultore: un brano ferma la pagina per circa 0,8 s (misurato) a ogni tentativo, e il processo di un mondo di molti altrettanto.
- Un universo che ha già una riga «Low Detail» scritta come oggetto, senza `brani`, ha `brani: 1` e non è più riconosciuto come «Low Detail» finché non lo si riapplica: si paga qualche brano in più, entro `maxBrani`.
- Una richiesta su un ambiente del seme toglie il brano del seme da quell'ambiente, senza cancellarlo: il suo programma resta per gli altri. Tornare indietro è il rollback dell'universo.
- La qualità non è misurata: passare le soglie vuol dire «non è rotto». Nella prova con Gemini i brani seguono da vicino la struttura dell'esempio dato (circa 6 righe su 10 uguali, in gran parte le dichiarazioni dei colori).
