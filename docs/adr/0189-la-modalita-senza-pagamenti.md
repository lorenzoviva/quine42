# ADR-0189 — La modalità senza pagamenti del server di produzione e il controllo di salute

Data: 2026-11-13 · Stato: accettato · Riferimenti: ADR-0184 (la open beta senza pagamenti all'autore, punto 5; D52 lo conferma), ADR-0083
(Stripe Checkout), ADR-0104 (saldi fuori dall'universo), ADR-0112 (il server di produzione), ADR-0132 (la commissione), ADR-0157 (Jev);
[`docs/design/open-beta.md`](../design/open-beta.md) § 2.4, § 3 e § 6 riga 1; T361 (step 43)

## Contesto

Nella Fase IV, la open beta, nessun pagamento passa dall'autore. Oggi il server di produzione non parte senza `STRIPE_WEBHOOK_SECRET`
(`productionProblems`), monta sempre le rotte di Stripe e applica la commissione di `QUINE_COMMISSIONE`; il gioco e il sito mostrano i pulsanti
delle ricariche a chiunque abbia un account. Chi ospita un server (l'autore su Compute Engine, la community in self-hosting) non ha Stripe e
non deve averlo. Manca anche un controllo di salute: un bilanciatore o il runtime di un container chiama con l'indirizzo, cioè con un `Host`
che non è fra le origini, e oggi riceve 403 (ADR-0112 lo lasciava a T45f).

D52 (13/11) conferma le scelte di ADR-0184 tranne la 5 (Jev): **Jev non si spegne in open beta**, perché OpenRouter dà anche i modelli di
TypeSafe.

## Decisione

1. **`QUINE_PAGAMENTI`**, del solo server: `accesi` (il predefinito, anche se manca: come prima) o `spenti`, scritto così (maiuscole e spazi
   ammessi). Ogni altro valore è un problema di `productionProblems`: spento **va detto**, mai dedotto dall'assenza di un segreto (il principio
   di ADR-0112), e un errore di battitura non decide niente. La legge `paymentsOf` (`server/ledger.ts`).
2. **Spenti**: le rotte di Stripe non si montano (`/api/stripe/config`, `/checkout`, `/webhook` rispondono 404 come ogni rotta che non è
   nell'elenco), nel server di produzione e in quello di sviluppo; `productionProblems` non chiede `STRIPE_WEBHOOK_SECRET` né guarda
   `STRIPE_SECRET_KEY`; la commissione è 0 qualunque cosa dica `QUINE_COMMISSIONE` (`platformFeeOf`), quindi per il portafoglio del sito e per
   i mondi (`credits.platformFee`, `worldEnv`), che la ricevono per valore come prima. `serve.ts` lo dice nel log all'avvio.
3. **Le ricariche nascoste dai client**: chi mostra una ricarica chiede prima `/api/stripe/config` (`rechargesAvailable`, `src/ui/recharges.ts`)
   e la mostra solo se risponde `available: true`. Nel gioco la lobby, il pannello `P` (che tiene il saldo, con una riga che dice che qui non si
   ricarica) e la modale dei crediti esauriti (senza il pulsante, con un testo che non lo offre); nel sito la pagina dei crediti (via il
   pannello della ricarica, saldo e registri restano) e il profilo (via il pulsante «Ricarica», la nota dice cosa succede a crediti esauriti).
   Lo stesso vale per un server con i pagamenti accesi ma senza chiave di Stripe.
4. **Stripe spento, non tolto**: il codice, i test e le rotte restano per la Fase VI; il ledger resta (i saldi, le ricariche a mano del master
   entro `QUINE_TETTO_RICARICHE`, invariato: 0 con gli account se non detto).
5. **Jev resta**: `TYPESAFE_KEY` si usa se detta, con il suo tetto come oggi, anche con i pagamenti spenti (D52); quando ci sarà OpenRouter
   (T362) passerà da lì.
6. **Il controllo di salute** `GET|HEAD /healthz` (`HEALTH_PATH`): prima della porta d'ingresso, quindi con qualunque `Host` e da qualunque
   indirizzo, senza ritmo; solo quel percorso, solo `GET` e `HEAD` (405 il resto); risponde la parola `ok`, o 503 `in chiusura` da quando il
   server ha cominciato a fermarsi, con `Cache-Control: no-store` e le intestazioni di ogni risposta, nessun CORS. Non dice niente della
   configurazione, dei mondi o degli universi. Il nome è quello che Compute Engine, Cloud Run, Docker e Fly si aspettano.

## Alternative considerate

- **Spegnere i pagamenti quando manca `STRIPE_WEBHOOK_SECRET`**: un segreto dimenticato in produzione spegnerebbe gli accrediti in silenzio.
  Scartata (ADR-0112).
- **Lasciare montate le rotte con `available: false`**: il checkout e il webhook resterebbero porte aperte senza scopo. Scartata.
- **Un campo `pagamenti` in `/api/account`** al posto di chiedere `/api/stripe/config`: un campo in più su una rotta che parla d'altro; il
  config di Stripe già diceva se si incassa, e 404 lo dice anche meglio.
- **Un controllo di salute che dica versione del kernel, mondi accesi, modalità**: utile a chi ospita, ma è l'unica risposta che arriva a un
  nome che non è nostro. Scartata: chi ospita legge il log.

## Conseguenze

- `AGENTS.md`: la regola 8h (cosa `productionProblems` chiede) e il `.env` dicono `QUINE_PAGAMENTI` e `/healthz`; `docs/architettura-dettagli.md`
  `#stripe` e `#carte-crediti`; la voce V-035 del registro della sicurezza; due voci del glossario.
- ADR-0184 punto 5 applicato (senza la parte su Jev, che D52 cambia); i punti 6 (il verificatore a inviti) e la chiave di OpenRouter sono
  task a parte (T362 e successivi). Finché non ci sono, con i pagamenti spenti i crediti arrivano solo dalle ricariche a mano del master,
  entro `QUINE_TETTO_RICARICHE`; senza crediti si gioca con i modelli locali, comuni comprese (regola 8i).
