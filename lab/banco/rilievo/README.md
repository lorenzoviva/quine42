# Il rilievo vero nel browser (T503, verifica di T475, ADR-0256)

Build di produzione del kernel 0.10.32 (`ca1a15da`), `vite preview`, Claude in Chrome, modelli locali (`?offline`).
Due universi nuovi con una Genesi offline dal tema: `t503-west` (Far West) e `t503-pirati` (Pirati); poi il seme (`?skip&offline`).
Il viandante si sposta fermando il tappeto: il punto del mondo è `wandererPos() + offset()`, quindi la posizione resta nel cerchio
e si sposta lo scorrimento (`carpet().ox/oy`); i passi con `keydown`/`keyup` di WASD sulla finestra (lenti nella scheda, ~1 Hz).

## Che cosa si vede

| Prova | Esito |
|---|---|
| Genesi Far West e Pirati | `nature.relief: 'true'` (Pirati anche `geography: 'archipelago'`), `relief.hasCliffs()` vero, nessun guasto |
| Massicci e terrazze | Far West, luoghi (4,0)-(8,3): terrazze a 6-7, 14-16, 22-24, 30-32, 38-40, 46-48, 54-55 livelli (`03`) |
| `k` camminabile | `k` «monte»: `layer: ground`, `solid: false`, `cross: walk`, senza masso; si cammina (luogo (4,0)) |
| Il dirupo ferma | dall'acqua (livello 0) contro la parete a 10: fermo a x 73,22 col corpo contro la casella 73; sulla rampa, a 12 contro 23: fermo a 78,72 |
| La rampa si sale | luogo (4,0), rampa 1: 7 → 8 → 10 → 12 → 14 → 16 sul crinale, a gradini di 2, tenendo D e poi S (`03`) |
| Molo sull'acqua | Pirati, luogo (-3,0) «harbour»: il molo (`p`, «tratturo») da riva a livello 0 come l'acqua, si cammina dalla spiaggia (`04`) |
| Il seme | `?skip&offline`: niente `nature.relief`, `hasCliffs()` falso, `k` «montagna» solido, 0 coppie oltre il gradino su 80 × 80 caselle, rilievo massimo 6 (`05`) |
| Console | nessun errore del gioco (solo tre messaggi dell'estensione del browser), nessun guasto in `k.faults` |

## I difetti trovati

1. **La rete calcola l'acqua «da sola», la collisione con i vicini** (il più grave). `networkOf` livella il luogo da solo
   (`worldLevels` su un luogo), `placeLevels`/`groundAt` usa il campo del mondo con i luoghi caricati attorno (`levelsOf`): con il
   rilievo vero un lago si porta al livello dell'acqua dei vicini, che può stare decine di livelli più in basso, mentre le pareti
   restano dove sono. In `t503-west` 6 luoghi pianificati su 11 avevano caselle oltre un gradino fra le due misure, quasi tutte
   d'acqua: nel luogo (4,1) il lago è a 6 per la rete e a 0 per la collisione, e la rampa che la rete ha scavato dal lago (8, 10, 12,
   13) parte 8 livelli sopra l'acqua vera: il viandante a nuoto ci sbatte contro e non sale (`01`). Nel luogo (5,1), tutto lago,
   la rete lo mette a 53 (un lago di montagna) e il mondo a 0: un pozzo d'acqua con pareti di 14 caselle (`02`). Con `Hills` le due
   misure non si allontanavano mai oltre il gradino, quindi il difetto è nato con il rilievo vero.
   Task proposto: con `keepCliffs` far calcolare alla rete e alla collisione lo stesso livello dell'acqua (o l'acqua di un luogo
   chiusa fra dirupi non si unisce a quella dei vicini più bassi, o `networkOf` riceve il campo del mondo), e un test che lo misura:
   su un universo col rilievo vero, per ogni luogo pianificato, `network.levels` e `groundAt` entro il gradino.
2. **Un edificio solido sul molo largo una casella** (minore, forse non del rilievo vero): nel porto dei Pirati il programma
   dell'ambiente posa un capanno (`building`, solido, r 0,5) a metà del molo, e la testa del molo non si raggiunge a piedi, solo a
   nuoto (`04`). Task proposto: nel porto niente cose solide sul molo (un punto di articolazione, regola 10), o il molo largo due.

## Non provato

- Le chiamate vere al Cartografo (`reliefLine`) e lo Spazio coi pianeti; il multigiocatore (`ChunkView.relief` ai client sottili).
- Un lotto su una terrazza: i modelli locali non hanno posato strutture nei luoghi del massiccio visitati.
- I Pirati: nessuna palafitta nei luoghi pianificati; il molo è uno.
- Il modo locale pianifica quasi solo laghi nei luoghi del massiccio (lo stesso mondo per ogni tema), quindi il difetto 1 è più
  frequente qui che con Gemini, ma non dipende dal Cartografo.

## Dopo T504 (ADR-0258): l'acqua di ogni luogo

Il difetto 1 è corretto nel kernel 0.10.33: col rilievo vero ogni luogo si livella da solo anche per i piedi (`worldLevels` con
`keepCliffs` non attraversa il bordo), quindi `network.levels` e `groundAt` coincidono casella per casella. Build di `task/T504`,
`vite preview` sulla porta 4847, Claude in Chrome, una Genesi offline nuova del Far West (`t504-west`, seme 1337, gli stessi luoghi di T503).

| Prova | Esito |
|---|---|
| Rete e passo | 15 luoghi pianificati attorno a (4,1) e (5,1): 0 caselle con livelli diversi (in T503 6 luoghi su 11) |
| La rampa di (4,1) | dal lago a 6 a nuoto, poi 8, 10, 12, 13 a piedi coi tasti, a gradini di 2 al più; verso ovest da 8 il dirupo a 13 ferma (`06`) |
| Il lago di (5,1) | tutto a 53, il più basso delle sue caselle, con le isolette d'erba a 55: un lago di montagna, non un pozzo (`07`) |
| Il bordo fra (5,1) e (4,1) | una **cascata** di 47 livelli fra i due laghi: si nuota giù e su (l'acqua tocca l'acqua, come per la rete); a schermo una parete d'acqua (`08`) |
| Console | nessun errore del gioco (i soliti tre messaggi dell'estensione), nessun guasto |

Offline, `rete-gradini.ts -- --griglia 6 --vero` (169 luoghi, la stessa pianificazione a ogni corsa): coppie oltre il gradino da 4 736 a
4 061 (678 tolte, 3 nuove su un bordo solo), caselle con rete e piedi diversi da 4 220 a 0, 202 cascate fra luoghi fino a 47 livelli;
arcipelago da 172 a 139 (nessuna nuova). Resta da decidere la cascata: oggi si risale a nuoto anche quando è alta dodici caselle.
