# Verifica di Sidera

Generato da `verifica.ts` (`npx vite-node lab/banco/universi-cloud/sidera/verifica.ts`).

## 1. Quarta parete

101 file, 4507 frasi controllate con `metaBreak` (e `bibleBreaks` sulla bibbia): **0 violazioni**.

## 2. Moduli

25 moduli: 0 errori, 0 avvisi.

| modulo | tipo | righe Lua | azioni | errori | avvisi |
|---|---|---|---|---|---|
| world.terreno-sidera | generator | 93 | 0 | 0 | 0 |
| world.ambienti-sidera | data | 0 | 0 | 0 | 0 |
| items.sidera | data | 0 | 0 | 0 | 0 |
| magic.runes | data | 0 | 0 | 0 | 0 |
| item.scanner | item | 67 | 0 | 0 | 0 |
| obj.sintetizzatore | entity | 60 | 4 | 0 | 0 |
| obj.reattore | entity | 46 | 4 | 0 | 0 |
| obj.serra-idroponica | entity | 44 | 4 | 0 | 0 |
| obj.capsula-criogenica | entity | 51 | 4 | 0 | 0 |
| obj.faro-telemetria | entity | 52 | 3 | 0 | 0 |
| obj.estrattore-plasma | entity | 38 | 3 | 0 | 0 |
| obj.camera-equilibrio | entity | 34 | 3 | 0 | 0 |
| obj.relitto | entity | 41 | 3 | 0 | 0 |
| obj.armadietto | entity | 0 | 0 | 0 | 0 |
| obj.drone-ricognizione | entity | 52 | 4 | 0 | 0 |
| npc.colono | entity | 44 | 3 | 0 | 0 |
| npc.xenobotanica | entity | 34 | 3 | 0 | 0 |
| npc.ingegnere-fusione | entity | 36 | 3 | 0 | 0 |
| npc.navigatore | entity | 40 | 3 | 0 | 0 |
| npc.medico-criogenico | entity | 41 | 3 | 0 | 0 |
| npc.astroarcheologo | entity | 38 | 3 | 0 | 0 |
| npc.sintetista | entity | 37 | 3 | 0 | 0 |
| npc.corvo-tetto | entity | 35 | 3 | 0 | 0 |
| sys.anomalie | system | 68 | 0 | 0 | 0 |
| sys.cordone | system | 47 | 0 | 0 | 0 |

## 3. Luoghi

19 piani con `validatePlan` e `layout`: 0 errori.

| luogo | nome | ambiente | regione | oggetti | rune | lotti | calpestabili |
|---|---|---|---|---|---|---|---|
| 0,0 | Piazza dei Viadotti | piazza_neon | (libero) | 6 | lieve, onda, x | 3 | 248 |
| 1,0 | Vicolo delle Cuoche | vicoli_pioggia | (libero) | 5 | grava, speed | 6 | 219 |
| -1,0 | Scalinata dei Corrieri | vicoli_pioggia | (libero) | 3 | tunnel, y | 4 | 251 |
| 0,1 | Viale delle Bancarelle | mercato_viadotti | (libero) | 2 | quanto, y = y | 4 | 230 |
| 0,-1 | Ponte dei Canali | vicoli_pioggia | (libero) | 2 | spin, x = x | 5 | 222 |
| 1,-1 | Mercato sotto i Piloni | mercato_viadotti | (libero) | 5 | massa | 4 | 238 |
| -1,-1 | Rampa dei Turni | vicoli_pioggia | (libero) | 3 | marea | 6 | 214 |
| 1,1 | Orti Pensili | mercato_viadotti | (libero) | 2 | intreccio | 4 | 263 |
| -1,1 | Fermata del Treno Sospeso | piazza_neon | (libero) | 2 | vuoto, fuoco | 3 | 246 |
| 2,0 | Cupole di Serralta | cupola | Cupole di Serralta | 5 | orbita | 1 | 294 |
| -2,0 | Spazioporto di Ponente | spazioporto | Spazioporto di Ponente | 5 | stasi | 1 | 257 |
| 0,-2 | Imbocco della Gola | canyon_cristalli | Gola dei Cristalli | 3 | grava, lieve | 0 | 252 |
| 1,-2 | Speroni Cantori | canyon_cristalli | Gola dei Cristalli | 2 | onda, stasi | 0 | 249 |
| 0,2 | Quartiere delle Torri | quartiere_torri | Quartiere delle Torri | 3 | spin | 3 | 252 |
| -1,2 | Torre dei Filtri | quartiere_torri | Quartiere delle Torri | 2 | acqua | 2 | 268 |
| 2,-2 | Campo dei Relitti | relitti | Campo dei Relitti | 5 | tunnel, massa | 2 | 226 |
| -2,-2 | Cantiere della Fusione | cantiere_fusione | Cantiere della Fusione | 5 | quanto, fuoco | 1 | 235 |
| 2,2 | Costa Allagata | costa_allagata | Costa Allagata | 3 | marea, acqua | 0 | 207 |
| -2,2 | Laboratori di Ombralta | laboratorio | Laboratori di Ombralta | 6 | vuoto, orbita | 4 | 251 |

