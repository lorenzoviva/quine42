// The internal language (T306, ADR-0153): English for what the code compares, what lies on disk and on the wire, what Lua sees; Latin for the
// tokens of the magic runes, the same in every language. The world's own text (bible, people, dialogues, names of things) stays in the
// language of its universe. This is the table of every Italian name of today and the name it takes, domain by domain, with where it is
// read and whether it touches the disk, the wire or Lua. docs/lingua-interna.md tells it in words; the tasks that apply it are T307-T308
// (split in four, one contract each: `step`). The table is checked by tests/internal-names.test.ts (no doubles, no collisions with the
// English already used, every value of the code covered); the domains of a step that is done are read at run time too (T307a): the
// migration of a universe (migrations.ts) and the repair of what the Council still writes in Italian until its prompts change (T310) both
// read it, through the functions at the end of this file.

/** What a name touches: a file of the universe, a message between client and server, the Lua of the modules, a prompt, only TypeScript. */
export type NameReach = 'disco' | 'filo' | 'lua' | 'prompt' | 'codice';

/** The task that applies the rename, and with it the contract of the kernel (ADR-0136): 0.2, 0.3, 0.4, 0.5, 0.7 (0.6 is T342's, the symbols of the programs). */
export type NameStep = 'T307a' | 'T307b' | 'T308a' | 'T308b' | 'T310b';

export interface NameDomain {
  id: string;
  /** In Italian, for the document. */
  title: string;
  /** `values`: the values of a field (an id among a closed set); `fields`: names of fields or keys; `paths`: files and folders. */
  kind: 'values' | 'fields' | 'paths';
  /** Where the code reads them (files and constants). */
  where: string[];
  reach: NameReach[];
  /** English, or Latin (the magic runes' tokens). */
  lang: 'en' | 'la';
  step: NameStep;
  /** Italian of today → the internal name. The same word on both sides: it stays (already English or Latin). */
  names: Readonly<Record<string, string>>;
  /** English names already used in the same space: no internal name may take one of them. */
  taken?: readonly string[];
  note?: string;
}

const d = (x: NameDomain): NameDomain => x;

