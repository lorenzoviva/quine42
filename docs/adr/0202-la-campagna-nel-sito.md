# ADR-0202 — La campagna nel sito: la pagina della sessione fa ciò che fanno la console e la Direzione

Data: 2026-11-14 · Stato: **accettato** (T377, step 43; applica ADR-0188 § 6 riga 7) · Riferimenti:
[`docs/design/campagna-master.md`](../design/campagna-master.md) § 5.4 e § 7, ADR-0188 (la campagna del master), ADR-0191 (le direttive),
ADR-0194 (l'universo privato), ADR-0196 (il ritmo del mondo), ADR-0201 (le regioni del master), ADR-0110 (ogni mondo è un processo),
ADR-0095 (il sito)

## Contesto

La campagna del master (ADR-0188) si regola nel gioco: «Ospiti e inviti» e il ritmo nella console, le regioni nell'Ufficio dei luoghi e nella
Direzione, le direttive (`world/campaign.md`) nell'editor o dal Referente. Il design (§ 5.4) chiede che la pagina della sessione del sito faccia
le stesse cose, per chi prepara la campagna senza entrare. Ospiti e inviti (`guests`, T366) e ritmo (`pace`, T373) hanno già le loro rotte dello
store; le direttive e le regioni no: nel gioco passano dal kernel (l'editor e il ramo del master, il messaggio `region`).

Due cose da tenere: un mondo acceso ha i file in memoria e scrive a modo suo nell'universo (ciò che il server scrivesse sul disco da fuori il
mondo non lo vedrebbe, e un suo commit lo potrebbe coprire); un mondo spento non c'è, e il master deve poter scrivere lo stesso.

## Decisione

1. **Una rotta dello store**, `campaign` (`server/campaignSite.ts`): `GET /api/universe/<nome>/campaign` dà direttive (il modello vuoto se non ci
   sono), regioni, ambienti del mondo, luoghi pianificati (da `maps/`, al più 2000, i più vicini al primo) e se il mondo è acceso; `POST` con
   `{ op: 'text', text }`, `{ op: 'region', region }` (anche per cambiarne una, con il suo `id`) o `{ op: 'release', id }`. Solo il master di un
   universo di molti (`owns`), mai il token di un mondo; un universo privato a chi non lo vede risponde come un nome che non c'è (ADR-0194); solo
   JSON, il corpo al più 160 KiB, sotto `HEAVY` come ogni rotta di un universo.
2. **I controlli sono quelli del gioco**, in una funzione pura sui file (`src/kernel/campaignEdit.ts`, `campaignEdit`): le direttive come le
   controlla il validatore (`readCampaign`: sezioni, tetti; le righe che la quarta parete lascia fuori si dicono e non si rifiutano, come
   nell'editor), le regioni come le controlla il kernel (`masterRegion`, `withoutMasterRegion`: testi di un giocatore, quarta parete locale,
   tetti, un ambiente che il mondo ha). Il risultato è un file solo (`world/campaign.md` o `world/atlas.json`), un messaggio e un autore.
3. **Chi scrive**: a mondo acceso **il mondo** (`WorldCalls.campaign`, una chiamata nuova del canale): applica la stessa funzione ai suoi file e
   ai suoi ambienti (`content.layouts`) e la scrive come il master pubblica (`Kernel.publish`: validata, applicata, un commit della linea
   principale), così chi gioca ha subito le regioni nuove e il Concilio le direttive alla richiesta dopo; e risponde con ciò che ha ora (il disco
   può essere un passo indietro). A mondo spento **lo store**, nella fila dell'universo (`serial`): legge i file che servono (configurazione,
   atlante, direttive, lessico, manifest), scrive il file e committa; il mondo lo trova quando riparte. Un universo di un altro contratto non si
   scrive dal sito (409): lo porta il suo mondo, alla prima apertura (`migrateUniverse`).
4. **La pagina** (`site/sessioni.html`, `site/campagna.ts`): l'hub sa chi guarda (un account già collegato in questo browser, mai chiesto per
   leggere; senza account il viandante di questa macchina) e lo dice al server, che risponde: una carta è «mia» quando l'istantanea arriva
   intera (con il suo registro), e un universo privato si mostra «SU INVITO» al master e agli ospiti, gli unici a cui l'elenco lo dice. Su un
   universo di molti del master il pulsante «CAMPAGNA» apre (anche da un link, `?campagna=<nome>`) il pannello: ospiti e inviti come nella
   console (il link dell'invito mostrato una volta, il token nel frammento), il ritmo con i tre pulsanti, l'atlante (luoghi pianificati, regioni
   del master piene e del Cartografo tratteggiate, un clic sceglie il centro) con «Dichiara regione», «Cambia» e «Libera», le direttive in un'area
   di testo con «Salva». Ogni testo entra nella pagina come testo, mai come HTML; ogni motivo del server si mostra.
5. **La guida della beta**: `docs/beta/campagna.md`, per chi fa il master nella beta (che cosa fa ogni parte, dal gioco e dal sito, e il server
   senza Firebase con `npm run inviti`); non è una parte della pagina delle istruzioni (quella la scrive l'autore, ADR-0131).

Kernel 0.7.12 (Z): un modulo nuovo e una chiamata del canale dei mondi; nessun formato cambia.

## Conseguenze

- Il master prepara la campagna senza entrare e la cambia a partita in corso senza aprire il gioco: ciò che fa nella pagina è ciò che farebbe
  nella console, con gli stessi motivi quando qualcosa non regge.
- Un mondo che si accende fra il controllo «è spento?» e il commit dello store legge l'universo dopo (lo store serve anche lui nella fila
  dell'universo), salvo che la sua lettura non sia già partita: una finestra stretta, che si chiude al commit seguente del mondo solo se il mondo
  non riscrive lo stesso file. Accettato: il mondo si avvia in secondi e il sito scrive in millisecondi.
- Le direttive scritte dal sito vanno nella linea principale: se il master ha nel suo ramo una versione di `campaign.md` non pubblicata, alla
  pubblicazione vince la sua (come per ogni file cambiato anche nel mondo).
- Il gioco, su un server senza account, rilegge un universo che non c'è come il viandante della scheda (`src/main.ts`): prima il master di
  un universo privato non ci entrava (si vedeva nella verifica nel browser).
- Sicurezza: V-042 (`tests/sicurezza/campagna-sito.test.ts`).
