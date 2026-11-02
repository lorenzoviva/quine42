# ADR-0111 · La CSP delle pagine: un'intestazione del server

- Stato: accettato
- Data: 2026-11-02
- Task: T132 (V-015), T170 (integrazione)

## Contesto

Le pagine del gioco e del sito non avevano una Content Security Policy: un valore di un universo che fosse finito nell'HTML (il seme in `site/sessioni.ts`, V-015) sarebbe stato codice. L'escape resta la prima difesa; la CSP è la seconda. Deve lasciare lavorare three.js, i worker dei modelli, Lua in WebAssembly, il WebSocket della partita e, dove ci sono gli account, Firebase Auth.

## Decisione

1. **Un'intestazione, da un punto solo**: `server/csp.ts`, `contentSecurityPolicy(config)` e il plugin `securityHeaders`, primo in `vite.config.ts`, su ogni risposta del server di sviluppo e della preview. **Il server di produzione (T133) deve mettere la stessa intestazione**: chi lo scrive chiama `contentSecurityPolicy`.
2. **Script solo da questa origine**: niente `unsafe-inline` né `unsafe-eval`. `wasm-unsafe-eval` è ciò che serve a wasmoon e non apre l'`eval` di JS. Quindi nell'HTML niente `<script>` scritti dentro né gestori `on…=`: un test li cerca in tutte le pagine.
3. **Gli stili restano inline** (`style-src 'unsafe-inline'`): le pagine e i pannelli ne sono pieni e Vite li inietta in sviluppo. Uno stile non esegue codice; toglierlo costerebbe una riscrittura per poco.
4. **Il resto è chiuso**: `default-src`, `connect-src` e `worker-src` su `'self'` (che comprende il WebSocket della stessa origine), immagini anche `data:` e `blob:`, `object-src` e `frame-src` `'none'`, `base-uri` e `form-action` `'self'`, `frame-ancestors 'none'`. Stripe Checkout è una navigazione e non chiede nulla.
5. **Firebase solo dove ci sono gli account**: con `FIREBASE_PROJECT_ID` si aggiungono `https://apis.google.com` agli script, `identitytoolkit` e `securetoken` alle connessioni, il dominio di Auth (ed eventualmente l'emulatore) ai frame. Ciò che viene dall'ambiente entra nell'intestazione solo se è un nome di host.

## Alternative

- **Un tag `<meta>` nell'HTML**: non regge `frame-ancestors` e fisserebbe alla build ciò che dipende dagli account del server che la serve.
- **Un nonce per gli script**: non serve, nessuna pagina ha script inline.

## Conseguenze

- Una risorsa esterna nuova, o uno script o gestore scritto nell'HTML, viene bloccata finché non passa da qui. Il primo sintomo è un errore nella console della pagina.
- I testi delle pagine restano da mettere in sicurezza con l'escape: la CSP non impedisce un elemento HTML iniettato, solo che esegua codice.
- L'accesso con Google vero non è stato provato con questa politica: l'elenco di Firebase viene dalla sua documentazione, va guardato alla prima prova con un progetto vero.
