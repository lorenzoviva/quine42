# Ospitare un mondo di QUINE42 (self-hosting)

> T367, ADR-0202. Lo studio da cui nasce è [`design/open-beta.md`](design/open-beta.md) § 2. Il server è quello di produzione (ADR-0112): lo
> stesso pacchetto per il server ufficiale e per il tuo, in un'immagine Docker o come pacchetto Node.

Con questa guida un master fa girare il server del gioco su una macchina sua (un PC di casa, una VPS, una VM) o su un servizio che legge il
`Dockerfile` (Railway, Fly) e ci invita i suoi amici. I modelli li paga ognuno con la sua chiave di OpenRouter (ADR-0197): il server non incassa
niente e la macchina la paghi tu, direttamente al fornitore.

## Prima di cominciare: di chi ti fidi, chi si fida di te

- **Chi gioca sul tuo server ti affida la sua chiave di OpenRouter.** Il server la tiene nella memoria del processo, mai su disco né nei log
  (V-040), ma è il tuo processo: chi ha la macchina potrebbe leggerla. Dillo a chi inviti; il collegamento propone un limite di spesa basso e la
  chiave si revoca da OpenRouter in un clic. Il tuo server non è quello dell'autore, e il gioco non lo nasconde.
- **I tuoi universi stanno sul tuo disco.** Li puoi leggere e riscrivere; per questo le carte nate su un server di un master, quando entreranno
  in un universo ufficiale, porteranno una storia dichiarata, non contata (`design/open-beta.md` § 4).
- **L'immagine non contiene segreti**: nessun `.env`, nessuna chiave, nessun universo (`.dockerignore`, `tests/sicurezza/pacchetto.test.ts`). I
  segreti arrivano dall'ambiente quando il container parte.

## Il contratto del kernel: fissa una versione

L'immagine ha l'etichetta della versione del kernel (`quine42:0.7.10`, e `quine42:0.7` per il contratto), mai solo `latest`. Un universo nato su
un altro contratto `X.Y` si apre **in sola lettura** (ADR-0156) finché le migrazioni non lo portano (ADR-0152). Quindi:

- costruisci un'immagine da una versione scelta e scrivi quella versione in `.env` (`QUINE_KERNEL`); la build si ferma se il codice è a un'altra
  versione (il controllo è nel `Dockerfile`);
- **aggiornare**: un nuovo `Z` (0.7.10 → 0.7.11) tiene buoni gli universi della stessa `X.Y`; un nuovo contratto (0.7 → 0.8) li migra all'avvio,
  e una migrazione non si annulla. Prima di un salto di contratto fai il backup (sotto), poi cambia `QUINE_KERNEL`, ricostruisci, riparti. Se un
  universo resta in sola lettura, l'etichetta «kernel 0.7–0.7» lo dice dove si scelgono gli universi.

## 1. Il file `.env`

```bash
cp .env.example .env
```

Riempi almeno queste (il server rifiuta di partire senza, e dice perché):

| Variabile | Cosa scrivere |
|---|---|
| `QUINE_KERNEL` | la versione di `package.json` (`node -p "require('./package.json').version"`); solo per `docker compose` |
| `QUINE_ORIGINI` | l'indirizzo da cui giocate: `https://quine.example.org`; `http://localhost:8080` solo per questa macchina. Più di uno separati da virgole |
| `QUINE_PROXY_FIDATI` | 0 senza niente davanti; 1 dietro Cloudflare (anche col tunnel), Caddy, Railway o Fly. Sbagliarlo per eccesso fa scegliere a un client da che indirizzo arriva (ADR-0114) |
| `QUINE_PAGAMENTI` | `spenti`: la open beta, niente Stripe né commissione (ADR-0189) |
| `QUINE_ACCOUNT` | `inviti`: le identità le firma il tuo server, senza Firebase (ADR-0194) |
| `QUINE_SEGRETO_INVITI` | almeno 32 caratteri casuali: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Chi lo ha può firmare un'identità qualunque: non darlo a nessuno, e se lo cambi tutte le identità smettono di valere |

Facoltative: `OPENROUTER_API_KEY` con `OPENROUTER_TETTO_GIORNALIERO` se vuoi pagare tu le spese comuni del mondo (senza, si alternano sulle chiavi
dei giocatori); `QUINE_MONDO_MEMORIA` (MB di ogni mondo acceso, 1024), `QUINE_MONDI_MASSIMI`, `QUINE_UNIVERSI_PER_ACCOUNT`. Firebase al posto
degli inviti: `QUINE_ACCOUNT` vuota e `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN` (con il dominio fra quelli autorizzati
del progetto). Ogni variabile è spiegata in `AGENTS.md` («`.env`»).

## 2. Il padrone e gli inviti

Con `QUINE_ACCOUNT=inviti` il primo a entrare sei tu, il **padrone** (`inv-owner`):

