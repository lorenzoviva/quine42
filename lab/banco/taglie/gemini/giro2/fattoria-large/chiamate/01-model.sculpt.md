# model.sculpt · gemini-3.8-flash · 15 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
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
  Fattoria:
  - Casa colonica principale (corpo a due piani con tetto a capanna) attorno al centro.
    Lettere: h (pavimento casa), w (muri casa), s (zona scala interna).
  - Portico / fienile / stalla annessa su un lato (tetto spiovente più basso, pali p, pavimento b).
  - Aia / cortile lastricato sul davanti con strada r verso il bordo sud. Lettere: n (lastricato aia), r (strada).
  - Recinto/staccionata e orto/campi ai lati: f (staccionata), g (orto/terra coltivata).
  - A misura grande (Huge, 30x30 celle): orto esteso con pozzo q, recinto per animali allargato, capanno attrezzi laterale.
  - Variazione tra semi: lato del portico (destra/sinistra), profondità della casa, ampiezza aia e orto.
-->
<sequence values="BHEhwsnbprfgq" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsnbprfgq" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Linea dorsale della casa attorno ad H (z=0) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <!-- Estensione laterale della casa (larghezza circa 7-8 celle interne) -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="hE" out="*h" p="0.4" steps="1" symmetry="(x)"/>

      <!-- Zona scala interna: lungo la parete nord, 4 celle lungo x (20 voxels), 2 lungo y (10 voxels) -->
      <!-- Lasciamo 2 celle a ovest come pianerottolo -->
      <one in="E/h/h/h" out="*/*/*/*" steps="1">
        <rule in="hhhhhh/hhhhhh" out="ssss**/ssss**"/>
      </one>

      <!-- Muri della casa attorno a h e s -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Portico / stalla annessa su uno dei lati scelti a caso -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/b*/**/**" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="2"/>
      <all in="E/b" out="b/*" symmetry="()" steps="1"/>
      <all in="b/E" out="*/b" symmetry="()" steps="1"/>
      <!-- Pali del portico sul perimetro esterno -->
      <all in="bE" out="*p"/>
      <all in="pE/*p" out="*p/**"/>

      <!-- Aia / cortile sul davanti (verso sud) -->
      <all in="[hw]/E" out="*/n" symmetry="()" steps="2"/>
      <all in="nE" out="*n" symmetry="(x)" steps="3"/>
      <all in="n/E" out="*/n" symmetry="()" steps="3"/>
      <all in="nE/*n" out="*n/**"/>

      <!-- Strada dall'aia verso il bordo frontale, larga 3 celle -->
      <one in="n/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Orto / campi a lato o dietro dove c'è spazio di terra -->
      <all in="[wn]EE" out="**g" steps="1"/>
      <all in="gE" out="*g" steps="3"/>
      <all in="E/g" out="g/*" symmetry="()" steps="2"/>
      <all in="g/E" out="*/g" symmetry="()" steps="2"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Staccionata attorno all'orto dove confina con la terra incolta E -->
      <all in="gE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Se c'è spazio abbondante (a Huge / 30x30), pozzo nell'aia o nell'orto -->
      <one in="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Sostituzione H con pavimento -->
      <prl in="H" out="h"/>
    </sequence>
  </map>
  <color symbol="E" value="#5b8c3b" name="prato" hidden="True"/>
  <color symbol="H" value="#d4b483" name="centro" hidden="True"/>
  <color symbol="h" value="#c29b68" name="pavimento_casa" area="house"/>
  <color symbol="w" value="#a39682" name="muro_casa" area="house"/>
  <color symbol="s" value="#9e7b4f" name="scala_casa" area="house"/>
  <color symbol="b" value="#8c6a43" name="pavimento_portico" area="porch"/>
  <color symbol="p" value="#593d25" name="palo_portico" area="porch"/>
  <color symbol="n" value="#b0a990" name="aia_lastricata" area="yard"/>
  <color symbol="r" value="#c7b389" name="strada" area="yard"/>
  <color symbol="f" value="#694a29" name="staccionata" area="yard"/>
  <color symbol="g" value="#4e6e2a" name="orto_coltivato" area="garden"/>
  <color symbol="q" value="#737982" name="pozzo" area="yard"/>
</sequence>
