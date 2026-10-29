# Documentazione di QUINE42

Benvenuti nella documentazione del progetto **QUINE42** (in precedenza *Rune*, ADR-0062).
Questo documento fornisce il resoconto completo della struttura delle cartelle, l'evoluzione delle metodologie di sviluppo adottate nel corso del tempo e la tabella di corrispondenza per individuare tutti i file storici archiviati.

---

## 1. Evoluzione delle metodologie di sviluppo

Lo sviluppo di QUINE42 è progredito attraverso quattro metodologie distinte, riflettendo la crescente maturità del progetto e delle tecniche di interazione con gli agenti AI:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Thread unico (Claude Code)                                           │
│    Un'unica conversazione continua, sviluppo iniziale e prototipazione   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. Approccio a Step                                                      │
│    Sviluppo a blocchi sequenziali (Step 8, Step 9 3D), piani e report    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. To-Do e Backlog per sessione                                          │
│    Sessioni brevi atomiche (T01-T60), un task per sessione, AGENTS.md    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. Pipeline agentica (Attuale, ADR-0072, T61)                            │
│    Multi-worktree parallelo, budget per provider, auto-ripresa ai limiti  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Metodologia 1: Singolo thread di Claude Code
- **Periodo**: Fase iniziale di ideazione e prototipazione (Genesi di RUNE).
- **Caratteristiche**: Il kernel e i primi moduli sono stati sviluppati all'interno di un'unica conversazione continua con Claude Code. L'autore forniva istruzioni sequenziali nello stesso contesto; non esistevano worktree separati né registri formali di backlog.
- **Documenti prodotti**: Trascrizioni delle richieste storiche (`step0.md` – `step7.md`), dal prompt iniziale per la creazione del progetto fino alla formalizzazione dei due tavoli (Dungeon Master e giocatori, ADR-0025) e alla rimozione del meta-gioco.
- **Collocazione archivio**: [`docs/archivio/1-thread-unico/`](archivio/1-thread-unico/)

### Metodologia 2: Approccio basato su Steps
- **Periodo**: Dagli Step 8 (8A, 8B, 8C, 8.1A, 8.1B, 8.1C, 8.2A, 8.2B, 8.2C) allo Step 9 (passaggio al 3D completo).
- **Caratteristiche**: Sviluppo organizzato a blocchi di lavoro progressivi ("Step"). L'autore forniva specifiche per step; venivano redatti piani di step con inventario e diario di avanzamento fase per fase (`step9-3d.md`), report economici e consuntivi di spesa (`costi-step8.2B.md`, `step9.md`), e conservati i prompt/chat in file `step8*.md` e `step9*.md`. Lo sviluppo è avvenuto principalmente nel worktree storico `step8.2A-lab3d` su branch `3d`.
- **Documenti prodotti**: Piani di transizione al 3D e allo spazio continuo, relazioni di costo dei modelli Gemini, riassunto consuntivo dello Step 9, chat utente degli step 8 e 9.
- **Collocazione archivio**: [`docs/archivio/2-step/`](archivio/2-step/)

### Metodologia 3: To-Do e Backlog per sessione (Sessioni atomiche)
- **Periodo**: Dalla chiusura dello Step 9 (22 ottobre 2026) al 28 ottobre 2026.
- **Caratteristiche**: Introduzione del *Protocollo delle sessioni* di `AGENTS.md`. Le richieste aperte dell'autore venivano depositate in `docs/userchats/to-do.md`; ogni sessione di Claude Code o Gemini CLI prendeva in carico una richiesta, la formalizzava come task atomico in `docs/plans/backlog.md` (T01...T60), archiviava il testo originale in snapshot datati (`to-do-<data>.md`), completava il task con test e typecheck verdi, ADR, commit su branch `3d` e forniva il prompt per la sessione successiva.
- **Documenti prodotti**: Piani architetturali di dettaglio (`corona-proposte.md`, `multiplayer.md`), prompt di supporto per generazioni batch esterne (`gemini-strutture-corona.md`, `gemini-esterni-corona.md`), snapshot periodici dei to-do con allegati grafici e schermate di feedback.
- **Collocazione archivio**: [`docs/archivio/3-to-do-backlog/`](archivio/3-to-do-backlog/)

