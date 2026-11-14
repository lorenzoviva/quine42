# ADR-0188 — La Campagna del Master: le spese a carico del master, l'universo privato su invito, il ritmo del mondo che scende soltanto, le direttive a sezioni per competenza

Data: 2026-11-13 · Stato: **accettato** il 13/11 con le risposte di D54 (T347 lo ha proposto; T372 lo accetta e applica il punto 1, step 43) · Riferimenti: [`docs/design/campagna-master.md`](../design/campagna-master.md)
(lo studio, con le misure), ADR-0025 (i due tavoli), ADR-0045 (il grafo e il `focus`), ADR-0056 (chi paga e le carte), ADR-0066 (il ramo del
master), ADR-0069 (il Concilio sul ramo), ADR-0081 (le spese comuni divise), ADR-0084 (l'eredità delle carte), ADR-0102 (chi può scrivere),
ADR-0104 (i saldi fuori dall'universo), ADR-0107 (i ritmi), ADR-0109 (gli elenchi), ADR-0110 (i mondi senza segreti), ADR-0113 (chi paga si
dice), ADR-0114 (l'ammissione e le risorse per account), ADR-0133 (le regolazioni ferme a partita in corso), ADR-0143 (la generazione
differita), ADR-0157 (le decisioni chiuse), ADR-0165 (la lingua delle richieste), ADR-0184 (la open beta: il verificatore a inviti), ADR-0186
(la cache esplicita)

## Contesto

L'autore (10/11) vuole che un master possa condurre una **campagna**: pagare lui la generazione così che i giocatori entrino senza crediti,
tenere l'universo privato su invito, rallentare o fermare il mondo anche da dentro il gioco, e che gli agenti ricordino che cosa ha chiesto
e come; e che possa dichiarare prima dove sta un villaggio o un'isola, e chiedere solo mare dove il gruppo esce dalla trama. Oggi ogni
viandante paga le sue chiamate e le comuni si dividono (ADR-0081); chiunque con un token entra in ogni universo di molti; le regolazioni si
fissano entrando (ADR-0133) e la pausa esiste solo nella lobby; la conversazione con un agente vive in memoria e sparisce; le regioni
dell'atlante le scrive solo il Cartografo. Le alternative e i numeri sono nello studio.

## Decisione

Accettata dall'autore il 13/11 (D54, `docs/pipeline/domande/aperte.md`) con due cambi rispetto alla proposta, scritti sotto in **Le
risposte dell'autore**: il titolare delle carte, quando paga il master, è il master (punto 1); la regione `mare` diventa la regione
«riempitivo» (punto 5). Il resto vale come proposto.

1. **Le spese della partita** sono un campo della partita, `universe.json → game.expenses`: `shared` (oggi, assente vale così) o
   `master`. Lo sceglie il master nella lobby con le altre regolazioni (`join.settings`), si fissa quando entra il primo viandante e si
   sblocca quando esce l'ultimo (ADR-0133 vale com'è), esce ai client in `GAME_FIELDS`. **`chi` non cambia** (ADR-0113): chi ha chiesto
   resta chi ha chiesto per i ritmi, il registro e le mancanze (le carte, D54.1, sono di chi paga); cambia un punto solo, `charge`, dove con `master` ogni addebito,
   personale o comune, va al master. Il tetto che conta è quello del master; il minimo della lobby non rifiuta più chi entra; a saldo zero
   del master tutti passano ai modelli locali con l'avviso di oggi. Gli anonimi restano ai modelli locali a meno che l'universo sia privato.
   Le carte: `payer` e `holder` il master, chi paga (D54.1: niente spoiler nelle collezioni dei giocatori; scambi e cessioni più
   avanti), e con loro le quote dell'eredità. Il risolutore è uno, `billedTo(chi)` nel kernel, per l'addebito e per le carte. In open beta (ADR-0184) è «tutte le chiamate sulla
   chiave del master»: la chiave si sceglie dal pagante risolto, non da `chi`.
