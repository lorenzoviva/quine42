# ADR-0248 — Il consumo dichiarato: la stima della lobby con la cache misurata, e in gioco il consumo della sessione con il suo ritmo orario

Data: 2026-11-22 · Stato: accettato (task T496 del backlog, risposte dell'autore a D68.2a e D69.4 del 22/11) · Riferimenti: ADR-0039 (il
registro dei consumi), ADR-0085 (i coefficienti e la stima oraria), ADR-0109 (ciò che esce a un client, a elenco), ADR-0133 (le regolazioni
della lobby), ADR-0186 (la cache esplicita dell'Attore), ADR-0188 (chi paga la partita), ADR-0245 (il raggio), ADR-0247 (il riuso e il tetto
orario delle strutture nuove)

## Contesto

La stima oraria della lobby (`hourlyEstimate`) dava a ogni modello di Google il 60 % del prefisso stabile dalla cache implicita
(`IMPLICIT_CACHE_SHARE`, T325) tranne a 3.8 Flash, niente (`NO_IMPLICIT_CACHE`). La prova pagata delle specialità (T473) e il registro della
prima run della beta dicono altro: Argon 0 % nella run e 1-5 % dell'ingresso sul banco, 3.8 Flash 16-18 % sul banco, 3.5 Flash (l'Artista,
con la foto) niente, Flash-Lite il 63 % dell'ingresso, l'80 % del prefisso. La stima contava anche, per i compiti mai misurati, 500 token di
risposta: nella run Flash-Lite ne ha scritti due o tre volte tanti, quasi tutti di ragionamento. E non sapeva del tetto delle strutture nuove
di T495: contava 10 strutture di Argon l'ora. In gioco il costo c'era solo nel pannello del Concilio del master (`G`), senza un ritmo, e in
una partita di molti un giocatore non vedeva niente. L'autore (D69.4): «dichiariamo sempre il consumo; se il prezzo non scende molto va
bene, basta dichiararlo».

## Decisione

1. **La cache implicita per modello** (`IMPLICIT_CACHE`, `implicitCacheShare`, `CACHE_MEASURED` in `src/kernel/coefficients.ts`): la parte
   del prefisso che la cache di Google serve, misurata sul registro di un mondo che ha giocato e sul banco: Flash-Lite 0,8, 3.8 Flash 0,25,
   Argon 0,05, 3.5 Flash 0; un modello non misurato tiene 0,6. `NO_IMPLICIT_CACHE` non c'è più. Si rimisura senza chiamate con
   `lab/scripts/cache-registro.ts` sul `world/usage.json` di un universo.
2. **I token di risposta dal registro**: i compiti della Fucina, dei pacchetti, delle sessioni, delle schede, `content.define` e i modelli
   hanno la risposta col ragionamento che la run ha misurato (`measured: true`); restano supposizioni solo i compiti che la run non ha fatto.
3. **Il tetto delle strutture nella stima**: le strutture di un concetto nuovo dell'ora sono al più `ai.newStructuresPerHour`
   (`newStructuresCeiling`, come lo legge il kernel), e senza tetto quante il cammino della run ne scolpisce coi soli inviti del kernel (7
   l'ora); le altre strutture si vestono di nuovo e non sono modelli da fare. I modelli dell'ora contano anche quelli delle cose a terra e
   delle persone dei luoghi in raggio (`HOUR.modelliCose`, `HOUR.modelliPersone`, dal cammino), sempre entro `ai.maxModels`.
4. **Il consumo in gioco è sempre detto** (`SpendView`, `Kernel.spendView`, `src/ui/spend.ts`): nel pannello `P` (il profilo) e nel
   pannello del Concilio (`G`), il costo dei modelli della sessione e, dopo due minuti di gioco (`PACE_SECONDS`), il suo ritmo orario
   (`hourlyPace`: i dollari sui secondi giocati, che il kernel conta a ogni tick in `UsageLog.played`); da soli anche la stima della lobby
   per le regolazioni di oggi. I dollari sono quelli del registro (`Tally.usd`: il costo detto dal provider dove lo dice, altrimenti il
   listino), senza la commissione. Da soli e al master il consumo del mondo; in una partita di molti a ogni altro viandante il suo (ciò che ha
   chiesto) e, dove ognuno paga, le spese comuni della sessione; dove paga il master, il suo con «le paga il master».
5. **Sul filo** un campo nuovo dello stato del viandante, `MyState.spend`, costruito dal server per quel viandante (`shownSpend`: i dollari al
   millesimo, il ritmo al centesimo, così lo stato non riparte a ogni tick) e letto dallo specchio senza fidarsi (`readSpend`,
   `Kernel.setSpendSeen`). Il registro del mondo resta a casa: un giocatore vede solo i suoi numeri, il master quelli del mondo.
6. **Fuori dal mondo** (regola 0): il consumo lo dice solo l'interfaccia, mai un contenuto né un prompt.

## Conseguenze

- La stima del seme a pieno dettaglio scende da 5,29 a circa 3,5 $ l'ora (col tetto a 2), quella di «Low Detail» da 1,70 a 1,45; il
  confronto con il cammino e con la run è in `lab/banco/run-1/consumi.md` § 7.
- Chi gioca vede in ogni momento quanto costa la sessione e a che ritmo, accanto a ciò che la lobby stimava; la differenza dice quando le
  supposizioni dell'ora non tengono.
- Un modello nuovo di Google entra con la parte di cache non misurata (0,6) finché un registro non la misura (`docs/guide/nuovo-modello.md`).
- Sicurezza: nessuna superficie nuova; il campo nuovo esce per viandante, coi suoi soli numeri (regola 8f).
