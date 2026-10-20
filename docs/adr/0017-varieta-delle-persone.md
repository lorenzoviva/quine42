# ADR-0017 — Varietà delle persone

Data: 2026-10-20 · Stato: accettato

## Contesto
Con pochi tipi di NPC lo stesso personaggio compariva ovunque; alcuni sprite avevano ancora lo sfondo
magenta.

## Decisione
- Genesi: 5 tipi di persone molto diversi (almeno 3 persone di mestieri, età e generi diversi, e un animale).
- Al massimo `Kernel.NPC_CAP` (2) personaggi dello stesso tipo nel mondo caricato; il Cartografo è
  invitato a variare e a non ripetere i luoghi vicini.
- Esplorando, ogni 7 luoghi la Fucina crea un **nuovo tipo di abitante** diverso da quelli noti
  (`growCast`, budget `ai.maxCast`).
- Ogni individuo ha abiti ricolorati (rotazione di tinta dei pixel saturi che non sono pelle) e statura
  leggermente diversa: stabili per individuo, senza nuove immagini.
- Sprite: lo sfondo si toglie con riempimento dai bordi più rimozione dei pixel magenta; uno sprite
  ancora sporco viene scartato e ridipinto, mai mostrato.
