# ADR-0099 — Il confine tra JS e Lua: una sola traversata, solo dati

- Stato: accettato
- Data: 2026-11-01
- Task: T122 (voci V-008, V-017, V-019 del registro)

## Contesto

«Non si esce dalla sandbox» è la prima delle tre proprietà che l'autore non negozia (ADR-0098), e il Lua gira nel processo che tiene i
segreti. wasmoon, nella configurazione di prima, passava ogni oggetto JS come userdata con il suo `js_proxy`: un `__index` che legge anche
la catena dei prototipi e consegna i metodi, un `__newindex` senza filtri, un `__call`. Da Lua si raggiungevano quindi `constructor`,
`__proto__`, i metodi di oggetti e liste (misurato dal kit di T137). Dalla lettura del codice di wasmoon, non provato prima della
correzione: `__proto__` si poteva anche scrivere, e l'errore alzato per un indice sbagliato arrivava a `pcall` come oggetto JS, con lo stesso proxy.

Nell'altro verso, ogni tabella Lua diventava un oggetto JS con dentro funzioni vere, che giravano fuori da `guarded` e quindi senza
budget se il kernel le chiamava, anche solo trasformando l'oggetto in testo (`toString`) o risolvendolo come promessa (`then`). La lettura
delle tabelle non aveva limiti di profondità né chiedeva spazio sulla pila di Lua.

Infine la prova di caricamento dei moduli eseguiva il codice non ancora approvato nella VM del mondo, con l'`Host` vero.

## Decisione

1. **Una sola traversata.** Il proxy di wasmoon è spento (`enableProxy: false`). `Crossing` (`src/kernel/sandbox.ts`) è un'estensione di
   tipo con la priorità più alta, registrata subito dopo il prelude: tutto ciò che va da JS a Lua e da Lua a JS, dopo quel momento, passa da lì.
2. **Da JS a Lua, una vista dei dati.** Un oggetto è una userdata che legge l'oggetto vero, così i sistemi continuano a modificare i
   componenti sul posto, ma dà solo **i campi propri che sono dati**: niente prototipi, metodi, chiamate. Non si scrive ciò che viene dalla
   catena dei prototipi.
3. **Da Lua a JS, dati.** Una tabella diventa un oggetto semplice, senza funzioni, senza i nomi di `Object.prototype`, senza cicli (il
   riferimento all'indietro non arriva), al più 64 livelli; una funzione Lua non arriva mai a JS (`undefined`). Le uniche funzioni Lua in JS sono
   quelle del kernel (`K`), prese prima che la traversata sia attiva.
4. **Le funzioni dell'`Host`** non stanno in un oggetto JS: sono copiate in una tabella Lua, ciascuna con un involucro che restituisce solo
   dati e alza solo testo.
5. **`string.dump`** si toglie dalla tabella vera, in testa al prelude: la metatabella delle stringhe punta a quella.
6. **La prova di caricamento** (`Sandbox.probe`) gira in una VM a parte, con un `Host` che non fa nulla, azzerata prima di ogni prova.

## Conseguenze

- Il costo non cambia (misurato: 5,1 s contro 5,3 s per 200 000 giri di lettura e scrittura dei campi di un componente; 600 tick del
  kernel e il boot sono uguali entro il rumore) e l'identità degli oggetti resta: una vista ridata all'`Host` è l'oggetto vero.
- Ogni `Sandbox` ha due VM, cioè due istanze wasm: si aprono insieme in circa 20 ms; la memoria per mondo cresce di un'istanza.
- La VM di prova **non si butta a ogni prova**: `validateForged` è sincrona e aprire una VM è asincrono. Si azzera, e ciò che un modulo può
  toccare (l'ambiente, le tabelle copiate) rinasce con `K.reset`; in ogni caso può vedere solo la prova successiva, mai il mondo.
- Un modulo che nel corpo principale usa ciò che esiste solo nel mondo vero (l'id del viandante, un componente) ora vede l'`Host` vuoto.
- Il codice dell'universo non può più chiamare metodi JS su liste e oggetti: una ricerca nei moduli e nei prompt del seme non ne trova, ma
  un modulo generato in un universo già esistente che lo facesse andrebbe in guasto (e l'Ingegnere lo ripara). `tostring` di una lista dà solo i suoi valori semplici.
- wasmoon è una dipendenza a cui si chiede più di prima: `Crossing` usa la sua API delle estensioni di tipo e, per gli errori, il nome
  `js_error`. Aggiornando wasmoon valgono i test di `tests/sicurezza/uscita.test.ts`.
- **Cosa non decide**: il confine non difende dal blocco nelle funzioni C né dalla memoria (V-007, T126 e T127), e non protegge il runtime
  da un difetto del motore wasm o di Lua stesso: per quello il mondo in un worker senza segreti (T127).
