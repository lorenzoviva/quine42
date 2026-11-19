# Gli universi dopo la rigenerazione dei modelli: lettura e prova (T153)

Letti il 19/11/2026 dal disco della pipeline (`universes/` del worktree del ramo `3d`), dopo che il generatore
(ADR-0177) ha finito `--rigenera modelli` (ADR-0216) su tutti e quattro: neapolis il 18/11 (19:30-22:30Z), aurora,
orichalcum e sidera nella notte tra il 18 e il 19. Nessuna chiamata ai modelli in questa lettura; la prova nel browser
gira su una copia degli universi (nel worktree del task, ignorata da git), offline, così nessun salvataggio arriva ai
repository veri.

## Il costo

Dai registri dei consumi degli universi (`world/usage.json`, giorni 18 e 19/11, tutto `abbonamento-claude`, Opus 5.5
dalla coda), al listino di Opus 5.5 (4 $ ingresso, 0,20 $ dalla cache, 20 $ uscita per milione; senza le scritture
in cache, quindi un minimo). La quota della settimana è quella che il progresso della rigenerazione ha contato
(`universes/.generation/<nome>.rigenera-modelli.json`).

| Universo | Passi | Chiamate | Token in / cache / out | ≥ $ al listino | Settimana | Stima di T411 |
|---|---|---|---|---|---|---|
| aurora | 6 tipi (banco, cartello, credenza, letto, pozzo, contadina) | 29 (17 Scultore, 12 Artista) | 93 k / 167 k / 33 k | 1,06 | < 1 % | ~3 $ |
| orichalcum | 49 (12 ambienti, 36 tipi e interni) | 131 (78 Scultore, 40 Artista, 13 Scenografo) | 1,22 M / 0,82 M / 0,55 M | 15,98 | ~4 % | ~25 $ |
| neapolis | 47 (8 ambienti, 39 tipi e interni) | 149 (92, 42, 15) | 1,51 M / 0,93 M / 0,62 M | 18,64 | ~3 % | ~6 $ (prima della riparazione di T421) |
| sidera | 41 (6 ambienti, 35 tipi e interni) | 131 (77, 39, 13, 2 Cartografo) | 1,36 M / 0,90 M / 0,53 M | 16,15 | ~3 % (più T422) | ~25 $ |
| **totale** | | **440** | | **≈ 51,8** | **~10 %** | |

sidera comprende il lavoro di T422 (i due ambienti riscritti dal Cartografo e le 6 strutture portate a 16, ~7 $ a
listino secondo il suo esito). neapolis costa tre volte la stima perché, riparato da T421, ha di nuovo i 19 luoghi con
14 strutture di T273. Il voto dell'Artista sulle forme rifatte: orichalcum da 3 a 7 (mediana 5), neapolis da 3 a 6
(mediana 4-5), sidera da 4 a 6 (mediana 5), aurora 6.

Restano col programma di prima, perché nessun programma nuovo ha passato i controlli (`world/shortfalls.json`):
orichalcum l'osservatorio, la taverna della caldaia e la taverna delle caldaie (cantina non raggiungibile dalla porta,
un piano solo); neapolis l'osservatorio civico (cantina); sidera il bar orbitale e la lounge criogenica (un piano, stanza
piccola, cantina). Restano a 20 voxel per casella perché i lotti non le terrebbero a 16: in neapolis la palazzina
grande delle case comuni (2 lotti su 9), il bistrot, il mercato coperto rionale e la torre panoramica: lo stesso caso
che T422 ha risolto per sidera riscrivendo gli ambienti.

## Che cosa c'è e se è dell'ambientazione

`controlla-universo.ts` legge tutti i piani di tutti e quattro (orichalcum 114, neapolis 107, sidera 56, aurora
1664), zero guasti.

