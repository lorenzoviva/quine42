# model.sculpt · gemini-4-hydrogen · 10 s

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

<!--
Forte: un mastio centrale (k, s scala, w mura, d porta) circondato da un cortile (c) con pozzo (Q),
chiuso da una cinta muraria (W) con torri angolari (t) e corpo di guardia frontale (G),
collegato da un lastricato (n) e una strada (r) fino al bordo.
I semi variano la profondità del mastio, la posizione della scala, del pozzo e degli alberi (T).
A Huge (30x30) entra il mastio, il cortile, la cinta e le torri; a Gargantuan (40x40) il cortile si amplia ed entra il fossato (a).
-->
<sequence values="BHEkwsdcnWtrGQaT" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEkwsdcnWtrGQaT" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio attorno a H: 3 dietro, 4 davanti (+1 casuale), 4 ai lati -->
      <all in="E/[Hk]" out="k/*" symmetry="()" steps="3"/>
      <all in="[Hk]/E" out="*/k" symmetry="()" steps="4"/>
      <prl in="k/E" out="*/k" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hk]E" out="*k" symmetry="(x)" steps="4"/>
      <prl in="H" out="k"/>

      <!-- Mura del mastio -->
      <all in="kE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala nel mastio: 4x2 lungo un muro con 2 celle di sbarco -->
      <one in="wwwwwww/wkkkkkk/wkkkkkk" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio (almeno 3 celle) -->
      <all in="[wk]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Ampliamento cortile se c'e' spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Via d'uscita dritta verso il fronte (y crescente): porta d, lastricato n, corpo di guardia G, strada r -->
      <one in="k/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Pozzo nel cortile se entra in 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove c'e' abbastanza terreno -->
      <all in="cWEEEEE" out="**aaa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Alberi nel terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***T***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="6A8E4E" hidden="True" area="prato"/>
  <color symbol="H" value="FF00FF" name="origine"/>
  <color symbol="k" value="C2B280" name="pavimento mastio" area="mastio"/>
  <color symbol="s" value="A67B5B" name="zona scala" area="mastio"/>
  <color symbol="w" value="8B8989" name="mura mastio" area="mastio"/>
  <color symbol="d" value="6E472B" name="porta mastio" area="mastio"/>
  <color symbol="c" value="D8C89E" name="cortile" area="cortile"/>
  <color symbol="W" value="706E6E" name="cinta muraria" area="mura"/>
  <color symbol="t" value="5A5858" name="torre" area="torre"/>
  <color symbol="n" value="9E9B95" name="lastricato" area="cortile"/>
  <color symbol="G" value="5E3A22" name="corpo di guardia" area="ingresso"/>
  <color symbol="r" value="B5A478" name="strada" area="strada"/>
  <color symbol="Q" value="4682B4" name="pozzo" area="cortile"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="fossato"/>
  <color symbol="T" value="2E5A27" name="albero" area="bosco"/>
</sequence>
