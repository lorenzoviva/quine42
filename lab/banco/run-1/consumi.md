# I consumi della prima run e il raggio (T488)

La prima run della beta (T457, `docs/beta/run-1.md`): il 21/11, da soli, una copia di `orichalcum` sul branch `beta/run-1`, 18 minuti di
registrazione (16 del mondo), **2,93 $** al varco di Gemini. Qui: che cosa ha pagato e che cosa il viandante ne ha visto (§ 1), che cosa
cambia il raggio di ADR-0244 sullo stesso percorso (§ 2-3), la stima della lobby (§ 4), la prova con Gemini vero (§ 5).

Si rifà tutto senza chiamate:

```bash
npx vite-node lab/scripts/consumi-run.ts -- ../beta-run-1/universes/orichalcum --percorso lab/banco/run-1/percorso.json --json lab/banco/run-1/misura.json
git archive 9bf8c4b1 src universe | tar -x -C <cartella>      # il kernel di prima, per la sessione «prima»
npx vite-node lab/scripts/sessione-cammino.ts -- --minuti 18 --sorgente <cartella> --json lab/banco/run-1/sessione-prima.json
npx vite-node lab/scripts/sessione-cammino.ts -- --minuti 18 --json lab/banco/run-1/sessione-dopo.json
npx vite-node lab/scripts/sessione-cammino.ts -- --minuti 18 --latenza-piano 12 --json lab/banco/run-1/sessione-dopo-lenta.json
```

## 1. Che cosa ha pagato la run e che cosa il viandante ne ha visto

