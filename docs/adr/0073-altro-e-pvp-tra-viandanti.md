# ADR-0073 — «Altro…» e PvP tra viandanti

Data: 2026-10-29 · Stato: accettato (task T43b del backlog) · Fase 3 di ADR-0050 (il multiplayer); estende ADR-0071 (parole e doni
tra viandanti), ADR-0065 (il master in god mode) e ADR-0053 (la partita).

## Contesto
La partita (ADR-0053) dice due cose sui viandanti tra loro: `altroTraGiocatori` («Altro…» su un altro viandante, predefinito sì) e
`pvp` (possono ferirsi, predefinito no). Dopo T43a nel menu di un altro viandante c'erano solo «Parla» e «Dai». Gli effetti di
`core.effects` che toccano un corpo (`bisogni`, `scudo`, `stato`, `togli_stato`) valgono per chi agisce (`user`), non per il bersaglio.

## Decisione
1. **Nel menu** di un altro viandante «Altro…» c'è solo se `partita.altroTraGiocatori`; `kernel.freeOnWanderer(id, testo)` (anche dal
   messaggio `altro {viandante, testo}`: il corpo dell'altro non ha un id del server per il client) lo rifiuta senza chiamare nessuno
   se la partita non lo permette, e oltre `GIVE_REACH` (3) caselle.
2. **Il giudizio** è quello di ogni «Altro…» (`judgeFree`, compito `action.judge`) sul bersaglio `altro viandante`: niente azioni del
   modello, niente forma, niente da imparare (non è una cosa). Il Narratore lo sa (`ActionContext.between {pvp, god}`): è una persona
   vera; bisogni, scudo e stati valgono per l'altro; se i viandanti non possono ferirsi, o l'altro è il master, l'azione che ferisce
   non riesce.
3. **Gli effetti** li applica il server sul corpo dell'altro (`kernel.touchWanderer`, come chi agisce): bisogni, scudo, stato e
   togli_stato come l'altro (`as`); `spingi` lo sposta sul suo tappeto con la collisione del cammino (`stepWanderer`) e il server gli
   azzera il credito di passo (`wanderer:pushed`), così il suo client non torna indietro di colpo; il resto (fuoco, luce, oggetti,
   terreno, evoca) dove sta. Legame, ricordo, nascita, distruggi, apri, contenitore non valgono sulle persone vere.
4. **Ciò che ferisce** (`unharmed`): bisogni che scendono (restano quelli che salgono), `spingi`, `fuoco`, `togli_stato`, uno `stato`
   che rallenta (`velocita` < 1). Senza `pvp` il kernel lo toglie e lo scrive nel registro (`scarta`), e il racconto aggiunge «Ma tra
   viandanti non ci si ferisce.». Sul master in god mode arriva solo `messaggio`, PvP o no (ADR-0065).
5. **Chi lo subisce lo sa**: `wanderer:acted` → avviso `altro` nell'`aggiorna`, mostrato nei messaggi del client sottile.

## Conseguenze
- Il giudizio resta una regola del mondo (`viandante|<testo>` in `world/rules.json`): l'impossibile non si chiede due volte; il PvP non
  cambia dopo la Genesi, quindi la regola resta vera.
- Una cura, un dono di energia, uno scudo arrivano anche senza PvP; un pugno no.
- Il fuoco senza PvP non si accende nemmeno lì accanto: è il modo più semplice per non ferire per sbaglio.