**Dell'ambientazione, e bene**: le bibbie (Fornace Alta e l'oricalco; Neapolis anni Novanta col porto, il Centro
Direzionale e il cantiere della Linea 2; Sidera sotto l'Anello, con le cupole, la fusione e i relitti), le guide di
stile, i terreni, gli oggetti dei pacchetti (gavetta, lingotto d'oricalco; tazzina, cuoppo, nastro isolante; razione di
serra, taglierina al plasma), i mestieri e le persone del Narratore, gli ambienti scritti dal Cartografo per ogni
universo, i mobili e le figure rifatte (persona del vapore, guardiano d'ottone, colono; motorino, cassonetto,
distributore; capsula criogenica, reattore) e i nomi delle strutture. aurora è ciò che era: il medioevo di Valmora,
l'universo di prova.

**Ciò che tradisce il tema** (proposte di task in fondo):

1. **I luoghi dei modelli locali.** In tre universi la maggior parte dei luoghi ha nomi e contenuti dei modelli finti
   (`MockAiModels`): «Prato di Valmora», «Borgo del Re Muto», «Campagna Senza Ritorno», «Radura Immobile»: orichalcum 98
   piani su 114 (56 già visti), neapolis 88 su 107 (46 visti), sidera 37 su 56 (9 visti); aurora tutti, ma è nato così.
   Vengono dalle sessioni offline giocate sui repository veri (06/11 dopo T273, 18/11 durante le verifiche di T421 e T428,
   i commit «salvataggio della partita»): offline il Cartografo locale pianifica i luoghi che si avvicinano e il kernel
   li salva come se fossero del Concilio. Lo si è visto anche in questa prova (sulla copia): il registro dice «Cartografo
   propone (3,1) "Radura di Valmora" — Cupole idroponiche». Con loro sono nate persone dai mestieri di Valmora
   (orichalcum 11 su 36: locandiere, tessitrici, pastori, un boscaiolo; sidera una locandiera, un boscaiolo, una
   contadina; neapolis un pastore) e descrizioni che sfiorano la quarta parete («L'erba si piega verso il centro del
   mondo», aurora).
2. **Gli ambienti del seme medievale restano e si usano.** orichalcum e neapolis tengono i 20 ambienti del seme accanto
   ai propri (sidera no) e i luoghi li usano: neapolis 15 caserme, 6 castelli, 3 fortezze, 2 templi, una tana del drago,
   villaggi di capanne; orichalcum 4 piramidi, 2 sotterranei, una tana del drago, una fortezza, giungle. Quasi tutti nei
   luoghi dei modelli locali del punto 1, che scelgono a caso fra gli ambienti che ci sono.
3. **Merlature e feritoie su ogni struttura.** Lo Scultore rigenerato mette `part-battlements` e `part-slits` anche dove
   non c'entrano: la cattedrale degli ingranaggi in piazza a Fornace Alta è un mastio con i merli rossi e le feritoie
   (foto); in neapolis il bistrot, il laboratorio, la palazzina, la chiesa moderna e la torre panoramica; in sidera i
   laboratori, i fari, i santuari e la stazione di transito. La causa è nel prompt delle strutture
   (`universe/prompts/agents/sculptor.md`): il metro è il forte dell'autore («merlons and arrow slits on the outer
   faces»), il tetto piano è «crowned by `part-battlements`», e la richiesta elenca le parti del seme a ogni struttura,
   di qualunque mondo.
4. **Le figure di neapolis sono il fabbro del seme.** I 12 individui di neapolis (barista, vigile, medico…) vestono
   `person` («Fabbro»), il corpo generico del kernel che la rigenerazione non tocca; orichalcum e sidera hanno una figura
   propria. Nella libreria di tutti e tre restano anche le carte di T273 per altri mondi (`fantasy-*`: altare runico,
   calderone, trono di pietra; le strutture medievali della locanda del cinghiale e del forte di frontiera), non usate
   nei luoghi.
