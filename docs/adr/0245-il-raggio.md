# ADR-0245 — Il raggio: il Concilio lavora solo per i luoghi che un viandante può raggiungere presto

Data: 2026-11-22 · Stato: accettato (task T488 del backlog, dopo la prima run della beta, T457) · Riferimenti: ADR-0040 (i luoghi nuovi e chi
li paga), ADR-0043 (le strutture), ADR-0085 (i coefficienti e la stima oraria), ADR-0196 (il ritmo del mondo), ADR-0231 (il luogo che il
budget ferma)

## Contesto

Nella prima run della beta (T457, il 21/11), da soli in una copia di `orichalcum`, 18 minuti di gioco (16 del mondo) sono costati 2,93 $,
circa 10 $ l'ora contro i 2,4 della stima della lobby. La misura (`lab/banco/run-1/consumi.md`, `lab/scripts/consumi-run.ts`) dice perché:
il kernel caricava come bozze tutti i luoghi del rettangolo della camera più un luogo per lato (al timone la camera si allontana e il
rettangolo raddoppia) e il Cartografo li pianificava tutti, tre alla volta, il più vicino prima. 232 luoghi del Cartografo in 16 minuti,
il 69 % visto e solo il 16 % attraversato dal viandante; ogni piano applicato chiedeva subito le cose nominate a terra (317 oggetti definiti,
il 18 % in un luogo raggiunto) e le cose nuove alla Fucina, e i ritmi dei pacchetti, dei tipi di abitanti e delle sessioni battevano sui
luoghi pianificati; lo Scultore delle strutture lavorava per ogni struttura caricata, vista o no. La stima della lobby supponeva 40 luoghi
nuovi l'ora: la run ne ha pianificati 870.

## Decisione

