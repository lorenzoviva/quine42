// The parts one lives in, as sub-blocks of the seed (T346, ADR-0182, lab/banco/taglie/README.md): universe/models/part-*.xml, each a
// program that a structure includes with <import file="part-…"/> and that alone builds its own scene from its origin, so that it is
// validated and measured on its own. Their long patterns are written here by repetition; the XML is what runs.
//
//   node lab/banco/taglie/parti.mjs            # rewrites universe/models/part-*.xml

import fs from 'node:fs';

const rep = (s, n) => s.repeat(n);
const rows = (row, n) => Array(n).fill(row).join('/');
const layers = (...ls) => ls.join(' ');

/** Alone, a part builds its scene from the origin letter S, which an include never has: these nodes do nothing included. */
const SCENE_NOTE = 'an include has no origin, so from S nothing happens there';

/** The house of the trial: a floor of 55 × 35 on the ground, walls two thick, two storeys of 32, the slab, a door of 11 × 30. */
function house({ floor, slab, ground, door }) {
  const dig = `<prl in="${rows(rep('S', 5), 5)}" out="${rows('*****', 2)}/**${floor}**/${rows('*****', 2)}" steps="1"/>`;
  const doorIn = layers(`${rep('S', 13)}/${rep('B', 13)}`, `${rep('S', 13)}/${rep(ground, 13)}`);
  const doorOut = layers(`${rep('*', 13)}/${rep('*', 13)}`, `*${rep(door, 11)}*/${rep('*', 13)}`);
  return `
  <!-- 0. Alone (${SCENE_NOTE}): a house of 55 × 35 from S, walls two thick, two storeys of 32 with the slab, a door of 11 × 30 at the front. -->
  <all in="S${ground}" out="*S" symmetry="(x)" steps="27"/>
  <all in="S/${ground}" out="*/S" symmetry="(y)" steps="17"/>
  ${dig}
  <all in="B S" out="S *" steps="63"/>
  <all in="B ${floor}" out="I *" steps="1"/>
  <all in="B I" out="I *" steps="30"/>
  <all in="B I" out="${slab} *" steps="1"/>
  <all in="B ${slab}" out="I *" steps="1"/>
  <all in="B I" out="I *" steps="29"/>
  <all in="B I" out="S *" steps="1"/>
  <prl in="I" out="B" steps="1"/>
  <one in="${doorIn}" out="${doorOut}" symmetry="()" steps="1"/>
  <all in="S/${door}" out="${door}/*" symmetry="()" steps="1"/>
  <all in="S ${door}" out="${door} *" steps="29"/>
  <prl in="${ground}" out="B" steps="1"/>`;
}

