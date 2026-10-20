# ADR-0028 — Meccaniche con interfacce: il Concilio aggiunge pannelli al gioco

Data: 2026-10-20 · Stato: accettato; estende ADR-0026

## Contesto
Nel mondo ci sono armi, armature e vestiti, ma nessuno slot dove indossarli, e il Concilio non generava né
la logica né l'interfaccia. L'autore chiede se il kernel permetta ai moduli di avere un'interfaccia, e di
non scrivere i contenuti di gioco nel kernel: il kernel dà gli strumenti, il Concilio li usa durante il gioco.

## Decisione
- **Pannelli dichiarativi** (`Manifest.ui`): `{titolo, descrizione?, elementi}` con elementi `slot`
  (`id`, `accetta`: posti, categorie o tag), `barra` e `testo` (`campo` = `componente.campo` del
  viandante, `max`), `pulsante` (`id`). Il kernel li disegna come schede dell'inventario; un modulo non
  scrive HTML né JS: lo schermo resta del kernel (regola 1), il modulo decide il contenuto.
- **Slot del viandante**: componente `slots` (di proprietà del kernel, protetto da `ecs.set`, salvato in
  `world/stato.json`). `equip`/`unequip` spostano l'oggetto dall'inventario allo slot e chiamano
  `M.on_slot(user, slot, item, panel)`; i pulsanti chiamano `M.on_ui(user, azione)`. Al caricamento il
  kernel richiama `on_slot`, così ciò che la meccanica deriva (difesa, stati) si ricostruisce.
- **API Lua**: `ui.slot(panel, slot)`, `items.bonus(id, nome)`; le conseguenze passano dagli **stati**
  (ADR-0026). Gli oggetti hanno `ItemDef.slot` (il Narratore lo scrive come `posto`) e `bonus`
  (difesa, attacco, velocità, peso, luce, calore).
- **Fucina delle meccaniche** (`kernel.forgeMechanic`, agente `mechanics.ts`, compito `mechanic.design`
  dell'Ingegnere): progetto → pannello pulito (`cleanPanel`: al massimo 16 elementi, id unici, campi
  ben formati) → validatore (`validateForged` con `system: true`, accettato solo se c'è un pannello) →
  `modules/mech.<nome>/` → commit. La chiedono le **sessioni del Concilio** (intervento `meccanica`;
  il riassunto segnala «MANCA» quando ci sono oggetti da indossare senza slot) e il **Referente**.

## Conseguenze
- Equipaggiamento, faretre, bisacce, schede di reputazione nascono nell'universo, non nel kernel.
- Il kernel conosce solo quattro elementi d'interfaccia: nuovi elementi (liste, griglie) sono nuove
  decisioni del kernel.