## 4. Rune, società, trame, atlante

- 12 rune nuove rivalidate in fila con `validateNewRune` contro le 4 di sempre: tutte valide, segno e colore invariati, tutte nel canone.
- 24 persone: `repairSociety` non corregge niente (legami reciproci, generi, specie, nomi).
- 8 trame, 8 con una missione; 10 regioni nell'atlante.

## 5. Il kernel con Sidera

- **900 tick** (minimo 600), tempo del mondo 361 s, con `MockAiModels` e i 19 piani di `maps/` come archivio dei luoghi.
- Luoghi attraversati: 19/19 con il nome del piano (0 fuori piano).
- Persone del registro incontrate e riconosciute dall'origine: 12 (Ilde Ferraris, Pino Lupi, Pennanera, Teo Sardi, Ruben Kessler, Ugo Ranieri, Tobia Calandra, Iris Calandra, Selene Moro, Lia Corvi, Elio Marchetti, Lena Ortiz).
- Azioni dei moduli eseguite: 142 (53 diverse); battute di dialogo: 142.
- Raccolti: 48 oggetti a terra, 31 rune.
- Ricette fabbricate: 10/10; oggetti usati: 17; scanner impugnato e usato.
- Incantesimi pronunciati: 17 (12 rune nuove e 5 formule): grava, lieve, tunnel, intreccio, onda, vuoto, marea, massa, spin, quanto, orbita, stasi, grava grava, lieve onda, orbita grava, quanto stasi, tunnel massa tunnel.
- Chiamate di testo ai modelli finti durante il giro: 63 (individui, sguardi, luoghi oltre i 19).
- **Fault: 0 sollevati, 0 aperti alla fine.**

Alcune battute raccolte:

> **Faro di telemetria**: Sul piccolo schermo scorrono le posizioni: tre navette in rotta, nessun drone nei paraggi.
>
> **Pennanera**: (becca le briciole in fretta, poi saltella dietro di te gracchiando piano)
>
> **Teo Sardi**: «Rune? Al banchetto di Ilde in piazza ne trovi quante vuoi. Senza luce, però. Quelle vere stanno per terra, sotto la pioggia: basta saper guardare.»
>
> **Ruben Kessler**: «Pozzo Ardente: una miniera dentro un vulcano spento. Si lavora di notte, di giorno la roccia brucia le suole.»
>
> **Drone da ricognizione**: Stacchi il pacco: dentro c'è una cella energetica, il compenso per la consegna.
>
> **Estrattore di plasma**: I pistoni salgono e scendono: il plasma risale azzurro nel serbatoio. Pressione 25.
>
> **Serra idroponica**: Germogli piccoli, pallidi, sotto le lampade rosa. Ci vuole tempo, o soluzione nutritiva.
>
> **Serra idroponica**: Non c'è ancora niente di maturo. Qualche foglia, al più.
>
> **Selene Moro**: «Tre rotte, tre avamposti. La quarta, quella che nessuno ha percorso, la tengono nelle carte della Gilda, sotto chiave.»
>
> **Drone da ricognizione**: La spia è azzurra: batteria 90, 0 consegne fatte.
>
> **Drone da ricognizione**: Agganci un pacco sotto la pancia del drone. Lo porterà dove lo porta il vento e i fari.
>
> **Drone da ricognizione**: Sfili la cella scarica e infili quella nuova: le eliche ronzano più forte, il drone fa un giro di festa.
>
> **Relitto antico**: Tra due lamiere trovi un frammento con incisioni geometriche, liscio come un sasso di fiume.
>
> **Reattore a fusione**: Il nucleo pulsa azzurro, regolare: carico 67. Lavora bene.
>

## Esito

**Tutto verde**: zero violazioni della quarta parete, zero errori e avvisi nei moduli, 19 luoghi validi, 12 rune valide, 0 fault.
