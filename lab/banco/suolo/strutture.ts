// The structures with a cellar of D33: four large buildings with one tile under the ground (`lab/banco/suolo/strutture/<id>.xml`).

import type { Bersaglio } from '../misure';

/** The four buildings: each a large structure (classe grande) with one tile under the ground. */
export const STRUTTURE: Bersaglio[] = [
  { id: 'vinicola', nome: 'Cantina vinicola', stile: 'campagna: tufo, coppi, legno di castagno', descrizione: 'Casa del vignaiolo con la sala di vendita, il torchio, una scala che scende alla cantina delle botti grandi, le stanze sopra.', classe: 'structure', sotto: 1 },
  { id: 'cripta', nome: 'Tempio con la cripta', stile: 'sacro: marmo chiaro, oro, pietra scura', descrizione: 'Aula con le colonne, una sacrestia, la scala che scende alla cripta tra i pilastri, una loggia in alto.', classe: 'structure', sotto: 1 },
  { id: 'torre', nome: 'Torre con il sotterraneo', stile: 'fortezza: pietra grigia, ferro, legno scuro', descrizione: 'Corpo di guardia con la torre, una scala che scende al sotterraneo con le celle, una sala d’armi sopra.', classe: 'structure', sotto: 1 },
  { id: 'laboratorio', nome: 'Laboratorio ipogeo', stile: 'alchimia: mattoni, rame, vetro verde', descrizione: 'Bottega dell’alchimista con il bancone, una scala che scende al laboratorio sotto terra tra gli scaffali e i fornelli, lo studio sopra.', classe: 'structure', sotto: 1 },
];

