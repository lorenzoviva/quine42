# ADR-0236 — L'aria e l'ossigeno

Data: 2026-11-21 · Stato: accettato (task T446 del backlog, S2 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 2.4)
· Riferimenti: ADR-0224 (la fisica rimodellabile: `air` dei terreni e `oxygen` della natura, previsti per T446), ADR-0225 (il corpo che
nuota: la fatica e l'annegare del kernel, il modello), ADR-0226 (la gravità per regione del master, il modello), ADR-0233 (il vuoto e le terre
del vuoto), ADR-0234 (la capsula: il suo ponte avrà aria), ADR-0180 (ciò che si indossa), ADR-0221 (ciò che il kernel non sa fare non si
chiede), ADR-0136 (la versione del kernel)

## Contesto

ADR-0224 ha messo fra le primitive della fisica l'**aria** di un terreno (vero se non detto) e il **respiro** della natura (`nature.oxygen`,
chiuso a falso finché un task non lo rendeva vero); T445 ha fatto il vuoto senz'aria. Lo studio (§ 2.4) chiedeva un bisogno `oxygen` che esiste
solo dove la natura lo dice, l'aria per terreno, ambiente, regione e veicolo, il fiato che cala fuori dall'aria e risale dentro, la tuta che lo
rallenta, l'asfissia come morte, la bombola che lo ricarica, e tutto fatto dal kernel, non da `sys.needs`. Il task aggiunge che l'aria è una
**grandezza generica** che il Concilio usa anche altrove (le miniere, sott'acqua).

## Decisione

1. **L'aria è una proprietà, mai un gas** (`src/kernel/air.ts`). In un punto del mondo la dice la prima fonte che parla (`airOf`), dalla più
   vicina al corpo: il **ponte di un veicolo che la tiene** (`vehicle.air`: vero se non detto per un veicolo del vuoto, la capsula, falso
   altrimenti, perché un ponte aperto ha l'aria di ciò che ha sotto); il **terreno** senz'aria (`air: false`; il vuoto mai, qualunque cosa dica
   un ponte aperto); una **regione del master** che la dice (`Region.air`, vero o falso: una luna nuda, una cupola su un asteroide; mai una
   trattenuta, `regionAir`); l'**ambiente** del luogo che dice `air: false` (un pozzo allagato, la roccia di un corpo senz'aria; il validatore
   rifiuta ogni altro valore); il **corpo del vuoto** (un asteroide no, una stazione sì, come nella tabella § 2.1 dello studio); altrove c'è.
   `Kernel.airAt(x, y, z)` la calcola; `breathing()` per il viandante che agisce (nella corona e nello studio sempre). Niente falle né automa
   dell'aria: una stanza che si svuota sarebbe un altro task.
2. **Il respiro è della natura**: `NATURE_ACCEPTS.oxygen` diventa `[false, true]`; fissato alla Genesi come il resto (`keepNature`).
   **Nessuna ambientazione lo porta ancora**: lo spazio nel Concilio (T450) lo darà con il vuoto. In un mondo senza respiro niente cambia: i
   bisogni non hanno `oxygen`, l'aria non si conta, le richieste del Concilio sono le stesse di prima.
3. **Lo fa il kernel** (`breathingTick`, dopo il nuoto, per ogni viandante anche dei client), non `sys.needs`: un universo che l'ha riscritto
   respira lo stesso, il client non lo scrive (i bisogni sono componenti del kernel). Un bisogno `oxygen` che manca o non è un numero è pieno
   (100). Fuori dall'aria cala di `OXYGEN_DRAIN` (100 in due minuti), diviso il fiato di ciò che si indossa (`bonus.breath`, il più grande,
   entro 1-10: una tuta 10, `breathOf`); nell'aria risale di `OXYGEN_REFILL` (in cinque secondi); a zero la salute scende di `ASPHYXIA_HEALTH`
   (2 al secondo) e a zero il viandante muore di **asfissia** (`die('asfissia')`, col livello della morte della partita). Non soffocano gli
   dei, chi è trasceso da solo, chi sta già morendo; la rinascita, gli dei e chi è trasceso hanno l'ossigeno pieno. Il mondo lo dice una volta a
   ogni cambio («Qui non c'è aria…», «Torni a respirare.»).
4. **La bombola e gli effetti**: un oggetto con `effects.oxygen` si respira qualunque sia la sua categoria (`core.items`, «Respiri: …»), solo
   dove i bisogni hanno l'ossigeno; il Narratore lo scrive fino a 100 (`toItemDef`), la tuta come `bonus.breath`. L'effetto `needs` accetta
   `oxygen` come gli altri bisogni (±40), che `core.effects` cambia solo dove c'è. La bombola dei reami di T278 ha `effects.oxygen: 100`.
5. **Il Concilio** dice l'aria solo in un mondo che conta il respiro: alla Genesi il Fisico per un terreno che non è dei codici di base (i
   codici di base hanno l'aria) e il Cartografo per un ambiente (`PHYS_SCHEMA_BREATH`, `LAYOUTS_SCHEMA_BREATH`, con una riga nella
   richiesta); il master per una sua regione (la riga «aria» del modulo «Dichiara regione», solo in quel mondo). Lua la legge con
   **`world.air_at(x, y)`** (vero o falso, anche dove il respiro non conta: una fiamma che non si accende, un mantice che non serve), in sola
   lettura: `Host.air_at`, `prelude.lua`, `LUA_API`, il prompt dell'Ingegnere.
6. **A schermo**: la barra «ossigeno» nell'HUD solo se i bisogni la hanno; la morte per asfissia ha le sue parole. In multigiocatore i bisogni
   vanno al client come prima (con `oxygen` dentro): nessun campo nuovo sul filo.

## Conseguenze

- Kernel **0.10.12**: il contratto non cambia (ciò che c'era resta com'era; la natura di prima non ha il respiro). Cose nuove: `src/kernel/air.ts`
  (`airOf`, `breathOf`, `breathTick`, `OXYGEN_DRAIN`, `OXYGEN_REFILL`, `ASPHYXIA_HEALTH`, `ASPHYXIATED`), `Kernel.airAt`, `Kernel.breathing`,
  `Needs.oxygen`, `VehicleSpec.air`, `Region.air` e `regionAir`, `EnvironmentDef.air`, `world.air_at`; `tests/aria.test.ts`.
- Restano: l'ambientazione dello spazio che porta il respiro e le sue bombole e tute (T450); il fiato sott'acqua dei Pirati (il giorno che
  si nuoterà sotto la superficie); l'aria che si svuota da una stanza; il Cartografo che dice l'aria di un ambiente chiesto a mondo acceso
  (`cartographer.environment`) e la pagina della campagna nel sito con la riga dell'aria (la rotta la accetta già).
- Sicurezza: una superficie nuova per Lua, `world.air_at`, in sola lettura (un booleano: niente arriva al kernel); un campo nuovo di una
  regione del master (`air`), un booleano controllato da `masterRegion` e tagliato dal filo (`regionAsked`); il bisogno `oxygen` lo scrive solo
  il kernel e i campi dei pannelli non toccano i bisogni.