2. **L'universo privato** sta fuori dall'universo, come i saldi (ADR-0104): `universes/.campaign/<nome>.json` (`SERVER_FOLDERS.campaign`),
   atomico sotto lucchetto, con `private`, gli **ospiti** per id del viandante e gli **inviti** come impronte SHA-256 di token casuali con
   scadenza (7 giorni) e usi (1). Un invito (`?invito=<token>`, `join.invite`) non è un'identità: l'identità resta il token verificato (8b);
   un `join` con un invito buono consuma un uso e scrive l'id fra gli ospiti. Il controllo sta in `admit` (`server/session.ts`), dopo il
   token e prima di accendere il mondo (V-026); il mondo non sa di ospiti (8g). Le letture di un universo privato (`carte`, `publicFiles`,
   `/api/viandante`, l'elenco del sito) solo a master e ospiti (`guestOf` accanto a `owns`); a un estraneo l'universo non esiste. La lista
   la scrive solo il master con `/api/universe/<nome>/guests` (`gate`, `owns`, JSON, `FRONT_RATES`; il token esce una volta sola); togliere
   un ospite chiude il suo socket. Un universo nuovo e un clone nascono pubblici. Senza account (self-hosting) l'invito è l'unica prova: è il
   verificatore a inviti di ADR-0184 §8, stesso formato e stesso file.
3. **Il ritmo del mondo**, `pace` (`normal`, `slow`, `hold`, con `placesPerMinute`), è una manopola del master **che scende soltanto**: mai
   sopra le regolazioni della lobby (quote, modelli, `placesPerMinute`), pause solo più lunghe. È l'eccezione a ADR-0133, scritta: **a
   partita in corso il master può rallentare o fermare ciò che il mondo fa da sé, mai accelerarlo oltre la lobby**, perché chi è entrato con
   una stima spende al più quella. `hold` trattiene i luoghi nuovi come bozze (il terreno procedurale, senza cose né persone: ciò che si
   vede già mentre il Cartografo scrive), i modelli, i brani, le trame, le sessioni e i dialoghi nuovi; ciò che è in volo finisce; le
   risposte alle parole dei viandanti continuano. Niente è scritto dai modelli locali in pausa: ciò che i modelli locali scrivono resta.
   Si cambia col messaggio `pace` (solo il master), dalla console, dalla Direzione, dal sito (`/api/universe/<nome>/pace` → `WorldCalls`);
   sta in `.campaign → pace` e arriva al mondo per valore all'avvio. Nel mondo nessun testo (regola 0); l'HUD può dirlo. Da soli lo stesso
   `pace` nel kernel del browser. `?offline` e la generazione differita non cambiano.
4. **Le direttive del master** sono `world/campaign.md`, nella lingua del mondo, a sezioni per competenza (`## Per tutti`, `## Narratore`,
   `## Cartografo`, `## Scultore e Artista`, `## Ingegnere e Fisico`, `## Musicista`), con un tetto per sezione (4.000 caratteri) e uno per
   il file. `Council.context(agent)` inietta la sezione di tutti e quella dell'agente dopo il riassunto della partita, nella parte stabile
   della richiesta che la cache serve; l'Arbitro e il Referente leggono tutto; l'Attore solo «Per tutti»; le decisioni chiuse niente (D45).
   Lo scrive il master nell'editor (e pubblica) o il Referente con l'incarico nuovo `direttiva`: capisce la sezione, riformula nei termini
   del mondo, e il kernel appende con la data del mondo dopo il filtro della quarta parete (`metaBreak`, `cleanText`): una direttiva che
   rompe la quarta parete torna al Referente col motivo. Le direttive dicono il **come**; i **fatti** vanno nei file di oggi (bibbia,
   `people.json`, `plots.json`, atlante) e nel grafo. Il file non è in `playerFiles` né in `publicFiles`, non è una carta, entra in
   `councilMayWrite` solo per ciò che il kernel vi scrive. Misurato sulle richieste registrate: 900 token di direttive costano 0,014 $
   l'ora in cache (0,042 pieni), il 4 % dell'ora; un orchestratore nuovo dieci volte tanto con il doppio delle chiamate; il solo Referente non
   raggiunge i compiti che il mondo fa da sé.
5. **Le regioni del master**: il master dichiara regioni dell'atlante (centro, raggio, ambiente, descrizione) nell'Ufficio dei luoghi e
   nella Direzione, e il kernel le scrive in `world/atlas.json` senza chiamate; `environmentsFor` le applica come quelle del Cartografo. Due
   ambienti del kernel: `mare` (i luoghi dentro sono piani d'acqua scritti dal kernel, a costo zero, senza cose né rune: non un confine
   raccontato, ma mare, che il mondo ha già) e `trattenuta` (i luoghi dentro restano bozze finché il master non la libera). Gli individui
   dichiarati (incarico `individuo`: il Narratore coi fatti dati, gli attesi per i luoghi non ancora scritti) e le trame scritte dal master
   («Scrivi trama» nella Direzione, dal validatore delle trame) entrano nei file e nelle chiamate di oggi. Nessun agente nuovo.
6. **La versione del kernel**: i task che applicano l'ADR salgono di `Z`; `game.expenses`, `campaign.md` e le regioni del kernel assenti
   valgono come oggi, così gli universi del contratto in corso (0.6 quando è stato scritto, 0.7 quando T372 lo ha applicato) restano buoni.

## Alternative considerate

- **Il master paga cambiando `payerOf`** (`chi` = master): rompe 8i (le carte, i ritmi e le mancanze direbbero il master per ciò che un
  giocatore ha chiesto) e la coda `heavy` per pagante diventerebbe una sola. Scartata: si risolve in `charge`.
- **Gli ospiti in `universe.json`**: viaggerebbero con cloni, export e carte portate, tornerebbero con `R`, e il mondo li leggerebbe. Scartata
  (ADR-0104 vale anche per gli account).
- **Il controllo degli ospiti nel `join` del mondo**: il mondo si accenderebbe per un estraneo (V-026) e dovrebbe leggere un file del server
  (8g). Scartata: in `admit`.
- **La pausa come `?offline`** (i modelli locali): ciò che scrivono resta e un master lo deve rifare. Scartata per la campagna; `?offline`
  resta per chi gioca senza spendere.
- **`pace` dentro `ai`, sbloccato per il solo master**: aprirebbe ADR-0133 in entrambe le direzioni. Scartata: una manopola a parte che
  scende soltanto.
- **La memoria per agente, un testo per tutti, il solo Referente, un orchestratore**: misurate nello studio (§ 4.3); la via a sezioni ha lo
  stesso costo della memoria per agente senza riscritture né divergenze, metà del testo per tutti, raggiunge i compiti del mondo che il
  Referente non vede, e costa un decimo dell'orchestratore senza raddoppiare le chiamate.
- **Un agente «Regista» per la campagna**: un undicesimo agente da far parlare e tenere nello studio, per ciò che un file e il Referente
  fanno già. Scartata.

## Conseguenze

- Regole di `AGENTS.md` che l'applicazione tocca: 8b-bis (l'eccezione «solo verso il basso» di `pace`), 8d (anche `.campaign/` fra ciò
  che sta fuori dall'universo), 8f (`game.expenses` in `GAME_FIELDS`; `campaign.md` resta a casa), 8i (il pagante risolto in `charge`,
  `chi` invariato), 8j (`admit` controlla anche gli ospiti), la tabella del Concilio (il Referente: `direttiva` e `individuo`). Applicandolo
  si aggiornano `AGENTS.md`, `docs/architettura-dettagli.md` (`#lobby`, `#carte-crediti`, `#multigiocatore`, `#concilio`, `#corona`,
  `#geografia`), il glossario (campagna, ospiti e inviti, ritmo del mondo, direttive, spese della partita) e `src/kernel/internalNames.ts`.
