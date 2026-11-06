// I 16 modelli MarkovJunior di Neapolis (models/<id>.xml) e le loro voci in models/index.json.
// Ogni programma ha una parte che cresce a caso: una «testa» sale finché non si ferma (una regola che sale, una che si
// ferma, scelte a caso con i loro pesi), poi il corpo si riempie in orizzontale fino a lì. Così semi diversi fanno
// cose davvero diverse di forma (un distributore più alto, una pila di cassette più bassa, un palazzo di un piano in più).
// node lab/banco/universi-cloud/neapolis/strumenti/modelli.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const DIR = 'lab/banco/universi-cloud/neapolis/models';

/** La crescita: la testa H sale nella zona Z col colore F (pesi: sale, si ferma), poi F riempie la zona fino a lì. */
const grow = (F, climb = 6, stop = 1, Z = 'Z', H = 'H') => `
  <one>
    <rule in="${Z} ${H}" out="${H} ${F}" p="${climb}"/>
    <rule in="${H}" out="${F}" p="${stop}"/>
  </one>
  <all in="${F}${Z}" out="${F}${F}" symmetry="(xy)"/>
  <all in="${Z}" out="B"/>`;
const hidden = (...s) => s.map((c) => `<color symbol="${c}" hidden="True"/>`).join('');
const col = (s, v, name, extra = '') => `<color symbol="${s}" value="${v}" name="${name}"${extra}/>`;

