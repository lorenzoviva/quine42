# Cantiere 3: colonna sonora ed effetti per le quattro ambientazioni

Quarantaquattro programmi sonori MarkovJunior scritti senza modelli e senza orecchie, misurati con l'analisi del gioco
(`src/mj/soundanalysis.ts`) e con il validatore (`modelErrors` in `src/kernel/validator.ts`). Stanno nel laboratorio:
nessuno è ancora in `universe/models/` né in `models/index.json`, quindi il gioco non li suona.

| Cartella | Cosa |
|---|---|
| `suono-effetto-morte-v2.xml` | la Morte rifatta: stesso colpo sordo e stessa discesa frigia, ma il seme sceglie la strada, il basso, il secondo colpo e l'eco |
| `fantasy/`, `steampunk/`, `moderno/`, `futuristico/` | sei brani per ambientazione: `esplorazione-giorno`, `esplorazione-notte`, `tensione-pericolo`, `luogo-sacro`, `citta-locanda`, `sotterraneo-abisso` |
| `effetti/` | diciannove effetti: porta pesante, passo nell'acqua, passo sul metallo, leva, forgia, esplosione, cura, veleno, segreto, saluto, vento, fuoco, vapore, scarica, teletrasporto, cristallo, moneta, salita di livello, allarme |
| `rapporti/<nome>.md` | per ogni programma: l'esito, le dieci terne, il rapporto completo dei semi 1, 2, 3 (partitura, tracce, segnale, spettro) e la traccia del seme 1 |
| `brani.mjs`, `effetti.mjs`, `componi.mjs` | le partiture e il compositore che le scrive in XML |
| `valida.ts` | il banco: dieci terne, il validatore, il rapporto |

```bash
node lab/banco/suoni-cloud/componi.mjs [filtro]                                   # riscrive gli XML (tutti, o quelli col filtro nel nome)
npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/fantasy/*.xml  # valida e riscrive i rapporti; esce con 1 se uno non passa
npx vite-node lab/scripts/mjx-sound.ts -- lab/banco/suoni-cloud/moderno/suono-moderno-citta-locanda.xml  # i WAV per ascoltare
```

## Il criterio

Un programma è pulito quando:

1. su **ognuna delle dieci terne** `[1,2,3]`, `[4,5,6]`, …, `[28,29,30]` `analyzeSound` (con il rendering di tutti e tre i semi, non quello frugale del validatore) non trova difetti: né `vuoto` (silenzio, tracce mute, partitura vuota), né `piatto` (poche note, dinamica sotto i 3 dB, una banda sola), né `ripetitivo`, né `stonato`, né `fuori volume` (RMS, picco, picco grezzo, campioni al limite: il clipping), né `giuntura`;
2. la distanza fra i semi di **ogni terna** è almeno 0,15, tre volte la soglia del gioco (0,05); questo vale anche per gli effetti, che l'analisi sotto le 16 battute non misura;
3. `modelErrors`, cioè il validatore del gioco con i semi 1, 2, 3, non rimanda niente.

I difetti che la richiesta chiamava «silenzio», «clipping», «monotono» e «statico» sono, nei nomi dell'analisi, `vuoto`, `fuori volume`, `piatto` e `ripetitivo` (distanza fra i semi).

## Come sono fatti

**I brani** (128 passi, 96 la tensione futuristica) hanno da tre a sei tracce: melodia (lead), armonia (pad), arpeggio, basso, batteria, controcanto. L'armonia è una testa che cammina sulla traccia del basso di battuta in battuta, sotto un soffitto di segni che la tiene nel registro grave; ogni radice diventa un segno per il pad, l'arpeggio e il basso, e ogni segno si apre in un disegno della battuta scelto dal seme fra due-quattro, pesati. La batteria ha un segno a ogni battuta e un disegno per battuta. La melodia e il controcanto sono teste che vanno avanti nel tempo con regole pesate (nota lunga *n*, sale o scende di *k* gradi, pausa, ghost). Il carattere sta nei numeri: scala, bpm, swing, cutoff, spazio, nei pesi delle regole e nei disegni.

- **Fantasy**: dorica, pentatonica e frigia; arpa e lira (l'arpeggio), quinte vuote nel luogo sacro, giga con lo swing nella locanda, tamburi di guerra nel pericolo, gocce nel sotterraneo.
- **Steampunk**: minore armonica; ingranaggi in ottavi, un carillon che gira sulle radici, ottoni in contrappunto (il controcanto sul pad), l'organo a vapore con le settime, pistoni e sfiati nelle caldaie.
- **Moderno**: dorica e pentatonica; cassa dritta, hi-hat in levare, bassi sincopati e a ottave, un mezzo tempo frigio con le raffiche di hi-hat, un battito industriale sulla hirajoshi nelle gallerie.
- **Futuristico**: hirajoshi e pentatonica; arpeggi di cristallo in tre contro quattro, pad enormi con molto spazio, una batteria in dodici sopra un'armonia in sedici nel pericolo (poliritmia), un tempio con un coro e un secondo canto.

**Gli effetti** (da 6 a 32 passi) sono scritti a mano: punti fissi (`line`) e, per ciò che cambia, segni nascosti su più altezze o più passi; `<one in="T" out="N" steps="n"/>` ne accende alcuni e `<all in="T" out="B"/>` spegne gli altri. Il vento (32 passi), il fuoco e la salita di livello (16) sono lunghi una battuta o più e l'analisi li misura come brani.

## Cosa queste misure non dicono

Ciò che dice `lab/banco/suono.md`: se è bello, se è adatto, la sensazione del ritmo. Nessuno li ha ascoltati. Il sintetizzatore ha tre strumenti (lead, pad, basso) e quattro tamburi: «arpa», «organo» e «ottone» sono ruoli e registri, non timbri.

## Cosa manca per suonarli nel gioco

Copiarli in `universe/models/` con una voce in `models/index.json` (`classe: "suono"`, `suono: { uso, ambienti, momenti, effetti }`, ADR-0126). Il direttore oggi sceglie per ambiente e momento, non per ambientazione: perché la colonna sonora segua l'ambientazione scelta alla Genesi (ADR-0134) serve un task.
