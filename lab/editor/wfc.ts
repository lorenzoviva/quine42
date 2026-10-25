// MarkovJunior Model Editor: WFC (WaveFunctionCollapse) Configuration & Generator (T59d).
// Provides guided configuration, presets, and code generation for both standard WFC blocks and native MarkovJunior constraint networks.

export type WfcOutputMode = 'mj_native' | 'wfc_standard';

export interface WfcTile {
  name: string;
  symbol: string;
  color: string;
  weight?: number;
}

export interface WfcPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  size: [number, number, number];
  periodic: boolean;
  symmetry: string;
  tiles: WfcTile[];
  standardWfcXml: string;
  nativeMjXml: string;
}

export interface WfcConfig {
  presetId?: string;
  mode: WfcOutputMode;
  size: [number, number, number];
  periodic: boolean;
  symmetry: string;
  tiles: WfcTile[];
  sampleName?: string;
  n?: number;
  comment?: string;
}

export const WFC_PRESETS: WfcPreset[] = [
  {
    id: 'pipes',
    name: 'Tubi 3D (Pipes)',
    description: 'Rete tridimensionale di tubature e condotti continui senza interruzioni.',
    icon: '⌭',
    size: [12, 12, 12],
    periodic: false,
    symmetry: '(xyz+)',
    tiles: [
      { name: 'Vuoto / Aria', symbol: 'B', color: '#1a1e2e', weight: 10 },
      { name: 'Condotto X', symbol: 'R', color: '#ff004d', weight: 3 },
      { name: 'Condotto Y', symbol: 'G', color: '#00e436', weight: 3 },
      { name: 'Condotto Z', symbol: 'Y', color: '#ffec27', weight: 3 },
      { name: 'Raccordo / Curva', symbol: 'C', color: '#29adff', weight: 2 },
    ],
    standardWfcXml: `<!-- Configurazione WFC Standard: Tubi 3D (Overlapping Model) -->
<wfc sample="Pipes3D" size="12 12 12" n="2" periodic="False" symmetry="8">
  <!-- Tessere: B=Aria, R=TuboX, G=TuboY, Y=TuboZ, C=Curva -->
</wfc>`,
    nativeMjXml: `<!-- Modello WFC Nativo: Tubi 3D (Rete di condotti procedurali) -->
<sequence values="0BRGYC" size="12 12 12" origin="True">
  <color symbol="R" value="ff004d" name="condotto_x"/>
  <color symbol="G" value="00e436" name="condotto_y"/>
  <color symbol="Y" value="ffec27" name="condotto_z"/>
  <color symbol="C" value="29adff" name="nodo_curva"/>
  <!-- Semina iniziale punti di connessione -->
  <one in="B" out="C" steps="8" symmetry="(xyz+)"/>
  <!-- Propagazione vincolata dei tubi lungo gli assi principali -->
  <prl steps="10" symmetry="(xy)">
    <rule in="C B" out="C R" p="0.45"/>
    <rule in="B C" out="R C" p="0.45"/>
    <rule in="C/B" out="C/G" p="0.45"/>
    <rule in="B/C" out="G/C" p="0.45"/>
  </prl>
  <prl steps="6" symmetry="(xyz+)">
    <rule in="R B" out="R R" p="0.35"/>
    <rule in="G/B" out="G/G" p="0.35"/>
    <rule in="R G" out="R C"/>
    <rule in="G R" out="G C"/>
  </prl>
</sequence>`,
  },
  {
    id: 'maze',
    name: 'Labirinto 3D (Maze)',
    description: 'Percorsi interconnessi su più livelli con corridoi continui e stanze di raccordo.',
    icon: '⚏',
    size: [14, 14, 10],
    periodic: false,
    symmetry: '(xy)',
    tiles: [
      { name: 'Spazio / Aria', symbol: '0', color: '#0c0e14', weight: 5 },
      { name: 'Muro Labirinto', symbol: 'W', color: '#5f574f', weight: 4 },
      { name: 'Sentiero / Passaggio', symbol: 'P', color: '#ffccaa', weight: 4 },
      { name: 'Porta / Snodo', symbol: 'D', color: '#ab5236', weight: 1 },
    ],
    standardWfcXml: `<!-- Configurazione WFC Standard: Labirinto 3D (Tiled Constraint Model) -->
<wfc tileset="Maze3D" size="14 14 10" periodic="False" symmetry="(xy)">
  <!-- Vincoli: corridoi P connessi a P, muri W delimitano i passaggi -->
</wfc>`,
    nativeMjXml: `<!-- Modello WFC Nativo: Labirinto 3D con sentieri garantiti -->
<sequence values="0WPD" size="14 14 10">
  <color symbol="W" value="5f574f" name="muro"/>
  <color symbol="P" value="ffccaa" name="passaggio"/>
  <color symbol="D" value="ab5236" name="porta_snodo"/>
  <!-- Fondamenta piene -->
  <box at="7 7 0" size="14 14 1" color="W"/>
  <!-- Rete volumetrica di blocchi divisori -->
  <all in="0" out="W" steps="1"/>
  <!-- Scavo iniziale corridoio centrale -->
  <one in="W" out="P" steps="1"/>
  <!-- Propagazione e allargamento passaggi senza vicoli ciechi -->
  <prl steps="20" symmetry="(xy)">
    <rule in="P W" out="P P" p="0.35"/>
    <rule in="P/W" out="P/P" p="0.35"/>
  </prl>
  <!-- Posizionamento porte di raccordo agli incroci -->
  <all steps="2" symmetry="(xy)">
    <rule in="W P W" out="W D W"/>
  </all>
</sequence>`,
  },
  {
    id: 'castle',
    name: 'Castello & Mura (Castle)',
    description: 'Mura di cinta, merlature, torri di raccordo angolari, porte e cortile centrale.',
    icon: '♜',
    size: [16, 16, 12],
    periodic: false,
    symmetry: '(xy)',
    tiles: [
      { name: 'Aria', symbol: '0', color: '#000000', weight: 1 },
      { name: 'Pietra Mura', symbol: 'P', color: '#787a85', weight: 6 },
      { name: 'Pietra Scura', symbol: 'D', color: '#4e505a', weight: 3 },
      { name: 'Merlatura', symbol: 'C', color: '#9ca0ad', weight: 2 },
      { name: 'Portone Legno', symbol: 'I', color: '#8c5327', weight: 1 },
    ],
    standardWfcXml: `<!-- Configurazione WFC Standard: Castello Modulare -->
<wfc tileset="CastleSet" size="16 16 12" periodic="False" symmetry="(xy)">
  <!-- Tessere: P=Muro, D=Angolo, C=Merlatura, I=Portone -->
</wfc>`,
    nativeMjXml: `<!-- Modello WFC Nativo: Castello procedurale con mura e torri -->
<sequence values="0PDCI" size="16 16 12" symmetry="(xy)">
  <color symbol="P" value="787a85" name="pietra"/>
  <color symbol="D" value="4e505a" name="pietra_scura"/>
  <color symbol="C" value="9ca0ad" name="merlatura"/>
  <color symbol="I" value="8c5327" name="portone"/>
  <!-- Cortile e platea di base -->
  <box at="8 8 0" size="14 14 1" color="D"/>
  <!-- Perimetro mura esterne -->
  <box at="8 8 1" size="14 14 6" color="P"/>
  <box at="8 8 1" size="10 10 7" color="0"/>
  <!-- Torri ai quattro angoli -->
  <box at="2 2 1" size="4 4 9" color="D"/>
  <box at="14 2 1" size="4 4 9" color="D"/>
  <box at="2 14 1" size="4 4 9" color="D"/>
  <box at="14 14 1" size="4 4 9" color="D"/>
  <!-- Vano portone d'ingresso -->
  <box at="8 15 1" size="2 2 4" color="I"/>
  <!-- Merlature sommitali alternate -->
  <prl steps="1" symmetry="(xy)">
    <rule in="P 0 P" out="P C P"/>
  </prl>
</sequence>`,
  },
  {
    id: 'dungeon',
    name: 'Dungeon Modulare (Rooms)',
    description: 'Stanze adiacenti separate da pareti modulari, colonne di sostegno e varchi.',
    icon: '▣',
    size: [14, 14, 8],
    periodic: false,
    symmetry: '(xy)',
    tiles: [
      { name: 'Aria', symbol: '0', color: '#000000', weight: 1 },
      { name: 'Pavimento', symbol: 'F', color: '#303440', weight: 5 },
      { name: 'Muro Divisorio', symbol: 'W', color: '#686b7c', weight: 4 },
      { name: 'Pilastro / Colonna', symbol: 'C', color: '#888d9d', weight: 2 },
      { name: 'Varco / Apertura', symbol: 'D', color: '#d27d2c', weight: 1 },
    ],
    standardWfcXml: `<!-- Configurazione WFC Standard: Dungeon Modulare -->
<wfc tileset="DungeonModular" size="14 14 8" periodic="False" symmetry="(xy)">
  <!-- Vincoli: stanze chiuse da pareti W con porte D sui passaggi -->
</wfc>`,
    nativeMjXml: `<!-- Modello WFC Nativo: Dungeon modulare con stanze e pilastri -->
<sequence values="0FWCD" size="14 14 8" symmetry="(xy)">
  <color symbol="F" value="303440" name="pavimento"/>
  <color symbol="W" value="686b7c" name="muro"/>
  <color symbol="C" value="888d9d" name="colonna"/>
  <color symbol="D" value="d27d2c" name="varco"/>
  <!-- Pavimentazione integrale -->
  <box at="7 7 0" size="12 12 1" color="F"/>
  <!-- Pareti perimetrali e divisorie -->
  <box at="7 7 1" size="12 12 4" color="W"/>
  <box at="4 4 1" size="4 4 5" color="0"/>
  <box at="10 4 1" size="4 4 5" color="0"/>
  <box at="4 10 1" size="4 4 5" color="0"/>
  <box at="10 10 1" size="4 4 5" color="0"/>
  <!-- Pilastri strutturali centrali -->
  <cylinder at="7 7 1" size="2 2 4" color="C"/>
  <!-- Aperture e porte di comunicazione tra ambienti -->
  <all in="W" out="D" steps="2" symmetry="(xy)"/>
</sequence>`,
  },
  {
    id: 'islands',
    name: 'Terreno a Isole (Islands)',
    description: 'Stratificazione geologica naturale a vincolo continuo: Acqua -> Spiaggia -> Prato -> Picco.',
    icon: '▲',
    size: [16, 16, 8],
    periodic: false,
    symmetry: '(xy)',
    tiles: [
      { name: 'Acqua Profonda', symbol: 'U', color: '#1d2b53', weight: 6 },
      { name: 'Spiaggia Sabbia', symbol: 'S', color: '#ffa300', weight: 4 },
      { name: 'Erba / Prato', symbol: 'G', color: '#00e436', weight: 5 },
      { name: 'Roccia Montagna', symbol: 'R', color: '#7e2553', weight: 2 },
    ],
    standardWfcXml: `<!-- Configurazione WFC Standard: Terreno Isola (Adjacency Graph) -->
<wfc tileset="TerrainIslands" size="16 16 8" periodic="False" symmetry="(xy)">
  <!-- Vincolo di adiacenza altimetrica: U tocca S; S tocca U e G; G tocca S e R; R tocca G -->
</wfc>`,
    nativeMjXml: `<!-- Modello WFC Nativo: Terreno procedurale a vincolo naturale -->
<sequence values="0USGR" size="16 16 8" symmetry="(xy)">
  <color symbol="U" value="1d2b53" name="acqua"/>
  <color symbol="S" value="ffa300" name="sabbia"/>
  <color symbol="G" value="00e436" name="erba"/>
  <color symbol="R" value="7e2553" name="roccia"/>
  <!-- Specchio d'acqua di base -->
  <box at="8 8 0" size="16 16 2" color="U"/>
  <!-- Emersione isola centrale -->
  <cylinder at="8 8 1" size="12 12 2" color="S"/>
  <cylinder at="8 8 2" size="8 8 2" color="G"/>
  <cone at="8 8 4" size="4 4 3" color="R"/>
  <!-- Sfumatura e irregolarità organica dei contorni -->
  <prl steps="2" symmetry="(xy)">
    <rule in="S U" out="S S" p="0.3"/>
    <rule in="G S" out="G G" p="0.25"/>
    <rule in="R G" out="R R" p="0.2"/>
  </prl>
</sequence>`,
  },
];

