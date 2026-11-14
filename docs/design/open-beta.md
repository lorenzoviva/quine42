# La open beta senza pagamenti all'autore: OpenRouter, hosting esterno, self-hosting (T345)

Data: 2026-11-13 (§ 1.5-1.7 aggiornati il 14/11 da T362) · Step 43, Fase IV · [ADR-0184](../adr/0184-la-open-beta-senza-pagamenti-all-autore.md)
(accettato con D52, tranne la 5: Jev resta, via OpenRouter) · l'adattatore: [ADR-0193](../adr/0193-l-adattatore-openrouter.md) · Richiesta: `docs/userchats/to-do-2026-11-10.md` («Le due beta») · Fase: [`docs/fasi.md`](../fasi.md#fase-iv-la-open-beta)

Le fonti sono in fondo, tutte lette il **13/11/2026**. Dove una cifra viene da un aggregatore e non dalla pagina ufficiale, lo dico.
Niente codice: questo documento dice cosa cambierebbe e in che ordine.

## In breve

1. **I modelli via OpenRouter, con la chiave di ogni giocatore ottenuta con l'OAuth PKCE di OpenRouter**, scambiata dal server: la chiave
   non passa nemmeno dal browser del giocatore, sta nella memoria del processo del server (mai su disco nell'universo, mai a un mondo di
   molti, mai a un client) e il giocatore la limita e la revoca da OpenRouter. Incollare una chiave resta un ripiego. Sul PC di casa, da
   soli, la chiave sta nel `.env` come oggi `GEMINI_API_KEY`.
2. **Le spese comuni a turno**: ogni chiamata comune va sulla chiave del collegato che finora ne ha pagate meno; in media sono le parti
   uguali di ADR-0081, senza che un dollaro passi da un giocatore all'altro. Il «master paga tutto» di T347 è l'altra opzione.
3. **Gli stessi modelli Gemini allo stesso prezzo**: OpenRouter non ricarica i prezzi dei fornitori; il giocatore paga il 5,5 % (minimo
   0,80 $) quando compra crediti. Il `responseSchema` diventa `response_format` con uno schema JSON; le foto dell'Artista diventano parti
   `image_url` con il data URL che abbiamo già.
4. **Un pacchetto, tre posti**: un'immagine Docker (e lo stesso come pacchetto Node) con `docker compose`, che gira su una VM di Google
   Cloud, su una VPS o su Railway/Fly, e sul PC di casa dietro un Cloudflare Tunnel. **Per il server ufficiale una VM di Compute Engine, non
   Cloud Run**: i repository git vogliono un disco con i lock, i WebSocket di Cloud Run si chiudono a 60 minuti. RunPod e Vast.ai servono
   solo per modelli locali su GPU, non per il server del gioco.
5. **Una modalità «open beta» del server di produzione, detta esplicitamente** (`QUINE_PAGAMENTI=spenti`): Stripe non si monta, la
   commissione è 0 per forza, il registro dei saldi diventa il registro di ciò che ognuno ha speso con la sua chiave. Chi fa self-hosting
   può non avere Firebase: un verificatore a inviti, lo stesso che T347 chiede per gli universi privati.
6. **Le carte restano contate** (utilizzi e quote di ADR-0084), con una cosa in più: quanto è costata ogni carta, preso dalla risposta di
   OpenRouter. In Fase VI conta solo la storia scritta su un server di cui l'autore si fida: un universo in self-hosting ha un disco che il suo
   padrone può riscrivere.

---

## 1. OpenRouter

### 1.1 Che cosa offre e quanto costa

OpenRouter è un'API compatibile con quella di OpenAI (Chat Completions e Responses) davanti a molti fornitori, Google compreso. Per la
open beta conta che:

- **Non ricarica i prezzi**: «We pass through the pricing of the underlying model providers without any markup» (FAQ). Paga il
  giocatore, con i suoi crediti OpenRouter.
- **Il costo in più è sull'acquisto dei crediti**: 5,5 % con un minimo di 0,80 $ (5 % in cripto). Chi compra 10 $ di crediti ne paga
  10,80. Il «BYOK» di OpenRouter (il giocatore mette lì la sua chiave di Google) è gratis fino a 25 000 $ al mese, poi il 5 %: per noi è
  indifferente, è una scelta del giocatore dentro OpenRouter.
- **Ogni risposta porta il costo**: `usage.cost`, con i token in ingresso, in cache e di ragionamento, «always included automatically in
  every response». Il registro dei consumi può scrivere il costo vero invece di ricalcolarlo con `prices.ts` (che resta per le stime).
- **Una chiave ha un limite suo**: `GET /api/v1/key` dice `limit`, `limit_remaining`, `usage`, `is_free_tier`; a saldo negativo le
  chiamate tornano 402.
- **Non conserva prompt e risposte** se l'utente non accende il logging; i metadati (token, latenza) sì. Il giocatore può chiedere solo
  endpoint a ritenzione zero dalle sue impostazioni. La pagina «Come usiamo l'IA» del piano di lancio (`docs/lancio/piano.md` § 6) lo deve
  dire: il testo del viandante va a OpenRouter e da lì a Google.

### 1.2 La chiave del giocatore: incollata o con l'OAuth PKCE

