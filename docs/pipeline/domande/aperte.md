# Le domande aperte per l'autore

L'elenco unico (richiesta dell'autore, 04/11): l'orchestratore lo tiene aggiornato e lo riporta in chat. I numeri non cambiano; una risposta toglie la riga.

## I modelli
- **D29** Approvi T259, il progetto dello Scenografo con la misura del costo? Raccomandato: sì.
- **D30** Vuoi Fable a orchestrare? Raccomandato: non prima del reset del 05/11, poi solo per i giri di pianificazione difficili. La casella è tua.
- **D28** Un task per la causa di `tests/subscription.test.ts`, rosso sotto carico e verde da solo? Raccomandato: sì, piccolo.

## Il kernel e le fasi
- **D8** T245: raccomandati a-e per la 0.9.0, g-i per la 1.0.0, f da decidere.
- **D9** Regola 6: un guasto a runtime invalida il codice, non i dati della partita. Raccomandato: sì.
- **D10** T183: le regole per cambiare il kernel senza wipe e le primitive da avere prima della versione pubblica (`docs/design/espressivita.md`, «Divisione delle primitive»). Raccomandato: approvarle.
- **D11** Criterio di fine Fase I (`docs/fasi.md`). Il punto 2 chiede T45f, che aspetta la fine della Fase I: circolare. Raccomandato: approvarlo, con T45f come ultimo passo.
- **D12** Step 37 (spazio, pirati, cowboy) in Fase III? Raccomandato: sì.

## Il gioco
- **D13** Chi chiude nella corona riparte dov'era? Raccomandato: sì, ma `?dev&teleport` deve ignorare lo scostamento salvato.
- **D14** Altra tornata di rinomine per i nomi rimasti? Raccomandato: non ora.
- **D15** Commit: fila solo in memoria, `putMap`, `branch`, `merge` non ritentano, un 401 perde il commit. Un task prima della beta? Raccomandato: sì.
- **D16** `suono-effetto-morte` non passa il validatore ma è tra i tuoi preferiti: resta com'è? Raccomandato: sì.

## Scelte già applicate: confermi?
- **D17** V-023: con gli account, senza un collegato con crediti, spese comuni ai modelli locali.
- **D18** V-002 chiusa col residuo: un processo di questa macchina può spendere fino al tetto del giorno.
- **D19** La rete di 2 s con l'orologio nella sandbox Lua, unico orologio della simulazione.
- **D20** Un anonimo può avviare un mondo fermo.
- **D21** Il master del clone nel corpo della richiesta: solo il master provato può clonare.
- **D22** Il Referente non dà crediti, nemmeno al master.
- **D23** Niente immagine per le carte dei luoghi: chiederebbe `maps/` in `publicFiles`.
- **D24** `tests/abbonamenti.test.ts` dietro una variabile.
- **D25** T155 e T173 chiusi allentando la soglia (entro due richieste).
- **D26** Il salto sulle casse: non ritrovo il testo della domanda. Se non hai nulla da segnalare la chiudo.

## Rimandate per tua scelta
T45f a fine Fase I (progetto GCP, hosting, regione); T93 in Fase IV (Managed Payments).
