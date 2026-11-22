# I consumi della prima run e il raggio (T488)

La prima run della beta (T457, `docs/beta/run-1.md`): il 21/11, da soli, una copia di `orichalcum` sul branch `beta/run-1`, 18 minuti di
registrazione (16 del mondo), **2,93 $** al varco di Gemini. Qui: che cosa ha pagato e che cosa il viandante ne ha visto (§ 1), che cosa
cambia il raggio di ADR-0245 sullo stesso percorso (§ 2-3), la stima della lobby (§ 4), la prova con Gemini vero (§ 5).

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

## 6. Le strutture riusate e il tetto orario (T495, ADR-0247)

La risposta a D69: il Cartografo riusa le strutture che il mondo ha, con un seme nuovo (D69.2); un tetto orario dei soli programmi nuovi,
2 l'ora a pieno dettaglio, che il master alza nella lobby (D69.3). Si rifà tutto così:

```bash
npx vite-node lab/scripts/semi-strutture.ts -- ../beta-run-1/universes/orichalcum --semi 12      # i semi oltre i quattro provati, senza chiamate
npx vite-node lab/scripts/riuso-cartografo.ts -- ../beta-run-1/universes/orichalcum --root <cartella col .env> --luoghi 24 --ora 60 --json lab/banco/run-1/riuso-gemini-invito.json   # costa
git archive 3474d1a6 src universe server site lab/handmade lab/suono | tar -x -C <cartella>      # il kernel del base, col raggio e senza il riuso
(cd <cartella> && npx vite-node <questo progetto>/lab/scripts/sessione-cammino.ts -- --minuti 18 --sorgente . --json <questo progetto>/lab/banco/run-1/sessione-t495-prima.json)
# dalla sua cartella: il seme si legge da /universe/ della radice di vite, e quello di un kernel più nuovo lo farebbe un universo da leggere soltanto
npx vite-node lab/scripts/sessione-cammino.ts -- --minuti 18 --tetto 60 --json lab/banco/run-1/sessione-t495-dopo-tetto60.json
npx vite-node lab/scripts/sessione-cammino.ts -- --minuti 18 --json lab/banco/run-1/sessione-t495-dopo.json
```

### 6.1 Che cosa chiedevano i piani della run

Nei 291 piani nuovi della run ci sono **281 strutture di 234 concetti**, ma di soli **37 generi** (la prima parola del concetto): capanno 42,
rimessa 40, officina 30, deposito 28, capannone 23, magazzino 23, serra 14, cascina 11, casa 9; i primi sei sono il 66 %. All'inizio della run la
libreria aveva 16 strutture dell'epoca del mondo (le steampunk del catalogo e quattro di Argon, i `struttura-…` col programma sul disco) di
10 generi: il **35 %** delle strutture chieste era già di uno di quei generi (capanno, officina, capannone, stazione, faro…), e lo Scultore le
ha scolpite come concetti nuovi perché il Cartografo non le vedeva (gli si offrivano solo le carte portate, nessuna in `orichalcum`). Nella run
lo Scultore ne ha fatte cinque (16 chiamate di Argon, 1,04 $), quattro di generi che la libreria aveva (capanno ×2, deposito, cascina).

### 6.2 I semi oltre i quattro provati

`lab/scripts/semi-strutture.ts` prova ogni struttura che il Cartografo può riusare coi controlli dello Scultore a un seme (`checkSeed`: finisce,
due piani raggiunti, le parti abitabili alla loro misura, la cantina raggiunta dalla porta), ai semi 1-12:

| universo | strutture | semi provati | cadono | oltre il quarto |
|---|---|---|---|---|
| `orichalcum` | 21 | 252 | 12 (la cantina non raggiunta: la cascina di Opus ai semi 1, 2, 3, 5, 6, 8, 11, 12, l'officina meccanica Enorme ai 5, 6, 10, 12) | 9 |
| `sidera` | 17 | 204 | 0 | 0 |
| `neapolis` | 17 | 204 | 1 | 1 |
| `aurora` | 12 | 144 | 0 | 0 |
| **insieme** | **67** | **804** | **13 (1,6 %)** | **10** |

Un seme oltre il quarto regge quasi come i primi quattro (1,9 % contro 1,1 %), e ciò che cade è la cantina. (Misurato prima che il kernel togliesse dall'offerta i nomi che portano
all'id di un'altra struttura: oggi `orichalcum` ne offre 20, senza `struttura-cattedrale`, «Cattedrale degli Ingranaggi», il cui id derivato è
quello di `struttura-cattedrale-degli-ingranaggi`.) Quindi il seme nuovo, dal luogo
(`reuseSeed`, da 5 a 4100), alle strutture senza cantina; quelle con la cantina, e le carte portate, tengono il seme del loro lotto.

### 6.3 Il Cartografo vero davanti alle strutture del mondo

`lab/scripts/riuso-cartografo.ts`: Flash-Lite pianifica luoghi nuovi attorno a quelli che `orichalcum` ha, su una copia in memoria
(niente si scrive), ogni altra chiamata ai modelli locali; le 21 strutture dell'epoca del mondo offerte.

| prova | luoghi | strutture nei piani | riusate | concetti nuovi | $ |
|---|---|---|---|---|---|
| il prompt che preferisce il riuso, il tetto che non morde (`--ora 60`) | 24 | 28 | 28 | 0 | 0,073 |
| il tetto a 0 (lo schema lascia passare solo le strutture del mondo) | 8 | 11 | 11 | 0 | 0,025 |
| col codice finale: l'invito ogni dieci piani (`--ora 60`) | 24 | 29 | 27 | 2 (al decimo e al ventesimo piano) | 0,077 |

Flash-Lite riusa sempre, ma sceglie quasi sempre la più adatta al genere del luogo: «il capanno di collaudo delle chiatte» in 11 dei 15 porti (12 volte su 28)
(ognuno col suo seme, un edificio diverso: 22 delle 28 strutture hanno un seme nuovo, le altre 6 la cantina), e un mondo così non avrebbe più un genere nuovo. Per questo il kernel, sotto il tetto, dopo
`FRESH_EVERY` (10) piani senza un concetto nuovo invita il Cartografo a darne uno al luogo seguente (`freshWanted`); il tetto orario resta il
limite. Con l'invito Flash-Lite ha dato due concetti nuovi in 24 luoghi, uno ogni dieci come voleva l'autore: «Capanno di vetro temperato con
telaio in ferro» in una giungla, e «il capanno di collaudo delle chiatte a vapore», cioè il nome di una struttura del mondo tagliato prima di
«su palafitte sopra l'acqua». Così il kernel riconosce anche un nome che è l'inizio dell'altro in almeno quattro parole (`reusableOf`,
`SHORT_NAME_WORDS`): quel doppione ora è un riuso, e dei due concetti nuovi ne resta uno. Le quattro prove con Gemini sono costate 0,182 $.
