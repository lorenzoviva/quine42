# ADR-0055 — Semi condivisi e determinismo

Data: 2026-10-24 · Stato: accettato (task T35 del backlog) · Prepara la fase 1 di ADR-0050 (il multiplayer, decisione 2:
il server unica fonte di verità); estende ADR-0002 (sandbox) e ADR-0054 (il viandante con un id).

## Contesto
Con il kernel sul server (T38) e i client che predicono il proprio passo (T39), due kernel con lo stesso universo e la stessa
sequenza di input devono arrivare allo stesso stato. Il kernel derivava già quasi tutto da `(seme, coordinate)` (`rng.ts`:
`hash32`, `Rng`), e il Lua dell'universo ha `hash(a, b, c, d)` puro. Restavano fuori:
- `math.random` della sandbox: la copia della libreria di Lua, seminata da Lua stesso con l'orologio quando nasce lo stato;
  `math.randomseed()` senza argomenti rilegge l'orologio;
- `Math.random` nel kernel (le cose di un contenitore rotto sparse a terra);
- `Date.now()` in nomi che restano nello stato del mondo (l'origine di un figlio, la chiave della regola della morte, l'id di
  una trama);
- il `MockModels`, che dava a ogni individuo un nome a caso (`Math.random`), così due kernel offline non avevano le stesse persone.

## Decisione
1. **Il generatore di Lua lo semina il kernel.** Il preludio ha `K.seed(n)` (`Sandbox.seed`); `K.reset` semina 0. Prima di ogni
   ingresso nel codice dell'universo (`runModule`: sistemi, hook, generatori; le righe delle rune) il kernel chiama `seedLua`
   con `hash32(seme dell'universo, tick, chi chiama, entità, n)`: *chi chiama* è `module:<id>:<fn>` o `rune:<chiave>`,
   l'*entità* il primo argomento numerico (l'id per gli hook, `dt` per i sistemi), *n* quante volte la stessa chiave è già
   entrata in questo tick. Così un sistema in più non sposta i dadi degli altri, e due chiamate uguali nello stesso tick non
   tirano gli stessi numeri.
2. **`math.randomseed` dell'universo non legge mai l'orologio**: con argomenti risemina (deterministico), senza argomenti vale 0.
3. **Il kernel tira da `rngFor(...sale)`**: un `Rng` da `(seme, tick, …sale)`, al posto di `Math.random`.
4. **I nomi unici dal tempo del mondo**: `worldStamp()` (il tempo del mondo in millisecondi, in base 36, con un contatore se due
   cadono nello stesso istante) al posto di `Date.now()`; il tempo del mondo è salvato (`stato.json → ora`), quindi resta unico
   tra una sessione e l'altra.
5. **I modelli offline sono deterministici**: gli individui del `MockModels` vengono da un contatore dell'istanza.
6. **Ciò che resta fuori dalla simulazione** può usare l'orologio, perché non entra nello stato del mondo: il registro (`log`,
   `feed`), i consumi (`usage`), i commit (`repo`), i guasti (`Faults.since`), le misure della catena (`performance.now` attorno a
   ogni sistema), gli schermi della Direzione. Le scadenze di MarkovJunior (`deadline`) sono una rete contro i programmi che non
   finiscono: un programma che le tocca è già difettoso; il limite di passi, deterministico, resta la regola.

## Conseguenze
- `tests/determinism.test.ts`: due kernel con lo stesso universo (più un sistema che tira i dadi con `math.random`) e lo stesso
  input arrivano allo stesso stato dopo 240 tick (entità, posizioni, persone, dadi, tappeto); con un altro seme i dadi cambiano.
- La generazione asincrona (risposte del Concilio) non è coperta: l'ordine in cui arrivano le risposte dipende dalla rete. Sul
  server (T38) la genera e la applica solo il server, e i client ricevono il risultato.
- Il `dt` fa parte dell'input: il server tiene un passo fisso.
