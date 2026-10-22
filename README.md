# RUNE

*Il mondo è scritto. Tu sei al centro.*

Un gioco 3D visto dall'alto in 3/4, fatto di voxel semplici e di contenuti ricchissimi, generato da IA in ogni
suo aspetto tranne il kernel. Un **Concilio di agenti** su Google Gemini (Narratore, Cartografo, Artista,
Scultore, Fisico, Ingegnere, Arbitro) scrive la storia, inventa gli ambienti come programmi di regole in stile
[MarkovJunior](https://github.com/mxgmn/MarkovJunior), riempie il mondo di oggetti, ricette e persone (ognuna con
un nome, una famiglia, un mestiere e le sue tasche), ne scrive il codice e **scolpisce** l'aspetto di ogni cosa:
ogni tipo di cosa è un programma MarkovJunior che costruisce un modello a voxel, e ogni individuo è un seme di quel
programma. Nessuna immagine generata: solo testo.
Cammini in un regno che sembra infinito, ma un **tappeto** ti riporta sempre al centro. Nel terreno
brillano **rune**: token Lua veri. Ciò che è scritto sul tappeto si esegue. Componi la frase giusta e il
tappeto si ferma: puoi camminare fino al bordo ed entrare nella **corona**, il codice sorgente
dell'universo, e riscriverlo.

> Le immagini del gioco 2D (fino allo step 8) sono in `docs/img/`; quelle del 3D sono da rifare.

## Avvio

```bash
npm install
echo GEMINI_API_KEY=la-tua-chiave > .env   # facoltativo: senza, il gioco gira offline
npm run dev                                # http://localhost:5173
npm test
```

Al primo avvio con Gemini parte la **Genesi**: descrivi il mondo che vuoi e il Concilio lo crea in circa
un minuto (~60 chiamate a `gemini-3.1-flash-lite`); poi lo Scultore scrive i programmi dei modelli che
mancano, uno per tipo (da $0,01 a $0,16 l'uno, secondo la classe), e l'Artista li giudica dalle foto. Le varianti
sono semi diversi, gratis; le icone sono foto dei modelli. Il mondo continua a crescere di luoghi, oggetti e
persone mentre esplori; il costo in dollari è nel pannello del Concilio. La chiave resta sul server di sviluppo: il browser
parla con un proxy locale. Senza chiave (o con `?offline`) i luoghi sono abbozzati, gli agenti rispondono
con un modello locale e le cose hanno i modelli del seme.

## Comandi di gioco

| Tasto | Azione |
|---|---|
| `WASD` / frecce | muoviti; il mouse sopra cose, persone e rune dice cosa sono |
| `E` / spazio | raccogli; davanti a cose e persone apre il menu: parla (chat libera), apri, esamina, dormi, attingi, «Apri la porta»… e **Altro…**: scrivi cosa fai, il Concilio giudica, la cosa impara (se ne cambia la forma, lo Scultore scrive la regola sul suo modello) |
| tasto destro | il menu della cosa o del terreno sotto il mouse (scavare, attingere, tagliare…) |
| `I` / `Tab` | inventario: trascina per riordinare, su un altro oggetto per **combinare**, fuori per posare; borse e sacche si aprono; **Altro…** su ogni oggetto; scheda **Crea** con le ricette e **Altro…** per inventarne |
| `1`–`6` | impugna o usa gli oggetti della prima riga; `X` posa |
| `F` | usa ciò che impugni su ciò che hai davanti |
| `Z` `C` / rotella | scegli una runa della frase (`Shift` per spostarla) |
| `Q` | incidi la frase nel terreno davanti a te |
| `T` | pronuncia le rune magiche della frase, in ordine, consumandole: un incantesimo (le sequenze nuove le nomina il Concilio; costa mana, da 3 rune serve un cristallo) |
| `R` | torna all'ultimo stato valido |
| `V` | mostra in rosso ciò che non si può attraversare |
| `H` / `F1` aiuto · `Esc` chiudi | oltre il bordo: `G` il registro del Concilio, `F2` la console |
| nella corona | `E` alla porta di un edificio per entrare; dentro: scaffali (file), la Galleria dei modelli («riscolpisci»), bacheca, scale; il Referente accoglie le tue richieste |

Fame, sete ed energia calano: mangia, bevi, dormi. Passa il mouse su una runa per vederne il valore vivo.
Rune che si toccano formano una riga di codice; ogni runa è una lastra su una casella, e una volta raccolta è un oggetto nella
borsa delle rune: dalla borsa componi la frase da incidere (`Q`) o pronunciare (`T`). Gli NPC hanno un mestiere, una
famiglia e una giornata loro; ciò che il Concilio decide sulle tue azioni diventa una regola del mondo. Il giorno dura dieci minuti: di notte
servono luci. Oltre il bordo, la corona è uno studio: ogni cartella un edificio, ogni file uno scaffale da
aprire, e le squadre del Concilio che ci lavorano (con `E` ci parli).

<details>
<summary>Spoiler: come si esce</summary>

Nella piazza iniziale ci sono `x`, `speed = speed` e la runa magica `luce`. Le rune del tappeto
(`carpet`, `active`…) si trovano solo lontano dall'inizio, a qualche luogo di distanza. Raccogli `carpet`,
`.`, `active`, prendi `=` dal centro di `speed = speed`, trova un `false`. Componi la frase
`carpet . active = false`, premi `Q`, e cammina dritto per 44 passi. Ma ci sono molti altri modi.
</details>

## Per chi sviluppa

Leggi **[AGENTS.md](AGENTS.md)**: architettura, Concilio, regole inviolabili, convenzioni (vale per
persone, Claude Code e Gemini CLI). Design originale in [docs/design.md](docs/design.md), decisioni in
[docs/adr/](docs/adr/README.md), lavoro da fare in [docs/plans/backlog.md](docs/plans/backlog.md), il passaggio al
3D in [docs/reports/step9.md](docs/reports/step9.md). Il laboratorio di MarkovJunior è in [lab/](lab/README.md).

## Riferimenti e ispirazioni

- Dan Harmon
    - Community: Digital Estate Planning
    - Rick and Morty: M. Night Shaym-Aliens!
- South Park: Grounded Vindaloop
- Matrix
- Westworld
- The Trueman Show
- Project Zomboid
- Cyberpunk 
- Dungeons & Dragons