- Superfici nuove, da registrare quando nascono i task (studio, § 7): il pagante risolto dalla politica, la rotta `guests`, l'invito
  nell'URL, l'enumerazione, il file `.campaign`, il messaggio `pace`, le direttive nei prompt, i contenuti dichiarati.
- I task, in ordine (studio, § 6): le spese del master; l'universo privato (lo stesso varco del task 6 di ADR-0184); il ritmo; le
  direttive; le regioni; individui e trame; la campagna nel sito. Circa il 25 % di una settimana.
- Un master che paga tutto e invita può ancora finire i crediti: il mondo passa ai modelli locali per tutti e lo dice; è la scelta di
  ADR-0081 estesa, non un fermo.
- Le direttive sono testo del master dentro i prompt: ciò che il filtro non prende arriva agli agenti; il master lo vede e lo corregge nel
  file, e la quarta parete sui testi scritti (T350) resta a valle.

## Domande per l'autore (chiuse: D54)

1. Quando paga il master, il titolare delle carte resta chi ha chiesto (le collezioni dei giocatori si riempiono, le quote dell'eredità
   seguono loro) o è il master? *Consiglio: chi ha chiesto, come per le comuni di oggi; la lobby lo dice.*
2. Con «paga il master» in un universo **pubblico**, gli anonimi restano ai modelli locali? *Consiglio: sì; in un universo privato un ospite
   anonimo è stato invitato e il master risponde di lui.*
3. La pausa ferma anche i dialoghi fra individui, le trame e le sessioni (ciò che il mondo fa da sé), e lascia le risposte ai viandanti?
   *Consiglio: sì.*
