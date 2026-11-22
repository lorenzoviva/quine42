// The parts one lives in, as sub-blocks of the seed (T346, ADR-0182, lab/banco/taglie/README.md), and the parts of the trades (T471,
// ADR-0241, lab/banco/parti/README.md): universe/models/part-*.xml, each a program that a model includes with <import file="part-…"/>
// and that alone builds its own scene from its origin, so that it is validated and measured on its own. Their long patterns are written
// here by repetition; the XML is what runs.
//
// The comment at the top of every part has two paragraphs: the first is its contract for the program that includes it (the letters it
// reads and writes, the unions to redefine), and the Sculptor's request carries it as it is (`partResources`, T354, ADR-0183); the second
// says what the part builds alone and who wrote it.
//
//   node lab/banco/taglie/parti.mjs            # rewrites universe/models/part-*.xml

import fs from 'node:fs';

const rep = (s, n) => s.repeat(n);
const rows = (row, n) => Array(n).fill(row).join('/');
const layers = (...ls) => ls.join(' ');

/** Alone, a part builds its scene from the origin letter S, which an include never has: these nodes do nothing included. */
const SCENE_NOTE = 'an include has no origin, so from S nothing happens there';
/** The comment at the top of a part: the contract (for the request), a blank line, what it builds alone and who wrote it. */
const note = (contract, alone, by = 'T346, T354; ADR-0182, ADR-0183') => `<!--\n${contract.trim()}\n\n${alone.trim()} Written by lab/banco/taglie/parti.mjs (${by}).\n-->`;

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
  return `${note(
    `The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen.
You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the
air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x
end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every
size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in
line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and
floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip
(yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs
(<union symbol="=" values="…"/> in your program wins over this one). The door is yours.`,
    'Alone it builds a house of two storeys from its origin and climbs it, so that it is validated and measured on its own.',
  )}
<sequence values="BSTk#90#91#92#93#94#95#96I#97" size="60 40 72" symmetry="()" origin="bottom" ground="#93">
  <union symbol="=" values="#96#95"/>
  <color symbol="k" value="9a7048" name="scala"/>
  <color symbol="S" value="7d766c" name="muro di prova"/><color symbol="#93" hidden="True" name="terreno di prova"/><color symbol="#96" value="8e6a44" name="pavimento di prova"/>
  <color symbol="#95" value="8e6a44" name="solaio di prova"/><color symbol="#94" value="7a4a26" name="porta di prova"/><color symbol="#97" hidden="True"/>
  <color symbol="T" hidden="True"/><color symbol="#90" hidden="True"/><color symbol="#91" hidden="True"/><color symbol="#92" hidden="True"/><color symbol="I" hidden="True"/>
${house({ floor: '#96', slab: '#95', ground: '#93', door: '#94' })}
  <one in="${stripIn}" out="${stripOut}" symmetry="()" steps="1"/>

  <!-- 1. The stair's own cells (T354): the first 16 of the strip from its small-x end; what the strip has beyond them goes back to the air. -->
  <all in="TT" out="*#90"/>
  <all in="T#90" out="*T" steps="15"/>
  <prl in="#90" out="B" steps="1"/>
  <!-- 2. The hole: #90 rises from the strip through the air up to the slab, which opens over the 16 cells, through all its layers. -->
  <all in="B T" out="#90 *"/>
  <all in="B #90" out="#90 *"/>
  <all in="= #90" out="#90 *"/>
  <prl in="#90" out="B" steps="1"/>
  <!-- 3. The first step: the small-x end of the strip (the T column with no T on its small-x side) rises one; then every step climbs two and goes one forward, 15 times. -->
  <all in="TT" out="*#92"/>
  <all in="B T" out="#91 k" steps="1"/>
  <all in="*B ** #91*" out="*#91 ** k*" steps="15"/>
  <prl in="#91" out="k" steps="1"/>
  <!-- 4. Solid under the steps, down to the floor; the strip is the foot of the stair. -->
  <prl in="#92" out="k" steps="1"/>
  <all in="k B" out="* k"/>
</sequence>
<action name="open" label="Apri la porta"><all><rule in="#94" out="#97"/></all></action>
<action name="close" label="Chiudi la porta"><all><rule in="#97" out="#94"/></all></action>
`;
}

