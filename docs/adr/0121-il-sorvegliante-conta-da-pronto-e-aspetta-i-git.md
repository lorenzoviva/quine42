# ADR-0121 — Il sorvegliante conta `healthy` da `pronto`; `stop()` aspetta i git e non lascia lock

Data: 2026-11-03 · Stato: accettato · Riferimenti: ADR-0110 (ogni mondo in un processo), ADR-0103 (`server/git.ts`), T176 (le misure), T209

## Contesto

T176 ha misurato due difetti del sorvegliante e ha proposto le correzioni; le ha approvate l'orchestratore, nell'autonomia data dall'autore il 03/11.

- `healthy` (60 s) si contava dal `fork`. Un mondo si apre in 12 s a vuoto e in ~90 s sotto carico: un'apertura più lunga di `healthy` azzerava le morti al primo
  sguardo. Un mondo che muore appena aperto per un commit cattivo non tornava mai all'ultimo commit vissuto e non si arrendeva: ripartiva per sempre.
- `stop()` finiva quando il processo del mondo era uscito, ma il `git commit` del suo ultimo salvataggio lo lancia il server e poteva essere ancora in corso. `serve.ts` fa
  `process.exit` subito dopo `stop()`: i lock restavano nel repository (visti `HEAD.lock` e `refs/heads/master.lock`) e un lock rimasto ferma i commit dopo.

## Decisione

- **`healthy` si conta da `pronto`** (`openedAt`). L'apertura ha già il suo tempo, `boot`. Tempi e soglie restano quelli di ADR-0110.
- **`server/git.ts` sa cosa corre in ogni cartella**: `runGit` tiene i processi, `holdGit` tiene un lavoro di più comandi, e il negozio tiene così ogni operazione dal momento in cui entra in coda.
- **`settleGit(cartella)`**: aspetta che la cartella sia libera, al più `GIT_SETTLE_MS` (5 s). Scaduto il tempo uccide i git rimasti. Alla fine, se nessun git corre più, toglie i `*.lock`
  di `.git`. Con nessun git in corso un lock non è di nessuno, perché ogni git del server passa da `runGit` e i mondi non possono lanciare processi. Un commit interrotto non perde nulla: i file
  sono nella cartella e li prende il commit dopo.
- **`WorldHost.stop()`** aspetta l'uscita del mondo e poi `gits` (l'opzione che `session.ts` lega a `settleGit` del suo universo); il server di produzione, chiuse le connessioni, fa `settleAllGit`
  per ciò che le rotte hanno avviato senza un mondo.

## Conseguenze

- Una fermata costa al più 3 s (il mondo) + 5 s (i git) + 1 s (l'uccisione): resta sotto i 10 s che danno di solito le piattaforme tra il segnale di fine e l'uccisione. Da rivedere al deploy (T45f).
- Chi riapre un universo appena lasciato vuoto aspetta anche i suoi git (`stopping` in `session.ts`).
- Resta fuori: un server ucciso di colpo (SIGKILL, corrente) lascia i suoi lock fino alla fermata seguente di quel mondo; all'apertura nessuno li toglie, e i commit prima di quella fermata falliscono.
