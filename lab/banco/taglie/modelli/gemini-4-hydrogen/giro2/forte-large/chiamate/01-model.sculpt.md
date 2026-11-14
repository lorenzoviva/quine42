# model.sculpt · gemini-4-hydrogen · 15 s

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

<!--
  Forte:
  - Mastio centrale (h: pavimento, s: zona scala, w: mura del mastio, d: porta del mastio) intorno al centro H, con due piani e merlatura.
  - Cortile (c: cortile, n: lastricato d'ingresso, Q: pozzo dove c'e spazio) attorno al mastio.
  - Cinta muraria (W: mura di cinta, G: corpo di guardia al fronte, t: torri d'angolo dove c'e spazio) attorno al cortile.
  - Strada (r) dal corpo di guardia al bordo, e alberi (g) all'esterno dove c'e spazio.
  - I semi variano la profondita del mastio, la posizione della scala, la posizione del pozzo e degli alberi.
  - A taglia Large (5x5): mastio, cortile stretto, cinta, corpo di guardia e strada. A Huge (7.5x7.5) e Gargantuan (10x10): cortile piu ampio, torri d'angolo, pozzo e alberi esterni.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdsncWGrQtg" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio centrale attorno a H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala lungo una parete del mastio -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio, espanso dove c'e spazio -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo sugli spigoli esterni della cinta dove c'e spazio -->
      <all in="EE/EW" out="**/*t" steps="1"/>
      <all steps="2">
        <rule in="tE" out="*t"/>
        <rule in="t*/*E" out="**/*t"/>
      </all>

      <!-- Ingresso dal centro H al fronte fino al bordo -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allarga porta, lastricato, corpo di guardia e strada a 3 celle -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Ripristina il pavimento interno dove era passato il tracciato -->
      <prl>
        <rule in="H" out="h"/>
      </prl>

      <!-- Pozzo nel cortile dove c'e spazio 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi all'esterno dove c'e spazio 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***g***/*******/*******/*******"/>
    </sequence>
  </map>

  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="H" value="E04040" name="centro"/>
  <color symbol="h" value="B89868" name="pavimento del mastio" area="keep"/>
  <color symbol="s" value="D4B483" name="zona scala" area="keep"/>
  <color symbol="w" value="7A7268" name="mura del mastio" area="keep"/>
  <color symbol="d" value="5C3A21" name="porta del mastio" area="keep"/>
  <color symbol="c" value="A69A80" name="cortile" area="courtyard"/>
  <color symbol="n" value="8C8270" name="lastricato" area="courtyard"/>
  <color symbol="W" value="625C54" name="cinta muraria" area="wall"/>
  <color symbol="G" value="4F4840" name="corpo di guardia" area="gatehouse"/>
  <color symbol="t" value="565048" name="torre d'angolo" area="tower"/>
  <color symbol="r" value="9E8B6E" name="strada" area="road"/>
  <color symbol="Q" value="4A7A8C" name="pozzo" area="courtyard"/>
  <color symbol="g" value="4A7038" name="albero" area="garden"/>
</sequence>