export const INTERNAL_NAMES: readonly NameDomain[] = [
  // --- T307a: the world's simulation (contract 0.2) ------------------------------------------------------------------------------------
  d({
    id: 'classi',
    title: 'Classi dei modelli',
    kind: 'values',
    where: ['src/mj/classes.ts (CLASSES)', 'models/index.json → classe', 'manifest → appearance.classe', 'prompt dello Scultore'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: {
      sasso: 'pebble', roccia: 'rock', cespuglio: 'bush', albero: 'tree', oggetto: 'object', mobile: 'furniture', persona: 'person',
      animale: 'animal', bestia: 'beast', monumento: 'monument', edificio: 'building', grande: 'structure',
    },
    note: 'il modello generico di una classe ha il suo id (`models/persona.xml`): si rinomina con la classe',
  }),
  d({
    id: 'animazioni',
    title: 'Animazioni delle classi',
    kind: 'values',
    where: ['src/mj/classes.ts (AssetClass.animation)', 'src/mj/rig.ts'],
    reach: ['codice'],
    lang: 'en',
    step: 'T307a',
    names: { camminata: 'walk', vento: 'wind' },
  }),
  d({
    id: 'taglie',
    title: 'Taglie (D&D)',
    kind: 'values',
    where: ['src/mj/classes.ts (SIZE_TIERS, RARE_SIZES)', 'manifest → appearance.taglia', 'models/index.json → taglia', 'maps/*.json → strutture[].taglia', 'world/stato.json → rari (chiavi)', 'world/imprese.json → taglia'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: { minuscola: 'tiny', piccola: 'small', media: 'medium', grande: 'large', enorme: 'huge', gargantuesca: 'gargantuan' },
  }),
  d({
    id: 'effetti',
    title: 'Effetti (`tipo`)',
    kind: 'values',
    where: ['src/kernel/types.ts (EFFECT_TYPES)', 'src/kernel/validator.ts', 'core.effects (logic.lua)', 'manifest → items[].effects, actions[].effects, spells', 'world/rules.json'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: {
      messaggio: 'message', bisogni: 'needs', crea_oggetto: 'create_item', consuma: 'consume', distruggi: 'destroy', apri: 'open',
      contenitore: 'container', terreno: 'terrain', rilievo: 'relief', fuoco: 'fire', luce: 'light', scudo: 'shield', spingi: 'push',
      evoca: 'summon', legame: 'bond', ricordo: 'memory', nascita: 'birth', stato: 'state', togli_stato: 'remove_state',
    },
  }),
  d({
    id: 'campi-effetti',
    title: 'Campi degli effetti',
    kind: 'fields',
    where: ['src/kernel/types.ts (Effect)', 'src/kernel/validator.ts', 'core.effects (logic.lua)'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: {
      tipo: 'type', fame: 'hunger', sete: 'thirst', energia: 'energy', salute: 'health', oggetto: 'item', quantita: 'quantity', capienza: 'capacity',
      bottino: 'loot', a: 'to', da: 'from', raggio: 'radius', durata: 'duration', forza: 'force', modulo: 'module', legame: 'bond', testo: 'text',
      peso: 'weight', nome: 'name', velocita: 'speed', luce: 'light',
    },
    note: 'i nomi dei bisogni sono già inglesi nel componente `needs`: l’effetto prende gli stessi',
  }),
  d({
    id: 'categorie',
    title: 'Categorie degli oggetti',
    kind: 'values',
    where: ['src/kernel/types.ts (ITEM_CATEGORIES)', 'src/kernel/kernel.ts', 'src/ui/inventory.ts', 'manifest → items[].category'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: {
      cibo: 'food', bevanda: 'drink', medicina: 'medicine', attrezzo: 'tool', arma: 'weapon', materiale: 'material', luce: 'light',
      vestiario: 'clothing', contenitore: 'container', magia: 'magic', varie: 'misc',
    },
  }),
  d({
    id: 'impronte',
    title: 'Forme degli oggetti (gli id `forma-…` dei modelli)',
    kind: 'values',
    where: ['src/kernel/modeldirector.ts (ITEM_SHAPES, itemShapeModel)', 'models/index.json', 'manifest → items[].model'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: {
      forma: 'shape', sacco: 'sack', bottiglia: 'bottle', vaso: 'jar', cesto: 'basket', frutto: 'fruit', pane: 'bread', formaggio: 'cheese',
      attrezzo: 'tool', lama: 'blade', arco: 'bow', gemma: 'gem', cristallo: 'crystal', libro: 'book', pergamena: 'scroll', abito: 'garment',
      cappello: 'hat', scarpe: 'shoes', anello: 'ring', moneta: 'coin', erba: 'herb', fiore: 'flower', fungo: 'mushroom', pietra: 'stone',
      legna: 'firewood', carne: 'meat', pesce: 'fish', chiave: 'key', candela: 'candle', lanterna: 'lantern', corda: 'rope',
    },
    note: '`forma` è il prefisso: `forma-sacco` → `shape-sack`',
  }),
  d({
    id: 'terreni',
    title: 'Nomi dei terreni del seme (diventano id con l’etichetta italiana)',
    kind: 'values',
    where: ['universe/modules/world.terrain (tiles[].name)', 'src/kernel/validator.ts (tileCode)', 'src/kernel/kernel.ts', 'prompt del Cartografo'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: {
      prato: 'meadow', sentiero: 'path', bosco: 'forest', acqua: 'water', roccia: 'rock', muro: 'wall', 'pavimento di legno': 'wooden_floor',
      porta: 'door', 'campo arato': 'plowed_field', sabbia: 'sand', giungla: 'jungle', mare: 'sea', montagna: 'mountain', neve: 'snow',
      'muro di pietra': 'stone_wall', 'muro di mattoni': 'brick_wall', 'parete di paglia': 'straw_wall', staccionata: 'fence',
      'ponte levatoio': 'drawbridge', 'pavimento di pietra': 'stone_floor', lava: 'lava', 'campo seminato': 'sown_field',
      'grano maturo': 'ripe_wheat', ceppaia: 'stump',
    },
    note: 'oggi il nome è insieme id e testo; il terreno prende un `id` e il `name` resta il testo del mondo (`world.find_tile` e `matura.in` cercano l’id, poi il nome)',
  }),
  d({
    id: 'ambienti',
    title: 'Ambienti del seme (layout)',
    kind: 'values',
    where: ['universe/modules/world.layouts (layouts)', 'maps/*.json → layout', 'world/atlas.json → ambiente', 'models/index.json → suono.ambienti', 'src/kernel/stamps.ts', 'src/audio/director.ts'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: {
      borgo: 'village', borgo_mattoni: 'brick_village', bosco: 'woods', campi: 'fields', capanne: 'huts', caserma: 'barracks', castello: 'castle',
      deserto: 'desert', dungeon: 'dungeon', fortezza: 'fortress', giungla: 'jungle', lago: 'lake', locanda: 'inn', maneggio: 'stables',
      montagne: 'mountains', piramide: 'pyramid', rovine: 'ruins', tana_drago: 'dragon_lair', tempio: 'temple', torre_mago: 'wizard_tower',
    },
    note: 'gli ambienti scritti dal Cartografo negli universi salvati sono contenuto: restano come sono',
  }),
  d({
    id: 'timbri',
    title: 'Timbri delle strutture',
    kind: 'values',
    where: ['src/kernel/stamps.ts (STAMP_SHAPES)', 'prompt del Cartografo'],
    reach: ['prompt', 'codice'],
    lang: 'en',
    step: 'T307a',
    names: {
      casa: 'house', castello: 'castle', fortezza: 'fortress', torre: 'tower', tempio: 'temple', piramide: 'pyramid', capanne: 'huts',
      recinto: 'pen', caserma: 'barracks', dungeon: 'dungeon', tana: 'lair', pozzo: 'well',
    },
  }),
  d({
    id: 'azioni-seme',
    title: 'Azioni del seme (`actions[].id`) e dei programmi (`<action name>`)',
    kind: 'values',
    where: ['universe/modules/*/manifest.json (actions)', 'universe/models/*.xml (<action>)', 'logic.lua (on_act)', 'FormComp.done'],
    reach: ['disco', 'lua'],
    lang: 'en',
    step: 'T307a',
    names: { ascolta: 'listen', attingi: 'draw', dormi: 'sleep', fruga: 'search', moneta: 'coin', raccogli: 'gather', apri: 'open', chiudi: 'close' },
    note: 'le azioni che il Concilio ha scritto negli universi salvati restano: le legge solo il loro modulo',
  }),
  d({
    id: 'rune',
    title: 'Token delle rune magiche (in latino)',
    kind: 'values',
    where: ['universe/modules/magic.runes (runes, spells)', 'universe/world/canone.md', 'src/kernel/magic.ts', 'src/kernel/kernel.ts (STARTER_RUNES)', 'rune:<token> dei frammenti'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'la',
    step: 'T307a',
    names: { luce: 'lux', fuoco: 'ignis', acqua: 'aqua', terra: 'terra', vita: 'vita', scudo: 'scutum', vento: 'ventus' },
    taken: ['x', 'y', 'speed', 'carpet', 'time', 'world', 'ecs', 'inventory', 'items', 'input', 'bus', 'ui', 'math', 'string', 'table', 'utf8', 'log', 'hash', 'pairs', 'ipairs', 'pcall', 'print', 'self', 'and', 'or', 'not', 'nil', 'true', 'false', 'end', 'do', 'if', 'then', 'else', 'for', 'in', 'local', 'function', 'return', 'while', 'repeat', 'until', 'break', 'goto'],
    note: 'le formule seguono i token (`terra fuoco` → `terra ignis`); il nome della runa (Sowilo) e dell’incantesimo (Lume) sono testo del mondo',
  }),
  d({
    id: 'elementi',
    title: 'Elementi delle rune (`element`)',
    kind: 'values',
    where: ['universe/modules/magic.runes (runes[].element)', 'src/kernel/magic.ts (validateNewRune)', 'world/canone.md'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: { luce: 'light', fuoco: 'fire', acqua: 'water', terra: 'earth', vita: 'life', protezione: 'protection', aria: 'air' },
  }),
  d({
    id: 'pannelli',
    title: 'Elementi dei pannelli (`ui.elementi[].tipo`)',
    kind: 'values',
    where: ['src/kernel/types.ts (UiElement)', 'src/ui/inventory.ts', 'manifest → ui'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: { slot: 'slot', barra: 'bar', testo: 'text', pulsante: 'button' },
  }),
  d({
    id: 'passi-banco',
    title: 'Passi e direzioni dei casi del banco',
    kind: 'values',
    where: ['src/kernel/types.ts (BenchStep, BenchWay)', 'src/kernel/bench.ts', 'manifest → casi[].passi'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307a',
    names: { togli: 'remove', pulsante: 'button', attendi: 'wait', cammina: 'walk', su: 'up', giu: 'down', sinistra: 'left', destra: 'right' },
  }),

  // --- T307b: society, work, the Council's names (contract 0.3) ------------------------------------------------------------------------
  d({
    id: 'momenti',
    title: 'Momenti del giorno',
    kind: 'values',
    where: ['src/kernel/npc/society.ts (DAY_PHASES)', 'world/people.json → routine[].quando', 'world/plots.json → tappe[].momento', 'models/index.json → suono.momenti', 'manifest → mestieri[].giornata (chiavi)'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: { mattina: 'morning', giorno: 'day', sera: 'evening', notte: 'night' },
  }),
  d({
    id: 'dove',
    title: '«Dove» della routine',
    kind: 'values',
    where: ['src/kernel/npc/society.ts (WHERES)', 'world/people.json → routine[].dove', 'world/plots.json → tappe[].dove', 'manifest → mestieri[].giornata[].dove, percorso', 'componente mestiere (i posti)'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: { casa: 'home', lavoro: 'work', piazza: 'square', 'in giro': 'about', impresa: 'venture' },
    note: '`impresa` è il posto di un compito di mestiere (il cantiere, T307b); i posti `casella:<codice>` ed `entita:<tag>` restano finché T308a non cambia i campi',
  }),
  d({
    id: 'attivita',
    title: 'Attività degli individui',
    kind: 'values',
    where: ['src/kernel/npc/society.ts (ACTIVITIES)', 'world/people.json → routine[].azione', 'componente attivita.tipo', 'src/render/entities.ts'],
    reach: ['disco', 'filo', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: {
      dorme: 'sleep', zappa: 'hoe', lavora: 'work', cucina: 'cook', mangia: 'eat', prega: 'pray', commercia: 'trade', pattuglia: 'patrol',
      chiacchiera: 'chat', legge: 'read', pesca: 'fish', taglia_legna: 'chop_wood', pascola: 'graze', passeggia: 'stroll',
    },
  }),
  d({
    id: 'specie',
    title: 'Specie e genere',
    kind: 'values',
    where: ['src/kernel/npc/society.ts (Species, Gender)', 'world/people.json → specie, genere', 'src/kernel/graph.ts'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: { persona: 'person', animale: 'animal', maschio: 'male', femmina: 'female' },
  }),
  d({
    id: 'legami',
    title: 'Tipi di legame (solo codice: la parola del legame è testo del mondo)',
    kind: 'values',
    where: ['src/kernel/npc/society.ts (KINDS, Between)'],
    reach: ['codice'],
    lang: 'en',
    step: 'T307b',
    names: {
      genitore: 'parent', figlio: 'child', fratello: 'sibling', coniuge: 'spouse', fidanzato: 'betrothed', nonno: 'grandparent', zio: 'uncle_or_aunt',
      nipote: 'grandchild_or_nephew', cugino: 'cousin', cognato: 'sibling_in_law', suocero: 'parent_in_law', genero: 'child_in_law', maestro: 'mentor',
      apprendista: 'apprentice', padrone: 'owner', servo: 'servant', animale: 'pet', amico: 'friend', rivale: 'rival', vicino: 'neighbor',
      collega: 'colleague', conoscente: 'acquaintance', stessa: 'same', persone: 'people', tutti: 'all',
    },
    note: '`legame` resta la parola nella lingua del mondo («madre»); T310 aggiunge il tipo come id nello schema',
  }),
  d({
    id: 'mestieri',
    title: 'Mestieri del seme e i loro moduli',
    kind: 'values',
    where: ['universe/modules/lavoro.* (mestieri[].id)', 'src/kernel/npc/jobs.ts (matchJob)', 'world/people.json → mestiere (via matchJob)'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: {
      boscaiolo: 'woodcutter', contadino: 'farmer', cuoco: 'cook', fabbro: 'smith', guardia: 'guard', impiegato: 'clerk', mercante: 'merchant',
      oste: 'innkeeper', pastore: 'shepherd', pescatore: 'fisher', sacerdote: 'priest', scrivano: 'scribe', qualunque: 'any',
    },
    note: 'il mestiere di un individuo (`mestiere`) è testo del mondo; `matchJob` lo lega all’id',
  }),
  d({
    id: 'comportamenti',
    title: 'Comportamenti dei mestieri (`fa`)',
    kind: 'values',
    where: ['src/kernel/npc/jobs.ts (JOB_BEHAVIOURS)', 'universe/modules/sys.lavoro/logic.lua', 'manifest → mestieri[].giornata[].fa'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: {
      vai: 'go', prendi: 'take', porta: 'carry', trasforma: 'transform', raccogli: 'gather', produci: 'produce', usa: 'use', costruisci: 'build',
      pattuglia: 'patrol', riposa: 'rest', mangia: 'eat', prega: 'pray', chiacchiera: 'chat', aspetta: 'wait',
    },
  }),
  d({
    id: 'moduli-seme',
    title: 'Id dei moduli del seme che il kernel nomina',
    kind: 'values',
    where: ['universe/modules/<id>/', 'src/kernel/kernel.ts (sys.lavoro)', 'world/people.json → tipo', 'maps/*.json → objects[].module'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: {
      'sys.lavoro': 'sys.work', 'lavoro.boscaiolo': 'job.woodcutter', 'lavoro.contadino': 'job.farmer', 'lavoro.cuoco': 'job.cook',
      'lavoro.fabbro': 'job.smith', 'lavoro.guardia': 'job.guard', 'lavoro.impiegato': 'job.clerk', 'lavoro.mercante': 'job.merchant',
      'lavoro.oste': 'job.innkeeper', 'lavoro.pastore': 'job.shepherd', 'lavoro.pescatore': 'job.fisher', 'lavoro.sacerdote': 'job.priest',
      'lavoro.scrivano': 'job.scribe', 'item.forbici': 'item.scissors', 'obj.banco': 'obj.counter', 'obj.cassa': 'obj.chest',
      'obj.credenza': 'obj.cupboard', 'obj.letto': 'obj.bed',
    },
    note: 'gli id degli oggetti (`item.cristallo-magico`), dei modelli e dei moduli scritti dal Concilio sono contenuto: restano',
  }),
  d({
    id: 'imprese',
    title: 'Tipi e stati delle imprese',
    kind: 'values',
    where: ['src/kernel/npc/ventures.ts (VENTURE_TYPES, VentureState)', 'world/imprese.json → tipo, stato', 'il pannello del cantiere'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: {
      costruzione: 'construction', raccolto: 'harvest', festa: 'feast', ricerca: 'research', bonifica: 'reclamation', viaggio: 'journey',
      elezione: 'election', 'in corso': 'active', attesa: 'waiting', ferma: 'stopped', finita: 'finished',
    },
  }),
  d({
    id: 'trame',
    title: 'Stati delle trame e delle missioni, tipi di obiettivo',
    kind: 'values',
    where: ['src/kernel/npc/plots.ts (Plot, Quest)', 'world/plots.json'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: { attiva: 'active', chiusa: 'closed', offerta: 'offered', accettata: 'accepted', compiuta: 'completed', porta: 'bring', vai: 'go', parla: 'talk' },
  }),
  d({
    id: 'suoni',
    title: 'Usi dei suoni e nomi degli effetti sonori',
    kind: 'values',
    where: ['src/mj/sound.ts (SoundPurpose)', 'src/audio/director.ts (SOUND_CUES)', 'models/index.json → suono.uso, suono.effetti', 'prompt del Musicista'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: {
      musica: 'music', effetto: 'effect', runa: 'rune', oggetto: 'item', arpeggio: 'arpeggio', incantesimo: 'spell', guasto: 'fault',
      ritorno: 'rollback', soglia: 'threshold', salto: 'jump', morte: 'death', oltre: 'beyond',
    },
    note: 'gli id dei programmi sonori del seme (`suono-musica-pietra`) seguono: `sound-music-stone`; quelli del Musicista negli universi salvati restano',
  }),
  d({
    id: 'parti',
    title: 'Parti dei modelli (`part`) e viste delle foto',
    kind: 'values',
    where: ['src/mj/engine.ts (PARTS)', 'src/mj/rig.ts', 'universe/models/*.xml (part=)', 'src/mj/photo.ts (VIEWS)', 'prompt dell’Artista'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: { gamba: 'leg', braccio: 'arm', testa: 'head', coda: 'tail', fronte: 'front', destra: 'right', retro: 'back', sinistra: 'left' },
  }),
  d({
    id: 'agenti',
    title: 'Agenti del Concilio (`AgentId`)',
    kind: 'values',
    where: ['src/kernel/agents/council.ts (AgentId)', 'prompts/agents/<agente>.md', 'world/consumi.json', 'universe.json → ai.agenti', 'models corona-gerboa-<agente>'],
    reach: ['disco', 'filo', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: {
      narratore: 'narrator', cartografo: 'cartographer', artista: 'artist', scultore: 'sculptor', fisico: 'physicist', ingegnere: 'engineer',
      arbitro: 'arbiter', referente: 'liaison', attore: 'actor', musicista: 'musician',
    },
  }),
  d({
    id: 'classi-scultore',
    title: 'Classi dello Scultore (`ai.scultori`)',
    kind: 'values',
    where: ['src/kernel/universe.ts (SCULPTOR_CLASSES)', 'universe.json → ai.scultori, ai.minimi.scultori', 'src/ui/lobby.ts'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T307b',
    names: { semplice: 'simple', figura: 'figure', struttura: 'structure', importante: 'important', artista: 'artist', musicista: 'musician' },
  }),
  d({
    id: 'coefficienti',
    title: 'Coefficienti di generazione',
    kind: 'values',
    where: ['src/kernel/coefficients.ts (COEFFICIENT_KEYS)', 'universe.json → ai.coefficienti (chiavi)', 'src/ui/lobby.ts'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T307b',
    names: {
      sessioni: 'sessions', dialoghi: 'dialogues', trame: 'plots', revisioni: 'reviews', modelli: 'models', persone: 'people',
      abitanti: 'inhabitants', pacchetti: 'packs', cose: 'entities', brani: 'pieces', luoghi: 'chunks', parole: 'words', sguardi: 'looks',
      azioni: 'actions', magia: 'magic', morte: 'death', riparazioni: 'repairs', studio: 'studio', vite: 'lives',
    },
  }),
  d({
    id: 'carte',
    title: 'Tipi delle carte e dei nodi del grafo',
    kind: 'values',
    where: ['src/kernel/cards.ts (CardKind)', 'src/kernel/graph.ts (NodeType)', 'world/carte.json', 'world/grafo.json'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T307b',
    names: {
      modulo: 'module', oggetto: 'item', ambiente: 'environment', incantesimo: 'spell', runa: 'rune', ricetta: 'recipe', modello: 'model',
      luogo: 'chunk', persona: 'individual', trama: 'plot', regola: 'rule', tipo: 'kind', regione: 'region', struttura: 'structure', fatto: 'fact',
    },
  }),
  d({
    id: 'partita',
    title: 'Modalità della partita, esiti delle mancanze',
    kind: 'values',
    where: ['src/kernel/types.ts (GameSetup.modalita)', 'universe.json → partita.modalita', 'src/kernel/shortfalls.ts (ShortfallOutcome)', 'world/mancanze.json'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T307b',
    names: { singola: 'single', multigiocatore: 'multiplayer', rifiuto: 'refusal', invalido: 'invalid', errore: 'error', guasto: 'fault' },
    note: 'l’id del viandante della partita singola (`io`) passa con T308a (dominio `viandante-solo`): è il nome di un file dei viandanti e la chiave dei saldi fuori dall’universo',
  }),
  d({
    id: 'solo-codice',
    title: 'Valori che solo il TypeScript confronta',
    kind: 'values',
    where: ['src/kernel/corona.ts (ItemKind, ShowcaseSource, ShowcaseDevice, FileLook)', 'src/kernel/chain.ts (StationKind)', 'src/kernel/screens.ts (ScreenField, AlertLevel)', 'src/kernel/situation.ts (OperationKind)', 'src/kernel/bible.ts (BibleSection)', 'src/mj/trace.ts (TraceForm)', 'src/kernel/placing.ts (SpotFailure)', 'src/mj/soundanalysis.ts (SOUND_DEFECTS)'],
    reach: ['codice'],
    lang: 'en',
    step: 'T307b',
    names: {
      grafo: 'graph', situazione: 'situation', parete: 'wall', stazione: 'station', banco: 'bench', leggio: 'lectern', lastra: 'slab',
      tornio: 'lathe', rune: 'runes', persone: 'people', cose: 'entities', oggetti: 'items', luoghi: 'chunks', schermo: 'display',
      stampante: 'printer', plastico: 'diorama', libro: 'book', cristallo: 'crystal', pergamena: 'scroll', tavoletta: 'tablet', nucleo: 'core',
      sistema: 'system', meccanica: 'mechanic', tempo: 'time', registro: 'feed', costi: 'costs', verde: 'green', ambra: 'amber', rossa: 'red',
      viandante: 'wanderer', giocatore: 'player', luogo: 'chunk', trama: 'plot', missione: 'quest', prologo: 'prologue', personaggi: 'characters',
      fatti: 'facts', misteri: 'mysteries', nodi: 'nodes', sezioni: 'sections', differenze: 'diffs', scatole: 'boxes', 'nessun-piano': 'no-shelf',
      alto: 'high', lontano: 'far', pieno: 'full', occupato: 'taken', vuoto: 'empty', piatto: 'flat', ripetitivo: 'repetitive',
      stonato: 'off_key', 'fuori volume': 'off_volume', giuntura: 'seam',
    },
    taken: ['file', 'sprite', 'tile', 'layout', 'screen', 'up', 'down', 'exit', 'desk', 'portal', 'table', 'atlas', 'showcase', 'prev', 'next', 'less', 'more', 'console', 'silos'],
    note: '`screen` c’è già (`ItemKind`): il dispositivo `schermo` diventa `display`',
  }),

  d({
    id: 'esiti-lavoro',
    title: 'Esiti dei compiti di `sys.work` e i loro motivi',
    kind: 'values',
    where: ['universe/modules/sys.work/logic.lua (B.*, M.update)', 'componente lavoro.motivo'],
    reach: ['lua'],
    lang: 'en',
    step: 'T307b',
    names: {
      finito: 'done', continua: 'ongoing', fallito: 'failed', 'nessuna via': 'no_way', 'non ci arriva': 'unreachable',
      'comportamento sconosciuto': 'unknown_behaviour', 'nessun posto': 'no_place', manca: 'missing', 'il deposito è pieno': 'deposit_full',
      'nessuna cosa da usare': 'nothing_to_use',
    },
    note: 'un esito è `done`, `ongoing` o `failed:<motivo>` (`failed:missing:item.grano`); lo legge solo il Lua del seme, e il motivo resta nel componente `lavoro` (T314)',
  }),
  d({
    id: 'suoni-seme',
    title: 'Id dei programmi sonori del seme',
    kind: 'values',
    where: ['universe/models/suono-*.xml', 'models/index.json', 'src/kernel/agents/composer.ts (EXAMPLES)', 'tests/fixtures/mj-engine-hashes.json'],
    reach: ['disco'],
    lang: 'en',
    step: 'T307b',
    names: {
      'suono-architettura-frattale': 'sound-fractal-architecture', 'suono-effetto-allarme-sirena': 'sound-effect-siren-alarm',
      'suono-effetto-arpeggio': 'sound-effect-arpeggio', 'suono-effetto-cristallo-risonante': 'sound-effect-resonant-crystal',
      'suono-effetto-cura-benedizione': 'sound-effect-healing-blessing', 'suono-effetto-dialogo-saluto': 'sound-effect-greeting',
      'suono-effetto-esplosione-crollo': 'sound-effect-explosion-collapse', 'suono-effetto-forgia-martello': 'sound-effect-forge-hammer',
      'suono-effetto-fuoco-scoppiettante': 'sound-effect-crackling-fire', 'suono-effetto-guasto': 'sound-effect-fault',
      'suono-effetto-incantesimo': 'sound-effect-spell', 'suono-effetto-meccanismo-leva': 'sound-effect-lever-mechanism',
      'suono-effetto-moneta-scambio': 'sound-effect-coin-trade', 'suono-effetto-morte': 'sound-effect-death', 'suono-effetto-morte-v2': 'sound-effect-death-v2',
      'suono-effetto-oggetto': 'sound-effect-item', 'suono-effetto-passo-acqua': 'sound-effect-water-step', 'suono-effetto-passo-metallo': 'sound-effect-metal-step',
      'suono-effetto-porta-pesante': 'sound-effect-heavy-door', 'suono-effetto-ritorno': 'sound-effect-rollback', 'suono-effetto-runa': 'sound-effect-rune',
      'suono-effetto-salita-livello': 'sound-effect-level-up', 'suono-effetto-salto': 'sound-effect-jump', 'suono-effetto-scarica-elettrica': 'sound-effect-electric-discharge',
      'suono-effetto-scoperta-segreto': 'sound-effect-secret-found', 'suono-effetto-soglia': 'sound-effect-threshold', 'suono-effetto-teletrasporto': 'sound-effect-teleport',
      'suono-effetto-vapore-pressione': 'sound-effect-steam-pressure', 'suono-effetto-veleno-danno': 'sound-effect-poison-damage', 'suono-effetto-vento-alta-quota': 'sound-effect-high-wind',
      'suono-fantasy-citta-locanda': 'sound-fantasy-town-inn', 'suono-fantasy-esplorazione-giorno': 'sound-fantasy-exploration-day',
      'suono-fantasy-esplorazione-notte': 'sound-fantasy-exploration-night', 'suono-fantasy-luogo-sacro': 'sound-fantasy-sacred-place',
      'suono-fantasy-sotterraneo-abisso': 'sound-fantasy-abyss-dungeon', 'suono-fantasy-tensione-pericolo': 'sound-fantasy-danger-tension',
      'suono-fuga-cellulare': 'sound-cellular-fugue', 'suono-musica-notte': 'sound-music-night', 'suono-musica-oltre': 'sound-music-beyond',
      'suono-musica-pastorale': 'sound-music-pastoral', 'suono-musica-pietra': 'sound-music-stone', 'suono-musica-profondo': 'sound-music-deep',
      'suono-musica-selva': 'sound-music-woods', 'suono-musica-tramonto': 'sound-music-sunset', 'suono-scontro-finale': 'sound-final-battle',
      'suono-sentiero-melodico': 'sound-melodic-path',
    },
    note: 'i programmi sonori che il Musicista ha scritto negli universi salvati restano; i suoi nuovi nascono `sound-<uso>-<nome>`. La classe `suono` dell’indice resta (T308a)',
  }),

  // --- T308a: the fields and the files of a universe (contract 0.4) --------------------------------------------------------------------
  d({
    id: 'viandante-solo',
    title: 'L’id del viandante della partita singola',
    kind: 'values',
    where: ['src/kernel/wanderers.ts (SOLO)', 'world/giocatori/io.json', 'universe.json → partita.master', 'carta → autore, pagante, titolare', 'universes/.saldi/<nome>.json'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: { io: 'me' },
    note: 'spostato da T307b (che aveva `io` fra le modalità): cambia con i percorsi dei viandanti (`world/giocatori/` → `world/players/`) e con le cartelle dei saldi, che T308a porta insieme leggendo anche il nome vecchio',
  }),
  d({
    id: 'campi-universe',
    title: 'Campi di `universe.json`',
    kind: 'fields',
    where: ['src/kernel/types.ts (UniverseConfig, AiConfig, GameSetup)', 'src/kernel/coefficients.ts (ActorConfig)', 'src/kernel/heritage.ts', 'src/session/files.ts (UNIVERSE_FIELDS)'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: {
      partita: 'game', modalita: 'mode', morte: 'death', altroTraGiocatori: 'freeActionsBetweenPlayers', rilievo: 'relief', mare: 'sea',
      eredita: 'heritage', copia: 'copy', scultori: 'sculptors', agenti: 'agents', coefficienti: 'coefficients', minimi: 'minimums', tetto: 'cap',
      attore: 'actor', acceso: 'on', modello: 'model', maxBrani: 'maxPieces',
    },
  }),
  d({
    id: 'campi-manifest',
    title: 'Campi dei manifest (aspetto, terreni, pannelli, casi, mestieri)',
    kind: 'fields',
    where: ['src/kernel/types.ts (Manifest, Appearance, TerrainDef, UiPanel, BenchCase)', 'src/kernel/npc/jobs.ts (JobProgram, JobTask)', 'src/kernel/validator.ts'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T308a',
    names: {
      aspetto: 'look', classe: 'class', taglia: 'size', matura: 'ripens', dopo: 'after', titolo: 'title', descrizione: 'description',
      elementi: 'elements', tipo: 'type', etichetta: 'label', accetta: 'accepts', campo: 'field', colore: 'color', casi: 'cases', racconto: 'story',
      terreno: 'terrain', viandante: 'wanderer', componenti: 'components', oggetti: 'items', cose: 'entities', modulo: 'module', passi: 'steps',
      durata: 'duration', guarda: 'watch', righe: 'lines', nome: 'name', posto: 'slot', categoria: 'category', secondi: 'seconds', verso: 'toward',
      oggetto: 'item', azione: 'action', mestieri: 'jobs', nomi: 'names', giornata: 'day', fa: 'does', dove: 'where', da: 'from', a: 'to',
      casella: 'tile', lascia: 'drop', con: 'with', quante: 'count', posa: 'pose', dice: 'says', percorso: 'route', persona: 'persona',
      entita: 'entity',
    },
    note: '`posto` è la tasca di un oggetto di prova nei casi e il posto di lavoro nei mestieri (`workplace`): i due stanno in oggetti diversi; qui la tasca',
  }),
  d({
    id: 'campi-mestieri',
    title: 'Campi dei programmi di mestiere che cambiano senso',
    kind: 'fields',
    where: ['src/kernel/npc/jobs.ts (JobProgram.posto)'],
    reach: ['disco', 'lua'],
    lang: 'en',
    step: 'T308a',
    names: { posto: 'workplace' },
    note: 'l’`azione` di un compito è l’id di un’azione della cosa, `action` come nei casi (`campi-manifest`); la `posa` è l’attività',
  }),
  d({
    id: 'campi-regole',
    title: 'Campi di `world/rules.json`',
    kind: 'fields',
    where: ['src/kernel/types.ts (Rule)', 'src/kernel/kernel.ts'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: { regole: 'rules', chiave: 'key', testo: 'text', possibile: 'possible', racconto: 'story', effetti: 'effects', carta: 'card' },
  }),
  d({
    id: 'campi-persone',
    title: 'Campi di `world/people.json`',
    kind: 'fields',
    where: ['src/kernel/npc/society.ts (People, Individual, Relation, RoutineStep, Memory, IndividualSheet)', 'src/kernel/agents/minds.ts'],
    reach: ['disco', 'filo', 'prompt'],
    lang: 'en',
    step: 'T308a',
    names: {
      persone: 'people', attesi: 'expected', di: 'of', nome: 'name', legame: 'bond', specie: 'species', genere: 'gender', tipo: 'kind',
      mestiere: 'job', eta: 'age', famiglia: 'family', storia: 'story', luogo: 'place', origine: 'origin', persona: 'persona', aspetto: 'look',
      porta: 'carries', indossa: 'wears', ricordi: 'memories', legameViandante: 'wandererBond', scheda: 'sheet', testo: 'text', impronta: 'fingerprint',
      viandante: 'wanderer', quando: 'when', fa: 'does', dove: 'where', azione: 'activity', con: 'with', peso: 'weight',
    },
  }),
  d({
    id: 'campi-trame',
    title: 'Campi di `world/plots.json`',
    kind: 'fields',
    where: ['src/kernel/npc/plots.ts (Plot, Beat, Quest)'],
    reach: ['disco', 'filo', 'prompt'],
    lang: 'en',
    step: 'T308a',
    names: {
      titolo: 'title', mistero: 'mystery', coinvolti: 'involved', tappe: 'beats', missione: 'quest', inizio: 'start', stato: 'state', giorno: 'day',
      momento: 'moment', chi: 'who', dove: 'where', cosa: 'what', battuta: 'line', indizio: 'clue', fatto: 'done', da: 'from', testo: 'text',
      obiettivo: 'goal', ricompensa: 'reward', viandante: 'wanderer', tipo: 'type', oggetto: 'item', a: 'to', luogo: 'place', trame: 'plots',
    },
  }),
  d({
    id: 'campi-bibbia',
    title: 'Campi di `world/bible.json`',
    kind: 'fields',
    where: ['src/kernel/agents/council.ts (Bible, readBible)', 'src/kernel/bible.ts'],
    reach: ['disco', 'filo', 'prompt'],
    lang: 'en',
    step: 'T308a',
    names: {
      titolo: 'title', tono: 'tone', sintesi: 'summary', storia: 'history', luoghi: 'places', personaggi: 'characters', fatti: 'facts',
      misteri: 'mysteries', usanze: 'customs', crepe: 'cracks',
    },
    note: '`crepe` è delle bibbie vecchie (ADR-0025): la migrazione lo toglie',
  }),
  d({
    id: 'campi-atlante',
    title: 'Campi di `world/atlas.json`',
    kind: 'fields',
    where: ['src/kernel/atlas.ts (Atlas, Region)'],
    reach: ['disco', 'filo', 'prompt'],
    lang: 'en',
    step: 'T308a',
    names: { regioni: 'regions', nome: 'name', descrizione: 'description', ambiente: 'environment', centro: 'center', raggio: 'radius' },
  }),
  d({
    id: 'campi-stato',
    title: 'Campi di `world/stato.json`',
    kind: 'fields',
    where: ['src/kernel/kernel.ts (STATE_FIELDS)', 'src/kernel/placing.ts (PlacedRecord)'],
    reach: ['disco'],
    lang: 'en',
    step: 'T308a',
    names: { consumati: 'consumed', contenitori: 'containers', forme: 'forms', rari: 'rares', ora: 'time', importanti: 'important', viandante: 'wanderer', posati: 'placed' },
    note: '`importanti` e `viandante` sono di prima di T245a: la migrazione li porta in `rari` e in `world/players/me.json`',
  }),
  d({
    id: 'campi-viandante',
    title: 'Campi di `world/giocatori/<id>.json`',
    kind: 'fields',
    where: ['src/kernel/kernel.ts (WANDERER_FIELDS)', 'src/kernel/wanderers.ts (WandererState, Profile)', 'src/session/files.ts (playerFiles)'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: { nome: 'name', profilo: 'profile', seme: 'seed', tinta: 'tint', presentazione: 'introduction', stati: 'states', trasceso: 'transcended', anonimo: 'anonymous', crediti: 'credits' },
    note: '`crediti` non si scrive più (ADR-0104): la migrazione lo toglie; l’id del viandante solo `io` diventa `me`',
  }),
  d({
    id: 'campi-imprese',
    title: 'Campi di `world/imprese.json`',
    kind: 'fields',
    where: ['src/kernel/npc/ventures.ts (Venture, VenturePhase, VentureRole, VentureMember, VentureTask)'],
    reach: ['disco', 'lua', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: {
      imprese: 'ventures', titolo: 'title', tipo: 'type', stato: 'state', luogo: 'chunk', posto: 'spot', lotto: 'lot', origine: 'origin',
      modello: 'model', concetto: 'concept', classe: 'class', taglia: 'size', seme: 'seed', fasi: 'phases', nome: 'name', materiali: 'materials',
      lavoro: 'work', stadio: 'stage', ruoli: 'roles', ruolo: 'role', mestiere: 'job', quanti: 'count', portati: 'brought', lavorato: 'worked',
      squadra: 'team', inizio: 'start', ultimo: 'last', fine: 'end', scade: 'expires', compito: 'task', casella: 'tile', oggetto: 'item',
      lascia: 'drop', durata: 'duration', posa: 'pose', nato_da: 'born_from', carta: 'card',
    },
  }),
  d({
    id: 'campi-carte',
    title: 'Campi delle carte, dei consumi e delle mancanze',
    kind: 'fields',
    where: ['src/kernel/cards.ts (CardStamp, CardsFile, Received)', 'src/kernel/heritage.ts (CardOrigin)', 'src/kernel/ai/usage.ts (UsageFile, CallRecord)', 'src/kernel/shortfalls.ts (ShortfallNote)'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: {
      carta: 'card', autore: 'author', pagante: 'payer', titolare: 'holder', origini: 'origins', universo: 'universe', impronta: 'fingerprint',
      utilizzi: 'uses', luoghi: 'chunks', trame: 'plots', allaNascita: 'atBirth', quota: 'share', ricevuto: 'received', prezzi: 'prices',
      giorni: 'days', paganti: 'payers', chi: 'who', richiesta: 'request', agente: 'agent', compito: 'task', esito: 'outcome', motivo: 'reason',
      nome: 'name', voci: 'entries', volte: 'times', primo: 'first', ultimo: 'last',
    },
    note: '`carta` sta in quasi ogni file del Concilio (piani, regole, trame, imprese): la migrazione lo cambia ovunque. `nome` è delle carte dei luoghi, `voci`, `volte`, `primo` e `ultimo` di `world/shortfalls.json`',
  }),
  d({
    id: 'campi-piani',
    title: 'Campi dei piani dei luoghi (`maps/*.json`)',
    kind: 'fields',
    where: ['src/kernel/agents/cartography.ts (ChunkPlan, PlannedHouse)', 'src/kernel/chunks.ts', 'src/session/protocol.ts (ChunkView)'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: {
      strutture: 'structures', concetto: 'concept', taglia: 'size', giorni: 'days', stadi: 'stages', case: 'houses', origine: 'origin',
      modello: 'model', seme: 'seed', classe: 'class', stadio: 'stage', visto: 'seen', scavi: 'digs', acqua: 'water', carta: 'card',
    },
  }),
  d({
    id: 'campi-modelli',
    title: 'Campi di `models/index.json` e attributi dei programmi',
    kind: 'fields',
    where: ['src/kernel/forms.ts (ModelInfo)', 'src/mj/sound.ts (SoundPurpose)', 'src/mj/model.ts (suolo)'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T308a',
    names: {
      classe: 'class', taglia: 'size', nome: 'name', autore: 'author', voto: 'score', tinta: 'tint', tempo: 'time', sotto: 'cellar',
      consigli: 'advice', problemi: 'problems', suono: 'sound', uso: 'use', ambienti: 'environments', momenti: 'moments', oltre: 'beyond',
      effetti: 'effects', suolo: 'soil',
    },
    taken: ['ground'],
    note: '`suolo="E"` è un attributo degli XML (ADR-0135); `ground` c’è già (il primo strato di MarkovJunior): diventa `soil`, come nel codice',
  }),
  d({
    id: 'percorsi',
    title: 'Percorsi dell’universo e del server',
    kind: 'paths',
    where: ['src/kernel/paths.ts (allowedPath, councilMayWrite)', 'src/session/files.ts', 'src/kernel/*.ts (le costanti dei file)', 'server/*.ts'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: {
      'world/giocatori/': 'world/players/', 'world/imprese.json': 'world/ventures.json', 'world/magazzino/': 'world/stores/',
      'world/stato.json': 'world/state.json', 'world/consumi.json': 'world/usage.json', 'world/mancanze.json': 'world/shortfalls.json',
      'world/carte.json': 'world/cards.json', 'world/grafo.json': 'world/graph.json', 'world/canone.md': 'world/canon.md',
      'world/lessico.md': 'world/lexicon.md', 'universes/.cestino/': 'universes/.trash/', 'universes/.saldi/': 'universes/.balances/',
      'universes/.coda/': 'universes/.queue/', 'universes/.accesi/': 'universes/.running/', 'universes/.generazione/': 'universes/.generation/',
      'universes/.spesa-gemini.json': 'universes/.gemini-spend.json', 'quine:fila:': 'quine:owed:',
    },
    note: '`prompts/agents/<agente>.md` segue gli id degli agenti (T307b); `quine:fila:` è la chiave di `localStorage` (T265), letta anche col nome vecchio',
  }),

  // --- T308b: the wire and Lua (contract 0.5) ------------------------------------------------------------------------------------------
  d({
    id: 'messaggi',
    title: 'Messaggi del protocollo (`t`)',
    kind: 'values',
    where: ['src/session/protocol.ts (ClientMsg, ServerMsg)', 'src/session/server.ts (LIMITS)', 'src/session/thin.ts', 'src/session/client.ts'],
    reach: ['filo'],
    lang: 'en',
    step: 'T308b',
    names: {
      entra: 'join', profilo: 'profile', passo: 'step', tasti: 'keys', frase: 'phrase', incidi: 'inscribe', pronuncia: 'cast', azione: 'action',
      altro: 'other', chat: 'chat', dici: 'say', dai: 'give', oggetto: 'item', contenitore: 'container', fabbrica: 'craft', pannello: 'panel',
      casella: 'tile', ramo: 'branch', pubblica: 'publish', segui: 'follow', agente: 'agent', ricarica: 'recharge', ingresso: 'welcome',
      aggiorna: 'update', correzione: 'correction', esito: 'result', rifiuto: 'refusal', mondo: 'world', concilio: 'council', file: 'file',
      carta: 'card',
    },
    note: '`card` (T296, ADR-0172: il master toglie una carta portata) nasce inglese; `carta` è solo la parola del concetto, nessun client l’ha mandata',
  }),
  d({
    id: 'valori-filo',
    title: 'Operazioni e stati sul filo',
    kind: 'values',
    where: ['src/session/protocol.ts (ItemOp, contenitore.op, pannello.op, mondo.stato, Notice)'],
    reach: ['filo'],
    lang: 'en',
    step: 'T308b',
    names: {
      usa: 'use', impugna: 'wield', posa: 'put_down', sposta: 'move', in_borsa: 'to_bag', da_borsa: 'from_bag', azione: 'action', apri: 'open',
      prendi: 'take', metti: 'put', togli: 'remove', pulsante: 'button', fermo: 'stopped', ripreso: 'resumed', ripartito: 'restarted',
      dici: 'say', dai: 'give', altro: 'other', morte: 'death', crediti: 'credits', qui: 'here', piazza: 'square', finiti: 'exhausted', tetto: 'cap',
    },
  }),
  d({
    id: 'campi-filo',
    title: 'Campi dei messaggi',
    kind: 'fields',
    where: ['src/session/protocol.ts', 'src/session/files.ts', 'src/session/thin.ts'],
    reach: ['filo'],
    lang: 'en',
    step: 'T308b',
    names: {
      ora: 'time', stati: 'states', crediti: 'credits', campi: 'fields', nome: 'name', descrizione: 'description', lotti: 'lots', mare: 'sea',
      scavi: 'digs', acqua: 'water', testo: 'text', presentazione: 'introduction', profilo: 'profile', tetto: 'cap', regolazioni: 'settings',
      tenuti: 'held', entita: 'entity', azione: 'action', viandante: 'wanderer', quanti: 'count', verso: 'toward', borsa: 'bag', ricetta: 'recipe',
      unisci: 'combine', pannello: 'panel', posto: 'socket', agente: 'agent', riparato: 'repaired', riparati: 'repaired', motivo: 'reason',
      anonimo: 'anonymous', commissione: 'fee', concilio: 'council', ramo: 'branch', forma: 'form', stato: 'state', luoghi: 'chunks',
      cose: 'entities', viandanti: 'wanderers', giocatori: 'players', via: 'gone', partiti: 'departed', avvisi: 'notices', fatto: 'done',
      messaggi: 'messages', dialoghi: 'dialogues', contenitore: 'container', voci: 'entries', apri: 'open', tipo: 'type', da: 'from', perso: 'lost',
      dove: 'where',
    },
    note: '`posto` (il posto di un pannello) diventa `socket` perché nello stesso messaggio c’è già `slot` (la tasca)',
  }),
  d({
    id: 'componenti',
    title: 'Componenti visibili a Lua',
    kind: 'values',
    where: ['src/session/protocol.ts (ENTITY_PARTS)', 'src/kernel/kernel.ts', 'src/render/entities.ts', 'logic.lua (ecs.get/set/each)', 'prompt dell’Ingegnere'],
    reach: ['disco', 'filo', 'lua', 'prompt'],
    lang: 'en',
    step: 'T308b',
    names: {
      luce: 'light', fuoco: 'fire', effimero: 'ephemeral', scudo: 'shield', meta: 'goal', stati: 'states', attivita: 'activity', posato: 'placed',
      struttura: 'structure', salto: 'jump', lavoro: 'work', carico: 'load', mestiere: 'job', cantiere: 'worksite', raccolto: 'harvested',
      frugato: 'searched',
    },
    taken: ['pos', 'form', 'identity', 'pickup', 'module', 'origin', 'inventory', 'container', 'body', 'mind', 'chunk', 'rune', 'glyph', 'player', 'remote', 'needs', 'slots', 'wander', 'carpet', 'interact', 'hand'],
  }),
  d({
    id: 'campi-componenti',
    title: 'Campi dei componenti',
    kind: 'fields',
    where: ['src/kernel/kernel.ts', 'universe/modules/*/logic.lua', 'src/render/entities.ts'],
    reach: ['filo', 'lua', 'prompt'],
    lang: 'en',
    step: 'T308b',
    names: {
      raggio: 'radius', accesa: 'lit', colore: 'color', daStato: 'fromState', fino: 'expires', spento: 'off', tipo: 'kind', ferma: 'still',
      stadio: 'stage', fase: 'phase', giorno: 'day', impresa: 'venture', passo: 'step', motivo: 'reason', si: 'yes', luogo: 'chunk',
      compiti: 'tasks', impresa_posto: 'venture_spot', concetto: 'concept', classe: 'class', taglia: 'size', velocita: 'speed', peso: 'weight',
      luce: 'light', da: 'from', a: 'to', alto: 'peak', titolo: 'title', stato: 'state', manca: 'missing', squadra: 'team', fame: 'hunger',
      sete: 'thirst', morto: 'dead',
    },
    // Lua reads them as `c.field`: a reserved word would not compile (`fino` is `expires`, not `until`).
    taken: ['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while'],
    note:
      'per componente: `luce {raggio, accesa, colore, daStato}`, `fuoco {raggio}`, `effimero {fino}`, `scudo {fino, spento}`, ogni stato di `stati {velocita, peso, luce, fino}`, `attivita {tipo, ferma}`, `struttura {concetto, classe, taglia, stadio}`, `salto {da, a, alto}`, `lavoro {fase, giorno, impresa, passo, motivo, fino}`, `mestiere {fase, giorno, luogo, compiti, impresa, impresa_posto}` (i compiti con i campi dei programmi dei mestieri), `cantiere {titolo, fase, stato, manca, squadra}`, `raccolto` e `frugato {si}`, `player {passo}`, `needs {morto}`; `fame` e `sete` sono i campi dell’evento `death`. `fino` diventa `expires` e non `until`, parola riservata di Lua. Lo stato privato di `sys.work` nel suo `lavoro` (`fatti`, `tappa`, `arrivato`…) lo legge solo il suo Lua e resta',
  }),
  d({
    id: 'api-lua',
    title: 'Nomi dell’API Lua, eventi del bus, chiavi del magazzino',
    kind: 'values',
    where: ['src/kernel/validator.ts (LUA_API)', 'src/kernel/sandbox.ts (Host)', 'src/kernel/prelude.lua', 'universe/modules/sys.needs/logic.lua', 'universe/modules/sys.work/logic.lua', 'prompt dell’Ingegnere'],
    reach: ['lua', 'prompt'],
    lang: 'en',
    step: 'T308b',
    names: { 'world.impresa': 'world.venture', 'world.impresa_porta': 'world.venture_bring', morte: 'death', 'deposito:': 'deposit:', cantiere: 'worksite', porta: 'bring' },
    note: '`cantiere` è il pannello di `sys.work` e `porta` il suo pulsante; `deposito:` la chiave del deposito di un luogo nel magazzino di `sys.work`; il resto dell’API (hook, `world.player`) è già inglese',
  }),
  // --- T310b: the values the Council's schemas still listed in Italian, and the fields of its answers (contract 0.7) --------------------
  d({
    id: 'dove-piano',
    title: '«Dove» di una cosa in un piano (dentro o fuori i lotti)',
    kind: 'values',
    where: ['src/kernel/agents/cartography.ts (Where, WHERE)', 'src/kernel/kernel.ts (placeEntities)', 'maps/*.json → objects[].where, fresh[].where'],
    reach: ['disco', 'filo', 'prompt'],
    lang: 'en',
    step: 'T310b',
    names: { dentro: 'inside', fuori: 'outside', ovunque: 'anywhere' },
    note: 'non è il «dove» della routine (`dove`, T307b): quello dice un posto della vita di un individuo, questo se una cosa sta dentro i lotti o fuori',
  }),
  d({
    id: 'tipi-ambiente',
    title: 'Tipi di ambiente (all’aperto, al chiuso, misto)',
    kind: 'values',
    where: ['src/kernel/types.ts (EnvironmentDef.environment)', 'src/kernel/agents/cartography.ts', 'manifest → layouts[].environment'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T310b',
    names: { esterno: 'outdoor', interno: 'indoor', misto: 'mixed' },
  }),
  d({
    id: 'direzioni',
    title: 'Direzioni della bussola',
    kind: 'values',
    where: ['src/kernel/atlas.ts (COMPASS, direction, directionVector)', 'src/kernel/agents/cartography.ts (REGION_SCHEMA)'],
    reach: ['prompt', 'codice'],
    lang: 'en',
    step: 'T310b',
    names: { nord: 'north', 'nord-est': 'north-east', est: 'east', 'sud-est': 'south-east', sud: 'south', 'sud-ovest': 'south-west', ovest: 'west', 'nord-ovest': 'north-west', qui: 'here' },
    note: 'nel testo del mondo la direzione si dice nella sua lingua (`directionWord`); il Cartografo la scrive come id',
  }),
  d({
    id: 'tipi-fucina',
    title: 'Tipi di ciò che la Fucina crea',
    kind: 'values',
    where: ['src/kernel/agents/forge.ts (Concept.type, ForgeRequest.kind)', 'src/kernel/agents/genesis.ts (CastEntry.type)', 'src/kernel/kernel.ts (forgeModule)'],
    reach: ['prompt', 'codice'],
    lang: 'en',
    step: 'T310b',
    names: { npc: 'npc', oggetto: 'object', strumento: 'item' },
    note: 'un `item` va nell’inventario (`kind: item` del manifest), un `object` sta nel mondo; i prefissi degli id (`npc.`, `obj.`, `item.`) non cambiano',
  }),
  d({
    id: 'azioni-npc',
    title: 'Azioni di un individuo in un dialogo e modi della sua mente (`mind.mode`)',
    kind: 'values',
    where: ['src/kernel/agents/minds.ts (NPC_ACTIONS)', 'src/kernel/npc/model.ts (Mind.mode)', 'universe/modules/sys.follow, sys.wander, sys.work (logic.lua)', 'manifest → components.mind.mode, cases'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T310b',
    names: { nessuna: 'none', segui: 'follow', resta: 'stay', vaga: 'wander', dai: 'give', missione: 'quest' },
    note: '`wander`, `follow` e `stay` sono anche i modi della mente che Lua legge (`mind.mode`)',
  }),
  d({
    id: 'incarichi',
    title: 'Incarichi del Referente e interventi della sessione del Concilio',
    kind: 'values',
    where: ['src/kernel/agents/minds.ts (REFERENTE_SCHEMA)', 'src/kernel/agents/effects.ts (SESSION_SCHEMA, councilSession)', 'src/kernel/kernel.ts (liaison, councilSession)'],
    reach: ['prompt', 'codice'],
    lang: 'en',
    step: 'T310b',
    names: {
      nessuno: 'none', oggetti: 'items', abitante: 'inhabitant', cosa: 'thing', meccanica: 'mechanic', runa: 'rune', oggetto: 'item', personaggio: 'character',
      ambiente: 'environment', regola: 'rule', riscolpisci: 'resculpt', musica: 'music',
    },
    note: '`oggetto` del Referente è uno strumento (`item`, come lo crea la Fucina), `cosa` una cosa del mondo (`object` per la Fucina)',
  }),
  d({
    id: 'posti',
    title: 'Posti degli oggetti (dove si indossano o si impugnano)',
    kind: 'values',
    where: ['src/kernel/agents/content.ts (ITEM_SCHEMA.slot)', 'src/kernel/wearing.ts (SLOT_ZONES)', 'src/mj/hold.ts (SLOT_MOUNTS)', 'manifest → items[].slot, ui.elements[].accepts', 'prompt dell’Ingegnere'],
    reach: ['disco', 'lua', 'filo', 'prompt'],
    lang: 'en',
    step: 'T310b',
    names: { testa: 'head', corpo: 'torso', gambe: 'legs', piedi: 'feet', mani: 'hands', arma: 'weapon', scudo: 'shield', anello: 'ring', collo: 'neck', schiena: 'back' },
    note: 'gli id degli slot di un pannello (`ui.elements[].id`) sono parole del modulo, come le sue azioni: non cambiano; cambiano i posti delle cose e ciò che uno slot accetta',
  }),
  d({
    id: 'ruoli-timbri',
    title: 'Ruoli dei codici di un timbro (`codes`)',
    kind: 'values',
    where: ['src/kernel/stamps.ts (StampCodes, STAMP_ROLES)', 'src/kernel/mj.ts (stamp)', 'manifest → layouts[].program (stamp.codes)', 'prompt del Cartografo'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T310b',
    names: { muro: 'wall', pavimento: 'floor', porta: 'door', acqua: 'water', ponte: 'bridge', terreno: 'ground', strada: 'road', roccia: 'rock', recinto: 'fence' },
  }),
  d({
    id: 'interazioni',
    title: 'Interazioni di un concetto della Fucina',
    kind: 'values',
    where: ['src/kernel/agents/forge.ts (Concept.interaction)'],
    reach: ['prompt', 'codice'],
    lang: 'en',
    step: 'T310b',
    names: { parla: 'talk', leggi: 'read', usa: 'use', nessuna: 'none' },
    note: 'nel manifest diventano `interaction.type` (`talk`, `read`, `lua`), già inglesi',
  }),
  d({
    id: 'comandi',
    title: 'Comandi di uno strumento (`item.controls`)',
    kind: 'values',
    where: ['src/kernel/agents/forge.ts (Concept.controls[].action, requiredHooks)', 'manifest → item.controls (chiavi)'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T310b',
    names: { usa: 'use', azione: 'action' },
  }),
  d({
    id: 'ripartenza',
    title: 'Dove si riapre gli occhi dopo la morte',
    kind: 'values',
    where: ['src/kernel/agents/effects.ts (DEATH_SCHEMA)', 'src/kernel/gameSetup.ts (fallbackDeath)', 'src/kernel/kernel.ts'],
    reach: ['prompt', 'codice'],
    lang: 'en',
    step: 'T310b',
    names: { qui: 'here', piazza: 'square' },
    note: 'le stesse parole dell’avviso sul filo (`valori-filo`)',
  }),
  d({
    id: 'bonus',
    title: 'Bonus di una cosa indossata o impugnata',
    kind: 'values',
    where: ['src/kernel/agents/content.ts (ITEM_SCHEMA.bonus)', 'src/kernel/kernel.ts (item_bonus)', 'manifest → items[].bonus (chiavi)', 'Lua: items.bonus(id, nome)', 'prompt dell’Ingegnere'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T310b',
    names: { difesa: 'defense', attacco: 'attack', velocita: 'speed', peso: 'weight', luce: 'light', calore: 'warmth' },
  }),
  d({
    id: 'campi-risposte',
    title: 'Campi delle risposte del Concilio (gli schemi delle richieste)',
    kind: 'fields',
    where: ['src/kernel/agents/*.ts (gli schemi)', 'src/kernel/ai/mock.ts', 'src/kernel/agents/council.ts (ask: internalAnswer)'],
    reach: ['prompt'],
    lang: 'en',
    step: 'T310b',
    names: {
      nome: 'name', descrizione: 'description', testo: 'text', titolo: 'title', racconto: 'story', possibile: 'possible', dice: 'say', azione: 'action',
      oggetto: 'item', umore: 'mood', oggetti_citati: 'mentioned', ricordo: 'memory', importanza: 'weight', legame: 'bond', scheda: 'sheet', risposta: 'reply',
      incarico: 'task', richiesta: 'request', bersaglio: 'target', rifiuto: 'refusal', richiesta_fucina: 'forge_request', battute: 'lines', chi: 'who',
      ricordo_a: 'memory_a', ricordo_b: 'memory_b', mistero: 'mystery', coinvolti: 'involved', tappe: 'beats', giorno: 'day', momento: 'moment', dove: 'where',
      cosa: 'what', battuta: 'line', indizio: 'clue', missione: 'quest', da: 'from', tipo: 'type', a: 'to', luogo: 'place', ricompensa: 'reward',
      categoria: 'category', peso: 'weight', pila: 'stack', effetti: 'effects', fame: 'hunger', sete: 'thirst', energia: 'energy', salute: 'health',
      impugnabile: 'equippable', contenitore: 'container', posto: 'slot', aspetto: 'look', forma: 'shape', correzioni: 'fixes', nota: 'note',
      approvato: 'approved', problemi: 'problems', agente: 'agent', problema: 'problem', ricette: 'recipes', ingredienti: 'inputs', quantita: 'quantity',
      attrezzi: 'tools', risultato: 'result', bottino: 'loot', tabella: 'table', voci: 'entries', porta: 'carries', indossa: 'wears', mestiere: 'job',
      genere: 'gender', eta: 'age', famiglia: 'family', quando: 'when', fa: 'does', ambiente: 'environment', modulo: 'module', a_terra: 'ground',
      nuovi: 'fresh', concetto: 'concept', rune: 'runes', strutture: 'structures', taglia: 'size', ambienti: 'environments', programma_json: 'program_json',
      direzione: 'direction', distanza: 'distance', raggio: 'radius', usa_ambiente: 'reuse', nuovi_terreni: 'new_terrains', codice: 'code', colore: 'color',
      strato: 'layer', solido: 'solid', interno: 'indoor', regione: 'region', tono: 'tone', sintesi: 'summary', luoghi: 'places', personaggi: 'characters',
      fatti: 'facts', misteri: 'mysteries', usanze: 'customs', stile: 'style', forme: 'shapes', luce: 'light', regole: 'rules', protagonista: 'protagonist',
      case_comuni: 'common_houses', terreni: 'terrains', velocita: 'speed', tetto: 'roof', moduli: 'modules', classe: 'class', contesto: 'context',
      rarita: 'rarity', interazione: 'interaction', comandi: 'controls', unico: 'unique', azioni: 'actions', etichetta: 'label', richiede: 'requires',
      capienza: 'capacity', spingibile: 'pushable', massa: 'mass', attrito: 'friction', impilabile: 'stackable', max_pila: 'max_stack',
      equipaggiabile: 'equippable', componenti_json: 'components_json', spiegazione: 'reason', ripetibile: 'repeatable', serve: 'requires', costo: 'cost',
      runa_nuova: 'new_rune', glifo: 'glyph', elemento: 'element', canone: 'canon', valutazione: 'assessment', intervento: 'action', perde_tutto: 'lose_all',
      ripartenza: 'restart', viandante_json: 'wanderer_json', passi: 'steps', verso: 'toward', secondi: 'seconds', durata: 'duration', guarda: 'watch',
      righe: 'lines', pannello: 'panel', elementi: 'elements', accetta: 'accepts', campo: 'field', logica: 'logic', casi: 'cases', voto: 'score',
      riconoscibile: 'recognizable', consigli: 'advice', programma: 'program', uso: 'use', momenti: 'moments', effetto: 'effect', ritira: 'withdraw',
      motivo: 'reason',
    },
    note:
      'una tabella sola per ogni risposta, letta a ogni profondità (`internalAnswer`): la stessa parola italiana vale lo stesso in ogni schema. Tre non ci sono perché cambiano senso: `storia` è `history` nella bibbia e `story` in una persona, `oggetti` sono `items` di un pacchetto e `objects` di un piano, `tag` è l’elenco `tags` di una cosa e il `tag` di una voce di bottino; li legge ciascun lettore',
  }),
];

/**
 * A Council's answer (parsed JSON) with the fields of its schema in English (T310b, contract 0.7): every key the table `campi-risposte`
 * names, at any depth, so an answer written with the Italian fields of before (a local model, a recorded one) still reads. A key whose
 * English name is there already gives way to it. `storia`, `oggetti` and `tag` are not in the table (they change meaning from one
 * schema to another): each reader takes its own. Strings (programs, `components_json`) are not touched.
 */
export function internalAnswer<T>(raw: T): T {
  const names = INTERNAL_NAMES.find((x) => x.id === 'campi-risposte')!.names;
  const port = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(port);
    if (!isRecord(v)) return v;
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const key = Object.hasOwn(names, k) ? names[k] : k;
      if (key !== k && Object.hasOwn(v, key)) continue;
      out[key] = port(x);
    }
    return out;
  };
  return port(raw) as T;
}

/** The internal name of an Italian value of a domain; the value itself when the table does not name it (already internal, or content). */
export function internalName(domain: string, value: string): string {
  const names = INTERNAL_NAMES.find((x) => x.id === domain)?.names;
  return names && Object.hasOwn(names, value) ? names[value] : value;
}

/** The Italian word of today of an internal value: the reverse of the table, for what the world still shows in its language (T239 has the dictionaries). */
export function italianName(domain: string, value: string): string {
  const names = INTERNAL_NAMES.find((x) => x.id === domain)?.names ?? {};
  return Object.keys(names).find((k) => names[k] === value) ?? value;
}

/** The Italian values of a domain, in the table's order: what the validator still repairs for one contract more (T310). */
export function italianValues(domain: string): string[] {
  return Object.keys(INTERNAL_NAMES.find((x) => x.id === domain)?.names ?? {});
}

/** The internal values of a domain, in the table's order: what the Council's schemas and prompts list (T310, the ids in English). */
export function internalValues(domain: string): string[] {
  return Object.values(INTERNAL_NAMES.find((x) => x.id === domain)?.names ?? {});
}

// --- The contract 0.2 (T307a): the repair of the values of the world's simulation ------------------------------------------------------
// Every function here is idempotent (an internal value stays as it is: the table has no chains) and leaves what it does not know alone.

/** Any string of a value domain, internal; anything else as it is. */
const named = (domain: string, v: unknown): unknown => (typeof v === 'string' ? internalName(domain, v) : v);

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** An object with its keys renamed by a field domain, in their order; a key whose internal name is there already gives way to it. */
function renameFields(o: Record<string, unknown>, domain: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = internalName(domain, k);
    if (key !== k && Object.hasOwn(o, key)) continue;
    out[key] = v;
  }
  return out;
}

/** An effect as the Council or a universe of the contract 0.1 wrote it (`{tipo: 'luce', raggio: 4}`), internal (`{type: 'light', radius: 4}`). */
export function internalEffect(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const out = renameFields(raw, 'campi-effetti');
  if (typeof out.type === 'string') out.type = internalName('effetti', out.type);
  return out;
}

/** A list of effects, each internal; what is not a list as it is. */
export const internalEffects = (raw: unknown): unknown => (Array.isArray(raw) ? raw.map(internalEffect) : raw);

/**
 * The id of a model the kernel names, internal: the generic model of a class (`albero` → `tree`) and a common shape of the items
 * (`forma-sacco` → `shape-sack`). Any other id is content (the Sculptor's, the Forge's) and stays.
 */
export function internalModelId(id: string): string {
  const cls = internalName('classi', id);
  if (cls !== id) return cls;
  // The common houses of a world (ADR-0134) say their class in their id: `casa-comune-edificio-<hash>` → `casa-comune-building-<hash>`.
  const house = /^(casa-comune-)([a-z]+)(-[0-9a-f]+)$/.exec(id);
  if (house) return `${house[1]}${internalName('classi', house[2])}${house[3]}`;
  const m = /^forma-(.+)$/.exec(id);
  if (!m) return id;
  const shape = internalName('impronte', m[1]);
  return shape === m[1] ? id : `${internalName('impronte', 'forma')}-${shape}`;
}

const modelOf = (v: unknown): unknown => (typeof v === 'string' ? internalModelId(v) : v);

/** A list of learned actions, with their effects internal. */
function internalActions(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((a) => (isRecord(a) && Array.isArray(a.effects) ? { ...a, effects: internalEffects(a.effects) } : a));
}

/** A step of a case of the bench, its kind and its way internal. */
function internalStep(p: unknown): unknown {
  if (!isRecord(p)) return p;
  const o = { ...p };
  if ('tipo' in o) o.tipo = named('passi-banco', o.tipo);
  if ('verso' in o) o.verso = named('passi-banco', o.verso);
  return o;
}

/**
 * A manifest (parsed) with the values of the contract 0.2 internal: class and size of the look, the model ids the kernel names, the
 * categories, models and effects of the items, the effects of the actions and of the incantations, the elements of the magic runes, the
 * elements of a panel, the steps of the cases of the bench. Ids of terrains, runes, environments and actions are not touched here: they
 * are keys others point at, and only the migration of a whole universe renames them (migrations.ts).
 */
export function internalManifest<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const m: Record<string, unknown> = { ...raw };
  if (isRecord(m.appearance)) {
    const a = { ...m.appearance };
    if ('classe' in a) a.classe = named('classi', a.classe);
    if ('taglia' in a) a.taglia = named('taglie', a.taglia);
    if ('model' in a) a.model = modelOf(a.model);
    m.appearance = a;
  }
  if (Array.isArray(m.items))
    m.items = m.items.map((it) => {
      if (!isRecord(it)) return it;
      const o = { ...it };
      if ('category' in o) o.category = named('categorie', o.category);
      if ('model' in o) o.model = modelOf(o.model);
      if ('actions' in o) o.actions = internalActions(o.actions);
      return o;
    });
  if ('actions' in m) m.actions = internalActions(m.actions);
  if (isRecord(m.tiles))
    m.tiles = Object.fromEntries(
      Object.entries(m.tiles).map(([code, t]) => {
        if (!isRecord(t)) return [code, t];
        const o = { ...t };
        if ('model' in o) o.model = modelOf(o.model);
        if ('actions' in o) o.actions = internalActions(o.actions);
        return [code, o];
      }),
    );
  if (isRecord(m.spells)) m.spells = Object.fromEntries(Object.entries(m.spells).map(([k, sp]) => [k, isRecord(sp) && Array.isArray(sp.effects) ? { ...sp, effects: internalEffects(sp.effects) } : sp]));
  if (isRecord(m.runes)) m.runes = Object.fromEntries(Object.entries(m.runes).map(([k, r]) => [k, isRecord(r) && 'element' in r ? { ...r, element: named('elementi', r.element) } : r]));
  if (isRecord(m.ui) && Array.isArray(m.ui.elementi)) m.ui = { ...m.ui, elementi: m.ui.elementi.map((e) => (isRecord(e) && 'tipo' in e ? { ...e, tipo: named('pannelli', e.tipo) } : e)) };
  if (Array.isArray(m.casi)) m.casi = m.casi.map((c) => (isRecord(c) && Array.isArray(c.passi) ? { ...c, passi: c.passi.map(internalStep) } : c));
  return m as T;
}

/** An entry of models/index.json with its class and size internal. */
export function internalModelInfo<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const o: Record<string, unknown> = { ...raw };
  if ('classe' in o) o.classe = named('classi', o.classe);
  if ('taglia' in o) o.taglia = named('taglie', o.taglia);
  return o as T;
}

// --- The contract 0.3 (T307b): the repair of the values of society, work and the Council -----------------------------------------------
// Like those of 0.2: idempotent, and what they do not know stays. The migration of a universe (migrations.ts) and what reads a value the
// Council still writes in Italian (the Narrator's individuals and plots, the Musician's sounds, a stray program of a trade) use them.

/** The id of an agent of the Council, internal (`narratore` → `narrator`); any other id as it is. */
export const internalAgent = (v: string): string => internalName('agenti', v);

/** The id of a module of the seed the kernel names (`sys.lavoro` → `sys.work`, `obj.letto` → `obj.bed`); a module of the Council stays. */
export const internalModuleId = (v: string): string => internalName('moduli-seme', v);

/**
 * The id of a model of the contract 0.3: the seed's sound programs (`suono-musica-pietra` → `sound-music-stone`) and the gerboas of the
 * Council's teams (`corona-gerboa-narratore` → `corona-gerboa-narrator`). The 0.2 ids are `internalModelId`'s; any other id stays.
 */
export function internalModelId0_3(id: string): string {
  const sound = internalName('suoni-seme', id);
  if (sound !== id) return sound;
  const m = /^(corona-gerboa-)(.+)$/.exec(id);
  return m ? `${m[1]}${internalAgent(m[2])}` : id;
}

/** A routine's step: its moment, its place, its activity. */
function internalRoutineStep(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const o = { ...raw };
  if ('quando' in o) o.quando = named('momenti', o.quando);
  if ('dove' in o) o.dove = named('dove', o.dove);
  if ('azione' in o) o.azione = named('attivita', o.azione);
  return o;
}

/** An individual of world/people.json: species, gender, routine, the module of its archetype. */
export function internalIndividual<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const o: Record<string, unknown> = { ...raw };
  if ('specie' in o) o.specie = named('specie', o.specie);
  if ('genere' in o) o.genere = named('specie', o.genere);
  if (typeof o.tipo === 'string') o.tipo = internalModuleId(o.tipo);
  if (Array.isArray(o.routine)) o.routine = o.routine.map(internalRoutineStep);
  return o as T;
}

/** world/people.json: every individual internal. */
export const internalPeople = (raw: unknown): unknown => (isRecord(raw) && Array.isArray(raw.persone) ? { ...raw, persone: raw.persone.map(internalIndividual) } : raw);

/** A plot of world/plots.json: its state, the moments and places of its beats, its quest (state, goal). */
export function internalPlot<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const o: Record<string, unknown> = { ...raw };
  if ('stato' in o) o.stato = named('trame', o.stato);
  if (Array.isArray(o.tappe)) o.tappe = o.tappe.map((b) => (isRecord(b) ? { ...b, ...('momento' in b ? { momento: named('momenti', b.momento) } : {}), ...('dove' in b ? { dove: named('dove', b.dove) } : {}) } : b));
  if (isRecord(o.missione)) {
    const q: Record<string, unknown> = { ...o.missione };
    if ('stato' in q) q.stato = named('trame', q.stato);
    if (isRecord(q.obiettivo) && 'tipo' in q.obiettivo) q.obiettivo = { ...q.obiettivo, tipo: named('trame', q.obiettivo.tipo) };
    o.missione = q;
  }
  return o as T;
}

/** world/plots.json: every plot internal. */
export const internalPlots = (raw: unknown): unknown => (isRecord(raw) && Array.isArray(raw.trame) ? { ...raw, trame: raw.trame.map(internalPlot) } : raw);

/** A venture of world/imprese.json: its type and state, the trades of its roles, the pose of its task. */
export function internalVenture<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const o: Record<string, unknown> = { ...raw };
  if ('tipo' in o) o.tipo = named('imprese', o.tipo);
  if ('stato' in o) o.stato = named('imprese', o.stato);
  if (Array.isArray(o.ruoli)) o.ruoli = o.ruoli.map((r) => (isRecord(r) && 'mestiere' in r ? { ...r, mestiere: named('mestieri', r.mestiere) } : r));
  if (isRecord(o.compito) && 'posa' in o.compito) o.compito = { ...o.compito, posa: named('attivita', o.compito.posa) };
  return o as T;
}

/** A place of a task of a trade (`lavoro`, `casella:m`): the four of the kernel internal, the others as they are. */
const jobPlace = (v: unknown): unknown => named('dove', v);

/**
 * A program of a trade (`mestieri[]` of a data module): its id, the moments of its day, and for every task the behaviour, the places,
 * the pose. `a` is a place only for `carry` and `take` (for `transform` it is a tile).
 */
export function internalJobProgram<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const o: Record<string, unknown> = { ...raw };
  if (typeof o.id === 'string') o.id = internalName('mestieri', o.id);
  if (isRecord(o.giornata)) {
    const day: Record<string, unknown> = {};
    for (const [phase, list] of Object.entries(o.giornata)) {
      const key = internalName('momenti', phase);
      if (key !== phase && Object.hasOwn(o.giornata, key)) continue;
      day[key] = Array.isArray(list)
        ? list.map((t) => {
            if (!isRecord(t)) return t;
            const x: Record<string, unknown> = { ...t };
            if ('fa' in x) x.fa = named('comportamenti', x.fa);
            if ('dove' in x) x.dove = jobPlace(x.dove);
            if ('a' in x && (x.fa === 'carry' || x.fa === 'take')) x.a = jobPlace(x.a);
            if ('posa' in x) x.posa = named('attivita', x.posa);
            if (Array.isArray(x.percorso)) x.percorso = x.percorso.map(jobPlace);
            return x;
          })
        : list;
    }
    o.giornata = day;
  }
  return o as T;
}

/** What a sound program is for (`models/index.json → suono`): its use, the effects it answers to, the moments it plays in. */
export function internalSoundPurpose<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const o: Record<string, unknown> = { ...raw };
  if ('uso' in o) o.uso = named('suoni', o.uso);
  if (Array.isArray(o.effetti)) o.effetti = o.effetti.map((e) => named('suoni', e));
  if (Array.isArray(o.momenti)) o.momenti = o.momenti.map((e) => named('momenti', e));
  return o as T;
}

/** The Sculptor's models by class (`ai.scultori`, `ai.minimi.scultori`): the keys of the classes internal (`semplice` → `simple`). */
export const internalSculptors = <T>(raw: T): T => (isRecord(raw) ? (renameFields(raw, 'classi-scultore') as T) : raw);

/** The coefficients of generation (`ai.coefficienti`, `ai.minimi.coefficienti`): their keys internal (`trame` → `plots`). */
export const internalCoefficients = <T>(raw: T): T => (isRecord(raw) ? (renameFields(raw, 'coefficienti') as T) : raw);

/** The id of a card or of a node of the graph (`modello:albero`, `persona:ada`): its kind internal (`model:albero`, `individual:ada`). */
export function internalCardId(id: string): string {
  const m = /^([a-z]+):(.*)$/s.exec(id);
  if (!m) return id;
  const kind = internalName('carte', m[1]);
  return kind === m[1] ? id : `${kind}:${m[2]}`;
}

/** A node of world/grafo.json: its kind and id internal; a link: its ends. */
export function internalGraph<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const o: Record<string, unknown> = { ...raw };
  if (Array.isArray(o.nodes))
    o.nodes = o.nodes.map((n) => (isRecord(n) ? { ...n, ...(typeof n.id === 'string' ? { id: internalCardId(n.id) } : {}), ...(typeof n.tipo === 'string' ? { tipo: internalName('carte', n.tipo) } : {}) } : n));
  if (Array.isArray(o.links))
    o.links = o.links.map((l) => (isRecord(l) ? { ...l, ...(typeof l.source === 'string' ? { source: internalCardId(l.source) } : {}), ...(typeof l.target === 'string' ? { target: internalCardId(l.target) } : {}) } : l));
  return o as T;
}

// --- The contract 0.4 (T308a): the fields and the files of a universe ------------------------------------------------------------------
// A file's fields are renamed by its shape: which Italian keys of which of its objects a field domain renames (`only`). An object's other
// keys are content (the ids of a dictionary, the components of a thing) or another contract's (the wire's and Lua's, T308b). Like the
// functions of 0.2 and 0.3: idempotent (an internal key stays), and a key whose internal name is there already gives way to it. The
// migration of a universe (migrations.ts) uses them, and so does every reader of a file, for what the Council still writes with the
// Italian fields of its schemas (until T310 changes its prompts) and for a universe on disk not ported yet (the tools read the disk).
// The values first, then the fields: the repairs of 0.2 and 0.3 read the Italian keys, so a reader calls them before these.

/** The id of the wanderer of a game alone: `io` until the contract 0.3, `me` from 0.4. */
export const SOLO_BEFORE_0_4 = 'io';

interface FieldShape {
  /** The field domains that rename the keys, the first that names a key wins. */
  d: readonly string[];
  /** The Italian keys renamed here. */
  only: readonly string[];
  /** The shapes of what the internal keys hold: an object, a list of objects (the shape of each), or a dictionary (`values`). */
  sub?: Readonly<Record<string, FieldShape | { values: FieldShape }>>;
  /** What else changes once the keys are internal (a value of the contract 0.4). */
  then?: (o: Record<string, unknown>) => Record<string, unknown>;
}

const fieldName = (domains: readonly string[], k: string): string => {
  for (const id of domains) {
    const names = INTERNAL_NAMES.find((x) => x.id === id)?.names;
    if (names && Object.hasOwn(names, k)) return names[k];
  }
  return k;
};

function shaped(v: unknown, s: FieldShape | { values: FieldShape }): unknown {
  if ('values' in s) return isRecord(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shaped(x, s.values)])) : v;
  if (Array.isArray(v)) return v.map((x) => shaped(x, s));
  if (!isRecord(v)) return v;
  let out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    const key = s.only.includes(k) ? fieldName(s.d, k) : k;
    if (key !== k && Object.hasOwn(v, key)) continue;
    out[key] = x;
  }
  for (const [k, sub] of Object.entries(s.sub ?? {})) if (Object.hasOwn(out, k)) out[k] = shaped(out[k], sub);
  if (s.then) out = s.then(out);
  return out;
}

/** A place of a job's task of the contract 0.3 (`casella:m`, `entita:forno`) internal (`tile:m`, `entity:forno`). */
export const internalJobPlace = (v: unknown): unknown => (typeof v === 'string' ? v.replace(/^casella:/, 'tile:').replace(/^entita:/, 'entity:') : v);

const ORIGIN: FieldShape = { d: ['campi-carte'], only: ['titolare', 'universo', 'impronta'] };
const CARD: FieldShape = { d: ['campi-carte'], only: ['autore', 'pagante', 'titolare', 'origini'], sub: { origins: ORIGIN } };
const WITH_CARD: FieldShape = { d: ['campi-carte'], only: ['carta'], sub: { card: CARD } };
const BENCH: FieldShape = {
  d: ['campi-manifest'],
  only: ['titolo', 'racconto', 'terreno', 'viandante', 'cose', 'passi', 'durata', 'guarda', 'righe'],
  sub: {
    wanderer: { d: ['campi-manifest'], only: ['componenti', 'oggetti'], sub: { items: { d: ['campi-manifest'], only: ['nome', 'posto', 'categoria'] } } },
    entities: { d: ['campi-manifest'], only: ['modulo', 'componenti'] },
    steps: { d: ['campi-manifest'], only: ['tipo', 'oggetto', 'azione', 'secondi', 'verso'] },
  },
};
const JOB_TASK: FieldShape = {
  d: ['campi-mestieri', 'campi-manifest'],
  only: ['fa', 'dove', 'da', 'a', 'casella', 'lascia', 'oggetto', 'con', 'quante', 'durata', 'posa', 'dice', 'percorso', 'azione', 'entita'],
  then: (o) => ({
    ...o,
    ...('where' in o ? { where: internalJobPlace(o.where) } : {}),
    ...('to' in o && (o.does === 'carry' || o.does === 'take') ? { to: internalJobPlace(o.to) } : {}),
    ...(Array.isArray(o.route) ? { route: o.route.map(internalJobPlace) } : {}),
  }),
};
const JOB: FieldShape = {
  d: ['campi-mestieri', 'campi-manifest'],
  only: ['nomi', 'posto', 'giornata', 'modulo'],
  sub: { workplace: { d: ['campi-manifest'], only: ['casella', 'entita'] }, day: { values: JOB_TASK } },
};
const PANEL_ELEMENT: FieldShape = { d: ['campi-manifest'], only: ['tipo', 'etichetta', 'accetta', 'campo', 'colore'] };
const PANEL: FieldShape = { d: ['campi-manifest'], only: ['titolo', 'descrizione', 'elementi'], sub: { elements: PANEL_ELEMENT } };
const MANIFEST: FieldShape = {
  d: ['campi-manifest', 'campi-carte'],
  only: ['casi', 'mestieri', 'carta'],
  sub: {
    appearance: { d: ['campi-manifest'], only: ['aspetto', 'classe', 'taglia'] },
    items: { d: ['campi-manifest', 'campi-carte'], only: ['aspetto', 'carta'], sub: { card: CARD } },
    tiles: { values: { d: ['campi-manifest', 'campi-carte'], only: ['matura', 'carta'], sub: { ripens: { d: ['campi-manifest'], only: ['dopo'] }, card: CARD } } },
    ui: PANEL,
    cases: BENCH,
    jobs: JOB,
    card: CARD,
    recipes: WITH_CARD,
    runes: { values: WITH_CARD },
    spells: { values: WITH_CARD },
    layouts: { values: WITH_CARD },
  },
};
const P = ['campi-persone', 'campi-carte'];
const INDIVIDUAL: FieldShape = {
  d: P,
  only: ['nome', 'specie', 'genere', 'tipo', 'mestiere', 'eta', 'famiglia', 'storia', 'luogo', 'origine', 'aspetto', 'porta', 'indossa', 'ricordi', 'legameViandante', 'scheda', 'carta'],
  sub: {
    family: { d: P, only: ['nome', 'legame', 'viandante'] },
    routine: { d: P, only: ['quando', 'fa', 'dove', 'azione'] },
    memories: { d: P, only: ['quando', 'testo', 'con', 'viandante', 'peso'] },
    sheet: { d: P, only: ['testo', 'impronta'] },
    card: CARD,
  },
};
const PEOPLE: FieldShape = { d: P, only: ['persone', 'attesi'], sub: { people: INDIVIDUAL, expected: { d: P, only: ['nome', 'legame', 'di'] } } };
const T = ['campi-trame', 'campi-carte'];
const PLOT: FieldShape = {
  d: T,
  only: ['titolo', 'mistero', 'coinvolti', 'tappe', 'missione', 'inizio', 'stato', 'carta'],
  sub: {
    beats: { d: T, only: ['giorno', 'momento', 'chi', 'dove', 'cosa', 'battuta', 'indizio', 'fatto'] },
    quest: { d: T, only: ['da', 'testo', 'obiettivo', 'ricompensa', 'stato', 'viandante'], sub: { goal: { d: T, only: ['tipo', 'oggetto', 'a', 'luogo'] } } },
    card: CARD,
  },
};
const PLOTS: FieldShape = { d: T, only: ['trame'], sub: { plots: PLOT } };
const BIBLE: FieldShape = {
  d: ['campi-bibbia'],
  only: ['titolo', 'tono', 'sintesi', 'storia', 'luoghi', 'personaggi', 'fatti', 'misteri', 'usanze', 'crepe'],
  // The old bibles' cracks (ADR-0025) are gone: nothing reads them.
  then: ({ cracks: _, ...o }) => o,
};
const REGION: FieldShape = { d: ['campi-atlante'], only: ['nome', 'descrizione', 'ambiente', 'centro', 'raggio'] };
const ATLAS: FieldShape = { d: ['campi-atlante'], only: ['regioni'], sub: { regions: REGION } };
const RULE: FieldShape = { d: ['campi-regole'], only: ['chiave', 'testo', 'possibile', 'racconto', 'effetti', 'carta'], sub: { card: CARD } };
const RULES: FieldShape = { d: ['campi-regole'], only: ['regole'], sub: { rules: RULE } };
const PROFILE: FieldShape = { d: ['campi-viandante'], only: ['nome', 'seme', 'tinta', 'presentazione'] };
const WANDERER: FieldShape = {
  d: ['campi-viandante'],
  only: ['nome', 'profilo', 'stati', 'trasceso', 'anonimo', 'crediti'],
  sub: { profile: PROFILE },
  // The credits are not the wanderer's to keep (ADR-0104): they live outside the universe.
  then: ({ credits: _, ...o }) => o,
};
const STATE: FieldShape = { d: ['campi-stato'], only: ['consumati', 'contenitori', 'forme', 'rari', 'ora', 'importanti', 'viandante', 'posati'], sub: { wanderer: WANDERER } };
const V = ['campi-imprese'];
const VENTURE: FieldShape = {
  d: V,
  only: ['titolo', 'tipo', 'stato', 'luogo', 'posto', 'lotto', 'origine', 'modello', 'concetto', 'classe', 'taglia', 'seme', 'fasi', 'ruoli', 'portati', 'lavorato', 'squadra', 'inizio', 'ultimo', 'fine', 'scade', 'compito', 'nato_da', 'carta'],
  sub: {
    phases: { d: V, only: ['nome', 'materiali', 'lavoro', 'stadio'] },
    roles: { d: V, only: ['ruolo', 'mestiere', 'quanti'] },
    team: { d: V, only: ['nome', 'ruolo'] },
    task: { d: V, only: ['casella', 'oggetto', 'lascia', 'durata', 'posa'] },
    card: CARD,
  },
};
const VENTURES: FieldShape = { d: V, only: ['imprese'], sub: { ventures: VENTURE } };
const USES: FieldShape = { d: ['campi-carte'], only: ['luoghi', 'trame'] };
const CARDS: FieldShape = {
  d: ['campi-carte'],
  only: ['utilizzi', 'luoghi', 'allaNascita'],
  sub: { uses: { values: USES }, atBirth: { values: USES }, chunks: { values: { d: ['campi-carte'], only: ['nome', 'autore', 'pagante', 'titolare', 'origini'], sub: { origins: ORIGIN } } } },
};
const USAGE: FieldShape = { d: ['campi-carte'], only: ['prezzi', 'giorni', 'paganti'] };
const SHORTFALL: FieldShape = { d: ['campi-carte'], only: ['richiesta', 'chi', 'agente', 'compito', 'esito', 'motivo', 'volte', 'primo', 'ultimo'] };
const SHORTFALLS: FieldShape = { d: ['campi-carte'], only: ['voci'], sub: { entries: SHORTFALL } };
const HOUSE: FieldShape = { d: ['campi-piani'], only: ['origine', 'modello', 'seme', 'classe', 'concetto', 'stadio'] };
const PLAN: FieldShape = {
  d: ['campi-piani', 'campi-carte'],
  only: ['strutture', 'giorni', 'stadi', 'case', 'visto', 'scavi', 'acqua', 'carta'],
  sub: { structures: { d: ['campi-piani'], only: ['concetto', 'taglia'] }, houses: HOUSE, card: CARD },
};
const SOUND_PURPOSE: FieldShape = { d: ['campi-modelli'], only: ['uso', 'ambienti', 'momenti', 'oltre', 'effetti'] };
const MODEL_INFO: FieldShape = {
  d: ['campi-modelli', 'campi-carte'],
  only: ['classe', 'taglia', 'nome', 'autore', 'voto', 'tinta', 'tempo', 'sotto', 'consigli', 'problemi', 'suono', 'carta'],
  sub: { sound: SOUND_PURPOSE, card: CARD },
};
const MODEL_INDEX: FieldShape = { d: [], only: [], then: (o) => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, shaped(x, MODEL_INFO)])) };
const U = ['campi-universe'];
const GAME: FieldShape = { d: U, only: ['modalita', 'morte', 'altroTraGiocatori'] };
const MINIMUMS: FieldShape = { d: U, only: ['scultori', 'tetto', 'coefficienti'] };
const ACTOR: FieldShape = { d: U, only: ['acceso', 'modello'] };
const AI: FieldShape = { d: U, only: ['scultori', 'agenti', 'coefficienti', 'minimi', 'attore', 'maxBrani'], sub: { minimums: MINIMUMS, actor: ACTOR } };
const HERITAGE: FieldShape = { d: U, only: ['copia'] };
const CONFIG: FieldShape = { d: U, only: ['partita', 'rilievo', 'eredita'], sub: { game: GAME, relief: { d: U, only: ['mare'] }, heritage: HERITAGE, ai: AI } };

/** The shapes of the files of a universe and of the objects in them that are read one at a time. */
const FIELD_SHAPES = {
  config: CONFIG,
  game: GAME,
  ai: AI,
  minimums: MINIMUMS,
  actor: ACTOR,
  heritage: HERITAGE,
  manifest: MANIFEST,
  panel: PANEL,
  panelElement: PANEL_ELEMENT,
  bench: BENCH,
  job: JOB,
  jobTask: JOB_TASK,
  people: PEOPLE,
  individual: INDIVIDUAL,
  plots: PLOTS,
  plot: PLOT,
  bible: BIBLE,
  atlas: ATLAS,
  region: REGION,
  rules: RULES,
  rule: RULE,
  state: STATE,
  wanderer: WANDERER,
  profile: PROFILE,
  ventures: VENTURES,
  venture: VENTURE,
  cards: CARDS,
  card: CARD,
  usage: USAGE,
  shortfalls: SHORTFALLS,
  shortfall: SHORTFALL,
  plan: PLAN,
  house: HOUSE,
  modelInfo: MODEL_INFO,
  modelIndex: MODEL_INDEX,
  soundPurpose: SOUND_PURPOSE,
} satisfies Record<string, FieldShape>;

export type FieldShapeId = keyof typeof FIELD_SHAPES;

/** A file of a universe, or an object of one, with the fields of the contract 0.4 (`nome` → `name`, `carta` → `card`…); the rest as it is. */
export function internalFields<T>(shape: FieldShapeId, raw: T): T {
  return shaped(raw, FIELD_SHAPES[shape]) as T;
}

/** Every `carta` of a JSON value, at any depth, as a `card` stamp of 0.4 (`autore` → `author`…): it is in almost every file of the Council. */
export function internalCardsIn(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(internalCardsIn);
  if (!isRecord(v)) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    if (k === 'carta' && isRecord(x) && !Object.hasOwn(v, 'card')) out.card = shaped(x, CARD);
    else out[k] = internalCardsIn(x);
  }
  return out;
}

/** The wanderer of a game alone in a JSON value of 0.3 (`io`) as of 0.4 (`me`), where a field of 0.4 holds a wanderer's id. */
export function internalSoloIn(v: unknown): unknown {
  const solo = (x: unknown) => (x === SOLO_BEFORE_0_4 ? 'me' : x);
  if (Array.isArray(v)) return v.map(internalSoloIn);
  if (!isRecord(v)) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    if (['author', 'payer', 'holder', 'wanderer', 'master'].includes(k)) out[k] = solo(x);
    else if (k === 'who') out[k] = Array.isArray(x) ? x.map(solo) : solo(x);
    // usage.json: day → payer → tally.
    else if (k === 'payers' && isRecord(x))
      out[k] = Object.fromEntries(Object.entries(x).map(([day, per]) => [day, isRecord(per) ? Object.fromEntries(Object.entries(per).map(([p, t]) => [p === SOLO_BEFORE_0_4 ? 'me' : p, t])) : per]));
    else out[k] = internalSoloIn(x);
  }
  return out;
}

/** A path of a universe of 0.3 where it is in 0.4 (`world/giocatori/io.json` → `world/players/me.json`, `world/stato.json` → `world/state.json`…). */
export function internalPath(p: string): string {
  const names = INTERNAL_NAMES.find((x) => x.id === 'percorsi')?.names ?? {};
  for (const [it, en] of Object.entries(names)) {
    if (!it.startsWith('world/')) continue;
    if (it.endsWith('/') ? p.startsWith(it) : p === it) {
      const rest = p.slice(it.length);
      return en + (it === 'world/giocatori/' && rest === `${SOLO_BEFORE_0_4}.json` ? 'me.json' : rest);
    }
  }
  return p;
}

// --- The contract 0.5 (T308b): the wire and Lua ----------------------------------------------------------------------------------------
// The components Lua sees and the fields of their data (`luce {raggio}` → `light {radius}`), the bus's events, the keys of the work's
// store. The migration of a universe (migrations.ts) ports with these the components a manifest or a case gives, the states a wanderer
// keeps and the Lua of the Council's modules; the kernel reads with them what the Council may still write with the names of before.
// Idempotent, like the others: an internal name stays, and what they do not know is content.

/** A component's name of 0.5 (`luce` → `light`); any other name as it is. */
export const internalComponentName = (name: string): string => internalName('componenti', name);

/**
 * The Italian fields of each component of 0.4 (by its name of 0.5) that the table renames: a field is renamed only in the component
 * that has it (a `tipo` of `activity` is `kind`, the `tipo` of another component is its own). `states` holds a dictionary of states,
 * each with these fields; `load` and `goal` and `placed` have none of the table.
 */
export const COMPONENT_FIELDS: Readonly<Record<string, readonly string[]>> = {
  light: ['raggio', 'accesa', 'colore', 'daStato'],
  fire: ['raggio'],
  ephemeral: ['fino'],
  shield: ['fino', 'spento'],
  states: ['velocita', 'peso', 'luce', 'fino'],
  activity: ['tipo', 'ferma'],
  structure: ['concetto', 'classe', 'taglia', 'stadio'],
  jump: ['da', 'a', 'alto'],
  work: ['fase', 'giorno', 'impresa', 'passo', 'motivo', 'fino'],
  job: ['fase', 'giorno', 'luogo', 'compiti', 'impresa', 'impresa_posto'],
  worksite: ['titolo', 'fase', 'stato', 'manca', 'squadra'],
  harvested: ['si'],
  searched: ['si'],
  player: ['passo'],
  needs: ['morto'],
};

/** The fields of a component's data (or of one state of `states`) of 0.4 in 0.5, by the component's name of 0.5. */
function componentFields(n: string, o: Record<string, unknown>): Record<string, unknown> {
  const only = COMPONENT_FIELDS[n] ?? [];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = only.includes(k) ? internalName('campi-componenti', k) : k;
    if (key !== k && Object.hasOwn(o, key)) continue;
    out[key] = v;
  }
  return out;
}

/** A field of a component of 0.4 in 0.5 (`raggio` of `luce` → `radius`), by the component's name of either contract; any other as it is. */
export function internalComponentField(component: string, field: string): string {
  return (COMPONENT_FIELDS[internalComponentName(component)] ?? []).includes(field) ? internalName('campi-componenti', field) : field;
}

/** A component's data of 0.4 in 0.5, by its name (of either contract): the fields of its data, the states' fields, a job's tasks. */
export function internalComponent(name: string, data: unknown): unknown {
  const n = internalComponentName(name);
  if (!isRecord(data)) return data;
  if (n === 'states') return Object.fromEntries(Object.entries(data).map(([k, s]) => [k, isRecord(s) ? componentFields(n, s) : s]));
  if (!COMPONENT_FIELDS[n]) return data;
  const out = componentFields(n, data);
  if (n === 'job' && Array.isArray(out.tasks)) out.tasks = out.tasks.map((t) => internalFields('jobTask', t));
  return out;
}

/** A record of components (a manifest's `components`, a case's, `ecs.spawn`'s): names and data of 0.5. */
export function internalComponents(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = internalComponentName(k);
    if (n !== k && Object.hasOwn(raw, n)) continue;
    out[n] = internalComponent(k, v);
  }
  return out;
}

/** A field path `componente.campo` of 0.4 (a panel's field, a case's watched field `0:meta.x`) in 0.5 (`goal.x`); any other as it is. */
export function internalFieldPath(path: string): string {
  const m = /^((?:\d+:)?)([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)$/.exec(path);
  if (!m) return path;
  return `${m[1]}${internalComponentName(m[2])}.${internalComponentField(m[2], m[3])}`;
}

/** An event of the bus a module emits (`morte` → `death`); any other as it is. */
export const internalEvent = (name: string): string => (name === 'morte' ? internalName('api-lua', name) : name);

/** A key of the store of `sys.work` of 0.4 (`deposito:0:1`) in 0.5 (`deposit:0:1`); any other as it is. */
export const internalStoreKey = (key: string): string => (key.startsWith('deposito:') ? `${internalName('api-lua', 'deposito:')}${key.slice('deposito:'.length)}` : key);

/** A case of the bench with the components and the watched fields of 0.5. */
export function internalCase<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const o: Record<string, unknown> = { ...raw };
  if (Array.isArray(o.entities)) o.entities = o.entities.map((e) => (isRecord(e) && 'components' in e ? { ...e, components: internalComponents(e.components) } : e));
  if (isRecord(o.wanderer) && 'components' in o.wanderer) o.wanderer = { ...o.wanderer, components: internalComponents(o.wanderer.components) };
  if (Array.isArray(o.watch)) o.watch = o.watch.map((w) => (typeof w === 'string' ? internalFieldPath(w) : w));
  return o as T;
}

/**
 * A manifest (parsed, with the fields of 0.4) with the names of 0.5: the components it gives (`components`, `singleton`, the fields it
 * keeps, `persist`), the fields its panel shows, the components and the watched fields of its cases, the panel and the button of the
 * work (`cantiere`, `porta`). What it does not know stays.
 */
export function internalManifest0_5<T>(raw: T): T {
  if (!isRecord(raw)) return raw;
  const m: Record<string, unknown> = { ...raw };
  if ('components' in m) m.components = internalComponents(m.components);
  if ('singleton' in m) m.singleton = internalComponents(m.singleton);
  if (Array.isArray(m.persist)) m.persist = m.persist.map((p) => (typeof p === 'string' ? internalFieldPath(p) : p));
  if (isRecord(m.ui)) {
    const ui: Record<string, unknown> = { ...m.ui };
    if (ui.id === 'cantiere' && m.id === 'sys.work') ui.id = internalName('api-lua', 'cantiere');
    if (Array.isArray(ui.elements))
      ui.elements = ui.elements.map((e) => {
        if (!isRecord(e)) return e;
        const x: Record<string, unknown> = { ...e };
        if (typeof x.field === 'string') x.field = internalFieldPath(x.field);
        if (m.id === 'sys.work' && x.type === 'button' && x.id === 'porta') x.id = internalName('api-lua', 'porta');
        return x;
      });
    m.ui = ui;
  }
  if (Array.isArray(m.cases)) m.cases = m.cases.map(internalCase);
  return m as T;
}
