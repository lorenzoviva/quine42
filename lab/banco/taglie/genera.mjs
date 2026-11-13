// Writes the programs of the bench of the sizes (T338, T346, README.md) whose patterns are long (a stair of 27 × 12, the fence lines
// from centre to centre): they are written here by repetition, the XML is what runs. The parts they include (part-stair, part-door,
// part-battlements, part-slits) are written by parti.mjs into universe/models/.
//
//   node lab/banco/taglie/genera.mjs

import fs from 'node:fs';

const rep = (s, n) => s.repeat(n);
const rows = (row, n) => Array(n).fill(row).join('/');
const layers = (...ls) => ls.join(' ');
/** A rectangle of `w` × `h` with a letter by the distance from its edge: `ring(d, x, y)` gives it. */
const square = (w, h, ring) => {
  const out = [];
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) r += ring(Math.min(x, y, w - 1 - x, h - 1 - y), x, y);
    out.push(r);
  }
  return out.join('/');
};
/** A block of `w` × `h` of one letter, for the maps. */
const block = (c, w = 10, h = 10) => rows(rep(c, w), h);
/** A row pattern turned: the same text as columns (for the vertical version of a line). */
const turned = (row) => row.split('').join('/');
/** A 10 × 10 block of `ground` with `line` (10 letters) on its middle row, horizontal, or as a column. */
const lined = (ground, line, vertical) => {
  const g = rep(ground, 10);
  if (!vertical) return rows(g, 5) + '/' + line + '/' + rows(g, 4);
  return line.split('').map((c) => rep(ground, 5) + c + rep(ground, 4)).join('/');
};

/**
 * The stair's strip (T346: part-stair builds the stair): in the back left corner (the back wall's row, the side wall's column), 11
 * rows of floor; a landing of 10 by the side wall (a body stands off a wall by its half-width) and a strip of 16 × 11 along the back
 * wall after it, in the air above the floor.
 */
const strip = (wall, floor) => ({
  in: layers(`${rep(wall, 27)}/${rows(wall + rep('B', 26), 11)}`, `${rep(wall, 27)}/${rows(wall + rep(floor, 26), 11)}`),
  out: layers(`${rep('*', 27)}/${rows(rep('*', 11) + rep('T', 16), 11)}`, `${rep('*', 27)}/${rows(rep('*', 27), 11)}`),
});

/**
 * The fence lines from centre to centre of two neighbouring fence cells of the plan (T339): a post every 5 (p), the rails' line (l)
 * between; a gate cell (Q) has its two half-segments of gate line (q) with the posts at its edges. The pair as `[ab]` of plan letters.
 */
function fenceRules() {
  const H = '*****pllllpllllp****';
  const toGate = '*****pllllpqqqqq****';
  const fromGate = '*****qqqqqpllllp****';
  const gates = '*****qqqqqqqqqqq****';
  const horizontal = (pair, line) => `<rule in="${pair}" out="${rows('*'.repeat(20), 5)}/${line}/${rows('*'.repeat(20), 4)}"/>`;
  const vertical = (pair, line) => `<rule in="${pair}" out="${line.split('').map((c) => '*****' + c + '****').join('/')}"/>`;
  return [
    horizontal('[mL][mL]', H), vertical('[mL]/[mL]', H),
    horizontal('[mL]Q', toGate), vertical('[mL]/Q', toGate),
    horizontal('Q[mL]', fromGate), vertical('Q/[mL]', fromGate),
    horizontal('QQ', gates), vertical('Q/Q', gates),
  ].join('\n        ');
}

