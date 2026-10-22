// What the lab sculpts in its trials: presets for figures, plants, things and structures, and the style
// lines of a universe's style guide.

import type { Category, Target } from './target';

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
  // 2. Strutture
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



/** The first lines of the style guide: style, perspective, light, palette. */
export function styleOf(files: Record<string, string>): string | undefined {
  const s = files['world/style.md'];
  return s ? s.split('\n').filter((l) => /^(Stile|Forme|Prospettiva|Luce|Palette):/.test(l)).join('\n') || s.slice(0, 600) : undefined;
}
