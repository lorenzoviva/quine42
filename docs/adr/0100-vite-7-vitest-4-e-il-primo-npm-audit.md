# ADR-0100 — Vite 7, Vitest 4 e il primo `npm audit`

Data: 2026-11-01 · Stato: accettato (task T131 del backlog) · Riferimenti: V-014 in `docs/sicurezza/registro.md`, audit T117 (R14), ADR-0088 (i turni), ADR-0098 (il processo delle vulnerabilità)

## Contesto
Il primo `npm audit` (01/11/2026) ha dato 15 avvisi: 2 critici, 5 alti, 8 moderati. La maggior parte riguarda Vite 5.4.10 (`server.fs.deny`, origini incrociate, `launch-editor`) e Vitest 2.1.4 (con `tinypool`,
`@vitest/mocker`), che servono solo in sviluppo; ma oggi il server di sviluppo **è** il server del gioco. Il kit di T137 aveva già misurato che con Vite 5.4.10 quel server dà `.env` con due forme della richiesta.
Il task chiedeva di restare nella 5.x **se bastava**: non basta. L'ultima 5.x (5.4.21) resta dentro avvisi che arrivano fino alla 6.4.3, e Vitest fino alla 4.1.11 ne ha altri, e dalla 4 non accetta più Vite 5.

## Decisione
1. **Vite `^7.3.7` e Vitest `^4.1.12`**: senza avvisi aperti. Vite 8 e Vitest 5 non chiudono nulla di più, e un salto ulteriore è un rischio che qui non serve: si fa a parte, se un giorno servirà.
2. **`vite-node` diventa una dipendenza diretta** (`^5.3.0`): Vitest 4 non lo porta più, e `npm run abbonamento` lo usa.
3. **Un override limitato**: `@firebase/firestore → @grpc/grpc-js ^1.13.6`. Firebase 13 chiede `~1.9`; gli avvisi riguardano chi fa da server gRPC. Il progetto importa solo `firebase/app` e `firebase/auth`, e il codice di Firestore e di gRPC non
   entra in `dist/` (controllato sulla build: solo il nome del pacchetto, nell'elenco di `@firebase/app`). L'alternativa di `npm audit fix --force` è tornare a Firebase 9.14: peggio. L'override non aggiunge rischio a ciò che gira e lascia `npm audit` a zero, così un avviso nuovo si vede.
4. **`tests/sicurezza/dipendenze.test.ts`** tiene ciò che regge senza rete: il lock non torna indietro, il server di sviluppo non dà `.env` nelle forme del kit (le stesse: stanno in un posto solo).
5. **`npm audit` non è nella suite**: vuole la rete e il suo esito cambia senza che cambi il codice. Si lancia a mano, ed è una fonte del registro.

## Alternative scartate
- **Vite 5.4.21 e Vitest 2.1.9**: chiudono le due forme di `.env`, ma lasciano gli avvisi aperti su un server che oggi è quello del gioco.
- **Vite 6.4.x**: gli avvisi arrivano fino alla 6.4.3; il ramo 7 ne è fuori per intero, e Node 22 e il codice del progetto lo reggono senza modifiche.
- **Accettare gli avvisi di `@grpc/grpc-js` senza override**: `npm audit` resterebbe sempre rosso, e un avviso nuovo non si vedrebbe.

## Conseguenze
- **Il `node_modules` condiviso**: i worktree della pipeline usano quello del base con una junction. Chi cambia le dipendenze toglie la junction **da sola** (`fs.unlinkSync`) e installa nel suo worktree, altrimenti cambia sotto i piedi tutti i task in corso.
  Dopo `integra` serve `npm ci` nel base: fino ad allora i worktree girano con le versioni vecchie, e `npm run abbonamento` non trova `vite-node`.
- **npm 10.9.3** (quello della macchina) non sa risolvere l'installazione di Vitest 4 da questo lock (`Cannot read properties of null (reading 'edgesOut')`). Il lock è stato scritto con npm 11 (`npx npm@11 install`); npm 10 lo legge: `npm ci` e `npm install` su un lock già fatto passano.
  Chi aggiorna di nuovo Vitest, se vede quell'errore, usa npm 11.
- `minWorkers` non esiste più in Vitest 4: `server/testWorkers.ts` dice solo `maxWorkers`.
- Il server di produzione resta T133: ciò che qui si chiude è la parte delle dipendenze di V-014.