1. **Il raggio** (`src/kernel/reach.ts`, puro). Un luogo è in raggio di un viandante se il suo quadrato è entro `near` caselle da lui (8:
   dal mezzo di un luogo solo quello, vicino al bordo anche il vicino) o entro `side` caselle (4) della via che fa per i prossimi `ahead`
   secondi al suo passo (10 s, al più `aheadMax` 60 caselle: a piedi, 6 caselle al secondo, più di tre luoghi; un piano di Flash-Lite ha
   preso 3-5 s nel browser e 11-12 mentre l'arrivo chiedeva una dozzina di altre cose). Fermo (sotto `moving`, 0,5 caselle al secondo) conta
   solo `near`. Con più viandanti, il raggio di ognuno.
2. **Il passo lo misura il kernel** (`measurePaces`, `nextPace`): dalla posizione sul tappeto di ogni viandante, su una finestra di
   `Kernel.PACE_WINDOW` (0,25 s del mondo: una pagina fa più tick in un fotogramma e i passi di un client arrivano a gruppi, il singolo tick
   vedeva salti e fermate), una media di mezzo secondo; uno spostamento oltre `JUMP_PACE` (15 caselle al secondo, il doppio del passo più
   veloce) è un salto, non un passo (un teletrasporto, una rinascita, il viaggio fra i pianeti).
3. **Il Cartografo solo per i luoghi in raggio** (`pumpDevelopment`): ordinati dal centro più vicino al punto dove il viandante sarà fra
   `LEAD` secondi (2: davanti prima che alle spalle; fermo, l'ordine di prima), tre alla volta (`Kernel.DEVELOPERS`) e uno in più solo per il
   luogo sotto i piedi, che non aspetta mai. Le bozze fuori raggio si guardano soltanto per ciò che non costa (`develop(ch, false, true)`:
   il piano che l'universo ha, il luogo di un blocco, la regione del master, il mare aperto, il vuoto) e, se servirebbe il Cartografo,
   restano bozze segnate `far` finché non entrano in raggio. Il kernel carica ancora tutto ciò che la camera vede: una bozza non costa.
4. **Ciò che un piano chiede si chiede quando il luogo è in raggio** (`Chunk.asks`, `pumpAsks`), una volta a caricamento: le cose nominate
   a terra che il mondo non conosce (`content.define`), le cose nuove alla Fucina, e i ritmi del mondo (pacchetti ogni 10, tipi di abitanti
   ogni 7, sessioni al terzo e ogni 12), che ora battono sui luoghi entrati in raggio (`exploredCount`). In pausa aspettano; la generazione
   differita (`planAhead`) li chiede subito, senza nessuno vicino.
5. **Lo Scultore delle strutture solo per ciò che sta in un luogo in raggio** (`ModelDirector.missing()`), la più vicina prima
   (`wandererDistance`); `missing(true)` le vede tutte per ciò che non costa (il programma di un'altra taglia, il modello di una carta), per la
   generazione differita e per la carta tolta. Gli altri modelli restano com'erano: nascono da ciò che ora si definisce e si forgia solo in
   raggio.
6. **Restano come prima**: la quota dei luoghi al minuto della lobby, il budget (ADR-0231), il ritmo del mondo e le regioni del master;
   chi paga un luogo nuovo (`Chunk.chi`, chi l'ha caricato per primo); gli individui, fatti già solo entro 9 caselle; le manopole della lobby.
7. **La stima della lobby** (`HOUR` in `coefficients.ts`) viene da ciò che il nuovo ritmo chiama: il percorso della run, rigiocato offline in
   18 minuti con i modelli locali che rispondono come Gemini nella run (`lab/scripts/sessione-cammino.ts`): 200 luoghi nuovi l'ora, 0,75
   chiamate per le cose ignote e 0,7 individui a luogo, 10 strutture nuove l'ora; le sessioni del Concilio al più quattro
   (`MAX_SESSIONS`, quelle di `holdSession`).
8. **I test degli altri sottosistemi** vedono il mondo di prima (`tests/setup/reach-wide.ts`: `near` infinito, ogni luogo caricato in
   raggio, l'ordine di prima); `tests/raggio.test.ts` prova quello del gioco (raggio, ordine, cose a terra, più viandanti, ritmo e quota,
   strutture, la stima contro la sessione).

## Conseguenze

- Sul percorso della run, rigiocato in 18 minuti (`lab/banco/run-1/consumi.md`): prima 252 piani, 183 definizioni, 5 strutture, 3,01 $
  (10,0 $/h, la run vera 2,93 $); dopo 60 piani (−76 %), 45 definizioni (−75 %), 3 strutture, 1,79 $ (6,0 $/h), nessun secondo sulla bozza; coi piani a 12 s
  invece che a 6, 5,9 secondi sulla bozza in 18 minuti.
  L'obiettivo di T488 (meno di 1 $/h a pieno dettaglio) **non è raggiunto**: il resto è lo Scultore (le strutture di Argon quasi metà,
  ogni luogo raggiunto porta un concetto suo e lo Scultore lavora di continuo), gli individui e i piani dei luoghi davvero raggiunti. Le leve
  per scendere ancora cambiano ciò che il mondo fa a pieno dettaglio: le decide l'autore (`docs/pipeline/domande/T488.md`).
- Gli individui crescono (da 17 a 50 nella sessione): il tetto di due per tipo nel mondo caricato (`NPC_CAP`) prima si
  riempiva di persone in luoghi lontani, mai individuate; ora le persone stanno dove passa il viandante.
- Ai bordi della vista restano bozze (il terreno del generatore, senza ambiente né strutture) finché il viandante non si avvicina.
- La lobby mostra una stima più alta (5,3 $/h col seme al posto di 2,4; 1,7 a «Low Detail»): quella vecchia supponeva 40 luoghi l'ora e una struttura nuova ogni
  quarto d'ora.
- La prova con Gemini vero su un clone di `sidera` (0,478 $ al varco): il raggio pianifica solo davanti ai piedi (20 piani in due cammini) e
  applica senza chiamate i luoghi che l'universo ha; ha trovato due difetti, corretti prima del commit (il passo misurato tick per tick, che
  nella pagina si azzerava, e un passo creduto dove c'era un salto di 6 caselle), la cui correzione è provata offline (nel browser e nella
  sessione con la latenza del piano a 12 s), non col Gemini vero: il tetto di 0,50 $ era raggiunto.
- Kernel 0.10.21 (stesso contratto: gli universi della 0.10 restano buoni, i piani salvati non cambiano).

## Alternative scartate

- **Un raggio fisso senza la via davanti**: a 6 caselle al secondo il viandante attraversa un luogo in tre secondi, meno di un piano; senza
  guardare dove va arriva sulle bozze.
- **Il raggio della camera, più piccolo**: lega ciò che si paga a ciò che si guarda (lo zoom, il timone) invece che a dove si va.
- **Pianificare tutto il visibile con un modello più piccolo o con meno contenuto**: i piani restano tanti e un luogo pianificato «povero» resta
  povero per sempre (un piano salvato non si riscrive).
- **Fermare lo Scultore delle strutture a un tetto l'ora**: tocca ciò che il mondo fa a pieno dettaglio; è una delle leve della domanda
  all'autore, non una conseguenza del raggio.
