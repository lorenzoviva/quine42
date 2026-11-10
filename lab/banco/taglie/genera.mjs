// Writes the programs of the bench of the sizes (T338, README.md) whose patterns are long (a barn of 41 × 41, a stair of 17 × 12):
// they are written here by repetition, the XML is what runs.
//
//   node lab/banco/taglie/genera.mjs

import fs from 'node:fs';

const rep = (s, n) => s.repeat(n);
const rows = (row, n) => Array(n).fill(row).join('/');
/** A rectangle of `w` × `h` with a letter by the distance from its edge: `ring(d)` gives it. */
const square = (w, h, ring) => {
  const out = [];
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) r += ring(Math.min(x, y, w - 1 - x, h - 1 - y), x, y);
    out.push(r);
  }
  return out.join('/');
};

/**
 * The stair: in the back left corner (the back wall's row, the side wall's column), 11 rows of floor; a landing of 10 by the side wall
 * (a body stands off a wall by its half-width) and a strip of 16 × 11 along the back wall after it.
 */
const stair = (wall, floor) => ({
  in: `${rep(wall, 27)}/${rows(wall + rep('B', 26), 11)} ${rep(wall, 27)}/${rows(wall + rep(floor, 26), 11)}`,
  out: `${rep('*', 27)}/${rows(rep('*', 11) + rep('T', 16), 11)} ${rep('*', 27)}/${rows(rep('*', 27), 11)}`,
});

