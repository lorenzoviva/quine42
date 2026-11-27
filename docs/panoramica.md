# QUINE42 in breve

> **Livello 1** della documentazione ([ADR-0266](adr/0266-la-documentazione-a-livelli.md)): il quadro in due pagine, i dettagli un link più in
> giù. Non dice versioni, task né crediti, che cambiano ogni giorno: quelli stanno nel [quadro](pipeline/quadro.md) e nelle [fasi](fasi.md).
> Se qualcosa qui non torna con [`AGENTS.md`](../AGENTS.md), vince `AGENTS.md`, e si corregge qui.

## Il gioco

Un gioco 3D a voxel visto dall'alto in 3/4, il cui mondo è generato dall'IA in ogni aspetto tranne il kernel. Il viandante vive in un cerchio:
un **tappeto** compensa ogni suo passo e lo riporta al centro. Attorno, ferma e invisibile da dentro, c'è la **corona**: lo studio dove il
Concilio lavora, il codice sorgente dell'universo; chi ci arriva ne fa parte. Nel terreno brillano le **rune**, token Lua veri: ciò che è
scritto sul tappeto si esegue, e il giocatore può rompere la simulazione o riscriverla. **Due tavoli**: il Concilio (o il master) fa il
mondo, dentro il mondo si vive un mondo reale, senza meta-gioco. Il design di partenza: [`design.md`](design.md).

## Come è fatto

- **Il kernel** (`src/kernel/`, TypeScript) è il pavimento: tick, entità, luoghi, terreno, regole, validatore, sandbox, migrazioni.
  La sua versione `X.Y.Z` dice era, contratto e incremento: un universo di un altro contratto si porta con una migrazione, o si legge soltanto.
- **L'universo** (`universes/<nome>/`) è un repository git: moduli con il manifest, Lua, programmi, piani dei luoghi, stato del mondo.
  Nasce dal seme `universe/`; i saldi stanno fuori.
- **Lua in sandbox**: la logica dei moduli, che vede solo `Host`, entro tetti di istruzioni e memoria.
- **MarkovJunior** (`src/mj/`): ogni aspetto (modelli, terreni, suoni) è un programma di riscrittura, un'istanza è un seme.
- **Il Concilio** (`src/kernel/agents/`): agenti sui modelli di Google o di OpenRouter (Narratore, Cartografo, Scultore, Artista, Fisico,
  Ingegnere, Arbitro, Referente, Musicista, Scenografo, Attore) e le decisioni chiuse di Jev; lavora per i luoghi che un viandante
  raggiunge presto, e ogni chiamata dice chi paga.
- **A schermo** (`src/render/`, `src/ui/`, `src/audio/`): three.js a cartone, i worker per le forme e il terreno, l'HUD, il tocco.
- **In molti** (`src/session/`, `server/`): il kernel gira sul server, un processo per mondo, e il client è sottile; attorno il server di
  produzione, gli account, i varchi delle chiavi, i saldi.
- **Attorno**: il sito (`site/`), il laboratorio di MarkovJunior (`lab/`), la pipeline degli agenti (`tools/pipeline/`).

## Le regole inviolabili, una riga ciascuna