4. L'HUD dice ai giocatori «il mondo è in pausa: il master lo sta scrivendo»? *Consiglio: sì, fuori dal mondo come l'avviso dei crediti.*
5. Le direttive: un file solo a sezioni (`campaign.md`), scritto dal master e dal Referente, con il filtro della quarta parete che rifiuta
   col motivo? *Consiglio: sì, la via E.*
6. La regione `mare` è un piano d'acqua scritto dal kernel a costo zero, e `trattenuta` una pausa locale? *Consiglio: sì a entrambe.*
7. Gli inviti: 7 giorni e un uso per predefinito, il token mostrato una volta sola? *Consiglio: sì.*
8. L'universo privato di T347 e il verificatore a inviti di ADR-0184 §8 in un task solo? *Consiglio: sì, il task 2 dello studio.*

## Le risposte dell'autore (D54, 13/11)

1. **Il titolare delle carte è chi paga**: quando paga il master, `payer` e `holder` sono il master, e con loro le quote dell'eredità
   (ADR-0084). Niente spoiler: le collezioni dei giocatori non si riempiono di ciò che la campagna prepara. Scambi e cessioni di carte
   verranno più avanti, come task a parte. (Contro il consiglio, che diceva chi ha chiesto.)
2. **Sì**: con «paga il master» in un universo pubblico gli anonimi restano ai modelli locali; in un universo privato l'ospite invitato,
   anonimo o no, è a carico del master.
3. **Sì**: la pausa ferma ciò che il mondo fa da sé (i dialoghi fra individui, le trame, le sessioni; i luoghi nuovi restano bozze); le
   risposte ai viandanti continuano.
4. **Sì**: l'HUD dice «il mondo è in pausa: il master lo sta scrivendo», fuori dal mondo come l'avviso dei crediti.
5. **Sì alla via di mezzo**: le direttive in `world/campaign.md` a sezioni (la via E), scritte dal master e dal Referente; le direttive del
   master non passano da Jev, il filtro locale `metaBreak` sempre; la quarta parete di Jev (`text.fourthwall`) è una manopola negli
   universi privati.
6. **Riformulata**: la regione «riempitivo» ripete sui luoghi nuovi un ambiente che il mondo ha già (il mare, un deserto…), senza
   chiamate al Concilio, per indirizzare i viandanti senza dirlo e senza pagare luoghi che il master non vuole; resta la regione
   `trattenuta`, una pausa locale.
7. **Sì**: inviti di 7 giorni, un uso, il token mostrato una volta sola.
8. **Sì**: l'universo privato e il verificatore a inviti di ADR-0184 §8 in un task solo (T366).

I task: T372 (il punto 1, questo), T366 (il punto 2, con il verificatore a inviti), T373 (il ritmo), T374 (le direttive), T375 (le regioni,
riempitivo e trattenuta), T376 (individui e trame), T377 (la campagna nel sito).

## Applicazione del punto 1 (T372, kernel 0.7.1)

- `GameSetup.expenses` (`GameExpenses`: `shared` assente, `master`), riparato da `repairGameSetup` (solo in una partita di molti),
  `GAME_FIELDS`; dalla lobby `LobbySettings` (`settings.game.expenses` del `join`), `applySettings` → `expensesIn` e `setExpenses`.
- Nel kernel: `masterPays()`, `masterId()`, `billedTo(chi)` (l'unico risolutore, per `charge` e per `sign`), `hasCredits` con la borsa del
  master (`canPay`), `privateWorld` (falso finché T366 non lo dice per valore); `world/usage.json → masterPaid` (ciò che il master ha pagato
  per chi, `UsageLog.paidByMaster`).
- Nel server di sessione: il tetto minimo e `setSessionCap` solo per chi paga; l'esaurimento della borsa del master avvisa ogni client.
- Il portafoglio (`masterPays`, `master`, `paidFor`, `paidForTotal`), la pagina dei crediti, la lobby e la modale dei crediti lo dicono.
- La superficie nuova è la V-036 del registro della sicurezza.

## Applicazione del punto 2 (T366, kernel 0.7.5)

In [ADR-0194](0194-l-universo-privato-e-il-verificatore-a-inviti.md), insieme al verificatore a inviti di ADR-0184 (D54.8). Due cambi rispetto al
punto 2: l'invito si usa con la rotta `guests` (`redeem`) **prima** di leggere l'universo, non nel `join` (la pagina legge l'universo prima di
entrare, e a un estraneo non esiste); il link lo porta nel frammento (`#invito=`), che non arriva a nessun server. Diventando privato, chi è nel
mondo resta fra gli ospiti. `privateWorld` arriva al mondo per valore (`WorldOpen.private`, `setPrivate`). La superficie nuova è la V-038.
