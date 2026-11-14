# ADR-0194 — L'universo privato e il verificatore a inviti: ospiti e inviti fuori dall'universo, identità firmate per chi ospita senza Firebase

Data: 2026-11-14 · Stato: **accettato** (T366, step 43; applica ADR-0188 punto 2 e ADR-0184 punto 8, D52.7 e D54.7-8) · Riferimenti:
[`docs/design/campagna-master.md`](../design/campagna-master.md) § 2 e § 7, [`docs/design/open-beta.md`](../design/open-beta.md) § 2.4 e § 5,
ADR-0082 (gli account), ADR-0102 (chi può scrivere), ADR-0104 (i saldi fuori dall'universo), ADR-0109 (gli elenchi), ADR-0110 (i mondi senza
segreti), ADR-0112 (il server di produzione), ADR-0114 (l'ammissione), ADR-0170 (le carte portate), ADR-0184, ADR-0188

## Contesto

ADR-0188 (punto 2) ha deciso l'universo privato: gli ospiti e gli inviti fuori dall'universo (`universes/.campaign/<nome>.json`), il controllo in
`admit`, le letture solo a master e ospiti, la rotta `guests` del master, inviti di 7 giorni e un uso col token mostrato una volta (D54.7).
ADR-0184 (punto 8, confermato da D52) ha chiesto per chi ospita senza Firebase un verificatore a inviti, «lo stesso meccanismo»; D54.8 li ha messi in
un task solo. Restavano da decidere: com'è fatta un'identità senza Firebase e come si revoca, come non si confonde con un account, chi è il padrone
del server, come un invitato legge un universo che non vede prima di entrarci, e che cosa vede un estraneo.

## Decisione

1. **L'archivio** è `universes/.campaign/<nome>.json` (`SERVER_FOLDERS.campaign`, `CampaignArchive` in `server/campaign.ts`): `private`, `guests`
   per id del viandante (`since`, `by`, `note`, `invite`), `invites` per impronta SHA-256 del token (`made`, `expires`, `uses`, `left`, `by`,
   `note`). Scritto intero sotto un lucchetto che vale fra processi (`server/lockedFile.ts`, gli stessi passi del ledger), letto solo dal server; gli
   inviti spesi o scaduti si tolgono a ogni scrittura; un file illeggibile vale **privato e senza ospiti**. Un universo che nasce con un nome nasce
   pubblico (`create` toglie il file di prima); un clone ha un altro nome e nasce pubblico.
2. **Chi vede un universo privato** (`letsIn`): il suo mondo, il suo master (mai un anonimo), gli ospiti (anche anonimi: il master risponde di chi
   ha invitato, ADR-0188). A chiunque altro **non esiste**: lo store risponde come per un nome senza universo (`{ exists: false }` allo snapshot e a
   `carte`, «solo da questa macchina» al resto, 404 alla rotta `guests`), l'elenco `/api/universe` non lo dice (a chi lo vede lo dice in `invite`),
   `/api/session` non dice mai un universo privato (il master e gli ospiti lo trovano nell'elenco dello store), `kin`, `bring`, `/api/viandante`,
   `/api/crediti` e il `from` di una carta fatta a mano lo saltano (`sees`, `seesUniverse`). Restano, accettati: un `create` con quel nome risponde
   «esiste già» come per ogni nome preso, e un socket per quel nome non è rifiutato subito come per un nome senza universo; chi conosce già il nome
   può sapere che c'è, non leggerlo né entrarci.
3. **L'ingresso** (`admit`, `server/session.ts`): dopo il token e prima di `open`, chi non è master né ospite riceve `refusal` «questo mondo è su
   invito» e il mondo non parte. Il mondo sa solo **se** è privato, per valore (`WorldOpen.private` a ogni avvio, `setPrivate` fra le chiamate del
   canale quando il master lo cambia), mai chi sono gli ospiti (regola 8g): gli serve per gli anonimi dove paga il master (`privateWorld`, ADR-0188).
   Il server tiene chi ha ammesso in ogni mondo (`wanderersIn`): togliere un ospite chiude i suoi socket (`expelFrom`).
4. **La rotta** `/api/universe/<nome>/guests` (dentro lo store, sotto `HEAVY` in produzione): `GET` la lista e gli inviti vivi, mai un token;
   `POST { op: 'private', value }` (diventando privato, chi è nel mondo resta come ospite, «era nel mondo»: nessuno è buttato fuori senza che il
   master lo veda), `{ op: 'add', id, note? }`, `{ op: 'invite', days?, uses?, note? }` (7 giorni e un uso se non detto; 1-30 giorni, 1-20 usi; il
   token esce **solo qui**); `DELETE { guest }` o `{ invite }` (il nome di un invito è l'inizio della sua impronta). Solo il master (`owns`), mai il
   mondo, solo JSON, 4 KiB, i tetti `CAMPAIGN_LIMITS` (200 ospiti, 50 inviti aperti, note di 80 caratteri con `cleanText`); il master non si toglie.
   Nella console del master, scheda «Universo», la sezione «Ospiti e inviti» (`Console.guests`, `UniverseClient.guests`).
5. **L'invito si usa con la stessa rotta**, `POST { op: 'redeem', invite }`, aperto a chiunque: **prima** di leggere l'universo, perché la pagina
   legge l'universo (lo snapshot, la lobby) prima del `join` e un estraneo lo leggerebbe come inesistente. È il cambio rispetto a ADR-0188, che
   lo consumava nel `join` (`join.invite`): il `join` non porta l'invito. Con un account (Firebase) l'invito non è un'identità: aggiunge agli ospiti
   l'account verificato (regola 8b); un ospite già dentro non lo spende. Le stesse parole per un token mai esistito, speso o scaduto; a chi non vede
   l'universo un rifiuto è «universo sconosciuto». Il link è `/?universo=<nome>#invito=<token>`: **nel frammento**, che il browser non manda mai a un
   server (né ai suoi log né a un proxy), e la pagina lo toglie dall'indirizzo appena lo legge (`takeFromAddress`; `?invito=` è letto e tolto allo
   stesso modo).
6. **Il verificatore a inviti** (`QUINE_ACCOUNT=inviti`, `QUINE_SEGRETO_INVITI`, `server/invites.ts`): un'identità è un token
   `qid1.<{id, exp}>.<HMAC-SHA256>` con una chiave derivata dal segreto (almeno 32 caratteri), confrontato a tempo costante, che scade in **30
   giorni** e si rinnova a ogni ingresso (`POST /api/account` con l'identità: un token nuovo; il browser lo tiene in `localStorage →
   quine:identity`). Vale solo se l'id è nel **libro delle identità** (`universes/.identities.json`: quando è nata, da dove, se è revocata; mai un
   token) e non è revocato; un libro illeggibile non fa entrare nessuno. Gli id sono `inv-` e 16 lettere casuali; il verificatore di Firebase
   rifiuta gli uid che cominciano con `inv-` (`refusedUid`), così un account e un invito non condividono mai un viandante, anche in un universo che
   cambia verificatore. Senza identità, un invito buono ne fa una (`redeem` risponde `identity`, una volta), nello stesso passo in cui si spende;
   togliere un ospite revoca l'identità nata da un invito di quell'universo (quella nata altrove resta: per lui sparisce solo quell'universo).
   **Il padrone del server** ha l'id `inv-owner`, fatto (o rifatto, se revocato) da `npm run inviti -- padrone` sulla macchina del server, che stampa
   il link `…/site/profilo.html#accesso=<token>`; `elenco` e `revoca <id>` per il resto. Il server di produzione non parte con `QUINE_ACCOUNT=inviti`
   senza un segreto buono, né con Firebase insieme (`productionProblems`); un altro valore di `QUINE_ACCOUNT` non parte.
7. **Il client**: `accountConfig` riconosce `{ invites: true }`; `signIn` con il verificatore a inviti usa l'identità del browser (o il link del
   padrone) e la rinnova, e senza identità dice di chiedere un link al master (`NEEDS_INVITE`); `signedIn` dice chi è già collegato senza chiedere.
   La pagina del gioco usa l'invito del link (`redeemInvite`) prima di leggere l'universo; uno snapshot che non c'è si rilegge come chi è già
   collegato; se non c'è nemmeno così, con gli account da un'altra macchina (o su un server a inviti) la pagina dice «l'universo non c'è, o è
   su invito: chiedi un link al suo master», e da questa macchina va avanti senza nome, come prima (un universo nuovo si fa ancora da qui). Il
   sito (l'elenco con `invite`, la pagina della sessione) è di T377.
8. **La versione del kernel** sale a 0.7.4 (`UniverseClient.guests`): niente cambia negli universi.

## Alternative considerate

- **L'invito nel `join`** (ADR-0188): la pagina legge l'universo prima di entrare, e a un estraneo l'universo privato non esiste; servirebbe una
  lettura «con l'invito», che farebbe del token una chiave di lettura finché non è speso. Scartata per la rotta `redeem`.
- **Il link con `?invito=`** (lo studio): il token finirebbe nei log del server, dei proxy e della cronologia. Il frammento non lascia il browser.
- **Identità senza libro, solo firmate**: nessuna revoca fuori dal cambio del segreto, che le revoca tutte. Il libro costa un file e una lettura per
  verifica (con la cache sul `mtime`).
- **Identità senza scadenza**: un token copiato varrebbe per sempre. 30 giorni rinnovati a ogni ingresso tengono chi gioca e lasciano fuori chi no.
- **Il padrone del server come «chi è su questa macchina»**: su una VPS o dietro un tunnel il padrone non è su questa macchina; un comando che firma
  col segreto del `.env` funziona dappertutto.
- **Buttare fuori chi è nel mondo quando diventa privato**: il master perderebbe i suoi giocatori senza vederlo. Restano, fra gli ospiti, e il master
  li toglie se vuole.
- **Rifiutare al socket con le parole di un nome senza universo**: il socket di un nome senza universo è rifiutato prima del `join` (V-025), quello di
  un universo privato dopo; le parole non basterebbero a nasconderlo. Si dice «questo mondo è su invito», come lo studio.

## Conseguenze

- Regole di `AGENTS.md`: 8d (anche `.campaign/` e `.identities.json` stanno fuori dagli universi), 8j (`admit` controlla gli ospiti), 8h (`QUINE_ACCOUNT`
  e il suo segreto in `productionProblems`); `docs/architettura-dettagli.md` (`#account`, `#multigiocatore`), il glossario (universo privato, ospite,
  invito, verificatore a inviti), il registro della sicurezza (V-038).
- Un server senza Firebase può ospitare un gruppo di amici: il padrone si collega col suo link, fa un universo, lo rende privato, manda gli inviti.
  Chi perde il browser perde l'identità (non c'è niente da recuperare): il master lo toglie e lo invita di nuovo.
- Il pacchetto del self-hosting (T367) dovrà portare `npm run inviti` (oggi con `vite-node`) nell'immagine, o costruirlo in `dist-server/`.
- Le identità di un server a inviti valgono solo lì: un viandante che passa a un server ufficiale è un altro viandante (le carte passano come carte
  portate, ADR-0170).
