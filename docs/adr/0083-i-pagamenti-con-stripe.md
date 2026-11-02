# ADR-0083 — I pagamenti con Stripe

Data: 2026-10-30 · Stato: accettato (task T45e del backlog) · Fase 4 di ADR-0050 (il multiplayer); estende ADR-0081 (crediti e spese comuni) e ADR-0082 (l'account).

> **Aggiornamento (T125, ADR-0104):** i pagamenti non stanno più in `world/pagamenti.json` ma nell'archivio del server fuori dall'universo, e un accredito non fa più commit. Sotto, com'era.

## Contesto
Nelle partite multigiocatore (ADR-0050), ogni chiamata ai modelli comporta un costo in crediti/dollari con commissione di piattaforma (+1%, ADR-0081).
L'autore ha stabilito (29/10/2026, `docs/pipeline/domande/T45.md`) che dopo la gestione manuale da parte del master, il sistema di pagamento per la ricarica dei crediti è **Stripe Checkout** (con Google Pay compreso).
Requisiti del task T45e:
1. Ricarica crediti con Stripe Checkout (Google Pay compreso) in modalità di prova;
2. Webhook sul server per accreditare i crediti in modo idempotente;
3. Chiavi API esclusivamente sul server (mai nel client né in `dist/`, conformemente alla Regola 9);
4. Un account anonimo non può acquistare crediti;
5. Tracciamento e verifica mediante webhook finto nei test, e verifica nel browser con le chiavi di test fornite dall'autore.

## Decisione
1. **Chiavi solo sul server** (`server/stripe.ts`):
   - Le variabili d'ambiente `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `STRIPE_PUBLISHABLE_KEY` sono lette solo sul server da `vite.config.ts` tramite `loadEnv`. Nessun segreto raggiunge il browser.
   - La sessione di checkout è creata server-side tramite REST API (`POST https://api.stripe.com/v1/checkout/sessions`), restituendo al browser solo l'URL della pagina ospitata di Stripe (`session.url`).
   - Il browser redirige a Stripe Checkout, che gestisce carte di credito e wallet digitali (Google Pay, Apple Pay) in modo nativo e certificato.
2. **Creazione sessione di ricarica** (`POST /api/stripe/checkout`):
   - Valida l'ammontare dei crediti (1-1000 $).
   - Se il server usa Firebase Auth (`accounts.verify`), verifica il token: rifiuta con 403 gli utenti anonimi (`account.anonimo`) e chi tenta di acquistare per un altro viandante.
   - Se il server è senza account Firebase, controlla comunque che il viandante non sia marcato come anonimo.
   - Crea la sessione con metadati: `universo`, `wandererId`, `crediti`. Imposta `client_reference_id` sul viandante e configura `success_url` e `cancel_url` con i parametri `?ricarica=successo` o `?ricarica=annullata`.
3. **Verifica della firma del webhook** (`verifyStripeWebhookSignature`):
   - All'arrivo di `POST /api/stripe/webhook`, il server estrae timestamp `t` e firma `v1` dall'header `stripe-signature`.
   - Verifica la freschezza del timestamp (tolleranza 300 s contro attacchi replay).
   - Calcola HMAC-SHA256 su `${timestamp}.${rawBody}` con la chiave `STRIPE_WEBHOOK_SECRET` e confronta in tempo costante (`crypto.timingSafeEqual`).
   - Se la firma non è valida, risponde 400 (`Firma webhook Stripe non valida`).
4. **Accredito idempotente e storico pagamenti** (`src/kernel/credits.ts`):
   - Creato lo store dei pagamenti in `world/pagamenti.json` (`PaymentsStore`, `PaymentRecord`).
   - `isPaymentProcessed(files, eventId)` verifica se l'evento Stripe è già stato registrato. In caso positivo, il webhook risponde 200 con `duplica: true` senza accreditare di nuovo (idempotenza garantita anche in caso di retry da parte di Stripe).
   - `Kernel.creditRecharge(payment)` valida l'evento, verifica che il viandante non sia anonimo, accredita con `giveCredits(wandererId, crediti)`, registra la transazione in `world/pagamenti.json`, emette l'evento `payment:received` sul bus e sincronizza il repo git.
   - Se l'universo non è attualmente attivo in memoria, `applyPaymentToUniverse` aggiorna direttamente i file `world/giocatori/<id>.json` e `world/pagamenti.json` sul disco e committa con git.
5. **Divieto assoluto per i viandanti anonimi**:
   - `POST /api/stripe/checkout` risponde 403 se l'utente è anonimo.
   - `creditRecharge` e `applyPaymentToUniverse` rifiutano l'accredito qualora un evento di pagamento fosse indirizzato a un id anonimo.
   - Nel pannello del profilo (`ProfilePanel`), l'utente anonimo vede solo "Lega a Google" ed "Esci"; i pulsanti di ricarica appaiono solo per gli account autenticati non anonimi.
6. **Interfaccia utente** (`src/ui/profile.ts`, `src/main.ts`, `src/style.css`):
   - Nel pannello del profilo (`P`), la sezione account mostra il saldo crediti in dollari (`$X.XX`) e i pulsanti rapidi di ricarica (`+5 $`, `+10 $`, `+20 $`).
   - Al clic, il client contatta `/api/stripe/checkout` e reindirizza alla sessione di Stripe.
   - Al ritorno in gioco (`?ricarica=successo`), l'HUD mostra un messaggio di notifica ("Ricarica completata! I crediti verranno accreditati dal server") e pulisce la querystring per mantenere l'URL pulito.

## Conseguenze
- Ricarica dei crediti sicura, conforme alle normative e senza esporre credenziali o segreti nel client.
- Supporto per Google Pay e carte di credito integrato tramite Stripe Checkout.
- Idempotenza completa a prova di duplicazione webhook.
- Suite di test automatizzati `tests/stripe.test.ts` con webhook simulato, verifica di firme, idempotenza e blocco anonimi.

## Aggiornamento (T93, 2026-10-31): la verifica con le chiavi di prova
La verifica nel browser con un account Stripe di prova vero ha trovato due rifiuti dell'API che i test con `fetch` finto non vedevano:
1. `payment_method_types` non è più accettato nella creazione della sessione: i metodi di pagamento (carte, Google Pay, Apple Pay, Link…)
   si scelgono nel Dashboard di Stripe. Il server non lo manda più.
2. Sull'account sono attivi per impostazione i **Managed Payments** (Stripe come venditore registrato, che gestisce le imposte), che
   chiedono un codice fiscale del prodotto. Il server lo manda se c'è `STRIPE_TAX_CODE` nel `.env` (`line_items[0][price_data][product_data][tax_code]`);
   senza, disattiva i Managed Payments per la sessione (`managed_payments[enabled]=false`) e il pagamento è un Checkout normale. Quale dei due
   usare è una scelta fiscale dell'autore (`docs/pipeline/domande/T93.md`).
3. `applyPaymentToUniverse` committa solo `world/giocatori/<id>.json` e `world/pagamenti.json` (non più `git add -A`): le modifiche non
   committate dell'universo non finiscono nel commit della ricarica.

## Aggiornamento (T124, 2026-11-01): il webhook non crede a nulla senza prova (V-004)
Sostituisce il punto 3 dove la verifica era facoltativa e il punto 2 dove il credito veniva dai metadati.
1. **Senza `STRIPE_WEBHOOK_SECRET` la route risponde 503**, nel server di sviluppo e nella preview: niente firma verificabile, niente accredito.
2. **Una chiave vera senza quel segreto non incassa**: `POST /api/stripe/checkout` risponde 503 e `GET /api/stripe/config` dice `available: false`, perché il pagamento non potrebbe mai diventare credito. Le chiavi `mock` non muovono denaro e restano senza segreto.
3. **Nomi e id come nel checkout**: `metadata.universo` e `wandererId` sono validati prima di finire in un percorso; altrimenti 400.
4. **Il credito è l'importo pagato** (`paidCents`, un credito è un dollaro): il minore tra `amount_total` e `amount_subtotal`, così le tasse aggiunte sopra (Managed Payments) non diventano crediti e uno sconto non ne regala. `metadata.crediti` resta nella sessione per il Dashboard e non si legge più. Un importo non leggibile o in una valuta diversa dal dollaro risponde 400.
La scelta sulle tasse è un'interpretazione del task, non provata contro una sessione vera di Stripe con le imposte: se T45f accende i Managed Payments, va guardato un evento vero.
