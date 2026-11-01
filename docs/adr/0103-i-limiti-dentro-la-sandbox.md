# ADR-0103 — I limiti dentro la sandbox: il lavoro del C si conta, la memoria la tiene l'allocatore

- Stato: accettato
- Data: 2026-11-01
- Task: T126 (voce V-007 del registro; la seconda metà è T127)

## Contesto

Il budget contava le istruzioni della VM per ogni chiamata: non il lavoro dentro le funzioni C, non il tick, non la memoria. Un solo pattern
di `string.find` bloccava il processo per sempre (il matcher di Lua torna indietro senza fine e nessun hook può fermarlo), `string.rep` allocava
200 MB senza guasti, e in un ciclo un'istruzione può costare un'enormità: `s .. 'x'` copia tutta `s`. I programmi MarkovJunior giravano in linea
con la scatola che dice il loro XML e il `tempo` che dice l'indice. Tick, Lua e HTTP stanno nello stesso event loop: un blocco ferma tutti.

## Decisione

1. **Il matcher dei pattern è in due.** Prima di ogni `find match gmatch gsub` il prelude calcola il caso peggiore del matcher in C da pattern e
   lunghezza (`pattern_cost`: `k` ripetizioni su `n` caratteri sono C(n+k, k) modi, per ogni partenza e ogni carattere del pattern). Se è piccolo
   (`NATIVE_PATTERN`) gira in C, e quel lavoro si addebita al budget; se no gira **lo stesso matcher scritto in Lua** (un porting di `lstrlib.c`,
   con gli stessi risultati e gli stessi errori: `tests/sandbox-patterns.test.ts` li confronta), dove l'hook conta ogni passo. Così un pattern
   patologico finisce nel guasto del budget, senza divieti sui pattern, che avrebbero rotto anche quelli buoni. Un pattern è lungo al più 1024 caratteri.
2. **Il lavoro in C si addebita.** Le versioni con limiti stanno nelle tabelle vere (`string`, `table`, `utf8`), perché è lì che punta la
   metatable delle stringhe: `rep` (la lunghezza e anche il conto: con una stringa vuota C girerebbe senza allocare), `byte`, `utf8.codepoint`, `table.unpack`
   (al più 8192 valori sulla pila), `table.move` (al più 2^20 elementi), `concat`, `sort`, `insert` e `remove` con la posizione, `tonumber`.
3. **La memoria la tiene l'allocatore** (`Meter` in `sandbox.ts`, con `lua_setallocf`), l'unico punto da cui non si scappa, qualunque sia il
   modo di fare un valore: 64 MB per la VM, 1 MiB per una stringa, 256 MB allocati in tutto in una chiamata (copiare è lavoro). **I limiti valgono solo
   mentre gira il codice dell'universo, dentro il suo `pcall`**: lì un'allocazione rifiutata è un errore normale, fuori (il kernel che spinge
   argomenti da JS) Lua andrebbe in panico e l'istanza wasm morirebbe. Dopo un errore di memoria un `pcall` dell'universo non continua: ogni nuovo
   fallimento costerebbe una raccolta intera. Sotto, `Sandbox.enter`: un'eccezione che esce dalla VM è un guasto, mai un'eccezione nel tick.
4. **Un budget per il tick** (12 milioni di istruzioni; contano anche il lavoro in C e i byte allocati), da `tickBegin` a `tickEnd`, attorno alle righe
   delle rune e ai sistemi. Chi lo supera ha il guasto; chi viene dopo salta il tick senza un guasto suo, perché non è colpa sua e il guasto farebbe
   partire la riparazione dell'Ingegnere: il tick ha il guasto `tick:budget`. I sistemi `core.*`, il pavimento, girano comunque (ciascuno con il suo
   budget): una riga incisa non ferma il cammino degli altri. Fuori dal tick vale il budget di ogni chiamata.
5. **Una rete con l'orologio**: 2 secondi per chiamata, guardati dall'hook. Serve per ciò che non si può misurare (confronti tra stringhe lunghe, `next` su
   una tabella svuotata). È l'unico orologio della simulazione: ADR-0055 lo vieta perché due kernel divergerebbero, e qui può succedere solo se il mondo è già bloccato.
6. **MarkovJunior**: `FORM_LIMITS` per i modelli del gioco (8 milioni di celle; il più grande del seme ne ha 1,8), `MAX_FORM_TIME` (30 s, il massimo che
   `tempo` può chiedere), `MAX_FORM_XML`, nel validatore e in `runForm`; la scadenza si guarda a ogni passo, non ogni 256. `MJX_LIMITS` resta per il laboratorio.
7. **I guasti restano corti**: un errore lanciato arriva al guasto tagliato a 400 caratteri; `log`, `say`, `speak` e il risultato di una riga hanno anch'essi un tetto.

## Conseguenze

- I moduli del seme girano senza cambiare: nessuno usa i pattern di `string.*`. Un pattern costoso su un testo molto lungo (decine di KB) ora può
  esaurire il budget dove il C ce l'avrebbe fatta: è il prezzo di poterlo fermare.
- Il tick del seme in Node passa da ~0,95 a ~1,15 ms: l'allocatore attraversa JS a ogni allocazione.
- **Non basta da solo**: resta un blocco di qualche secondo per chiamata, la memoria dal lato JS (`ecs.spawn` senza fine) non è contata, un
  programma MarkovJunior può ancora occupare il processo fino a `MAX_FORM_TIME`. Il processo si protegge con il worker e il sorvegliante di T127.
