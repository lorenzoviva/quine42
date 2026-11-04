# Il diario del prompt (T155)

Un giro: prompt cambiato → prove → foto e misure. Si corregge il prompt, mai un XML. Token di input: `inputTotale` del banco (prompt + bersaglio).

| giro | cosa è cambiato | input | prove | misure passate | cosa si vede |
|---|---|---|---|---|---|
| T154 | prima versione | 2750 | 2 | 1 | tetto a strisce, massa unica, lati uguali |
| g01 | nuova sezione «L'aspetto»: masse, tetto a una tinta, lati diversi, tema da fuori | ~3270 | 4 | 0 | salto netto: masse sfalsate, tetti pensati; stanze contate 0-1 (arredi al centro), porta della rocca ostruita |
| g02 | stanze con un rettangolo sgombro; linea dritta dalla porta; grate che non spezzano le finestre | ~3400 | 7 | 4 | quattro passano; tempio basso di soffitto, rocca col portone ostruito, locanda con la cantina persa |
| g03 | soffitto +2 voxel; androne per il portone; aria sulle scale; riscavo finale di porta, varchi, scale | ~3480 | 3 | 1 | la rocca passa ed è il modello più bello fin qui; ponte sopra la porta del tempio |
| g04 | niente ponti sopra la porta; regola delle botti in cantina. **Tolti** i numeri di «Varietà» | ~3470 | 8 (limite delle 5 ore) | 6 | togliere il tetto al materiale dominante costa: rocca al 71 %, torna (in forma breve) |
| g05 | gradino di cantina profondo mezzo passaggio + 1. **Tolta** la riga delle regole `prl`/`all` (nessuno dei 14 modelli le usava) | ~3380 | 14 | 10 | scale che non sboccano e fessure nei solai. **Errore del banco**: `murato` contava l'aria sotto il piano terra, che nel gioco è terra piena; corretto. Nuova misura `cantina` |
| g06 | una regola per i solai (scatola continua, scavi fra pavimento e soffitto); sbocco in linea delle scale | ~3480 | 14 | 12 | restano due locande: un `at` con due numeri e una cantina troppo piccola |
| g07 | cantina sgombra 2 × 2; `at` ha tre numeri. **Tolte** tre frasi che non cambiavano nulla | ~3430 | 14 | 12 | steampunk: macchina in mezzo alla sala (stanze) e un salto solo |
| g08 | margine sopra la soglia: 4 stanze e 3 salti; macchine contro i muri | ~3470 | 13 (CLI senza risultato) | 11 | stanze e salti tengono; scala con il foro del solaio dalla parte sbagliata, stanza murata |
| g09 | controllo finale «ripercorri il cammino a numeri» | ~3590 | 7 (limite delle 5 ore) | 5 | **non serve**: sbagli uguali e output fino a 102 mila token; esce |
| g10 | **al posto del controllo**, un esempio numerico di scala col suo foro (+200 token), solo sui due bersagli deboli | ~3800 | 4 | 3 | steampunk 2 su 2, cantina raggiunta 2 su 2; una locanda con un muro davanti al primo gradino |
| g11 | nessun muro o arredo davanti al primo gradino | ~3790 | 14 | 11 | un `at` con due numeri (di nuovo, nonostante la frase), un pavimento non raggiunto, un piano non raggiunto. Foto: 7 degli 11 passano (`finale/giudizio.md`) |

I prompt di g05-g11 non sono uguali: la misura `cantina` e la correzione di `murato` valgono da g06, g05 è stato rimisurato solo per la locanda. I conteggi sono quelli scritti da ogni giro al momento.

## Dove si è fermato

Soglia non raggiunta. Il giro 12 non è stato fatto: vedi `docs/pipeline/domande/T155.md`.

- **Cosa si è guadagnato i token**: «L'aspetto» (il salto di qualità delle foto, ~500 token); i margini sopra la soglia (4 stanze, 3 salti): nel giro 11 nessun tentativo cade più su stanze o salti da soli; le regole di solai, sbocchi e cantina. L'esempio di scala è probabile ma non dimostrato: due giri, pochi tentativi, e nel giro 11 una scala è fallita lo stesso.
- **Cosa è uscito senza danno visibile**: la riga delle regole `prl`/`all`, i numeri di `dettagli`, `rilievo`, `sagoma`, `ingombro`, tre frasi. **Non ha portato nulla**: il controllo a numeri del cammino.
- **Cosa non è potuto uscire**: il tetto al materiale dominante (senza, una rocca è arrivata al 71 %).
- **Ciò che resta**: sbagli del singolo tentativo su bersagli che altre volte passano. Giri 5-11: 64 tentativi su 80 passano le misure. A questo ritmo 14 su 14 nello stesso giro è raro: il prompt da solo difficilmente ci arriva.
- **Il seguito**: il giro di conferma con una seconda richiesta, T173, in fondo.
- **Il costo**: 102 chiamate; input 3770-3832 token per modello al giro 11 (2750 il prompt di T154), output in media 57 mila, ragionamento compreso; ~114 dollari a listino secondo la CLI, pagati con l'abbonamento. Molto oltre la stima dell'8 % del limite settimanale; il limite delle 5 ore è scattato due volte.

## Il giro di conferma (T173)