```bash
docker compose exec quine inviti padrone          # nel container
npm run inviti -- padrone                          # col pacchetto Node, nella cartella del server
```

stampa un link `…/site/profilo.html#accesso=<token>`: aprilo nel tuo browser e non darlo a nessuno (chi lo ha entra come te; vale 30 giorni e si
rinnova a ogni ingresso). Poi crea un universo di molti, rendilo privato se vuoi (console del master, «Ospiti e inviti») e con «Crea invito» fai un
link a uso singolo per ogni amico: il link porta il token nel frammento, che nessun log del server vede. `inviti elenco` mostra le identità,
`inviti revoca <id>` ne toglie una.

## 3. Dove ospitarlo

### Il PC di casa (Docker)

```bash
npm run immagine                 # l'immagine quine42:<versione>; oppure: docker compose build
docker compose up -d             # http://localhost:8080, solo da questa macchina
docker compose logs -f quine     # «server di produzione in ascolto su 0.0.0.0:8080», «pagamenti spenti (open beta)»
```

Per farti raggiungere dagli amici senza aprire porte del router, un **Cloudflare Tunnel** (piano gratuito, porta anche i WebSocket):

- **con un dominio su Cloudflare** (consigliato): nel pannello Zero Trust crea un tunnel, dagli un nome pubblico (`quine.example.org`) che porta a
  `http://quine:8080`, copia il token in `CLOUDFLARE_TUNNEL_TOKEN`; in `.env` `QUINE_ORIGINI=https://quine.example.org` e `QUINE_PROXY_FIDATI=1`;
  poi `docker compose --profile tunnel up -d`;
- **un tunnel rapido, senza dominio**: `docker compose --profile tunnel-rapido up -d`, leggi l'indirizzo `https://….trycloudflare.com` in
  `docker compose logs tunnel-rapido`, scrivilo in `QUINE_ORIGINI` (con `QUINE_PROXY_FIDATI=1`) e riavvia solo il server
  (`docker compose up -d quine`). L'indirizzo cambia a ogni avvio del tunnel e non ha garanzie: basta per una serata.

Il PC deve restare acceso. Su Windows e macOS serve Docker Desktop; senza Docker, il pacchetto Node (sotto).

### Una VM o una VPS (Google Cloud, Hetzner, OVH…)

