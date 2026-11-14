# ADR-0201 — Il pacchetto del self-hosting: un'immagine con l'etichetta del kernel, compose col tunnel facoltativo, la guida

Data: 2026-11-14 · Stato: accettato · Riferimenti: T367 (step 43, Fase IV: la open beta), ADR-0112 (il server di produzione), ADR-0184 (la open
beta), ADR-0189 (la modalità senza pagamenti e `/healthz`), ADR-0194 (il verificatore a inviti), ADR-0197 (le chiavi dei giocatori),
ADR-0152 e ADR-0156 (il contratto del kernel), `docs/design/open-beta.md` § 2.3, § 5 punti 6-7, § 6 riga 7, D52.6

## Contesto

La open beta lascia l'hosting a chi lo paga: un master fa girare il server su una macchina sua o su un servizio che legge un `Dockerfile`
(studio § 2). Il server di produzione c'era (ADR-0112: `npm run build`, `npm run build:server`, `npm run serve`), ma non un modo di consegnarlo:
niente immagine, niente esempio di `.env`, niente guida, e il comando del padrone di un server senza Firebase (`npm run inviti`, ADR-0194) girava
solo con `vite-node`, cioè con tutto il progetto e le sue dipendenze di sviluppo. D52.6: solo il `Dockerfile` per Railway, niente template nel
marketplace (un template paga a chi lo pubblica una parte dei consumi). Lo studio (§ 5 punti 6-7) chiede che l'immagine non abbia segreti, che il
server non ascolti fuori se non è detto, che l'esempio non abbia valori veri e che la guida dica dove va la fiducia.

## Decisione

1. **Un'immagine a tre stadi** (`Dockerfile`, `node:22-bookworm-slim` fisso): la build con tutte le dipendenze (`npm ci`, `npm run build`,
   `npm run build:server`), le dipendenze di esecuzione (`npm ci --omit=dev`: il server importa solo `firebase-admin`, il programma dei mondi porta
   con sé tutto), e ciò che gira: Node, `git` (ogni universo è un repository), `tini`, `dist/`, `dist-server/`, `site/beta.json` (l'interruttore
   dei laboratori, letto all'avvio) e i due script. Gli universi in un volume su `/app/universes` (`QUINE_UNIVERSI`); `QUINE_HOST=0.0.0.0` dentro
   il container, perché lì ogni indirizzo è del container: ciò che arriva da fuori lo decide chi pubblica la porta. La porta è `QUINE_PORTA`, o
   `PORT` (Railway), o 8080. `HEALTHCHECK` su `/healthz`.
2. **L'etichetta del kernel, controllata sul codice.** L'immagine si costruisce con `KERNEL_VERSION` (argomento di build), che deve essere la
   versione di `package.json`, o la build si ferma con un messaggio che rimanda alla guida; l'immagine porta `quine42.kernel` e
   `org.opencontainers.image.version`. `npm run immagine` (`tools/produzione/immagine.mjs`) la costruisce con due etichette, `quine42:X.Y.Z` e
   `quine42:X.Y` (il contratto), mai `latest`; compose la costruisce e la chiama da `QUINE_KERNEL` del `.env`, richiesta. Così chi ospita
   cambia versione apposta, mai tirando un'immagine: un universo di un altro contratto si apre in sola lettura (ADR-0156).
3. **Il server non gira come root.** Il volume di un servizio (Fly, Railway) nasce di root, quello di compose prende il proprietario dall'immagine:
   l'avvio (`quine-avvio`, `tools/produzione/immagine/avvio.sh`) parte da root solo per dare la cartella degli universi a `node` se non è sua, poi
   `exec setpriv` a `node`; partito come un altro utente, va avanti com'è. Il comando del padrone, `inviti` nell'immagine
   (`tools/produzione/immagine/inviti.sh`), scende anch'esso a `node`, così il libro delle identità resta scrivibile dal server anche se la shell di
   `docker compose exec` è di root.
4. **Il comando degli inviti nel pacchetto**: `buildServer` costruisce anche `dist-server/inviti.mjs` da `tools/inviti/cli.ts`, come il server
   (tutto dentro tranne `firebase-admin` e `vite`); `npm run inviti` resta per lo sviluppo.
5. **Compose** (`docker-compose.yml`): il servizio `quine` (il `.env` come `env_file`, la porta pubblicata su `QUINE_PUBBLICA_SU`, predefinito
   `127.0.0.1`, e `QUINE_PUBBLICA_PORTA`; il volume `universi`; 30 secondi per fermarsi), e tre profili: `tunnel` (un Cloudflare Tunnel con nome,
   `CLOUDFLARE_TUNNEL_TOKEN`), `tunnel-rapido` (trycloudflare.com, senza dominio), `backup` (un `tar` del volume in `./backup/`, a server fermo,
   letto in sola lettura).
6. **`.env.example`** con ogni variabile del server di produzione, vuote le chiavi, i segreti e i token, la open beta detta
   (`QUINE_PAGAMENTI=spenti`, `QUINE_ACCOUNT=inviti`): così com'è il server dice che manca solo `QUINE_SEGRETO_INVITI`. `.dockerignore` tiene
   fuori `.env` e ogni `.env.*` tranne l'esempio, gli universi, le build e le dipendenze di questa macchina, `.git`, le cartelle degli agenti.
7. **La guida** è `docs/self-hosting.md`: la fiducia (chi gioca ti affida la sua chiave, in memoria; i tuoi universi sono sul tuo disco), il
   contratto e gli aggiornamenti, il `.env`, il padrone e gli inviti, dove ospitarlo (PC di casa con il tunnel, VM o VPS con Caddy, Railway senza
   template, Fly con un `fly.toml` di esempio, il pacchetto Node senza Docker), il controllo di salute, il backup (il `tar` del volume a server
   fermo, `git bundle` di un universo a server acceso, il ripristino), lo spegnimento, e che cosa è provato.
8. **Sicurezza**: V-041, chiusa da `tests/sicurezza/pacchetto.test.ts` (i file del pacchetto) e da `tests/sicurezza/produzione.test.ts` (il
   comando degli inviti costruito gira con `node` e non dice il segreto).

## Conseguenze

- Un master ha un comando per l'immagine e uno per avviarla; Railway e Fly la costruiscono dal repository con `KERNEL_VERSION`.
- Salire di versione del kernel non cambia nessun file del pacchetto: la versione la legge lo script da `package.json`, e `QUINE_KERNEL` la
  scrive chi ospita.
- Non provati da T367: un container vero (la macchina dell'autore ha la virtualizzazione spenta, Docker Desktop non parte), il tunnel, Railway, Fly e
  una VPS. Provato il contenuto dello stadio finale: le due build e le sole dipendenze di produzione in una cartella a parte, avviate con l'ambiente
  dell'esempio, un mondo di molti giocato da due browser con due identità a inviti. La prima prova con Docker la fa T45f (il server ufficiale su
  una VM con questo pacchetto).
- `CLOUDFLARE_TUNNEL_TOKEN` sta nello stesso `.env` e quindi anche nell'ambiente del server (mai in quello dei mondi, ADR-0110): accettato, è il
  segreto di chi ospita sulla sua macchina.