const MODELS = {
  distributore: { classe: 'furniture', nome: 'Distributore automatico', xml: `<!-- Distributore automatico: carrozzeria rossa di altezza diversa a ogni seme, vetrina, feritoia, insegna luminosa. -->
<sequence values="BZHTSRVKL" size="20 20 24" symmetry="(xy)" name="Distributore">
  ${hidden('Z', 'H')}
  ${col('T', 'c8302a', 'carrozzeria rossa')}${col('S', '8a1a18', 'sportello')}${col('R', '3a3a40', 'tetto')}
  ${col('V', 'a8d8f0', 'vetrina', ' alpha="0.6"')}${col('K', '2a2a2e', 'feritoia')}${col('L', 'fff0a0', 'insegna', ' glow="True"')}
  <box at="10 10 0" size="12 8 20" color="Z"/>
  <box at="10 10 0" size="12 8 10" color="T"/>
  <box at="10 10 10" size="1 1 1" color="H"/>${grow('T')}
  <all in="B T" out="R T"/>
  <box at="8 13 3" size="6 1 6" color="V" on="T"/>
  <box at="14 13 5" size="2 1 1" color="K" on="T"/>
  <box at="14 13 1" size="2 1 2" color="S" on="T"/>
  <box at="10 13 9" size="10 1 1" color="L" on="T"/>
</sequence>
` },
  'macchina-espresso': { classe: 'furniture', nome: 'Macchina del caffè espresso', xml: `<!-- Bancone del bar con la macchina dell'espresso: la caldaia cromata cresce a caso, le tazzine cadono dove capita. -->
<sequence values="BZHWMTRGCK" size="20 20 24" symmetry="(xy)" name="Macchina espresso">
  ${hidden('Z', 'H')}
  ${col('W', '7a4a2a', 'legno del bancone')}${col('M', 'e8e4dc', 'marmo')}${col('T', 'c8ccd0', 'cromo')}
  ${col('R', '5a5e64', 'griglia delle tazzine')}${col('G', 'd8a840', 'manometri')}${col('C', 'f8f8f0', 'tazzine')}${col('K', '2a2a2e', 'leve')}
  <box at="10 10 0" size="14 10 5" color="W"/>
  <box at="10 10 5" size="14 10 1" color="M"/>
  <box at="10 9 6" size="12 8 16" color="Z"/>
  <box at="10 9 6" size="12 8 2" color="T"/>
  <box at="10 9 8" size="1 1 1" color="H"/>${grow('T', 8, 1)}
  <all in="B T" out="R T"/>
  <box at="7 12 7" size="2 1 1" color="G" on="T"/>
  <box at="13 12 7" size="2 1 1" color="G" on="T"/>
  <box at="10 13 7" size="4 1 1" color="K" on="B"/>
  <one in="BB MM" out="CC MM" steps="4"/>
</sequence>
` },
  'scrivania-ufficio': { classe: 'furniture', nome: 'Scrivania e archivio', xml: `<!-- Scrivania d'ufficio con la macchina da scrivere e l'archivio a cassetti accanto: l'archivio ha un numero di cassetti diverso a ogni seme. -->
<sequence values="BZHKWDTSRP" size="20 20 24" symmetry="(xy)" name="Scrivania">
  ${hidden('Z', 'H')}
  ${col('K', '4a4e54', 'gambe di metallo')}${col('W', '9a8a70', 'piano di formica')}${col('D', '2a2a30', 'macchina da scrivere')}
  ${col('T', '8a9098', 'archivio grigio')}${col('S', '3a3e44', 'maniglie dei cassetti')}${col('R', '6a7078', 'coperchio')}${col('P', 'f0ecd8', 'carte')}
  <box at="3 6 0" size="1 1 8" color="K"/>
  <box at="3 13 0" size="1 1 8" color="K"/>
  <box at="13 6 0" size="1 1 8" color="K"/>
  <box at="13 13 0" size="1 1 8" color="K"/>
  <box at="8 10 8" size="13 9 1" color="W"/>
  <box at="7 9 9" size="4 3 2" color="D"/>
  <box at="17 10 0" size="5 7 22" color="Z"/>
  <box at="17 10 0" size="5 7 9" color="T"/>
  <box at="17 10 9" size="1 1 1" color="H"/>${grow('T', 8, 1)}
  <all in="B T" out="R T"/>
  <box at="17 14 2" size="2 1 1" color="S" on="T"/>
  <box at="17 14 5" size="2 1 1" color="S" on="T"/>
  <box at="17 14 8" size="2 1 1" color="S" on="T"/>
  <box at="17 14 11" size="2 1 1" color="S" on="T"/>
  <box at="17 14 14" size="2 1 1" color="S" on="T"/>
  <box at="17 14 17" size="2 1 1" color="S" on="T"/>
  <box at="17 14 20" size="2 1 1" color="S" on="T"/>
  <one in="B W" out="P W" steps="5"/>
</sequence>
` },
  'banco-officina': { classe: 'furniture', nome: 'Banco da officina', xml: `<!-- Banco da meccanico con la morsa e il pannello forato degli attrezzi, alto quanto capita. -->
<sequence values="BZHKMTVRAC" size="20 20 26" symmetry="(xy)" name="Banco officina">
  ${hidden('Z', 'H')}
  ${col('K', '3a4048', 'gambe di ferro')}${col('M', '6a7480', 'piano di lamiera')}${col('T', 'b89868', 'pannello forato')}
  ${col('V', '2a2a30', 'morsa')}${col('R', '5a4a3a', 'cornice')}${col('A', 'c84a3a', 'attrezzi rossi')}${col('C', 'd8d8e0', 'chiavi')}
  <box at="2 6 0" size="1 1 8" color="K"/>
  <box at="17 6 0" size="1 1 8" color="K"/>
  <box at="2 14 0" size="1 1 8" color="K"/>
  <box at="17 14 0" size="1 1 8" color="K"/>
  <box at="10 10 8" size="18 12 1" color="M"/>
  <box at="15 12 9" size="3 3 2" color="V"/>
  <box at="10 4 9" size="16 2 15" color="Z"/>
  <box at="10 4 9" size="16 2 2" color="T"/>
  <box at="10 4 11" size="1 1 1" color="H"/>${grow('T', 9, 1)}
  <all in="B T" out="R T"/>
  <box at="5 5 10" size="2 1 2" color="A" on="T"/>
  <box at="9 5 11" size="1 1 2" color="C" on="T"/>
  <box at="12 5 10" size="3 1 1" color="C" on="T"/>
  <box at="15 5 11" size="1 1 2" color="A" on="T"/>
</sequence>
` },
  'quadro-elettrico': { classe: 'furniture', nome: 'Cabina elettrica', xml: `<!-- Cabina elettrica di quartiere: cemento grigio, sportello di metallo, il cartello giallo del fulmine; alta quanto capita. -->
<sequence values="BZHTRSYK" size="20 20 26" symmetry="(xy)" name="Cabina elettrica">
  ${hidden('Z', 'H')}
  ${col('T', 'a8a49c', 'cemento')}${col('R', '6a6864', 'tetto di cemento')}${col('S', '5a6a7a', 'sportello di metallo')}
  ${col('Y', 'f0c820', 'cartello giallo')}${col('K', '2a2a2a', 'griglia')}
  <box at="10 10 0" size="12 10 22" color="Z"/>
  <box at="10 10 0" size="12 10 10" color="T"/>
  <box at="10 10 10" size="1 1 1" color="H"/>${grow('T', 6, 1)}
  <all in="B T" out="R T"/>
  <all in="RB" out="RR" steps="1"/>
  <box at="9 14 1" size="6 1 8" color="S" on="T"/>
  <box at="14 14 7" size="2 1 2" color="Y" on="T"/>
  <box at="4 10 5" size="1 4 2" color="K" on="T"/>
</sequence>
` },
  edicola: { classe: 'building', nome: 'Edicola', xml: `<!-- Edicola: il chiosco verde di lamiera con la tettoia che sporge e le riviste esposte; la tettoia sta più in alto o più in basso a ogni seme. -->
<sequence values="BZHTRVMNP" size="25 25 24" symmetry="(xy)" name="Edicola">
  ${hidden('Z', 'H')}
  ${col('T', '3a8a4a', 'lamiera verde')}${col('R', '2a6a3a', 'tettoia')}${col('V', 'b8d8e0', 'vetro', ' alpha="0.6"')}
  ${col('M', 'e86a8a', 'riviste rosa')}${col('N', 'f0e040', 'riviste gialle')}${col('P', 'e8e4d8', 'giornali')}
  <box at="12 12 0" size="15 11 20" color="Z"/>
  <box at="12 12 0" size="15 11 9" color="T"/>
  <box at="12 12 9" size="1 1 1" color="H"/>${grow('T', 5, 1)}
  <all in="B T" out="R T"/>
  <all in="RB" out="RR" steps="2"/>
  <box at="12 17 4" size="7 1 4" color="V" on="T"/>
  <box at="6 17 3" size="3 1 3" color="M" on="T"/>
  <box at="18 17 3" size="3 1 3" color="N" on="T"/>
  <box at="12 18 0" size="9 2 2" color="P"/>
</sequence>
` },
  transenna: { classe: 'furniture', nome: 'Transenna del cantiere', xml: `<!-- Transenna da cantiere a strisce rosse e bianche sui sacchi di sabbia, con la lampada gialla in cima; il pannello è alto quanto capita. -->
<sequence values="BZHTWFRL" size="20 20 20" symmetry="(xy)" name="Transenna">
  ${hidden('Z', 'H')}
  ${col('T', 'd83a2a', 'strisce rosse')}${col('W', 'f4f0e8', 'strisce bianche')}${col('F', 'b89a6a', 'sacchi di sabbia')}
  ${col('R', '3a3a3a', 'bordo')}${col('L', 'ffc040', 'lampada', ' glow="True"')}
  <box at="3 10 0" size="4 6 2" color="F"/>
  <box at="17 10 0" size="4 6 2" color="F"/>
  <box at="10 10 2" size="16 2 14" color="Z"/>
  <box at="10 10 2" size="16 2 4" color="T"/>
  <box at="10 10 6" size="1 1 1" color="H"/>${grow('T', 5, 1)}
  <all in="B T" out="R T"/>
  <one in="B R" out="L R" steps="1"/>
  <box at="5 10 2" size="2 2 16" color="W" on="T"/>
  <box at="9 10 2" size="2 2 16" color="W" on="T"/>
  <box at="13 10 2" size="2 2 16" color="W" on="T"/>
</sequence>
` },
  'cucina-trattoria': { classe: 'furniture', nome: 'Cucina della trattoria', xml: `<!-- Cucina a gas di trattoria: quattro fuochi, il forno, la cappa di rame che sale fino a dove capita, le pentole sul fuoco. -->
<sequence values="BZHTKDCPRF" size="20 20 26" symmetry="(xy)" name="Cucina">
  ${hidden('Z', 'H')}
  ${col('T', 'e8e0d0', 'smalto bianco')}${col('K', '2a2a2e', 'griglia dei fuochi')}${col('D', '3a3e44', 'sportello del forno')}
  ${col('C', 'c87a3a', 'rame della cappa')}${col('P', '8a8e94', 'pentole')}${col('R', '7a4a2a', 'bordo della cappa')}${col('F', 'ff8a3a', 'fiamma', ' glow="True"')}
  <box at="10 10 0" size="14 8 7" color="T"/>
  <box at="10 10 7" size="14 8 1" color="K"/>
  <box at="10 13 1" size="8 1 4" color="D" on="T"/>
  <box at="10 8 8" size="12 6 16" color="Z"/>
  <box at="10 8 8" size="12 6 1" color="C"/>
  <box at="10 8 9" size="1 1 1" color="H"/>${grow('C', 7, 1)}
  <all in="B C" out="R C"/>
  <one in="BB/BB KK/KK" out="PP/PP KK/KK" steps="2"/>
  <box at="5 13 6" size="1 1 1" color="F" on="T"/>
</sequence>
` },
  lampione: { classe: 'monument', nome: 'Lampione di ghisa', xml: `<!-- Lampione di ghisa verde: il palo sale fino a un'altezza diversa a ogni seme, in cima la lanterna gialla e il cappello. -->
<sequence values="BZHKPLR" size="20 20 60" symmetry="(xy)" name="Lampione">
  ${hidden('Z', 'H')}
  ${col('K', '2a3a2e', 'basamento')}${col('P', '2e5a3a', 'ghisa verde')}${col('L', 'ffd88a', 'lanterna', ' glow="True"')}${col('R', '1e2a22', 'cappello')}
  <box at="10 10 0" size="4 4 3" color="K"/>
  <box at="10 10 3" size="2 2 12" color="P"/>
  <box at="10 10 15" size="2 2 40" color="Z"/>
  <box at="10 10 15" size="1 1 1" color="H"/>${grow('P', 14, 1)}
  <all in="B P" out="L P"/>
  <all in="LB" out="LL" steps="1"/>
  <all in="B L" out="R L"/>
</sequence>
` },
  motorino: { classe: 'furniture', nome: 'Motorino', xml: `<!-- Motorino rosso con lo scudo, la sella e il portapacchi: sopra, una pila di cassette delle consegne alta quanto capita. -->
<sequence values="BZHDTKSCcR" size="20 20 22" symmetry="(x)" name="Motorino">
  ${hidden('Z', 'H')}
  ${col('D', '1e1e22', 'gomme')}${col('T', 'd83a2a', 'carrozzeria rossa')}${col('K', 'b8bcc4', 'manubrio cromato')}
  ${col('S', '2a2a2e', 'sella')}${col('C', 'c8a050', 'cassette')}${col('c', '8a6a30', 'bordo delle cassette')}${col('R', '7a5a2a', 'ultimo coperchio')}
  <box at="10 3 0" size="2 3 3" color="D"/>
  <box at="10 16 0" size="2 3 3" color="D"/>
  <box at="10 10 2" size="4 12 3" color="T"/>
  <box at="10 15 3" size="6 2 8" color="T"/>
  <box at="10 15 11" size="8 1 1" color="K"/>
  <box at="10 8 5" size="4 5 2" color="S"/>
  <box at="10 4 5" size="6 5 15" color="Z"/>
  <box at="10 4 5" size="6 5 1" color="C"/>
  <box at="10 4 6" size="1 1 1" color="H"/>${grow('C', 14, 1)}
  <all in="B C" out="R C"/>
  <box at="10 4 7" size="6 5 1" color="c" on="C"/>
  <box at="10 4 10" size="6 5 1" color="c" on="C"/>
  <box at="10 4 13" size="6 5 1" color="c" on="C"/>
  <box at="10 4 16" size="6 5 1" color="c" on="C"/>
</sequence>
` },
  'cabina-telefonica': { classe: 'monument', nome: 'Cabina telefonica', xml: `<!-- Cabina telefonica: telaio grigio, vetri su quattro lati, tetto arancione, il telefono a gettoni dentro; alta quanto capita. -->
<sequence values="BZHTVRK" size="20 20 36" symmetry="(xy)" name="Cabina telefonica">
  ${hidden('Z', 'H')}
  ${col('T', '9a9ca4', 'telaio grigio')}${col('V', 'a8d0e0', 'vetro', ' alpha="0.5"')}${col('R', 'e8742a', 'tetto arancione')}${col('K', '2a2a30', 'telefono')}
  <box at="10 10 0" size="8 8 1" color="T"/>
  <box at="10 10 1" size="8 8 30" color="Z"/>
  <box at="10 10 1" size="8 8 18" color="T"/>
  <box at="10 10 19" size="1 1 1" color="H"/>${grow('T', 6, 1)}
  <all in="B T" out="R T"/>
  <all in="RB" out="RR" steps="1"/>
  <box at="10 10 3" size="4 20 14" color="V" on="T"/>
  <box at="10 10 3" size="20 4 14" color="V" on="T"/>
  <box at="10 10 1" size="6 6 34" color="B" on="T"/>
  <box at="10 10 1" size="6 6 34" color="B" on="V"/>
  <box at="10 7 9" size="2 1 3" color="K"/>
</sequence>
` },
  cassonetto: { classe: 'furniture', nome: 'Cassonetto', xml: `<!-- Cassonetto verde con il coperchio: i sacchi neri traboccano in un mucchio diverso a ogni seme. -->
<sequence values="BYGTDgw" size="20 20 20" symmetry="(xy)" name="Cassonetto">
  ${hidden('Y')}
  ${col('T', '3a6a3a', 'plastica verde')}${col('D', '2a3a2a', 'coperchio')}${col('G', '1e1e22', 'sacchi neri')}${col('g', '3a3a40', 'sacchi lucidi')}${col('w', '2a2a2a', 'ruote')}
  <box at="10 10 0" size="12 8 8" color="T"/>
  <box at="10 10 8" size="14 10 1" color="D"/>
  <box at="10 10 9" size="16 12 10" color="Y"/>
  <box at="10 10 9" size="1 1 1" color="G"/>
  <one steps="420">
    <rule in="GY" out="GG"/>
    <rule in="Y G" out="G G"/>
  </one>
  <all in="Y" out="B"/>
  <prl in="G" out="g" p="0.25"/>
</sequence>
` },
  'casa-comune-edificio-f2e1f8de': { classe: 'building', nome: 'Palazzina di tufo (piccola)', xml: house(25, 24, 19, 17, 10, 22, [3, 13], 6) },
  'casa-comune-grande-f2e1f8de': { classe: 'structure', nome: 'Palazzina di tufo (grande)', xml: house(40, 40, 32, 28, 14, 36, [3, 15, 26], 6) },
  'struttura-torre-di-vetro': { classe: 'structure', nome: 'Torre di vetro', xml: `<!-- Torre di vetro del Centro Direzionale: cemento e fasce di vetro azzurro, piani in più o in meno a ogni seme, la piazza di marmo attorno. -->
<sequence values="BZHMTVRDA" size="40 40 48" symmetry="(xy)" name="Torre di vetro">
  ${hidden('Z', 'H')}
  ${col('M', 'd8d4cc', 'marmo della piazza')}${col('T', 'b8b4ac', 'cemento')}${col('V', '7ab8d8', 'vetro azzurro', ' alpha="0.6"')}
  ${col('R', '5a5e64', 'tetto')}${col('D', '2a3a4a', 'ingresso')}${col('A', 'c8c8d0', 'antenna')}
  <box at="20 20 0" size="30 30 1" color="M"/>
  <box at="20 20 1" size="20 20 46" color="Z"/>
  <box at="20 20 1" size="20 20 15" color="T"/>
  <box at="20 20 16" size="1 1 1" color="H"/>${grow('T', 9, 1)}
  <all in="B T" out="R T"/>
  ${[3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43].map((z) => `<box at="20 20 ${z}" size="40 40 2" color="V" on="T"/>`).join('\n  ')}
  <box at="20 20 1" size="18 18 46" color="B" on="T"/>
  <box at="20 20 1" size="18 18 46" color="B" on="V"/>
  <box at="20 20 9" size="18 18 1" color="M" on="B"/>
  <box at="20 30 1" size="4 1 5" color="B" on="T"/>
  <box at="20 30 1" size="4 1 5" color="B" on="V"/>
  <one in="B R" out="A R" steps="1"/>
  <all in="B A" out="A A" steps="4"/>
</sequence>
` },
  'struttura-mercato-coperto': { classe: 'structure', nome: 'Mercato coperto', xml: `<!-- Mercato coperto di mattoni rossi: grandi archi sul davanti, tende a righe sopra i banchi, il tetto più o meno alto a ogni seme. -->
<sequence values="BZHTRWAVF" size="40 40 32" symmetry="(xy)" name="Mercato coperto">
  ${hidden('Z', 'H')}
  ${col('T', 'a84a32', 'mattoni rossi')}${col('R', '6a6e74', 'tetto di lamiera')}${col('W', 'e8dcc0', 'cornici di pietra')}
  ${col('A', 'e8c040', 'tende gialle')}${col('V', 'a8c8d0', 'lucernari', ' alpha="0.6"')}${col('F', 'c8beb0', 'pavimento')}
  <box at="20 20 0" size="34 22 1" color="F"/>
  <box at="20 20 1" size="34 22 26" color="Z"/>
  <box at="20 20 1" size="34 22 8" color="T"/>
  <box at="20 20 9" size="1 1 1" color="H"/>${grow('T', 5, 1)}
  <all in="B T" out="R T"/>
  <box at="20 20 4" size="34 22 1" color="W" on="T"/>
  <box at="20 20 1" size="32 20 30" color="B" on="T"/>
  <box at="10 30 1" size="5 1 6" color="B" on="T"/>
  <box at="20 30 1" size="5 1 6" color="B" on="T"/>
  <box at="30 30 1" size="5 1 6" color="B" on="T"/>
  <box at="10 32 7" size="7 3 1" color="A"/>
  <box at="30 32 7" size="7 3 1" color="A"/>
  <one in="B R" out="V R" steps="6"/>
</sequence>
` },
};

