# ADR-0200 — «Collega OpenRouter» nel gioco e nel sito: il PKCE dalla pagina, il limite letto da OpenRouter, la chiave accanto agli universi da soli

Data: 2026-11-14 · Stato: accettato · Riferimenti: T364 (step 43, Fase IV: la open beta), ADR-0197 (le chiavi dei giocatori sul server, T363),
ADR-0193 (l'adattatore OpenRouter), ADR-0184 (la open beta), `docs/design/open-beta.md` § 1.2, § 1.3, § 6 riga 4, D52

## Contesto

T363 ha messo sul server il varco delle chiavi (`OpenRouterGate`, la rotta `/api/openrouter` con `status`, `begin`, `key`), ma nessuna pagina lo
usava: un giocatore non poteva collegare la sua chiave, né vederne lo stato. Lo studio (§ 1.2) chiedeva il PKCE come via principale e l'incolla
come ripiego, un limite proposto dal gioco e, da soli sul PC, la chiave in un file accanto agli universi (§ 1.3). Da soli, il gioco nel browser
sceglieva solo fra Gemini e i modelli locali.

La documentazione di OpenRouter (letta il 14/11/2026) dice che l'indirizzo dell'autorizzazione (`https://openrouter.ai/auth`) prende
`callback_url`, `code_challenge`, `code_challenge_method`, `state`, `key_label` e il workspace, **non un limite**; il limite al codice lo passa
solo `POST /api/v1/auth/keys/code`, che vuole una chiave di gestione (dell'account che la crea: non serve per le chiavi dei giocatori).
`GET /api/v1/key`, con la chiave, dice `limit`, `limit_remaining`, `limit_reset`, `usage`, `is_free_tier`.

## Decisione

1. **Un modulo per tutte le pagine** (`src/ui/openrouter.ts`, senza three.js né kernel): `OpenRouterLink` parla con la rotta per una pagina
   (chi è lo dicono le intestazioni: il token dell'account, o senza account l'id del viandante), `openRouterBox` è il riquadro «La tua chiave di
   OpenRouter». **Il PKCE**: la pagina fa il verifier (48 byte casuali) e la challenge S256, chiede lo `state` al server (`POST begin`), tiene
   verifier e state nel `sessionStorage` della scheda (mai una chiave) e va a `https://openrouter.ai/auth` con `callback_url` = la pagina stessa
   senza `code`, `state` e frammento, `key_label=QUINE42`. Al ritorno (`OpenRouterLink.returning`, `finish`) codice e state escono subito
   dall'indirizzo, lo state si confronta con quello della scheda, poi codice, verifier e state vanno al server, che scambia (T363): la chiave non
   tocca la pagina. **L'incolla** è il ripiego, in un `<details>`, con un campo password. **Scollega** la dimentica sul server (su OpenRouter resta).
2. **Lo stato della chiave** è una porta nuova, `GET /api/openrouter/key`: impronta, `exhausted` e ciò che OpenRouter dice del limite
   (`keyLimits`, `GET /api/v1/key` dal server con la chiave, letto campo per campo da `readKeyLimits`: `limit`, `remaining`, `usage`, `reset`,
   `freeTier`, `label`), mai la chiave; detto di nuovo per un minuto senza chiedere (`LIMITS_TTL`), fuori dal ritmo delle porte delle chiavi; un 401
   la dimentica (revocata) e la porta lo dice (`forgotten`). `status` dice anche `worlds` (dove la rotta lo sa): se i mondi di molti di questo
   server pagano su OpenRouter (`serverKey || !gemini.available`, come `worldsPayWith`).
3. **Il tetto proposto** è un consiglio, non un parametro: OpenRouter non lo prende dal collegamento. Il riquadro propone il tetto della lobby (o
   `PROPOSED_LIMIT`, 5 $, nel pannello `P` e nel sito), lo dice accanto al pulsante con il nome della chiave e il link alle chiavi su OpenRouter, e
   dopo il collegamento confronta il limite vero: senza limite, finito, o molto più grande del proposto (`limitWords`) lo dice. Il tetto della lobby
   resta il limite del gioco nel mondo (T363); quello della chiave è di OpenRouter.
4. **Dove sta il riquadro**: nella **lobby** di una partita di molti, se chi entra paga per sé (non dove paga il master) e i mondi di questo server
   pagano su OpenRouter; nella lobby **da soli**, se il gioco non va su Gemini; nel **pannello `P`** sempre (rifatto a ogni apertura); nel **sito**,
   nella pagina del profilo, se il server ha la rotta. Lo stesso riquadro finisce un ritorno del PKCE cominciato in quella scheda.
5. **Da soli sul PC** la chiave collegata da questa macchina resta in un file **accanto agli universi**, `universes/.keys/openrouter.json`
   (`serverPath(…, 'keys')`, `{ keys: { <id>: <chiave> } }`, scritto intero con `writeAtomic`): solo il server di sviluppo e la preview danno il file
   al varco (`keysFile`), mai il server di produzione; solo una chiave collegata da un chiamante `local` (questa macchina, stessa origine) ci va; a un
   riavvio il varco la rilegge (ogni voce controllata: id valido, forma di una chiave di OpenRouter); scollegata o revocata (401) esce anche dal file.
   `universes/` non si serve mai (ADR-0109) e una cartella col punto non è un universo (ADR-0159).
6. **Da soli, i modelli** vanno su OpenRouter quando il server non ha una chiave di Google e chi gioca ha una chiave collegata (o il server ha
   `OPENROUTER_API_KEY`): `OpenRouterAiModels` e `OpenRouterDecisionModels` sulla rotta di questa macchina, con le intestazioni di chi gioca
   (`me` o l'account), così il varco paga con la sua chiave. Il ritorno del PKCE si finisce prima di scegliere i modelli: vale da subito; una chiave
   incollata vale dalla prossima apertura. L'HUD dice «OpenRouter · <modello>».

## Conseguenze

- La regola 9 di `AGENTS.md` cambia in un punto: una chiave di un giocatore sta su disco solo da soli sul PC, accanto agli universi, come
  `GEMINI_API_KEY` sta nel `.env`; sul server di produzione resta solo in memoria. V-040 lo dice.
- Il limite proposto non si impone: un giocatore che non lo imposta su OpenRouter ha una chiave senza limite, e il riquadro glielo dice a ogni
  apertura. Se OpenRouter un giorno prenderà `limit` nell'indirizzo, basta aggiungerlo ad `authUrl`.
- Verificato nel browser (preview della build, OpenRouter finto dietro il varco): il pannello `P` da soli, la lobby di molti e il profilo del sito, il
  PKCE con il ritorno (l'indirizzo vero di OpenRouter accetta i parametri e chiede di accedere; il ritorno con un codice finto), l'incolla, il limite
  letto, «Scollega», il file accanto agli universi, i modelli da soli su OpenRouter. Non provato con un account vero di OpenRouter (lo scambio, il
  limite proposto sulla pagina di autorizzazione) né dentro un mondo di molti acceso dalla preview.
- Kernel 0.7.10: solo un tipo in più (`KeyLimits`, `src/kernel/ai/openrouter.ts`); niente cambia per gli universi.
