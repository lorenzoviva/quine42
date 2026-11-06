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

/** The task that applies the rename, and with it the contract of the kernel (ADR-0136): 0.2, 0.3, 0.4, 0.5. */
export type NameStep = 'T307a' | 'T307b' | 'T308a' | 'T308b';

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
    where: ['src/kernel/society.ts (DAY_PHASES)', 'world/people.json → routine[].quando', 'world/plots.json → tappe[].momento', 'models/index.json → suono.momenti', 'manifest → mestieri[].giornata (chiavi)'],
    reach: ['disco', 'lua', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: { mattina: 'morning', giorno: 'day', sera: 'evening', notte: 'night' },
  }),
  d({
    id: 'dove',
    title: '«Dove» della routine',
    kind: 'values',
    where: ['src/kernel/society.ts (WHERES)', 'world/people.json → routine[].dove', 'world/plots.json → tappe[].dove', 'manifest → mestieri[].giornata[].dove, percorso', 'componente mestiere (i posti)'],
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
    where: ['src/kernel/society.ts (ACTIVITIES)', 'world/people.json → routine[].azione', 'componente attivita.tipo', 'src/render/entities.ts'],
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
    where: ['src/kernel/society.ts (Species, Gender)', 'world/people.json → specie, genere', 'src/kernel/graph.ts'],
    reach: ['disco', 'prompt'],
    lang: 'en',
    step: 'T307b',
    names: { persona: 'person', animale: 'animal', maschio: 'male', femmina: 'female' },
  }),
  d({
    id: 'legami',
    title: 'Tipi di legame (solo codice: la parola del legame è testo del mondo)',
    kind: 'values',
    where: ['src/kernel/society.ts (KINDS, Between)'],
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
    where: ['universe/modules/lavoro.* (mestieri[].id)', 'src/kernel/jobs.ts (matchJob)', 'world/people.json → mestiere (via matchJob)'],
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
    where: ['src/kernel/jobs.ts (JOB_BEHAVIOURS)', 'universe/modules/sys.lavoro/logic.lua', 'manifest → mestieri[].giornata[].fa'],
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
    where: ['src/kernel/ventures.ts (VENTURE_TYPES, VentureState)', 'world/imprese.json → tipo, stato', 'il pannello del cantiere'],
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
    where: ['src/kernel/plots.ts (Plot, Quest)', 'world/plots.json'],
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
    where: ['src/kernel/types.ts (Manifest, Appearance, TerrainDef, UiPanel, BenchCase)', 'src/kernel/jobs.ts (JobProgram, JobTask)', 'src/kernel/validator.ts'],
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
    },
    note: '`posto` è la tasca di un oggetto di prova nei casi e il posto di lavoro nei mestieri (`workplace`): i due stanno in oggetti diversi; qui la tasca',
  }),
  d({
    id: 'campi-mestieri',
    title: 'Campi dei programmi di mestiere che cambiano senso',
    kind: 'fields',
    where: ['src/kernel/jobs.ts (JobProgram.posto, JobTask.azione)'],
    reach: ['disco', 'lua'],
    lang: 'en',
    step: 'T308a',
    names: { posto: 'workplace', azione: 'activity' },
  }),
  d({
    id: 'campi-regole',
    title: 'Campi di `world/rules.json`',
    kind: 'fields',
    where: ['src/kernel/types.ts (Rule)', 'src/kernel/kernel.ts'],
    reach: ['disco', 'filo'],
    lang: 'en',
    step: 'T308a',
    names: { chiave: 'key', testo: 'text', possibile: 'possible', racconto: 'story', effetti: 'effects', carta: 'card' },
  }),
  d({
    id: 'campi-persone',
    title: 'Campi di `world/people.json`',
    kind: 'fields',
    where: ['src/kernel/society.ts (People, Individual, Relation, RoutineStep, Memory, IndividualSheet)', 'src/kernel/agents/minds.ts'],
    reach: ['disco', 'filo', 'prompt'],
    lang: 'en',
    step: 'T308a',
    names: {
      persone: 'people', attesi: 'expected', di: 'of', nome: 'name', legame: 'bond', specie: 'species', genere: 'gender', tipo: 'kind',
      mestiere: 'job', eta: 'age', famiglia: 'family', storia: 'story', luogo: 'place', origine: 'origin', persona: 'persona', aspetto: 'look',
      porta: 'carries', ricordi: 'memories', legameViandante: 'wandererBond', scheda: 'sheet', testo: 'text', impronta: 'fingerprint',
      viandante: 'wanderer', quando: 'when', fa: 'does', dove: 'where', azione: 'activity', con: 'with', peso: 'weight',
    },
  }),
  d({
    id: 'campi-trame',
    title: 'Campi di `world/plots.json`',
    kind: 'fields',
    where: ['src/kernel/plots.ts (Plot, Beat, Quest)'],
    reach: ['disco', 'filo', 'prompt'],
    lang: 'en',
    step: 'T308a',
    names: {
      titolo: 'title', mistero: 'mystery', coinvolti: 'involved', tappe: 'beats', missione: 'quest', inizio: 'start', stato: 'state', giorno: 'day',
      momento: 'moment', chi: 'who', dove: 'where', cosa: 'what', battuta: 'line', indizio: 'clue', fatto: 'done', da: 'from', testo: 'text',
      obiettivo: 'goal', ricompensa: 'reward', viandante: 'wanderer', tipo: 'type', oggetto: 'item', a: 'to', luogo: 'place',
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
    where: ['src/kernel/ventures.ts (Venture, VenturePhase, VentureRole, VentureMember, VentureTask)'],
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
    },
    note: '`carta` sta in quasi ogni file del Concilio (piani, regole, trame, imprese): la migrazione lo cambia ovunque',
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
    },
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
      raggio: 'radius', accesa: 'lit', colore: 'color', daStato: 'fromState', fino: 'until', spento: 'off', tipo: 'kind', ferma: 'still',
      stadio: 'stage', fase: 'phase', giorno: 'day', impresa: 'venture', passo: 'step', motivo: 'reason', si: 'yes', luogo: 'chunk',
    },
  }),
  d({
    id: 'api-lua',
    title: 'Nomi dell’API Lua, eventi del bus, chiavi del magazzino',
    kind: 'values',
    where: ['src/kernel/validator.ts (LUA_API)', 'src/kernel/sandbox.ts (Host)', 'src/kernel/prelude.lua', 'universe/modules/sys.needs/logic.lua', 'universe/modules/sys.lavoro/logic.lua', 'prompt dell’Ingegnere'],
    reach: ['lua', 'prompt'],
    lang: 'en',
    step: 'T308b',
    names: { 'world.impresa': 'world.venture', 'world.impresa_porta': 'world.venture_bring', morte: 'death', 'deposito:': 'deposit:', cantiere: 'worksite', porta: 'bring' },
    note: '`cantiere` è il pannello di `sys.lavoro` e `porta` il suo pulsante; il resto dell’API (hook, `world.player`) è già inglese',
  }),
];

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

/** The Italian values of a domain, in the table's order: what the Council's prompts still list until they change (T310). */
export function italianValues(domain: string): string[] {
  return Object.keys(INTERNAL_NAMES.find((x) => x.id === domain)?.names ?? {});
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