Lo stesso `docker compose up -d`, con il TLS davanti: un **Caddy** sulla stessa macchina (`quine.example.org { reverse_proxy 127.0.0.1:8080 }`
fa i certificati da solo e porta i WebSocket) o il bilanciatore del fornitore, e `QUINE_PROXY_FIDATI=1`. Lascia `QUINE_PUBBLICA_SU=127.0.0.1`:
la porta 8080 la raggiunge solo Caddy. In alternativa il tunnel, anche qui. Taglia: il server più `QUINE_MONDO_MEMORIA` per ogni mondo acceso
insieme; con un mondo da 1 GB una macchina da 2 GB è il minimo (la `e2-micro` gratuita di Google ne ha 1, troppo poco). Per una VM di Google
Cloud vale ciò che dice lo studio (`design/open-beta.md` § 2.2): una VM con un disco persistente, non Cloud Run (niente lock dei file per git,
WebSocket che si chiudono a un'ora).

### Railway

Railway costruisce dal `Dockerfile` del repository (un fork tuo, o il repository con un ramo fissato):

1. un servizio dal repository; nelle variabili del servizio `KERNEL_VERSION` uguale alla versione del codice (Railway la passa alla build come
   argomento, perché il `Dockerfile` la dichiara con `ARG`) e tutte quelle del `.env` (`QUINE_ORIGINI=https://<il tuo>.up.railway.app`,
   `QUINE_PROXY_FIDATI=1`, `QUINE_PAGAMENTI=spenti`, `QUINE_ACCOUNT=inviti`, `QUINE_SEGRETO_INVITI`…); `PORT` la dà Railway e il server la usa;
2. un **volume** montato su `/app/universes` (senza, ogni deploy riparte dal seme e perde tutto);
3. il controllo di salute su `/healthz`;
4. il padrone: `railway ssh` nel servizio, poi `inviti padrone`.

**Niente template nel marketplace di Railway** (D52.6): un template pubblicato paga a chi lo pubblica una parte dei consumi, cioè un pagamento
all'autore, che la open beta non prevede.

### Fly.io

Un `fly.toml` accanto al `Dockerfile` (il nome dell'app e la regione sono tuoi):

```toml
app = "il-mio-quine"
primary_region = "fra"

[build]
  dockerfile = "Dockerfile"
  [build.args]
    KERNEL_VERSION = "0.7.10"

[env]
  QUINE_ORIGINI = "https://il-mio-quine.fly.dev"
  QUINE_PROXY_FIDATI = "1"
  QUINE_PAGAMENTI = "spenti"
  QUINE_ACCOUNT = "inviti"

[[mounts]]
  source = "universi"
  destination = "/app/universes"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "off"
  min_machines_running = 1
  [[http_service.checks]]
    method = "GET"
    path = "/healthz"
    interval = "30s"
    timeout = "5s"

[[vm]]
  memory = "2gb"
```

Poi `fly volumes create universi --size 3`, `fly secrets set QUINE_SEGRETO_INVITI=…` (le chiavi sempre come segreti, mai in `[env]`),
`fly deploy`, e il padrone con `fly ssh console -C "inviti padrone"`. Una macchina sola: i mondi sono processi figli del server e gli universi
stanno su un volume solo, quindi niente scala orizzontale né macchine che si spengono da sole a partita in corso.

### Il pacchetto Node, senza Docker

Node 22 e git installati, poi nella cartella del codice:

```bash
npm ci && npm run build && npm run build:server
cp .env.example .env              # e riempilo; QUINE_KERNEL qui non serve
npm run serve                     # legge il .env; ascolta su 127.0.0.1 se QUINE_HOST non dice altro
```

Gli universi stanno in `universes/` (o dove dice `QUINE_UNIVERSI`). `npm run inviti -- padrone` per il padrone.

## 4. Il controllo di salute

`GET /healthz` risponde `ok` (200) con qualunque `Host`, prima della porta d'ingresso, e 503 mentre il server si ferma (ADR-0189). L'immagine lo
usa come `HEALTHCHECK`; Railway e Fly lo chiamano dalla loro configurazione. Non dice nient'altro: niente versione, niente mondi.

## 5. Il backup

Tutto ciò che conta sta nella cartella degli universi (il volume `universi` di compose, `/app/universes` nel container): un repository git per
universo e, accanto, le cartelle del server (saldi e registro della spesa in `.balances/`, ospiti e inviti in `.campaign/`, le identità in
`.identities.json`, le carte fatte a mano in `.handmade/`). Le chiavi dei giocatori non ci sono: stanno solo in memoria e si ricollegano.

- **Tutto, a server fermo** (la copia è coerente: nessun git a metà):

  ```bash
  docker compose stop quine
  docker compose --profile backup run --rm backup     # ./backup/universi-<data>.tar.gz
  docker compose start quine
  ```

  Col pacchetto Node: ferma `npm run serve` e fai un `tar -czf` della cartella `universes/`.
- **Un universo solo, a server acceso**: `git bundle` legge un repository senza fermare niente.

  ```bash
  docker compose exec quine sh -c 'git -C /app/universes/<nome> bundle create - --all' > <nome>.bundle
  ```

  Un bundle ha la storia dell'universo, non le cartelle del server.
- **Ripristino**: a server fermo, il contrario del backup.

  ```bash
  docker compose stop quine
  docker compose run --rm --no-deps -u root -v "$PWD/backup:/backup" --entrypoint sh quine \
    -c 'tar -xzf /backup/universi-<data>.tar.gz -C /app/universes && chown -R node:node /app/universes'
  docker compose start quine
  ```

  Un universo da un bundle: `git clone <nome>.bundle universes/<nome>` sul pacchetto Node, o nel volume con lo stesso `run` di sopra.

Su Railway e Fly lo snapshot del volume del fornitore fa la stessa cosa (Fly li fa da sé ogni giorno e li tiene cinque giorni).

## 6. Se la macchina si spegne

Un mondo si salva quando resta vuoto per 5 minuti e quando il server si ferma (`docker compose stop`, un `SIGTERM`: il server aspetta i git dei
suoi universi, ADR-0121; compose gli lascia 30 secondi). Uno spegnimento brusco (la corrente, un `kill -9`) perde ciò che il mondo ha fatto
dall'ultimo salvataggio: l'universo resta all'ultimo commit valido, non si rompe. `restart: unless-stopped` lo riaccende col Docker.

## Che cosa è provato

Per T367 (14/11/2026): il contenuto dello stadio finale dell'immagine (le due build, le sole dipendenze di produzione, `site/beta.json`) in una
cartella a parte, avviato con l'ambiente di `.env.example` più il segreto: `/healthz` con un `Host` qualunque, `inviti padrone` ed `elenco` col
comando costruito, un universo di molti creato dal padrone, reso privato, un invito usato da un secondo browser su un'altra origine, i due viandanti
nello stesso mondo; `git bundle` di quell'universo; `docker compose config` (il file è valido, e senza `QUINE_KERNEL` si ferma col messaggio).
**Non provati**: la build dell'immagine e un container vero (sulla macchina dell'autore la virtualizzazione è spenta e Docker non parte), il tunnel
di Cloudflare, Railway, Fly e una VPS: le istruzioni seguono la loro documentazione al 13/11/2026 (`design/open-beta.md` § 2.3). Chi li prova
per primo corregga questa pagina.