function door() {
  return `${note(
    `The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of
the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it.
The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the
door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+"
values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).`,
    'Alone it builds a wall from its origin and opens a door in it, so that it is validated on its own.',
  )}
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
  return `${note(
    `Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of
every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and
gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side
the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.`,
    'Alone it builds a tower from its origin and crowns it, so that it is validated on its own.',
  )}
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
  return `${note(
    `Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of
5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your
program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U
your colour); #91, #92 and #94 its own markers.`,
    'Alone it builds a tower from its origin with its merlons, so that it is validated on its own.',
  )}
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

/**
 * The cellar's stair (T417): treads of 5 and risers of 3 (a step at 16 voxels a tile), so that a body's width (9 voxels) never stands over
 * two risers: over a cellar a body needs a floor within a step under every column it covers (`rampBlocks`, T52b). A landing of 5 at its
 * foot; 6 treads climb the 20 voxels of a cellar of one tile; 5 of floor past the top, under the floor above, where one steps off the stair;
 * a deeper cellar needs a longer room (13 treads for two).
 */
const CELLAR_LANDING = 5;
const CELLAR_TOP = 5;
const CELLAR_TREAD = 5;
const CELLAR_RISE = 3;
const CELLAR_STAIR = 6 * CELLAR_TREAD;
const CELLAR_WIDTH = 10;
/** The air a body needs over a tread (0.7 of a tile at 16, as `surfaces` measures it): a tread nearer than this to the floor above opens it. */
const CELLAR_HEADROOM = 10;

