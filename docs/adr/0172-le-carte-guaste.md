# ADR-0172 — Le carte guaste: una carta portata che non funziona si isola, si mostra al master, si toglie con un commit

Data: 2026-11-07 · Stato: accettato (task T296 del backlog, step 41) · Riferimenti: testo dell'autore in `docs/userchats/to-do-2026-11-05.md` («A regime: come usare le carte create a mano»: «se poi ci dovesse essere [una collisione] eliminiamo la carta problematica»), ADR-0041 (ogni aspetto è un programma), ADR-0056 (le carte), ADR-0084 (l'eredità), ADR-0108 (la cache delle forme), ADR-0110 (i mondi senza segreti), ADR-0126 (il suono nel gioco: ciò che fallisce tace), ADR-0130 (le mancanze), ADR-0136 (la versione del kernel), ADR-0156 (l'universo in sola lettura), ADR-0161 (le carte fatte a mano), ADR-0170 (le carte portate), ADR-0171 (`<import>`)

## Contesto

Con ADR-0170 il master porta in un universo nuovo, prima della Genesi, modelli e suoni che sono carte altrove: universi parenti e carte
fatte a mano. Ogni carta ripassa dal controllo delle carte fatte a mano (`handmadeProgramErrors`) sul server da cui entra. Ma nel mondo una
carta gira in condizioni che il controllo non ha visto: altri semi (una struttura procedurale ne ha fino a 8, il controllo prova quelli della
classe; un brano suona con il seme di universo, ambiente, momento e variante), un'altra scatola (la cantina), un'altra patch del kernel nello
stesso contratto (T333 ha cambiato il compilatore: un `<import>` di un file che questo universo non ha), un altro browser (un worker che si
ferma o non risponde). L'autore: «se poi ci dovesse essere [una collisione] eliminiamo la carta problematica»; il task: una carta che fallisce
(programma che non produce, forma senza impronta, guasto nel worker, suono muto) non rompe il mondo (regola 2), si isola (regola 3), si
mostra al master con il motivo e il master la toglie dalla console, con un commit. Prima di questo task un programma che falliva lasciava la
sua cosa come un segnaposto per sempre (nel browser, un worker fermo faceva fallire anche le forme di tutti gli altri e restava fuori dal
gruppo), un programma vuoto lasciava una cosa invisibile, una forma senza impronta lasciava passare attraverso una cosa solida, un brano a
volume zero suonava silenzio in ciclo.

## Decisione

1. **Che cosa è guasto** (`src/kernel/brokencards.ts`, `BreakKind`): solo una **carta portata** (`brought` nella sua voce di
   `models/index.json`); i modelli del seme e quelli dello Scultore di questo universo restano come sono (il validatore li ha visti qui).
   Quattro modi, ciascuno dove si vede:
   - `fault`: il programma getta (compilazione, motore, un file che manca) o il suo worker si ferma o non risponde: `Forms.onFail`, nel
     kernel che lo esegue (Node, il mondo di molti, il browser);
   - `empty`: il programma finisce senza un voxel visibile (`anyVisible`): `Forms.onReady`;
   - `footless`: la forma pronta non ha niente all'altezza del corpo (`Form.footless`) e la indossa una cosa **solida** (`body.solid`): un
     tappeto non è guasto, una botte che si attraversa sì (regola 10); in `rebuildSolids`;
   - `mute`: un brano o un effetto non suona (il worker del suono fallisce o non finisce, o il campione più forte resta sotto `MUTE_FLOOR`,
     circa −80 dB: prima un brano a volume zero suonava silenzio in ciclo): lo dice il direttore del suono del client (`SoundDirector.onFail`),
     che in `main.ts` lo passa al kernel. Il suono è del client (ADR-0126): il mondo di molti non lo sente, lo specchio del master sì.
   Una carta guasta lo è **come è scritta ora** (l'hash del programma e dei file che legge, `Forms.hashOf`): riscritta a mano, si riprova.

2. **Si isola** (`Kernel.cardBroke`): la carta e le sue **copie** (`cardFamily`: le voci con la stessa provenienza, la stessa carta e lo
   stesso programma, come il `ModelDirector` copia un modello portato sotto l'id di una richiesta, `reused`, o lo condivide con un'altra
   taglia, `shared`) diventano `Forms.isolate`: `resolve` dà il generico della classe; chi le indossava veste quel generico e la aspetta
   (`wanted`, come una cosa il cui modello non è ancora scolpito); la cosa solida intanto blocca la sua casella; il terreno che la usava torna
   al suo aspetto procedurale; il suono tace (ADR-0126); `broughtModels()` non la offre più al Cartografo, al Narratore né al `ModelDirector`
   (che altrimenti la ricopierebbe). Nessun salvataggio: un mondo che si apre la ritrova guasta appena la esegue. Due carte di un universo con
   lo stesso programma sono due carte (le loro catene finiscono con impronte diverse) e si isolano una per una.

3. **Si mostra al master con il motivo**: un guasto `card:<id>` («la carta «…» non funziona in questo mondo: …», nel HUD e nelle Anomalie)
   dove gioca il master (in singola; in un mondo di molti lo specchio del master, quello con un ramo da pubblicare, mai lo specchio di un
   giocatore); una riga del registro del Concilio dal mondo (`card.broken`, che in un mondo di molti va solo al master); e la scheda
   «Universo» della console, «Le carte portate»: ogni carta una riga (le copie con lei), da dove viene, «funziona» o «⚠ non funziona» col
   motivo. `R` non la guarisce: dopo un ritorno una carta ancora guasta resta isolata e il suo guasto si riapre.

4. **In un mondo di molti** il mondo decide: isola ciò che esegue (le forme per le collisioni) e dice a ogni client l'elenco
   (`broken` in `welcome` e negli `update`, quando cambia; `readBrokenCards` lo legge); ogni specchio isola le stesse carte (`worldBroken`,
   `worn` sulle forme che arrivano), così ogni client disegna il generico dove il mondo lo usa. Uno specchio isola anche ciò che fallisce solo
   nel suo browser (un worker), per sé.

5. **Il master la toglie** (`Kernel.removeCard`, il pulsante «Togli» con una conferma a due clic, niente finestre del browser; in un mondo di
   molti il messaggio `card` con `op: 'remove'`, solo del master, controllato nel server e di nuovo nel kernel): **un commit del kernel** dei
   soli `models/<id>.xml` e della voce di `models/index.json` della carta e delle sue copie («il master toglie la carta «…» (…): motivo»;
   `withoutCards` lascia ogni altra voce com'è). Si può togliere **ogni carta portata**, anche una che funziona (una «collisione» può essere di
   stile): chi la indossava torna al generico. Non si toglie un modello che non è una carta portata, né da un universo che si legge soltanto
   (ADR-0156), né da uno specchio (chiede al mondo).

6. **Chi la usava** torna al generico della sua classe e alla richiesta al `ModelDirector` (l'id che un modulo, un oggetto o un terreno
   nomina è di nuovo mancante; una struttura veste ciò che il suo concetto veste ora, `structureModelFor`, e il direttore scolpisce
   quello), il brano lascia i suoi ambienti allo `ScoreDirector`; **entro i loro tetti** (`ai.maxModels`, `ai.maxPieces`, i coefficienti).
   Se adesso il Concilio non può rifarla (i modelli locali, il tetto raggiunto, la manopola a zero: `blocked()` dei due direttori), il mondo
   lo scrive tra le **mancanze** (ADR-0130, `world/shortfalls.json`: «il modello di «…»» o «la musica di …», esito `fault`, il motivo della
   carta e quello del direttore); ciò che può rifare lo rifà al suo ritmo, e se fallisce lo scrive lui.

7. **La carta resta** nell'archivio del suo autore (`universes/.handmade/`, che il kernel non tocca), nell'universo da cui viene (la sua voce,
   il suo timbro, la sua catena) e nella storia di questo universo: un ritorno a prima della rimozione la riporta, e la si riprova. Gli
   utilizzi già contati (`world/cards.json`) restano; nessun saldo si muove (regola 8d).

8. **Il worker che si guasta non porta via gli altri** (`WorkerRunner`, `src/render/forms.ts`): un worker che si ferma (`onerror`) o non
   risponde entro `FORM_WATCHDOG_MS` (120 s; un programma si ferma da sé a 30 s) fa fallire **solo ciò che stava facendo**, viene terminato e
   un altro prende il suo posto (al più `RESPAWNS` volte: un worker che non parte nemmeno non gira in tondo); senza worker rimasti, ciò che
   aspetta fallisce. Prima un errore di un worker faceva fallire tutto ciò che aspettava, e il worker usciva dal gruppo per sempre.

9. **La versione**: `KERNEL_VERSION` 0.5.8. Nessun formato cambia senso: la rimozione è un commit di file che esistono, l'elenco delle carte
   guaste non si salva; il filo ha un messaggio e un campo nuovi, facoltativi (un client di prima non li manda né li legge).

## Alternative scartate

- **Il `ModelDirector` che riscolpisce da sé una carta guasta**: il suo id resta nella libreria, quindi per lui non manca; farlo comunque
  sostituirebbe la carta senza il master, che invece decide (una carta può guastarsi in un browser solo, e il master può riscriverla a mano).
- **Isolare ogni modello che fallisce, non solo le carte portate**: i modelli del seme e dello Scultore li ha visti il validatore di questo
  universo; un modello che il master riscrive a mano e rompe è un suo diritto (regola 3), e lì il guasto si vede già come segnaposto.
- **Salvare l'elenco delle carte guaste** (in `world/`): un guasto di un browser lo scriverebbe per tutti, e una carta riscritta resterebbe
  segnata; rifare il controllo all'apertura è gratis per ciò che si esegue comunque.
- **Un `confirm()` per la rimozione**: blocca la pagina e chi la guida (lo strumento del browser); due clic con cinque secondi di tempo
  bastano.
- **Una finestra di conferma nel messaggio** (il master manda il motivo): il commit dice il motivo che il mondo conosce; il client non scrive
  testi nella storia del mondo.
- **Isolare la famiglia per programma uguale soltanto**: due carte diverse di un universo con lo stesso programma (un brano copiato e
  rinominato) si isolerebbero insieme; la carta uguale (timbro e catena) dice che è una copia.

## Conseguenze

- `tests/carte-guaste.test.ts`: una carta per ogni modo di guastarsi (`fault` con un `<import>` di un file che manca, `empty`, `footless`,
  un worker che si ferma, `mute` con il direttore e il worker del suono veri): nessun crash, la cosa resta (generica, `wanted` la carta), il
  guasto e la riga del registro col motivo, la rimozione con un commit che cambia solo `models/`, la mancanza offline, il salvataggio e la
  riapertura senza la carta; una carta che funziona si toglie lo stesso; le copie isolate e tolte insieme e non ricopiate dal direttore; la
  carta riscritta che si riprova; il ritorno a prima della rimozione che la ritrova guasta; `R` che non la guarisce; ciò che non si toglie
  (un id ostile, il seme, un universo in sola lettura); lo Scultore che rifà il modello entro il tetto, e al tetto la mancanza; in un mondo di
  molti l'elenco a tutti, la console del master, il giocatore che non può (né dal kernel né col messaggio), i messaggi che non si leggono;
  il `WorkerRunner` con un worker che si ferma, uno che non risponde, e i ricambi che finiscono.
- Nel browser (`?offline`, catture in `docs/catture/T296/`): una botte portata con un `<import>` di un file che manca, un barile che
  funziona e un brano muto per il villaggio; il mondo gira, la console li mostra, la botte e il brano si tolgono, dopo la ricarica non ci sono;
  con la build finale una lanterna che non produce niente, tolta, e il ritorno al commit che l'aveva portata, che la ritrova guasta.
- Restano fuori: lo Scultore può ancora prendere come esempio il programma di una carta isolata finché non è tolta (`examplesFor` legge i
  file); un guasto che capita solo nel browser di un giocatore resta suo (il mondo e il master non lo sanno); un `fault` del suono si vede
  solo dopo il primo gesto (l'audio si apre lì) e solo per ciò che suona.
