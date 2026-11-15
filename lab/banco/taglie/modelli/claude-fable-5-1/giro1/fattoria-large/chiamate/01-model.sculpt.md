# model.sculpt · claude-fable-5-1 · 121 s

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

```xml
<!-- FATTORIA: casa colonica a due piani (h interno, w muri, s zona scala contro il muro di fondo), tettoia a pali (a pavimento, p pali) addossata a un fianco scelto dal seme, pagliaio (y) dietro la casa a un passo dal muro, porta d al centro del fronte e strada r fino al bordo, aia c attorno con staccionata x e fattoria g (campi) oltre.
     Seme: profondità della casa (5 o 6 avanti), fianco e posizione della tettoia, posizione del pagliaio, pozzo Q nell'aia e alberi t nei campi dove c'è spazio.
     Large: casa + tettoia + pagliaio, aia e staccionata solo dove restano celle. Huge: aia più larga, staccionata completa, campi, pozzo, alberi. -->
<sequence values="BHEhwsapydrcxgtQm" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsapydrcxgtQm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- corpo della casa -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- porta e via d'uscita -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- zona scala contro il muro di fondo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- tettoia a pali su un fianco -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/><all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*p"/>
      <!-- pagliaio dietro la casa -->
      <one in="E/E/E/w" out="*/y/*/*" symmetry="()" steps="1"/>
      <all in="yE" out="*y" symmetry="(x)" steps="2"/>
      <all in="E/y" out="y/*" symmetry="()" steps="2"/>
      <!-- aia attorno a tutto, due celle, poi più larga dove la terra continua -->
      <all in="[wpyd]E" out="*c"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- staccionata e campi -->
      <all in="cE" out="*x"/><all in="xE/*x" out="*x/**"/>
      <all in="xE" out="*g"/><all in="gE" out="*g"/>
      <!-- strada dalla porta al bordo, tre celle -->
      <all in="[dr]/[cxg]" out="*/r" symmetry="()"/>
      <all in="r[cxg]" out="*r" symmetry="(x)" steps="1"/>
      <!-- pozzo nell'aia, alberi nei campi dove c'è posto -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****" steps="4"/>
    </sequence>
  </map>
  <color symbol="H" value="FF00FF" name="centro"/>
  <color symbol="m" value="FF88FF" name="linea"/>
  <color symbol="h" value="E8D8B0" name="pavimento di casa" area="house"/>
  <color symbol="w" value="B0A090" name="muro"/>
  <color symbol="s" value="C8A860" name="zona scala"/>
  <color symbol="a" value="D8C8A0" name="tettoia" area="porch"/>
  <color symbol="p" value="806040" name="palo"/>
  <color symbol="y" value="E0C040" name="pagliaio" area="barn"/>
  <color symbol="d" value="A05020" name="porta"/>
  <color symbol="r" value="C0B090" name="strada"/>
  <color symbol="c" value="A8B870" name="aia" area="yard"/>
  <color symbol="x" value="705030" name="staccionata"/>
  <color symbol="g" value="78A050" name="campo" area="field"/>
  <color symbol="t" value="407030" name="albero"/>
  <color symbol="Q" value="607080" name="pozzo"/>
</sequence>
```