function stair() {
  // The strip: along the back wall (y = 0 of the window), 10 cells from the side wall, 16 × 11, in the air above the floor.
  const stripIn = layers(`${rep('S', 27)}/${rows('S' + rep('B', 26), 11)}`, `${rep('S', 27)}/${rows('S' + rep('#96', 26), 11)}`);
  const stripOut = layers(`${rep('*', 27)}/${rows(rep('*', 11) + rep('T', 16), 11)}`, `${rep('*', 27)}/${rows(rep('*', 27), 11)}`);
  return `<!--
The stair (T346, ADR-0182): a part one lives in, included with <import file="part-stair"/>, written by lab/banco/taglie/parti.mjs.
The program that includes it marks the strip of the stair with T, with a rule of its own written with symmetry="()": 11 wide (y) and 16
long (x) for a storey of 32 (the stair is twice as high as it is long), in the air just above a floor, with the floor going on past its
far end (large x). The stair climbs from the small-x end of the strip toward large x, two voxels up for one forward (a body climbs it at
every size), the slab above the strip is opened and under the steps it is solid: it comes out in line onto the floor above.
Its letters: T the strip (yours), k the steps (give k the colour you want), #90 and #91 its own markers; the union "=" is the letters of
your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
Alone it builds a house of two storeys from its origin and climbs it, so that it is validated and measured on its own.
-->
<sequence values="BSTk#90#91#93#94#95#96I#97" size="60 40 72" symmetry="()" origin="bottom" ground="#93">
  <union symbol="=" values="#96#95"/>
  <color symbol="k" value="9a7048" name="scala"/>
  <color symbol="S" value="7d766c" name="muro di prova"/><color symbol="#93" hidden="True" name="terreno di prova"/><color symbol="#96" value="8e6a44" name="pavimento di prova"/>
  <color symbol="#95" value="8e6a44" name="solaio di prova"/><color symbol="#94" value="7a4a26" name="porta di prova"/><color symbol="#97" hidden="True"/>
  <color symbol="T" hidden="True"/><color symbol="#90" hidden="True"/><color symbol="#91" hidden="True"/><color symbol="I" hidden="True"/>
${house({ floor: '#96', slab: '#95', ground: '#93', door: '#94' })}
  <one in="${stripIn}" out="${stripOut}" symmetry="()" steps="1"/>

  <!-- 1. The hole: #90 rises from the strip through the air up to the slab, which opens over the whole strip. -->
  <all in="B T" out="#90 *"/>
  <all in="B #90" out="#90 *"/>
  <all in="= #90" out="B *" steps="1"/>
  <prl in="#90" out="B" steps="1"/>
  <!-- 2. The first step: the small-x end of the strip rises one; then every step climbs two and goes one forward, 15 times. -->
  <all in="BT" out="*#91"/>
  <all in="B #91" out="#91 k" steps="1"/>
  <all in="*B ** #91*" out="*#91 ** k*" steps="15"/>
  <prl in="#91" out="k" steps="1"/>
  <!-- 3. Solid under the steps, down to the floor; the strip is the foot of the stair. -->
  <all in="k B" out="* k"/>
  <prl in="T" out="k" steps="1"/>
</sequence>
<action name="open" label="Apri la porta"><all><rule in="#94" out="#97"/></all></action>
<action name="close" label="Chiudi la porta"><all><rule in="#97" out="#94"/></all></action>
`;
}

function door() {
  return `<!--
The door (T346, ADR-0182): a part one lives in, included with <import file="part-door"/>, written by lab/banco/taglie/parti.mjs.
The program that includes it writes the seed of the door with O: 11 wide, at the foot of a wall and through its whole thickness, on the
layer of the floor. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks
(o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls
(<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours
(<action name="open"> on O and o). Alone it builds a wall from its origin and opens a door in it, so that it is validated on its own.
-->
<sequence values="BSOoN#93" size="45 8 44" symmetry="(xy)" origin="bottom" ground="#93">
  <union symbol="+" values="S"/>
  <color symbol="O" value="7a4a26" name="porta"/><color symbol="o" value="5e3a1e" name="asse scura"/><color symbol="N" value="6b4a2e" name="telaio"/>
  <color symbol="S" value="a39d90" name="muro di prova"/><color symbol="#93" hidden="True" name="terreno di prova"/>
  <!-- 0. Alone (${SCENE_NOTE}): a wall of 41 × 2 × 40 from S, the seed of the door in the middle of it. -->
  <all in="S#93" out="*S" symmetry="(x)" steps="20"/>
  <all in="S/#93" out="*/S" symmetry="()" steps="1"/>
  <all in="B S" out="S *" steps="39"/>
  <one in="${rep('#93', 13)}/${rep('S', 13)}/${rep('S', 13)}" out="${rep('*', 13)}/*${rep('O', 11)}*/*${rep('O', 11)}*" symmetry="()" steps="1"/>
  <prl in="#93" out="B" steps="1"/>

  <!-- 1. The door rises 30 through the wall; the lintel above it, the jambs at its sides; the planks. -->
  <all in="+ O" out="O *" steps="29"/>
  <all in="+ O" out="N *" steps="1"/>
  <all in="O+" out="*N" steps="1"/>
  <all in="OOO" out="*o*"/>
</sequence>
`;
}