### Metodologia 4: La Pipeline Agentica (Attuale)
- **Periodo**: Dal 28 ottobre 2026 (ADR-0072, task T61).
- **Caratteristiche**: Automazione completa dello sviluppo agentico. L'architettura separa nettamente pianificazione ed esecuzione:
  1. *Fasi 1-4 (Pianificazione)*: Un agente (`/pipeline` in Claude Code, skill in Antigravity) converte le richieste di `to-do.md` in task nel backlog, assegna provider e stima nella riga `- Pipeline: <provider> · stima · approvato · priorità`, gestisce lo scambio di chiarimenti in `docs/pipeline/domande/Txx.md` e genera `docs/pipeline/PIANO.md`.
  2. *Fase 5 (Esecuzione)*: Uno script deterministico (`tools/pipeline/pipeline.mjs esegui`) lancia fino a 5 task in parallelo, ciascuno in un proprio worktree isolato (`.claude/worktrees/<txx>`, branch `task/<Txx>`), controllando i contatori di consumo da `/usage` (5 ore e settimanale), sospendendo i task vicini ai limiti e riprendendoli automaticamente al reset settimanale.
- **Collocazione documenti attivi**: [`docs/pipeline/`](pipeline/), [`docs/plans/backlog.md`](plans/backlog.md), [`docs/userchats/to-do.md`](userchats/to-do.md).

---

## 2. Struttura delle cartelle

```
docs/
├── README.md                      # Questo resoconto e indice generale
├── design.md                      # Documento di design originale del gioco
├── conversazioni.md               # Mappa e schede interazioni Gemini (T67, Fase I)
│
├── adr/                           # Architecture Decision Records (ADR 0001 - 0072+)
│   ├── README.md                  # Indice di tutte le decisioni architetturali
│   └── 0001-... - 0072-...        # Schede delle decisioni
│
├── pipeline/                      # Documentazione attiva della Pipeline Agentica (T61)
│   ├── README.md                  # Guida e regole per chi esegue un task
│   ├── pianifica.md               # Istruzioni per le fasi 1-4 (agente pianificatore)
│   ├── PIANO.md                   # Piano generato con code per provider e budget
│   ├── consumi.jsonl              # Storico dei consumi per calibrare le stime
│   └── domande/                   # Scambio domande aperte tra agente e autore
│
├── plans/                         # Pianificazione attiva
│   └── backlog.md                 # UNICA FONTE DI VERITÀ per tutti i task (T01 - T68+)
│
├── userchats/                     # Canale di ingresso attivo per nuove richieste
│   └── to-do.md                   # Richieste grezze dell'autore in attesa di pianificazione
│
├── img/                           # Risorse grafiche e screenshot della documentazione
│
└── archivio/                      # ARCHIVIO STORICO METODOLOGIE PRECEDENTI
    ├── 1-thread-unico/            # Metodologia 1: Single thread Claude Code
    │   └── userchats/             # Prompt iniziali fondativi (step0.md - step7.md)
    │
    ├── 2-step/                    # Metodologia 2: Sviluppo a Step (8 e 9 3D)
    │   ├── plans/                 # Piani di step (step9-3d.md, universo-continuo.md)
    │   ├── reports/               # Report di costo e consuntivi (step9.md, costi-step8.2B.md)
    │   │   └── img/               # Immagini allegate ai report
    │   └── userchats/             # Richieste utente step 8 e 9 (step8*.md, step9*.md)
    │
    └── 3-to-do-backlog/           # Metodologia 3: To-Do e Backlog per sessione (T01-T60)
        ├── plans/                 # Piani di dettaglio (corona-proposte.md, multiplayer.md)
        ├── prompts/               # Prompt generativi per Gemini CLI (strutture ed esterni)
        └── userchats/             # Snapshot to-do storici, risposte, allegati e screenshot
            └── viandante/         # Screenshot storici del viandante
```