/**
 * Generates XML based on WFC configuration.
 */
export function generateWfcXml(config: WfcConfig): string {
  const { mode, presetId, size, periodic, symmetry, tiles, sampleName, n, comment } = config;

  // If a preset was selected and requested in native MarkovJunior mode
  if (mode === 'mj_native') {
    if (presetId) {
      const preset = WFC_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        return preset.nativeMjXml;
      }
    }

    // Generic native MJ constraint model from custom configuration
    const valStr = '0' + tiles.map((t) => t.symbol).join('');
    const lines: string[] = [];
    if (comment) lines.push(`<!-- ${comment} -->`);
    lines.push(`<!-- Modello a vincoli generato con WFC Wizard -->`);
    lines.push(
      `<sequence values="${valStr}" size="${size[0]} ${size[1]} ${size[2]}" symmetry="${symmetry}">`,
    );

    for (const t of tiles) {
      const hexClean = t.color.replace('#', '');
      lines.push(`  <color symbol="${t.symbol}" value="${hexClean}" name="${t.name.toLowerCase().replace(/\s+/g, '_')}"/>`);
    }

    // Base shape and propagation
    if (tiles.length >= 2) {
      const t0 = tiles[0].symbol;
      const t1 = tiles[1].symbol;
      lines.push(`  <box at="${Math.floor(size[0] / 2)} ${Math.floor(size[1] / 2)} 0" size="${size[0]} ${size[1]} 1" color="${t0}"/>`);
      lines.push(`  <one in="${t0}" out="${t1}" steps="4" symmetry="${symmetry}"/>`);
      lines.push(`  <prl steps="5" symmetry="${symmetry}">`);
      lines.push(`    <rule in="${t1} ${t0}" out="${t1} ${t1}" p="0.4"/>`);
      lines.push(`  </prl>`);
    }

    lines.push(`</sequence>`);
    return lines.join('\n');
  }

  // Otherwise, Standard WFC XML format
  const lines: string[] = [];
  if (comment) lines.push(`<!-- ${comment} -->`);

  const pStr = periodic ? 'True' : 'False';
  const sample = sampleName || (presetId ? `${presetId.toUpperCase()}3D` : 'Sample3D');
  const nVal = n || 2;

  lines.push(`<!-- Configurazione WFC MarkovJunior Standard -->`);
  lines.push(
    `<wfc sample="${sample}" size="${size[0]} ${size[1]} ${size[2]}" n="${nVal}" periodic="${pStr}" symmetry="${symmetry}">`,
  );
  lines.push(`  <!-- Tessere e Pesi vincolati: -->`);
  for (const t of tiles) {
    const w = t.weight ? ` weight="${t.weight}"` : '';
    lines.push(`  <!-- ${t.symbol}: ${t.name}${w} -->`);
  }
  lines.push(`</wfc>`);

  return lines.join('\n');
}
