# ADR-0083 — I pagamenti con Stripe

Data: 2026-10-30 · Stato: accettato (task T45e del backlog) · Fase 4 di ADR-0050 (il multiplayer); estende ADR-0081 (crediti e spese comuni) e ADR-0082 (l'account).

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