| | Chiave incollata | OAuth PKCE di OpenRouter |
|---|---|---|
| Cosa fa il giocatore | crea una chiave su openrouter.ai, la copia, la incolla nel gioco | clicca «Collega OpenRouter», accede, autorizza, torna |
| Cosa riceve il gioco | una chiave qualunque dell'account, spesso senza limite | una chiave **creata per QUINE42** (`key_label`), con un `limit` e un periodo (`usage_limit_type`: giornaliero, settimanale, mensile) |
| Revoca | il giocatore deve ricordarsi quale chiave ha dato | una chiave sola, con il nome del gioco, revocabile dalle impostazioni |
| Dove passa | dal browser del giocatore al server | il browser porta al server solo il **codice** e il `code_verifier`; lo scambio (`POST /api/v1/auth/keys`) lo fa il server: la chiave non tocca il browser |
| Server senza nome pubblico | funziona | funziona: `callback_url` su `localhost` è ammesso su qualunque porta; senza callback il codice si mostra a schermo (valido 10 minuti, uso singolo) |

**Raccomandazione: PKCE come via principale, l'incolla come ripiego** (per chi ha già una chiave con un limite suo). Il `limit` lo propone il
gioco (per esempio il tetto che il viandante sceglie nella lobby, ADR-0086), il giocatore lo vede in OpenRouter. Da verificare con una
prova: se la schermata di autorizzazione di OpenRouter lascia al giocatore cambiare il limite proposto (la documentazione dice solo che
l'app lo passa a `POST /api/v1/auth/keys/code`).

Il `state` del flusso PKCE va usato contro il CSRF; il `code_verifier` resta nel `sessionStorage` della scheda fino al ritorno.

### 1.3 Dove sta la chiave

Regole che non cambiano: 8d (i soldi fuori dall'universo), 8g (un mondo di molti è un processo senza segreti), 9 (una chiave arriva solo al
suo varco, mai al browser). La chiave di un giocatore è un segreto come quella di oggi, con un padrone in più.

| Dove si gioca | Dove sta la chiave | Chi chiama OpenRouter |
|---|---|---|
| **Da soli sul proprio PC** (`npm run dev`, la preview, il pacchetto in locale) | `OPENROUTER_API_KEY` nel `.env`, come `GEMINI_API_KEY`; oppure il PKCE con `callback_url` su `localhost`, che il server locale scrive in un file **accanto agli universi** (`universes/.keys/`, `server/folders.ts`), mai dentro un repository | un `OpenRouterGate` gemello di `GeminiGate` (ADR-0099): solo loopback e stessa origine, modelli a elenco, corpo limitato, tetto giornaliero |
| **Un mondo di molti** (server ufficiale o del master) | nella **memoria del processo del server**, indicizzata per uid verificato; arriva da `POST /api/openrouter/key` (con `gate`, il token dell'account, il codice e il verifier del PKCE) | il processo del server, su richiesta del mondo per il canale (oggi `op: 'gemini'`, `direct()`), che porta `chi`: il server sceglie la chiave di `chi` |
| **Il mondo, Lua, l'universo, un altro client** | mai | — |

Perché in memoria e non su disco: le chiamate di un viandante partono solo mentre è collegato, e quelle comuni senza un collegato con
crediti vanno già ai modelli locali (ADR-0113). Una chiave che sparisce a un riavvio costa al giocatore un clic («Collega OpenRouter» di
nuovo), mentre un file di chiavi su un server pubblico è un bersaglio. **Mai nei log**: per i rimandi alla pagina dei consumi del giocatore
OpenRouter suggerisce lo SHA-256 della chiave, che si può mostrare.

Da un client che non è il server nessuno chiama i modelli con la chiave di un altro: le chiamate di un mondo di molti le decide il mondo, non il
browser. Non si fanno fare le chiamate al browser del giocatore con la sua chiave: il client potrebbe restituire quello che vuole come
risposta del Concilio, e il validatore controlla la forma, non la provenienza (regola 8b).

### 1.4 Chi paga una spesa comune quando ognuno ha la sua chiave

Oggi (ADR-0081, ADR-0113) una spesa comune si divide in parti uguali tra i collegati non anonimi, a crediti. Con le chiavi una chiamata va su
**una** chiave: non si divide. Le opzioni:

| | Come | Pro | Contro |
|---|---|---|---|
| **A. A turno (raccomandata)** | ogni chiamata comune va al collegato con chiave valida che finora, in questo universo, ne ha pagate meno in dollari; a pari merito l'ordine dell'uid | parti uguali in media, scarto massimo il costo di una chiamata (centesimi); niente denaro tra giocatori; deterministico | chi entra tardi paga le prossime finché non pareggia (si azzera il conteggio a ogni ingresso, o si conta da quando c'è) |
| B. Il master paga tutto | `chi` comune → la chiave del master | semplice; è lo scenario della campagna (T347) | senza il master collegato le comuni vanno ai modelli locali |
| C. Una chiave del server | il server ha `OPENROUTER_API_KEY` per le comuni, con tetto | come oggi | è l'autore (o chi ospita) che paga: sul server ufficiale contraddice la Fase IV |
| D. Nessuno | le comuni vanno sempre ai modelli locali | costo zero | Genesi, sessioni, trame e modelli che mancano: il mondo non cresce |

A e B convivono: B è un'opzione dell'universo (T347), A il predefinito. C solo per chi ospita e lo sceglie, con il tetto di oggi. Il registro
tiene per ogni viandante la sua parte comune pagata (`world/usage.json → payers` c'è già, per giorno), così A legge da lì.

Gli errori: un 402 (saldo o limite della chiave finito) mette quel viandante «senza crediti» come oggi (le sue chiamate ai modelli locali,
l'avviso nel feed) e lo toglie dal turno; una chiamata comune rifiutata con 402 non è stata pagata e passa al prossimo del turno. Un 401
(chiave revocata) cancella la chiave dalla memoria. Un anonimo con la sua chiave paga per sé: non c'è ragione di escluderlo (ADR-0081 lo
escludeva perché ha 0 crediti); lo decide l'autore.

### 1.5 I modelli di oggi via OpenRouter

| Modello (`prices.ts`) | Id OpenRouter | Prezzo via OpenRouter, $ per milione (ingresso / uscita) | In `prices.ts` (22/10) |
|---|---|---|---|
| `gemini-3.1-flash-lite` | `google/gemini-3.1-flash-lite` | 0,25 / 1,50 (pagina del modello; la pagina mostra anche fasce 0,125 / 0,75 e 0,45 / 2,70, da capire) | 0,25 / 1,50 |
| `gemini-3.8-flash` | `google/gemini-3.8-flash` | 0,75 / 3,75, «50 % off» (pagina dei fornitori); cache 0,075 (aggregatore); variante `:batch` a metà | 0,75 / 3,75, raddoppia dal 01/01/2027 |
| `gemini-4-argon` | `google/gemini-4-argon` | 2 / 10, poi 4 / 20 dopo il 30/11/2026 (solo aggregatori: la pagina ufficiale non l'ho letta) | 2 / 10, 4 / 20 dal 01/12/2026 |

I fornitori sono Google AI Studio e Vertex. I prezzi coincidono con quelli di Google: **l'ora di gioco del piano di lancio resta 1,04 $ a
dettaglio pieno e 0,36 $ in Low Detail**, più il 5,5 % sull'acquisto dei crediti (≈ 1,10 $ e 0,38 $). Il 3.8 Flash è segnato in sconto: dal
2027 la stima cresce come già dice `prices.ts`.

Gli id cambiano: OpenRouter tiene anche le versioni datate (`google/gemini-3.8-flash-20260902`). L'elenco dei modelli ammessi del varco
deve dire id fissi, come oggi per Gemini.

**Verificato il 14/11 (T362)** sugli endpoint pubblici di OpenRouter (`/api/v1/models`, `/api/v1/models/<id>/endpoints`):

| Nostro id | Id di OpenRouter (versione servita) | Livello standard, $ per milione (ingresso / uscita / cache) | `temperature` su ogni endpoint standard |
|---|---|---|---|
| `gemini-3.1-flash-lite` | `google/gemini-3.1-flash-lite` (`-20260507`) | 0,25 / 1,50 / 0,025 (Vertex eu e us 0,275 / 1,65) | sì |
| `gemini-3.8-flash` | `google/gemini-3.8-flash` (`-20260902`) | 0,75 / 3,75 / 0,075 (Vertex us +10 %) | **no** (solo AI Studio) |
| `gemini-4-argon` | `google/gemini-4-argon` (`-20261013`) | 2 / 10 / 0,10 (Vertex us +10 %) | sì |
| `gemini-3.5-flash` (l'Artista) | `google/gemini-3.5-flash` (`-20260519`) | **1,50 / 9,00** / 0,15 | sì |
| `gemini-3.6-flash`, `gemini-3.7-flash` | `google/…` (`-20260721`, `-20260813`) | 0,75 / 3,75 / 0,075 | no |
| `gemini-3.5-flash-lite` | `google/gemini-3.5-flash-lite` (`-20260721`) | 0,30 / 2,50 / 0,03 | no |
| `gemini-3.1-pro-preview`, `gemini-3-flash-preview` | `google/…` | 2 / 12 e 0,50 / 3 | sì |

- **Le «fasce» del § 1.5 sono livelli di servizio**: ogni modello ha anche endpoint `flex` (metà prezzo, al meglio) e `priority` (circa 1,8 volte);
  un id senza suffisso non li sceglie mai (`:floor` e `:nitro` li aggiungono). I prezzi del livello standard sono quelli di `prices.ts`.
- **3.5 Flash costa il doppio della stima**: `prices.ts` lo stima 0,75 / 3,75 (`ESTIMATED`, report 8.2B), OpenRouter, che riporta il prezzo di Google,
  dice 1,50 / 9,00. Le chiamate via OpenRouter dicono il loro costo e non ne soffrono; il registro della via diretta sì (da correggere a parte).
- **La temperatura**: gli endpoint Vertex delle Flash più nuove non la accettano; con `require_parameters` una richiesta che la manda resta ad AI
  Studio, e non trova endpoint per chi ha imposto la ritenzione zero nel suo account (AI Studio non è nell'elenco, Vertex sì). L'adattatore la manda
  solo dove ogni endpoint standard la prende (`OPENROUTER_MODELS`).
- **Le immagini**: tutti e tre i modelli hanno `image` fra le `input_modalities`.

### 1.6 Il `responseSchema`, il ragionamento, le immagini

- **Lo schema.** Oggi il Concilio passa a Gemini `responseMimeType: application/json` e `responseSchema` nello stile di Google (`type:
  'OBJECT'`, `'STRING'`…, `src/kernel/agents/*.ts`). OpenRouter vuole `response_format: { type: 'json_schema', json_schema: { name,
  strict, schema } }` con uno schema JSON (tipi in minuscolo). Serve una conversione pura e testata (tipi, `enum`, `required`, `items`; ciò
  che lo schema JSON non ha si toglie) e `provider.require_parameters: true`, così OpenRouter manda la richiesta solo a un endpoint che
  supporta gli output strutturati (il supporto è per endpoint, non per modello). `strict: false` all'inizio: le modalità strette limitano lo
  schema e la nostra rete di sicurezza è già il validatore, che ripara e rimanda (regola 2). Il plugin «Response Healing» di OpenRouter per
  il JSON rotto è una prova da fare, non una dipendenza.
- **Il ragionamento.** `reasoning.effort` arriva a Gemini 3 come `thinkingLevel` uno a uno (`minimal`, `low`, `medium`, `high`; `xhigh` →
  `high`). `ai.thinking: 'off'` diventa `effort: 'none'`, tranne per un modello che lo dichiara obbligatorio (`mandatory`). I token di
  ragionamento si pagano come uscita, come oggi.
- **Le foto dell'Artista** (regola 11: guarda, non genera). Oggi `AiCall.images` sono data URL `image/png` o `image/jpeg` mandati come
  `inlineData`. Su OpenRouter diventano parti `{ type: 'image_url', image_url: { url: 'data:image/png;base64,…' } }` nello stesso messaggio
  del testo; il modello deve avere `image` tra le `input_modalities` (da controllare per ciascuno dei tre: le pagine che ho letto non lo
  dicono), e le immagini si pagano come token in ingresso. Non serve un URL pubblico.
- **Fatto da T362** (`OpenRouterAiModels`, ADR-0193): lo schema convertito da `toJsonSchema` con `strict: false` e il nome del compito; `provider:
  { require_parameters: true, data_collection: 'deny' }`; `reasoning: { effort, exclude: true }` (il ragionamento non torna); **`ai.thinking: off` non
  manda niente**, come la via di Google (il predefinito del modello), invece di `effort: 'none'` (che 3.8 Flash e Argon rifiutano: il ragionamento è
  obbligatorio); le foto come parti `image_url` dopo il testo. Il costo: `usage.cost` è ciò che OpenRouter ha addebitato; con una chiave di Google
  del giocatore (`is_byok`) si aggiunge `cost_details.upstream_inference_cost`. I token di ragionamento sono dentro `completion_tokens`: il registro li
  separa. Un 200 può portare l'errore nel corpo o nella scelta (`finish_reason: 'error'`): non si ripete. Il plugin «Response Healing» non è usato.
- **Ciò che non c'è.** `countTokens` di Google (gli script di `lab/` per i prompt) non ha un gemello in OpenRouter: quegli strumenti
  restano dell'autore, con la sua chiave di Google. Le ripetizioni restano come oggi: 429 e 5xx sì (con `Retry-After`), una richiesta
  scaduta mai (può essere stata pagata).

### 1.7 Jev di TypeSafe e la coda degli abbonamenti

- **Jev è su OpenRouter** (corretto il 14/11: il 13/11 non l'avevo trovato; D52 l'ha detto all'autore). Ci sono `typesafe/jev-1.13` (versione
  `-20260917`) e `typesafe/jev-1.14` (`-20261014`, l'alias `~typesafe/jev-latest` lo segue e non si usa), un solo fornitore, TypeSafe, a 0,042 $ al
  milione in ingresso e la risposta gratis, contesto di 262 144 token (le richieste sopra circa 32 KB vanno nel modo a contesto lungo, più lento).
  L'API è `POST /api/alpha/decisions` (c'è anche `/api/v1/systemone`, compatibile con l'SDK di TypeSafe): `model`, `state` (testo, oggetto o un
  elenco di parti, anche immagini), `questions` (`noul`, `choice`, `score`, e `box` solo dalla 1.14) e `provider`; la risposta ha `answers` con le
  stesse forme di TypeSafe più un tipo `refusal`, e `usage` con `input_tokens`, `output_tokens` e `cost`. **D52**: Jev resta acceso in open beta e
  passa da qui con la chiave del giocatore, come ogni chiamata; non lo paga l'autore. Fatto da T362 (`OpenRouterDecisionModels`, ADR-0193).
- **La ritenzione zero (D45.3).** L'endpoint di TypeSafe è nell'elenco della ritenzione zero di OpenRouter (`/api/v1/endpoints/zdr`, con
  `safety_retention: false`), e ogni richiesta dell'adattatore la chiede (`provider.zdr: true`: OpenRouter rifiuta piuttosto che mandarla altrove).
  OpenRouter stesso non conserva prompt e risposte se il giocatore non accende il logging. Non ho trovato la politica dei dati scritta da TypeSafe per
  OpenRouter: la pagina del fornitore non la riporta. Il testo libero del viandante **resta fuori** (`JEV_ZERO_RETENTION` falso): lasciarlo passare
  per questa porta è una decisione dell'autore (`docs/pipeline/domande/T362.md`).
- **La coda degli abbonamenti** (ADR-0077, ADR-0106) resta solo locale e non cambia; `npm run genera` anche.

---

## 2. L'hosting

### 2.1 Tre ruoli diversi

| Ruolo | Che cosa | Chi paga | Dove |
|---|---|---|---|
| **Il sito e la demo offline** | `dist/` statico: landing, notizie, carte, la demo senza modelli | l'autore (pochi euro, o niente) | qualunque hosting statico; il piano di lancio ci manda il link di Show HN (D6.1) |
| **Il server ufficiale** (T45f) | il server di produzione con pochi mondi di molti, gli account Firebase, la vetrina | l'autore paga **la macchina**, non i modelli: è un costo, non un incasso | Google Cloud, una VM |
| **Il server di un master** | lo stesso pacchetto, con i suoi universi e i suoi amici | il master, direttamente al fornitore | Railway, Fly, una VPS, una VM di Google Cloud, il PC di casa |

La richiesta dell'autore («l'hosting pagato direttamente dai giocatori») è il terzo ruolo. Il secondo resta piccolo (pochi mondi accesi,
`QUINE_MONDI_MASSIMI`), perché ogni mondo acceso è RAM che paga l'autore.

### 2.2 Il server ufficiale: Compute Engine, non Cloud Run

T45f chiede Cloud Run o una VM (domanda aperta in `docs/pipeline/domande/T45f.md`). Con ciò che il server è oggi la risposta è la **VM**:

- **I repository git vogliono un file system con i lock.** Cloud Run ha il disco in memoria; i volumi sono Cloud Storage FUSE, che non è
  POSIX e non ha lock dei file (inadatto a git), o Filestore (NFS, che costa e va gestito). Una VM ha un disco persistente.
- **I WebSocket di Cloud Run sono richieste**: si chiudono al timeout, al più 60 minuti, e alla riduzione delle istanze; l'affinità di
  sessione è «best effort». Una partita di due ore si riconnette almeno due volte.
- **I mondi sono processi figli** che vivono finché c'è qualcuno e si fermano dopo 5 minuti di vuoto (ADR-0110, ADR-0114): è il modello
  di una macchina sempre accesa, non di istanze che nascono e muoiono.

Una VM con `docker compose` (lo stesso pacchetto della community, § 2.3), il disco persistente per `universes/` e le cartelle del server, i
segreti dal Secret Manager scritti nell'ambiente all'avvio. La `e2-micro` gratuita (solo tre regioni USA, 30 GB di disco standard) ha 1 GB
di RAM: troppo poco per un mondo da 1024 MB (`QUINE_MONDO_MEMORIA`) più il server. La taglia la decide la prova di carico della beta chiusa
(D6.4 del piano di lancio). Il prezzo delle VM europee non l'ho verificato.

### 2.3 Il pacchetto per tutti: un formato agnostico

Un formato, due confezioni, gli stessi comandi di oggi (`npm run build`, `npm run build:server`, `npm run serve`, ADR-0112):

- **Un'immagine Docker** a due stadi: il primo costruisce client e server, il secondo ha Node 22, `git` e `firebase-admin` (l'unica
  dipendenza in esecuzione), `dist/` e `dist-server/`; un volume per `universes/`; ascolta su `0.0.0.0:$PORT`. Un `docker-compose.yml`
  con il servizio e, facoltativo, `cloudflared`. Un `.env.example` della open beta.
- **Il pacchetto Node** per chi non vuole Docker: le stesse istruzioni, `npm ci && npm run build && npm run build:server && npm run serve`.

| Dove | Come ci arriva | Note (fonti al 13/11/2026) |
|---|---|---|
| **VM di Google Cloud o VPS** | `docker compose up -d` | TLS da un proxy (Caddy) o da un bilanciatore; `QUINE_PROXY_FIDATI=1` |
| **Railway** | legge il `Dockerfile` del repository; un volume per `universes/` | piano Hobby 5 $ al mese, che vanno in consumo; i limiti dei volumi del piano Hobby non li ho trovati. **Un template pubblicato nel marketplace di Railway paga a chi lo pubblica il 15-25 % dei consumi** («kickback»): è un pagamento all'autore, quindi in open beta niente template nel marketplace, o un template senza kickback (decisione dell'autore) |
| **Fly.io** | `Dockerfile` + `fly.toml` con un volume | RAM 6 $ per GB al mese dal 01/10/2026 (pagina ufficiale dell'aggiornamento, letta da un aggregatore), volumi 0,15 $ per GB al mese, snapshot 0,08 $: un server con un mondo da 1 GB sta intorno ai 12-15 $ al mese (stima, non misurata) |
| **Cloud Run** | l'immagine c'è, ma non lo consiglio (§ 2.2) | — |
| **Il PC di casa** | `docker compose up` con `cloudflared`, o il pacchetto Node | un Cloudflare Tunnel è nel piano gratuito, porta i WebSocket (nella configurazione si scrive `http://`, i client usano `wss://`) e non apre porte del router; un tunnel «quick» senza dominio non ha garanzie di servizio; per una partita fra amici basta, per un universo pubblico serve un dominio su Cloudflare. Il PC deve restare acceso |
| **RunPod, Vast.ai** | non per il server del gioco | sono GPU a ore: servono solo a far girare modelli a pesi aperti (§ 2.5) |

**Il contratto del kernel** è la cosa più importante della guida: un universo di un'altra `X.Y` si apre in sola lettura (ADR-0156). Chi
ospita fissa una versione dell'immagine e aggiorna solo quando le migrazioni portano i suoi universi (ADR-0152). L'immagine ha un'etichetta
per versione del kernel, mai solo `latest`.

### 2.4 Che cosa `productionProblems` chiede e il self-hoster non ha

| Oggi rifiuta di partire senza | Il self-hoster | Proposta |
|---|---|---|
| `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY` | può creare un progetto Firebase suo (l'Authentication è gratuita fino a 50 000 utenti attivi al mese, anonimi compresi), ma è attrito: console di Firebase, domini autorizzati, chiavi | **un secondo verificatore, a inviti**: `QUINE_ACCOUNT=inviti` e un `QUINE_SEGRETO_INVITI`; il master genera link con un token firmato (HMAC del segreto del server), il viandante è l'id dell'invito. È lo stesso meccanismo che T347 chiede per gli universi privati: va progettato una volta |
| `STRIPE_WEBHOOK_SECRET` | non ha Stripe e in open beta non deve averlo | **`QUINE_PAGAMENTI=spenti`, scritto**: le rotte di Stripe non si montano (404), il pannello `P` e il sito non mostrano le ricariche, `productionProblems` non chiede il segreto. Spento va detto, non dedotto dall'assenza: è il principio di ADR-0112 (non dipendere dal ricordarsi una configurazione) |
| `GEMINI_TETTO_GIORNALIERO` (con la chiave) | con le chiavi dei giocatori non c'è una chiave del server | invariato: un tetto è richiesto solo se c'è una chiave del server (`OPENROUTER_TETTO_GIORNALIERO` per `OPENROUTER_API_KEY`, come per Gemini e TypeSafe) |
| `QUINE_ORIGINI` | il nome del tunnel o del dominio | invariato; la guida lo spiega |
| `QUINE_PROXY_FIDATI` | 1 dietro Cloudflare, Railway, Fly o Caddy | invariato; la guida dice come misurarlo (ADR-0114) |

Mancano anche, per una guida: un **controllo di salute** che risponda con un `Host` qualunque (ADR-0112 lo lascia a T45f: oggi un controllo
con un altro `Host` riceve 403), il **backup** di `universes/` (repository git e cartelle del server: un `tar` del volume a server fermo, o
`git bundle` per universo), e cosa fare se il PC si spegne a partita in corso (il mondo si salva ogni volta che si svuota; un kill no).

### 2.5 Modelli locali su RunPod o Vast.ai

OpenRouter parla il formato di OpenAI, e così vLLM su RunPod (un worker pronto, fatturato al secondo) o su una GPU di Vast.ai (RTX 4090 tra
0,20 e 0,52 $ l'ora secondo gli aggregatori, a mercato). Lo stesso adattatore di OpenRouter serve quindi anche un endpoint compatibile:
ma **l'indirizzo lo dice solo l'ambiente del server** (`QUINE_MODELLI_URL`), mai `universe.json` né un client, altrimenti chiunque fa fare al
server richieste dove vuole. Due limiti: la qualità di un modello a pesi aperti sui compiti del Concilio non è misurata (lo Scultore e gli
schemi sono i più esigenti), e una GPU accesa costa anche quando nessuno gioca. Un task a parte, dopo, con un banco come quello di Jev.

---

## 3. Account e crediti in open beta

- **Il ledger resta**, cambia il senso. Oggi è un saldo prepagato (`Ledger`, `universes/.balances/`, ADR-0104); con le chiavi diventa il
  **registro di ciò che ognuno ha speso con la sua chiave**, con il costo vero di OpenRouter (`usage.cost`). Serve per il turno delle
  comuni (§ 1.4), per il portafoglio del sito e per le carte (§ 4).
- **Chi può chiamare i modelli** (la condizione che oggi è `crediti > 0`): ha una chiave valida, è sotto il tetto che ha scelto nella
  lobby (ADR-0086, il tetto di ogni viandante resta suo, 8b-bis), la chiave non ha restituito 402. Altrimenti i modelli locali, come oggi.
- **Commissione 0, per forza.** `QUINE_COMMISSIONE=0` è già ammesso (ADR-0132), ma con `QUINE_PAGAMENTI=spenti` il server la porta a 0
  qualunque cosa dica l'ambiente: una commissione su una chiave altrui sarebbe un costo mostrato e mai pagato.
- **`QUINE_TETTO_RICARICHE`**: 0. Le ricariche a mano del master non hanno senso con le chiavi (il master non può dare dollari a una chiave
  altrui). Ciò che resta è l'opzione «il master paga» (§ 1.4 B, T347).
- **Gli anonimi**: senza chiave come oggi (modelli locali); con una chiave sua, la proposta è che paghi per sé (domanda per l'autore).
- **Stripe spento, non tolto**: il codice, i test e le rotte restano per la Fase VI; con `QUINE_PAGAMENTI=spenti` non sono montati, e i
  pulsanti `+5 $` del pannello `P` e la pagina crediti del sito mostrano «la tua spesa con la tua chiave» e il collegamento a OpenRouter.
  Nessun incasso, nessuna partita IVA: è ciò che chiede la Fase IV.

---

## 4. Le carte in open beta

Le carte (ADR-0056) e l'eredità dei cloni (ADR-0084) restano accese: autore, pagante, titolare, utilizzi, catena, quote. Con le chiavi il
pagante di una carta è il viandante sulla cui chiave è andata la chiamata (o quello del turno, per le comuni), e il titolare delle comuni resta
quello estratto col seme. Perché il valore della Fase VI abbia una storia mancano due cose:

1. **Quanto è costata ogni carta.** Oggi `world/usage.json` somma per giorno, modello, compito e pagante, non per carta. Proposta: il costo
   di OpenRouter della chiamata che ha fatto il contenuto nella carta (o in `world/cards.json` accanto agli utilizzi), così in Fase V si può
   pesare una carta per ciò che è costato e per quanto è usata.
2. **Di quale storia fidarsi.** Un universo in self-hosting vive su un disco del suo padrone, che può riscrivere `cards.json`, i timbri e i
   consumi. In Fase VI conta solo la storia scritta su un server dell'autore (o su uno che lui riconosce); le carte nate altrove possono
   entrare in un universo ufficiale come le carte portate (ADR-0170: rilette, controllate, con un anello in più) e la loro storia di prima resta
   un dato dichiarato, non contato. Va detto ai giocatori fin dalla open beta, per non promettere ciò che non si può contare.

**Sul paragone con lo schema piramidale e gli NFT** (chiesto dall'autore il 10/11, è il lavoro della Fase V; qui solo il confine). Una
rendita che viene dall'**uso dei contenuti** che un giocatore ha generato (una royalty) è un'altra cosa da una che viene dall'**arrivo di
nuovi giocatori**: la seconda è lo schema piramidale che la direttiva europea sulle pratiche commerciali sleali (2005/29/CE, allegato I,
punto 14) vieta sempre. Il disegno di ADR-0084 (quote sugli utilizzi) è del primo tipo e va tenuto lì: niente premi per chi porta altri
giocatori. Gli NFT non aggiungono niente che il ledger e la catena delle carte non facciano già, e portano domande sulle cripto-attività
(MiCA) che un lavoratore dipendente senza partita IVA non vuole. Non è un parere legale: prima della Fase VI serve un professionista.

---

## 5. Le superfici di sicurezza che il progetto aprirà

Questo task non tocca codice: nessuna superficie nuova. Quelle che i task del § 6 apriranno, da registrare in `docs/sicurezza/registro.md`
quando nascono:

1. **Le chiavi dei giocatori nella memoria del server**: un dump di memoria, un log sbagliato o un'eccezione che stampa la richiesta le
   espongono. Mitigazioni: mai nei log né negli errori al client (V-020), solo l'impronta SHA-256, chiavi con un limite proposto dal PKCE,
   revocabili.
2. **La rotta che riceve codice e verifier del PKCE**: `gate`, token verificato, ritmo per account, una chiave per viandante, il `state`.
3. **La scelta della chiave da `chi`**: un mondo non deve poter chiedere una chiamata a nome di un viandante che non l'ha causata (8i).
   Oggi `chi` viene dal kernel del mondo; con le chiavi un mondo compromesso spenderebbe la chiave di un giocatore collegato. Il tetto del
   viandante e il limite della chiave lo contengono; il server conta per viandante come per `heavy` (8e).
4. **Il verificatore a inviti**: token firmati, scadenza, revoca, un segreto del server; l'id dell'invito non deve scontrarsi con un uid.
5. **L'endpoint compatibile per i modelli locali**: solo dall'ambiente del server (SSRF).
6. **Il pacchetto pubblico**: l'immagine non contiene `.env` né segreti, `QUINE_HOST` resta `127.0.0.1` se non detto, l'esempio di `.env`
   non ha valori veri.
7. **Il self-hosting** sposta la fiducia: un server di un master vede le chiavi di chi ci gioca. La guida e la pagina di ingresso lo dicono
   («questo mondo è ospitato da X; la tua chiave passa dal suo server»), e il PKCE propone un limite basso.

---

## 6. I task che ne nascono

In ordine; la stima è nella scala della pipeline (percentuale della settimana). Tutti nello step 43.

| # | Task | Stima | Dipende da | Fatto quando |
|---|---|---|---|---|
| 1 | **La modalità open beta del server di produzione**: `QUINE_PAGAMENTI=spenti` (rotte di Stripe non montate, commissione forzata a 0, ricariche nascoste nel pannello `P` e nel sito), `productionProblems` di conseguenza, `TYPESAFE_KEY` solo se detta, il controllo di salute | 2 % | — | i test di `tests/sicurezza/produzione.test.ts` con e senza la modalità |
| 2 | **L'adattatore OpenRouter** (`OpenRouterAiModels` accanto a `GeminiAiModels`): lo schema convertito (`response_format`, `require_parameters`), il ragionamento, le immagini come `image_url`, `usage.cost` nel registro, 402/401/429, gli id fissi; test offline con risposte registrate, una prova pagata piccola (dieci chiamate) per schema e immagini | 4 % | — | la Genesi offline uguale; una prova vera con una chiave dell'autore e il costo nel registro |
| 3 | **Le chiavi dei giocatori sul server**: il varco `OpenRouterGate`, le chiavi in memoria per uid, la rotta del PKCE con lo scambio sul server, `chi` → chiave nel canale dei mondi, il turno delle comuni (§ 1.4 A), il ledger come registro della spesa; la voce nel registro della sicurezza | 6 % | 1, 2 | due viandanti con due chiavi in un mondo di molti: ognuno paga le sue, le comuni si alternano |
| 4 | **Il collegamento nel gioco e nel sito**: «Collega OpenRouter» (lobby, pannello `P`, sito), lo stato della chiave (limite residuo da `/api/v1/key`), il tetto proposto, il ripiego dell'incolla; da soli sul PC il PKCE su `localhost` e il file accanto agli universi | 3 % + browser | 3 | verifica nel browser del flusso intero |
| 5 | **Le carte con il costo**: il costo di ogni carta dalla chiamata che l'ha fatta, la provenienza del server (fatto, T365, ADR-0195: `usd` e `server` nel timbro) | 2 % | 2 | `allCards` mostra il costo; i test delle quote invariati |
| 6 | **Il verificatore a inviti** per il self-hosting, insieme agli universi privati di T347 | 4 % | ADR di T347 accettato | un server senza Firebase con due invitati |
| 7 | **Il pacchetto e la guida del self-hosting**: `Dockerfile`, `docker-compose.yml` con `cloudflared` facoltativo, `.env.example`, l'immagine con l'etichetta del kernel, la guida (VM o VPS, Railway, Fly, PC di casa), il backup | 4 % | 1, 3, 6 | un mondo di molti in un container locale e uno dietro un tunnel, giocati da due browser |
| 8 | **T45f riscritto**: il server ufficiale su una VM di Compute Engine con il pacchetto del 7, il Secret Manager, il disco persistente | 6 % (la stima di T45f) | 7, le risposte di `domande/T45f.md` | come T45f |
| 9 | **«Come usiamo l'IA»** con OpenRouter, chi paga e dove va il testo (è già nella lista del piano di lancio) | 1 % | 3 | la pagina nel sito |
| 10 | (dopo) **Un endpoint compatibile per modelli locali** su RunPod o Vast.ai, solo dall'ambiente, con un banco della qualità sui compiti del Concilio | 4 % | 2 | il banco dice quali compiti un modello aperto regge |

Totale dei primi nove: circa 32 % di una settimana, più la verifica nel browser di 4 e 7.

---

## Fonti (lette il 13/11/2026)

OpenRouter (pagine senza data di aggiornamento visibile):
- OAuth PKCE: https://openrouter.ai/docs/guides/overview/auth/oauth
- Il codice di autorizzazione con `limit` e `usage_limit_type`: https://openrouter.ai/docs/api/api-reference/oauth/create-authorization-code
- FAQ (commissioni, nessun ricarico, BYOK): https://openrouter.ai/docs/faq
- Output strutturati: https://openrouter.ai/docs/guides/features/structured-outputs
- Ragionamento e `thinkingLevel`: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens
- Consumi nella risposta: https://openrouter.ai/docs/guides/administration/usage-accounting
- Limiti e `GET /api/v1/key`: https://openrouter.ai/docs/api/reference/limits
- Dati e ritenzione: https://openrouter.ai/docs/guides/privacy/data-collection
- Immagini in ingresso: https://openrouter.ai/docs/guides/overview/multimodal/image-understanding (dai risultati di ricerca, pagina non aperta)
- Modelli: https://openrouter.ai/google/gemini-3.1-flash-lite, https://openrouter.ai/google/gemini-3.8-flash/providers (rilascio 02/09/2026);
  Argon dagli aggregatori https://pricepertoken.com/pricing-page/model/google-gemini-4-argon e
  https://www.getmaxim.ai/bifrost/llm-cost-calculator/provider/openrouter/model/gemini-4-argon

Lette il 14/11/2026 (T362):
- Gli endpoint pubblici dei modelli: https://openrouter.ai/api/v1/models, https://openrouter.ai/api/v1/models/google/gemini-3.8-flash/endpoints (e gli
  altri id della tabella del § 1.5), l'elenco della ritenzione zero https://openrouter.ai/api/v1/endpoints/zdr
- Jev su OpenRouter: https://openrouter.ai/docs/guides/community/jev, https://openrouter.ai/docs/guides/community/jev-tutorial, il riferimento
  https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request.md, il fornitore https://openrouter.ai/provider/typesafe
- Instradamento (livelli, `require_parameters`, `data_collection`, `zdr`): https://openrouter.ai/docs/guides/routing/provider-selection
- Errori (anche il 200 con l'errore): https://openrouter.ai/docs/api/reference/errors-and-debugging

Hosting:
- Cloud Run e WebSocket (timeout, affinità): https://docs.cloud.google.com/run/docs/triggering/websockets
- Cloud Storage FUSE non POSIX, niente lock: https://cloud.google.com/storage/docs/gcs-fuse e https://www.resilio.com/blog/gcsfuse (fonte
  commerciale, per git)
- Il livello gratuito di Compute Engine: https://cloud.google.com/free/docs/compute-getting-started
- Railway, piani: https://docs.railway.com/reference/pricing/plans; kickback dei template: https://docs.railway.com/templates/kickbacks
- Fly.io: https://fly.io/pricing e https://fly.io/pricing-update/ (aggiornamento del 01/10/2026)
- RunPod serverless: https://docs.runpod.io/serverless/pricing; Vast.ai, RTX 4090 dagli aggregatori: https://gpu-cost.pages.dev/gpu/rtx-4090/
- Cloudflare Tunnel e i tunnel «quick»: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- Firebase Authentication, 50 000 utenti attivi gratuiti: https://firebase.google.com/pricing

Diritto (per il confine del § 4, non un parere): direttiva 2005/29/CE, allegato I, punto 14 (https://eur-lex.europa.eu/eli/dir/2005/29/oj).

Nel repository: `docs/lancio/piano.md` (§ 6, costi al picco), `docs/fasi.md`, `server/production.ts` (`productionProblems`),
`server/geminiProxy.ts`, `src/kernel/ai/gemini.ts`, `src/kernel/ai/prices.ts`, `src/kernel/cards.ts`, ADR-0077, 0081, 0083, 0084, 0086,
0099, 0104, 0110, 0112, 0113, 0114, 0132, 0156, 0157, 0170, `docs/pipeline/domande/T45f.md`, il dossier di T347.
