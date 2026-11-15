# model.sculpt · claude-fable-5-1 · 139 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!-- FATTORIA: una casa colonica a due piani (h pavimento, w muri, s zona scala lungo il muro di fondo, d porta sul fronte),
     una tettoia aperta (l) addossata a un fianco della casa, scelto a caso, profonda 4 celle (20 voxel);
     il fienile (a interno, v muri, b bocca aperta verso l'aia) dietro la casa, spostato lungo il retro a caso;
     l'aia (c, nascosta, area yard) attorno a casa e fienile, chiusa da uno steccato (x) con cancello (G) sull'asse della porta;
     la strada (r, pietre n nell'aia) dritta fino al bordo davanti.
     I semi cambiano: la profondità della casa, il fianco della tettoia, la posizione del fienile e della sua bocca, quella della scala.
     Huge (30x30): casa, tettoia, fienile, aia stretta e steccato.
     Gargantuan (40x40): l'aia si allarga dove la terra continua e ospita il pozzo (Q) e il frutteto (t), e fuori dallo steccato i campi (g). -->
<sequence values="BHEhwsmdlavbcxGnrQtg" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsmdlavbcxGnrQtg" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. il corpo della casa attorno ad H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>
      <!-- la zona della scala lungo il muro di fondo, due celle di pianerottolo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- la tettoia su un fianco, a caso, lunga quanto il muro, profonda 4 -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/l*/**/**" symmetry="(x)" steps="1"/>
      <all in="Ew/lw" out="l*/**" symmetry="(x)(y)"/>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <!-- il fienile dietro la casa, due celle d'aia in mezzo, posizione a caso lungo il retro -->
      <one in="EEEEEEE/EEEEEEE/wwwwwww" out="***a***/*******/*******" symmetry="()" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <one in="aaa/vvv" out="***/bbb" symmetry="()" steps="1"/>
      <!-- l'aia: due anelli attorno a tutto, resa rettangolare -->
      <all in="[wvlc]E" out="*c" symmetry="(xy)" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- l'aia cresce di tre dove sette celle di terra continuano -->
      <all in="cEEEEEEE" out="*ccc****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- lo steccato -->
      <all in="cE" out="*x" symmetry="(xy)"/>
      <all in="cx/xE" out="**/*x" symmetry="(xy)"/>
      <!-- la via d'uscita: porta, lastre nell'aia, cancello, strada fino al bordo; larga tre -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/x" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="Gx" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- dove l'aia è larga: il pozzo e il frutteto -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**t**/*****/*****" steps="5"/>
      <!-- fuori dallo steccato, dove cinque celle di terra continuano: i campi -->
      <all in="xEEEEE" out="*gggg*" symmetry="(xy)" steps="1"/>
      <all in="gE/*g" out="*g/**" symmetry="(xy)"/>
    </sequence>
  </map>
  <color symbol="h" value="C8A878" name="pavimento di casa" area="house"/>
  <color symbol="w" value="D8D0B8" name="muro di casa"/>
  <color symbol="s" value="A08048" name="zona scala"/>
  <color symbol="d" value="6A4A28" name="porta"/>
  <color symbol="l" value="B89868" name="tettoia" area="porch"/>
  <color symbol="a" value="D0B050" name="fienile" area="barn"/>
  <color symbol="v" value="8A5A30" name="muro del fienile"/>
  <color symbol="b" value="5A3A1A" name="bocca del fienile"/>
  <color symbol="c" value="A8A070" hidden="True" area="yard" name="aia"/>
  <color symbol="x" value="7A5A38" name="steccato"/>
  <color symbol="G" value="9A7A48" name="cancello"/>
  <color symbol="n" value="9A9A90" name="lastre dell'aia"/>
  <color symbol="r" value="8A8070" name="strada"/>
  <color symbol="Q" value="707880" name="pozzo"/>
  <color symbol="t" value="4A8A3A" name="albero" area="orchard"/>
  <color symbol="g" value="7AA848" name="campo" area="field"/>
</sequence>
```