function fattoria() {
  const s = stair('D', 'n');
  // Hay: against the back wall, outside, on the lean-to's floor (3 rows of air over the gravel, then the wall).
  const hayIn = `${rows(rep('B', 13), 3)}/${rep('D', 13)} ${rows(rep('P', 13), 3)}/${rep('D', 13)}`;
  const hayOut = `${rows(rep('Z', 13), 3)}/${rep('*', 13)} ${rows(rep('*', 13), 3)}/${rep('*', 13)}`;
  // The fence: a post every 5 (a rule writes all five cells, so two windows never share one).
  // The barn: 41 × 41 of free ground (a rule holds at most 1728 cells); 1 left as it is, a ring of 2 (its yard), the plan inside (35 × 35).
  const barnIn = rows(rep('E', 41), 41);
  const barnOut = square(41, 41, (d) => (d < 1 ? '*' : d < 3 ? 'x' : 'A'));
  // The barn's opening: inner wall row, outer wall row, the yard outside; 17 long, 15 open.
  const openIn = `${rep('C', 17)}/${rep('C', 17)}/${rep('B', 17)} ${rep('C', 17)}/${rep('C', 17)}/${rep('x', 17)}`;
  const openOut = `*${rep('v', 15)}*/*${rep('v', 15)}*/${rep('*', 17)} ${rep('*', 17)}/${rep('*', 17)}/${rep('*', 17)}`;
  // A sheep: 12 × 12 of free ground, the body 6 × 4 and the head at its side, in the middle.
  const sheepIn = rows(rep('E', 12), 12);
  const sheepOut = square(12, 12, (_d, x, y) => (y >= 4 && y < 8 && x >= 3 && x < 9 ? 'e' : y >= 5 && y < 7 && x >= 9 && x < 11 ? 'u' : '*'));
  return `<!--
Farm that fits its size (T338, lab/banco/taglie/README.md): one program, three areas at the same scale (20 voxels a tile). At 5 × 5
tiles (100 voxels) a house of normal size in two storeys (rooms of 31 voxels, a door of 11 × 30, a stair of 16 steps) with a lean-to
behind it and the hay under it; where the ground goes on past the yard (7.5 × 7.5 tiles) a fence with the road as its gate and the
fields around it; where a free square of 41 × 41 is left past the fence (10 × 10 tiles), a barn, and sheep at pasture where the fields
end. No number of the box: what fits is found by the patterns of free ground. Written by lab/banco/taglie/genera.mjs.
-->
<sequence values="BHEXSIQRrWNDnOohjUKTakPYVFZymfLGgACcxeutv#6#7" symmetry="(xy)" soil="E" origin="bottom">
  <color symbol="R" value="a5482e" name="coppi"/><color symbol="r" value="7e3424" name="coppi in ombra"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/><color symbol="w" value="d4c6a4" name="intonaco scrostato"/>
  <color symbol="N" value="6b4a2e" name="travi"/><color symbol="D" value="7d766c" name="pietra"/>
  <color symbol="n" value="8e6a44" name="assito"/><color symbol="O" value="7a4a26" name="porta"/><color symbol="o" value="5e3a1e" name="asse scura"/>
  <color symbol="U" value="86b8c8" alpha="0.5" name="vetro"/><color symbol="K" value="8e8578" name="comignolo"/><color symbol="k" value="9a7048" name="scala"/>
  <color symbol="P" value="a89c86" name="ghiaia"/><color symbol="V" value="8a6a3a" name="tetto della tettoia"/><color symbol="F" value="7a5634" name="pali"/>
  <color symbol="Z" value="d8b84a" name="paglia"/><color symbol="f" value="5e4026" name="paletti"/><color symbol="L" value="8e6a44" name="traverse"/>
  <color symbol="G" value="5a4030" name="terra dei campi"/><color symbol="g" value="9ab04a" name="grano"/>
  <color symbol="C" value="9a3a2a" name="tavole del fienile"/><color symbol="c" value="4a3a32" name="tetto del fienile"/>
  <color symbol="e" value="eeeae0" name="lana"/><color symbol="u" value="3a3030" name="muso"/>
  <color symbol="H" hidden="True"/><color symbol="E" hidden="True"/><color symbol="X" hidden="True"/><color symbol="S" hidden="True"/><color symbol="I" hidden="True"/><color symbol="Q" hidden="True"/><color symbol="T" hidden="True"/><color symbol="t" hidden="True"/><color symbol="a" hidden="True"/><color symbol="Y" hidden="True"/><color symbol="y" hidden="True"/><color symbol="m" hidden="True"/><color symbol="A" hidden="True"/><color symbol="x" hidden="True"/><color symbol="v" hidden="True"/><color symbol="h" hidden="True"/><color symbol="j" hidden="True"/><color symbol="#6" hidden="True"/><color symbol="#7" hidden="True"/>

  <!-- 1. The house: a line of 55 from the centre, 8 more at its ends by chance, 35 deep; the lean-to 20 behind it. -->
  <all in="HE" out="*H" symmetry="(x)" steps="27"/>
  <one in="HE" out="*H" symmetry="(x)" steps="8"/>
  <all in="H/E" out="*/H" symmetry="()" steps="17"/>
  <all in="E/H" out="H/*" symmetry="()" steps="17"/>
  <all in="E/H" out="Y/*" symmetry="()" steps="1"/>
  <all in="E/Y" out="Y/*" symmetry="()" steps="19"/>

  <!-- 2. What fits around it: the yard (y) 16 at the sides, 12 behind, 28 in front; where 8 more are free past it, the fence (m);
       a barn where a square of 41 × 41 is free past the fence: its yard (x) and its plan (A). -->
  <all in="[HYy]E" out="*y" symmetry="(x)" steps="16"/>
  <all in="E/[HYy]" out="y/*" symmetry="()" steps="12"/>
  <all in="[HYy]/E" out="*/y" symmetry="()" steps="28"/>
  <all in="yEEEEEEEE" out="*m*******"/>
  <all in="Em/my" out="m*/**"/>
  <one in="${barnIn}" out="${barnOut}" steps="1"/>

  <!-- 3. The house rises: two storeys of 32, the slab between them (S), the roof on top, its gables in plaster. -->
  <all in="B H" out="H *" steps="31"/>
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

  <!-- 4. Digging: walls two thick; the floor below, the slab between the storeys, the ceiling under the roof; plinth, beams, corners. -->
  <prl in="HHHHH/HHHHH/HHHHH/HHHHH/HHHHH" out="*****/*****/**I**/*****/*****" steps="1"/>
  <prl in="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX" out="*****/*****/**I**/*****/*****" steps="1"/>
  <prl in="SSSSS/SSSSS/SSSSS/SSSSS/SSSSS" out="*****/*****/**n**/*****/*****" steps="1"/>
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

  <!-- 5. The stair: a strip of 16 × 11 along the back wall, a landing of 10 by the corner, its hole in the slab, a walker that climbs 2 for every 1, solid under it. -->
  <one in="${s.in}" out="${s.out}" symmetry="()" steps="1"/>
  <all in="B T" out="t *"/>
  <all in="B t" out="t *"/>
  <all in="n t" out="v *"/>
  <prl in="t" out="B" steps="1"/>
  <prl in="v" out="B" steps="1"/>
  <all in="BT" out="*a" symmetry="()"/>
  <all in="B a" out="a k" symmetry="()" steps="1"/>
  <all in="*B ** a*" out="*a ** k*" symmetry="()" steps="15"/>
  <prl in="a" out="k" steps="1"/>
  <all in="k B" out="* k"/>
  <prl in="T" out="k" steps="1"/>

  <!-- 6. The door: 11 wide in the plinth of the front, through the wall, 30 high; its frame and planks. The road from it to the edge. -->
  <one steps="1" symmetry="()" in="DDDDDDDDDDDDD/BBBBBBBBBBBBB DDDDDDDDDDDDD/yyyyyyyyyyyyy" out="*OOOOOOOOOOO*/************* *************/*************"/>
  <all in="D/O" out="O/*" symmetry="()"/>
  <all in="[DWN] O" out="O *" steps="29"/>
  <all in="[DWN] O" out="N *" steps="1"/>
  <all in="O[DW]" out="*N" steps="1"/>
  <all in="OOO" out="*o*" symmetry="()"/>
  <all in="[Oo]/B */y" out="*/* */P" symmetry="()"/>
  <all in="P/[yEmx]" out="*/P" symmetry="()"/>

  <!-- 7. Windows: a seed 10 under a beam, on the outer face; they grow down and sideways, through the wall; frame and cross. -->
  <one steps="8" in="N/B W/B W/B W/B W/B W/B W/B W/B W/B W/B" out="*/* */* */* */* */* */* */* */* */* U/*"/>
  <all in="U W" out="* U" steps="10"/>
  <all in="UW" out="*U" steps="4"/>
  <all in="UW" out="*N" steps="1"/>
  <all in="W U" out="N *" steps="1"/>
  <all in="UUUUUUUUU" out="****N****" optional="True"/>

  <!-- 8. The lean-to: posts 35 high at its outer corners and every 11, its roof of boards; the hay under it against the wall. -->
  <all in="EE/EY" out="**/*F"/>
  <all in="yy/yY" out="**/*F"/>
  <all in="EEEEEEEEEEEE/FYYYYYYYYYYY" out="************/***********F"/>
  <all in="yyyyyyyyyyyy/FYYYYYYYYYYY" out="************/***********F"/>
  <all in="B Y" out="Y *" steps="35"/>
  <all in="B Y" out="V *" steps="1"/>
  <all in="Y F" out="F *"/>
  <prl in="Y *" out="B *" steps="1"/>
  <prl in="Y" out="P" steps="1"/>
  <one in="${hayIn}" out="${hayOut}" symmetry="()" steps="3"/>
  <all in="B Z" out="Z *" steps="9"/>

  <!-- 9. The fence: a post every 5, rising 12; between them a rail at 7-8. -->
  <all in="mmmmm" out="#7#7f#7#7" steps="1"/>
  <prl in="#7" out="m" steps="1"/>
  <all in="B f" out="f *" steps="12"/>
  <all steps="7" symmetry="()"><rule in="B m" out="m #6"/></all>
  <all steps="2" symmetry="()"><rule in="B m" out="m L"/></all>

  <!-- 10. The barn: walls 36 high, two thick, its roof; an opening of 15 × 28 on one side. -->
  <all in="B A" out="A *" steps="35"/>
  <all in="B A" out="c *"/>
  <all in="cB AB" out="*c **"/>
  <all in="B c" out="Q *"/>
  <all in="B Q" out="Q *" steps="30"/>
  <all in="*/Q B/*" out="*/B */*" symmetry="(y)"/>
  <prl in="Q" out="c" steps="1"/>
  <prl in="cB" out="C*" symmetry="(x)" steps="1"/>
  <prl in="AAAAA/AAAAA/AAAAA/AAAAA/AAAAA" out="*****/*****/**I**/*****/*****" steps="1"/>
  <prl in="I *" out="B *" steps="1"/>
  <prl in="I" out="P" steps="1"/>
  <prl in="A" out="C" steps="1"/>
  <one in="${openIn}" out="${openOut}" steps="1"/>
  <all in="C v" out="v *" steps="27"/>
  <prl in="v" out="B" steps="1"/>

  <!-- 11. The fields: 22 around the fence (and up to the barn's yard), wheat on them; sheep where the ground is still free. -->
  <all in="[#6fG]E" out="*G" symmetry="(x)" steps="22"/>
  <all in="[#6fG]/E" out="*/G" symmetry="(y)" steps="22"/>
  <prl in="B G" out="g *" p="0.45" steps="1"/>
  <prl in="B g" out="g *" p="0.4" steps="1"/>
  <one in="${sheepIn}" out="${sheepOut}" steps="7"/>
  <all in="B e" out="e *" steps="4"/>
  <all in="B u" out="u *" steps="6"/>

  <!-- 12. Details and cleaning: the shade on the roofs, the chimney; the markers go. -->
  <prl in="RB" out="r*" p="0.6" steps="1"/>
  <prl in="W" out="w" p="0.02" steps="1"/>
  <one in="B B R" out="* K *" steps="1"/>
  <all in="KB" out="*K" steps="1"/>
  <all in="B K" out="K *" steps="7"/>
  <prl><rule in="E" out="B"/><rule in="y" out="B"/><rule in="m" out="B"/><rule in="#6" out="B"/><rule in="x" out="P"/><rule in="T" out="k"/></prl>
  <action name="open" label="Apri la porta"><all><rule in="O" out="h"/><rule in="o" out="j"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="h" out="O"/><rule in="j" out="o"/></all></action>
</sequence>
`;
}

