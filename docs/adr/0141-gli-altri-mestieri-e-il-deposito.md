# ADR-0141 — Gli altri mestieri del seme, `produci` e `usa`, il deposito del luogo

Data: 2026-11-05 · Stato: accettato (task T245c del backlog) · Riferimenti: D8 dell'autore (04/11), `docs/design/comportamento-npc.md` (sezioni 1.2, 1.3, 5 e 7), ADR-0134 (le quattro ambientazioni), ADR-0138 (il magazzino), ADR-0140 (i mestieri come programmi)

## Contesto

ADR-0140 ha messo il motore dei mestieri e tre programmi. Il progetto chiede una dozzina di programmi scritti a mano nel seme, generici per ogni epoca (a grado zero sono i soli), e i comportamenti che fanno circolare le cose: portare, prendere, produrre a un banco, usare una cosa come la usa il viandante. Serve un posto dove ciò che un mestiere produce aspetta chi lo usa: il deposito del luogo.

## Decisione

1. **Dodici programmi nel seme** (`universe/modules/lavoro.<mestiere>/`): ai tre di ADR-0140 si aggiungono pastore, fabbro, oste, mercante, guardia, sacerdote, scrivano, cuoco e impiegato. Ognuno ha nei `nomi` le parole delle quattro ambientazioni (T152): la fornaia e lo chef sono cuochi, il maniscalco e la meccanica fabbri, la locandiera e il barista osti, il gendarme e la poliziotta guardie, il copista e la giornalista scrivani, la commessa e il funzionario impiegati. Un nome sta in un solo programma.
2. **Il deposito del luogo** è una voce del magazzino di `sys.lavoro` (ADR-0138), `deposito:<cx>:<cy>`: oggetto → quanti. Il luogo è quello a cui l'individuo appartiene, che il kernel dà con i compiti (`mestiere.luogo`, il luogo in cui sta quando li riceve). Dura con la partita, torna indietro con `R`, non va mai ai client, e ha i tetti del magazzino. `placeDeposit` lo legge dal kernel (per i test, e per la contabilità fuori vista di T245f).
3. **I comportamenti nuovi** di `sys.lavoro`: `porta` (ciò che ha nel `carico`, tutto, al deposito del luogo o dentro la cosa se ha una tasca), `prendi` (dal deposito, fino a `quante`), `produci` (al posto, per ogni pezzo consuma `con` da ciò che porta o dal deposito, lavora `durata`, e il pezzo va nel `carico`; senza `con` non produce, e il motivo resta nello stato del lavoro), `usa` (una cosa con un tag, `entita:<tag>`, e la sua `azione`). `costruisci` resta delle imprese (T245d).
4. **`world.act(chi, cosa, azione)`** (`host.act`): un individuo usa una cosa come il viandante con «Usa»: l'`on_act` del suo modulo, con l'individuo come chi la usa. Solo un'azione senza effetti (gli effetti di un manifest sono del viandante: bisogni, oggetti, stati), solo entro 2,5 caselle, mai un viandante come chi usa, al più due chiamate annidate.
5. **Il cammino** di `world.path` usa ora la stessa collisione del passo (`free`: le caselle e le forme dei modelli), così la via gira attorno ai muri delle case, che sono modelli e non caselle. Chi resta fermo per due secondi a meno di tre caselle dalla meta è arrivato (un muro di una forma lo tiene a un passo); fermo per otto secondi lontano, il compito fallisce con il motivo (`fallito:non ci arriva`) e si passa al successivo.
6. Il seme dà dei tag a due cose che i mestieri usano: `obj.banco` (`banco`, `bottega`) e `object.well` (`pozzo`, `acqua`). Un tag che nessun modulo ha non rende invalido un programma: un universo può aver riscritto quel modulo, e quel compito, al lavoro, non trova nulla e si salta.

## Alternative scartate

- **Un file nuovo per i depositi** (`world/depositi.json`): il magazzino c'è già, con i suoi tetti e il suo salvataggio; un formato in più è un altro posto da proteggere.
- **Il deposito come un contenitore nel mondo**: un luogo scaricato non ha entità, e la contabilità fuori vista (T245f) deve poterlo riempire senza.
- **Le ricette del registro per `produci`**: il programma dice già cosa consuma e cosa fa; le ricette restano del viandante.

## Conseguenze

- `tests/mestieri.test.ts` prova una giornata di ciascuno dei dodici mestieri su un luogo pianificato, senza modelli; gli individui del mondo, che ora hanno anche loro un mestiere, prendono dal deposito come gli altri (nei test si tolgono, per provare un mestiere alla volta).
- Sicurezza: una funzione nuova del `Host` (`act`), che chiama l'`on_act` di un modulo come già fa «Usa», senza effetti, entro una distanza e una profondità; il deposito sta nel magazzino, mai sul filo. Nessuna rotta né messaggio nuovo.