function cellar() {
  const L = CELLAR_LANDING + CELLAR_STAIR + CELLAR_TOP;
  const T = CELLAR_TREAD;
  // The strip: along the front wall of the cellar (V beside it toward large y, where the door is), just above the floor (D under it); the
  // landing and the floor past the top left as they are, the stair marked. Along the wall, the rest of the cellar stays one room.
  const stripIn = layers(`${rows(rep('#90', L), CELLAR_WIDTH)}/${rep('V', L)}`, rows(rep('D', L), CELLAR_WIDTH + 1));
  const stripOut = layers(`${rows(rep('*', CELLAR_LANDING) + rep('#91', CELLAR_STAIR) + rep('*', CELLAR_TOP), CELLAR_WIDTH)}/${rep('*', L)}`, rows(rep('*', L), CELLAR_WIDTH + 1));
  // The first tread: the first T cells of the strip, its top a riser up (the head on its last column); then every tread one riser up and T forward.
  const room = rep('#90', T);
  const firstIn = layers(...Array(CELLAR_RISE - 1).fill(room), '#91' + rep('#92', T - 1));
  const firstOut = layers(rep('k', T - 1) + '#93', ...Array(CELLAR_RISE - 2).fill(rep('*', T)), rep('k', T));
  const climbIn = layers(...Array(CELLAR_RISE).fill('*' + room), '#93' + rep('*', T));
  const climbOut = layers('*' + rep('k', T - 1) + '#93', ...Array(CELLAR_RISE - 1).fill(rep('*', T + 1)), 'k' + rep('*', T));
  return `${note(
    `The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen
and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first
layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/>
under a plan letter h on the soil, before it rises. D must hold ${L + 4} × ${CELLAR_WIDTH + 4} at least (${L + 4} along x) and room beside the stair, and stay
10 voxels back from your front wall: the floor opens over the upper treads (${4 * T} × ${CELLAR_WIDTH} for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its
walls, two thick along its edge; from a landing of ${CELLAR_LANDING}, its stair climbs along its front wall (the side of large y) toward large x by treads of ${T} and risers of ${CELLAR_RISE} until your floor, with ${CELLAR_TOP} of floor past its top (a
deeper cellar needs a longer room: a tread more for every ${CELLAR_RISE} voxels). Without room under the soil it does nothing. Its letters: D (yours, then
the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of
your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).`,
    'Alone it builds a house of two storeys on the soil from its origin and digs its cellar, so that it is validated on its own (its entry has a cellar of one tile).',
  )}
<sequence values="BSDVk#90#91#92#93#94#95#96I#97" size="60 40 92" symmetry="()" origin="bottom" soil="#93">
  <union symbol="=" values="#96#95"/>
  <color symbol="D" value="6f655a" name="pavimento della cantina"/><color symbol="V" value="8a8172" name="muro della cantina"/><color symbol="k" value="9a7048" name="scala"/>
  <color symbol="S" value="7d766c" name="muro di prova"/><color symbol="#93" hidden="True" name="terreno di prova"/><color symbol="#96" value="8e6a44" name="pavimento di prova"/>
  <color symbol="#95" value="8e6a44" name="solaio di prova"/><color symbol="#94" value="7a4a26" name="porta di prova"/><color symbol="#97" hidden="True"/>
  <color symbol="#90" hidden="True"/><color symbol="#91" hidden="True"/><color symbol="#92" hidden="True"/><color symbol="I" hidden="True"/>
${house({ floor: '#96', slab: '#95', ground: '#93', door: '#94' })}
  <all in="#96 B" out="* D"/>

  <!-- 1. The cellar: D goes down to the bottom of the box; what has D under it is the room (#90), the bottom stays D, the floor. -->
  <all in="D B" out="* D"/>
  <prl in="D D" out="#90 *" steps="1"/>
  <!-- 2. The walls: the room's cells beside the earth (the air outside D) become V, two thick. -->
  <prl in="#90B" out="VB" steps="1" symmetry="(xy)"/>
  <prl in="#90V" out="VV" steps="1" symmetry="(xy)"/>
  <!-- 3. The strip of the stair, ${L} × ${CELLAR_WIDTH} of the room along its front wall (large y), just above the floor: the first ${CELLAR_LANDING} toward small x stay free (the landing), then the stair, then ${CELLAR_TOP} free past its top. -->
  <one in="${stripIn}" out="${stripOut}" symmetry="()" steps="1"/>
  <!-- 4. The first tread: the first ${T} cells of the strip, ${CELLAR_RISE} high (the head on its last column); the rest of the strip waits. Every tread then
       goes ${CELLAR_RISE} up and ${T} forward through the room, until the floor above stops it (the last tread is one or two under it). -->
  <prl in="#91#91" out="*#92" steps="1"/>
  <all in="${firstIn}" out="${firstOut}" symmetry="()" steps="1"/>
  <all in="${climbIn}" out="${climbOut}" symmetry="()"/>
  <prl in="#93" out="k" steps="1"/>
  <!-- 5. Solid under the treads, down to the strip, which is their foot; the rest of the strip goes back to the room. -->
  <all in="k #90" out="* k"/>
  <prl in="k #92" out="* k" steps="1"/>
  <prl in="#92" out="#90" steps="1"/>
  <!-- 6. The opening: over every tread the room's air rises ${CELLAR_HEADROOM}; where it meets the floor above, the floor opens, through all its layers. -->
  <all in="#90 k" out="#93 *"/>
  <all in="#90 #93" out="#93 *" steps="${CELLAR_HEADROOM}"/>
  <all in="= #93" out="#93 *"/>
  <prl in="#93" out="B" steps="1"/>
  <prl in="#90" out="B" steps="1"/>
</sequence>
<action name="open" label="Apri la porta"><all><rule in="#94" out="#97"/></all></action>
<action name="close" label="Chiudi la porta"><all><rule in="#97" out="#94"/></all></action>
`;
}

// ------------------------------------------------------------------------------------------------------------------------------------
// The parts of the trades (T471, S5 of T458, ADR-0239, ADR-0241): written by hand in the seed like the five above, for the specialties of
// the Sculptor that sculpt in one box (the index says which, `specialty`): the wheel, the windows, the leaves and lids that open. Each
// marks what it reads with letters the includer writes and works only from them, so that it does the same at any density and in any
// box; alone it builds its own trial scene from S, which an include never has.

const TRADES = 'T471; ADR-0182, ADR-0239, ADR-0241';

/**
 * A pattern in an upright plane, from its cells `{u, v, s}`: u along the plane's level axis (y for a plane across an axle along x, x for
 * one across an axle along y), v up; every other cell "*". MarkovJunior's layers go from the top, rows along y, a row along x.
 */
function upright(axis, cells) {
  const us = cells.map((c) => c.u), vs = cells.map((c) => c.v);
  const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
  const at = new Map(cells.map((c) => [`${c.u},${c.v}`, c.s]));
  const layer = (v) => {
    const row = [];
    for (let u = u0; u <= u1; u++) row.push(at.get(`${u},${v}`) ?? '*');
    return axis === 'x' ? row.join('/') : row.join('');
  };
  const out = [];
  for (let v = v1; v >= v0; v--) out.push(layer(v));
  return out.join(' ');
}
/** A rule in an upright plane: the cells it reads, and those it writes (`*` elsewhere in the output). */
function uprightRule(axis, cells, writes) {
  const all = [...cells, ...writes.filter((w) => !cells.some((c) => c.u === w.u && c.v === w.v)).map((w) => ({ ...w, s: '*' }))];
  const out = all.map((c) => ({ u: c.u, v: c.v, s: writes.find((w) => w.u === c.u && w.v === c.v)?.s ?? '*' }));
  return `<rule in="${upright(axis, all)}" out="${upright(axis, out)}"/>`;
}
const ORTH = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** The markers of the wheel, the same in each of its two passes: the hub, the plumb line and its foot, the front and the new front, the tyre and the felloe where the growth stops, the disc. */
const [HUB, PLUMB, FOOT, FRONT, NEW, TYRE, FELLOE, DISC] = ['#90', '#91', '#92', '#93', '#94', '#95', '#96', '#97'];

/** The wheels on the axles along one axis: a pass of part-wheel. */
function wheelPass(axis, n) {
  const c = (u, v, s) => ({ u, v, s });
  const R = (cells, writes) => uprightRule(axis, cells, writes);
  const across = axis === 'x' ? 'y' : 'x';
  const hubs = axis === 'x' ? `<all in="B/H/B" out="*/${HUB}/*" steps="1"/>` : `<all in="BHB" out="*${HUB}*" steps="1"/>`;
  const grow = (dirs) => dirs.flatMap(([du, dv]) => [R([c(0, 0, FRONT), c(du, dv, `[B${PLUMB}]`)], [c(du, dv, NEW)]), R([c(0, 0, FRONT), c(du, dv, FOOT)], [c(du, dv, TYRE)])]);
  const first = ORTH.flatMap(([du, dv]) =>
    dv === -1
      ? [R([c(0, 0, HUB), c(0, -1, PLUMB)], [c(0, -1, NEW)]), R([c(0, 0, HUB), c(0, -1, FOOT)], [c(0, -1, TYRE)])]
      : [R([c(0, 0, HUB), c(du, dv, `[B${PLUMB}]`), c(0, -1, `[${PLUMB}${FOOT}]`)], [c(du, dv, NEW)])],
  );
  const stop = [...ORTH, ...DIAG].flatMap(([du, dv]) => [R([c(0, 0, `[${TYRE}${FELLOE}]`), c(du, dv, NEW)], [c(du, dv, TYRE)]), R([c(0, 0, `[${TYRE}${FELLOE}]`), c(du, dv, FRONT)], [c(du, dv, FELLOE)])]);
  const spokes = (dirs, mark) => [
    ...dirs.map(([du, dv]) => R([c(0, 0, HUB), c(du, dv, DISC)], [c(du, dv, mark)])),
    ...dirs.map(([du, dv]) => R([c(0, 0, `[${HUB}${mark}]`), c(du, dv, mark), c(2 * du, 2 * dv, DISC)], [c(2 * du, 2 * dv, mark)])),
  ];
  return `
  <!-- ${n}. The wheels on an axle along ${axis}, in the plane of ${across} and z: the hubs with air on both sides along ${across}. -->
  ${hubs}
  <!-- The plumb line, from under the hub down through the air to whatever is under it: its foot is where the wheel touches. -->
  <all in="${HUB} B" out="* ${FOOT}" steps="1"/>
  <all in="${FOOT} B" out="${PLUMB} ${FOOT}"/>
  <!-- The first ring, only round a hub with its plumb line; then a ring a turn, by eight neighbours and by four (an octagon), until a
       ring reaches the foot: that ring is the tyre, the one inside it the felloe, and that wheel grows no more. -->
  <all steps="1">${first.join('')}</all>
  <prl in="${NEW}" out="${FRONT}" steps="1"/>
  <markov>
    <prl>${stop.join('')}</prl>
    <sequence>
      <prl>${grow([...ORTH, ...DIAG]).join('')}</prl>
      <prl in="${FRONT}" out="${DISC}"/>
      <prl in="${NEW}" out="${FRONT}"/>
      <prl>${grow(ORTH).join('')}</prl>
      <prl in="${FRONT}" out="${DISC}"/>
    </sequence>
    <prl in="${NEW}" out="${FRONT}"/>
  </markov>
  <!-- Eight spokes from the hub to the felloe, each straight: a spoke grows only from the hub or from the spoke before it in its line. -->
  <all>${spokes(ORTH, PLUMB).join('')}</all>
  <all>${spokes(DIAG, FOOT).join('')}</all>
  <prl><rule in="${PLUMB}" out="J"/><rule in="${FOOT}" out="J"/><rule in="${FELLOE}" out="J"/><rule in="${TYRE}" out="I"/><rule in="${HUB}" out="I"/><rule in="${DISC}" out="B"/><rule in="${FRONT}" out="B"/><rule in="${NEW}" out="B"/></prl>`;
}

function wheel() {
  return `${note(
    `Wheels on an axle (part-wheel), included after the piece and its axles are built: mark each hub with H, on the axle or just past its
end, with air on both sides of it across the axle and under it (two H side by side along the axle: a wheel two thick). The wheel grows
round its hub in the plane across the axle, as large as the hub is high over what is under it (the ground, a floor, a deck), and touches
it: I the iron tyre and hub, J the felloe and eight spokes (give I and J your colours). Two wheels in one plane must not touch.`,
    'Alone it builds a cart from its origin, an axle along x with a wheel at each end, so that it is validated on its own.',
    TRADES,
  )}
<sequence values="BSHIJ${HUB}${PLUMB}${FOOT}${FRONT}${NEW}${TYRE}${FELLOE}${DISC}" size="21 17 14" symmetry="()" origin="bottom">
  <color symbol="H" value="3a3632" name="mozzo"/><color symbol="I" value="45423e" name="cerchione e mozzo di ferro"/><color symbol="J" value="9a6a3c" name="quarti e raggi"/>
  <color symbol="S" value="7a5232" name="carro di prova"/>
  <color symbol="${HUB}" hidden="True"/><color symbol="${PLUMB}" hidden="True"/><color symbol="${FOOT}" hidden="True"/><color symbol="${FRONT}" hidden="True"/>
  <color symbol="${NEW}" hidden="True"/><color symbol="${TYRE}" hidden="True"/><color symbol="${FELLOE}" hidden="True"/><color symbol="${DISC}" hidden="True"/>
  <!-- 0. Alone (${SCENE_NOTE}): S rises to the axle (6), the axle along x, a hub past each end, a bed of 15 × 11 over it. -->
  <all in="B S" out="S B" steps="6"/>
  <all in="SB" out="*S" symmetry="(x)" steps="7"/>
  <all in="SB" out="*H" symmetry="(x)" steps="1"/>
  <all in="B S" out="${NEW} *" steps="1"/>
  <all in="${NEW}/B" out="*/${NEW}" symmetry="(y)" steps="5"/>
  <all in="B ${NEW}" out="${FRONT} *" steps="1"/>
  <prl><rule in="${NEW}" out="S"/><rule in="${FRONT}" out="S"/></prl>
${wheelPass('x', 1)}
${wheelPass('y', 2)}
</sequence>
`;
}

/** The window's measures: the pier between two windows, the least wall left to an end, a window's width with its jambs, how deep the wall opens behind the glass. */
const WINDOW = { pier: 6, edge: 3, wide: 8, deep: 6 };
/**
 * The markers of the window: the line in front of the band, the eaten line, the middle, the jambs and the panes in the air, their columns in
 * the wall, the opening; the stretches with no windows are marked with the jambs' column before there is any.
 */
const [LINE, EATEN, MID, JAMB, PANE, JAMBS, PANES, OPENING] = ['#90', '#91', '#92', '#93', '#94', '#95', '#96', '#97'];
const BLOCKED = JAMBS;

function windows() {
  const { pier, edge, wide, deep } = WINDOW;
  const frame = (glass) => `${JAMB}${rep(PANE, glass)}${JAMB}`;
  return `${note(
    `Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your
walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it.
On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window ${wide} wide (${wide + 1} on an odd
stretch), then outward piers of ${pier} and windows of ${wide} while ${edge} of wall stay at the end (on a stretch that runs to the edge of the box, from
its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall
after (<prl in="U" out="W"/>). Give N and G your colours.`,
    'Alone it builds a house of 45 × 34 from its origin, its walls with the band, and opens its windows, so that it is validated on its own.',
    TRADES,
  )}
<sequence values="BSUNG${LINE}${EATEN}${MID}${JAMB}${PANE}${JAMBS}${PANES}${OPENING}" size="49 38 30" symmetry="(xy)" origin="bottom" ground="${MID}">
  <color symbol="G" value="3d5566" alpha="0.7" name="vetro"/><color symbol="N" value="6b4a2e" name="telaio"/><color symbol="U" value="b9b0a0" name="fascia di prova"/>
  <color symbol="S" value="a39d90" name="muro di prova"/>
  <color symbol="${LINE}" hidden="True"/><color symbol="${EATEN}" hidden="True"/><color symbol="${MID}" hidden="True"/><color symbol="${JAMB}" hidden="True"/>
  <color symbol="${PANE}" hidden="True"/><color symbol="${JAMBS}" hidden="True"/><color symbol="${PANES}" hidden="True"/><color symbol="${OPENING}" hidden="True"/>
  <!-- 0. Alone (${SCENE_NOTE}): a house of 45 × 34 from S, walls two thick, the band U from 8 to 21, wall up to 27. -->
  <all in="S${MID}" out="*S" symmetry="(x)" steps="22"/>
  <all in="S/${MID}" out="*/S" symmetry="(y)" steps="16"/>
  <all in="S/${MID}" out="*/S" symmetry="()" steps="1"/>
  <prl in="${MID}" out="B" steps="1"/>
  <prl in="${rows(rep('S', 5), 5)}" out="${rows('*****', 2)}/**${EATEN}**/${rows('*****', 2)}" steps="1"/>
  <all in="B S" out="${JAMB} *" steps="1"/>
  <all in="B ${JAMB}" out="${JAMB} S" steps="7"/>
  <all in="B ${JAMB}" out="${JAMB} U" steps="14"/>
  <all in="B ${JAMB}" out="${JAMB} S" steps="5"/>
  <prl><rule in="${JAMB}" out="S"/><rule in="${EATEN}" out="S"/></prl>

  <!-- 1. The line in the air in front of the band's lowest row, along every face: in front of every row, then only where none is under it. -->
  <all in="BU" out="${LINE}*"/>
  <prl in="${LINE} ${LINE}" out="B *"/>
  <!-- 2. Where the line turns, an inner corner (a room, the inside of an L), the stretches that meet there have no windows: the turn and
       all that follows it in its line. -->
  <prl in="${LINE}${LINE}/${LINE}*" out="${BLOCKED}*/**"/>
  <all in="${BLOCKED}${LINE}" out="*${BLOCKED}"/>
  <prl in="${BLOCKED}" out="B"/>
  <!-- 3. The middle of every straight stretch with air past both its ends (a corner, a door): eaten from both ends at once. -->
  <markov>
    <prl><rule in="[B${EATEN}]${LINE}[B${EATEN}]" out="*${MID}*"/><rule in="[B${EATEN}]${LINE}${LINE}[B${EATEN}]" out="*${MID}${MID}*"/></prl>
    <prl in="[B${EATEN}]${LINE}${LINE}" out="*${EATEN}*"/>
  </markov>
  <prl in="${EATEN}" out="${LINE}"/>
  <!-- 4. A window on the middle, ${wide} wide on an even stretch and ${wide + 1} on an odd one, with ${edge} of wall at least to its sides; then outward a pier
       of ${pier} and a window of ${wide}, as long as ${edge} stay to the end. -->
  <all>
    <rule in="${rep(LINE, edge + 3)}${MID}${MID}${rep(LINE, edge + 3)}" out="${rep('*', edge)}${frame(wide - 2)}${rep('*', edge)}"/>
    <rule in="${rep(LINE, edge + 4)}${MID}${rep(LINE, edge + 4)}" out="${rep('*', edge)}${frame(wide - 1)}${rep('*', edge)}"/>
  </all>
  <all in="${PANE}${JAMB}${rep(LINE, pier + wide + edge)}" out="**${rep('*', pier)}${frame(wide - 2)}${rep('*', edge)}"/>
  <!-- 5. A stretch with air past one end only (the other on the edge of the box, where no middle is found): from that end ${edge} of wall,
       a window, and on outward as above. -->
  <all in="B${rep(LINE, edge + wide + pier)}" out="*${rep('*', edge)}${frame(wide - 2)}${rep('*', pier)}"/>
  <all in="${PANE}${JAMB}${rep(LINE, pier + wide + edge)}" out="**${rep('*', pier)}${frame(wide - 2)}${rep('*', edge)}"/>
  <prl><rule in="${LINE}" out="B"/><rule in="${MID}" out="B"/></prl>
  <!-- 6. Into the wall and up the band: a jamb is frame from the sill to the lintel; a pane has the sill at the bottom, the lintel at the
       top (the last of its column) and glass between; the sill out by one in front. -->
  <prl><rule in="${JAMB}U" out="*${JAMBS}"/><rule in="${PANE}U" out="*${PANES}"/></prl>
  <all><rule in="U ${JAMBS}" out="${JAMBS} *"/><rule in="U [${PANES}${EATEN}]" out="${EATEN} *"/></all>
  <prl in="${EATEN} ${EATEN}" out="* ${LINE}"/>
  <prl><rule in="${JAMBS}" out="N"/><rule in="${PANES}" out="N"/><rule in="${EATEN}" out="N"/><rule in="${LINE}" out="G"/><rule in="${JAMB}" out="N"/><rule in="${PANE}" out="N"/></prl>
  <!-- 7. Behind the glass the wall opens, up to ${deep} deep. -->
  ${Array.from({ length: deep }, (_, d) => `<all in="G${rep(OPENING, d)}U" out="${rep('*', d + 1)}${OPENING}"/>`).join('\n  ')}
  <prl in="${OPENING}" out="B"/>
</sequence>
`;
}

/** The letters of part-leaf the includer writes and colours: the hinge, the leaf open (hidden), the leaf shut when open (hidden), the leaf open when shown. */
const [HINGE, SWUNG, SHUT, SHOWN] = ['#80', '#81', '#82', '#83'];
/** Its markers: for the upright leaves the claim, the marker, its trail; for the lids the same three. */
const [CLAIM, MARK, TRAIL, CLAIM2, MARK2, TRAIL2] = ['#90', '#91', '#92', '#93', '#94', '#95'];

function leaf() {
  return `${note(
    `Leaves and lids that open (part-leaf), included after the piece is built: write each leaf shut with L, one voxel thick on a face with
air in front of it, and its hinge with ${HINGE}, the air cell in front of the end it turns on, at every layer of the leaf (a lid: the air over
its back edge, all along it). It writes ${SWUNG}, hidden, where the leaf turns open on its hinge, out into the air as far as the leaf is wide
(leave that air free; two hinges at the two ends of one run of L share it). The actions are yours: <action name="open" label="Apri le
ante"><all><rule in="L" out="${SHUT}"/><rule in="${SWUNG}" out="${SHOWN}"/></all></action>, close back; ${SHUT} is hidden, give ${SHOWN} the colour of L.`,
    'Alone it builds a kneading chest from its origin, two leaves on its front and a lid on its top, so that it is validated and opened on its own.',
    TRADES,
  )}
<sequence values="BSL${HINGE}${SWUNG}${SHUT}${SHOWN}${CLAIM}${MARK}${TRAIL}${CLAIM2}${MARK2}${TRAIL2}" size="23 21 20" symmetry="(xy)" origin="bottom">
  <color symbol="L" value="7a5232" name="anta"/><color symbol="${HINGE}" hidden="True" name="cardine"/><color symbol="${SWUNG}" hidden="True" name="anta aperta, nascosta"/>
  <color symbol="${SHUT}" hidden="True" name="anta chiusa, nascosta"/><color symbol="${SHOWN}" value="7a5232" name="anta aperta"/>
  <color symbol="S" value="5e3c22" name="madia di prova"/>
  <color symbol="${CLAIM}" hidden="True"/><color symbol="${MARK}" hidden="True"/><color symbol="${TRAIL}" hidden="True"/>
  <color symbol="${CLAIM2}" hidden="True"/><color symbol="${MARK2}" hidden="True"/><color symbol="${TRAIL2}" hidden="True"/>
  <!-- 0. Alone (${SCENE_NOTE}): a kneading chest of 15 × 7 × 14 from S, two leaves on its front, a lid on its top, the hinges at their ends. -->
  <all in="SB" out="*S" symmetry="(x)" steps="7"/>
  <all in="S/B" out="*/S" symmetry="(y)" steps="3"/>
  <all in="B S" out="S *" steps="13"/>
  <box at="11 13 2" size="13 1 10" color="L" on="S"/>
  <box at="11 10 13" size="13 5 1" color="L" on="S"/>
  <all in="SL/BB" out="**/*${HINGE}" symmetry="(x)"/>
  <all in="B/B S/L" out="*/${HINGE} */*" symmetry="()"/>

  <!-- 1. Leaves on an upright hinge, layer by layer. The cell behind the hinge is claimed first and the hinge is its cell open; the claim
       goes along the leaf, leaves a mark in front of every cell it takes and starts a marker one step out on the diagonal toward the hinge,
       which goes on along it until it stands in the hinge's line, past the cells already open: the leaf open is as long as the leaf. The
       claim is decided on the grid as it was (prl): where two leaves meet on an odd cell both take it, the same at every layer. -->
  <markov>
    <prl in="[${SWUNG}${CLAIM}]/${SWUNG}/${MARK}" out="*/*/${SWUNG}"/>
    <prl in="[${TRAIL}${SWUNG}]${MARK}/B*" out="*${TRAIL}/${MARK}*"/>
    <prl in="${CLAIM}L/[${SWUNG}${TRAIL}]B/B*" out="*${CLAIM}/*${TRAIL}/${MARK}*"/>
    <all in="L/${HINGE}" out="${CLAIM}/${SWUNG}"/>
  </markov>
  <prl><rule in="${CLAIM}" out="L"/><rule in="${MARK}" out="B"/><rule in="${TRAIL}" out="B"/></prl>
  <!-- 2. Lids on a lying hinge, upward: the same in an upright plane. -->
  <markov>
    <prl in="${MARK2} ${SWUNG} [${SWUNG}${CLAIM2}]" out="${SWUNG} * *"/>
    <prl in="B/* [${TRAIL2}${SWUNG}]/${MARK2}" out="${MARK2}/* */${TRAIL2}"/>
    <prl in="B/* [${SWUNG}${TRAIL2}]/B ${CLAIM2}/L" out="${MARK2}/* */${TRAIL2} */${CLAIM2}"/>
    <all in="${HINGE} L" out="${SWUNG} ${CLAIM2}"/>
  </markov>
  <prl><rule in="${CLAIM2}" out="L"/><rule in="${MARK2}" out="B"/><rule in="${TRAIL2}" out="B"/></prl>
</sequence>
<action name="open" label="Apri"><all><rule in="L" out="${SHUT}"/><rule in="${SWUNG}" out="${SHOWN}"/></all></action>
<action name="close" label="Chiudi"><all><rule in="${SHUT}" out="L"/><rule in="${SHOWN}" out="${SWUNG}"/></all></action>
`;
}

export const PARTS = { 'part-stair': stair(), 'part-door': door(), 'part-battlements': battlements(), 'part-slits': slits(), 'part-cellar': cellar(), 'part-wheel': wheel(), 'part-window': windows(), 'part-leaf': leaf() };

const dir = new URL('../../../universe/models/', import.meta.url);
for (const [id, xml] of Object.entries(PARTS)) fs.writeFileSync(new URL(`${id}.xml`, dir), xml);
console.log(Object.keys(PARTS).join(' '));