function forte() {
  const s = stair('D', 'n');
  // A corner tower: the outer corner of the curtain wall (m) with 30 × 30 of free ground past it.
  const towerIn = square(31, 31, (_d, x, y) => (x === 30 && y === 30 ? 'm' : 'E'));
  const towerOut = square(31, 31, (_d, x, y) => (x === 30 && y === 30 ? 'q' : '*'));
  // Battlements: on the outer row of a top (air above it, air past it), a merlon of 4 and a gap of 4.
  const merlons = (wall, merlon, gap) => ({
    in: `${rep('B', 8)}/${rep('B', 8)} ${rep('B', 8)}/${rep(wall, 8)}`,
    out: `${rep('*', 8)}/${rep('*', 8)} ${rep('*', 8)}/${rep(merlon, 4)}${rep(gap, 4)}`,
  });
  const keep = merlons('R', '#9', '#8');
  const curtain = merlons('C', '#9', '#8');
  const hidden = 'HEXSIQTtaybmqvhj'.split('').concat(['#6', '#7', '#8', '#9']).map((c) => `<color symbol="${c}" hidden="True"/>`).join('');
  return `<!--
Fort that fits its size (T338, lab/banco/taglie/README.md): one program, three areas at the same scale (20 voxels a tile). At 5 × 5
tiles (100 voxels) one keep, a tower with a wide base: a stone talus on three sides, two storeys (rooms of 37, a door of 11 × 30, a
stair of 16 steps), arrow slits, a crenellated platform; where the ground goes on past its yard (7.5 × 7.5 tiles) a curtain wall with
battlements around it and the road as its gate; where 30 × 30 are free past a corner of the wall (10 × 10 tiles), a tower there with
its roof. No number of the box: what fits is found by the patterns of free ground. Written by lab/banco/taglie/genera.mjs.
-->
<sequence values="BHEXSIQRWNDnOohjUKTakPybmCcqdMv#6#7#8#9" symmetry="(xy)" soil="E" origin="bottom">
  <color symbol="W" value="a39d90" name="pietra"/><color symbol="D" value="7d766c" name="zoccolo"/><color symbol="N" value="6e685e" name="cornice"/>
  <color symbol="d" value="8a8274" name="scarpa"/><color symbol="n" value="8e6a44" name="assito"/><color symbol="R" value="97928a" name="terrazza"/>
  <color symbol="M" value="b2ac9f" name="merli"/><color symbol="O" value="6a4424" name="porta"/><color symbol="o" value="4e3218" name="borchie"/>
  <color symbol="U" value="2a2622" name="feritoie"/><color symbol="k" value="9a7048" name="scala"/><color symbol="P" value="a89c86" name="selciato"/>
  <color symbol="K" value="5a4a3a" name="asta"/><color symbol="C" value="c4bba8" name="mura"/><color symbol="c" value="47506a" name="ardesia"/>
  ${hidden}

  <!-- 1. The keep: a square of 47 from the centre, 4 more on one side by chance; the talus (b) 8 wide at the back and at the sides. -->
  <all in="HE" out="*H" symmetry="(x)" steps="23"/>
  <one in="HE" out="*H" symmetry="(x)" steps="4"/>
  <all in="H/E" out="*/H" symmetry="()" steps="23"/>
  <all in="E/H" out="H/*" symmetry="()" steps="23"/>
  <all in="[Hb]E" out="*b" symmetry="(x)" steps="8"/>
  <all in="E/[Hb]" out="b/*" symmetry="()" steps="8"/>

  <!-- 2. What fits around it: the yard (y) 24 every way; where 8 more are free past it, the curtain wall (m), its corners;
       a tower on a corner of the wall where 30 × 30 are free past it (q). -->
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
  <prl in="HHHHH/HHHHH/HHHHH/HHHHH/HHHHH" out="*****/*****/**I**/*****/*****" steps="1"/>
  <prl in="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX" out="*****/*****/**I**/*****/*****" steps="1"/>
  <prl in="SSSSS/SSSSS/SSSSS/SSSSS/SSSSS" out="*****/*****/**n**/*****/*****" steps="1"/>
  <prl in="I *" out="B *" steps="1"/>
  <prl in="I" out="n" steps="1"/>
  <prl in="S" out="N" steps="1"/>
  <prl in="X" out="W" steps="1"/>
  <prl in="H *" out="W *" steps="1"/>
  <prl in="H" out="D" steps="1"/>
  <all in="W D" out="D *" steps="3"/>
  <all in="R W" out="* N"/>

  <!-- 5. The stair: a strip of 16 × 11 along the back wall, a landing of 10 by the corner, its hole in the slab, a walker. -->
  <one in="${s.in}" out="${s.out}" symmetry="()" steps="1"/>
  <all in="B T" out="t *"/>
  <all in="B t" out="t *"/>
  <all in="n t" out="v *"/>
  <prl in="t" out="B" steps="1"/>
  <prl in="v" out="B" steps="1"/>
  <all in="BT" out="*a" symmetry="()"/>
  <all in="B a" out="a k" symmetry="()" steps="1"/>
  <all in="*B ** a*" out="*a ** k*" symmetry="()" steps="15"/>
  <prl in="a" out="k" steps="1"/>
  <all in="k B" out="* k"/>
  <prl in="T" out="k" steps="1"/>

  <!-- 6. The door: 11 wide in the plinth of the front, through the wall, 30 high; frame and studs. The road from it to the edge. -->
  <one steps="1" symmetry="()" in="DDDDDDDDDDDDD/BBBBBBBBBBBBB DDDDDDDDDDDDD/yyyyyyyyyyyyy" out="*OOOOOOOOOOO*/************* *************/*************"/>
  <all in="D/O" out="O/*" symmetry="()"/>
  <all in="[DWN] O" out="O *" steps="29"/>
  <all in="[DWN] O" out="N *" steps="1"/>
  <all in="O[DW]" out="*N" steps="1"/>
  <all in="OOOO" out="*o**" symmetry="()"/>
  <all in="[Oo]/B */y" out="*/* */P" symmetry="()"/>
  <all in="P/[yEm]" out="*/P" symmetry="()"/>

  <!-- 7. Arrow slits: a seed 6 under the string course or the platform, on the outer face, 9 high, through the wall. -->
  <one steps="10" in="N/B W/B W/B W/B W/B W/B" out="*/* */* */* */* */* U/*"/>
  <all in="U W" out="* U" steps="8"/>
  <all in="UW" out="*U" steps="1"/>

  <!-- 8. The platform: merlons of 4 and gaps of 4 on its edge, 6 high; a pole on it. -->
  <all in="${keep.in}" out="${keep.out}"/>
  <all in="B #9" out="#9 *" steps="6"/>
  <prl><rule in="#9" out="M"/><rule in="#8" out="R"/></prl>
  <one in="B B R" out="* K *" steps="1"/>
  <all in="B K" out="K *" steps="14"/>

  <!-- 9. The curtain wall: 4 thick inward, 24 high, merlons on both its faces; the road is its gate. -->
  <all in="my" out="*m" steps="3"/>
  <all in="B m" out="m *" steps="23"/>
  <prl in="m" out="C" steps="1"/>
  <all in="${curtain.in}" out="${curtain.out}"/>
  <all in="B #9" out="#9 *" steps="5"/>
  <prl><rule in="#9" out="C"/><rule in="#8" out="C"/></prl>

  <!-- 10. The towers: 15 a side on the corners of the wall, 44 high, a pyramid of slate on top. -->
  <all in="q[Emy]" out="*q" symmetry="(x)" steps="7"/>
  <all in="q/[Emy]" out="*/q" symmetry="(y)" steps="7"/>
  <all in="B q" out="q *" steps="43"/>
  <all in="B q" out="c *"/>
  <all in="cB qB" out="*c **"/>
  <all in="***/*B*/*** *c*/ccc/*c*" out="***/*c*/*** ***/***/***" steps="9" symmetry="()"/>
  <prl in="q" out="C" steps="1"/>

  <!-- 11. Cleaning: the markers go; the yard is the world's ground. -->
  <prl><rule in="E" out="B"/><rule in="y" out="B"/><rule in="T" out="k"/></prl>
  <action name="open" label="Apri la porta"><all><rule in="O" out="h"/><rule in="o" out="j"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="h" out="O"/><rule in="j" out="o"/></all></action>
</sequence>
`;
}

const dir = new URL('.', import.meta.url);
fs.writeFileSync(new URL('fattoria.xml', dir), fattoria());
fs.writeFileSync(new URL('forte.xml', dir), forte());
