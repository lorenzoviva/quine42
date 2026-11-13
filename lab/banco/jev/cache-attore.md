# La cache esplicita dell'Attore: quanto fa risparmiare (T351)

ADR-0186. Le istruzioni di sistema dell'Attore (ruolo, principi, «Lingua», contesto del mondo) in una cache esplicita di Gemini 3.8 Flash,
che la cache implicita non serve (T325, [`casi-d-uso.md`](casi-d-uso.md) §4). Misura **offline**, senza chiamate:

```bash
npx vite-node lab/scripts/prompt-tokens.ts -- --cache [--luoghi 24] [--persone 6] [--ore 1] [--json f]
```

Come: una Genesi offline del seme, 24 luoghi a spirale con il registratore di T325 (i modelli locali sotto un nome che non è `offline`,
così il kernel incontra le persone), poi le richieste dell'Attore (`npc.reply` con quattro frasi per persona e `npc.dialogue` fra due
vicini, con la scheda) registrate così come vanno ai modelli. La politica è quella vera (`ExplicitCaches`), su un orologio al ritmo
dell'ora della lobby (`hourlyEstimate`: risposte e dialoghi con le manopole a 1 e l'Attore acceso). Token a 3,26 caratteri (la media di
T325 con `countTokens`); uscita 500 token a chiamata (come la stima del gioco); prezzi del 13/11/2026.

## Risultato (13/11/2026, kernel 0.6.11)

| misura | valore |
|---|---:|
| richieste dell'Attore registrate (risposte e dialoghi, 2 persone) | 9 |
| prefissi diversi (system) | 1 |
| token per richiesta, di cui il prefisso | 4696, 4097 (87 %) |
| chiamate dell'Attore in un'ora (HOUR, manopole a 1) | 65 |
| scritture della cache in 1 h (ttl 1800 s) | 3 |
| token in ingresso serviti dalla cache | 262204 su 305264 (86 %) |
| dollari senza cache (uscita 500 token a chiamata) | 0.3508 |
| dollari con la cache (di cui scritture e conservazione 0.0123) | 0.1861 |
| **risparmio** | **0.1647 $ (47 %)** |

- **Un prefisso solo** per ogni persona e ogni dialogo: la scheda e il focus stanno nel prompt (ADR-0186 §1). Nei mondi veri il prefisso
  cambia quando cambiano le regole, il canone o il lessico: una scrittura in più ogni volta.
- **Il risparmio è sull'ingresso**: 0,16 $ l'ora sulle righe dell'Attore, vicino alla stima di T325 (~0,22 $ con prefissi più lunghi:
  4.100 token qui su una Genesi offline, 5.400 negli universi di Claude Cloud). L'uscita e il ragionamento non cambiano.
- **La cache costa poco**: tre scritture l'ora (la prima alla seconda richiesta, poi a ogni scadenza meno il margine) con la conservazione
  di mezz'ora ciascuna, 1,2 centesimi l'ora al prezzo d'ingresso per la scrittura (il più alto possibile). Con una sola battuta ogni
  mezz'ora non si scrive niente.

## Limiti

- Le persone e le schede sono quelle dei modelli locali (2 persone su 24 luoghi offline; le schede sono quelle di prova quando il Narratore
  non le ha scritte): il prompt varia meno che in un mondo vero, il prefisso è quello vero.
- Non provato contro Gemini: che 3.8 Flash accetti la cache esplicita, con quale soglia minima, se la scrittura si paga e quanto costa la
  conservazione vanno visti al primo uso e sulla fattura; se Gemini rifiuta, l'Attore va come prima (la cache non si riprova per un `ttl`).
