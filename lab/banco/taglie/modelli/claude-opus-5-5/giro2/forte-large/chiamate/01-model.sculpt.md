# model.sculpt · claude-opus-5-5 · 41 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
  FORTE. Parti e lettere del piano (una cella = 5 voxel):
  H centro (poi h); h sala del mastio (interno); w muro del mastio; s zona della scala nel mastio (lungo il muro di fondo);
  x torretta d'angolo del mastio (un angolo a caso, piu alta); c cortile; W cinta muraria; t torri d'angolo della cinta;
  d porta del mastio; n selciato dal mastio alla cinta; G torre-porta nella cinta; r strada fino al bordo;
  Q pozzo nel cortile, il piu lontano possibile dalla porta; a fossato fuori dalla cinta.
  Relazioni: il mastio sta al centro, la porta sul davanti (y grande) sull'asse; il cortile lo circonda; la cinta circonda il cortile;
  le torri stanno sugli angoli esterni della cinta; la torre-porta sull'asse della porta; il pozzo lontano dalla porta; il fossato fuori.
  I semi cambiano: la lunghezza del mastio (una cella in piu o no), quale angolo porta la torretta, dove sta la scala, dove sta il pozzo.
  Grande (20x20): mastio dentro una cinta sottile con torri e torre-porta.
  Enorme (30x30): il cortile cresce, la cinta raddoppia, entra il pozzo.
  Gigantesco (40x40): in piu il fossato attorno alla cinta.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsxcWtdnGrQamK" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio: una linea per H, 3 dietro, 4 davanti e una a caso, poi 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la zona della scala lungo il muro di fondo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- la torretta del mastio su un angolo a caso -->
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <!-- il cortile attorno al mastio, che cresce dove il terreno continua -->
      <all in="[wx]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cc*****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la cinta: un anello, raddoppiato dove il terreno continua -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="cWEEEE" out="**W***" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri sugli angoli esterni -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- la via: dal centro al davanti, porta, selciato, torre-porta, strada; tre celle di largo -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- il pozzo, lontano dalla porta, dove c'e cortile per lui -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"><field for="Q" from="r" on="cnr"/></one>
      <!-- il fossato, solo dove il terreno continua oltre la cinta -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
      <all in="a[Wt]" out="*a" steps="0"/>
    </sequence>
  </map>
  <color symbol="h" value="b89a6a" name="sala del mastio" area="keep"/>
  <color symbol="w" value="8c8478" name="muro del mastio"/>
  <color symbol="s" value="a0703c" name="scala"/>
  <color symbol="x" value="6e675e" name="torretta" area="tower"/>
  <color symbol="c" value="9cae6a" name="cortile" area="courtyard"/>
  <color symbol="W" value="a8a090" name="cinta muraria"/>
  <color symbol="t" value="77706a" name="torre" area="tower"/>
  <color symbol="d" value="5a3a22" name="porta del mastio"/>
  <color symbol="n" value="c8b890" name="selciato"/>
  <color symbol="G" value="9a3c2c" name="torre della porta"/>
  <color symbol="r" value="b8a070" name="strada"/>
  <color symbol="Q" value="4a7aa8" name="pozzo"/>
  <color symbol="a" value="3c6e9c" name="fossato"/>
  <color symbol="m" value="ff00ff" name="segno della via"/>
</sequence>
```