function battlements() {
  return `<!--
Battlements (T346, ADR-0182): a part included with <import file="part-battlements"/>, written by lab/banco/taglie/parti.mjs.
On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts
merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the
middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
Alone it builds a tower from its origin and crowns it, so that it is validated on its own.
-->
<sequence values="BSM#90#91#93" size="33 33 40" symmetry="(xy)" origin="bottom" ground="#93">
  <union symbol="+" values="S"/>
  <color symbol="M" value="b2ac9f" name="merli"/><color symbol="S" value="a39d90" name="muro di prova"/><color symbol="#93" hidden="True" name="terreno di prova"/>
  <color symbol="#90" hidden="True"/><color symbol="#91" hidden="True"/>
  <!-- 0. Alone (${SCENE_NOTE}): a tower of 29 × 29 × 30 from S, its top a platform. -->
  <all in="S#93" out="*S" symmetry="(x)" steps="14"/>
  <all in="S/#93" out="*/S" symmetry="(y)" steps="14"/>
  <all in="B S" out="S *" steps="29"/>
  <prl in="#93" out="B" steps="1"/>

  <!-- 1. The crest: the air over the edge of every top (a top cell with air above and beside) is marked. -->
  <all in="BB B+" out="*#90 **"/>
  <!-- 2. A corner is a merlon; from it, along the crest, merlons of 5 and gaps of 3; the odd cells where two runs meet go to the merlons, the rest are gaps. -->
  <all in="#90#90/#90B" out="M*/**"/>
  <all in="M#90#90#90#90#90#90#90#90" out="*MMMM#91#91#91M"/>
  <all in="M#90" out="*M" steps="2"/>
  <prl in="#90" out="#91" steps="1"/>
  <!-- 3. The merlons rise 6 in all; the gaps go. -->
  <all in="B M" out="M *" steps="5"/>
  <prl in="#91" out="B" steps="1"/>
</sequence>
`;
}

function slits() {
  // Under the middle of every merlon of 5: the two cells of wall below it, then the slit, 6 high.
  const col = (c) => `***${c}***`;
  const slitIn = layers('BMMMMMB', col('%'), col('%'), ...Array(6).fill(col('%')));
  const slitOut = layers('*******', '*******', '*******', ...Array(6).fill(col('U')));
  return `<!--
Arrow slits (T346, ADR-0182): a part included with <import file="part-slits"/> after part-battlements, written by
lab/banco/taglie/parti.mjs. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of
the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the
top; regular because the merlons are. Its letter: U the slit (give U your colour). Alone it builds a tower from its origin with its
merlons, so that it is validated on its own.
-->
<sequence values="BSMU#93#91#92#94" size="33 33 40" symmetry="(xy)" origin="bottom" ground="#93">
  <union symbol="%" values="S"/>
  <color symbol="U" value="2a2622" name="feritoie"/><color symbol="M" value="b2ac9f" name="merli di prova"/><color symbol="S" value="a39d90" name="muro di prova"/><color symbol="#93" hidden="True" name="terreno di prova"/>
  <color symbol="#91" hidden="True"/><color symbol="#92" hidden="True"/><color symbol="#94" hidden="True"/>
  <!-- 0. Alone (${SCENE_NOTE}): a tower of 29 × 29 × 30 from S, with merlons of 5 and gaps of 3 along its top (from the corners). -->
  <all in="S#93" out="*S" symmetry="(x)" steps="14"/>
  <all in="S/#93" out="*/S" symmetry="(y)" steps="14"/>
  <all in="B S" out="S *" steps="29"/>
  <prl in="#93" out="B" steps="1"/>
  <all in="BB BS" out="*#92 **"/>
  <all in="#92#92/#92B" out="#94*/**"/>
  <all in="#94#92#92#92#92#92#92#92#92" out="*#94#94#94#94#91#91#91#94"/>
  <all in="#94#92" out="*#94" steps="2"/>
  <prl in="#92" out="#91" steps="1"/>
  <all in="B #94" out="#94 *" steps="5"/>
  <prl><rule in="#91" out="B"/><rule in="#94" out="M"/></prl>

  <!-- 1. Under the middle of every merlon of 5, two cells down, a slit of 6, through the wall. -->
  <all in="${slitIn}" out="${slitOut}"/>
  <all in="[BU]U%" out="**U"/>
</sequence>
`;
}

export const PARTS = { 'part-stair': stair(), 'part-door': door(), 'part-battlements': battlements(), 'part-slits': slits() };

const dir = new URL('../../../universe/models/', import.meta.url);
for (const [id, xml] of Object.entries(PARTS)) fs.writeFileSync(new URL(`${id}.xml`, dir), xml);
console.log(Object.keys(PARTS).join(' '));