Il kernel non tiene il percorso del viandante: `consumi-run.ts` lo ricostruisce dai nove «salvataggio della partita» (la posizione e il tempo
del mondo) e, fra due, dai luoghi dove ha preso qualcosa (`state.json → consumed`, nell'ordine). Ne esce un percorso di 26 punti: 273 caselle
a piedi, una morte e la rinascita in piazza, poi 480 caselle al timone di una chiatta. Visto: un luogo che il rettangolo della camera tocca
lungo il percorso (`fitView`, 16:9, alla distanza della camera, al timone a `HELM_VIEW`); raggiunto: un luogo che il percorso attraversa. La
ricostruzione regge: l'84 % dei luoghi pianificati sta in ciò che il kernel caricava lungo di essa (la vista e un luogo per lato).

| | quanti | visti | raggiunti |
|---|---|---|---|
| luoghi pianificati dal Cartografo | 232 (più 59 di mare aperto, del kernel) | 161 (69 %) | 36 (16 %) |
| oggetti definiti (`content.define`) | 317 in 162 chiamate | 138 (44 %) nominati a terra in un luogo visto | 58 (18 %) in un luogo raggiunto o nella borsa |
| strutture scolpite | 5 (3 di Argon in 16 chiamate, 2 dalla libreria) | 5 | 3 |
| modelli nuovi | 18 (5 strutture, 5 forme comuni, 4 persone, 4 cose) | | |

| modello | compito | chiamate | $ |
|---|---|---|---|
| gemini-4-argon | model.sculpt | 16 | 1,043 |
| gemini-3.1-flash-lite | chunk.plan | 238 | 0,615 |
| gemini-3.1-flash-lite | content.define | 162 | 0,446 |
| gemini-3.5-flash | model.judge | 24 | 0,195 |
| gemini-3.1-flash-lite | model.sculpt | 40 | 0,147 |
| gemini-3.1-flash-lite | npc.individuate | 25 | 0,109 |
| gemini-3.8-flash | model.sculpt | 5 | 0,092 |
| gemini-3.1-flash-lite | forge.* (concept, physics, code, review) | 46 | 0,132 |
| gemini-3.1-flash-lite | content.* (un pacchetto) | 16 | 0,077 |
| altro (Attore, sessioni, morte, Jev) | | | 0,07 |

Perché: il kernel caricava come bozze i luoghi del rettangolo della camera più uno per lato (al timone la camera si allontana e il rettangolo
raddoppia) e il Cartografo li pianificava tutti; ogni piano applicato chiedeva subito le cose nominate a terra e le cose nuove; i ritmi dei
pacchetti, degli abitanti e delle sessioni battevano sui luoghi pianificati; lo Scultore delle strutture lavorava per ogni struttura caricata.
La stima della lobby supponeva 40 luoghi nuovi l'ora: la run ne ha pianificati 870 l'ora.

## 2. Il raggio sullo stesso percorso, a tavolino

`consumi-run.ts` mette sul percorso ricostruito (coi tempi fra i salvataggi) il raggio di `src/kernel/reach.ts`: i luoghi entro 8 caselle
dal viandante o entro 4 della via che fa per 10 secondi al suo passo. Dei 232 luoghi del Cartografo ne sarebbero stati in raggio 54 (23 %),
tutti i 47 luoghi raggiunti compresi; con 0 caselle attorno 47, con 18 caselle 92.

## 3. La sessione del cammino, prima e dopo

`sessione-cammino.ts` rigioca quel percorso in 18 minuti del mondo sul mondo del seme, coi modelli locali sotto un altro nome (così il
kernel chiede ciò che chiede a un modello vero: pacchetti, abitanti, sessioni) che rispondono **dopo il tempo di Gemini, nel tempo del
mondo** (un piano 6 s, una definizione 5, un individuo 8; una struttura 150 s, cinque chiamate di Argon; una figura 45; una cosa 15) e con i
piani **come quelli di Gemini nella run** (tre cose a terra, una su tre mai vista; 1,2 strutture, quasi tutte di un concetto nuovo; mezza
cosa nuova). Lo Scultore non gira: ogni modello che farebbe è contato per classe e prende il suo tempo. Le chiamate si pagano a ciò che una
chiamata del loro compito è costata nella run (`misura.json`) e, per confronto, alla stima della lobby.

| | prima (il kernel del base, 9bf8c4b1) | dopo (il raggio) | dopo, piani a 12 s |
|---|---|---|---|
| piani del Cartografo | 252 | 60 | 60 |
| cose definite | 183 | 45 | 42 |
| individui | 17 | 50 | 56 |
| strutture / cose / figure scolpite | 5 / 8 / 4 | 3 / 8 / 6 | 4 / 7 / 4 |
| secondi sulla bozza | 0 | 0 | 5,9 (al più 5,6 di fila) |
| costo ai prezzi della run | **3,01 $ (10,0 $/h)** | **1,79 $ (5,96 $/h)** | 1,98 $ (6,61 $/h) |
| costo alla stima della lobby | 2,84 $ (9,5 $/h) | 1,72 $ (5,74 $/h) | 1,94 $ (6,46 $/h) |

La sessione «prima» riproduce la run vera: 252 piani contro 238, 183 definizioni contro 162, 5 strutture contro 5, 3,01 $ contro 2,93.

Che cosa resta dopo il raggio: lo Scultore (le strutture di Argon quasi metà del costo: ogni luogo raggiunto porta un concetto suo e lo
Scultore lavora di continuo), gli individui (crescono: il tetto di due per tipo nel mondo caricato non si riempie più di persone in luoghi
lontani, mai individuate), i piani e le cose a terra dei luoghi raggiunti. **L'obiettivo di meno di 1 $/h a pieno dettaglio non è
raggiunto**; le leve che restano cambiano ciò che il mondo fa a pieno dettaglio e le decide l'autore (`docs/pipeline/domande/T488.md`).

## 4. La stima della lobby

`HOUR` in `src/kernel/coefficients.ts` ora viene dalla sessione «dopo»: 200 luoghi nuovi l'ora (prima 40), 0,75 chiamate per le cose ignote a
luogo (0,3), 0,7 individui a luogo (1,5 persone incontrate, con una chiamata ogni 1,2), 0,5 cose nuove a luogo (0,3), 10 strutture nuove
l'ora (4); le sessioni del Concilio al più quattro, come `holdSession`. `tests/raggio.test.ts` tiene la stima vicina alla sessione.

| | col seme (Attore spento) | `orichalcum` della run (Attore acceso) |
|---|---|---|
| stima di prima | 2,41 $/h | 2,67 $/h |
| stima di oggi a pieno dettaglio | 5,29 $/h | 5,54 $/h |
| stima di oggi a «Low Detail» | 1,70 $/h | |
| la sessione «dopo», alla stima della lobby | 5,74 $/h | |
| la run vera (prima del raggio) | | circa 10 $/h (2,93 $ in 18 minuti) |

## 5. La prova con Gemini vero

Su un clone di `sidera` (dalla copia della run, al tag `prima-della-run-1`), la preview della build sulla porta 4893, `GEMINI_TETTO_GIORNALIERO`
a 0,50 $: **0,478 $ al varco** (0,418 nel registro dell'universo; Jev 0,0008 $).

- All'ingresso i 20 luoghi che l'universo ha si applicano senza chiamate; le bozze fuori raggio restano bozze (`far`), una sola chiamata
  (una sessione del Concilio) nei primi 15 secondi.
- I piani di Flash-Lite: 3,3-4,8 s a mondo quieto, 11-12 s mentre l'arrivo chiedeva una dozzina di altre cose (la Fucina per le cose nuove
  dei luoghi in raggio, definizioni, individui, lo Scultore).
- Il primo cammino (6 caselle al secondo verso est, oltre i luoghi già fatti) è finito sulle bozze per 17 s: il passo misurato tick per tick
  nella pagina si azzerava (più tick in un fotogramma, la posizione che salta sul primo) e il raggio vedeva il viandante fermo. Corretto: il
  passo si misura su un quarto di secondo del mondo.
- Il secondo è finito sulle bozze per 6 s: il mio cammino partiva con un salto di 6 caselle, preso per un passo verso sud, e tre luoghi di
  un'altra riga hanno preso i posti; poi i piani da 11 s. Corretto: un salto oltre 15 caselle al secondo non è un passo, la via davanti è di 10
  secondi, il luogo sotto i piedi ha un posto suo e l'ordine guarda davanti.
- Il terzo (12 s, senza salto) è andato in mare aperto, luoghi del kernel senza chiamate: nessuna bozza; poi il varco ha fermato il Cartografo
  al tetto («il Concilio non ha budget, resta abbozzato», ADR-0231).
- Le correzioni sono provate offline, non col Gemini vero (il tetto era raggiunto): nel browser, con la build finale e i modelli locali che
  rispondono ai piani dopo 4 s (un universo nuovo, `?skip&offline`), 25 s a 6 caselle al secondo verso est dal mezzo della riga 0: otto luoghi
  del Cartografo, chiesti nell'ordine della via a uno ogni 3 s, ognuno pronto circa 4 s prima che il viandante ci arrivi, solo la riga
  percorsa, **nessun campione su 567 sulla bozza** (`raggio-offline.jpg`: il luogo pianificato sotto i piedi, le bozze della riga accanto
  in alto); e nella sessione del cammino coi piani a 12 s (§ 3): 5,9 s sulla bozza in 18 minuti.