Per intero, con le eccezioni, in [`AGENTS.md`](../AGENTS.md#regole-inviolabili).

- **0** Niente meta-gioco dentro il mondo: ciò che rompe la quarta parete si chiede di nuovo o si ritira.
- **1** Il kernel non si modifica da Lua; Lua vede solo `Host`.
- **2** Tutto il generato passa dal validatore: l'IA non rompe mai il gioco, e ciò che fallisce lo ripara l'Ingegnere.
- **3** Il giocatore può rompere il gioco: si isola, si mostra, si torna indietro.
- **4** Stato nei componenti, logica senza stato.
- **5** Ogni contenuto è un modulo autosufficiente col suo manifest.
- **6** Due repository, il kernel e l'universo; si committano solo stati validi (un guasto trattiene il codice, mai i dati), e ciò che la rete non porta resta in fila.
- **7** Il kernel è il pavimento: sopravvive a NaN, nil, cicli infiniti.
- **8** Dal cerchio nessuno vede la corona: lo decide solo il kernel.
- **8b** Chi non è il master non riscrive il mondo; l'identità la verifica il server.
- **8b-bis** A partita in corso nessuno cambia le regolazioni dell'IA; solo il ritmo del mondo, e solo verso il basso.
- **8c** Un universo contiene solo percorsi ammessi, e il server lancia git da un punto solo.
- **8d** Saldi, pagamenti, carte fatte a mano, ospiti e identità stanno fuori dall'universo.
- **8e** Un giocatore solo non consuma il mondo: ogni messaggio ha il suo ritmo.
- **8f** Ciò che esce al client e ciò che il Concilio scrive sono elenchi.
- **8g** Ogni mondo di molti è un processo senza segreti.
- **8h** In pubblico solo il server di produzione, che non parte senza la sua configurazione.
- **8i** Chi paga si dice, non si ricava: lo risolve il kernel in un punto.
- **8j** Un socket costa solo se dice chi è, un mondo vive solo finché c'è qualcuno.
- **9** Le chiavi non arrivano mai al browser, ognuna ha il suo varco; il testo del viandante solo a chi non conserva niente.
- **10** Ciò che sembra invalicabile lo è, ciò che sembra percorribile lo è: il gradino, la rete di ogni luogo, il nuoto, il vuoto, i veicoli.
- **11** Solo testo, niente immagini generate: ogni aspetto è un programma.

## I sottosistemi

Ognuno ha una sezione di [`architettura-dettagli.md`](architettura-dettagli.md), da leggere prima di toccarlo.

- **Il mondo**: [rune e magia](architettura-dettagli.md#spazi-rune-magia) · [lessico](architettura-dettagli.md#lessico) ·
  [geografia](architettura-dettagli.md#geografia) · [rilievo](architettura-dettagli.md#rilievo) · [rete e gradini](architettura-dettagli.md#rete) ·
  [acqua](architettura-dettagli.md#acqua) · [automi](architettura-dettagli.md#automi) · [fisica e natura](architettura-dettagli.md#fisica) ·
  [sotterranei](architettura-dettagli.md#sotterranei) · [lotti e strutture](architettura-dettagli.md#lotti) · [taglie](architettura-dettagli.md#taglie) ·
  [veicoli](architettura-dettagli.md#veicoli) · [pianeti](architettura-dettagli.md#pianeti) · [semi](architettura-dettagli.md#semi) ·
  [grafo del mondo](architettura-dettagli.md#grafo)
- **Le persone e le regole**: [regole ed effetti](architettura-dettagli.md#regole-effetti) · [società](architettura-dettagli.md#societa) ·
  [partita e viandanti](architettura-dettagli.md#partita-viandanti) · [corona](architettura-dettagli.md#corona) ·
  [sala sistemi](architettura-dettagli.md#sala-sistemi)
- **Il Concilio e i programmi**: [il Concilio al lavoro](architettura-dettagli.md#concilio) · [i modelli dell'IA](architettura-dettagli.md#gemini) ·
  [MarkovJunior](architettura-dettagli.md#markovjunior-modelli) · [suono](architettura-dettagli.md#suono) ·
  [Lua](architettura-dettagli.md#lua-sandbox) · [abbonamenti e generazione differita](architettura-dettagli.md#abbonamenti)
- **Giocatori e soldi**: [multigiocatore](architettura-dettagli.md#multigiocatore) · [lobby](architettura-dettagli.md#lobby) ·
  [account](architettura-dettagli.md#account) · [carte e crediti](architettura-dettagli.md#carte-crediti) · [Stripe](architettura-dettagli.md#stripe) ·
  [clone ed eredità](architettura-dettagli.md#clone-eredita)
- **A schermo e fuori**: [mondo in 3D](architettura-dettagli.md#mondo3d) · [cartone](architettura-dettagli.md#cartone) ·
  [sito](architettura-dettagli.md#sito) · [self-hosting](architettura-dettagli.md#self-hosting) · [stack](architettura-dettagli.md#stack) ·
  [costi](architettura-dettagli.md#costi) · [prova nel browser](architettura-dettagli.md#convalida-browser) · [stato](architettura-dettagli.md#stato)

## Come si lavora

- L'autore scrive in [`to-do.md`](userchats/to-do.md); il pianificatore ne fa task nel [backlog](plans/backlog.md); la
  [pipeline](pipeline/README.md) li esegue in parallelo, uno per worktree, su più provider, e l'orchestratore li integra. Le domande
  per l'autore sono in [`aperte.md`](pipeline/domande/aperte.md).
- Lo sviluppo ha sei [fasi](fasi.md); uno step è un obiettivo condiviso fra task.
- Ogni decisione architetturale ha un [ADR](adr/README.md), ogni concetto un nome nel [glossario](glossario.md). Il codice parla inglese,
  documenti e interfaccia italiano, il mondo la lingua del suo universo ([lingua interna](lingua-interna.md)).
- Le vulnerabilità hanno un [registro](sicurezza/registro.md) e una suite di test; chi ospita un server segue [`self-hosting.md`](self-hosting.md).

## I livelli della documentazione

| Livello | Che cosa | Come si legge |
|---|---|---|
| 1 | questa pagina | per prima, intera |
| 2 | [`AGENTS.md`](../AGENTS.md): il nucleo, cioè le regole, il contratto e il protocollo | a ogni sessione, intero |
| 3 | i [dettagli](architettura-dettagli.md) per sottosistema, il glossario, la lingua interna, le fasi, gli [studi](design/), le [guide](guide/) | la parte che serve |
| registri | ADR, backlog, diario della pipeline, consumi, richieste dell'autore, [archivio](archivio/) | si cercano, non si leggono |

Chi aggiorna che cosa, e che cosa controllano i test: [`design/documentazione.md`](design/documentazione.md#regole).
