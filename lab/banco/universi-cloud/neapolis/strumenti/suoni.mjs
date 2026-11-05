// Gli 8 programmi sonori di Neapolis: 5 brani e 3 effetti, varianti di città dei programmi del seme (tempo, scala, tonica,
// timbro, dinamica e qualche disegno ritmico o melodico diverso). Il direttore li sceglie per ambiente e momento
// (models/index.json → suono); i 3 effetti prendono il posto di oggetto, arpeggio e guasto, che qui non ci sono più.
// node lab/banco/universi-cloud/neapolis/strumenti/suoni.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
const SEED = 'universe/models';
const DIR = 'lab/banco/universi-cloud/neapolis/models';
const URBANI = ['piazza', 'rione', 'corso', 'uffici', 'mercato', 'stazione', 'cantiere', 'lungomare', 'porto', 'officine', 'collina', 'parco'];

function variant(base, { comment, name, sound, tracks, swaps = [] }) {
  let x = readFileSync(`${SEED}/${base}.xml`, 'utf8');
  x = x.replace(/^<!--[\s\S]*?-->/, `<!-- ${comment} -->`);
  x = x.replace(/name="[^"]*"/, `name="${name}"`);
  x = x.replace(/<sound [^>]*>/, `<sound ${Object.entries(sound).map(([k, v]) => `${k}="${v}"`).join(' ')}>`);
  if (tracks) x = x.replace(/(<track y="(\d)" instrument="[a-z]+" volume=")[^"]*"/g, (_, head, y) => `${head}${tracks[Number(y)]}"`);
  for (const [a, b] of swaps) {
    if (!x.includes(a)) throw new Error(`${name}: manca «${a}»`);
    x = x.replace(a, b);
  }
  return x;
}

const SOUNDS = {
  'suono-musica-neapolis-mercato': { nome: 'Mercato', suono: { uso: 'musica', ambienti: ['piazza', 'mercato', 'rione', 'parco', 'collina'], momenti: ['mattina', 'giorno'] },
    xml: variant('suono-musica-pastorale', { comment: 'Di giorno, tra la piazza, il mercato e i vicoli: pentatonica svelta, swing da mandolino, hi-hat fitto come le voci dei banchi.', name: 'Mercato',
      sound: { bpm: 104, scale: 'pentatonic_minor', root: 52, swing: 0.16, cutoff: 4200, space: 0.35 }, tracks: [0.66, 0.55, 0.72],
      swaps: [['out="KBBBHBBBKBBBHBBB" p="3"', 'out="KBHBHBBBKBHBHBBB" p="3"'], ['<rule in="MBB" out="NBM" p="3"/>', '<rule in="MBB" out="NBM" p="4"/>']] }) },
  'suono-musica-neapolis-corso': { nome: 'Corso', suono: { uso: 'musica', ambienti: ['corso', 'uffici', 'stazione', 'officine', 'cantiere'], momenti: ['mattina', 'giorno'] },
    xml: variant('suono-musica-pietra', { comment: 'Di giorno, sul corso, tra gli uffici, la stazione e il cantiere: minore armonica a passo di tram, cassa e rullante come i motorini.', name: 'Corso',
      sound: { bpm: 112, scale: 'harmonic_minor', root: 47, swing: 0.06, cutoff: 4400, space: 0.35 }, tracks: [0.62, 0.58, 0.8] }) },
  'suono-musica-neapolis-porto': { nome: 'Porto', suono: { uso: 'musica', ambienti: ['porto', 'lungomare'], momenti: ['mattina', 'giorno'] },
    xml: variant('suono-musica-selva', { comment: 'Di giorno, sulle banchine e sul lungomare: una scala antica e larga, poche note e molto spazio, come il mare tra una gru e l’altra.', name: 'Porto',
      sound: { bpm: 70, scale: 'hirajoshi', root: 50, swing: 0.04, cutoff: 2800, space: 0.7 }, tracks: [0.56, 0.7, 0.66] }) },
  'suono-musica-neapolis-sera': { nome: 'Sera in città', suono: { uso: 'musica', ambienti: URBANI, momenti: ['sera'] },
    xml: variant('suono-musica-tramonto', { comment: 'La sera in città: le sedie in strada, le radio accese dalle finestre; dorico lento con lo swing.', name: 'Sera in città',
      sound: { bpm: 78, scale: 'dorian', root: 50, swing: 0.14, cutoff: 3000, space: 0.5 }, tracks: [0.6, 0.66, 0.66] }) },
  'suono-musica-neapolis-notte': { nome: 'Notte in città', suono: { uso: 'musica', ambienti: URBANI, momenti: ['notte'] },
    xml: variant('suono-musica-notte', { comment: 'La notte in città: il pad della radio lontana, poche note come i lampioni rimasti accesi.', name: 'Notte in città',
      sound: { bpm: 60, scale: 'phrygian', root: 47, swing: 0.03, cutoff: 1800, space: 0.75 }, tracks: [0.45, 0.72, 0.52] }) },
  'suono-effetto-tazzina': { nome: 'Tazzina', suono: { uso: 'effetto', effetti: ['oggetto'] },
    xml: variant('suono-effetto-oggetto', { comment: 'Una cosa presa o usata: il tintinnio della tazzina sul piattino, due note chiare.', name: 'Tazzina',
      sound: { bpm: 320, scale: 'pentatonic_minor', root: 86, swing: 0, cutoff: 9000, space: 0.12 }, tracks: [0.85] }) },
  'suono-effetto-campanello': { nome: 'Campanello del tram', suono: { uso: 'effetto', effetti: ['arpeggio'] },
    xml: variant('suono-effetto-arpeggio', { comment: 'Qualcosa di fatto (una ricetta, una frase incisa, la partenza): il campanello del tram, un accordo sgranato. Il seme ne cambia la forma.', name: 'Campanello',
      sound: { bpm: 220, scale: 'harmonic_minor', root: 74, swing: 0, cutoff: 8500, space: 0.25 }, tracks: [0.85] }) },
  'suono-effetto-blackout': { nome: 'Blackout', suono: { uso: 'effetto', effetti: ['guasto'] },
    xml: variant('suono-effetto-guasto', { comment: 'Qualcosa si è rotto: la corrente che salta, scatti e ronzii, mai uguali.', name: 'Blackout',
      sound: { bpm: 340, scale: 'phrygian', root: 45, swing: 0, cutoff: 6000, space: 0.2 }, tracks: [0.9],
      swaps: [['<one in="B" out="H" steps="6"/>', '<one in="B" out="H" steps="7"/>']] }) },
};

const index = JSON.parse(readFileSync(`${DIR}/index.json`, 'utf8'));
// Gli effetti che i tre nuovi sostituiscono: un effetto, un programma.
for (const old of ['suono-effetto-oggetto', 'suono-effetto-arpeggio', 'suono-effetto-guasto']) {
  rmSync(`${DIR}/${old}.xml`, { force: true });
  delete index[old];
}
for (const [id, s] of Object.entries(SOUNDS)) {
  writeFileSync(`${DIR}/${id}.xml`, s.xml);
  index[id] = { classe: 'suono', nome: s.nome, autore: 'a mano (Claude Code, Neapolis)', suono: s.suono };
}
writeFileSync(`${DIR}/index.json`, JSON.stringify(index, null, 1) + '\n');
console.log(Object.keys(SOUNDS).join(' '));