---

## 3. Tabella «Link citato → Dove è ora»

Per garantire che tutti i riferimenti storici presenti nei documenti, nei commit git, negli ADR o nel codice rimangano immediatamente rintracciabili senza riscritture distruttive, la tabella seguente mappa ogni percorso originario alla sua collocazione nell'archivio:

| Percorso citato originariamente | Metodologia | Nuova collocazione nell'archivio | Note e contenuto |
|---|---|---|---|
| `docs/userchats/step0.md` | 1. Thread unico | [`docs/archivio/1-thread-unico/userchats/step0.md`](archivio/1-thread-unico/userchats/step0.md) | Prompt fondativo: creazione progetto e design iniziale |
| `docs/userchats/step1.md` | 1. Thread unico | [`docs/archivio/1-thread-unico/userchats/step1.md`](archivio/1-thread-unico/userchats/step1.md) | Revisione: "non tutto è rune", generazione procedurale |
| `docs/userchats/step2.md` | 1. Thread unico | [`docs/archivio/1-thread-unico/userchats/step2.md`](archivio/1-thread-unico/userchats/step2.md) | Introduzione Google Gemini e inventario articolato |
| `docs/userchats/step3.md` | 1. Thread unico | [`docs/archivio/1-thread-unico/userchats/step3.md`](archivio/1-thread-unico/userchats/step3.md) | Generazione chunk con logica a sfumare |
| `docs/userchats/step4.md` | 1. Thread unico | [`docs/archivio/1-thread-unico/userchats/step4.md`](archivio/1-thread-unico/userchats/step4.md) | Primo collaudo del gioco e correzioni |
| `docs/userchats/step5.md` | 1. Thread unico | [`docs/archivio/1-thread-unico/userchats/step5.md`](archivio/1-thread-unico/userchats/step5.md) | Meccaniche di gameplay ed esplorazione |
| `docs/userchats/step6.md` | 1. Thread unico | [`docs/archivio/1-thread-unico/userchats/step6.md`](archivio/1-thread-unico/userchats/step6.md) | Estensione feature e interazioni |
| `docs/userchats/step7.md` | 1. Thread unico | [`docs/archivio/1-thread-unico/userchats/step7.md`](archivio/1-thread-unico/userchats/step7.md) | Definizione dei Due Tavoli e divieto di meta-gioco |
| `docs/plans/step9-3d.md` | 2. Steps | [`docs/archivio/2-step/plans/step9-3d.md`](archivio/2-step/plans/step9-3d.md) | Piano generale e diario di avanzamento dello Step 9 (3D) |
| `docs/plans/universo-continuo.md` | 2. Steps | [`docs/archivio/2-step/plans/universo-continuo.md`](archivio/2-step/plans/universo-continuo.md) | Proposta spazio continuo e caselle (Step 8.2B) |
| `docs/reports/costi-step8.2B.md` | 2. Steps | [`docs/archivio/2-step/reports/costi-step8.2B.md`](archivio/2-step/reports/costi-step8.2B.md) | Rendicontazione dettagliata consumi e prezzi Gemini |
| `docs/reports/step9.md` | 2. Steps | [`docs/archivio/2-step/reports/step9.md`](archivio/2-step/reports/step9.md) | Relazione finale di chiusura e bilancio dello Step 9 |
| `docs/reports/img/step8.2B-mulini.png` | 2. Steps | [`docs/archivio/2-step/reports/img/step8.2B-mulini.png`](archivio/2-step/reports/img/step8.2B-mulini.png) | Montaggio visivo delle prove modelli mulini |
| `docs/userchats/step8.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8.md`](archivio/2-step/userchats/step8.md) | Specifiche per lo Step 8 |
| `docs/userchats/step8A.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8A.md`](archivio/2-step/userchats/step8A.md) | Specifiche e prompt per Step 8A |
| `docs/userchats/step8B.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8B.md`](archivio/2-step/userchats/step8B.md) | Specifiche e prompt per Step 8B |
| `docs/userchats/step8C.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8C.md`](archivio/2-step/userchats/step8C.md) | Specifiche e prompt per Step 8C |
| `docs/userchats/step8.1A.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8.1A.md`](archivio/2-step/userchats/step8.1A.md) | Specifiche e prompt per Step 8.1A |
| `docs/userchats/step8.1B.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8.1B.md`](archivio/2-step/userchats/step8.1B.md) | Specifiche e prompt per Step 8.1B |
| `docs/userchats/step8.1C.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8.1C.md`](archivio/2-step/userchats/step8.1C.md) | Specifiche e prompt per Step 8.1C |
| `docs/userchats/step8.2A.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8.2A.md`](archivio/2-step/userchats/step8.2A.md) | MarkovJunior alla lettera in 3D (nascita worktree 3d) |
| `docs/userchats/step8.2B.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8.2B.md`](archivio/2-step/userchats/step8.2B.md) | Valutazione modelli 3D e analisi consumi |
| `docs/userchats/step8.2C.md` | 2. Steps | [`docs/archivio/2-step/userchats/step8.2C.md`](archivio/2-step/userchats/step8.2C.md) | Consolidamento laboratorio 3D e chiusura step 8 |
| `docs/userchats/step9-3d.md` | 2. Steps | [`docs/archivio/2-step/userchats/step9-3d.md`](archivio/2-step/userchats/step9-3d.md) | Richiesta dell'autore per il passaggio al 3D |
| `docs/userchats/step9-3dA.md` | 2. Steps | [`docs/archivio/2-step/userchats/step9-3dA.md`](archivio/2-step/userchats/step9-3dA.md) | Specifiche integrative per lo Step 9 |
| `docs/plans/corona-proposte.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/plans/corona-proposte.md`](archivio/3-to-do-backlog/plans/corona-proposte.md) | Proposte per interni edifici corona (T26, T27, T32) |
| `docs/plans/multiplayer.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/plans/multiplayer.md`](archivio/3-to-do-backlog/plans/multiplayer.md) | Piano di architettura multiplayer (T29, T33-T45) |
| `docs/prompts/gemini-strutture-corona.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/prompts/gemini-strutture-corona.md`](archivio/3-to-do-backlog/prompts/gemini-strutture-corona.md) | Schede e prompt per modellare gli 11 edifici (T19) |
| `docs/prompts/gemini-esterni-corona.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/prompts/gemini-esterni-corona.md`](archivio/3-to-do-backlog/prompts/gemini-esterni-corona.md) | Schede per arredi urbani e avatar gerboa (T50a) |
| `docs/userchats/to-do-2026-10-22.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/to-do-2026-10-22.md`](archivio/3-to-do-backlog/userchats/to-do-2026-10-22.md) | Incoerenze personaggi/trame, multiplayer, corona |
| `docs/userchats/to-do-2026-10-24.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/to-do-2026-10-24.md`](archivio/3-to-do-backlog/userchats/to-do-2026-10-24.md) | Specifiche interni corona, arredi, telecamera, salto |
| `docs/userchats/to-do-2026-10-25.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/to-do-2026-10-25.md`](archivio/3-to-do-backlog/userchats/to-do-2026-10-25.md) | Laboratorio editor MarkovJunior (T59) |
| `docs/userchats/to-do-2026-10-28.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/to-do-2026-10-28.md`](archivio/3-to-do-backlog/userchats/to-do-2026-10-28.md) | Richiesta nascita pipeline e ordine worktree (T61) |
| `docs/userchats/to-do-2026-10-29.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/to-do-2026-10-29.md`](archivio/3-to-do-backlog/userchats/to-do-2026-10-29.md) | Modelli fatti a mano, lessico, riorganizzazione docs |
| `docs/userchats/risposte-T50.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/risposte-T50.md`](archivio/3-to-do-backlog/userchats/risposte-T50.md) | Decisioni autore su gerboa e arredi corona |
| `docs/userchats/idee-costumi-parole-etc.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/idee-costumi-parole-etc.md`](archivio/3-to-do-backlog/userchats/idee-costumi-parole-etc.md) | Appunti per lessico e costumi sociali (T65) |
| `docs/userchats/cambio_metodologia_istruzioni.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/cambio_metodologia_istruzioni.md`](archivio/3-to-do-backlog/userchats/cambio_metodologia_istruzioni.md) | Istruzioni riepilogative su pipeline e contatori |
| `docs/userchats/cambio_metodologia_testo.md` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/cambio_metodologia_testo.md`](archivio/3-to-do-backlog/userchats/cambio_metodologia_testo.md) | Trascrizione completa sessione Claude Code su T61 |
| `docs/userchats/Blocchi.png` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/Blocchi.png`](archivio/3-to-do-backlog/userchats/Blocchi.png) | Screenshot ostacoli e sentieri bloccati (T56) |
| `docs/userchats/bug.png` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/bug.png`](archivio/3-to-do-backlog/userchats/bug.png) | Screenshot anomalie visive |
| `docs/userchats/direzione.png` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/direzione.png`](archivio/3-to-do-backlog/userchats/direzione.png) | Screenshot inquadratura sala Direzione (T49) |
| `docs/userchats/grafica_cartone.png` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/grafica_cartone.png`](archivio/3-to-do-backlog/userchats/grafica_cartone.png) | Immagine di riferimento stile grafico |
| `docs/userchats/purpleNPC.png` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/purpleNPC.png`](archivio/3-to-do-backlog/userchats/purpleNPC.png) | Screenshot colorazione avatar NPC |
| `docs/userchats/viandante_down_2.png` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/viandante_down_2.png`](archivio/3-to-do-backlog/userchats/viandante_down_2.png) | Texture orientamento viandante |
| `docs/userchats/viandante/Screenshot *.png` | 3. To-Do/Backlog | [`docs/archivio/3-to-do-backlog/userchats/viandante/`](archivio/3-to-do-backlog/userchats/viandante/) | Serie di 4 screenshot proporzioni viandante |

---

## 4. Documenti che rimangono nella radice di `docs/` o nelle loro cartelle originarie

In conformità ai requisiti della pipeline agentica (ADR-0072) e alle convenzioni operative di `AGENTS.md`, i seguenti file rimangono rigorosamente nella loro posizione attiva:

1. **[`docs/pipeline/`](pipeline/)**: l'intero sistema della pipeline agentica (`README.md`, `pianifica.md`, `PIANO.md`, `consumi.jsonl`, `domande/`).
2. **[`docs/plans/backlog.md`](plans/backlog.md)**: il backlog unificato delle sessioni, letto e aggiornato dagli agenti e dallo script `tools/pipeline/pipeline.mjs`.
3. **[`docs/userchats/to-do.md`](userchats/to-do.md)**: il file in cui l'autore scrive le nuove richieste da pianificare.
4. **[`docs/adr/`](adr/)**: il registro di tutte le decisioni architetturali (ADR).
5. **[`docs/design.md`](design.md)**: il documento di design originale e fondativo del gioco.
6. **[`docs/conversazioni.md`](conversazioni.md)**: il censimento completo di tutte le interazioni con Gemini (T67, per la futura localizzazione e coda abbonamenti).
7. **[`docs/img/`](img/)**: immagini del gioco 2D e destinazione dei futuri screenshot 3D.