function fattoria() {
  const s = strip('D', 'n');
  // Hay: against the back wall, outside, on the lean-to's floor (3 rows of air over the floor, then the wall).
  const hayIn = layers(`${rows(rep('B', 13), 3)}/${rep('D', 13)}`, `${rows(rep('s', 13), 3)}/${rep('D', 13)}`);
  const hayOut = layers(`${rows(rep('Z', 13), 3)}/${rep('*', 13)}`, `${rows(rep('*', 13), 3)}/${rep('*', 13)}`);
  // The barn's opening: inner wall row, outer wall row, the yard outside; 17 long, 15 open.
  const openIn = layers(`${rep('#15', 17)}/${rep('#15', 17)}/${rep('B', 17)}`, `${rep('#15', 17)}/${rep('#15', 17)}/${rep('y', 17)}`);
  const openOut = layers(`*${rep('#17', 15)}*/*${rep('#17', 15)}*/${rep('*', 17)}`, `${rep('*', 17)}/${rep('*', 17)}/${rep('*', 17)}`);
  // The sown rows of wheat (two wide, every four), the rows of the vegetable plot, the orchard's ground with the tree in the middle.
  const wheat = rows(rep('g', 10), 2) + '/' + rows(rep('f', 10), 2) + '/' + rows(rep('g', 10), 2) + '/' + rows(rep('f', 10), 2) + '/' + rows(rep('g', 10), 2);
  const veg = [rep('f', 10), rep('c', 10), rep('f', 10), rep('f', 10), rep('c', 10), rep('f', 10), rep('f', 10), rep('c', 10), rep('f', 10), rep('f', 10)].join('/');
  const tree = rows(rep('e', 10), 5) + '/' + 'eeeee#10eeee' + '/' + rows(rep('e', 10), 4);
  // The door cell: the house's block with the seed of the door through the front wall (the last two rows), 10 wide (a rule adds one).
  const doorCell = rows(rep('H', 10), 8) + '/' + rows(rep('O', 10), 2);
  // A track: six of beaten earth with meadow at its sides, along x (#8: a track that runs in x) or along y (#9).
  const trackX = rows(rep('E', 10), 2) + '/' + rows(rep('r', 10), 6) + '/' + rows(rep('E', 10), 2);
  const trackY = rows('EErrrrrrEE', 10);
  const hidden = (list) => list.map((c) => `<color symbol="${c}" hidden="True"/>`).join('');
  return `<!--
Farm that fits its size (T338, T346; lab/banco/taglie/README.md): one program, three areas at the same scale (20 voxels a tile).
The plan is decided on a grid at a tenth (a cell is half a tile, A): the house and its lean-to from the centre, the yard around them
with the road from the door, the fence where the ground goes on past the yard, the barn beside the house where the yard has room,
tracks from the fence to the edge, and the plots between the tracks, each of a kind (wheat, vegetables, orchard, pasture with its own
fence and gates), different at every seed. Two maps bring it to the voxels (B: every cell ten by ten, the fences from centre to
centre), then the detail of T338 at full scale (C): the house of two storeys with its stair (part-stair) and its door (part-door),
the lean-to with the hay, the barn, the fences' posts and rails, the wheat, the trees. No animal: the ground says where they would be
(area="pasture" and the others, ADR-0182). No number of the box: the same program at 100, 150 and 200. Written by
lab/banco/taglie/genera.mjs.
-->
<sequence values="BNE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/10 1/10 1" values="BNEHYyDRGdmFCOPLQTvhwgs#8#9" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="N" out="N"/>
    <sequence symmetry="(xy)">
      <!-- A. The plan, a cell half a tile. The seed goes back while eight rows are free behind it, and one aside where eight are free there. -->
      <all in="E/E/E/E/E/E/E/E/N" out="*/*/*/*/*/*/*/N/E" symmetry="()"/>
      <one in="NEEEEEEEE" out="EN*******" symmetry="(x)" steps="1"/>
      <!-- the house: 5 from the centre and one more at an end, 4 deep (two rows behind the centre, one in front); the lean-to 2 behind it -->
      <all in="[NH]E" out="*H" symmetry="(x)" steps="2"/>
      <one in="HE" out="*H" symmetry="(x)" steps="1"/>
      <all in="E/[NH]" out="H/*" symmetry="()" steps="2"/>
      <all in="[NH]/E" out="*/H" symmetry="()" steps="1"/>
      <prl in="N" out="H" steps="1"/>
      <all in="E/H" out="Y/*" symmetry="()" steps="1"/>
      <all in="E/Y" out="Y/*" symmetry="()" steps="1"/>
      <!-- the yard: one cell at the sides and behind, three in front -->
      <all in="[HYy]E" out="*y" symmetry="(x)" steps="1"/>
      <all in="E/[HYy]" out="y/*" symmetry="()" steps="1"/>
      <all in="[HYy]/E" out="*/y" symmetry="()" steps="3"/>
      <!-- the door in the middle of the front, the road from it straight to the edge -->
      <one in="HHH/yyy" out="*D*/***" symmetry="()" steps="1"/>
      <all in="D/y" out="*/R" symmetry="()" steps="1"/>
      <all in="R/[yE]" out="*/R" symmetry="()"/>
      <!-- where the ground goes on for six beside the yard, four more of yard (room for the barn); the yard's edge wanders where three are free -->
      <all in="yEEEEEE" out="*yyyy**" symmetry="(x)"/>
      <prl in="yEEE" out="*y**" p="0.3" steps="2"/>
      <!-- the barn, 3 × 4, where a window of 5 × 6 of yard is free; its door toward the yard -->
      <one in="${rows('yyyyy', 6)}" out="*****/*GGG*/*GGG*/*GGG*/*GGG*/*****" steps="1"/>
      <one in="GGG/yyy" out="*d*/***" steps="1"/>
      <!-- the fence where two cells are free past the yard (the road counts; its corners closed); what is left beside the yard is yard -->
      <all in="yE[ER]" out="*m*"/>
      <all in="Em/my" out="m*/**"/>
      <all in="yE" out="*y"/>
      <!-- tracks from the fence to the edge where two cells of field are free, at least three apart, one letter a direction -->
      <one in="mmmmm/EEEEE/EEEEE" out="*****/**v**/*****" symmetry="()" steps="2"/>
      <one in="EEEEE/EEEEE/mmmmm" out="*****/**h**/*****" symmetry="()" steps="2"/>
      <one in="${rows('mEE', 5)}" out="***/***/*w*/***/***" symmetry="()" steps="2"/>
      <one in="${rows('EEm', 5)}" out="***/***/*g*/***/***" symmetry="()" steps="2"/>
      <all symmetry="()"><rule in="v/E" out="*/v"/><rule in="E/h" out="h/*"/><rule in="wE" out="*w"/><rule in="Eg" out="g*"/></all>
      <prl><rule in="v" out="#9"/><rule in="h" out="#9"/><rule in="w" out="#8"/><rule in="g" out="#8"/></prl>
      <!-- the plots: a region between the tracks takes the kind of a cell drawn in it, wheat more often than the others -->
      <markov>
        <all><rule in="FE" out="*F"/><rule in="CE" out="*C"/><rule in="OE" out="*O"/><rule in="PE" out="*P"/></all>
        <one><rule in="E" out="F" p="4"/><rule in="E" out="P" p="3"/><rule in="E" out="C" p="1"/><rule in="E" out="O" p="1"/></one>
      </markov>
      <!-- the pastures: a fence on their edge (the corners too), joined to the yard's fence where they touch it; a gate where it runs along a track -->
      <all><rule in="P[EFCO#8#9R]" out="L*"/><rule in="P*/*[EFCO#8#9R]" out="L*/**"/></all>
      <prl in="LLL/[#8#9R][#8#9R][#8#9R]" out="*Q*/***" p="0.15" steps="1"/>
      <!-- the orchard: trees a few cells apart -->
      <all in="OOO/OOO/OOO" out="sss/sTs/sss"/>
      <prl in="s" out="O"/>
      <!-- B. To the voxels: every cell ten by ten; the fences from centre to centre of their cells, a post every five. -->
      <map scale="10 10 1" values="BEysPrfgwcHOSIXQRWNDnokUKZVFAbplYeL#1#2#3#4#5#6#7#8#9#10#11#12#13#14#15#16#17#18q#19#20#21#22T#90#91" symmetry="()">
        <rule in="E" out="${block('E')}"/>
        <rule in="m" out="${block('E')}"/>
        <rule in="y" out="${block('y')}"/>
        <rule in="Y" out="${block('Y')}"/>
        <rule in="H" out="${block('H')}"/>
        <rule in="D" out="${doorCell}"/>
        <rule in="R" out="${block('P')}"/>
        <rule in="#8" out="${trackX}"/>
        <rule in="#9" out="${trackY}"/>
        <rule in="G" out="${block('A')}"/>
        <rule in="d" out="${block('A')}"/>
        <rule in="F" out="${wheat}"/>
        <rule in="C" out="${veg}"/>
        <rule in="O" out="${block('e')}"/>
        <rule in="T" out="${tree}"/>
        <rule in="P" out="${block('#14')}"/>
        <rule in="L" out="${block('#14')}"/>
        <rule in="Q" out="${block('#14')}"/>
        ${fenceRules()}
        <!-- C. The detail at full scale (T338). -->
        <sequence symmetry="(xy)">
          <union symbol="+" values="DWN"/>
          <union symbol="=" values="n"/>
          <!-- 1. The house rises (the door's seed, one wider, stays at the foot): two storeys of 32, the slab between them (S), the roof on top, its gables in plaster. -->
          <all in="OH" out="*O" symmetry="()" steps="1"/>
          <all in="B [HO]" out="H *" steps="31"/>
          <all in="B H" out="S *" steps="1"/>
          <all in="B S" out="X *" steps="1"/>
          <all in="B X" out="X *" steps="23"/>
          <all in="B X" out="R *"/>
          <all in="RB XB" out="*R **"/>
          <all in="B R" out="Q *"/>
          <all in="B Q" out="Q *" steps="24"/>
          <all in="*/Q B/*" out="*/B */*" symmetry="(y)"/>
          <prl in="Q" out="R" steps="1"/>
          <prl in="RB" out="W*" symmetry="(x)" steps="1"/>
          <prl in="B W" out="* R" steps="1"/>
          <!-- 2. Digging: walls two thick; the floor below, the slab between the storeys, the ceiling under the roof; plinth, beams, corners. -->
          <prl in="${rows('HHHHH', 5)}" out="*****/*****/**I**/*****/*****" steps="1"/>
          <prl in="${rows('XXXXX', 5)}" out="*****/*****/**I**/*****/*****" steps="1"/>
          <prl in="${rows('SSSSS', 5)}" out="*****/*****/**n**/*****/*****" steps="1"/>
          <prl in="R I" out="* n" steps="1"/>
          <prl in="I *" out="B *" steps="1"/>
          <prl in="I" out="n" steps="1"/>
          <prl in="S" out="N" steps="1"/>
          <prl in="X" out="W" steps="1"/>
          <prl in="H *" out="W *" steps="1"/>
          <prl in="H" out="D" steps="1"/>
          <all in="W D" out="D *" steps="3"/>
          <all in="R W" out="* N"/>
          <all in="BB/BW" out="**/*N"/>
          <!-- 3. The stair: its strip along the back wall, ten from the corner; part-stair climbs it. -->
          <one in="${s.in}" out="${s.out}" symmetry="()" steps="1"/>
          <import file="part-stair"/>
          <!-- 4. The door: part-door raises the seed through the wall, with frame and planks. -->
          <import file="part-door"/>
          <!-- 5. Windows: a seed 10 under a beam, on the outer face; they grow down and sideways, through the wall; frame and cross. -->
          <one steps="8" in="N/B W/B W/B W/B W/B W/B W/B W/B W/B W/B" out="*/* */* */* */* */* */* */* */* */* U/*"/>
          <all in="U W" out="* U" steps="10"/>
          <all in="UW" out="*U" steps="4"/>
          <all in="UW" out="*N" steps="1"/>
          <all in="W U" out="N *" steps="1"/>
          <all in="UUUUUUUUU" out="****N****" optional="True"/>
          <!-- 6. The lean-to: posts 35 high at its outer corners and every 11, its roof of boards; the hay under it against the wall. -->
          <all in="yy/yY" out="**/*F"/>
          <all in="yyyyyyyyyyyy/FYYYYYYYYYYY" out="************/***********F"/>
          <all in="B Y" out="Y *" steps="35"/>
          <all in="B Y" out="V *" steps="1"/>
          <all in="Y F" out="F *"/>
          <prl in="Y *" out="B *" steps="1"/>
          <prl in="Y" out="s" steps="1"/>
          <one in="${hayIn}" out="${hayOut}" symmetry="()" steps="3"/>
          <all in="B Z" out="Z *" steps="9"/>
          <!-- 7. The barn: walls 36 high, two thick, its roof; an opening of 15 × 28 on one side. -->
          <all in="B A" out="A *" steps="35"/>
          <all in="B A" out="#16 *"/>
          <all in="#16B AB" out="*#16 **"/>
          <all in="B #16" out="Q *"/>
          <all in="B Q" out="Q *" steps="30"/>
          <all in="*/Q B/*" out="*/B */*" symmetry="(y)"/>
          <prl in="Q" out="#16" steps="1"/>
          <prl in="#16B" out="#15*" symmetry="(x)" steps="1"/>
          <prl in="${rows('AAAAA', 5)}" out="*****/*****/**I**/*****/*****" steps="1"/>
          <prl in="I *" out="B *" steps="1"/>
          <prl in="I" out="b" steps="1"/>
          <prl in="A" out="#15" steps="1"/>
          <one in="${openIn}" out="${openOut}" steps="1"/>
          <all in="#15 #17" out="#17 *" steps="27"/>
          <prl in="#17" out="B" steps="1"/>
          <!-- 8. The fences: posts 12 high, two rails; the gates' three bars. -->
          <all in="B p" out="p *" steps="11"/>
          <all in="B B B B B B B B B l" out="L L * * L L * * * *"/>
          <all in="B B B B B B B B B q" out="* #19 * * #19 * * #19 * *"/>
          <!-- 9. The fields: wheat on the sown rows, ears on top; the vegetables; the trees, a trunk and a round crown with some fruit. -->
          <all in="B g" out="w *"/>
          <all in="B w" out="w *" steps="2"/>
          <prl in="B w" out="#3 *" p="0.6" steps="1"/>
          <prl in="B c" out="#6 *" p="0.7" steps="1"/>
          <prl in="B #6" out="#7 *" p="0.6" steps="1"/>
          <prl in="B #7" out="#18 *" p="0.15" steps="1"/>
          <all in="B #10" out="#11 *" steps="13"/>
          <all in="B #11" out="#12 *"/>
          <all in="#12B" out="*#12" steps="4" symmetry="(xyz)"/>
          <prl in="#12B" out="*#12" p="0.35" steps="2" symmetry="(xyz)"/>
          <prl in="#12" out="#13" p="0.03" steps="1"/>
          <!-- 10. Details and cleaning: the shade on the roofs, the chimney; the markers go, the ground stays with its areas. -->
          <prl in="RB" out="#2*" p="0.6" steps="1"/>
          <prl in="W" out="#4" p="0.02" steps="1"/>
          <one in="B B R" out="* K *" steps="1"/>
          <all in="KB" out="*K" steps="1"/>
          <all in="B K" out="K *" steps="7"/>
          <prl><rule in="#10" out="e"/></prl>
        </sequence>
      </map>
    </sequence>
  </map>
  <color symbol="R" value="a5482e" name="coppi"/><color symbol="#2" value="7e3424" name="coppi in ombra"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/><color symbol="#4" value="d4c6a4" name="intonaco scrostato"/>
  <color symbol="N" value="6b4a2e" name="travi"/><color symbol="D" value="7d766c" name="pietra"/>
  <color symbol="n" value="8e6a44" name="assito" area="house"/><color symbol="O" value="7a4a26" name="porta"/><color symbol="o" value="5e3a1e" name="asse scura"/>
  <color symbol="U" value="86b8c8" alpha="0.5" name="vetro"/><color symbol="K" value="8e8578" name="comignolo"/><color symbol="k" value="9a7048" name="scala"/>
  <color symbol="y" value="b49a6e" name="aia" area="yard"/><color symbol="P" value="a89c86" name="ghiaia"/><color symbol="s" value="a89c86" name="terra della tettoia" area="shelter"/>
  <color symbol="r" value="c2ad84" name="sentiero"/>
  <color symbol="V" value="8a6a3a" name="tetto della tettoia"/><color symbol="F" value="7a5634" name="pali"/><color symbol="Z" value="d8b84a" name="paglia"/>
  <color symbol="p" value="5e4026" name="paletti"/><color symbol="L" value="8e6a44" name="traverse"/><color symbol="#19" value="a88a5a" name="sbarre del cancello"/>
  <color symbol="f" value="6b4e32" name="solco" area="field"/><color symbol="g" value="7a5a38" name="fila seminata" area="field"/>
  <color symbol="w" value="d9b84a" name="grano"/><color symbol="#3" value="c89a2e" name="spighe"/>
  <color symbol="c" value="6f5236" name="fila dell'orto" area="field"/><color symbol="#6" value="4f8f3a" name="ortaggi"/><color symbol="#7" value="6aa84a" name="foglie"/><color symbol="#18" value="c8442a" name="pomodori"/>
  <color symbol="#11" value="6b4a2e" name="tronco"/><color symbol="#12" value="4e7f34" name="chioma"/><color symbol="#13" value="d0453a" name="frutti"/>
  <color symbol="#15" value="9a3a2a" name="tavole del fienile"/><color symbol="#16" value="4a3a32" name="tetto del fienile"/><color symbol="b" value="a89c86" name="terra del fienile" area="barn"/>
  <color symbol="e" hidden="True" name="erba del frutteto" area="orchard"/><color symbol="#14" hidden="True" name="pascolo" area="pasture"/>
  <color symbol="E" hidden="True" name="prato"/>
  ${hidden(['H', 'Y', 'S', 'I', 'X', 'Q', 'A', 'l', 'q', '#1', '#5', '#8', '#9', '#10', '#17', '#20', '#21', '#22', 'T', '#90', '#91'])}
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
`;
}

