# model.sculpt · claude-opus-5-5 · 37 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
<!--
Il forte (forte):
 - il mastio: un corpo attorno al centro H, pavimento h, muri w; la lunghezza varia di 1 cella col seme
 - il cortile c: un anello attorno al mastio, 3 celle; si allarga di 4 o 3 dove il terreno prosegue (a Gargantuan)
 - la cinta W: due celle di spessore attorno al cortile, con una torre t su ogni angolo esterno
 - la via: dal centro dritta verso il fronte (y grande): porta d nel mastio, selciato n nel cortile, porta della cinta G
   (più alta del muro), strada r fino al bordo; tre celle di larghezza
 - il pozzo Q: in un quadrato libero 5x5 del cortile, lontano dalla porta (il seme sceglie l'angolo)
 - il fossato a: un anello fuori dalla cinta, solo dove il terreno prosegue oltre (Gargantuan)
Huge: mastio, cortile col pozzo, cinta con quattro torri, porta e strada.
Gargantuan: cortile più largo, il fossato attorno a tutto.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtmdnGrQa" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- il cortile -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="2"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*cccc*****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*ccc*******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la cinta, due celle -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri sugli angoli -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- la via -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <!-- il pozzo, lontano dalla porta -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"><field for="Q" from="n" on="cn"/></one>
      <!-- il fossato, dove il terreno prosegue -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="tE" out="*a" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="H" value="9a7b4f" name="centro del mastio" area="keep"/>
  <color symbol="h" value="b08d5a" name="sala del mastio" area="keep"/>
  <color symbol="w" value="8a8580" name="muro del mastio" area="keep"/>
  <color symbol="c" value="c9b98a" name="cortile" area="courtyard"/>
  <color symbol="W" value="9c968c" name="cinta" area="wall"/>
  <color symbol="t" value="77726b" name="torre" area="tower"/>
  <color symbol="m" value="ff00ff" name="segno della via"/>
  <color symbol="d" value="6b4a2b" name="porta del mastio" area="keep"/>
  <color symbol="n" value="a39e93" name="selciato" area="courtyard"/>
  <color symbol="G" value="5e5750" name="porta della cinta" area="gatehouse"/>
  <color symbol="r" value="b89e6e" name="strada" area="road"/>
  <color symbol="Q" value="4f7fa6" name="pozzo" area="well"/>
  <color symbol="a" value="5d8fb3" name="fossato" area="moat"/>
</sequence>
```
