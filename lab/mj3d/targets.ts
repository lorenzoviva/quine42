// What the lab tries to sculpt: presets for each step of the experiment, and the assets of a universe
// (obstacle tiles, objects, people, the player) read from its files, with their current sprite and
// every frame of their walk for comparison.

import { guessClass } from './scale';
import type { Category, Target } from './sculptor';

const preset = (category: Category, name: string, description: string, kind: string): Target => ({
  id: `preset:${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  category,
  description,
  kind,
  source: 'preset',
});

export const PRESETS: Target[] = [
  // 1. Elementi semplici
  preset('semplice', 'Sasso', 'Un sasso tondeggiante e liscio, grigio, poco più grande di un pugno', 'sasso'),
  preset('semplice', 'Masso muschioso', 'Un grande masso di granito con chiazze di muschio sulla cima', 'roccia'),
  preset('semplice', 'Rocce stratificate', 'Uno sperone di roccia sedimentaria a strati orizzontali ocra e bruni, con gradini e spigoli netti', 'roccia'),
  preset('semplice', 'Cumulo di pietre', "Un mucchio di pietre di varie misure ammassate una sull'altra", 'roccia'),
  preset('semplice', 'Pino', 'Un pino alto e slanciato con la chioma a palchi', 'albero'),
  preset('semplice', 'Quercia', 'Una quercia frondosa dal tronco robusto e dalla chioma larga e irregolare', 'albero'),
  preset('semplice', 'Betulla', 'Una betulla sottile dal tronco bianco con macchie nere e una chioma leggera verde chiaro', 'albero'),
  preset('semplice', 'Salice piangente', 'Un salice dai rami lunghi e ricadenti fino a terra, come una tenda verde', 'albero'),
  preset('semplice', 'Albero secco', 'Un albero morto senza foglie, con rami nodosi e contorti', 'albero'),
  preset('semplice', 'Palma', 'Una palma dal tronco ricurvo ad anelli e un ciuffo di foglie lunghe in cima', 'albero'),
  preset('semplice', 'Cespuglio con bacche', 'Un cespuglio basso e folto con bacche rosse', 'cespuglio'),
  preset('semplice', 'Felce', 'Un ciuffo di felce con fronde arcuate che si aprono a ventaglio', 'cespuglio'),
  preset('semplice', 'Ceppo', 'Il ceppo di un albero tagliato, con gli anelli visibili sopra e radici che affiorano', 'cespuglio'),
  preset('semplice', 'Fungo gigante', 'Un fungo grande come un bambino, gambo chiaro e cappello rosso a pois bianchi', 'cespuglio'),
  preset('semplice', 'Cassa di legno', 'Una cassa di assi di legno con rinforzi di ferro agli spigoli', 'mobile'),
  preset('semplice', 'Barile', 'Un barile di legno a doghe con due cerchi di ferro', 'mobile'),
  preset('semplice', 'Vaso di terracotta', 'Un vaso panciuto di terracotta con il collo stretto', 'oggetto'),
  // 2. Strutture (un solo modello; per quelle a più caselle c'è la scheda «blocchi»)
  preset('struttura', 'Colonna di pietra', 'Una colonna classica con base, fusto scanalato e capitello', 'monumento'),
  preset('struttura', 'Colonna in rovina', "Il moncone spezzato di una colonna antica, con frammenti caduti a terra e edera", 'monumento'),
  preset('struttura', 'Porta ad arco', 'Un portale di pietra ad arco con un battente di legno chiuso e borchie di ferro', 'monumento'),
  preset('struttura', 'Pozzo', 'Un pozzo di pietra rotondo con un tettuccio di legno e un secchio appeso', 'edificio'),
  preset('struttura', 'Casetta', 'Una casetta di pietra e legno con tetto di paglia a due falde, porta sul davanti e una finestra', 'edificio'),
  preset('struttura', 'Fontana', 'Una fontana rotonda di pietra con una vasca e una colonnina centrale da cui sgorga acqua', 'edificio'),
  // 3. Figure
  preset('figura', 'Viandante', 'Un viandante con mantello e cappuccio grigio-blu petrolio e un bastone', 'persona'),
  preset('figura', 'Contadina', 'Una contadina con gonna lunga, grembiule bianco e fazzoletto in testa', 'persona'),
  preset('figura', 'Fabbro', 'Un uomo robusto con un grembiule di cuoio bruciacchiato e un martello appeso alla cintura', 'persona'),
  preset('figura', 'Gatto', 'Un gatto soriano a quattro zampe, con la coda alzata', 'animale'),
  preset('figura', 'Lupo', 'Un lupo grigio a quattro zampe, muso allungato e coda folta', 'bestia'),
  preset('figura', 'Slime', 'Una creatura gelatinosa verde e traslucida, a goccia, con due occhi', 'animale'),
];

interface TileDef {
  name?: string;
  description?: string;
  layer?: string;
  sprites?: string[];
  texture?: string;
}

const STRUCTURE_WORDS = /pozzo|fontana|statua|colonna|porta|portale|torre|altare|ponte|muro|cancello|edicola|mulino|forno/i;

/** Targets from the files of a universe (as GET /api/universe/<name> returns them). */
export function universeTargets(files: Record<string, string>): Target[] {
  const out: Target[] = [];
  const terrain = safe(files['modules/world.terrain/manifest.json']);
  for (const [code, t] of Object.entries((terrain?.tiles ?? {}) as Record<string, TileDef>)) {
    const layer = t.layer ?? '';
    if (!['rock', 'vegetation', 'wall', 'door'].includes(layer)) continue;
    const category: Category = layer === 'wall' || layer === 'door' ? 'struttura' : 'semplice';
    out.push({
      id: `tile:${code}`,
      name: t.name ?? code,
      category,
      kind: layer === 'rock' ? 'roccia' : layer === 'vegetation' ? 'albero' : 'monumento',
      description: [t.description, layer === 'vegetation' ? 'un ostacolo singolo (un albero o una pianta) che sta su una casella del terreno' : layer === 'rock' ? 'un ostacolo singolo (una roccia) che sta su una casella del terreno' : 'un tratto di muro o porta lungo una casella'].filter(Boolean).join('. '),
      sprite: t.sprites?.[0] ?? t.texture,
      ...(t.sprites && t.sprites.length > 1 ? { variants: t.sprites } : {}),
      source: `terreno "${code}" (${layer})`,
    });
  }
  for (const [file, text] of Object.entries(files)) {
    const m = /^modules\/([^/]+)\/manifest\.json$/.exec(file);
    if (!m) continue;
    const man = safe(text);
    if (!man || (man.kind !== 'entity' && man.kind !== 'player') || !man.appearance) continue;
    const figure = man.kind === 'player' || man.id?.startsWith('npc.') || !!man.persona;
    const name = man.kind === 'player' ? 'Viandante (il giocatore)' : String(man.name ?? man.id);
    const category: Category = figure ? 'figura' : STRUCTURE_WORDS.test(`${name} ${man.description ?? ''}`) ? 'struttura' : 'semplice';
    const description = man.kind === 'player' ? man.appearance.imagePrompt : man.description;
    out.push({
      id: `module:${man.id}`,
      name,
      category,
      kind: guessClass(`${name} ${description ?? ''} ${man.appearance.imagePrompt ?? ''}`, category).id,
      description,
      look: man.kind === 'player' ? undefined : man.appearance.imagePrompt,
      context: man.context,
      sprite: man.appearance.sprite,
      ...(man.appearance.frames ? { frames: man.appearance.frames } : {}),
      source: man.id,
    });
  }
  return out;
}

function safe(text: string | undefined): any {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

/** The first lines of the style guide: style, perspective, light, palette. */
export function styleOf(files: Record<string, string>): string | undefined {
  const s = files['world/style.md'];
  return s ? s.split('\n').filter((l) => /^(Stile|Prospettiva|Luce|Palette):/.test(l)).join('\n') || s.slice(0, 600) : undefined;
}