/** Una palazzina di tufo: piano terra fisso, piani in più o in meno a ogni seme, vuota dentro con il solaio, finestre con le persiane, balcone, antenne. */
function house(S, Hmax, W, D, zFix, zTop, rows, climb) {
  const c = Math.floor(S / 2);
  const x0 = c - Math.floor(W / 2), y0 = c - Math.floor(D / 2), front = y0 + D - 1;
  const win = [];
  for (let x = x0 + 3; x <= x0 + W - 4; x += 4) for (const z of rows) win.push(`<box at="${x} ${c} ${z}" size="2 ${S} 3" color="V" on="T"/>`, `<box at="${x - 1} ${c} ${z}" size="1 ${S} 3" color="G" on="T"/>`);
  for (let y = y0 + 3; y <= y0 + D - 4; y += 4) for (const z of rows) win.push(`<box at="${c} ${y} ${z}" size="${S} 2 3" color="V" on="T"/>`);
  return `<!-- Palazzina di tufo di Neapolis (la casa comune della città): intonaco ocra, persiane verdi, balcone di ferro, tetto piano con le antenne; piani in più o in meno a ogni seme. -->
<sequence values="BZHTVGKRFDA" size="${S} ${S} ${Hmax}" symmetry="(xy)" name="Palazzina">
  ${hidden('Z', 'H')}
  ${col('T', 'd8b070', 'intonaco ocra')}${col('V', '8ab0c8', 'vetri', ' alpha="0.6"')}${col('G', '3a7a4a', 'persiane verdi')}
  ${col('K', '3a3a40', 'ferro dei balconi')}${col('R', 'a89c88', 'terrazzo')}${col('F', 'b89870', 'solaio')}${col('D', '4a6a3a', 'portone')}${col('A', '6a6a70', 'antenne')}
  <box at="${c} ${c} 0" size="${W} ${D} ${zTop}" color="Z"/>
  <box at="${c} ${c} 0" size="${W} ${D} ${zFix}" color="T"/>
  <box at="${c} ${c} ${zFix}" size="1 1 1" color="H"/>${grow('T', climb, 1)}
  <all in="B T" out="R T"/>
  ${win.join('\n  ')}
  <box at="${c} ${c} 1" size="${W - 2} ${D - 2} ${Hmax}" color="B" on="T"/>
  <box at="${c} ${c} 1" size="${W - 2} ${D - 2} ${Hmax}" color="B" on="V"/>
  <box at="${c} ${c} 1" size="${W - 2} ${D - 2} ${Hmax}" color="B" on="G"/>
  <box at="${c} ${c} ${zFix - 1}" size="${W - 2} ${D - 2} 1" color="F" on="B"/>
  <box at="${c} ${front} 1" size="3 1 5" color="D" on="T"/>
  <box at="${c} ${front} 1" size="3 1 5" color="D" on="V"/>
  <box at="${c} ${front + 1} ${rows[0] + 3}" size="7 2 1" color="K"/>
  <one in="B R" out="A R" steps="2"/>
  <all in="B A" out="A A" steps="3"/>
</sequence>
`;
}

const index = JSON.parse(readFileSync(`${DIR}/index.json`, 'utf8'));
for (const [id, m] of Object.entries(MODELS)) {
  writeFileSync(`${DIR}/${id}.xml`, m.xml);
  index[id] = { classe: m.classe, nome: m.nome, autore: 'a mano (Claude Code, Neapolis)' };
}
writeFileSync(`${DIR}/index.json`, JSON.stringify(index, null, 1) + '\n');
console.log(Object.keys(MODELS).join(' '));