const dir = new URL('.', import.meta.url);
fs.writeFileSync(new URL('fattoria.xml', dir), fattoria());
console.log('fattoria.xml');

function forte() {
  const s = strip('D', 'n');
  // A corner tower: the outer corner of the curtain wall (m) with 20 × 20 of free ground past it (the tower takes 10 of them).
  const towerIn = square(21, 21, (_d, x, y) => (x === 20 && y === 20 ? 'm' : 'E'));
  const towerOut = square(21, 21, (_d, x, y) => (x === 20 && y === 20 ? 'q' : '*'));
  // The door from the wall walk into a tower: on the walk (air over the curtain's top), the tower's wall two thick, the tower's inside.
  const walkDoorIn = layers('BqqB', 'C***');
  const walkDoorOut = layers('*vv*', '****');
  const hidden = (list) => list.map((c) => `<color symbol="${c}" hidden="True"/>`).join('');
  return `<!--
Fort that fits its size (T338, T346; lab/banco/taglie/README.md): one program, three areas at the same scale (20 voxels a tile). At
5 × 5 tiles (100 voxels) one keep, a tower with a wide base: a stone talus on three sides, two storeys (rooms of 37, a door of 11 × 30
by part-door, a stair of 16 steps by part-stair), the platform with regular battlements (part-battlements) and an arrow slit under
every merlon (part-slits); where the ground goes on past its yard (7.5 × 7.5 tiles) a curtain wall 12 thick and 24 high with the
wall walk between two battlements and the road as its gate; where 20 × 20 are free past a corner of the wall (10 × 10 tiles), a hollow
tower there, 21 a side, with its floor at the walk and a door from the walk into it, a pyramid of slate on top. No number of the
box: what fits is found by the patterns of free ground. The ground says its areas (courtyard, keep, tower). Written by
lab/banco/taglie/genera.mjs.
-->
<sequence values="BHEXSIQRWNDnOohjUKTkPybmCcqdMv#5#90#91" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="DWNRC"/>
  <union symbol="=" values="n"/>
  <union symbol="%" values="RNW"/>
  <color symbol="W" value="a39d90" name="pietra"/><color symbol="D" value="7d766c" name="zoccolo"/><color symbol="N" value="6e685e" name="cornice"/>
  <color symbol="d" value="8a8274" name="scarpa"/><color symbol="n" value="8e6a44" name="assito" area="keep"/><color symbol="R" value="97928a" name="terrazza"/>
  <color symbol="M" value="b2ac9f" name="merli"/><color symbol="O" value="6a4424" name="porta"/><color symbol="o" value="4e3218" name="borchie"/>
  <color symbol="U" value="2a2622" name="feritoie"/><color symbol="k" value="9a7048" name="scala"/><color symbol="P" value="a89c86" name="selciato"/>
  <color symbol="K" value="5a4a3a" name="asta"/><color symbol="C" value="c4bba8" name="mura"/><color symbol="c" value="47506a" name="ardesia"/>
  <color symbol="#5" value="8e6a44" name="pavimento della torre" area="tower"/><color symbol="y" hidden="True" name="cortile" area="courtyard"/>
  ${hidden(['H', 'E', 'X', 'S', 'I', 'Q', 'T', 'b', 'm', 'q', 'v', 'h', 'j', '#90', '#91'])}

  <!-- 1. The keep: a square of 47 from the centre, 4 more on one side by chance; the talus (b) 8 wide at the back and at the sides. -->
  <all in="HE" out="*H" symmetry="(x)" steps="23"/>
  <one in="HE" out="*H" symmetry="(x)" steps="4"/>
  <all in="H/E" out="*/H" symmetry="()" steps="23"/>
  <all in="E/H" out="H/*" symmetry="()" steps="23"/>
  <all in="[Hb]E" out="*b" symmetry="(x)" steps="8"/>
  <all in="E/[Hb]" out="b/*" symmetry="()" steps="8"/>

  <!-- 2. What fits around it: the yard (y) 24 every way; where 8 more are free past it, the curtain wall (m), its corners;
       a tower on a corner of the wall where 20 × 20 are free past it (q). -->
  <all in="[Hby]E" out="*y" symmetry="(x)" steps="24"/>
  <all in="E/[Hby]" out="y/*" symmetry="()" steps="24"/>
  <all in="[Hby]/E" out="*/y" symmetry="()" steps="24"/>
  <all in="yEEEEEEEE" out="*m*******"/>
  <all in="Em/my" out="m*/**"/>
  <all in="${towerIn}" out="${towerOut}"/>

  <!-- 3. The keep rises: two storeys of 32, the slab between them (S), the platform on top (R); the talus slopes 1 in 1. -->
  <all in="B H" out="H *" steps="31"/>
  <all in="B H" out="S *" steps="1"/>
  <all in="B S" out="X *" steps="1"/>
  <all in="B X" out="X *" steps="27"/>
  <all in="B X" out="R *"/>
  <all in="B b" out="b *" steps="9"/>
  <all in="*/b B/*" out="*/B */*"/>
  <prl in="b" out="d" steps="1"/>

  <!-- 4. Digging: walls two thick; the floor below, the slab between the storeys; plinth, string course, corners. -->
  <prl in="${rows('HHHHH', 5)}" out="*****/*****/**I**/*****/*****" steps="1"/>
  <prl in="${rows('XXXXX', 5)}" out="*****/*****/**I**/*****/*****" steps="1"/>
  <prl in="${rows('SSSSS', 5)}" out="*****/*****/**n**/*****/*****" steps="1"/>
  <prl in="I *" out="B *" steps="1"/>
  <prl in="I" out="n" steps="1"/>
  <prl in="S" out="N" steps="1"/>
  <prl in="X" out="W" steps="1"/>
  <prl in="H *" out="W *" steps="1"/>
  <prl in="H" out="D" steps="1"/>
  <all in="W D" out="D *" steps="3"/>
  <all in="R W" out="* N"/>

  <!-- 5. The stair: its strip along the back wall, ten from the corner; part-stair climbs it. -->
  <one in="${s.in}" out="${s.out}" symmetry="()" steps="1"/>
  <import file="part-stair"/>

  <!-- 6. The door: 11 wide in the plinth of the front, through the wall; part-door raises it, with frame and studs. The road from it to the edge. -->
  <one steps="1" symmetry="()" in="${layers('DDDDDDDDDDDDD/BBBBBBBBBBBBB', 'DDDDDDDDDDDDD/yyyyyyyyyyyyy')}" out="${layers('*************/*************', '*OOOOOOOOOOO*/*************')}"/>
  <all in="D/O" out="O/*" symmetry="()" steps="1"/>
  <import file="part-door"/>
  <all in="OOOO" out="*o**" symmetry="()"/>
  <all in="[Oo]/B */y" out="*/* */P" symmetry="()"/>
  <all in="P/[yEm]" out="*/P" symmetry="()"/>

  <!-- 7. The curtain wall: 12 thick inward, 24 high; the road is its gate. The towers: 21 a side on the corners, 60 high, a pyramid of slate. -->
  <all in="my" out="*m" steps="11"/>
  <all in="q[Emy]" out="*q" symmetry="(x)" steps="10"/>
  <all in="q/[Emy]" out="*/q" symmetry="(y)" steps="10"/>
  <all in="B m" out="m *" steps="23"/>
  <prl in="m" out="C" steps="1"/>
  <all in="B q" out="q *" steps="59"/>
  <all in="B q" out="c *"/>
  <all in="cB qB" out="*c **"/>
  <all in="***/*B*/*** *c*/ccc/*c*" out="***/*c*/*** ***/***/***" steps="10" symmetry="()"/>
  <!-- the towers are hollow, their floor at the height of the wall walk -->
  <prl in="${rows('qqqqq', 5)}" out="*****/*****/**I**/*****/*****" steps="1"/>
  <prl in="I *" out="B *" steps="1"/>
  <prl in="I" out="#5" steps="1"/>
  <all in="B #5" out="#5 *" steps="23"/>

  <!-- 8. Battlements on the keep's platform and on both faces of the curtain (part-battlements), a slit under every merlon of the keep (part-slits); the pole. -->
  <import file="part-battlements"/>
  <import file="part-slits"/>
  <one in="B B R" out="* K *" steps="1"/>
  <all in="B K" out="K *" steps="14"/>

  <!-- 9. From the wall walk into each tower: an opening through the tower's wall, as wide as the walk between its battlements, 30 high. -->
  <all in="${walkDoorIn}" out="${walkDoorOut}"/>
  <all in="q v" out="v *" steps="29"/>
  <prl in="v" out="B" steps="1"/>

  <!-- 10. Cleaning: the towers are of the walls' stone; the markers go; the yard stays as the ground, hidden, with its area. -->
  <prl><rule in="E" out="B"/><rule in="q" out="C"/></prl>
  <action name="open" label="Apri la porta"><all><rule in="O" out="h"/><rule in="o" out="j"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="h" out="O"/><rule in="j" out="o"/></all></action>
</sequence>
`;
}

fs.writeFileSync(new URL('forte.xml', dir), forte());
console.log('forte.xml');
