# La campagna: guida per chi fa il master nella beta

Per l'autore e per chi ospita una partita (ADR-0188, ADR-0202). Non è una parte della pagina delle istruzioni del sito: quella è `guida.md`
(vedi `LEGGIMI.md`).

Una **campagna** è un universo di molti che il master prepara e conduce: chi entra, quanto in fretta cresce il mondo, dove sta che cosa, come
lavora il Concilio. Tutto si fa **dal gioco** (la console del master e lo studio, nella corona) o **dal sito**, nella pagina della campagna, anche
senza entrare.

## Dal sito

1. Apri `Sessioni` (`/site/sessioni.html`). Con gli account, se in alto c'è «ACCEDI», accedi: il sito non chiede l'accesso per leggere, solo
   per vedere i tuoi mondi. Sulle carte dei tuoi universi di molti c'è **CAMPAGNA**; gli universi privati che vedi hanno «SU INVITO».
2. **CAMPAGNA** apre il pannello sotto l'intestazione (il link `sessioni.html?campagna=<nome>` lo riapre). In alto: se il mondo è acceso (ciò che
   cambi arriva subito a chi gioca) o spento (lo trova quando riparte).
3. **Ospiti e inviti**: «Rendi privato» (chi è già nel mondo resta, fra gli ospiti), «Aggiungi ospite» con l'id del viandante, «Crea invito»
   (7 giorni e un uso, se non dici altro). Il link dell'invito si vede **una volta sola**: copialo e mandalo; il server ne tiene solo
   l'impronta. «Togli» fa uscire un ospite anche dal mondo; «Revoca» chiude un invito.
4. **Ritmo del mondo**: normale (ciò che hai regolato nella lobby), lento (meno luoghi nuovi al minuto), in pausa (i luoghi nuovi restano
   abbozzati e il mondo non fa niente da sé; le risposte ai viandanti continuano, e i giocatori vedono scritto che il mondo è in pausa). Solo
   verso il basso: mai più di quanto deciso nella lobby.
5. **Atlante e regioni**: i quadretti pieni sono i luoghi già pianificati, i riquadri le regioni (tratteggiate quelle del Cartografo). Tocca
   un luogo per metterci il centro, poi «Dichiara»: con l'ambiente il Cartografo pianifica i luoghi nuovi dentro con quell'ambiente; il
   **riempitivo** ripete un ambiente che il mondo ha già, senza chiamate (per indirizzare i viandanti senza spendere); la **trattenuta** lascia
   i luoghi nuovi abbozzati finché non la liberi. «Cambia» e «Libera» sulle tue regioni. I luoghi già pianificati restano come sono.
6. **Direttive**: `campaign.md`, a sezioni per squadra («Per tutti», «Narratore», «Cartografo»…). Ogni richiesta del Concilio porta «Per tutti»
   e la sezione della sua squadra. «Salva» dice ciò che non va (una sezione che non esiste, troppo testo) e le righe che restano fuori perché
   nel mondo non si direbbero. Nessun giocatore le legge.

Ogni rifiuto arriva col motivo, lo stesso che daresti dal gioco. Un universo di un kernel di prima non si scrive dal sito: entra una volta nel
mondo, che lo porta a questo kernel.

## Dal gioco

- Console del master (F2, scheda «Universo»): «Ospiti e inviti»; scheda «Concilio»: il ritmo.
- Studio, Ufficio dei luoghi (l'atlante sul muro) e Direzione: «Dichiara regione», «Cambia», «Libera»; nella Direzione anche il ritmo.
- Editor (`world/campaign.md`) o il Referente («scrivi una direttiva per il Cartografo: …»).
- In lobby: «Spese: paga il master», se vuoi pagare tu per tutti.

## Un server senza Firebase

Con `QUINE_ACCOUNT=inviti` e `QUINE_SEGRETO_INVITI` (almeno 32 caratteri) nel `.env`, chi entra lo fa solo con un invito:

```bash
npm run inviti -- padrone            # il link d'accesso del padrone (30 giorni; aprilo nel tuo browser)
npm run inviti -- elenco             # le identità date
npm run inviti -- revoca <id>        # toglie un'identità
```

Il padrone crea l'universo dal sito, lo rende privato e manda gli inviti: chi apre il link riceve un'identità sua per quel server.