5. **Il luogo di partenza di sidera non mostra le sue strutture.** Il piano della Piazza dei Viadotti (0,0) nomina il bar
   orbitale e il santuario della luce, ma il luogo non ha lotti (`lots: []`) e nessuna delle due compare nel mondo.
   Non ne ho cercato la causa.
6. **La partita è singola.** I tre universi di T273 dicono `game.mode: single`; l'autore li voleva in multigiocatore
   (03/11). La partita si sceglie alla Genesi e resta fissa.

## La prova nel browser

Build e preview (`turno browser`, porta 4731), `?skip&offline&universo=<nome>&dev&teleport=…`, su una copia degli
universi. In tutti e quattro il mondo si apre col suo nome e il suo seme, si cammina con WASD (il viandante si sposta,
nessun guasto) e la console non ha errori del gioco: solo due eccezioni dell'estensione di Chrome al cambio di pagina
(«message channel closed»).

- orichalcum, Piazza della Pesa: la cattedrale degli ingranaggi (a merli, punto 3), la caldaia panciuta, il lampione a
  gas, la bacheca, i caldaisti e il gatto di fabbrica (`orichalcum-piazza-della-pesa.jpg`).
- neapolis, Piazza delle Erbe, di notte: la fontana a croce, la cappella col tetto di coppi e le finestre a feritoia, un
  palazzo con le finestre azzurre, l'edicola verde, persone col corpo del fabbro (`neapolis-piazza-delle-erbe.jpg`).
- sidera, Scalinata dei Corrieri: lo scalo delle navette, una torre a fasce nere e ciano col tetto ambra sul piazzale
  verde, e un faro grigio-azzurro accanto; pozze di canale, la runa `tunnel` (`sidera-scalinata-dei-corrieri.jpg`).
- aurora, Campagna del Primo Passo: le case a graticcio col tetto rosso del seme (`aurora-campagna-del-primo-passo.jpg`).

Non visto: gli interni arredati dallo Scenografo (non sono entrato nelle strutture), il multigiocatore, un luogo nuovo
pianificato dal Cartografo vero.

## Proposte di task

- **A. Offline non si pianifica il mondo di un universo vero** (kernel): con i modelli locali i luoghi nuovi restano
  bozze non salvate, o si salvano segnati e il Cartografo vero li rifà alla prima sessione con i modelli; lo stesso per
  le persone che il Narratore locale fa nascere. Test offline: una sessione `?offline` su un universo non scrive piani
  né persone dei modelli finti.
- **B. Ripulire orichalcum, neapolis e sidera** dai luoghi e dalle persone dei modelli locali (un commit nel loro
  repository, con un tag prima), lasciando che il Cartografo li ripianifichi dalla coda (`npm run genera`); dopo A.
- **C. Le parti del seme secondo il concetto e il mondo** (prompt dello Scultore): merli e feritoie solo dove il concetto
  è fortificato; il forte di riferimento come metro di ricchezza, non di forma, fuori dal medioevo; poi rigenerare le
  strutture che ne hanno preso i merli (le liste sono qui sopra).
- **D. neapolis: gli ambienti riscritti dal Cartografo** per portare a 16 le quattro strutture che restano a 20, come T422
  per sidera; e una figura di persona di neapolis al posto del fabbro.
- **E. Gli ambienti del seme fuori dai mondi non medievali**: castello, fortezza, tana del drago, piramide, caserma
  (ADR-0134, `TIMELESS_LAYOUTS`) non si offrono al Cartografo in un'ambientazione che non li vuole, e i luoghi che li usano
  si ripianificano (con B).
- **F. sidera, la Piazza dei Viadotti senza lotti**: perché l'ambiente non dà lotti alle due strutture del piano.
- **G. Le sei strutture non rigenerate** (cantina non raggiungibile, un piano solo): un secondo giro della rigenerazione
  coi tipi elencati, `--tipi`.
- **H. La partita in multigiocatore** per i tre universi, se l'autore la vuole ancora: oggi si sceglie solo alla Genesi.
