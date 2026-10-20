# ADR-0021 — Due repository: il kernel (seme) e l'universo (su disco)

Data: 2026-10-20 · Stato: accettato

## Contesto
Il repository dell'universo viveva nel `localStorage` del browser (snapshot completi per ogni commit):
lo spazio si esauriva (avviso in console). L'autore chiede due repository: il kernel, immutabile, da cui
nasce una versione del gioco; l'universo, versionato durante la sessione, che si arricchisce di
sessione in sessione restando coerente, e si azzera tornando al seme del kernel.

## Decisione
- **Repository del kernel** = questo progetto; la sua cartella `universe/` è il **seme**. Non cambia mai
  mentre si gioca.
- **Repository dell'universo** = un vero repository git su disco, `universes/<nome>/` (ignorato da quello
  del kernel), gestito dal server di Vite (`server/universeStore.ts`, anche in `vite preview`): file di
  testo (moduli, regole, persone, trame, atlante, stato della partita), `maps/` (i piani dei luoghi) e
  `assets/` (le immagini). Commit con autori del gioco (Concilio, Viandante, Kernel), senza toccare la
  configurazione git della macchina. Nel browser restano solo gli snapshot della sessione (in memoria);
  ogni commit valido viene scritto su disco in ordine, senza bloccare il gioco.
- **Nascita**: se l'universo non esiste nasce dal seme; un mondo giocato prima (nel `localStorage`)
  diventa il suo primo commit e il browser viene liberato. Immagini e mappe nell'IndexedDB migrano su
  disco la prima volta che servono.
- **Aggiornamenti del kernel** (fusione a tre vie, `upgradeFromSeed`): `seed.json` ricorda il seme da cui
  è nato l'universo; i file che l'universo non ha mai cambiato prendono la nuova versione, quelli nuovi
  arrivano, quelli riscritti restano suoi — ma ricevono le nuove voci di `tiles`, `layouts`, `runes`,
  `spells` (mai sostituendo le sue). I modelli in `universe.json` seguono sempre il kernel.
- **Stato della partita** (`world/stato.json`: inventario, bisogni, frase di rune, ciò che è stato preso,
  il contenuto dei forzieri, l'ora) salvato ogni 2 minuti e all'uscita, solo se l'universo è integro: non
  si salva mai un mondo rotto. Le conseguenze delle azioni sono regole (ADR-0019), le persone ricordano
  (ADR-0024): dopo un riavvio il mondo prosegue con lo stesso Concilio.
- **Azzerare**: «Riparti dal seme del kernel» (console → universo) sposta l'universo in
  `universes/.cestino/` (mai cancellato) e ne fa nascere uno nuovo.
- La firma dei luoghi in cache dipende solo dalla bibbia: ambienti, terreni e regioni nuove non
  rigenerano ciò che è già stato esplorato.

## Conseguenze
- Niente più limiti di spazio del browser; la storia dell'universo è leggibile con `git log`.
- Senza server (hosting statico) l'universo torna nel browser (come prima).