Prompt invariato, una seconda richiesta a chi non passa, un solo giro: 14 tentativi, 13 passano le misure alla prima, 9 anche le foto; alla seconda ne passano altri 3. **12 su 14**, soglia non raggiunta: `futuristica/2` (un `at` con due numeri nella seconda richiesta) e `pagoda/2` (la scala corretta, l'aspetto no). Seconda richiesta: input 14 251 e output 43 828 in media, 0,90 dollari contro 1,22 della prima. `conferma/giudizio.md`, `docs/pipeline/domande/T173.md`.

## Il prompt procedurale (T182)

Un altro prompt: invece di scrivere `<box>`, si parte da uno scheletro di regole corte (`riferimento/cantiere.xml`, `pattern.md` numero 13) che regge a ogni seme e taglia. La soglia è quella di T180 (`prova`: tutte le misure a 5 semi e 2 taglie, e varia) più le foto; ogni seconda richiesta porta la traccia di T179 della prima coppia taglia-seme che cade. Modello: `claude-opus-5-5`.

| giro | cosa è cambiato | input | prove | misure e varianza alla prima | cosa si vede |
|---|---|---|---|---|---|
| g1 | primo prompt, con lo scheletro di 6 campate | ~9 800 | 4 (rocca: CLI senza risultato) | 0 | subito procedurali e riconoscibili; perimetro 0,12 (lo scheletro ha poco margine), stanze sparite con gli arredi, una cifra usata come lettera |
| g2 | scheletro di 5 campate; solo lettere; campate sgombre | ~10 000 | 7 | 4 | due cadono per un soffio (perimetro 0,15, murato 0,25); la locanda è lontana: la cantina |
| g3 | ricetta della cantina riscritta; 5 campate su 9 | ~10 100 | 12 (2 per bersaglio, senza locanda) | 7 | alla seconda altri 3: **10 su 12 entro due richieste** (`pagoda/1`: 8 s superati a un seme; `tempio/2`: il contorno varia poco) |

Il giro 4 non è stato fatto: senza una decisione dell'autore non può raggiungere la soglia. `docs/pipeline/domande/T182.md`.

- **Gli esempi**: lo scheletro si guadagna i suoi ~7 000 token: da 31 su 31 statici a 10 su 10 che variano, e 10 su 12 reggono a tutti i semi e le taglie, contro 1 su 27 a Enorme. I tre programmi di T181 non entrano (16 mila token l'uno; le loro stringhe da contare sono ciò che lo scheletro toglie).
- **La traccia**: seconda richiesta su 5: 3 corrette. Costa 0,43-1,28 dollari, meno della prima, come in T173; non c'è un confronto senza traccia, quindi non dimostra che sia lei a correggere.
- **Il costo**: alla prima, in media, input 10 968 e output 55 423, 1,15 dollari (T173: 3 791, 60 553, 1,22). **L'output scende appena: quasi tutto è ragionamento**, l'XML sono 11-15 mila caratteri. Il prompt non abbassa il costo; dà molto di più per lo stesso costo. Tutto T182: 27 chiamate misurate, 30,59 dollari a listino, più 2 senza conto (una CLI senza risultato, una al limite); il limite delle 5 ore è scattato una volta.
- **Il tempo**: i programmi girano in 6-7 s a Enorme (limite 8 s) con altri processi sulla macchina: `pagoda/1` è caduta lì. Il margine è poco.

## La locanda con la lettera del suolo (T258)

Il kernel scrive `suolo="E"` sullo strato `base` (ADR-0135); la ricetta del pozzo sta nel prompt, presa da `riferimento/cantina.xml`, che a mano regge 12 semi su 12 alle due taglie. Prova: la locanda, 5 semi, Grande ed Enorme, al più 4 richieste. Modello: `claude-opus-5-5`.

| richiesta | input | output | dollari | Grande | Enorme | cosa cade |
|---|---|---|---|---|---|---|
| `1` | 11 660 | 73 298 | 1,56 | 0/5 | 0/5 | botti basse nel pozzo (cantina scartata), tempo |
| `2` | 11 661 | 68 101 | 1,46 | 0/5 | 0/5 | botti basse, tempo |
| `1/seconda` | 25 958 | 48 041 | 1,17 | 4/5 | 0/5 | tempo; perimetro 0,04 |
| `2/seconda` | 25 583 | 53 531 | 1,28 | 4/5 | 0/5 | tempo; una cantina a Grande; perimetro 0,05 |

Le colonne delle taglie sono di `suolo/da-sola/`, un'esecuzione alla volta. Tra le prime e le seconde richieste il prompt è cambiato: cosa fa cadere la cantina e quanto tempo resta (`suolo/prompt-seconda.md`).

- **Il prompt è seguito**: tutti e 4 i programmi usano la lettera e la ricetta alla lettera. Input 11 660 contro i ~10 100 di T182: la ricetta si paga ~1 500 token.
- **Non regge, ma per il tempo**: senza il limite, `1/seconda` passa tutte le misure a tutti e 5 i semi di Enorme, in 7,3-7,8 s, e subito dopo con il limite supera gli 8 s. Lo scheletro con la cantina usa già 6,8 s. Un programma troncato perde tutto, quindi la misura salta da «passa» a 0/5 per pochi decimi.
- **Una lezione del banco**: `--insieme 2` falsa i tempi quando il margine è così poco. Con questi programmi si prova uno alla volta.
- **Il seguito**: `docs/pipeline/domande/T258.md`. Niente quinto tentativo.
