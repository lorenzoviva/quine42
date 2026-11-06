# ADR-0154 — La via va dove va il passo: un passo vale solo se il corpo ci cammina, e chi non ha via rinuncia

Data: 2026-11-06 · Stato: accettato (task T299 del backlog) · Riferimenti: ADR-0140 (i mestieri, `world.path`), ADR-0147 (le imprese), ADR-0041 (ciò che sembra invalicabile lo è), T280 (Ugo fermo su un dislivello)

## Contesto

Nella verifica di T280 un viandante che tornava a piedi al cantiere si è fermato su un dislivello. La via lo dava percorribile, il server rifiutava il passo. La via (`findRoute`, `route.ts`) guardava ogni casella da sola, con una scatola di raggio 0.3 al suo centro. Il passo (`free` lungo il cammino, in `stepWanderer` e in `sys.wander`) vede invece il bordo fra due caselle, e lì può stare ciò che ferma un corpo: un muro sottile di un modello, il gradino di una platea o di un mobile più alto di un passo (`rampBlocks`). Sul mondo offline di prova 24 passi fra caselle vicine su 14 035 erano «liberi» per la via e chiusi per il passo. In più la via usava un raggio di 0.3 anche per un abitante, che ne ha 0.35, e chi la seguiva puntava dritto due caselle avanti, tagliando l'angolo che la via aveva girato. Senza via, poi, `sys.lavoro` andava dritto contro il muro per 8 secondi prima di arrendersi. Un mestiere o un'impresa che non arriva vale poco.

## Decisione

1. **Un passo della via vale solo se il corpo ci cammina** (`findRoute(from, to, passable, step?, near?)`): una casella è percorribile se lo è un corpo al suo centro, come prima, e un passo fra due caselle percorribili vale solo se `step` lo dice. Il kernel dà `stepFree`: senza modelli sulle caselle toccate basta il terreno (la scatola di un corpo più piccolo di mezza casella sta dentro quelle caselle), altrimenti `walkable`, cioè `free` ogni decimo di casella dal centro al centro, con l'altezza dei piedi che segue il pavimento come in `stepWanderer`. Sul mondo di prova nessun passo della via è più chiuso per il cammino (un test lo dice).
2. **Il raggio è di chi cammina**: `world.path(x, y, tx, ty, r)`, con `r` facoltativo (da 0.1 a 0.5; senza, quello di un abitante, `ROUTE_BODY` 0.35). Le vie di corpi diversi stanno separate nella cache.
3. **Il punto dato si raggiunge dritti**: il più lontano dei due prossimi della via che il corpo raggiunge in linea retta da dove si trova (o il centro della sua casella, se nemmeno il prossimo si raggiunge), portato ad almeno `ROUTE_AHEAD` (1.6): chi lo segue (`sys.wander`) lo prende per una direzione e chiede di nuovo al tick dopo. Dalla casella di chi chiede, se il suo centro non è libero (accanto a un muro, contro un banco), si esce come dicono le caselle: il passo dal centro non c'entra con dove si è.
4. **Una meta che nessuna via raggiunge si raggiunge il più vicino possibile**, entro `ROUTE_NEAR` (2.5 caselle): il centro di una bottega, un banco nel muro. Più lontano non c'è via.
5. **Senza via si rinuncia**: `sys.lavoro` fa fallire il compito subito, con `fallito:nessuna via`, e la giornata va avanti con il compito dopo. Il cammino contro il muro e il `fallito:non ci arriva` dopo 8 secondi restano per chi ha una via e non ci arriva lo stesso.
6. **Quanto costa**: una ricerca per ogni casella camminata costava. Chi è già su una via trovata verso la stessa meta (e lo stesso corpo) ne prende il resto senza cercare, e i passi provati restano in cache quanto le vie. La cache si svuota quando una casella cambia, quando un luogo si carica o si scarica (prima una via sopra un luogo non ancora caricato restava 30 secondi) e quando il primo passo di una via tenuta non è più libero (un cantiere salito di uno stadio). Su 300 vie del mondo di prova, seguite casella per casella, il tempo totale passa da 18-29 s a 3,5-4,8 s. La ricerca senza via accanto ai modelli costa di più: la peggiore passa da 0,09 s a 0,2-0,3 s, e chi non ha via ora non la richiede.

## Alternative scartate

- **Una casella è percorribile se lo è il corpo su tutto il suo bordo**: chiude anche i passaggi buoni accanto a un mobile e non vede comunque un gradino fra due caselle.
- **Il rilievo nei passi**: il terreno non è mai un ostacolo (fra vicini al più due livelli, `#rilievo`), e `free` non lo guarda; i dislivelli che fermano sono dei modelli.
- **Seguire la via anche nella routine (`sys.wander` verso `meta`)**: chi non ha un mestiere va ancora dritto verso il posto della sua routine e si scansa. Cambiarlo tocca ogni individuo e il banco di `sys.wander`; resta da fare con un task se serve.
- **Lasciare `sys.lavoro` andare dritto senza via**: è il «resta fermo» che il task voleva togliere.

## Conseguenze

- `KERNEL_VERSION` `0.1.13`: gli universi della `0.1` restano buoni (un argomento facoltativo in più per `world.path`, che senza dà la via di un abitante).
- `world.path` nel `Host`, in `prelude.lua` e nel prompt dell'Ingegnere del seme (i tre universi di `lab/banco/universi-cloud/` hanno una copia del prompt, non toccata); `docs/architettura-dettagli.md#societa`.
- `sys.lavoro` del seme: il raggio passato, `no_way` nello stato del compito (inglese, ADR-0153).
- Sicurezza: nessuna superficie nuova. Un numero in più da Lua, preso solo se è un numero finito e stretto fra 0.1 e 0.5; la ricerca ha lo stesso tetto di caselle (`ROUTE_NODES`).
