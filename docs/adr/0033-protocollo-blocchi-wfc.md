# ADR-0033 — Laboratorio voxel: protocollo tra i due scultori, WFC a bit, foto per blocchi

Data: 2026-10-21 · Stato: sperimentale (fuori dal gioco); modifica ADR-0032

## Contesto
Dopo lo step 8B l'autore osserva ([`docs/userchats/step8C.md`](../userchats/step8C.md)): il limite `MAX_CODES`
(31) è ancora nel motore; il costo in input con `gemini-3.8-flash` è alto; nel secondo scultore i bordi 3D
dei blocchi del primo non vincolano davvero la composizione (blocchi «sovrapposti a caso»), il WFC è lento;
le strutture sono troppo piccole. Chiede un protocollo per cui il secondo scultore veda come uniche opzioni
le combinazioni di blocchi e rotazioni del primo, una prova con un castello di 30 blocchi su 100 × 100, e se
la computazione si possa spostare su GPU.

## Decisione
- **Codici**: il motore non usa più maschere a 32 bit ma un registro di insiemi (una tabella di 256 voci per
  insieme): fino a 255 codici per programma. Le piante di blocchi possono essere grandi fino a 128 × 128 × 8.
- **Protocollo tra i due scultori** (`structure.ts`):
  1. lo Scultore dei blocchi scrive prima il **catalogo** (blocchi, prese, `faces` = com'è fatta in voxel la
     faccia di ogni etichetta, `open` = le prese che possono guardare fuori), poi i **programmi** a gruppi di
     6; ogni blocco nuovo è confrontato con le facce già accettate con la stessa etichetta;
  2. il kernel ricava le **varianti** (blocco × quarto di giro, senza doppioni) e una tabella di compatibilità
     per le sei direzioni, calcolata una volta: prese uguali **e** facce voxel che si continuano;
  3. l'**Architetto dipinge zone** (codice → blocchi ammessi) e mette esatti solo i pezzi unici; il WFC sceglie
     variante per variante tra le sole combinazioni della tabella. Muro dritto o angolo, e la rotazione, li
     decidono le prese: nel castello scritto a mano l'Architetto non nomina più torri né rotazioni.
- **WFC** (`wfc.ts`): domini come insiemi di bit, supporto = OR delle righe della tabella, cella con meno
  opzioni da un heap, contraddizioni riparate localmente (un quadrato attorno, che cresce se si ripresenta).
  Il fuori e il bordo della griglia sono la variante vuota.
- **Foto per blocchi** (`composite.ts`): ogni blocco, per rotazione e variante di seme, si dipinge una volta;
  i dipinti si compongono con un test di profondità, l'ombra si proietta da una mappa delle altezze, i
  contorni si tracciano una volta sull'insieme. Non si costruiscono più i voxel di tutta la struttura.
- **Costi**: modello predefinito `gemini-3.5-flash`; un contatore (`meter.ts`) legge da ogni risposta anche i
  token di ragionamento e quelli serviti dalla cache; lo Scultore manda solo gli esempi della classe (al più
  due); l'Artista delle strutture vede la veduta d'insieme rimpicciolita più due dettagli ingranditi.

## Conseguenze
- Misurato offline con i blocchi del castello scritto a mano: pianta 100 × 100 × 3, WFC su ~1.800 celle in
  ~40 ms, foto 2000 × 2000 px in ~0,25 s; prima il WFC su piante piccole poteva bloccarsi per minuti.
- GPU: non serve ora. Le parti data-parallel (regole `all`/`prl`/`conv` di MarkovJunior, la pittura dei
  voxel) si presterebbero a WebGPU; il WFC è sequenziale nel cuore (una scelta alla volta) e ne guadagnerebbe
  poco. Per la produzione vengono prima la generazione a pezzi (piante divise in riquadri con i bordi
  vincolati, in Web Worker paralleli, generati quando il viandante si avvicina) e l'uso diretto dei dipinti
  dei blocchi come tile del gioco.
- Nessuna conseguenza sul gioco: tutto resta in `lab/`.
